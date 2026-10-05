"""Websocket commands used by the sidebar panel."""

from __future__ import annotations

import base64
import binascii
import time
from typing import Any

import voluptuous as vol
from homeassistant.components import websocket_api
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.aiohttp_client import async_get_clientsession
from homeassistant.helpers.dispatcher import async_dispatcher_connect

from .const import DOMAIN, SIGNAL_DATA_UPDATED
from .geo import MapFormatError, parse_map
from .species import SourcesUnavailable, combine, search_local, search_remote
from .store import get_store

# The websocket accepts messages up to 4 MB; base64 adds a third.
MAX_MAP_BYTES = 2 * 1024 * 1024

SEARCH_CACHE = f"{DOMAIN}_species_cache"
SEARCH_CACHE_TTL_S = 24 * 3600
SEARCH_CACHE_SIZE = 200


@callback
def async_register_websocket(hass: HomeAssistant) -> None:
    websocket_api.async_register_command(hass, ws_subscribe)
    websocket_api.async_register_command(hass, ws_parse_map)
    websocket_api.async_register_command(hass, ws_search_species)


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
        vol.Required("type"): "homestead/parse_map",
        vol.Required("filename"): str,
        vol.Required("content"): str,
    }
)
@websocket_api.async_response
async def ws_parse_map(
    hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]
) -> None:
    """Read a KML, KMZ or GeoJSON file (base64) and return its points and polygons."""
    try:
        content = base64.b64decode(msg["content"], validate=True)
    except (binascii.Error, ValueError):
        connection.send_error(msg["id"], "invalid_format", "invalid base64 content")
        return
    if len(content) > MAX_MAP_BYTES:
        connection.send_error(msg["id"], "invalid_format", "file too large (max 2 MB)")
        return
    try:
        features, skipped = await hass.async_add_executor_job(parse_map, msg["filename"], content)
    except MapFormatError as err:
        connection.send_error(msg["id"], "invalid_format", str(err))
        return
    connection.send_result(msg["id"], {"features": features, "skipped": skipped})


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
