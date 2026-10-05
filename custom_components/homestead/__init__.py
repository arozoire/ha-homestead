"""HA Homestead: garden and homestead management for Home Assistant."""

from __future__ import annotations

from datetime import timedelta
from typing import Any

from homeassistant.config_entries import ConfigEntry
from homeassistant.const import Platform
from homeassistant.core import HomeAssistant
from homeassistant.helpers import config_validation as cv
from homeassistant.helpers.event import async_track_time_interval
from homeassistant.helpers.typing import ConfigType

from .const import DOMAIN
from .panel import async_register_panel, async_unregister_panel
from .photos import PhotoView, delete_all, photo_dir
from .reminders import async_setup_reminders
from .services import async_register_services
from .store import HomesteadStore
from .weather import async_refresh
from .websocket_api import async_register_websocket

CONFIG_SCHEMA = cv.config_entry_only_config_schema(DOMAIN)
PLATFORMS = [Platform.CALENDAR, Platform.SENSOR, Platform.TODO]
WEATHER_REFRESH = timedelta(hours=6)

type HomesteadConfigEntry = ConfigEntry[HomesteadStore]


async def async_setup(hass: HomeAssistant, config: ConfigType) -> bool:
    async_register_services(hass)
    async_register_websocket(hass)
    hass.http.register_view(PhotoView(hass))
    return True


async def async_setup_entry(hass: HomeAssistant, entry: HomesteadConfigEntry) -> bool:
    store = HomesteadStore(hass)
    await store.async_load()
    entry.runtime_data = store
    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)
    await async_register_panel(hass)

    async def refresh_weather(_now: Any = None) -> None:
        await async_refresh(hass, store)

    # Snapshots of events whose window was still open, or saved while offline, get completed later.
    entry.async_on_unload(async_track_time_interval(hass, refresh_weather, WEATHER_REFRESH))
    entry.async_create_background_task(hass, refresh_weather(), f"{DOMAIN} weather refresh")
    entry.async_on_unload(async_setup_reminders(hass, store, dict(entry.options)))
    # New options (sensors, phones, time) apply at once.
    entry.async_on_unload(entry.add_update_listener(_async_options_updated))
    return True


async def _async_options_updated(hass: HomeAssistant, entry: HomesteadConfigEntry) -> None:
    await hass.config_entries.async_reload(entry.entry_id)


async def async_unload_entry(hass: HomeAssistant, entry: HomesteadConfigEntry) -> bool:
    async_unregister_panel(hass)
    return await hass.config_entries.async_unload_platforms(entry, PLATFORMS)


async def async_remove_entry(hass: HomeAssistant, entry: HomesteadConfigEntry) -> None:
    await HomesteadStore(hass).async_remove()
    await hass.async_add_executor_job(delete_all, photo_dir(hass))
