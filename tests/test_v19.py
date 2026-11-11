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
