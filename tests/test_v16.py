from homeassistant.core import HomeAssistant
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.homestead.const import CONF_SOIL, CONF_SOIL_EC, CONF_SOIL_TEMP, DOMAIN
from custom_components.homestead.weather import summarize_statistics

HOURS = 24 * 8
SOIL_T = "sensor.wh52_soil_temperature"
SOIL_EC = "sensor.wh52_soil_ec"


def _rows(**values) -> list[dict]:
    return [dict(values) for _ in range(HOURS)]


def test_soil_temperature_and_ec() -> None:
    rows = {SOIL_T: _rows(mean=11.0, min=8.5, max=13.2), SOIL_EC: _rows(mean=420.4)}
    out = summarize_statistics(rows, {CONF_SOIL_TEMP: SOIL_T, CONF_SOIL_EC: SOIL_EC}, HOURS)
    assert out == {"soil_t_mean": 11.0, "soil_t_min": 8.5, "soil_t_max": 13.2, "ec_mean": 420}


async def test_soil_sensors_for_the_panel(hass: HomeAssistant, hass_ws_client) -> None:
    options = {CONF_SOIL: "sensor.wh52_moisture", CONF_SOIL_TEMP: SOIL_T, CONF_SOIL_EC: SOIL_EC}
    entry = MockConfigEntry(domain=DOMAIN, title="HA Homestead", options=options)
    entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    ws = await hass_ws_client(hass)
    await ws.send_json({"id": 1, "type": "homestead/soil"})
    result = (await ws.receive_json())["result"]
    assert result == {"moisture": "sensor.wh52_moisture", "temperature": SOIL_T, "ec": SOIL_EC}
