import * as L from "./vendor/leaflet.js";

const BASE = new URL(".", import.meta.url).href;

const ZONE_KINDS = ["vegetable_garden", "orchard", "flower_bed", "greenhouse", "pots", "lawn", "woodland", "other"];

const TEXT = {
  en: {
    panelTitle: "Garden",
    satellite: "Satellite",
    map: "Map",
    tabPlantings: "Plantings",
    tabZones: "Zones",
    tabDiary: "Diary",
    tabTodo: "📋 To do",
    addTask: "+ Planned activity",
    newTaskTitle: "Plan an activity",
    editTaskTitle: "Planned activity",
    due_on: "When",
    title: "Title (optional)",
    yearly: "Every year",
    nothingToDo: "Nothing planned.",
    done: "Done",
    confirmDeleteTask: "Delete this planned activity?",
    overdue: "overdue",
    addEvent: "+ Event",
    newEventTitle: "New diary event",
    editEventTitle: "Diary event",
    emptyDiary: "Nothing recorded yet.",
    target: "On",
    plantingsGroup: "Plantings",
    zonesGroup: "Zones",
    done_on: "Date",
    product: "Product",
    dose: "Dose",
    quantity_h: "Quantity",
    unit: "Unit",
    cost: "💸 Cost",
    revenue: "💶 Revenue",
    eventPhoto: "📷 Photo",
    confirmDeleteEvent: "Delete this event and its photos? Its expenses are kept.",
    allEvents: "All events →",
    allKinds: "All kinds",
    allZones: "All zones",
    allYears: "All years",
    zonePlantings: "{count} plantings",
    ev_pruning: "Pruning",
    ev_fertilizing: "Fertilizing",
    ev_watering: "Watering",
    ev_treatment: "Treatment",
    ev_sowing: "Sowing",
    ev_harvest: "Harvest",
    ev_grafting: "Grafting",
    ev_problem: "Problem",
    ev_note: "Note",
    ev_removal: "End of crop",
    ev_clearing: "Woodland clearing",
    ev_wood_cutting: "Firewood cutting",
    ev_brushwood: "Branches",
    ev_foraging: "Foraging",
    woodland: "Woodland",
    essences: "Main species",
    essencesHint: "Search a species and choose it, or type a name and press Enter.",
    removeEssence: "Remove",
    what: "What (porcini, chestnuts…)",
    essence: "Species",
    woodBox: "🪵 Wood and woodland harvests",
    u_q: "q",
    u_stere: "steres",
    u_m3: "m³",
    ev_tillage: "Tillage",
    ev_weeding: "Weeding",
    ev_mulching: "Mulching",
    ev_mowing: "Mowing",
    plant_type: "Plant type",
    pt_tree: "Tree",
    pt_fruit_tree: "Fruit tree",
    csvImport: "📥 Import CSV",
    csvTemplate: "📄 CSV template",
    csvTitlePlantings: "Import plantings",
    csvTitleSeeds: "Import seeds",
    csvSummary: "{count} rows, {issues} to check. Fix the highlighted values or untick a row to skip it.",
    csvDo: "Import {count}",
    csvDone: "Imported: {ok}. Errors: {failed}.",
    csvEmpty: "No rows found: is the first line the header?",
    csvUnknownZone: "zone “{value}” not found",
    csvBadDate: "date “{value}” not understood (use dd/mm/yyyy)",
    csvBadNumber: "number “{value}” not understood",
    csvBadChoice: "“{value}” not understood",
    csvMissing: "required",
    csvDuplicate: "already in your list: stays out unless you tick it",
    pt_shrub: "Shrub",
    pt_vine: "Vine, climber",
    pt_vegetable: "Vegetable",
    pt_herb: "Aromatic herb",
    pt_flower: "Flower",
    pt_other: "Other",
    lastYears: "📅 Other years, around now",
    lastTime: "↩️ Last time: {date}",
    monthly: "Month by month",
    yearly: "Year by year",
    byPlanting: "By planting",
    spentEarned: "{spent} spent · {earned} earned",
    ev_planted: "Planted out",
    ev_transplanted: "Transplanted",
    ev_since: "Here for ~{years} years (since ~{year})",
    toggleMap: "Show / hide the map",
    settings: "Settings: weather sensors, reminders",
    ev_review: "Season review",
    rating: "Rating",
    abundance: "Harvest",
    ab_poor: "poor",
    ab_normal: "normal",
    ab_abundant: "abundant",
    keep: "✅ To repeat",
    avoid: "❌ To avoid",
    seasons: "📊 Seasons",
    noSeasons: "No history yet: record sowing, pruning, harvests and a season review.",
    reviewMissing: "⭐ How did {year} go?",
    writeReview: "Season review",
    quickHarvest: "+ Harvest",
    repeat: "🔁 Repeat next year",
    repeated: "Created: {name}",
    weatherSource: "weather: {source}",
    treatments: "{count} treatments",
    u_kg: "kg",
    u_pieces: "pieces",
    u_l: "L",
    moon_new_moon: "New moon",
    moon_waxing_crescent: "Waxing crescent",
    moon_first_quarter: "First quarter",
    moon_waxing_gibbous: "Waxing gibbous",
    moon_full_moon: "Full moon",
    moon_waning_gibbous: "Waning gibbous",
    moon_last_quarter: "Last quarter",
    moon_waning_crescent: "Waning crescent",
    cat_services: "Services and labour",
    cat_sales: "Sales",
    movement: "Type",
    isExpense: "Expense",
    isIncome: "Income",
    expensesTotal: "Expenses",
    incomesTotal: "Income",
    balance: "Balance",
    cropBox: "🌿 Crop data",
    calendar: "Calendar: next two weeks and the year",
    calPlan: "📅 Year plan",
    calNext: "📋 To do in the next two weeks",
    calMore: "and {count} more in the Diary",
    calNoZone: "Without zone",
    calToday: "today",
    calPlants: "{count} plants",
    calTasks: "{count} planned",
    calEvents: "{count} done",
    calWholeZone: "whole zone",
    calGeneral: "General",
    cal_wood: "woodcutting period",
    cal_foraging: "foraging",
    calHistory: "📜 History",
    calPlanned: "planned",
    calWeather: "Weather",
    calNoForecast: "No forecast yet: choose a weather entity in the settings, or allow Open-Meteo.",
    xt_frost: "frost",
    xt_heatwave: "heatwave",
    xt_heat_extreme: "extreme heat",
    xt_hail: "hail",
    xt_heavy_rain: "heavy rain",
    pruning: "Pruning",
    fertilizing: "Fertilizing",
    end: "End of crop",
    family: "Family",
    goodWith: "🤝 Good with",
    badWith: "🚫 Keep away from",
    inGarden: "in your garden",
    cropGraph: "CropGraph data (CC-BY-4.0), dates set on your frosts: last ~{spring}, first ~{fall}",
    cropGraphFallback: "CropGraph data (CC-BY-4.0), dates for typical frosts (mid April, end of October) until your history is known",
    heat_max_c: "Heat limit (°C)",
    cropDefault: "indicative values, temperate climate",
    cropMine: "your values",
    cropMissing: "No crop data for this species.",
    cropEdit: "✏️ Correct",
    cropAdd: "✏️ Add",
    cropReset: "↩️ Built-in values",
    cropTitle: "Crop data: {species}",
    confirmCropReset: "Delete your values and go back to the built-in ones?",
    exposure: "Exposure",
    ex_sun: "☀️ sun",
    ex_partial: "⛅ partial shade",
    ex_shade: "☁️ shade",
    hardiness_c: "Hardiness (lowest °C)",
    hardiness: "❄️ down to {value} °C",
    spacing_cm: "Spacing (cm)",
    spacing: "↔️ {value} cm",
    sow_indoor: "Sow indoors",
    sow_outdoor: "Sow outdoors",
    plant_out: "Plant out",
    flowering: "Flowering",
    harvest: "Harvest",
    thisMonth: "📆 This month",
    sowNow: "🌱 to sow now",
    monthSowIndoor: "🌱 Sow indoors: {names}",
    monthSowOutdoor: "🌱 Sow outdoors: {names}",
    monthPlantOut: "🪴 Plant out: {names}",
    monthHarvest: "🍎 Harvest: {names}",
    goodDay: "✅ good weather",
    better_on: "better on {date}",
    issue_rain_48h: "rain within 48 h",
    issue_wind: "wind",
    issue_hot: "too hot",
    issue_frost_next: "frost in the next days",
    issue_rain_today: "rain that day",
    issue_cold_nights: "cold nights this week",
    issue_heavy_rain: "heavy rain",
    issue_rain_coming: "rain coming",
    issue_frozen: "frozen soil",
    issue_gusts: "strong gusts",
    alertsTitle: "⚠️ Weather alerts",
    al_frost: "❄️ Frost {when}: {value} °C",
    al_cold: "🥶 Cold {when}: {value} °C",
    al_heatwave: "🔥 Heatwave {when}: up to {value} °C",
    al_heat_extreme: "🔥 Extreme heat {when}: {value} °C",
    al_heat_stress: "🥵 Too hot {when}: up to {value} °C",
    tabSeeds: "Seeds",
    addSeed: "New seeds",
    newSeedTitle: "New seeds",
    editSeedTitle: "Seeds",
    emptySeeds: "No seeds yet.",
    year: "Year (packed or harvested)",
    quantity_s: "Quantity (1 packet, 20 g…)",
    viability_years: "Germinate well for (years)",
    viabilityHint: "Empty: typical value for the family ({years} years).",
    finished: "Finished",
    seedsOld: "⚠️ old: germination is dropping (over {years} years)",
    seedsLastYear: "⏳ last good year",
    seed_lot_id: "Seeds used",
    confirmDeleteSeed: "Delete these seeds? Plantings keep their data.",
    shop: "🛒 Shopping list",
    shopAdded: "Added to the shopping list: {item}",
    noShoppingList: "No to-do list for shopping in Home Assistant (add the Shopping list integration).",
    seedsItem: "Seeds: {name}",
    rotationHint: "💡 Rotation: {what} already here in {years} ({names}). Better to wait about 3 years before the same family.",
    rotation: "🔄 Crops in this zone",
    tabExpenses: "Expenses",
    tabTools: "Tools",
    noMap: "No map",
    addExpense: "New expense",
    addTool: "New tool",
    emptyExpenses: "No expenses yet.",
    emptyTools: "No tools yet.",
    newExpenseTitle: "New expense",
    editExpenseTitle: "Edit expense",
    newToolTitle: "New tool",
    editToolTitle: "Edit tool",
    confirmDeleteExpense: "Delete this expense?",
    confirmDeleteTool: "Delete “{name}”? Its expenses are kept.",
    spent_on: "Date",
    amount: "Amount",
    category: "Category",
    supplier: "Supplier",
    planting_id: "Planting",
    tool_id: "Tool",
    brand: "Brand",
    model: "Model",
    purchased_on: "Purchased on",
    power: "Power",
    next_service_on: "Next service",
    price: "Price (added as an expense)",
    cat_plants: "Plants",
    cat_seeds: "Seeds",
    cat_tools: "Tools",
    cat_fertilizers: "Fertilizers",
    cat_treatments: "Treatments",
    cat_water: "Water",
    cat_other: "Other",
    manual: "Manual",
    battery: "Battery",
    petrol: "Petrol",
    electric: "Electric",
    ok: "OK",
    needs_service: "Needs service",
    broken: "Broken",
    serviceDue: "service due since {date}",
    expensesOfPlanting: "Expenses: {total}",
    addExpenseFor: "+ Expense",
    photos: "Photos",
    addPhoto: "📷 Add photo",
    photosAfterSave: "Save the planting first to add photos.",
    uploading: "Uploading…",
    confirmDeletePhoto: "Delete this photo?",
    close: "Close",
    add: "New planting",
    addZone: "New zone",
    empty: "No plantings yet. Press “New planting” and click on the map.",
    emptyZones: "No zones yet. Press “New zone” and click the corners on the map.",
    noPosition: "not on the map",
    notDrawn: "not drawn",
    placeNew: "Click on the map where the new planting is",
    placeExisting: "Click on the map to place “{name}”",
    drawZone: "Click the corners of the zone ({count} points)",
    undoPoint: "Undo point",
    finish: "Finish",
    cancel: "Cancel",
    save: "Save",
    delete: "Delete",
    confirmDelete: "Delete “{name}”? Use the status for a dead plant.",
    confirmDeleteZone: "Delete zone “{name}”? Its sub-zones and plantings move to the parent zone.",
    newTitle: "New planting",
    editTitle: "Edit planting",
    newZoneTitle: "New zone",
    editZoneTitle: "Edit zone",
    dragHint: "Drag the marker to move it.",
    place: "Place on map",
    redraw: "Redraw on map",
    draw: "Draw on map",
    name: "Name",
    species: "Species",
    variety: "Variety",
    kind: "Kind",
    single: "Single plant",
    group: "Group (row, bed)",
    quantity: "Quantity",
    planted_on: "Planted on",
    origin: "Origin",
    existing: "Already there",
    planted: "Planted by me",
    sown: "Sown by me",
    age_now: "Estimated age (years)",
    age_at_planting: "Age when planted (years)",
    sown_on: "Sown on",
    transplanted_on: "Transplanted on",
    ageYears: "~{years} y",
    zone_id: "Zone",
    parent_id: "Inside zone",
    noZone: "—",
    status: "Status",
    active: "Active",
    dead: "Dead",
    removed: "Removed",
    notes: "Notes",
    position: "Position",
    surface: "Surface",
    plantsCount: "🌱 {count}",
    required: "Name and species are required.",
    requiredZone: "The name is required.",
    notLoaded: "HA Homestead is not loaded.",
    vegetable_garden: "Vegetable garden",
    orchard: "Orchard",
    flower_bed: "Flower bed",
    greenhouse: "Greenhouse",
    pots: "Pots",
    lawn: "Lawn",
    other: "Other",
    saved: "Saved: {name}",
    backup: "Backup",
    backupHint: "All plantings, zones, species, expenses and tools in a JSON file (photo files stay in the HA media folder). Home Assistant backups include everything.",
    exportBackup: "Export",
    importBackup: "Restore",
    confirmRestore: "Replace ALL current data with this backup ({date})?\n{summary}\nTip: export the current data first.",
    restored: "Backup restored: {summary}",
    notBackup: "This file is not an HA Homestead backup.",
    summary: "{plantings} plantings, {zones} zones, {taxa} species, {expenses} expenses, {tools} tools",
    deleted: "Deleted: {name}",
    speciesPlaceholder: "Search: apple, Malus domestica…",
    searching: "Searching…",
    noResults: "No species found: the text is kept as it is.",
    offlineSpecies: "GBIF and Wikidata not reachable: only species already imported.",
    importingTaxon: "Importing the species…",
    linked: "Linked to",
    unlink: "Unlink",
    local: "imported",
  },
  it: {
    panelTitle: "Giardino",
    satellite: "Satellite",
    map: "Mappa",
    tabPlantings: "Piante",
    tabZones: "Zone",
    tabDiary: "Diario",
    tabTodo: "📋 Da fare",
    addTask: "+ Attività",
    newTaskTitle: "Pianifica un'attività",
    editTaskTitle: "Attività pianificata",
    due_on: "Quando",
    title: "Titolo (facoltativo)",
    yearly: "Ogni anno",
    nothingToDo: "Niente in programma.",
    done: "Fatto",
    confirmDeleteTask: "Eliminare questa attività?",
    overdue: "in ritardo",
    addEvent: "+ Evento",
    newEventTitle: "Nuovo evento",
    editEventTitle: "Evento del diario",
    emptyDiary: "Ancora niente nel diario.",
    target: "Su",
    plantingsGroup: "Piante",
    zonesGroup: "Zone",
    done_on: "Data",
    product: "Prodotto",
    dose: "Dose",
    quantity_h: "Quantità",
    unit: "Unità",
    cost: "💸 Costo",
    revenue: "💶 Ricavo",
    eventPhoto: "📷 Foto",
    confirmDeleteEvent: "Eliminare questo evento e le sue foto? Le spese restano.",
    allEvents: "Tutti gli eventi →",
    allKinds: "Tutti i tipi",
    allZones: "Tutte le zone",
    allYears: "Tutti gli anni",
    zonePlantings: "{count} piante",
    ev_pruning: "Potatura",
    ev_fertilizing: "Concimazione",
    ev_watering: "Irrigazione",
    ev_treatment: "Trattamento",
    ev_sowing: "Semina",
    ev_harvest: "Raccolta",
    ev_grafting: "Innesto",
    ev_problem: "Problema",
    ev_note: "Nota",
    ev_removal: "Fine coltura",
    ev_clearing: "Pulizia bosco",
    ev_wood_cutting: "Taglio legna",
    ev_brushwood: "Raccolta rami",
    ev_foraging: "Raccolta spontanea",
    woodland: "Bosco",
    essences: "Essenze principali",
    essencesHint: "Cerca una specie e sceglila, oppure scrivi un nome e premi Invio.",
    removeEssence: "Togli",
    what: "Cosa (porcini, castagne…)",
    essence: "Essenza",
    woodBox: "🪵 Legna e raccolti del bosco",
    u_q: "q",
    u_stere: "steri",
    u_m3: "m³",
    ev_tillage: "Lavorazione terreno",
    ev_weeding: "Diserbo",
    ev_mulching: "Pacciamatura",
    ev_mowing: "Sfalcio",
    plant_type: "Tipo di pianta",
    pt_tree: "Albero",
    pt_fruit_tree: "Albero da frutto",
    csvImport: "📥 Importa CSV",
    csvTemplate: "📄 Modello CSV",
    csvTitlePlantings: "Importa piante",
    csvTitleSeeds: "Importa semi",
    csvSummary: "{count} righe, {issues} da controllare. Correggi i valori evidenziati o togli la spunta per saltare una riga.",
    csvDo: "Importa {count}",
    csvDone: "Importate: {ok}. Errori: {failed}.",
    csvEmpty: "Nessuna riga trovata: la prima riga è l'intestazione?",
    csvUnknownZone: "zona “{value}” non trovata",
    csvBadDate: "data “{value}” non capita (usa gg/mm/aaaa)",
    csvBadNumber: "numero “{value}” non capito",
    csvBadChoice: "“{value}” non capito",
    csvMissing: "obbligatorio",
    csvDuplicate: "è già nell'elenco: non verrà importata due volte se resta senza spunta",
    pt_shrub: "Arbusto",
    pt_vine: "Rampicante, vite",
    pt_vegetable: "Ortaggio",
    pt_herb: "Aromatica",
    pt_flower: "Fiore",
    pt_other: "Altro",
    lastYears: "📅 Negli anni scorsi, in questo periodo",
    lastTime: "↩️ L'ultima volta: {date}",
    monthly: "Mese per mese",
    yearly: "Anno per anno",
    byPlanting: "Per pianta",
    spentEarned: "{spent} di spese · {earned} di ricavi",
    ev_planted: "Messa a dimora",
    ev_transplanted: "Trapianto",
    ev_since: "Presente da ~{years} anni (dal ~{year})",
    toggleMap: "Mostra / nascondi la mappa",
    settings: "Impostazioni: sensori meteo, promemoria",
    ev_review: "Bilancio annata",
    rating: "Voto",
    abundance: "Raccolto",
    ab_poor: "scarso",
    ab_normal: "normale",
    ab_abundant: "abbondante",
    keep: "✅ Da rifare",
    avoid: "❌ Da evitare",
    seasons: "📊 Annate",
    noSeasons: "Ancora nessuno storico: registra semina, potature, raccolti e un bilancio d'annata.",
    reviewMissing: "⭐ Com'è andato il {year}?",
    writeReview: "Bilancio annata",
    quickHarvest: "+ Raccolta",
    repeat: "🔁 Ripeti l'anno prossimo",
    repeated: "Creata: {name}",
    weatherSource: "meteo: {source}",
    treatments: "{count} trattamenti",
    u_kg: "kg",
    u_pieces: "pezzi",
    u_l: "L",
    moon_new_moon: "Luna nuova",
    moon_waxing_crescent: "Luna crescente",
    moon_first_quarter: "Primo quarto",
    moon_waxing_gibbous: "Gibbosa crescente",
    moon_full_moon: "Luna piena",
    moon_waning_gibbous: "Gibbosa calante",
    moon_last_quarter: "Ultimo quarto",
    moon_waning_crescent: "Luna calante",
    cat_services: "Servizi e manodopera",
    cat_sales: "Vendite",
    movement: "Tipo",
    isExpense: "Spesa",
    isIncome: "Ricavo",
    expensesTotal: "Spese",
    incomesTotal: "Ricavi",
    balance: "Saldo",
    cropBox: "🌿 Scheda colturale",
    calendar: "Calendario: prossime due settimane e l'anno",
    calPlan: "📅 Programma",
    calNext: "📋 Da fare nelle prossime 2 settimane",
    calMore: "e altre {count} nel Diario",
    calNoZone: "Senza zona",
    calToday: "oggi",
    calPlants: "{count} piante",
    calTasks: "{count} previste",
    calEvents: "{count} fatte",
    calWholeZone: "tutta la zona",
    calGeneral: "Generale",
    cal_wood: "periodo di taglio",
    cal_foraging: "raccolta spontanea",
    calHistory: "📜 Storico",
    calPlanned: "previsto",
    calWeather: "Meteo",
    calNoForecast: "Ancora nessuna previsione: scegli un'entità meteo nelle impostazioni, oppure lascia attivo Open-Meteo.",
    xt_frost: "gelo",
    xt_heatwave: "ondata di calore",
    xt_heat_extreme: "caldo estremo",
    xt_hail: "grandine",
    xt_heavy_rain: "pioggia forte",
    pruning: "Potatura",
    fertilizing: "Concimazione",
    end: "Fine coltura",
    family: "Famiglia",
    goodWith: "🤝 Sta bene con",
    badWith: "🚫 Tenere lontano da",
    inGarden: "nel tuo giardino",
    cropGraph: "Dati CropGraph (CC-BY-4.0), date sulle tue gelate: ultima ~{spring}, prima ~{fall}",
    cropGraphFallback: "Dati CropGraph (CC-BY-4.0), date per gelate tipiche (metà aprile, fine ottobre) finché non c'è il tuo storico",
    heat_max_c: "Limite di caldo (°C)",
    cropDefault: "valori indicativi, clima temperato",
    cropMine: "valori tuoi",
    cropMissing: "Nessun dato colturale per questa specie.",
    cropEdit: "✏️ Correggi",
    cropAdd: "✏️ Aggiungi",
    cropReset: "↩️ Valori di base",
    cropTitle: "Dati colturali: {species}",
    confirmCropReset: "Eliminare i tuoi valori e tornare a quelli di base?",
    exposure: "Esposizione",
    ex_sun: "☀️ sole",
    ex_partial: "⛅ mezz'ombra",
    ex_shade: "☁️ ombra",
    hardiness_c: "Rusticità (minima °C)",
    hardiness: "❄️ fino a {value} °C",
    spacing_cm: "Distanza (cm)",
    spacing: "↔️ {value} cm",
    sow_indoor: "Semina in semenzaio",
    sow_outdoor: "Semina all'aperto",
    plant_out: "Messa a dimora",
    flowering: "Fioritura",
    harvest: "Raccolta",
    thisMonth: "📆 Questo mese",
    sowNow: "🌱 da seminare ora",
    monthSowIndoor: "🌱 Semina in semenzaio: {names}",
    monthSowOutdoor: "🌱 Semina all'aperto: {names}",
    monthPlantOut: "🪴 Messa a dimora: {names}",
    monthHarvest: "🍎 Raccolta: {names}",
    goodDay: "✅ meteo adatto",
    better_on: "meglio il {date}",
    issue_rain_48h: "pioggia entro 48 h",
    issue_wind: "vento",
    issue_hot: "troppo caldo",
    issue_frost_next: "gelo nei prossimi giorni",
    issue_rain_today: "pioggia quel giorno",
    issue_cold_nights: "notti fredde in settimana",
    issue_heavy_rain: "pioggia forte",
    issue_rain_coming: "pioggia in arrivo",
    issue_frozen: "terreno gelato",
    issue_gusts: "raffiche forti",
    alertsTitle: "⚠️ Allerte meteo",
    al_frost: "❄️ Gelo {when}: {value} °C",
    al_cold: "🥶 Freddo {when}: {value} °C",
    al_heatwave: "🔥 Ondata di calore {when}: fino a {value} °C",
    al_heat_extreme: "🔥 Caldo estremo {when}: {value} °C",
    al_heat_stress: "🥵 Troppo caldo {when}: fino a {value} °C",
    tabSeeds: "Semi",
    addSeed: "Nuovi semi",
    newSeedTitle: "Nuovi semi",
    editSeedTitle: "Semi",
    emptySeeds: "Nessun seme in inventario.",
    year: "Anno (confezione o raccolta)",
    quantity_s: "Quantità (1 bustina, 20 g…)",
    viability_years: "Germinano bene per (anni)",
    viabilityHint: "Vuoto: valore tipico della famiglia ({years} anni).",
    finished: "Finiti",
    seedsOld: "⚠️ vecchi: germinabilità in calo (oltre {years} anni)",
    seedsLastYear: "⏳ ultimo anno buono",
    seed_lot_id: "Semi usati",
    confirmDeleteSeed: "Eliminare questi semi? Le piante restano.",
    shop: "🛒 Lista spesa",
    shopAdded: "Aggiunto alla lista della spesa: {item}",
    noShoppingList: "Nessuna lista della spesa in Home Assistant (aggiungi l'integrazione Lista della spesa).",
    seedsItem: "Semi: {name}",
    rotationHint: "💡 Rotazione: {what} già qui nel {years} ({names}). Meglio aspettare circa 3 anni prima della stessa famiglia.",
    rotation: "🔄 Colture in questa zona",
    tabExpenses: "Spese",
    tabTools: "Attrezzi",
    noMap: "Nessuna mappa",
    addExpense: "Nuova spesa",
    addTool: "Nuovo attrezzo",
    emptyExpenses: "Nessuna spesa.",
    emptyTools: "Nessun attrezzo.",
    newExpenseTitle: "Nuova spesa",
    editExpenseTitle: "Modifica spesa",
    newToolTitle: "Nuovo attrezzo",
    editToolTitle: "Modifica attrezzo",
    confirmDeleteExpense: "Eliminare questa spesa?",
    confirmDeleteTool: "Eliminare “{name}”? Le sue spese restano.",
    spent_on: "Data",
    amount: "Importo",
    category: "Categoria",
    supplier: "Fornitore",
    planting_id: "Pianta",
    tool_id: "Attrezzo",
    brand: "Marca",
    model: "Modello",
    purchased_on: "Acquistato il",
    power: "Alimentazione",
    next_service_on: "Prossima manutenzione",
    price: "Prezzo (diventa una spesa)",
    cat_plants: "Piante",
    cat_seeds: "Semi",
    cat_tools: "Attrezzi",
    cat_fertilizers: "Concimi",
    cat_treatments: "Trattamenti",
    cat_water: "Acqua",
    cat_other: "Altro",
    manual: "Manuale",
    battery: "Batteria",
    petrol: "Benzina",
    electric: "Elettrico",
    ok: "OK",
    needs_service: "Da manutenere",
    broken: "Rotto",
    serviceDue: "manutenzione dal {date}",
    expensesOfPlanting: "Spese: {total}",
    addExpenseFor: "+ Spesa",
    photos: "Foto",
    addPhoto: "📷 Aggiungi foto",
    photosAfterSave: "Salva prima la pianta per aggiungere foto.",
    uploading: "Carico…",
    confirmDeletePhoto: "Eliminare questa foto?",
    close: "Chiudi",
    add: "Nuova pianta",
    addZone: "Nuova zona",
    empty: "Nessuna pianta. Premi “Nuova pianta” e clicca sulla mappa.",
    emptyZones: "Nessuna zona. Premi “Nuova zona” e clicca gli angoli sulla mappa.",
    noPosition: "non sulla mappa",
    notDrawn: "non disegnata",
    placeNew: "Clicca sulla mappa dove si trova la nuova pianta",
    placeExisting: "Clicca sulla mappa per posizionare “{name}”",
    drawZone: "Clicca gli angoli della zona ({count} punti)",
    undoPoint: "Togli punto",
    finish: "Fine",
    cancel: "Annulla",
    save: "Salva",
    delete: "Elimina",
    confirmDelete: "Eliminare “{name}”? Per una pianta morta usa lo stato.",
    confirmDeleteZone: "Eliminare la zona “{name}”? Sottozone e piante passano alla zona padre.",
    newTitle: "Nuova pianta",
    editTitle: "Modifica pianta",
    newZoneTitle: "Nuova zona",
    editZoneTitle: "Modifica zona",
    dragHint: "Trascina il segnaposto per spostarlo.",
    place: "Posiziona sulla mappa",
    redraw: "Ridisegna sulla mappa",
    draw: "Disegna sulla mappa",
    name: "Nome",
    species: "Specie",
    variety: "Varietà",
    kind: "Tipo",
    single: "Pianta singola",
    group: "Gruppo (fila, aiuola)",
    quantity: "Quantità",
    planted_on: "Messa a dimora",
    origin: "Origine",
    existing: "Già presente",
    planted: "Piantata da me",
    sown: "Seminata da me",
    age_now: "Età stimata (anni)",
    age_at_planting: "Età all'impianto (anni)",
    sown_on: "Semina",
    transplanted_on: "Trapianto",
    ageYears: "~{years} anni",
    zone_id: "Zona",
    parent_id: "Dentro la zona",
    noZone: "—",
    status: "Stato",
    active: "Attiva",
    dead: "Morta",
    removed: "Rimossa",
    notes: "Note",
    position: "Posizione",
    surface: "Superficie",
    plantsCount: "🌱 {count}",
    required: "Nome e specie sono obbligatori.",
    requiredZone: "Il nome è obbligatorio.",
    notLoaded: "HA Homestead non è caricato.",
    vegetable_garden: "Orto",
    orchard: "Frutteto",
    flower_bed: "Aiuola fiori",
    greenhouse: "Serra",
    pots: "Vasi",
    lawn: "Prato",
    other: "Altro",
    saved: "Salvato: {name}",
    backup: "Backup",
    backupHint: "Tutte le piante, zone, specie, spese e attrezzi in un file JSON (i file delle foto restano nella cartella media di HA). I backup di Home Assistant includono tutto.",
    exportBackup: "Esporta",
    importBackup: "Ripristina",
    confirmRestore: "Sostituire TUTTI i dati attuali con questo backup ({date})?\n{summary}\nConsiglio: esporta prima i dati attuali.",
    restored: "Backup ripristinato: {summary}",
    notBackup: "Questo file non è un backup di HA Homestead.",
    summary: "{plantings} piante, {zones} zone, {taxa} specie, {expenses} spese, {tools} attrezzi",
    deleted: "Eliminato: {name}",
    speciesPlaceholder: "Cerca: melo, Malus domestica…",
    searching: "Cerco…",
    noResults: "Nessuna specie trovata: il testo resta così com'è.",
    offlineSpecies: "GBIF e Wikidata non raggiungibili: solo specie già importate.",
    importingTaxon: "Importo la specie…",
    linked: "Collegata a",
    unlink: "Scollega",
    local: "importata",
  },
};

