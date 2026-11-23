"""Fish species filled in by hand, lots with parents kept through moves, water targets per tank."""

from homeassistant.core import HomeAssistant
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.homestead.backup import make_backup, read_backup
from custom_components.homestead.const import DOMAIN
from custom_components.homestead.models import (
    Event,
    FishLot,
    FishSpecies,
    HomesteadData,
    Zone,
    clean_targets,
    lot_counts,
    tank_conflicts,
    tank_targets,
)


def test_targets_are_cleaned() -> None:
    assert clean_targets(
        {"ph": [7.4, 6.8], "nitrite": [None, 0.5], "rocket": [1, 2], "ec": [None, None]}
    ) == {
        "ph": [6.8, 7.4],
        "nitrite": [None, 0.5],
    }
    assert clean_targets("x") == {}


def _data() -> HomesteadData:
    data = HomesteadData()
    for zone in (
        Zone(id="t1", name="Tank 1", kind="fish_tank"),
        Zone(id="t2", name="Tank 2", kind="fish_tank"),
    ):
        data.zones[zone.id] = zone
    data.fish_species["tl"] = FishSpecies(
        id="tl", name="Tilapia", targets={"ph": [6.5, 8.5], "temperature": [22, 30]}
    )
    data.fish_species["tr"] = FishSpecies(
        id="tr", name="Trout", targets={"ph": [6.5, 8.0], "temperature": [10, 18]}
    )
    data.fish_lots["a"] = FishLot(id="a", name="Tilapia A", species_id="tl")
    data.fish_lots["b"] = FishLot(id="b", name="Trout B", species_id="tr")

    def ev(kind: str, zone: str, lot: str, n: int, day: str) -> None:
        e = Event(kind=kind, done_on=day, zone_id=zone, quantity=n, animal="fish", lot_id=lot)
        data.events[e.id] = e

    ev("flock_in", "t1", "a", 40, "2026-03-01")
    ev("flock_out", "t1", "a", 15, "2026-05-01")  # moved: same lot in tank 2
    ev("flock_in", "t2", "a", 15, "2026-05-01")
    ev("flock_out", "t2", "a", 2, "2026-06-01")  # losses
    return data


def test_lot_kept_through_partial_moves() -> None:
    data = _data()
    assert lot_counts(data) == {"a": 38}
    assert lot_counts(data, "t1") == {"a": 25}
    assert lot_counts(data, "t2") == {"a": 13}
    assert lot_counts(data, "t2", until="2026-05-15") == {"a": 15}


def test_tank_targets_from_species_and_conflicts() -> None:
    data = _data()
    assert tank_targets(data, "t1") == {"ph": [6.5, 8.5], "temperature": [22, 30]}
    assert tank_conflicts(data, "t1") == []
    trout = Event(kind="flock_in", done_on="2026-06-01", zone_id="t1", quantity=10, animal="fish", lot_id="b")
    data.events[trout.id] = trout
    assert tank_conflicts(data, "t1") == ["temperature"]  # 22-30 and 10-18 do not meet
    assert tank_targets(data, "t1") == {"ph": [6.5, 8.0]}  # only what both accept
    data.zones["t1"].water_targets = {"temperature": [14, 20]}  # the user's own range wins
    assert tank_targets(data, "t1")["temperature"] == [14, 20]


async def test_fish_services_and_backup(hass: HomeAssistant) -> None:
    entry = MockConfigEntry(domain=DOMAIN, title="HA Homestead")
    entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    store = entry.runtime_data

    async def call(service: str, data: dict) -> dict:
        return await hass.services.async_call(DOMAIN, service, data, blocking=True, return_response=True)

    tank = (
        await call("add_zone", {"name": "Tank", "kind": "fish_tank", "water_targets": {"ph": [7.4, 6.8]}})
    )["id"]
    assert store.data.zones[tank].water_targets == {"ph": [6.8, 7.4]}
    species = (await call("add_fish_species", {"name": "Tilapia", "targets": {"temperature": [22, 30]}}))[
        "id"
    ]
    parents = (await call("add_fish_lot", {"name": "Breeders", "species_id": species}))["id"]
    fry = (
        await call(
            "add_fish_lot",
            {"name": "Fry 2026", "species_id": species, "parent_ids": [parents], "started_on": "2026-04-02"},
        )
    )["id"]
    assert store.data.fish_lots[fry].parent_ids == [parents]
    await call(
        "add_event", {"kind": "flock_in", "zone_id": tank, "quantity": 200, "animal": "fish", "lot_id": fry}
    )
    assert lot_counts(store.data, tank) == {fry: 200}
    await call("update_fish_species", {"id": species, "feeding": "3% of body weight"})
    assert store.data.fish_species[species].targets == {"temperature": [22, 30]}

    back = read_backup(make_backup(store.data, "2026-11-23", "0.24.0"))
    assert back.fish_lots[fry].parent_ids == [parents]

    await call("delete_fish_lot", {"id": parents})
    assert store.data.fish_lots[fry].parent_ids == []
    await call("delete_fish_species", {"id": species})
    assert store.data.fish_lots[fry].species_id is None
    await call("delete_fish_lot", {"id": fry})
    assert all(e.lot_id is None for e in store.data.events.values())


def test_backup_drops_orphan_fish_refs() -> None:
    data = HomesteadData()
    data.fish_lots["x"] = FishLot(id="x", name="X", species_id="gone", parent_ids=["ghost"])
    e = Event(kind="flock_in", done_on="2026-01-01", lot_id="ghost")
    data.events[e.id] = e
    back = read_backup(make_backup(data, "2026-11-23", "0.24.0"))
    assert back.fish_lots["x"].species_id is None and back.fish_lots["x"].parent_ids == []
    assert back.events[e.id].lot_id is None
