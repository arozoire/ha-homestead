import base64

import pytest
import voluptuous as vol
from homeassistant.core import HomeAssistant
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.homestead.const import DOMAIN
from custom_components.homestead.models import Event, Expense, HomesteadData
from custom_components.homestead.photos import photo_dir

JPEG = b"\xff\xd8\xff\xe0" + b"\x00" * 64


async def _setup(hass: HomeAssistant, tmp_path) -> MockConfigEntry:
    hass.config.media_dirs = {"local": str(tmp_path)}
    hass.config.currency = "EUR"
    entry = MockConfigEntry(domain=DOMAIN, title="HA Homestead")
    entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    return entry


async def _call(hass: HomeAssistant, service: str, data: dict) -> str:
    return (await hass.services.async_call(DOMAIN, service, data, blocking=True, return_response=True))["id"]


def test_event_moon_phase_and_income_not_in_expenses():
    assert Event(kind="pruning", done_on="2024-04-23").moon_phase == "full_moon"
    data = HomesteadData()
    data.expenses = {
        e.id: e
        for e in (
            Expense(spent_on="2026-09-01", amount=40, category="services"),
            Expense(spent_on="2026-09-02", amount=90, category="sales", income=True),
        )
    }
    assert data.expenses_total(2026) == 40


async def test_event_with_cost_and_revenue(hass: HomeAssistant, tmp_path) -> None:
    entry = await _setup(hass, tmp_path)
    data = entry.runtime_data.data
    olive = await _call(hass, "add_planting", {"name": "Ulivo", "species": "Olea europaea"})
    event = await _call(
        hass,
        "add_event",
        {
            "kind": "harvest",
            "planting_id": olive,
            "done_on": "2026-11-10",
            "quantity": 85,
            "unit": "kg",
            "cost": 40,
            "revenue": 120,
        },
    )
    assert data.events[event].moon_phase
    by_kind = {e.income: e for e in data.expenses.values()}
    assert (by_kind[False].category, by_kind[False].amount, by_kind[False].event_id) == (
        "services",
        40,
        event,
    )
    assert (by_kind[True].category, by_kind[True].amount, by_kind[True].planting_id) == ("sales", 120, olive)
    await hass.async_block_till_done()
    assert float(hass.states.get("sensor.ha_homestead_expenses_this_year").state) == 40

    await _call(hass, "update_event", {"id": event, "done_on": "2024-04-23", "notes": "olio 12 L"})
    assert (data.events[event].moon_phase, data.events[event].notes) == ("full_moon", "olio 12 L")

    await _call(hass, "delete_event", {"id": event})
    assert not data.events and all(e.event_id is None for e in data.expenses.values())


async def test_event_target_rules(hass: HomeAssistant, tmp_path) -> None:
    entry = await _setup(hass, tmp_path)
    data = entry.runtime_data.data
    zone = await _call(hass, "add_zone", {"name": "Frutteto"})
    planting = await _call(
        hass, "add_planting", {"name": "Melo", "species": "Malus domestica", "zone_id": zone}
    )
    with pytest.raises(vol.Invalid):
        await _call(hass, "add_event", {"kind": "note"})
    with pytest.raises(vol.Invalid):
        await _call(hass, "add_event", {"kind": "note", "planting_id": planting, "zone_id": zone})

    event = await _call(hass, "add_event", {"kind": "pruning", "zone_id": zone})
    await _call(hass, "update_event", {"id": event, "planting_id": planting})
    assert (data.events[event].planting_id, data.events[event].zone_id) == (planting, None)


async def test_deletions_cascade(hass: HomeAssistant, tmp_path, hass_ws_client) -> None:
    entry = await _setup(hass, tmp_path)
    data = entry.runtime_data.data
    garden = await _call(hass, "add_zone", {"name": "Giardino"})
    orchard = await _call(hass, "add_zone", {"name": "Frutteto", "parent_id": garden})
    planting = await _call(hass, "add_planting", {"name": "Melo", "species": "Malus domestica"})
    on_zone = await _call(hass, "add_event", {"kind": "pruning", "zone_id": orchard})
    on_planting = await _call(hass, "add_event", {"kind": "treatment", "planting_id": planting, "cost": 5})

    ws = await hass_ws_client(hass)
    for msg_id, event in ((1, on_planting), (2, on_zone)):
        content = base64.b64encode(JPEG).decode()
        await ws.send_json(
            {"id": msg_id, "type": "homestead/photo/upload", "event_id": event, "content": content}
        )
        assert (await ws.receive_json())["success"]
    zone_photo = next(p for p in data.photos.values() if p.event_id == on_zone)
    assert zone_photo.planting_id is None and zone_photo.file.startswith("events/")
    assert next(p for p in data.photos.values() if p.event_id == on_planting).planting_id == planting

    await _call(hass, "delete_planting", {"id": planting})
    assert on_planting not in data.events
    assert [p.event_id for p in data.photos.values()] == [on_zone]
    [expense] = data.expenses.values()
    assert expense.event_id is None

    await _call(hass, "delete_zone", {"id": orchard})
    assert data.events[on_zone].zone_id == garden
    await _call(hass, "delete_zone", {"id": garden})
    assert not data.events and not data.photos
    assert not list(photo_dir(hass).rglob("*.jpg"))
