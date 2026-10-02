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
    add: "New planting",
    addZone: "New zone",
    import: "Import KML / KMZ / GeoJSON",
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
    importTitle: "Import map",
    importHint: "Same names are matched to your plantings and zones. Empty species = the name is used.",
    importSkipped: "{count} lines or empty elements ignored.",
    importNothing: "No points or polygons found in the file.",
    importApply: "Import {count}",
    importProgress: "Importing… {done}/{count}",
    importDone: "{count} elements imported.",
    point: "Point",
    polygon: "Polygon",
    newPlanting: "New planting",
    newZone: "New zone",
    skip: "Ignore",
    update: "Update “{name}”",
    tooLarge: "File too large (max 2 MB).",
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
    add: "Nuova pianta",
    addZone: "Nuova zona",
    import: "Importa KML / KMZ / GeoJSON",
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
    importTitle: "Importa mappa",
    importHint: "Gli stessi nomi vengono abbinati alle tue piante e zone. Specie vuota = uso il nome.",
    importSkipped: "{count} linee o elementi vuoti ignorati.",
    importNothing: "Nessun punto o poligono trovato nel file.",
    importApply: "Importa {count}",
    importProgress: "Importo… {done}/{count}",
    importDone: "{count} elementi importati.",
    point: "Punto",
    polygon: "Poligono",
    newPlanting: "Nuova pianta",
    newZone: "Nuova zona",
    skip: "Ignora",
    update: "Aggiorna “{name}”",
    tooLarge: "File troppo grande (max 2 MB).",
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

