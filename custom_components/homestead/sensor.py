"""Aggregate sensors: few entities by design, to keep Home Assistant clean."""

from __future__ import annotations

from collections.abc import Callable
from dataclasses import dataclass
from typing import Any

from homeassistant.components.sensor import (
    SensorDeviceClass,
    SensorEntity,
    SensorEntityDescription,
)
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.dispatcher import async_dispatcher_connect
from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback
from homeassistant.util import dt as dt_util

from . import HomesteadConfigEntry
from .const import SIGNAL_DATA_UPDATED
from .entity import device_info
from .models import HomesteadData


@dataclass(frozen=True, kw_only=True)
class HomesteadSensorDescription(SensorEntityDescription):
    value_fn: Callable[[HomesteadData], Any]
    attrs_fn: Callable[[HomesteadData], dict[str, Any]] | None = None


SENSORS: tuple[HomesteadSensorDescription, ...] = (
    HomesteadSensorDescription(
        key="plantings",
        translation_key="plantings",
        value_fn=lambda d: len(d.active_plantings()),
        attrs_fn=lambda d: {"plants": sum(p.quantity for p in d.active_plantings())},
    ),
    HomesteadSensorDescription(
        key="expenses_year",
        translation_key="expenses_year",
        device_class=SensorDeviceClass.MONETARY,
        value_fn=lambda d: d.expenses_total(dt_util.now().year),
    ),
    HomesteadSensorDescription(
        key="tools_needing_service",
        translation_key="tools_needing_service",
        value_fn=lambda d: len(d.tools_needing_service(dt_util.now().date())),
        attrs_fn=lambda d: {"tools": [t.name for t in d.tools_needing_service(dt_util.now().date())]},
    ),
)


async def async_setup_entry(
    hass: HomeAssistant,
    entry: HomesteadConfigEntry,
    async_add_entities: AddConfigEntryEntitiesCallback,
) -> None:
    async_add_entities(HomesteadSensor(entry, description) for description in SENSORS)


class HomesteadSensor(SensorEntity):
    _attr_has_entity_name = True
    _attr_should_poll = False

    entity_description: HomesteadSensorDescription

    def __init__(self, entry: HomesteadConfigEntry, description: HomesteadSensorDescription) -> None:
        self.entity_description = description
        self._store = entry.runtime_data
        self._attr_unique_id = f"{entry.entry_id}_{description.key}"
        self._attr_device_info = device_info(entry)
        if description.device_class is SensorDeviceClass.MONETARY:
            self._attr_native_unit_of_measurement = entry.runtime_data.hass.config.currency

    @property
    def native_value(self) -> Any:
        return self.entity_description.value_fn(self._store.data)

    @property
    def extra_state_attributes(self) -> dict[str, Any] | None:
        if self.entity_description.attrs_fn is None:
            return None
        return self.entity_description.attrs_fn(self._store.data)

    async def async_added_to_hass(self) -> None:
        self.async_on_remove(async_dispatcher_connect(self.hass, SIGNAL_DATA_UPDATED, self._handle_update))

    @callback
    def _handle_update(self) -> None:
        self.async_write_ha_state()
