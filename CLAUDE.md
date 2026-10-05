# CLAUDE.md — HA Homestead

Integrazione custom Home Assistant (HACS) per orto, frutteto e homesteading. Specifiche complete in `SPEC.md`: leggerle prima di ogni nuova funzione.

## Principio guida
**Non sporcare HA**: nessuna area/piano/etichetta creata, poche entità aggregate (device per pianta solo opt-in), rimozione pulita (`async_remove_entry` cancella lo storage).

## Architettura
- `custom_components/homestead/models.py` — dataclass pure, **nessun import HA** (testabili da sole). Valori enum in inglese, testi in `translations/`.
- `store.py` — persistenza JSON in `.storage/homestead.data`, segnale dispatcher a ogni salvataggio.
- `services.py` — servizi registrati in `async_setup`, rispondono con l'id creato.
- `sensor.py` — 3 sensori aggregati.
- `photos.py` — file in `<media local>/homestead/<planting_id>/<id>.jpg`; `PhotoView` `/api/homestead/photo/{id}` (auth; il pannello usa `auth/sign_path` per `<img>`); tipo controllato dalla firma (JPEG/PNG/WebP, max 3 MB); cartella cancellata in `async_remove_entry`.
- `panel.py` — registra il pannello sidebar (`/homestead`) e serve `frontend/` su `/homestead_static`.
- `geo.py` — puro (no HA): area poligoni (sferica), validazione Polygon. Geometrie GeoJSON `[lon, lat]`.
- `backup.py` — puro: `make_backup`/`read_backup` (formato `ha-homestead-backup` v1, campi obbligatori, id duplicati, poligoni, riferimenti orfani azzerati).
- `sources/` — adattatori fonti specie (puri, solo aiohttp): `gbif.py`, `wikidata.py`; stessa interfaccia `search`/`details`. `species.py` li combina (Wikidata prima per i nomi comuni, GBIF per famiglia/genere), cerca anche nelle specie locali, `upsert_taxon` evita doppioni.
- `websocket_api.py` — `homestead/species/search` (locali + remote, cache 24 h in memoria, `offline` se le fonti non rispondono), `homestead/subscribe` (dati a ogni salvataggio), `homestead/backup/export`, `homestead/backup/import` (solo admin, sostituisce tutto), `homestead/photo/upload` (base64, il pannello riduce a 1600 px).
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
- v0.4 fatta: `Taxon` (specie importate in `.storage`, nessuna entità), `Planting.taxon_id`, servizio `import_taxon`, ricerca specie nel pannello; 30 test (HTTP simulato con `aioclient_mock`).
- v0.4.1 (dopo la prima prova dal vivo): altezza pannello su `100dvh` (HA non dà altezza definita: mappa schiacciata, invisibile nell'app); ricerca specie solo regno Plantae (Wikidata verificato via chiave GBIF); dopo Salva/Elimina si torna alla lista con conferma.
- v0.4.1 (include anche le correzioni sopra): import KML/KMZ/GeoJSON **tolto** (decisione dell'autore: si disegna nel pannello); backup JSON esporta/ripristina; ricerca specie non mette in cache risposte incomplete; `Planting.origin` (existing/planted/sown) + `sown_on` (+ `sown_moon_phase`) + `birth_year` (età calcolata); 39 test.
- v0.4.2 (fine V1): schede Spese e Attrezzi nel pannello (`update/delete_expense`, `update/delete_tool`), foto delle piante (`Photo`, `delete_photo`, foto cancellate con la pianta), sfondo "Nessuna mappa" (zoom 23); 43 test.
- Prossimo: **diario eventi** (sezione nella scheda pianta/zona + scheda Diario; evento su zona vale per tutte le sue piante), poi tipo di pianta (icone), to-do/calendario HA.
- Rete della sessione cloud: `api.gbif.org` e `www.wikidata.org` bloccati, parsing scritto sui formati documentati → da verificare dal vivo.
- Più avanti: caratteristiche colturali (rusticità, esposizione, fioritura/raccolta) da fonti §5.
- Prova del pannello: harness Playwright con `hass` finto (non nel repo); in CI solo i test Python.

## Preferenze dell'autore
- Risposte brevi, tabelle quando bastano, in italiano.
- Soluzioni open source/self-hosted, niente servizi con pubblicità.
