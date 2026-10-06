from datetime import date, timedelta
from unittest.mock import AsyncMock, patch

import pytest
from homeassistant.core import HomeAssistant
from pytest_homeassistant_custom_component.common import MockConfigEntry, async_mock_service

from custom_components.homestead.const import DOMAIN
from custom_components.homestead.forecast import ARCHIVE_API, get_outlook
from custom_components.homestead.outlook import (
    PlantRisk,
    advice,
    alerts,
    day_issues,
    extremes,
    frost_dates,
    merge_days,
    parse_ha_forecast,
    parse_open_meteo_daily,
)
from custom_components.homestead.reminders import async_send_reminders


def _day(when: str, t_min: float, t_max: float, **extra) -> dict:
    return {"date": when, "t_min": t_min, "t_max": t_max, **extra}


def test_parse_forecasts():
    raw = {
        "daily": {
            "time": ["2026-01-10", "2026-01-11"],
            "temperature_2m_max": [5.2, None],
            "temperature_2m_min": [-3.1, 0.4],
            "precipitation_sum": [0, 12.5],
            "weather_code": [3, 96],
        }
    }
    days = parse_open_meteo_daily(raw)
    assert days[0]["t_min"] == -3.1 and days[1]["t_max"] is None and days[1]["code"] == 96
    items = [
        {"datetime": "2026-07-01", "temperature": 95, "templow": 68, "precipitation": 0.5, "wind_speed": 10}
    ]
    units = {"temperature_unit": "°F", "precipitation_unit": "in", "wind_speed_unit": "mph"}
    [day] = parse_ha_forecast(items, units)
    assert (day["t_max"], day["t_min"], day["rain_mm"], day["wind_kmh"]) == (35.0, 20.0, 12.7, 16.1)


def _years(springs: list[str], autumns: list[str]) -> list[dict]:
    """Daily minima of whole years: 5 °C, frost on the given days."""
    frosts = set(springs) | set(autumns)
    days = []
    for year in sorted({int(d[:4]) for d in springs}):
        day = date(year, 1, 1)
        while day.year == year:
            iso = day.isoformat()
            days.append(_day(iso, -1 if iso in frosts else 5, 15))
            day += timedelta(days=1)
    return days


def test_frost_dates_and_extremes():
    days = _years(
        ["2021-03-20", "2022-03-25", "2023-04-01", "2024-04-10"],
        ["2021-11-10", "2022-11-02", "2023-11-20", "2024-11-12"],
    )
    assert frost_dates(days) == {"last_spring": "03-29", "first_fall": "11-11", "years": 4}
    assert frost_dates(days[:500]) is None  # less than 3 years
    # Own sensor values win over the fallback.
    fallback = [_day("2021-03-19", 4, 12), _day("2021-03-20", -1, 10)]
    merged = merge_days({"2021-03-20": {"date": "2021-03-20", "t_min": 2.0, "t_max": None}}, fallback)
    assert [(d["t_min"], d["t_max"]) for d in merged] == [(4, 12), (2.0, 10)]

    summer = [
        _day("2025-07-01", 23, 36),
        _day("2025-07-02", 24, 37),
        _day("2025-07-03", 22, 36.5),
        _day("2025-07-04", 20, 33),
        _day("2025-07-20", 19, 41),
        _day("2025-08-01", 18, 28, code=96, rain_mm=45),
    ]
    found = [(e["kind"], e["start"], e["end"], e["value"]) for e in extremes(summer)]
    assert found == [
        ("heatwave", "2025-07-01", "2025-07-03", 37),
        ("heat_extreme", "2025-07-20", "2025-07-20", 41),
        ("hail", "2025-08-01", "2025-08-01", None),
        ("heavy_rain", "2025-08-01", "2025-08-01", 45),
    ]


def test_alerts_per_plant():
    plants = [
        PlantRisk("lemon", hardiness_c=-3),
        PlantRisk("tomato", hardiness_c=2, young=True),
        PlantRisk("lettuce", hardiness_c=-3, heat_max_c=30),
        PlantRisk("apple", hardiness_c=-30),
    ]
    forecast = [
        _day("2026-04-01", -4, 8),
        _day("2026-04-02", 1, 12),
        _day("2026-04-10", 15, 31),
        _day("2026-04-11", 16, 32),
        _day("2026-04-12", 15, 31),
        _day("2026-07-01", 23, 36),
        _day("2026-07-02", 24, 37),
        _day("2026-07-03", 22, 36),
    ]
    found = {(a["kind"], a["start"]): sorted(a["plantings"]) for a in alerts(forecast, plants)}
    assert found == {
        ("frost", "2026-04-01"): ["lemon", "lettuce", "tomato"],
        ("cold", "2026-04-02"): ["tomato"],
        ("heat_stress", "2026-04-10"): ["lettuce"],
        ("heatwave", "2026-07-01"): ["apple", "lemon", "lettuce", "tomato"],
    }


async def _call(hass: HomeAssistant, service: str, data: dict) -> dict:
    return await hass.services.async_call(DOMAIN, service, data, blocking=True, return_response=True)


