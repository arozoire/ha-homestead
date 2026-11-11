"""Climate figures the garden gets without any input (pure: no Home Assistant).

- Degree days (base 10 °C) from 1 January, year by year: crops and insects develop with warmth.
- Cold hours from 1 November (hours between 0 and 7.2 °C): fruit trees need them to flower well.
- Soil temperature forecast at 6 cm (Open-Meteo), when there is no soil sensor.
"""

from __future__ import annotations

from datetime import date
from typing import Any

GDD_BASE = 10.0
CHILL_MIN = 0.0
CHILL_MAX = 7.2
CHILL_MONTHS = (11, 12, 1, 2, 3)

# Typical cold hours needed by fruit trees (indicative, varieties vary a lot).
CHILL_NEEDS = {
    "prunus persica": 800,
    "prunus armeniaca": 700,
    "prunus avium": 1100,
    "prunus cerasus": 1000,
    "prunus domestica": 900,
    "prunus dulcis": 400,
    "malus domestica": 1000,
    "pyrus communis": 900,
    "corylus avellana": 800,
    "juglans regia": 800,
    "vitis vinifera": 300,
    "actinidia deliciosa": 700,
    "actinidia chinensis": 600,
    "ribes rubrum": 800,
    "ribes nigrum": 1000,
    "rubus idaeus": 800,
    "vaccinium corymbosum": 800,
    "cydonia oblonga": 300,
    "diospyros kaki": 200,
    "ficus carica": 100,
    "olea europaea": 300,
}


def _num(value: Any) -> float | None:
    return float(value) if isinstance(value, int | float) and not isinstance(value, bool) else None


def gdd_by_year(days: list[dict[str, Any]], base: float = GDD_BASE) -> dict[str, list[int]]:
    """Cumulative degree days from 1 January, one value per day of the year (missing days add nothing)."""
    out: dict[str, list[int]] = {}
    totals: dict[str, float] = {}
    for day in sorted(days, key=lambda d: d["date"]):
        t_min, t_max = _num(day.get("t_min")), _num(day.get("t_max"))
        when = date.fromisoformat(day["date"])
        year = str(when.year)
        series = out.setdefault(year, [])
        doy = when.timetuple().tm_yday
        while len(series) < doy - 1:
            series.append(round(totals.get(year, 0.0)))
        if t_min is not None and t_max is not None:
            totals[year] = totals.get(year, 0.0) + max(0.0, (t_min + t_max) / 2 - base)
        series.append(round(totals.get(year, 0.0)))
    return out


def gdd_on(series: dict[str, list[int]], when: date) -> int | None:
    """Degree days from 1 January to that day, if known."""
    values = series.get(str(when.year)) or []
    doy = when.timetuple().tm_yday
    return values[doy - 1] if len(values) >= doy else None


def chill_start(today: date) -> date | None:
    """1 November of the current winter, or None out of the cold season."""
    if today.month not in CHILL_MONTHS:
        return None
    return date(today.year if today.month >= 11 else today.year - 1, 11, 1)


def parse_hourly(raw: dict[str, Any], column: str) -> list[tuple[str, float]]:
    """Open-Meteo ``hourly`` → [(local time, value)], without the missing ones."""
    hourly = raw.get("hourly") or {}
    times = hourly.get("time") or []
    values = hourly.get(column) or []
    return [(t, v) for t, v in zip(times, values, strict=False) if _num(v) is not None]


def chill_hours(hours: list[tuple[str, float]], since: date, until: str) -> int:
    """Hours between 0 and 7.2 °C from ``since`` up to ``until`` (an ISO hour, excluded)."""
    seen: set[str] = set()
    count = 0
    for when, value in hours:
        if when in seen or when < since.isoformat() or when >= until:
            continue
        seen.add(when)
        if CHILL_MIN <= value <= CHILL_MAX:
            count += 1
    return count


def soil_days(hours: list[tuple[str, float]]) -> dict[str, dict[str, float]]:
    """Daily mean and minimum of the forecast soil temperature."""
    by_day: dict[str, list[float]] = {}
    for when, value in hours:
        by_day.setdefault(when[:10], []).append(value)
    return {
        day: {"mean": round(sum(v) / len(v), 1), "min": round(min(v), 1)} for day, v in sorted(by_day.items())
    }


def gdd_today(series: dict[str, list[int]], recent: list[dict[str, Any]], today: date) -> int | None:
    """This year's degree days up to yesterday: the history, then the recent days after it."""
    values = list(series.get(str(today.year)) or [])
    total = float(values[-1]) if values else 0.0
    known = len(values)  # days of the year already counted
    if not values and today.timetuple().tm_yday > 1 and not recent:
        return None
    for day in sorted(recent, key=lambda d: d["date"]):
        when = date.fromisoformat(day["date"])
        if when.year != today.year or when >= today or when.timetuple().tm_yday <= known:
            continue
        t_min, t_max = _num(day.get("t_min")), _num(day.get("t_max"))
        if t_min is not None and t_max is not None:
            total += max(0.0, (t_min + t_max) / 2 - GDD_BASE)
        known = when.timetuple().tm_yday
    return round(total)
