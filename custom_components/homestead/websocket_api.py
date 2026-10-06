"""Websocket commands used by the sidebar panel."""

from __future__ import annotations

import base64
import binascii
import time
from typing import Any

import voluptuous as vol
from homeassistant.components import websocket_api
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers import config_validation as cv
from homeassistant.helpers.aiohttp_client import async_get_clientsession
from homeassistant.helpers.dispatcher import async_dispatcher_connect
from homeassistant.loader import async_get_integration
from homeassistant.util import dt as dt_util

from .backup import BackupError, make_backup, read_backup, summary
from .const import DOMAIN, SIGNAL_DATA_UPDATED, SIGNAL_OUTLOOK_UPDATED
from .forecast import async_crop_defaults, get_outlook
from .models import HomesteadData, Photo
from .photos import MAX_PHOTO_BYTES, delete_all, image_type, photo_dir, write_photo
from .species import SourcesUnavailable, combine, search_local, search_remote
from .store import get_store

SEARCH_CACHE = f"{DOMAIN}_species_cache"
SEARCH_CACHE_TTL_S = 24 * 3600
SEARCH_CACHE_SIZE = 200


@callback
def async_register_websocket(hass: HomeAssistant) -> None:
    websocket_api.async_register_command(hass, ws_subscribe)
    websocket_api.async_register_command(hass, ws_backup_export)
    websocket_api.async_register_command(hass, ws_backup_import)
    websocket_api.async_register_command(hass, ws_reset)
    websocket_api.async_register_command(hass, ws_photo_upload)
    websocket_api.async_register_command(hass, ws_search_species)
    websocket_api.async_register_command(hass, ws_crop_defaults)
    websocket_api.async_register_command(hass, ws_outlook_subscribe)
    websocket_api.async_register_command(hass, ws_outlook_refresh)


@websocket_api.websocket_command({vol.Required("type"): "homestead/crops/defaults"})
@websocket_api.async_response
async def ws_crop_defaults(
    hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]
) -> None:
    """The built-in crop table, keyed by normalized species name."""
    connection.send_result(msg["id"], {"crops": await async_crop_defaults(hass)})


@websocket_api.websocket_command({vol.Required("type"): "homestead/outlook/subscribe"})
@callback
def ws_outlook_subscribe(
    hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]
) -> None:
    """Forecast, alerts and climate now and after every refresh."""
    msg_id = msg["id"]

    @callback
    def send() -> None:
        outlook = get_outlook(hass)
        connection.send_message(websocket_api.event_message(msg_id, outlook.as_dict() if outlook else {}))

    connection.subscriptions[msg_id] = async_dispatcher_connect(hass, SIGNAL_OUTLOOK_UPDATED, send)
    connection.send_result(msg_id)
    send()


@websocket_api.websocket_command(
    {vol.Required("type"): "homestead/outlook/refresh", vol.Optional("history", default=False): bool}
)
@websocket_api.async_response
async def ws_outlook_refresh(
    hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]
) -> None:
    """Fetch the forecast again now (and the history with ``history``)."""
    if outlook := get_outlook(hass):
        await outlook.async_refresh(history=msg["history"])
    connection.send_result(msg["id"], outlook.as_dict() if outlook else {})


@websocket_api.websocket_command({vol.Required("type"): "homestead/subscribe"})
@callback
def ws_subscribe(
    hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]
) -> None:
    """Send all data now and again after every change."""
    msg_id = msg["id"]

    @callback
    def send() -> None:
        store = get_store(hass)
        data = store.data.to_dict() if store else {}
        connection.send_message(websocket_api.event_message(msg_id, data))

    connection.subscriptions[msg_id] = async_dispatcher_connect(hass, SIGNAL_DATA_UPDATED, send)
    connection.send_result(msg_id)
    send()


@websocket_api.websocket_command(
    {
        vol.Required("type"): "homestead/species/search",
        vol.Required("query"): vol.All(str, vol.Length(min=2, max=100)),
        vol.Optional("language"): vol.All(str, vol.Length(min=2, max=10)),
    }
)
@websocket_api.async_response
async def ws_search_species(
    hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]
) -> None:
    """Imported species first, then GBIF and Wikidata (cached for a day); works offline on local ones."""
    query = msg["query"].strip()
    language = (msg.get("language") or hass.config.language).split("-")[0].lower()
    store = get_store(hass)
    local = search_local(store.data, query, language) if store else []

    cache: dict[tuple[str, str], tuple[float, list]] = hass.data.setdefault(SEARCH_CACHE, {})
    key = (query.casefold(), language)
    offline = False
    cached = cache.get(key)
    if cached and time.monotonic() - cached[0] < SEARCH_CACHE_TTL_S:
        remote = cached[1]
    else:
        try:
            remote, complete = await search_remote(async_get_clientsession(hass), query, language)
        except SourcesUnavailable:
            remote, offline = [], True
        else:
            # When a source or a kingdom check failed, don't cache: the next search retries.
            if complete:
                if len(cache) >= SEARCH_CACHE_SIZE:
                    cache.pop(next(iter(cache)))
                cache[key] = (time.monotonic(), remote)
    connection.send_result(msg["id"], {"results": combine(local, remote), "offline": offline})


