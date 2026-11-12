from homeassistant.core import HomeAssistant
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.homestead.backup import make_backup, read_backup
from custom_components.homestead.const import CONF_SOIL, CONF_SOIL_EC, CONF_SOIL_TEMP, DOMAIN
from custom_components.homestead.models import (
    Event,
    HomesteadData,
    PhotoPlan,
    Planting,
    Task,
    Zone,
    zone_soil_sensors,
)
from custom_components.homestead.weather import _event_options


class _Store:
    def __init__(self, data: HomesteadData) -> None:
        self.data = data


def _garden() -> HomesteadData:
    data = HomesteadData()
    data.zones["orto"] = Zone(
        id="orto", name="Orto", soil_temperature_entity="sensor.orto_t", soil_ec_entity="sensor.orto_ec"
    )
    data.zones["aiuola"] = Zone(
        id="aiuola", name="Aiuola 1", parent_id="orto", soil_ec_entity="sensor.aiuola_ec"
    )
    data.zones["frutteto"] = Zone(id="frutteto", name="Frutteto")
    data.plantings["pom"] = Planting(
        id="pom", name="Pomodoro", species="Solanum lycopersicum", zone_id="aiuola"
    )
    return data


def test_zone_sensors_from_the_zone_then_its_parents() -> None:
    data = _garden()
    assert zone_soil_sensors(data, "aiuola") == {"ec": ["sensor.aiuola_ec"], "temperature": ["sensor.orto_t"]}
    assert zone_soil_sensors(data, "frutteto") == {}
    assert zone_soil_sensors(data, None) == {}


def test_event_uses_the_zone_sensors_over_the_general_ones() -> None:
    store = _Store(_garden())
    general = {
        CONF_SOIL: "sensor.general_m",
        CONF_SOIL_TEMP: "sensor.general_t",
        CONF_SOIL_EC: "sensor.general_ec",
    }
    on_plant = Event(kind="watering", done_on="2026-11-01", planting_id="pom")
    assert _event_options(store, on_plant, general) == {
        CONF_SOIL: "sensor.general_m",
        CONF_SOIL_TEMP: ["sensor.orto_t"],
        CONF_SOIL_EC: ["sensor.aiuola_ec"],
    }
    on_orchard = Event(kind="pruning", done_on="2026-11-01", zone_id="frutteto")
    assert _event_options(store, on_orchard, general) == general


def test_backup_keeps_zone_sensors_and_cleans_photo_lists() -> None:
    data = _garden()
    data.photo_plans["p"] = PhotoPlan(id="p", zone_ids=["orto", "gone"], planting_ids=["pom", "gone"])
    data.tasks["t"] = Task(
        id="t", kind="photo", due_on="2026-11-01", zone_ids=["orto", "gone"], plan_id="nope"
    )
    back = read_backup(make_backup(data, "2026-11-09", "0.17.0"))
    assert back.zones["orto"].soil_temperature_entity == ["sensor.orto_t"]
    assert back.photo_plans["p"].zone_ids == ["orto"]
    assert back.photo_plans["p"].planting_ids == ["pom"]
    assert back.tasks["t"].zone_ids == ["orto"]
    assert back.tasks["t"].plan_id is None


async def test_zone_soil_sensors_by_service(hass: HomeAssistant) -> None:
    entry = MockConfigEntry(domain=DOMAIN, title="HA Homestead")
    entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    out = await hass.services.async_call(
        DOMAIN,
        "add_zone",
        {"name": "Serra", "soil_temperature_entity": "sensor.serra_t"},
        blocking=True,
        return_response=True,
    )
    store = entry.runtime_data
    zone = store.data.zones[out["id"]]
    assert zone.soil_temperature_entity == ["sensor.serra_t"]
    await hass.services.async_call(
        DOMAIN,
        "update_zone",
        {"id": zone.id, "soil_temperature_entity": None},
        blocking=True,
        return_response=True,
    )
    assert store.data.zones[zone.id].soil_temperature_entity == []


