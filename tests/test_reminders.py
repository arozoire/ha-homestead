from datetime import timedelta

from freezegun.api import FrozenDateTimeFactory
from homeassistant.core import HomeAssistant
from homeassistant.util import dt as dt_util
from pytest_homeassistant_custom_component.common import (
    MockConfigEntry,
    async_fire_time_changed,
    async_mock_service,
)

from custom_components.homestead.const import CONF_NOTIFY, CONF_NOTIFY_TIME, DOMAIN


async def _setup(hass: HomeAssistant, options: dict) -> MockConfigEntry:
    entry = MockConfigEntry(domain=DOMAIN, title="HA Homestead", options=options)
    entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    return entry


async def _call(hass: HomeAssistant, service: str, data: dict) -> dict:
    return await hass.services.async_call(DOMAIN, service, data, blocking=True, return_response=True)


async def test_daily_reminders_and_done_button(hass: HomeAssistant, freezer: FrozenDateTimeFactory) -> None:
    await hass.config.async_set_time_zone("Europe/Rome")
    freezer.move_to(dt_util.as_utc(dt_util.parse_datetime("2026-02-15T06:30:00+01:00")))
    sent = async_mock_service(hass, "notify", "mobile_app_pixel")
    entry = await _setup(hass, {CONF_NOTIFY: ["notify.mobile_app_pixel"], CONF_NOTIFY_TIME: "07:00:00"})
    data = entry.runtime_data.data
    tree = (await _call(hass, "add_planting", {"name": "Melo", "species": "Malus domestica"}))["id"]
    today = (await _call(hass, "add_task", {"kind": "pruning", "due_on": "2026-02-15", "planting_id": tree}))[
        "id"
    ]
    await _call(hass, "add_task", {"kind": "note", "due_on": "2026-02-01", "title": "Ordinare semi"})
    await _call(hass, "add_task", {"kind": "note", "due_on": "2026-03-01", "title": "Più avanti"})

    freezer.tick(timedelta(minutes=30))
    async_fire_time_changed(hass)
    await hass.async_block_till_done()
    assert len(sent) == 2
    first, late = (c.data for c in sent)
    assert (
        first["title"] == "🌱 Garden"
        and first["message"].startswith("✂️")
        and first["message"].endswith("— Melo")
    )
    assert first["data"]["clickAction"] == first["data"]["url"] == f"/homestead?task={today}"
    assert first["data"]["actions"][0]["action"] == f"HOMESTEAD_DONE_{today}"
    assert late["message"] == "1 overdue activities" and late["data"]["url"] == "/homestead"

    hass.bus.async_fire("mobile_app_notification_action", {"action": f"HOMESTEAD_DONE_{today}"})
    await hass.async_block_till_done()
    assert data.tasks[today].done_on == "2026-02-15"
    assert data.events[data.tasks[today].event_id].planting_id == tree


async def test_no_phone_no_schedule(hass: HomeAssistant, freezer: FrozenDateTimeFactory) -> None:
    sent = async_mock_service(hass, "notify", "mobile_app_pixel")
    await _setup(hass, {})
    await _call(hass, "add_task", {"kind": "note", "due_on": dt_util.now().date().isoformat()})
    freezer.tick(timedelta(days=1))
    async_fire_time_changed(hass)
    await hass.async_block_till_done()
    assert not sent


async def test_options_list_phones_first(hass: HomeAssistant) -> None:
    async_mock_service(hass, "notify", "persistent")
    async_mock_service(hass, "notify", "mobile_app_pixel")
    entry = await _setup(hass, {})
    result = await hass.config_entries.options.async_init(entry.entry_id)
    schema = result["data_schema"].schema
    [notify_key] = [k for k in schema if str(k) == CONF_NOTIFY]
    assert schema[notify_key].config["options"] == ["notify.mobile_app_pixel", "notify.persistent"]
    result = await hass.config_entries.options.async_configure(
        result["flow_id"], {CONF_NOTIFY: ["notify.mobile_app_pixel"], CONF_NOTIFY_TIME: "07:30:00"}
    )
    await hass.async_block_till_done()
    assert entry.options[CONF_NOTIFY_TIME] == "07:30:00"
    assert entry.state.value == "loaded"  # reloaded with the new options
