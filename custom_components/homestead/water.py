"""Water balance per zone and young trees to follow (pure: no Home Assistant).

Rain and reference evapotranspiration (ET₀, FAO) per day come from Open-Meteo: 1 mm = 1 l/m².
The deficit is what evaporated minus what fell since the last watering (at most a week back).
"""

from __future__ import annotations

from datetime import date, timedelta
from typing import Any

from .models import HomesteadData, PlantType, WateringMode, ZoneKind, mean_reading, zone_kind

WINDOW_DAYS = 7
DEFICIT_WATER = 15.0  # mm: water today
DEFICIT_SOON = 8.0  # mm: soon
RAIN_COMING = 5.0  # mm in the next two days: wait for it
SOIL_DRY = 25.0  # % soil moisture: dry whatever the balance says
SOIL_WET = 35.0
YOUNG_DAYS = 730  # two years from planting out (or transplanting), not the age of the plant
YOUNG_DRY_DAYS = 10
YOUNG_RAIN = 10.0  # mm in a day that waters a young tree
YOUNG_MONTHS = range(4, 11)  # April to October
YOUNG_TYPES = {PlantType.FRUIT_TREE, PlantType.TREE, PlantType.SHRUB, PlantType.VINE}
SKIPPED_ZONES = {ZoneKind.INDOOR, ZoneKind.COMPOST, ZoneKind.COOP, ZoneKind.WOODLAND}


def parse_water_days(raw: dict[str, Any]) -> list[dict[str, Any]]:
    """Open-Meteo ``daily`` with ``precipitation_sum`` and ``et0_fao_evapotranspiration``."""
    daily = raw.get("daily") or {}
    columns = {
        "rain_mm": "precipitation_sum",
        "et0_mm": "et0_fao_evapotranspiration",
        "t_max": "temperature_2m_max",
        "t_min": "temperature_2m_min",
    }
    days = []
    for i, day in enumerate(daily.get("time") or []):
        row: dict[str, Any] = {"date": day}
        for key, column in columns.items():
            values = daily.get(column) or []
            if column in daily or key in ("rain_mm", "et0_mm"):
                row[key] = _num(values[i]) if i < len(values) else None
        days.append(row)
    return days


def _num(value: Any) -> float | None:
    return round(float(value), 1) if isinstance(value, int | float) and not isinstance(value, bool) else None


def zone_mode(data: HomesteadData, zone_id: str | None) -> str | None:
    """How a zone is watered: its own setting, else the closest parent's."""
    seen: set[str] = set()
    while zone_id and zone_id not in seen and (zone := data.zones.get(zone_id)):
        if zone.watering:
            return zone.watering
        seen.add(zone_id)
        zone_id = zone.parent_id
    return None


def last_watering(data: HomesteadData, zone_ids: set[str], planting_ids: set[str]) -> date | None:
    """The latest watering event on one of these zones or plantings."""
    dates = [
        e.done_on
        for e in data.events.values()
        if e.kind == "watering" and (e.zone_id in zone_ids or e.planting_id in planting_ids)
    ]
    return date.fromisoformat(max(dates)) if dates else None


def balance(
    days: list[dict[str, Any]], today: date, watered: date | None = None, soil: float | None = None
) -> dict[str, Any]:
    """Rain and evaporation of the last week (since the last watering), the rain of the next two days."""
    start = today - timedelta(days=WINDOW_DAYS)
    if watered and watered >= start:
        start = watered + timedelta(days=1)
    past = [d for d in days if start.isoformat() <= d["date"] < today.isoformat()]
    coming = [d for d in days if today.isoformat() <= d["date"] <= (today + timedelta(days=1)).isoformat()]
    rain = round(sum(d["rain_mm"] or 0 for d in past), 1)
    et0 = round(sum(d["et0_mm"] or 0 for d in past), 1)
    rain_next = round(sum(d["rain_mm"] or 0 for d in coming), 1)
    deficit = max(0.0, round(et0 - rain, 1))
    if soil is not None and soil < SOIL_DRY:
        verdict = "water"
    elif (soil is not None and soil > SOIL_WET) or rain_next >= RAIN_COMING:
        verdict = "ok"
    elif deficit >= DEFICIT_WATER:
        verdict = "water"
    elif deficit >= DEFICIT_SOON:
        verdict = "soon"
    else:
        verdict = "ok"
    return {
        "rain_mm": rain,
        "et0_mm": et0,
        "deficit_mm": deficit,
        "rain_next_mm": rain_next,
        "soil": soil,
        "watered": watered.isoformat() if watered else None,
        "verdict": verdict,
    }


