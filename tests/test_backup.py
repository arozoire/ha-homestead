import copy

import pytest
from homeassistant.core import HomeAssistant
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.homestead.backup import BackupError, make_backup, read_backup
from custom_components.homestead.const import DOMAIN
from custom_components.homestead.models import Expense, HomesteadData, Planting, Taxon, Tool, Zone

SQUARE = {"type": "Polygon", "coordinates": [[[7, 45], [7.001, 45], [7.001, 45.001], [7, 45.001], [7, 45]]]}


def _sample() -> HomesteadData:
    data = HomesteadData()
    zone = Zone(name="Orto", geometry=SQUARE)
    taxon = Taxon(scientific_name="Malus domestica", common_names={"it": "melo"}, gbif_key=3001509)
    planting = Planting(
        name="Melo",
        species="Malus domestica",
        taxon_id=taxon.id,
        zone_id=zone.id,
        latitude=45.0,
        longitude=7.0,
    )
    tool = Tool(name="Seghetto")
    expense = Expense(spent_on="2026-03-01", amount=24.5, category="plants", planting_id=planting.id)
    data.zones, data.taxa, data.plantings = {zone.id: zone}, {taxon.id: taxon}, {planting.id: planting}
    data.tools, data.expenses = {tool.id: tool}, {expense.id: expense}
    return data


def test_roundtrip():
    data = _sample()
    backup = make_backup(data, "2026-10-05T08:00:00+02:00", "0.4.1")
    assert backup["format"] == "ha-homestead-backup" and backup["version"] == 1
    assert read_backup(copy.deepcopy(backup)).to_dict() == data.to_dict()


def test_dangling_references_are_cleared():
    backup = make_backup(_sample(), "now", "0.4.1")
    backup["data"]["zones"] = []
    backup["data"]["taxa"] = []
    restored = read_backup(backup)
    [planting] = restored.plantings.values()
    assert (planting.zone_id, planting.taxon_id) == (None, None)


@pytest.mark.parametrize(
    "change",
    [
        lambda b: b.update(format="other"),
        lambda b: b.update(version=99),
        lambda b: b.update(data=[]),
        lambda b: b["data"].update(tools="nope"),
        lambda b: b["data"]["tools"][0].pop("id"),
        lambda b: b["data"]["tools"].append(dict(b["data"]["tools"][0])),
        lambda b: b["data"]["plantings"][0].update(species=""),
        lambda b: b["data"]["zones"][0].update(geometry={"type": "Point", "coordinates": [7, 45]}),
    ],
)
def test_invalid_backups(change):
    backup = make_backup(_sample(), "now", "0.4.1")
    change(backup)
    with pytest.raises(BackupError):
        read_backup(backup)


async def _setup(hass: HomeAssistant) -> MockConfigEntry:
    entry = MockConfigEntry(domain=DOMAIN, title="HA Homestead")
    entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    return entry


async def test_export_and_import_over_websocket(hass: HomeAssistant, hass_ws_client, hass_storage) -> None:
    entry = await _setup(hass)
    entry.runtime_data.data = _sample()
    ws = await hass_ws_client(hass)

    await ws.send_json({"id": 1, "type": "homestead/backup/export"})
    backup = (await ws.receive_json())["result"]
    assert len(backup["data"]["plantings"]) == 1

    await hass.services.async_call(DOMAIN, "add_tool", {"name": "Vanga"}, blocking=True)
    assert len(entry.runtime_data.data.tools) == 2

    await ws.send_json({"id": 2, "type": "homestead/backup/import", "backup": backup})
    result = (await ws.receive_json())["result"]
    assert result == {"zones": 1, "taxa": 1, "plantings": 1, "expenses": 1, "tools": 1, "photos": 0}
    assert [t.name for t in entry.runtime_data.data.tools.values()] == ["Seghetto"]
    assert len(hass_storage[f"{DOMAIN}.data"]["data"]["tools"]) == 1
    assert hass.states.get("sensor.ha_homestead_plantings").state == "1"

    await ws.send_json({"id": 3, "type": "homestead/backup/import", "backup": {"format": "x"}})
    assert (await ws.receive_json())["error"]["code"] == "invalid_format"


async def test_import_requires_admin(hass: HomeAssistant, hass_ws_client, hass_admin_user) -> None:
    await _setup(hass)
    hass_admin_user.groups = []
    ws = await hass_ws_client(hass)
    await ws.send_json({"id": 1, "type": "homestead/backup/import", "backup": {}})
    assert (await ws.receive_json())["error"]["code"] == "unauthorized"
