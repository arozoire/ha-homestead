"""Persistence of HA Homestead data in Home Assistant's .storage folder.

Every save turns each record into JSON with orjson (fast, C) and leaves out empty (None) fields; the
file keeps the same shape. The records that changed since the last save are kept in ``changes`` and
sent to the open panels instead of all the data (see websocket_api.ws_subscribe).
"""

from __future__ import annotations

from dataclasses import fields
from typing import Any

import orjson
from homeassistant.config_entries import ConfigEntryState
from homeassistant.core import HomeAssistant
from homeassistant.helpers.dispatcher import async_dispatcher_send
from homeassistant.helpers.storage import Store

from .const import DOMAIN, SIGNAL_DATA_CHANGES, SIGNAL_DATA_UPDATED, STORAGE_KEY, STORAGE_VERSION
from .models import _COLLECTIONS, HomesteadData

_FIELDS: dict[type, tuple[str, ...]] = {
    cls: tuple(f.name for f in fields(cls)) for cls in _COLLECTIONS.values()
}


def record_json(record: Any) -> bytes:
    """One record as JSON without its empty fields (missing fields load as their default)."""
    return orjson.dumps(
        {name: value for name in _FIELDS[type(record)] if (value := getattr(record, name)) is not None}
    )


def collection_json(items: list[bytes]) -> bytes:
    return b"[" + b",".join(items) + b"]"


class HomesteadStore:
    """Holds the data in memory and saves it on every change."""

    def __init__(self, hass: HomeAssistant) -> None:
        self.hass = hass
        self._store: Store[Any] = Store(hass, STORAGE_VERSION, STORAGE_KEY)
        self.data = HomesteadData()
        # Last saved JSON of every record, by collection and id: what changed is what differs.
        self._json: dict[str, dict[str, bytes]] = {name: {} for name in _COLLECTIONS}
        self.changes: dict[str, Any] = {}

    async def async_load(self) -> None:
        if raw := await self._store.async_load():
            self.data = HomesteadData.from_dict(raw)
        self._json = self._encode()

    def _encode(self) -> dict[str, dict[str, bytes]]:
        return {
            name: {rid: record_json(record) for rid, record in getattr(self.data, name).items()}
            for name in _COLLECTIONS
        }

    def snapshot(self) -> dict[str, Any]:
        """All the data, ready for a panel or the file (collections as pre-built JSON)."""
        out: dict[str, Any] = {
            name: orjson.Fragment(collection_json(list(records.values())))
            for name, records in self._json.items()
        }
        out["settings"] = dict(self.data.settings)
        return out

    async def async_save(self) -> None:
        new = self._encode()
        changed: dict[str, Any] = {}
        removed: dict[str, list[str]] = {}
        for name, records in new.items():
            old = self._json.get(name, {})
            if diff := [blob for rid, blob in records.items() if old.get(rid) != blob]:
                changed[name] = orjson.Fragment(collection_json(diff))
            if gone := [rid for rid in old if rid not in records]:
                removed[name] = gone
        self._json = new
        self.changes = {"changed": changed, "removed": removed, "settings": dict(self.data.settings)}
        await self._store.async_save(self.snapshot())
        async_dispatcher_send(self.hass, SIGNAL_DATA_CHANGES, self.changes)
        async_dispatcher_send(self.hass, SIGNAL_DATA_UPDATED)

    async def async_remove(self) -> None:
        await self._store.async_remove()


def get_store(hass: HomeAssistant) -> HomesteadStore | None:
    for entry in hass.config_entries.async_entries(DOMAIN):
        if entry.state is ConfigEntryState.LOADED:
            return entry.runtime_data
    return None
