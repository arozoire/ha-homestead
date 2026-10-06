"""Crop profiles: exposure, hardiness and calendar months (no Home Assistant dependency).

A small built-in table (``data/crops.json``, indicative values for a temperate climate) gives
the defaults; the user's corrections are stored as ``CropProfile`` records and win.
"""

from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any

DEFAULTS_FILE = Path(__file__).parent / "data" / "crops.json"
TRAITS = (
    "exposure",
    "hardiness_c",
    "sow_indoor",
    "sow_outdoor",
    "plant_out",
    "flowering",
    "harvest",
    "spacing_cm",
    "heat_max_c",
)


def load_defaults() -> dict[str, dict[str, Any]]:
    """Blocking: read the built-in table, keyed by normalized name."""
    raw = json.loads(DEFAULTS_FILE.read_text(encoding="utf-8"))
    return {normalize(name): {"species": name, **traits} for name, traits in raw["crops"].items()}


def normalize(name: str | None) -> str:
    """'Citrus x limon', 'Citrus × limon' → 'citrus limon'; only genus and species count."""
    words = re.sub(r"\s[x×]\s|×", " ", (name or "").lower()).split()
    return " ".join(words[:2])


def crop_traits(
    name: str | None, table: dict[str, dict[str, Any]], profiles: list[Any]
) -> dict[str, Any] | None:
    """The user's values for the species, else the built-in ones."""
    key = normalize(name)
    mine = next((p for p in profiles if normalize(p.species) == key), None) if key else None
    if mine is not None:
        return {trait: getattr(mine, trait, None) for trait in TRAITS}
    return lookup(name, table)


def lookup(name: str | None, table: dict[str, dict[str, Any]]) -> dict[str, Any] | None:
    """Exact species first, then a genus-level entry (e.g. 'Rosa' for 'Rosa canina')."""
    key = normalize(name)
    if not key:
        return None
    return table.get(key) or table.get(key.split()[0])
