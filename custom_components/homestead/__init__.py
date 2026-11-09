"""HA Homestead: garden and homestead management for Home Assistant."""

from __future__ import annotations

import logging
from datetime import timedelta
from typing import Any

from homeassistant.config_entries import ConfigEntry
from homeassistant.const import Platform
from homeassistant.core import HomeAssistant
from homeassistant.helpers import config_validation as cv
from homeassistant.helpers.event import async_track_time_change, async_track_time_interval
from homeassistant.helpers.typing import ConfigType
from homeassistant.loader import async_get_integration
from homeassistant.util import dt as dt_util

from .backup import make_backup, summary
from .backup_zip import BackupZipImportView, BackupZipView, write_last_backup
from .const import DOMAIN
from .forecast import FORECAST_REFRESH, OUTLOOK, Outlook
from .panel import async_register_panel, async_unregister_panel
from .photos import PhotoThumbView, PhotoUploadView, PhotoView
from .reminders import async_setup_reminders
from .services import async_register_services
from .store import HomesteadStore
from .tasks import sync_photo_tasks
from .weather import async_refresh
from .websocket_api import async_register_websocket

_LOGGER = logging.getLogger(__name__)

CONFIG_SCHEMA = cv.config_entry_only_config_schema(DOMAIN)
PLATFORMS = [Platform.CALENDAR, Platform.SENSOR, Platform.TODO]
WEATHER_REFRESH = timedelta(hours=6)

type HomesteadConfigEntry = ConfigEntry[HomesteadStore]


async def async_setup(hass: HomeAssistant, config: ConfigType) -> bool:
    async_register_services(hass)
    async_register_websocket(hass)
    hass.http.register_view(PhotoView(hass))
    hass.http.register_view(PhotoThumbView(hass))
    hass.http.register_view(PhotoUploadView(hass))
    hass.http.register_view(BackupZipView(hass))
    hass.http.register_view(BackupZipImportView(hass))
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

    async def photo_periods(_now: Any = None) -> None:
        # A new period of the photo plan opens its task just after midnight (and at start, if missed).
        if sync_photo_tasks(store, dt_util.now().date()):
            await store.async_save()

    await photo_periods()
    entry.async_on_unload(async_track_time_change(hass, photo_periods, hour=0, minute=5, second=0))

    outlook = Outlook(hass, store, dict(entry.options))
    await outlook.async_load()
    hass.data[OUTLOOK] = outlook
    entry.async_on_unload(outlook.async_listen())

    async def refresh_outlook(_now: Any = None) -> None:
        try:
            await outlook.async_refresh()
        except Exception:
            _LOGGER.exception("Garden weather outlook refresh failed")

    entry.async_on_unload(async_track_time_interval(hass, refresh_outlook, FORECAST_REFRESH))
    entry.async_create_background_task(hass, refresh_outlook(), f"{DOMAIN} outlook refresh")
    # New options (sensors, phones, time) apply at once.
    entry.async_on_unload(entry.add_update_listener(_async_options_updated))
    return True


async def _async_options_updated(hass: HomeAssistant, entry: HomesteadConfigEntry) -> None:
    await hass.config_entries.async_reload(entry.entry_id)


async def async_unload_entry(hass: HomeAssistant, entry: HomesteadConfigEntry) -> bool:
    async_unregister_panel(hass)
    hass.data.pop(OUTLOOK, None)
    return await hass.config_entries.async_unload_platforms(entry, PLATFORMS)


async def async_remove_entry(hass: HomeAssistant, entry: HomesteadConfigEntry) -> None:
    """HA's own storage goes; the photos stay in the media folder with a last backup next to them.

    Adding the integration again offers to restore that backup, photos included (see backup_zip)."""
    store = HomesteadStore(hass)
    await store.async_load()
    if any(getattr(store.data, name) for name in summary(store.data)):
        version = str((await async_get_integration(hass, DOMAIN)).version)
        backup = make_backup(store.data, dt_util.now().isoformat(), version)
        await hass.async_add_executor_job(write_last_backup, hass, backup)
    await store.async_remove()
    await Outlook(hass, HomesteadStore(hass), {}).async_remove()
