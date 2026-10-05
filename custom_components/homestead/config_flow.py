"""Config flow for HA Homestead; options choose the weather sensors used by the diary."""

from __future__ import annotations

from typing import Any

import voluptuous as vol
from homeassistant.config_entries import ConfigEntry, ConfigFlow, ConfigFlowResult, OptionsFlow
from homeassistant.core import callback
from homeassistant.helpers.selector import (
    BooleanSelector,
    EntitySelector,
    EntitySelectorConfig,
    SelectSelector,
    SelectSelectorConfig,
    SelectSelectorMode,
    TimeSelector,
)

from .const import (
    CONF_HUMIDITY,
    CONF_NOTIFY,
    CONF_NOTIFY_TIME,
    CONF_OPEN_METEO,
    CONF_RAIN,
    CONF_SOIL,
    CONF_TEMPERATURE,
    DEFAULT_NOTIFY_TIME,
    DOMAIN,
)

SENSORS = {
    CONF_TEMPERATURE: "temperature",
    CONF_HUMIDITY: "humidity",
    CONF_RAIN: "precipitation",
    CONF_SOIL: "moisture",
}


class HomesteadConfigFlow(ConfigFlow, domain=DOMAIN):
    VERSION = 1

    async def async_step_user(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        if user_input is not None:
            return self.async_create_entry(title="HA Homestead", data={})
        return self.async_show_form(step_id="user")

    @staticmethod
    @callback
    def async_get_options_flow(config_entry: ConfigEntry) -> OptionsFlow:
        return HomesteadOptionsFlow()


class HomesteadOptionsFlow(OptionsFlow):
    """Weather sensors (optional: what is missing comes from Open-Meteo) and phone reminders."""

    def _notify_services(self) -> list[str]:
        """Phones first (mobile_app_*), then the other notify services."""
        names = [n for n in self.hass.services.async_services_for_domain("notify") if n != "send_message"]
        return sorted(
            (f"notify.{n}" for n in names), key=lambda n: (not n.startswith("notify.mobile_app_"), n)
        )

    async def async_step_init(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        if user_input is not None:
            return self.async_create_entry(data=user_input)
        schema = vol.Schema(
            {
                **{
                    vol.Optional(key): EntitySelector(
                        EntitySelectorConfig(domain="sensor", device_class=device_class)
                    )
                    for key, device_class in SENSORS.items()
                },
                vol.Optional(CONF_OPEN_METEO, default=True): BooleanSelector(),
                vol.Optional(CONF_NOTIFY): SelectSelector(
                    SelectSelectorConfig(
                        options=self._notify_services(),
                        multiple=True,
                        custom_value=True,
                        mode=SelectSelectorMode.DROPDOWN,
                    )
                ),
                vol.Optional(CONF_NOTIFY_TIME, default=DEFAULT_NOTIFY_TIME): TimeSelector(),
            }
        )
        return self.async_show_form(
            step_id="init", data_schema=self.add_suggested_values_to_schema(schema, self.config_entry.options)
        )
