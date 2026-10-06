"""Garden weather outlook: the coming days, frost dates and past extremes, alerts and their notifications.

Forecast: the chosen HA weather entity (no extra calls), else Open-Meteo.
History (frost dates, extremes): the user's temperature and rain sensors first (recorder daily
long-term statistics), Open-Meteo for the years or values they lack. Kept in ``.storage/homestead.climate``.
"""

from __future__ import annotations

import logging
from collections.abc import Callable
from datetime import date, datetime, timedelta
from typing import Any

import aiohttp
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.aiohttp_client import async_get_clientsession
from homeassistant.helpers.dispatcher import async_dispatcher_connect, async_dispatcher_send
from homeassistant.helpers.storage import Store
from homeassistant.helpers.translation import async_get_translations
from homeassistant.util import dt as dt_util

from .const import (
    CONF_ALERT_NOTIFY,
    CONF_HEAT_DAYS,
    CONF_HEAT_EXTREME,
    CONF_HEAT_MAX,
    CONF_HEAT_NIGHT,
    CONF_NOTIFY,
    CONF_OPEN_METEO,
    CONF_RAIN,
    CONF_TEMPERATURE,
    CONF_WEATHER_ENTITY,
    DEFAULT_ALERT_NOTIFY,
    DOMAIN,
    SIGNAL_DATA_UPDATED,
    SIGNAL_OUTLOOK_UPDATED,
)
from .crops import crop_traits, full_table, load_cropgraph, load_defaults
from .notify import async_send
from .outlook import (
    YOUNG_DAYS,
    PlantRisk,
    Thresholds,
    advice,
    alerts,
    daily_from_statistics,
    extremes,
    frost_dates,
    merge_days,
    parse_ha_forecast,
    parse_open_meteo_daily,
)
from .store import HomesteadStore

_LOGGER = logging.getLogger(__name__)

OUTLOOK = f"{DOMAIN}_outlook"
CROP_DEFAULTS = f"{DOMAIN}_crop_defaults"
CLIMATE_STORAGE_KEY = f"{DOMAIN}.climate"
FORECAST_REFRESH = timedelta(hours=3)
HISTORY_YEARS = 10
HISTORY_MAX_AGE = timedelta(days=30)
FORECAST_API = "https://api.open-meteo.com/v1/forecast"
ARCHIVE_API = "https://archive-api.open-meteo.com/v1/archive"
FORECAST_DAILY = (
    "temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,"
    "wind_speed_10m_max,wind_gusts_10m_max,weather_code"
)
ARCHIVE_DAILY = "temperature_2m_max,temperature_2m_min,precipitation_sum,weather_code"


async def async_crop_defaults(hass: HomeAssistant) -> dict[str, dict[str, Any]]:
    """Built-in table completed by CropGraph, its months set on the garden's frost dates."""
    cache = hass.data.setdefault(CROP_DEFAULTS, {})
    if "sources" not in cache:
        cache["sources"] = await hass.async_add_executor_job(lambda: (load_defaults(), load_cropgraph()))
    outlook = get_outlook(hass)
    frost = (outlook.climate.get("frost") if outlook else None) or None
    key = repr(frost)
    if cache.get("key") != key:
        cache["table"] = full_table(*cache["sources"], frost)
        cache["key"] = key
    return cache["table"]


def get_outlook(hass: HomeAssistant) -> Outlook | None:
    return hass.data.get(OUTLOOK)


def thresholds_from(options: dict[str, Any]) -> Thresholds:
    base = Thresholds()
    return Thresholds(
        heat_max=float(options.get(CONF_HEAT_MAX, base.heat_max)),
        heat_night=float(options.get(CONF_HEAT_NIGHT, base.heat_night)),
        heat_days=int(options.get(CONF_HEAT_DAYS, base.heat_days)),
        heat_extreme=float(options.get(CONF_HEAT_EXTREME, base.heat_extreme)),
    )


async def _open_meteo(hass: HomeAssistant, url: str, params: dict[str, Any]) -> list[dict[str, Any]]:
    session = async_get_clientsession(hass)
    query = {
        "latitude": hass.config.latitude,
        "longitude": hass.config.longitude,
        "timezone": "auto",
        **params,
    }
    async with session.get(url, params=query, timeout=aiohttp.ClientTimeout(total=30)) as response:
        response.raise_for_status()
        return parse_open_meteo_daily(await response.json())


