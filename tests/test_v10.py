from datetime import date, timedelta

import pytest
import voluptuous as vol
from freezegun.api import FrozenDateTimeFactory
from homeassistant.core import HomeAssistant
from homeassistant.util import dt as dt_util
from pytest_homeassistant_custom_component.common import (
    MockConfigEntry,
    async_fire_time_changed,
    async_mock_service,
)

from custom_components.homestead.const import CONF_NOTIFY, CONF_NOTIFY_TIME, DOMAIN
from custom_components.homestead.models import Event, HomesteadData, Zone, compost_due, hens


async def _setup(hass: HomeAssistant, options: dict | None = None) -> MockConfigEntry:
    entry = MockConfigEntry(domain=DOMAIN, title="HA Homestead", options=options or {})
    entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    return entry


async def _call(hass: HomeAssistant, service: str, data: dict) -> dict:
    return await hass.services.async_call(DOMAIN, service, data, blocking=True, return_response=True)


async def test_coop(hass: HomeAssistant) -> None:
    entry = await _setup(hass)
    data = entry.runtime_data.data
    coop = (await _call(hass, "add_zone", {"name": "Pollaio", "kind": "coop"}))["id"]
    arrived = {
        "kind": "flock_in",
        "zone_id": coop,
        "done_on": "2025-04-01",
        "quantity": 5,
        "product": "Livornese",
    }
    await _call(hass, "add_event", {**arrived, "cost": 75})
    await _call(
        hass, "add_event", {"kind": "flock_in", "zone_id": coop, "done_on": "2026-03-01", "quantity": 2}
    )
    gone = {
        "kind": "flock_out",
        "zone_id": coop,
        "done_on": "2026-05-10",
        "quantity": 1,
        "reason": "predator",
    }
    await _call(hass, "add_event", gone)
    eggs = (
        await _call(
            hass, "add_event", {"kind": "eggs", "zone_id": coop, "done_on": "2026-05-11", "quantity": 4}
        )
    )["id"]
    await _call(
        hass, "add_event", {"kind": "animal_care", "zone_id": coop, "product": "Mangime 25 kg", "cost": 18}
    )
    await hass.async_block_till_done()
    assert hens(data, coop) == 6
    assert hens(data, coop, until="2026-01-01") == 5
    assert data.events[eggs].weather is None
    assert sorted(e.category for e in data.expenses.values()) == ["animals", "animals"]
    with pytest.raises(vol.Invalid):
        await _call(hass, "update_event", {"id": eggs, "reason": "aliens"})


def test_compost_due() -> None:
    data = HomesteadData()
    bin_ = Zone(name="Compostiera 1", kind="compost")
    other = Zone(name="Compostiera 2", kind="compost")
    data.zones = {bin_.id: bin_, other.id: other}
    for kind, day in (("compost_harvest", "2026-01-10"), ("compost_turn", "2026-02-01")):
        event = Event(kind=kind, done_on=day, zone_id=bin_.id)
        data.events[event.id] = event
    assert compost_due(data, date(2026, 2, 28)) == []
    assert compost_due(data, date(2026, 3, 1)) == [(bin_, 28)]


async def test_compost_reminder(hass: HomeAssistant, freezer: FrozenDateTimeFactory) -> None:
    await hass.config.async_set_time_zone("Europe/Rome")
    freezer.move_to(dt_util.as_utc(dt_util.parse_datetime("2026-03-01T06:30:00+01:00")))
    sent = async_mock_service(hass, "notify", "mobile_app_pixel")
    await _setup(hass, {CONF_NOTIFY: ["notify.mobile_app_pixel"], CONF_NOTIFY_TIME: "07:00:00"})
    bin_ = (await _call(hass, "add_zone", {"name": "Compostiera", "kind": "compost"}))["id"]
    await _call(hass, "add_event", {"kind": "compost_turn", "zone_id": bin_, "done_on": "2026-02-01"})
    freezer.tick(timedelta(minutes=30))
    async_fire_time_changed(hass)
    await hass.async_block_till_done()
    assert len(sent) == 1
    assert sent[0].data["message"].startswith("♻️ Compostiera")
    assert sent[0].data["data"]["url"] == f"/homestead?zone={bin_}&kind=compost_turn"
    # Not the day after: once a week until it is turned.
    freezer.tick(timedelta(days=1))
    async_fire_time_changed(hass)
    await hass.async_block_till_done()
    assert len(sent) == 1
