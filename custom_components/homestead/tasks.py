"""Planned activities: completing one records it in the diary."""

from __future__ import annotations

from datetime import date

from homeassistant.core import HomeAssistant
from homeassistant.util import dt as dt_util

from .models import Event, EventKind, PlantingStatus, Task
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
        item = next((i for i in (event.planting_id, event.zone_id) if i in task.items), None)
        if item and item not in task.done_ids:
            task.done_ids.append(item)
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
            # Seed lots are ticked off without an event: their sowing is the new planting;
            # a photo is recorded with its picture, so a skipped one leaves nothing in the diary.
            if task.kind != EventKind.PHOTO and item in task.planting_ids and item in store.data.plantings:
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
        task.due_until = _shifted_until(task, due_on)
        task.due_on = due_on
        return task.id
    rest = Task(
        kind=task.kind,
        due_on=due_on,
        due_until=_shifted_until(task, due_on),
        title=task.title,
        notes=task.notes,
        planting_ids=[i for i in task.planting_ids if i not in task.done_ids],
        seed_ids=[i for i in task.seed_ids if i not in task.done_ids],
        zone_ids=[i for i in task.zone_ids if i not in task.done_ids],
        plan_id=task.plan_id,
        window_on=task.window_on,
    )
    if task.yearly:
        # Next year the whole list comes back once, from the part that closes now.
        follow = task.next_year()
        store.data.tasks[follow.id] = follow
        task.yearly = False
    task.planting_ids = [i for i in task.planting_ids if i in task.done_ids]
    task.seed_ids = [i for i in task.seed_ids if i in task.done_ids]
    task.zone_ids = [i for i in task.zone_ids if i in task.done_ids]
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
        task.zone_ids = [i for i in task.zone_ids if i != item]
        task.done_ids = [i for i in task.done_ids if i != item]
        if not task.items:
            del store.data.tasks[task.id]
        elif not task.remaining and not task.done_on:
            close_task(store, task, dt_util.now().date().isoformat())


def _shifted_until(task: Task, due_on: str) -> str | None:
    """A period keeps its length when it moves."""
    if not task.due_until:
        return None
    length = date.fromisoformat(task.due_until) - date.fromisoformat(task.due_on)
    return (date.fromisoformat(due_on) + length).isoformat()


def retire_planting(store: HomesteadStore, planting_id: str) -> None:
    """A plant died or was taken out: no more photos of it (the ones taken stay)."""
    for plan in store.data.photo_plans.values():
        plan.planting_ids = [i for i in plan.planting_ids if i != planting_id]
    for task in list(store.data.tasks.values()):
        if task.kind != EventKind.PHOTO or task.done_on or planting_id not in task.remaining:
            continue
        task.planting_ids.remove(planting_id)
        if not task.items:
            del store.data.tasks[task.id]
        elif not task.remaining:
            close_task(store, task, dt_util.now().date().isoformat())


def sync_photo_tasks(store: HomesteadStore, today: date) -> bool:
    """Each plan period opens one list task with its zones and plants; an older one still open closes."""
    data = store.data
    changed = False
    for plan in data.photo_plans.values():
        alive = {p.id for p in data.plantings.values() if p.status == PlantingStatus.ACTIVE}
        plantings = [i for i in plan.planting_ids if i in alive]
        zones = [i for i in plan.zone_ids if i in data.zones]
        window = plan.window_at(today)
        if window is None or not (plantings or zones):
            continue
        start, end = (d.isoformat() for d in window)
        mine = [t for t in data.tasks.values() if t.plan_id == plan.id]
        if any(t.window_on == start for t in mine):
            continue
        for old in mine:
            if not old.done_on and (old.window_on or "") < start:
                close_task(store, old, today.isoformat())
        task = Task(
            kind=EventKind.PHOTO,
            due_on=start,
            due_until=end,
            zone_ids=zones,
            planting_ids=plantings,
            plan_id=plan.id,
            window_on=start,
        )
        data.tasks[task.id] = task
        changed = True
    return changed


async def async_reopen_task(store: HomesteadStore, task_id: str) -> None:
    """Unticked in the HA to-do list: open again; the diary event stays."""
    task = store.data.tasks[task_id]
    task.done_on = None
    await store.async_save()
