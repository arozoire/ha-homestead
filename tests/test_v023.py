"""0.23: modules switched on for the whole house, kept in the data and in backups."""

from homeassistant.core import HomeAssistant
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.homestead.backup import make_backup, read_backup
from custom_components.homestead.const import DOMAIN
from custom_components.homestead.models import HomesteadData, clean_settings


def test_settings_keep_only_known_modules() -> None:
    assert clean_settings(None) == {}
    assert clean_settings({"modules": ["bees", "rockets", "coop"], "other": 1}) == {
        "modules": ["coop", "bees"]
    }
    data = HomesteadData.from_dict({"settings": {"modules": ["water"]}})
    assert data.to_dict()["settings"] == {"modules": ["water"]}
    assert HomesteadData.from_dict({}).settings == {}  # before 0.23: every module on


async def test_set_modules_service_and_backup(hass: HomeAssistant) -> None:
    entry = MockConfigEntry(domain=DOMAIN, title="HA Homestead")
    entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    store = entry.runtime_data
    reply = await hass.services.async_call(
        DOMAIN, "set_modules", {"modules": ["compost", "coop"]}, blocking=True, return_response=True
    )
    assert reply == {"modules": ["coop", "compost"]}
    assert store.data.settings == {"modules": ["coop", "compost"]}
    back = read_backup(make_backup(store.data, "2026-11-23", "0.23.0"))
    assert back.settings == {"modules": ["coop", "compost"]}
