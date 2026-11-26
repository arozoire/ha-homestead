"""Lighter saves: empty fields left out of the file, only changed records sent to the panels."""

import orjson
from homeassistant.core import HomeAssistant
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.homestead.const import DOMAIN
from custom_components.homestead.models import Event, HomesteadData, Planting, Zone
from custom_components.homestead.store import record_json


def test_empty_fields_left_out_and_loaded_back() -> None:
    data = HomesteadData()
    zone = Zone(name="Orto", water_targets={"ph": [6.5, None]}, hose_here=False)
    plant = Planting(name="Pomodoro", species="Solanum lycopersicum", zone_id=zone.id)
    egg = Event(kind="eggs", done_on="2026-11-26", zone_id=zone.id, quantity=4)
    data.zones[zone.id], data.plantings[plant.id], data.events[egg.id] = zone, plant, egg
    raw = {
        name: [orjson.loads(record_json(r)) for r in getattr(data, name).values()]
        for name in ("zones", "plantings", "events")
    }
    assert "notes" not in raw["events"][0] and raw["zones"][0]["hose_here"] is False
    assert HomesteadData.from_dict(raw).to_dict() == data.to_dict()  # nothing lost


async def test_only_changes_after_a_save(hass: HomeAssistant, hass_storage) -> None:
    entry = MockConfigEntry(domain=DOMAIN, title="HA Homestead")
    entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    store = entry.runtime_data
    reply = await hass.services.async_call(
        DOMAIN, "add_zone", {"name": "Orto"}, blocking=True, return_response=True
    )
    assert list(store.changes["changed"]) == ["zones"] and store.changes["removed"] == {}
    saved = hass_storage[f"{DOMAIN}.data"]["data"]["zones"][0]
    assert saved["id"] == reply["id"] and "parent_id" not in saved  # None left out
    await store.async_save()
    assert store.changes["changed"] == {}  # nothing changed, nothing sent
    await hass.services.async_call(DOMAIN, "delete_zone", {"id": reply["id"]}, blocking=True)
    assert store.changes["removed"] == {"zones": [reply["id"]]}
