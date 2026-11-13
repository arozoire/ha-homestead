"""Valves on zones, watering logged from valve runs, the hand-moved hose, growth."""

from datetime import date, timedelta

from homeassistant.core import HomeAssistant
from homeassistant.util import dt as dt_util
from pytest_homeassistant_custom_component.common import MockConfigEntry, async_fire_time_changed

from custom_components.homestead.const import DOMAIN
from custom_components.homestead.irrigation import watered_zones
from custom_components.homestead.models import Planting, Zone, growth_stage
from custom_components.homestead.store import get_store


def test_growth_from_seed_reaches_full_size_after_its_days() -> None:
    p = Planting(
        name="Lettuce 1",
        species="Lactuca sativa",
        plant_type="vegetable",
        origin="sown",
        sown_on="2026-10-01",
        growth_days=90,
    )
    assert growth_stage(p, date(2026, 10, 1)) == 1.0
    assert growth_stage(p, date(2026, 11, 15)) == 5.5
    assert growth_stage(p, date(2027, 6, 1)) == 10.0


def test_transplant_starts_higher_and_a_hand_set_stage_keeps_growing() -> None:
    p = Planting(
        name="Lettuce 2",
        species="Lactuca sativa",
        plant_type="vegetable",
        origin="planted",
        planted_on="2026-10-01",
        growth_days=80,
    )
    assert growth_stage(p, date(2026, 10, 1)) == 2.0  # a transplant starts at 2
    p.growth_set, p.growth_set_on = 6.0, "2026-10-11"
    # 8 stages over 80 days = 0.1 a day from 6 on Oct 11
    assert growth_stage(p, date(2026, 10, 21)) == 7.0
    p.growth_start = 3
    assert (
        growth_stage(
            Planting(
                name="x",
                species="y",
                origin="planted",
                planted_on="2026-10-01",
                growth_start=3,
                growth_days=70,
            ),
            date(2026, 10, 1),
        )
        == 3.0
    )


def test_existing_plants_are_full_size_and_defaults_come_from_the_type() -> None:
    tree = Planting(name="Apple Tree", species="Malus domestica", plant_type="fruit_tree", origin="existing")
    assert growth_stage(tree, date(2026, 11, 10)) == 10.0
    herb = Planting(
        name="Basil", species="Ocimum basilicum", plant_type="herb", origin="planted", planted_on="2026-10-01"
    )
    # herbs: 60 days, from 2: 8 stages / 60 days
    assert growth_stage(herb, date(2026, 10, 31)) == 6.0


def test_watered_zones_honour_the_hose() -> None:
    zones = [
        Zone(id="b2", name="Bed 2", valve_entity="valve.ffb", hose_here=False),
        Zone(id="b10", name="Bed 10", valve_entity="valve.ffb", hose_here=True),
        Zone(id="b4", name="Bed 4", valve_entity="valve.fy"),
        Zone(id="b5", name="Bed 5", valve_entity="valve.fy"),
    ]
    assert [z.id for z in watered_zones(zones, "valve.ffb")] == ["b10"]
    # a single zone on a valve is always watered, however the hose flag is set
    assert [z.id for z in watered_zones(zones[:1], "valve.ffb")] == ["b2"]
    # several zones on a valve with the hose flag left on (drip): all of them
    assert [z.id for z in watered_zones(zones, "valve.fy")] == ["b4", "b5"]


async def _setup(hass: HomeAssistant) -> None:
    entry = MockConfigEntry(domain=DOMAIN, title="HA Homestead")
    entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()


async def test_valve_run_logs_a_watering_on_its_zones(hass: HomeAssistant, freezer) -> None:
    await _setup(hass)
    hass.states.async_set("valve.front_yard", "closed", {"friendly_name": "Front Yard"})
    out = await hass.services.async_call(
        DOMAIN,
        "add_zone",
        {"name": "Bed 4", "valve_entity": "valve.front_yard"},
        blocking=True,
        return_response=True,
    )
    await hass.async_block_till_done()
    zone_id = out["id"]
    hass.states.async_set("valve.front_yard", "open", {"friendly_name": "Front Yard"})
    await hass.async_block_till_done()
    freezer.tick(timedelta(minutes=90))
    async_fire_time_changed(hass)
    hass.states.async_set("valve.front_yard", "closed", {"friendly_name": "Front Yard"})
    await hass.async_block_till_done()
    events = [e for e in get_store(hass).data.events.values() if e.zone_id == zone_id]
    assert len(events) == 1
    assert events[0].kind == "watering"
    assert events[0].valve_minutes == 90
    assert events[0].done_on == dt_util.now().date().isoformat()


