import pytest
import voluptuous as vol
from homeassistant.core import HomeAssistant
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.homestead.const import DOMAIN


async def _setup(hass: HomeAssistant) -> MockConfigEntry:
    entry = MockConfigEntry(domain=DOMAIN, title="HA Homestead")
    entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    return entry


async def _call(hass: HomeAssistant, service: str, data: dict) -> dict:
    return await hass.services.async_call(DOMAIN, service, data, blocking=True, return_response=True)


async def test_plant_type(hass: HomeAssistant) -> None:
    entry = await _setup(hass)
    data = entry.runtime_data.data
    args = {"name": "Melo", "species": "Malus domestica", "plant_type": "tree"}
    tree = (await _call(hass, "add_planting", args))["id"]
    assert data.plantings[tree].plant_type == "tree"
    copy = (await _call(hass, "repeat_planting", {"id": tree}))["id"]
    assert data.plantings[copy].plant_type == "tree"
    await _call(hass, "update_planting", {"id": tree, "plant_type": None})
    assert data.plantings[tree].plant_type is None
    with pytest.raises(vol.Invalid):
        await _call(hass, "update_planting", {"id": tree, "plant_type": "cactus"})


async def test_zone_work_events(hass: HomeAssistant) -> None:
    entry = await _setup(hass)
    data = entry.runtime_data.data
    garden = (await _call(hass, "add_zone", {"name": "Orto", "kind": "vegetable_garden"}))["id"]
    tilled = (await _call(hass, "add_event", {"kind": "tillage", "zone_id": garden, "cost": 80}))["id"]
    await _call(hass, "add_event", {"kind": "mulching", "zone_id": garden, "cost": 15})
    await hass.async_block_till_done()
    assert data.events[tilled].zone_id == garden
    categories = sorted(e.category for e in data.expenses.values())
    assert categories == ["other", "services"]
