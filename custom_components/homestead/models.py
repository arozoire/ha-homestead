"""Data model for HA Homestead (no Home Assistant dependency)."""

from __future__ import annotations

from dataclasses import asdict, dataclass, field, fields
from datetime import date
from enum import StrEnum
from typing import Any, Self
from uuid import uuid4

from .geo import polygon_area_m2
from .moon import moon_phase


def new_id() -> str:
    return uuid4().hex


class PlantingKind(StrEnum):
    SINGLE = "single"
    GROUP = "group"


class PlantingOrigin(StrEnum):
    EXISTING = "existing"  # already there: only an estimated age
    PLANTED = "planted"  # planted by the user, possibly already a few years old
    SOWN = "sown"  # sown by the user, possibly transplanted later


class PlantType(StrEnum):
    TREE = "tree"
    FRUIT_TREE = "fruit_tree"
    SHRUB = "shrub"
    VINE = "vine"
    VEGETABLE = "vegetable"
    HERB = "herb"
    FLOWER = "flower"
    OTHER = "other"


class PlantingStatus(StrEnum):
    ACTIVE = "active"
    DEAD = "dead"
    REMOVED = "removed"


class ZoneKind(StrEnum):
    VEGETABLE_GARDEN = "vegetable_garden"
    ORCHARD = "orchard"
    FLOWER_BED = "flower_bed"
    GREENHOUSE = "greenhouse"
    POTS = "pots"
    LAWN = "lawn"
    WOODLAND = "woodland"
    COMPOST = "compost"  # compost bin: only turning and harvesting events
    COOP = "coop"  # hen house: eggs and flock movements
    OTHER = "other"


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
    SERVICES = "services"  # labour, pressing olives, a gardener…
    SALES = "sales"  # for incomes
    ANIMALS = "animals"  # feed, bedding, vet, new hens
    OTHER = "other"


class EventKind(StrEnum):
    PRUNING = "pruning"
    FERTILIZING = "fertilizing"
    WATERING = "watering"
    TREATMENT = "treatment"
    SOWING = "sowing"
    HARVEST = "harvest"
    GRAFTING = "grafting"
    PROBLEM = "problem"
    NOTE = "note"
    REMOVAL = "removal"  # end of the crop: the planting becomes "removed"
    REVIEW = "review"  # yearly review: rating, abundance, what to repeat / avoid
    TILLAGE = "tillage"  # hoeing, digging, rotary tilling: usually on a whole zone
    WEEDING = "weeding"
    MULCHING = "mulching"
    MOWING = "mowing"
    CLEARING = "clearing"  # woodland: undergrowth, fallen trees
    WOOD_CUTTING = "wood_cutting"  # firewood: quantity in q, stere or m³
    BRUSHWOOD = "brushwood"  # branches, faggots
    FORAGING = "foraging"  # mushrooms, chestnuts, wild berries…
    COMPOST_TURN = "compost_turn"
    COMPOST_HARVEST = "compost_harvest"  # quality in rating, no quantity
    EGGS = "eggs"  # eggs collected, any day (also afterwards): count in quantity
    FLOCK_IN = "flock_in"  # hens arrived: count in quantity, breed in product
    FLOCK_OUT = "flock_out"  # hens gone: count in quantity, why in reason
    ANIMAL_CARE = "animal_care"  # feed, vet, bedding: product and cost
    COOP_CLEANING = "coop_cleaning"


class LeaveReason(StrEnum):
    PREDATOR = "predator"
    ILLNESS = "illness"
    AGE = "age"
    SOLD = "sold"
    SLAUGHTERED = "slaughtered"
    OTHER = "other"


# Animal and compost entries: no weather snapshot (eggs are logged every day).
NO_WEATHER_KINDS = frozenset(
    {"compost_turn", "compost_harvest", "eggs", "flock_in", "flock_out", "animal_care", "coop_cleaning"}
)
COMPOST_TURN_DAYS = 28