def zones_balance(
    data: HomesteadData, days: list[dict[str, Any]], today: date, soil: dict[str, float]
) -> dict[str, dict[str, Any]]:
    """Per top-level garden zone that has plants and is watered (``soil``: moisture by zone id)."""
    if not any(d.get("et0_mm") is not None for d in days):
        return {}
    out = {}
    for zone in data.zones.values():
        if zone.parent_id and zone.parent_id in data.zones:
            continue  # beds count with their zone
        if zone_kind(data, zone.id) in SKIPPED_ZONES or zone_mode(data, zone.id) == WateringMode.NONE:
            continue
        inside = {zone.id, *data.zone_descendants(zone.id)}
        plants = {p.id for p in data.active_plantings() if p.zone_id in inside}
        if not plants:
            continue
        out[zone.id] = balance(days, today, last_watering(data, inside, plants), soil.get(zone.id))
    return out


def sensor_plants(data: HomesteadData, readings: dict[str, float]) -> list[dict[str, Any]]:
    """Outdoor plants with their own soil moisture sensors (a pot, a young tree): the average against
    their threshold. Houseplants have their own watering round."""
    out = []
    for p in data.active_plantings():
        if not p.moisture_entity or zone_kind(data, p.zone_id) == ZoneKind.INDOOR:
            continue
        value = mean_reading(p.moisture_entity, readings)
        if value is None:
            continue
        low = p.moisture_min if p.moisture_min is not None else SOIL_DRY
        out.append(
            {"planting_id": p.id, "moisture": value, "min": low, "verdict": "water" if value < low else "ok"}
        )
    return sorted(out, key=lambda t: t["moisture"])


def young_trees(
    data: HomesteadData, days: list[dict[str, Any]], today: date, readings: dict[str, float] | None = None
) -> list[dict[str, Any]]:
    """Trees, shrubs and vines planted out less than two years ago, in the growing season
    (their own moisture sensors, when they have some, decide)."""
    if today.month not in YOUNG_MONTHS:
        return []
    out = []
    rainy = [d["date"] for d in days if d["date"] < today.isoformat() and (d["rain_mm"] or 0) >= YOUNG_RAIN]
    rain_next = sum(
        d["rain_mm"] or 0
        for d in days
        if today.isoformat() <= d["date"] <= (today + timedelta(days=1)).isoformat()
    )
    for p in data.active_plantings():
        if p.plant_type not in YOUNG_TYPES or not p.planted_on:
            continue
        if zone_kind(data, p.zone_id) in SKIPPED_ZONES - {ZoneKind.WOODLAND}:
            continue
        planted = date.fromisoformat(p.planted_on)
        if not (0 <= (today - planted).days < YOUNG_DAYS):
            continue
        zones = {p.zone_id} if p.zone_id else set()
        last = [planted.isoformat(), *(r for r in rainy if r >= planted.isoformat())]
        watered = last_watering(data, zones, {p.id})
        if watered:
            last.append(watered.isoformat())
        since = date.fromisoformat(max(last))
        dry = (today - since).days
        moisture = mean_reading(p.moisture_entity, readings)
        if moisture is not None:
            verdict = (
                "water" if moisture < (p.moisture_min if p.moisture_min is not None else SOIL_DRY) else "ok"
            )
        else:
            verdict = "water" if dry >= YOUNG_DRY_DAYS and rain_next < RAIN_COMING else "ok"
        out.append(
            {
                "planting_id": p.id,
                "planted_on": p.planted_on,
                "until": (planted + timedelta(days=YOUNG_DAYS)).isoformat(),
                "dry_days": dry,
                "since": since.isoformat(),
                "mode": p.watering or zone_mode(data, p.zone_id),
                "moisture": moisture,
                "verdict": verdict,
            }
        )
    return sorted(out, key=lambda t: -t["dry_days"])
