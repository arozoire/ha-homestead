# CLAUDE.md — HA Homestead

Integrazione custom Home Assistant (HACS) per orto, frutteto e homesteading. Specifiche complete in `SPEC.md`: leggerle prima di ogni nuova funzione.

## Principio guida
**Non sporcare HA**: nessuna area/piano/etichetta creata, poche entità aggregate (device per pianta solo opt-in), rimozione pulita (`async_remove_entry` cancella lo storage).

## Architettura
- `custom_components/homestead/models.py` — dataclass pure, **nessun import HA** (testabili da sole). Valori enum in inglese, testi in `translations/`.
- `store.py` — persistenza JSON in `.storage/homestead.data`, segnale dispatcher a ogni salvataggio.
- `services.py` — servizi registrati in `async_setup`, rispondono con l'id creato.
- `sensor.py` — 3 sensori aggregati.
- `panel.py` — registra il pannello sidebar (`/homestead`) e serve `frontend/` su `/homestead_static`.
- `geo.py` — puro (no HA): area poligoni (sferica), validazione Polygon, parsing KML/KMZ/GeoJSON. Geometrie GeoJSON `[lon, lat]`.
- `websocket_api.py` — `homestead/subscribe` (dati a ogni salvataggio), `homestead/parse_map` (file base64 → punti e poligoni; l'abbinamento lo fa il pannello).
- `frontend/homestead-panel.js` — web component **vanilla** (niente Lit, niente build); Leaflet ESM minificato in `frontend/vendor/`. Testi del pannello nel dizionario `TEXT` del JS (it/en). Scritture tramite servizi (`call_service` con `return_response`).
- Lingua UI: italiano (v1), inglese di base; `strings.json` = inglese, `translations/it.json` = italiano. Aggiornarli insieme.

## Comandi
```bash
pip install -r requirements_test.txt ruff   # Python 3.13
ruff check custom_components tests && ruff format --check custom_components tests
pytest
```

## Stato e prossimi passi
- v0.1 fatta: zone, piante (con fase lunare all'impianto), spese, attrezzi, export, 3 sensori, 8 test.
- v0.2 fatta: pannello "Giardino" con mappa satellitare Esri + OSM, crea/posiziona/trascina/modifica/elimina piante; servizi `update_planting`, `delete_planting`; 12 test.
- v0.3 fatta: zone con poligono (disegno a clic, superficie, gerarchia, `update_zone`/`delete_zone`), import KML/KMZ/GeoJSON con abbinamento per nome, zona proposta in automatico; licenza MIT; 23 test.
- Prova del pannello: harness Playwright con `hass` finto (non nel repo); in CI solo i test Python.
- Poi: import specie da Wikidata/GBIF (adattatori sostituibili, cache locale).

## Preferenze dell'autore
- Risposte brevi, tabelle quando bastano, in italiano.
- Soluzioni open source/self-hosted, niente servizi con pubblicità.
