"""0.22.1: a photo of the round creates its diary event only once the file is on disk."""

import aiohttp
from homeassistant.core import HomeAssistant
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.homestead.const import DOMAIN
from custom_components.homestead.photos import photo_dir

JPEG = b"\xff\xd8\xff\xe0" + b"\x00" * 64


async def test_upload_creates_the_photo_event(hass: HomeAssistant, tmp_path, hass_client) -> None:
    hass.config.media_dirs = {"local": str(tmp_path / "local")}
    entry = MockConfigEntry(domain=DOMAIN, title="HA Homestead")
    entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    store = entry.runtime_data
    zone_id = (
        await hass.services.async_call(
            DOMAIN, "add_zone", {"name": "Orto"}, blocking=True, return_response=True
        )
    )["id"]
    client = await hass_client()

    def form(**fields) -> aiohttp.FormData:
        data = aiohttp.FormData()
        for key, value in fields.items():
            data.add_field(key, value)
        data.add_field("file", JPEG, filename="shot.jpg", content_type="image/jpeg")
        return data

    response = await client.post(
        "/api/homestead/photo/upload", data=form(zone_id=zone_id, done_on="2026-11-22")
    )
    assert response.status == 200
    body = await response.json()
    event = store.data.events[body["event_id"]]
    assert (event.kind, event.zone_id, event.done_on) == ("photo", zone_id, "2026-11-22")
    photo = store.data.photos[body["id"]]
    assert photo.event_id == event.id
    assert (photo_dir(hass) / photo.file).read_bytes() == JPEG

    # An unknown zone or a bad day: refused, and no event left behind.
    before = len(store.data.events)
    for fields in ({"zone_id": "nope", "done_on": "2026-11-22"}, {"zone_id": zone_id, "done_on": "22/11"}):
        assert (await client.post("/api/homestead/photo/upload", data=form(**fields))).status == 400
    assert len(store.data.events) == before
