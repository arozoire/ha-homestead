"""Supplies: consumption computed backwards, forecast, expiry, shopping list once."""

from datetime import date

from homeassistant.core import HomeAssistant
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.homestead.const import DOMAIN
from custom_components.homestead.models import Event, HomesteadData, SupplyLot, Zone
from custom_components.homestead.shopping import async_shop_supplies
from custom_components.homestead.supplies import expected_end, expiry, history, period, shopping_text, to_buy


def _coop(hens: int = 6) -> tuple[HomesteadData, str]:
    data = HomesteadData()
    coop = Zone(name="Pollaio", kind="coop")
    data.zones[coop.id] = coop
    arrival = Event(kind="flock_in", done_on="2026-01-01", zone_id=coop.id, quantity=hens)
    data.events[arrival.id] = arrival
    return data, coop.id


def _bag(data: HomesteadData, zone: str, opened: str, finished: str | None = None, **kw) -> SupplyLot:
    lot = SupplyLot(
        name="Mangime ovaiole",
        kind="feed",
        quantity=25,
        zone_id=zone,
        opened_on=opened,
        finished_on=finished,
        **kw,
    )
    data.supplies[lot.id] = lot
    return lot


def test_backwards_consumption_per_day_and_per_hen() -> None:
    data, coop = _coop()
    lot = _bag(data, coop, "2026-08-01", "2026-11-26")
    p = period(data, lot)
    assert p.days == 117 and round(p.per_day * 1000) == 214  # 214 g a day
    assert round(p.per_animal * 1000) == 36  # ~36 g per hen


def test_per_hen_with_a_flock_that_changed() -> None:
    data, coop = _coop(4)
    more = Event(kind="flock_in", done_on="2026-03-01", zone_id=coop, quantity=4)
    data.events[more.id] = more
    lot = _bag(data, coop, "2026-02-01", "2026-03-31")  # 28 days with 4, 30 with 8
    p = period(data, lot)
    assert 5.9 < 25 / p.days / p.per_animal < 6.1  # about 6 hens on average


def test_forecast_unusual_and_expiry() -> None:
    data, coop = _coop()
    _bag(data, coop, "2026-01-01", "2026-04-25")
    _bag(data, coop, "2026-04-25", "2026-08-18")
    hungry = _bag(data, coop, "2026-08-18", "2026-10-15")  # twice as fast: rats?
    _bag(data, coop, "2026-10-15", "2027-02-07")
    assert [p.unusual for p in history(data, hungry)] == [False, False, True, False]
    current = _bag(data, coop, "2027-02-07", expires_on="2027-03-01")
    end, rate = expected_end(data, current, date(2027, 2, 10))
    assert date(2027, 5, 1) < end < date(2027, 6, 1) and rate > 0
    assert expiry(current, date(2027, 2, 10)) == "soon" and expiry(current, date(2027, 3, 2)) == "expired"
    assert expiry(current, date(2026, 12, 1)) is None


def test_to_buy_once_and_not_with_a_spare() -> None:
    data, coop = _coop()
    _bag(data, coop, "2026-01-01", "2026-04-25")
    current = _bag(data, coop, "2026-04-25", supplier="Consorzio")
    assert to_buy(data, date(2026, 5, 1)) == []
    assert to_buy(data, date(2026, 8, 10)) == [current]  # runs out around 18/08
    assert shopping_text(current) == "Mangime ovaiole 25 kg (Consorzio)"
    spare = _bag(data, coop, None)
    assert to_buy(data, date(2026, 8, 10)) == []  # a closed bag is waiting
    del data.supplies[spare.id]
    current.shopping_on = "2026-08-10"
    assert to_buy(data, date(2026, 8, 11)) == []  # already on the list


async def test_services_expense_and_shopping_list(hass: HomeAssistant) -> None:
    entry = MockConfigEntry(domain=DOMAIN, title="HA Homestead")
    entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    store = entry.runtime_data
    added: list[str] = []

    async def get_items(call):
        return {"todo.shopping_list": {"items": [{"summary": s, "status": "needs_action"} for s in added]}}

    async def add_item(call):
        added.append(call.data["item"])

    hass.states.async_set("todo.shopping_list", "0")
    hass.services.async_register("todo", "get_items", get_items, supports_response="only")
    hass.services.async_register("todo", "add_item", add_item)

    async def call(service: str, data: dict) -> dict:
        return await hass.services.async_call(DOMAIN, service, data, blocking=True, return_response=True)

    lot = (
        await call(
            "add_supply",
            {"name": "Mangime", "kind": "feed", "quantity": 25, "price": 18, "opened_on": "2026-08-01"},
        )
    )["id"]
    expense = next(e for e in store.data.expenses.values() if e.supply_id == lot)
    assert expense.amount == 18 and expense.category == "animals"
    await call("update_supply", {"id": lot, "finished_on": date.today().isoformat()})
    await hass.async_block_till_done()
    assert added == ["Mangime 25 kg"] and store.data.supplies[lot].shopping_on
    assert await async_shop_supplies(hass, store, date.today()) == 0 and added == ["Mangime 25 kg"]  # once
    await call("delete_supply", {"id": lot})
    assert expense.supply_id is None


def test_mixed_yard_counts_only_the_animals_that_eat_it() -> None:
    data, coop = _coop(6)
    rabbits = Event(kind="flock_in", done_on="2026-01-01", zone_id=coop, quantity=10, animal="rabbits")
    data.events[rabbits.id] = rabbits
    everyone = period(data, _bag(data, coop, "2026-08-01", "2026-11-26"))
    hens_only = period(data, _bag(data, coop, "2026-08-01", "2026-11-26", animal="hens"))
    assert round(hens_only.per_animal * 1000) == 36  # 6 hens, the rabbits do not count
    assert round(everyone.per_animal * 1000) == 13  # 16 animals together
