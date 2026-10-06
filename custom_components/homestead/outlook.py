"""Weather outlook for the garden: forecast days, frost dates, extremes and alerts (no HA dependency).

A *day* is ``{"date", "t_min", "t_max", "rain_mm", "rain_prob", "wind_kmh", "gust_kmh", "code"}``
with any value possibly ``None``. Temperatures in °C, rain in mm, wind in km/h, WMO weather codes.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import date, timedelta
from statistics import median
from typing import Any

HAIL_CODES = {96, 99}  # thunderstorm with hail
HEAVY_RAIN_MM = 40
YOUNG_DAYS = 30  # sown or planted out less than a month ago: frost-tender whatever the species


@dataclass(frozen=True)
class Thresholds:
    """Heat: hot days *and* warm nights, for some days in a row (plants do not recover at night)."""

    heat_max: float = 35
    heat_night: float = 22
    heat_days: int = 3
    heat_extreme: float = 40


DEFAULT_THRESHOLDS = Thresholds()


@dataclass(frozen=True)
class PlantRisk:
    """What a planting tolerates; ``None`` means unknown."""

    id: str
    hardiness_c: float | None = None
    heat_max_c: float | None = None
    young: bool = False


def _num(value: Any) -> float | None:
    return float(value) if isinstance(value, int | float) and not isinstance(value, bool) else None


def parse_open_meteo_daily(raw: dict[str, Any]) -> list[dict[str, Any]]:
    """Open-Meteo ``daily`` block (forecast or archive) → days."""
    daily = raw.get("daily") or {}
    columns = {
        "t_max": "temperature_2m_max",
        "t_min": "temperature_2m_min",
        "rain_mm": "precipitation_sum",
        "rain_prob": "precipitation_probability_max",
        "wind_kmh": "wind_speed_10m_max",
        "gust_kmh": "wind_gusts_10m_max",
        "code": "weather_code",
    }
    days = []
    for i, day in enumerate(daily.get("time") or []):
        row: dict[str, Any] = {"date": day}
        for key, column in columns.items():
            values = daily.get(column) or []
            row[key] = _num(values[i]) if i < len(values) else None
        if row["code"] is not None:
            row["code"] = int(row["code"])
        days.append(row)
    return days


_WIND_TO_KMH = {"km/h": 1, "m/s": 3.6, "mph": 1.609344, "kn": 1.852, "ft/s": 1.09728}


def parse_ha_forecast(items: list[dict[str, Any]], units: dict[str, str]) -> list[dict[str, Any]]:
    """``weather.get_forecasts`` daily items, in the entity's units → days in °C, mm, km/h."""
    fahrenheit = units.get("temperature_unit") == "°F"
    inches = units.get("precipitation_unit") == "in"
    wind = _WIND_TO_KMH.get(units.get("wind_speed_unit") or "km/h", 1)

    def temp(value: Any) -> float | None:
        value = _num(value)
        return None if value is None else round((value - 32) * 5 / 9 if fahrenheit else value, 1)

    def scaled(value: Any, factor: float) -> float | None:
        value = _num(value)
        return None if value is None else round(value * factor, 1)

    days = []
    for item in items:
        when = str(item.get("datetime") or "")[:10]
        if not when:
            continue
        days.append(
            {
                "date": when,
                "t_max": temp(item.get("temperature")),
                "t_min": temp(item.get("templow")),
                "rain_mm": scaled(item.get("precipitation"), 25.4 if inches else 1),
                "rain_prob": _num(item.get("precipitation_probability")),
                "wind_kmh": scaled(item.get("wind_speed"), wind),
                "gust_kmh": scaled(item.get("wind_gust_speed"), wind),
                "code": None,
                "condition": item.get("condition"),
            }
        )
    return days


def daily_from_statistics(temps: list[dict], rains: list[dict]) -> dict[str, dict[str, Any]]:
    """Recorder daily long-term statistics (``min``/``max``, rain ``change``), rows with a local
    ``date`` already set → days by date."""
    days: dict[str, dict[str, Any]] = {}
    for row in temps:
        if (key := row.get("date")) and row.get("min") is not None:
            days.setdefault(key, {"date": key})
            days[key].update(t_min=round(row["min"], 1), t_max=round(row.get("max") or row["min"], 1))
    for row in rains:
        if (key := row.get("date")) and row.get("change") is not None:
            days.setdefault(key, {"date": key})
            days[key]["rain_mm"] = round(max(row["change"], 0), 1)
    return days


def merge_days(primary: dict[str, dict], fallback: list[dict]) -> list[dict[str, Any]]:
    """Own sensors first, the fallback fills the days or values they lack."""
    merged = {d["date"]: dict(d) for d in fallback}
    for key, day in primary.items():
        base = merged.setdefault(key, {"date": key})
        base.update({k: v for k, v in day.items() if v is not None})
    return [merged[k] for k in sorted(merged)]


def _day_of_year(when: date) -> int:
    """Day of a non-leap year, so that 25 March is the same day every year."""
    return date(2025, when.month, min(when.day, 28) if when.month == 2 else when.day).timetuple().tm_yday


