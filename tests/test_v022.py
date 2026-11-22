"""0.22: farmyard animals by kind, apiary and hives, flowers for bees, water circuit and fish tanks."""

from datetime import date

from homeassistant.core import HomeAssistant
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.homestead.backup import make_backup, read_backup
from custom_components.homestead.const import DOMAIN
from custom_components.homestead.models import (
    Event,
    HomesteadData,
    Planting,
    Zone,
    animals,
    hens,
    varroa_threshold,
)
from custom_components.homestead.water import zones_balance


def test_a_yard_counts_each_animal_and_old_entries_are_hens() -> None:
    data = HomesteadData()
    data.zones["yard"] = Zone(id="yard", name="Pollaio", kind="coop")
    moves = [
        ("flock_in", None, 7, "2026-01-10"),  # before 0.22: hens
        ("flock_out", None, 1, "2026-10-05"),
        ("flock_in", "quails", 12, "2026-10-20"),
        ("flock_in", "rabbits", 4, "2026-06-01"),
        ("flock_in", "rabbits", 7, "2026-11-02"),  # a litter
        ("flock_out", "rabbits", 3, "2026-09-14"),
    ]
    for kind, animal, n, day in moves:
        event = Event(kind=kind, done_on=day, zone_id="yard", quantity=n, animal=animal)
        data.events[event.id] = event
    assert animals(data, "yard") == {"hens": 6, "quails": 12, "rabbits": 8}
    assert hens(data, "yard") == 6
    assert animals(data, "yard", until="2026-10-31") == {"hens": 6, "quails": 12, "rabbits": 1}


def test_varroa_threshold_from_the_hive_its_apiary_or_the_default() -> None:
    data = HomesteadData()
    data.zones["apiary"] = Zone(
        id="apiary",
        name="Apiario",
        kind="apiary",
        varroa_threshold=8,
        varroa_months={"3": 3, "13": 1, "x": 2},
    )
    data.zones["hive"] = Zone(id="hive", name="Arnia 1", kind="hive", parent_id="apiary")
    data.zones["alone"] = Zone(id="alone", name="Arnia sola", kind="hive")
    assert data.zones["apiary"].varroa_months == {"3": 3.0}
    assert varroa_threshold(data, "hive", 3) == 3
    assert varroa_threshold(data, "hive", 9) == 8
    assert varroa_threshold(data, "alone", 9) == 10


def test_flowers_months_water_readings_and_no_watering_for_the_new_zones() -> None:
    zone = Zone(
        name="Prato",
        kind="melliferous",
        species=[{"name": "Phacelia", "nectar": [6, 7, 7, 13], "pollen": ["5"]}, {"name": "Edera"}],
    )
    assert zone.species == [
        {"name": "Phacelia", "taxon_id": None, "nectar": [6, 7], "pollen": [5]},
        {"name": "Edera", "taxon_id": None},
    ]
    test = Event(kind="water_test", done_on="2026-11-18", readings={"ph": 7.4, "nitrite": 0.1, "colour": 2})
    assert test.readings == {"ph": 7.4, "nitrite": 0.1}

    data = HomesteadData()
    for kind in ("apiary", "melliferous", "hydroponic"):
        data.zones[kind] = Zone(id=kind, name=kind, kind=kind)
        data.plantings[kind] = Planting(id=kind, name="x", species="Phacelia tanacetifolia", zone_id=kind)
    days = [{"date": "2026-07-01", "rain_mm": 0, "et0_mm": 6}]
    assert zones_balance(data, days, date(2026, 7, 2), {}) == {}


async def test_services_and_backup_keep_the_new_fields(hass: HomeAssistant) -> None:
    entry = MockConfigEntry(domain=DOMAIN, title="HA Homestead")
    entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    store = entry.runtime_data

    async def call(service: str, data: dict) -> dict:
        return await hass.services.async_call(DOMAIN, service, data, blocking=True, return_response=True)

    apiary = (
        await call(
            "add_zone",
            {
                "name": "Apiario",
                "kind": "apiary",
                "varroa_threshold": 8,
                "varroa_months": {"3": 3},
                "traps": 3,
            },
        )
    )["id"]
    hive = (await call("add_zone", {"name": "Arnia 3", "kind": "hive", "parent_id": apiary}))["id"]
    circuit = (await call("add_zone", {"name": "Circuito", "kind": "hydroponic", "ph_entity": "sensor.ph"}))[
        "id"
    ]
    tank = (await call("add_zone", {"name": "Vasca 1", "kind": "fish_tank", "parent_id": circuit}))["id"]
    assert store.data.zones[apiary].traps == 3
    assert store.data.zones[circuit].ph_entity == ["sensor.ph"]

    await call(
        "add_event",
        {"kind": "hive_inspection", "zone_id": hive, "done_on": "2026-11-08", "rating": 2, "queen": False},
    )
    await call(
        "add_event",
        {"kind": "varroa_count", "zone_id": hive, "done_on": "2026-11-18", "quantity": 12, "product": "drop"},
    )
    await call(
        "add_event", {"kind": "honey_harvest", "zone_id": hive, "done_on": "2026-07-10", "quantity": 6}
    )
    await call("add_event", {"kind": "predator", "zone_id": apiary, "done_on": "2026-10-14", "quantity": 3})
    await call(
        "add_event",
        {"kind": "flock_in", "zone_id": tank, "done_on": "2026-09-02", "quantity": 40, "animal": "fish"},
    )
    await call(
        "add_event",
        {
            "kind": "flock_out",
            "zone_id": tank,
            "done_on": "2026-11-10",
            "quantity": 2,
            "animal": "fish",
            "reason": "moved",
        },
    )
    await call(
        "add_event",
        {
            "kind": "water_test",
            "zone_id": circuit,
            "done_on": "2026-11-18",
            "readings": {"ph": 7.4, "nitrate": 40},
        },
    )
    await hass.async_block_till_done()
    inspection = next(e for e in store.data.events.values() if e.kind == "hive_inspection")
    assert (inspection.rating, inspection.queen) == (2, False)
    assert animals(store.data, tank) == {"fish": 38}
    count = next(e for e in store.data.events.values() if e.kind == "varroa_count")
    assert count.weather is None  # counts and water tests have no weather snapshot

    back = read_backup(make_backup(store.data, "2026-11-22", "0.22.0"))
    assert back.zones[apiary].varroa_months == {"3": 3.0}
    assert next(e for e in back.events.values() if e.kind == "water_test").readings == {
        "ph": 7.4,
        "nitrate": 40.0,
    }
