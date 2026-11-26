"""Data model for HA Homestead (no Home Assistant dependency)."""

from __future__ import annotations

from dataclasses import asdict, dataclass, field, fields
from datetime import date, timedelta
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
    HOUSEPLANT = "houseplant"
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
    COOP = "coop"  # farmyard animals (hens, quails, geese, rabbits…): eggs and arrivals/departures by animal
    NURSERY = "nursery"  # seed trays, cold frame: seedlings until they are planted out
    INDOOR = "indoor"  # a room of the house: houseplants, no map, no weather
    APIARY = "apiary"  # bee yard: its hives are sub-zones
    HIVE = "hive"  # one beehive, inside an apiary (no drawing needed)
    MELLIFEROUS = "melliferous"  # flowers for the bees: species with their flowering months
    HYDROPONIC = "hydroponic"  # a water circuit: its beds and fish tanks are sub-zones
    FISH_TANK = "fish_tank"  # a tank of the circuit: fish lots moved by hand
    OTHER = "other"


class Animal(StrEnum):
    """Who an arrival, a departure or eggs are about (none = hens, as before 0.22)."""

    HENS = "hens"
    QUAILS = "quails"
    DUCKS = "ducks"
    GEESE = "geese"
    TURKEYS = "turkeys"
    RABBITS = "rabbits"
    FISH = "fish"
    OTHER = "other"


class ArrivalReason(StrEnum):
    """Why animals arrived (flock_in)."""

    BOUGHT = "bought"
    BORN = "born"  # a litter, a hatch, fry
    MOVED = "moved"  # from another tank or yard


class VarroaMethod(StrEnum):
    """How mites were counted (varroa_count): a natural drop is per day, the tests in %."""

    DROP = "drop"
    SUGAR = "sugar"
    ALCOHOL = "alcohol"


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


class SupplyKind(StrEnum):
    FEED = "feed"
    FERTILIZER = "fertilizer"
    TREATMENT = "treatment"
    BEE_FEED = "bee_feed"
    FISH_FEED = "fish_feed"
    BEDDING = "bedding"
    OTHER = "other"


SUPPLY_UNITS = ("kg", "g", "l", "ml", "pieces")
# Price of a supply → expense category
SUPPLY_EXPENSE = {
    "feed": "animals",
    "bee_feed": "animals",
    "fish_feed": "animals",
    "bedding": "animals",
    "fertilizer": "fertilizers",
    "treatment": "treatments",
}


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
    REPOTTING = "repotting"
    WOOD_BURNED = "wood_burned"  # firewood burnt over a winter, logged once at its end
    PHOTO = "photo"  # a picture of a zone or a plant from the photo plan, to compare over the years
    HIVE_INSPECTION = "hive_inspection"  # strength 1–5 in rating, queen seen in queen
    VARROA_COUNT = "varroa_count"  # mites: per day (drop) or % (sugar, alcohol test), method in product
    BEE_FEEDING = "bee_feeding"
    SWARM = "swarm"
    HONEY_HARVEST = "honey_harvest"  # kg in quantity, kind of honey in product
    PREDATOR = "predator"  # a sighting (Asian hornet…): what in product, how many in quantity
    WATER_TEST = "water_test"  # readings: pH, EC, temperature, ammonia, nitrites, nitrates
    FISH_FEEDING = "fish_feeding"  # grams in quantity
    FISH_WEIGHING = "fish_weighing"  # average weight in grams in quantity


class Severity(StrEnum):
    """How bad a pest or a disease is (the "problem" event)."""

    FEW = "few"
    SPREAD = "spread"
    HEAVY = "heavy"


class Worked(StrEnum):
    """Did a treatment work? Asked about ten days after it."""

    YES = "yes"
    PARTLY = "partly"
    NO = "no"


class EndReason(StrEnum):
    """Why a planting's life ended (the "removal" event)."""

    FINISHED = "finished"  # season over, harvest done
    DIED = "died"
    REMOVED = "removed"  # pulled out for another reason: moved, given away, not needed


class DeathCause(StrEnum):
    FROST = "frost"
    DROUGHT = "drought"
    DISEASE = "disease"
    PESTS = "pests"
    ANIMALS = "animals"
    UNKNOWN = "unknown"


class LeaveReason(StrEnum):
    PREDATOR = "predator"
    ILLNESS = "illness"
    AGE = "age"
    SOLD = "sold"
    SLAUGHTERED = "slaughtered"
    MOVED = "moved"  # to another tank or yard
    OTHER = "other"


