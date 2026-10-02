"""Data model for HA Homestead (no Home Assistant dependency)."""

from __future__ import annotations

from dataclasses import asdict, dataclass, field, fields
from datetime import date
from enum import StrEnum
from typing import Any, Self
from uuid import uuid4

from .moon import moon_phase


def new_id() -> str:
    return uuid4().hex


class PlantingKind(StrEnum):
    SINGLE = "single"
    GROUP = "group"


class PlantingStatus(StrEnum):
    ACTIVE = "active"
    DEAD = "dead"
    REMOVED = "removed"


class InitialForm(StrEnum):
    SEED = "seed"
    CUTTING = "cutting"
    BULB = "bulb"
    BARE_ROOT = "bare_root"
    POTTED = "potted"
    ONE_YEAR = "one_year"
    TWO_YEARS = "two_years"
    OTHER = "other"


class ExpenseCategory(StrEnum):
    PLANTS = "plants"
    SEEDS = "seeds"
    TOOLS = "tools"
    FERTILIZERS = "fertilizers"
    TREATMENTS = "treatments"
    WATER = "water"
    OTHER = "other"


class ToolStatus(StrEnum):
    OK = "ok"
    NEEDS_SERVICE = "needs_service"
    BROKEN = "broken"


class ToolPower(StrEnum):
    MANUAL = "manual"
    BATTERY = "battery"
    PETROL = "petrol"
    ELECTRIC = "electric"


class _Record:
    @classmethod
    def from_dict(cls, raw: dict[str, Any]) -> Self:
        known = {f.name for f in fields(cls)}  # type: ignore[arg-type]
        return cls(**{k: v for k, v in raw.items() if k in known})

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)  # type: ignore[call-overload]


@dataclass(kw_only=True)
class Zone(_Record):
    name: str
    id: str = field(default_factory=new_id)
    parent_id: str | None = None
    kind: str | None = None
    area_id: str | None = None
    notes: str | None = None


@dataclass(kw_only=True)
class Planting(_Record):
    name: str
    species: str
    id: str = field(default_factory=new_id)
    variety: str | None = None
    kind: str = PlantingKind.SINGLE
    quantity: int = 1
    planted_on: str | None = None
    initial_form: str | None = None
    initial_height_cm: float | None = None
    rootstock: str | None = None
    supplier: str | None = None
    zone_id: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    status: str = PlantingStatus.ACTIVE
    moon_phase: str | None = None
    notes: str | None = None

    def __post_init__(self) -> None:
        if self.planted_on and not self.moon_phase:
            self.moon_phase = moon_phase(date.fromisoformat(self.planted_on))


@dataclass(kw_only=True)
class Expense(_Record):
    spent_on: str
    amount: float
    category: str
    id: str = field(default_factory=new_id)
    supplier: str | None = None
    planting_id: str | None = None
    tool_id: str | None = None
    notes: str | None = None


@dataclass(kw_only=True)
class Tool(_Record):
    name: str
    id: str = field(default_factory=new_id)
    category: str | None = None
    brand: str | None = None
    model: str | None = None
    purchased_on: str | None = None
    power: str = ToolPower.MANUAL
    status: str = ToolStatus.OK
    next_service_on: str | None = None
    notes: str | None = None


_COLLECTIONS: dict[str, type[_Record]] = {
    "zones": Zone,
    "plantings": Planting,
    "expenses": Expense,
    "tools": Tool,
}


@dataclass
class HomesteadData:
    zones: dict[str, Zone] = field(default_factory=dict)
    plantings: dict[str, Planting] = field(default_factory=dict)
    expenses: dict[str, Expense] = field(default_factory=dict)
    tools: dict[str, Tool] = field(default_factory=dict)

    @classmethod
    def from_dict(cls, raw: dict[str, Any]) -> HomesteadData:
        data = cls()
        for name, record_cls in _COLLECTIONS.items():
            target = getattr(data, name)
            for item in raw.get(name, []):
                record = record_cls.from_dict(item)
                target[record.id] = record  # type: ignore[attr-defined]
        return data

    def to_dict(self) -> dict[str, list[dict[str, Any]]]:
        return {name: [r.to_dict() for r in getattr(self, name).values()] for name in _COLLECTIONS}

    def active_plantings(self) -> list[Planting]:
        return [p for p in self.plantings.values() if p.status == PlantingStatus.ACTIVE]

    def expenses_total(self, year: int) -> float:
        return round(
            sum(e.amount for e in self.expenses.values() if e.spent_on.startswith(f"{year:04d}-")),
            2,
        )

    def tools_needing_service(self, today: date) -> list[Tool]:
        return [
            t
            for t in self.tools.values()
            if t.status != ToolStatus.OK
            or (t.next_service_on is not None and date.fromisoformat(t.next_service_on) <= today)
        ]
