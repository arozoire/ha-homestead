# HA Homestead

Integrazione per Home Assistant per gestire orto, frutteto e giardino: piante, alberi da frutto, aiuole, spese, attrezzi e, nelle prossime versioni, raccolto e consigli basati sul meteo.

> Stato: **v0.1 — scheletro**. Specifiche complete in [SPEC.md](SPEC.md).

## Principio guida

**Non sporcare Home Assistant**: nessuna area creata, poche entità aggregate, rimozione pulita (disinstallando l'integrazione i dati vengono cancellati).

## Cosa fa oggi (v0.1)

| Funzione | Come |
|---|---|
| Zone (aiuole, frutteto, serra) | Servizio `homestead.add_zone`, gerarchia interna |
| Piante e alberi | Servizio `homestead.add_planting` (singolo o gruppo, forma all'impianto, altezza, portainnesto, posizione, prezzo) |
| Fase lunare | Registrata automaticamente alla data di impianto |
| Spese | Servizio `homestead.add_expense`; il prezzo di piante e attrezzi diventa una spesa |
| Attrezzi | Servizio `homestead.add_tool` con stato e prossima manutenzione |
| Esportazione | Servizio `homestead.export` (risposta con tutti i dati) |

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