async def _forecast_from_entity(hass: HomeAssistant, entity_id: str) -> list[dict[str, Any]]:
    response = await hass.services.async_call(
        "weather",
        "get_forecasts",
        {"entity_id": entity_id, "type": "daily"},
        blocking=True,
        return_response=True,
    )
    items = []
    for item in (response or {}).get(entity_id, {}).get("forecast") or []:
        when = dt_util.parse_datetime(str(item.get("datetime") or ""))
        if when is not None:  # daily forecasts often start at local midnight, written in UTC
            items.append({**item, "datetime": dt_util.as_local(when).date().isoformat()})
    state = hass.states.get(entity_id)
    return parse_ha_forecast(items, dict(state.attributes) if state else {})


async def async_fetch_forecast(hass: HomeAssistant, options: dict[str, Any]) -> tuple[list[dict], str | None]:
    """(days, source): the weather entity first, Open-Meteo if allowed; ``[]`` when nothing answers."""
    if entity_id := options.get(CONF_WEATHER_ENTITY):
        try:
            if days := await _forecast_from_entity(hass, entity_id):
                return days, entity_id
        except Exception as err:  # noqa: BLE001 - a broken weather entity must not break the panel
            _LOGGER.debug("Forecast from %s failed: %s", entity_id, err)
    if options.get(CONF_OPEN_METEO, True):
        try:
            return await _open_meteo(
                hass, FORECAST_API, {"daily": FORECAST_DAILY, "forecast_days": 16}
            ), "open-meteo"
        except Exception as err:  # noqa: BLE001
            _LOGGER.debug("Open-Meteo forecast failed: %s", err)
    return [], None


async def _sensor_days(
    hass: HomeAssistant, options: dict[str, Any], start: date, end: date
) -> dict[str, dict]:
    temp, rain = options.get(CONF_TEMPERATURE), options.get(CONF_RAIN)
    ids = {i for i in (temp, rain) if i}
    if "recorder" not in hass.config.components or not ids:
        return {}
    from homeassistant.components.recorder import get_instance  # noqa: PLC0415
    from homeassistant.components.recorder.statistics import statistics_during_period  # noqa: PLC0415

    tz = dt_util.get_default_time_zone()
    rows = await get_instance(hass).async_add_executor_job(
        statistics_during_period,
        hass,
        dt_util.as_utc(datetime.combine(start, datetime.min.time(), tz)),
        dt_util.as_utc(datetime.combine(end + timedelta(days=1), datetime.min.time(), tz)),
        ids,
        "day",
        None,
        {"min", "max", "change"},
    )

    def dated(series: list[dict]) -> list[dict]:
        out = []
        for row in series:
            begin = row.get("start")
            when = dt_util.utc_from_timestamp(begin) if isinstance(begin, int | float) else begin
            if isinstance(when, datetime):
                out.append({**row, "date": dt_util.as_local(when).date().isoformat()})
        return out

    return daily_from_statistics(
        dated(rows.get(temp, [])) if temp else [], dated(rows.get(rain, [])) if rain else []
    )


async def async_history(
    hass: HomeAssistant, options: dict[str, Any], thresholds: Thresholds
) -> dict[str, Any]:
    """Frost dates and past extremes from the last years: own sensors, Open-Meteo for the rest."""
    today = dt_util.now().date()
    start, end = today.replace(year=today.year - HISTORY_YEARS, month=1, day=1), today - timedelta(days=6)
    sources = []
    sensors: dict[str, dict] = {}
    try:
        sensors = await _sensor_days(hass, options, start, end)
    except Exception as err:  # noqa: BLE001
        _LOGGER.debug("Recorder statistics for the climate failed: %s", err)
    if sensors:
        sources.append("sensors")
    remote: list[dict] = []
    if options.get(CONF_OPEN_METEO, True):
        try:
            params = {"daily": ARCHIVE_DAILY, "start_date": start.isoformat(), "end_date": end.isoformat()}
            remote = await _open_meteo(hass, ARCHIVE_API, params)
        except Exception as err:  # noqa: BLE001
            _LOGGER.debug("Open-Meteo archive failed: %s", err)
    if remote:
        sources.append("open-meteo")
    days = merge_days(sensors, remote)
    return {
        "computed_on": today.isoformat(),
        "frost": frost_dates(days),
        "extremes": extremes(days, thresholds),
        "sources": sources,
        "first_day": days[0]["date"] if days else None,
    }