class Abundance(StrEnum):
    POOR = "poor"
    NORMAL = "normal"
    ABUNDANT = "abundant"


# Expense category used when an event records a cost.
EVENT_COST_CATEGORY = {
    EventKind.PRUNING: ExpenseCategory.SERVICES,
    EventKind.FERTILIZING: ExpenseCategory.FERTILIZERS,
    EventKind.WATERING: ExpenseCategory.WATER,
    EventKind.TREATMENT: ExpenseCategory.TREATMENTS,
    EventKind.SOWING: ExpenseCategory.SEEDS,
    EventKind.HARVEST: ExpenseCategory.SERVICES,
    EventKind.GRAFTING: ExpenseCategory.SERVICES,
    EventKind.TILLAGE: ExpenseCategory.SERVICES,
    EventKind.WEEDING: ExpenseCategory.SERVICES,
    EventKind.MOWING: ExpenseCategory.SERVICES,
    EventKind.CLEARING: ExpenseCategory.SERVICES,
    EventKind.WOOD_CUTTING: ExpenseCategory.SERVICES,
    EventKind.BRUSHWOOD: ExpenseCategory.SERVICES,
    EventKind.FLOCK_IN: ExpenseCategory.ANIMALS,
    EventKind.ANIMAL_CARE: ExpenseCategory.ANIMALS,
    EventKind.COOP_CLEANING: ExpenseCategory.ANIMALS,
    EventKind.COMPOST_TURN: ExpenseCategory.SERVICES,
}


class HarvestUnit(StrEnum):
    KG = "kg"
    PIECES = "pieces"
    LITRES = "l"
    QUINTAL = "q"  # 100 kg (Italy)
    STERE = "stere"  # 1 m³ of stacked logs (France)
    CUBIC_METRE = "m3"


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
    geometry: dict[str, Any] | None = None
    area_m2: float | None = None
    # Main species of a woodland (or any zone): [{"name": "Quercus cerris", "taxon_id": "…"}]
    species: list[dict[str, Any]] = field(default_factory=list)
    notes: str | None = None

    def __post_init__(self) -> None:
        self.area_m2 = polygon_area_m2(self.geometry)
        self.species = clean_species(self.species)


def clean_species(value: Any) -> list[dict[str, Any]]:
    """Names (or {"name", "taxon_id"}) without blanks or duplicates."""
    out: list[dict[str, Any]] = []
    for item in value if isinstance(value, list) else []:
        entry = {"name": item, "taxon_id": None} if isinstance(item, str) else item
        if not isinstance(entry, dict) or not isinstance(entry.get("name"), str) or not entry["name"].strip():
            continue
        name = entry["name"].strip()
        if all(e["name"].lower() != name.lower() for e in out):
            out.append({"name": name, "taxon_id": entry.get("taxon_id") or None})
    return out


@dataclass(kw_only=True)
class Taxon(_Record):
    """A species (or genus, variety…) imported from open data sources."""

    scientific_name: str
    id: str = field(default_factory=new_id)
    common_names: dict[str, str] = field(default_factory=dict)
    family: str | None = None
    genus: str | None = None
    rank: str | None = None
    gbif_key: int | None = None
    wikidata_id: str | None = None
    image: str | None = None  # Wikimedia Commons file name (from Wikidata)
    imported_on: str | None = None


@dataclass(kw_only=True)
class Planting(_Record):
    name: str
    species: str
    id: str = field(default_factory=new_id)
    taxon_id: str | None = None
    variety: str | None = None
    plant_type: str | None = None
    kind: str = PlantingKind.SINGLE
    quantity: int = 1
    origin: str | None = None
    sown_on: str | None = None
    planted_on: str | None = None
    birth_year: int | None = None
    initial_form: str | None = None
    initial_height_cm: float | None = None
    rootstock: str | None = None
    supplier: str | None = None
    zone_id: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    status: str = PlantingStatus.ACTIVE
    moon_phase: str | None = None
    sown_moon_phase: str | None = None
    seed_lot_id: str | None = None
    notes: str | None = None

    def __post_init__(self) -> None:
        if self.planted_on and not self.moon_phase:
            self.moon_phase = moon_phase(date.fromisoformat(self.planted_on))
        if self.sown_on and not self.sown_moon_phase:
            self.sown_moon_phase = moon_phase(date.fromisoformat(self.sown_on))

    def age_years(self, today: date) -> int | None:
        """Estimated age, from the birth year or else the sowing date."""
        year = self.birth_year or (int(self.sown_on[:4]) if self.sown_on else None)
        return max(today.year - year, 0) if year else None


