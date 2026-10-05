"""Planned activities: completing one records it in the diary."""

from __future__ import annotations

from homeassistant.core import HomeAssistant
from homeassistant.util import dt as dt_util

from .models import Event
from .store import HomesteadStore
from .weather import schedule_weather


def mark_task_done(store: HomesteadStore, task_id: str, event: Event) -> None:
    """Link the diary event; a yearly task comes back one year later."""
    task = store.data.tasks[task_id]
    task.done_on, task.event_id = event.done_on, event.id
    if task.yearly:
        follow = task.next_year()
        store.data.tasks[follow.id] = follow


async def async_complete_task(
    hass: HomeAssistant, store: HomesteadStore, task_id: str, done_on: str | None = None
) -> Event:
    task = store.data.tasks[task_id]
    event = Event(
        kind=task.kind,
        done_on=done_on or dt_util.now().date().isoformat(),
        planting_id=task.planting_id,
        zone_id=task.zone_id,
        notes=" — ".join(filter(None, [task.title, task.notes])) or None,
    )
    store.data.events[event.id] = event
    mark_task_done(store, task_id, event)
    await store.async_save()
    schedule_weather(hass, store, event.id)
    return event


async def async_reopen_task(store: HomesteadStore, task_id: str) -> None:
    """Unticked in the HA to-do list: open again; the diary event stays."""
    task = store.data.tasks[task_id]
    task.done_on = None
    await store.async_save()
