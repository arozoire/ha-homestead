# HA Homestead

Integrazione per Home Assistant per gestire orto, frutteto e giardino: piante, alberi da frutto, aiuole, spese, attrezzi e, nelle prossime versioni, raccolto e consigli basati sul meteo.

> Stato: **v0.4.1 — backup e prima prova dal vivo**. Specifiche complete in [SPEC.md](SPEC.md).

## Principio guida

**Non sporcare Home Assistant**: nessuna area creata, poche entità aggregate, rimozione pulita (disinstallando l'integrazione i dati vengono cancellati).

## Cosa fa oggi (v0.4.1)

| Funzione | Come |
|---|---|
| Zone (aiuole, frutteto, serra) | Disegnate a clic nel pannello; servizi `add_zone`, `update_zone`, `delete_zone`; gerarchia interna, superficie calcolata dal poligono |
| Pannello "Giardino" | Voce nella barra laterale: mappa satellitare, piante e zone, backup |
| Piante e alberi | Servizi `homestead.add_planting`, `update_planting`, `delete_planting`; `add_planting` (singolo o gruppo, forma all'impianto, altezza, portainnesto, posizione, prezzo) |
| Specie | Campo "Specie" con ricerca su **GBIF** e **Wikidata** (nome comune o scientifico); la specie scelta viene importata e salvata in locale (nomi comuni it/fr/en, famiglia, genere). Servizio `homestead.import_taxon` |
| Date della pianta | Origine: *già presente* (età stimata), *piantata da me* (messa a dimora + età all'impianto), *seminata da me* (semina + trapianto); l'età si aggiorna da sola |
| Fase lunare | Registrata automaticamente alla semina e alla messa a dimora |
| Spese | Servizio `homestead.add_expense`; il prezzo di piante e attrezzi diventa una spesa |
| Attrezzi | Servizio `homestead.add_tool` con stato e prossima manutenzione |
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

Entità create: `sensor.ha_homestead_plantings`, `sensor.ha_homestead_expenses_this_year`, `sensor.ha_homestead_tools_needing_service`.

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
