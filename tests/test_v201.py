"""A group stays one planting: its plants get spots on the plan, split groups merge back."""

from homeassistant.core import HomeAssistant
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.homestead.const import DOMAIN
from custom_components.homestead.models import (
    Event,
    Expense,
    HomesteadData,
    Planting,
    Task,
    merge_plantings,
)


def test_positions_are_cleaned() -> None:
    p = Planting(
        name="Carote", species="Daucus carota", positions=[[7.1, 45.2], [7.12345678901, 45.1], ["x", 1], [1]]
    )
    assert p.positions == [[7.1, 45.2], [7.1234568, 45.1]]


def test_merge_keeps_one_planting_with_every_spot_and_the_diary() -> None:
    data = HomesteadData()
    data.plantings["a"] = Planting(
        id="a",
        name="Carote",
        species="Daucus carota",
        kind="group",
        quantity=6,
        latitude=45.0,
        longitude=7.0,
        row_to=[7.001, 45.0],
    )
    data.plantings["b"] = Planting(
        id="b", name="Carote 2", species="Daucus carota", latitude=45.1, longitude=7.1
    )
    data.plantings["c"] = Planting(
        id="c", name="Carote 3", species="Daucus carota", latitude=45.2, longitude=7.2
    )
    data.events["e"] = Event(id="e", kind="harvest", done_on="2026-11-01", planting_id="b")
    data.expenses["x"] = Expense(id="x", amount=2, category="plants", spent_on="2026-11-01", planting_id="c")
    data.tasks["t"] = Task(
        id="t", kind="harvest", due_on="2026-11-20", planting_ids=["a", "b", "c"], done_ids=["b"]
    )

    group = merge_plantings(data, "a", ["b", "c"])

    assert set(data.plantings) == {"a"}
    assert (group.kind, group.quantity, group.row_to) == ("group", 8, None)
    assert group.positions == [[7.0, 45.0], [7.1, 45.1], [7.2, 45.2]]
    assert data.events["e"].planting_id == "a"
    assert data.expenses["x"].planting_id == "a"
    assert data.tasks["t"].planting_ids == ["a"] and data.tasks["t"].done_ids == ["a"]


async def test_services(hass: HomeAssistant) -> None:
    entry = MockConfigEntry(domain=DOMAIN, title="HA Homestead")
    entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()

    async def call(service: str, data: dict) -> dict:
        return await hass.services.async_call(DOMAIN, service, data, blocking=True, return_response=True)

    base = {"species": "Allium cepa", "latitude": 45.0, "longitude": 7.0}
    group = (await call("add_planting", {**base, "name": "Cipolle", "kind": "group", "quantity": 3}))["id"]
    await call("update_planting", {"id": group, "positions": [[7.0, 45.0], [7.00001, 45.0], [7.00002, 45.0]]})
    store = entry.runtime_data
    assert len(store.data.plantings[group].positions) == 3
    single = (await call("add_planting", {**base, "name": "Cipolle 2"}))["id"]
    out = await call("merge_plantings", {"id": group, "ids": [single]})
    assert out == {"id": group, "quantity": 4}
    assert len(store.data.plantings[group].positions) == 4
    await call("update_planting", {"id": group, "positions": None})
    assert store.data.plantings[group].positions == []
