"""Services to record plantings, zones, expenses and tools."""

from __future__ import annotations

from dataclasses import replace
from datetime import date
from typing import Any

import voluptuous as vol
from homeassistant.core import HomeAssistant, ServiceCall, ServiceResponse, SupportsResponse, callback
from homeassistant.exceptions import ServiceValidationError
from homeassistant.helpers import config_validation as cv
from homeassistant.util import dt as dt_util

from .const import DOMAIN
from .geo import validate_polygon
from .models import (
    Expense,
    ExpenseCategory,
    InitialForm,
    Planting,
    PlantingKind,
    PlantingStatus,
    Tool,
    ToolPower,
    ToolStatus,
    Zone,
    ZoneKind,
)
from .store import HomesteadStore, get_store

_opt_str = vol.Any(None, cv.string)
_opt_date = vol.Any(None, cv.date)
_positive = vol.All(vol.Coerce(float), vol.Range(min=0))

ADD_ZONE_SCHEMA = vol.Schema(
    {
        vol.Required("name"): cv.string,
        vol.Optional("parent_id"): _opt_str,
        vol.Optional("kind"): vol.Any(None, vol.In([k.value for k in ZoneKind])),
        vol.Optional("area_id"): _opt_str,
        vol.Optional("geometry"): vol.Any(None, validate_polygon),
        vol.Optional("notes"): _opt_str,
    }
)

UPDATE_ZONE_SCHEMA = vol.Schema(
    {
        vol.Required("id"): cv.string,
        **{vol.Optional(str(key)): value for key, value in ADD_ZONE_SCHEMA.schema.items()},
    }
)

DELETE_ZONE_SCHEMA = vol.Schema({vol.Required("id"): cv.string})

ADD_PLANTING_SCHEMA = vol.Schema(
    {
        vol.Required("name"): cv.string,
        vol.Required("species"): cv.string,
        vol.Optional("variety"): _opt_str,
        vol.Optional("kind", default=PlantingKind.SINGLE): vol.In([k.value for k in PlantingKind]),
        vol.Optional("quantity", default=1): vol.All(vol.Coerce(int), vol.Range(min=1)),
        vol.Optional("planted_on"): _opt_date,
        vol.Optional("initial_form"): vol.Any(None, vol.In([f.value for f in InitialForm])),
        vol.Optional("initial_height_cm"): vol.Any(None, _positive),
        vol.Optional("rootstock"): _opt_str,
        vol.Optional("supplier"): _opt_str,
        vol.Optional("zone_id"): _opt_str,
        vol.Optional("latitude"): vol.Any(None, cv.latitude),
        vol.Optional("longitude"): vol.Any(None, cv.longitude),
        vol.Optional("price"): vol.Any(None, _positive),
        vol.Optional("notes"): _opt_str,
    }
)

UPDATE_PLANTING_SCHEMA = vol.Schema(
    {
        vol.Required("id"): cv.string,
        **{
            vol.Optional(str(key)): value
            for key, value in ADD_PLANTING_SCHEMA.schema.items()
            if key != "price"
        },
        vol.Optional("status"): vol.In([s.value for s in PlantingStatus]),
    }
)

DELETE_PLANTING_SCHEMA = vol.Schema({vol.Required("id"): cv.string})

ADD_EXPENSE_SCHEMA = vol.Schema(
    {
        vol.Required("amount"): _positive,
        vol.Required("category"): vol.In([c.value for c in ExpenseCategory]),
        vol.Optional("spent_on"): _opt_date,
        vol.Optional("supplier"): _opt_str,
        vol.Optional("planting_id"): _opt_str,
        vol.Optional("tool_id"): _opt_str,
        vol.Optional("notes"): _opt_str,
    }
)

ADD_TOOL_SCHEMA = vol.Schema(
    {
        vol.Required("name"): cv.string,
        vol.Optional("category"): _opt_str,
        vol.Optional("brand"): _opt_str,
        vol.Optional("model"): _opt_str,
        vol.Optional("purchased_on"): _opt_date,
        vol.Optional("power", default=ToolPower.MANUAL): vol.In([p.value for p in ToolPower]),
        vol.Optional("status", default=ToolStatus.OK): vol.In([s.value for s in ToolStatus]),
        vol.Optional("next_service_on"): _opt_date,
        vol.Optional("price"): vol.Any(None, _positive),
        vol.Optional("notes"): _opt_str,
    }
)


def _store(hass: HomeAssistant) -> HomesteadStore:
    if store := get_store(hass):
        return store
    raise ServiceValidationError(translation_domain=DOMAIN, translation_key="not_loaded")


def _iso(value: date | None) -> str | None:
    return value.isoformat() if value else None


def _check_position(planting: Planting) -> None:
    if (planting.latitude is None) != (planting.longitude is None):
        raise ServiceValidationError(translation_domain=DOMAIN, translation_key="incomplete_position")


def _check_ref(collection: dict, ref: str | None, key: str) -> None:
    if ref and ref not in collection:
        raise ServiceValidationError(
            translation_domain=DOMAIN,
            translation_key="unknown_reference",
            translation_placeholders={"field": key, "value": ref},
        )


