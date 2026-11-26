"""The Home Assistant shopping list: items added once, never twice."""

from __future__ import annotations

import logging
from datetime import date

from homeassistant.core import HomeAssistant
from homeassistant.exceptions import HomeAssistantError
from homeassistant.helpers import entity_registry as er

from .const import DOMAIN
from .store import HomesteadStore
from .supplies import shopping_text, to_buy

_LOGGER = logging.getLogger(__name__)


def shopping_list(hass: HomeAssistant) -> str | None:
    """todo.shopping_list, else the first to-do list that is not ours (as the panel does)."""
    registry = er.async_get(hass)
    lists = sorted(hass.states.async_entity_ids("todo"))
    if "todo.shopping_list" in lists:
        return "todo.shopping_list"
    return next(
        (e for e in lists if (entry := registry.async_get(e)) is None or entry.platform != DOMAIN), None
    )


async def async_add_once(hass: HomeAssistant, item: str) -> bool | None:
    """Add the item unless an open one with the same text is already there.

    True = added, False = already on the list, None = no list or it failed (try again later).
    """
    entity_id = shopping_list(hass)
    if not entity_id:
        return None
    try:
        reply = await hass.services.async_call(
            "todo",
            "get_items",
            {"status": ["needs_action"]},
            target={"entity_id": entity_id},
            blocking=True,
            return_response=True,
        )
        items = ((reply or {}).get(entity_id) or {}).get("items") or []
        if any(str(i.get("summary", "")).casefold() == item.casefold() for i in items):
            return False
        await hass.services.async_call(
            "todo", "add_item", {"item": item}, target={"entity_id": entity_id}, blocking=True
        )
    except HomeAssistantError as err:
        _LOGGER.warning("Cannot add %s to %s: %s", item, entity_id, err)
        return None
    return True


async def async_shop_supplies(hass: HomeAssistant, store: HomesteadStore, today: date) -> int:
    """Finished or nearly finished supplies go on the shopping list, once each. Returns how many."""
    added = marked = 0
    for lot in to_buy(store.data, today):
        result = await async_add_once(hass, shopping_text(lot))
        if result is None:
            continue
        lot.shopping_on = today.isoformat()
        marked += 1
        added += bool(result)
    if marked:
        await store.async_save()
    return added
