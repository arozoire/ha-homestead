"""Planned activities: completing one records it in the diary."""

from __future__ import annotations

from homeassistant.core import HomeAssistant
from homeassistant.util import dt as dt_util

from .models import Event, Task
from .store import HomesteadStore
from .weather import schedule_weather


def close_task(store: HomesteadStore, task: Task, done_on: str, event_id: str | None = None) -> None:
    """Done; a yearly task comes back one year later."""
    task.done_on, task.event_id = done_on, event_id
    if task.yearly:
        follow = task.next_year()
        store.data.tasks[follow.id] = follow


def mark_task_done(store: HomesteadStore, task_id: str, event: Event) -> None:
    """Link the diary event; in a list task it ticks that plant, and the task closes with the last one."""
    task = store.data.tasks[task_id]
    if task.items:
        if event.planting_id in task.items and event.planting_id not in task.done_ids:
            task.done_ids.append(event.planting_id)
        if task.remaining:
            return
    close_task(store, task, event.done_on, event.id)


async def async_complete_task(
    hass: HomeAssistant,
    store: HomesteadStore,
    task_id: str,
    done_on: str | None = None,
    items: list[str] | None = None,
) -> list[Event]:
    """Record it in the diary: one event, or one per ticked plant of a list (all the remaining by default)."""
    task = store.data.tasks[task_id]
    day = done_on or dt_util.now().date().isoformat()
    notes = " — ".join(filter(None, [task.title, task.notes])) or None
    events: list[Event] = []
    if not task.items:
        target = {"planting_id": task.planting_id, "zone_id": task.zone_id}
        events.append(Event(kind=task.kind, done_on=day, notes=notes, **target))
    else:
        for item in task.remaining if items is None else items:
            if item not in task.items or item in task.done_ids:
                continue
            task.done_ids.append(item)
            # Seed lots are ticked off without an event: their sowing is the new planting.
            if item in task.planting_ids and item in store.data.plantings:
                events.append(Event(kind=task.kind, done_on=day, planting_id=item, notes=notes))
    for event in events:
        store.data.events[event.id] = event
    if not task.remaining:
        close_task(store, task, day, events[-1].id if events else None)
    await store.async_save()
    for event in events:
        schedule_weather(hass, store, event.id)
    return events


def postpone_task(store: HomesteadStore, task_id: str, due_on: str) -> str:
    """Another day; a list half done is split: the done part closes today, the rest becomes a new task."""
    task = store.data.tasks[task_id]
    if not (task.items and task.done_ids and task.remaining):
        task.due_on = due_on
        return task.id
    rest = Task(
        kind=task.kind,
        due_on=due_on,
        title=task.title,
        notes=task.notes,
        planting_ids=[i for i in task.planting_ids if i not in task.done_ids],
        seed_ids=[i for i in task.seed_ids if i not in task.done_ids],
    )
    if task.yearly:
        # Next year the whole list comes back once, from the part that closes now.
        follow = task.next_year()
        store.data.tasks[follow.id] = follow
        task.yearly = False
    task.planting_ids = [i for i in task.planting_ids if i in task.done_ids]
    task.seed_ids = [i for i in task.seed_ids if i in task.done_ids]
    close_task(store, task, dt_util.now().date().isoformat())
    store.data.tasks[rest.id] = rest
    return rest.id


def drop_item(store: HomesteadStore, item: str) -> None:
    """A plant or seed lot deleted: out of every list; an emptied list goes, a finished one closes."""
    for task in list(store.data.tasks.values()):
        if item not in task.items:
            continue
        task.planting_ids = [i for i in task.planting_ids if i != item]
        task.seed_ids = [i for i in task.seed_ids if i != item]
        task.done_ids = [i for i in task.done_ids if i != item]
        if not task.items:
            del store.data.tasks[task.id]
        elif not task.remaining and not task.done_on:
            close_task(store, task, dt_util.now().date().isoformat())


async def async_reopen_task(store: HomesteadStore, task_id: str) -> None:
    """Unticked in the HA to-do list: open again; the diary event stays."""
    task = store.data.tasks[task_id]
    task.done_on = None
    await store.async_save()
