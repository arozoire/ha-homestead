from datetime import date, timedelta

import pytest
from homeassistant.components.recorder.models import StatisticMeanType
from homeassistant.components.recorder.statistics import async_import_statistics
from homeassistant.core import HomeAssistant
from homeassistant.util import dt as dt_util
from pytest_homeassistant_custom_component.components.recorder.common import async_wait_recording_done

from custom_components.homestead.const import CONF_RAIN, CONF_TEMPERATURE
from custom_components.homestead.weather import async_snapshot

TEMP = "sensor.outdoor_temperature"
RAIN = "sensor.rain_total"


@pytest.fixture(autouse=True)
def auto_enable_custom_integrations(recorder_mock, enable_custom_integrations):
    """The recorder must exist before hass: override the conftest fixture order."""
    yield


async def test_snapshot_reads_long_term_statistics(hass: HomeAssistant) -> None:
    await hass.config.async_set_time_zone("UTC")
    start = dt_util.parse_datetime("2026-02-05T00:00:00+00:00")
    metadata = {
        "source": "recorder",
        "statistic_id": TEMP,
        "name": None,
        "unit_of_measurement": "°C",
        "has_sum": False,
        "mean_type": StatisticMeanType.ARITHMETIC,
        "unit_class": "temperature",
    }
    stats = [
        {"start": start + timedelta(hours=h), "mean": 10.0, "min": 3.0, "max": 17.0} for h in range(24 * 8)
    ]
    async_import_statistics(hass, metadata, stats)
    rain_metadata = {
        **metadata,
        "statistic_id": RAIN,
        "unit_of_measurement": "mm",
        "has_sum": True,
        "mean_type": StatisticMeanType.NONE,
        "unit_class": "distance",
    }
    rain = [
        {"start": start + timedelta(hours=h), "state": 0.1 * h, "sum": 0.1 * h} for h in range(24 * 8 + 1)
    ]
    async_import_statistics(hass, rain_metadata, rain)
    await async_wait_recording_done(hass)

    snapshot = await async_snapshot(
        hass, {CONF_TEMPERATURE: TEMP, CONF_RAIN: RAIN, "open_meteo": False}, "pruning", date(2026, 2, 12)
    )
    assert (snapshot["t_mean"], snapshot["t_min"], snapshot["t_max"]) == (10.0, 3.0, 17.0)
    assert snapshot["source"] == "sensors"
    assert snapshot["rain_mm"] == pytest.approx(19.1, abs=0.2)  # 0.1 mm per hour over 8 days
