"""Photos: files under an HA media folder, served only to logged-in users.

Plant and event photos come shrunk by the panel; the photo plan keeps the originals, in the media
folder chosen in the options (a NAS added in Settings → System → Storage, for example)."""

from __future__ import annotations

import shutil
from http import HTTPStatus
from pathlib import Path

from aiohttp import web
from homeassistant.components.http import HomeAssistantView
from homeassistant.core import HomeAssistant

from .const import CONF_PHOTO_MEDIA, DOMAIN
from .models import Photo
from .store import get_store

MAX_PHOTO_BYTES = 3 * 1024 * 1024
MAX_ORIGINAL_BYTES = 64 * 1024 * 1024
MAX_THUMB_BYTES = 1024 * 1024
TYPES = {
    b"\xff\xd8\xff": ("jpg", "image/jpeg"),
    b"\x89PNG": ("png", "image/png"),
    b"RIFF": ("webp", "image/webp"),
}


def photo_dir(hass: HomeAssistant, root: str | None = None) -> Path:
    """`/media/homestead` on HA OS (included in HA backups with the media folder), or another media folder."""
    dirs = hass.config.media_dirs
    media = dirs.get(root or "local") or dirs.get("local") or hass.config.path("media")
    return Path(media) / DOMAIN


def photo_roots(hass: HomeAssistant, photos) -> set[Path]:
    """Every homestead folder holding some of these photos, the local one included."""
    return {photo_dir(hass)} | {photo_dir(hass, p.root) for p in photos}


def image_type(content: bytes) -> tuple[str, str] | None:
    """(extension, content type) from the file signature, None if not an accepted image."""
    for magic, kind in TYPES.items():
        if content.startswith(magic) and (magic != b"RIFF" or content[8:12] == b"WEBP"):
            return kind
    return None


def write_photo(folder: Path, name: str, content: bytes) -> None:
    path = folder / name
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(content)


def delete_photo_file(folder: Path, name: str) -> None:
    (folder / name).unlink(missing_ok=True)


def delete_photo_files(folder: Path, photo: Photo) -> None:
    """The photo and its small copy."""
    for name in filter(None, (photo.file, photo.thumb)):
        delete_photo_file(folder, name)


def delete_all(folder: Path) -> None:
    shutil.rmtree(folder, ignore_errors=True)


def existing_photo(folder: Path, name: str) -> Path | None:
    """The photo file inside ``folder``, or None. Touches the disk: run in the executor."""
    path = (folder / name).resolve()
    if folder.resolve() not in path.parents or not path.is_file():
        return None
    return path


def write_original(
    folder: Path, name: str, content: bytes, thumb_name: str | None, thumb: bytes | None
) -> None:
    write_photo(folder, name, content)
    if thumb_name and thumb:
        write_photo(folder, thumb_name, thumb)


class PhotoView(HomeAssistantView):
    """`/api/homestead/photo/<id>`: needs auth; the panel uses signed paths for <img>."""

    url = "/api/homestead/photo/{photo_id}"
    name = "api:homestead:photo"
    requires_auth = True

    def __init__(self, hass: HomeAssistant) -> None:
        self.hass = hass

    async def get(self, request: web.Request, photo_id: str) -> web.StreamResponse:
        return await serve_photo(self.hass, photo_id, thumb=False)


class PhotoThumbView(HomeAssistantView):
    """`/api/homestead/photo/<id>/thumb`: the small copy of an original (the photo itself if none)."""

    url = "/api/homestead/photo/{photo_id}/thumb"
    name = "api:homestead:photo_thumb"
    requires_auth = True

    def __init__(self, hass: HomeAssistant) -> None:
        self.hass = hass

    async def get(self, request: web.Request, photo_id: str) -> web.StreamResponse:
        return await serve_photo(self.hass, photo_id, thumb=True)


async def serve_photo(hass: HomeAssistant, photo_id: str, thumb: bool) -> web.StreamResponse:
    store = get_store(hass)
    photo = store.data.photos.get(photo_id) if store else None
    if photo is None:
        return web.Response(status=HTTPStatus.NOT_FOUND)
    folder = photo_dir(hass, photo.root)
    name = photo.thumb if thumb and photo.thumb else photo.file
    path = await hass.async_add_executor_job(existing_photo, folder, name)
    if path is None:
        return web.Response(status=HTTPStatus.NOT_FOUND)
    return web.FileResponse(path, headers={"Cache-Control": "private, max-age=86400"})


class PhotoUploadView(HomeAssistantView):
    """`POST /api/homestead/photo/upload`: an original, as it came from the phone, for a diary event.

    Multipart fields: ``event_id``, ``file`` (the original) and ``thumb`` (a small JPEG the panel made).
    Streamed: a 50 MB picture never sits in a websocket message.
    """

    url = "/api/homestead/photo/upload"
    name = "api:homestead:photo_upload"
    requires_auth = True

    def __init__(self, hass: HomeAssistant) -> None:
        self.hass = hass

    async def post(self, request: web.Request) -> web.Response:
        store = get_store(self.hass)
        if store is None:
            return web.Response(status=HTTPStatus.SERVICE_UNAVAILABLE)
        fields: dict[str, bytes] = {}
        reader = await request.multipart()
        while (part := await reader.next()) is not None:
            limit = {"file": MAX_ORIGINAL_BYTES, "thumb": MAX_THUMB_BYTES}.get(part.name or "", 1024)
            content = bytearray()
            while chunk := await part.read_chunk():
                content += chunk
                if len(content) > limit:
                    return web.Response(status=HTTPStatus.REQUEST_ENTITY_TOO_LARGE)
            fields[part.name or ""] = bytes(content)
        event = store.data.events.get(fields.get("event_id", b"").decode(errors="ignore"))
        kind = image_type(fields.get("file", b""))
        if event is None or kind is None:
            return web.Response(status=HTTPStatus.BAD_REQUEST, text="event_id and a JPEG, PNG or WebP file")
        thumb = fields.get("thumb")
        if thumb and image_type(thumb) is None:
            thumb = None
        entries = self.hass.config_entries.async_entries(DOMAIN)
        root = entries[0].options.get(CONF_PHOTO_MEDIA) if entries else None
        if root not in self.hass.config.media_dirs:
            root = None
        target = event.zone_id or event.planting_id or "events"
        photo = Photo(file="", planting_id=event.planting_id, event_id=event.id, taken_on=event.done_on)
        photo.root = root
        photo.file = f"plan/{target}/{event.done_on}_{photo.id}.{kind[0]}"
        photo.thumb = f"plan/{target}/{event.done_on}_{photo.id}_thumb.jpg" if thumb else None
        await self.hass.async_add_executor_job(
            write_original, photo_dir(self.hass, root), photo.file, fields["file"], photo.thumb, thumb
        )
        store.data.photos[photo.id] = photo
        await store.async_save()
        return self.json({"id": photo.id})
