from datetime import timedelta

from freezegun.api import FrozenDateTimeFactory
from homeassistant.core import HomeAssistant
from homeassistant.exceptions import HomeAssistantError
from homeassistant.util import dt as dt_util
from pytest_homeassistant_custom_component.common import (
    MockConfigEntry,
    async_fire_time_changed,
    async_mock_service,
)

from custom_components.homestead.const import CONF_NOTIFY, CONF_NOTIFY_TIME, DOMAIN
from custom_components.homestead.forecast import Outlook


async def _setup(hass: HomeAssistant, options: dict | None = None) -> MockConfigEntry:
    entry = MockConfigEntry(domain=DOMAIN, title="HA Homestead", options=options or {})
    entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    return entry


async def _call(hass: HomeAssistant, service: str, data: dict) -> dict:
    return await hass.services.async_call(DOMAIN, service, data, blocking=True, return_response=True)


async def test_reset(hass: HomeAssistant, hass_ws_client) -> None:
    entry = await _setup(hass)
    data = entry.runtime_data.data
    await _call(hass, "add_zone", {"name": "Orto"})
    await _call(hass, "add_planting", {"name": "Melo", "species": "Malus domestica"})
    ws = await hass_ws_client(hass)
    await ws.send_json({"id": 1, "type": "homestead/reset", "confirm": "reset"})
    assert not (await ws.receive_json())["success"]
    assert data.plantings
    await ws.send_json({"id": 2, "type": "homestead/reset", "confirm": "RESET"})
    reply = await ws.receive_json()
    assert reply["success"] and reply["result"]["plantings"] == 0
    store = entry.runtime_data
    assert not store.data.plantings and not store.data.zones


async def test_reset_requires_admin(hass: HomeAssistant, hass_ws_client, hass_admin_user) -> None:
    await _setup(hass)
    hass_admin_user.groups = []
    ws = await hass_ws_client(hass)
    await ws.send_json({"id": 1, "type": "homestead/reset", "confirm": "RESET"})
    assert (await ws.receive_json())["error"]["code"] == "unauthorized"


async def test_tool_service_reminder(hass: HomeAssistant, freezer: FrozenDateTimeFactory) -> None:
    await hass.config.async_set_time_zone("Europe/Rome")
    freezer.move_to(dt_util.as_utc(dt_util.parse_datetime("2026-03-01T06:30:00+01:00")))
    sent = async_mock_service(hass, "notify", "mobile_app_pixel")
    entry = await _setup(hass, {CONF_NOTIFY: ["notify.mobile_app_pixel"], CONF_NOTIFY_TIME: "07:00:00"})
    args = {"name": "Tosaerba", "power": "petrol", "next_service_on": "2026-03-01", "service_months": 12}
    tool = (await _call(hass, "add_tool", args))["id"]
    assert entry.runtime_data.data.tools[tool].service_months == 12
    freezer.tick(timedelta(minutes=30))
    async_fire_time_changed(hass)
    await hass.async_block_till_done()
    assert [c.data["message"] for c in sent] == ["🔧 Tosaerba: service due"]


async def test_failing_phone_keeps_others(hass: HomeAssistant, freezer: FrozenDateTimeFactory) -> None:
    await hass.config.async_set_time_zone("Europe/Rome")
    freezer.move_to(dt_util.as_utc(dt_util.parse_datetime("2026-03-01T06:30:00+01:00")))

    async def broken(_call) -> None:
        raise HomeAssistantError("phone offline")

    hass.services.async_register("notify", "mobile_app_old", broken)
    sent = async_mock_service(hass, "notify", "mobile_app_pixel")
    phones = ["notify.mobile_app_old", "notify.mobile_app_pixel"]
    await _setup(hass, {CONF_NOTIFY: phones, CONF_NOTIFY_TIME: "07:00:00"})
    await _call(hass, "add_task", {"kind": "note", "due_on": "2026-03-01", "title": "Semina"})
    await _call(hass, "add_task", {"kind": "note", "due_on": "2026-03-01", "title": "Potatura"})
    freezer.tick(timedelta(minutes=30))
    async_fire_time_changed(hass)
    await hass.async_block_till_done()
    assert len(sent) == 2


async def test_frost_hurting_no_plant_is_not_notified(hass: HomeAssistant) -> None:
    entry = await _setup(hass)
    await _call(hass, "add_task", {"kind": "pruning", "due_on": "2026-03-02"})
    outlook = Outlook(hass, entry.runtime_data, {})
    frost = {"kind": "frost", "start": "2026-03-01", "end": "2026-03-03", "value": -1, "plantings": []}
    assert not outlook._relevant(frost)
    assert outlook._relevant({**frost, "kind": "heatwave"})