class Outlook:
    """Forecast, alerts and climate of one config entry; refreshed every few hours."""

    def __init__(self, hass: HomeAssistant, store: HomesteadStore, options: dict[str, Any]) -> None:
        self.hass = hass
        self.store = store
        self.options = options
        self.thresholds = thresholds_from(options)
        self.forecast: list[dict[str, Any]] = []
        self.source: str | None = None
        self.alerts: list[dict[str, Any]] = []
        self.advice: dict[str, dict[str, Any]] = {}
        self.climate: dict[str, Any] = {}
        self.updated: str | None = None
        self._notified: list[str] = []
        self._storage: Store = Store(hass, 1, CLIMATE_STORAGE_KEY)

    async def async_load(self) -> None:
        saved = await self._storage.async_load() or {}
        self.climate = saved.get("climate") or {}
        self._notified = list(saved.get("notified") or [])

    async def async_remove(self) -> None:
        await self._storage.async_remove()

    def _stale(self) -> bool:
        computed = self.climate.get("computed_on")
        return not computed or date.fromisoformat(computed) + HISTORY_MAX_AGE <= dt_util.now().date()

    async def async_plant_risks(self) -> list[PlantRisk]:
        table = await async_crop_defaults(self.hass)
        today = dt_util.now().date()
        risks = []
        for planting in self.store.data.active_plantings():
            traits = crop_traits(planting.species, table, list(self.store.data.crops.values())) or {}
            started = max(filter(None, [planting.sown_on, planting.planted_on]), default=None)
            young = bool(started) and date.fromisoformat(started) + timedelta(days=YOUNG_DAYS) > today
            risks.append(
                PlantRisk(
                    planting.id,
                    traits.get("hardiness_c"),
                    traits.get("heat_max_c"),
                    young,
                    bool(traits.get("warm")),
                )
            )
        return risks

    async def _async_evaluate(self) -> None:
        """Alerts and per-activity advice from the forecast already fetched."""
        risks = await self.async_plant_risks()
        self.alerts = alerts(self.forecast, risks, self.thresholds)
        tender = {r.id for r in risks if r.warm or (r.hardiness_c is not None and r.hardiness_c > 0)}
        self.advice = {}
        for task in self.store.data.tasks.values():
            if task.done_on:
                continue
            verdict = advice(task.kind, self.forecast, task.due_on, task.planting_id in tender)
            if verdict is not None:
                self.advice[task.id] = verdict

    def async_listen(self) -> Callable[[], None]:
        """Re-evaluate when plantings or tasks change; returns the unsubscribe."""

        # A CSV import saves once per row: one evaluation at a time, plus one more if data changed meanwhile.
        state = {"running": False, "dirty": False}

        async def changed() -> None:
            try:
                while state["dirty"]:
                    state["dirty"] = False
                    await self._async_evaluate()
            finally:
                state["running"] = False
            async_dispatcher_send(self.hass, SIGNAL_OUTLOOK_UPDATED)

        @callback
        def on_data() -> None:
            state["dirty"] = True
            if not state["running"]:
                state["running"] = True
                self.hass.async_create_task(changed(), f"{DOMAIN} outlook re-evaluation")

        return async_dispatcher_connect(self.hass, SIGNAL_DATA_UPDATED, on_data)

    async def async_refresh(self, history: bool = False) -> None:
        self.forecast, self.source = await async_fetch_forecast(self.hass, self.options)
        today = dt_util.now().date().isoformat()
        self.forecast = [d for d in self.forecast if d["date"] >= today]
        await self._async_evaluate()
        if history or self._stale():
            self.climate = await async_history(self.hass, self.options, self.thresholds)
        self.updated = dt_util.now().isoformat()
        await self._async_notify()
        await self._storage.async_save({"climate": self.climate, "notified": self._notified})
        async_dispatcher_send(self.hass, SIGNAL_OUTLOOK_UPDATED)

    def _relevant(self, alert: dict[str, Any]) -> bool:
        """Notify only if a planned activity falls in the alert days (on a plant it hits, or untargeted)."""
        hit = set(alert["plantings"])
        data = self.store.data
        for task in data.tasks.values():
            if task.done_on or not alert["start"] <= task.due_on <= alert["end"]:
                continue
            if not hit:
                # Frost or cold that hurts none of the plants: not worth a notification.
                if alert["kind"] in ("heatwave", "heat_extreme"):
                    return True
                continue
            if not task.planting_id and not task.zone_id:
                return True
            if task.planting_id in hit:
                return True
            if task.zone_id:
                zones = {task.zone_id, *data.zone_descendants(task.zone_id)}
                if any(data.plantings[p].zone_id in zones for p in hit if p in data.plantings):
                    return True
        return False

    async def _async_notify(self) -> None:
        mode = self.options.get(CONF_ALERT_NOTIFY, DEFAULT_ALERT_NOTIFY)
        services = [s.removeprefix("notify.") for s in self.options.get(CONF_NOTIFY) or []]
        cutoff = (dt_util.now().date() - timedelta(days=30)).isoformat()
        self._notified = [k for k in self._notified if k.split(":", 1)[-1] >= cutoff]
        if mode == "off" or not services:
            return
        new = [
            a
            for a in self.alerts
            if a["key"] not in self._notified and (mode == "always" or self._relevant(a))
        ]
        if not new:
            return
        texts = await _texts(self.hass)
        for alert in new:
            message = {
                "title": texts.get("notification_title", "Garden"),
                "message": alert_text(alert, texts, self.store),
                "data": {"url": f"/{DOMAIN}", "clickAction": f"/{DOMAIN}", "tag": f"{DOMAIN}-{alert['key']}"},
            }
            for name in services:
                if self.hass.services.has_service("notify", name):
                    await async_send(self.hass, name, message)
            self._notified.append(alert["key"])

    def as_dict(self) -> dict[str, Any]:
        return {
            "forecast": self.forecast,
            "source": self.source,
            "alerts": self.alerts,
            "advice": self.advice,
            "climate": self.climate,
            "thresholds": vars(self.thresholds),
            "updated": self.updated,
        }


