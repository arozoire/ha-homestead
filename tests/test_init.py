import pytest
from homeassistant.config_entries import SOURCE_USER
from homeassistant.core import HomeAssistant
from homeassistant.data_entry_flow import FlowResultType
from homeassistant.exceptions import ServiceValidationError
from homeassistant.helpers import area_registry as ar
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.homestead.const import DOMAIN


async def _setup(hass: HomeAssistant) -> MockConfigEntry:
    entry = MockConfigEntry(domain=DOMAIN, title="HA Homestead")
    entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    return entry


async def test_config_flow_single_instance(hass: HomeAssistant) -> None:
    result = await hass.config_entries.flow.async_init(DOMAIN, context={"source": SOURCE_USER})
    assert result["type"] is FlowResultType.FORM
    result = await hass.config_entries.flow.async_configure(result["flow_id"], {})
    assert result["type"] is FlowResultType.CREATE_ENTRY
    await hass.async_block_till_done()

    result = await hass.config_entries.flow.async_init(DOMAIN, context={"source": SOURCE_USER})
    assert result["type"] is FlowResultType.ABORT


async def test_services_update_sensors_and_persist(hass: HomeAssistant, hass_storage) -> None:
    hass.config.currency = "EUR"
    await _setup(hass)
    areas_before = len(ar.async_get(hass).areas)

    zone = await hass.services.async_call(
        DOMAIN, "add_zone", {"name": "Frutteto"}, blocking=True, return_response=True
    )
    planting = await hass.services.async_call(
        DOMAIN,
        "add_planting",
        {
            "name": "Melo vicino al pozzo",
            "species": "Malus domestica",
            "variety": "Renetta",
            "planted_on": "2026-03-15",
            "initial_form": "bare_root",
            "initial_height_cm": 120,
            "zone_id": zone["id"],
            "price": 24.5,
        },
        blocking=True,
        return_response=True,
    )
    await hass.services.async_call(
        DOMAIN,
        "add_tool",
        {"name": "Seghetto", "status": "needs_service", "price": 30, "purchased_on": "2026-02-01"},
        blocking=True,
    )
    await hass.async_block_till_done()

    assert hass.states.get("sensor.ha_homestead_plantings").state == "1"
    expenses = hass.states.get("sensor.ha_homestead_expenses_this_year")
    assert float(expenses.state) == 54.5
    assert expenses.attributes["unit_of_measurement"] == "EUR"
    assert hass.states.get("sensor.ha_homestead_tools_needing_service").state == "1"

    stored = hass_storage[f"{DOMAIN}.data"]["data"]
    saved = next(p for p in stored["plantings"] if p["id"] == planting["id"])
    assert saved["moon_phase"] is not None
    assert saved["zone_id"] == zone["id"]
    assert len(ar.async_get(hass).areas) == areas_before


async def test_unknown_reference_rejected(hass: HomeAssistant) -> None:
    await _setup(hass)
    with pytest.raises(ServiceValidationError):
        await hass.services.async_call(
            DOMAIN,
            "add_planting",
            {"name": "Pero", "species": "Pyrus communis", "zone_id": "nope"},
            blocking=True,
        )


async def test_remove_entry_deletes_storage(hass: HomeAssistant, hass_storage) -> None:
    entry = await _setup(hass)
    await hass.services.async_call(DOMAIN, "add_tool", {"name": "Vanga"}, blocking=True)
    assert f"{DOMAIN}.data" in hass_storage
    await hass.config_entries.async_remove(entry.entry_id)
    await hass.async_block_till_done()
    assert f"{DOMAIN}.data" not in hass_storage