const EXPENSE_CATEGORIES = ["plants", "seeds", "tools", "fertilizers", "treatments", "water", "services", "sales", "other"];
const EVENT_ICONS = {
  pruning: "✂️",
  fertilizing: "🌿",
  watering: "💧",
  treatment: "🧪",
  sowing: "🌱",
  harvest: "🍎",
  grafting: "🔀",
  problem: "🐛",
  note: "📝",
  removal: "🏁",
  review: "⭐",
  tillage: "⛏️",
  weeding: "🧤",
  mulching: "🍂",
  mowing: "🌾",
  clearing: "🧹",
  wood_cutting: "🪓",
  brushwood: "🪵",
  foraging: "🍄",
};
const WOOD_KINDS = ["clearing", "wood_cutting", "brushwood", "foraging"];
// Garden kinds that still make sense in a woodland.
const WOODLAND_ALSO = ["pruning", "treatment", "problem", "note"];
const QUANTITY_UNITS = {
  harvest: ["kg", "pieces", "l"],
  foraging: ["kg", "pieces", "l"],
  wood_cutting: ["q", "stere", "m3"],
  brushwood: ["q", "stere", "m3", "pieces"],
};
// Kinds with a "product" field, and its label.
const PRODUCT_LABEL = { fertilizing: "product", treatment: "product", foraging: "what", wood_cutting: "essence" };
const PLANT_ICONS = { tree: "🌳", fruit_tree: "🍎", shrub: "🍃", vine: "🍇", vegetable: "🥕", herb: "🌿", flower: "🌸", other: "🌱" };
// Years seeds usually keep germinating well, by botanical family (default 3).
const SEED_VIABILITY = {
  Solanaceae: 4,
  Brassicaceae: 4,
  Cucurbitaceae: 5,
  Fabaceae: 3,
  Apiaceae: 2,
  Amaryllidaceae: 2,
  Asteraceae: 4,
  Amaranthaceae: 4,
  Lamiaceae: 4,
  Poaceae: 2,
  Malvaceae: 3,
};
const ROTATION_YEARS = 3;
const ZONE_ICONS = { vegetable_garden: "🥕", orchard: "🍎", flower_bed: "🌸", greenhouse: "🏠", pots: "🪴", lawn: "🌾", woodland: "🌲", other: "▭" };
// Typical work of a whole zone, shown on the calendar when the zone itself has no plantings.
const ZONE_SEASONS = { woodland: [["wood", [11, 12, 1, 2, 3]], ["foraging", [9, 10, 11]]] };
const CAL_COLOR = { wood: "#6d4c41", foraging: "#8e7cc3" };
const CROP_MONTHS = ["sow_indoor", "sow_outdoor", "plant_out", "flowering", "harvest", "pruning", "fertilizing", "end"];
const CROP_COLOR = {
  sow_indoor: "#8d6e63",
  sow_outdoor: "#7cb342",
  plant_out: "#26a69a",
  flowering: "#ec407a",
  harvest: "#ffa000",
  pruning: "#5c6bc0",
  fertilizing: "#9e9d24",
  end: "#757575",
};
// Plant type proposed for a new planting from the kind of its zone.
const ZONE_PLANT_TYPE = { orchard: "fruit_tree", vegetable_garden: "vegetable", greenhouse: "vegetable", flower_bed: "flower" };
// Start of a planting, shown in the diary from its own dates (not stored as events).
const START_ICONS = { sowing: "🌱", planted: "🪴", since: "🌳" };
const MOON_ICONS = {
  new_moon: "🌑",
  waxing_crescent: "🌒",
  first_quarter: "🌓",
  waxing_gibbous: "🌔",
  full_moon: "🌕",
  waning_gibbous: "🌖",
  last_quarter: "🌗",
  waning_crescent: "🌘",
};
const TOOL_POWER = ["manual", "battery", "petrol", "electric"];
const TOOL_STATUS_COLOR = { ok: "#43a047", needs_service: "#ffa600", broken: "#e53935" };
const PHOTO_MAX_PX = 1600;
const STATUS_COLOR = { active: "#43a047", dead: "#e53935", removed: "#9e9e9e" };
const ZONE_COLOR = "#ffca28";

const h = (tag, attrs = {}, ...children) => {
  const el = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (value === undefined || value === null || value === false) continue;
    if (key.startsWith("on")) el.addEventListener(key.slice(2), value);
    else if (key in el) el[key] = value;
    else el.setAttribute(key, value === true ? "" : value);
  }
  el.append(...children.flat().filter((c) => c !== null && c !== undefined && c !== false));
  return el;
};

const STYLE = `
  :host { display: block; height: 100%; background: var(--primary-background-color); color: var(--primary-text-color); }
  /* HA gives custom panels no definite height: size on the viewport instead of 100%. */
  .layout { display: flex; flex-direction: column; height: 100vh; height: 100dvh; }
  header { display: flex; align-items: center; gap: 8px; height: var(--header-height, 56px); padding: 0 12px;
    background: var(--app-header-background-color, var(--primary-color)); color: var(--app-header-text-color, #fff);
    box-sizing: border-box; flex: none; }
  header h1 { font-size: 20px; font-weight: 400; margin: 0; flex: 1; }
  .body { flex: 1; display: flex; min-height: 0; }
  .map { flex: 1; min-width: 0; position: relative; }
  .map.placing .leaflet-container { cursor: crosshair; }
  aside { width: 440px; max-width: 45%; flex: none; overflow-y: auto; border-left: 1px solid var(--divider-color);
    background: var(--card-background-color); box-sizing: border-box; padding: 12px; }
  .narrow .body { flex-direction: column; }
  .narrow .map { flex: 0 0 33%; min-height: 0; }
  .narrow aside { width: auto; max-width: none; height: auto; flex: 1; border-left: none; border-top: 1px solid var(--divider-color); }
  .no-map .map { display: none; }
  .no-map aside { width: auto; max-width: none; flex: 1; border: none; }
  .map-toggle { background: none; border: none; color: inherit; font-size: 20px; padding: 4px 8px; }
  .event.start { opacity: .85; }
  .banner { position: absolute; z-index: 1000; top: 10px; left: 50%; transform: translateX(-50%);
    background: var(--primary-color); color: var(--text-primary-color, #fff); padding: 8px 12px; border-radius: 8px;
    display: flex; gap: 8px; align-items: center; flex-wrap: wrap; justify-content: center;
    box-shadow: 0 2px 6px rgba(0,0,0,.3); width: max-content; max-width: 90%; }
  button { font: inherit; cursor: pointer; border-radius: 6px; padding: 6px 12px; border: 1px solid var(--divider-color);
    background: var(--card-background-color); color: var(--primary-text-color); }
  button:disabled { opacity: .5; cursor: default; }
  button.primary { background: var(--primary-color); color: var(--text-primary-color, #fff); border-color: transparent; }
  button.danger { color: var(--error-color, #db4437); }
  .banner button { background: transparent; color: inherit; border-color: currentColor; }
  .tabs-bar { display: flex; gap: 2px; padding: 0 12px; flex: none; overflow-x: auto; scrollbar-width: none;
    background: var(--card-background-color); border-bottom: 1px solid var(--divider-color); }
  .tabs-bar button { border: none; border-bottom: 3px solid transparent; border-radius: 0; background: none; flex: none;
    padding: 11px 14px 8px; font-size: 15px; color: var(--secondary-text-color); }
  .tabs-bar button.active { border-bottom-color: var(--homestead-accent, #3a7d44); color: var(--homestead-accent, #3a7d44); font-weight: 700; }
  .tabs { display: flex; gap: 4px; margin-bottom: 12px; border-bottom: 1px solid var(--divider-color); }
  .tabs { overflow-x: auto; scrollbar-width: none; }
  .tabs button { border: none; border-bottom: 2px solid transparent; border-radius: 0; background: none; flex: 1 0 auto;
    padding: 6px 8px; font-size: 14px; }
  .tabs button.active { border-bottom-color: var(--primary-color); color: var(--primary-color); font-weight: 500; }
  .actions { display: flex; gap: 8px; flex-wrap: wrap; }
  ul { list-style: none; padding: 0; margin: 12px 0 0; }
  li { padding: 8px; border-radius: 6px; cursor: pointer; display: flex; gap: 8px; align-items: center; }
  li:hover, li.selected { background: var(--secondary-background-color); }
  li .dot { width: 10px; height: 10px; border-radius: 50%; flex: none; }
  li .swatch { width: 12px; height: 12px; border-radius: 2px; flex: none; border: 2px solid ${ZONE_COLOR}; }
  li .main { flex: 1; min-width: 0; }
  .sub { font-size: 12px; color: var(--secondary-text-color); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .warn { color: var(--warning-color, #ffa600); }
  form { display: grid; gap: 10px; }
  h2 { margin: 0; font-size: 18px; font-weight: 500; }
  label { display: grid; gap: 4px; font-size: 13px; color: var(--secondary-text-color); }
  input, select, textarea { font: inherit; padding: 6px 8px; border-radius: 6px; border: 1px solid var(--divider-color);
    background: var(--primary-background-color); color: var(--primary-text-color); min-width: 0; }
  .row { display: flex; gap: 8px; flex-wrap: wrap; }
  .row > * { flex: 1; }
  .hint, .error, .info { font-size: 13px; margin: 0 0 8px; }
  .hint { color: var(--secondary-text-color); }
  .error { color: var(--error-color, #db4437); }
  .info { color: var(--success-color, #43a047); }
  .import-row { display: grid; gap: 6px; padding: 8px 0; border-bottom: 1px solid var(--divider-color); }
  .import-row .head { display: flex; gap: 6px; align-items: center; font-size: 12px; color: var(--secondary-text-color); cursor: pointer; }
  .species { position: relative; }
  .suggest { position: absolute; z-index: 10; left: 0; right: 0; top: 100%; margin-top: 2px; max-height: 260px;
    overflow-y: auto; background: var(--card-background-color); border: 1px solid var(--divider-color);
    border-radius: 6px; box-shadow: 0 4px 10px rgba(0,0,0,.25); }
  .suggest button { display: block; width: 100%; text-align: left; border: none; border-radius: 0; padding: 6px 10px; }
  .suggest button:hover, .suggest button:focus { background: var(--secondary-background-color); }
  .suggest .msg { padding: 8px 10px; font-size: 13px; color: var(--secondary-text-color); }
  .taxon { display: flex; gap: 8px; align-items: center; font-size: 13px; color: var(--secondary-text-color); }
  .taxon button { padding: 0 8px; font-size: 12px; }
  .dates { display: grid; gap: 10px; }
  .dates [hidden] { display: none; }
  form + .taxon { margin-top: 16px; }
  .stars { display: flex; gap: 4px; }
  .star { font-size: 26px; line-height: 1; padding: 0 4px; border: none; background: none; color: var(--disabled-text-color, #bbb); }
  .star.on, .stars-read { color: #ffb300; }
  .review { display: grid; gap: 10px; }
  .weather { color: var(--secondary-text-color); }
  .seasons { margin-top: 16px; display: grid; gap: 8px; }
  .season { padding: 8px 10px; border-radius: 6px; border: 1px solid var(--divider-color); display: grid; gap: 3px; }
  .season.current { border-color: var(--primary-color); }
  .season-head { display: flex; gap: 8px; align-items: baseline; flex-wrap: wrap; }
  .review-ask { border-color: #ffb300; text-align: left; }
  .todo { display: grid; gap: 4px; margin: 12px 0; }
  .task { display: flex; gap: 6px; align-items: stretch; }
  .task .tick { flex: none; width: 36px; padding: 0; color: var(--success-color, #43a047); font-size: 18px; }
  .task-main { flex: 1; display: grid; gap: 2px; text-align: left; }
  .task.late .sub { color: var(--error-color, #db4437); }
  .check { display: flex; gap: 8px; align-items: center; color: var(--primary-text-color); }
  .income { color: var(--success-color, #43a047); }
  .kinds { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; }
  .kinds button { display: grid; justify-items: center; gap: 2px; padding: 6px 2px; font-size: 12px; }
  .kinds button span { font-size: 22px; }
  .kinds button.active { border-color: var(--primary-color); background: var(--secondary-background-color); font-weight: 500; }
  .date-moon { align-items: end; }
  .filters { margin-top: 8px; }
  .filters select { flex: 1 1 100px; min-width: 100px; }
  .diary-box { margin-top: 16px; }
  .diary-box .header { align-items: center; justify-content: space-between; }
  .diary-box .header > * { flex: none; }
  .timeline { display: grid; gap: 10px; margin-top: 8px; }
  .day { display: grid; gap: 2px; }
  .event { display: flex; gap: 8px; align-items: flex-start; text-align: left; border: none; padding: 6px; background: none; }
  .event:hover { background: var(--secondary-background-color); }
  .event .icon { font-size: 18px; }
  .event .main { display: grid; gap: 2px; }
  [hidden] { display: none !important; }
  .summary { margin: 12px 0; padding: 8px 10px; border-radius: 6px; background: var(--secondary-background-color); }
  h3 { margin: 8px 0 6px; font-size: 14px; font-weight: 500; }
  .photos { display: grid; grid-template-columns: repeat(auto-fill, minmax(90px, 1fr)); gap: 6px; margin-bottom: 8px; }
  .thumb { padding: 0; border: none; background: none; display: grid; gap: 2px; font-size: 11px; color: var(--secondary-text-color); }
  .thumb img { width: 100%; aspect-ratio: 1; object-fit: cover; border-radius: 6px; background: var(--secondary-background-color); }
  .lightbox { position: fixed; inset: 0; z-index: 2000; background: rgba(0,0,0,.85); display: flex; flex-direction: column;
    align-items: center; justify-content: center; gap: 12px; padding: 16px; box-sizing: border-box; color: #fff; }
  .lightbox img { max-width: 100%; max-height: 80vh; object-fit: contain; border-radius: 6px; }
  .lightbox .row { align-items: center; flex: none; }
  .backup { margin-top: 24px; padding-top: 12px; border-top: 1px solid var(--divider-color); }
  .backup h3 { margin: 0 0 4px; font-size: 14px; font-weight: 500; }
  .pin { width: 18px; height: 18px; border-radius: 50%; border: 3px solid #fff; box-sizing: border-box;
    box-shadow: 0 0 4px rgba(0,0,0,.6); }
  .pin.selected { width: 26px; height: 26px; border-color: #ffeb3b; }
  .pin.icon { width: 28px; height: 28px; display: grid; place-items: center; font-size: 15px; line-height: 1;
    background: var(--card-background-color, #fff) !important; border-width: 3px; }
  .pin.icon.selected { width: 36px; height: 36px; font-size: 20px; }
  li .badge { width: 24px; height: 24px; border-radius: 50%; border: 2px solid; box-sizing: border-box; flex: none;
    display: grid; place-items: center; font-size: 13px; line-height: 1; }
  .last-time { font-size: 13px; color: var(--secondary-text-color); }
  .balance-table { display: grid; grid-template-columns: auto 1fr 1fr; gap: 2px 12px; font-size: 13px; margin-top: 6px; }
  .balance-table .num { text-align: right; }
  .crop-months { display: grid; grid-template-columns: minmax(90px, auto) repeat(12, 1fr); gap: 2px; font-size: 11px;
    align-items: center; margin-top: 6px; }
  .crop-months .m { text-align: center; color: var(--secondary-text-color); }
  .crop-months .cell { height: 12px; border-radius: 2px; background: var(--secondary-background-color); }
  .crop-months .cell.now { outline: 1px solid var(--primary-text-color); }
  .crop-months button.cell { height: 22px; border: none; padding: 0; }
  .suggest button { display: flex; gap: 8px; align-items: center; }
  .suggest img, .taxon img { width: 40px; height: 40px; object-fit: cover; border-radius: 4px; flex: none;
    background: var(--secondary-background-color); }
  .csv-row { border: 1px solid var(--divider-color); border-radius: 6px; padding: 8px; display: grid; gap: 6px; }
  .csv-row.issue { border-color: var(--warning-color, #ffa600); }
  .csv-row.off { opacity: .5; }
  .csv-row .err { font-size: 12px; color: var(--warning-color, #ffa600); }
  .csv-list { display: grid; gap: 8px; margin: 12px 0; }
  .calendar { flex: 1; min-width: 0; overflow: auto; padding: 10px; box-sizing: border-box; display: none;
    background: var(--primary-background-color); }
  .calendar-on .calendar { display: block; }
  .calendar-on .map { display: none; }
  .narrow.calendar-on .calendar { flex: 0 0 60%; }
  .cal-box { background: var(--card-background-color); border: 1px solid var(--divider-color); border-radius: 10px;
    padding: 10px 12px; margin-bottom: 10px; display: grid; gap: 8px; }
  .cal-head { display: flex; align-items: center; gap: 8px; }
  .cal-head h3 { flex: 1; margin: 0; font-size: 16px; font-weight: 700; }
  .cal-head .tabs { flex: 1; margin: 0; }
  .action-cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(210px, 1fr)); gap: 8px; }
  .action-card { display: flex; border: 2px solid var(--divider-color); border-radius: 10px; background: var(--card-background-color); }
  .action-card.good { border-color: #2f7d32; background: rgba(47, 125, 50, .07); }
  .action-card.warn { border-color: #e69100; background: rgba(230, 145, 0, .08); }
  .action-card.late { border-color: #b3261e; background: rgba(179, 38, 30, .07); }
  .action-main { flex: 1; min-width: 0; text-align: left; border: none; background: none; display: grid; gap: 2px; padding: 8px 10px; }
  .action-date { font-size: 12px; font-weight: 700; color: var(--secondary-text-color); }
  .action-title { font-size: 15px; font-weight: 700; }
  .action-verdict { font-size: 12px; }
  .action-card.warn .action-verdict { color: #8a4b00; }
  .action-card.good .action-verdict { color: #1f5e24; }
  .action-card.late .action-verdict { color: #8c1d15; font-weight: 700; }
  .action-card .tick { border: none; background: none; width: 44px; color: #2f7d32; font-size: 18px; border-radius: 0 8px 8px 0; }
  .alert-line { font-size: 13px; background: #fff4e0; color: #6b3e00; border-radius: 8px; padding: 6px 10px; }
  .wx-strip { display: flex; gap: 4px; overflow-x: auto; }
  .wx-day { flex: 1 0 42px; display: grid; justify-items: center; font-size: 12px; padding: 4px 2px; border-radius: 6px;
    background: var(--secondary-background-color); }
  .wx-day.alert { box-shadow: inset 0 0 0 2px var(--warning-color, #ffa600); }
  .timeline-grid { position: relative; --lab: 208px; }
  .narrow .timeline-grid { --lab: 128px; }
  .tl-row { display: grid; grid-template-columns: calc(var(--lab) - 8px) minmax(0, 1fr); column-gap: 8px; align-items: center; }
  .tl-track { position: relative; height: 30px; border-bottom: 1px solid var(--divider-color); }
  .tl-months .tl-track { height: 20px; border: none; }
  .tl-month { position: absolute; top: 2px; font-size: 11px; color: var(--secondary-text-color); padding-left: 3px;
    border-left: 1px solid var(--divider-color); }
  .tl-label { text-align: left; border: none; background: none; padding: 4px 4px 4px 22px; font-size: 13px; white-space: nowrap;
    overflow: hidden; text-overflow: ellipsis; border-radius: 4px; }
  .tl-label.static { color: var(--secondary-text-color); padding-left: 4px; }
  .tl-group { grid-column: 1 / -1; display: flex; gap: 8px; align-items: center; width: 100%; text-align: left; margin-top: 8px;
    border: none; border-radius: 6px; padding: 6px 8px; background: var(--secondary-background-color); font-size: 14px; }
  .tl-arrow { width: 14px; }
  .tl-band { position: absolute; height: 5px; border-radius: 3px; }
  .tl-pill { position: absolute; transform: translateX(-50%); z-index: 2; white-space: nowrap; font-size: 11px;
    font-weight: 700; color: #fff; background: #c0522f; border: 2px solid var(--card-background-color); border-radius: 11px;
    padding: 1px 7px; box-shadow: 0 1px 3px rgba(0, 0, 0, .3); }
  .tl-pill.warn { background: #a35c00; }
  .tl-pill.late { background: #b3261e; }
  .tl-pill-sample { display: inline-block; width: 22px; height: 10px; border-radius: 5px; background: #c0522f; margin-right: 4px; }
  .tl-mark { position: absolute; top: 50%; transform: translateY(-50%); font-size: 14px; border: none; border-bottom: 3px solid transparent;
    background: none; padding: 0; line-height: 1; white-space: nowrap; }
  .tl-mark.event { transform: translate(-50%, -50%); }
  .tl-today { position: absolute; top: 18px; bottom: 0; width: 2px; background: #1d4fd8; pointer-events: none; z-index: 3;
    left: calc(var(--lab) + (100% - var(--lab)) * var(--x)); }
  .tl-today span { position: absolute; top: -16px; left: 50%; transform: translateX(-50%); font-size: 10px; font-weight: 700;
    color: #fff; background: #1d4fd8; border-radius: 4px; padding: 0 5px; }
  .legend { margin-bottom: 6px; }
  .legend i { display: inline-block; width: 12px; height: 6px; border-radius: 2px; margin-right: 4px; }
  .chips { display: flex; flex-wrap: wrap; gap: 6px; }
  .chip { display: inline-flex; gap: 4px; align-items: center; padding: 2px 4px 2px 10px; border-radius: 14px; font-size: 13px;
    background: var(--secondary-background-color); color: var(--primary-text-color); }
  .chip button { border: none; background: none; padding: 0 6px; font-size: 14px; }
`;