def frost_dates(days: list[dict[str, Any]], min_years: int = 3) -> dict[str, Any] | None:
    """Median last spring frost and first autumn frost (``MM-DD``) over the years with data.

    A year counts if it has data for most of its cold months; ``None`` with too few years.
    """
    by_year: dict[int, list[tuple[date, float | None]]] = {}
    for day in days:
        when = date.fromisoformat(day["date"])
        by_year.setdefault(when.year, []).append((when, day.get("t_min")))
    springs, autumns, years = [], [], 0
    for rows in by_year.values():
        known = [(when, t) for when, t in rows if t is not None]
        cold = [when for when, _t in known if when.month in (1, 2, 3, 10, 11, 12)]
        if len(cold) < 150:
            continue
        years += 1
        spring = [when for when, t in known if when.month <= 6 and t <= 0]
        autumn = [when for when, t in known if when.month >= 7 and t <= 0]
        if spring:
            springs.append(_day_of_year(max(spring)))
        if autumn:
            autumns.append(_day_of_year(min(autumn)))
    if years < min_years:
        return None

    def as_day(values: list[int]) -> str | None:
        if len(values) * 2 < years:  # frost in less than half of the years: frost-free in practice
            return None
        return (date(2025, 1, 1) + timedelta(days=round(median(values)) - 1)).strftime("%m-%d")

    return {"last_spring": as_day(springs), "first_fall": as_day(autumns), "years": years}


def _runs(days: list[dict], test) -> list[list[dict]]:
    """Consecutive days (calendar-wise) that pass ``test``."""
    runs: list[list[dict]] = []
    for day in days:
        if not test(day):
            continue
        if runs and date.fromisoformat(runs[-1][-1]["date"]) + timedelta(days=1) == date.fromisoformat(
            day["date"]
        ):
            runs[-1].append(day)
        else:
            runs.append([day])
    return runs


def _hot(day: dict, limit: float, night: float | None) -> bool:
    t_max, t_min = day.get("t_max"), day.get("t_min")
    if t_max is None or t_max < limit:
        return False
    return night is None or (t_min is not None and t_min >= night)


def extremes(days: list[dict[str, Any]], thresholds: Thresholds = DEFAULT_THRESHOLDS) -> list[dict[str, Any]]:
    """Past weather worth remembering: frosts, heatwaves, extreme heat, hail, heavy rain."""
    out: list[dict[str, Any]] = []

    def add(kind: str, run: list[dict], value: float | None) -> None:
        out.append({"kind": kind, "start": run[0]["date"], "end": run[-1]["date"], "value": value})

    for run in _runs(days, lambda d: d.get("t_min") is not None and d["t_min"] <= 0):
        add("frost", run, min(d["t_min"] for d in run))
    heatwaves = [
        run
        for run in _runs(days, lambda d: _hot(d, thresholds.heat_max, thresholds.heat_night))
        if len(run) >= thresholds.heat_days
    ]
    for run in heatwaves:
        add("heatwave", run, max(d["t_max"] for d in run))
    in_heatwave = {d["date"] for run in heatwaves for d in run}
    for day in days:
        if day["date"] not in in_heatwave and _hot(day, thresholds.heat_extreme, None):
            add("heat_extreme", [day], day["t_max"])
        if day.get("code") in HAIL_CODES:
            add("hail", [day], None)
        if (day.get("rain_mm") or 0) >= HEAVY_RAIN_MM:
            add("heavy_rain", [day], day["rain_mm"])
    return sorted(out, key=lambda e: (e["start"], e["kind"]))


