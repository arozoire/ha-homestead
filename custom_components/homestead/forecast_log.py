"""How far the forecast can be trusted here: its versions kept day by day, checked against the own sensors.

Pure (no Home Assistant). The log is a plain dict saved in ``.storage/homestead.forecasts``::

    {"days": {"2026-11-24": {"versions": [{"on": "2026-11-19T06:00", "lead": 5,
                                           "t_min": 3, "t_max": 11, "rain_mm": 0.2, "sky": "cloud"}, …],
                             "actual": {"t_min": 2.1, "t_max": 9.4, "rain_mm": 50, "p_drop": 9.0}}}}

A version is kept only when the forecast of that day really changes (``CHANGE_T`` °C, ``CHANGE_RAIN`` mm or
another sky): a few hundred KB a year.
"""

from __future__ import annotations

from datetime import date, datetime, timedelta
from statistics import mean
from typing import Any

MAX_LEAD = 7
CHANGE_T = 1.0
CHANGE_RAIN = 1.0
RAIN_DAY_MM = 1.0  # a rainy day for the hit rate
KEEP_DAYS = 5 * 366
MIN_PAIRS = 10  # days checked at a lead before its own numbers replace the generic ones
BIAS_MIN_PAIRS = 21  # nights checked before the frost alerts use the local correction
BIAS_MIN_C = 0.5
PRESSURE_DROP_HPA = 6.0  # in 12 hours
PRESSURE_FALL_3H = 3.0  # "falling fast" (WMO tendency over 3 hours)
# Rain right or wrong, by days ahead, before the garden has its own numbers (typical of a global model).
GENERIC_RAIN_OK = {0: 92, 1: 88, 2: 84, 3: 78, 4: 70, 5: 60, 6: 50, 7: 42}

_SKY_CODES = (
    (range(0, 2), "sun"),
    (range(2, 4), "cloud"),
    (range(45, 49), "cloud"),
    (range(51, 68), "rain"),
    (range(80, 83), "rain"),
    (range(71, 78), "snow"),
    (range(85, 87), "snow"),
    (range(95, 100), "storm"),
)
_SKY_CONDITIONS = {
    "sunny": "sun",
    "clear-night": "sun",
    "partlycloudy": "cloud",
    "cloudy": "cloud",
    "fog": "cloud",
    "windy": "cloud",
    "windy-variant": "cloud",
    "rainy": "rain",
    "pouring": "rain",
    "lightning-rainy": "storm",
    "lightning": "storm",
    "hail": "storm",
    "snowy": "snow",
    "snowy-rainy": "snow",
    "exceptional": "storm",
}


def sky(day: dict[str, Any]) -> str | None:
    """sun, cloud, rain, snow or storm: from the WMO code (Open-Meteo) or the HA condition."""
    code = day.get("code")
    if isinstance(code, int | float):
        return next((name for codes, name in _SKY_CODES if int(code) in codes), None)
    return _SKY_CONDITIONS.get(str(day.get("condition") or ""))


def _round(value: Any) -> float | None:
    return round(float(value), 1) if isinstance(value, int | float) else None


def snapshot(day: dict[str, Any]) -> dict[str, Any]:
    return {
        "t_min": _round(day.get("t_min")),
        "t_max": _round(day.get("t_max")),
        "rain_mm": _round(day.get("rain_mm")),
        "sky": sky(day),
    }


def _moved(a: float | None, b: float | None, step: float) -> bool:
    if a is None or b is None:
        return (a is None) != (b is None)
    return abs(a - b) >= step


def changed(old: dict[str, Any], new: dict[str, Any]) -> bool:
    return (
        _moved(old.get("t_min"), new["t_min"], CHANGE_T)
        or _moved(old.get("t_max"), new["t_max"], CHANGE_T)
        or _moved(old.get("rain_mm"), new["rain_mm"], CHANGE_RAIN)
        or (new["sky"] is not None and old.get("sky") != new["sky"])
    )


def record(log: dict[str, Any], forecast: list[dict[str, Any]], issued: datetime) -> bool:
    """Keep the forecast of the next days where it changed; True if something was added."""
    days = log.setdefault("days", {})
    today = issued.date()
    added = False
    for day in forecast:
        try:
            lead = (date.fromisoformat(day["date"]) - today).days
        except (KeyError, ValueError):
            continue
        if not 0 <= lead <= MAX_LEAD:
            continue
        snap = snapshot(day)
        if snap["t_min"] is None and snap["t_max"] is None and snap["rain_mm"] is None:
            continue
        versions = days.setdefault(day["date"], {}).setdefault("versions", [])
        if versions and not changed(versions[-1], snap):
            continue
        versions.append({"on": issued.isoformat(timespec="minutes"), "lead": lead, **snap})
        added = True
    return added


