from homeassistant.core import HomeAssistant
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.homestead.const import DOMAIN


async def _setup(hass: HomeAssistant) -> MockConfigEntry:
    entry = MockConfigEntry(domain=DOMAIN, title="HA Homestead")
    entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    return entry


async def _call(hass: HomeAssistant, service: str, data: dict) -> dict:
    return await hass.services.async_call(DOMAIN, service, data, blocking=True, return_response=True)


async def test_row_of_plants(hass: HomeAssistant) -> None:
    entry = await _setup(hass)
    row = {"name": "Fagiolini", "species": "Phaseolus vulgaris", "kind": "group", "quantity": 12}
    row |= {"latitude": 45.07, "longitude": 7.686, "row_to": [7.68604, 45.07]}
    planting_id = (await _call(hass, "add_planting", row))["id"]
    assert entry.runtime_data.data.plantings[planting_id].row_to == [7.68604, 45.07]
    await _call(hass, "update_planting", {"id": planting_id, "row_to": None})
    assert entry.runtime_data.data.plantings[planting_id].row_to is None


def _days(start: str, rain: list[float], et0: list[float]) -> list[dict]:
    from datetime import date, timedelta

    first = date.fromisoformat(start)
    return [
        {"date": (first + timedelta(days=i)).isoformat(), "rain_mm": r, "et0_mm": e}
        for i, (r, e) in enumerate(zip(rain, et0, strict=True))
    ]


def test_water_balance() -> None:
    from datetime import date

    from custom_components.homestead.water import balance, parse_water_days

    raw = {
        "daily": {
            "time": ["2026-07-01", "2026-07-02"],
            "precipitation_sum": [0.0, 4.2],
            "et0_fao_evapotranspiration": [5.1, 4.8],
        }
    }
    assert parse_water_days(raw) == [
        {"date": "2026-07-01", "rain_mm": 0.0, "et0_mm": 5.1},
        {"date": "2026-07-02", "rain_mm": 4.2, "et0_mm": 4.8},
    ]
    today = date(2026, 7, 15)
    dry = _days("2026-07-01", [0] * 21, [5.0] * 21)
    result = balance(dry, today)
    assert result["deficit_mm"] == 35.0 and result["verdict"] == "water"
    # Watered two days ago: only what evaporated since.
    assert balance(dry, today, watered=date(2026, 7, 13))["deficit_mm"] == 5.0
    # Rain coming tomorrow: wait for it.
    wet_soon = _days("2026-07-01", [0] * 15 + [12] + [0] * 5, [5.0] * 21)
    assert balance(wet_soon, today)["verdict"] == "ok"
    # A soil sensor wins.
    assert balance(dry, today, soil=40.0)["verdict"] == "ok"
    assert balance(_days("2026-07-01", [9] * 21, [5.0] * 21), today, soil=18.0)["verdict"] == "water"


def test_zones_and_young_trees() -> None:
    from datetime import date

    from custom_components.homestead.models import Event, HomesteadData, Planting, Zone
    from custom_components.homestead.water import young_trees, zones_balance

    data = HomesteadData()
    data.zones["orto"] = Zone(id="orto", name="Orto")
    data.zones["bosco"] = Zone(id="bosco", name="Prato", watering="none")
    data.zones["aiuola"] = Zone(id="aiuola", name="Aiuola", parent_id="orto")
    data.plantings["pom"] = Planting(
        id="pom", name="Pomodoro", species="Solanum lycopersicum", zone_id="aiuola"
    )
    data.plantings["noce"] = Planting(
        id="noce",
        name="Noce",
        species="Juglans regia",
        zone_id="bosco",
        plant_type="tree",
        planted_on="1998-03-01",
    )
    young = {"species": "Malus domestica", "zone_id": "bosco", "plant_type": "fruit_tree"}
    data.plantings["melo"] = Planting(id="melo", name="Melo", planted_on="2026-03-15", **young)
    # Five years old, but transplanted last year: still followed.
    data.plantings["pero"] = Planting(
        id="pero", name="Pero", planted_on="2025-11-02", birth_year=2021, **young
    )
    data.events["w"] = Event(kind="watering", done_on="2026-07-10", planting_id="pero")
    today = date(2026, 7, 15)
    days = _days("2026-07-01", [0] * 21, [5.0] * 21)
    zones = zones_balance(data, days, today, {})
    assert set(zones) == {"orto"}  # beds count with their zone, rain-only zones are left out
    trees = {t["planting_id"]: t for t in young_trees(data, days, today)}
    assert set(trees) == {"melo", "pero"}  # the old walnut is not young
    assert trees["melo"]["verdict"] == "water" and trees["melo"]["dry_days"] == 122
    assert trees["pero"]["dry_days"] == 5 and trees["pero"]["verdict"] == "ok"
    assert trees["pero"]["until"] == "2027-11-02"
    assert young_trees(data, days, date(2026, 12, 1)) == []  # not in winter


