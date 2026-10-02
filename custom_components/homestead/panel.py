"""Sidebar panel: a web component served by the integration itself."""

from __future__ import annotations

from pathlib import Path

from homeassistant.components import frontend, panel_custom
from homeassistant.components.http import StaticPathConfig
from homeassistant.core import HomeAssistant
from homeassistant.loader import async_get_integration

from .const import DOMAIN

PANEL_URL_PATH = DOMAIN
STATIC_URL = f"/{DOMAIN}_static"
_STATIC_REGISTERED = f"{DOMAIN}_static_registered"


async def async_register_panel(hass: HomeAssistant) -> None:
    if not hass.data.get(_STATIC_REGISTERED):
        path = Path(__file__).parent / "frontend"
        await hass.http.async_register_static_paths([StaticPathConfig(STATIC_URL, str(path), False)])
        hass.data[_STATIC_REGISTERED] = True
    version = (await async_get_integration(hass, DOMAIN)).version
    await panel_custom.async_register_panel(
        hass,
        frontend_url_path=PANEL_URL_PATH,
        webcomponent_name="homestead-panel",
        sidebar_title="Giardino" if hass.config.language == "it" else "Garden",
        sidebar_icon="mdi:sprout",
        module_url=f"{STATIC_URL}/homestead-panel.js?v={version}",
        require_admin=False,
    )


def async_unregister_panel(hass: HomeAssistant) -> None:
    frontend.async_remove_panel(hass, PANEL_URL_PATH, warn_if_unknown=False)
