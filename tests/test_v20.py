"""On top of the valves and growth stages: no more "valve" watering mode, transplants start at stage 2."""

from datetime import date

import pytest
import voluptuous as vol
from homeassistant.core import HomeAssistant
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.homestead.const import DOMAIN
from custom_components.homestead.models import Planting, WateringMode, Zone, growth_stage, growth_start_stage


def test_valve_mode_is_gone_and_old_data_falls_back() -> None:
    assert "valve" not in {m.value for m in WateringMode}
    assert Zone(name="Orto", watering="valve").watering is None
    assert Planting(name="Melo", species="Malus domestica", watering="valve").watering is None
    assert Zone(name="Orto", watering="drip", valve_entity="valve.orto").watering == "drip"


def test_sown_then_transplanted_starts_at_two() -> None:
    p = Planting(
        name="Pomodoro",
        species="Solanum lycopersicum",
        plant_type="vegetable",
        origin="sown",
        sown_on="2026-03-01",
        planted_on="2026-05-01",
    )
    assert growth_start_stage(p) == 2
    assert growth_stage(p, date(2026, 5, 1)) == 2.0
    seedling = Planting(name="Lattuga", species="Lactuca sativa", origin="sown", sown_on="2026-03-01")
    assert growth_start_stage(seedling) == 1


async def test_services_refuse_the_old_mode(hass: HomeAssistant) -> None:
    entry = MockConfigEntry(domain=DOMAIN, title="HA Homestead")
    entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    with pytest.raises(vol.Invalid):
        await hass.services.async_call(
            DOMAIN, "add_zone", {"name": "Orto", "watering": "valve"}, blocking=True, return_response=True
        )