const STATUS_COLOR = { active: "#43a047", dead: "#e53935", removed: "#9e9e9e" };
const ZONE_COLOR = "#ffca28";
const MAX_FILE_BYTES = 2 * 1024 * 1024;

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
  .layout { display: flex; flex-direction: column; height: 100%; }
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
  .tabs button { border: none; border-bottom: 2px solid transparent; border-radius: 0; background: none; flex: 1; }
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
  .pin { width: 18px; height: 18px; border-radius: 50%; border: 3px solid #fff; box-sizing: border-box;
    box-shadow: 0 0 4px rgba(0,0,0,.6); }
  .pin.selected { width: 26px; height: 26px; border-color: #ffeb3b; }
`;

class HomesteadPanel extends HTMLElement {
  constructor() {
    super();
    this._data = { plantings: [], zones: [], taxa: [] };
    this._taxaPending = new Map();
    this._markers = new Map();
    this._polygons = new Map();
    this._tab = "plantings";
    this._selected = null;
    this._placing = null;
    this._drawing = null;
    this._form = null;
    this._zoneForm = null;
    this._import = null;
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
      accept: ".kml,.kmz,.geojson,.json",
      hidden: true,
      onchange: (ev) => this._readFile(ev.target),
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
        maxZoom: 21,
        maxNativeZoom: 19,
        attribution: "Tiles © Esri — Esri, Maxar, Earthstar Geographics, GIS User Community",
      },
    );
    const streets = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 21,
      maxNativeZoom: 19,
      attribution: "© OpenStreetMap contributors",
    });
    this._map = L.map(this._mapEl, { center: [latitude, longitude], zoom: 18, layers: [satellite] });
    L.control.layers({ [this.t("satellite")]: satellite, [this.t("map")]: streets }).addTo(this._map);
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
        this._data = { plantings: data.plantings || [], zones: data.zones || [], taxa: data.taxa || [] };
        this._loaded = !!data.plantings;
        this._syncMap();
        if (first) this._fitAll();
        first = false;
        if (this._form) this._refreshForm();
        else if (!this._zoneForm && !this._import) this._render();
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
      const selected = this._zoneForm?.id === z.id;
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
      const selected = p.id === this._selected;
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
    if (this._import) {
      const style = { color: "#ff7043", weight: 2, dashArray: "4 4", interactive: false };
      this._import.rows.forEach((row) => {
        if (row.action === "skip") return;
        const g = row.geometry;
        if (g.type === "Point") L.circleMarker([g.coordinates[1], g.coordinates[0]], { ...style, radius: 7 }).addTo(this._previewLayer);
        else L.polygon(toLatLngs(g), { ...style, fillOpacity: 0.1 }).addTo(this._previewLayer);
      });
    }
  }

  // ---------- interaction ----------

  _clearSelection() {
    this._form = null;
    this._zoneForm = null;
    this._import = null;
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
      planted_on: new Date().toISOString().slice(0, 10),
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
      planted_on: values.planted_on || null,
      zone_id: values.zone_id || null,
      notes: values.notes?.trim() || null,
    };
    if (this._form.id) {
      data.status = values.status;
      const id = this._form.id;
      if (await this._call("update_planting", { id, ...data })) this._select(id, { ...this._form, ...data });
    } else {
      data.latitude = round(this._form.latitude);
      data.longitude = round(this._form.longitude);
      const result = await this._call("add_planting", data);
      if (result) this._select(result.id, { ...data, id: result.id });
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
      if (await this._call("update_zone", { id, ...data })) this._selectZone(id, { ...this._zoneForm, ...data });
    } else {
      if (this._zoneForm.geometry) data.geometry = this._zoneForm.geometry;
      const result = await this._call("add_zone", data);
      if (result) this._selectZone(result.id, { ...data, id: result.id });
    }
  }

  async _delete() {
    const { id, name } = this._form;
    if (!confirm(this.t("confirmDelete", { name }))) return;
    if (await this._call("delete_planting", { id })) this._close();
  }

  async _deleteZone() {
    const { id, name } = this._zoneForm;
    if (!confirm(this.t("confirmDeleteZone", { name }))) return;
    if (await this._call("delete_zone", { id })) this._close();
  }

  // ---------- import ----------

  async _readFile(input) {
    const file = input.files?.[0];
    input.value = "";
    if (!file) return;
    if (file.size > MAX_FILE_BYTES) {
      this._showMessage(this.t("tooLarge"), true);
      return;
    }
    let result;
    try {
      result = await this._hass.callWS({
        type: "homestead/parse_map",
        filename: file.name,
        content: toBase64(await file.arrayBuffer()),
      });
    } catch (err) {
      this._showMessage(err.message || String(err), true);
      return;
    }
    this._clearSelection();
    const byName = (items, name) => items.find((i) => i.name.trim().toLowerCase() === name.toLowerCase());
    let points = 0;
    let polygons = 0;
    const rows = result.features.map((f) => {
      const isPoint = f.geometry.type === "Point";
      const name = f.name || `${this.t(isPoint ? "point" : "polygon")} ${isPoint ? ++points : ++polygons}`;
      const match = f.name && byName(isPoint ? this._data.plantings : this._data.zones, f.name);
      return { name, species: "", geometry: f.geometry, action: match ? match.id : "new" };
    });
    this._import = { rows, skipped: result.skipped, busy: false };
    this._showMessage(rows.length ? "" : this.t("importNothing"), !rows.length);
    this._drawPreview();
    const bounds = L.latLngBounds([]);
    rows.forEach((r) =>
      r.geometry.type === "Point"
        ? bounds.extend([r.geometry.coordinates[1], r.geometry.coordinates[0]])
        : bounds.extend(L.polygon(toLatLngs(r.geometry)).getBounds()),
    );
    if (bounds.isValid()) this._map.fitBounds(bounds, { padding: [40, 40], maxZoom: 19 });
    this._render();
  }

  async _applyImport() {
    const rows = this._import.rows.filter((r) => r.action !== "skip");
    const ordered = [...rows.filter((r) => r.geometry.type !== "Point"), ...rows.filter((r) => r.geometry.type === "Point")];
    const created = [];
    let done = 0;
    this._import.busy = true;
    for (const row of ordered) {
      this._applyButton.textContent = this.t("importProgress", { done, count: ordered.length });
      const g = row.geometry;
      let result;
      if (g.type === "Point") {
        const [lng, lat] = g.coordinates;
        result =
          row.action === "new"
            ? await this._call("add_planting", {
                name: row.name,
                species: row.species.trim() || row.name,
                latitude: round(lat),
                longitude: round(lng),
                zone_id: this._zoneAt(lat, lng, created),
              })
            : await this._call("update_planting", { id: row.action, latitude: round(lat), longitude: round(lng) });
      } else if (row.action === "new") {
        result = await this._call("add_zone", { name: row.name, geometry: g });
        if (result) created.push({ id: result.id, geometry: g, area_m2: polygonArea(g) });
      } else {
        result = await this._call("update_zone", { id: row.action, geometry: g });
      }
      if (!result) {
        this._import.busy = false;
        this._render();
        return;
      }
      done++;
    }
    this._close();
    this._fitAll();
    this._showMessage(this.t("importDone", { count: done }));
  }

  // ---------- rendering ----------

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
    if (this._import) content = this._renderImport();
    else if (this._form && !this._placing) content = this._renderForm();
    else if (this._zoneForm && !this._drawing) content = this._renderZoneForm();
    else content = [this._renderTabs(), ...(this._tab === "zones" ? this._renderZoneList() : this._renderList())];
    this._content.replaceChildren(...content.filter(Boolean));
  }

  _renderTabs() {
    const tab = (name, label) =>
      h("button", { className: this._tab === name ? "active" : "", onclick: () => this._setTab(name) }, label);
    return h("div", { className: "tabs" }, tab("plantings", this.t("tabPlantings")), tab("zones", this.t("tabZones")));
  }

  _importButton() {
    return h("button", { onclick: () => this._fileInput.click() }, `📂 ${this.t("import")}`);
  }

  _refreshForm() {
    const p = this._form.id && this._planting(this._form.id);
    if (this._form.id && !p) return this._close();
    if (p) Object.assign(this._form, { latitude: p.latitude, longitude: p.longitude });
    if (this._positionEl) this._positionEl.textContent = this._positionText();
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
        this._importButton(),
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
        this._importButton(),
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
        h(
          "div",
          { className: "row" },
          this._field(f, "planted_on", { type: "date" }),
          this._selectField(f, "zone_id", this._zoneOptions()),
        ),
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
    ];
  }

  _renderImport() {
    const { rows, skipped, busy } = this._import;
    const active = rows.filter((r) => r.action !== "skip").length;
    this._applyButton = h(
      "button",
      { className: "primary", disabled: busy || !active, onclick: () => this._applyImport() },
      this.t("importApply", { count: active }),
    );
    return [
      h("h2", {}, this.t("importTitle")),
      h("p", { className: "hint" }, this.t("importHint")),
      skipped ? h("p", { className: "hint" }, this.t("importSkipped", { count: skipped })) : null,
      ...rows.map((row) => this._renderImportRow(row)),
      h(
        "div",
        { className: "row", style: "margin-top:12px" },
        this._applyButton,
        h("button", { onclick: () => this._close(), disabled: busy }, this.t("cancel")),
      ),
    ];
  }

  _renderImportRow(row) {
    const isPoint = row.geometry.type === "Point";
    const existing = (isPoint ? this._data.plantings : this._data.zones)
      .map((item) => [item.id, this.t("update", { name: item.name })])
      .sort((a, b) => a[1].localeCompare(b[1]));
    const options = [["new", this.t(isPoint ? "newPlanting" : "newZone")], ...existing, ["skip", this.t("skip")]];
    const species = h("input", {
      placeholder: `${this.t("species")} (${row.name})`,
      value: row.species,
      oninput: (ev) => (row.species = ev.target.value),
    });
    const name = h("input", { value: row.name, oninput: (ev) => (row.name = ev.target.value || row.name) });
    const update = () => {
      species.style.display = isPoint && row.action === "new" ? "" : "none";
      name.style.display = row.action === "new" ? "" : "none";
    };
    const select = h(
      "select",
      {
        onchange: (ev) => {
          row.action = ev.target.value;
          update();
          this._drawPreview();
          this._applyButton.textContent = this.t("importApply", {
            count: this._import.rows.filter((r) => r.action !== "skip").length,
          });
          this._applyButton.disabled = !this._import.rows.some((r) => r.action !== "skip");
        },
      },
      options.map(([v, text]) => h("option", { value: v, selected: v === row.action }, text)),
    );
    update();
    const focus = () => {
      const g = row.geometry;
      if (isPoint) this._map.setView([g.coordinates[1], g.coordinates[0]], Math.max(this._map.getZoom(), 19));
      else this._map.fitBounds(L.polygon(toLatLngs(g)).getBounds(), { padding: [40, 40] });
    };
    const area = isPoint ? "" : ` · ${formatArea(polygonArea(row.geometry))}`;
    return h(
      "div",
      { className: "import-row" },
      h("div", { className: "head", onclick: focus }, `${isPoint ? "📍" : "⬠"} ${row.name}${area}`),
      select,
      name,
      species,
    );
  }
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

function toBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(binary);
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