async def _texts(hass: HomeAssistant) -> dict[str, str]:
    strings = await async_get_translations(hass, hass.config.language, "common", [DOMAIN])
    prefix = f"component.{DOMAIN}.common."
    return {key.removeprefix(prefix): value for key, value in strings.items() if key.startswith(prefix)}


def advice_text(verdict: dict[str, Any] | None, texts: dict[str, str]) -> str:
    """ "⚠️ rain within 48 h · better on 08/10" (empty for a good day)."""
    if not verdict or not verdict["issues"]:
        return ""
    reasons = ", ".join(texts.get(f"issue_{issue}", issue) for issue in verdict["issues"])
    text = f"⚠️ {reasons}"
    if best := verdict.get("best"):
        text += " · " + texts.get("better_on", "better on {date}").replace(
            "{date}", f"{best[8:10]}/{best[5:7]}"
        )
    return text


def alert_text(alert: dict[str, Any], texts: dict[str, str], store: HomesteadStore) -> str:
    def day(iso: str) -> str:
        return f"{iso[8:10]}/{iso[5:7]}"

    names = [store.data.plantings[p].name for p in alert["plantings"] if p in store.data.plantings]
    plants = ", ".join(names[:4]) + (" …" if len(names) > 4 else "")
    when = (
        day(alert["start"])
        if alert["start"] == alert["end"]
        else f"{day(alert['start'])}–{day(alert['end'])}"
    )
    template = texts.get(f"alert_{alert['kind']}", "{when}: {value} °C {plants}")
    text = template.replace("{when}", when).replace("{value}", f"{alert['value']:g}")
    if alert["kind"] in ("heatwave", "heat_extreme") or not plants:
        return text.replace("{plants}", "").rstrip(" —:")
    return text.replace("{plants}", plants)