@dataclass(kw_only=True)
class Expense(_Record):
    spent_on: str
    amount: float
    category: str
    id: str = field(default_factory=new_id)
    supplier: str | None = None
    planting_id: str | None = None
    tool_id: str | None = None
    event_id: str | None = None
    income: bool = False
    notes: str | None = None


@dataclass(kw_only=True)
class Event(_Record):
    """A diary entry on a planting or on a zone (then valid for all its plantings)."""

    kind: str
    done_on: str
    id: str = field(default_factory=new_id)
    planting_id: str | None = None
    zone_id: str | None = None
    product: str | None = None
    dose: str | None = None
    quantity: float | None = None
    unit: str | None = None
    rating: int | None = None
    abundance: str | None = None
    keep: str | None = None
    avoid: str | None = None
    reason: str | None = None  # flock_out: why the hens left
    moon_phase: str | None = None
    weather: dict[str, Any] | None = None
    notes: str | None = None

    def __post_init__(self) -> None:
        if not self.moon_phase:
            self.moon_phase = moon_phase(date.fromisoformat(self.done_on))


@dataclass(kw_only=True)
class Task(_Record):
    """A planned activity: shown in the HA to-do list and calendar; done → a diary event."""

    kind: str
    due_on: str
    id: str = field(default_factory=new_id)
    title: str | None = None
    planting_id: str | None = None
    zone_id: str | None = None
    yearly: bool = False
    notes: str | None = None
    done_on: str | None = None
    event_id: str | None = None

    def next_year(self) -> Task:
        """The same task one year later (29 February becomes 28)."""
        due = date.fromisoformat(self.due_on)
        try:
            due = due.replace(year=due.year + 1)
        except ValueError:
            due = due.replace(year=due.year + 1, day=28)
        return Task(
            kind=self.kind,
            due_on=due.isoformat(),
            title=self.title,
            planting_id=self.planting_id,
            zone_id=self.zone_id,
            yearly=True,
            notes=self.notes,
        )


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


@dataclass(kw_only=True)
class SeedLot(_Record):
    """A packet or jar of seeds: germination drops with age (the panel warns per botanical family)."""

    species: str
    id: str = field(default_factory=new_id)
    taxon_id: str | None = None
    variety: str | None = None
    year: int | None = None  # packed or harvested
    supplier: str | None = None
    quantity: str | None = None  # free text: "1 packet", "20 g"
    viability_years: int | None = None  # overrides the family default
    finished: bool = False
    notes: str | None = None


@dataclass(kw_only=True)
class CropProfile(_Record):
    """The user's correction of a species' crop data (built-in defaults in crops.json)."""

    species: str
    id: str = field(default_factory=new_id)
    exposure: list[str] = field(default_factory=list)  # sun, partial, shade
    hardiness_c: float | None = None  # lowest temperature tolerated
    sow_indoor: list[int] = field(default_factory=list)  # months 1-12
    sow_outdoor: list[int] = field(default_factory=list)
    plant_out: list[int] = field(default_factory=list)
    flowering: list[int] = field(default_factory=list)
    harvest: list[int] = field(default_factory=list)
    spacing_cm: int | None = None
    heat_max_c: float | None = None  # cool-season crops suffer above it
    pruning: list[int] = field(default_factory=list)
    fertilizing: list[int] = field(default_factory=list)
    end: list[int] = field(default_factory=list)  # end of the crop (annuals)
    notes: str | None = None