def set_actual(log: dict[str, Any], day: str, actual: dict[str, Any]) -> None:
    clean = {k: _round(v) for k, v in actual.items() if _round(v) is not None}
    if clean:
        log.setdefault("days", {}).setdefault(day, {})["actual"] = clean


def missing_actuals(log: dict[str, Any], today: date) -> list[str]:
    """Days already over with forecasts but no measurement yet (the last ten)."""
    days = log.get("days") or {}
    start = (today - timedelta(days=10)).isoformat()
    return sorted(d for d, e in days.items() if start <= d < today.isoformat() and "actual" not in e)


def prune(log: dict[str, Any], today: date) -> None:
    cutoff = (today - timedelta(days=KEEP_DAYS)).isoformat()
    days = log.get("days") or {}
    for key in [k for k in days if k < cutoff]:
        del days[key]


def forecast_at(versions: list[dict[str, Any]], lead: int) -> dict[str, Any] | None:
    """What was forecast ``lead`` days before: the last version issued that far ahead (or further)."""
    return next((v for v in reversed(versions) if v["lead"] >= lead), None)


def past_days(log: dict[str, Any], today: date, count: int) -> list[dict[str, Any]]:
    """The last days over, newest first: the forecast of the day before (or the latest), what was measured."""
    days = log.get("days") or {}
    out = []
    for back in range(1, count + 1):
        key = (today - timedelta(days=back)).isoformat()
        entry = days.get(key) or {}
        versions = entry.get("versions") or []
        guess = forecast_at(versions, 1) or (versions[0] if versions else None)
        if guess is None and not entry.get("actual"):
            continue
        out.append({"date": key, "forecast": guess, "actual": entry.get("actual"), "changes": len(versions)})
    return out


def changes_after(versions: list[dict[str, Any]], lead: int) -> int:
    """How many times it changed from ``lead`` days before to the day itself."""
    if forecast_at(versions, lead) is None:
        return 0
    return sum(1 for v in versions if v["lead"] < lead)


def pressure_drop(hours: list[tuple[datetime, float]]) -> dict[str, float]:
    """Largest fall in 12 hours, by local day of its end: hourly means in hPa, oldest first."""
    out: dict[str, float] = {}
    for i, (when, value) in enumerate(hours):
        window = [v for w, v in hours[max(0, i - 12) : i] if when - w <= timedelta(hours=12)]
        if window:
            fall = max(window) - value
            key = when.date().isoformat()
            out[key] = max(out.get(key, 0.0), round(fall, 1))
    return out


def stats(log: dict[str, Any]) -> dict[str, Any]:
    """Errors by days ahead, the garden's own offset and the pressure rule, from the days measured."""
    entries = [e for e in (log.get("days") or {}).values() if e.get("actual") and e.get("versions")]
    leads: dict[str, Any] = {}
    nights, days_bias = [], []
    for lead in range(1, MAX_LEAD + 1):
        err_max, err_min, rain_ok, moves = [], [], [], []
        for entry in entries:
            actual, versions = entry["actual"], entry["versions"]
            guess = forecast_at(versions, lead)
            if guess is None:
                continue
            if guess.get("t_max") is not None and actual.get("t_max") is not None:
                err_max.append(abs(guess["t_max"] - actual["t_max"]))
            if guess.get("t_min") is not None and actual.get("t_min") is not None:
                err_min.append(abs(guess["t_min"] - actual["t_min"]))
                if lead == 1:
                    nights.append(actual["t_min"] - guess["t_min"])
            if lead == 1 and guess.get("t_max") is not None and actual.get("t_max") is not None:
                days_bias.append(actual["t_max"] - guess["t_max"])
            if guess.get("rain_mm") is not None and actual.get("rain_mm") is not None:
                rain_ok.append((guess["rain_mm"] >= RAIN_DAY_MM) == (actual["rain_mm"] >= RAIN_DAY_MM))
            moves.append(changes_after(versions, lead))
        if not moves:
            continue
        leads[str(lead)] = {
            "n": len(moves),
            "max_err": round(mean(err_max), 1) if err_max else None,
            "min_err": round(mean(err_min), 1) if err_min else None,
            "rain_ok": round(100 * sum(rain_ok) / len(rain_ok)) if rain_ok else None,
            "changes": round(mean(moves), 1),
        }
    return {
        "days": len(entries),
        "leads": leads,
        "night_bias": round(mean(nights), 1) if len(nights) >= MIN_PAIRS else None,
        "night_pairs": len(nights),
        "day_bias": round(mean(days_bias), 1) if len(days_bias) >= MIN_PAIRS else None,
        "pressure": _pressure_rule(log),
    }


