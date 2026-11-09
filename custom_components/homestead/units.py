"""Units shown to the user: metric or imperial (°F, in, ft, gal). Data is always stored in metric."""

from __future__ import annotations

from typing import Any

from homeassistant.core import HomeAssistant
from homeassistant.util.unit_system import METRIC_SYSTEM

from .const import CONF_UNITS

METRIC = "metric"
IMPERIAL = "imperial"
UNIT_CHOICES = ("auto", METRIC, IMPERIAL)


def resolve_units(hass: HomeAssistant, options: dict[str, Any]) -> str:
    """The option, or HA's own unit system when it is "auto"."""
    choice = options.get(CONF_UNITS, "auto")
    if choice in (METRIC, IMPERIAL):
        return choice
    return METRIC if hass.config.units is METRIC_SYSTEM else IMPERIAL


def c_to_f(value: float) -> float:
    return value * 9 / 5 + 32


def f_to_c(value: float) -> float:
    return (value - 32) * 5 / 9


def temperature_text(value: float, units: str) -> str:
    """A temperature for a message, without the unit (the text carries °C or °F)."""
    return f"{round(c_to_f(value)):g}" if units == IMPERIAL else f"{value:g}"
