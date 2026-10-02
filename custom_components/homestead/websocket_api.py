"""Websocket commands used by the sidebar panel."""

from __future__ import annotations

import base64
import binascii
from typing import Any

import voluptuous as vol
from homeassistant.components import websocket_api
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.dispatcher import async_dispatcher_connect

from .const import SIGNAL_DATA_UPDATED
from .geo import MapFormatError, parse_map
from .store import get_store

# The websocket accepts messages up to 4 MB; base64 adds a third.
MAX_MAP_BYTES = 2 * 1024 * 1024


@callback
def async_register_websocket(hass: HomeAssistant) -> None:
    websocket_api.async_register_command(hass, ws_subscribe)
    websocket_api.async_register_command(hass, ws_parse_map)


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
