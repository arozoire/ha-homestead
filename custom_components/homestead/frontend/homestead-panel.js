import * as L from "./vendor/leaflet.js";

const BASE = new URL(".", import.meta.url).href;

const ZONE_KINDS = ["vegetable_garden", "orchard", "flower_bed", "greenhouse", "pots", "lawn", "other"];

const TEXT = {
  en: {
    title: "Garden",
    satellite: "Satellite",
    map: "Map",
    tabPlantings: "Plantings",
    tabZones: "Zones",
    tabDiary: "Diary",
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
    yearTotal: "{year}: {total}",
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
    title: "Giardino",
    satellite: "Satellite",
    map: "Mappa",
    tabPlantings: "Piante",
    tabZones: "Zone",
    tabDiary: "Diario",
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
    yearTotal: "{year}: {total}",
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
};
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
  aside { width: 360px; flex: none; overflow-y: auto; border-left: 1px solid var(--divider-color);
    background: var(--card-background-color); box-sizing: border-box; padding: 12px; }
  .narrow .body { flex-direction: column; }
  .narrow .map { min-height: 45%; }
  .narrow aside { width: auto; height: 45%; border-left: none; border-top: 1px solid var(--divider-color); }
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
`;

class HomesteadPanel extends HTMLElement {
  constructor() {
    super();
    this._data = { plantings: [], zones: [], taxa: [], expenses: [], tools: [], photos: [], events: [] };
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
      h("header", {}, this._menu, h("h1", {}, this.t("title"))),
      h("div", { className: "body" }, this._mapWrap, this._aside),
    );
    root.append(
      h("link", { rel: "stylesheet", href: `${BASE}vendor/leaflet.css` }),
      h("style", {}, STYLE),
      this._layout,
    );
    this._createMap();
    this._render();
    if (this.isConnected) this._subscribe();
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
  }

  _subscribe() {
    let first = true;
    this._unsub = this._hass.connection.subscribeMessage(
      (data) => {
        this._data = {
          plantings: data.plantings || [],
          zones: data.zones || [],
          taxa: data.taxa || [],
          expenses: data.expenses || [],
          tools: data.tools || [],
          photos: data.photos || [],
          events: data.events || [],
        };
        this._loaded = !!data.plantings;
        this._syncMap();
        if (first) this._fitAll();
        first = false;
        if (this._form) this._refreshForm();
        else if (this._zoneForm) this._refreshDiaryBox();
        else if (this._eventForm) this._fillEventPhotos();
        else if (!this._expenseForm && !this._toolForm) this._render();
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
      const icon = L.divIcon({
        className: "",
        html: `<div class="pin${selected ? " selected" : ""}" style="background:${STATUS_COLOR[p.status] || STATUS_COLOR.active}"></div>`,
        iconSize: selected ? [26, 26] : [18, 18],
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
    this._eventForm = null;
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
    this._form = {
      name: "",
      species: "",
      kind: "single",
      quantity: 1,
      status: "active",
      origin: "planted",
      planted_on: today(),
      zone_id: this._zoneAt(latlng.lat, latlng.lng),
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
    this._renderBanner();
    this._showMessage(this._message.text, this._message.error);
    let content;
    if (this._form && !this._placing) content = this._renderForm();
    else if (this._zoneForm && !this._drawing) content = this._renderZoneForm();
    else if (this._expenseForm) content = this._renderExpenseForm();
    else if (this._toolForm) content = this._renderToolForm();
    else if (this._eventForm) content = this._renderEventForm();
    else {
      const lists = {
        plantings: () => this._renderList(),
        zones: () => this._renderZoneList(),
        diary: () => this._renderDiary(),
        expenses: () => this._renderExpenseList(),
        tools: () => this._renderToolList(),
      };
      content = [this._renderTabs(), ...lists[this._tab](), this._renderBackup()];
    }
    this._content.replaceChildren(...content.filter(Boolean));
  }

  _renderTabs() {
    const tab = (name, label) =>
      h("button", { className: this._tab === name ? "active" : "", onclick: () => this._setTab(name) }, label);
    return h(
      "div",
      { className: "tabs" },
      tab("plantings", this.t("tabPlantings")),
      tab("zones", this.t("tabZones")),
      tab("diary", this.t("tabDiary")),
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
                h("span", { className: "dot", style: `background:${STATUS_COLOR[p.status] || STATUS_COLOR.active}` }),
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
    return [
      h(
        "form",
        { onsubmit: (ev) => this._save(ev) },
        h("h2", {}, f.id ? this.t("editTitle") : this.t("newTitle")),
        this._field(f, "name", { required: true, maxLength: 100 }),
        this._speciesField(f),
        this._field(f, "variety"),
        h("div", { className: "row" }, kind, quantity),
        this._datesFields(f),
        this._selectField(f, "zone_id", this._zoneOptions()),
        f.id ? this._selectField(f, "status", ["active", "dead", "removed"].map((s) => [s, this.t(s)])) : null,
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
      ),
      f.id ? this._plantingExpenses(f) : null,
      f.id ? this._diaryBox({ planting_id: f.id }) : null,
      this._photosSection(f),
    ];
  }

  _speciesField(f) {
    const hidden = h("input", { type: "hidden", name: "taxon_id", value: f.taxon_id ?? "" });
    const list = h("div", { className: "suggest", hidden: true });
    const linked = h("div", { className: "taxon" });
    const input = h("input", {
      name: "species",
      value: f.species ?? "",
      required: true,
      autocomplete: "off",
      placeholder: this.t("speciesPlaceholder"),
    });
    let timer = null;
    let seq = 0;
    const showLinked = () => {
      const taxon = hidden.value && this._taxon(hidden.value);
      linked.replaceChildren();
      if (!taxon) return;
      const common = taxon.common_names?.[this._lang()];
      linked.append(
        h("span", {}, `✓ ${this.t("linked")}: ${[common, taxon.scientific_name, taxon.family].filter(Boolean).join(" · ")}`),
        h("button", { type: "button", onclick: () => ((hidden.value = ""), showLinked()) }, this.t("unlink")),
      );
    };
    const message = (text) => list.replaceChildren(h("div", { className: "msg" }, text));
    const choose = async (item) => {
      list.hidden = true;
      let id = item.taxon_id;
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
        });
      }
      input.value = item.scientific_name;
      hidden.value = id;
      showLinked();
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
          h("div", {}, item.common_name ? `${item.common_name} — ${item.scientific_name}` : item.scientific_name),
          h(
            "div",
            { className: "sub" },
            [item.family, item.rank, item.source === "local" ? `✓ ${this.t("local")}` : item.description || item.source]
              .filter(Boolean)
              .join(" · "),
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
      hidden.value = "";
      showLinked();
      clearTimeout(timer);
      timer = setTimeout(search, 400);
    });
    input.addEventListener("blur", () => setTimeout(() => (list.hidden = true), 150));
    input.addEventListener("keydown", (ev) => ev.key === "Escape" && (list.hidden = true));
    showLinked();
    return h("label", { className: "species" }, this.t("species"), input, list, hidden, linked);
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
      sown_on: f.sown_on,
      transplanted_on: f.planted_on,
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

  // ---------- expenses ----------

  _money(value) {
    const currency = this._hass.config.currency || "EUR";
    try {
      return new Intl.NumberFormat(this._lang(), { style: "currency", currency }).format(value);
    } catch {
      return `${value.toFixed(2)} ${currency}`;
    }
  }

  _date(iso) {
    return iso ? new Date(`${iso}T12:00:00`).toLocaleDateString(this._lang()) : "";
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
    const year = String(new Date().getFullYear());
    const expenses = [...this._data.expenses].sort((a, b) => b.spent_on.localeCompare(a.spent_on));
    const thisYear = expenses.filter((e) => e.spent_on.startsWith(year));
    const byCategory = {};
    thisYear
      .filter((e) => !e.income)
      .forEach((e) => (byCategory[e.category] = (byCategory[e.category] || 0) + e.amount));
    const total = thisYear.filter((e) => !e.income).reduce((sum, e) => sum + e.amount, 0);
    const incomes = thisYear.filter((e) => e.income).reduce((sum, e) => sum + e.amount, 0);
    const linked = (e) => this._planting(e.planting_id)?.name || this._data.tools.find((t) => t.id === e.tool_id)?.name;
    return [
      h(
        "div",
        { className: "actions" },
        h(
          "button",
          { className: "primary", onclick: () => this._openExpense({ spent_on: today(), category: "plants" }) },
          `+ ${this.t("addExpense")}`,
        ),
      ),
      h(
        "div",
        { className: "summary" },
        h("strong", {}, this.t("yearTotal", { year, total: this._money(total) })),
        incomes
          ? h(
              "div",
              {},
              `${this.t("incomesTotal")}: ${this._money(incomes)} · ${this.t("balance")}: ${this._money(incomes - total)}`,
            )
          : null,
        Object.entries(byCategory)
          .sort((a, b) => b[1] - a[1])
          .map(([cat, value]) => h("div", { className: "sub" }, `${this.t(`cat_${cat}`)}: ${this._money(value)}`)),
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
    const total = mine.reduce((sum, e) => sum + e.amount, 0);
    return h(
      "div",
      { className: "taxon" },
      h("span", {}, this.t("expensesOfPlanting", { total: this._money(total) })),
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
    return `${zone.name} (${this.t("zonePlantings", { count })})`;
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
    this._openEvent({ kind: "note", done_on: today(), ...target }, back);
  }

  _eventDone(name, key = "saved") {
    const back = this._eventBack;
    this._eventBack = null;
    if (back?.planting_id) this._select(back.planting_id);
    else if (back?.zone_id) this._selectZone(back.zone_id);
    else return this._saved(name, key);
    this._showMessage(`✓ ${this.t(key, { name })}`);
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
          h("div", { className: "sub" }, `${this._date(day.date)} · ${MOON_ICONS[day.moon] || ""} ${this.t(`moon_${day.moon}`)}`),
          day.events.map((e) =>
            h(
              "button",
              { type: "button", className: "event", onclick: () => this._openEvent(e, back) },
              h("span", { className: "icon" }, EVENT_ICONS[e.kind] || "📝"),
              h(
                "span",
                { className: "main" },
                h(
                  "span",
                  {},
                  [
                    this.t(`ev_${e.kind}`),
                    showTarget ? this._targetName(e) : null,
                    e.quantity ? `${e.quantity} ${this.t(`u_${e.unit || "kg"}`)}` : null,
                    [e.product, e.dose].filter(Boolean).join(" "),
                  ]
                    .filter(Boolean)
                    .join(" — "),
                ),
                e.notes ? h("span", { className: "sub" }, e.notes) : null,
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
    const recent = [...events].sort((a, b) => b.done_on.localeCompare(a.done_on)).slice(0, 5);
    this._diaryEl.replaceChildren(
      ...[
        recent.length
        ? this._renderTimeline(recent, !!this._diaryTarget.planting_id, this._diaryTarget)
        : h("p", { className: "hint" }, this.t("emptyDiary")),
      events.length > recent.length
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

  _renderDiary() {
    const f = this._diaryFilter;
    const years = [...new Set(this._data.events.map((e) => e.done_on.slice(0, 4)))].sort().reverse();
    const events = this._data.events.filter((e) => {
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
      h("div", { className: "actions" }, h("button", { className: "primary", onclick: () => this._newEvent() }, this.t("addEvent"))),
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

  _renderEventForm() {
    const f = this._eventForm;
    const kindInput = h("input", { type: "hidden", name: "kind", value: f.kind });
    const extras = {};
    const moonEl = h("span", { className: "hint" });
    const updateMoon = (iso) => {
      const phase = iso ? moonPhase(iso) : null;
      moonEl.textContent = phase ? `${MOON_ICONS[phase]} ${this.t(`moon_${phase}`)}` : "";
    };
    const showExtras = () => {
      extras.product.hidden = !["fertilizing", "treatment"].includes(kindInput.value);
      extras.harvest.hidden = kindInput.value !== "harvest";
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
            onclick: (ev) => {
              kindInput.value = kind;
              kinds.querySelectorAll("button").forEach((b) => b.classList.toggle("active", b === ev.currentTarget));
              showExtras();
            },
          },
          h("span", {}, icon),
          this.t(`ev_${kind}`),
        ),
      ),
    );
    const target = f.planting_id ? `p:${f.planting_id}` : f.zone_id ? `z:${f.zone_id}` : "";
    const targetSelect = h(
      "label",
      {},
      this.t("target"),
      h(
        "select",
        { name: "target", required: true },
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
    const date = this._field(f, "done_on", { type: "date", required: true, oninput: (ev) => updateMoon(ev.target.value) });
    extras.product = h("div", { className: "row" }, this._field(f, "product"), this._field(f, "dose", { placeholder: "30 g / 10 L" }));
    extras.harvest = h(
      "div",
      { className: "row" },
      h("label", {}, this.t("quantity_h"), h("input", { name: "quantity", type: "number", min: 0, step: "any", value: f.quantity ?? "", inputMode: "decimal" })),
      this._selectField(f, "unit", ["kg", "pieces", "l"].map((u) => [u, this.t(`u_${u}`)])),
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
    const form = h(
      "form",
      { onsubmit: (ev) => this._saveEvent(ev) },
      h("h2", {}, f.id ? this.t("editEventTitle") : this.t("newEventTitle")),
      kindInput,
      kinds,
      targetSelect,
      h("div", { className: "row date-moon" }, date, moonEl),
      extras.product,
      extras.harvest,
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
      quantity: v.kind === "harvest" && v.quantity ? Number(v.quantity) : null,
      unit: v.kind === "harvest" ? v.unit || "kg" : null,
      notes: v.notes?.trim() || null,
    };
    if (!["fertilizing", "treatment"].includes(v.kind)) data.product = data.dose = null;
    const id = this._eventForm.id;
    if (!id) {
      if (v.cost) data.cost = Number(v.cost);
      if (v.revenue) data.revenue = Number(v.revenue);
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
    this._eventDone(this.t(`ev_${data.kind}`));
  }

  async _deleteEvent() {
    if (!confirm(this.t("confirmDeleteEvent"))) return;
    if (await this._call("delete_event", { id: this._eventForm.id })) this._eventDone(this.t(`ev_${this._eventForm.kind}`), "deleted");
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
    return [
      h(
        "form",
        { onsubmit: (ev) => this._saveZone(ev) },
        h("h2", {}, z.id ? this.t("editZoneTitle") : this.t("newZoneTitle")),
        this._field(z, "name", { required: true, maxLength: 100 }),
        h(
          "div",
          { className: "row" },
          this._selectField(z, "kind", [["", this.t("noZone")], ...ZONE_KINDS.map((k) => [k, this.t(k)])]),
          this._selectField(z, "parent_id", this._zoneOptions(exclude)),
        ),
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
      z.id ? this._diaryBox({ zone_id: z.id }) : null,
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
