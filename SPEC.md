# HA Homestead — Specifiche (bozza v0.1)

> Nome provvisorio. Gestore di orto, frutteto e homesteading integrato in Home Assistant.

## 0. Percorso fatto finora

| Passo | Decisione | Perché |
|---|---|---|
| Idea iniziale | Gestore semi + calendario + to-do + spesa + spese + produzione + potature guidate dal meteo | "ERP dell'orto" agganciato ad HA |
| Riuso | Calendario, to-do e lista spesa = entità native HA | Non reinventare ciò che HA ha già |
| Architettura | **Integrazione custom (HACS) + pannello web proprio** | Vedi §2: l'add-on escluderebbe HA Container/Core, contrario all'obiettivo "tutto il mondo" |
| Granularità | Albero singolo; ortaggi per **gruppo** (fila/aiuola); pianta singola possibile ma non obbligatoria | Uso reale dell'autore |
| Mappa | Disegnata con strumento esterno (Google My Maps, IA…), **importata** come GeoJSON/KML | Non costruire un editor di mappe |
| Dati colturali | Da fonti **open**, mai inseriti a mano dall'autore | Impossibile mantenere un DB da soli |
| Meteo | Stazione locale + umidità suolo + provider previsioni (già in HA) | Regole da definire progressivamente |
| Luna | Non è una regola: è un **dato registrato** su ogni evento | Correlazioni analizzabili a posteriori, utile ad altri utenti |
| Economia | Bilancio mensile/annuale centrato sulle **spese**; ricavi opzionali | I guadagni sono difficili da valorizzare |
| Utenti | v1 mono-utente, design pronto per multi-utente/pubblicazione | Ambizione futura |
| Formato mappa | Import **KML + GeoJSON**; in più posizionamento a clic nel pannello | L'autore non conosce i tool di mappa: serve un'alternativa interna |
| Località | Presa dalla configurazione HA (lat/lon, altitudine, fuso) | Nessun inserimento manuale |
| Lingua | v1 in italiano, struttura traduzioni HA pronta per FR/EN | Estendibile |
| Foto | Salvate in HA (`/media/homestead/`) | Incluse nel backup HA |
| Nome | "HA Homestead" | Confermato |

## 1. Obiettivo

Registrare tutto ciò che vive nel giardino (alberi, gruppi di ortaggi, bulbi, semi), cosa costa, con quali attrezzi si lavora, e — in fasi successive — suggerire **quando** agire (potare, seminare, trattare) incrociando dati colturali open e sensori HA.

## 2. Architettura

### Confronto

| | Integrazione custom | Add-on + web app | **Integrazione + pannello (scelta)** |
|---|---|---|---|
| Installazione | HACS | Solo HA OS / Supervised | HACS |
| Funziona su HA Container/Core | Sì | **No** | Sì |
| Entità/servizi HA nativi | Sì | Via API, indiretto | Sì |
| UI ricca (mappa, form, tabelle) | Solo card Lovelace | Libera | Pannello in sidebar (JS) |
| Database | `.storage` HA o SQLite | Libero (Postgres…) | `.storage` → SQLite se serve |
| Backup | Incluso nel backup HA | Incluso (add-on) | Incluso |
| Complessità | Media | Alta (Docker, ingress, auth) | Media-alta |
| Esempio noto | — | Grocy add-on | HACS stesso |

### Componenti

- Località: `hass.config` (latitudine, longitudine, altitudine, fuso). Zona climatica e date medie di gelo derivate dalle coordinate (es. storico Open-Meteo), con possibilità di correzione.
- `custom_components/homestead/` — Python: modello dati, storage, entità, servizi, regole.
- Pannello frontend (sidebar "Giardino") — JS/Lit, servito dall'integrazione: mappa (Leaflet), schede pianta, inventario.
- Adattatori fonti dati (§5) — moduli separati, sostituibili.

## 3. Scope v1 (MVP)

1. **Censimento piante** con caratteristiche importate da DB open.
2. **Posizionamento su mappa** (import GeoJSON/KML).
3. **Costi** di acquisto per pianta.
4. **Inventario attrezzi**.

Fuori v1: calendario semine, regole meteo, produzione, lista spesa, inventario semi, multi-utente.

## 4. Modello dati v1

### Specie / Varietà (`taxon`)
| Campo | Note |
|---|---|
| id, nome scientifico, nome comune (multilingua) | da fonte open |
| varietà / cultivar | libero se non in DB |
| tipo | albero da frutto, arbusto, ortaggio, bulbo, fiore, aromatica… |
| caratteristiche | rusticità, esposizione, altezza adulta, periodo fioritura/raccolta, impollinazione… |
| fonte + id esterno + data import | tracciabilità |