class HomesteadPanel extends HTMLElement {
  constructor() {
    super();
    this._data = { plantings: [], zones: [], taxa: [], expenses: [], tools: [], photos: [], events: [], tasks: [], seeds: [], crops: [] };
    this._cropDefaults = {};
    this._diaryFilter = { kind: "", zone: "", year: "" };
    this._photoUrls = new Map();
    this._taxaPending = new Map();
    this._markers = new Map();
    this._polygons = new Map();
    this._tab = "plantings";
    this._selected = null;
    this._placing = null;
    this._drawing = null;
    this._form = null;
    this._zoneForm = null;
    this._message = { text: "", error: false };
  }

  set hass(hass) {
    const first = !this._hass;
    this._hass = hass;
    if (first) this._init();
    if (this._menu) this._menu.hass = hass;
  }

  set narrow(narrow) {
    this._narrow = narrow;
    if (this._menu) this._menu.narrow = narrow;
    this._layout?.classList.toggle("narrow", !!narrow);
    this._map?.invalidateSize();
  }

  t(key, vars = {}) {
    const lang = this._lang();
    const text = (TEXT[lang] || TEXT.en)[key] ?? TEXT.en[key] ?? key;
    return text.replace(/\{(\w+)\}/g, (_, name) => vars[name] ?? "");
  }

  // ---------- setup ----------

  _init() {
    const root = this.attachShadow({ mode: "open" });
    this._menu = h("ha-menu-button");
    this._menu.hass = this._hass;
    this._menu.narrow = this._narrow;
    this._mapEl = h("div", { style: "position:absolute;inset:0" });
    this._mapWrap = h("div", { className: "map" }, this._mapEl);
    this._fileInput = h("input", {
      type: "file",
      accept: ".json,application/json",
      hidden: true,
      onchange: (ev) => this._restoreBackup(ev.target),
    });
    this._messageEl = h("p");
    this._content = h("div");
    this._aside = h("aside", {}, this._messageEl, this._content, this._fileInput);
    this._layout = h(
      "div",
      { className: `layout${this._narrow ? " narrow" : ""}` },
      h(
        "header",
        {},
        this._menu,
        h("h1", {}, this.t("panelTitle")),
        h("button", { className: "map-toggle", title: this.t("calendar"), onclick: () => this._toggleCalendar() }, "📅"),
        h("button", { className: "map-toggle", title: this.t("toggleMap"), onclick: () => this._toggleMap() }, "🗺️"),
        h(
          "button",
          {
            className: "map-toggle",
            title: this.t("settings"),
            onclick: () => {
              history.pushState(null, "", "/config/integrations/integration/homestead");
              window.dispatchEvent(new CustomEvent("location-changed"));
            },
          },
          "⚙️",
        ),
      ),
      (this._tabsEl = h("nav", { className: "tabs-bar" })),
      h("div", { className: "body" }, this._mapWrap, (this._calWrap = h("div", { className: "calendar" })), this._aside),
    );
    root.append(
      h("link", { rel: "stylesheet", href: `${BASE}vendor/leaflet.css` }),
      h("style", {}, STYLE),
      this._layout,
    );
    this._createMap();
    try {
      if (localStorage.getItem("homestead-map-hidden")) this._toggleMap(true);
      if (localStorage.getItem("homestead-calendar")) this._toggleCalendar(true);
    } catch {
      // storage unavailable: the map stays visible
    }
    this._render();
    if (this.isConnected) this._subscribe();
  }

  _toggleMap(hidden = !this._layout.classList.contains("no-map")) {
    this._layout.classList.toggle("no-map", hidden);
    if (hidden && this._calendarOn) this._toggleCalendar(false);
    try {
      localStorage.setItem("homestead-map-hidden", hidden ? "1" : "");
    } catch {
      // private mode: the choice is just not remembered
    }
    if (!hidden) setTimeout(() => this._map.invalidateSize(), 0);
  }

