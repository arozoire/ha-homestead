"""Valve runs become watering entries in the diary.

Every zone can name the valve that turns its water on (whatever the watering mode). When that valve closes
after being open for at least a minute, each zone on it gets a watering event with the run length. Zones
that share a valve with a hose moved between them by hand: only the zone(s) where the hose is
(``hose_here``) get it.

A zone can also name the valve's flow meter (``flow_entity``): a flow rate sensor (added up over the run) or a
volume total (the difference between the start and the end of the run). The water of the run goes on the
event as quantity in litres, split evenly between the zones watered.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass
from datetime import datetime

from homeassistant.core import CALLBACK_TYPE, EventStateChangedData, HomeAssistant, State, callback
from homeassistant.core import Event as HassEvent
from homeassistant.helpers.dispatcher import async_dispatcher_connect
from homeassistant.helpers.event import async_track_state_change_event
from homeassistant.util import dt as dt_util
from homeassistant.util.unit_conversion import VolumeConverter, VolumeFlowRateConverter

from .const import DOMAIN, SIGNAL_DATA_UPDATED
from .models import Event, EventKind, HarvestUnit, Zone
from .store import HomesteadStore
from .units import IMPERIAL, resolve_units
from .weather import schedule_weather

_LOGGER = logging.getLogger(__name__)

OPEN_STATES = {"open", "opening", "on"}
MIN_RUN_MINUTES = 1.0
LITRES_PER_GALLON = 3.785411784


def watered_zones(zones: list[Zone], valve: str) -> list[Zone]:
    """Zones a run of ``valve`` waters: all on it, or where several share it only those with the hose."""
    on_valve = [z for z in zones if z.valve_entity == valve]
    if len(on_valve) <= 1:
        return on_valve
    return [z for z in on_valve if z.hose_here]


def flow_meter(zones: list[Zone], valve: str) -> str | None:
    """The flow meter of a valve: the first one named by a zone on it."""
    return next((z.flow_entity for z in zones if z.valve_entity == valve and z.flow_entity), None)


def run_minutes(opened: datetime, closed: datetime) -> float:
    return round((closed - opened).total_seconds() / 60, 1)


def litres_per_minute(state: State | None) -> float | None:
    """A flow rate sensor's reading in L/min (None when it is not a flow rate or has no number)."""
    unit = state.attributes.get("unit_of_measurement") if state else None
    if state is None or unit not in VolumeFlowRateConverter.VALID_UNITS:
        return None
    try:
        return max(0.0, VolumeFlowRateConverter.convert(float(state.state), unit, "L/min"))
    except ValueError:
        return None


def litres(state: State | None) -> float | None:
    """A volume total sensor's reading in litres (None when it is not a volume or has no number)."""
    unit = state.attributes.get("unit_of_measurement") if state else None
    if state is None or unit not in VolumeConverter.VALID_UNITS:
        return None
    try:
        return VolumeConverter.convert(float(state.state), unit, "L")
    except ValueError:
        return None


@dataclass
class Run:
    """Water measured while a valve is open."""

    meter: str | None
    total_at_start: float | None = None
    rate: float = 0.0  # L/min, the last flow rate reading
    since: datetime | None = None  # when that reading came
    added_up: float = 0.0  # litres from the flow rate so far

    def flow(self, rate: float, at: datetime) -> None:
        if self.since is not None:
            self.added_up += self.rate * (at - self.since).total_seconds() / 60
        self.rate, self.since = rate, at

    def water(self, end: datetime, total_at_end: float | None) -> float | None:
        if self.total_at_start is not None and total_at_end is not None:
            return max(0.0, total_at_end - self.total_at_start)
        if self.since is None:
            return None
        self.flow(0.0, end)
        return self.added_up


def water_text(litres_used: float, units: str) -> str:
    if units == IMPERIAL:
        return f"{round(litres_used / LITRES_PER_GALLON):g} gal"
    return f"{round(litres_used):g} l"


@callback
def async_setup_irrigation(hass: HomeAssistant, store: HomesteadStore) -> CALLBACK_TYPE:
    """Follow the zones' valves and flow meters; read again whenever the data changes."""
    tracked: dict[str, CALLBACK_TYPE] = {}
    runs: dict[str, Run] = {}

    def _units() -> str:
        entry = next(iter(hass.config_entries.async_entries(DOMAIN)), None)
        return resolve_units(hass, dict(entry.options) if entry else {})

    async def _log_run(valve: str, minutes: float, name: str, water: float | None) -> None:
        today = dt_util.now().date().isoformat()
        zones = watered_zones(list(store.data.zones.values()), valve)
        share = water / len(zones) if water is not None and zones else None
        note = f"{name}, {minutes:g} min"
        if water is not None:
            note += f", {water_text(water, _units())}"
        added = []
        for zone in zones:
            event = Event(
                kind=EventKind.WATERING,
                done_on=today,
                zone_id=zone.id,
                valve_minutes=minutes,
                quantity=round(share, 1) if share else None,
                unit=HarvestUnit.LITRES.value if share else None,
                notes=note,
            )
            store.data.events[event.id] = event
            added.append(event.id)
        if added:
            await store.async_save()
            for event_id in added:
                schedule_weather(hass, store, event_id)

    @callback
    def _flow_changed(event: HassEvent[EventStateChangedData]) -> None:
        new = event.data["new_state"]
        for run in runs.values():
            if run.meter == event.data["entity_id"] and (rate := litres_per_minute(new)) is not None:
                run.flow(rate, new.last_updated)

    @callback
    def _changed(event: HassEvent[EventStateChangedData]) -> None:
        old, new = event.data["old_state"], event.data["new_state"]
        valve = event.data["entity_id"]
        if new is not None and new.state in OPEN_STATES and (old is None or old.state not in OPEN_STATES):
            meter = flow_meter(list(store.data.zones.values()), valve)
            reading = hass.states.get(meter) if meter else None
            run = Run(meter=meter, total_at_start=litres(reading))
            if (rate := litres_per_minute(reading)) is not None:
                run.flow(rate, new.last_changed)
            runs[valve] = run
            return
        if old is None or new is None or old.state not in OPEN_STATES or new.state in OPEN_STATES:
            return
        run = runs.pop(valve, None)
        if new.state in ("unavailable", "unknown"):
            return
        minutes = run_minutes(old.last_changed, new.last_changed)
        if minutes < MIN_RUN_MINUTES:
            return
        water = None
        if run is not None and run.meter:
            water = run.water(new.last_changed, litres(hass.states.get(run.meter)))
        name = new.attributes.get("friendly_name") or valve
        hass.async_create_task(_log_run(valve, minutes, name, water), f"homestead watering {valve}")

    @callback
    def _sync() -> None:
        zones = store.data.zones.values()
        wanted = {z.valve_entity for z in zones if z.valve_entity} | {
            z.flow_entity for z in zones if z.flow_entity
        }
        valves = {z.valve_entity for z in zones if z.valve_entity}
        for entity in set(tracked) - wanted:
            tracked.pop(entity)()
        for entity in wanted - set(tracked):
            handler = _changed if entity in valves else _flow_changed
            tracked[entity] = async_track_state_change_event(hass, [entity], handler)

    _sync()
    unsub_data = async_dispatcher_connect(hass, SIGNAL_DATA_UPDATED, _sync)

    @callback
    def _unload() -> None:
        unsub_data()
        for unsub in tracked.values():
            unsub()
        tracked.clear()
        runs.clear()

    return _unload
