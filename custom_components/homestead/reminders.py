"""Phone reminders for planned activities, sent through the chosen notify services.

Tapping a notification opens the panel on the diary form already filled in
(`/homestead?task=<id>`); its "✔ Done" button completes the task directly.
"""

from __future__ import annotations

import logging
from collections.abc import Callable
from datetime import time
from typing import Any

from homeassistant.core import Event, HomeAssistant, callback
from homeassistant.helpers.event import async_track_time_change
from homeassistant.helpers.translation import async_get_translations
from homeassistant.util import dt as dt_util

from .const import CONF_NOTIFY, CONF_NOTIFY_TIME, DEFAULT_NOTIFY_TIME, DOMAIN
from .forecast import advice_text, get_outlook
from .labels import async_kind_names, summary
from .models import COMPOST_TURN_DAYS, compost_due
from .store import HomesteadStore
from .tasks import async_complete_task

_LOGGER = logging.getLogger(__name__)

ACTION_DONE = "HOMESTEAD_DONE_"
PANEL_URL = f"/{DOMAIN}"


def task_url(task_id: str) -> str:
    return f"{PANEL_URL}?task={task_id}"


def turn_url(zone_id: str) -> str:
    return f"{PANEL_URL}?zone={zone_id}&kind=compost_turn"


async def _texts(hass: HomeAssistant) -> dict[str, str]:
    strings = await async_get_translations(hass, hass.config.language, "common", [DOMAIN])
    prefix = f"component.{DOMAIN}.common."
    return {key.removeprefix(prefix): value for key, value in strings.items() if key.startswith(prefix)}


async def async_send_reminders(hass: HomeAssistant, store: HomesteadStore, services: list[str]) -> int:
    """One notification per task due today, one summary of the overdue ones, compost to turn."""
    now = dt_util.now().date()
    today = now.isoformat()
    open_tasks = [t for t in store.data.tasks.values() if not t.done_on]
    due = sorted((t for t in open_tasks if t.due_on == today), key=lambda t: t.id)
    late = [t for t in open_tasks if t.due_on < today]
    planned = {t.zone_id for t in open_tasks if t.kind == "compost_turn"}
    # Once at four weeks, then once a week until it is done (or planned as a task).
    compost = [
        (zone, days)
        for zone, days in compost_due(store.data, now)
        if zone.id not in planned and (days - COMPOST_TURN_DAYS) % 7 == 0
    ]
    if not services or not (due or late or compost):
        return 0
    kinds = await async_kind_names(hass)
    texts = await _texts(hass)
    title = texts.get("notification_title", "Garden")
    outlook = get_outlook(hass)

    def text(task) -> str:
        weather = advice_text(outlook.advice.get(task.id) if outlook else None, texts)
        return summary(store.data, task, kinds) + (f"\n{weather}" if weather else "")

    messages = [
        {
            "title": title,
            "message": text(t),
            "data": {
                "url": task_url(t.id),  # iOS
                "clickAction": task_url(t.id),  # Android
                "tag": f"{DOMAIN}-{t.id}",
                "actions": [
                    {"action": f"{ACTION_DONE}{t.id}", "title": texts.get("notification_done", "✔ Done")}
                ],
            },
        }
        for t in due
    ]
    for zone, days in compost:
        url = turn_url(zone.id)
        messages.append(
            {
                "title": title,
                "message": texts.get("notification_compost", "♻️ {zone}: turn the compost ({days} days)")
                .replace("{zone}", zone.name)
                .replace("{days}", str(days)),
                "data": {"url": url, "clickAction": url, "tag": f"{DOMAIN}-compost-{zone.id}"},
            }
        )
    if late:
        messages.append(
            {
                "title": title,
                "message": texts.get("notification_late", "{count} overdue").replace(
                    "{count}", str(len(late))
                ),
                "data": {"url": PANEL_URL, "clickAction": PANEL_URL, "tag": f"{DOMAIN}-late"},
            }
        )
    sent = 0
    for service in services:
        name = service.removeprefix("notify.")
        if not hass.services.has_service("notify", name):
            _LOGGER.warning("Notify service notify.%s not found", name)
            continue
        for message in messages:
            await hass.services.async_call("notify", name, message, blocking=True)
            sent += 1
    return sent


def _parse_time(value: str | None) -> time:
    try:
        return time.fromisoformat(value or DEFAULT_NOTIFY_TIME)
    except ValueError:
        return time.fromisoformat(DEFAULT_NOTIFY_TIME)


@callback
def async_setup_reminders(
    hass: HomeAssistant, store: HomesteadStore, options: dict[str, Any]
) -> Callable[[], None]:
    """Schedule the daily reminders and listen to the notification buttons; returns the unsubscribe."""
    services = list(options.get(CONF_NOTIFY) or [])
    at = _parse_time(options.get(CONF_NOTIFY_TIME))

    async def daily(_now: Any) -> None:
        try:
            await async_send_reminders(hass, store, services)
        except Exception:
            _LOGGER.exception("Sending garden reminders failed")

    async def button(event: Event) -> None:
        action = str(event.data.get("action", ""))
        if not action.startswith(ACTION_DONE):
            return
        task = store.data.tasks.get(action.removeprefix(ACTION_DONE))
        if task and not task.done_on:
            await async_complete_task(hass, store, task.id)

    unsubscribers = [hass.bus.async_listen("mobile_app_notification_action", button)]
    if services:
        unsubscribers.append(async_track_time_change(hass, daily, hour=at.hour, minute=at.minute, second=0))

    @callback
    def unsubscribe() -> None:
        for unsub in unsubscribers:
            unsub()

    return unsubscribe