@callback
def async_register_services(hass: HomeAssistant) -> None:
    async def add_zone(call: ServiceCall) -> ServiceResponse:
        store = _store(hass)
        args = dict(call.data)
        _check_ref(store.data.zones, args.get("parent_id"), "parent_id")
        zone = Zone(**args)
        store.data.zones[zone.id] = zone
        await store.async_save()
        return {"id": zone.id}

    async def update_zone(call: ServiceCall) -> ServiceResponse:
        store = _store(hass)
        args = dict(call.data)
        zone_id = args.pop("id")
        _check_ref(store.data.zones, zone_id, "id")
        parent_id = args.get("parent_id")
        _check_ref(store.data.zones, parent_id, "parent_id")
        if parent_id and (parent_id == zone_id or parent_id in store.data.zone_descendants(zone_id)):
            raise ServiceValidationError(translation_domain=DOMAIN, translation_key="zone_cycle")
        store.data.zones[zone_id] = replace(store.data.zones[zone_id], **args)
        await store.async_save()
        return {"id": zone_id}

    async def delete_zone(call: ServiceCall) -> ServiceResponse:
        store = _store(hass)
        zone_id = call.data["id"]
        _check_ref(store.data.zones, zone_id, "id")
        zone = store.data.zones.pop(zone_id)
        for child in store.data.zones.values():
            if child.parent_id == zone_id:
                child.parent_id = zone.parent_id
        for planting in store.data.plantings.values():
            if planting.zone_id == zone_id:
                planting.zone_id = zone.parent_id
        await store.async_save()
        return {"id": zone_id}

    async def add_planting(call: ServiceCall) -> ServiceResponse:
        store = _store(hass)
        args: dict[str, Any] = dict(call.data)
        price = args.pop("price", None)
        args["planted_on"] = _iso(args.get("planted_on"))
        _check_ref(store.data.zones, args.get("zone_id"), "zone_id")
        if args["kind"] == PlantingKind.SINGLE:
            args["quantity"] = 1
        planting = Planting(**args)
        _check_position(planting)
        store.data.plantings[planting.id] = planting
        if price:
            _add_expense(
                store,
                amount=price,
                category=ExpenseCategory.PLANTS,
                spent_on=planting.planted_on,
                supplier=planting.supplier,
                planting_id=planting.id,
            )
        await store.async_save()
        return {"id": planting.id}

    async def update_planting(call: ServiceCall) -> ServiceResponse:
        store = _store(hass)
        args: dict[str, Any] = dict(call.data)
        planting_id = args.pop("id")
        _check_ref(store.data.plantings, planting_id, "id")
        _check_ref(store.data.zones, args.get("zone_id"), "zone_id")
        if "planted_on" in args:
            args["planted_on"] = _iso(args["planted_on"])
            args["moon_phase"] = None
        planting = replace(store.data.plantings[planting_id], **args)
        if planting.kind == PlantingKind.SINGLE:
            planting.quantity = 1
        _check_position(planting)
        store.data.plantings[planting_id] = planting
        await store.async_save()
        return {"id": planting_id}

    async def delete_planting(call: ServiceCall) -> ServiceResponse:
        store = _store(hass)
        planting_id = call.data["id"]
        _check_ref(store.data.plantings, planting_id, "id")
        del store.data.plantings[planting_id]
        for expense in store.data.expenses.values():
            if expense.planting_id == planting_id:
                expense.planting_id = None
        await store.async_save()
        return {"id": planting_id}

    async def add_expense(call: ServiceCall) -> ServiceResponse:
        store = _store(hass)
        args = dict(call.data)
        _check_ref(store.data.plantings, args.get("planting_id"), "planting_id")
        _check_ref(store.data.tools, args.get("tool_id"), "tool_id")
        args["spent_on"] = _iso(args.get("spent_on"))
        expense = _add_expense(store, **args)
        await store.async_save()
        return {"id": expense.id}

    async def add_tool(call: ServiceCall) -> ServiceResponse:
        store = _store(hass)
        args: dict[str, Any] = dict(call.data)
        price = args.pop("price", None)
        args["purchased_on"] = _iso(args.get("purchased_on"))
        args["next_service_on"] = _iso(args.get("next_service_on"))
        tool = Tool(**args)
        store.data.tools[tool.id] = tool
        if price:
            _add_expense(
                store,
                amount=price,
                category=ExpenseCategory.TOOLS,
                spent_on=tool.purchased_on,
                tool_id=tool.id,
            )
        await store.async_save()
        return {"id": tool.id}

    async def export(call: ServiceCall) -> ServiceResponse:
        return _store(hass).data.to_dict()

    def _add_expense(store: HomesteadStore, *, spent_on: str | None, **kwargs: Any) -> Expense:
        expense = Expense(spent_on=spent_on or dt_util.now().date().isoformat(), **kwargs)
        store.data.expenses[expense.id] = expense
        return expense

    for name, handler, schema, response in (
        ("add_zone", add_zone, ADD_ZONE_SCHEMA, SupportsResponse.OPTIONAL),
        ("update_zone", update_zone, UPDATE_ZONE_SCHEMA, SupportsResponse.OPTIONAL),
        ("delete_zone", delete_zone, DELETE_ZONE_SCHEMA, SupportsResponse.OPTIONAL),
        ("add_planting", add_planting, ADD_PLANTING_SCHEMA, SupportsResponse.OPTIONAL),
        ("update_planting", update_planting, UPDATE_PLANTING_SCHEMA, SupportsResponse.OPTIONAL),
        ("delete_planting", delete_planting, DELETE_PLANTING_SCHEMA, SupportsResponse.OPTIONAL),
        ("add_expense", add_expense, ADD_EXPENSE_SCHEMA, SupportsResponse.OPTIONAL),
        ("add_tool", add_tool, ADD_TOOL_SCHEMA, SupportsResponse.OPTIONAL),
        ("export", export, vol.Schema({}), SupportsResponse.ONLY),
    ):
        hass.services.async_register(DOMAIN, name, handler, schema=schema, supports_response=response)
