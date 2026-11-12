"""0.19.1: several sensors of the same kind (options, zones, plants), averaged."""

from datetime import date, timedelta

from homeassistant.core import HomeAssistant
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.homestead.backup import make_backup, read_backup
from custom_components.homestead.const import CONF_RAIN, CONF_SOIL, CONF_TEMPERATURE, DOMAIN
from custom_components.homestead.models import (
    HomesteadData,
    Planting,
    Zone,
    entity_list,
    mean_reading,
    watering_due,
    zone_soil_sensors,
)
from custom_components.homestead.outlook import daily_from_statistics
from custom_components.homestead.water import sensor_plants, young_trees
from custom_components.homestead.weather import summarize_statistics

HOURS = 24 * 8


def _rows(**values) -> list[dict]:
    return [dict(values) for _ in range(HOURS)]


def test_entity_lists() -> None:
    assert entity_list("sensor.a") == ["sensor.a"]
    assert entity_list(["sensor.a", "", "sensor.b", "sensor.a"]) == ["sensor.a", "sensor.b"]
    assert entity_list(None) == []
    assert mean_reading(["sensor.a", "sensor.b", "sensor.off"], {"sensor.a": 20, "sensor.b": 30}) == 25.0
    assert mean_reading(["sensor.off"], {}) is None


def test_weather_snapshot_with_several_sensors() -> None:
    rows = {
        "sensor.t_north": _rows(mean=8.0, min=2.0, max=14.0),
        "sensor.t_south": _rows(mean=12.0, min=5.0, max=20.0),
        "sensor.t_broken": _rows(mean=30.0)[:10],  # too few hours: left out
        "sensor.rain_a": _rows(change=0.1),
        "sensor.rain_b": _rows(change=0.2),
        "sensor.bed_1": _rows(mean=20.0),
        "sensor.bed_2": _rows(mean=40.0),
    }
    sensors = {
        CONF_TEMPERATURE: ["sensor.t_north", "sensor.t_south", "sensor.t_broken"],
        CONF_RAIN: ["sensor.rain_a", "sensor.rain_b"],
        CONF_SOIL: ["sensor.bed_1", "sensor.bed_2"],
    }
    out = summarize_statistics(rows, sensors, HOURS)
    assert out == {"t_mean": 10.0, "t_min": 2.0, "t_max": 20.0, "rain_mm": 28.8, "soil_mean": 30.0}
    # A single id (options saved before 0.19.1) still works.
    assert summarize_statistics(rows, {CONF_SOIL: "sensor.bed_1"}, HOURS) == {"soil_mean": 20.0}


def test_climate_days_average_the_sensors() -> None:
    temps = [
        {"date": "2026-01-10", "min": -2.0, "max": 6.0},
        {"date": "2026-01-10", "min": 0.0, "max": 8.0},
    ]
    rains = [{"date": "2026-01-10", "change": 4.0}, {"date": "2026-01-10", "change": 6.0}]
    assert daily_from_statistics(temps, rains) == {
        "2026-01-10": {"date": "2026-01-10", "t_min": -1.0, "t_max": 7.0, "rain_mm": 5.0}
    }


def test_zone_and_plant_sensor_lists() -> None:
    data = HomesteadData()
    data.zones["orto"] = Zone(id="orto", name="Orto", soil_moisture_entity=["sensor.m1", "sensor.m2"])
    data.zones["aiuola"] = Zone(id="aiuola", name="Aiuola", parent_id="orto")
    data.zones["casa"] = Zone(id="casa", name="Salotto", kind="indoor")
    today = date(2026, 7, 1)
    data.plantings["vaso"] = Planting(
        id="vaso",
        name="Limone",
        species="Citrus limon",
        zone_id="aiuola",
        moisture_entity=["sensor.v1", "sensor.v2"],
    )
    data.plantings["melo"] = Planting(
        id="melo",
        name="Melo",
        species="Malus domestica",
        plant_type="fruit_tree",
        zone_id="aiuola",
        planted_on=(today - timedelta(days=60)).isoformat(),
        moisture_entity="sensor.melo",
        moisture_min=30,
    )
    data.plantings["felce"] = Planting(
        id="felce",
        name="Felce",
        species="Nephrolepis",
        zone_id="casa",
        moisture_entity=["sensor.f1", "sensor.f2"],
    )
    assert zone_soil_sensors(data, "aiuola") == {"moisture": ["sensor.m1", "sensor.m2"]}

    readings = {"sensor.v1": 18, "sensor.v2": 26, "sensor.melo": 40, "sensor.f1": 10, "sensor.f2": 20}
    plants = {t["planting_id"]: t for t in sensor_plants(data, readings)}
    assert set(plants) == {"vaso", "melo"}  # houseplants have their own round
    assert (plants["vaso"]["moisture"], plants["vaso"]["verdict"]) == (22.0, "water")
    assert plants["melo"]["verdict"] == "ok"

    # A young tree with a probe follows the probe, not the days without rain.
    days = [
        {"date": (today - timedelta(days=i)).isoformat(), "rain_mm": 0, "et0_mm": 5} for i in range(1, 30)
    ]
    tree = young_trees(data, days, today, readings)[0]
    assert (tree["moisture"], tree["verdict"]) == (40.0, "ok")
    assert young_trees(data, days, today, {"sensor.melo": 25})[0]["verdict"] == "water"

    assert [p.id for p in watering_due(data, today, readings)] == ["felce"]  # 15 % < 20 %

    back = read_backup(make_backup(data, "2026-11-12", "0.19.1"))
    assert back.plantings["vaso"].moisture_entity == ["sensor.v1", "sensor.v2"]
    assert back.zones["orto"].soil_moisture_entity == ["sensor.m1", "sensor.m2"]


async def test_options_and_services_take_lists(hass: HomeAssistant) -> None:
    entry = MockConfigEntry(
        domain=DOMAIN, title="HA Homestead", options={CONF_TEMPERATURE: "sensor.old_single"}
    )
    entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()

    # The form shows the old single sensor as a list, and saves lists.
    flow = await hass.config_entries.options.async_init(entry.entry_id)
    schema = flow["data_schema"].schema
    suggested = next(k for k in schema if k == CONF_TEMPERATURE).description["suggested_value"]
    assert suggested == ["sensor.old_single"]
    await hass.config_entries.options.async_configure(
        flow["flow_id"], {CONF_TEMPERATURE: ["sensor.a", "sensor.b"], CONF_RAIN: []}
    )
    assert entry.options[CONF_TEMPERATURE] == ["sensor.a", "sensor.b"]
    assert CONF_RAIN not in entry.options
    await hass.async_block_till_done()

    store = entry.runtime_data

    async def call(service: str, data: dict) -> dict:
        return await hass.services.async_call(DOMAIN, service, data, blocking=True, return_response=True)

    zone_id = (await call("add_zone", {"name": "Vasi", "soil_moisture_entity": ["sensor.p1", "sensor.p2"]}))[
        "id"
    ]
    assert store.data.zones[zone_id].soil_moisture_entity == ["sensor.p1", "sensor.p2"]
    plant_id = (
        await call(
            "add_planting",
            {"name": "Basilico", "species": "Ocimum basilicum", "moisture_entity": "sensor.b1"},
        )
    )["id"]
    assert store.data.plantings[plant_id].moisture_entity == ["sensor.b1"]
    await call("update_planting", {"id": plant_id, "moisture_entity": None})
    assert store.data.plantings[plant_id].moisture_entity == []