def alerts(
    forecast: list[dict[str, Any]], plants: list[PlantRisk], thresholds: Thresholds = DEFAULT_THRESHOLDS
) -> list[dict[str, Any]]:
    """Coming frosts (per plant hardiness) and heat (heatwave, extreme day, too hot for cool crops)."""
    out: list[dict[str, Any]] = []

    def frost_limit(plant: PlantRisk) -> float | None:
        if plant.young:
            return max(plant.hardiness_c if plant.hardiness_c is not None else 0, 0)
        return plant.hardiness_c

    for run in _runs(forecast, lambda d: d.get("t_min") is not None and d["t_min"] <= 0):
        low = min(d["t_min"] for d in run)
        hit = [p.id for p in plants if (limit := frost_limit(p)) is not None and low < limit]
        out.append(
            {"kind": "frost", "start": run[0]["date"], "end": run[-1]["date"], "value": low, "plantings": hit}
        )
    # Tender plants (tomatoes, citrus…) suffer above zero too.
    tender = [p for p in plants if (frost_limit(p) or -99) > 0]
    for run in _runs(forecast, lambda d: d.get("t_min") is not None and 0 < d["t_min"]):
        low = min(d["t_min"] for d in run)
        hit = [p.id for p in tender if low < frost_limit(p)]
        if hit:
            out.append(
                {
                    "kind": "cold",
                    "start": run[0]["date"],
                    "end": run[-1]["date"],
                    "value": low,
                    "plantings": hit,
                }
            )

    everyone = [p.id for p in plants]
    heatwaves = [
        run
        for run in _runs(forecast, lambda d: _hot(d, thresholds.heat_max, thresholds.heat_night))
        if len(run) >= thresholds.heat_days
    ]
    for run in heatwaves:
        out.append(
            {
                "kind": "heatwave",
                "start": run[0]["date"],
                "end": run[-1]["date"],
                "value": max(d["t_max"] for d in run),
                "plantings": everyone,
            }
        )
    in_heatwave = {d["date"] for run in heatwaves for d in run}
    for day in forecast:
        if day["date"] not in in_heatwave and _hot(day, thresholds.heat_extreme, None):
            out.append(
                {
                    "kind": "heat_extreme",
                    "start": day["date"],
                    "end": day["date"],
                    "value": day["t_max"],
                    "plantings": everyone,
                }
            )
    # Cool-season crops (lettuce, spinach, peas…) bolt or stop well below a heatwave.
    for limit in sorted(
        {p.heat_max_c for p in plants if p.heat_max_c is not None and p.heat_max_c < thresholds.heat_max}
    ):
        group = [p.id for p in plants if p.heat_max_c == limit]
        for run in _runs(forecast, lambda d, limit=limit: _hot(d, limit, None)):
            if len(run) >= thresholds.heat_days and not {d["date"] for d in run} <= in_heatwave:
                out.append(
                    {
                        "kind": "heat_stress",
                        "start": run[0]["date"],
                        "end": run[-1]["date"],
                        "value": max(d["t_max"] for d in run),
                        "plantings": group,
                    }
                )
    for alert in out:
        alert["key"] = f"{alert['kind']}:{alert['start']}"
    return sorted(out, key=lambda a: (a["start"], a["kind"]))


# Weather rules per activity: reasons to avoid a day (empty list = good day).
TREATMENT_RAIN_MM = 2
WATERING_RAIN_MM = 5
WIND_KMH = 20
GUST_KMH = 50
TREATMENT_HOT = 30
WARM_SOIL = 10  # nights below it: warm-season crops do not germinate or stall once planted out


def _rain(day: dict) -> float:
    return day.get("rain_mm") or 0


def day_issues(kind: str, days: list[dict[str, Any]], i: int, tender: bool = False) -> list[str]:
    """Why ``days[i]`` is a bad day for ``kind`` (needs the following days of the forecast too)."""
    day = days[i]
    after = days[i : i + 3]  # today and the next 2 days
    week = days[i : i + 7]
    issues = []
    if kind == "treatment":
        if any(_rain(d) >= TREATMENT_RAIN_MM for d in after):
            issues.append("rain_48h")
        if (day.get("wind_kmh") or 0) >= WIND_KMH:
            issues.append("wind")
        if (day.get("t_max") or 0) >= TREATMENT_HOT:
            issues.append("hot")
    elif kind in ("pruning", "grafting"):
        if any(d.get("t_min") is not None and d["t_min"] <= 0 for d in days[i : i + 4]):
            issues.append("frost_next")
        if _rain(day) >= TREATMENT_RAIN_MM:
            issues.append("rain_today")
    elif kind == "sowing":
        lows = [d["t_min"] for d in week if d.get("t_min") is not None]
        if lows and min(lows) < (WARM_SOIL if tender else 0.5):
            issues.append("cold_nights")
        if _rain(day) >= 20:
            issues.append("heavy_rain")
    elif kind == "watering":
        if any(_rain(d) >= WATERING_RAIN_MM for d in after):
            issues.append("rain_coming")
    elif kind == "fertilizing":
        if any(_rain(d) >= 20 for d in after):
            issues.append("heavy_rain")
        if day.get("t_min") is not None and day["t_min"] <= 0:
            issues.append("frozen")
    elif kind in ("harvest", "mowing", "tillage"):
        if _rain(day) >= TREATMENT_RAIN_MM:
            issues.append("rain_today")
    elif kind in ("wood_cutting", "brushwood", "clearing"):
        if (day.get("gust_kmh") or 0) >= GUST_KMH:
            issues.append("gusts")
    return issues


def advice(kind: str, days: list[dict[str, Any]], due: str, tender: bool = False) -> dict[str, Any] | None:
    """Verdict for a planned activity: its day's issues and the best day around it (−3/+7 days)."""
    index = {d["date"]: i for i, d in enumerate(days)}
    if due not in index:
        return None
    issues = day_issues(kind, days, index[due], tender)
    best = None
    if issues:
        target = date.fromisoformat(due)
        good = [
            (abs(offset), offset < 0, day["date"])
            for i, day in enumerate(days)
            if -3 <= (offset := (date.fromisoformat(day["date"]) - target).days) <= 7
            and not day_issues(kind, days, i, tender)
        ]
        best = min(good)[2] if good else None  # the closest good day, later rather than earlier
    return {"issues": issues, "best": best}
