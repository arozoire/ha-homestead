"""Backup with the photos: a .zip with ``backup.json`` and every photo file, streamed both ways.

The JSON backup has only the photo records (path, folder, thumbnail); this one carries the files too,
so a garden moves to a new Home Assistant, or survives removing and adding the integration again.
Layout: ``backup.json`` and ``photos/<media folder>/<file>`` for each photo and its thumbnail.
"""

from __future__ import annotations

import asyncio
import io
import json
import tempfile
import zipfile
from http import HTTPStatus
from pathlib import Path
from typing import Any

from aiohttp import web
from homeassistant.components.http import HomeAssistantView
from homeassistant.core import HomeAssistant
from homeassistant.loader import async_get_integration
from homeassistant.util import dt as dt_util

from .backup import BackupError, make_backup, read_backup, summary
from .const import DOMAIN
from .models import HomesteadData, Photo
from .photos import photo_dir
from .store import get_store

BACKUP_JSON = "backup.json"
# Written next to the photos when the integration is removed; offered back when it is added again.
LAST_BACKUP = "homestead-last-backup.json"
MAX_ZIP_BYTES = 8 * 1024**3
CHUNK = 1024 * 1024


def write_last_backup(hass: HomeAssistant, backup: dict[str, Any]) -> None:
    folder = photo_dir(hass)
    folder.mkdir(parents=True, exist_ok=True)
    (folder / LAST_BACKUP).write_text(json.dumps(backup, ensure_ascii=False, indent=1), encoding="utf-8")


def read_last_backup(hass: HomeAssistant) -> dict[str, Any] | None:
    path = photo_dir(hass) / LAST_BACKUP
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return None


def keep_existing_photos(hass: HomeAssistant, data: HomesteadData) -> None:
    """The JSON has no image bytes: keep only the photo records whose file is on this instance."""
    data.photos = {i: p for i, p in data.photos.items() if (photo_dir(hass, p.root) / p.file).is_file()}


def zip_name(photo_root: str | None, name: str) -> str:
    return f"photos/{photo_root or 'local'}/{name}"


def _photo_files(hass: HomeAssistant, photos: list[Photo]) -> list[tuple[Path, str]]:
    """(file on disk, name in the zip) of every photo and thumbnail still on the disk."""
    out = []
    for photo in photos:
        folder = photo_dir(hass, photo.root)
        for name in filter(None, (photo.file, photo.thumb)):
            path = folder / name
            if path.is_file():
                out.append((path, zip_name(photo.root, name)))
    return out


class _Pipe(io.RawIOBase):
    """File-like object the zip is written to, from the executor, into the HTTP response."""

    def __init__(self, loop: asyncio.AbstractEventLoop, response: web.StreamResponse) -> None:
        self._loop = loop
        self._response = response

    def writable(self) -> bool:
        return True

    def write(self, data: Any) -> int:
        chunk = bytes(data)
        asyncio.run_coroutine_threadsafe(self._response.write(chunk), self._loop).result()
        return len(chunk)


def write_zip(target: Any, backup: dict[str, Any], files: list[tuple[Path, str]]) -> None:
    with zipfile.ZipFile(target, "w") as archive:
        archive.writestr(BACKUP_JSON, json.dumps(backup, ensure_ascii=False, indent=1), zipfile.ZIP_DEFLATED)
        for path, name in files:
            # Photos are already compressed: stored as they are, quickly.
            archive.write(path, name, zipfile.ZIP_STORED)


def _inside(folder: Path, name: str) -> Path | None:
    path = (folder / name).resolve()
    return path if folder.resolve() in path.parents else None