def _pressure_rule(log: dict[str, Any]) -> dict[str, int] | None:
    """Days with a strong pressure fall, and how many of them rained (that day or the next)."""
    days = log.get("days") or {}
    drops = rained = 0
    for key, entry in days.items():
        actual = entry.get("actual") or {}
        if (actual.get("p_drop") or 0) < PRESSURE_DROP_HPA:
            continue
        nxt = (days.get((date.fromisoformat(key) + timedelta(days=1)).isoformat()) or {}).get("actual") or {}
        rain = [r for r in (actual.get("rain_mm"), nxt.get("rain_mm")) if r is not None]
        if not rain:
            continue
        drops += 1
        rained += max(rain) >= RAIN_DAY_MM
    return {"drops": drops, "rained": rained} if drops else None


def night_correction(summary: dict[str, Any]) -> float | None:
    """The offset of the nights here, once there are enough of them and it is worth it."""
    bias = summary.get("night_bias")
    if bias is None or summary.get("night_pairs", 0) < BIAS_MIN_PAIRS or abs(bias) < BIAS_MIN_C:
        return None
    return bias


def corrected(forecast: list[dict[str, Any]], correction: float | None) -> list[dict[str, Any]]:
    """The forecast with the minimum shifted by the garden's own offset (for the frost alerts)."""
    if not correction:
        return forecast
    return [
        {**d, "t_min": round(d["t_min"] + correction, 1)} if d.get("t_min") is not None else d
        for d in forecast
    ]


def _score(rain_ok: float) -> int:
    return 5 if rain_ok >= 85 else 4 if rain_ok >= 75 else 3 if rain_ok >= 62 else 2 if rain_ok >= 50 else 1


def reliability(log: dict[str, Any], summary: dict[str, Any], today: date) -> dict[str, dict[str, Any]]:
    """For each day of the coming week: a score 1–5 and how many times its forecast already changed."""
    out = {}
    for key, entry in (log.get("days") or {}).items():
        lead = (date.fromisoformat(key) - today).days
        if not 0 <= lead <= MAX_LEAD:
            continue
        versions = entry.get("versions") or []
        own = summary["leads"].get(str(max(lead, 1))) or {}
        learned = own.get("n", 0) >= MIN_PAIRS and own.get("rain_ok") is not None
        score = _score(own["rain_ok"] if learned else GENERIC_RAIN_OK[lead])
        changes = max(0, len(versions) - 1)
        if changes >= 3:
            score -= 1
        out[key] = {
            "score": max(1, score),
            "changes": changes,
            "learned": learned,
            "first": versions[0]["lead"] if versions else None,
        }
    return out


def today_check(
    log: dict[str, Any], today: date, so_far: dict[str, Any], pressure_3h: float | None
) -> dict[str, Any] | None:
    """Today so far against yesterday's forecast for today: what looks off, and a verdict."""
    versions = ((log.get("days") or {}).get(today.isoformat()) or {}).get("versions") or []
    guess = forecast_at(versions, 1) or (versions[0] if versions else None)
    if guess is None or not (so_far or pressure_3h is not None):
        return None
    items = []
    t_min, t_max, rain = so_far.get("t_min"), so_far.get("t_max"), so_far.get("rain_mm")
    if t_min is not None and guess.get("t_min") is not None:
        diff = round(t_min - guess["t_min"], 1)
        items.append({"kind": "t_min", "value": t_min, "forecast": guess["t_min"], "off": diff <= -2})
    if t_max is not None and guess.get("t_max") is not None:
        diff = round(t_max - guess["t_max"], 1)
        items.append({"kind": "t_max", "value": t_max, "forecast": guess["t_max"], "off": diff >= 2})
    if rain is not None and guess.get("rain_mm") is not None:
        wetter = rain - guess["rain_mm"] >= 2 or (guess["rain_mm"] < RAIN_DAY_MM and rain >= 2 * RAIN_DAY_MM)
        items.append({"kind": "rain", "value": rain, "forecast": guess["rain_mm"], "off": wetter})
    if pressure_3h is not None:
        items.append({"kind": "pressure", "value": pressure_3h, "off": pressure_3h <= -PRESSURE_FALL_3H})
    if not items:
        return None
    return {"items": items, "off": any(i["off"] for i in items), "issued": guess["on"]}
