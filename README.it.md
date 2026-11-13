<p align="center"><img src="https://raw.githubusercontent.com/arozoire/ha-homestead/main/custom_components/homestead/brand/icon.png" width="128" alt="HA Homestead"></p>

# HA Homestead

[English](README.md) · **Italiano**

<p align="center"><a href="https://www.buymeacoffee.com/arozoire" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" height="40"></a></p>

Integrazione per Home Assistant per gestire orto, frutteto e giardino: piante, alberi da frutto, aiuole, spese, attrezzi e, nelle prossime versioni, raccolto e consigli basati sul meteo.

> Stato: **v0.19** (vedi *Cosa fa oggi*). Specifiche complete in [SPEC.md](SPEC.md).

## Chiedi alla tua IA

ChatGPT, Claude, Gemini o Perplexity possono aiutarti a installare e configurare HA Homestead: indica loro **[docs/ai-assistant.md](docs/ai-assistant.md)** (in inglese: cosa fa, passi di configurazione e formato CSV se hai già una lista di piante o semi da importare).

## Principio guida

**Non sporcare Home Assistant**: nessuna area creata, poche entità aggregate, rimozione pulita (disinstallando, i dati vengono cancellati da HA; le foto restano nella cartella media con un ultimo backup).

## Cosa fa oggi

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
| Meteo | Ogni evento registra il meteo della settimana prima (+3 giorni dopo per trattamenti e semine): temperatura media/min/max, umidità, pioggia, umidità, temperatura ed EC del suolo (per esempio un Ecowitt WH52). Dai tuoi sensori — quelli del suolo anche per zona (form della zona, *Sensori del suolo di questa zona*; vuoto = la zona sopra, poi quelli generali) — (statistiche a lungo termine di HA, scelti in *Configura*), il resto da Open-Meteo (gratis, senza account) |
| Attività pianificate | *📋 Da fare* nella scheda Diario e nella scheda pianta: tipo, pianta o zona, data, *ogni anno*; ✔ apre l'evento del diario già compilato. Servizi `add_task`, `update_task`, `delete_task`, `complete_task` |
| 🗓️ Lavori del weekend | Nel Calendario, *Cosa devo fare…*: scegli un lavoro (✂️ potatura, 🌿 concimazione, 🍎 raccolta, 🌱 semina) e un periodo (weekend, settimana, mese): le piante che secondo la scheda colturale hanno quel lavoro adesso e non sono ancora state fatte in questa stagione (per la semina, i lotti di semi), con il meteo di ogni giorno; sulla linea dell'anno le altre piante si sbiadiscono. **Crea attività con lista**: un'attività sola con tutte, una notifica; nel Da fare si spuntano una alla volta (ogni spunta scrive il diario di quella pianta; la raccolta chiede la quantità, un lotto di semi apre la semina), *Fatte tutte*, *＋ Aggiungi*, *↪ Ripianifica* (domani, weekend dopo o una data: quelle non ancora fatte passano a una nuova attività). Servizi `add_task` con `planting_ids` / `seed_ids`, `complete_task` con `items`, `postpone_task` |
| 📸 Foto negli anni | *Altro → Foto delle zone*: scegli zone e piante singole (una pianta che muore esce dal piano da sola) e i **periodi** (inizio / metà / fine di un mese, 14 giorni ciascuno) oppure *ogni N settimane*. Ogni periodo apre un'attività con lista (una notifica, e di nuovo 3 giorni prima della fine); **📸 Scatta** apre la fotocamera dal vivo con la foto precedente in trasparenza (regolabile) per rifare la stessa inquadratura, oppure la fotocamera del telefono a risoluzione piena. Gli originali restano **senza compressione** nella cartella media di HA scelta nelle opzioni (va bene un NAS aggiunto in *Impostazioni → Sistema → Archiviazione*), con una copia piccola per le liste. Nelle schede zona e pianta, *📸 Negli anni*: griglia anni × periodi, **↔ Confronta** due foto con il cursore, **▶ Timelapse**, scarica l'originale. Servizio `set_photo_plan` |
| 📐 Zona in pianta | *📐 In pianta* nella scheda zona (o toccando una zona): la zona come disegno tecnico in metri, griglia fino a 10 cm. **📏 Lati**: scrivi le misure vere; **↺ ↻ ▭ Allinea**: ruota il disegno (di 15°, o con il lato più lungo orizzontale; freccia del nord, ricordato per zona); **▦ Aiuola**: un rettangolo misurato dall'angolo della zona, oppure **disegnata** angolo per angolo (agganciata alla griglia e agli angoli esistenti); **🌱 Pianta**: una pianta, **una fila** (un gruppo lungo una linea) o **riempi un'aiuola** (quante ne stanno, a quinconce). Trascina le piante per spostarle, si agganciano alla griglia; ogni pianta ha l'**icona della sua coltura** (🍅 🥕 🧅 🫘 🍓 …) con un **anello colorato per gruppo** — stessa coltura, varietà e data di impianto, quindi un pomodoro piantato due settimane dopo ha un altro colore — e **🏷️ Legenda** elenca i gruppi (toccandone uno si evidenzia); **✂️ Dividi** un gruppo (×8) in piante singole, quante ne scegli, messe lungo la sua fila da trascinare al loro posto; il cerchio d'ingombro viene dalla scheda colturale. **🤝 Vicini sbagliati** entro 1 m (consociazioni CropGraph) e **🐝 impollinatori** dei fruttiferi autosterili (solo se la varietà è nota; maschi del kiwi) |
| 💧 Acqua | *Come si bagna* su zone e piante (solo pioggia, annaffiatoio, tubo, goccia, dall'alto, valvola). **Bilancio idrico** per zona, senza inserire niente: pioggia meno evaporazione (ET₀ di Open-Meteo) dall'ultima annaffiatura, vincono i sensori di umidità del suolo della zona (più sensori vengono mediati); anche un vaso o un albero giovane può avere i suoi; barre degli ultimi 14 giorni nella scheda zona, un tocco registra l'annaffiatura. **🌳 Alberi giovani**: alberi, arbusti e rampicanti seguiti per 2 anni dalla messa a dimora (o dal trapianto), non dall'età. Promemoria del mattino *da annaffiare oggi* |
| ✨ Oggi nel giardino | Nel Diario, tutto calcolato: acqua per zona, alberi giovani, **ore di freddo** dal 1° novembre (con il fabbisogno di ogni specie nella sua scheda), **gradi-giorno** da gennaio confrontati con l'anno scorso, **luce** (cipolle a giorno lungo), **si può piantare fuori?** per lotti di semi e piantine (suolo dal sensore o dalla previsione Open-Meteo, notti, un giorno migliore), parassiti che di solito arrivano ora, trattamenti da giudicare |
| 🐛 Parassiti | Evento *Problema* con cosa e quanto; *Trattamento* con *ha funzionato?* (chiesto 10 giorni dopo). Nella scheda pianta i problemi di quella coltura negli anni; dopo due anni i gradi-giorno a cui arrivano |
| 🌰 Semi tuoi, 🔁 scalari, 🔄 anno prossimo | *🌰 Raccogli i semi* da una pianta → lotto collegato alla pianta madre, e la **linea** della varietà (germinazione e resa per pianta, generazione per generazione). *🔁 Semina scalare* da un lotto: un'attività che torna ogni N settimane fino a una data. *🔄 L'orto l'anno prossimo*: su una zona orto (settembre–marzo) la famiglia proposta per ogni aiuola dopo gli ultimi 3 anni |
| 📄 L'annata in una pagina | *Altro → Resoconto dell'annata*: raccolto, uova, saldo, piante nuove, raccolti migliori, meteo, parassiti, cose da rifare ed evitare; *🖨️ Stampa* |
| Promemoria sul telefono | Ora e telefoni in *Configura*; tocco → form del diario precompilato; ✔ Fatto dalla notifica |
| To-do e calendario HA | `todo.ha_homestead_garden_tasks` (spuntare = registrare nel diario oggi; si possono aggiungere voci dall'app HA) e `calendar.ha_homestead_garden` (attività pianificate + ✔ eventi fatti) |
| Inizio pianta | Il diario mostra in fondo semina, messa a dimora/trapianto o "presente da ~N anni" (dai dati della pianta) |
| Comodità | 🗺️ nell'intestazione nasconde/mostra la mappa; *+ Raccolta* (ripete l'ultima quantità), *🔁 Ripeti l'anno prossimo* (nuova coltura con stessa specie, varietà e zona) |
| Spese | Scheda *Spese* (spese, ricavi, saldo) nel pannello (totale dell'anno per categoria, modifica, eliminazione) o servizi `add_expense`/`update_expense`/`delete_expense`; il prezzo di piante e attrezzi diventa una spesa; nella scheda pianta: totale speso + *+ Spesa* |
| Attrezzi | Scheda *Attrezzi* (stato a colori, 🔧 manutenzione scaduta, 💶 costo totale: acquisto + spese collegate, e costo all'anno) o servizi `add_tool`/`update_tool`/`delete_tool` |
| Foto | Nella scheda pianta: *📷 Aggiungi foto* (fotocamera o galleria del telefono), ridotte a 1600 px e salvate in `/media/homestead/`; visibili solo agli utenti HA |
| Sfondo "Nessuna mappa" | Dal selettore dei livelli: zoom fino al livello 23 per lavorare dentro un'aiuola |
| Menu | 📓 Diario (si apre per primo), 📅 Calendario, 🗺️ Mappa (Piante / Zone), 📈 Analisi, ⋯ Altro (Semi, Spese, Attrezzi, Impostazioni, Backup, Azzera tutto); in basso sul telefono, in alto sul computer; la mappa solo nella scheda Mappa e nelle schede pianta/zona |
| 📓 Diario veloce | Meteo dei 14 giorni con allerte e attività, Da fare della settimana, pulsanti 🍅 Raccolta, 🥚 Uova, 💧 Irrigazione, 📝 Nota; piante *In raccolta adesso* e *Aggiornate di recente* con **+ Raccolta** in un tocco (quantità dell'ultima volta, − / +, ✔), ricerca; sotto il diario completo con filtri |
| 🔁 Ripeti l'orto | Scheda Mappa: le colture annuali dell'anno scorso da spuntare (voto e "da evitare" accanto) diventano nuove piante con stessa zona e varietà |
| 🔧 Manutenzione attrezzi | *Manutenzione ogni (mesi)* + prossima data; ✔ Manutenzione fatta sposta la prossima (costo facoltativo → spesa collegata all'attrezzo); nel Calendario (gruppo Attrezzi e schede delle 2 settimane) e promemoria sul telefono il giorno stesso |
| Tipo di pianta automatico | Dalla specie: albero, albero da frutto, arbusto, rampicante per genere (melo, nocciolo, vite, quercia…), ortaggio/aromatica/fiore dalla categoria CropGraph; proposto alla scelta della specie e con 🏷️ *Completa i tipi mancanti* per le piante già inserite |
| Piante morte o tolte | Nascoste da mappa e lista della scheda Mappa; *Mostra le piante morte o tolte* per rivederle (restano nel diario e nelle analisi) |
| 🌱 Semenzaio | Zona di tipo *Semenzaio*; dalla scheda Semi *🌱 Semina* (quanti semi, dove, cosa aspettarsi dagli anni scorsi e dall'età del lotto); nel Diario *🌱 In semenzaio*: giorni dalla semina, *in ritardo* rispetto agli anni passati, *pronte da trapiantare*; *🌿 Nate* (data e quante → giorni e % di nascita); *↪️ Trapianta* tutte o una parte (la parte diventa una pianta nuova), avviso se arriva una notte fredda; Analisi *Germinazione negli anni* |
| Tocco su una zona | Sulla mappa: *+ Pianta qui* nel punto toccato, *🌱 Semina qui* sul semenzaio, *Trapianta dal semenzaio*, *+ Evento*, *Scheda zona* |
| 🏁 Fine della pianta | Motivo: ✅ finita (poi bilancio della stagione), 💀 morta (causa: gelo, siccità, malattia, parassiti, animali), 🗑️ tolta; Analisi *💀 Perdite negli anni* |
| 🪴 Piante da interno | Zona *In casa* per stanza; per pianta *annaffia ogni N giorni* (più lento d'inverno) o un sensore di umidità del terriccio, *concima ogni N settimane* (marzo–settembre), rinvaso proposto in primavera (campi visibili solo per le piante in una zona da interno); nel Diario il giro *da annaffiare* per stanza con un solo **💧 Annaffiate**, *🏖️ via fino al* per sapere cosa annaffiare prima di partire; promemoria del mattino |
| 🩺 Note di cura | Per ogni pianta, sotto la scheda colturale, un riquadro *Cura* chiuso dove scrivere le proprie note (quando potare, cosa le piace, cosa è andato storto) |
| 🔥 Legna | *Legna bruciata* a fine inverno (q, steri o m³): catasta, legna stagionata (18 mesi), consumo per inverno con i giorni di gelo, quanta ne serve per l'inverno prossimo e quanta tagliare |
| 🌍 Lingue | Italiano, inglese, francese, tedesco, spagnolo, olandese (pannello, servizi, impostazioni, notifiche) |
| 🗑️ Azzera tutto | In *Altro*, solo amministratori, scrivendo RESET: cancella dati e foto, restano impostazioni e storico meteo |
| 📅 Calendario | Pulsante 📅 in alto: al posto della mappa, *Da fare nelle prossime 2 settimane* (schede grandi con verdetto meteo, in ritardo in rosso, ✔), allerte, meteo; l'**anno come linea continua** con la riga *oggi* al giorno giusto, piante raggruppate per zona (gruppi che si aprono e chiudono), attività previste come pastiglie alla data, lavori del bosco; *📜 Storico*: per anno, gli eventi fatti alla data sotto il meteo estremo (gelo, ondate di calore, grandine, piogge forti) |
| 📈 Analisi | Scheda a tutta larghezza: riquadro per anno (indice dell'annata, kg, saldo, meteo estremo); raccolti per coltura e zona negli ultimi 5 anni, **Totale o Per pianta** (10 pomodori un anno, 15 l'altro), colore = resa per pianta rispetto agli anni precedenti + voto della stagione, costo per kg; raccolto e meteo della coltura scelta; mese di potatura o messa a dimora a confronto; fase lunare alla semina vs voto (con avviso se i dati sono pochi); lezioni (da rifare / da evitare); uova per anno |
| ♻️ Compost | Zona di tipo *Compostiera*: solo eventi *rivoltare* e *raccolta* (qualità ★1–5 e note, niente kg); dopo 4 settimane senza rivoltare: suggerimento nel Diario e nel Calendario, notifica sul telefono (poi una volta a settimana) |
| 🐔 Pollaio | Zona di tipo *Pollaio*: **+ Uova** rapido con data (anche giorni passati) e numero; galline come gruppo con *+ Arrivo* (numero, razza, prezzo) e *− Uscita* (numero, motivo: volpe, malattia, vecchiaia, venduta…); galline attuali calcolate; uova ultimi 7 giorni, mese, anno, per gallina, costo per uovo (dalle spese di mangime e cure); le uova non riempiono Diario e calendario HA |
| Allerte gelo e caldo | Gelo sotto la rusticità di ogni pianta (piante giovani o tenere da 0 °C), ondata di calore (3 giorni con massima ≥ 35 °C **e** minima ≥ 22 °C), caldo estremo (≥ 40 °C), troppo caldo per le colture fresche; riquadro nel Diario, sensore `sensor.ha_homestead_weather_alerts`, notifica sul telefono a scelta: mai, solo con un'attività prevista quei giorni, sempre |
| Regole meteo | Per ogni attività prevista: trattamento (pioggia entro 48 h, vento, caldo), potatura (gelo nei giorni dopo, pioggia), semina (notti fredde per le colture calde), irrigazione (pioggia in arrivo)… con il giorno buono più vicino; anche nel promemoria sul telefono |
| Date di gelo e storico | Calcolate dai tuoi sensori (statistiche di HA), Open-Meteo per gli anni mancanti; usate per adattare il calendario colturale |
| Calendario colturale esteso | ~1.350 specie da CropGraph con le date adattate alle tue gelate, famiglia e consociazioni (🤝 sta bene con / 🚫 tenere lontano da, ✓ quelle già nel giardino) |
| Import CSV | Schede *Piante* e *Semi*: *📄 Modello CSV* scarica il file con le colonne (separatore `;`, apribile con Excel); *📥 Importa CSV* mostra ogni riga prima di importare: valori non capiti (zona, tipo, data gg/mm/aaaa, numeri) si correggono lì, le righe già presenti restano senza spunta |
| Immagine della specie | Nei suggerimenti della ricerca specie e accanto alla specie collegata: foto da Wikimedia Commons (proprietà P18 di Wikidata); un tocco la apre in grande; le specie importate prima la recuperano quando le scegli di nuovo |
| Prezzo alla creazione | Nuova pianta: *Prezzo* e *Fornitore* diventano subito una spesa |
| Tipo di pianta | Albero, albero da frutto, arbusto, rampicante, ortaggio, aromatica, fiore: icona sulla mappa e nella lista (proposto dal tipo di zona) |
| Negli anni scorsi | Riquadro *📅 Negli anni scorsi, in questo periodo* (scheda pianta, zona e Diario); nel form evento *↩️ L'ultima volta* con data, quantità, luna, meteo e voto dell'annata |
| Lavori di zona | Lavorazione terreno, diserbo, pacciamatura, sfalcio: un evento sulla zona (es. tutto l'orto) |
| Bilancio | Scheda *Spese*: anno a scelta (o tutti), spese, ricavi, saldo, mese per mese, per pianta |
| Bosco e legna | Zona di tipo *Bosco* con le essenze principali; eventi pulizia, taglio legna (essenza, quantità in quintali, steri o m³ a scelta), raccolta rami, raccolta spontanea (funghi, castagne…); legna per anno nella scheda zona |
| Semi | Scheda *Semi*: specie, varietà, anno, fornitore, quantità; avviso quando invecchiano (durata tipica per famiglia, modificabile); il lotto si sceglie nella pianta seminata. Filtri (cerca, anno, genere, fornitore, da usare/finiti) e *☑ Seleziona* per più lotti insieme: *🌱 Semina* (una semina per lotto, stessa zona e data), *📋 Programma* (un'attività di semina con la lista), *✔ Finiti*, *🗑️ Elimina*. Servizi `add_seed_lot`, `update_seed_lot`, `delete_seed_lot` |
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
| Backup | In *Altro*: *💾 Esporta JSON* scarica tutti i dati e i collegamenti alle foto (non i file delle foto); *🗜️ Esporta con le foto (.zip)* aggiunge tutti i file delle foto, originali compresi (può essere grande); *📂 Ripristina* (solo admin) accetta i due file e sostituisce tutti i dati, dopo conferma. Da uno .zip tornano anche le foto, nella cartella media locale se quella d'origine (un NAS) non c'è |

Specie: solo piante (regno Plantae); le specie già importate si trovano anche senza internet; le ricerche online restano in memoria 24 h. Home Assistant deve poter raggiungere `api.gbif.org` e `www.wikidata.org` (dati aperti, nessun account).

I dati sono anche nei backup di Home Assistant (`.storage/homestead.data`), le foto anche se il backup include la cartella media (non un NAS). Rimuovere l'integrazione cancella i suoi dati da HA ma **lascia le foto** nella cartella media, con accanto un ultimo backup (`homestead/homestead-last-backup.json`): riaggiungendo l'integrazione il Diario mostra *♻️ Giardino ritrovato* per ripristinare tutto con un tocco. Per toglierle del tutto, cancella la cartella `homestead` da *Media*. HACS non fa backup.

Mappe: satellite **Esri World Imagery** (gratuito, senza account né pubblicità) e **OpenStreetMap**. Leaflet è incluso nell'integrazione, nessuna libreria scaricata da CDN; solo le tessere della mappa arrivano da internet.

### Impostazioni

*Impostazioni → Dispositivi e servizi → HA Homestead → **Configura*** (oppure ⚙️ in alto nel pannello):

| Impostazione | Default |
|---|---|
| Sensori meteo (temperatura, umidità, pioggia, umidità, temperatura ed EC del suolo), **uno o più per tipo** (mediati; per la temperatura anche la minima e la massima di tutti) | nessuno: si usa Open-Meteo |
| **Invia i promemoria a** (uno o più `notify.mobile_app_…`) | nessuno: niente notifiche |
| **Ora dei promemoria** | 08:00 |
| **Previsioni meteo** (entità meteo di HA, es. Met.no) | nessuna: si usa Open-Meteo |
| **Allerte gelo e caldo sui telefoni** | solo con un'attività prevista in quei giorni |
| Ondata di calore: massima / minima notturna / giorni di fila | 35 °C / 22 °C / 3 |
| Caldo estremo: massima (anche un giorno) | 40 °C |
| **Unità**: come Home Assistant, metriche o imperiali (°F, pollici, piedi, acri, lb/oz, galloni; i dati restano salvati in metrico, le soglie di caldo qui sopra appaiono in °F) | come Home Assistant |

Ogni giorno, all'ora scelta, arriva una notifica per ogni attività prevista oggi (più un riepilogo delle attività in ritardo). **Toccandola** si apre il pannello sul form del diario già compilato; il pulsante **✔ Fatto** la registra subito nel diario.

Entità create: `sensor.ha_homestead_plantings`, `sensor.ha_homestead_expenses_this_year`, `sensor.ha_homestead_tools_needing_service`, `sensor.ha_homestead_weather_alerts`, `todo.ha_homestead_garden_tasks`, `calendar.ha_homestead_garden` (tutte sotto un solo dispositivo "HA Homestead").

## Fonti dei dati

| Dati | Fonte | Licenza |
|---|---|---|
| Specie (nomi, famiglia, immagini) | [Wikidata](https://www.wikidata.org), [GBIF](https://www.gbif.org), [Wikimedia Commons](https://commons.wikimedia.org) | CC0 / CC-BY / licenze dei file Commons |
| Calendario colturale, consociazioni, famiglie | [CropGraph](https://github.com/Cropgraph/cropgraph) (USDA Cooperative Extension e altri), estratto in `data/cropgraph.json` con `scripts/build_cropgraph.mjs` | codice MIT, dati **CC-BY-4.0** |
| Tabella colturale di base (~85 specie) | valori indicativi per clima temperato, scritti per questo progetto | MIT |
| Meteo | i tuoi sensori, l'entità meteo di HA, [Open-Meteo](https://open-meteo.com) | CC-BY-4.0 (Open-Meteo) |

## Installazione

HA Homestead è nella lista ufficiale di HACS: non serve aggiungere un repository personalizzato.

[![Apri questo repository in HACS nella tua istanza di Home Assistant.](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=arozoire&repository=ha-homestead&category=integration)

1. In HACS cerca **HA Homestead** (o usa il pulsante qui sopra) e scaricalo.
2. Riavvia Home Assistant.
3. *Impostazioni → Dispositivi e servizi → Aggiungi integrazione → HA Homestead*. Nella barra laterale compare **Giardino**.

## Domande frequenti

**Come gestisco l'orto in Home Assistant?**
Installa HA Homestead da HACS: il pannello *Giardino* mette piante e aiuole su una mappa satellitare, con diario, attività e promemoria sul telefono, senza helper né automazioni. Un'IA può guidarti nella configurazione ([guida](docs/ai-assistant.md)).

**Posso tenere un diario di potature e trattamenti con meteo e fase lunare?**
Sì: ogni evento salva la fase lunare e il meteo dei giorni attorno (i tuoi sensori, altrimenti Open-Meteo); le attività pianificate (trattamenti, potature, semine) hanno il controllo meteo e il giorno migliore vicino.

**E il frutteto?**
Zona disegnata, alberi sulla mappa: scheda colturale (potatura, fioritura, raccolta), allerte gelo per rusticità, ore di freddo, impollinatori, annaffiature dei primi due anni.

**Spese e raccolti dell'orto?**
Sì: spese e vendite, raccolti con quantità, bilancio per anno e analisi pluriennali per coltura e zona.

**Semi e semine?**
Lotti con avviso età, *da seminare ora* sulle tue date di gelo, semine scalari, rotazione per aiuola.

**Dove sono i dati e come faccio il backup?**
In Home Assistant (`.storage/homestead.data`, nei backup di HA), foto nella cartella media. *Altro → 💾 Esporta JSON* o *🗜️ Esporta con le foto (.zip)*; *📂 Ripristina* accetta entrambi. Nessun account cloud.

## Sviluppo

```bash
pip install -r requirements_test.txt ruff
ruff check custom_components tests
pytest
```

## Roadmap

v1 piante + mappa + spese + attrezzi → v2 diario e calendario → v3 semi e rotazioni → v4 meteo e raccolto con indice di annata → v5 analisi e pubblicazione. Dettagli in [SPEC.md](SPEC.md).