  _createMap() {
    const { latitude, longitude } = this._hass.config;
    const satellite = L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      {
        maxZoom: 23,
        maxNativeZoom: 19,
        attribution: "Tiles © Esri — Esri, Maxar, Earthstar Geographics, GIS User Community",
      },
    );
    const streets = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 23,
      maxNativeZoom: 19,
      // OSM tile servers answer 403 without a Referer, and HA strips it from cross-site requests.
      referrerPolicy: "origin",
      attribution: "© OpenStreetMap contributors",
    });
    // Without tiles the map can zoom further: a plan of a single bed.
    const blank = L.layerGroup();
    this._map = L.map(this._mapEl, { center: [latitude, longitude], zoom: 18, maxZoom: 23, layers: [satellite] });
    L.control
      .layers({ [this.t("satellite")]: satellite, [this.t("map")]: streets, [this.t("noMap")]: blank })
      .addTo(this._map);
    L.circleMarker([latitude, longitude], { radius: 5, color: "#2196f3", interactive: false }).addTo(this._map);
    this._zoneLayer = L.layerGroup().addTo(this._map);
    this._previewLayer = L.layerGroup().addTo(this._map);
    this._map.on("click", (ev) => this._mapClick(ev.latlng));
    new ResizeObserver(() => this._map.invalidateSize()).observe(this._mapWrap);
  }

  connectedCallback() {
    if (this._hass && !this._unsub) this._subscribe();
  }

  disconnectedCallback() {
    this._unsub?.then((unsub) => unsub()).catch(() => {});
    this._unsub = null;
    this._outlookUnsub?.then((unsub) => unsub?.()).catch(() => {});
    this._outlookUnsub = null;
  }

  _subscribe() {
    let first = true;
    this._outlookUnsub = this._hass.connection
      .subscribeMessage(
        (outlook) => {
          this._outlook = outlook;
          this._renderCalendar();
          if (this._tab === "diary" && !this._eventForm && !this._taskForm) this._render();
        },
        { type: "homestead/outlook/subscribe" },
      )
      .catch(() => {});
    this._hass
      .callWS({ type: "homestead/crops/defaults" })
      .then((result) => {
        this._cropDefaults = result.crops || {};
        if (!this._form && !this._eventForm && !this._taskForm && !this._zoneForm && !this._expenseForm && !this._toolForm && !this._seedForm && !this._cropForm && !this._import) this._render();
        else if (this._cropEl && this._form) this._cropEl.replaceChildren(...[this._cropBox(this._form)].filter(Boolean));
      })
      .catch(() => {});
    this._unsub = this._hass.connection.subscribeMessage(
      (data) => {
        this._data = {
          plantings: data.plantings || [],
          zones: data.zones || [],
          taxa: data.taxa || [],
          expenses: data.expenses || [],
          tools: data.tools || [],
          seeds: data.seeds || [],
          crops: data.crops || [],
          photos: data.photos || [],
          events: data.events || [],
          tasks: data.tasks || [],
        };
        this._loaded = !!data.plantings;
        this._syncMap();
        this._renderCalendar();
        if (first) this._fitAll();
        first = false;
        if (window.location.search.includes("task=")) {
          this._openTaskFromUrl();
          if (this._eventForm) return;
        }
        if (this._form) this._refreshForm();
        else if (this._zoneForm) {
          this._refreshDiaryBox();
          const zone = this._zone(this._zoneForm.id);
          if (this._woodEl && zone) this._woodEl.replaceChildren(...[this._woodBox(zone)].filter(Boolean));
        }
        else if (this._eventForm) this._fillEventPhotos();
        else if (this._taskForm) return;
        else if (!this._expenseForm && !this._toolForm && !this._seedForm && !this._cropForm && !this._import) this._render();
      },
      { type: "homestead/subscribe" },
    );
  }

  // ---------- data helpers ----------

  _planting(id) {
    return this._data.plantings.find((p) => p.id === id);
  }

  _taxon(id) {
    return this._data.taxa.find((t) => t.id === id) || this._taxaPending.get(id);
  }

  _lang() {
    return (this._hass.locale?.language || this._hass.language || "en").split("-")[0];
  }

  _zone(id) {
    return this._data.zones.find((z) => z.id === id);
  }

  _zonePath(id) {
    const names = [];
    for (let z = this._zone(id), guard = 0; z && guard < 20; z = this._zone(z.parent_id), guard++) names.unshift(z.name);
    return names.join(" › ");
  }

  _zoneDescendants(id) {
    const out = new Set();
    const walk = (parent) =>
      this._data.zones.filter((z) => z.parent_id === parent && !out.has(z.id)).forEach((z) => (out.add(z.id), walk(z.id)));
    walk(id);
    return out;
  }

  _zoneOptions(exclude = new Set()) {
    return [
      ["", this.t("noZone")],
      ...this._data.zones
        .filter((z) => !exclude.has(z.id))
        .map((z) => [z.id, this._zonePath(z.id)])
        .sort((a, b) => a[1].localeCompare(b[1])),
    ];
  }

  _zoneAt(lat, lng, extra = []) {
    const candidates = [...this._data.zones, ...extra].filter(
      (z) => z.geometry && containsPoint(z.geometry, lng, lat),
    );
    candidates.sort((a, b) => (a.area_m2 ?? Infinity) - (b.area_m2 ?? Infinity));
    return candidates[0]?.id ?? null;
  }

  _fitAll() {
    const bounds = L.latLngBounds([]);
    this._data.plantings.forEach((p) => hasPosition(p) && bounds.extend([p.latitude, p.longitude]));
    this._polygons.forEach((polygon) => bounds.extend(polygon.getBounds()));
    if (bounds.isValid()) this._map.fitBounds(bounds, { padding: [40, 40], maxZoom: 19 });
  }

  // ---------- map layers ----------

  _syncMap() {
    this._syncZones();
    this._syncMarkers();
  }

  _syncZones() {
    const seen = new Set();
    for (const z of this._data.zones) {
      if (!z.geometry) continue;
      seen.add(z.id);
      const selected = this._zoneForm?.id === z.id || this._eventForm?.zone_id === z.id;
      const style = {
        color: selected ? "#ffeb3b" : ZONE_COLOR,
        weight: selected ? 4 : 2,
        fillOpacity: selected ? 0.3 : 0.12,
      };
      let polygon = this._polygons.get(z.id);
      if (!polygon) {
        polygon = L.polygon(toLatLngs(z.geometry), style).addTo(this._zoneLayer);
        polygon.on("click", () => !this._placing && !this._drawing && this._selectZone(z.id));
        this._polygons.set(z.id, polygon);
      } else {
        polygon.setLatLngs(toLatLngs(z.geometry)).setStyle(style);
      }
      polygon.unbindTooltip().bindTooltip(h("span", {}, z.name), { sticky: true });
    }
    for (const [id, polygon] of this._polygons) {
      if (!seen.has(id)) {
        polygon.remove();
        this._polygons.delete(id);
      }
    }
  }

  _syncMarkers() {
    const seen = new Set();
    for (const p of this._data.plantings) {
      if (!hasPosition(p)) continue;
      seen.add(p.id);
      const selected = p.id === this._selected || (this._eventForm && p.id === this._eventForm.planting_id);
      const color = STATUS_COLOR[p.status] || STATUS_COLOR.active;
      const emoji = PLANT_ICONS[p.plant_type];
      const icon = L.divIcon({
        className: "",
        html: emoji
          ? `<div class="pin icon${selected ? " selected" : ""}" style="border-color:${selected ? "#ffeb3b" : color}">${emoji}</div>`
          : `<div class="pin${selected ? " selected" : ""}" style="background:${color}"></div>`,
        iconSize: emoji ? (selected ? [36, 36] : [28, 28]) : selected ? [26, 26] : [18, 18],
      });
      let marker = this._markers.get(p.id);
      if (!marker) {
        marker = L.marker([p.latitude, p.longitude], { icon, draggable: true, autoPan: true });
        marker.on("click", () => !this._drawing && this._select(p.id));
        marker.on("dragend", () => {
          const { lat, lng } = marker.getLatLng();
          this._setPosition(p.id, lat, lng);
        });
        marker.addTo(this._map);
        this._markers.set(p.id, marker);
      } else {
        marker.setLatLng([p.latitude, p.longitude]);
        marker.setIcon(icon);
      }
      // Leaflet sets string tooltips with innerHTML: user names are always passed as elements.
      marker.unbindTooltip().bindTooltip(h("span", {}, p.name), { direction: "top", offset: [0, -10] });
      selected ? marker.dragging.enable() : marker.dragging.disable();
      marker.setZIndexOffset(selected ? 1000 : 0);
    }
    for (const [id, marker] of this._markers) {
      if (!seen.has(id)) {
        marker.remove();
        this._markers.delete(id);
      }
    }
  }

  _drawPreview() {
    this._previewLayer.clearLayers();
    if (this._drawing) {
      const points = this._drawing.points;
      const style = { color: "#ffeb3b", weight: 3, dashArray: "6 6", interactive: false };
      if (points.length >= 3) L.polygon(points, { ...style, fillOpacity: 0.2 }).addTo(this._previewLayer);
      else if (points.length === 2) L.polyline(points, style).addTo(this._previewLayer);
      points.forEach((p) =>
        L.circleMarker(p, { radius: 5, color: "#ffeb3b", fillOpacity: 1, interactive: false }).addTo(this._previewLayer),
      );
    }
  }

  // ---------- interaction ----------

  _clearSelection() {
    this._form = null;
    this._zoneForm = null;
    this._expenseForm = null;
    this._toolForm = null;
    this._seedForm = null;
    this._cropForm = null;
    this._import = null;
    this._eventForm = null;
    this._taskForm = null;
    this._selected = null;
    this._placing = null;
    this._drawing = null;
    this._map.doubleClickZoom.enable();
  }

  _close() {
    this._clearSelection();
    this._showMessage("");
    this._syncMap();
    this._drawPreview();
    this._render();
  }

  _setTab(tab) {
    if (tab === "expenses" && this._tab !== "expenses") this._expenseYear = undefined;
    this._tab = tab;
    this._close();
  }

  _select(id, fallback = null) {
    this._clearSelection();
    this._tab = "plantings";
    this._selected = id;
    this._showMessage("");
    const p = this._planting(id) || fallback;
    this._form = p ? { ...p } : null;
    if (p && hasPosition(p)) this._map.panTo([p.latitude, p.longitude]);
    this._syncMap();
    this._drawPreview();
    this._render();
  }

  _selectZone(id, fallback = null) {
    this._clearSelection();
    this._tab = "zones";
    this._showMessage("");
    const z = this._zone(id) || fallback;
    this._zoneForm = z ? { ...z } : null;
    const polygon = this._polygons.get(id);
    if (polygon) this._map.fitBounds(polygon.getBounds(), { padding: [40, 40], maxZoom: 20 });
    this._syncMap();
    this._drawPreview();
    this._render();
  }

  _startPlacing(id) {
    this._clearSelection();
    this._placing = { id };
    this._render();
  }

  _startDrawing(zone) {
    const keep = zone ? this._zoneForm : null;
    this._clearSelection();
    this._zoneForm = keep;
    this._drawing = { zoneId: zone?.id ?? null, points: [] };
    this._map.doubleClickZoom.disable();
    this._drawPreview();
    this._render();
  }

  _undoPoint() {
    this._drawing.points.pop();
    this._drawPreview();
    this._renderBanner();
  }

  async _finishDrawing() {
    const { zoneId, points } = this._drawing;
    const ring = points.map((p) => [round(p.lng), round(p.lat)]);
    const geometry = { type: "Polygon", coordinates: [[...ring, ring[0]]] };
    this._drawing = null;
    this._map.doubleClickZoom.enable();
    this._drawPreview();
    if (zoneId) {
      if (await this._call("update_zone", { id: zoneId, geometry })) this._selectZone(zoneId);
      else this._render();
      return;
    }
    const center = L.polygon(toLatLngs(geometry)).getBounds().getCenter();
    this._zoneForm = { name: "", kind: null, parent_id: this._zoneAt(center.lat, center.lng), geometry };
    L.polygon(toLatLngs(geometry), { color: "#ffeb3b", weight: 3, interactive: false }).addTo(this._previewLayer);
    this._render();
    this.shadowRoot.querySelector("input[name=name]")?.focus();
  }

  async _mapClick(latlng) {
    if (this._drawing) {
      this._drawing.points.push(latlng);
      this._drawPreview();
      this._renderBanner();
      return;
    }
    if (!this._placing) return;
    const { id } = this._placing;
    this._placing = null;
    if (id) {
      this._selected = id;
      if (await this._setPosition(id, latlng.lat, latlng.lng)) this._select(id);
      else this._render();
      return;
    }
    this._clearSelection();
    this._showMessage("");
    const zoneId = this._zoneAt(latlng.lat, latlng.lng);
    this._form = {
      name: "",
      species: "",
      kind: "single",
      quantity: 1,
      status: "active",
      origin: "planted",
      planted_on: today(),
      zone_id: zoneId,
      plant_type: ZONE_PLANT_TYPE[this._zone(zoneId)?.kind] || null,
      latitude: latlng.lat,
      longitude: latlng.lng,
    };
    this._syncMap();
    this._render();
    this.shadowRoot.querySelector("input[name=name]")?.focus();
  }

  async _call(service, data) {
    try {
      const result = await this._hass.callWS({
        type: "call_service",
        domain: "homestead",
        service,
        service_data: data,
        return_response: true,
      });
      return result.response;
    } catch (err) {
      this._showMessage(err.message || String(err), true);
      return null;
    }
  }

  _setPosition(id, lat, lng) {
    return this._call("update_planting", { id, latitude: round(lat), longitude: round(lng) });
  }

  async _save(ev) {
    ev.preventDefault();
    const values = Object.fromEntries(new FormData(ev.target));
    if (!values.name?.trim() || !values.species?.trim()) {
      this._showMessage(this.t("required"), true);
      return;
    }
    const data = {
      name: values.name.trim(),
      species: values.species.trim(),
      taxon_id: values.taxon_id || null,
      variety: values.variety?.trim() || null,
      plant_type: values.plant_type || null,
      seed_lot_id: values.origin === "sown" ? values.seed_lot_id || null : null,
      kind: values.kind,
      quantity: Number(values.quantity) || 1,
      ...datesFromForm(values),
      zone_id: values.zone_id || null,
      notes: values.notes?.trim() || null,
    };
    if (this._form.id) {
      data.status = values.status;
      const id = this._form.id;
      if (await this._call("update_planting", { id, ...data })) this._saved(data.name);
    } else {
      data.latitude = round(this._form.latitude);
      data.longitude = round(this._form.longitude);
      if (values.price) data.price = Number(values.price);
      if (values.supplier?.trim()) data.supplier = values.supplier.trim();
      const result = await this._call("add_planting", data);
      if (result) this._saved(data.name);
    }
  }

  async _saveZone(ev) {
    ev.preventDefault();
    const values = Object.fromEntries(new FormData(ev.target));
    if (!values.name?.trim()) {
      this._showMessage(this.t("requiredZone"), true);
      return;
    }
    const data = {
      name: values.name.trim(),
      kind: values.kind || null,
      parent_id: values.parent_id || null,
      species: this._zoneForm.species || [],
      notes: values.notes?.trim() || null,
    };
    const id = this._zoneForm.id;
    if (id) {
      if (await this._call("update_zone", { id, ...data })) this._saved(data.name);
    } else {
      if (this._zoneForm.geometry) data.geometry = this._zoneForm.geometry;
      const result = await this._call("add_zone", data);
      if (result) this._saved(data.name);
    }
  }

  async _delete() {
    const { id, name } = this._form;
    if (!confirm(this.t("confirmDelete", { name }))) return;
    if (await this._call("delete_planting", { id })) this._saved(name, "deleted");
  }

  async _deleteZone() {
    const { id, name } = this._zoneForm;
    if (!confirm(this.t("confirmDeleteZone", { name }))) return;
    if (await this._call("delete_zone", { id })) this._saved(name, "deleted");
  }

  // ---------- import ----------

  // ---------- backup ----------

  async _exportBackup() {
    let backup;
    try {
      backup = await this._hass.callWS({ type: "homestead/backup/export" });
    } catch (err) {
      this._showMessage(err.message || String(err), true);
      return;
    }
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = h("a", { href: url, download: `homestead-backup-${backup.exported_at.slice(0, 10)}.json` });
    this.shadowRoot.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  }

  async _restoreBackup(input) {
    const file = input.files?.[0];
    input.value = "";
    if (!file) return;
    let backup;
    try {
      backup = JSON.parse(await file.text());
    } catch {
      backup = null;
    }
    if (backup?.format !== "ha-homestead-backup" || typeof backup.data !== "object") {
      this._showMessage(this.t("notBackup"), true);
      return;
    }
    const counts = Object.fromEntries(
      ["plantings", "zones", "taxa", "expenses", "tools"].map((k) => [k, backup.data[k]?.length ?? 0]),
    );
    const date = (backup.exported_at || "?").slice(0, 16).replace("T", " ");
    if (!confirm(this.t("confirmRestore", { date, summary: this._summary(counts) }))) return;
    try {
      const result = await this._hass.callWS({ type: "homestead/backup/import", backup });
      this._close();
      this._showMessage(`✓ ${this.t("restored", { summary: this._summary(result) })}`);
      this._fitAll();
    } catch (err) {
      this._showMessage(err.message || String(err), true);
    }
  }

  // ---------- rendering ----------

  /** Back to the list with a confirmation that fades after a few seconds. */
  _saved(name, key = "saved") {
    this._close();
    this._showMessage(`✓ ${this.t(key, { name })}`);
    clearTimeout(this._messageTimer);
    this._messageTimer = setTimeout(() => this._message.text.startsWith("✓") && this._showMessage(""), 4000);
  }

  _showMessage(text, error = false) {
    this._message = { text, error };
    this._messageEl.textContent = text;
    this._messageEl.className = error ? "error" : "info";
    this._messageEl.hidden = !text;
  }

  _renderBanner() {
    this._mapWrap.classList.toggle("placing", !!(this._placing || this._drawing));
    this._mapWrap.querySelector(".banner")?.remove();
    let banner = null;
    if (this._placing) {
      const name = this._planting(this._placing.id)?.name;
      banner = h(
        "div",
        { className: "banner" },
        h("span", {}, name ? this.t("placeExisting", { name }) : this.t("placeNew")),
        h("button", { onclick: () => this._close() }, this.t("cancel")),
      );
    } else if (this._drawing) {
      const count = this._drawing.points.length;
      banner = h(
        "div",
        { className: "banner" },
        h("span", {}, this.t("drawZone", { count })),
        h("button", { onclick: () => this._undoPoint(), disabled: !count }, this.t("undoPoint")),
        h("button", { onclick: () => this._finishDrawing(), disabled: count < 3 }, this.t("finish")),
        h("button", { onclick: () => (this._drawing.zoneId ? this._selectZone(this._drawing.zoneId) : this._close()) }, this.t("cancel")),
      );
    }
    if (banner) {
      L.DomEvent.disableClickPropagation(banner);
      this._mapWrap.append(banner);
    }
  }

  _render() {
    if (!this._aside) return;
    this._tabsEl.replaceChildren(this._renderTabs());
    this._renderBanner();
    this._showMessage(this._message.text, this._message.error);
    let content;
    if (this._form && !this._placing) content = this._renderForm();
    else if (this._zoneForm && !this._drawing) content = this._renderZoneForm();
    else if (this._expenseForm) content = this._renderExpenseForm();
    else if (this._toolForm) content = this._renderToolForm();
    else if (this._seedForm) content = this._renderSeedForm();
    else if (this._cropForm) content = this._renderCropForm();
    else if (this._import) content = this._renderImport();
    else if (this._eventForm) content = this._renderEventForm();
    else if (this._taskForm) content = this._renderTaskForm();
    else {
      const lists = {
        plantings: () => this._renderList(),
        zones: () => this._renderZoneList(),
        diary: () => this._renderDiary(),
        seeds: () => this._renderSeedList(),
        expenses: () => this._renderExpenseList(),
        tools: () => this._renderToolList(),
      };
      content = [...lists[this._tab](), this._renderBackup()];
    }
    this._content.replaceChildren(...content.filter(Boolean));
  }

  _renderTabs() {
    const tab = (name, label) =>
      h("button", { className: this._tab === name ? "active" : "", onclick: () => this._setTab(name) }, label);
    return h(
      "div",
      { style: "display:contents" },
      tab("plantings", this.t("tabPlantings")),
      tab("zones", this.t("tabZones")),
      tab("diary", this.t("tabDiary")),
      tab("seeds", this.t("tabSeeds")),
      tab("expenses", this.t("tabExpenses")),
      tab("tools", this.t("tabTools")),
    );
  }

  _renderBackup() {
    return h(
      "div",
      { className: "backup" },
      h("h3", {}, this.t("backup")),
      h("p", { className: "hint" }, this.t("backupHint")),
      h(
        "div",
        { className: "actions" },
        h("button", { onclick: () => this._exportBackup() }, `💾 ${this.t("exportBackup")}`),
        this._hass.user?.is_admin === false
          ? null
          : h("button", { onclick: () => this._fileInput.click() }, `📂 ${this.t("importBackup")}`),
      ),
    );
  }

  _summary(counts) {
    return this.t("summary", Object.fromEntries(Object.entries(counts).map(([k, v]) => [k, v ?? 0])));
  }

  _refreshForm() {
    const p = this._form.id && this._planting(this._form.id);
    if (this._form.id && !p) return this._close();
    if (p) Object.assign(this._form, { latitude: p.latitude, longitude: p.longitude });
    if (this._positionEl) this._positionEl.textContent = this._positionText();
    this._fillPhotos();
    this._refreshDiaryBox();
    this._refreshPlantingTodo();
    if (this._seasonsEl && p) this._seasonsEl.replaceChildren(this._seasonsBox(p));
    if (this._cropEl && p) this._cropEl.replaceChildren(this._cropBox(p));
  }

  _positionText() {
    const f = this._form;
    if (!hasPosition(f)) return "";
    const where = `${this.t("position")}: ${f.latitude.toFixed(6)}, ${f.longitude.toFixed(6)}`;
    return f.id ? `${where} — ${this.t("dragHint")}` : where;
  }

  _renderList() {
    const plantings = [...this._data.plantings].sort((a, b) => a.name.localeCompare(b.name));
    return [
      h(
        "div",
        { className: "actions" },
        h("button", { className: "primary", onclick: () => this._startPlacing(null) }, `+ ${this.t("add")}`),
        h("button", { onclick: () => this._csvPick("plantings") }, this.t("csvImport")),
        h("button", { onclick: () => this._csvTemplate("plantings") }, this.t("csvTemplate")),
      ),
      this._loaded === false ? h("p", { className: "error" }, this.t("notLoaded")) : null,
      plantings.length
        ? h(
            "ul",
            {},
            plantings.map((p) =>
              h(
                "li",
                {
                  className: p.id === this._selected ? "selected" : "",
                  onclick: () => (hasPosition(p) ? this._select(p.id) : this._startPlacing(p.id)),
                },
                PLANT_ICONS[p.plant_type]
                  ? h("span", { className: "badge", style: `border-color:${STATUS_COLOR[p.status] || STATUS_COLOR.active}` }, PLANT_ICONS[p.plant_type])
                  : h("span", { className: "dot", style: `background:${STATUS_COLOR[p.status] || STATUS_COLOR.active}` }),
                h(
                  "div",
                  { className: "main" },
                  h("div", {}, p.name),
                  h(
                    "div",
                    { className: "sub" },
                    [
                      this._taxon(p.taxon_id)?.common_names?.[this._lang()],
                      p.species,
                      p.variety,
                      ageOf(p) ? this.t("ageYears", { years: ageOf(p) }) : null,
                      this._zone(p.zone_id)?.name,
                      p.kind === "group" ? `×${p.quantity}` : null,
                    ]
                      .filter(Boolean)
                      .join(" · "),
                  ),
                  hasPosition(p) ? null : h("div", { className: "sub warn" }, `📍 ${this.t("noPosition")}`),
                ),
              ),
            ),
          )
        : h("p", { className: "hint" }, this.t("empty")),
    ];
  }

  _renderZoneList() {
    const counts = {};
    this._data.plantings.forEach((p) => p.zone_id && (counts[p.zone_id] = (counts[p.zone_id] || 0) + 1));
    const ordered = [];
    const walk = (parent, depth) =>
      this._data.zones
        .filter((z) => (z.parent_id || null) === parent || (depth === 0 && z.parent_id && !this._zone(z.parent_id)))
        .sort((a, b) => a.name.localeCompare(b.name))
        .forEach((z) => {
          if (ordered.some((o) => o.zone.id === z.id)) return;
          ordered.push({ zone: z, depth });
          walk(z.id, depth + 1);
        });
    walk(null, 0);
    return [
      h(
        "div",
        { className: "actions" },
        h("button", { className: "primary", onclick: () => this._startDrawing(null) }, `+ ${this.t("addZone")}`),
      ),
      ordered.length
        ? h(
            "ul",
            {},
            ordered.map(({ zone: z, depth }) =>
              h(
                "li",
                {
                  style: `padding-left:${8 + depth * 16}px`,
                  onclick: () => this._selectZone(z.id),
                },
                h("span", { className: "swatch", style: z.geometry ? "" : "border-style:dashed" }),
                h(
                  "div",
                  { className: "main" },
                  h("div", {}, z.name),
                  h(
                    "div",
                    { className: "sub" },
                    [
                      z.kind ? this.t(z.kind) : null,
                      (z.species || []).map((e) => e.name).slice(0, 3).join(", ") || null,
                      formatArea(z.area_m2),
                      counts[z.id] ? this.t("plantsCount", { count: counts[z.id] }) : null,
                    ]
                      .filter(Boolean)
                      .join(" · "),
                  ),
                  z.geometry ? null : h("div", { className: "sub warn" }, `✏️ ${this.t("notDrawn")}`),
                ),
              ),
            ),
          )
        : h("p", { className: "hint" }, this.t("emptyZones")),
    ];
  }

  _field(form, name, attrs = {}) {
    return h("label", {}, this.t(name), h("input", { name, value: form[name] ?? "", ...attrs }));
  }

  _selectField(form, name, options) {
    const value = form[name] ?? "";
    return h(
      "label",
      {},
      this.t(name),
      h("select", { name }, options.map(([v, text]) => h("option", { value: v, selected: v === value }, text))),
    );
  }

  _notes(form) {
    return h("label", {}, this.t("notes"), h("textarea", { name: "notes", rows: 3, value: form.notes ?? "" }));
  }

  _renderForm() {
    const f = this._form;
    const quantity = this._field(f, "quantity", { type: "number", min: 1, step: 1 });
    const kind = this._selectField(f, "kind", [
      ["single", this.t("single")],
      ["group", this.t("group")],
    ]);
    const toggleQuantity = () => (quantity.style.display = kind.querySelector("select").value === "group" ? "" : "none");
    kind.addEventListener("change", toggleQuantity);
    toggleQuantity();
    const rotationEl = h("p", { className: "last-time" });
    const updateRotation = (form) => {
      const el = form.elements;
      const hint = this._rotationHint({
        id: f.id,
        zone_id: el.zone_id.value,
        species: el.species.value,
        taxon_id: el.taxon_id.value,
        plant_type: el.plant_type.value,
      });
      rotationEl.textContent = hint || "";
      rotationEl.hidden = !hint;
    };
    const form = h(
      "form",
      {
        onsubmit: (ev) => this._save(ev),
        onchange: (ev) => updateRotation(ev.currentTarget),
      },
        h("h2", {}, f.id ? this.t("editTitle") : this.t("newTitle")),
        this._field(f, "name", { required: true, maxLength: 100 }),
        this._speciesField(f),
        h(
          "div",
          { className: "row" },
          this._field(f, "variety"),
          this._selectField(f, "plant_type", [["", "—"], ...Object.entries(PLANT_ICONS).map(([k, icon]) => [k, `${icon} ${this.t(`pt_${k}`)}`])]),
        ),
        h("div", { className: "row" }, kind, quantity),
        this._datesFields(f),
        this._selectField(f, "zone_id", this._zoneOptions()),
        rotationEl,
        f.id ? this._selectField(f, "status", ["active", "dead", "removed"].map((s) => [s, this.t(s)])) : null,
        f.id
          ? null
          : h(
              "div",
              { className: "row" },
              this._field(f, "price", { type: "number", min: 0, step: "0.01", inputMode: "decimal" }),
              this._field(f, "supplier"),
            ),
        this._notes(f),
        (this._positionEl = h("div", { className: "hint" }, this._positionText())),
        h(
          "div",
          { className: "row" },
          h("button", { type: "submit", className: "primary" }, this.t("save")),
          h("button", { type: "button", onclick: () => this._close() }, this.t("cancel")),
        ),
        f.id
          ? h(
              "div",
              { className: "row" },
              h("button", { type: "button", onclick: () => this._startPlacing(f.id) }, this.t("place")),
              h("button", { type: "button", className: "danger", onclick: () => this._delete() }, this.t("delete")),
            )
          : null,
    );
    updateRotation(form);
    return [
      form,
      f.id ? this._plantingActions(f) : null,
      f.id ? this._plantingExpenses(f) : null,
      f.id ? (this._cropEl = h("div", {}, this._cropBox(f))) : null,
      f.id ? (this._seasonsEl = h("div", {}, this._seasonsBox(f))) : null,
      f.id ? this._plantingTodo(f) : null,
      f.id ? this._diaryBox({ planting_id: f.id }) : null,
      f.id ? this._lastYearsBox(this._relatedPlantings(f).flatMap((p) => this._eventsFor({ planting_id: p.id })), { planting_id: f.id }) : null,
      this._photosSection(f),
    ];
  }

  _speciesField(f) {
    const hidden = h("input", { type: "hidden", name: "taxon_id", value: f.taxon_id ?? "" });
    const linked = h("div", { className: "taxon" });
    const input = h("input", {
      name: "species",
      value: f.species ?? "",
      required: true,
      autocomplete: "off",
      placeholder: this.t("speciesPlaceholder"),
    });
    const showLinked = () => {
      const taxon = hidden.value && this._taxon(hidden.value);
      linked.replaceChildren();
      if (!taxon) return;
      const common = taxon.common_names?.[this._lang()];
      linked.append(
        taxon.image ? this._speciesImage(taxon.image, taxon.scientific_name) : "",
        h("span", {}, `✓ ${this.t("linked")}: ${[common, taxon.scientific_name, taxon.family].filter(Boolean).join(" · ")}`),
        h("button", { type: "button", onclick: () => ((hidden.value = ""), showLinked()) }, this.t("unlink")),
      );
    };
    const list = this._speciesPicker(input, (item, id) => {
      input.value = item.scientific_name;
      hidden.value = id;
      showLinked();
      input.dispatchEvent(new Event("change", { bubbles: true }));
    });
    input.addEventListener("input", () => {
      hidden.value = "";
      showLinked();
    });
    showLinked();
    return h("label", { className: "species" }, this.t("species"), input, list, hidden, linked);
  }

  /** Suggestions under a text input (local species, then GBIF/Wikidata); a chosen remote one is imported. */
  _speciesPicker(input, onPicked) {
    const list = h("div", { className: "suggest", hidden: true });
    let timer = null;
    let seq = 0;
    const message = (text) => list.replaceChildren(h("div", { className: "msg" }, text));
    const choose = async (item) => {
      list.hidden = true;
      let id = item.taxon_id;
      // Species imported before pictures existed: import again in the background to fetch one.
      if (id && !item.image && (item.gbif_key || item.wikidata_id)) {
        const ids = Object.fromEntries(Object.entries({ gbif_key: item.gbif_key, wikidata_id: item.wikidata_id }).filter(([, v]) => v));
        this._hass.callWS({ type: "call_service", domain: "homestead", service: "import_taxon", service_data: ids, return_response: true }).catch(() => {});
      }
      if (!id) {
        message(this.t("importingTaxon"));
        list.hidden = false;
        const ids = Object.fromEntries(Object.entries({ gbif_key: item.gbif_key, wikidata_id: item.wikidata_id }).filter(([, v]) => v));
        const result = await this._call("import_taxon", ids);
        list.hidden = true;
        if (!result) return;
        id = result.id;
        this._taxaPending.set(id, {
          id,
          scientific_name: item.scientific_name,
          family: item.family,
          common_names: item.common_name ? { [this._lang()]: item.common_name } : {},
          image: item.image,
        });
      }
      onPicked(item, id);
    };
    const search = async () => {
      const query = input.value.trim();
      if (query.length < 3) {
        list.hidden = true;
        return;
      }
      const mine = ++seq;
      message(this.t("searching"));
      list.hidden = false;
      let result;
      try {
        result = await this._hass.callWS({ type: "homestead/species/search", query, language: this._lang() });
      } catch (err) {
        if (mine === seq) message(err.message || String(err));
        return;
      }
      if (mine !== seq) return;
      const items = result.results.map((item) =>
        h(
          "button",
          { type: "button", onmousedown: (ev) => ev.preventDefault(), onclick: () => choose(item) },
          item.image ? this._speciesImage(item.image, item.scientific_name) : null,
          h(
            "div",
            {},
            h("div", {}, item.common_name ? `${item.common_name} — ${item.scientific_name}` : item.scientific_name),
            h(
              "div",
              { className: "sub" },
              [item.family, item.rank, item.source === "local" ? `✓ ${this.t("local")}` : item.description || item.source]
                .filter(Boolean)
                .join(" · "),
            ),
          ),
        ),
      );
      list.replaceChildren(
        ...[
          ...items,
          result.offline ? h("div", { className: "msg" }, this.t("offlineSpecies")) : null,
          !items.length && !result.offline ? h("div", { className: "msg" }, this.t("noResults")) : null,
        ].filter(Boolean),
      );
    };
    input.addEventListener("input", () => {
      clearTimeout(timer);
      timer = setTimeout(search, 400);
    });
    input.addEventListener("blur", () => setTimeout(() => (list.hidden = true), 150));
    input.addEventListener("keydown", (ev) => ev.key === "Escape" && (list.hidden = true));
    return list;
  }

  /** Small picture of a species; a tap shows it large, with a link to its page on Wikimedia Commons. */
  _speciesImage(file, name) {
    return h("img", {
      src: commonsThumb(file, 80),
      alt: name,
      title: name,
      loading: "lazy",
      referrerPolicy: "no-referrer",
      style: "cursor:zoom-in",
      onerror: (ev) => ev.target.remove(),
      onmousedown: (ev) => ev.preventDefault(),
      onclick: (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        this._showSpeciesImage(file, name);
      },
    });
  }

  _showSpeciesImage(file, name) {
    const overlay = h(
      "div",
      { className: "lightbox", onclick: (ev) => ev.target === overlay && overlay.remove() },
      h("img", { src: commonsThumb(file, 1200), alt: name, referrerPolicy: "no-referrer" }),
      h(
        "div",
        { className: "row" },
        h("span", {}, name),
        h(
          "a",
          {
            href: `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(file.replace(/ /g, "_"))}`,
            target: "_blank",
            rel: "noopener noreferrer",
            style: "color:inherit",
          },
          "Wikimedia Commons ↗",
        ),
        h("button", { type: "button", onclick: () => overlay.remove() }, this.t("close")),
      ),
    );
    this.shadowRoot.append(overlay);
  }

  /** Main species of a zone (a woodland): chips, plus a search box; Enter adds the typed name as it is. */
  _essencesField(z) {
    z.species = [...(z.species || [])];
    const chips = h("div", { className: "chips" });
    const paint = () =>
      chips.replaceChildren(
        ...z.species.map((item, i) => {
          const taxon = item.taxon_id && this._taxon(item.taxon_id);
          const common = taxon?.common_names?.[this._lang()];
          return h(
            "span",
            { className: "chip" },
            common ? `${common} (${item.name})` : item.name,
            h(
              "button",
              { type: "button", title: this.t("removeEssence"), onclick: () => (z.species.splice(i, 1), paint()) },
              "✕",
            ),
          );
        }),
      );
    const add = (name, taxonId = null) => {
      if (name && !z.species.some((e) => e.name.toLowerCase() === name.toLowerCase())) z.species.push({ name, taxon_id: taxonId });
      paint();
    };
    const input = h("input", { autocomplete: "off", placeholder: this.t("speciesPlaceholder") });
    const list = this._speciesPicker(input, (item, id) => {
      add(item.scientific_name, id);
      input.value = "";
    });
    input.addEventListener("keydown", (ev) => {
      if (ev.key !== "Enter") return;
      ev.preventDefault();
      add(input.value.trim());
      input.value = "";
      list.hidden = true;
    });
    paint();
    return h(
      "div",
      { className: "species" },
      h("label", {}, this.t("essences"), chips, input),
      list,
      h("div", { className: "hint" }, this.t("essencesHint")),
    );
  }

  /** Origin decides which dates make sense: an estimated age, a planting date or sowing + transplant. */
  _datesFields(f) {
    const year = new Date().getFullYear();
    const plantedYear = f.planted_on ? Number(f.planted_on.slice(0, 4)) : null;
    const values = {
      origin: f.origin || (f.sown_on ? "sown" : f.planted_on ? "planted" : f.birth_year ? "existing" : "planted"),
      age_now: f.birth_year ? year - f.birth_year : "",
      age_at_planting: f.birth_year && plantedYear ? plantedYear - f.birth_year : "",
      planted_on: f.planted_on,
      // A new planting starts with today as planting date: for "sown" it is the sowing date instead.
      sown_on: f.sown_on || (f.id ? "" : f.planted_on),
      transplanted_on: f.sown_on || f.origin === "sown" ? f.planted_on : "",
    };
    const age = { type: "number", min: 0, max: 500, step: 1, inputMode: "numeric" };
    const groups = {
      existing: h("div", { className: "row" }, this._field(values, "age_now", age)),
      planted: h(
        "div",
        { className: "row" },
        this._field(values, "planted_on", { type: "date" }),
        this._field(values, "age_at_planting", age),
      ),
      sown: h(
        "div",
        { className: "row" },
        this._field(values, "sown_on", { type: "date" }),
        this._field(values, "transplanted_on", { type: "date" }),
        this._seedLotSelect(f),
      ),
    };
    const origin = this._selectField(values, "origin", ["existing", "planted", "sown"].map((o) => [o, this.t(o)]));
    const show = () => {
      const current = origin.querySelector("select").value;
      for (const [name, group] of Object.entries(groups)) {
        group.hidden = name !== current;
        group.querySelectorAll("input").forEach((input) => (input.disabled = name !== current));
      }
    };
    origin.addEventListener("change", show);
    show();
    return h("div", { className: "dates" }, origin, ...Object.values(groups));
  }

  /** Seeds still available (plus the one already linked); choosing one fills an empty species. */
  _seedLotSelect(f) {
    const lots = this._data.seeds.filter((lot) => !lot.finished || lot.id === f.seed_lot_id);
    if (!lots.length) return null;
    const field = this._selectField(f, "seed_lot_id", [
      ["", "—"],
      ...lots.map((lot) => [lot.id, `${this._seedName(lot)}${lot.year ? ` (${lot.year})` : ""}`]),
    ]);
    field.querySelector("select").addEventListener("change", (ev) => {
      const lot = this._data.seeds.find((l) => l.id === ev.target.value);
      const el = ev.target.form?.elements;
      if (!lot || !el || el.species.value.trim()) return;
      el.species.value = lot.species;
      el.taxon_id.value = lot.taxon_id || "";
      if (!el.variety.value.trim()) el.variety.value = lot.variety || "";
    });
    return field;
  }

  // ---------- expenses ----------

  _money(value) {
    const currency = this._hass.config.currency || "EUR";
    try {
      return new Intl.NumberFormat(this._lang(), { style: "currency", currency }).format(value);
    } catch {
      return `${value.toFixed(2)} ${currency}`;
    }
  }

  _quantity(value, unit) {
    const number = new Intl.NumberFormat(this._lang(), { maximumFractionDigits: 1 }).format(value);
    return `${number} ${this.t(`u_${unit || "kg"}`)}`;
  }

  _date(iso, withYear = true) {
    if (!iso) return "";
    const [y, m, d] = iso.slice(0, 10).split("-");
    const order = this._dateOrder();
    if (order === "YMD") return withYear ? `${y}-${m}-${d}` : `${m}-${d}`;
    const parts = order === "MDY" ? [m, d] : [d, m];
    return [...parts, ...(withYear ? [y] : [])].join("/");
  }

  // Follows the HA profile "Date format"; with "language" an English UI stays day-first unless it is en-US.
  _dateOrder() {
    const setting = this._hass.locale?.date_format;
    if (["DMY", "MDY", "YMD"].includes(setting)) return setting;
    const locale = setting === "system" ? undefined : this._hass.locale?.language || this._hass.language || "en";
    if (locale === "en") return "DMY";
    const sample = new Intl.DateTimeFormat(locale, { year: "numeric", month: "2-digit", day: "2-digit" })
      .formatToParts(new Date(2026, 10, 25))
      .map((p) => p.type[0])
      .filter((c) => "ymd".includes(c))
      .join("");
    return { ymd: "YMD", mdy: "MDY" }[sample] || "DMY";
  }

  _openExpense(expense) {
    this._clearSelection();
    this._showMessage("");
    this._tab = "expenses";
    this._expenseForm = { ...expense };
    this._syncMap();
    this._render();
  }

  _renderExpenseList() {
    const all = [...this._data.expenses].sort((a, b) => b.spent_on.localeCompare(a.spent_on));
    const years = [...new Set([String(new Date().getFullYear()), ...all.map((e) => e.spent_on.slice(0, 4))])].sort().reverse();
    if (this._expenseYear === undefined) this._expenseYear = years[0];
    const year = this._expenseYear;
    const expenses = year ? all.filter((e) => e.spent_on.startsWith(year)) : all;
    const sum = (list) => list.reduce((total, e) => total + e.amount, 0);
    const spent = expenses.filter((e) => !e.income);
    const earned = expenses.filter((e) => e.income);
    const byCategory = {};
    spent.forEach((e) => (byCategory[e.category] = (byCategory[e.category] || 0) + e.amount));
    const linked = (e) => this._planting(e.planting_id)?.name || this._data.tools.find((t) => t.id === e.tool_id)?.name;
    const yearSelect = h(
      "select",
      {
        onchange: (ev) => {
          this._expenseYear = ev.target.value;
          this._render();
        },
      },
      [["", this.t("allYears")], ...years.map((y) => [y, y])].map(([v, text]) => h("option", { value: v, selected: v === year }, text)),
    );
    return [
      h(
        "div",
        { className: "actions" },
        h(
          "button",
          { className: "primary", onclick: () => this._openExpense({ spent_on: today(), category: "plants" }) },
          `+ ${this.t("addExpense")}`,
        ),
        yearSelect,
      ),
      h(
        "div",
        { className: "summary" },
        h("strong", {}, `${this.t("expensesTotal")}: ${this._money(sum(spent))}`),
        earned.length
          ? h("div", {}, `${this.t("incomesTotal")}: ${this._money(sum(earned))} · ${this.t("balance")}: ${this._money(sum(earned) - sum(spent))}`)
          : null,
        Object.entries(byCategory)
          .sort((a, b) => b[1] - a[1])
          .map(([cat, value]) => h("div", { className: "sub" }, `${this.t(`cat_${cat}`)}: ${this._money(value)}`)),
        this._balanceTable(this.t(year ? "monthly" : "yearly"), expenses, (e) => (year ? e.spent_on.slice(0, 7) : e.spent_on.slice(0, 4)), (key) =>
          year ? new Intl.DateTimeFormat(this._lang(), { month: "long" }).format(new Date(`${key}-15T12:00:00`)) : key,
        ),
        this._balanceTable(
          this.t("byPlanting"),
          expenses.filter((e) => e.planting_id && this._planting(e.planting_id)),
          (e) => e.planting_id,
          (id) => this._planting(id).name,
          true,
        ),
      ),
      expenses.length
        ? h(
            "ul",
            {},
            expenses.map((e) =>
              h(
                "li",
                { onclick: () => this._openExpense(e) },
                h(
                  "div",
                  { className: "main" },
                  h(
                    "div",
                    { className: e.income ? "income" : "" },
                    `${e.income ? "+" : ""}${this._money(e.amount)} · ${this.t(`cat_${e.category}`)}`,
                  ),
                  h(
                    "div",
                    { className: "sub" },
                    [this._date(e.spent_on), linked(e), e.supplier].filter(Boolean).join(" · "),
                  ),
                ),
              ),
            ),
          )
        : h("p", { className: "hint" }, this.t("emptyExpenses")),
    ];
  }

  /** Spent / earned per group (month, planting…); by amount when `byAmount`, else by key. */
  _balanceTable(title, expenses, keyOf, labelOf, byAmount = false) {
    const groups = new Map();
    for (const e of expenses) {
      const key = keyOf(e);
      const g = groups.get(key) || { spent: 0, earned: 0 };
      g[e.income ? "earned" : "spent"] += e.amount;
      groups.set(key, g);
    }
    if (groups.size < 2 && !byAmount) return null;
    if (!groups.size) return null;
    const rows = [...groups.entries()].sort(byAmount ? (a, b) => b[1].spent + b[1].earned - a[1].spent - a[1].earned : (a, b) => a[0].localeCompare(b[0]));
    return h(
      "div",
      {},
      h("h3", {}, title),
      h(
        "div",
        { className: "balance-table" },
        rows.slice(0, 12).flatMap(([key, g]) => [
          h("span", {}, labelOf(key)),
          h("span", { className: "num" }, g.spent ? `−${this._money(g.spent)}` : ""),
          h("span", { className: "num income" }, g.earned ? `+${this._money(g.earned)}` : ""),
        ]),
      ),
    );
  }

  _renderExpenseForm() {
    const f = this._expenseForm;
    const plantings = [
      ["", this.t("noZone")],
      ...[...this._data.plantings].sort((a, b) => a.name.localeCompare(b.name)).map((p) => [p.id, p.name]),
    ];
    const tools = [["", this.t("noZone")], ...this._data.tools.map((t) => [t.id, t.name])];
    return [
      h(
        "form",
        { onsubmit: (ev) => this._saveExpense(ev) },
        h("h2", {}, f.id ? this.t("editExpenseTitle") : this.t("newExpenseTitle")),
        h(
          "div",
          { className: "row" },
          this._field(f, "amount", { type: "number", min: 0, step: "0.01", required: true, inputMode: "decimal" }),
          this._field(f, "spent_on", { type: "date", required: true }),
        ),
        h(
          "div",
          { className: "row" },
          this._selectField({ movement: f.income ? "income" : "expense" }, "movement", [
            ["expense", this.t("isExpense")],
            ["income", this.t("isIncome")],
          ]),
          this._selectField(f, "category", EXPENSE_CATEGORIES.map((c) => [c, this.t(`cat_${c}`)])),
        ),
        this._field(f, "supplier"),
        h("div", { className: "row" }, this._selectField(f, "planting_id", plantings), this._selectField(f, "tool_id", tools)),
        this._notes(f),
        this._formButtons(f.id, () => this._deleteExpense()),
      ),
    ];
  }

  async _saveExpense(ev) {
    ev.preventDefault();
    const v = Object.fromEntries(new FormData(ev.target));
    const data = {
      amount: Number(v.amount),
      spent_on: v.spent_on,
      category: v.category,
      supplier: v.supplier?.trim() || null,
      planting_id: v.planting_id || null,
      tool_id: v.tool_id || null,
      income: v.movement === "income",
      notes: v.notes?.trim() || null,
    };
    const id = this._expenseForm.id;
    const ok = await this._call(id ? "update_expense" : "add_expense", id ? { id, ...data } : data);
    if (ok) this._saved(this._money(data.amount));
  }

  async _deleteExpense() {
    if (!confirm(this.t("confirmDeleteExpense"))) return;
    if (await this._call("delete_expense", { id: this._expenseForm.id })) this._saved(this._money(this._expenseForm.amount), "deleted");
  }

  _plantingExpenses(f) {
    const mine = this._data.expenses.filter((e) => e.planting_id === f.id);
    const spent = mine.filter((e) => !e.income).reduce((sum, e) => sum + e.amount, 0);
    const earned = mine.filter((e) => e.income).reduce((sum, e) => sum + e.amount, 0);
    return h(
      "div",
      { className: "taxon" },
      h(
        "span",
        {},
        earned
          ? `💶 ${this.t("spentEarned", { spent: this._money(spent), earned: this._money(earned) })}`
          : this.t("expensesOfPlanting", { total: this._money(spent) }),
      ),
      h(
        "button",
        {
          type: "button",
          onclick: () => this._openExpense({ spent_on: today(), category: "plants", planting_id: f.id }),
        },
        this.t("addExpenseFor"),
      ),
    );
  }

  // ---------- diary ----------

  _targetName(event) {
    if (event.planting_id) return this._planting(event.planting_id)?.name ?? "?";
    const zone = this._zone(event.zone_id);
    if (!zone) return "?";
    const count = this._data.plantings.filter((p) => this._inZone(p, zone.id)).length;
    return count ? `${zone.name} (${this.t("zonePlantings", { count })})` : zone.name;
  }

  /** True when the planting is in the zone or one of its sub-zones. */
  _inZone(planting, zoneId) {
    for (let z = this._zone(planting.zone_id), guard = 0; z && guard < 20; z = this._zone(z.parent_id), guard++) {
      if (z.id === zoneId) return true;
    }
    return false;
  }

  /** Events that concern a planting: its own and those of its zone and parent zones. */
  _eventsFor(target) {
    if (target.zone_id) return this._data.events.filter((e) => e.zone_id === target.zone_id);
    const planting = this._planting(target.planting_id);
    return this._data.events.filter(
      (e) => e.planting_id === target.planting_id || (e.zone_id && planting && this._inZone(planting, e.zone_id)),
    );
  }

  /** Diary lines derived from the planting's dates: sowing, planting out, or "here since ~year". */
  _startEvents(planting) {
    const virtual = (kind, done_on, moon_phase) => ({
      id: `start:${kind}:${planting.id}`,
      virtual: true,
      kind,
      done_on,
      moon_phase,
      planting_id: planting.id,
    });
    const real = new Set(this._data.events.filter((e) => e.planting_id === planting.id).map((e) => `${e.kind}:${e.done_on}`));
    const out = [];
    if (planting.sown_on && !real.has(`sowing:${planting.sown_on}`)) {
      out.push(virtual("sowing", planting.sown_on, planting.sown_moon_phase));
    }
    if (planting.planted_on) out.push(virtual("planted", planting.planted_on, planting.moon_phase));
    if (!out.length && planting.birth_year) out.push(virtual("since", `${planting.birth_year}-01-01`, null));
    return out;
  }

  /** `back` is the planting or zone card to return to after saving. */
  _openEvent(event, back = null) {
    this._clearSelection();
    this._eventBack = back;
    this._showMessage("");
    this._tab = "diary";
    this._eventForm = { ...event };
    const planting = event.planting_id && this._planting(event.planting_id);
    if (planting && hasPosition(planting)) this._map.panTo([planting.latitude, planting.longitude]);
    const polygon = event.zone_id && this._polygons.get(event.zone_id);
    if (polygon) this._map.fitBounds(polygon.getBounds(), { padding: [40, 40], maxZoom: 20 });
    this._syncMap();
    this._render();
  }

  _newEvent(target = {}, back = null) {
    const kind = this._isWoodland(target) ? "wood_cutting" : "note";
    this._openEvent({ kind, done_on: today(), ...(kind === "wood_cutting" ? { unit: this._woodUnit() } : {}), ...target }, back);
  }

  _eventDone(name, key = "saved") {
    const back = this._eventBack;
    this._eventBack = null;
    if (back?.planting_id) this._select(back.planting_id);
    else if (back?.zone_id) this._selectZone(back.zone_id);
    else return this._saved(name, key);
    this._showMessage(`✓ ${this.t(key, { name })}`);
  }

  _eventLabel(e) {
    if (e.kind === "since") {
      const year = Number(e.done_on.slice(0, 4));
      return this.t("ev_since", { years: new Date().getFullYear() - year, year });
    }
    if (e.kind === "planted" && this._planting(e.planting_id)?.sown_on) return this.t("ev_transplanted");
    return this.t(`ev_${e.kind}`);
  }

  _renderTimeline(events, showTarget = true, back = null) {
    const sorted = [...events].sort((a, b) => b.done_on.localeCompare(a.done_on));
    const days = [];
    for (const event of sorted) {
      if (days.at(-1)?.date !== event.done_on) days.push({ date: event.done_on, moon: event.moon_phase, events: [] });
      days.at(-1).events.push(event);
    }
    return h(
      "div",
      { className: "timeline" },
      days.map((day) =>
        h(
          "div",
          { className: "day" },
          h(
            "div",
            { className: "sub" },
            day.events[0].kind === "since"
              ? `~${day.date.slice(0, 4)}`
              : `${this._date(day.date)}${day.moon ? ` · ${MOON_ICONS[day.moon]} ${this.t(`moon_${day.moon}`)}` : ""}`,
          ),
          day.events.map((e) =>
            h(
              "button",
              {
                type: "button",
                className: `event${e.virtual ? " start" : ""}`,
                onclick: () => (e.virtual ? this._select(e.planting_id) : this._openEvent(e, back)),
              },
              h("span", { className: "icon" }, e.virtual ? START_ICONS[e.kind] : EVENT_ICONS[e.kind] || "📝"),
              h(
                "span",
                { className: "main" },
                h(
                  "span",
                  {},
                  [
                    this._eventLabel(e),
                    showTarget ? this._targetName(e) : null,
                    e.quantity ? this._quantity(e.quantity, e.unit) : null,
                    [e.product, e.dose].filter(Boolean).join(" "),
                  ]
                    .filter(Boolean)
                    .join(" — "),
                ),
                e.kind === "review" ? this._reviewLine(e) : null,
                e.notes ? h("span", { className: "sub" }, e.notes) : null,
                e.weather ? h("span", { className: "sub weather" }, weatherText(e.weather)) : null,
              ),
            ),
          ),
        ),
      ),
    );
  }

  /** Diary section at the bottom of a planting or zone card. */
  _diaryBox(target) {
    this._diaryTarget = target;
    this._diaryEl = h("div");
    this._refreshDiaryBox();
    return h(
      "div",
      { className: "diary-box" },
      h(
        "div",
        { className: "row header" },
        h("h3", {}, this.t("tabDiary")),
        h("button", { type: "button", onclick: () => this._newEvent(target, target) }, this.t("addEvent")),
      ),
      this._diaryEl,
    );
  }

  _refreshDiaryBox() {
    if (!this._diaryEl || !this._diaryTarget) return;
    const events = this._eventsFor(this._diaryTarget);
    const planting = this._diaryTarget.planting_id && this._planting(this._diaryTarget.planting_id);
    const recent = [
      ...[...events].sort((a, b) => b.done_on.localeCompare(a.done_on)).slice(0, 5),
      ...(planting ? this._startEvents(planting) : []),
    ];
    this._diaryEl.replaceChildren(
      ...[
        recent.length
        ? this._renderTimeline(recent, !!this._diaryTarget.planting_id, this._diaryTarget)
        : h("p", { className: "hint" }, this.t("emptyDiary")),
      events.length > 5
        ? h(
            "button",
            {
              type: "button",
              onclick: () => {
                const zone = this._diaryTarget.zone_id || this._planting(this._diaryTarget.planting_id)?.zone_id || "";
                this._diaryFilter = { kind: "", zone, year: "" };
                this._setTab("diary");
              },
            },
            this.t("allEvents"),
          )
        : null,
      ].filter(Boolean),
    );
  }

  /** True when the event target is a woodland zone, inside one, or a planting in one. */
  _isWoodland(target) {
    const planting = target.planting_id && this._planting(target.planting_id);
    for (let z = this._zone(target.zone_id || planting?.zone_id), guard = 0; z && guard < 20; z = this._zone(z.parent_id), guard++) {
      if (z.kind === "woodland") return true;
    }
    return false;
  }

  /** The firewood unit used last time, else the local habit (q in Italy, stere in France). */
  _woodUnit() {
    const last = this._data.events
      .filter((e) => (e.kind === "wood_cutting" || e.kind === "brushwood") && ["q", "stere", "m3"].includes(e.unit))
      .sort((a, b) => b.done_on.localeCompare(a.done_on))[0];
    return last?.unit || { it: "q", fr: "stere" }[this._lang()] || "m3";
  }

  /** Per year: firewood, branches and foraging of a zone and its sub-zones, by unit. */
  _woodBox(zone) {
    const zones = new Set([zone.id, ...this._zoneDescendants(zone.id)]);
    const events = this._data.events.filter((e) => zones.has(e.zone_id) && ["wood_cutting", "brushwood", "foraging"].includes(e.kind));
    if (!events.length && zone.kind !== "woodland") return null;
    const years = new Map();
    for (const e of events) {
      const year = e.done_on.slice(0, 4);
      const key = `${e.kind}:${e.unit || ""}`;
      if (!years.has(year)) years.set(year, new Map());
      const totals = years.get(year);
      totals.set(key, (totals.get(key) || 0) + (e.quantity || 0));
    }
    const rows = [...years.entries()].sort((a, b) => b[0].localeCompare(a[0]));
    return h(
      "div",
      { className: "seasons" },
      h("h3", {}, this.t("woodBox")),
      rows.length
        ? rows.map(([year, totals]) =>
            h(
              "div",
              { className: "season" },
              h("div", { className: "season-head" }, h("strong", {}, year)),
              h(
                "div",
                { className: "sub" },
                [...totals.entries()]
                  .map(([key, quantity]) => {
                    const [kind, unit] = key.split(":");
                    const amount = quantity ? this._quantity(quantity, unit) : this.t(`ev_${kind}`);
                    return `${EVENT_ICONS[kind]} ${amount}`;
                  })
                  .join(" · "),
              ),
            ),
          )
        : h("p", { className: "hint" }, this.t("emptyDiary")),
    );
  }

  /** Coming frost and heat, with the plants they hit. */
  _alertsBox() {
    const alerts = this._outlook?.alerts || [];
    if (!alerts.length) return null;
    const when = (a) => (a.start === a.end ? this._date(a.start, false) : `${this._date(a.start, false)}–${this._date(a.end, false)}`);
    return h(
      "div",
      { className: "summary", style: "border-left:4px solid var(--warning-color, #ffa600)" },
      h("strong", {}, this.t("alertsTitle")),
      alerts.map((a) => {
        const names = a.plantings.map((id) => this._planting(id)?.name).filter(Boolean);
        const everyone = ["heatwave", "heat_extreme"].includes(a.kind);
        return h(
          "div",
          { className: "sub", style: "white-space:normal" },
          `${this.t(`al_${a.kind}`, { when: when(a), value: a.value })}${names.length && !everyone ? ` — ${names.slice(0, 5).join(", ")}${names.length > 5 ? " …" : ""}` : ""}`,
        );
      }),
    );
  }

  /** Events of previous years from a week before to three weeks after today's date: what usually happens now. */
  _lastYearsBox(events, back = null) {
    const now = new Date();
    const year = now.getFullYear();
    const start = new Date(year, now.getMonth(), now.getDate());
    const near = events.filter((e) => {
      const [y, m, d] = e.done_on.split("-").map(Number);
      if (y >= year || e.kind === "review") return false;
      const days = (new Date(year, m - 1, d) - start) / 86400000;
      return days >= -7 && days <= 21;
    });
    if (!near.length) return null;
    const latest = [...near].sort((a, b) => b.done_on.localeCompare(a.done_on)).slice(0, 8);
    return h("div", { className: "diary-box" }, h("h3", {}, this.t("lastYears")), this._renderTimeline(latest, true, back));
  }

  /** The latest event of this kind on this target (same crop, its zones) before this year. */
  _lastTime(kind, target, beforeYear) {
    let events;
    if (target.planting_id && this._planting(target.planting_id)) {
      events = this._relatedPlantings(this._planting(target.planting_id)).flatMap((p) => this._eventsFor({ planting_id: p.id }));
    } else if (target.zone_id) {
      events = this._eventsFor({ zone_id: target.zone_id });
    } else return null;
    return events
      .filter((e) => e.kind === kind && Number(e.done_on.slice(0, 4)) < beforeYear)
      .sort((a, b) => b.done_on.localeCompare(a.done_on))[0];
  }

  _lastTimeText(event) {
    const review = this._data.events.find(
      (e) => e.kind === "review" && e.planting_id && e.planting_id === event.planting_id && e.done_on.startsWith(event.done_on.slice(0, 4)),
    );
    return [
      this.t("lastTime", { date: this._date(event.done_on) }),
      event.quantity ? this._quantity(event.quantity, event.unit) : null,
      event.moon_phase ? MOON_ICONS[event.moon_phase] : null,
      event.weather ? weatherText(event.weather) : null,
      review?.rating ? "★".repeat(review.rating) + "☆".repeat(5 - review.rating) : null,
      event.notes,
    ]
      .filter(Boolean)
      .join(" · ");
  }

  _renderDiary() {
    const f = this._diaryFilter;
    const all = [...this._data.events, ...this._data.plantings.flatMap((p) => this._startEvents(p))];
    const years = [...new Set(all.map((e) => e.done_on.slice(0, 4)))].sort().reverse();
    const events = all.filter((e) => {
      if (f.kind && e.kind !== f.kind) return false;
      if (f.year && !e.done_on.startsWith(f.year)) return false;
      if (f.zone) {
        const planting = e.planting_id && this._planting(e.planting_id);
        const zoneMatch = e.zone_id && (e.zone_id === f.zone || this._zoneDescendants(f.zone).has(e.zone_id));
        if (!zoneMatch && !(planting && this._inZone(planting, f.zone))) return false;
      }
      return true;
    });
    const filter = (name, options) =>
      h(
        "select",
        {
          onchange: (ev) => {
            this._diaryFilter = { ...this._diaryFilter, [name]: ev.target.value };
            this._render();
          },
        },
        options.map(([v, text]) => h("option", { value: v, selected: v === f[name] }, text)),
      );
    return [
      h(
        "div",
        { className: "actions" },
        h("button", { className: "primary", onclick: () => this._newEvent() }, this.t("addEvent")),
        h("button", { onclick: () => this._openTask({ kind: "note", due_on: today() }) }, this.t("addTask")),
      ),
      this._alertsBox(),
      this._todoBox(this._data.tasks),
      this._monthBox(),
      this._lastYearsBox(this._data.events),
      h(
        "div",
        { className: "row filters" },
        filter("kind", [["", this.t("allKinds")], ...Object.keys(EVENT_ICONS).map((k) => [k, `${EVENT_ICONS[k]} ${this.t(`ev_${k}`)}`])]),
        filter("zone", [["", this.t("allZones")], ...this._zoneOptions().slice(1)]),
        filter("year", [["", this.t("allYears")], ...years.map((y) => [y, y])]),
      ),
      events.length ? this._renderTimeline(events) : h("p", { className: "hint" }, this.t("emptyDiary")),
    ];
  }

  /** Planting or zone picker; value "p:<id>" / "z:<id>" ("" = none, allowed only for tasks). */
  _targetSelect(f, required) {
    const target = f.planting_id ? `p:${f.planting_id}` : f.zone_id ? `z:${f.zone_id}` : "";
    return h(
      "label",
      {},
      this.t("target"),
      h(
        "select",
        { name: "target", required },
        h("option", { value: "", selected: !target }, "—"),
        h(
          "optgroup",
          { label: this.t("plantingsGroup") },
          [...this._data.plantings]
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((p) => h("option", { value: `p:${p.id}`, selected: target === `p:${p.id}` }, p.name)),
        ),
        h(
          "optgroup",
          { label: this.t("zonesGroup") },
          this._zoneOptions()
            .slice(1)
            .map(([id, name]) => h("option", { value: `z:${id}`, selected: target === `z:${id}` }, name)),
        ),
      ),
    );
  }

  _renderEventForm() {
    const f = this._eventForm;
    const kindInput = h("input", { type: "hidden", name: "kind", value: f.kind });
    const extras = {};
    const moonEl = h("span", { className: "hint" });
    const updateMoon = (iso) => {
      const phase = iso ? moonPhase(iso) : null;
      moonEl.textContent = phase ? `${MOON_ICONS[phase]} ${this.t(`moon_${phase}`)}` : "";
    };
    extras.review = h(
      "div",
      { className: "review" },
      this._starsField(f.rating),
      this._selectField(f, "abundance", [["", "—"], ...["poor", "normal", "abundant"].map((a) => [a, this.t(`ab_${a}`)])]),
      h("label", {}, this.t("keep"), h("textarea", { name: "keep", rows: 2, value: f.keep ?? "" })),
      h("label", {}, this.t("avoid"), h("textarea", { name: "avoid", rows: 2, value: f.avoid ?? "" })),
    );
    const lastEl = h("p", { className: "last-time" });
    const updateLast = () => {
      const [type, id] = (form?.elements.target?.value || "").split(":");
      const target = type === "p" ? { planting_id: id } : type === "z" ? { zone_id: id } : {};
      const year = Number((form?.elements.done_on?.value || today()).slice(0, 4));
      const last = this._lastTime(kindInput.value, target, year);
      lastEl.textContent = last ? this._lastTimeText(last) : "";
      lastEl.hidden = !last;
    };
    let form = null;
    const currentTarget = () => {
      const [type, id] = (form?.elements.target?.value || (f.planting_id ? `p:${f.planting_id}` : f.zone_id ? `z:${f.zone_id}` : "")).split(":");
      return type === "p" ? { planting_id: id } : type === "z" ? { zone_id: id } : {};
    };
    // Woodland targets get the woodland kinds; gardens the others. The current kind always stays visible.
    const filterKinds = () => {
      const wood = this._isWoodland(currentTarget());
      kinds.querySelectorAll("button").forEach((b) => {
        const kind = b.dataset.kind;
        b.hidden = kind !== kindInput.value && (wood ? !WOOD_KINDS.includes(kind) && !WOODLAND_ALSO.includes(kind) : WOOD_KINDS.includes(kind));
      });
    };
    const showExtras = () => {
      const kind = kindInput.value;
      updateLast();
      extras.review.hidden = kind !== "review";
      extras.product.hidden = !PRODUCT_LABEL[kind];
      productLabel.firstChild.textContent = this.t(PRODUCT_LABEL[kind] || "product");
      doseLabel.hidden = !["fertilizing", "treatment"].includes(kind);
      shopButton.hidden = doseLabel.hidden;
      productInput.setAttribute("list", kind === "wood_cutting" ? "homestead-essences" : "");
      extras.harvest.hidden = !QUANTITY_UNITS[kind];
      if (QUANTITY_UNITS[kind]) {
        const units = QUANTITY_UNITS[kind];
        const previous = unitSelect.value || f.unit;
        const fallback = WOOD_KINDS.includes(kind) && kind !== "foraging" ? this._woodUnit() : units[0];
        const value = units.includes(previous) ? previous : units.includes(fallback) ? fallback : units[0];
        unitSelect.replaceChildren(...units.map((u) => h("option", { value: u, selected: u === value }, this.t(`u_${u}`))));
        unitSelect.value = value;
      }
    };
    const kinds = h(
      "div",
      { className: "kinds" },
      Object.entries(EVENT_ICONS).map(([kind, icon]) =>
        h(
          "button",
          {
            type: "button",
            className: kind === f.kind ? "active" : "",
            "data-kind": kind,
            onclick: (ev) => {
              kindInput.value = kind;
              kinds.querySelectorAll("button").forEach((b) => b.classList.toggle("active", b === ev.currentTarget));
              showExtras();
              filterKinds();
            },
          },
          h("span", {}, icon),
          this.t(`ev_${kind}`),
        ),
      ),
    );
    const targetSelect = this._targetSelect(f, true);
    const date = this._field(f, "done_on", {
      type: "date",
      required: true,
      oninput: (ev) => {
        updateMoon(ev.target.value);
        updateLast();
      },
    });
    targetSelect.querySelector("select").addEventListener("change", () => {
      updateLast();
      filterKinds();
    });
    const productInput = h("input", { name: "product", value: f.product ?? "" });
    const productLabel = h("label", {}, this.t("product"), productInput);
    const doseLabel = this._field(f, "dose", { placeholder: "30 g / 10 L" });
    const essences = [...new Set(this._data.zones.flatMap((z) => (z.species || []).map((e) => e.name)))];
    const shopButton = h(
      "button",
      {
        type: "button",
        style: "flex:none;align-self:end",
        title: this.t("shop"),
        onclick: () => productInput.value.trim() && this._addToShopping(productInput.value.trim()),
      },
      "🛒",
    );
    extras.product = h(
      "div",
      { className: "row" },
      productLabel,
      doseLabel,
      shopButton,
      h("datalist", { id: "homestead-essences" }, essences.map((name) => h("option", { value: name }))),
    );
    const unitSelect = h("select", { name: "unit" });
    extras.harvest = h(
      "div",
      { className: "row" },
      h("label", {}, this.t("quantity_h"), h("input", { name: "quantity", type: "number", min: 0, step: "any", value: f.quantity ?? "", inputMode: "decimal" })),
      h("label", {}, this.t("unit"), unitSelect),
    );
    const money = f.id
      ? null
      : h(
          "div",
          { className: "row" },
          this._field({}, "cost", { type: "number", min: 0, step: "0.01", inputMode: "decimal" }),
          this._field({}, "revenue", { type: "number", min: 0, step: "0.01", inputMode: "decimal" }),
        );
    this._eventPhotoInput = h("input", { type: "file", accept: "image/*", name: "photo" });
    this._eventPhotosEl = h("div", { className: "photos" });
    showExtras();
    updateMoon(f.done_on);
    form = h(
      "form",
      { onsubmit: (ev) => this._saveEvent(ev) },
      h("h2", {}, f.id ? this.t("editEventTitle") : this.t("newEventTitle")),
      kindInput,
      kinds,
      targetSelect,
      h("div", { className: "row date-moon" }, date, moonEl),
      lastEl,
      extras.product,
      extras.harvest,
      extras.review,
      money,
      this._notes(f),
      f.id ? this._eventPhotosEl : null,
      h("label", {}, this.t("eventPhoto"), this._eventPhotoInput),
      this._formButtons(
        f.id,
        () => this._deleteEvent(),
        () => {
          const back = this._eventBack;
          if (back?.planting_id) this._select(back.planting_id);
          else if (back?.zone_id) this._selectZone(back.zone_id);
          else this._close();
        },
      ),
    );
    this._fillEventPhotos();
    updateLast();
    filterKinds();
    return [form];
  }

  _fillEventPhotos() {
    if (!this._eventPhotosEl || !this._eventForm?.id) return;
    const photos = this._data.photos.filter((p) => p.event_id === this._eventForm.id);
    this._eventPhotosEl.replaceChildren(
      ...photos.map((photo) => {
        const img = h("img", { alt: this._date(photo.taken_on), loading: "lazy" });
        this._photoUrl(photo.id).then((url) => (img.src = url));
        return h("button", { type: "button", className: "thumb", onclick: () => this._showPhoto(photo, img) }, img);
      }),
    );
  }

  async _saveEvent(ev) {
    ev.preventDefault();
    const v = Object.fromEntries(new FormData(ev.target));
    const [type, targetId] = (v.target || ":").split(":");
    const data = {
      kind: v.kind,
      done_on: v.done_on,
      ...(type === "p" ? { planting_id: targetId } : { zone_id: targetId }),
      product: v.product?.trim() || null,
      dose: v.dose?.trim() || null,
      quantity: QUANTITY_UNITS[v.kind] && v.quantity ? Number(v.quantity) : null,
      rating: v.kind === "review" && v.rating ? Number(v.rating) : null,
      abundance: v.kind === "review" ? v.abundance || null : null,
      keep: v.kind === "review" ? v.keep?.trim() || null : null,
      avoid: v.kind === "review" ? v.avoid?.trim() || null : null,
      unit: QUANTITY_UNITS[v.kind] ? v.unit || QUANTITY_UNITS[v.kind][0] : null,
      notes: v.notes?.trim() || null,
    };
    if (!PRODUCT_LABEL[v.kind]) data.product = null;
    if (!["fertilizing", "treatment"].includes(v.kind)) data.dose = null;
    const id = this._eventForm.id;
    if (!id) {
      if (v.cost) data.cost = Number(v.cost);
      if (v.revenue) data.revenue = Number(v.revenue);
      if (this._eventForm.task_id) data.task_id = this._eventForm.task_id;
    }
    const file = this._eventPhotoInput.files?.[0];
    const result = await this._call(id ? "update_event" : "add_event", id ? { id, ...data } : data);
    if (!result) return;
    if (file) {
      try {
        const content = await shrinkImage(file, PHOTO_MAX_PX);
        await this._hass.callWS({ type: "homestead/photo/upload", event_id: result.id, content, taken_on: data.done_on });
      } catch (err) {
        this._showMessage(err.message || String(err), true);
        return;
      }
    }
    if (data.kind === "removal" && !id) {
      // End of a crop: ask for the season review right away.
      const back = this._eventBack;
      const target = data.planting_id ? { planting_id: data.planting_id } : { zone_id: data.zone_id };
      this._openEvent({ kind: "review", done_on: data.done_on, ...target }, back);
      this._showMessage(`✓ ${this.t("saved", { name: this.t("ev_removal") })}`);
      return;
    }
    this._eventDone(this.t(`ev_${data.kind}`));
  }

  _starsField(value) {
    const input = h("input", { type: "hidden", name: "rating", value: value ?? "" });
    const stars = [1, 2, 3, 4, 5].map((n) =>
      h(
        "button",
        {
          type: "button",
          className: "star",
          onclick: () => {
            input.value = input.value === String(n) ? "" : String(n);
            paint();
          },
        },
        "★",
      ),
    );
    const paint = () => stars.forEach((b, i) => b.classList.toggle("on", i < Number(input.value || 0)));
    paint();
    return h("label", {}, this.t("rating"), h("div", { className: "stars" }, stars), input);
  }

  _reviewLine(e) {
    return h(
      "span",
      { className: "sub" },
      [
        e.rating ? "★".repeat(e.rating) + "☆".repeat(5 - e.rating) : null,
        e.abundance ? `${this.t("abundance")}: ${this.t(`ab_${e.abundance}`)}` : null,
        e.keep ? `${this.t("keep")}: ${e.keep}` : null,
        e.avoid ? `${this.t("avoid")}: ${e.avoid}` : null,
      ]
        .filter(Boolean)
        .join(" · "),
    );
  }

  // ---------- planned activities ----------

  _openTask(task, back = null) {
    this._clearSelection();
    this._showMessage("");
    this._tab = "diary";
    this._taskBack = back;
    this._taskForm = { ...task };
    this._syncMap();
    this._render();
  }

  _taskLabel(task) {
    const icon = EVENT_ICONS[task.kind] || "📝";
    const target = task.planting_id || task.zone_id ? this._targetName(task) : null;
    return `${icon} ${[task.title || this.t(`ev_${task.kind}`), target].filter(Boolean).join(" — ")}`;
  }

  /** Open tasks, oldest due first; ✔ opens the diary form already filled in. */
  _todoBox(tasks, back = null) {
    const open = tasks.filter((t) => !t.done_on).sort((a, b) => a.due_on.localeCompare(b.due_on));
    const now = today();
    return h(
      "div",
      { className: "todo" },
      h("h3", {}, this.t("tabTodo")),
      open.length
        ? open.map((t) =>
            h(
              "div",
              { className: `task${t.due_on < now ? " late" : ""}` },
              h(
                "button",
                {
                  type: "button",
                  className: "tick",
                  title: this.t("done"),
                  onclick: () => this._completeFromTask(t, back),
                },
                "✔",
              ),
              h(
                "button",
                { type: "button", className: "task-main", onclick: () => this._openTask(t, back) },
                h("span", {}, this._taskLabel(t)),
                h(
                  "span",
                  { className: "sub" },
                  `${this._date(t.due_on)}${t.due_on < now ? ` · ${this.t("overdue")}` : ""}${t.yearly ? " · 🔁" : ""}`,
                ),
                this._adviceLine(t),
              ),
            ),
          )
        : h("p", { className: "hint" }, this.t("nothingToDo")),
    );
  }

  /** Weather verdict of a planned activity in the forecast range: good day, or why not and when instead. */
  _adviceLine(task) {
    const verdict = this._outlook?.advice?.[task.id];
    if (!verdict) return null;
    if (!verdict.issues.length) return h("span", { className: "sub info" }, this.t("goodDay"));
    const reasons = verdict.issues.map((issue) => this.t(`issue_${issue}`)).join(", ");
    const better = verdict.best ? ` · ${this.t("better_on", { date: this._date(verdict.best, false) })}` : "";
    return h("span", { className: "sub warn", style: "white-space:normal" }, `⚠️ ${reasons}${better}`);
  }

  /** The diary form filled in from a planned activity (✔, or a tapped phone notification). */
  _completeFromTask(t, back = null) {
    this._newEvent(
      {
        kind: t.kind,
        planting_id: t.planting_id,
        zone_id: t.zone_id,
        notes: [t.title, t.notes].filter(Boolean).join(" — ") || null,
        task_id: t.id,
      },
      back,
    );
  }

  /** `/homestead?task=<id>` (from a notification) opens that task once the data has arrived. */
  _openTaskFromUrl() {
    const id = new URLSearchParams(window.location.search).get("task");
    if (!id || !this._loaded) return;
    history.replaceState(history.state, "", window.location.pathname);
    const task = this._data.tasks.find((t) => t.id === id);
    if (task && !task.done_on) this._completeFromTask(task);
    else if (task) this._setTab("diary");
  }

  set route(route) {
    this._route = route;
    if (this._hass) this._openTaskFromUrl();
  }

  _plantingTodo(f) {
    const back = { planting_id: f.id };
    this._todoEl = h("div");
    this._todoPlanting = f;
    this._refreshPlantingTodo();
    return h(
      "div",
      {},
      this._todoEl,
      h(
        "button",
        { type: "button", onclick: () => this._openTask({ kind: "pruning", due_on: today(), planting_id: f.id }, back) },
        this.t("addTask"),
      ),
    );
  }

  _refreshPlantingTodo() {
    const f = this._todoPlanting;
    if (!this._todoEl || !f) return;
    const mine = this._data.tasks.filter((t) => t.planting_id === f.id || (t.zone_id && this._inZone(f, t.zone_id)));
    this._todoEl.replaceChildren(this._todoBox(mine, { planting_id: f.id }));
  }

  _renderTaskForm() {
    const f = this._taskForm;
    const kinds = Object.entries(EVENT_ICONS).map(([k, icon]) => [k, `${icon} ${this.t(`ev_${k}`)}`]);
    return [
      h(
        "form",
        { onsubmit: (ev) => this._saveTask(ev) },
        h("h2", {}, f.id ? this.t("editTaskTitle") : this.t("newTaskTitle")),
        this._selectField(f, "kind", kinds),
        this._targetSelect(f, false),
        h("div", { className: "row" }, this._field(f, "due_on", { type: "date", required: true })),
        this._field(f, "title", { maxLength: 100 }),
        h("label", { className: "check" }, h("input", { type: "checkbox", name: "yearly", checked: !!f.yearly }), this.t("yearly")),
        this._notes(f),
        this._formButtons(f.id, () => this._deleteTask(), () => this._taskDone()),
      ),
    ];
  }

  _taskDone(name = null, key = "saved") {
    const back = this._taskBack;
    this._taskBack = null;
    if (back?.planting_id) this._select(back.planting_id);
    else this._close();
    if (name) this._showMessage(`✓ ${this.t(key, { name })}`);
  }

  async _saveTask(ev) {
    ev.preventDefault();
    const v = Object.fromEntries(new FormData(ev.target));
    const [type, targetId] = (v.target || ":").split(":");
    const data = {
      kind: v.kind,
      due_on: v.due_on,
      planting_id: type === "p" ? targetId : null,
      zone_id: type === "z" ? targetId : null,
      title: v.title?.trim() || null,
      yearly: v.yearly === "on",
      notes: v.notes?.trim() || null,
    };
    if (data.planting_id) delete data.zone_id;
    else if (data.zone_id) delete data.planting_id;
    else delete data.zone_id;
    const id = this._taskForm.id;
    if (await this._call(id ? "update_task" : "add_task", id ? { id, ...data } : data)) {
      this._taskDone(data.title || this.t(`ev_${data.kind}`));
    }
  }

  async _deleteTask() {
    if (!confirm(this.t("confirmDeleteTask"))) return;
    const name = this._taskForm.title || this.t(`ev_${this._taskForm.kind}`);
    if (await this._call("delete_task", { id: this._taskForm.id })) this._taskDone(name, "deleted");
  }

  // ---------- seasons ----------

  /** Plantings of the same crop over the years: same imported species, else same species text. */
  _relatedPlantings(planting) {
    const key = (p) => (p.taxon_id ? `t:${p.taxon_id}` : `s:${p.species.trim().toLowerCase()}`);
    return this._data.plantings.filter((p) => key(p) === key(planting));
  }

  /** One row per planting and year: what was done, how it went, with the weather of key moments. */
  _seasonRows(planting) {
    const rows = new Map();
    const row = (p, year) => {
      const id = `${year}:${p.id}`;
      if (!rows.has(id)) rows.set(id, { year, planting: p, events: [] });
      return rows.get(id);
    };
    for (const p of this._relatedPlantings(planting)) {
      for (const e of this._eventsFor({ planting_id: p.id })) row(p, e.done_on.slice(0, 4)).events.push(e);
      for (const date of [p.sown_on, p.planted_on].filter(Boolean)) row(p, date.slice(0, 4));
    }
    return [...rows.values()].sort((a, b) => b.year.localeCompare(a.year) || a.planting.name.localeCompare(b.planting.name));
  }

  _seasonsBox(planting) {
    const rows = this._seasonRows(planting);
    const several = new Set(rows.map((r) => r.planting.id)).size > 1;
    const year = String(new Date().getFullYear());
    const thisYear = rows.find((r) => r.year === year && r.planting.id === planting.id);
    const reviewed = thisYear?.events.some((e) => e.kind === "review" && e.planting_id === planting.id);
    const askReview = thisYear && !reviewed && (planting.status !== "active" || new Date().getMonth() >= 8);
    return h(
      "div",
      { className: "seasons" },
      h("h3", {}, this.t("seasons")),
      askReview
        ? h(
            "button",
            {
              type: "button",
              className: "review-ask",
              onclick: () => this._newEvent({ kind: "review", planting_id: planting.id }, { planting_id: planting.id }),
            },
            `${this.t("reviewMissing", { year })} → ${this.t("writeReview")}`,
          )
        : null,
      rows.length
        ? rows.map((r) => this._seasonCard(r, several, r.planting.id === planting.id))
        : h("p", { className: "hint" }, this.t("noSeasons")),
    );
  }

  _seasonCard({ year, planting, events }, several, current) {
    const of = (kind) => events.filter((e) => e.kind === kind).sort((a, b) => a.done_on.localeCompare(b.done_on));
    const review = of("review").at(-1);
    const day = (e) => {
      const w = e.weather;
      const extra = w ? ` ${w.t_mean != null ? `${Math.round(w.t_mean)}°` : ""}${w.rain_mm != null ? ` ${Math.round(w.rain_mm)}mm` : ""}` : "";
      return `${this._date(e.done_on, false)} ${MOON_ICONS[e.moon_phase] || ""}${extra}`;
    };
    const sown = of("sowing")[0] || (planting.sown_on?.startsWith(year) ? { done_on: planting.sown_on, moon_phase: planting.sown_moon_phase } : null);
    const planted = planting.planted_on?.startsWith(year) ? { done_on: planting.planted_on, moon_phase: planting.moon_phase } : null;
    const harvests = of("harvest");
    const totals = {};
    harvests.forEach((e) => e.quantity && (totals[e.unit || "kg"] = (totals[e.unit || "kg"] || 0) + e.quantity));
    const harvestText = Object.entries(totals).map(([u, q]) => this._quantity(q, u)).join(" + ");
    const parts = [
      sown ? `🌱 ${day(sown)}` : null,
      planted ? `🪴 ${day(planted)}` : null,
      ...of("pruning").map((e) => `✂️ ${day(e)}`),
      ...of("fertilizing").map((e) => `🌿 ${day(e)}`),
      of("treatment").length ? `🧪 ${this.t("treatments", { count: of("treatment").length })}` : null,
      harvestText || harvests.length ? `🍎 ${harvestText || harvests.length}` : review?.abundance ? `🍎 ${this.t(`ab_${review.abundance}`)}` : null,
      ...of("removal").map((e) => `🏁 ${day(e)}`),
    ].filter(Boolean);
    return h(
      "div",
      { className: `season${current ? " current" : ""}` },
      h(
        "div",
        { className: "season-head" },
        h("strong", {}, year),
        several ? h("span", {}, [planting.name, planting.variety].filter(Boolean).join(" · ")) : planting.variety ? h("span", {}, planting.variety) : null,
        this._zone(planting.zone_id) ? h("span", { className: "sub" }, this._zone(planting.zone_id).name) : null,
        review?.rating ? h("span", { className: "stars-read" }, "★".repeat(review.rating) + "☆".repeat(5 - review.rating)) : null,
      ),
      parts.length ? h("div", { className: "sub" }, parts.join(" · ")) : null,
      review?.keep ? h("div", { className: "sub" }, `${this.t("keep")}: ${review.keep}`) : null,
      review?.avoid ? h("div", { className: "sub" }, `${this.t("avoid")}: ${review.avoid}`) : null,
    );
  }

  _plantingActions(f) {
    const last = this._data.events
      .filter((e) => e.kind === "harvest" && e.planting_id === f.id)
      .sort((a, b) => b.done_on.localeCompare(a.done_on))[0];
    return h(
      "div",
      { className: "actions" },
      h(
        "button",
        {
          type: "button",
          onclick: () =>
            this._newEvent(
              { kind: "harvest", planting_id: f.id, quantity: last?.quantity, unit: last?.unit || "kg" },
              { planting_id: f.id },
            ),
        },
        this.t("quickHarvest"),
      ),
      h(
        "button",
        {
          type: "button",
          onclick: async () => {
            const result = await this._call("repeat_planting", { id: f.id });
            if (!result) return;
            const copy = { ...f, id: result.id, name: result.name, sown_on: null, planted_on: null, status: "active" };
            this._select(result.id, copy);
            this._showMessage(`✓ ${this.t("repeated", { name: result.name })}`);
          },
        },
        this.t("repeat"),
      ),
    );
  }

  async _deleteEvent() {
    if (!confirm(this.t("confirmDeleteEvent"))) return;
    if (await this._call("delete_event", { id: this._eventForm.id })) this._eventDone(this.t(`ev_${this._eventForm.kind}`), "deleted");
  }

  // ---------- seeds ----------

  _seedName(lot) {
    const common = this._taxon(lot.taxon_id)?.common_names?.[this._lang()];
    return [common || lot.species, lot.variety].filter(Boolean).join(" · ");
  }

  _seedViability(lot) {
    return lot.viability_years || SEED_VIABILITY[this._taxon(lot.taxon_id)?.family] || 3;
  }

  /** null when fine, else a warning about the age of the seeds. */
  _seedWarning(lot) {
    if (!lot.year || lot.finished) return null;
    const age = new Date().getFullYear() - lot.year;
    const years = this._seedViability(lot);
    if (age > years) return this.t("seedsOld", { years });
    return age === years ? this.t("seedsLastYear") : null;
  }

  _openSeed(lot) {
    this._clearSelection();
    this._showMessage("");
    this._tab = "seeds";
    this._seedForm = { ...lot };
    this._syncMap();
    this._render();
  }

  _renderSeedList() {
    const lots = [...this._data.seeds].sort((a, b) => a.finished - b.finished || this._seedName(a).localeCompare(this._seedName(b)));
    return [
      h(
        "div",
        { className: "actions" },
        h("button", { className: "primary", onclick: () => this._openSeed({ year: new Date().getFullYear() }) }, `+ ${this.t("addSeed")}`),
        h("button", { onclick: () => this._csvPick("seeds") }, this.t("csvImport")),
        h("button", { onclick: () => this._csvTemplate("seeds") }, this.t("csvTemplate")),
      ),
      lots.length
        ? h(
            "ul",
            {},
            lots.map((lot) => {
              const warning = this._seedWarning(lot);
              return h(
                "li",
                { onclick: () => this._openSeed(lot), style: lot.finished ? "opacity:.55" : "" },
                h("span", { className: "dot", style: `background:${lot.finished ? STATUS_COLOR.removed : warning ? "#ffa600" : STATUS_COLOR.active}` }),
                h(
                  "div",
                  { className: "main" },
                  h("div", {}, this._seedName(lot)),
                  h(
                    "div",
                    { className: "sub" },
                    [lot.year, lot.supplier, lot.quantity, lot.finished ? this.t("finished") : null].filter(Boolean).join(" · "),
                  ),
                  warning ? h("div", { className: "sub warn" }, warning) : null,
                  !lot.finished && this._inMonth(this._crop(lot.species), ["sow_indoor", "sow_outdoor"])
                    ? h("div", { className: "sub info" }, this.t("sowNow"))
                    : null,
                ),
              );
            }),
          )
        : h("p", { className: "hint" }, this.t("emptySeeds")),
    ];
  }

  _renderSeedForm() {
    const f = this._seedForm;
    const family = this._taxon(f.taxon_id)?.family;
    return [
      h(
        "form",
        { onsubmit: (ev) => this._saveSeed(ev) },
        h("h2", {}, f.id ? this.t("editSeedTitle") : this.t("newSeedTitle")),
        this._speciesField(f),
        this._field(f, "variety"),
        h(
          "div",
          { className: "row" },
          this._field(f, "year", { type: "number", min: 1900, max: 2200, step: 1, inputMode: "numeric" }),
          this._field(f, "quantity", { placeholder: "1 bustina" }),
        ),
        this._field(f, "supplier"),
        h(
          "label",
          {},
          this.t("viability_years"),
          h("input", { name: "viability_years", type: "number", min: 1, max: 50, step: 1, value: f.viability_years ?? "", inputMode: "numeric" }),
          h("span", { className: "hint" }, this.t("viabilityHint", { years: SEED_VIABILITY[family] || 3 })),
        ),
        h("label", { className: "check" }, h("input", { type: "checkbox", name: "finished", checked: !!f.finished }), this.t("finished")),
        f.id ? null : this._field(f, "price", { type: "number", min: 0, step: "0.01", inputMode: "decimal" }),
        this._notes(f),
        this._formButtons(f.id, () => this._deleteSeed()),
      ),
      f.id
        ? h(
            "div",
            { className: "actions" },
            h("button", { type: "button", onclick: () => this._addToShopping(this.t("seedsItem", { name: this._seedName(f) })) }, this.t("shop")),
          )
        : null,
    ];
  }

  async _saveSeed(ev) {
    ev.preventDefault();
    const v = Object.fromEntries(new FormData(ev.target));
    if (!v.species?.trim()) {
      this._showMessage(this.t("required"), true);
      return;
    }
    const data = {
      species: v.species.trim(),
      taxon_id: v.taxon_id || null,
      variety: v.variety?.trim() || null,
      year: v.year ? Number(v.year) : null,
      quantity: v.quantity?.trim() || null,
      supplier: v.supplier?.trim() || null,
      viability_years: v.viability_years ? Number(v.viability_years) : null,
      finished: v.finished === "on",
      notes: v.notes?.trim() || null,
    };
    const id = this._seedForm.id;
    if (!id && v.price) data.price = Number(v.price);
    if (await this._call(id ? "update_seed_lot" : "add_seed_lot", id ? { id, ...data } : data)) this._saved(this._seedName(data));
  }

  async _deleteSeed() {
    if (!confirm(this.t("confirmDeleteSeed"))) return;
    if (await this._call("delete_seed_lot", { id: this._seedForm.id })) this._saved(this._seedName(this._seedForm), "deleted");
  }

  /** HA's shopping list (todo.shopping_list), else the first to-do list that is not ours. */
  _shoppingList() {
    const ids = Object.keys(this._hass.states || {}).filter((id) => id.startsWith("todo."));
    const ours = (id) => this._hass.entities?.[id]?.platform === "homestead" || id.startsWith("todo.ha_homestead");
    return ids.includes("todo.shopping_list") ? "todo.shopping_list" : ids.find((id) => !ours(id));
  }

  async _addToShopping(item) {
    const entity_id = this._shoppingList();
    if (!entity_id) return this._showMessage(this.t("noShoppingList"), true);
    try {
      await this._hass.callService("todo", "add_item", { item }, { entity_id });
      this._showMessage(`✓ ${this.t("shopAdded", { item })}`);
    } catch (err) {
      this._showMessage(err.message || String(err), true);
    }
  }

  // ---------- crop data ----------

  /** Same rule as crops.py: genus and species, hybrid sign ignored. */
  _cropKey(name) {
    return (name || "").toLowerCase().replace(/\s[x×]\s|×/g, " ").split(/\s+/).filter(Boolean).slice(0, 2).join(" ");
  }

  /** The user's values win over the built-in table (exact species, then a genus entry). */
  _crop(species) {
    const key = this._cropKey(species);
    if (!key) return null;
    const mine = this._data.crops.find((c) => this._cropKey(c.species) === key);
    const builtIn = this._cropDefaults[key] || this._cropDefaults[key.split(" ")[0]];
    if (mine) {
      const { family, good, bad, name_en, warm } = builtIn || {};
      return { family, good, bad, name_en, warm, ...mine, source: "user" };
    }
    return builtIn ? { ...builtIn, source: builtIn.source === "cropgraph" ? "cropgraph" : "default" } : null;
  }

  _inMonth(crop, keys, month = new Date().getMonth() + 1) {
    return !!crop && keys.some((key) => (crop[key] || []).includes(month));
  }

  _monthLetters() {
    const format = new Intl.DateTimeFormat(this._lang(), { month: "narrow" });
    return Array.from({ length: 12 }, (_, i) => format.format(new Date(2026, i, 15)));
  }

  _cropMonths(crop) {
    const now = new Date().getMonth() + 1;
    const rows = CROP_MONTHS.filter((key) => crop[key]?.length);
    if (!rows.length) return null;
    return h(
      "div",
      { className: "crop-months" },
      h("span"),
      this._monthLetters().map((m) => h("span", { className: "m" }, m)),
      rows.flatMap((key) => [
        h("span", {}, this.t(key)),
        ...Array.from({ length: 12 }, (_, i) =>
          h("span", {
            className: `cell${i + 1 === now ? " now" : ""}`,
            style: crop[key].includes(i + 1) ? `background:${CROP_COLOR[key]}` : "",
          }),
        ),
      ]),
    );
  }

  _cropBox(planting) {
    const crop = this._crop(planting.species);
    const facts = crop
      ? [
          (crop.exposure || []).map((e) => this.t(`ex_${e}`)).join(" / ") || null,
          crop.hardiness_c != null ? this.t("hardiness", { value: crop.hardiness_c }) : null,
          crop.spacing_cm ? this.t("spacing", { value: crop.spacing_cm }) : null,
        ].filter(Boolean)
      : [];
    return h(
      "div",
      { className: "seasons" },
      h(
        "div",
        { className: "row header" },
        h("h3", {}, this.t("cropBox")),
        h(
          "button",
          { type: "button", style: "flex:none", onclick: () => this._openCrop(planting.species, crop, { planting_id: planting.id }) },
          this.t(crop ? "cropEdit" : "cropAdd"),
        ),
      ),
      crop
        ? [
            facts.length ? h("div", {}, facts.join(" · ")) : null,
            this._cropMonths(crop),
            crop.family ? h("div", { className: "sub" }, `${this.t("family")}: ${crop.family}`) : null,
            this._companionsLine("goodWith", crop.good),
            this._companionsLine("badWith", crop.bad),
            crop.notes ? h("div", { className: "sub" }, crop.notes) : null,
            h("div", { className: "sub" }, this._cropSource(crop)),
          ]
        : h("p", { className: "hint" }, this.t("cropMissing")),
    );
  }

  _cropSource(crop) {
    if (crop.source === "user") return this.t("cropMine");
    if (crop.source !== "cropgraph") return this.t("cropDefault");
    const frost = this._outlook?.climate?.frost;
    if (!frost?.last_spring || !frost?.first_fall) return this.t("cropGraphFallback");
    const day = (mmdd) => this._date(`2025-${mmdd}`, false);
    return this.t("cropGraph", { spring: day(frost.last_spring), fall: day(frost.first_fall) });
  }

  /** Name of a species key in the user's words: their plantings or imported species first. */
  _speciesLabel(key) {
    const planting = this._data.plantings.find((p) => this._cropKey(p.species) === key);
    const taxon = this._data.taxa.find((t) => this._cropKey(t.scientific_name) === key);
    const common = taxon?.common_names?.[this._lang()];
    if (common) return common;
    if (planting) return planting.name;
    const entry = this._cropDefaults[key];
    return entry?.name_en ? `${entry.name_en} (${entry.species})` : key;
  }

  /** Companions: those already in the garden first (✓), then a few others. */
  _companionsLine(label, keys) {
    if (!keys?.length) return null;
    const here = new Set(this._data.plantings.filter((p) => p.status === "active").map((p) => this._cropKey(p.species)));
    const mine = keys.filter((k) => here.has(k));
    const others = keys.filter((k) => !here.has(k)).slice(0, Math.max(0, 6 - mine.length));
    const names = [...mine.map((k) => `✓ ${this._speciesLabel(k)}`), ...others.map((k) => this._speciesLabel(k))];
    return h("div", { className: "sub", style: "white-space:normal" }, `${this.t(label)}: ${names.join(", ")}${keys.length > names.length ? " …" : ""}`);
  }

  _openCrop(species, crop, back) {
    this._clearSelection();
    this._showMessage("");
    this._cropBack = back;
    // Built-in values may come from a genus entry: corrections are saved for this very species.
    this._cropForm = { ...(crop || {}), species: crop?.source === "user" ? crop.species : species.trim() };
    this._syncMap();
    this._render();
  }

  _cropDone(name = null, key = "saved") {
    const back = this._cropBack;
    this._cropBack = null;
    if (back?.planting_id) this._select(back.planting_id);
    else this._close();
    if (name) this._showMessage(`✓ ${this.t(key, { name })}`);
  }

  _renderCropForm() {
    const f = this._cropForm;
    const months = Object.fromEntries(CROP_MONTHS.map((key) => [key, new Set(f[key] || [])]));
    const letters = this._monthLetters();
    const grid = h(
      "div",
      { className: "crop-months" },
      h("span"),
      letters.map((m) => h("span", { className: "m" }, m)),
      CROP_MONTHS.flatMap((key) => [
        h("span", {}, this.t(key)),
        ...letters.map((_, i) => {
          const paint = (b) => (b.style.background = months[key].has(i + 1) ? CROP_COLOR[key] : "");
          const button = h("button", {
            type: "button",
            className: "cell",
            title: `${this.t(key)} ${i + 1}`,
            onclick: (ev) => {
              months[key].has(i + 1) ? months[key].delete(i + 1) : months[key].add(i + 1);
              paint(ev.currentTarget);
            },
          });
          paint(button);
          return button;
        }),
      ]),
    );
    this._cropMonthsState = months;
    return [
      h(
        "form",
        { onsubmit: (ev) => this._saveCrop(ev) },
        h("h2", {}, this.t("cropTitle", { species: f.species })),
        h(
          "label",
          {},
          this.t("exposure"),
          h(
            "div",
            { className: "row" },
            ["sun", "partial", "shade"].map((e) =>
              h("label", { className: "check" }, h("input", { type: "checkbox", name: `ex_${e}`, checked: (f.exposure || []).includes(e) }), this.t(`ex_${e}`)),
            ),
          ),
        ),
        h(
          "div",
          { className: "row" },
          this._field(f, "hardiness_c", { type: "number", min: -60, max: 30, step: 1 }),
          this._field(f, "spacing_cm", { type: "number", min: 1, max: 5000, step: 1 }),
          this._field(f, "heat_max_c", { type: "number", min: 10, max: 50, step: 1 }),
        ),
        grid,
        this._notes(f),
        this._formButtons(null, null, () => this._cropDone()),
        f.source === "user"
          ? h("div", { className: "row" }, h("button", { type: "button", className: "danger", onclick: () => this._resetCrop() }, this.t("cropReset")))
          : null,
      ),
    ];
  }

  async _saveCrop(ev) {
    ev.preventDefault();
    const v = Object.fromEntries(new FormData(ev.target));
    const data = {
      species: this._cropForm.species,
      exposure: ["sun", "partial", "shade"].filter((e) => v[`ex_${e}`] === "on"),
      hardiness_c: v.hardiness_c === "" ? null : Number(v.hardiness_c),
      spacing_cm: v.spacing_cm ? Number(v.spacing_cm) : null,
      heat_max_c: v.heat_max_c ? Number(v.heat_max_c) : null,
      notes: v.notes?.trim() || null,
      ...Object.fromEntries(CROP_MONTHS.map((key) => [key, [...this._cropMonthsState[key]].sort((a, b) => a - b)])),
    };
    if (await this._call("set_crop_profile", data)) this._cropDone(data.species);
  }

  async _resetCrop() {
    if (!confirm(this.t("confirmCropReset"))) return;
    if (await this._call("delete_crop_profile", { id: this._cropForm.id })) this._cropDone(this._cropForm.species, "deleted");
  }

  /** What the calendar says for this month: seeds to sow, seedlings to plant out, crops to harvest. */
  _monthBox() {
    const names = (items) => [...new Set(items)].join(", ");
    const seeds = this._data.seeds.filter((lot) => !lot.finished);
    const seedsFor = (key) => seeds.filter((lot) => this._inMonth(this._crop(lot.species), [key])).map((lot) => this._seedName(lot));
    const active = this._data.plantings.filter((p) => p.status === "active");
    const waiting = active.filter((p) => p.origin === "sown" && !p.planted_on && this._inMonth(this._crop(p.species), ["plant_out"]));
    const harvest = active.filter((p) => this._inMonth(this._crop(p.species), ["harvest"])).map((p) => p.name);
    const lines = [
      ["monthSowIndoor", seedsFor("sow_indoor")],
      ["monthSowOutdoor", seedsFor("sow_outdoor")],
      ["monthPlantOut", waiting.map((p) => p.name)],
      ["monthHarvest", harvest],
    ].filter(([, items]) => items.length);
    if (!lines.length) return null;
    return h(
      "div",
      { className: "summary" },
      h("strong", {}, this.t("thisMonth")),
      lines.map(([key, items]) => h("div", { className: "sub", style: "white-space:normal" }, this.t(key, { names: names(items) }))),
    );
  }

  // ---------- CSV import ----------

  /** Columns of the CSV files: key, Italian header, English header. */
  _csvColumns(kind) {
    return kind === "seeds"
      ? [
          ["species", "specie", "species"],
          ["variety", "varieta", "variety"],
          ["year", "anno", "year"],
          ["supplier", "fornitore", "supplier"],
          ["quantity", "quantita", "quantity"],
          ["viability_years", "durata_anni", "viability_years"],
          ["finished", "finiti", "finished"],
          ["price", "prezzo", "price"],
          ["notes", "note", "notes"],
        ]
      : [
          ["name", "nome", "name"],
          ["species", "specie", "species"],
          ["variety", "varieta", "variety"],
          ["plant_type", "tipo_pianta", "plant_type"],
          ["quantity", "quantita", "quantity"],
          ["origin", "origine", "origin"],
          ["sown_on", "data_semina", "sown_on"],
          ["planted_on", "data_impianto", "planted_on"],
          ["age", "eta_anni", "age_years"],
          ["zone", "zona", "zone"],
          ["latitude", "latitudine", "latitude"],
          ["longitude", "longitudine", "longitude"],
          ["price", "prezzo", "price"],
          ["supplier", "fornitore", "supplier"],
          ["notes", "note", "notes"],
        ];
  }

  /** A file with the headers and one example row; ";" and BOM so Excel opens it as columns. */
  _csvTemplate(kind) {
    const it = this._lang() === "it";
    const columns = this._csvColumns(kind);
    const example =
      kind === "seeds"
        ? {
            species: "Solanum lycopersicum",
            variety: "Cuore di bue",
            year: "2025",
            supplier: it ? "Negozio" : "Shop",
            quantity: it ? "1 bustina" : "1 packet",
            finished: "no",
            price: it ? "2,90" : "2.90",
          }
        : {
            name: it ? "Melo vicino al pozzo" : "Apple tree by the well",
            species: "Malus domestica",
            variety: "Renetta",
            plant_type: this.t("pt_fruit_tree"),
            quantity: "1",
            origin: this.t("planted"),
            planted_on: "15/11/2024",
            age: "2",
            zone: this._data.zones[0]?.name || (it ? "Frutteto" : "Orchard"),
            price: it ? "25,00" : "25.00",
            supplier: it ? "Vivaio" : "Nursery",
          };
    const header = columns.map(([, itName, enName]) => (it ? itName : enName));
    const text = [header, columns.map(([key]) => example[key] ?? "")].map((row) => row.map(csvCell).join(";")).join("\r\n");
    const url = URL.createObjectURL(new Blob(["﻿" + text + "\r\n"], { type: "text/csv" }));
    const name = kind === "seeds" ? (it ? "semi" : "seeds") : it ? "piante" : "plantings";
    const link = h("a", { href: url, download: `homestead-${name}.csv` });
    this.shadowRoot.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  }

  _csvPick(kind) {
    const input = h("input", { type: "file", accept: ".csv,text/csv,text/plain", hidden: true });
    input.addEventListener("change", async () => {
      const file = input.files?.[0];
      input.remove();
      if (file) this._csvLoad(kind, await file.text());
    });
    this.shadowRoot.append(input);
    input.click();
  }

  _csvLoad(kind, text) {
    const table = parseCsv(text);
    const plain = (v) => v.normalize("NFD").replace(/[̀-ͯ]/g, "").trim().toLowerCase().replace(/[\s-]+/g, "_");
    const headers = (table.shift() || []).map(plain);
    const columns = this._csvColumns(kind);
    const index = Object.fromEntries(
      columns.map(([key, itName, enName]) => [key, headers.findIndex((name) => [key, itName, enName].includes(name))]),
    );
    const rows = table
      .filter((cells) => cells.some((c) => c.trim()))
      .map((cells) => {
        const raw = Object.fromEntries(columns.map(([key]) => [key, index[key] >= 0 ? (cells[index[key]] || "").trim() : ""]));
        const row = { include: true, raw, values: {}, issues: {} };
        this._csvCheck(kind, row);
        return row;
      });
    this._clearSelection();
    this._tab = kind === "seeds" ? "seeds" : "plantings";
    if (!rows.length) {
      this._render();
      return this._showMessage(this.t("csvEmpty"), true);
    }
    this._showMessage("");
    this._import = { kind, rows };
    this._syncMap();
    this._render();
  }

  /** Text cells → service values; what is not clear becomes an issue to fix in the review. */
  _csvCheck(kind, row) {
    const raw = row.raw;
    const v = {};
    const issues = {};
    const text = (key) => raw[key] || null;
    const number = (key) => {
      if (!raw[key]) return null;
      const value = Number(raw[key].replace(/\s/g, "").replace(",", "."));
      if (Number.isNaN(value)) issues[key] = this.t("csvBadNumber", { value: raw[key] });
      return Number.isNaN(value) ? null : value;
    };
    const date = (key) => {
      if (!raw[key]) return null;
      const value = parseDate(raw[key]);
      if (!value) issues[key] = this.t("csvBadDate", { value: raw[key] });
      return value;
    };
    const bare = (value) => value.toLowerCase().replace(/^[^\p{L}\p{N}]+/u, "").trim();
    const choice = (key, options) => {
      if (!raw[key]) return null;
      const wanted = bare(raw[key]);
      const found = options.find(([value, label]) => value === wanted || bare(label) === wanted);
      if (!found) issues[key] = this.t("csvBadChoice", { value: raw[key] });
      return found?.[0] ?? null;
    };
    v.species = text("species");
    if (!v.species) issues.species = this.t("csvMissing");
    const named = (t) => [t.scientific_name, ...Object.values(t.common_names || {})].some((n) => n.toLowerCase() === v.species.toLowerCase());
    const taxon = v.species && this._data.taxa.find(named);
    if (taxon) {
      v.taxon_id = taxon.id;
      v.species = taxon.scientific_name;
    }
    v.variety = text("variety");
    v.supplier = text("supplier");
    v.notes = text("notes");
    v.price = number("price");
    if (kind === "seeds") {
      v.year = number("year");
      v.quantity = text("quantity");
      v.viability_years = number("viability_years");
      v.finished = ["si", "sì", "yes", "y", "x", "1", "true", "vero"].includes((raw.finished || "").toLowerCase());
      const same = (s) => s.species.toLowerCase() === (v.species || "").toLowerCase() && (s.variety || "") === (v.variety || "") && s.year === v.year;
      if (this._data.seeds.some(same)) issues.duplicate = this.t("csvDuplicate");
    } else {
      v.name = text("name") || raw.species || null;
      if (!v.name) issues.name = this.t("csvMissing");
      v.plant_type = choice("plant_type", Object.keys(PLANT_ICONS).map((k) => [k, this.t(`pt_${k}`)]));
      const quantity = number("quantity");
      v.kind = quantity > 1 ? "group" : "single";
      v.quantity = quantity > 1 ? Math.round(quantity) : 1;
      v.sown_on = date("sown_on");
      v.planted_on = date("planted_on");
      const age = number("age");
      const origins = ["existing", "planted", "sown"].map((o) => [o, this.t(o)]);
      v.origin = choice("origin", origins) || (v.sown_on ? "sown" : v.planted_on ? "planted" : "existing");
      v.birth_year = age != null ? new Date().getFullYear() - Math.round(age) : v.sown_on ? Number(v.sown_on.slice(0, 4)) : null;
      v.zone_id = null;
      if (raw.zone) {
        const wanted = raw.zone.toLowerCase();
        const zone = this._data.zones.find((z) => z.name.toLowerCase() === wanted || this._zonePath(z.id).toLowerCase() === wanted);
        v.zone_id = zone?.id || null;
        if (!zone) issues.zone = this.t("csvUnknownZone", { value: raw.zone });
      }
      v.latitude = number("latitude");
      v.longitude = number("longitude");
      if ((v.latitude == null) !== (v.longitude == null)) issues[v.latitude == null ? "latitude" : "longitude"] = this.t("csvMissing");
      if (!v.plant_type && !issues.plant_type && v.zone_id) v.plant_type = ZONE_PLANT_TYPE[this._zone(v.zone_id)?.kind] || null;
      if (this._data.plantings.some((p) => p.name.toLowerCase() === (v.name || "").toLowerCase())) issues.duplicate = this.t("csvDuplicate");
    }
    row.values = v;
    row.issues = issues;
    // Rows already in the list start unticked: importing twice is the usual mistake.
    if (issues.duplicate && !row.touched) row.include = false;
  }

  _csvBlocking(row) {
    return Object.keys(row.issues).some((key) => key !== "duplicate");
  }

  _renderImport() {
    const { kind, rows } = this._import;
    this._csvButton = h("button", { className: "primary", onclick: (ev) => ((ev.target.disabled = true), this._csvRun()) });
    this._csvRefreshButton();
    return [
      h("h2", {}, this.t(kind === "seeds" ? "csvTitleSeeds" : "csvTitlePlantings")),
      h("p", { className: "hint" }, this.t("csvSummary", { count: rows.length, issues: rows.filter((r) => Object.keys(r.issues).length).length })),
      h("div", { className: "row" }, this._csvButton, h("button", { onclick: () => this._close() }, this.t("cancel"))),
      h("div", { className: "csv-list" }, rows.map((row) => this._csvCard(row))),
    ];
  }

  _csvRefreshButton() {
    const ready = this._import.rows.filter((r) => r.include && !this._csvBlocking(r)).length;
    this._csvButton.textContent = this.t("csvDo", { count: ready });
    this._csvButton.disabled = !ready;
  }

  /** After a fix only the row and the button change: a full redraw would swallow a click in progress. */
  _csvUpdate(row) {
    this._csvCheck(this._import.kind, row);
    setTimeout(() => {
      if (!this._import || !row.el?.isConnected) return;
      row.el.replaceWith(this._csvCard(row));
      this._csvRefreshButton();
    }, 0);
  }

  _csvCard(row) {
    const { kind } = this._import;
    const fixers = {
      zone: () => this._csvSelect(row, "zone", this._zoneOptions(), (id) => this._zonePath(id)),
      plant_type: () =>
        this._csvSelect(row, "plant_type", Object.keys(PLANT_ICONS).map((k) => [k, `${PLANT_ICONS[k]} ${this.t(`pt_${k}`)}`]), (k) => k),
      origin: () => this._csvSelect(row, "origin", ["existing", "planted", "sown"].map((o) => [o, this.t(o)]), (o) => o),
      sown_on: () => this._csvInput(row, "sown_on", "date"),
      planted_on: () => this._csvInput(row, "planted_on", "date"),
      species: () => this._csvInput(row, "species", "text"),
      name: () => this._csvInput(row, "name", "text"),
      price: () => this._csvInput(row, "price", "number"),
      quantity: () => this._csvInput(row, "quantity", "number"),
      year: () => this._csvInput(row, "year", "number"),
      age: () => this._csvInput(row, "age", "number"),
      viability_years: () => this._csvInput(row, "viability_years", "number"),
      latitude: () => this._csvInput(row, "latitude", "number"),
      longitude: () => this._csvInput(row, "longitude", "number"),
    };
    const label = (key) => this.t({ zone: "zone_id", age: "age_now" }[key] || key);
    const v = row.values;
    const year = new Date().getFullYear();
    const title =
      kind === "seeds" ? [v.species, v.variety, v.year].filter(Boolean).join(" · ") : [v.name, v.species !== v.name ? v.species : null].filter(Boolean).join(" — ");
    const details =
      kind === "seeds"
        ? [v.supplier, v.quantity, v.finished ? this.t("finished") : null, v.price != null ? this._money(v.price) : null]
        : [
            PLANT_ICONS[v.plant_type] ? `${PLANT_ICONS[v.plant_type]} ${this.t(`pt_${v.plant_type}`)}` : null,
            this.t(v.origin),
            v.zone_id ? this._zonePath(v.zone_id) : null,
            v.sown_on ? `🌱 ${this._date(v.sown_on)}` : null,
            v.planted_on ? `🪴 ${this._date(v.planted_on)}` : null,
            v.birth_year && v.birth_year < year ? this.t("ageYears", { years: year - v.birth_year }) : null,
            v.quantity > 1 ? `×${v.quantity}` : null,
            v.price != null ? this._money(v.price) : null,
            v.latitude != null ? "📍" : null,
          ];
    row.el = h(
      "div",
      { className: `csv-row${Object.keys(row.issues).length ? " issue" : ""}${row.include ? "" : " off"}` },
      h(
        "label",
        { className: "check" },
        h("input", {
          type: "checkbox",
          checked: row.include,
          onchange: (ev) => {
            row.include = ev.target.checked;
            row.touched = true;
            this._csvUpdate(row);
          },
        }),
        h("strong", {}, title || "?"),
      ),
      h("div", { className: "sub", style: "white-space:normal" }, details.filter(Boolean).join(" · ")),
      Object.entries(row.issues).map(([key, message]) =>
        h(
          "div",
          { className: "row" },
          h("span", { className: "err" }, key === "duplicate" ? `⚠️ ${message}` : `⚠️ ${label(key)}: ${message}`),
          fixers[key]?.() || null,
        ),
      ),
    );
    return row.el;
  }

  /** A select that rewrites the raw cell and checks the row again. */
  _csvSelect(row, key, options, toRaw) {
    return h(
      "select",
      {
        onchange: (ev) => {
          row.raw[key] = ev.target.value ? toRaw(ev.target.value) : "";
          this._csvUpdate(row);
        },
      },
      h("option", { value: "" }, "—"),
      options.filter(([value]) => value).map(([value, text]) => h("option", { value }, text)),
    );
  }

  _csvInput(row, key, type) {
    return h("input", {
      type,
      value: type === "date" ? "" : row.raw[key],
      onchange: (ev) => {
        row.raw[key] = ev.target.value;
        this._csvUpdate(row);
      },
    });
  }

  async _csvRun() {
    const { kind, rows } = this._import;
    const todo = rows.filter((r) => r.include && !this._csvBlocking(r));
    let ok = 0;
    let failed = 0;
    for (const row of todo) {
      const data = Object.fromEntries(Object.entries(row.values).filter(([, value]) => value !== null && value !== undefined && value !== ""));
      const result = await this._call(kind === "seeds" ? "add_seed_lot" : "add_planting", data);
      if (result) ok++;
      else failed++;
    }
    this._close();
    this._showMessage(`${failed ? "" : "✓ "}${this.t("csvDone", { ok, failed })}`, !!failed);
  }


  // ---------- calendar view (instead of the map) ----------

  _toggleCalendar(on = !this._calendarOn) {
    this._calendarOn = on;
    this._layout.classList.toggle("calendar-on", on);
    this._layout.classList.remove("no-map");
    try {
      localStorage.setItem("homestead-calendar", on ? "1" : "");
    } catch {
      // private mode: the choice is just not remembered
    }
    if (on) this._renderCalendar();
    else setTimeout(() => this._map.invalidateSize(), 0);
  }

  _renderCalendar() {
    if (!this._calendarOn || !this._calWrap) return;
    const mode = this._calendarMode || "plan";
    const tab = (name, label) =>
      h(
        "button",
        {
          className: mode === name ? "active" : "",
          onclick: () => {
            this._calendarMode = name;
            this._renderCalendar();
          },
        },
        label,
      );
    const scroll = this._calWrap.scrollTop;
    this._calWrap.replaceChildren(
      this._actionsBox(),
      h(
        "div",
        { className: "cal-box" },
        h("div", { className: "cal-head" }, h("div", { className: "tabs" }, tab("plan", this.t("calPlan")), tab("history", this.t("calHistory")))),
        mode === "history" ? this._historyTimeline() : this._planTimeline(),
      ),
    );
    this._calWrap.scrollTop = scroll;
  }

  // ----- top: what to do in the next two weeks -----

  _actionsBox() {
    const now = today();
    const limit = new Date(`${now}T12:00:00`);
    limit.setDate(limit.getDate() + 14);
    const end = limit.toISOString().slice(0, 10);
    const advice = this._outlook?.advice || {};
    const tasks = this._data.tasks
      .filter((t) => !t.done_on && t.due_on <= end)
      .sort((a, b) => a.due_on.localeCompare(b.due_on));
    const weekday = new Intl.DateTimeFormat(this._lang(), { weekday: "short" });
    const cards = tasks.slice(0, 8).map((t) => {
      const verdict = advice[t.id];
      const late = t.due_on < now;
      const state = late ? "late" : !verdict ? "" : verdict.issues.length ? "warn" : "good";
      const verdictText = late
        ? this.t("overdue")
        : !verdict
          ? ""
          : verdict.issues.length
            ? `⚠️ ${verdict.issues.map((issue) => this.t(`issue_${issue}`)).join(", ")}${verdict.best ? ` · ${this.t("better_on", { date: this._date(verdict.best, false) })}` : ""}`
            : this.t("goodDay");
      return h(
        "div",
        { className: `action-card ${state}` },
        h(
          "button",
          { type: "button", className: "action-main", onclick: () => this._openTask(t) },
          h("span", { className: "action-date" }, `${weekday.format(new Date(`${t.due_on}T12:00:00`))} ${this._date(t.due_on, false)}`),
          h("span", { className: "action-title" }, `${EVENT_ICONS[t.kind] || "📝"} ${t.title || this.t(`ev_${t.kind}`)}`),
          t.planting_id || t.zone_id ? h("span", { className: "sub" }, this._targetName(t)) : null,
          verdictText ? h("span", { className: "action-verdict" }, verdictText) : null,
        ),
        h("button", { type: "button", className: "tick", title: this.t("done"), onclick: () => this._completeFromTask(t) }, "✔"),
      );
    });
    const alerts = this._outlook?.alerts || [];
    const when = (a) => (a.start === a.end ? this._date(a.start, false) : `${this._date(a.start, false)}–${this._date(a.end, false)}`);
    return h(
      "div",
      { className: "cal-box" },
      h(
        "div",
        { className: "cal-head" },
        h("h3", {}, this.t("calNext")),
        h("button", { type: "button", onclick: () => this._openTask({ kind: "note", due_on: today() }) }, this.t("addTask")),
      ),
      cards.length ? h("div", { className: "action-cards" }, cards) : h("p", { className: "hint" }, this.t("nothingToDo")),
      tasks.length > cards.length ? h("div", { className: "sub" }, this.t("calMore", { count: tasks.length - cards.length })) : null,
      alerts.map((a) => {
        const names = a.plantings.map((id) => this._planting(id)?.name).filter(Boolean);
        const everyone = ["heatwave", "heat_extreme"].includes(a.kind);
        return h(
          "div",
          { className: "alert-line" },
          `${this.t(`al_${a.kind}`, { when: when(a), value: a.value })}${names.length && !everyone ? ` — ${names.slice(0, 5).join(", ")}` : ""}`,
        );
      }),
      this._weatherStrip(),
    );
  }

  _weatherIcon(day) {
    const code = day.code;
    if (code != null) {
      if (code >= 95) return "⛈️";
      if (code >= 71 && code <= 86 && !(code >= 80 && code <= 82)) return "🌨️";
      if (code >= 51) return "🌧️";
      if (code === 45 || code === 48) return "🌫️";
      if (code === 3) return "☁️";
      if (code === 2) return "⛅";
      return "☀️";
    }
    const byCondition = {
      sunny: "☀️",
      "clear-night": "☀️",
      partlycloudy: "⛅",
      cloudy: "☁️",
      fog: "🌫️",
      rainy: "🌧️",
      pouring: "🌧️",
      snowy: "🌨️",
      "snowy-rainy": "🌨️",
      lightning: "⛈️",
      "lightning-rainy": "⛈️",
      hail: "⛈️",
      windy: "💨",
    };
    return byCondition[day.condition] || ((day.rain_mm || 0) >= 1 ? "🌧️" : "☀️");
  }

  _weatherStrip() {
    const days = (this._outlook?.forecast || []).slice(0, 14);
    if (!days.length) return h("p", { className: "hint" }, this.t("calNoForecast"));
    const alerts = this._outlook?.alerts || [];
    const weekday = new Intl.DateTimeFormat(this._lang(), { weekday: "narrow" });
    return h(
      "div",
      { className: "wx-strip" },
      days.map((day) =>
        h(
          "div",
          { className: `wx-day${alerts.some((a) => a.start <= day.date && day.date <= a.end) ? " alert" : ""}`, title: `${this._date(day.date)}${day.rain_mm ? ` · ${day.rain_mm} mm` : ""}` },
          h("span", { className: "sub" }, `${weekday.format(new Date(`${day.date}T12:00:00`))} ${day.date.slice(8)}`),
          h("span", {}, this._weatherIcon(day)),
          h("span", {}, `${day.t_max != null ? Math.round(day.t_max) : "–"}°`),
          h("span", { className: "sub" }, `${day.t_min != null ? Math.round(day.t_min) : "–"}°`),
        ),
      ),
    );
  }

  // ----- the year as one continuous line, grouped by zone -----

  /** Fraction of the year (0–1) of an ISO date. */
  _yearFraction(iso) {
    const [y, m, d] = iso.split("-").map(Number);
    const start = Date.UTC(y, 0, 1);
    const length = Date.UTC(y + 1, 0, 1) - start;
    return (Date.UTC(y, m - 1, d) - start + 43200000) / length;
  }

  /** Month numbers → continuous [from, to] fractions, consecutive months merged. */
  _monthSegments(months) {
    const sorted = [...new Set(months)].sort((a, b) => a - b);
    const segments = [];
    for (const month of sorted) {
      const from = (month - 1) / 12;
      if (segments.length && Math.abs(segments.at(-1)[1] - from) < 1e-9) segments.at(-1)[1] = month / 12;
      else segments.push([from, month / 12]);
    }
    return segments;
  }

  _calClosed() {
    if (!this._calClosedSet) {
      try {
        this._calClosedSet = new Set(JSON.parse(localStorage.getItem("homestead-cal-closed") || "[]"));
      } catch {
        this._calClosedSet = new Set();
      }
    }
    return this._calClosedSet;
  }

  _toggleGroup(id) {
    const closed = this._calClosed();
    closed.has(id) ? closed.delete(id) : closed.add(id);
    try {
      localStorage.setItem("homestead-cal-closed", JSON.stringify([...closed]));
    } catch {
      // not remembered
    }
    this._renderCalendar();
  }

  /** Zones in tree order (with their path) and the plantings and tasks of each; then what has no zone. */
  _calendarGroups() {
    const groups = [];
    const seen = new Set();
    const walk = (parent) =>
      this._data.zones
        .filter((z) => (z.parent_id || null) === parent || (parent === null && z.parent_id && !this._zone(z.parent_id)))
        .sort((a, b) => a.name.localeCompare(b.name))
        .forEach((z) => {
          if (seen.has(z.id)) return;
          seen.add(z.id);
          groups.push({ id: z.id, zone: z, name: this._zonePath(z.id), plantings: this._data.plantings.filter((p) => p.zone_id === z.id) });
          walk(z.id);
        });
    walk(null);
    const loose = this._data.plantings.filter((p) => !p.zone_id || !this._zone(p.zone_id));
    groups.push({ id: "", zone: null, name: this.t("calNoZone"), plantings: loose });
    return groups;
  }

  _timelineHeader() {
    const letters = new Intl.DateTimeFormat(this._lang(), { month: "short" });
    return h(
      "div",
      { className: "tl-row tl-months" },
      h("div"),
      h(
        "div",
        { className: "tl-track" },
        Array.from({ length: 12 }, (_, i) =>
          h("span", { className: "tl-month", style: `left:${(i / 12) * 100}%` }, letters.format(new Date(2025, i, 15)).replace(".", "")),
        ),
      ),
    );
  }

  _todayLine() {
    return h("div", { className: "tl-today", style: `--x:${this._yearFraction(today())}` }, h("span", {}, this.t("calToday")));
  }

  _groupHeader(group, summary) {
    const open = !this._calClosed().has(group.id);
    return h(
      "button",
      { type: "button", className: "tl-group", onclick: () => this._toggleGroup(group.id), "aria-expanded": open ? "true" : "false" },
      h("span", { className: "tl-arrow" }, open ? "▾" : "▸"),
      h("strong", {}, group.zone ? `${ZONE_ICONS[group.zone.kind] || "▭"} ${group.name}` : group.name),
      h("span", { className: "sub" }, summary),
    );
  }

  _bandRow(label, onclick, bands, pills, extra = null) {
    const lanes = [...new Set(bands.map((b) => b.lane))];
    const pillRows = Math.max(0, ...pills.map((pill) => Number(pill.dataset.row ?? -1) + 1));
    const height = Math.max(30, 10 + lanes.length * 7, 6 + pillRows * 20);
    return h(
      "div",
      { className: "tl-row" },
      h("button", { type: "button", className: "tl-label", title: label, onclick }, label),
      h(
        "div",
        { className: "tl-track", style: `height:${height}px` },
        bands.map((b) =>
          h("i", {
            className: "tl-band",
            title: b.title,
            style: `left:${b.from * 100}%;width:${Math.max((b.to - b.from) * 100, 0.8)}%;top:${5 + lanes.indexOf(b.lane) * 7}px;background:${b.color}`,
          }),
        ),
        pills,
        extra,
      ),
    );
  }

  /** Planned activities as pills at their date; pills too close to each other go on the next line. */
  _taskPills(tasks, year) {
    const now = today();
    const lastAt = [];
    return tasks
      .filter((t) => !t.done_on && t.due_on.startsWith(year))
      .sort((a, b) => a.due_on.localeCompare(b.due_on))
      .map((t) => {
        const verdict = this._outlook?.advice?.[t.id];
        const state = t.due_on < now ? " late" : verdict?.issues.length ? " warn" : "";
        const x = this._yearFraction(t.due_on);
        let row = lastAt.findIndex((end) => x - end > 0.09);
        if (row < 0) row = lastAt.length;
        lastAt[row] = x;
        return h(
          "button",
          {
            type: "button",
            className: `tl-pill${state}`,
            "data-row": row,
            style: `left:${x * 100}%;top:${4 + row * 20}px`,
            title: `${this._date(t.due_on)} · ${this._taskLabel(t)}`,
            onclick: () => this._openTask(t),
          },
          `${EVENT_ICONS[t.kind] || "📝"} ${t.title || this.t(`ev_${t.kind}`)}`,
        );
      });
  }

  /** The year to come per zone: crop calendar bands, typical zone work, and the planned activities as pills. */
  _planTimeline() {
    const year = String(new Date().getFullYear());
    const openTasks = this._data.tasks.filter((t) => !t.done_on);
    const rows = [this._timelineHeader()];
    const legendKeys = new Set();
    for (const group of this._calendarGroups()) {
      const plantings = group.plantings.filter((p) => p.status === "active");
      const zoneTasks = group.zone ? openTasks.filter((t) => t.zone_id === group.zone.id) : openTasks.filter((t) => !t.planting_id && !t.zone_id);
      const plantTasks = openTasks.filter((t) => plantings.some((p) => p.id === t.planting_id));
      const zoneBands = group.zone ? ZONE_SEASONS[group.zone.kind] || [] : [];
      if (!plantings.length && !zoneTasks.length && !zoneBands.length) continue;
      const count = zoneTasks.length + plantTasks.length;
      rows.push(this._groupHeader(group, [plantings.length ? this.t("calPlants", { count: plantings.length }) : null, count ? this.t("calTasks", { count }) : null].filter(Boolean).join(" · ")));
      if (this._calClosed().has(group.id)) continue;
      if (zoneBands.length || zoneTasks.length) {
        const bands = zoneBands.map(([key, months]) => {
          legendKeys.add(key);
          return this._monthSegments(months).map(([from, to]) => ({ from, to, lane: key, color: CAL_COLOR[key], title: this.t(`cal_${key}`) }));
        });
        rows.push(
          this._bandRow(
            group.zone ? `▭ ${this.t("calWholeZone")}` : this.t("calGeneral"),
            () => group.zone && this._selectZone(group.zone.id),
            bands.flat(),
            this._taskPills(zoneTasks, year),
          ),
        );
      }
      for (const p of plantings.sort((a, b) => a.name.localeCompare(b.name))) {
        const crop = this._crop(p.species);
        const bands = CROP_MONTHS.filter((key) => crop?.[key]?.length).flatMap((key) => {
          legendKeys.add(key);
          return this._monthSegments(crop[key]).map(([from, to]) => ({ from, to, lane: key, color: CROP_COLOR[key], title: this.t(key) }));
        });
        const label = `${PLANT_ICONS[p.plant_type] || "🌱"} ${p.name}${p.kind === "group" && p.quantity > 1 ? ` (${p.quantity})` : ""}`;
        rows.push(this._bandRow(label, () => this._select(p.id), bands, this._taskPills(openTasks.filter((t) => t.planting_id === p.id), year)));
      }
    }
    const legend = h(
      "div",
      { className: "chips legend" },
      [...legendKeys].map((key) => h("span", { className: "chip" }, h("i", { style: `background:${CROP_COLOR[key] || CAL_COLOR[key]}` }), CROP_COLOR[key] ? this.t(key) : this.t(`cal_${key}`))),
      h("span", { className: "chip" }, h("b", { className: "tl-pill-sample" }), this.t("calPlanned")),
    );
    return h("div", {}, legend, h("div", { className: "timeline-grid" }, rows, this._todayLine()));
  }

  /** A past year: what was really done, at its date, under that year's weather extremes. */
  _historyTimeline() {
    const extremes = this._outlook?.climate?.extremes || [];
    const events = this._data.events;
    const years = [...new Set([...events.map((e) => e.done_on.slice(0, 4)), ...extremes.map((x) => x.start.slice(0, 4))])].sort().reverse();
    const year = this._calendarYear && years.includes(this._calendarYear) ? this._calendarYear : years[0] || String(new Date().getFullYear());
    const yearSelect = h(
      "select",
      {
        style: "flex:none",
        onchange: (ev) => {
          this._calendarYear = ev.target.value;
          this._renderCalendar();
        },
      },
      years.map((y) => h("option", { value: y, selected: y === year }, y)),
    );
    const extremeIcon = { frost: "❄️", heatwave: "🔥", heat_extreme: "🔥", hail: "🧊", heavy_rain: "🌧️" };
    const extremeColor = { frost: "#4a90d9", heatwave: "#d84315", heat_extreme: "#d84315", hail: "#7e57c2", heavy_rain: "#1e88e5" };
    const ofYear = extremes.filter((x) => x.start.startsWith(year));
    const rows = [this._timelineHeader()];
    rows.push(
      h(
        "div",
        { className: "tl-row" },
        h("div", { className: "tl-label static" }, `🌦️ ${this.t("calWeather")}`),
        h(
          "div",
          { className: "tl-track" },
          ofYear.map((x) => {
            const from = this._yearFraction(x.start);
            const to = this._yearFraction(x.end.startsWith(year) ? x.end : `${year}-12-31`);
            const title = `${extremeIcon[x.kind]} ${this.t(`xt_${x.kind}`)} ${this._date(x.start, false)}${x.end !== x.start ? `–${this._date(x.end, false)}` : ""}${x.value != null ? ` (${x.value}${x.kind === "heavy_rain" ? " mm" : " °C"})` : ""}`;
            return h("span", { className: "tl-mark", title, style: `left:${from * 100}%;min-width:${Math.max((to - from) * 100, 0)}%;border-color:${extremeColor[x.kind]}` }, extremeIcon[x.kind]);
          }),
        ),
      ),
    );
    const ofYearEvents = events.filter((e) => e.done_on.startsWith(year));
    const marks = (list) =>
      list.map((e) =>
        h(
          "button",
          {
            type: "button",
            className: "tl-mark event",
            style: `left:${this._yearFraction(e.done_on) * 100}%`,
            title: `${this._date(e.done_on)} ${this._eventLabel(e)}${e.quantity ? ` ${this._quantity(e.quantity, e.unit)}` : ""}`,
            onclick: () => this._openEvent(e),
          },
          EVENT_ICONS[e.kind] || "📝",
        ),
      );
    let any = false;
    for (const group of this._calendarGroups()) {
      const zoneEvents = group.zone ? ofYearEvents.filter((e) => e.zone_id === group.zone.id) : [];
      const plantRows = group.plantings
        .map((p) => ({ p, list: ofYearEvents.filter((e) => e.planting_id === p.id) }))
        .filter((r) => r.list.length);
      if (!zoneEvents.length && !plantRows.length) continue;
      any = true;
      rows.push(this._groupHeader(group, this.t("calEvents", { count: zoneEvents.length + plantRows.reduce((n, r) => n + r.list.length, 0) })));
      if (this._calClosed().has(group.id)) continue;
      if (zoneEvents.length) rows.push(this._bandRow(`▭ ${this.t("calWholeZone")}`, () => this._selectZone(group.zone.id), [], marks(zoneEvents)));
      for (const { p, list } of plantRows) rows.push(this._bandRow(`${PLANT_ICONS[p.plant_type] || "🌱"} ${p.name}`, () => this._select(p.id), [], marks(list)));
    }
    return h(
      "div",
      {},
      h("div", { className: "row", style: "margin-bottom:6px" }, yearSelect),
      h("div", { className: "timeline-grid" }, rows, year === String(new Date().getFullYear()) ? this._todayLine() : null),
      any ? null : h("p", { className: "hint" }, this.t("emptyDiary")),
    );
  }

  // ---------- rotation ----------

  _plantingYear(p) {
    const date = p.sown_on || p.planted_on || this._data.events.filter((e) => e.planting_id === p.id).map((e) => e.done_on).sort()[0];
    return date ? Number(date.slice(0, 4)) : null;
  }

  _family(p) {
    return this._taxon(p.taxon_id)?.family || this._crop(p.species)?.family || null;
  }

  /** Earlier crops of the same family (or species) in the zone during the last years, as a tip. */
  _rotationHint({ id, zone_id, species, taxon_id, plant_type }) {
    const zone = this._zone(zone_id);
    if (!zone || !species?.trim()) return null;
    if (!["vegetable_garden", "greenhouse"].includes(zone.kind) && plant_type !== "vegetable") return null;
    const family = this._taxon(taxon_id)?.family || this._crop(species)?.family;
    const name = species.trim().toLowerCase();
    const year = new Date().getFullYear();
    const same = this._data.plantings.filter((p) => {
      if (p.id === id || p.zone_id !== zone_id) return false;
      const y = this._plantingYear(p);
      if (!y || y < year - ROTATION_YEARS || y > year) return false;
      return family ? this._family(p) === family : p.species.trim().toLowerCase() === name;
    });
    if (!same.length) return null;
    const years = [...new Set(same.map((p) => this._plantingYear(p)))].sort().join(", ");
    return this.t("rotationHint", { what: family || species.trim(), years, names: same.map((p) => p.name).join(", ") });
  }

  /** Crops of a zone per year with their family: the base for rotations. */
  _rotationBox(zone) {
    const rows = new Map();
    for (const p of this._data.plantings.filter((p) => p.zone_id === zone.id)) {
      const year = this._plantingYear(p);
      if (!year) continue;
      if (!rows.has(year)) rows.set(year, []);
      rows.get(year).push(`${p.name}${this._family(p) ? ` (${this._family(p)})` : ""}`);
    }
    if (!rows.size) return null;
    return h(
      "div",
      { className: "seasons" },
      h("h3", {}, this.t("rotation")),
      [...rows.entries()]
        .sort((a, b) => b[0] - a[0])
        .slice(0, 6)
        .map(([year, crops]) => h("div", { className: "sub" }, `${year}: ${crops.join(" · ")}`)),
    );
  }

  // ---------- tools ----------

  _openTool(tool) {
    this._clearSelection();
    this._showMessage("");
    this._tab = "tools";
    this._toolForm = { ...tool };
    this._syncMap();
    this._render();
  }

  _renderToolList() {
    const now = today();
    const tools = [...this._data.tools].sort((a, b) => a.name.localeCompare(b.name));
    return [
      h(
        "div",
        { className: "actions" },
        h(
          "button",
          { className: "primary", onclick: () => this._openTool({ power: "manual", status: "ok" }) },
          `+ ${this.t("addTool")}`,
        ),
      ),
      tools.length
        ? h(
            "ul",
            {},
            tools.map((t) => {
              const due = t.next_service_on && t.next_service_on <= now;
              const color = TOOL_STATUS_COLOR[t.status === "ok" && due ? "needs_service" : t.status] || TOOL_STATUS_COLOR.ok;
              return h(
                "li",
                { onclick: () => this._openTool(t) },
                h("span", { className: "dot", style: `background:${color}` }),
                h(
                  "div",
                  { className: "main" },
                  h("div", {}, t.name),
                  h(
                    "div",
                    { className: "sub" },
                    [t.category, [t.brand, t.model].filter(Boolean).join(" "), this.t(t.power), t.status !== "ok" ? this.t(t.status) : null]
                      .filter(Boolean)
                      .join(" · "),
                  ),
                  due ? h("div", { className: "sub warn" }, `🔧 ${this.t("serviceDue", { date: this._date(t.next_service_on) })}`) : null,
                ),
              );
            }),
          )
        : h("p", { className: "hint" }, this.t("emptyTools")),
    ];
  }

  _renderToolForm() {
    const f = this._toolForm;
    return [
      h(
        "form",
        { onsubmit: (ev) => this._saveTool(ev) },
        h("h2", {}, f.id ? this.t("editToolTitle") : this.t("newToolTitle")),
        this._field(f, "name", { required: true, maxLength: 100 }),
        this._field(f, "category", { placeholder: "potatura, scavo, irrigazione…" }),
        h("div", { className: "row" }, this._field(f, "brand"), this._field(f, "model")),
        h(
          "div",
          { className: "row" },
          this._selectField(f, "power", TOOL_POWER.map((p) => [p, this.t(p)])),
          this._selectField(f, "status", Object.keys(TOOL_STATUS_COLOR).map((st) => [st, this.t(st)])),
        ),
        h(
          "div",
          { className: "row" },
          this._field(f, "purchased_on", { type: "date" }),
          this._field(f, "next_service_on", { type: "date" }),
        ),
        f.id ? null : this._field(f, "price", { type: "number", min: 0, step: "0.01", inputMode: "decimal" }),
        this._notes(f),
        this._formButtons(f.id, () => this._deleteTool()),
      ),
    ];
  }

  async _saveTool(ev) {
    ev.preventDefault();
    const v = Object.fromEntries(new FormData(ev.target));
    const data = {
      name: v.name.trim(),
      category: v.category?.trim() || null,
      brand: v.brand?.trim() || null,
      model: v.model?.trim() || null,
      power: v.power,
      status: v.status,
      purchased_on: v.purchased_on || null,
      next_service_on: v.next_service_on || null,
      notes: v.notes?.trim() || null,
    };
    const id = this._toolForm.id;
    if (!id && v.price) data.price = Number(v.price);
    if (await this._call(id ? "update_tool" : "add_tool", id ? { id, ...data } : data)) this._saved(data.name);
  }

  async _deleteTool() {
    const { id, name } = this._toolForm;
    if (!confirm(this.t("confirmDeleteTool", { name }))) return;
    if (await this._call("delete_tool", { id })) this._saved(name, "deleted");
  }

  _formButtons(id, onDelete, onCancel = () => this._close()) {
    return [
      h(
        "div",
        { className: "row" },
        h("button", { type: "submit", className: "primary" }, this.t("save")),
        h("button", { type: "button", onclick: onCancel }, this.t("cancel")),
      ),
      id ? h("div", { className: "row" }, h("button", { type: "button", className: "danger", onclick: onDelete }, this.t("delete"))) : null,
    ];
  }

  // ---------- photos ----------

  _photosSection(f) {
    this._photosEl = h("div", { className: "photos" });
    this._photoInput = h("input", {
      type: "file",
      accept: "image/*",
      hidden: true,
      onchange: (ev) => this._uploadPhoto(ev.target),
    });
    const section = h(
      "div",
      {},
      h("h3", {}, this.t("photos")),
      f.id
        ? [
            this._photosEl,
            h("button", { type: "button", onclick: () => this._photoInput.click() }, this.t("addPhoto")),
            this._photoInput,
          ]
        : h("p", { className: "hint" }, this.t("photosAfterSave")),
    );
    this._fillPhotos();
    return section;
  }

  async _photoUrl(id) {
    if (!this._photoUrls.has(id)) {
      const signed = this._hass.callWS({ type: "auth/sign_path", path: `/api/homestead/photo/${id}`, expires: 86400 });
      this._photoUrls.set(id, signed.then((r) => r.path));
    }
    return this._photoUrls.get(id);
  }

  _fillPhotos() {
    if (!this._photosEl || !this._form?.id) return;
    const photos = this._data.photos
      .filter((p) => p.planting_id === this._form.id)
      .sort((a, b) => (b.taken_on || "").localeCompare(a.taken_on || ""));
    this._photosEl.replaceChildren(
      ...photos.map((photo) => {
        const img = h("img", { alt: photo.caption || this._date(photo.taken_on), loading: "lazy" });
        this._photoUrl(photo.id).then((url) => (img.src = url));
        return h(
          "button",
          { type: "button", className: "thumb", onclick: () => this._showPhoto(photo, img) },
          img,
          h("span", {}, this._date(photo.taken_on)),
        );
      }),
    );
  }

  _showPhoto(photo, img) {
    const overlay = h(
      "div",
      { className: "lightbox", onclick: (ev) => ev.target === overlay && overlay.remove() },
      h("img", { src: img.src, alt: img.alt }),
      h(
        "div",
        { className: "row" },
        h("span", {}, this._date(photo.taken_on)),
        h(
          "button",
          {
            type: "button",
            className: "danger",
            onclick: async () => {
              if (!confirm(this.t("confirmDeletePhoto"))) return;
              if (await this._call("delete_photo", { id: photo.id })) overlay.remove();
            },
          },
          this.t("delete"),
        ),
        h("button", { type: "button", onclick: () => overlay.remove() }, this.t("close")),
      ),
    );
    this.shadowRoot.append(overlay);
  }

  async _uploadPhoto(input) {
    const file = input.files?.[0];
    input.value = "";
    if (!file || !this._form?.id) return;
    this._showMessage(this.t("uploading"));
    try {
      const content = await shrinkImage(file, PHOTO_MAX_PX);
      await this._hass.callWS({ type: "homestead/photo/upload", planting_id: this._form.id, content });
      this._showMessage("");
    } catch (err) {
      this._showMessage(err.message || String(err), true);
    }
  }

  _renderZoneForm() {
    const z = this._zoneForm;
    const exclude = z.id ? new Set([z.id, ...this._zoneDescendants(z.id)]) : new Set();
    const area = formatArea(z.area_m2 ?? polygonArea(z.geometry));
    const kindSelect = this._selectField(z, "kind", [["", this.t("noZone")], ...ZONE_KINDS.map((k) => [k, this.t(k)])]);
    const essences = this._essencesField(z);
    const toggleEssences = () => (essences.hidden = kindSelect.querySelector("select").value !== "woodland" && !z.species.length);
    kindSelect.addEventListener("change", toggleEssences);
    toggleEssences();
    return [
      h(
        "form",
        { onsubmit: (ev) => this._saveZone(ev) },
        h("h2", {}, z.id ? this.t("editZoneTitle") : this.t("newZoneTitle")),
        this._field(z, "name", { required: true, maxLength: 100 }),
        h(
          "div",
          { className: "row" },
          kindSelect,
          this._selectField(z, "parent_id", this._zoneOptions(exclude)),
        ),
        essences,
        this._notes(z),
        area ? h("div", { className: "hint" }, `${this.t("surface")}: ${area}`) : null,
        h(
          "div",
          { className: "row" },
          h("button", { type: "submit", className: "primary" }, this.t("save")),
          h("button", { type: "button", onclick: () => this._close() }, this.t("cancel")),
        ),
        z.id
          ? h(
              "div",
              { className: "row" },
              h("button", { type: "button", onclick: () => this._startDrawing(z) }, this.t(z.geometry ? "redraw" : "draw")),
              h("button", { type: "button", className: "danger", onclick: () => this._deleteZone() }, this.t("delete")),
            )
          : null,
      ),
      z.id ? (this._woodEl = h("div", {}, this._woodBox(z))) : null,
      z.id && z.kind !== "woodland" ? this._rotationBox(z) : null,
      z.id ? this._diaryBox({ zone_id: z.id }) : null,
      z.id ? this._lastYearsBox(this._data.events.filter((e) => e.zone_id === z.id || this._zoneDescendants(z.id).has(e.zone_id)), { zone_id: z.id }) : null,
    ];
  }
}

