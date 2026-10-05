"""`todo.<garden>`: planned activities; ticking one records it in the diary."""

from __future__ import annotations

from datetime import date, datetime

from homeassistant.components.todo import TodoItem, TodoItemStatus, TodoListEntity, TodoListEntityFeature
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.dispatcher import async_dispatcher_connect
from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback

from . import HomesteadConfigEntry
from .const import SIGNAL_DATA_UPDATED
from .entity import device_info
from .labels import async_kind_names, summary
from .models import EventKind, Task
from .tasks import async_complete_task, async_reopen_task


async def async_setup_entry(
    hass: HomeAssistant, entry: HomesteadConfigEntry, async_add_entities: AddConfigEntryEntitiesCallback
) -> None:
    async_add_entities([HomesteadTodo(entry)])


def _day(value: date | datetime | None) -> str | None:
    if value is None:
        return None
    return (value.date() if isinstance(value, datetime) else value).isoformat()


class HomesteadTodo(TodoListEntity):
    _attr_has_entity_name = True
    _attr_should_poll = False
    _attr_translation_key = "tasks"
    _attr_supported_features = (
        TodoListEntityFeature.CREATE_TODO_ITEM
        | TodoListEntityFeature.UPDATE_TODO_ITEM
        | TodoListEntityFeature.DELETE_TODO_ITEM
        | TodoListEntityFeature.SET_DUE_DATE_ON_ITEM
        | TodoListEntityFeature.SET_DESCRIPTION_ON_ITEM
    )

    def __init__(self, entry: HomesteadConfigEntry) -> None:
        self._store = entry.runtime_data
        self._attr_unique_id = f"{entry.entry_id}_tasks"
        self._attr_device_info = device_info(entry)
        self._kinds: dict[str, str] = {}

    @property
    def todo_items(self) -> list[TodoItem]:
        data = self._store.data
        tasks = sorted(data.tasks.values(), key=lambda t: (t.done_on is not None, t.due_on))
        return [
            TodoItem(
                uid=t.id,
                summary=summary(data, t, self._kinds),
                status=TodoItemStatus.COMPLETED if t.done_on else TodoItemStatus.NEEDS_ACTION,
                due=date.fromisoformat(t.due_on),
                description=t.notes,
            )
            for t in tasks
        ]

    async def async_create_todo_item(self, item: TodoItem) -> None:
        task = Task(
            kind=EventKind.NOTE,
            title=item.summary,
            due_on=_day(item.due) or date.today().isoformat(),
            notes=item.description,
        )
        self._store.data.tasks[task.id] = task
        await self._store.async_save()

    async def async_update_todo_item(self, item: TodoItem) -> None:
        task = self._store.data.tasks[item.uid]
        if item.summary and item.summary != summary(self._store.data, task, self._kinds):
            task.title = item.summary
        if item.due is not None:
            task.due_on = _day(item.due)
        task.notes = item.description
        if item.status == TodoItemStatus.COMPLETED and not task.done_on:
            await async_complete_task(self.hass, self._store, task.id)
        elif item.status == TodoItemStatus.NEEDS_ACTION and task.done_on:
            await async_reopen_task(self._store, task.id)
        else:
            await self._store.async_save()

    async def async_delete_todo_items(self, uids: list[str]) -> None:
        for uid in uids:
            self._store.data.tasks.pop(uid, None)
        await self._store.async_save()

    async def async_added_to_hass(self) -> None:
        self._kinds = await async_kind_names(self.hass)
        self.async_on_remove(async_dispatcher_connect(self.hass, SIGNAL_DATA_UPDATED, self._handle_update))

    @callback
    def _handle_update(self) -> None:
        self.async_write_ha_state()
