import pytest
import voluptuous as vol
from homeassistant.core import HomeAssistant
from homeassistant.exceptions import ServiceValidationError
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.homestead.backup import read_backup
from custom_components.homestead.const import DOMAIN
from custom_components.homestead.crops import load_defaults, lookup, normalize


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


async def test_woodland(hass: HomeAssistant) -> None:
    entry = await _setup(hass)
    data = entry.runtime_data.data
    args = {
        "name": "Bosco",
        "kind": "woodland",
        "species": ["Quercus cerris", "quercus cerris", " ", "Castanea sativa"],
    }
    wood = (await _call(hass, "add_zone", args))["id"]
    assert [e["name"] for e in data.zones[wood].species] == ["Quercus cerris", "Castanea sativa"]
    with pytest.raises(ServiceValidationError):
        await _call(hass, "update_zone", {"id": wood, "species": [{"name": "Faggio", "taxon_id": "missing"}]})
    cut = {
        "kind": "wood_cutting",
        "zone_id": wood,
        "quantity": 12,
        "unit": "stere",
        "product": "Quercus cerris",
    }
    event = (await _call(hass, "add_event", {**cut, "cost": 200}))["id"]
    await _call(hass, "add_event", {"kind": "foraging", "zone_id": wood, "quantity": 2.5, "unit": "kg"})
    await hass.async_block_till_done()
    assert (data.events[event].quantity, data.events[event].unit) == (12, "stere")
    assert next(iter(data.expenses.values())).category == "services"


def test_backup_clears_unknown_zone_species() -> None:
    raw = {
        "format": "ha-homestead-backup",
        "version": 1,
        "data": {
            "zones": [{"id": "z", "name": "Bosco", "species": [{"name": "Faggio", "taxon_id": "gone"}]}]
        },
    }
    assert read_backup(raw).zones["z"].species == [{"name": "Faggio", "taxon_id": None}]


async def test_seed_lots(hass: HomeAssistant) -> None:
    entry = await _setup(hass)
    data = entry.runtime_data.data
    args = {"species": "Solanum lycopersicum", "variety": "Cuore di bue", "year": 2023, "price": 3.5}
    lot = (await _call(hass, "add_seed_lot", args))["id"]
    expense = next(iter(data.expenses.values()))
    assert (expense.category, expense.amount) == ("seeds", 3.5)
    assert expense.notes == "Solanum lycopersicum Cuore di bue"
    sown = {"name": "Pomodori", "species": "Solanum lycopersicum", "origin": "sown", "seed_lot_id": lot}
    tomatoes = (await _call(hass, "add_planting", sown))["id"]
    with pytest.raises(ServiceValidationError):
        await _call(hass, "add_planting", {**sown, "seed_lot_id": "missing"})
    await _call(hass, "update_seed_lot", {"id": lot, "finished": True, "viability_years": 5})
    assert data.seeds[lot].finished and data.seeds[lot].viability_years == 5
    await _call(hass, "delete_seed_lot", {"id": lot})
    assert lot not in data.seeds and data.plantings[tomatoes].seed_lot_id is None


def test_crop_defaults_lookup() -> None:
    table = load_defaults()
    assert normalize("Citrus x limon") == normalize("Citrus × limon") == "citrus limon"
    tomato = lookup("Solanum lycopersicum var. cerasiforme", table)
    assert tomato["species"] == "Solanum lycopersicum" and 5 in tomato["plant_out"]
    assert lookup("Rosa canina", table)["species"] == "Rosa"
    assert lookup("Unknown plant", table) is None
    months = ("sow_indoor", "sow_outdoor", "plant_out", "flowering", "harvest")
    for crop in table.values():
        assert set(crop["exposure"]) <= {"sun", "partial", "shade"}
        assert all(1 <= m <= 12 for key in months for m in crop.get(key, []))


async def test_crop_profiles(hass: HomeAssistant, hass_ws_client) -> None:
    entry = await _setup(hass)
    data = entry.runtime_data.data
    first = (
        await _call(hass, "set_crop_profile", {"species": "Solanum lycopersicum", "plant_out": [5, 4, 5]})
    )["id"]
    again = await _call(hass, "set_crop_profile", {"species": "solanum  Lycopersicum", "hardiness_c": 3})
    assert again["id"] == first and len(data.crops) == 1
    assert data.crops[first].hardiness_c == 3 and data.crops[first].plant_out == []
    with pytest.raises(vol.Invalid):
        await _call(hass, "set_crop_profile", {"species": "X", "harvest": [13]})
    await _call(hass, "delete_crop_profile", {"id": first})
    assert not data.crops
    ws = await hass_ws_client(hass)
    await ws.send_json({"id": 1, "type": "homestead/crops/defaults"})
    crops = (await ws.receive_json())["result"]["crops"]
    assert crops["malus domestica"]["species"] == "Malus domestica"