async def test_short_valve_blips_are_not_logged(hass: HomeAssistant) -> None:
    await _setup(hass)
    hass.states.async_set("valve.trees", "closed")
    await hass.services.async_call(
        DOMAIN,
        "add_zone",
        {"name": "Bed 13", "valve_entity": "valve.trees"},
        blocking=True,
        return_response=True,
    )
    await hass.async_block_till_done()
    hass.states.async_set("valve.trees", "open")
    hass.states.async_set("valve.trees", "closed")
    await hass.async_block_till_done()
    assert not get_store(hass).data.events


async def test_set_hose_and_set_growth_services(hass: HomeAssistant) -> None:
    await _setup(hass)
    a = await hass.services.async_call(
        DOMAIN,
        "add_zone",
        {"name": "Bed 2", "valve_entity": "valve.ffb"},
        blocking=True,
        return_response=True,
    )
    b = await hass.services.async_call(
        DOMAIN,
        "add_zone",
        {"name": "Bed 10", "valve_entity": "valve.ffb"},
        blocking=True,
        return_response=True,
    )
    await hass.services.async_call(
        DOMAIN, "set_hose", {"zone_id": b["id"]}, blocking=True, return_response=True
    )
    zones = get_store(hass).data.zones
    assert zones[b["id"]].hose_here and not zones[a["id"]].hose_here
    p = await hass.services.async_call(
        DOMAIN,
        "add_planting",
        {
            "name": "Lettuce 1",
            "species": "Lactuca sativa",
            "origin": "sown",
            "sown_on": "2026-10-01",
            "growth_days": 60,
            "zone_id": a["id"],
        },
        blocking=True,
        return_response=True,
    )
    out = await hass.services.async_call(
        DOMAIN, "set_growth", {"id": p["id"], "stage": 4}, blocking=True, return_response=True
    )
    assert out["stage"] == 4
    planting = get_store(hass).data.plantings[p["id"]]
    assert planting.growth_set == 4 and planting.growth_set_on == dt_util.now().date().isoformat()


def test_the_valve_is_separate_from_the_watering_mode() -> None:
    # the mode says how the water gets there, the valve what turns it on
    assert Zone(name="Bed 3", valve_entity="valve.front_yard", watering="drip").watering == "drip"
    assert Zone(name="Bed 11", valve_entity="valve.trees", watering="hose").valve_entity == "valve.trees"
    assert Zone(name="Bed 4", valve_entity="valve.front_yard").watering is None


async def test_valve_run_with_a_flow_meter_logs_the_water(hass: HomeAssistant, freezer) -> None:
    await _setup(hass)
    flow = {"unit_of_measurement": "m³/h", "device_class": "volume_flow_rate"}
    hass.states.async_set("valve.trees", "closed", {"friendly_name": "Tree Valve"})
    hass.states.async_set("sensor.trees_flow", "0.0", flow)
    zones = []
    for name in ("Bed 11", "Bed 12"):
        out = await hass.services.async_call(
            DOMAIN,
            "add_zone",
            {
                "name": name,
                "valve_entity": "valve.trees",
                "flow_entity": "sensor.trees_flow",
                "watering": "hose",
            },
            blocking=True,
            return_response=True,
        )
        zones.append(out["id"])
    await hass.async_block_till_done()
    store = get_store(hass)
    for zone_id in zones:  # both get the water: hose_here stays on unless moved
        assert store.data.zones[zone_id].hose_here
    hass.states.async_set("valve.trees", "open", {"friendly_name": "Tree Valve"})
    await hass.async_block_till_done()
    freezer.tick(timedelta(seconds=7))
    hass.states.async_set("sensor.trees_flow", "1.2", flow)  # 1.2 m³/h = 20 L/min
    await hass.async_block_till_done()
    freezer.tick(timedelta(minutes=6))
    hass.states.async_set("sensor.trees_flow", "0.0", flow)
    await hass.async_block_till_done()
    freezer.tick(timedelta(seconds=10))
    hass.states.async_set("valve.trees", "closed", {"friendly_name": "Tree Valve"})
    await hass.async_block_till_done()
    events = [e for e in store.data.events.values() if e.kind == "watering"]
    assert len(events) == 2
    # 120 litres in all, half each
    assert {e.quantity for e in events} == {60.0}
    assert {e.unit for e in events} == {"l"}
    assert store.data.zones[zones[0]].watering == "hose"


def test_a_volume_total_counts_the_difference() -> None:
    from custom_components.homestead.irrigation import Run, water_text

    run = Run(meter="sensor.total", total_at_start=1000.0)
    assert run.water(dt_util.now(), 1126.0) == 126.0
    assert water_text(126.0, "imperial") == "33 gal"
    assert water_text(126.0, "metric") == "126 l"
