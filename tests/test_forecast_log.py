"""0.21: forecast versions kept where they change, checked against the own sensors."""

from datetime import date, datetime, timedelta
from unittest.mock import AsyncMock, patch

from homeassistant.core import HomeAssistant
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.homestead.const import DOMAIN
from custom_components.homestead.forecast import get_outlook
from custom_components.homestead.forecast_log import (
    changes_after,
    corrected,
    forecast_at,
    missing_actuals,
    night_correction,
    past_days,
    pressure_drop,
    record,
    reliability,
    set_actual,
    sky,
    stats,
    today_check,
)


def _day(when: date, t_min: float, t_max: float, rain: float, code: int = 3) -> dict:
    return {"date": when.isoformat(), "t_min": t_min, "t_max": t_max, "rain_mm": rain, "code": code}


def test_sky_from_code_or_condition() -> None:
    assert [sky({"code": c}) for c in (0, 3, 61, 73, 95, 45)] == [
        "sun",
        "cloud",
        "rain",
        "snow",
        "storm",
        "cloud",
    ]
    assert sky({"code": None, "condition": "pouring"}) == "rain"
    assert sky({"condition": "partlycloudy"}) == "cloud"


def test_only_real_changes_are_kept() -> None:
    log: dict = {}
    target = date(2026, 11, 24)
    issued = datetime(2026, 11, 17, 6, 0)
    assert record(log, [_day(target, 5, 10, 6, 61)], issued)
    # Three hours later: the same within the steps, nothing new.
    assert not record(log, [_day(target, 5.4, 10.6, 6.5, 61)], issued + timedelta(hours=3))
    assert record(log, [_day(target, 2, 13, 0, 0)], issued + timedelta(days=1))
    assert record(log, [_day(target, 3, 11, 0.2, 3)], issued + timedelta(days=2))
    # Beyond a week and in the past: not kept.
    assert not record(log, [_day(target + timedelta(days=10), 1, 2, 0)], issued)
    versions = log["days"]["2026-11-24"]["versions"]
    assert [(v["lead"], v["sky"], v["rain_mm"]) for v in versions] == [
        (7, "rain", 6),
        (6, "sun", 0),
        (5, "cloud", 0.2),
    ]
    assert forecast_at(versions, 6)["sky"] == "sun"
    assert forecast_at(versions, 3)["sky"] == "cloud"
    assert changes_after(versions, 7) == 2


def _history(days: int, night_offset: float, start: date = date(2026, 9, 1)) -> dict:
    """A forecast every day for the week ahead, then what happened: nights colder than forecast."""
    log: dict = {}
    for i in range(days + 7):
        issued = datetime.combine(start + timedelta(days=i), datetime.min.time()).replace(hour=6)
        forecast = [_day(issued.date() + timedelta(days=k), 5, 15, 4 if k % 2 else 0) for k in range(8)]
        record(log, forecast, issued)
    for i in range(days):
        day = start + timedelta(days=i)
        rain = 5 if i % 2 else 0
        set_actual(log, day.isoformat(), {"t_min": 5 + night_offset, "t_max": 15.5, "rain_mm": rain})
    return log


def test_errors_by_days_ahead_and_the_garden_offset() -> None:
    log = _history(30, -1.8)
    summary = stats(log)
    assert summary["days"] == 30
    one = summary["leads"]["1"]
    assert (one["min_err"], one["max_err"]) == (1.8, 0.5)
    assert summary["night_bias"] == -1.8
    assert night_correction(summary) == -1.8
    forecast = [{"date": "2026-12-01", "t_min": 1.5}]
    assert corrected(forecast, -1.8)[0]["t_min"] == -0.3
    assert corrected(forecast, None) is forecast
    # Too few nights: no correction of the frost alerts.
    assert night_correction(stats(_history(12, -1.8))) is None
    assert night_correction(stats(_history(30, -0.2))) is None


def test_reliability_of_the_coming_days() -> None:
    log: dict = {}
    today = date(2026, 11, 19)
    target = today + timedelta(days=5)
    issued = [
        datetime(2026, 11, 17, 6),
        datetime(2026, 11, 18, 6),
        datetime(2026, 11, 19, 6),
        datetime(2026, 11, 19, 9),
    ]
    for when, (t_max, code) in zip(issued, [(10, 61), (13, 0), (11, 3), (14, 0)], strict=True):
        record(log, [_day(target, 3, t_max, 0.2, code)], when)
    record(log, [_day(today + timedelta(days=1), 6, 11, 4, 61)], datetime(2026, 11, 19, 6))
    days = reliability(log, stats(log), today)
    assert days[target.isoformat()]["changes"] == 3
    assert days[target.isoformat()]["score"] == 1  # generic 60 % at 5 days, and 3 changes
    assert days["2026-11-20"] == {"score": 5, "changes": 0, "learned": False, "first": 1}