@pytest.mark.freeze_time("2026-01-05 10:00:00+00:00")
async def test_outlook_alerts_notify_and_history(
    hass: HomeAssistant, hass_ws_client, no_open_meteo_outlook
) -> None:
    hass.config.latitude, hass.config.longitude = 45.07, 7.68
    notify = async_mock_service(hass, "notify", "mobile_app_phone")
    history = _years(["2023-03-20", "2024-03-25", "2025-04-01"], ["2023-11-10", "2024-11-02", "2025-11-20"])
    no_open_meteo_outlook.side_effect = lambda _hass, url, params: history if url == ARCHIVE_API else []
    forecast = [_day("2026-01-05", 2, 9), _day("2026-01-06", -5, 4), _day("2026-01-07", -2, 6)]
    options = {"weather_entity": "weather.home", "notify_services": ["notify.mobile_app_phone"]}
    entry = MockConfigEntry(domain=DOMAIN, title="HA Homestead", options=options)
    entry.add_to_hass(hass)
    with patch(
        "custom_components.homestead.forecast._forecast_from_entity", AsyncMock(return_value=forecast)
    ):
        assert await hass.config_entries.async_setup(entry.entry_id)
        await hass.async_block_till_done()
        lemon = (await _call(hass, "add_planting", {"name": "Limone", "species": "Citrus limon"}))["id"]
        await _call(hass, "add_planting", {"name": "Melo", "species": "Malus domestica"})
        outlook = get_outlook(hass)
        await outlook.async_refresh()
        assert [(a["kind"], a["plantings"]) for a in outlook.alerts] == [("frost", [lemon])]
        assert notify == []  # mode "tasks": nothing planned on those days
        await _call(hass, "add_task", {"kind": "treatment", "due_on": "2026-01-06", "planting_id": lemon})
        await outlook.async_refresh()
        assert len(notify) == 1 and "Limone" in notify[0].data["message"]
        await outlook.async_refresh()
        assert len(notify) == 1  # never twice for the same alert

    assert outlook.source == "weather.home"
    assert outlook.climate["frost"] == {"last_spring": "03-25", "first_fall": "11-10", "years": 3}
    assert hass.states.get("sensor.ha_homestead_weather_alerts").state == "1"
    ws = await hass_ws_client(hass)
    await ws.send_json({"id": 1, "type": "homestead/outlook/subscribe"})
    assert (await ws.receive_json())["success"]
    event = (await ws.receive_json())["event"]
    assert event["alerts"][0]["kind"] == "frost" and len(event["forecast"]) == 3


def test_rules_and_best_day():
    days = [
        _day("2026-05-04", 12, 24, rain_mm=0, wind_kmh=5),
        _day("2026-05-05", 12, 22, rain_mm=0, wind_kmh=30),
        _day("2026-05-06", 11, 21, rain_mm=6),
        _day("2026-05-07", 9, 23, rain_mm=0),
        _day("2026-05-08", 13, 26, rain_mm=0),
        _day("2026-05-09", 14, 27, rain_mm=0),
        _day("2026-05-10", 14, 28, rain_mm=0),
        _day("2026-05-11", 15, 28, rain_mm=0),
    ]
    assert day_issues("treatment", days, 1) == ["rain_48h", "wind"]
    assert advice("treatment", days, "2026-05-05") == {"issues": ["rain_48h", "wind"], "best": "2026-05-07"}
    assert advice("watering", days, "2026-05-05")["issues"] == ["rain_coming"]
    # Tomatoes (tender) wait for nights above 10 °C; hardy crops only need no frost.
    assert advice("sowing", days, "2026-05-04", tender=True) == {
        "issues": ["cold_nights"],
        "best": "2026-05-08",
    }
    assert advice("sowing", days, "2026-05-04") == {"issues": [], "best": None}
    assert advice("pruning", days, "2026-06-01") is None  # beyond the forecast


@pytest.mark.freeze_time("2026-05-05 18:00:00+00:00")
async def test_reminder_carries_weather_advice(hass: HomeAssistant) -> None:
    notify = async_mock_service(hass, "notify", "mobile_app_phone")
    forecast = [
        _day("2026-05-05", 12, 22, rain_mm=0, wind_kmh=5),
        _day("2026-05-06", 11, 21, rain_mm=8),
        _day("2026-05-07", 10, 22, rain_mm=0),
        _day("2026-05-08", 10, 23, rain_mm=0),
        _day("2026-05-09", 10, 23, rain_mm=0),
    ]
    options = {"weather_entity": "weather.home", "notify_services": ["notify.mobile_app_phone"]}
    entry = MockConfigEntry(domain=DOMAIN, title="HA Homestead", options=options)
    entry.add_to_hass(hass)
    with patch(
        "custom_components.homestead.forecast._forecast_from_entity", AsyncMock(return_value=forecast)
    ):
        assert await hass.config_entries.async_setup(entry.entry_id)
        await hass.async_block_till_done()
        task = (await _call(hass, "add_task", {"kind": "treatment", "due_on": "2026-05-05"}))["id"]
        await hass.async_block_till_done()
    assert get_outlook(hass).advice[task] == {"issues": ["rain_48h"], "best": "2026-05-07"}
    await async_send_reminders(hass, entry.runtime_data, ["notify.mobile_app_phone"])
    assert notify[0].data["message"].endswith("⚠️ rain within 48 h · better on 07/05")
