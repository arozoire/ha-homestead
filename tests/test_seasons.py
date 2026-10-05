from datetime import date
from unittest.mock import patch

import pytest
from freezegun.api import FrozenDateTimeFactory
from homeassistant.core import HomeAssistant
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.homestead.const import CONF_RAIN, CONF_TEMPERATURE, DOMAIN
from custom_components.homestead.weather import parse_open_meteo, summarize_statistics, window

HOURS = 24 * 8
TEMP = "sensor.outdoor_temperature"
RAIN = "sensor.rain_total"


def _rows(**values) -> list[dict]:
    return [dict(values) for _ in range(HOURS)]


def test_window():
    assert window("pruning", date(2026, 2, 12)) == (date(2026, 2, 5), date(2026, 2, 12))
    assert window("treatment", date(2026, 2, 12)) == (date(2026, 2, 5), date(2026, 2, 15))


def test_summaries():
    rows = {TEMP: _rows(mean=10.0, min=4.0, max=18.0), RAIN: _rows(change=0.1)}
    out = summarize_statistics(rows, {CONF_TEMPERATURE: TEMP, CONF_RAIN: RAIN}, HOURS)
    assert out == {"t_mean": 10.0, "t_min": 4.0, "t_max": 18.0, "rain_mm": 19.2}
    # less than half of the window covered: the sensor is not trusted
    assert summarize_statistics({TEMP: _rows(mean=10.0)[:50]}, {CONF_TEMPERATURE: TEMP}, HOURS) == {}

    daily = {
        "temperature_2m_mean": [5.0, 7.0, None],
        "temperature_2m_min": [1.0, 2.0, None],
        "temperature_2m_max": [9.0, 12.0, None],
        "relative_humidity_2m_mean": [80, 70, None],
        "precipitation_sum": [3.2, 0.0, None],
    }
    assert parse_open_meteo({"daily": daily}) == {
        "t_mean": 6.0,
        "t_min": 1.0,
        "t_max": 12.0,
        "rh_mean": 75.0,
        "rain_mm": 3.2,
    }


async def _setup(hass: HomeAssistant, options: dict | None = None) -> MockConfigEntry:
    hass.config.latitude, hass.config.longitude = 45.07, 7.68
    entry = MockConfigEntry(domain=DOMAIN, title="HA Homestead", options=options or {})
    entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    return entry


async def _call(hass: HomeAssistant, service: str, data: dict) -> dict:
    return await hass.services.async_call(DOMAIN, service, data, blocking=True, return_response=True)


@pytest.mark.freeze_time("2026-03-01 12:00:00+00:00")
async def test_event_weather_from_sensors_and_open_meteo(hass: HomeAssistant, no_open_meteo) -> None:
    no_open_meteo.return_value = {"t_mean": 99.0, "rh_mean": 70.0, "rain_mm": 50.0}
    entry = await _setup(hass, {CONF_TEMPERATURE: TEMP})
    rows = {TEMP: _rows(mean=8.0, min=2.0, max=15.0)}
    with patch("custom_components.homestead.weather._sensor_statistics", return_value=rows):
        tree = (await _call(hass, "add_planting", {"name": "Melo", "species": "Malus domestica"}))["id"]
        event = (
            await _call(hass, "add_event", {"kind": "pruning", "planting_id": tree, "done_on": "2026-02-12"})
        )["id"]
        await hass.async_block_till_done()
    weather = entry.runtime_data.data.events[event].weather
    assert weather["t_mean"] == 8.0 and weather["rh_mean"] == 70.0 and weather["rain_mm"] == 50.0
    assert weather["source"] == "sensors+open-meteo" and weather["complete"] is True
    assert (weather["from"], weather["to"]) == ("2026-02-05", "2026-02-12")


