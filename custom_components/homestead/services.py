"""Services to record plantings, zones, expenses and tools."""

from __future__ import annotations

from dataclasses import replace
from datetime import date
from typing import Any

import voluptuous as vol
from homeassistant.core import HomeAssistant, ServiceCall, ServiceResponse, SupportsResponse, callback
from homeassistant.exceptions import ServiceValidationError
from homeassistant.helpers import config_validation as cv
from homeassistant.helpers.aiohttp_client import async_get_clientsession
from homeassistant.util import dt as dt_util

from .const import DOMAIN
from .geo import validate_polygon
from .models import (
    Expense,
    ExpenseCategory,
    InitialForm,
    Planting,
    PlantingKind,
    PlantingOrigin,
    PlantingStatus,
    Tool,
    ToolPower,
    ToolStatus,
    Zone,
    ZoneKind,
)
from .species import SourcesUnavailable, fetch_details, upsert_taxon
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
        vol.Optional("species"): cv.string,
        vol.Optional("taxon_id"): _opt_str,
        vol.Optional("variety"): _opt_str,
        vol.Optional("kind", default=PlantingKind.SINGLE): vol.In([k.value for k in PlantingKind]),
        vol.Optional("quantity", default=1): vol.All(vol.Coerce(int), vol.Range(min=1)),
        vol.Optional("origin"): vol.Any(None, vol.In([o.value for o in PlantingOrigin])),
        vol.Optional("sown_on"): _opt_date,
        vol.Optional("planted_on"): _opt_date,
        vol.Optional("birth_year"): vol.Any(None, vol.All(vol.Coerce(int), vol.Range(min=1000, max=2200))),
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

IMPORT_TAXON_SCHEMA = vol.All(
    vol.Schema(
        {
            vol.Optional("gbif_key"): vol.All(vol.Coerce(int), vol.Range(min=1)),
            vol.Optional("wikidata_id"): vol.Match(r"^Q[1-9][0-9]*$"),
        }
    ),
    cv.has_at_least_one_key("gbif_key", "wikidata_id"),
)

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


def _taxon_languages(hass: HomeAssistant) -> list[str]:
    """Common names kept for the HA language plus the ones the UI is translated to."""
    return list(dict.fromkeys([hass.config.language.split("-")[0], "it", "en", "fr"]))


def _apply_taxon(store: HomesteadStore, args: dict[str, Any]) -> None:
    """Without a species name, a linked taxon provides it."""
    _check_ref(store.data.taxa, args.get("taxon_id"), "taxon_id")
    if not args.get("species"):
        if not args.get("taxon_id"):
            raise ServiceValidationError(translation_domain=DOMAIN, translation_key="species_required")
        args["species"] = store.data.taxa[args["taxon_id"]].scientific_name


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
        args["sown_on"] = _iso(args.get("sown_on"))
        _check_ref(store.data.zones, args.get("zone_id"), "zone_id")
        _apply_taxon(store, args)
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
        if "taxon_id" in args or "species" in args:
            current = store.data.plantings[planting_id]
            merged = {"species": current.species, "taxon_id": current.taxon_id, **args}
            if args.get("taxon_id") and "species" not in args:
                merged["species"] = None
            _apply_taxon(store, merged)
            args["species"] = merged["species"]
        if "planted_on" in args:
            args["planted_on"] = _iso(args["planted_on"])
            args["moon_phase"] = None
        if "sown_on" in args:
            args["sown_on"] = _iso(args["sown_on"])
            args["sown_moon_phase"] = None
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

    async def import_taxon(call: ServiceCall) -> ServiceResponse:
        store = _store(hass)
        try:
            details = await fetch_details(
                async_get_clientsession(hass),
                call.data.get("gbif_key"),
                call.data.get("wikidata_id"),
                _taxon_languages(hass),
            )
        except SourcesUnavailable as err:
            raise ServiceValidationError(
                translation_domain=DOMAIN, translation_key="sources_unavailable"
            ) from err
        taxon = upsert_taxon(store.data, details, dt_util.now().date().isoformat())
        await store.async_save()
        return {"id": taxon.id}

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
        ("import_taxon", import_taxon, IMPORT_TAXON_SCHEMA, SupportsResponse.OPTIONAL),
        ("add_expense", add_expense, ADD_EXPENSE_SCHEMA, SupportsResponse.OPTIONAL),
        ("add_tool", add_tool, ADD_TOOL_SCHEMA, SupportsResponse.OPTIONAL),
        ("export", export, vol.Schema({}), SupportsResponse.ONLY),
    ):
        hass.services.async_register(DOMAIN, name, handler, schema=schema, supports_response=response)
