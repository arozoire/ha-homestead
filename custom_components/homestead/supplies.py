"""Supplies: consumption computed backwards from bought / opened / finished, forecast, expiry.

Pure (no Home Assistant). See docs/design/supplies.md.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import date, timedelta
from statistics import mean

from .models import Event, HomesteadData, Product, SupplyLot, animals

RECENT_LOTS = 3  # finished lots that make the forecast
EXPIRY_SOON_DAYS = 30
UNUSUAL = 1.3  # a period this much above the usual rate (per animal) is pointed out
SHOPPING_DAYS = 10  # put on the shopping list this many days before the expected end


def _day(value: str | None) -> date | None:
    return date.fromisoformat(value) if value else None


def line_key(lot: SupplyLot) -> tuple[str | None, str]:
    """Lots of the same product for the same zone: one consumption history."""
    return lot.zone_id, " ".join(lot.name.casefold().split())


def herd(data: HomesteadData, lot: SupplyLot, day: date) -> int:
    """Animals eating this lot on a day: the lot's animal kind, else all the zone's animals."""
    if not lot.zone_id:
        return 0
    counts = animals(data, lot.zone_id, day.isoformat())
    return counts.get(lot.animal, 0) if lot.animal else sum(counts.values())


def average_animals(data: HomesteadData, lot: SupplyLot, start: date, end: date) -> float | None:
    """Animals eating the lot on average over the days; None without animals."""
    days = max(1, (end - start).days)
    total = sum(herd(data, lot, start + timedelta(days=d)) for d in range(days))
    return round(total / days, 2) if total else None


@dataclass
class Period:
    lot_id: str
    start: str
    end: str
    days: int
    per_day: float  # in the lot's unit
    per_animal: float | None  # per animal and day
    unusual: bool = False


def period(data: HomesteadData, lot: SupplyLot) -> Period | None:
    """The finished lot's consumption: quantity over the days it lasted."""
    start, end = _day(lot.opened_on), _day(lot.finished_on)
    if not start or not end or not lot.quantity or end < start:
        return None
    days = max(1, (end - start).days)
    per_day = lot.quantity / days
    average = average_animals(data, lot, start, end)
    return Period(
        lot.id,
        lot.opened_on or "",
        lot.finished_on or "",
        days,
        round(per_day, 4),
        round(per_day / average, 5) if average else None,
    )


def history(data: HomesteadData, lot: SupplyLot) -> list[Period]:
    """Finished lots of the same line, oldest first; unusual periods marked."""
    key = line_key(lot)
    same = sorted(
        (s for s in data.supplies.values() if line_key(s) == key and s.finished_on),
        key=lambda s: s.finished_on or "",
    )
    out = [p for s in same if (p := period(data, s))]
    for i, p in enumerate(out):
        others = [o.per_animal or o.per_day for j, o in enumerate(out) if j != i]
        if len(others) >= 2 and (p.per_animal or p.per_day) > UNUSUAL * mean(others):
            p.unusual = True
    return out


def expected_end(data: HomesteadData, lot: SupplyLot, today: date) -> tuple[date, float] | None:
    """When an open lot runs out, and at how much a day: the recent rate, scaled to today's animals."""
    start = _day(lot.opened_on)
    if not start or lot.finished_on or not lot.quantity:
        return None
    recent = history(data, lot)[-RECENT_LOTS:]
    if not recent:
        return None
    now = herd(data, lot, today)
    per_animal = [p.per_animal for p in recent if p.per_animal]
    rate = now * mean(per_animal) if now and per_animal else mean(p.per_day for p in recent)
    if rate <= 0:
        return None
    return start + timedelta(days=round(lot.quantity / rate)), round(rate, 4)


def expiry(lot: SupplyLot, today: date) -> str | None:
    """'expired', 'soon' (within 30 days) or None; a finished lot no longer matters."""
    when = _day(lot.expires_on)
    if not when or lot.finished_on:
        return None
    if when < today:
        return "expired"
    return "soon" if when <= today + timedelta(days=EXPIRY_SOON_DAYS) else None


