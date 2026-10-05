import pytest
from homeassistant.core import HomeAssistant
from homeassistant.exceptions import ServiceValidationError
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.homestead.const import DOMAIN
from custom_components.homestead.models import HomesteadData
from custom_components.homestead.sources import TaxonDetails, gbif, wikidata
from custom_components.homestead.species import upsert_taxon

WIKIDATA = wikidata.API
GBIF = gbif.API

APPLE_ENTITY = {
    "id": "Q18674606",
    "labels": {
        "it": {"language": "it", "value": "melo"},
        "en": {"language": "en", "value": "apple"},
        "fr": {"language": "fr", "value": "pommier domestique"},
    },
    "descriptions": {"it": {"language": "it", "value": "specie di pianta"}},
    "claims": {
        "P225": [{"mainsnak": {"datavalue": {"value": "Malus domestica", "type": "string"}}}],
        "P846": [{"mainsnak": {"datavalue": {"value": "3001509", "type": "string"}}}],
        "P105": [{"mainsnak": {"datavalue": {"value": {"entity-type": "item", "id": "Q7432"}}}}],
    },
}
CITY_ENTITY = {"id": "Q999", "labels": {"it": {"value": "Melo"}}, "claims": {}}

GBIF_USAGE = {
    "key": 3001509,
    "scientificName": "Malus domestica Borkh.",
    "canonicalName": "Malus domestica",
    "rank": "SPECIES",
    "taxonomicStatus": "ACCEPTED",
    "family": "Rosaceae",
    "genus": "Malus",
    "kingdom": "Plantae",
}
WORM_ENTITY = {
    "id": "Q1",
    "labels": {"it": {"value": "Meloidogyne incognita"}},
    "claims": {
        "P225": [{"mainsnak": {"datavalue": {"value": "Meloidogyne incognita"}}}],
        "P846": [{"mainsnak": {"datavalue": {"value": "2283"}}}],
    },
}
GBIF_NAMES = {
    "results": [
        {"vernacularName": "Apfelbaum", "language": "deu"},
        {"vernacularName": "Melo", "language": "ita"},
        {"vernacularName": "Pommier", "language": "fra"},
    ]
}


def test_parse_wikidata_entity():
    taxon = wikidata.parse_entity(APPLE_ENTITY, ["it", "en"])
    assert taxon.scientific_name == "Malus domestica"
    assert taxon.common_names == {"it": "melo", "en": "apple"}
    assert (taxon.rank, taxon.gbif_key, taxon.wikidata_id) == ("species", 3001509, "Q18674606")
    assert wikidata.parse_entity(CITY_ENTITY, ["it"]) is None


def test_parse_gbif():
    assert gbif.vernacular_names(GBIF_NAMES["results"]) == {"de": "Apfelbaum", "it": "Melo", "fr": "Pommier"}
    candidate = gbif.parse_usage(
        {**GBIF_USAGE, "vernacularNames": [{"vernacularName": "melo", "language": "ita"}]}, "it"
    )
    assert (candidate.scientific_name, candidate.common_name, candidate.family) == (
        "Malus domestica",
        "melo",
        "Rosaceae",
    )
    assert gbif.parse_usage({"rank": "SPECIES"}) is None


def test_upsert_reuses_existing_taxon():
    data = HomesteadData()
    first = upsert_taxon(
        data,
        TaxonDetails(scientific_name="Malus domestica", gbif_key=1, common_names={"it": "melo"}),
        "2026-01-01",
    )
    second = upsert_taxon(
        data,
        TaxonDetails(scientific_name="Malus domestica", wikidata_id="Q1", common_names={"en": "apple"}),
        "2026-02-01",
    )
    assert first.id == second.id and len(data.taxa) == 1
    assert second.common_names == {"it": "melo", "en": "apple"}
    assert (second.gbif_key, second.wikidata_id, second.imported_on) == (1, "Q1", "2026-02-01")


async def _setup(hass: HomeAssistant) -> MockConfigEntry:
    hass.config.language = "it"
    entry = MockConfigEntry(domain=DOMAIN, title="HA Homestead")
    entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    return entry


def _mock_sources(aioclient_mock) -> None:
    aioclient_mock.get(
        WIKIDATA,
        params={"action": "wbsearchentities"},
        json={"search": [{"id": "Q18674606"}, {"id": "Q999"}, {"id": "Q1"}]},
    )
    aioclient_mock.get(
        WIKIDATA,
        params={"action": "wbgetentities"},
        json={"entities": {"Q18674606": APPLE_ENTITY, "Q999": CITY_ENTITY, "Q1": WORM_ENTITY}},
    )
    aioclient_mock.get(f"{GBIF}/species/suggest", json=[{**GBIF_USAGE, "status": "ACCEPTED"}])
    aioclient_mock.get(f"{GBIF}/species/search", json={"results": []})
    aioclient_mock.get(
        WIKIDATA, params={"action": "query"}, json={"query": {"search": [{"title": "Q18674606"}]}}
    )
    aioclient_mock.get(f"{GBIF}/species/3001509/vernacularNames", json=GBIF_NAMES)
    aioclient_mock.get(f"{GBIF}/species/3001509", json=GBIF_USAGE)
    aioclient_mock.get(f"{GBIF}/species/2283", json={"key": 2283, "kingdom": "Animalia"})