def test_climate_figures() -> None:
    from datetime import date

    from custom_components.homestead.climate import (
        chill_hours,
        chill_start,
        gdd_by_year,
        gdd_on,
        gdd_today,
        parse_hourly,
        soil_days,
    )

    days = [
        {"date": "2025-01-01", "t_min": 2, "t_max": 8},  # mean 5: nothing
        {"date": "2025-01-02", "t_min": 12, "t_max": 22},  # mean 17: +7
        {"date": "2025-01-04", "t_min": 14, "t_max": 20},  # mean 17: +7 (the 3rd is missing)
        {"date": "2026-01-01", "t_min": 10, "t_max": 20},  # +5
    ]
    series = gdd_by_year(days)
    assert series["2025"] == [0, 7, 7, 14]
    assert gdd_on(series, date(2025, 1, 3)) == 7
    assert gdd_on(series, date(2025, 2, 1)) is None
    recent = [
        {"date": "2026-01-02", "t_min": 15, "t_max": 25},
        {"date": "2026-01-03", "t_min": 15, "t_max": 25},
    ]
    assert gdd_today(series, recent, date(2026, 1, 3)) == 15  # 5 + 10, today not yet

    assert chill_start(date(2026, 11, 11)) == date(2026, 11, 1)
    assert chill_start(date(2027, 2, 3)) == date(2026, 11, 1)
    assert chill_start(date(2026, 7, 1)) is None
    raw = {
        "hourly": {
            "time": ["2026-10-31T23:00", "2026-11-01T00:00", "2026-11-01T01:00", "2026-11-01T02:00"],
            "temperature_2m": [3.0, 3.0, 8.5, None],
        }
    }
    hours = parse_hourly(raw, "temperature_2m")
    assert len(hours) == 3
    assert chill_hours(hours + hours, date(2026, 11, 1), "2026-11-02T00:00") == 1  # October and doubles out

    soil = parse_hourly(
        {"hourly": {"time": ["2026-04-20T06:00", "2026-04-20T15:00"], "soil_temperature_6cm": [9.0, 15.0]}},
        "soil_temperature_6cm",
    )
    assert soil_days(soil) == {"2026-04-20": {"mean": 12.0, "min": 9.0}}


async def test_succession_own_seeds_and_pests(hass: HomeAssistant) -> None:
    entry = await _setup(hass)
    data = entry.runtime_data.data
    lot = (await _call(hass, "add_seed_lot", {"species": "Lactuca sativa", "variety": "Gentilina"}))["id"]
    task = (
        await _call(
            hass,
            "add_task",
            {
                "kind": "sowing",
                "due_on": "2026-03-02",
                "seed_ids": [lot],
                "repeat_weeks": 3,
                "repeat_until": "2026-04-10",
            },
        )
    )["id"]
    await _call(hass, "complete_task", {"id": task, "done_on": "2026-03-04"})
    follow = [t for t in data.tasks.values() if not t.done_on]
    assert len(follow) == 1 and follow[0].due_on == "2026-03-25" and follow[0].seed_ids == [lot]
    await _call(hass, "complete_task", {"id": follow[0].id, "done_on": "2026-03-25"})
    # 15 April would be after the end of the succession: no more.
    assert not [t for t in data.tasks.values() if not t.done_on]

    planting = (await _call(hass, "add_planting", {"name": "Pomodoro", "species": "Solanum lycopersicum"}))[
        "id"
    ]
    own = (
        await _call(
            hass,
            "add_seed_lot",
            {"species": "Solanum lycopersicum", "year": 2026, "from_planting_id": planting},
        )
    )["id"]
    assert data.seeds[own].from_planting_id == planting

    problem = (
        await _call(
            hass,
            "add_event",
            {"kind": "problem", "planting_id": planting, "product": "Afidi", "severity": "spread"},
        )
    )["id"]
    treatment = (
        await _call(
            hass, "add_event", {"kind": "treatment", "planting_id": planting, "product": "Sapone molle"}
        )
    )["id"]
    await _call(hass, "update_event", {"id": treatment, "worked": "partly"})
    assert data.events[problem].severity == "spread" and data.events[treatment].worked == "partly"
