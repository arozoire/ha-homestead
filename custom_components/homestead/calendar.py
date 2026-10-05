"""`calendar.<garden>`: planned activities and what the diary recorded, as all-day events."""

from __future__ import annotations

from datetime import date, datetime, timedelta

from homeassistant.components.calendar import CalendarEntity, CalendarEvent
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.dispatcher import async_dispatcher_connect
from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback
from homeassistant.util import dt as dt_util

from . import HomesteadConfigEntry
from .const import SIGNAL_DATA_UPDATED
from .entity import device_info
from .labels import async_kind_names, summary


async def async_setup_entry(
    hass: HomeAssistant, entry: HomesteadConfigEntry, async_add_entities: AddConfigEntryEntitiesCallback
) -> None:
    async_add_entities([HomesteadCalendar(entry)])


class HomesteadCalendar(CalendarEntity):
    _attr_has_entity_name = True
    _attr_should_poll = False
    _attr_translation_key = "garden"

    def __init__(self, entry: HomesteadConfigEntry) -> None:
        self._store = entry.runtime_data
        self._attr_unique_id = f"{entry.entry_id}_calendar"
        self._attr_device_info = device_info(entry)
        self._kinds: dict[str, str] = {}

    def _items(self) -> list[CalendarEvent]:
        data = self._store.data
        items = [
            CalendarEvent(
                start=date.fromisoformat(t.due_on),
                end=date.fromisoformat(t.due_on) + timedelta(days=1),
                summary=summary(data, t, self._kinds),
                description=t.notes,
                uid=f"task-{t.id}",
            )
            for t in data.tasks.values()
            if not t.done_on
        ]
        items += [
            CalendarEvent(
                start=date.fromisoformat(e.done_on),
                end=date.fromisoformat(e.done_on) + timedelta(days=1),
                summary=f"✔ {summary(data, e, self._kinds)}",
                description=e.notes,
                uid=f"event-{e.id}",
            )
            for e in data.events.values()
        ]
        return sorted(items, key=lambda i: i.start)

    @property
    def event(self) -> CalendarEvent | None:
        """The next planned activity, today or later (overdue ones stay in the to-do list)."""
        today = dt_util.now().date()
        upcoming = [i for i in self._items() if i.uid.startswith("task-") and i.end > today]
        return upcoming[0] if upcoming else None

    async def async_get_events(
        self, hass: HomeAssistant, start_date: datetime, end_date: datetime
    ) -> list[CalendarEvent]:
        first, last = dt_util.as_local(start_date).date(), dt_util.as_local(end_date).date()
        return [i for i in self._items() if i.start < last + timedelta(days=1) and i.end > first]

    async def async_added_to_hass(self) -> None:
        self._kinds = await async_kind_names(self.hass)
        self.async_on_remove(async_dispatcher_connect(self.hass, SIGNAL_DATA_UPDATED, self._handle_update))

    @callback
    def _handle_update(self) -> None:
        self.async_write_ha_state()