def restore_zip(hass: HomeAssistant, source: Path) -> HomesteadData:
    """Read the backup and put its photos back. Touches the disk: run in the executor."""
    try:
        archive = zipfile.ZipFile(source)
    except zipfile.BadZipFile as err:
        raise BackupError("not a zip file") from err
    with archive:
        try:
            raw = json.loads(archive.read(BACKUP_JSON))
        except (KeyError, ValueError) as err:
            raise BackupError(f"no valid {BACKUP_JSON} in the zip") from err
        data = read_backup(raw)
        names = set(archive.namelist())
        for photo in data.photos.values():
            source_root = photo.root
            # A media folder this instance does not have (a NAS not added yet): the local one.
            if photo.root and photo.root not in hass.config.media_dirs:
                photo.root = None
            folder = photo_dir(hass, photo.root)
            for name in filter(None, (photo.file, photo.thumb)):
                entry = zip_name(source_root, name)
                target = _inside(folder, name)
                if entry not in names or target is None:
                    continue
                target.parent.mkdir(parents=True, exist_ok=True)
                with archive.open(entry) as src, target.open("wb") as dst:
                    while chunk := src.read(CHUNK):
                        dst.write(chunk)
        keep_existing_photos(hass, data)
    return data


class BackupZipView(HomeAssistantView):
    """`GET /api/homestead/backup.zip`: all the data and the photo files (the panel uses a signed path)."""

    url = "/api/homestead/backup.zip"
    name = "api:homestead:backup_zip"
    requires_auth = True

    def __init__(self, hass: HomeAssistant) -> None:
        self.hass = hass

    async def get(self, request: web.Request) -> web.StreamResponse:
        if (store := get_store(self.hass)) is None:
            return web.Response(status=HTTPStatus.SERVICE_UNAVAILABLE)
        now = dt_util.now()
        version = str((await async_get_integration(self.hass, DOMAIN)).version)
        backup = make_backup(store.data, now.isoformat(), version)
        files = await self.hass.async_add_executor_job(
            _photo_files, self.hass, list(store.data.photos.values())
        )
        response = web.StreamResponse(
            headers={
                "Content-Type": "application/zip",
                "Content-Disposition": f'attachment; filename="homestead-backup-{now.date()}.zip"',
            }
        )
        await response.prepare(request)
        await self.hass.async_add_executor_job(write_zip, _Pipe(self.hass.loop, response), backup, files)
        await response.write_eof()
        return response


class BackupZipImportView(HomeAssistantView):
    """`POST /api/homestead/backup/import`: a backup .zip (field ``file``) replaces all (admin only)."""

    url = "/api/homestead/backup/import"
    name = "api:homestead:backup_import"
    requires_auth = True

    def __init__(self, hass: HomeAssistant) -> None:
        self.hass = hass

    async def post(self, request: web.Request) -> web.Response:
        if not request["hass_user"].is_admin:
            return web.Response(status=HTTPStatus.UNAUTHORIZED)
        if (store := get_store(self.hass)) is None:
            return web.Response(status=HTTPStatus.SERVICE_UNAVAILABLE)
        temp = await self.hass.async_add_executor_job(
            lambda: tempfile.NamedTemporaryFile(prefix="homestead-", suffix=".zip", delete=False)
        )
        path = Path(temp.name)
        try:
            size = 0
            reader = await request.multipart()
            while (part := await reader.next()) is not None:
                if part.name != "file":
                    continue
                while chunk := await part.read_chunk(CHUNK):
                    size += len(chunk)
                    if size > MAX_ZIP_BYTES:
                        return web.Response(status=HTTPStatus.REQUEST_ENTITY_TOO_LARGE)
                    await self.hass.async_add_executor_job(temp.write, chunk)
            await self.hass.async_add_executor_job(temp.close)
            try:
                data = await self.hass.async_add_executor_job(restore_zip, self.hass, path)
            except BackupError as err:
                return web.Response(status=HTTPStatus.BAD_REQUEST, text=str(err))
            store.data = data
            await store.async_save()
            return self.json(summary(data))
        finally:
            await self.hass.async_add_executor_job(lambda: (temp.close(), path.unlink(missing_ok=True)))
