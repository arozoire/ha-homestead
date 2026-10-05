"""Open data sources for species (adapters, no Home Assistant dependency).

Each adapter module exposes:
- ``NAME``: short source id
- ``async search(session, query, language, limit) -> list[Candidate]``
- ``async details(session, ref, languages) -> TaxonDetails | None`` where ``ref`` holds the ids it knows

Adding or replacing a source means adding a module and listing it in ``SOURCES``.
"""

from __future__ import annotations

from dataclasses import dataclass, field

USER_AGENT = "HA-Homestead/0.8 (https://github.com/arozoire/ha-homestead)"
TIMEOUT_S = 10


@dataclass
class Candidate:
    scientific_name: str
    source: str
    common_name: str | None = None
    family: str | None = None
    rank: str | None = None
    kingdom: str | None = None
    description: str | None = None
    gbif_key: int | None = None
    wikidata_id: str | None = None
    image: str | None = None  # Wikimedia Commons file name


@dataclass
class TaxonDetails:
    scientific_name: str | None = None
    common_names: dict[str, str] = field(default_factory=dict)
    family: str | None = None
    genus: str | None = None
    rank: str | None = None
    gbif_key: int | None = None
    wikidata_id: str | None = None
    image: str | None = None

    def merge(self, other: TaxonDetails | None) -> None:
        """Fill missing values from ``other``; names already present win."""
        if other is None:
            return
        for name in ("scientific_name", "family", "genus", "rank", "gbif_key", "wikidata_id", "image"):
            if getattr(self, name) is None:
                setattr(self, name, getattr(other, name))
        for lang, value in other.common_names.items():
            self.common_names.setdefault(lang, value)
