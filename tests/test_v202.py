"""0.20.2 audit: valves dropping off the network, follow-up tasks made once, photo rounds kept closed."""

from datetime import date, timedelta

import pytest
from homeassistant.core import HomeAssistant
from pytest_homeassistant_custom_component.common import (
    MockConfigEntry,
    async_fire_time_changed,
    async_mock_service,
)

from custom_components.homestead.const import DOMAIN
from custom_components.homestead.models import PhotoPlan, Task
from custom_components.homestead.reminders import async_send_reminders
from custom_components.homestead.store import get_store
from custom_components.homestead.tasks import async_complete_task, async_reopen_task, sync_photo_tasks


async def _setup(hass: HomeAssistant, options: dict | None = None) -> MockConfigEntry:
    entry = MockConfigEntry(domain=DOMAIN, title="HA Homestead", options=options or {})
    entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    return entry


async def _call(hass: HomeAssistant, service: str, data: dict) -> dict:
    return await hass.services.async_call(DOMAIN, service, data, blocking=True, return_response=True)


async def _valve_zone(hass: HomeAssistant) -> str:
    await _setup(hass)
    hass.states.async_set("valve.beds", "closed")
    zone_id = (await _call(hass, "add_zone", {"name": "Beds", "valve_entity": "valve.beds"}))["id"]
    await hass.async_block_till_done()
    return zone_id


async def _step(hass: HomeAssistant, freezer, minutes: int, state: str) -> None:
    freezer.tick(timedelta(minutes=minutes))
    async_fire_time_changed(hass)
    hass.states.async_set("valve.beds", state)
    await hass.async_block_till_done()


def _runs(hass: HomeAssistant, zone_id: str) -> list[float]:
    return [e.valve_minutes for e in get_store(hass).data.events.values() if e.zone_id == zone_id]


async def test_a_valve_dropping_out_while_open_keeps_its_run(hass: HomeAssistant, freezer) -> None:
    zone_id = await _valve_zone(hass)
    await _step(hass, freezer, 0, "open")
    await _step(hass, freezer, 20, "unavailable")
    await _step(hass, freezer, 2, "open")  # back on the network, still watering
    await _step(hass, freezer, 30, "closed")
    assert _runs(hass, zone_id) == [52]


async def test_a_valve_back_closed_after_a_dropout(hass: HomeAssistant, freezer) -> None:
    zone_id = await _valve_zone(hass)
    # Short gap: the run ends when the valve came back closed.
    await _step(hass, freezer, 0, "open")
    await _step(hass, freezer, 10, "unavailable")
    await _step(hass, freezer, 5, "closed")
    assert _runs(hass, zone_id) == [15]
    # Long gap: only the time it was seen open counts.
    await _step(hass, freezer, 60, "open")
    await _step(hass, freezer, 10, "unavailable")
    await _step(hass, freezer, 120, "closed")
    assert _runs(hass, zone_id) == [15, 10]


async def test_yearly_task_done_twice_makes_one_follow_up(hass: HomeAssistant) -> None:
    entry = await _setup(hass)
    store = entry.runtime_data
    data = {"kind": "pruning", "due_on": "2026-02-10", "yearly": True}
    task_id = (await _call(hass, "add_task", data))["id"]
    await async_complete_task(hass, store, task_id)
    await async_reopen_task(store, task_id)  # unticked in the HA to-do list
    await async_complete_task(hass, store, task_id)
    follow = [t for t in store.data.tasks.values() if t.due_on == "2027-02-10"]
    assert len(follow) == 1


def test_a_yearly_succession_keeps_its_end_next_year() -> None:
    task = Task(kind="sowing", due_on="2026-04-01", yearly=True, repeat_weeks=3, repeat_until="2026-06-30")
    follow = task.next_year()
    assert (follow.due_on, follow.repeat_until) == ("2027-04-01", "2027-06-30")
    assert Task(kind="sowing", due_on="2028-02-29", yearly=True).next_year().due_on == "2029-02-28"


async def test_a_cleared_photo_round_does_not_come_back(hass: HomeAssistant) -> None:
    entry = await _setup(hass)
    store = entry.runtime_data
    zone_id = (await _call(hass, "add_zone", {"name": "Orto"}))["id"]
    plan = PhotoPlan(zone_ids=[zone_id], periods=[{"month": 11, "part": "start"}])
    store.data.photo_plans = {plan.id: plan}
    store.data.tasks.clear()
    today = date(2026, 11, 5)
    assert sync_photo_tasks(store, today)
    task = next(t for t in store.data.tasks.values() if t.plan_id == plan.id)
    task.done_on = "2026-11-04"
    del store.data.tasks[task.id]  # "Clear completed" in the HA to-do list
    assert not sync_photo_tasks(store, today)
    assert not [t for t in store.data.tasks.values() if t.plan_id == plan.id]


@pytest.mark.freeze_time("2026-11-01 18:00:00+00:00")
async def test_a_photo_round_reminder_has_no_done_button(hass: HomeAssistant) -> None:
    notify = async_mock_service(hass, "notify", "mobile_app_phone")
    entry = await _setup(hass, {"notify_services": ["notify.mobile_app_phone"]})
    store = entry.runtime_data
    zone_id = (await _call(hass, "add_zone", {"name": "Orto"}))["id"]
    store.data.tasks.clear()
    photo = Task(kind="photo", due_on="2026-11-01", due_until="2026-11-14", zone_ids=[zone_id])
    pruning = Task(kind="pruning", due_on="2026-11-01")
    store.data.tasks = {photo.id: photo, pruning.id: pruning}
    await async_send_reminders(hass, store, ["notify.mobile_app_phone"])
    actions = {c.data["data"]["tag"]: c.data["data"]["actions"] for c in notify}
    assert actions[f"{DOMAIN}-{photo.id}"] == []
    assert len(actions[f"{DOMAIN}-{pruning.id}"]) == 1
