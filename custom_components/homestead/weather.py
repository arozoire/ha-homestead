"""Weekly weather snapshot for diary events.

The user's sensors come first, read from Home Assistant long-term statistics (hourly
mean/min/max/change, kept forever); Open-Meteo (free, no account) fills what is missing.
The snapshot is stored in the event, so it survives sensor changes.
"""

from __future__ import annotations

import logging
from datetime import date, datetime, time, timedelta
from typing import Any

import aiohttp
from homeassistant.core import HomeAssistant
from homeassistant.helpers.aiohttp_client import async_get_clientsession
from homeassistant.util import dt as dt_util

from .const import (
    CONF_HUMIDITY,
    CONF_OPEN_METEO,
    CONF_RAIN,
    CONF_SOIL,
    CONF_TEMPERATURE,
)
from .models import NO_WEATHER_KINDS

_LOGGER = logging.getLogger(__name__)

DAYS_BEFORE = 7
# Rain right after a treatment or a sowing matters too.
DAYS_AFTER = {"treatment": 3, "sowing": 3}
# A sensor counts only if it covers at least half of the window.
MIN_COVERAGE = 0.5

ARCHIVE_API = "https://archive-api.open-meteo.com/v1/archive"
FORECAST_API = "https://api.open-meteo.com/v1/forecast"
# The archive lags a few days behind; the forecast API also serves the recent past.
ARCHIVE_DELAY_DAYS = 6
DAILY = (
    "temperature_2m_mean,temperature_2m_min,temperature_2m_max,relative_humidity_2m_mean,precipitation_sum"
)

FIELDS = ("t_mean", "t_min", "t_max", "rh_mean", "rain_mm", "soil_mean")


def window(kind: str, done_on: date) -> tuple[date, date]:
    """Inclusive days: the week before the event, plus a few days after for some kinds."""
    return done_on - timedelta(days=DAYS_BEFORE), done_on + timedelta(days=DAYS_AFTER.get(kind, 0))


def _avg(values: list[float]) -> float | None:
    return round(sum(values) / len(values), 1) if values else None


def summarize_statistics(
    rows: dict[str, list[dict]], sensors: dict[str, str], hours: float
) -> dict[str, Any]:
    """Weekly values from hourly long-term statistics rows, per configured sensor."""
    out: dict[str, Any] = {}

    def usable(entity_id: str | None, key: str) -> list[dict]:
        found = [r for r in rows.get(entity_id or "", []) if r.get(key) is not None]
        return found if len(found) >= hours * MIN_COVERAGE else []

    if temp := usable(sensors.get(CONF_TEMPERATURE), "mean"):
        out["t_mean"] = _avg([r["mean"] for r in temp])
        out["t_min"] = round(min(r.get("min", r["mean"]) for r in temp), 1)
        out["t_max"] = round(max(r.get("max", r["mean"]) for r in temp), 1)
    if hum := usable(sensors.get(CONF_HUMIDITY), "mean"):
        out["rh_mean"] = _avg([r["mean"] for r in hum])
    if soil := usable(sensors.get(CONF_SOIL), "mean"):
        out["soil_mean"] = _avg([r["mean"] for r in soil])
    if rain := usable(sensors.get(CONF_RAIN), "change"):
        out["rain_mm"] = round(sum(max(r["change"], 0) for r in rain), 1)
    return out


def parse_open_meteo(raw: dict[str, Any]) -> dict[str, Any]:
    daily = raw.get("daily") or {}

    def values(key: str) -> list[float]:
        return [v for v in daily.get(key) or [] if v is not None]

    out: dict[str, Any] = {}
    if mean := values("temperature_2m_mean"):
        out["t_mean"] = _avg(mean)
    if low := values("temperature_2m_min"):
        out["t_min"] = round(min(low), 1)
    if high := values("temperature_2m_max"):
        out["t_max"] = round(max(high), 1)
    if hum := values("relative_humidity_2m_mean"):
        out["rh_mean"] = _avg(hum)
    if rain := values("precipitation_sum"):
        out["rain_mm"] = round(sum(rain), 1)
    return out


async def _sensor_statistics(
    hass: HomeAssistant, entity_ids: set[str], start: datetime, end: datetime
) -> dict[str, list[dict]]:
    if "recorder" not in hass.config.components or not entity_ids:
        return {}
    from homeassistant.components.recorder import get_instance
    from homeassistant.components.recorder.statistics import statistics_during_period

    return await get_instance(hass).async_add_executor_job(
        statistics_during_period,
        hass,
        start,
        end,
        entity_ids,
        "hour",
        None,
        {"mean", "min", "max", "change"},
    )


