"""Plant photos: files under the HA media folder, served only to logged-in users."""

from __future__ import annotations

import shutil
from http import HTTPStatus
from pathlib import Path

from aiohttp import web
from homeassistant.components.http import HomeAssistantView
from homeassistant.core import HomeAssistant

from .const import DOMAIN
from .store import get_store

MAX_PHOTO_BYTES = 3 * 1024 * 1024
TYPES = {
    b"\xff\xd8\xff": ("jpg", "image/jpeg"),
    b"\x89PNG": ("png", "image/png"),
    b"RIFF": ("webp", "image/webp"),
}


def photo_dir(hass: HomeAssistant) -> Path:
    """`/media/homestead` on HA OS (included in HA backups with the media folder)."""
    media = hass.config.media_dirs.get("local") or hass.config.path("media")
    return Path(media) / DOMAIN


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


def delete_all(folder: Path) -> None:
    shutil.rmtree(folder, ignore_errors=True)


class PhotoView(HomeAssistantView):
    """`/api/homestead/photo/<id>`: needs auth; the panel uses signed paths for <img>."""

    url = "/api/homestead/photo/{photo_id}"
    name = "api:homestead:photo"
    requires_auth = True

    def __init__(self, hass: HomeAssistant) -> None:
        self.hass = hass

    async def get(self, request: web.Request, photo_id: str) -> web.StreamResponse:
        store = get_store(self.hass)
        photo = store.data.photos.get(photo_id) if store else None
        if photo is None:
            return web.Response(status=HTTPStatus.NOT_FOUND)
        folder = photo_dir(self.hass)
        path = (folder / photo.file).resolve()
        if folder.resolve() not in path.parents or not await self.hass.async_add_executor_job(path.is_file):
            return web.Response(status=HTTPStatus.NOT_FOUND)
        return web.FileResponse(path, headers={"Cache-Control": "private, max-age=86400"})
