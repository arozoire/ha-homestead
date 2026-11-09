from homeassistant.core import HomeAssistant
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.homestead.backup import make_backup, read_backup
from custom_components.homestead.const import CONF_SOIL, CONF_SOIL_EC, CONF_SOIL_TEMP, DOMAIN
from custom_components.homestead.models import (
    Event,
    HomesteadData,
    PhotoPlan,
    Planting,
    Task,
    Zone,
    zone_soil_sensors,
)
from custom_components.homestead.weather import _event_options


class _Store:
    def __init__(self, data: HomesteadData) -> None:
        self.data = data


def _garden() -> HomesteadData:
    data = HomesteadData()
    data.zones["orto"] = Zone(
        id="orto", name="Orto", soil_temperature_entity="sensor.orto_t", soil_ec_entity="sensor.orto_ec"
    )
    data.zones["aiuola"] = Zone(
        id="aiuola", name="Aiuola 1", parent_id="orto", soil_ec_entity="sensor.aiuola_ec"
    )
    data.zones["frutteto"] = Zone(id="frutteto", name="Frutteto")
    data.plantings["pom"] = Planting(
        id="pom", name="Pomodoro", species="Solanum lycopersicum", zone_id="aiuola"
    )
    return data


def test_zone_sensors_from_the_zone_then_its_parents() -> None:
    data = _garden()
    assert zone_soil_sensors(data, "aiuola") == {"ec": "sensor.aiuola_ec", "temperature": "sensor.orto_t"}
    assert zone_soil_sensors(data, "frutteto") == {}
    assert zone_soil_sensors(data, None) == {}


def test_event_uses_the_zone_sensors_over_the_general_ones() -> None:
    store = _Store(_garden())
    general = {
        CONF_SOIL: "sensor.general_m",
        CONF_SOIL_TEMP: "sensor.general_t",
        CONF_SOIL_EC: "sensor.general_ec",
    }
    on_plant = Event(kind="watering", done_on="2026-11-01", planting_id="pom")
    assert _event_options(store, on_plant, general) == {
        CONF_SOIL: "sensor.general_m",
        CONF_SOIL_TEMP: "sensor.orto_t",
        CONF_SOIL_EC: "sensor.aiuola_ec",
    }
    on_orchard = Event(kind="pruning", done_on="2026-11-01", zone_id="frutteto")
    assert _event_options(store, on_orchard, general) == general


def test_backup_keeps_zone_sensors_and_cleans_photo_lists() -> None:
    data = _garden()
    data.photo_plans["p"] = PhotoPlan(id="p", zone_ids=["orto", "gone"], planting_ids=["pom", "gone"])
    data.tasks["t"] = Task(
        id="t", kind="photo", due_on="2026-11-01", zone_ids=["orto", "gone"], plan_id="nope"
    )
    back = read_backup(make_backup(data, "2026-11-09", "0.17.0"))
    assert back.zones["orto"].soil_temperature_entity == "sensor.orto_t"
    assert back.photo_plans["p"].zone_ids == ["orto"]
    assert back.photo_plans["p"].planting_ids == ["pom"]
    assert back.tasks["t"].zone_ids == ["orto"]
    assert back.tasks["t"].plan_id is None


async def test_zone_soil_sensors_by_service(hass: HomeAssistant) -> None:
    entry = MockConfigEntry(domain=DOMAIN, title="HA Homestead")
    entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    out = await hass.services.async_call(
        DOMAIN,
        "add_zone",
        {"name": "Serra", "soil_temperature_entity": "sensor.serra_t"},
        blocking=True,
        return_response=True,
    )
    store = entry.runtime_data
    zone = store.data.zones[out["id"]]
    assert zone.soil_temperature_entity == "sensor.serra_t"
    await hass.services.async_call(
        DOMAIN,
        "update_zone",
        {"id": zone.id, "soil_temperature_entity": None},
        blocking=True,
        return_response=True,
    )
    assert store.data.zones[zone.id].soil_temperature_entity is None