# Animal and compost entries: no weather snapshot (eggs are logged every day).
NO_WEATHER_KINDS = frozenset(
    {
        "compost_turn",
        "compost_harvest",
        "eggs",
        "flock_in",
        "flock_out",
        "animal_care",
        "coop_cleaning",
        "varroa_count",
        "water_test",
        "fish_feeding",
        "fish_weighing",
    }
)
WATER_READINGS = ("ph", "ec", "temperature", "ammonia", "nitrite", "nitrate")
DEFAULT_VARROA_THRESHOLD = 10.0  # mites a day in the natural drop
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
    EventKind.BEE_FEEDING: ExpenseCategory.ANIMALS,
    EventKind.FISH_FEEDING: ExpenseCategory.ANIMALS,
}


class HarvestUnit(StrEnum):
    KG = "kg"
    PIECES = "pieces"
    LITRES = "l"
    QUINTAL = "q"  # 100 kg (Italy)
    STERE = "stere"  # 1 m³ of stacked logs (France)
    CUBIC_METRE = "m3"
    POUND = "lb"
    OUNCE = "oz"
    GALLON = "gal"
    GRAM = "g"  # products used by a treatment or a fertilising
    MILLILITRE = "ml"


class WateringMode(StrEnum):
    NONE = "none"  # rain only: old trees, meadow
    CAN = "can"
    HOSE = "hose"
    DRIP = "drip"
    OVERHEAD = "overhead"  # sprinklers: wet leaves


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

    # Soil sensors of this zone (a WH52 in the bed): they win over the general ones in the options.
    # Lists: several probes in the same bed are averaged (a single id from before 0.19.1 is read too).
    soil_moisture_entity: list[str] = field(default_factory=list)
    soil_temperature_entity: list[str] = field(default_factory=list)
    soil_ec_entity: list[str] = field(default_factory=list)
    watering: str | None = None  # WateringMode; None = as the parent zone
    # The valve that turns the water on, whatever the watering mode (drip, hose, sprinklers);
    # every run is logged as a watering of the zone.
    # Zones on the same valve with a hose moved by hand: only the one(s) with hose_here are watered.
    valve_entity: str | None = None
    hose_here: bool = True
    # The valve's flow meter (a flow rate or a volume total): how much water each run gave.
    flow_entity: str | None = None
    # Apiary (its hives follow it): mites a day that call for a treatment, and by month if it changes
    # through the year ({"3": 3, "8": 10}); none = DEFAULT_VARROA_THRESHOLD.
    varroa_threshold: float | None = None
    varroa_months: dict[str, float] = field(default_factory=dict)
    traps: int | None = None  # hornet traps set around the apiary
    # Water circuit: pH probes (EC and temperature use the soil_ec / soil_temperature fields).
    ph_entity: list[str] = field(default_factory=list)
    # Fish tank: the water it should have, {"ph": [6.8, 7.4], "nitrite": [None, 0.5]}; none = from its fish.
    water_targets: dict[str, list[float | None]] = field(default_factory=dict)

    def __post_init__(self) -> None:
        if self.watering == "valve":  # mode of 0.19 replaced by valve_entity (any mode can be on a valve)
            self.watering = None
        self.area_m2 = polygon_area_m2(self.geometry)
        self.species = clean_species(self.species)
        for attr in SOIL_SENSOR_FIELDS.values():
            setattr(self, attr, entity_list(getattr(self, attr)))
        self.ph_entity = entity_list(self.ph_entity)
        self.varroa_months = clean_months(self.varroa_months)
        self.water_targets = clean_targets(self.water_targets)


def clean_targets(value: Any) -> dict[str, list[float | None]]:
    """Water ranges {reading: [low, high]}: known readings, numbers or None (no limit), low <= high."""
    out: dict[str, list[float | None]] = {}
    if not isinstance(value, dict):
        return out
    for key, pair in value.items():
        if key not in WATER_READINGS or not isinstance(pair, list | tuple) or len(pair) != 2:
            continue
        low, high = (
            float(v) if isinstance(v, int | float) and not isinstance(v, bool) else None for v in pair
        )
        if low is None and high is None:
            continue
        if low is not None and high is not None and low > high:
            low, high = high, low
        out[key] = [low, high]
    return out