def to_buy(data: HomesteadData, today: date) -> list[SupplyLot]:
    """Lots to put on the shopping list now: finished, or running out within SHOPPING_DAYS.

    Only once per line: when a newer lot of the same line is still closed (a spare), nothing is needed.
    """
    out = []
    for lot in data.supplies.values():
        if lot.shopping_on:
            continue
        spare = any(
            s.id != lot.id and line_key(s) == line_key(lot) and not s.opened_on and not s.finished_on
            for s in data.supplies.values()
        )
        if spare:
            continue
        if lot.finished_on:
            # Only the last finished lot of a line with nothing open after it.
            newer = any(
                s.id != lot.id
                and line_key(s) == line_key(lot)
                and (s.opened_on or "") >= (lot.finished_on or "")
                for s in data.supplies.values()
            )
            finished = _day(lot.finished_on)
            if not newer and finished and finished >= today - timedelta(days=7):
                out.append(lot)
        elif (end := expected_end(data, lot, today)) and end[0] <= today + timedelta(days=SHOPPING_DAYS):
            out.append(lot)
    return out


def shopping_text(lot: SupplyLot) -> str:
    """'Layer feed 25 kg (Co-op)': the name, the size and where it was bought last time."""
    size = f"{lot.quantity:g} {lot.unit}" if lot.quantity else ""
    where = f"({lot.supplier})" if lot.supplier else ""
    return " ".join(filter(None, [lot.name, size, where]))


# ----- step 3: products, pre-harvest interval, copper -----

COPPER_LIMIT_KG_HA = 4.0  # organic farming, EU: 28 kg/ha over 7 years, i.e. 4 a year on average
COPPER_YEARS = 7
TO_KG = {"kg": 1.0, "g": 0.001, "l": 1.0, "ml": 0.001}  # liquids counted as 1 kg/l


def _zone_ids_up(data: HomesteadData, zone_id: str | None) -> list[str]:
    out = []
    while zone_id and zone_id in data.zones and zone_id not in out:
        out.append(zone_id)
        zone_id = data.zones[zone_id].parent_id
    return out


def treated(data: HomesteadData, event: Event, planting_id: str) -> bool:
    """A treatment on the planting, or on its zone or a parent zone."""
    if event.planting_id:
        return event.planting_id == planting_id
    planting = data.plantings.get(planting_id)
    return bool(planting and event.zone_id in _zone_ids_up(data, planting.zone_id))


def harvest_wait(data: HomesteadData, planting_id: str, day: date) -> tuple[date, Event, Product] | None:
    """The pre-harvest interval still running on a planting that day: (harvest from, treatment, product)."""
    found = None
    for event in data.events.values():
        product = data.products.get(event.product_id or "")
        if event.kind != "treatment" or not product or not product.pre_harvest_days:
            continue
        start = date.fromisoformat(event.done_on)
        until = start + timedelta(days=product.pre_harvest_days)
        if start <= day < until and treated(data, event, planting_id) and (not found or until > found[0]):
            found = (until, event, product)
    return found


def copper_kg(data: HomesteadData, event: Event) -> float | None:
    """Copper put on by a treatment: amount of product × its copper share."""
    product = data.products.get(event.product_id or "")
    if event.kind != "treatment" or not product or not product.copper_percent or not event.quantity:
        return None
    factor = TO_KG.get(event.unit or "g")
    return event.quantity * factor * product.copper_percent / 100 if factor else None


def copper_by_year(data: HomesteadData, zone_id: str) -> dict[int, float]:
    """Copper in kg per hectare per year on a zone (and what is inside it)."""
    inside = {zone_id} | data.zone_descendants(zone_id)
    area = data.zones[zone_id].area_m2 if zone_id in data.zones else None
    if not area:
        return {}
    out: dict[int, float] = {}
    for event in data.events.values():
        kg = copper_kg(data, event)
        if kg is None:
            continue
        zid = event.zone_id or (
            data.plantings[event.planting_id].zone_id if event.planting_id in data.plantings else None
        )
        if zid in inside:
            year = int(event.done_on[:4])
            out[year] = out.get(year, 0.0) + kg / (area / 10000)
    return {y: round(v, 2) for y, v in sorted(out.items())}


def copper_check(by_year: dict[int, float], year: int) -> dict[str, float | bool] | None:
    """This year's kg/ha and the 7-year average (years without copper count as 0), against 4 kg/ha."""
    if not by_year:
        return None
    window = [by_year.get(y, 0.0) for y in range(year - COPPER_YEARS + 1, year + 1)]
    average = sum(window) / COPPER_YEARS
    return {
        "year": round(by_year.get(year, 0.0), 2),
        "average": round(average, 2),
        "near": average >= 0.85 * COPPER_LIMIT_KG_HA,
        "over": average > COPPER_LIMIT_KG_HA,
    }
