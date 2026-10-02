# CLAUDE.md — HA Homestead

Integrazione custom Home Assistant (HACS) per orto, frutteto e homesteading. Specifiche complete in `SPEC.md`: leggerle prima di ogni nuova funzione.

## Principio guida
**Non sporcare HA**: nessuna area/piano/etichetta creata, poche entità aggregate (device per pianta solo opt-in), rimozione pulita (`async_remove_entry` cancella lo storage).

## Architettura
- `custom_components/homestead/models.py` — dataclass pure, **nessun import HA** (testabili da sole). Valori enum in inglese, testi in `translations/`.
- `store.py` — persistenza JSON in `.storage/homestead.data`, segnale dispatcher a ogni salvataggio.
- `services.py` — servizi registrati in `async_setup`, rispondono con l'id creato.
- `sensor.py` — 3 sensori aggregati.
- Lingua UI: italiano (v1), inglese di base; `strings.json` = inglese, `translations/it.json` = italiano. Aggiornarli insieme.

## Comandi
```bash
pip install -r requirements_test.txt ruff   # Python 3.13
ruff check custom_components tests && ruff format --check custom_components tests
pytest
```

## Stato e prossimi passi
- v0.1 fatta: zone, piante (con fase lunare all'impianto), spese, attrezzi, export, 3 sensori, 8 test.
- Prossimo: **pannello in sidebar** (JS/Lit servito dall'integrazione) con mappa satellitare (Leaflet, tile non Google) per posizionare le piante a clic; import KML/GeoJSON.
- Poi: import specie da Wikidata/GBIF (adattatori sostituibili, cache locale).

## Preferenze dell'autore
- Risposte brevi, tabelle quando bastano, in italiano.
- Soluzioni open source/self-hosted, niente servizi con pubblicità.
