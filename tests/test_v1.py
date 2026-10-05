import base64

import pytest
from homeassistant.core import HomeAssistant
from homeassistant.exceptions import ServiceValidationError
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.homestead.const import DOMAIN
from custom_components.homestead.photos import image_type, photo_dir

JPEG = b"\xff\xd8\xff\xe0" + b"\x00" * 64
PNG = b"\x89PNG\r\n\x1a\n" + b"\x00" * 64


async def _setup(hass: HomeAssistant, tmp_path) -> MockConfigEntry:
    hass.config.media_dirs = {"local": str(tmp_path)}
    entry = MockConfigEntry(domain=DOMAIN, title="HA Homestead")
    entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    return entry


async def _call(hass: HomeAssistant, service: str, data: dict) -> str:
    return (await hass.services.async_call(DOMAIN, service, data, blocking=True, return_response=True))["id"]


def test_image_type():
    assert image_type(JPEG) == ("jpg", "image/jpeg")
    assert image_type(PNG) == ("png", "image/png")
    assert image_type(b"RIFF\x00\x00\x00\x00WEBPVP8 ") == ("webp", "image/webp")
    assert image_type(b"RIFF\x00\x00\x00\x00WAVE") is None
    assert image_type(b"<svg onload=alert(1)>") is None


async def test_expense_and_tool_edit_delete(hass: HomeAssistant, tmp_path) -> None:
    entry = await _setup(hass, tmp_path)
    data = entry.runtime_data.data
    tool = await _call(hass, "add_tool", {"name": "Seghetto", "price": 30, "purchased_on": "2026-02-01"})
    [expense] = data.expenses
    await _call(
        hass, "update_expense", {"id": expense, "amount": 32.5, "supplier": "Brico", "spent_on": "2026-02-03"}
    )
    assert (data.expenses[expense].amount, data.expenses[expense].spent_on) == (32.5, "2026-02-03")
    await _call(hass, "update_tool", {"id": tool, "status": "needs_service", "next_service_on": None})
    assert data.tools[tool].status == "needs_service"
    await _call(hass, "delete_tool", {"id": tool})
    assert data.expenses[expense].tool_id is None
    await _call(hass, "delete_expense", {"id": expense})
    assert not data.expenses
    with pytest.raises(ServiceValidationError):
        await _call(hass, "delete_expense", {"id": expense})


async def test_photo_upload_serve_delete(hass: HomeAssistant, tmp_path, hass_ws_client, hass_client) -> None:
    entry = await _setup(hass, tmp_path)
    planting = await _call(hass, "add_planting", {"name": "Melo", "species": "Malus domestica"})
    ws = await hass_ws_client(hass)

    await ws.send_json(
        {
            "id": 1,
            "type": "homestead/photo/upload",
            "planting_id": planting,
            "content": base64.b64encode(JPEG).decode(),
        }
    )
    photo_id = (await ws.receive_json())["result"]["id"]
    photo = entry.runtime_data.data.photos[photo_id]
    assert photo.file == f"{planting}/{photo_id}.jpg" and photo.taken_on
    assert (photo_dir(hass) / photo.file).read_bytes() == JPEG

    client = await hass_client()
    response = await client.get(f"/api/homestead/photo/{photo_id}")
    assert response.status == 200 and await response.read() == JPEG
    assert (await client.get("/api/homestead/photo/nope")).status == 404

    await ws.send_json(
        {"id": 2, "type": "homestead/photo/upload", "planting_id": planting, "content": "PHN2Zz4="}
    )
    assert (await ws.receive_json())["error"]["code"] == "invalid_format"
    await ws.send_json({"id": 3, "type": "homestead/photo/upload", "planting_id": "nope", "content": ""})
    assert (await ws.receive_json())["error"]["code"] == "not_found"

    await _call(hass, "delete_photo", {"id": photo_id})
    assert not (photo_dir(hass) / photo.file).exists()


async def test_photos_follow_planting_and_entry_removal(
    hass: HomeAssistant, tmp_path, hass_ws_client
) -> None:
    entry = await _setup(hass, tmp_path)
    planting = await _call(hass, "add_planting", {"name": "Melo", "species": "Malus domestica"})
    ws = await hass_ws_client(hass)
    for msg_id in (1, 2):
        content = base64.b64encode(PNG).decode()
        await ws.send_json(
            {"id": msg_id, "type": "homestead/photo/upload", "planting_id": planting, "content": content}
        )
        await ws.receive_json()
    assert len(list(photo_dir(hass).rglob("*.png"))) == 2
    await _call(hass, "delete_planting", {"id": planting})
    assert not entry.runtime_data.data.photos and not list(photo_dir(hass).rglob("*.png"))

    await hass.config_entries.async_remove(entry.entry_id)
    await hass.async_block_till_done()
    assert not photo_dir(hass).exists()
