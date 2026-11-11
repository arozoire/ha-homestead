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


async def test_row_of_plants(hass: HomeAssistant) -> None:
    entry = await _setup(hass)
    row = {"name": "Fagiolini", "species": "Phaseolus vulgaris", "kind": "group", "quantity": 12}
    row |= {"latitude": 45.07, "longitude": 7.686, "row_to": [7.68604, 45.07]}
    planting_id = (await _call(hass, "add_planting", row))["id"]
    assert entry.runtime_data.data.plantings[planting_id].row_to == [7.68604, 45.07]
    await _call(hass, "update_planting", {"id": planting_id, "row_to": None})
    assert entry.runtime_data.data.plantings[planting_id].row_to is None
