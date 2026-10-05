"""Persistence of HA Homestead data in Home Assistant's .storage folder."""

from __future__ import annotations

from homeassistant.config_entries import ConfigEntryState
from homeassistant.core import HomeAssistant
from homeassistant.helpers.dispatcher import async_dispatcher_send
from homeassistant.helpers.storage import Store

from .const import DOMAIN, SIGNAL_DATA_UPDATED, STORAGE_KEY, STORAGE_VERSION
from .models import HomesteadData


class HomesteadStore:
    """Holds the data in memory and saves it on every change."""

    def __init__(self, hass: HomeAssistant) -> None:
        self.hass = hass
        self._store: Store[dict] = Store(hass, STORAGE_VERSION, STORAGE_KEY)
        self.data = HomesteadData()

    async def async_load(self) -> None:
        if raw := await self._store.async_load():
            self.data = HomesteadData.from_dict(raw)

    async def async_save(self) -> None:
        await self._store.async_save(self.data.to_dict())
        async_dispatcher_send(self.hass, SIGNAL_DATA_UPDATED)

    async def async_remove(self) -> None:
        await self._store.async_remove()


def get_store(hass: HomeAssistant) -> HomesteadStore | None:
    for entry in hass.config_entries.async_entries(DOMAIN):
        if entry.state is ConfigEntryState.LOADED:
            return entry.runtime_data
    return None
