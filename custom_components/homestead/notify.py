"""Sending phone notifications without letting one failing service stop the others."""

from __future__ import annotations

import logging
from typing import Any

from homeassistant.core import HomeAssistant

_LOGGER = logging.getLogger(__name__)


async def async_send(hass: HomeAssistant, name: str, message: dict[str, Any]) -> bool:
    """Call ``notify.<name>``; False (and a warning in the log) if it fails."""
    try:
        await hass.services.async_call("notify", name, message, blocking=True)
    except Exception:  # noqa: BLE001 - an offline phone or a broken service must not stop the rest
        _LOGGER.warning("Notification through notify.%s failed", name, exc_info=True)
        return False
    return True