/** Same computation as moon.py, to show the phase while typing the date. */
function moonPhase(iso) {
  const synodic = 29.530588853;
  const days = Math.round((Date.UTC(...iso.split("-").map((v, i) => Number(v) - (i === 1 ? 1 : 0))) - Date.UTC(2000, 0, 6)) / 86400000);
  const age = ((days % synodic) + synodic) % synodic;
  return Object.keys(MOON_ICONS)[Math.floor((age / synodic) * 8 + 0.5) % 8];
}

/** Rows of a CSV text: ";", "," or tab separated (guessed from the header), quotes, BOM. */
function parseCsv(text) {
  const clean = text.replace(/^﻿/, "");
  const first = clean.split(/\r?\n/, 1)[0];
  const separator = [";", "\t", ","].map((s) => [s, first.split(s).length]).sort((a, b) => b[1] - a[1])[0][0];
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < clean.length; i++) {
    const c = clean[i];
    if (quoted) {
      if (c === '"' && clean[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (c === '"') quoted = false;
      else cell += c;
    } else if (c === '"') quoted = true;
    else if (c === separator) {
      row.push(cell);
      cell = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && clean[i + 1] === "\n") i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else cell += c;
  }
  if (cell || row.length) rows.push([...row, cell]);
  return rows;
}

function csvCell(value) {
  const text = String(value ?? "");
  return /[;"\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/** dd/mm/yyyy, dd-mm-yyyy, dd.mm.yyyy (day first, as in Europe) or yyyy-mm-dd → ISO date, else null. */
function parseDate(text) {
  const value = text.trim();
  let m = value.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  let y, mo, d;
  if (m) [, y, mo, d] = m;
  else {
    m = value.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2}|\d{4})$/);
    if (!m) return null;
    [, d, mo, y] = m;
    if (y.length === 2) y = `20${y}`;
  }
  const date = new Date(Number(y), Number(mo) - 1, Number(d));
  if (date.getMonth() !== Number(mo) - 1 || date.getDate() !== Number(d)) return null;
  return `${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

/** Thumbnail of a Wikimedia Commons file (the species picture from Wikidata). */
function commonsThumb(file, width) {
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(file.replace(/ /g, "_"))}?width=${width}`;
}

