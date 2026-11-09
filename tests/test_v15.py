from datetime import date

import aiohttp
from freezegun.api import FrozenDateTimeFactory
from homeassistant.core import HomeAssistant
from homeassistant.util import dt as dt_util
from pytest_homeassistant_custom_component.common import MockConfigEntry, async_fire_time_changed

from custom_components.homestead.const import CONF_PHOTO_MEDIA, DOMAIN
from custom_components.homestead.models import PhotoPlan
from custom_components.homestead.photos import photo_dir

JPEG = b"\xff\xd8\xff\xe0" + b"\x00" * 64
THUMB = b"\xff\xd8\xff\xe0thumb"


async def _setup(hass: HomeAssistant, tmp_path, options: dict | None = None) -> MockConfigEntry:
    hass.config.media_dirs = {"local": str(tmp_path / "local"), "nas": str(tmp_path / "nas")}
    entry = MockConfigEntry(domain=DOMAIN, title="HA Homestead", options=options or {})
    entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    return entry


async def _call(hass: HomeAssistant, service: str, data: dict) -> dict:
    return await hass.services.async_call(DOMAIN, service, data, blocking=True, return_response=True)


def test_plan_windows() -> None:
    plan = PhotoPlan(periods=[{"month": 11, "part": "start"}, {"month": 5, "part": "mid"}])
    assert plan.window_at(date(2026, 11, 4)) == (date(2026, 11, 1), date(2026, 11, 14))
    assert plan.window_at(date(2026, 11, 20)) is None
    assert plan.next_window(date(2026, 11, 20)) == (date(2027, 5, 11), date(2027, 5, 24))
    weekly = PhotoPlan(every_weeks=4, start_on="2026-10-01")
    assert weekly.window_at(date(2026, 10, 30)) == (date(2026, 10, 29), date(2026, 11, 11))
    assert weekly.next_window(date(2026, 11, 4)) == (date(2026, 11, 26), date(2026, 12, 9))


async def test_photo_plan_tasks(hass: HomeAssistant, tmp_path, freezer: FrozenDateTimeFactory) -> None:
    await hass.config.async_set_time_zone("Europe/Rome")
    freezer.move_to(dt_util.as_utc(dt_util.parse_datetime("2026-11-04T10:00:00+01:00")))
    entry = await _setup(hass, tmp_path, {CONF_PHOTO_MEDIA: "nas"})
    data = entry.runtime_data.data
    orto = (await _call(hass, "add_zone", {"name": "Orto", "kind": "vegetable_garden"}))["id"]
    melo = (await _call(hass, "add_planting", {"name": "Melo", "species": "Malus domestica"}))["id"]
    pero = (await _call(hass, "add_planting", {"name": "Pero", "species": "Pyrus communis"}))["id"]
    plan = {"zone_ids": [orto], "planting_ids": [melo, pero], "periods": [{"month": 11}, {"month": 5}]}
    result = await _call(hass, "set_photo_plan", plan)
    assert result["next"] == "2026-11-01"
    # Inside "early November": one list task for the period, not two.
    [task] = [t for t in data.tasks.values() if t.kind == "photo"]
    assert (task.due_on, task.due_until, task.zone_ids, task.planting_ids) == (
        "2026-11-01",
        "2026-11-14",
        [orto],
        [melo, pero],
    )
    await _call(hass, "set_photo_plan", plan)
    assert len([t for t in data.tasks.values() if t.kind == "photo"]) == 1

    # The photo of the vegetable garden: an event of the zone ticks it.
    await _call(hass, "add_event", {"kind": "photo", "zone_id": orto, "task_id": task.id})
    assert task.done_ids == [orto] and not task.done_on

    # The pear tree dies: out of the plan and of the open task; the apple tree is skipped this time.
    death = {"kind": "removal", "planting_id": pero, "reason": "died", "cause": "frost"}
    await _call(hass, "add_event", death)
    assert data.photo_plans[result["id"]].planting_ids == [melo] and task.planting_ids == [melo]
    assert (await _call(hass, "complete_task", {"id": task.id, "items": [melo]}))["ids"] == []
    assert task.done_on

    # Mid-May opens the next period just after midnight.
    freezer.move_to(dt_util.as_utc(dt_util.parse_datetime("2027-05-01T00:05:00+02:00")))
    async_fire_time_changed(hass)
    await hass.async_block_till_done()
    [may] = [t for t in data.tasks.values() if t.kind == "photo" and t.due_on == "2027-05-01"]
    assert may.planting_ids == [melo] and may.zone_ids == [orto]


async def test_originals_upload_and_removal(
    hass: HomeAssistant, tmp_path, hass_client, hass_ws_client
) -> None:
    entry = await _setup(hass, tmp_path, {CONF_PHOTO_MEDIA: "nas"})
    data = entry.runtime_data.data
    orto = (await _call(hass, "add_zone", {"name": "Orto"}))["id"]
    event = (await _call(hass, "add_event", {"kind": "photo", "zone_id": orto}))["id"]
    client = await hass_client()
    form = aiohttp.FormData()
    form.add_field("event_id", event)
    form.add_field("file", JPEG, filename="IMG_0001.jpg", content_type="image/jpeg")
    form.add_field("thumb", THUMB, filename="thumb.jpg", content_type="image/jpeg")
    response = await client.post("/api/homestead/photo/upload", data=form)
    assert response.status == 200
    photo = data.photos[(await response.json())["id"]]
    # Kept as it came, in the media folder of the options (the NAS here).
    assert photo.root == "nas" and photo.event_id == event
    assert (photo_dir(hass, "nas") / photo.file).read_bytes() == JPEG
    assert await (await client.get(f"/api/homestead/photo/{photo.id}")).read() == JPEG
    assert await (await client.get(f"/api/homestead/photo/{photo.id}/thumb")).read() == THUMB
    bad = aiohttp.FormData()
    bad.add_field("event_id", event)
    bad.add_field("file", b"<svg/>", filename="x.svg")
    assert (await client.post("/api/homestead/photo/upload", data=bad)).status == 400

    # Removing the integration keeps the photos and leaves a backup next to them...
    assert await hass.config_entries.async_remove(entry.entry_id)
    await hass.async_block_till_done()
    assert (photo_dir(hass, "nas") / photo.file).read_bytes() == JPEG
    assert (photo_dir(hass) / "homestead-last-backup.json").is_file()

    # ...that adding it again offers and restores, photos included.
    entry = await _setup(hass, tmp_path, {CONF_PHOTO_MEDIA: "nas"})
    assert not entry.runtime_data.data.zones
    ws = await hass_ws_client(hass)
    await ws.send_json({"id": 1, "type": "homestead/backup/last"})
    last = (await ws.receive_json())["result"]
    assert last["counts"]["zones"] == 1 and last["counts"]["photos"] == 1
    await ws.send_json({"id": 2, "type": "homestead/backup/restore_last"})
    assert (await ws.receive_json())["result"]["photos"] == 1
    assert entry.runtime_data.data.photos[photo.id].root == "nas"
    assert entry.runtime_data.data.zones[orto].name == "Orto"
