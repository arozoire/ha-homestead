"""The CSV examples in docs/examples go through the panel's own import code, then the real services.

Node runs the JavaScript of the panel (``parseCsv``, ``parseDate``, ``_csvColumns``, ``_csvCheck``,
``_csvLoad``) with a stub for the rest of the panel; the rows it accepts are added like ``_csvRun`` does.
"""

from __future__ import annotations

import json
import os
import re
import shutil
import subprocess
from pathlib import Path

import pytest
from homeassistant.core import HomeAssistant
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.homestead.const import DOMAIN

ROOT = Path(__file__).parent.parent
PANEL = ROOT / "custom_components/homestead/frontend/homestead-panel.js"
TEXTS = ROOT / "custom_components/homestead/frontend/i18n/en.json"
EXAMPLES = ROOT / "docs/examples"
ZONES = [("Orchard", "orchard"), ("Vegetable garden", "vegetable_garden")]


def _method(source: str, name: str) -> str:
    start = source.index(f"\n  {name}(")
    end = source.index("\n  }\n", start)
    return source[start:end] + "\n  },"


def _function(source: str, name: str) -> str:
    start = source.index(f"\nfunction {name}(")
    return source[start : source.index("\n}\n", start) + 3]


def _const(source: str, name: str) -> str:
    return re.search(rf"^const {name} = .*;$", source, re.M).group(0)


def _run_panel_import(kind: str, csv_text: str, zones: list[dict], tmp_path: Path) -> list[dict]:
    node = shutil.which("node")
    if not node:
        if os.environ.get("CI"):
            pytest.fail("node is needed to run the panel's CSV import")
        pytest.skip("node not installed")
    source = PANEL.read_text(encoding="utf-8")
    methods = "\n".join(_method(source, m) for m in ("_csvColumns", "_csvLoad", "_csvCheck"))
    script = f"""
{_const(source, "PLANT_ICONS")}
{_const(source, "ZONE_PLANT_TYPE")}
{_function(source, "parseCsv")}
{_function(source, "parseDate")}
const fs = require("fs");
const TEXT = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
const input = JSON.parse(fs.readFileSync(process.argv[3], "utf8"));
const panel = {{
  _data: {{ zones: input.zones, plantings: [], seeds: [], taxa: [] }},
  t(key, vars = {{}}) {{ return (TEXT[key] ?? key).replace(/\\{{(\\w+)\\}}/g, (_, n) => vars[n] ?? ""); }},
  _zone(id) {{ return this._data.zones.find((z) => z.id === id); }},
  _zonePath(id) {{ return this._zone(id)?.name || ""; }},
  _plantTypeFor() {{ return null; }},
  _clearSelection() {{}}, _render() {{}}, _showMessage() {{}}, _syncMap() {{}},
{methods}
}};
panel._csvLoad(input.kind, input.text);
const rows = panel._import ? panel._import.rows : [];
console.log(JSON.stringify(rows.map((r) => ({{ include: r.include, values: r.values, issues: r.issues }}))));
"""
    js = tmp_path / "import.js"
    js.write_text(script, encoding="utf-8")
    data = tmp_path / "input.json"
    data.write_text(json.dumps({"kind": kind, "text": csv_text, "zones": zones}), encoding="utf-8")
    out = subprocess.run(
        [node, str(js), str(TEXTS), str(data)], capture_output=True, text=True, check=True, timeout=60
    )
    return json.loads(out.stdout)


async def _call(hass: HomeAssistant, service: str, data: dict) -> dict:
    return await hass.services.async_call(DOMAIN, service, data, blocking=True, return_response=True)


@pytest.mark.parametrize(
    ("kind", "file", "service"),
    [("plantings", "plantings.csv", "add_planting"), ("seeds", "seeds.csv", "add_seed_lot")],
)
async def test_examples_import(
    hass: HomeAssistant, tmp_path: Path, kind: str, file: str, service: str
) -> None:
    entry = MockConfigEntry(domain=DOMAIN, title="HA Homestead")
    entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    zones = [
        {"id": (await _call(hass, "add_zone", {"name": n, "kind": k}))["id"], "name": n, "kind": k}
        for n, k in ZONES
    ]

    text = (EXAMPLES / file).read_text(encoding="utf-8")
    rows = _run_panel_import(kind, text, zones, tmp_path)
    assert len(rows) == len(text.strip().splitlines()) - 1
    for row in rows:
        assert row["issues"] == {}, row
        assert row["include"]
        values = {k: v for k, v in row["values"].items() if v not in (None, "")}
        await _call(hass, service, values)

    stored = await _call(hass, "export", {})
    items = stored["plantings" if kind == "plantings" else "seeds"]
    assert len(items) == len(rows)
    if kind == "plantings":
        apple = next(p for p in items if p["name"] == "Apple tree by the well")
        assert apple["planted_on"] == "2024-11-15"
        assert apple["origin"] == "planted"
        assert apple["zone_id"] == zones[0]["id"]
        tomatoes = next(p for p in items if p["name"] == "Tomatoes")
        assert (tomatoes["kind"], tomatoes["quantity"], tomatoes["sown_on"]) == ("group", 12, "2026-03-01")
    else:
        assert [s["finished"] for s in items].count(True) == 1
    # Prices become expenses (linked to the plant; category seeds for the lots).
    assert sorted(e["amount"] for e in stored["expenses"]) == (
        [6.0, 18.0, 25.0] if kind == "plantings" else [1.8, 2.5, 2.9]
    )
