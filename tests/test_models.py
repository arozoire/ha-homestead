from datetime import date

from custom_components.homestead.models import (
    Expense,
    HomesteadData,
    Planting,
    PlantingStatus,
    Tool,
    ToolStatus,
)
from custom_components.homestead.moon import moon_phase


def test_moon_phase_known_dates():
    assert moon_phase(date(2000, 1, 6)) == "new_moon"
    assert moon_phase(date(2024, 4, 8)) == "new_moon"
    assert moon_phase(date(2024, 4, 23)) == "full_moon"


def test_planting_records_moon_phase():
    planting = Planting(name="Melo", species="Malus domestica", planted_on="2024-04-23")
    assert planting.moon_phase == "full_moon"


def test_roundtrip_and_aggregates():
    data = HomesteadData()
    alive = Planting(name="Pomodori", species="Solanum lycopersicum", kind="group", quantity=12)
    dead = Planting(name="Pesco", species="Prunus persica", status=PlantingStatus.DEAD)
    data.plantings = {p.id: p for p in (alive, dead)}
    data.expenses = {
        e.id: e
        for e in (
            Expense(spent_on="2026-03-01", amount=19.9, category="plants"),
            Expense(spent_on="2026-05-10", amount=5.1, category="seeds"),
            Expense(spent_on="2025-12-31", amount=100, category="tools"),
        )
    }
    data.tools = {
        t.id: t
        for t in (
            Tool(name="Forbici"),
            Tool(name="Seghetto", status=ToolStatus.NEEDS_SERVICE),
            Tool(name="Tosaerba", next_service_on="2026-09-01"),
        )
    }

    restored = HomesteadData.from_dict(data.to_dict())

    assert [p.name for p in restored.active_plantings()] == ["Pomodori"]
    assert restored.expenses_total(2026) == 25.0
    assert {t.name for t in restored.tools_needing_service(date(2026, 10, 2))} == {"Seghetto", "Tosaerba"}


def test_from_dict_ignores_unknown_fields():
    data = HomesteadData.from_dict({"tools": [{"id": "x", "name": "Vanga", "future_field": 1}]})
    assert data.tools["x"].name == "Vanga"
