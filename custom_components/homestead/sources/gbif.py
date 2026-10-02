"""GBIF species API (https://techdocs.gbif.org/en/openapi/v1/species), backbone taxonomy."""

from __future__ import annotations

from typing import Any

import aiohttp

from . import TIMEOUT_S, USER_AGENT, Candidate, TaxonDetails

NAME = "gbif"
API = "https://api.gbif.org/v1"
BACKBONE = "d7dddbf4-2cf0-4f39-9b2a-bb099caae36c"

# GBIF uses ISO 639-2 codes for vernacular names.
LANGUAGES = {
    "ita": "it", "fra": "fr", "eng": "en", "deu": "de", "spa": "es", "por": "pt", "nld": "nl",
    "pol": "pl", "ces": "cs", "swe": "sv", "dan": "da", "nor": "nb", "nob": "nb", "fin": "fi",
    "hun": "hu", "ron": "ro", "ell": "el", "rus": "ru", "cat": "ca", "slv": "sl", "hrv": "hr",
    "tur": "tr", "jpn": "ja", "zho": "zh", "ukr": "uk", "slk": "sk", "bul": "bg", "srp": "sr",
}  # fmt: skip


async def _get(session: aiohttp.ClientSession, path: str, params: dict[str, Any]) -> Any:
    async with session.get(
        f"{API}{path}",
        params=params,
        headers={"User-Agent": USER_AGENT},
        timeout=aiohttp.ClientTimeout(total=TIMEOUT_S),
    ) as response:
        response.raise_for_status()
        return await response.json()


def language_code(code: str | None) -> str | None:
    if not code:
        return None
    code = code.lower()
    return code if len(code) == 2 else LANGUAGES.get(code)


def vernacular_names(items: list[dict[str, Any]]) -> dict[str, str]:
    names: dict[str, str] = {}
    for item in items:
        lang = language_code(item.get("language"))
        value = (item.get("vernacularName") or "").strip()
        if lang and value:
            names.setdefault(lang, value)
    return names


def parse_usage(item: dict[str, Any], language: str | None = None) -> Candidate | None:
    name = item.get("canonicalName") or item.get("scientificName")
    key = item.get("nubKey") or item.get("key")
    if not name or not key:
        return None
    names = vernacular_names(item.get("vernacularNames") or [])
    return Candidate(
        scientific_name=name,
        source=NAME,
        common_name=names.get(language or ""),
        family=item.get("family"),
        rank=(item.get("rank") or "").lower() or None,
        gbif_key=int(key),
    )


async def search(
    session: aiohttp.ClientSession, query: str, language: str, limit: int = 8
) -> list[Candidate]:
    """Scientific names by prefix plus common names in any language."""
    suggest = await _get(session, "/species/suggest", {"q": query, "datasetKey": BACKBONE, "limit": limit})
    vernacular = await _get(
        session,
        "/species/search",
        {"q": query, "qField": "VERNACULAR", "datasetKey": BACKBONE, "status": "ACCEPTED", "limit": limit},
    )
    found: dict[int, Candidate] = {}
    for item in [*(vernacular.get("results") or []), *(suggest or [])]:
        if item.get("taxonomicStatus", item.get("status", "ACCEPTED")) not in ("ACCEPTED", "DOUBTFUL"):
            continue
        candidate = parse_usage(item, language)
        if candidate and candidate.gbif_key not in found:
            found[candidate.gbif_key] = candidate  # type: ignore[index]
    return list(found.values())[:limit]


async def details(
    session: aiohttp.ClientSession, ref: TaxonDetails, languages: list[str]
) -> TaxonDetails | None:
    if ref.gbif_key is None:
        return None
    usage = await _get(session, f"/species/{ref.gbif_key}", {})
    names = await _get(session, f"/species/{ref.gbif_key}/vernacularNames", {"limit": 300})
    common = vernacular_names(names.get("results") or [])
    return TaxonDetails(
        scientific_name=usage.get("canonicalName") or usage.get("scientificName"),
        common_names={lang: common[lang] for lang in languages if lang in common} or common,
        family=usage.get("family"),
        genus=usage.get("genus"),
        rank=(usage.get("rank") or "").lower() or None,
        gbif_key=ref.gbif_key,
    )
