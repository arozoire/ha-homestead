"""Wikidata (https://www.wikidata.org/w/api.php): best source for common names in many languages."""

from __future__ import annotations

from typing import Any

import aiohttp

from . import TIMEOUT_S, USER_AGENT, Candidate, TaxonDetails

NAME = "wikidata"
API = "https://www.wikidata.org/w/api.php"

TAXON_NAME = "P225"
GBIF_ID = "P846"
TAXON_RANK = "P105"
RANKS = {
    "Q7432": "species",
    "Q34740": "genus",
    "Q35409": "family",
    "Q4886": "variety",
    "Q4369513": "cultivar",
}


async def _get(session: aiohttp.ClientSession, params: dict[str, Any]) -> Any:
    async with session.get(
        API,
        params={**params, "format": "json"},
        headers={"User-Agent": USER_AGENT},
        timeout=aiohttp.ClientTimeout(total=TIMEOUT_S),
    ) as response:
        response.raise_for_status()
        return await response.json()


def _claim(entity: dict[str, Any], prop: str) -> Any:
    for claim in entity.get("claims", {}).get(prop, []):
        value = claim.get("mainsnak", {}).get("datavalue", {}).get("value")
        if value is not None:
            return value
    return None


def _label(entity: dict[str, Any], field: str, lang: str) -> str | None:
    return (entity.get(field, {}).get(lang) or {}).get("value")


def parse_entity(entity: dict[str, Any], languages: list[str]) -> TaxonDetails | None:
    """A Wikidata item is a taxon only if it has a taxon name (P225)."""
    name = _claim(entity, TAXON_NAME)
    if not isinstance(name, str):
        return None
    gbif = _claim(entity, GBIF_ID)
    rank = _claim(entity, TAXON_RANK)
    common = {lang: label for lang in languages if (label := _label(entity, "labels", lang))}
    return TaxonDetails(
        scientific_name=name,
        common_names={lang: value for lang, value in common.items() if value.lower() != name.lower()},
        rank=RANKS.get(rank.get("id")) if isinstance(rank, dict) else None,
        gbif_key=int(gbif) if isinstance(gbif, str) and gbif.isdigit() else None,
        wikidata_id=entity.get("id"),
    )


async def _entities(session: aiohttp.ClientSession, ids: list[str], languages: list[str]) -> list[dict]:
    if not ids:
        return []
    data = await _get(
        session,
        {
            "action": "wbgetentities",
            "ids": "|".join(ids),
            "props": "labels|descriptions|claims",
            "languages": "|".join(languages),
        },
    )
    entities = data.get("entities") or {}
    return [entities[i] for i in ids if i in entities]


async def search(
    session: aiohttp.ClientSession, query: str, language: str, limit: int = 8
) -> list[Candidate]:
    found = await _get(
        session,
        {
            "action": "wbsearchentities",
            "search": query,
            "language": language,
            "uselang": language,
            "type": "item",
            "limit": limit * 2,
        },
    )
    ids = [item["id"] for item in found.get("search") or [] if item.get("id")]
    candidates = []
    for entity in await _entities(session, ids, [language, "en"]):
        taxon = parse_entity(entity, [language])
        if taxon is None or taxon.scientific_name is None:
            continue
        candidates.append(
            Candidate(
                scientific_name=taxon.scientific_name,
                source=NAME,
                common_name=taxon.common_names.get(language),
                rank=taxon.rank,
                description=_label(entity, "descriptions", language) or _label(entity, "descriptions", "en"),
                gbif_key=taxon.gbif_key,
                wikidata_id=taxon.wikidata_id,
            )
        )
    return candidates[:limit]


async def details(
    session: aiohttp.ClientSession, ref: TaxonDetails, languages: list[str]
) -> TaxonDetails | None:
    wikidata_id = ref.wikidata_id
    if wikidata_id is None and ref.gbif_key is not None:
        found = await _get(
            session,
            {"action": "query", "list": "search", "srsearch": f"haswbstatement:{GBIF_ID}={ref.gbif_key}"},
        )
        hits = found.get("query", {}).get("search") or []
        wikidata_id = hits[0]["title"] if hits else None
    if wikidata_id is None:
        return None
    entities = await _entities(session, [wikidata_id], languages)
    return parse_entity(entities[0], languages) if entities else None