async def test_search_import_and_link(hass: HomeAssistant, hass_ws_client, aioclient_mock) -> None:
    entry = await _setup(hass)
    _mock_sources(aioclient_mock)
    ws = await hass_ws_client(hass)

    await ws.send_json({"id": 1, "type": "homestead/species/search", "query": "melo"})
    result = (await ws.receive_json())["result"]
    assert result["offline"] is False
    [apple] = result["results"]
    assert (apple["scientific_name"], apple["common_name"], apple["family"]) == (
        "Malus domestica",
        "melo",
        "Rosaceae",
    )
    assert (apple["gbif_key"], apple["wikidata_id"]) == (3001509, "Q18674606")

    response = await hass.services.async_call(
        DOMAIN, "import_taxon", {"wikidata_id": "Q18674606"}, blocking=True, return_response=True
    )
    taxon = entry.runtime_data.data.taxa[response["id"]]
    assert (taxon.family, taxon.genus, taxon.gbif_key) == ("Rosaceae", "Malus", 3001509)
    assert taxon.common_names["it"] == "melo" and taxon.common_names["fr"] == "pommier domestique"

    again = await hass.services.async_call(
        DOMAIN, "import_taxon", {"gbif_key": 3001509}, blocking=True, return_response=True
    )
    assert again["id"] == taxon.id

    planting = await hass.services.async_call(
        DOMAIN, "add_planting", {"name": "Melo", "taxon_id": taxon.id}, blocking=True, return_response=True
    )
    assert entry.runtime_data.data.plantings[planting["id"]].species == "Malus domestica"

    calls = aioclient_mock.call_count
    await ws.send_json({"id": 2, "type": "homestead/species/search", "query": "mel"})
    local = (await ws.receive_json())["result"]["results"]
    assert local[0]["source"] == "local" and local[0]["taxon_id"] == taxon.id
    assert all(item["source"] == "local" for item in local)
    await ws.send_json({"id": 3, "type": "homestead/species/search", "query": "melo"})
    await ws.receive_json()
    assert aioclient_mock.call_count == calls + 5  # "mel": 4 searches + 1 kingdom check; "melo" was cached


async def test_offline(hass: HomeAssistant, hass_ws_client, aioclient_mock) -> None:
    await _setup(hass)
    aioclient_mock.get(WIKIDATA, status=503)
    aioclient_mock.get(f"{GBIF}/species/suggest", exc=TimeoutError)
    aioclient_mock.get(f"{GBIF}/species/1", status=503)
    ws = await hass_ws_client(hass)
    await ws.send_json({"id": 1, "type": "homestead/species/search", "query": "melo"})
    assert (await ws.receive_json())["result"] == {"results": [], "offline": True}
    with pytest.raises(ServiceValidationError):
        await hass.services.async_call(DOMAIN, "import_taxon", {"gbif_key": 1}, blocking=True)


async def test_species_or_taxon_required(hass: HomeAssistant) -> None:
    entry = await _setup(hass)
    with pytest.raises(ServiceValidationError):
        await hass.services.async_call(DOMAIN, "add_planting", {"name": "?"}, blocking=True)
    response = await hass.services.async_call(
        DOMAIN, "add_planting", {"name": "Pero", "species": "pero"}, blocking=True, return_response=True
    )
    planting_id = response["id"]
    await hass.services.async_call(
        DOMAIN, "update_planting", {"id": planting_id, "taxon_id": None}, blocking=True
    )
    assert entry.runtime_data.data.plantings[planting_id].species == "pero"
    with pytest.raises(ServiceValidationError):
        await hass.services.async_call(
            DOMAIN, "update_planting", {"id": planting_id, "taxon_id": "nope"}, blocking=True
        )


async def test_failed_kingdom_check_is_not_cached(
    hass: HomeAssistant, hass_ws_client, aioclient_mock
) -> None:
    await _setup(hass)
    aioclient_mock.get(WIKIDATA, params={"action": "wbsearchentities"}, json={"search": [{"id": "Q1"}]})
    aioclient_mock.get(WIKIDATA, params={"action": "wbgetentities"}, json={"entities": {"Q1": WORM_ENTITY}})
    aioclient_mock.get(f"{GBIF}/species/suggest", json=[])
    aioclient_mock.get(f"{GBIF}/species/search", json={"results": []})
    aioclient_mock.get(f"{GBIF}/species/2283", status=503)
    ws = await hass_ws_client(hass)
    for msg_id in (1, 2):
        await ws.send_json({"id": msg_id, "type": "homestead/species/search", "query": "meloidogyne"})
        assert (await ws.receive_json())["result"] == {"results": [], "offline": True}
    assert aioclient_mock.call_count == 10  # both searches went to the network
