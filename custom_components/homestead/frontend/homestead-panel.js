import * as L from "./vendor/leaflet.js";

const BASE = new URL(".", import.meta.url).href;

const TEXT = {
  en: {
    title: "Garden",
    satellite: "Satellite",
    map: "Map",
    add: "New planting",
    empty: "No plantings yet. Press “New planting” and click on the map.",
    noPosition: "not on the map",
    placeNew: "Click on the map where the new planting is",
    placeExisting: "Click on the map to place “{name}”",
    cancel: "Cancel",
    save: "Save",
    delete: "Delete",
    confirmDelete: "Delete “{name}”? Use the status for a dead plant.",
    newTitle: "New planting",
    editTitle: "Edit planting",
    dragHint: "Drag the marker to move it.",
    place: "Place on map",
    name: "Name",
    species: "Species",
    variety: "Variety",
    kind: "Kind",
    single: "Single plant",
    group: "Group (row, bed)",
    quantity: "Quantity",
    planted_on: "Planted on",
    zone_id: "Zone",
    noZone: "—",
    status: "Status",
    active: "Active",
    dead: "Dead",
    removed: "Removed",
    notes: "Notes",
    position: "Position",
    required: "Name and species are required.",
    notLoaded: "HA Homestead is not loaded.",
  },
  it: {
    title: "Giardino",
    satellite: "Satellite",
    map: "Mappa",
    add: "Nuova pianta",
    empty: "Nessuna pianta. Premi “Nuova pianta” e clicca sulla mappa.",
    noPosition: "non sulla mappa",
    placeNew: "Clicca sulla mappa dove si trova la nuova pianta",
    placeExisting: "Clicca sulla mappa per posizionare “{name}”",
    cancel: "Annulla",
    save: "Salva",
    delete: "Elimina",
    confirmDelete: "Eliminare “{name}”? Per una pianta morta usa lo stato.",
    newTitle: "Nuova pianta",
    editTitle: "Modifica pianta",
    dragHint: "Trascina il segnaposto per spostarlo.",
    place: "Posiziona sulla mappa",
    name: "Nome",
    species: "Specie",
    variety: "Varietà",
    kind: "Tipo",
    single: "Pianta singola",
    group: "Gruppo (fila, aiuola)",
    quantity: "Quantità",
    planted_on: "Messa a dimora",
    zone_id: "Zona",
    noZone: "—",
    status: "Stato",
    active: "Attiva",
    dead: "Morta",
    removed: "Rimossa",
    notes: "Note",
    position: "Posizione",
    required: "Nome e specie sono obbligatori.",
    notLoaded: "HA Homestead non è caricato.",
  },
};

const STATUS_COLOR = { active: "#43a047", dead: "#e53935", removed: "#9e9e9e" };

