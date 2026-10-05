import pytest
import voluptuous as vol
from homeassistant.components.frontend import DATA_PANELS
from homeassistant.config_entries import ConfigEntryState
from homeassistant.core import HomeAssistant
from homeassistant.exceptions import ServiceValidationError
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.homestead.const import DOMAIN


async def _setup(hass: HomeAssistant) -> MockConfigEntry:
    entry = MockConfigEntry(domain=DOMAIN, title="HA Homestead")
    entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    return entry


async def _add(hass: HomeAssistant, **data) -> str:
    response = await hass.services.async_call(
        DOMAIN,
        "add_planting",
        {"name": "Melo", "species": "Malus domestica", **data},
        blocking=True,
        return_response=True,
    )
    return response["id"]


async def test_panel_registered_and_removed(hass: HomeAssistant, hass_client) -> None:
    entry = await _setup(hass)
    panel = hass.data[DATA_PANELS][DOMAIN]
    assert panel.config["_panel_custom"]["name"] == "homestead-panel"
    module_url = panel.config["_panel_custom"]["module_url"]

    client = await hass_client()
    response = await client.get(module_url)
    assert response.status == 200
    assert "customElements.define" in await response.text()
    assert (await client.get(f"/{DOMAIN}_static/vendor/leaflet.js")).status == 200

    await hass.config_entries.async_unload(entry.entry_id)
    assert entry.state is ConfigEntryState.NOT_LOADED
    assert DOMAIN not in hass.data[DATA_PANELS]

    assert await hass.config_entries.async_setup(entry.entry_id)
    assert DOMAIN in hass.data[DATA_PANELS]


async def test_websocket_subscribe_pushes_updates(hass: HomeAssistant, hass_ws_client) -> None:
    await _setup(hass)
    planting_id = await _add(hass)
    ws = await hass_ws_client(hass)
    await ws.send_json({"id": 1, "type": "homestead/subscribe"})
    assert (await ws.receive_json())["success"]
    first = await ws.receive_json()
    assert [p["id"] for p in first["event"]["plantings"]] == [planting_id]

    await hass.services.async_call(
        DOMAIN, "update_planting", {"id": planting_id, "latitude": 45.1, "longitude": 7.2}, blocking=True
    )
    update = await ws.receive_json()
    assert update["event"]["plantings"][0]["latitude"] == 45.1


async def test_update_planting(hass: HomeAssistant) -> None:
    entry = await _setup(hass)
    planting_id = await _add(hass, kind="group", quantity=5, latitude=45.0, longitude=7.0)

    await hass.services.async_call(
        DOMAIN,
        "update_planting",
        {
            "id": planting_id,
            "planted_on": "2024-04-23",
            "status": "dead",
            "latitude": None,
            "longitude": None,
        },
        blocking=True,
    )
    planting = entry.runtime_data.data.plantings[planting_id]
    assert (planting.name, planting.quantity, planting.status) == ("Melo", 5, "dead")
    assert planting.moon_phase == "full_moon"
    assert planting.latitude is None and planting.longitude is None

    await hass.services.async_call(
        DOMAIN, "update_planting", {"id": planting_id, "kind": "single"}, blocking=True
    )
    assert entry.runtime_data.data.plantings[planting_id].quantity == 1


async def test_delete_planting_keeps_expenses(hass: HomeAssistant) -> None:
    entry = await _setup(hass)
    planting_id = await _add(hass, price=12)
    await hass.services.async_call(DOMAIN, "delete_planting", {"id": planting_id}, blocking=True)
    data = entry.runtime_data.data
    assert planting_id not in data.plantings
    assert [e.planting_id for e in data.expenses.values()] == [None]


SQUARE = {"type": "Polygon", "coordinates": [[[7, 45], [7.001, 45], [7.001, 45.001], [7, 45.001]]]}


async def test_zone_services(hass: HomeAssistant) -> None:
    entry = await _setup(hass)
    data = entry.runtime_data.data

    async def call(service: str, payload: dict) -> str:
        response = await hass.services.async_call(
            DOMAIN, service, payload, blocking=True, return_response=True
        )
        return response["id"]

    garden = await call("add_zone", {"name": "Giardino"})
    orto = await call(
        "add_zone", {"name": "Orto", "parent_id": garden, "kind": "vegetable_garden", "geometry": SQUARE}
    )
    bed = await call("add_zone", {"name": "Aiuola 1", "parent_id": orto})
    assert data.zones[orto].area_m2 == pytest.approx(8760, rel=0.01)
    assert data.zones[orto].geometry["coordinates"][0][-1] == [7, 45]

    with pytest.raises(ServiceValidationError):
        await call("update_zone", {"id": garden, "parent_id": bed})
    with pytest.raises(vol.Invalid):
        await call("update_zone", {"id": orto, "geometry": {"type": "Point", "coordinates": [7, 45]}})

    await call("update_zone", {"id": orto, "geometry": None})
    assert data.zones[orto].area_m2 is None

    planting = await _add(hass, zone_id=orto)
    await call("delete_zone", {"id": orto})
    assert data.zones[bed].parent_id == garden
    assert data.plantings[planting].zone_id == garden


async def test_position_needs_both_coordinates(hass: HomeAssistant) -> None:
    await _setup(hass)
    with pytest.raises(ServiceValidationError):
        await _add(hass, latitude=45.0)
    planting_id = await _add(hass, latitude=45.0, longitude=7.0)
    with pytest.raises(ServiceValidationError):
        await hass.services.async_call(
            DOMAIN, "update_planting", {"id": planting_id, "longitude": None}, blocking=True
        )
    await hass.services.async_call(
        DOMAIN, "update_planting", {"id": planting_id, "latitude": None, "longitude": None}, blocking=True
    )
