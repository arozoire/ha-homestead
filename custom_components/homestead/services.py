"""Services to record plantings, zones, expenses and tools."""

from __future__ import annotations

import re
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
    EVENT_COST_CATEGORY,
    Abundance,
    Event,
    EventKind,
    Expense,
    ExpenseCategory,
    HarvestUnit,
    InitialForm,
    Planting,
    PlantingKind,
    PlantingOrigin,
    PlantingStatus,
    Task,
    Tool,
    ToolPower,
    ToolStatus,
    Zone,
    ZoneKind,
)
from .photos import delete_photo_file, photo_dir
from .species import SourcesUnavailable, fetch_details, upsert_taxon
from .store import HomesteadStore, get_store
from .tasks import async_complete_task, mark_task_done
from .weather import async_fill_event, async_refresh, schedule_weather

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
        vol.Optional("event_id"): _opt_str,
        vol.Optional("income", default=False): cv.boolean,
        vol.Optional("notes"): _opt_str,
    }
)

UPDATE_EXPENSE_SCHEMA = vol.Schema(
    {
        vol.Required("id"): cv.string,
        **{vol.Optional(str(key)): value for key, value in ADD_EXPENSE_SCHEMA.schema.items()},
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


UPDATE_TOOL_SCHEMA = vol.Schema(
    {
        vol.Required("id"): cv.string,
        **{vol.Optional(str(key)): value for key, value in ADD_TOOL_SCHEMA.schema.items() if key != "price"},
    }
)

ID_SCHEMA = vol.Schema({vol.Required("id"): cv.string})

_EVENT_FIELDS = {
    vol.Optional("product"): _opt_str,
    vol.Optional("dose"): _opt_str,
    vol.Optional("quantity"): vol.Any(None, _positive),
    vol.Optional("unit"): vol.Any(None, vol.In([u.value for u in HarvestUnit])),
    vol.Optional("rating"): vol.Any(None, vol.All(vol.Coerce(int), vol.Range(min=1, max=5))),
    vol.Optional("abundance"): vol.Any(None, vol.In([a.value for a in Abundance])),
    vol.Optional("keep"): _opt_str,
    vol.Optional("avoid"): _opt_str,
    vol.Optional("notes"): _opt_str,
}

REPEAT_PLANTING_SCHEMA = vol.Schema(
    {
        vol.Required("id"): cv.string,
        vol.Optional("year"): vol.All(vol.Coerce(int), vol.Range(min=1900, max=2200)),
    }
)

REFRESH_WEATHER_SCHEMA = vol.Schema({vol.Optional("id"): cv.string})

_TASK_FIELDS = {
    vol.Optional("title"): _opt_str,
    vol.Exclusive("planting_id", "target"): vol.Any(None, cv.string),
    vol.Exclusive("zone_id", "target"): vol.Any(None, cv.string),
    vol.Optional("yearly"): cv.boolean,
    vol.Optional("notes"): _opt_str,
}

ADD_TASK_SCHEMA = vol.Schema(
    {
        vol.Required("kind"): vol.In([k.value for k in EventKind]),
        vol.Required("due_on"): cv.date,
        **_TASK_FIELDS,
    }
)

UPDATE_TASK_SCHEMA = vol.Schema(
    {
        vol.Required("id"): cv.string,
        vol.Optional("kind"): vol.In([k.value for k in EventKind]),
        vol.Optional("due_on"): cv.date,
        **_TASK_FIELDS,
    }
)

COMPLETE_TASK_SCHEMA = vol.Schema({vol.Required("id"): cv.string, vol.Optional("done_on"): cv.date})

ADD_EVENT_SCHEMA = vol.All(
    vol.Schema(
        {
            vol.Required("kind"): vol.In([k.value for k in EventKind]),
            vol.Optional("done_on"): _opt_date,
            vol.Exclusive("planting_id", "target"): cv.string,
            vol.Exclusive("zone_id", "target"): cv.string,
            **_EVENT_FIELDS,
            vol.Optional("cost"): vol.Any(None, _positive),
            vol.Optional("revenue"): vol.Any(None, _positive),
            vol.Optional("task_id"): cv.string,
        }
    ),
    cv.has_at_least_one_key("planting_id", "zone_id"),
)

UPDATE_EVENT_SCHEMA = vol.Schema(
    {
        vol.Required("id"): cv.string,
        vol.Optional("kind"): vol.In([k.value for k in EventKind]),
        vol.Optional("done_on"): cv.date,
        vol.Exclusive("planting_id", "target"): cv.string,
        vol.Exclusive("zone_id", "target"): cv.string,
        **_EVENT_FIELDS,
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
        for task in store.data.tasks.values():
            if task.zone_id == zone_id:
                task.zone_id = zone.parent_id
        for event in [e for e in store.data.events.values() if e.zone_id == zone_id]:
            if zone.parent_id:
                event.zone_id = zone.parent_id
            else:
                await _remove_event(store, event.id)
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
        for photo in [p for p in store.data.photos.values() if p.planting_id == planting_id]:
            del store.data.photos[photo.id]
            await hass.async_add_executor_job(delete_photo_file, photo_dir(hass), photo.file)
        for expense in store.data.expenses.values():
            if expense.planting_id == planting_id:
                expense.planting_id = None
        for event in [e for e in store.data.events.values() if e.planting_id == planting_id]:
            await _remove_event(store, event.id)
        for task in [t for t in store.data.tasks.values() if t.planting_id == planting_id]:
            del store.data.tasks[task.id]
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
        _check_ref(store.data.events, args.get("event_id"), "event_id")
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

    async def update_expense(call: ServiceCall) -> ServiceResponse:
        store = _store(hass)
        args: dict[str, Any] = dict(call.data)
        expense_id = args.pop("id")
        _check_ref(store.data.expenses, expense_id, "id")
        _check_ref(store.data.plantings, args.get("planting_id"), "planting_id")
        _check_ref(store.data.tools, args.get("tool_id"), "tool_id")
        if "spent_on" in args:
            args["spent_on"] = _iso(args["spent_on"]) or store.data.expenses[expense_id].spent_on
        store.data.expenses[expense_id] = replace(store.data.expenses[expense_id], **args)
        await store.async_save()
        return {"id": expense_id}

    async def delete_expense(call: ServiceCall) -> ServiceResponse:
        store = _store(hass)
        _check_ref(store.data.expenses, call.data["id"], "id")
        del store.data.expenses[call.data["id"]]
        await store.async_save()
        return {"id": call.data["id"]}

    async def update_tool(call: ServiceCall) -> ServiceResponse:
        store = _store(hass)
        args: dict[str, Any] = dict(call.data)
        tool_id = args.pop("id")
        _check_ref(store.data.tools, tool_id, "id")
        for key in ("purchased_on", "next_service_on"):
            if key in args:
                args[key] = _iso(args[key])
        store.data.tools[tool_id] = replace(store.data.tools[tool_id], **args)
        await store.async_save()
        return {"id": tool_id}

    async def delete_tool(call: ServiceCall) -> ServiceResponse:
        store = _store(hass)
        tool_id = call.data["id"]
        _check_ref(store.data.tools, tool_id, "id")
        del store.data.tools[tool_id]
        for expense in store.data.expenses.values():
            if expense.tool_id == tool_id:
                expense.tool_id = None
        await store.async_save()
        return {"id": tool_id}

    async def delete_photo(call: ServiceCall) -> ServiceResponse:
        store = _store(hass)
        _check_ref(store.data.photos, call.data["id"], "id")
        photo = store.data.photos.pop(call.data["id"])
        await hass.async_add_executor_job(delete_photo_file, photo_dir(hass), photo.file)
        await store.async_save()
        return {"id": photo.id}

    async def export(call: ServiceCall) -> ServiceResponse:
        return _store(hass).data.to_dict()

    async def add_event(call: ServiceCall) -> ServiceResponse:
        store = _store(hass)
        args: dict[str, Any] = dict(call.data)
        cost, revenue = args.pop("cost", None), args.pop("revenue", None)
        task_id = args.pop("task_id", None)
        _check_ref(store.data.tasks, task_id, "task_id")
        _check_ref(store.data.plantings, args.get("planting_id"), "planting_id")
        _check_ref(store.data.zones, args.get("zone_id"), "zone_id")
        args["done_on"] = _iso(args.get("done_on")) or dt_util.now().date().isoformat()
        event = Event(**args)
        store.data.events[event.id] = event
        link = {"spent_on": event.done_on, "planting_id": event.planting_id, "event_id": event.id}
        if cost:
            category = EVENT_COST_CATEGORY.get(EventKind(event.kind), ExpenseCategory.OTHER)
            _add_expense(store, amount=cost, category=category, **link)
        if revenue:
            _add_expense(store, amount=revenue, category=ExpenseCategory.SALES, income=True, **link)
        if event.kind == EventKind.REMOVAL and event.planting_id:
            store.data.plantings[event.planting_id].status = PlantingStatus.REMOVED
        if task_id:
            mark_task_done(store, task_id, event)
        await store.async_save()
        schedule_weather(hass, store, event.id)
        return {"id": event.id}

    def _task_args(store: HomesteadStore, args: dict[str, Any]) -> dict[str, Any]:
        _check_ref(store.data.plantings, args.get("planting_id"), "planting_id")
        _check_ref(store.data.zones, args.get("zone_id"), "zone_id")
        if "due_on" in args:
            args["due_on"] = _iso(args["due_on"])
        if "planting_id" in args or "zone_id" in args:
            # One target at most; sending only "planting_id": null clears both.
            planting_id = args.get("planting_id")
            args["planting_id"], args["zone_id"] = planting_id, None if planting_id else args.get("zone_id")
        return args

    async def add_task(call: ServiceCall) -> ServiceResponse:
        store = _store(hass)
        task = Task(**_task_args(store, dict(call.data)))
        store.data.tasks[task.id] = task
        await store.async_save()
        return {"id": task.id}

    async def update_task(call: ServiceCall) -> ServiceResponse:
        store = _store(hass)
        args = dict(call.data)
        task_id = args.pop("id")
        _check_ref(store.data.tasks, task_id, "id")
        store.data.tasks[task_id] = replace(store.data.tasks[task_id], **_task_args(store, args))
        await store.async_save()
        return {"id": task_id}

    async def delete_task(call: ServiceCall) -> ServiceResponse:
        store = _store(hass)
        _check_ref(store.data.tasks, call.data["id"], "id")
        del store.data.tasks[call.data["id"]]
        await store.async_save()
        return {"id": call.data["id"]}

    async def complete_task(call: ServiceCall) -> ServiceResponse:
        """Done: record it in the diary (today by default)."""
        store = _store(hass)
        _check_ref(store.data.tasks, call.data["id"], "id")
        event = await async_complete_task(hass, store, call.data["id"], _iso(call.data.get("done_on")))
        return {"id": event.id}

    async def update_event(call: ServiceCall) -> ServiceResponse:
        store = _store(hass)
        args: dict[str, Any] = dict(call.data)
        event_id = args.pop("id")
        _check_ref(store.data.events, event_id, "id")
        _check_ref(store.data.plantings, args.get("planting_id"), "planting_id")
        _check_ref(store.data.zones, args.get("zone_id"), "zone_id")
        if args.get("planting_id"):
            args["zone_id"] = None
        if args.get("zone_id"):
            args["planting_id"] = None
        if "done_on" in args:
            args["done_on"] = _iso(args["done_on"])
            args["moon_phase"] = None
        old = store.data.events[event_id]
        if args.get("done_on", old.done_on) != old.done_on or args.get("kind", old.kind) != old.kind:
            args["weather"] = None
        store.data.events[event_id] = replace(old, **args)
        await store.async_save()
        if store.data.events[event_id].weather is None:
            schedule_weather(hass, store, event_id)
        return {"id": event_id}

    async def refresh_weather(call: ServiceCall) -> ServiceResponse:
        store = _store(hass)
        if event_id := call.data.get("id"):
            _check_ref(store.data.events, event_id, "id")
            store.data.events[event_id].weather = None
            changed = int(await async_fill_event(hass, store, event_id))
            await store.async_save()
        else:
            changed = await async_refresh(hass, store, force=True)
        return {"updated": changed}

    async def repeat_planting(call: ServiceCall) -> ServiceResponse:
        """Same crop for a new season: species, variety, zone and position; no dates."""
        store = _store(hass)
        _check_ref(store.data.plantings, call.data["id"], "id")
        source = store.data.plantings[call.data["id"]]
        year = call.data.get("year") or dt_util.now().year + 1
        name = re.sub(r"\b(19|20)\d\d\b", str(year), source.name)
        planting = Planting(
            name=name if name != source.name else f"{source.name} {year}",
            species=source.species,
            taxon_id=source.taxon_id,
            variety=source.variety,
            kind=source.kind,
            quantity=source.quantity,
            origin=source.origin,
            zone_id=source.zone_id,
            latitude=source.latitude,
            longitude=source.longitude,
        )
        store.data.plantings[planting.id] = planting
        await store.async_save()
        return {"id": planting.id, "name": planting.name}

    async def delete_event(call: ServiceCall) -> ServiceResponse:
        store = _store(hass)
        _check_ref(store.data.events, call.data["id"], "id")
        await _remove_event(store, call.data["id"])
        await store.async_save()
        return {"id": call.data["id"]}

    async def _remove_event(store: HomesteadStore, event_id: str) -> None:
        """Delete an event and its photos; its expenses stay, unlinked."""
        del store.data.events[event_id]
        for task in store.data.tasks.values():
            if task.event_id == event_id:
                task.event_id = None
        for photo in [p for p in store.data.photos.values() if p.event_id == event_id]:
            del store.data.photos[photo.id]
            await hass.async_add_executor_job(delete_photo_file, photo_dir(hass), photo.file)
        for expense in store.data.expenses.values():
            if expense.event_id == event_id:
                expense.event_id = None

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
        ("update_expense", update_expense, UPDATE_EXPENSE_SCHEMA, SupportsResponse.OPTIONAL),
        ("delete_expense", delete_expense, ID_SCHEMA, SupportsResponse.OPTIONAL),
        ("add_tool", add_tool, ADD_TOOL_SCHEMA, SupportsResponse.OPTIONAL),
        ("update_tool", update_tool, UPDATE_TOOL_SCHEMA, SupportsResponse.OPTIONAL),
        ("delete_tool", delete_tool, ID_SCHEMA, SupportsResponse.OPTIONAL),
        ("delete_photo", delete_photo, ID_SCHEMA, SupportsResponse.OPTIONAL),
        ("add_event", add_event, ADD_EVENT_SCHEMA, SupportsResponse.OPTIONAL),
        ("update_event", update_event, UPDATE_EVENT_SCHEMA, SupportsResponse.OPTIONAL),
        ("delete_event", delete_event, ID_SCHEMA, SupportsResponse.OPTIONAL),
        ("refresh_weather", refresh_weather, REFRESH_WEATHER_SCHEMA, SupportsResponse.OPTIONAL),
        ("repeat_planting", repeat_planting, REPEAT_PLANTING_SCHEMA, SupportsResponse.OPTIONAL),
        ("add_task", add_task, ADD_TASK_SCHEMA, SupportsResponse.OPTIONAL),
        ("update_task", update_task, UPDATE_TASK_SCHEMA, SupportsResponse.OPTIONAL),
        ("delete_task", delete_task, ID_SCHEMA, SupportsResponse.OPTIONAL),
        ("complete_task", complete_task, COMPLETE_TASK_SCHEMA, SupportsResponse.OPTIONAL),
        ("export", export, vol.Schema({}), SupportsResponse.ONLY),
    ):
        hass.services.async_register(DOMAIN, name, handler, schema=schema, supports_response=response)