def test_today_against_yesterday_forecast() -> None:
    log: dict = {}
    today = date(2026, 11, 19)
    record(log, [_day(today, 6, 13, 0.2, 3)], datetime(2026, 11, 18, 18))
    check = today_check(log, today, {"t_min": 3.5, "t_max": 9.4, "rain_mm": 0}, -4.2)
    assert check["off"] is True
    assert {i["kind"]: i["off"] for i in check["items"]} == {
        "t_min": True,
        "t_max": False,
        "rain": False,
        "pressure": True,
    }
    assert not today_check(log, today, {"t_min": 5.5, "rain_mm": 0.5}, -1)["off"]
    assert today_check({}, today, {"t_min": 1}, None) is None


def test_pressure_fall_and_the_rain_after() -> None:
    start = datetime(2026, 11, 11, 0)
    # Steady, then 9 hPa down between 06:00 and 18:00.
    hours = [(start + timedelta(hours=h), 1020 - 0.75 * min(12, max(0, h - 6))) for h in range(24)]
    drops = pressure_drop(hours)
    assert drops["2026-11-11"] == 9.0
    log: dict = {"days": {}}
    set_actual(log, "2026-11-11", {"t_min": 6, "rain_mm": 0, "p_drop": 9})
    set_actual(log, "2026-11-12", {"t_min": 6, "rain_mm": 50, "p_drop": 2})
    set_actual(log, "2026-11-14", {"t_min": 6, "rain_mm": 0, "p_drop": 7})
    set_actual(log, "2026-11-15", {"t_min": 6, "rain_mm": 0})
    assert stats(log)["pressure"] == {"drops": 2, "rained": 1}
    assert missing_actuals({"days": {"2026-11-16": {"versions": []}}}, date(2026, 11, 19)) == ["2026-11-16"]


async def test_outlook_keeps_the_versions_and_answers_a_day(hass: HomeAssistant, hass_ws_client) -> None:
    today = date.today()
    forecast = [_day(today + timedelta(days=k), 4, 12, 1) for k in range(8)]
    options = {"pressure_sensor": ["sensor.p"], "weather_entity": "weather.home"}
    entry = MockConfigEntry(domain=DOMAIN, title="HA Homestead", options=options)
    entry.add_to_hass(hass)
    with patch(
        "custom_components.homestead.forecast._forecast_from_entity", AsyncMock(return_value=forecast)
    ):
        assert await hass.config_entries.async_setup(entry.entry_id)
        await hass.async_block_till_done()
    outlook = get_outlook(hass)
    assert outlook.trust["pressure"] is True
    day = next(iter(outlook.log["days"]))  # the forecast of the simulated Open-Meteo, kept
    client = await hass_ws_client(hass)
    await client.send_json({"id": 1, "type": "homestead/forecast/day", "date": day})
    reply = await client.receive_json()
    assert reply["result"]["versions"][0]["lead"] >= 0
    assert "trust" in outlook.as_dict()
    await client.send_json({"id": 2, "type": "homestead/forecast/days", "count": 7})
    reply = await client.receive_json()
    assert reply["success"] and reply["result"] == {"days": []}  # nothing over yet


def test_past_days_forecast_of_the_day_before_against_the_measure() -> None:
    today = date(2026, 11, 23)
    yesterday = today - timedelta(days=1)
    log: dict = {}
    record(log, [_day(yesterday, 5, 12, 31, 63)], datetime(2026, 11, 20, 6))
    record(log, [_day(yesterday, 5, 12, 25, 63)], datetime(2026, 11, 21, 6))
    record(log, [_day(yesterday, 6, 12, 18, 63)], datetime(2026, 11, 22, 6))  # the day itself: not the guess
    set_actual(log, yesterday.isoformat(), {"t_min": 6.2, "t_max": 11.1, "rain_mm": 13})
    set_actual(log, (today - timedelta(days=3)).isoformat(), {"t_min": 1, "t_max": 9, "rain_mm": 0})
    days = past_days(log, today, 14)
    assert [d["date"] for d in days] == ["2026-11-22", "2026-11-20"]
    assert days[0]["forecast"]["rain_mm"] == 25 and days[0]["actual"]["rain_mm"] == 13
    assert days[0]["changes"] == 3
    assert days[1]["forecast"] is None  # measured, never forecast
