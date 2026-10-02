"""HA Homestead: garden and homestead management for Home Assistant."""

from __future__ import annotations

from homeassistant.config_entries import ConfigEntry
from homeassistant.const import Platform
from homeassistant.core import HomeAssistant
from homeassistant.helpers import config_validation as cv
from homeassistant.helpers.typing import ConfigType

from .const import DOMAIN
from .panel import async_register_panel, async_unregister_panel
from .services import async_register_services
from .store import HomesteadStore
from .websocket_api import async_register_websocket

CONFIG_SCHEMA = cv.config_entry_only_config_schema(DOMAIN)
PLATFORMS = [Platform.SENSOR]

type HomesteadConfigEntry = ConfigEntry[HomesteadStore]


async def async_setup(hass: HomeAssistant, config: ConfigType) -> bool:
    async_register_services(hass)
    async_register_websocket(hass)
    return True


async def async_setup_entry(hass: HomeAssistant, entry: HomesteadConfigEntry) -> bool:
    store = HomesteadStore(hass)
    await store.async_load()
    entry.runtime_data = store
    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)
    await async_register_panel(hass)
    return True


async def async_unload_entry(hass: HomeAssistant, entry: HomesteadConfigEntry) -> bool:
    async_unregister_panel(hass)
    return await hass.config_entries.async_unload_platforms(entry, PLATFORMS)


async def async_remove_entry(hass: HomeAssistant, entry: HomesteadConfigEntry) -> None:
    await HomesteadStore(hass).async_remove()