async def test_open_window_is_completed_later(
    hass: HomeAssistant, no_open_meteo, freezer: FrozenDateTimeFactory
) -> None:
    freezer.move_to("2026-04-02 12:00:00+00:00")
    no_open_meteo.return_value = {"t_mean": 12.0}
    entry = await _setup(hass)
    tree = (await _call(hass, "add_planting", {"name": "Pesco", "species": "Prunus persica"}))["id"]
    event = (
        await _call(hass, "add_event", {"kind": "treatment", "planting_id": tree, "done_on": "2026-04-01"})
    )["id"]
    await hass.async_block_till_done()
    data = entry.runtime_data.data
    assert data.events[event].weather["complete"] is False  # 3 days after the treatment still to come

    freezer.move_to("2026-04-10 12:00:00+00:00")
    no_open_meteo.return_value = {"t_mean": 13.0, "rain_mm": 22.0}
    assert (await _call(hass, "refresh_weather", {}))["updated"] == 1
    assert data.events[event].weather["complete"] is True and data.events[event].weather["rain_mm"] == 22.0


async def test_future_event_and_offline(hass: HomeAssistant, no_open_meteo) -> None:
    no_open_meteo.side_effect = OSError("offline")
    entry = await _setup(hass)
    tree = (await _call(hass, "add_planting", {"name": "Fico", "species": "Ficus carica"}))["id"]
    event = (await _call(hass, "add_event", {"kind": "note", "planting_id": tree}))["id"]
    future = (await _call(hass, "add_event", {"kind": "note", "planting_id": tree, "done_on": "2099-01-01"}))[
        "id"
    ]
    await hass.async_block_till_done()
    events = entry.runtime_data.data.events
    assert events[event].weather is None and events[future].weather is None


async def test_review_removal_and_repeat(hass: HomeAssistant) -> None:
    entry = await _setup(hass)
    data = entry.runtime_data.data
    zone = (await _call(hass, "add_zone", {"name": "Aiuola 1"}))["id"]
    tomatoes = (
        await _call(
            hass,
            "add_planting",
            {
                "name": "Pomodori 2026",
                "species": "Solanum lycopersicum",
                "variety": "Cuore di bue",
                "zone_id": zone,
                "kind": "group",
                "quantity": 12,
                "origin": "sown",
                "sown_on": "2026-04-01",
            },
        )
    )["id"]
    await _call(hass, "add_event", {"kind": "removal", "planting_id": tomatoes, "done_on": "2026-10-01"})
    assert data.plantings[tomatoes].status == "removed"
    review = (
        await _call(
            hass,
            "add_event",
            {
                "kind": "review",
                "planting_id": tomatoes,
                "rating": 2,
                "abundance": "poor",
                "avoid": "troppa ombra",
            },
        )
    )["id"]
    assert (data.events[review].rating, data.events[review].abundance) == (2, "poor")

    repeated = await _call(hass, "repeat_planting", {"id": tomatoes, "year": 2027})
    assert repeated["name"] == "Pomodori 2027"
    next_year = repeated["id"]
    copy = data.plantings[next_year]
    assert (copy.name, copy.variety, copy.zone_id, copy.quantity, copy.status) == (
        "Pomodori 2027",
        "Cuore di bue",
        zone,
        12,
        "active",
    )
    assert copy.sown_on is None and copy.origin == "sown"
    tree = (await _call(hass, "add_planting", {"name": "Melo", "species": "Malus domestica"}))["id"]
    assert data.plantings[(await _call(hass, "repeat_planting", {"id": tree}))["id"]].name.startswith(
        "Melo 20"
    )


async def test_options_flow(hass: HomeAssistant) -> None:
    entry = await _setup(hass)
    result = await hass.config_entries.options.async_init(entry.entry_id)
    result = await hass.config_entries.options.async_configure(
        result["flow_id"], {CONF_TEMPERATURE: TEMP, CONF_RAIN: RAIN, "open_meteo": False}
    )
    assert entry.options == {
        CONF_TEMPERATURE: TEMP,
        CONF_RAIN: RAIN,
        "open_meteo": False,
        "notify_time": "08:00:00",
    }
