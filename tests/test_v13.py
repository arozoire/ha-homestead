from datetime import date, timedelta

from freezegun.api import FrozenDateTimeFactory
from homeassistant.core import HomeAssistant
from homeassistant.util import dt as dt_util
from pytest_homeassistant_custom_component.common import (
    MockConfigEntry,
    async_fire_time_changed,
    async_mock_service,
)

from custom_components.homestead.const import CONF_NOTIFY, CONF_NOTIFY_TIME, DOMAIN
from custom_components.homestead.models import Event, HomesteadData, Planting, Zone, watering_due


async def _setup(hass: HomeAssistant, options: dict | None = None) -> MockConfigEntry:
    entry = MockConfigEntry(domain=DOMAIN, title="HA Homestead", options=options or {})
    entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    return entry


async def _call(hass: HomeAssistant, service: str, data: dict) -> dict:
    return await hass.services.async_call(DOMAIN, service, data, blocking=True, return_response=True)


def test_watering_due() -> None:
    data = HomesteadData()
    house = Zone(name="Casa", kind="indoor")
    room = Zone(name="Soggiorno", parent_id=house.id)
    garden = Zone(name="Orto", kind="vegetable_garden")
    data.zones = {z.id: z for z in (house, room, garden)}
    ficus = Planting(name="Ficus", species="Ficus elastica", zone_id=room.id, water_days=7)
    cactus = Planting(name="Cactus", species="Opuntia", zone_id=room.id, water_days=20)
    fern = Planting(name="Felce", species="Nephrolepis", zone_id=room.id, moisture_entity="sensor.felce")
    tomato = Planting(name="Pomodoro", species="Solanum lycopersicum", zone_id=garden.id, water_days=2)
    data.plantings = {p.id: p for p in (ficus, cactus, fern, tomato)}
    for p, day in ((ficus, "2026-05-01"), (cactus, "2026-05-01")):
        event = Event(kind="watering", done_on=day, planting_id=p.id)
        data.events[event.id] = event
    may = date(2026, 5, 8)
    assert [p.name for p in watering_due(data, may, {"sensor.felce": 15})] == ["Felce", "Ficus"]
    assert [p.name for p in watering_due(data, may, {"sensor.felce": 40})] == ["Ficus"]
    # Winter: 7 days become 10 or 11.
    for event in data.events.values():
        event.done_on = "2026-12-01"
    assert watering_due(data, date(2026, 12, 8)) == []
    assert [p.name for p in watering_due(data, date(2026, 12, 12))] == ["Ficus"]


async def test_houseplant_reminder_and_no_weather(
    hass: HomeAssistant, freezer: FrozenDateTimeFactory
) -> None:
    await hass.config.async_set_time_zone("Europe/Rome")
    freezer.move_to(dt_util.as_utc(dt_util.parse_datetime("2026-05-08T06:30:00+02:00")))
    sent = async_mock_service(hass, "notify", "mobile_app_pixel")
    entry = await _setup(hass, {CONF_NOTIFY: ["notify.mobile_app_pixel"], CONF_NOTIFY_TIME: "07:00:00"})
    data = entry.runtime_data.data
    room = (await _call(hass, "add_zone", {"name": "Soggiorno", "kind": "indoor"}))["id"]
    args = {
        "name": "Ficus",
        "species": "Ficus elastica",
        "zone_id": room,
        "water_days": 7,
        "fertilize_weeks": 4,
    }
    ficus = (await _call(hass, "add_planting", args))["id"]
    watered = {"kind": "watering", "planting_id": ficus, "done_on": "2026-05-01"}
    event = (await _call(hass, "add_event", watered))["id"]
    await hass.async_block_till_done()
    assert data.events[event].weather is None
    freezer.tick(timedelta(minutes=30))
    async_fire_time_changed(hass)
    await hass.async_block_till_done()
    assert [c.data["message"] for c in sent] == ["🪴 To water: Ficus"]


async def test_care_notes(hass: HomeAssistant) -> None:
    entry = await _setup(hass)
    data = {"name": "Rosa", "species": "Rosa", "care": "Potare a marzo"}
    rose = (await _call(hass, "add_planting", data))["id"]
    await _call(hass, "update_planting", {"id": rose, "notes": "Dal vivaio"})
    planting = entry.runtime_data.data.plantings[rose]
    assert (planting.care, planting.notes) == ("Potare a marzo", "Dal vivaio")
    await _call(hass, "update_planting", {"id": rose, "care": None})
    assert entry.runtime_data.data.plantings[rose].care is None