function weatherText(w) {
  const parts = [];
  if (w.t_mean != null) parts.push(`🌡️ ${Math.round(w.t_mean)}°${w.t_min != null ? ` (${Math.round(w.t_min)}–${Math.round(w.t_max)})` : ""}`);
  if (w.rh_mean != null) parts.push(`💧 ${Math.round(w.rh_mean)}%`);
  if (w.rain_mm != null) parts.push(`🌧️ ${w.rain_mm} mm`);
  if (w.soil_mean != null) parts.push(`🌱 ${Math.round(w.soil_mean)}%`);
  return parts.join(" · ");
}

function today() {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

/** Phone photos are several MB: send a JPEG of at most `maxPx` per side, as base64. */
async function shrinkImage(file, maxPx) {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  const scale = Math.min(1, maxPx / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85));
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(binary);
}

/** Disabled inputs (other origins) are not in the form data, so absent dates become null. */
function datesFromForm(values) {
  const year = new Date().getFullYear();
  const number = (value) => (value === undefined || value === "" ? null : Number(value));
  if (values.origin === "existing") {
    const age = number(values.age_now);
    return { origin: "existing", sown_on: null, planted_on: null, birth_year: age == null ? null : year - age };
  }
  if (values.origin === "sown") {
    return {
      origin: "sown",
      sown_on: values.sown_on || null,
      planted_on: values.transplanted_on || null,
      birth_year: values.sown_on ? Number(values.sown_on.slice(0, 4)) : null,
    };
  }
  const plantedOn = values.planted_on || null;
  const age = number(values.age_at_planting);
  return {
    origin: "planted",
    sown_on: null,
    planted_on: plantedOn,
    birth_year: plantedOn && age != null ? Number(plantedOn.slice(0, 4)) - age : null,
  };
}

