# HA Homestead

Integrazione per Home Assistant per gestire orto, frutteto e giardino: piante, alberi da frutto, aiuole, spese, attrezzi e, nelle prossime versioni, raccolto e consigli basati sul meteo.

> Stato: **v0.7 — attività pianificate, to-do e calendario**. Specifiche complete in [SPEC.md](SPEC.md).

## Principio guida

**Non sporcare Home Assistant**: nessuna area creata, poche entità aggregate, rimozione pulita (disinstallando l'integrazione i dati vengono cancellati).

## Cosa fa oggi (v0.8.2)

| Funzione | Come |
|---|---|
| Zone (aiuole, frutteto, serra) | Disegnate a clic nel pannello; servizi `add_zone`, `update_zone`, `delete_zone`; gerarchia interna, superficie calcolata dal poligono |
| Pannello "Giardino" | Voce nella barra laterale: mappa satellitare, piante e zone, backup |
| Piante e alberi | Servizi `homestead.add_planting`, `update_planting`, `delete_planting`; `add_planting` (singolo o gruppo, forma all'impianto, altezza, portainnesto, posizione, prezzo) |
| Specie | Campo "Specie" con ricerca su **GBIF** e **Wikidata** (nome comune o scientifico); la specie scelta viene importata e salvata in locale (nomi comuni it/fr/en, famiglia, genere). Servizio `homestead.import_taxon` |
| Date della pianta | Origine: *già presente* (età stimata), *piantata da me* (messa a dimora + età all'impianto), *seminata da me* (semina + trapianto); l'età si aggiorna da sola |
| Fase lunare | Registrata automaticamente alla semina e alla messa a dimora |
| Diario | Scheda *Diario* (filtri per tipo, zona, anno) e sezione *Diario* nelle schede pianta e zona: potatura, concimazione, irrigazione, trattamento, semina, raccolta (quantità), innesto, problema, nota; fase lunare automatica; foto; un evento sulla zona vale per tutte le sue piante; costo e ricavo facoltativi diventano movimenti collegati. Servizi `add_event`, `update_event`, `delete_event` |
| Annate | Nella scheda pianta, *📊 Annate*: una riga per anno (e per coltura della stessa specie) con semina, trapianto, potature con luna e meteo, trattamenti, raccolto, ⭐ voto, ✅ da rifare / ❌ da evitare |
| Bilancio | Evento *⭐ Bilancio annata* (voto 1–5, raccolto scarso/normale/abbondante, da rifare, da evitare); chiesto subito dopo *🏁 Fine coltura* e, da settembre, nella scheda pianta |
| Meteo | Ogni evento registra il meteo della settimana prima (+3 giorni dopo per trattamenti e semine): temperatura media/min/max, umidità, pioggia, umidità del suolo. Dai tuoi sensori (statistiche a lungo termine di HA, scelti in *Configura*), il resto da Open-Meteo (gratis, senza account) |
| Attività pianificate | *📋 Da fare* nella scheda Diario e nella scheda pianta: tipo, pianta o zona, data, *ogni anno*; ✔ apre l'evento del diario già compilato. Servizi `add_task`, `update_task`, `delete_task`, `complete_task` |
| Promemoria sul telefono | Ora e telefoni in *Configura*; tocco → form del diario precompilato; ✔ Fatto dalla notifica |
| To-do e calendario HA | `todo.ha_homestead_garden_tasks` (spuntare = registrare nel diario oggi; si possono aggiungere voci dall'app HA) e `calendar.ha_homestead_garden` (attività pianificate + ✔ eventi fatti) |
| Inizio pianta | Il diario mostra in fondo semina, messa a dimora/trapianto o "presente da ~N anni" (dai dati della pianta) |
| Comodità | 🗺️ nell'intestazione nasconde/mostra la mappa; *+ Raccolta* (ripete l'ultima quantità), *🔁 Ripeti l'anno prossimo* (nuova coltura con stessa specie, varietà e zona) |
| Spese | Scheda *Spese* (spese, ricavi, saldo) nel pannello (totale dell'anno per categoria, modifica, eliminazione) o servizi `add_expense`/`update_expense`/`delete_expense`; il prezzo di piante e attrezzi diventa una spesa; nella scheda pianta: totale speso + *+ Spesa* |
| Attrezzi | Scheda *Attrezzi* (stato a colori, 🔧 manutenzione scaduta) o servizi `add_tool`/`update_tool`/`delete_tool` |
| Foto | Nella scheda pianta: *📷 Aggiungi foto* (fotocamera o galleria del telefono), ridotte a 1600 px e salvate in `/media/homestead/`; visibili solo agli utenti HA |
| Sfondo "Nessuna mappa" | Dal selettore dei livelli: zoom fino al livello 23 per lavorare dentro un'aiuola |
| Import CSV | Schede *Piante* e *Semi*: *📄 Modello CSV* scarica il file con le colonne (separatore `;`, apribile con Excel); *📥 Importa CSV* mostra ogni riga prima di importare: valori non capiti (zona, tipo, data gg/mm/aaaa, numeri) si correggono lì, le righe già presenti restano senza spunta |
| Immagine della specie | Nei suggerimenti della ricerca specie e accanto alla specie collegata: foto da Wikimedia Commons (proprietà P18 di Wikidata); un tocco la apre in grande; le specie importate prima la recuperano quando le scegli di nuovo |
| Prezzo alla creazione | Nuova pianta: *Prezzo* e *Fornitore* diventano subito una spesa |
| Tipo di pianta | Albero, albero da frutto, arbusto, rampicante, ortaggio, aromatica, fiore: icona sulla mappa e nella lista (proposto dal tipo di zona) |
| Negli anni scorsi | Riquadro *📅 Negli anni scorsi, in questo periodo* (scheda pianta, zona e Diario); nel form evento *↩️ L'ultima volta* con data, quantità, luna, meteo e voto dell'annata |
| Lavori di zona | Lavorazione terreno, diserbo, pacciamatura, sfalcio: un evento sulla zona (es. tutto l'orto) |
| Bilancio | Scheda *Spese*: anno a scelta (o tutti), spese, ricavi, saldo, mese per mese, per pianta |
| Bosco e legna | Zona di tipo *Bosco* con le essenze principali; eventi pulizia, taglio legna (essenza, quantità in quintali, steri o m³ a scelta), raccolta rami, raccolta spontanea (funghi, castagne…); legna per anno nella scheda zona |
| Semi | Scheda *Semi*: specie, varietà, anno, fornitore, quantità; avviso quando invecchiano (durata tipica per famiglia, modificabile); il lotto si sceglie nella pianta seminata. Servizi `add_seed_lot`, `update_seed_lot`, `delete_seed_lot` |
| Rotazione | Consiglio nel form pianta se nella stessa zona c'era la stessa famiglia negli ultimi 3 anni; colture per anno nella scheda zona |
| Lista della spesa | 🛒 da semi e da prodotti di concimazione/trattamento → lista della spesa di HA (`todo.shopping_list`) |
| Dati colturali | Scheda pianta *🌿 Scheda colturale*: esposizione, rusticità, distanza, mesi di semina, impianto, fioritura e raccolta (tabella di base di ~85 specie, valori indicativi per clima temperato; *✏️ Correggi* salva i tuoi valori). Nel Diario *📆 Questo mese*: semi da seminare, piantine da mettere a dimora, raccolte. Servizi `set_crop_profile`, `delete_crop_profile` |
| Esportazione | Servizio `homestead.export` (risposta con tutti i dati) |

### Pannello "Giardino"

| Azione | Come |
|---|---|
| Nuova pianta | *+ Nuova pianta* → clic sulla mappa → compila nome e specie |
| Posizionare una pianta esistente | Clic sulla pianta "non sulla mappa" nella lista → clic sulla mappa |
| Spostare | Seleziona la pianta → trascina il segnaposto |
| Stato | Verde = attiva, rosso = morta, grigio = rimossa |
| Nuova zona | Scheda *Zone* → *+ Nuova zona* → clic sugli angoli → *Fine* → nome e tipo |
| Zona di una pianta | Proposta in automatico se la pianta cade dentro un poligono (la zona più piccola) |
| Backup | In fondo alla lista: *💾 Esporta* scarica un file JSON con tutto; *📂 Ripristina* (solo admin) sostituisce tutti i dati con quelli del file, dopo conferma |

Specie: solo piante (regno Plantae); le specie già importate si trovano anche senza internet; le ricerche online restano in memoria 24 h. Home Assistant deve poter raggiungere `api.gbif.org` e `www.wikidata.org` (dati aperti, nessun account).

I dati sono anche nei backup di Home Assistant (`.storage/homestead.data`); il backup del pannello serve per spostarli o ripristinarli a mano.

Mappe: satellite **Esri World Imagery** (gratuito, senza account né pubblicità) e **OpenStreetMap**. Leaflet è incluso nell'integrazione, nessuna libreria scaricata da CDN; solo le tessere della mappa arrivano da internet.

### Impostazioni

*Impostazioni → Dispositivi e servizi → HA Homestead → **Configura*** (oppure ⚙️ in alto nel pannello):

| Impostazione | Default |
|---|---|
| Sensori meteo (temperatura, umidità, pioggia, umidità suolo) | nessuno: si usa Open-Meteo |
| **Invia i promemoria a** (uno o più `notify.mobile_app_…`) | nessuno: niente notifiche |
| **Ora dei promemoria** | 08:00 |

Ogni giorno, all'ora scelta, arriva una notifica per ogni attività prevista oggi (più un riepilogo delle attività in ritardo). **Toccandola** si apre il pannello sul form del diario già compilato; il pulsante **✔ Fatto** la registra subito nel diario.

Entità create: `sensor.ha_homestead_plantings`, `sensor.ha_homestead_expenses_this_year`, `sensor.ha_homestead_tools_needing_service`, `todo.ha_homestead_garden_tasks`, `calendar.ha_homestead_garden` (tutte sotto un solo dispositivo "HA Homestead").

## Fonti dei dati

| Dati | Fonte | Licenza |
|---|---|---|
| Specie (nomi, famiglia, immagini) | [Wikidata](https://www.wikidata.org), [GBIF](https://www.gbif.org), [Wikimedia Commons](https://commons.wikimedia.org) | CC0 / CC-BY / licenze dei file Commons |
| Calendario colturale, consociazioni, famiglie | [CropGraph](https://github.com/Cropgraph/cropgraph) (USDA Cooperative Extension e altri), estratto in `data/cropgraph.json` con `scripts/build_cropgraph.mjs` | codice MIT, dati **CC-BY-4.0** |
| Tabella colturale di base (~85 specie) | valori indicativi per clima temperato, scritti per questo progetto | MIT |
| Meteo | i tuoi sensori, l'entità meteo di HA, [Open-Meteo](https://open-meteo.com) | CC-BY-4.0 (Open-Meteo) |

## Installazione (HACS, repository personalizzato)

1. HACS → menu ⋮ → *Repository personalizzati* → `https://github.com/arozoire/ha-homestead`, categoria *Integrazione*.
2. Installa **HA Homestead** e riavvia Home Assistant.
3. *Impostazioni → Dispositivi e servizi → Aggiungi integrazione → HA Homestead*.

## Sviluppo

```bash
pip install -r requirements_test.txt ruff
ruff check custom_components tests
pytest
```

## Roadmap

v1 piante + mappa + spese + attrezzi → v2 diario e calendario → v3 semi e rotazioni → v4 meteo e raccolto con indice di annata → v5 analisi e pubblicazione. Dettagli in [SPEC.md](SPEC.md).
