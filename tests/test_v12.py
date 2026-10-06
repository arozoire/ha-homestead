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


async def test_nursery_and_transplant(hass: HomeAssistant) -> None:
    entry = await _setup(hass)
    data = entry.runtime_data.data
    nursery = (await _call(hass, "add_zone", {"name": "Serra fredda", "kind": "nursery"}))["id"]
    garden = (await _call(hass, "add_zone", {"name": "Orto", "kind": "vegetable_garden"}))["id"]
    args = {
        "name": "Basilico",
        "species": "Ocimum basilicum",
        "kind": "group",
        "quantity": 20,
        "sown_count": 20,
        "origin": "sown",
        "sown_on": "2026-02-20",
        "zone_id": nursery,
    }
    batch = (await _call(hass, "add_planting", args))["id"]
    await _call(
        hass,
        "update_planting",
        {"id": batch, "germinated_on": "2026-02-26", "germinated_count": 18, "quantity": 18},
    )
    assert data.plantings[batch].germinated_on == "2026-02-26"

    part = await _call(
        hass, "transplant", {"id": batch, "quantity": 10, "zone_id": garden, "done_on": "2026-04-02"}
    )
    new = data.plantings[part["id"]]
    assert part["left"] == 8 and new.id != batch
    assert (new.zone_id, new.quantity, new.planted_on, new.from_planting_id) == (
        garden,
        10,
        "2026-04-02",
        batch,
    )
    assert new.sown_on == "2026-02-20" and new.moon_phase
    assert data.plantings[batch].quantity == 8 and data.plantings[batch].zone_id == nursery

    rest = await _call(hass, "transplant", {"id": batch, "zone_id": garden, "done_on": "2026-04-09"})
    assert rest["id"] == batch and rest["left"] == 0
    assert data.plantings[batch].zone_id == garden and data.plantings[batch].planted_on == "2026-04-09"


async def test_end_of_planting_reason(hass: HomeAssistant) -> None:
    entry = await _setup(hass)
    data = entry.runtime_data.data
    lemon = (await _call(hass, "add_planting", {"name": "Limone", "species": "Citrus limon"}))["id"]
    tomato = (await _call(hass, "add_planting", {"name": "Pomodori", "species": "Solanum lycopersicum"}))[
        "id"
    ]
    died = {"kind": "removal", "planting_id": lemon, "reason": "died", "cause": "frost"}
    event = (await _call(hass, "add_event", died))["id"]
    await _call(hass, "add_event", {"kind": "removal", "planting_id": tomato, "reason": "finished"})
    assert data.plantings[lemon].status == "dead"
    assert data.plantings[tomato].status == "removed"
    assert data.events[event].cause == "frost"
    await _call(hass, "update_event", {"id": event, "reason": "removed", "cause": None})
    assert data.plantings[lemon].status == "removed"
    with pytest.raises(vol.Invalid):
        await _call(hass, "update_event", {"id": event, "cause": "boredom"})
