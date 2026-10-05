"""Readable titles for tasks and diary events in the HA to-do list and calendar."""

from __future__ import annotations

from homeassistant.core import HomeAssistant
from homeassistant.helpers.translation import async_get_translations

from .const import DOMAIN
from .models import Event, HomesteadData, Task

ICONS = {
    "pruning": "✂️",
    "fertilizing": "🌿",
    "watering": "💧",
    "treatment": "🧪",
    "sowing": "🌱",
    "harvest": "🍎",
    "grafting": "🔀",
    "problem": "🐛",
    "note": "📝",
    "removal": "🏁",
    "review": "⭐",
    "tillage": "⛏️",
    "weeding": "🧤",
    "mulching": "🍂",
    "mowing": "🌾",
}


async def async_kind_names(hass: HomeAssistant) -> dict[str, str]:
    """Event kind names in the HA language, from the selector translations."""
    strings = await async_get_translations(hass, hass.config.language, "selector", [DOMAIN])
    prefix = f"component.{DOMAIN}.selector.event_kind.options."
    return {key.removeprefix(prefix): value for key, value in strings.items() if key.startswith(prefix)}


def target_name(data: HomesteadData, item: Task | Event) -> str | None:
    if item.planting_id and (planting := data.plantings.get(item.planting_id)):
        return planting.name
    if item.zone_id and (zone := data.zones.get(item.zone_id)):
        return zone.name
    return None


def summary(data: HomesteadData, item: Task | Event, kinds: dict[str, str]) -> str:
    """ "✂️ Pruning — Apple tree" (a task's own title wins over the kind name)."""
    name = getattr(item, "title", None) or kinds.get(item.kind, item.kind)
    target = target_name(data, item)
    return f"{ICONS.get(item.kind, '📝')} {name}" + (f" — {target}" if target else "")