const h = (tag, attrs = {}, ...children) => {
  const el = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (value === undefined || value === null || value === false) continue;
    if (key.startsWith("on")) el.addEventListener(key.slice(2), value);
    else if (key in el && key !== "list") el[key] = value;
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
  aside { width: 340px; flex: none; overflow-y: auto; border-left: 1px solid var(--divider-color);
    background: var(--card-background-color); box-sizing: border-box; padding: 12px; }
  .narrow .body { flex-direction: column; }
  .narrow aside { width: auto; height: 42%; border-left: none; border-top: 1px solid var(--divider-color); }
  .banner { position: absolute; z-index: 1000; top: 10px; left: 50%; transform: translateX(-50%);
    background: var(--primary-color); color: var(--text-primary-color, #fff); padding: 8px 12px; border-radius: 8px;
    display: flex; gap: 12px; align-items: center; box-shadow: 0 2px 6px rgba(0,0,0,.3); max-width: 90%; }
  button { font: inherit; cursor: pointer; border-radius: 6px; padding: 6px 12px; border: 1px solid var(--divider-color);
    background: var(--card-background-color); color: var(--primary-text-color); }
  button.primary { background: var(--primary-color); color: var(--text-primary-color, #fff); border-color: transparent; }
  button.danger { color: var(--error-color, #db4437); }
  .banner button { background: transparent; color: inherit; border-color: currentColor; }
  ul { list-style: none; padding: 0; margin: 12px 0 0; }
  li { padding: 8px; border-radius: 6px; cursor: pointer; display: flex; gap: 8px; align-items: center; }
  li:hover, li.selected { background: var(--secondary-background-color); }
  li .dot { width: 10px; height: 10px; border-radius: 50%; flex: none; }
  li .main { flex: 1; min-width: 0; }
  li .sub { font-size: 12px; color: var(--secondary-text-color); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  li .warn { color: var(--warning-color, #ffa600); }
  form { display: grid; gap: 10px; }
  form h2 { margin: 0; font-size: 18px; font-weight: 500; }
  label { display: grid; gap: 4px; font-size: 13px; color: var(--secondary-text-color); }
  input, select, textarea { font: inherit; padding: 6px 8px; border-radius: 6px; border: 1px solid var(--divider-color);
    background: var(--primary-background-color); color: var(--primary-text-color); }
  .row { display: flex; gap: 8px; flex-wrap: wrap; }
  .row > * { flex: 1; }
  .hint, .error { font-size: 13px; }
  .hint { color: var(--secondary-text-color); }
  .error { color: var(--error-color, #db4437); }
  .pin { width: 18px; height: 18px; border-radius: 50%; border: 3px solid #fff; box-sizing: border-box;
    box-shadow: 0 0 4px rgba(0,0,0,.6); }
  .pin.selected { width: 26px; height: 26px; border-color: #ffeb3b; }
`;

class HomesteadPanel extends HTMLElement {
  constructor() {
    super();
    this._data = { plantings: [], zones: [] };
    this._markers = new Map();
    this._selected = null;
    this._placing = null;
    this._form = null;
    this._error = "";
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
    const lang = (this._hass.locale?.language || this._hass.language || "en").split("-")[0];
    const text = (TEXT[lang] || TEXT.en)[key] ?? TEXT.en[key] ?? key;
    return text.replace(/\{(\w+)\}/g, (_, name) => vars[name] ?? "");
  }

  _init() {
    const root = this.attachShadow({ mode: "open" });
    this._menu = h("ha-menu-button");
    this._menu.hass = this._hass;
    this._menu.narrow = this._narrow;
    this._mapEl = h("div", { style: "position:absolute;inset:0" });
    this._mapWrap = h("div", { className: "map" }, this._mapEl);
    this._errorEl = h("p", { className: "error" });
    this._content = h("div");
    this._aside = h("aside", {}, this._errorEl, this._content);
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
        this._data = { plantings: data.plantings || [], zones: data.zones || [] };
        this._loaded = !!data.plantings;
        this._syncMarkers();
        if (first) this._fitAll();
        first = false;
        if (this._form) this._refreshForm();
        else this._render();
      },
      { type: "homestead/subscribe" },
    );
  }

  _fitAll() {
    const points = this._data.plantings.filter((p) => p.latitude != null).map((p) => [p.latitude, p.longitude]);
    if (points.length) this._map.fitBounds(points, { padding: [40, 40], maxZoom: 19 });
  }

  _planting(id) {
    return this._data.plantings.find((p) => p.id === id);
  }

  _syncMarkers() {
    const seen = new Set();
    for (const p of this._data.plantings) {
      if (p.latitude == null || p.longitude == null) continue;
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
        marker.on("click", () => this._select(p.id));
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
      marker.unbindTooltip().bindTooltip(p.name, { direction: "top", offset: [0, -10] });
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

  _select(id, fallback = null) {
    this._selected = id;
    this._placing = null;
    this._error = "";
    const p = this._planting(id) || fallback;
    this._form = p ? { ...p } : null;
    if (p?.latitude != null) this._map.panTo([p.latitude, p.longitude]);
    this._syncMarkers();
    this._render();
  }

  _startPlacing(id) {
    this._placing = { id };
    this._render();
  }

  async _mapClick(latlng) {
    if (!this._placing) return;
    const { id } = this._placing;
    this._placing = null;
    if (id) {
      this._selected = id;
      await this._setPosition(id, latlng.lat, latlng.lng);
      this._form = { ...this._planting(id) };
      this._render();
      return;
    }
    this._selected = null;
    this._error = "";
    this._form = {
      name: "",
      species: "",
      kind: "single",
      quantity: 1,
      status: "active",
      planted_on: new Date().toISOString().slice(0, 10),
      latitude: latlng.lat,
      longitude: latlng.lng,
    };
    this._syncMarkers();
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
      this._showError("");
      return result.response;
    } catch (err) {
      this._showError(err.message || String(err));
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
      this._showError(this.t("required"));
      return;
    }
    const data = {
      name: values.name.trim(),
      species: values.species.trim(),
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

  async _delete() {
    const { id, name } = this._form;
    if (!confirm(this.t("confirmDelete", { name }))) return;
    if (await this._call("delete_planting", { id })) this._close();
  }

  _close() {
    this._form = null;
    this._selected = null;
    this._placing = null;
    this._error = "";
    this._syncMarkers();
    this._render();
  }

  _render() {
    if (!this._aside) return;
    this._mapWrap.classList.toggle("placing", !!this._placing);
    this._mapWrap.querySelector(".banner")?.remove();
    if (this._placing) {
      const name = this._planting(this._placing.id)?.name;
      this._mapWrap.append(
        h(
          "div",
          { className: "banner" },
          h("span", {}, name ? this.t("placeExisting", { name }) : this.t("placeNew")),
          h("button", { onclick: () => this._close() }, this.t("cancel")),
        ),
      );
    }
    this._showError(this._error);
    this._content.replaceChildren(...(this._form ? this._renderForm() : this._renderList()).filter(Boolean));
  }

  _showError(message) {
    this._error = message;
    this._errorEl.textContent = message;
    this._errorEl.hidden = !message;
  }

  _refreshForm() {
    const p = this._form.id && this._planting(this._form.id);
    if (this._form.id && !p) return this._close();
    if (p) Object.assign(this._form, { latitude: p.latitude, longitude: p.longitude });
    this._positionEl.textContent = this._positionText();
  }

  _positionText() {
    const f = this._form;
    if (f.latitude == null) return "";
    const where = `${this.t("position")}: ${f.latitude.toFixed(6)}, ${f.longitude.toFixed(6)}`;
    return f.id ? `${where} — ${this.t("dragHint")}` : where;
  }

  _renderList() {
    const zones = Object.fromEntries(this._data.zones.map((z) => [z.id, z.name]));
    const plantings = [...this._data.plantings].sort((a, b) => a.name.localeCompare(b.name));
    return [
      h("button", { className: "primary", onclick: () => this._startPlacing(null) }, `+ ${this.t("add")}`),
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
                  onclick: () => (p.latitude == null ? this._startPlacing(p.id) : this._select(p.id)),
                },
                h("span", { className: "dot", style: `background:${STATUS_COLOR[p.status] || STATUS_COLOR.active}` }),
                h(
                  "div",
                  { className: "main" },
                  h("div", {}, p.name),
                  h(
                    "div",
                    { className: "sub" },
                    [p.species, p.variety, zones[p.zone_id], p.kind === "group" ? `×${p.quantity}` : null]
                      .filter(Boolean)
                      .join(" · "),
                  ),
                  p.latitude == null ? h("div", { className: "sub warn" }, `📍 ${this.t("noPosition")}`) : null,
                ),
              ),
            ),
          )
        : h("p", { className: "hint" }, this.t("empty")),
    ];
  }

  _renderForm() {
    const f = this._form;
    const field = (name, attrs = {}) =>
      h("label", {}, this.t(name), h("input", { name, value: f[name] ?? "", ...attrs }));
    const select = (name, options, value) =>
      h(
        "label",
        {},
        this.t(name),
        h(
          "select",
          { name },
          options.map(([v, text]) => h("option", { value: v, selected: v === (value ?? "") }, text)),
        ),
      );
    const zones = [["", this.t("noZone")], ...this._data.zones.map((z) => [z.id, z.name])];
    const quantity = field("quantity", { type: "number", min: 1, step: 1 });
    const kind = select("kind", [["single", this.t("single")], ["group", this.t("group")]], f.kind);
    const toggleQuantity = () => (quantity.style.display = kind.querySelector("select").value === "group" ? "" : "none");
    kind.addEventListener("change", toggleQuantity);
    toggleQuantity();
    const form = h(
      "form",
      { onsubmit: (ev) => this._save(ev) },
      h("h2", {}, f.id ? this.t("editTitle") : this.t("newTitle")),
      field("name", { required: true, maxLength: 100 }),
      field("species", { required: true, placeholder: "Malus domestica" }),
      field("variety"),
      h("div", { className: "row" }, kind, quantity),
      h("div", { className: "row" }, field("planted_on", { type: "date" }), select("zone_id", zones, f.zone_id)),
      f.id
        ? select("status", ["active", "dead", "removed"].map((s) => [s, this.t(s)]), f.status)
        : null,
      h("label", {}, this.t("notes"), h("textarea", { name: "notes", rows: 3, value: f.notes ?? "" })),
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
    return [form];
  }
}

function round(value) {
  return Math.round(value * 1e7) / 1e7;
}

customElements.define("homestead-panel", HomesteadPanel);