function ageOf(planting) {
  const year = planting.birth_year || (planting.sown_on ? Number(planting.sown_on.slice(0, 4)) : null);
  return year ? Math.max(new Date().getFullYear() - year, 0) : null;
}

function hasPosition(item) {
  return item.latitude != null && item.longitude != null;
}

function round(value) {
  return Math.round(value * 1e7) / 1e7;
}

function toLatLngs(geometry) {
  return geometry.coordinates.map((ring) => ring.map(([lng, lat]) => [lat, lng]));
}

function ringContains(ring, x, y) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

function containsPoint(geometry, lng, lat) {
  const [outer, ...holes] = geometry.coordinates;
  return ringContains(outer, lng, lat) && !holes.some((hole) => ringContains(hole, lng, lat));
}

// Same spherical formula as geo.py, used only for previews before saving.
function polygonArea(geometry) {
  if (!geometry) return null;
  const ringArea = (ring) => {
    let total = 0;
    for (let i = 0; i < ring.length; i++) {
      const [p1, p2, p3] = [ring[i], ring[(i + 1) % ring.length], ring[(i + 2) % ring.length]];
      total += (rad(p3[0]) - rad(p1[0])) * Math.sin(rad(p2[1]));
    }
    return Math.abs((total * 6378137 ** 2) / 2);
  };
  const [outer, ...holes] = geometry.coordinates;
  return Math.max(ringArea(outer) - holes.reduce((sum, hole) => sum + ringArea(hole), 0), 0);
}

function rad(deg) {
  return (deg * Math.PI) / 180;
}

function formatArea(m2) {
  if (m2 == null) return "";
  return m2 >= 10000 ? `${(m2 / 10000).toFixed(2)} ha` : `${Math.round(m2)} m²`;
}

customElements.define("homestead-panel", HomesteadPanel);