@dataclass(kw_only=True)
class Photo(_Record):
    """A picture stored under the HA media folder; ``file`` is relative to the homestead folder."""

    file: str
    id: str = field(default_factory=new_id)
    planting_id: str | None = None
    event_id: str | None = None
    taken_on: str | None = None
    caption: str | None = None


_COLLECTIONS: dict[str, type[_Record]] = {
    "zones": Zone,
    "taxa": Taxon,
    "plantings": Planting,
    "expenses": Expense,
    "tools": Tool,
    "photos": Photo,
    "events": Event,
    "tasks": Task,
    "seeds": SeedLot,
    "crops": CropProfile,
}


@dataclass
class HomesteadData:
    zones: dict[str, Zone] = field(default_factory=dict)
    taxa: dict[str, Taxon] = field(default_factory=dict)
    plantings: dict[str, Planting] = field(default_factory=dict)
    expenses: dict[str, Expense] = field(default_factory=dict)
    tools: dict[str, Tool] = field(default_factory=dict)
    photos: dict[str, Photo] = field(default_factory=dict)
    events: dict[str, Event] = field(default_factory=dict)
    tasks: dict[str, Task] = field(default_factory=dict)
    seeds: dict[str, SeedLot] = field(default_factory=dict)
    crops: dict[str, CropProfile] = field(default_factory=dict)

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

    def zone_descendants(self, zone_id: str) -> set[str]:
        children = {z.id for z in self.zones.values() if z.parent_id == zone_id}
        for child in list(children):
            children |= self.zone_descendants(child)
        return children

    def find_taxon(
        self, gbif_key: int | None, wikidata_id: str | None, scientific_name: str | None
    ) -> Taxon | None:
        for taxon in self.taxa.values():
            if (gbif_key and taxon.gbif_key == gbif_key) or (
                wikidata_id and taxon.wikidata_id == wikidata_id
            ):
                return taxon
        name = (scientific_name or "").lower()
        return next((t for t in self.taxa.values() if name and t.scientific_name.lower() == name), None)

    def active_plantings(self) -> list[Planting]:
        return [p for p in self.plantings.values() if p.status == PlantingStatus.ACTIVE]

    def expenses_total(self, year: int) -> float:
        return round(
            sum(
                e.amount
                for e in self.expenses.values()
                if not e.income and e.spent_on.startswith(f"{year:04d}-")
            ),
            2,
        )

    def tools_needing_service(self, today: date) -> list[Tool]:
        return [
            t
            for t in self.tools.values()
            if t.status != ToolStatus.OK
            or (t.next_service_on is not None and date.fromisoformat(t.next_service_on) <= today)
        ]


def hens(data: HomesteadData, zone_id: str, until: str | None = None) -> int:
    """Hens in a coop: arrivals minus departures (up to a date, included)."""
    count = 0
    for e in data.events.values():
        if e.zone_id != zone_id or (until and e.done_on > until) or not e.quantity:
            continue
        if e.kind == EventKind.FLOCK_IN:
            count += int(e.quantity)
        elif e.kind == EventKind.FLOCK_OUT:
            count -= int(e.quantity)
    return max(count, 0)


def compost_due(data: HomesteadData, today: date) -> list[tuple[Zone, int]]:
    """Compost bins not turned for at least COMPOST_TURN_DAYS days (since the last turn or harvest)."""
    out = []
    for zone in data.zones.values():
        if zone.kind != ZoneKind.COMPOST:
            continue
        last = max(
            (
                e.done_on
                for e in data.events.values()
                if e.zone_id == zone.id and e.kind in (EventKind.COMPOST_TURN, EventKind.COMPOST_HARVEST)
            ),
            default=None,
        )
        if last and (days := (today - date.fromisoformat(last)).days) >= COMPOST_TURN_DAYS:
            out.append((zone, days))
    return out
