# HA Homestead

Integrazione per Home Assistant per gestire orto, frutteto e giardino: piante, alberi da frutto, aiuole, spese, attrezzi e, nelle prossime versioni, raccolto e consigli basati sul meteo.

> Stato: **v0.7 — attività pianificate, to-do e calendario**. Specifiche complete in [SPEC.md](SPEC.md).

## Principio guida

**Non sporcare Home Assistant**: nessuna area creata, poche entità aggregate, rimozione pulita (disinstallando l'integrazione i dati vengono cancellati).

## Cosa fa oggi (v0.7)

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
| To-do e calendario HA | `todo.ha_homestead_garden_tasks` (spuntare = registrare nel diario oggi; si possono aggiungere voci dall'app HA) e `calendar.ha_homestead_garden` (attività pianificate + ✔ eventi fatti) |
| Inizio pianta | Il diario mostra in fondo semina, messa a dimora/trapianto o "presente da ~N anni" (dai dati della pianta) |
| Comodità | 🗺️ nell'intestazione nasconde/mostra la mappa; *+ Raccolta* (ripete l'ultima quantità), *🔁 Ripeti l'anno prossimo* (nuova coltura con stessa specie, varietà e zona) |
| Spese | Scheda *Spese* (spese, ricavi, saldo) nel pannello (totale dell'anno per categoria, modifica, eliminazione) o servizi `add_expense`/`update_expense`/`delete_expense`; il prezzo di piante e attrezzi diventa una spesa; nella scheda pianta: totale speso + *+ Spesa* |
| Attrezzi | Scheda *Attrezzi* (stato a colori, 🔧 manutenzione scaduta) o servizi `add_tool`/`update_tool`/`delete_tool` |
| Foto | Nella scheda pianta: *📷 Aggiungi foto* (fotocamera o galleria del telefono), ridotte a 1600 px e salvate in `/media/homestead/`; visibili solo agli utenti HA |
| Sfondo "Nessuna mappa" | Dal selettore dei livelli: zoom fino al livello 23 per lavorare dentro un'aiuola |
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

### Notifica sul telefono il giorno di un'attività

```yaml
automation:
  - alias: Giardino - attività di oggi
    triggers:
      - trigger: calendar
        event: start
        entity_id: calendar.ha_homestead_garden
        offset: "8:00:00"   # alle 8 del mattino
    conditions:
      - condition: template
        value_template: "{{ not trigger.calendar_event.summary.startswith('✔') }}"
    actions:
      - action: notify.mobile_app_il_tuo_telefono
        data:
          title: "🌱 Giardino"
          message: "{{ trigger.calendar_event.summary }}"
```

Entità create: `sensor.ha_homestead_plantings`, `sensor.ha_homestead_expenses_this_year`, `sensor.ha_homestead_tools_needing_service`, `todo.ha_homestead_garden_tasks`, `calendar.ha_homestead_garden` (tutte sotto un solo dispositivo "HA Homestead").

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
