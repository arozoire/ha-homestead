"""Species search and import across the open data sources (no Home Assistant dependency)."""

from __future__ import annotations

import asyncio
import logging
from dataclasses import asdict
from typing import Any

import aiohttp

from .models import HomesteadData, Taxon
from .sources import Candidate, TaxonDetails, gbif, wikidata

_LOGGER = logging.getLogger(__name__)

# Wikidata first: better common names; GBIF then fills family, genus and its own names.
SOURCES = (wikidata, gbif)

# Searches like "melo" also hit worms and insects (Meloidogyne, Meloe): keep only plants.
KINGDOMS = {"Plantae"}


class SourcesUnavailable(Exception):
    """No source answered (offline, blocked or down)."""


def _key(candidate: Candidate | Taxon) -> str:
    return f"gbif:{candidate.gbif_key}" if candidate.gbif_key else f"name:{candidate.scientific_name.lower()}"


async def search_remote(
    session: aiohttp.ClientSession, query: str, language: str, limit: int = 10
) -> tuple[list[Candidate], bool]:
    """Return (candidates, complete); incomplete answers must not be cached."""
    results = await asyncio.gather(
        *(source.search(session, query, language, limit) for source in SOURCES), return_exceptions=True
    )
    merged: dict[str, Candidate] = {}
    failures = 0
    for source, result in zip(SOURCES, results, strict=True):
        if isinstance(result, BaseException):
            _LOGGER.debug("Species search on %s failed: %s", source.NAME, result)
            failures += 1
            continue
        for candidate in result:
            existing = merged.get(_key(candidate))
            if existing is None:
                merged[_key(candidate)] = candidate
                continue
            for name, value in asdict(candidate).items():
                if getattr(existing, name) is None:
                    setattr(existing, name, value)
    if failures == len(SOURCES):
        raise SourcesUnavailable
    plants, unchecked = await _only_plants(session, list(merged.values()))
    if not plants and unchecked:
        raise SourcesUnavailable
    return plants[:limit], not failures and not unchecked


async def _only_plants(
    session: aiohttp.ClientSession, candidates: list[Candidate]
) -> tuple[list[Candidate], int]:
    """Wikidata results carry no kingdom: ask GBIF by key; without a GBIF key a taxon can't be checked."""
    unknown = [c for c in candidates if c.kingdom is None and c.gbif_key]
    found = await asyncio.gather(
        *(gbif.kingdom(session, c.gbif_key) for c in unknown), return_exceptions=True
    )
    unchecked = 0
    for candidate, result in zip(unknown, found, strict=True):
        if isinstance(result, BaseException):
            _LOGGER.debug("GBIF kingdom check for %s failed: %s", candidate.gbif_key, result)
            unchecked += 1
        elif isinstance(result, str):
            candidate.kingdom = result
    return [c for c in candidates if c.kingdom in KINGDOMS], unchecked


def search_local(data: HomesteadData, query: str, language: str) -> list[dict[str, Any]]:
    needle = query.casefold().strip()
    found = []
    for taxon in data.taxa.values():
        names = [taxon.scientific_name, *taxon.common_names.values()]
        if any(needle in name.casefold() for name in names):
            found.append(
                {
                    "source": "local",
                    "taxon_id": taxon.id,
                    "scientific_name": taxon.scientific_name,
                    "common_name": taxon.common_names.get(language),
                    "family": taxon.family,
                    "rank": taxon.rank,
                    "gbif_key": taxon.gbif_key,
                    "wikidata_id": taxon.wikidata_id,
                }
            )
    return sorted(found, key=lambda item: item["scientific_name"])


def combine(local: list[dict[str, Any]], remote: list[Candidate]) -> list[dict[str, Any]]:
    """Local taxa first; remote candidates already imported are dropped."""
    known = {item["gbif_key"] for item in local if item["gbif_key"]}
    known |= {item["wikidata_id"] for item in local if item["wikidata_id"]}
    names = {item["scientific_name"].lower() for item in local}
    extra = [
        asdict(c)
        for c in remote
        if c.gbif_key not in known and c.wikidata_id not in known and c.scientific_name.lower() not in names
    ]
    return local + extra


async def fetch_details(
    session: aiohttp.ClientSession, gbif_key: int | None, wikidata_id: str | None, languages: list[str]
) -> TaxonDetails:
    ref = TaxonDetails(gbif_key=gbif_key, wikidata_id=wikidata_id)
    result = TaxonDetails()
    answered = False
    for source in SOURCES:
        try:
            found = await source.details(session, ref, languages)
        except (aiohttp.ClientError, TimeoutError, ValueError, KeyError) as err:
            _LOGGER.debug("Species details on %s failed: %s", source.NAME, err)
            continue
        answered = True
        result.merge(found)
        ref.merge(found)
    if not answered or result.scientific_name is None:
        raise SourcesUnavailable
    return result


def upsert_taxon(data: HomesteadData, details: TaxonDetails, today: str) -> Taxon:
    """Store a taxon, reusing the one already imported with the same ids or name."""
    taxon = data.find_taxon(details.gbif_key, details.wikidata_id, details.scientific_name)
    values = {k: v for k, v in asdict(details).items() if v not in (None, {})}
    if taxon is None:
        taxon = Taxon(**values, imported_on=today)
    else:
        values["common_names"] = {**taxon.common_names, **details.common_names}
        for name, value in values.items():
            setattr(taxon, name, value)
        taxon.imported_on = today
    data.taxa[taxon.id] = taxon
    return taxon
