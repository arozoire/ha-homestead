"""Backup file of all HA Homestead data: create and validate (no Home Assistant dependency)."""

from __future__ import annotations

from typing import Any

from .geo import validate_polygon
from .models import _COLLECTIONS, HomesteadData

FORMAT = "ha-homestead-backup"
VERSION = 1

# Fields a record cannot do without; everything else has a default.
REQUIRED = {
    "zones": ("name",),
    "taxa": ("scientific_name",),
    "plantings": ("name", "species"),
    "expenses": ("spent_on", "amount", "category"),
    "tools": ("name",),
}

# (collection, field, referenced collection): dangling references are cleared.
REFERENCES = (
    ("zones", "parent_id", "zones"),
    ("plantings", "zone_id", "zones"),
    ("plantings", "taxon_id", "taxa"),
    ("expenses", "planting_id", "plantings"),
    ("expenses", "tool_id", "tools"),
)


class BackupError(ValueError):
    """The file is not a valid HA Homestead backup."""


def make_backup(data: HomesteadData, exported_at: str, version: str) -> dict[str, Any]:
    return {
        "format": FORMAT,
        "version": VERSION,
        "integration_version": version,
        "exported_at": exported_at,
        "data": data.to_dict(),
    }


def read_backup(raw: Any) -> HomesteadData:
    if not isinstance(raw, dict) or raw.get("format") != FORMAT:
        raise BackupError("not an HA Homestead backup")
    if not isinstance(raw.get("version"), int) or raw["version"] > VERSION:
        raise BackupError("backup made by a newer version: update HA Homestead first")
    content = raw.get("data")
    if not isinstance(content, dict):
        raise BackupError("backup without data")

    for name in _COLLECTIONS:
        items = content.get(name, [])
        if not isinstance(items, list):
            raise BackupError(f"{name}: expected a list")
        ids = set()
        for item in items:
            if not isinstance(item, dict) or not isinstance(item.get("id"), str) or not item["id"]:
                raise BackupError(f"{name}: every element needs an id")
            if item["id"] in ids:
                raise BackupError(f"{name}: duplicate id {item['id']}")
            ids.add(item["id"])
            missing = [field for field in REQUIRED.get(name, ()) if item.get(field) in (None, "")]
            if missing:
                raise BackupError(f"{name} {item['id']}: missing {', '.join(missing)}")
            if name == "zones" and item.get("geometry") is not None:
                try:
                    item["geometry"] = validate_polygon(item["geometry"])
                except ValueError as err:
                    raise BackupError(f"zone {item['id']}: {err}") from err

    try:
        data = HomesteadData.from_dict(content)
    except (TypeError, ValueError) as err:
        raise BackupError(f"invalid values: {err}") from err

    for collection, field, target in REFERENCES:
        known = getattr(data, target)
        for record in getattr(data, collection).values():
            if getattr(record, field) and getattr(record, field) not in known:
                setattr(record, field, None)
    return data


def summary(data: HomesteadData) -> dict[str, int]:
    return {name: len(getattr(data, name)) for name in _COLLECTIONS}
