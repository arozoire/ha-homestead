# CLAUDE.md — HA Homestead

Integrazione custom Home Assistant (HACS) per orto, frutteto e homesteading. Specifiche complete in `SPEC.md`: leggerle prima di ogni nuova funzione.

## Principio guida
**Non sporcare HA**: nessuna area/piano/etichetta creata, poche entità aggregate (device per pianta solo opt-in), rimozione pulita (`async_remove_entry` cancella lo storage).

## Architettura
- `custom_components/homestead/models.py` — dataclass pure, **nessun import HA** (testabili da sole). Valori enum in inglese, testi in `translations/`.
- `store.py` — persistenza JSON in `.storage/homestead.data`, segnale dispatcher a ogni salvataggio.
- `services.py` — servizi registrati in `async_setup`, rispondono con l'id creato.
- `sensor.py` — 3 sensori aggregati. `todo.py` (lista attività: spunta → evento nel diario via `tasks.async_complete_task`), `calendar.py` (attività aperte + eventi fatti, giornata intera); `entity.py` device comune; `labels.py` titoli dalle traduzioni `selector.event_kind`.
- `weather.py` — snapshot meteo per evento: finestra 7 giorni prima (+3 dopo per treatment/sowing); statistiche a lungo termine del recorder (`mean/min/max`, pioggia con `change`, copertura ≥50%) dai sensori in `entry.options`, campi mancanti da Open-Meteo (archive o forecast se recente); `complete=false` finché la finestra non è chiusa; `async_refresh` ogni 6 h; mai bloccante per i servizi.
- `config_flow.py` — options flow: sensori temperatura, umidità, pioggia, umidità suolo + Open-Meteo sì/no; telefoni (`notify_services`, mobile_app prima) e ora dei promemoria; cambio opzioni → reload.
- `reminders.py` — ogni giorno all'ora scelta: una notifica per attività di oggi (`url`/`clickAction` = `/homestead?task=<id>`, azione `HOMESTEAD_DONE_<id>` → `async_complete_task`) + riepilogo in ritardo; testi in `common` delle traduzioni. Il pannello legge `?task=` e apre l'evento precompilato.
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
- v0.5 (diario, inizio v2): `Event` (kind, done_on, planting_id **o** zone_id, product/dose, quantity/unit, moon_phase); `add/update/delete_event` con `cost`/`revenue` → `Expense` collegata (`event_id`, `income`; categorie `services`, `sales`); sensore spese esclude i ricavi; foto su evento (`Photo.event_id`, cartella `events/` per eventi di zona); eliminando pianta/zona gli eventi seguono (zona → zona padre); pannello: scheda Diario + sezione nelle schede pianta/zona, fase lunare calcolata anche in JS (stesso algoritmo di `moon.py`); 48 test.
- v0.6: annate (righe anno × coltura della stessa specie/taxon), eventi `removal` (pianta → removed) e `review` (rating, abundance, keep, avoid), meteo per evento, `repeat_planting`, `refresh_weather`, + Raccolta rapido; test recorder reale in `tests/test_recorder.py` (fixture riordinata); Open-Meteo simulato in `conftest.py`; 56 test.
- v0.6.1: voci di inizio nel diario ricavate dai dati della pianta (semina, messa a dimora/trapianto, "presente dal ~anno"), non salvate come eventi; mappa più stretta (colonna 440 px, ⅓ su telefono) e pulsante 🗺️ per nasconderla (localStorage).
- v0.7: `Task` (kind, due_on, pianta o zona o nessuna, yearly, title, done_on, event_id); `add/update/delete/complete_task`; `add_event` con `task_id` completa l'attività; annuale → stessa attività l'anno dopo (29/2 → 28/2); pannello "📋 Da fare" (scheda Diario + scheda pianta), ✔ apre evento precompilato; 60 test.
- v0.7.1: promemoria integrati (vedi `reminders.py`), pulsante ⚙️ nel pannello verso le impostazioni; date gg/mm/aaaa secondo "Formato data" del profilo HA (inglese generico → giorno prima); 63 test.
- v0.8 (in corso, una sola release con 4 blocchi):
  1. diario completo — `Planting.plant_type` (icona su mappa e lista, proposto dal tipo di zona), riquadro "negli anni scorsi in questo periodo" (−7/+21 giorni, scheda pianta/zona/Diario), "↩️ l'ultima volta" nel form evento (stessa coltura o zona, anni precedenti), bilancio per anno/mese/pianta nella scheda Spese, eventi di zona `tillage`, `weeding`, `mulching`, `mowing`; 65 test
  2. bosco e legna — zona `woodland` con `Zone.species` (essenze: `[{name, taxon_id}]`, `clean_species` toglie doppioni; backup azzera taxon_id orfani), eventi `clearing`, `wood_cutting` (essenza in `product`), `brushwood`, `foraging`; unità `q`, `stere`, `m3` (proposta l'ultima usata, poi q/stero secondo la lingua); nel form evento i tipi del bosco solo su zone bosco; riquadro legna per anno nella scheda zona; picker specie riusabile (`_speciesPicker`); 67 test
  3. orto — `SeedLot` (collezione `seeds`: species/taxon, variety, year, supplier, quantity testo, viability_years, finished; `add/update/delete_seed_lot`, prezzo → spesa semi), scheda Semi con avviso età (durata per famiglia in `SEED_VIABILITY` del JS, default 3), `Planting.seed_lot_id` (scelto nella semina, riempie la specie); rotazione: consiglio nel form pianta se la stessa famiglia (o specie) è nella stessa zona negli ultimi 3 anni (zone orto/serra o ortaggi), riquadro colture per anno nella scheda zona; 🛒 lista spesa = `todo.add_item` su `todo.shopping_list` (o la prima lista todo non nostra) da semi e prodotti di concimazione/trattamento; 68 test
  4. dati colturali — fonti open non raggiungibili dalla sessione: tabella di base `data/crops.json` (~85 specie, valori indicativi clima temperato, chiave = genere+specie normalizzati, anche voci di solo genere) + correzioni utente `CropProfile` (collezione `crops`, una per specie; `set_crop_profile` sostituisce tutto, `delete_crop_profile` torna alla base); `crops.py` puro (`load_defaults`, `normalize`, `lookup`); ws `homestead/crops/defaults`; pannello: scheda colturale con griglia mesi (stessa normalizzazione in `_cropKey`), form di correzione, *📆 Questo mese* nel Diario, "da seminare ora" nei semi; 70 test
- v0.8.0 rilasciata e provata dal vivo (8/8 ok).
- v0.8.1: `fruit_tree` (🍎, proposto per i frutteti); prezzo e fornitore nella nuova pianta; immagine specie = file Commons da Wikidata P18 (`Candidate.image`, `TaxonDetails.image`, `Taxon.image`; il browser carica `Special:FilePath?width=80`, nascosta se non si carica); import CSV di piante e semi tutto nel pannello (`parseCsv` con separatore indovinato, `parseDate` giorno prima, intestazioni it/en senza accenti, revisione riga per riga con correzione di zona/tipo/origine/date/numeri, doppioni senza spunta, poi `add_planting`/`add_seed_lot` una riga alla volta), modello CSV con `;` e BOM per Excel; 70 test
- v0.8.1 rilasciata; immagini Wikimedia viste dal vivo (piccole).
- v0.8.2: immagine specie cliccabile (`_speciesImage` → lightbox `Special:FilePath?width=1200` + link alla pagina Commons, non seleziona la specie); scegliendo una specie già importata senza immagine il pannello rilancia `import_taxon` in background per recuperarla; 70 test
- v0.8.2 unita (immagine ingrandibile, recupero immagine per specie già importate).
- v0.9 (in corso, una sola release, 4 blocchi):
  1. meteo e allerte — `outlook.py` puro (giorni `{date,t_min,t_max,rain_mm,rain_prob,wind_kmh,gust_kmh,code}`; parsing Open-Meteo e `weather.get_forecasts` con conversione unità; `frost_dates` mediana ultima/prima gelata su anni con dati, giorno dell'anno non bisestile; `extremes` gelo/ondata di calore/caldo estremo/grandine codici 96-99/pioggia ≥40 mm; `alerts` gelo per rusticità pianta, freddo per piante tenere/giovani (<30 gg → soglia ≥0), ondata = `heat_days` giorni con max ≥ `heat_max` **e** min ≥ `heat_night` (default 3, 35, 22; fonti: polline pomodoro ~32-35/22, canicule Météo-France giorno+notte 3 giorni), caldo estremo ≥ 40 in un giorno, `heat_stress` per colture fresche con `heat_max_c` in crops.json); `forecast.py` (`Outlook` in `hass.data`, previsioni da entità meteo scelta poi Open-Meteo 16 gg, storico 10 anni da statistiche giornaliere dei sensori poi Open-Meteo archive, salvato in `.storage/homestead.climate` e ricalcolato ogni 30 gg, refresh ogni 3 h, notifiche `alert_notify` off/tasks/always una sola volta per allerta); sensore `weather_alerts`; ws `homestead/outlook/subscribe` e `/refresh`; riquadro allerte nel Diario; 74 test
- Rete della sessione cloud: `api.gbif.org`, `www.wikidata.org` e Open-Meteo bloccati, parsing scritto sui formati documentati → da verificare dal vivo.
- Più avanti: caratteristiche colturali (rusticità, esposizione, fioritura/raccolta) da fonti §5.
- Prova del pannello: harness Playwright con `hass` finto (non nel repo); in CI solo i test Python.

## Preferenze dell'autore
- Risposte brevi, tabelle quando bastano, in italiano.
- Soluzioni open source/self-hosted, niente servizi con pubblicità.
