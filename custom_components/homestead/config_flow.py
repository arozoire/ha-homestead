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
    NumberSelector,
    NumberSelectorConfig,
    NumberSelectorMode,
    SelectSelector,
    SelectSelectorConfig,
    SelectSelectorMode,
    TimeSelector,
)

from .const import (
    CONF_ALERT_NOTIFY,
    CONF_HEAT_DAYS,
    CONF_HEAT_EXTREME,
    CONF_HEAT_MAX,
    CONF_HEAT_NIGHT,
    CONF_HUMIDITY,
    CONF_NOTIFY,
    CONF_NOTIFY_TIME,
    CONF_OPEN_METEO,
    CONF_PHOTO_MEDIA,
    CONF_RAIN,
    CONF_SOIL,
    CONF_SOIL_EC,
    CONF_SOIL_TEMP,
    CONF_TEMPERATURE,
    CONF_UNITS,
    CONF_WEATHER_ENTITY,
    DEFAULT_ALERT_NOTIFY,
    DEFAULT_NOTIFY_TIME,
    DOMAIN,
)
from .models import entity_list
from .units import IMPERIAL, UNIT_CHOICES, c_to_f, f_to_c, resolve_units

SENSORS = {
    CONF_TEMPERATURE: "temperature",
    CONF_HUMIDITY: "humidity",
    CONF_RAIN: "precipitation",
    CONF_SOIL: "moisture",
    CONF_SOIL_TEMP: "temperature",
    CONF_SOIL_EC: None,  # few integrations set a device class for conductivity
}


HEAT_FIELDS = {CONF_HEAT_MAX: (35, 25, 50), CONF_HEAT_NIGHT: (22, 10, 35), CONF_HEAT_EXTREME: (40, 30, 55)}


def _degrees(low: float, high: float, imperial: bool) -> NumberSelector:
    unit = "°F" if imperial else "°C"
    if imperial:
        low, high = round(c_to_f(low)), round(c_to_f(high))
    return NumberSelector(
        NumberSelectorConfig(
            min=low, max=high, step=0.5, unit_of_measurement=unit, mode=NumberSelectorMode.BOX
        )
    )


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
        # Heat thresholds are stored in °C and shown in the units of the moment.
        imperial = resolve_units(self.hass, dict(self.config_entry.options)) == IMPERIAL
        if user_input is not None:
            data = dict(user_input)
            for key in SENSORS:
                if key in data:
                    data[key] = entity_list(data[key])
                    if not data[key]:
                        del data[key]
            if imperial:
                for key in HEAT_FIELDS:
                    if data.get(key) is not None:
                        data[key] = round(f_to_c(data[key]) * 2) / 2
            return self.async_create_entry(data=data)
        shown = dict(self.config_entry.options)
        for key in SENSORS:
            if shown.get(key):
                shown[key] = entity_list(shown[key])  # one id before 0.19.1
        if imperial:
            for key in HEAT_FIELDS:
                if shown.get(key) is not None:
                    shown[key] = round(c_to_f(shown[key]))

        def heat(key: str) -> vol.Optional:
            default = HEAT_FIELDS[key][0]
            return vol.Optional(key, default=round(c_to_f(default)) if imperial else default)

        schema = vol.Schema(
            {
                **{
                    # Several sensors of the same kind are averaged (two thermometers, a probe per bed…).
                    vol.Optional(key): EntitySelector(
                        EntitySelectorConfig(domain="sensor", device_class=device_class, multiple=True)
                        if device_class
                        else EntitySelectorConfig(domain="sensor", multiple=True)
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
                vol.Optional(CONF_WEATHER_ENTITY): EntitySelector(EntitySelectorConfig(domain="weather")),
                vol.Optional(CONF_ALERT_NOTIFY, default=DEFAULT_ALERT_NOTIFY): SelectSelector(
                    SelectSelectorConfig(
                        options=["off", "tasks", "always"],
                        translation_key="alert_notify",
                        mode=SelectSelectorMode.LIST,
                    )
                ),
                vol.Optional(CONF_UNITS, default="auto"): SelectSelector(
                    SelectSelectorConfig(
                        options=list(UNIT_CHOICES), translation_key="units", mode=SelectSelectorMode.DROPDOWN
                    )
                ),
                heat(CONF_HEAT_MAX): _degrees(25, 50, imperial),
                heat(CONF_HEAT_NIGHT): _degrees(10, 35, imperial),
                vol.Optional(CONF_HEAT_DAYS, default=3): NumberSelector(
                    NumberSelectorConfig(min=1, max=10, step=1, mode=NumberSelectorMode.BOX)
                ),
                heat(CONF_HEAT_EXTREME): _degrees(30, 55, imperial),
                # Where the originals of the photo plan go: any HA media folder (a NAS added as storage).
                vol.Optional(CONF_PHOTO_MEDIA, default="local"): SelectSelector(
                    SelectSelectorConfig(
                        options=list(self.hass.config.media_dirs) or ["local"],
                        custom_value=False,
                        mode=SelectSelectorMode.DROPDOWN,
                    )
                ),
            }
        )
        return self.async_show_form(
            step_id="init", data_schema=self.add_suggested_values_to_schema(schema, shown)
        )