async def _open_meteo(
    session: aiohttp.ClientSession, latitude: float, longitude: float, start: date, end: date, today: date
) -> dict[str, Any]:
    api = ARCHIVE_API if end <= today - timedelta(days=ARCHIVE_DELAY_DAYS) else FORECAST_API
    params = {
        "latitude": latitude,
        "longitude": longitude,
        "start_date": start.isoformat(),
        "end_date": min(end, today).isoformat(),
        "daily": DAILY,
        "timezone": "auto",
    }
    async with session.get(api, params=params, timeout=aiohttp.ClientTimeout(total=15)) as response:
        response.raise_for_status()
        return parse_open_meteo(await response.json())


async def async_snapshot(
    hass: HomeAssistant, options: dict[str, Any], kind: str, done_on: date
) -> dict | None:
    """Weather around an event, or None when its window has not started yet or nothing answered."""
    today = dt_util.now().date()
    start, end = window(kind, done_on)
    if start > today:
        return None
    last = min(end, today)
    sensors = {
        key: options[key]
        for key in (CONF_TEMPERATURE, CONF_HUMIDITY, CONF_RAIN, CONF_SOIL)
        if options.get(key)
    }
    start_dt = dt_util.as_utc(datetime.combine(start, time.min, dt_util.get_default_time_zone()))
    end_dt = dt_util.as_utc(
        datetime.combine(last + timedelta(days=1), time.min, dt_util.get_default_time_zone())
    )
    hours = (end_dt - start_dt).total_seconds() / 3600

    result: dict[str, Any] = {}
    sources = []
    try:
        rows = await _sensor_statistics(hass, set(sensors.values()), start_dt, end_dt)
        result = summarize_statistics(rows, sensors, hours)
    except Exception as err:  # noqa: BLE001 - a broken recorder must not break the diary
        _LOGGER.debug("Statistics for the weather snapshot failed: %s", err)
    if result:
        sources.append("sensors")

    if options.get(CONF_OPEN_METEO, True) and any(f not in result for f in FIELDS if f != "soil_mean"):
        try:
            remote = await _open_meteo(
                async_get_clientsession(hass), hass.config.latitude, hass.config.longitude, start, end, today
            )
        except Exception as err:  # noqa: BLE001 - weather is a bonus: never break the diary
            _LOGGER.debug("Open-Meteo request failed: %s", err)
            remote = {}
        added = {k: v for k, v in remote.items() if k not in result}
        if added:
            result.update(added)
            sources.append("open-meteo")

    if not result:
        return None
    return {
        "from": start.isoformat(),
        "to": end.isoformat(),
        **result,
        "source": "+".join(sources),
        "complete": end < today,
    }


def _entry_options(hass: HomeAssistant) -> dict[str, Any]:
    from .const import DOMAIN

    entries = hass.config_entries.async_entries(DOMAIN)
    return dict(entries[0].options) if entries else {}


async def async_fill_event(hass: HomeAssistant, store: Any, event_id: str) -> bool:
    """Store the weather snapshot on an event; True when it changed."""
    event = store.data.events.get(event_id)
    if event is None or event.kind in NO_WEATHER_KINDS:
        return False
    snapshot = await async_snapshot(hass, _entry_options(hass), event.kind, date.fromisoformat(event.done_on))
    event = store.data.events.get(event_id)  # it may have been deleted meanwhile
    if event is None or snapshot is None or snapshot == event.weather:
        return False
    event.weather = snapshot
    return True


async def async_refresh(hass: HomeAssistant, store: Any, force: bool = False, limit: int = 20) -> int:
    """Fill missing or incomplete snapshots (all of them with ``force``); returns how many changed."""
    today = dt_util.now().date()
    todo = [
        e.id
        for e in sorted(store.data.events.values(), key=lambda e: e.done_on, reverse=True)
        if e.kind not in NO_WEATHER_KINDS
        and (force or not e.weather or not e.weather.get("complete"))
        and window(e.kind, date.fromisoformat(e.done_on))[0] <= today
    ]
    changed = 0
    for event_id in todo if force else todo[:limit]:
        changed += await async_fill_event(hass, store, event_id)
    if changed:
        await store.async_save()
    return changed


def schedule_weather(hass: HomeAssistant, store: Any, event_id: str) -> None:
    """Fetching weather may take seconds: never make a service wait for it."""

    async def fill() -> None:
        if await async_fill_event(hass, store, event_id):
            await store.async_save()

    hass.async_create_background_task(fill(), f"homestead weather {event_id}")
