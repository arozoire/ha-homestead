"""Crop profiles: exposure, hardiness and calendar months (no Home Assistant dependency).

A small built-in table (``data/crops.json``, indicative values for a temperate climate) gives
the defaults; the user's corrections are stored as ``CropProfile`` records and win.
"""

from __future__ import annotations

import json
import re
from datetime import date, timedelta
from pathlib import Path
from typing import Any

DEFAULTS_FILE = Path(__file__).parent / "data" / "crops.json"
CROPGRAPH_FILE = Path(__file__).parent / "data" / "cropgraph.json"
# Without enough history: typical dates for the plains of northern Italy.
FALLBACK_FROST = {"last_spring": "04-10", "first_fall": "10-31"}
ANNUAL_CATEGORIES = {"vegetable", "herb", "legume", "root", "flower", "grain"}
COOL_HEAT_MAX = 30
# Woody habit by genus: CropGraph only says "fruit, perennial" for an apple, a raspberry and a vine.
GENUS_TYPES: dict[str, str] = {
    **dict.fromkeys(
        "malus pyrus prunus cydonia citrus fortunella ficus olea juglans castanea diospyros eriobotrya "
        "mespilus morus punica persea mangifera carya pistacia ziziphus annona feijoa acca sorbus".split(),
        "fruit_tree",
    ),
    **dict.fromkeys(
        "corylus rubus ribes vaccinium sambucus aronia hippophae elaeagnus rosa buxus hydrangea viburnum "
        "forsythia syringa philadelphus spiraea weigela berberis cotoneaster pyracantha photinia ligustrum "
        "pittosporum camellia rhododendron azalea hibiscus nerium myrtus laurus".split(),
        "shrub",
    ),
    **dict.fromkeys(
        "vitis actinidia passiflora wisteria hedera clematis jasminum trachelospermum lonicera "
        "parthenocissus bougainvillea humulus".split(),
        "vine",
    ),
    **dict.fromkeys(
        "quercus fagus acer pinus abies picea larix betula fraxinus tilia ulmus populus salix carpinus "
        "platanus cedrus cupressus magnolia robinia alnus aesculus celtis paulownia catalpa liquidambar "
        "ginkgo sequoia ostrya cercis albizia lagerstroemia".split(),
        "tree",
    ),
    # Herbaceous crops grown in the vegetable garden although CropGraph files them under fruit.
    **dict.fromkeys("fragaria rheum asparagus cynara cucumis citrullus physalis".split(), "vegetable"),
}
CATEGORY_TYPES = {
    "vegetable": "vegetable",
    "root": "vegetable",
    "legume": "vegetable",
    "grain": "vegetable",
    "sprout": "vegetable",
    "herb": "herb",
    "medicinal": "herb",
    "flower": "flower",
}
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
    "pruning",
    "fertilizing",
    "end",
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


def load_cropgraph() -> dict[str, dict[str, Any]]:
    """Blocking: the CropGraph extract, keyed like ``normalize``."""
    return json.loads(CROPGRAPH_FILE.read_text(encoding="utf-8"))["crops"]


def _months(start: date, end: date) -> set[int]:
    months, day = set(), start.replace(day=1)
    while day <= end and len(months) < 12:
        months.add(day.month)
        day = (day + timedelta(days=32)).replace(day=1)
    return months


def cropgraph_traits(entry: dict[str, Any], frost: dict[str, str | None] | None) -> dict[str, Any]:
    """Months from frost-anchored windows: sowing indoors/outdoors, planting out, harvest (annuals)."""
    frost = {**FALLBACK_FROST, **{k: v for k, v in (frost or {}).items() if v}}
    year = 2025
    anchors = {
        "s": date.fromisoformat(f"{year}-{frost['last_spring']}"),
        "f": date.fromisoformat(f"{year}-{frost['first_fall']}"),
    }
    keys = {"i": "sow_indoor", "s": "sow_outdoor", "t": "plant_out"}
    months: dict[str, set[int]] = {key: set() for key in keys.values()}
    harvest: set[int] = set()
    annual = entry.get("c") in ANNUAL_CATEGORIES and entry.get("s") in ("warm", "cool")
    days = entry.get("d")
    for action, anchor, start, end in entry.get("w") or []:
        first = anchors[anchor] + timedelta(days=start)
        last = anchors[anchor] + timedelta(days=end)
        months[keys[action]] |= _months(first, last)
        if annual and days and action in ("s", "t"):
            ripe_from, ripe_to = first + timedelta(days=days[0]), last + timedelta(days=days[1])
            # Warm crops die at the first frost; cool ones last a few weeks longer.
            limit = anchors["f"] + timedelta(days=0 if entry["s"] == "warm" else 30)
            if ripe_from <= limit:
                harvest |= _months(ripe_from, min(ripe_to, limit))
    out: dict[str, Any] = {key: sorted(value) for key, value in months.items() if value}
    if harvest:
        out["harvest"] = sorted(harvest)
    if entry.get("s") == "cool":
        out["heat_max_c"] = COOL_HEAT_MAX
    if entry.get("s") == "warm":
        out["warm"] = True
    if entry.get("t") is not None:
        out["min_soil_c"] = entry["t"]
    return out


def plant_type(name: str | None, category: str | None = None) -> str | None:
    """Tree, fruit tree, shrub, vine from the genus; vegetable, herb, flower from the CropGraph category."""
    genus = normalize(name).split(" ")[0] if name else ""
    return GENUS_TYPES.get(genus) or CATEGORY_TYPES.get(category or "")


def _last_month(months: list[int]) -> int | None:
    """End of a season that may cross the new year (e.g. 9-12 then 1-3 → 3)."""
    if not months:
        return None
    ordered = sorted(months)
    gaps = [b - a for a, b in zip(ordered, ordered[1:], strict=False)]
    if gaps and max(gaps) > 1:
        return ordered[gaps.index(max(gaps))]
    return ordered[-1]


def full_table(
    mine: dict[str, dict[str, Any]], cropgraph: dict[str, dict[str, Any]], frost: dict | None
) -> dict[str, dict[str, Any]]:
    """The built-in table completed by CropGraph: months for missing species, family, companions."""
    table: dict[str, dict[str, Any]] = {key: {**value, "source": "builtin"} for key, value in mine.items()}
    for key, entry in cropgraph.items():
        extra: dict[str, Any] = {"name_en": entry.get("n")}
        if kind := plant_type(key, entry.get("c")):
            extra["plant_type"] = kind
        if (family := entry.get("f")) and family != "Various":
            extra["family"] = family
        for field, target in (("g", "good"), ("x", "bad")):
            if entry.get(field):
                extra[target] = entry[field]  # keys: the panel shows names the user knows
        if key in table:
            for name, value in {**cropgraph_traits(entry, frost), **extra}.items():
                table[key].setdefault(name, value)
            continue
        genus, species = key.split(" ", 1)
        table[key] = {
            "species": f"{genus.capitalize()} {species}",
            **cropgraph_traits(entry, frost),
            **extra,
            "source": "cropgraph",
        }
    for key, value in table.items():
        if "plant_type" not in value and (kind := plant_type(key)):
            value["plant_type"] = kind
        if "end" not in value and value.get("warm") and (last := _last_month(value.get("harvest") or [])):
            value["end"] = [last % 12 + 1]
    return table
