from homeassistant.core import HomeAssistant
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.homestead.backup import make_backup, read_backup
from custom_components.homestead.const import DOMAIN
from custom_components.homestead.labels import summary
from custom_components.homestead.models import HomesteadData, Planting, Task


async def _setup(hass: HomeAssistant) -> MockConfigEntry:
    entry = MockConfigEntry(domain=DOMAIN, title="HA Homestead")
    entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    return entry


async def _call(hass: HomeAssistant, service: str, data: dict) -> dict:
    return await hass.services.async_call(DOMAIN, service, data, blocking=True, return_response=True)


async def _plants(hass: HomeAssistant, *names: str) -> list[str]:
    return [(await _call(hass, "add_planting", {"name": n, "species": n}))["id"] for n in names]


async def test_list_task_tick_and_postpone(hass: HomeAssistant) -> None:
    entry = await _setup(hass)
    data = entry.runtime_data.data
    ids = await _plants(hass, "Lampone", "Ribes", "Uva spina", "Lavanda", "Fragole")
    weekend = {"kind": "pruning", "due_on": "2026-10-24", "planting_ids": ids, "yearly": True}
    task_id = (await _call(hass, "add_task", weekend))["id"]
    assert data.tasks[task_id].planting_id is None

    # Two plants done on Saturday: one diary event each, the task stays open.
    done = await _call(hass, "complete_task", {"id": task_id, "items": ids[:2], "done_on": "2026-10-24"})
    assert len(done["ids"]) == 2
    assert sorted(data.events[e].planting_id for e in done["ids"]) == sorted(ids[:2])
    assert data.tasks[task_id].done_on is None and data.tasks[task_id].remaining == ids[2:]

    # The other three to next weekend: the done part closes, the rest is a new task.
    rest_id = (await _call(hass, "postpone_task", {"id": task_id, "due_on": "2026-10-31"}))["id"]
    closed, rest = data.tasks[task_id], data.tasks[rest_id]
    assert closed.done_on and closed.planting_ids == ids[:2] and not closed.yearly
    assert rest.due_on == "2026-10-31" and rest.planting_ids == ids[2:] and not rest.done_on
    # A yearly list comes back next year whole, once.
    following = [t for t in data.tasks.values() if t.due_on == "2027-10-24"]
    assert len(following) == 1 and following[0].planting_ids == ids and following[0].yearly

    # A diary event saved from the list ticks that plant.
    await _call(hass, "add_event", {"kind": "pruning", "planting_id": ids[2], "task_id": rest_id})
    assert rest.done_ids == [ids[2]] and not rest.done_on
    # A deleted plant leaves the list; the last one done closes it.
    await _call(hass, "delete_planting", {"id": ids[3]})
    assert rest.planting_ids == [ids[2], ids[4]]
    await _call(hass, "complete_task", {"id": rest_id})
    assert rest.done_on and rest.remaining == []


async def test_postpone_whole_task_and_seed_list(hass: HomeAssistant) -> None:
    entry = await _setup(hass)
    data = entry.runtime_data.data
    lot = (await _call(hass, "add_seed_lot", {"species": "Allium sativum"}))["id"]
    sowing = {"kind": "sowing", "due_on": "2026-10-24", "seed_ids": [lot]}
    task_id = (await _call(hass, "add_task", sowing))["id"]
    # Nothing done yet: the same task just moves.
    assert (await _call(hass, "postpone_task", {"id": task_id, "due_on": "2026-10-25"}))["id"] == task_id
    assert data.tasks[task_id].due_on == "2026-10-25"
    # Seed lots are ticked off without a diary event (the sowing is the new planting).
    assert (await _call(hass, "complete_task", {"id": task_id, "items": [lot]}))["ids"] == []
    assert data.tasks[task_id].done_on
    await _call(hass, "delete_seed_lot", {"id": lot})
    assert task_id not in data.tasks


def test_list_summary_and_backup() -> None:
    data = HomesteadData()
    plants = [Planting(name=n, species=n) for n in ("Lampone", "Ribes", "Uva spina", "Lavanda")]
    data.plantings = {p.id: p for p in plants}
    task = Task(kind="pruning", due_on="2026-10-24", planting_ids=[p.id for p in plants])
    data.tasks[task.id] = task
    assert summary(data, task, {"pruning": "Potatura"}) == "✂️ Potatura — Lampone, Ribes, Uva spina +1"
    raw = make_backup(data, "2026-10-21T10:00:00", "0.14.0")
    raw["data"]["plantings"] = raw["data"]["plantings"][:2]
    raw["data"]["tasks"][0]["done_ids"] = [plants[3].id]
    restored = read_backup(raw).tasks[task.id]
    assert restored.planting_ids == [plants[0].id, plants[1].id] and restored.done_ids == []