### Asset pianta (`planting`)
| Campo | Note |
|---|---|
| id, nome proprio | es. "Melo vicino al pozzo" |
| taxon | riferimento |
| tipo asset | `singolo` (albero) o `gruppo` (fila pomodori, n. piante) |
| quantità | 1 per singolo |
| data messa a dimora | |
| forma all'impianto | seme, talea, radice nuda, vaso, astone 1 anno, 2 anni… |
| altezza/diametro all'impianto | stimati |
| portainnesto | per fruttiferi |
| fornitore | |
| posizione | punto (lat/lon) o poligono, da import mappa |
| stato | attivo, morto, rimosso (con data) |
| foto, note | |
| fase lunare | calcolata automaticamente alla data (solo registrazione) |

### Spesa (`expense`)
| Campo | Note |
|---|---|
| data, importo, valuta, fornitore | |
| categoria | piante, semi, attrezzi, concimi, trattamenti, acqua, altro |
| collegamento | opzionale: a planting o tool |
| allegato | scontrino/fattura |

### Attrezzo (`tool`)
| Campo | Note |
|---|---|
| nome, categoria | potatura, taglio, scavo, irrigazione, motorizzato… |
| marca/modello, data acquisto, prezzo (→ expense) | |
| stato | ok, da manutenere, rotto |
| manutenzione | ultima/prossima (affilatura, tagliando) |
| alimentazione | manuale, batteria, benzina, elettrico |

Utile in seguito: un'attività richiede attrezzi → "per potare il melo ti serve il seghetto, che è da affilare".

## 5. Fonti dati colturali (da validare)

| Fonte | Contenuto | Licenza/stato | Uso previsto |
|---|---|---|---|
| Wikidata / GBIF | Tassonomia, nomi multilingua | Open (CC0/CC-BY) | Identità specie |
| OpenFarm (dump) | Guide colturali | Servizio chiuso, dati scaricabili | Da verificare qualità |
| CropGraph | Calendari colturali, finestre da gelo, 6 tipi di clima | Libreria open (TypeScript) | Candidato principale per calendari |
| Wind River Greens dataset | Calendari per varietà × zona, consociazioni | Dataset su Hugging Face, licenza da verificare | Calendari, consociazioni |
| Edible Plant Database (GROW, EU) | Piante adatte per clima in Europa | Progetto UE | Contesto europeo |
| OpenPlantbook | Soglie sensori (umidità, luce) | Gratuito con API key | Già usato da HA |

Principio: **adattatori** per fonte + cache locale + possibilità di correzione utente; le correzioni potranno in futuro diventare contributi comunitari (repo YAML condiviso).

## 6. Integrazione con HA

| Elemento | Come |
|---|---|
| Ogni albero | **Device** HA con entità (età, giorni dall'ultima potatura, prossima azione) |
| Mappa | Attributi lat/lon → visibile anche nella card mappa nativa |
| To-do | Entità `todo.giardino` (v2) |
| Calendario | Entità `calendar.giardino` (v2) |
| Lista spesa | Riuso `todo.shopping_list` (v3) |
| Sensori meteo/suolo | Selezionati in config flow, usati dal motore regole (v3) |
| Servizi | `homestead.add_planting`, `homestead.log_event`, `homestead.add_expense`… |

## 7. Roadmap

| Versione | Contenuto |
|---|---|
| v1 | Piante + import tassonomia/caratteristiche, mappa importata, spese, attrezzi |
| v2 | Diario eventi (potatura, trattamento, concimazione), to-do e calendario HA, bilancio mensile/annuale |
| v3 | Inventario semi (lotti, germinabilità per età), calendario semine da fonti open, lista spesa |
| v4 | Motore regole meteo ("si può potare?"), registro produzione (kg/pezzi) |
| v5 | Analisi pluriennali (rese, correlazioni incl. luna), multi-utente, pubblicazione HACS |

## 8. Mappa — come ottenerla

| Metodo | Strumento | Note |
|---|---|---|
| A | Clic sulla mappa satellitare nel pannello | Il più semplice, nessun tool esterno |
| B | [Google My Maps](https://www.google.com/mymaps) → esporta KML | Gratuito, account Google, vista satellite |
| C | [geojson.io](https://geojson.io) → esporta GeoJSON | Open source, senza account |

Ogni punto/poligono importato viene abbinato a una pianta (per nome o manualmente).

## 9. Domande aperte

1. Ricavi: valorizzare la produzione a prezzo di mercato (opzionale) o solo quantità?
2. Gruppi di ortaggi: la stessa aiuola cambia coltura ogni stagione → gestire rotazioni dalla v3?
3. Attrezzi condivisi/prestati: da tracciare?