@websocket_api.websocket_command({vol.Required("type"): "homestead/backup/export"})
@websocket_api.async_response
async def ws_backup_export(
    hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]
) -> None:
    """All data as a backup file the panel downloads."""
    if (store := get_store(hass)) is None:
        connection.send_error(msg["id"], "not_loaded", "HA Homestead is not loaded")
        return
    version = str((await async_get_integration(hass, DOMAIN)).version)
    connection.send_result(msg["id"], make_backup(store.data, dt_util.now().isoformat(), version))


@websocket_api.require_admin
@websocket_api.websocket_command(
    {vol.Required("type"): "homestead/backup/import", vol.Required("backup"): dict}
)
@websocket_api.async_response
async def ws_backup_import(
    hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]
) -> None:
    """Replace all data with the content of a backup file (admin only)."""
    if (store := get_store(hass)) is None:
        connection.send_error(msg["id"], "not_loaded", "HA Homestead is not loaded")
        return
    try:
        data = read_backup(msg["backup"])
    except BackupError as err:
        connection.send_error(msg["id"], "invalid_format", str(err))
        return
    # The JSON has no image bytes: keep only photo records whose file is still on this instance.
    folder = photo_dir(hass)
    exists = await hass.async_add_executor_job(
        lambda: {i for i, p in data.photos.items() if (folder / p.file).is_file()}
    )
    data.photos = {i: p for i, p in data.photos.items() if i in exists}
    store.data = data
    await store.async_save()
    connection.send_result(msg["id"], summary(data))


@websocket_api.require_admin
@websocket_api.websocket_command({vol.Required("type"): "homestead/reset", vol.Required("confirm"): "RESET"})
@websocket_api.async_response
async def ws_reset(
    hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]
) -> None:
    """Delete all the garden data and photos (admin only); settings and the weather history stay."""
    if (store := get_store(hass)) is None:
        connection.send_error(msg["id"], "not_loaded", "HA Homestead is not loaded")
        return
    await hass.async_add_executor_job(delete_all, photo_dir(hass))
    store.data = HomesteadData()
    await store.async_save()
    connection.send_result(msg["id"], summary(store.data))


@websocket_api.websocket_command(
    {
        vol.Required("type"): "homestead/photo/upload",
        vol.Exclusive("planting_id", "target"): str,
        vol.Exclusive("event_id", "target"): str,
        vol.Required("content"): str,
        vol.Optional("taken_on"): vol.Any(None, cv.date),
        vol.Optional("caption"): vol.Any(None, str),
    }
)
@websocket_api.async_response
async def ws_photo_upload(
    hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]
) -> None:
    """Store a photo (base64; the panel already shrinks it) for a planting or a diary event."""
    store = get_store(hass)
    event = store.data.events.get(msg.get("event_id") or "") if store else None
    planting_id = event.planting_id if event else msg.get("planting_id")
    if store is None or (event is None and planting_id not in store.data.plantings):
        connection.send_error(msg["id"], "not_found", "unknown planting or event")
        return
    try:
        content = base64.b64decode(msg["content"], validate=True)
    except (binascii.Error, ValueError):
        connection.send_error(msg["id"], "invalid_format", "invalid base64 content")
        return
    kind = image_type(content)
    if kind is None or len(content) > MAX_PHOTO_BYTES:
        connection.send_error(msg["id"], "invalid_format", "JPEG, PNG or WebP up to 3 MB")
        return
    taken_on = msg.get("taken_on") or dt_util.now().date()
    photo = Photo(
        planting_id=planting_id,
        event_id=event.id if event else None,
        file="",
        taken_on=taken_on.isoformat(),
        caption=msg.get("caption"),
    )
    photo.file = f"{photo.planting_id or 'events'}/{photo.id}.{kind[0]}"
    await hass.async_add_executor_job(write_photo, photo_dir(hass), photo.file, content)
    store.data.photos[photo.id] = photo
    await store.async_save()
    connection.send_result(msg["id"], {"id": photo.id})