def entity_list(value: Any) -> list[str]:
    """Entity ids as a list without blanks or duplicates: a single id (older data) or a list."""
    items = [value] if isinstance(value, str) else value if isinstance(value, list | tuple) else []
    out: list[str] = []
    for item in items:
        if isinstance(item, str) and item.strip() and item.strip() not in out:
            out.append(item.strip())
    return out


def mean_reading(entities: list[str], readings: dict[str, float] | None) -> float | None:
    """Average of the sensors that answer, or None."""
    values = [readings[e] for e in entities if readings and readings.get(e) is not None]
    return round(sum(values) / len(values), 1) if values else None


def clean_species(value: Any) -> list[dict[str, Any]]:
    """Names (or {"name", "taxon_id"}) without blanks or duplicates."""
    out: list[dict[str, Any]] = []
    for item in value if isinstance(value, list) else []:
        entry = {"name": item, "taxon_id": None} if isinstance(item, str) else item
        if not isinstance(entry, dict) or not isinstance(entry.get("name"), str) or not entry["name"].strip():
            continue
        name = entry["name"].strip()
        if all(e["name"].lower() != name.lower() for e in out):
            clean = {"name": name, "taxon_id": entry.get("taxon_id") or None}
            # Flowers for the bees: the months of nectar and of pollen, when the user set them.
            for key in ("nectar", "pollen"):
                months = sorted(
                    {int(m) for m in entry.get(key) or [] if str(m).isdigit() and 1 <= int(m) <= 12}
                )
                if months:
                    clean[key] = months
            out.append(clean)
    return out


def clean_months(value: Any) -> dict[str, float]:
    """{"<month 1–12>": number} without anything else."""
    out: dict[str, float] = {}
    for key, number in (value or {}).items() if isinstance(value, dict) else []:
        if str(key).isdigit() and 1 <= int(key) <= 12 and isinstance(number, int | float) and number >= 0:
            out[str(int(key))] = float(number)
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
    # A row of plants (a group): the other end, [longitude, latitude]; the position is where it starts.
    row_to: list[float] | None = None
    # A group placed plant by plant on the plan: one [longitude, latitude] per plant. The group stays one
    # planting for the diary (harvests, treatments, waterings), only its plants have their own place.
    positions: list[list[float]] = field(default_factory=list)
    watering: str | None = None  # WateringMode; None = as its zone
    status: str = PlantingStatus.ACTIVE
    moon_phase: str | None = None
    sown_moon_phase: str | None = None
    seed_lot_id: str | None = None
    # Seedlings: how many seeds or cells were sown, when and how many came up.
    sown_count: int | None = None
    germinated_on: str | None = None
    germinated_count: int | None = None
    from_planting_id: str | None = None  # the nursery batch this one was planted out from
    # Houseplants: water every N days (longer in winter), feed every N weeks in the growing season,
    # or water when a soil moisture sensor reads below the threshold.
    water_days: int | None = None
    fertilize_weeks: int | None = None
    moisture_entity: list[str] = field(default_factory=list)  # soil moisture sensors (averaged)
    moisture_min: float | None = None
    care: str | None = None  # the user's own care notes (pruning, feeding, quirks…)
    notes: str | None = None
    # Growth stage 1-10 (10 = full size). It starts at growth_start on the planting
    # (or sowing) date and reaches 10 after growth_days; a stage set by hand (growth_set on
    # growth_set_on) moves it and it keeps growing from there at the same pace.
    growth_start: int | None = None
    growth_days: int | None = None
    growth_set: float | None = None
    growth_set_on: str | None = None

    def __post_init__(self) -> None:
        self.moisture_entity = entity_list(self.moisture_entity)
        self.positions = clean_positions(self.positions)
        if self.watering == "valve":
            self.watering = None
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
    supply_id: str | None = None  # the bag or box it paid for
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
    reason: str | None = None  # flock_out: why the hens left; removal: finished, died, removed
    cause: str | None = None  # removal of a dead planting: frost, drought…
    severity: str | None = None  # problem: few, spread, heavy (the pest or disease is in product)
    worked: str | None = None  # treatment: did it work (yes, partly, no)
    moon_phase: str | None = None
    weather: dict[str, Any] | None = None
    notes: str | None = None
    valve_minutes: float | None = None  # watering logged from a valve run: its length (minutes)
    animal: str | None = None  # eggs, flock_in, flock_out: hens, quails, rabbits, fish… (none = hens)
    queen: bool | None = None  # hive_inspection: queen (or fresh eggs) seen
    readings: dict[str, float] = field(default_factory=dict)  # water_test: WATER_READINGS
    lot_id: str | None = None  # flock_in, flock_out, fish_weighing: the fish lot (kept through moves)
    product_id: str | None = None  # fertilizing, treatment: the product from the catalogue

    def __post_init__(self) -> None:
        if not self.moon_phase:
            self.moon_phase = moon_phase(date.fromisoformat(self.done_on))
        readings = self.readings if isinstance(self.readings, dict) else {}
        self.readings = {
            k: float(v) for k, v in readings.items() if k in WATER_READINGS and isinstance(v, int | float)
        }