async def test_backup_zip_with_photos(hass: HomeAssistant, tmp_path, hass_client, hass_ws_client) -> None:
    import io
    import shutil
    import zipfile

    import aiohttp

    from custom_components.homestead.const import CONF_PHOTO_MEDIA
    from custom_components.homestead.photos import photo_dir

    jpeg = b"\xff\xd8\xff\xe0" + b"\x01" * 2048
    thumb = b"\xff\xd8\xff\xe0thumb"
    hass.config.media_dirs = {"local": str(tmp_path / "local"), "nas": str(tmp_path / "nas")}
    entry = MockConfigEntry(domain=DOMAIN, title="HA Homestead", options={CONF_PHOTO_MEDIA: "nas"})
    entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    call = hass.services.async_call
    orto = (await call(DOMAIN, "add_zone", {"name": "Orto"}, blocking=True, return_response=True))["id"]
    event = (
        await call(
            DOMAIN, "add_event", {"kind": "photo", "zone_id": orto}, blocking=True, return_response=True
        )
    )["id"]
    client = await hass_client()
    form = aiohttp.FormData()
    form.add_field("event_id", event)
    form.add_field("file", jpeg, filename="IMG.jpg", content_type="image/jpeg")
    form.add_field("thumb", thumb, filename="t.jpg", content_type="image/jpeg")
    photo_id = (await (await client.post("/api/homestead/photo/upload", data=form)).json())["id"]
    photo = entry.runtime_data.data.photos[photo_id]

    response = await client.get("/api/homestead/backup.zip")
    assert response.status == 200 and response.headers["Content-Type"] == "application/zip"
    content = await response.read()
    with zipfile.ZipFile(io.BytesIO(content)) as archive:
        assert archive.read(f"photos/nas/{photo.file}") == jpeg
        assert archive.read(f"photos/nas/{photo.thumb}") == thumb
        assert "backup.json" in archive.namelist()

    # A new Home Assistant without the NAS: the photos come back into the local media folder.
    shutil.rmtree(tmp_path / "nas")
    hass.config.media_dirs = {"local": str(tmp_path / "local")}
    entry.runtime_data.data.photos.clear()
    form = aiohttp.FormData()
    form.add_field("file", content, filename="backup.zip", content_type="application/zip")
    response = await client.post("/api/homestead/backup/import", data=form)
    assert response.status == 200, await response.text()
    assert (await response.json())["photos"] == 1
    restored = entry.runtime_data.data.photos[photo_id]
    assert restored.root is None
    assert (photo_dir(hass) / restored.file).read_bytes() == jpeg
    assert (photo_dir(hass) / restored.thumb).read_bytes() == thumb
    assert entry.runtime_data.data.zones[orto].name == "Orto"

    form = aiohttp.FormData()
    form.add_field("file", b"not a zip", filename="x.zip")
    response = await client.post("/api/homestead/backup/import", data=form)
    assert response.status == 400


async def test_units_imperial(hass: HomeAssistant) -> None:
    from homeassistant.config_entries import ConfigEntryState
    from homeassistant.util.unit_system import US_CUSTOMARY_SYSTEM

    from custom_components.homestead.const import CONF_HEAT_MAX, CONF_UNITS
    from custom_components.homestead.forecast import alert_text
    from custom_components.homestead.units import IMPERIAL, METRIC, resolve_units

    entry = MockConfigEntry(domain=DOMAIN, title="HA Homestead", options={CONF_HEAT_MAX: 35})
    entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    assert resolve_units(hass, {}) == METRIC
    assert resolve_units(hass, {CONF_UNITS: IMPERIAL}) == IMPERIAL
    hass.config.units = US_CUSTOMARY_SYSTEM
    assert resolve_units(hass, {}) == IMPERIAL
    assert resolve_units(hass, {CONF_UNITS: METRIC}) == METRIC

    texts = {"alert_frost": "❄️ Frost {when}: {value} °C — {plants}"}
    alert = {"kind": "frost", "start": "2026-11-10", "end": "2026-11-10", "value": -3, "plantings": []}
    assert alert_text(alert, texts, entry.runtime_data, IMPERIAL) == "❄️ Frost 10/11: 27 °F"
    assert alert_text(alert, texts, entry.runtime_data, METRIC) == "❄️ Frost 10/11: -3 °C"

    # The options show the heat limits in °F and store them in °C.
    result = await hass.config_entries.options.async_init(entry.entry_id)
    schema = {str(k): k for k in result["data_schema"].schema}
    assert schema[CONF_HEAT_MAX].description["suggested_value"] == 95
    result = await hass.config_entries.options.async_configure(
        result["flow_id"], {CONF_UNITS: "auto", CONF_HEAT_MAX: 100}
    )
    await hass.async_block_till_done()
    assert entry.options[CONF_HEAT_MAX] == 38
    assert entry.state is ConfigEntryState.LOADED
