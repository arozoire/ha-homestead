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
| Raccolto | kg o pezzi + stima € opzionale + **indice di annata** | Serve capire subito se l'anno è buono o "fa pena" |
| Aiuole | Gerarchia di **zone interne** (stile aree HA), **non** aree HA vere | Principio: non sporcare HA |
| Entità HA | Poche entità aggregate di default; device per pianta solo opt-in | Coerente con "non sporcare HA" |
| Attrezzi prestati | Messo nel backlog idee, non pianificato | Buona idea ma non prioritaria |
| Pannello (v0.2) | Web component senza Lit né build, Leaflet incluso, satellite Esri + OSM | Zero dipendenze esterne, niente Google |
| Zone sulla mappa (v0.3) | Poligono disegnato a clic (angolo per angolo); superficie calcolata; zona della pianta proposta se dentro il poligono | Metodo A di §8 esteso alle zone |
| Import (v0.3) | KML, **KMZ** (default di Google My Maps), GeoJSON; punti → piante, poligoni → zone, linee ignorate; abbinamento per nome con scelta manuale | L'autore carica il file dal telefono quando serve |
| Prima prova dal vivo (v0.4.1) | Pannello a tutta altezza (mappa invisibile nell'app), ricerca specie solo piante, conferma dopo Salva | Problemi visti in HA reale |
| Date della pianta (v0.4.1) | Origine + date adatte (età stimata, messa a dimora + età all'impianto, semina + trapianto); salvato l'anno di nascita stimato | Per le piante già presenti la data è ignota; un albero piantato ha già qualche anno; l'orto ha semina e trapianto |
| Fine V1 (v0.4.2) | Spese e attrezzi gestiti nel pannello; foto per pianta; sfondo "Nessuna mappa" per zoomare dentro le zone; icone per tipo rimandate (servono il tipo di pianta e uno zoom alto) | Uso quotidiano senza passare dai servizi HA |
| Diario (UI decisa) | Sezione "Diario" nella scheda pianta/zona + scheda Diario con filtri; un evento sulla zona vale per tutte le sue piante | Prossimo passo (v2) |
| Import mappa **tolto** (v0.4.1) | Al suo posto **backup JSON** (esporta / ripristina tutto) | Disegnare nel pannello basta; serve invece poter salvare e ripristinare i dati |
| Specie (v0.4) | Ricerca combinata Wikidata (nomi comuni) + GBIF (tassonomia); la specie scelta è copiata in locale con id GBIF/Wikidata e data di import | Funziona offline dopo l'import, tracciabilità come da §4 |
| Licenza | MIT | Richiesta da HACS; la più diffusa tra le integrazioni custom |

## 0bis. Principio guida: non sporcare HA

- Nessuna area, piano, etichetta o zona HA creata automaticamente.
- Entità HA ridotte al minimo utile (vedi §6); il dettaglio vive nel pannello.
- Disinstallazione pulita: rimuovendo l'integrazione non restano residui.

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
2. **Posizionamento su mappa** (clic e disegno nel pannello).
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
| origine | già presente / piantata da me / seminata da me |
| date | già presente: **età stimata**; piantata: messa a dimora + età all'impianto; seminata: semina + trapianto |
| anno di nascita stimato | unico dato da cui si calcola l'età (si aggiorna da sola) |
| forma all'impianto | seme, talea, radice nuda, vaso, astone 1 anno, 2 anni… |
| altezza/diametro all'impianto | stimati |
| portainnesto | per fruttiferi |
| fornitore | |
| posizione | punto (lat/lon), cliccato sulla mappa del pannello |
| stato | attivo, morto, rimosso (con data) |
| foto, note | |
| fase lunare | calcolata automaticamente alla data (solo registrazione) |

### Zona (`zone`) — aiuole e settori
Concetto simile alle aree HA, ma **interno** all'integrazione.

| Campo | Note |
|---|---|
| id, nome, zona padre | gerarchia libera: Giardino > Orto > Aiuola 3 |
| tipo | orto, frutteto, aiuola fiori, serra, vaso, prato… |
| geometria | poligono sulla mappa |
| superficie | calcolata dal poligono |
| esposizione, tipo suolo | opzionali |
| area HA collegata | **opzionale**, solo riferimento a un'area esistente (es. "Giardino"), mai creata |

Una zona ospita nel tempo colture diverse: lo storico per stagione abilita la **rotazione** (v3).

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

## 4bis. Raccolto e indice di annata (v4)

### Registro raccolto (`harvest`)
| Campo | Note |
|---|---|
| data, pianta o zona | |
| quantità + unità | kg o pezzi |
| valore € stimato | **opzionale**, inserito dall'utente |
| voto qualità 1–5 | gusto, calibro, sanità |
| note, foto | |

### Indice di annata
Per pianta/zona/coltura e per anno, due componenti:

| Componente | Calcolo | Lettura |
|---|---|---|
| Quantità | quantità anno / mediana anni precedenti | 1,0 = anno normale; 0,4 = anno scarso |
| Qualità | media dei voti 1–5 dell'anno | |
| **Indice annata** | combinazione delle due → scala semplice (es. 🟢 buona / 🟡 media / 🔴 da dimenticare) | Leggibile a colpo d'occhio |

Primo anno senza storico: solo qualità. Gli eventi meteo estremi (gelate tardive, grandine, siccità) vengono collegati automaticamente all'annata per spiegarla.

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
| Entità di default | Poche e aggregate: n. piante, prossima azione, spesa anno, indice annata |
| Device per pianta | **Opt-in** per piante scelte (es. alberi importanti), mai automatico |
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
| v4 | Motore regole meteo ("si può potare?"), registro produzione + indice annata (§4bis) |
| v5 | Analisi pluriennali (rese, correlazioni incl. luna), multi-utente, pubblicazione HACS |

## 8. Mappa — come ottenerla

| Metodo | Strumento | Note |
|---|---|---|
| A | Clic sulla mappa satellitare nel pannello | Il più semplice, nessun tool esterno |
| B | [Google My Maps](https://www.google.com/mymaps) → esporta KML | Gratuito, account Google, vista satellite |
| C | [geojson.io](https://geojson.io) → esporta GeoJSON | Open source, senza account |

Decisione v0.4.1: si usa solo il metodo A; l'import B/C (v0.3) è stato tolto perché non serviva.

## 9. Backlog idee (non pianificate)

- Attrezzi prestati/condivisi (a chi, quando, rientro).
- Correlazioni fase lunare ↔ risultati (dati già registrati da v1).
- Contributo comunitario delle correzioni ai dati colturali.

## 10. Domande aperte

1. Indice annata: i pesi quantità/qualità fissi o configurabili?
2. Rotazione: regole classiche per famiglia botanica (solanacee, brassicacee…) o solo storico visibile?