def _next_year_day(day: str | None) -> str | None:
    """The same day one year later (29 February becomes 28)."""
    if not day:
        return None
    d = date.fromisoformat(day)
    try:
        return d.replace(year=d.year + 1).isoformat()
    except ValueError:
        return d.replace(year=d.year + 1, day=28).isoformat()


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
    # A list task ("prune these 5 plants on Saturday"): plants and seed lots, ticked one by one.
    planting_ids: list[str] = field(default_factory=list)
    seed_ids: list[str] = field(default_factory=list)
    zone_ids: list[str] = field(default_factory=list)
    done_ids: list[str] = field(default_factory=list)
    # A period instead of a day (the photos of "early November"), and the plan that made it.
    due_until: str | None = None
    plan_id: str | None = None
    window_on: str | None = None  # first day of the plan period that made it (never moved)
    # Succession sowing: done → the same task again N weeks later, until that day.
    repeat_weeks: int | None = None
    repeat_until: str | None = None

    @property
    def items(self) -> list[str]:
        return [*self.zone_ids, *self.planting_ids, *self.seed_ids]

    @property
    def remaining(self) -> list[str]:
        return [i for i in self.items if i not in self.done_ids]

    def next_year(self) -> Task:
        """The same task one year later (29 February becomes 28), a succession up to the same day."""
        return Task(
            kind=self.kind,
            due_on=_next_year_day(self.due_on),
            title=self.title,
            planting_id=self.planting_id,
            zone_id=self.zone_id,
            yearly=True,
            notes=self.notes,
            planting_ids=list(self.planting_ids),
            seed_ids=list(self.seed_ids),
            zone_ids=list(self.zone_ids),
            repeat_weeks=self.repeat_weeks,
            repeat_until=_next_year_day(self.repeat_until),
        )

    def same_as(self, other: Task) -> bool:
        """The same planned work on the same day (a follow-up already made)."""
        return (
            self.kind == other.kind
            and self.due_on == other.due_on
            and self.title == other.title
            and self.planting_id == other.planting_id
            and self.zone_id == other.zone_id
            and self.planting_ids == other.planting_ids
            and self.seed_ids == other.seed_ids
            and self.zone_ids == other.zone_ids
        )

    def next_repeat(self, done_on: str) -> Task | None:
        """Succession sowing: the next one N weeks after this one was done, if still before the end."""
        if not self.repeat_weeks:
            return None
        due = date.fromisoformat(done_on) + timedelta(weeks=self.repeat_weeks)
        if self.repeat_until and due.isoformat() > self.repeat_until:
            return None
        return Task(
            kind=self.kind,
            due_on=due.isoformat(),
            title=self.title,
            planting_id=self.planting_id,
            zone_id=self.zone_id,
            notes=self.notes,
            planting_ids=list(self.planting_ids),
            seed_ids=list(self.seed_ids),
            zone_ids=list(self.zone_ids),
            repeat_weeks=self.repeat_weeks,
            repeat_until=self.repeat_until,
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
    service_months: int | None = None  # rough plan: next service this many months after the last one
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
    from_planting_id: str | None = None  # own seeds: the mother plant
    notes: str | None = None


@dataclass(kw_only=True)
class SupplyLot(_Record):
    """A bag, box or bottle: bought, opened, finished. Consumption is computed from those dates."""

    name: str
    id: str = field(default_factory=new_id)
    kind: str = SupplyKind.OTHER
    quantity: float | None = None
    unit: str = "kg"
    bought_on: str | None = None
    price: float | None = None
    supplier: str | None = None
    opened_on: str | None = None
    finished_on: str | None = None
    expires_on: str | None = None
    zone_id: str | None = None  # who uses it: a coop, an apiary, a tank, a vegetable zone
    animal: str | None = None  # in a mixed yard, the animals that eat it (Animal); none = all of them
    shopping_on: str | None = None  # when it was put on the shopping list (once)
    product_id: str | None = None
    notes: str | None = None


@dataclass(kw_only=True)
class Product(_Record):
    """What a product is, shared by its bags: NPK, organic, dose, copper, pre-harvest interval."""

    name: str
    id: str = field(default_factory=new_id)
    brand: str | None = None
    kind: str = SupplyKind.OTHER
    npk: list[float] = field(default_factory=list)  # [N, P, K] in %
    organic: bool = False  # allowed in organic gardening
    dose: str | None = None  # as on the label: "50 g/m²", "30 g/10 L"
    active_ingredient: str | None = None
    copper_percent: float | None = None  # copper content in % (treatments)
    pre_harvest_days: int | None = None  # days from treatment to harvest (label)
    notes: str | None = None

    def __post_init__(self) -> None:
        values = [float(v) for v in self.npk or [] if isinstance(v, int | float) and not isinstance(v, bool)]
        self.npk = values[:3] if len(values) >= 3 else []


@dataclass(kw_only=True)
class FishSpecies(_Record):
    """A fish species as the user keeps it: the water it needs and how to feed it (filled in by hand)."""

    name: str
    id: str = field(default_factory=new_id)
    scientific_name: str | None = None
    targets: dict[str, list[float | None]] = field(default_factory=dict)  # as Zone.water_targets
    feeding: str | None = None
    notes: str | None = None

    def __post_init__(self) -> None:
        self.targets = clean_targets(self.targets)


@dataclass(kw_only=True)
class FishLot(_Record):
    """A group of fish followed together, with its parents (spawned here) like a line of own seeds.

    How many and where come from the arrivals, departures and moves with its ``lot_id``.
    """

    name: str
    id: str = field(default_factory=new_id)
    species_id: str | None = None
    parent_ids: list[str] = field(default_factory=list)
    started_on: str | None = None  # hatched or arrived
    finished: bool = False
    notes: str | None = None

    def __post_init__(self) -> None:
        self.parent_ids = list(dict.fromkeys(i for i in self.parent_ids or [] if i and i != self.id))


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
    # Originals of the photo plan: the HA media folder they live in (None = "local") and a small copy.
    root: str | None = None
    thumb: str | None = None


PHOTO_PARTS = {"start": 1, "mid": 11, "end": 21}  # first day of "early / mid / late" in a month
PHOTO_WINDOW_DAYS = 14


@dataclass(kw_only=True)
class PhotoPlan(_Record):
    """Pictures of the same zones and plants, period after period: "early May", or every N weeks."""

    id: str = field(default_factory=new_id)
    zone_ids: list[str] = field(default_factory=list)
    planting_ids: list[str] = field(default_factory=list)
    periods: list[dict[str, Any]] = field(default_factory=list)  # [{"month": 5, "part": "start"}]
    every_weeks: int | None = None
    start_on: str | None = None  # first day of the first window, with every_weeks
    # The order of the round: "manual" (``order``: the ids as the user arranged them) or "zone"
    # (each zone followed by the plants inside it).
    sort: str = "manual"
    order: list[str] = field(default_factory=list)
    # First day of the last period that opened a task: a done task deleted (HA to-do "clear completed")
    # does not come back.
    last_window: str | None = None

    def windows(self, year: int) -> list[tuple[date, date]]:
        """The periods of a year (and those of the year before that end in it), sorted."""
        out = []
        if self.every_weeks:
            step = timedelta(weeks=self.every_weeks)
            length = timedelta(days=min(PHOTO_WINDOW_DAYS, max(3, self.every_weeks * 7 // 2)) - 1)
            day = date.fromisoformat(self.start_on) if self.start_on else date(year, 1, 1)
            while day.year <= year:
                if (day + length).year >= year:
                    out.append((day, day + length))
                day += step
            return out
        for y in (year - 1, year):
            for period in self.periods:
                start = date(y, int(period["month"]), PHOTO_PARTS.get(period.get("part"), 1))
                end = start + timedelta(days=PHOTO_WINDOW_DAYS - 1)
                if year in (start.year, end.year):
                    out.append((start, end))
        return sorted(set(out))

    def window_at(self, today: date) -> tuple[date, date] | None:
        return next((w for w in self.windows(today.year) if w[0] <= today <= w[1]), None)

    def next_window(self, today: date) -> tuple[date, date] | None:
        later = [w for y in (today.year, today.year + 1) for w in self.windows(y) if w[0] > today]
        return min(later) if later else None


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
    "photo_plans": PhotoPlan,
    "fish_species": FishSpecies,
    "fish_lots": FishLot,
    "supplies": SupplyLot,
    "products": Product,
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
    photo_plans: dict[str, PhotoPlan] = field(default_factory=dict)
    fish_species: dict[str, FishSpecies] = field(default_factory=dict)
    fish_lots: dict[str, FishLot] = field(default_factory=dict)
    supplies: dict[str, SupplyLot] = field(default_factory=dict)
    products: dict[str, Product] = field(default_factory=dict)
    # Choices for the whole house: {"modules": [...]} (absent = every module on)
    settings: dict[str, Any] = field(default_factory=dict)

    @classmethod
    def from_dict(cls, raw: dict[str, Any]) -> HomesteadData:
        data = cls()
        for name, record_cls in _COLLECTIONS.items():
            target = getattr(data, name)
            for item in raw.get(name, []):
                record = record_cls.from_dict(item)
                target[record.id] = record  # type: ignore[attr-defined]
        data.settings = clean_settings(raw.get("settings"))
        return data

    def to_dict(self) -> dict[str, Any]:
        out: dict[str, Any] = {
            name: [r.to_dict() for r in getattr(self, name).values()] for name in _COLLECTIONS
        }
        out["settings"] = dict(self.settings)
        return out

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


# Parts of the garden a household may not have: switched off, they leave the zone and event menus.
MODULES = ("coop", "bees", "water", "woodland", "indoor", "compost")


def clean_settings(raw: Any) -> dict[str, Any]:
    """Only known settings: the modules switched on (a list; absent = all of them)."""
    out: dict[str, Any] = {}
    if isinstance(raw, dict) and isinstance(raw.get("modules"), list):
        out["modules"] = [m for m in MODULES if m in raw["modules"]]
    return out


def animals(data: HomesteadData, zone_id: str, until: str | None = None) -> dict[str, int]:
    """Animals in a yard or a fish tank, by kind: arrivals minus departures (up to a date, included)."""
    counts: dict[str, int] = {}
    for e in data.events.values():
        if e.zone_id != zone_id or (until and e.done_on > until) or not e.quantity:
            continue
        if e.kind in (EventKind.FLOCK_IN, EventKind.FLOCK_OUT):
            kind = e.animal or Animal.HENS
            counts[kind] = counts.get(kind, 0) + int(e.quantity) * (1 if e.kind == EventKind.FLOCK_IN else -1)
    return {kind: n for kind, n in counts.items() if n > 0}


def hens(data: HomesteadData, zone_id: str, until: str | None = None) -> int:
    """Hens in a yard (entries from before 0.22, without an animal, are hens)."""
    return animals(data, zone_id, until).get(Animal.HENS, 0)


def lot_counts(data: HomesteadData, zone_id: str | None = None, until: str | None = None) -> dict[str, int]:
    """Fish per lot (in one tank, or everywhere): arrivals minus departures with that ``lot_id``."""
    counts: dict[str, int] = {}
    for e in data.events.values():
        if (
            not e.lot_id
            or not e.quantity
            or (zone_id and e.zone_id != zone_id)
            or (until and e.done_on > until)
        ):
            continue
        if e.kind in (EventKind.FLOCK_IN, EventKind.FLOCK_OUT):
            sign = 1 if e.kind == EventKind.FLOCK_IN else -1
            counts[e.lot_id] = counts.get(e.lot_id, 0) + sign * int(e.quantity)
    return {lot: n for lot, n in counts.items() if n > 0}


def tank_species(data: HomesteadData, tank_id: str) -> list[FishSpecies]:
    """The species of the lots living in a tank now."""
    out: dict[str, FishSpecies] = {}
    for lot_id in lot_counts(data, tank_id):
        lot = data.fish_lots.get(lot_id)
        species = lot and data.fish_species.get(lot.species_id or "")
        if species:
            out[species.id] = species
    return list(out.values())


def _overlap(ranges: list[list[float | None]]) -> list[float | None] | None:
    """The common part of several ranges (None = no limit on that side); None when they do not meet."""
    lows = [r[0] for r in ranges if r[0] is not None]
    highs = [r[1] for r in ranges if r[1] is not None]
    low, high = (max(lows) if lows else None), (min(highs) if highs else None)
    if low is not None and high is not None and low > high:
        return None
    return [low, high]


def tank_targets(data: HomesteadData, tank_id: str) -> dict[str, list[float | None]]:
    """What the tank's water should be: its own ranges, else the part all its species accept."""
    zone = data.zones.get(tank_id)
    out = dict(zone.water_targets) if zone else {}
    species = tank_species(data, tank_id)
    for key in WATER_READINGS:
        ranges = [s.targets[key] for s in species if key in s.targets]
        if key not in out and ranges and (common := _overlap(ranges)):
            out[key] = common
    return out


def tank_conflicts(data: HomesteadData, tank_id: str) -> list[str]:
    """Readings for which the species sharing a tank want ranges that do not meet."""
    species = tank_species(data, tank_id)
    return [
        key
        for key in WATER_READINGS
        if len(ranges := [s.targets[key] for s in species if key in s.targets]) > 1
        and _overlap(ranges) is None
    ]


def varroa_threshold(data: HomesteadData, zone_id: str | None, month: int) -> float:
    """Mites a day that call for a treatment: set on the hive or its apiary (by month if set), else 10."""
    seen: set[str] = set()
    while zone_id and zone_id not in seen and (zone := data.zones.get(zone_id)):
        if (value := zone.varroa_months.get(str(month))) is not None:
            return value
        if zone.varroa_threshold is not None:
            return zone.varroa_threshold
        seen.add(zone_id)
        zone_id = zone.parent_id
    return DEFAULT_VARROA_THRESHOLD


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


WINTER_MONTHS = (11, 12, 1, 2)
WINTER_FACTOR = 1.5
DEFAULT_MOISTURE_MIN = 20.0


def zone_kind(data: HomesteadData, zone_id: str | None) -> str | None:
    """Kind of a zone or, if it has none, of the closest parent that has one."""
    seen: set[str] = set()
    while zone_id and zone_id not in seen and (zone := data.zones.get(zone_id)):
        if zone.kind:
            return zone.kind
        seen.add(zone_id)
        zone_id = zone.parent_id
    return None


SOIL_SENSOR_FIELDS = {
    "moisture": "soil_moisture_entity",
    "temperature": "soil_temperature_entity",
    "ec": "soil_ec_entity",
}


def zone_soil_sensors(data: HomesteadData, zone_id: str | None) -> dict[str, list[str]]:
    """Soil sensors of a zone, each kind from the closest zone (itself, then its parents) that has it."""
    found: dict[str, list[str]] = {}
    seen: set[str] = set()
    while zone_id and zone_id not in seen and (zone := data.zones.get(zone_id)):
        for name, attr in SOIL_SENSOR_FIELDS.items():
            if name not in found and getattr(zone, attr):
                found[name] = getattr(zone, attr)
        seen.add(zone_id)
        zone_id = zone.parent_id
    return found


def is_indoor(data: HomesteadData, planting: Planting | None) -> bool:
    return planting is not None and zone_kind(data, planting.zone_id) == ZoneKind.INDOOR


def watering_interval(planting: Planting, today: date) -> int | None:
    """Days between waterings: the plant's own, half as much again in winter."""
    if not planting.water_days:
        return None
    factor = WINTER_FACTOR if today.month in WINTER_MONTHS else 1
    return max(round(planting.water_days * factor), 1)


def watering_due(
    data: HomesteadData, today: date, moisture: dict[str, float] | None = None
) -> list[Planting]:
    """Houseplants to water today: dry soil by their sensor, else their interval since the last watering."""
    last: dict[str, str] = {}
    for e in data.events.values():
        if e.kind == EventKind.WATERING and e.planting_id and e.done_on > last.get(e.planting_id, ""):
            last[e.planting_id] = e.done_on
    due = []
    for p in data.active_plantings():
        if not is_indoor(data, p):
            continue
        reading = mean_reading(p.moisture_entity, moisture)
        if reading is not None:
            if reading < (p.moisture_min or DEFAULT_MOISTURE_MIN):
                due.append(p)
            continue
        if (interval := watering_interval(p, today)) is None:
            continue
        since = last.get(p.id) or p.planted_on
        if not since or (today - date.fromisoformat(since)).days >= interval:
            due.append(p)
    return sorted(due, key=lambda p: p.name)


# ---------------------------------------------------------------- growth stages

# Days from planting to full size when the planting does not say, by plant type.
DEFAULT_GROWTH_DAYS: dict[str, int] = {
    PlantType.VEGETABLE: 75,
    PlantType.HERB: 60,
    PlantType.FLOWER: 60,
    PlantType.HOUSEPLANT: 365,
    PlantType.VINE: 730,
    PlantType.SHRUB: 730,
    PlantType.FRUIT_TREE: 1460,
    PlantType.TREE: 3650,
}
FALLBACK_GROWTH_DAYS = 90


def growth_start_stage(planting: Planting) -> int:
    """The stage a planting starts at: as set, else 1 from seed, 2 for a transplant, 10 if already there."""
    if planting.growth_start:
        return max(1, min(10, planting.growth_start))
    if planting.origin == PlantingOrigin.EXISTING:
        return 10
    if planting.origin == PlantingOrigin.SOWN and not planting.planted_on:
        return 1
    # planted, or sown and then transplanted
    return 2 if planting.planted_on or planting.origin == PlantingOrigin.PLANTED else 1


def growth_days(planting: Planting) -> int:
    return planting.growth_days or DEFAULT_GROWTH_DAYS.get(planting.plant_type or "", FALLBACK_GROWTH_DAYS)


def growth_stage(planting: Planting, today: date) -> float:
    """Growth stage 1-10 today (10 = full size), rounded to tenths."""
    start = growth_start_stage(planting)
    # stages per day; a planting that was already full grown and set back by hand grows like a seedling
    rate = (10 - start if start < 10 else 9) / max(1, growth_days(planting))
    if planting.growth_set is not None and planting.growth_set_on:
        stage, since = float(planting.growth_set), planting.growth_set_on
    else:
        stage, since = float(start), planting.planted_on or planting.sown_on
    if since:
        stage += rate * max(0, (today - date.fromisoformat(since[:10])).days)
    return round(max(1.0, min(10.0, stage)), 1)


# ---------------------------------------------------------------- plants of a group


def clean_positions(value: Any) -> list[list[float]]:
    """[longitude, latitude] pairs only, rounded like the panel (1e-7)."""
    out = []
    for item in value if isinstance(value, list | tuple) else []:
        if (
            isinstance(item, list | tuple)
            and len(item) == 2
            and all(isinstance(v, int | float) and not isinstance(v, bool) for v in item)
            and -180 <= item[0] <= 180
            and -90 <= item[1] <= 90
        ):
            out.append([round(float(item[0]), 7), round(float(item[1]), 7)])
    return out


def _spots(planting: Planting) -> list[list[float]]:
    if planting.positions:
        return [list(p) for p in planting.positions]
    if planting.latitude is not None and planting.longitude is not None:
        return [[planting.longitude, planting.latitude]]
    return []


def merge_plantings(data: HomesteadData, target_id: str, other_ids: list[str]) -> Planting:
    """Plants split by mistake go back into one group: quantities add up, every plant keeps its place
    (positions), and the diary, photos, expenses, tasks and seeds of the others now point to the group."""
    target = data.plantings[target_id]
    others = [data.plantings[i] for i in dict.fromkeys(other_ids) if i != target_id and i in data.plantings]
    if not others:
        return target
    positions = _spots(target)
    quantity = target.quantity if target.kind == PlantingKind.GROUP else 1
    for other in others:
        positions += _spots(other)
        quantity += other.quantity if other.kind == PlantingKind.GROUP else 1
    gone = {o.id for o in others}
    for name in _COLLECTIONS:
        for record in getattr(data, name).values():
            for attr in ("planting_id", "from_planting_id"):
                if getattr(record, attr, None) in gone:
                    setattr(record, attr, target_id)
            for attr in ("planting_ids", "done_ids"):
                values = getattr(record, attr, None)
                if isinstance(values, list) and gone & set(values):
                    setattr(record, attr, list(dict.fromkeys(target_id if v in gone else v for v in values)))
    for other in others:
        del data.plantings[other.id]
    target.kind = PlantingKind.GROUP
    target.quantity = quantity
    target.positions = clean_positions(positions)
    target.row_to = None
    return target
