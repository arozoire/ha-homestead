import pytest
from homeassistant.core import HomeAssistant
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.homestead.const import DOMAIN
from custom_components.homestead.models import Task

TODO = "todo.ha_homestead_garden_tasks"
CALENDAR = "calendar.ha_homestead_garden"


async def _setup(hass: HomeAssistant) -> MockConfigEntry:
    entry = MockConfigEntry(domain=DOMAIN, title="HA Homestead")
    entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    return entry


async def _call(hass: HomeAssistant, service: str, data: dict) -> dict:
    return await hass.services.async_call(DOMAIN, service, data, blocking=True, return_response=True)


def test_next_year_handles_leap_day():
    task = Task(kind="pruning", due_on="2028-02-29", yearly=True)
    assert task.next_year().due_on == "2029-02-28"


@pytest.mark.freeze_time("2026-02-01 10:00:00+00:00")
async def test_task_lifecycle_with_entities(hass: HomeAssistant) -> None:
    entry = await _setup(hass)
    data = entry.runtime_data.data
    tree = (await _call(hass, "add_planting", {"name": "Melo", "species": "Malus domestica"}))["id"]
    task = (
        await _call(
            hass, "add_task", {"kind": "pruning", "due_on": "2026-02-15", "planting_id": tree, "yearly": True}
        )
    )["id"]
    await hass.async_block_till_done()

    assert hass.states.get(TODO).state == "1"
    items = await hass.services.async_call(
        "todo", "get_items", {}, target={"entity_id": TODO}, blocking=True, return_response=True
    )
    [item] = items[TODO]["items"]
    assert (
        item["summary"].startswith("✂️") and item["summary"].endswith("— Melo") and item["due"] == "2026-02-15"
    )

    calendar = await hass.services.async_call(
        "calendar",
        "get_events",
        {"start_date_time": "2026-02-01 00:00:00", "end_date_time": "2026-03-01 00:00:00"},
        target={"entity_id": CALENDAR},
        blocking=True,
        return_response=True,
    )
    assert [e["start"] for e in calendar[CALENDAR]["events"]] == ["2026-02-15"]

    # ticked in the HA to-do list → diary event today, next year's task created
    await hass.services.async_call(
        "todo",
        "update_item",
        {"item": item["uid"], "status": "completed"},
        target={"entity_id": TODO},
        blocking=True,
    )
    await hass.async_block_till_done()
    done = data.tasks[task]
    event = data.events[done.event_id]
    assert (done.done_on, event.kind, event.planting_id, event.done_on) == (
        "2026-02-01",
        "pruning",
        tree,
        "2026-02-01",
    )
    [follow] = [t for t in data.tasks.values() if t.id != task]
    assert (follow.due_on, follow.yearly, follow.done_on) == ("2027-02-15", True, None)
    assert hass.states.get(TODO).state == "1"

    # unticked: open again, the diary keeps the event
    await hass.services.async_call(
        "todo",
        "update_item",
        {"item": task, "status": "needs_action"},
        target={"entity_id": TODO},
        blocking=True,
    )
    assert data.tasks[task].done_on is None and done.event_id in data.events


async def test_todo_add_and_panel_completion(hass: HomeAssistant) -> None:
    entry = await _setup(hass)
    data = entry.runtime_data.data
    await hass.services.async_call(
        "todo",
        "add_item",
        {"item": "Comprare letame", "due_date": "2026-11-01"},
        target={"entity_id": TODO},
        blocking=True,
    )
    [task] = data.tasks.values()
    assert (task.title, task.kind, task.due_on) == ("Comprare letame", "note", "2026-11-01")

    # the panel completes a task by saving a diary event with task_id
    zone = (await _call(hass, "add_zone", {"name": "Orto"}))["id"]
    await _call(hass, "update_task", {"id": task.id, "zone_id": zone, "kind": "fertilizing"})
    event = (
        await _call(
            hass, "add_event", {"kind": "fertilizing", "zone_id": zone, "task_id": task.id, "quantity": 3}
        )
    )["id"]
    assert data.tasks[task.id].event_id == event and data.tasks[task.id].done_on

    await _call(hass, "delete_zone", {"id": zone})
    assert data.tasks[task.id].zone_id is None
    await _call(hass, "delete_task", {"id": task.id})
    assert not data.tasks


async def test_task_target_can_be_cleared(hass: HomeAssistant) -> None:
    entry = await _setup(hass)
    zone = (await _call(hass, "add_zone", {"name": "Orto"}))["id"]
    task = (await _call(hass, "add_task", {"kind": "watering", "due_on": "2026-06-01", "zone_id": zone}))[
        "id"
    ]
    await _call(hass, "update_task", {"id": task, "planting_id": None})
    stored = entry.runtime_data.data.tasks[task]
    assert (stored.planting_id, stored.zone_id) == (None, None)
