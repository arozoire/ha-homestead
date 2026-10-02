"""Moon phase for a given date, recorded on events for later correlation."""

from __future__ import annotations

from datetime import date

SYNODIC_MONTH = 29.530588853
REFERENCE_NEW_MOON = date(2000, 1, 6)

PHASES = (
    "new_moon",
    "waxing_crescent",
    "first_quarter",
    "waxing_gibbous",
    "full_moon",
    "waning_gibbous",
    "last_quarter",
    "waning_crescent",
)


def moon_age(day: date) -> float:
    """Days elapsed since the last new moon."""
    return (day - REFERENCE_NEW_MOON).days % SYNODIC_MONTH


def moon_phase(day: date) -> str:
    """Return one of the eight principal moon phases."""
    index = int(moon_age(day) / SYNODIC_MONTH * 8 + 0.5) % 8
    return PHASES[index]
