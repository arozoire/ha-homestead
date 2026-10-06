from unittest.mock import AsyncMock, patch

import pytest


@pytest.fixture(autouse=True)
def auto_enable_custom_integrations(enable_custom_integrations):
    yield


@pytest.fixture(autouse=True)
def no_open_meteo():
    """Tests never reach Open-Meteo; weather tests set the mock's return value."""
    with patch("custom_components.homestead.weather._open_meteo", AsyncMock(return_value={})) as mock:
        yield mock


@pytest.fixture(autouse=True)
def no_open_meteo_outlook():
    """The garden outlook (forecast and history) never reaches Open-Meteo either."""
    with patch("custom_components.homestead.forecast._open_meteo", AsyncMock(return_value=[])) as mock:
        yield mock
