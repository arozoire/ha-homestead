import * as L from "./vendor/leaflet.js";

const BASE = new URL(".", import.meta.url).href;

const ZONE_KINDS = ["vegetable_garden", "orchard", "flower_bed", "greenhouse", "pots", "lawn", "woodland", "compost", "coop", "nursery", "indoor", "other"];

const TEXT = {};
// Panel texts, one file per language in i18n/ (English as fallback), loaded before the first render.
const VERSION = new URL(import.meta.url).search;
async function loadTexts(lang) {
  const load = async (code) => {
    if (TEXT[code]) return;
    try {
      const response = await fetch(`${BASE}i18n/${code}.json${VERSION}`);
      if (response.ok) TEXT[code] = await response.json();
    } catch {
      // missing language: English is used
    }
  };
  await Promise.all([load("en"), lang === "en" ? null : load(lang)]);
  TEXT.en ||= {};
}

const EXPENSE_CATEGORIES = ["plants", "seeds", "tools", "fertilizers", "treatments", "water", "services", "sales", "animals", "other"];
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
  compost_turn: "♻️",
  compost_harvest: "🪱",
  eggs: "🥚",
  flock_in: "🐔",
  flock_out: "🦊",
  animal_care: "🥣",
  coop_cleaning: "🧹",
  repotting: "🪴",
  wood_burned: "🔥",
};
const WOOD_KINDS = ["clearing", "wood_cutting", "brushwood", "foraging", "wood_burned"];
// Kinds that make sense for a houseplant.
const INDOOR_KINDS = ["watering", "fertilizing", "repotting", "treatment", "pruning", "problem", "note", "removal"];
// Months firewood needs to dry before burning.
const WOOD_SEASON_MONTHS = 18;
// Garden kinds that still make sense in a woodland.
const WOODLAND_ALSO = ["pruning", "treatment", "problem", "note"];
const COMPOST_KINDS = ["compost_turn", "compost_harvest"];
const COOP_KINDS = ["eggs", "flock_in", "flock_out", "animal_care", "coop_cleaning"];
// Kinds that make sense in a compost bin or a hen house besides their own.
const YARD_ALSO = ["note", "problem"];
const COMPOST_TURN_DAYS = 28;
// Diary entries drawn at once (more on request).
const DIARY_PAGE = 60;
const LEAVE_REASONS = ["predator", "illness", "age", "sold", "slaughtered", "other"];
const END_REASONS = { finished: "✅", died: "💀", removed: "🗑️" };
const DEATH_CAUSES = { frost: "❄️", drought: "🏜️", disease: "🦠", pests: "🐛", animals: "🐾", unknown: "❔" };
// Seedlings are usually planted out a few weeks after they come up.
const READY_DAYS = 21;
const LEAVE_ICONS = { predator: "🦊", illness: "🤒", age: "⌛", sold: "🤝", slaughtered: "🔪", other: "❔" };
// Quantity label when it is not a harvest.
const QUANTITY_LABEL = { eggs: "eggCount", flock_in: "henCount", flock_out: "henCount" };
const QUANTITY_UNITS = {
  harvest: ["kg", "pieces", "l"],
  foraging: ["kg", "pieces", "l"],
  wood_cutting: ["q", "stere", "m3"],
  wood_burned: ["q", "stere", "m3"],
  brushwood: ["q", "stere", "m3", "pieces"],
  eggs: ["pieces"],
  flock_in: ["pieces"],
  flock_out: ["pieces"],
};
// Kinds with a "product" field, and its label.
const PRODUCT_LABEL = { fertilizing: "product", treatment: "product", foraging: "what", wood_cutting: "essence", flock_in: "breed", animal_care: "feedOrCare" };
const PLANT_ICONS = { tree: "🌳", fruit_tree: "🍎", shrub: "🍃", vine: "🍇", vegetable: "🥕", herb: "🌿", flower: "🌸", houseplant: "🪴", other: "🌱" };
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
const ZONE_ICONS = { vegetable_garden: "🥕", orchard: "🍎", flower_bed: "🌸", greenhouse: "🏠", pots: "🪴", lawn: "🌾", woodland: "🌲", compost: "♻️", coop: "🐔", nursery: "🌱", indoor: "🛋️", other: "📍" };
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
const ZONE_PLANT_TYPE = { orchard: "fruit_tree", vegetable_garden: "vegetable", greenhouse: "vegetable", flower_bed: "flower", indoor: "houseplant" };
// Start of a planting, shown in the diary from its own dates (not stored as events).
const START_ICONS = { sowing: "🌱", germinated: "🌿", planted: "🪴", since: "🌳" };
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
  .wide-tab .map { display: none !important; }
  .wide-tab aside { width: auto; max-width: none; flex: 1; border: none; padding: 12px max(12px, calc((100% - 1100px) / 2)); }
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
  .tab-icon { margin-right: 6px; }
  /* Phone: the menu at the bottom, icons over labels, clear of the gesture bar. */
  .narrow .tabs-bar { order: 3; display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 0; padding: 0 0 env(safe-area-inset-bottom);
    border-bottom: none; border-top: 1px solid var(--divider-color); overflow: hidden; }
  .narrow .tabs-bar button { display: flex; flex-direction: column; align-items: center; gap: 1px; padding: 6px 0 7px; font-size: 12px;
    border-bottom: none; border-top: 3px solid transparent; min-height: 56px; justify-content: center; }
  .narrow .tabs-bar button.active { border-top-color: var(--homestead-accent, #3a7d44); }
  .narrow .tab-icon { margin: 0; font-size: 20px; line-height: 1.1; }
  .narrow.typing .tabs-bar { display: none; }
  .back { border: none; background: none; color: var(--primary-color); padding: 4px 0; margin-bottom: 6px; font-size: 15px; }
  .map-switch { margin-bottom: 10px; }
  .repeat-card { display: grid; gap: 2px; width: 100%; text-align: left; border: 2px solid #26a69a; background: rgba(38, 166, 154, .08);
    border-radius: 12px; padding: 10px 12px; margin: 8px 0; }
  .repeat-card .sub { white-space: normal; }
  .repeat-box { border: 2px solid #26a69a; border-radius: 12px; padding: 10px 12px; margin: 8px 0; display: grid; gap: 6px; }
  .repeat-row { display: flex; align-items: center; gap: 10px; min-height: 44px; border-bottom: 1px solid var(--divider-color); }
  .repeat-row input { width: 22px; height: 22px; flex: none; }
  .repeat-name { flex: 1; display: grid; }
  .care { border: 1px solid var(--divider-color); border-radius: 10px; padding: 6px 10px; display: grid; gap: 6px; }
  .care legend { font-weight: 700; padding: 0 4px; }
  .sow-button { flex: none; border-radius: 20px; font-weight: 700; align-self: center; }
  .nursery { display: grid; gap: 8px; margin: 12px 0; }
  .batch { border: 2px solid var(--divider-color); border-radius: 12px; padding: 8px 10px; display: grid; gap: 6px; }
  .batch.late { border-color: #e69100; background: rgba(230, 145, 0, .07); }
  .batch.ready { border-color: #2f7d32; background: rgba(47, 125, 50, .07); }
  .batch-head { display: flex; gap: 8px; align-items: center; }
  .batch-head .main { flex: 1; display: grid; min-width: 0; }
  .batch .sub { white-space: normal; }
  .batch-state { font-size: 13px; font-weight: 700; text-align: right; }
  .batch.late .batch-state { color: #8a4b00; }
  .batch.ready .batch-state { color: #1f5e24; }
  .batch-bar { position: relative; height: 10px; border-radius: 5px; background: var(--secondary-background-color, #e6e9e1); }
  .batch-bar i { position: absolute; top: 0; bottom: 0; border-radius: 5px; background: #b9d7b4; }
  .batch-bar b { position: absolute; top: -3px; width: 4px; height: 16px; border-radius: 2px; background: var(--primary-text-color); }
  .batch .row button { flex: 1; border-radius: 20px; font-weight: 700; min-height: 40px; }
  .stepper { display: flex; align-items: center; gap: 8px; }
  .stepper button { width: 44px; height: 44px; border-radius: 22px; font-size: 22px; padding: 0; flex: none; }
  .stepper input { flex: 1; text-align: center; font-size: 20px; font-weight: 700; min-width: 0; }
  .expect { font-size: 14px; background: rgba(58, 125, 68, .1); border-radius: 10px; padding: 8px 12px; display: grid; gap: 2px; }
  .zone-tap { display: grid; gap: 10px; }
  .zone-tap .big { min-height: 52px; font-size: 17px; font-weight: 700; border-radius: 12px; background: #2f7d32; color: #fff; border-color: transparent; }
  .zone-tap .outline { min-height: 46px; font-weight: 700; border-radius: 12px; border: 2px solid #2f7d32; color: #1f5e24; }
  .show-gone { display: flex; align-items: center; gap: 8px; margin: 6px 0; font-size: 14px; color: var(--secondary-text-color); }
  .more-list { display: grid; border: 1px solid var(--divider-color); border-radius: 12px; overflow: hidden; margin-bottom: 12px; }
  .more-item { display: flex; align-items: center; gap: 12px; text-align: left; border: none; border-bottom: 1px solid var(--divider-color);
    border-radius: 0; background: var(--card-background-color); min-height: 60px; padding: 6px 14px; font-size: 18px; color: var(--secondary-text-color); }
  .more-item:last-child { border-bottom: none; }
  .more-icon { font-size: 24px; width: 32px; text-align: center; }
  .more-text { flex: 1; display: grid; font-size: 15px; color: var(--primary-text-color); }
  .more-text .sub { white-space: normal; }
  .sub.warn { color: var(--error-color, #db4437); }
  .link-plain { border: none; background: none; padding: 0; text-align: left; color: inherit; }
  .reset-box { margin-top: 16px; border: 1px solid #e3b5ab; background: rgba(179, 38, 30, .06); border-radius: 12px; padding: 10px 12px; display: grid; gap: 8px; }
  .reset-box h3 { margin: 0; color: #8f2b17; }
  .reset-box label { display: grid; gap: 4px; }
  .danger-fill { background: #a02a14; color: #fff; border-color: transparent; font-weight: 700; }
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
  .care-notes { margin-top: 12px; }
  .care-notes summary { cursor: pointer; color: var(--secondary-text-color); font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .care-notes[open] { display: grid; gap: 8px; }
  .care-notes textarea { width: 100%; box-sizing: border-box; font: inherit; }
  .season { padding: 8px 10px; border-radius: 6px; border: 1px solid var(--divider-color); display: grid; gap: 3px; }
  .season.current { border-color: var(--primary-color); }
  .season-head { display: flex; gap: 8px; align-items: baseline; flex-wrap: wrap; }
  .review-ask { border-color: #ffb300; text-align: left; }
  .todo { display: grid; gap: 4px; margin: 12px 0; }
  .task { display: flex; gap: 6px; align-items: stretch; }
  .task .tick { flex: none; width: 36px; padding: 0; color: var(--success-color, #43a047); font-size: 18px; }
  .task-main { flex: 1; display: grid; gap: 2px; text-align: left; }
  .task.late .sub { color: var(--error-color, #db4437); }
  button.link { font: inherit; background: none; border: none; padding: 0; color: var(--primary-color, #03a9f4); cursor: pointer; }
  .coop { margin-bottom: 16px; }
  .quick-eggs { align-items: center; }
  .quick-eggs button { flex: none; white-space: nowrap; }
  .coop-recent button.link, .coop-flock button.link { font-size: 13px; }
  .quick-eggs input { flex: 1 1 8em; min-width: 0; }
  .coop-stats { display: grid; grid-template-columns: repeat(auto-fill, minmax(96px, 1fr)); gap: 6px; }
  .coop-stat { display: flex; flex-direction: column; background: var(--secondary-background-color, #f4f5f0); border-radius: 8px; padding: 6px 8px; }
  .coop-stat strong { font-size: 18px; }
  .coop-stat .sub { white-space: normal; }
  .coop-recent, .coop-flock { display: flex; flex-wrap: wrap; gap: 4px 8px; align-items: baseline; }
  .coop-flock strong { flex-basis: 100%; }
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
  .calendar { display: grid; gap: 10px; }
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
  .an-tiles { display: grid; grid-template-columns: repeat(auto-fill, minmax(175px, 1fr)); gap: 8px; margin: 8px 0; }
  .an-tile { background: var(--card-background-color, #fff); border: 1px solid var(--divider-color, #e1e4dc); border-radius: 10px; padding: 8px 10px; display: flex; flex-direction: column; gap: 2px; }
  .an-tile .sub { white-space: normal; }
  .an-tile-head { display: flex; align-items: center; gap: 6px; justify-content: space-between; }
  .an-badge { white-space: nowrap; font-size: 11px; font-weight: 700; border-radius: 10px; padding: 1px 7px; }
  .an-badge.good, .an-cell.good { background: #e3f2e1; color: #1f5e24; }
  .an-badge.mid, .an-cell.mid { background: #fff1d6; color: #7a4a00; }
  .an-badge.bad, .an-cell.bad { background: #fbe1dc; color: #8f2b17; }
  .segmented { display: inline-flex; border: 1px solid var(--divider-color, #c9cec4); border-radius: 8px; overflow: hidden; }
  .segmented button { font: inherit; font-size: 13px; border: none; background: transparent; padding: 4px 10px; cursor: pointer; color: inherit; }
  .segmented button.active { background: var(--homestead-accent, #3a7d44); color: #fff; }
  .an-box { background: var(--card-background-color, #fff); border: 1px solid var(--divider-color, #e1e4dc); border-radius: 10px; padding: 10px 12px; margin: 8px 0; display: flex; flex-direction: column; gap: 8px; }
  .an-box h3 { margin: 0; font-size: 16px; }
  .an-table { display: grid; gap: 3px; font-size: 13px; overflow-x: auto; align-items: center; }
  .an-th { font-weight: 700; text-align: center; color: var(--secondary-text-color, #5b6560); }
  .an-zone { grid-column: 1 / -1; font-weight: 700; background: #eef1ea; color: #1d2320; border-radius: 6px; padding: 4px 8px; margin-top: 4px; }
  .an-name { font: inherit; text-align: left; border: none; background: none; padding: 2px 4px 2px 12px; cursor: pointer; color: inherit; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .an-name:hover { text-decoration: underline; }
  .an-cell { text-align: center; border-radius: 6px; padding: 4px 2px; white-space: nowrap; }
  .an-cost { text-align: right; white-space: nowrap; color: var(--secondary-text-color, #5b6560); }
  .an-bars { display: flex; gap: 10px; align-items: flex-end; overflow-x: auto; }
  .an-bar { display: flex; flex-direction: column; align-items: center; gap: 2px; min-width: 70px; flex: 1; }
  .an-bar .sub { font-size: 11px; min-height: 13px; text-align: center; }
  .an-bar i { display: block; width: 70%; max-width: 46px; border-radius: 4px 4px 0 0; background: #9bb59e; }
  .an-bar i.good { background: #4f9a57; } .an-bar i.mid { background: #e0a030; } .an-bar i.bad { background: #c9563c; } .an-bar i.moon { background: #7c86b8; }
  .an-timing { display: flex; flex-direction: column; gap: 3px; }
  .an-cmp { display: grid; grid-template-columns: 90px 1fr 90px; gap: 6px; align-items: center; font-size: 13px; }
  .an-cmp i { display: block; height: 10px; border-radius: 5px; background: #c9cec4; }
  .an-cmp i.good { background: #4f9a57; }
  .an-lessons .keep, .an-lessons .avoid { display: flex; flex-direction: column; gap: 2px; }
  .alert-line { font-size: 13px; background: #fff4e0; color: #6b3e00; border-radius: 8px; padding: 6px 10px; }
  .days { display: grid; grid-auto-flow: column; grid-auto-columns: minmax(52px, 1fr); gap: 4px; text-align: center; font-size: 13px;
    overflow-x: auto; margin-bottom: 8px; padding-bottom: 2px; }
  .day-col { display: grid; gap: 1px; align-content: start; padding: 5px 2px; border-radius: 8px; background: var(--card-background-color);
    border: 2px solid var(--divider-color); }
  .day-col.today { border-color: var(--homestead-accent, #3a7d44); }
  .day-col.alert { border-color: #7fa7d9; }
  .day-col .day-name { font-weight: 700; font-size: 12px; }
  .day-col .wx { font-size: 22px; }
  .day-col .t-max { font-weight: 700; font-size: 15px; }
  .day-col .sub { white-space: normal; }
  .day-col .rain { color: #1e64c8; min-height: 15px; }
  .day-chips { display: flex; flex-wrap: wrap; justify-content: center; gap: 1px; min-height: 18px; }
  .alert-chip { font-size: 14px; }
  .task-chip { padding: 0 1px; border: none; background: none; font-size: 15px; border-radius: 4px; }
  .task-chip.good { box-shadow: inset 0 -3px 0 #43a047; }
  .task-chip.warn { box-shadow: inset 0 -3px 0 #ffa600; }
  .task-chip.better { font-weight: 700; color: #2f7d32; }
  .quick-buttons { display: grid; grid-auto-flow: column; grid-auto-columns: minmax(0, 1fr); gap: 6px; margin: 12px 0; }
  .quick-button { display: grid; justify-items: center; gap: 2px; min-height: 64px; border-radius: 12px; font-size: 12px; font-weight: 600; padding: 6px 2px;
    overflow: hidden; text-overflow: ellipsis; }
  .quick-button span { font-size: 24px; line-height: 1.1; }
  .quick-box { border: 1px solid var(--divider-color); border-radius: 12px; padding: 8px 12px; margin-bottom: 12px; }
  .quick-box .search { display: flex; align-items: center; gap: 8px; border: 1px solid var(--divider-color); border-radius: 10px; padding: 0 10px; }
  .quick-box .search input { flex: 1; border: none; outline: none; height: 42px; background: transparent; font: inherit; color: inherit; }
  .quick-title { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: .03em; color: var(--secondary-text-color); padding: 12px 0 2px; }
  .quick-row { border-bottom: 1px solid var(--divider-color); padding: 6px 0; display: grid; gap: 6px; }
  .quick-line { display: flex; align-items: center; gap: 8px; }
  .quick-icon { font-size: 22px; width: 30px; text-align: center; flex: none; }
  .quick-name { flex: 1; min-width: 0; display: grid; text-align: left; border: none; background: none; padding: 2px 0; }
  .quick-name strong, .quick-name .sub { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .quick-saved { font-size: 13px; font-weight: 700; color: #1f5e24; white-space: nowrap; }
  .quick-action { flex: none; border-radius: 20px; min-height: 40px; font-weight: 700; white-space: nowrap; }
  .quick-stepper { display: flex; align-items: center; gap: 8px; background: rgba(58, 125, 68, .08); border-radius: 10px; padding: 6px; }
  .quick-stepper button:not(.primary) { width: 44px; height: 44px; border-radius: 22px; font-size: 22px; padding: 0; flex: none; }
  .quick-stepper .primary { height: 44px; font-weight: 700; flex: none; }
  .quick-value { flex: 1; text-align: center; font-size: 20px; }
  .quick-more { padding: 10px 0; }
  .todo-later { margin: -6px 0 8px; }
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
  .tl-group-row { grid-column: 1 / -1; display: flex; align-items: center; gap: 4px; }
  .tl-group-row .tl-group { flex: 1; }
  .tl-add { flex: none; width: 36px; height: 34px; margin-top: 8px; padding: 0; font-size: 20px; font-weight: 700; border: none;
    background: var(--secondary-background-color); color: var(--homestead-accent, #3a7d44); border-radius: 6px; }
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
    this._tab = "diary";
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
    if (first) loadTexts(this._lang()).then(() => this._init());
    if (this._menu) this._menu.hass = hass;
  }

  set narrow(narrow) {
    this._narrow = narrow;
    if (this._menu) this._menu.narrow = narrow;
    this._layout?.classList.toggle("narrow", !!narrow);
    this._map?.invalidateSize();
  }

  /** "1 plant" / "3 plants": key + "One" for one, key + "Many" otherwise. */
  _plural(key, count) {
    return this.t(count === 1 ? `${key}One` : `${key}Many`, { count });
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
      h("div", { className: "body" }, this._mapWrap, this._aside),
    );
    root.append(
      h("link", { rel: "stylesheet", href: `${BASE}vendor/leaflet.css` }),
      h("style", {}, STYLE),
      this._layout,
    );
    this._calWrap = h("div", { className: "calendar" });
    // On a phone the menu sits at the bottom: hide it while typing, so the keyboard does not push it up.
    const keyboard = 'textarea, input:not([type="checkbox"]):not([type="radio"]):not([type="date"]):not([type="file"]):not([type="button"])';
    // Bring the menu back a moment later: the layout must not move under the tap that left the field (a Save button).
    let typingOff = null;
    this._aside.addEventListener("focusin", (ev) => {
      clearTimeout(typingOff);
      this._layout.classList.toggle("typing", ev.target.matches(keyboard));
    });
    this._aside.addEventListener("focusout", () => {
      clearTimeout(typingOff);
      typingOff = setTimeout(() => this._layout.classList.remove("typing"), 300);
    });
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
        this._genusTypes = result.genus_types || {};
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
        // A hidden map cannot be fitted: do it when it is first shown.
        if (first && this._layout.classList.contains("wide-tab")) this._needsFit = true;
        else if (first) this._fitAll();
        first = false;
        if (/[?&](task|zone)=/.test(window.location.search)) {
          this._openTaskFromUrl();
          if (this._eventForm) return;
        }
        if (this._form) this._refreshForm();
        else if (this._zoneForm) {
          this._refreshDiaryBox();
          const zone = this._zone(this._zoneForm.id);
          if (this._woodEl && zone) this._woodEl.replaceChildren(...[this._zoneBox(zone)].filter(Boolean));
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
      const selected = this._zoneForm?.id === z.id || this._eventForm?.zone_id === z.id || this._zoneTap?.id === z.id;
      const style = {
        color: selected ? "#ffeb3b" : ZONE_COLOR,
        weight: selected ? 4 : 2,
        fillOpacity: selected ? 0.3 : 0.12,
      };
      let polygon = this._polygons.get(z.id);
      if (!polygon) {
        polygon = L.polygon(toLatLngs(z.geometry), style).addTo(this._zoneLayer);
        polygon.on("click", (ev) => !this._placing && !this._drawing && this._tapZone(z.id, ev.latlng));
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
      if (!hasPosition(p) || (!this._showGone() && p.status !== "active" && p.id !== this._selected)) continue;
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
    this._sowForm = null;
    this._germForm = null;
    this._transplantForm = null;
    this._zoneTap = null;
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
    if (tab === "plantings" || tab === "zones") this._mapTab = tab;
    this._tab = tab;
    this._close();
    this._aside.scrollTop = 0;
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
    this._newPlantingAt(latlng);
  }

  _newPlantingAt(latlng, zoneId = this._zoneAt(latlng.lat, latlng.lng)) {
    this._clearSelection();
    this._showMessage("");
    this._tab = "plantings";
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
      water_days: values.water_days ? Number(values.water_days) : null,
      fertilize_weeks: values.fertilize_weeks ? Number(values.fertilize_weeks) : null,
      moisture_entity: values.moisture_entity || null,
      moisture_min: values.moisture_min ? Number(values.moisture_min) : null,
      notes: values.notes?.trim() || null,
    };
    if (this._form.id) {
      data.status = values.status;
      const id = this._form.id;
      if (await this._call("update_planting", { id, ...data })) this._saved(data.name);
    } else {
      if (hasPosition(this._form)) {
        data.latitude = round(this._form.latitude);
        data.longitude = round(this._form.longitude);
      }
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
    else if (this._sowForm) content = this._renderSowForm();
    else if (this._germForm) content = this._renderGermForm();
    else if (this._transplantForm) content = this._renderTransplantForm();
    else if (this._zoneTap) content = this._renderZoneTap();
    else {
      const back = h("button", { type: "button", className: "back", onclick: () => this._setTab("more") }, `‹ ${this.t("tabMore")}`);
      const lists = {
        plantings: () => [this._mapSwitch(), ...this._renderList()],
        zones: () => [this._mapSwitch(), ...this._renderZoneList()],
        diary: () => this._renderDiary(),
        calendar: () => [this._calWrap],
        seeds: () => [back, ...this._renderSeedList()],
        expenses: () => [back, ...this._renderExpenseList()],
        analysis: () => this._renderAnalysis(),
        tools: () => [back, ...this._renderToolList()],
        more: () => this._renderMore(),
      };
      content = (lists[this._tab] || lists.diary)();
    }
    // The map only where it is used: plantings and zones, and their cards.
    const wide = !(["plantings", "zones"].includes(this._tab) || this._form || this._zoneForm);
    this._calendarOn = this._tab === "calendar" && content[0] === this._calWrap;
    this._content.replaceChildren(...content.filter(Boolean));
    if (this._calendarOn) this._renderCalendar();
    if (this._layout.classList.contains("wide-tab") !== wide) {
      this._layout.classList.toggle("wide-tab", wide);
      if (!wide)
        setTimeout(() => {
          this._map.invalidateSize();
          if (this._needsFit) {
            this._needsFit = false;
            this._fitAll();
          }
        }, 0);
    }
  }

  /** Main menu section of a page. */
  _section(tab = this._tab) {
    return { plantings: "map", zones: "map", seeds: "more", expenses: "more", tools: "more" }[tab] || tab;
  }

  _mapSwitch() {
    const button = (tab, label) =>
      h("button", { type: "button", className: this._tab === tab ? "active" : "", onclick: () => this._setTab(tab) }, label);
    return h("div", { className: "segmented map-switch" }, button("plantings", `🌱 ${this.t("tabPlantings")}`), button("zones", `▦ ${this.t("tabZones")}`));
  }

  _renderMore() {
    const now = today();
    const year = now.slice(0, 4);
    const ofYear = this._data.expenses.filter((x) => x.spent_on.startsWith(year));
    const spent = ofYear.filter((x) => !x.income).reduce((sum, x) => sum + x.amount, 0);
    const earned = ofYear.filter((x) => x.income).reduce((sum, x) => sum + x.amount, 0);
    const toolsDue = this._data.tools.filter((t) => t.next_service_on && t.next_service_on <= now).length;
    const seedsLeft = this._data.seeds.filter((x) => !x.finished).length;
    const item = (tab, icon, label, sub, warn = false) =>
      h(
        "button",
        { type: "button", className: "more-item", onclick: () => this._setTab(tab) },
        h("span", { className: "more-icon" }, icon),
        h("span", { className: "more-text" }, h("strong", {}, label), h("span", { className: `sub${warn ? " warn" : ""}` }, sub)),
        "›",
      );
    return [
      h(
        "div",
        { className: "more-list" },
        item("seeds", "🌱", this.t("tabSeeds"), this.t("moreSeeds", { count: seedsLeft })),
        item("expenses", "💶", this.t("tabExpenses"), `${year}: −${this._money(spent)} · +${this._money(earned)}`),
        item("tools", "🔧", this.t("tabTools"), toolsDue ? this.t("moreToolsDue", { count: toolsDue }) : this.t("moreTools", { count: this._data.tools.length }), !!toolsDue),
        h(
          "button",
          {
            type: "button",
            className: "more-item",
            onclick: () => {
              history.pushState(null, "", "/config/integrations/integration/homestead");
              window.dispatchEvent(new CustomEvent("location-changed"));
            },
          },
          h("span", { className: "more-icon" }, "⚙️"),
          h("span", { className: "more-text" }, h("strong", {}, this.t("settingsTitle")), h("span", { className: "sub" }, this.t("settingsHint"))),
          "›",
        ),
      ),
      this._renderBackup(),
      this._hass.user?.is_admin === false ? null : this._resetBox(),
    ];
  }

  _resetBox() {
    const input = h("input", { type: "text", placeholder: "RESET", autocomplete: "off", "aria-label": this.t("resetType") });
    const button = h("button", { type: "button", className: "danger-fill", disabled: true }, this.t("resetDo"));
    input.addEventListener("input", () => (button.disabled = input.value.trim() !== "RESET"));
    button.addEventListener("click", async () => {
      if (input.value.trim() !== "RESET") return;
      try {
        const result = await this._hass.callWS({ type: "homestead/reset", confirm: "RESET" });
        this._setTab("diary");
        this._showMessage(`✓ ${this.t("resetDone", { summary: this._summary(result) })}`);
      } catch (err) {
        this._showMessage(err.message || String(err), true);
      }
    });
    return h(
      "div",
      { className: "reset-box" },
      h("h3", {}, `🗑️ ${this.t("resetTitle")}`),
      h("p", { className: "hint" }, this.t("resetHint")),
      h("label", {}, this.t("resetType"), input),
      h("div", { className: "row" }, h("button", { type: "button", onclick: () => this._exportBackup() }, `💾 ${this.t("exportBackup")}`), button),
    );
  }

  _renderTabs() {
    const section = this._section();
    const tab = (name, icon, label) =>
      h(
        "button",
        {
          className: section === name ? "active" : "",
          onclick: () => this._setTab(name === "map" ? this._mapTab || "plantings" : name),
        },
        h("span", { className: "tab-icon" }, icon),
        h("span", { className: "tab-label" }, label),
      );
    return h(
      "div",
      { style: "display:contents" },
      tab("diary", "📓", this.t("tabDiary")),
      tab("calendar", "📅", this.t("tabCalendar")),
      tab("map", "🗺️", this.t("tabMap")),
      tab("analysis", "📈", this.t("tabAnalysis")),
      tab("more", "⋯", this.t("tabMore")),
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

  /** Dead and removed plantings stay in the history, hidden from the map and the list unless asked. */
  _showGone() {
    if (this._showGoneValue === undefined) {
      try {
        this._showGoneValue = localStorage.getItem("homestead-show-gone") === "1";
      } catch {
        this._showGoneValue = false;
      }
    }
    return this._showGoneValue;
  }

  _setShowGone(on) {
    this._showGoneValue = on;
    try {
      localStorage.setItem("homestead-show-gone", on ? "1" : "");
    } catch {
      // private mode: the choice is just not remembered
    }
    this._syncMap();
    this._render();
  }

  /** Plantings without a type whose species tells it: proposed all at once. */
  _typesBox() {
    const missing = this._data.plantings
      .filter((p) => !p.plant_type)
      .map((p) => ({ planting: p, type: this._plantTypeFor(p.species) }))
      .filter((m) => m.type);
    if (!missing.length) return null;
    if (!this._typesOpen)
      return h(
        "button",
        { type: "button", className: "repeat-card", onclick: () => ((this._typesOpen = true), this._render()) },
        h("strong", {}, `🏷️ ${this.t("typesTitle")}`),
        h("span", { className: "sub" }, this._plural("typesHint", missing.length)),
      );
    const off = new Set();
    const button = h("button", { type: "button", className: "primary" }, this.t("typesApply"));
    button.addEventListener("click", async () => {
      button.disabled = true;
      let done = 0;
      for (const m of missing.filter((m) => !off.has(m.planting.id))) {
        if (await this._call("update_planting", { id: m.planting.id, plant_type: m.type })) done++;
      }
      this._typesOpen = false;
      this._render();
      this._showMessage(`✓ ${this._plural("typesDone", done)}`);
    });
    return h(
      "div",
      { className: "repeat-box" },
      h("div", { className: "cal-head" }, h("h3", {}, `🏷️ ${this.t("typesTitle")}`), h("button", { type: "button", onclick: () => ((this._typesOpen = false), this._render()) }, "✕")),
      missing.map((m) => {
        const box = h("input", { type: "checkbox", checked: true });
        box.addEventListener("change", () => (box.checked ? off.delete(m.planting.id) : off.add(m.planting.id)));
        return h(
          "label",
          { className: "repeat-row" },
          box,
          h("span", { className: "repeat-name" }, h("strong", {}, m.planting.name), h("span", { className: "sub" }, m.planting.species || "")),
          h("span", {}, `${PLANT_ICONS[m.type]} ${this.t(`pt_${m.type}`)}`),
        );
      }),
      button,
    );
  }

  _renderList() {
    const gone = this._data.plantings.filter((p) => p.status !== "active");
    const plantings = [...this._data.plantings]
      .filter((p) => this._showGone() || p.status === "active" || p.id === this._selected)
      .sort((a, b) => a.name.localeCompare(b.name));
    return [
      h(
        "div",
        { className: "actions" },
        h("button", { className: "primary", onclick: () => this._startPlacing(null) }, `+ ${this.t("add")}`),
        h("button", { onclick: () => this._csvPick("plantings") }, this.t("csvImport")),
        h("button", { onclick: () => this._csvTemplate("plantings") }, this.t("csvTemplate")),
      ),
      this._repeatBox(),
      this._typesBox(),
      gone.length
        ? h(
            "label",
            { className: "show-gone" },
            h("input", { type: "checkbox", checked: this._showGone(), onchange: (ev) => this._setShowGone(ev.target.checked) }),
            this.t("showGone", { count: gone.length }),
          )
        : null,
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
                  // Houseplants live in a room: no point on the map to ask for.
                  onclick: () => (hasPosition(p) || this._isIndoor(p) ? this._select(p.id) : this._startPlacing(p.id)),
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
                  hasPosition(p) || this._isIndoor(p) ? null : h("div", { className: "sub warn" }, `📍 ${this.t("noPosition")}`),
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
    let careEl = null;
    const showCare = (el) => {
      if (!careEl) return;
      careEl.hidden = this._zoneFamily({ zone_id: el.zone_id.value }) !== "indoor";
    };
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
        onchange: (ev) => {
          const el = ev.currentTarget.elements;
          if (ev.target.name === "plant_type") el.plant_type.dataset.chosen = "1";
          // New planting: the species beats the zone's guess; an existing one keeps its type.
          if (ev.target.name === "species" && !el.plant_type.dataset.chosen && (!f.id || !el.plant_type.value)) {
            const guess = this._plantTypeFor(el.species.value);
            if (guess) el.plant_type.value = guess;
          }
          updateRotation(ev.currentTarget);
          showCare(el);
        },
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
        (careEl = this._careFields(f)),
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
    showCare(form.elements);
    return [
      form,
      f.id ? this._plantingActions(f) : null,
      f.id ? this._plantingExpenses(f) : null,
      f.id ? (this._cropEl = h("div", {}, this._cropBox(f))) : null,
      f.id ? this._careNotes(f) : null,
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

  _hensText(count) {
    return count === 1 ? this.t("henOne") : this.t("hensNow", { count });
  }

  /** Quantity of a diary entry: eggs and hens are counted, not weighed. */
  _eventQuantity(e) {
    if (e.kind === "eggs") return `${new Intl.NumberFormat(this._lang()).format(e.quantity)} 🥚`;
    if (e.kind === "flock_in" || e.kind === "flock_out") return this._hensText(e.quantity);
    return this._quantity(e.quantity, e.unit);
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
        this._balanceTable(this.t(year ? "monthly" : "yearByYear"), expenses, (e) => (year ? e.spent_on.slice(0, 7) : e.spent_on.slice(0, 4)), (key) =>
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
    if (planting.germinated_on) out.push({ ...virtual("germinated", planting.germinated_on, null), planting });
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
    if (e.kind === "germinated") return this._germText(e.planting);
    if (e.kind === "removal" && e.reason)
      return `${this.t(`end_${e.reason}`)}${e.cause ? ` · ${DEATH_CAUSES[e.cause] || ""} ${this.t(`cause_${e.cause}`)}` : ""}`;
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
                    e.quantity ? this._eventQuantity(e) : null,
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
    const events = this._eventsFor(this._diaryTarget).filter((e) => e.kind !== "eggs");
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

  /** "woodland", "compost" or "coop" when the target is (in) such a zone, else null. */
  _zoneFamily(target) {
    const planting = target.planting_id && this._planting(target.planting_id);
    for (let z = this._zone(target.zone_id || planting?.zone_id), guard = 0; z && guard < 20; z = this._zone(z.parent_id), guard++) {
      if (["woodland", "compost", "coop", "nursery", "indoor"].includes(z.kind)) return z.kind;
    }
    return null;
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
    return last?.unit || { it: "q", es: "q", fr: "stere", de: "stere" }[this._lang()] || "m3";
  }

  /** The extra box of a zone card, by zone kind. */
  _zoneBox(zone) {
    if (zone.kind === "compost") return this._compostBox(zone);
    if (zone.kind === "coop") return this._coopBox(zone);
    return this._woodBox(zone);
  }

  /** Compost bins not turned for COMPOST_TURN_DAYS days (since the last turn or harvest), unless a turn is planned. */
  _compostDue() {
    const now = today();
    const planned = new Set(this._data.tasks.filter((t) => !t.done_on && t.kind === "compost_turn").map((t) => t.zone_id));
    return this._data.zones
      .filter((z) => z.kind === "compost" && !planned.has(z.id))
      .map((zone) => {
        const last = this._data.events
          .filter((e) => e.zone_id === zone.id && COMPOST_KINDS.includes(e.kind))
          .reduce((max, e) => (e.done_on > max ? e.done_on : max), "");
        return { zone, days: last ? daysBetween(last, now) : null };
      })
      .filter(({ days }) => days != null && days >= COMPOST_TURN_DAYS);
  }

  _compostBoxes() {
    const due = this._compostDue();
    if (!due.length) return null;
    return h(
      "div",
      { className: "todo" },
      h("h3", {}, this.t("compostTodo")),
      due.map(({ zone, days }) =>
        h(
          "div",
          { className: "task" },
          h("button", { type: "button", className: "tick", title: this.t("done"), onclick: () => this._openEvent({ kind: "compost_turn", done_on: today(), zone_id: zone.id }) }, "✔"),
          h(
            "button",
            { type: "button", className: "task-main", onclick: () => this._selectZone(zone.id) },
            h("span", {}, `♻️ ${this.t("ev_compost_turn")} — ${zone.name}`),
            h("span", { className: "sub" }, this.t("compostDays", { days })),
          ),
        ),
      ),
    );
  }

  _compostBox(zone) {
    const events = this._data.events
      .filter((e) => e.zone_id === zone.id && COMPOST_KINDS.includes(e.kind))
      .sort((a, b) => b.done_on.localeCompare(a.done_on));
    const turn = events.find((e) => e.kind === "compost_turn");
    const harvests = events.filter((e) => e.kind === "compost_harvest");
    const rated = harvests.filter((e) => e.rating);
    const avg = rated.length ? rated.reduce((sum, e) => sum + e.rating, 0) / rated.length : null;
    const due = this._compostDue().find((d) => d.zone.id === zone.id);
    const back = { zone_id: zone.id };
    const open = (kind) => this._openEvent({ kind, done_on: today(), zone_id: zone.id }, back);
    return h(
      "div",
      { className: "seasons" },
      h("h3", {}, this.t("compostBox")),
      h("div", { className: "sub" }, turn ? this.t("compostTurned", { date: this._date(turn.done_on), days: daysBetween(turn.done_on, today()) }) : this.t("compostNever")),
      harvests[0]
        ? h("div", { className: "sub" }, `${this.t("compostHarvested", { date: this._date(harvests[0].done_on) })}${harvests[0].rating ? ` · ${"★".repeat(harvests[0].rating)}` : ""}`)
        : null,
      avg != null ? h("div", { className: "sub" }, this.t("compostQuality", { avg: avg.toFixed(1).replace(".", ","), count: rated.length })) : null,
      due ? h("div", { className: "alert-line" }, this.t("compostDue", { days: due.days })) : null,
      h(
        "div",
        { className: "row" },
        h("button", { type: "button", onclick: () => open("compost_turn") }, this.t("compostTurn")),
        h("button", { type: "button", onclick: () => open("compost_harvest") }, this.t("compostHarvest")),
      ),
    );
  }

  /** Arrivals (+) and departures (−) of hens in the given zones, by date. */
  _flockMoves(zones) {
    return this._data.events
      .filter((e) => zones.has(e.zone_id) && e.quantity && (e.kind === "flock_in" || e.kind === "flock_out"))
      .map((e) => [e.done_on, e.kind === "flock_in" ? e.quantity : -e.quantity])
      .sort((a, b) => a[0].localeCompare(b[0]));
  }

  /** Hens in the given zones on a day: arrivals minus departures up to that day. */
  _hensAt(zones, day) {
    return Math.max(this._flockMoves(zones).reduce((n, [date, change]) => (date <= day ? n + change : n), 0), 0);
  }

  /** Eggs, average hens, eggs per hen and cost per egg between two days (included). */
  _eggStats(zones, from, to) {
    const events = this._data.events.filter((e) => zones.has(e.zone_id) && e.done_on >= from && e.done_on <= to);
    const eggs = events.filter((e) => e.kind === "eggs").reduce((n, e) => n + (e.quantity || 0), 0);
    const moves = this._flockMoves(zones);
    let henDays = 0;
    let days = 0;
    let count = 0;
    let next = 0;
    for (let day = from; day <= to; day = addDays(day, 1)) {
      while (next < moves.length && moves[next][0] <= day) count += moves[next++][1];
      henDays += Math.max(count, 0);
      days++;
    }
    const hens = days ? henDays / days : 0;
    const ids = new Set(events.map((e) => e.id));
    const spent = this._data.expenses.filter((x) => !x.income && ids.has(x.event_id)).reduce((sum, x) => sum + x.amount, 0);
    return { eggs, hens, perHen: hens ? eggs / hens : null, costPerEgg: spent && eggs ? spent / eggs : null };
  }

  _coopBox(zone) {
    const zones = new Set([zone.id, ...this._zoneDescendants(zone.id)]);
    const now = today();
    const back = { zone_id: zone.id };
    const open = (kind, extra = {}) => this._openEvent({ kind, done_on: now, zone_id: zone.id, ...extra }, back);
    const sum = (from) =>
      this._data.events.filter((e) => zones.has(e.zone_id) && e.kind === "eggs" && e.done_on >= from && e.done_on <= now).reduce((n, e) => n + (e.quantity || 0), 0);
    const year = this._eggStats(zones, `${now.slice(0, 4)}-01-01`, now);
    const number = (value, digits = 0) => new Intl.NumberFormat(this._lang(), { maximumFractionDigits: digits }).format(value);
    const dateInput = h("input", { type: "date", value: now, max: now, required: true });
    const countInput = h("input", { type: "number", min: 1, step: 1, required: true, inputMode: "numeric", placeholder: "🥚", style: "width:5em" });
    const quick = h(
      "form",
      {
        className: "row quick-eggs",
        onsubmit: async (ev) => {
          ev.preventDefault();
          const count = Number(countInput.value);
          if (!count || !dateInput.value) return;
          const result = await this._call("add_event", { kind: "eggs", zone_id: zone.id, done_on: dateInput.value, quantity: count });
          if (result) this._showMessage(this.t("eggsSaved", { count }));
        },
      },
      dateInput,
      countInput,
      h("button", { type: "submit", className: "primary" }, this.t("eggsAdd")),
    );
    const stat = (label, value) => h("div", { className: "coop-stat" }, h("strong", {}, value), h("span", { className: "sub" }, label));
    const recent = this._data.events
      .filter((e) => zones.has(e.zone_id) && e.kind === "eggs")
      .sort((a, b) => b.done_on.localeCompare(a.done_on))
      .slice(0, 7);
    const flock = this._data.events
      .filter((e) => zones.has(e.zone_id) && (e.kind === "flock_in" || e.kind === "flock_out"))
      .sort((a, b) => b.done_on.localeCompare(a.done_on));
    return h(
      "div",
      { className: "seasons coop" },
      h("div", { className: "cal-head" }, h("h3", {}, this.t("coopBox")), h("strong", {}, this._hensText(this._hensAt(zones, now)))),
      quick,
      h(
        "div",
        { className: "coop-stats" },
        stat(this.t("eggsWeek"), number(sum(addDays(now, -6)))),
        stat(this.t("eggsMonth"), number(sum(`${now.slice(0, 7)}-01`))),
        stat(this.t("eggsYear"), number(year.eggs)),
        stat(this.t("eggsPerHen"), year.perHen != null ? number(year.perHen, 1) : "—"),
        stat(this.t("eggsCost"), year.costPerEgg != null ? this._money(year.costPerEgg) : "—"),
      ),
      recent.length
        ? h(
            "div",
            { className: "sub coop-recent" },
            `${this.t("eggsRecent")}: `,
            recent.map((e) => h("button", { type: "button", className: "link", onclick: () => this._openEvent(e, back) }, `${this._date(e.done_on, false)} ${number(e.quantity || 0)}`)),
          )
        : null,
      h(
        "div",
        { className: "row" },
        h("button", { type: "button", onclick: () => open("flock_in") }, this.t("flockIn")),
        h("button", { type: "button", onclick: () => open("flock_out", { reason: "predator" }) }, this.t("flockOut")),
        h("button", { type: "button", onclick: () => open("animal_care") }, this.t("animalCare")),
      ),
      flock.length
        ? h(
            "div",
            { className: "coop-flock" },
            h("strong", {}, this.t("flockLog")),
            flock.map((e) =>
              h(
                "button",
                { type: "button", className: "link", onclick: () => this._openEvent(e, back) },
                `${this._date(e.done_on)} · ${e.kind === "flock_in" ? `🐔 +${number(e.quantity || 0)}${e.product ? ` ${e.product}` : ""}` : `${LEAVE_ICONS[e.reason] || "🦊"} −${number(e.quantity || 0)}${e.reason ? ` ${this.t(`lr_${e.reason}`)}` : ""}`}`,
              ),
            ),
          )
        : null,
    );
  }

  /** Analysis: eggs per year for all hen houses. */
  _eggsBox(years) {
    const zones = new Set(this._data.zones.filter((z) => z.kind === "coop").flatMap((z) => [z.id, ...this._zoneDescendants(z.id)]));
    if (!zones.size || !this._data.events.some((e) => e.kind === "eggs" && zones.has(e.zone_id))) return null;
    const now = today();
    const number = (value, digits = 0) => new Intl.NumberFormat(this._lang(), { maximumFractionDigits: digits }).format(value);
    const rows = years.map((year) => ({ year, ...this._eggStats(zones, `${year}-01-01`, year === now.slice(0, 4) ? now : `${year}-12-31`) }));
    return h(
      "div",
      { className: "an-box" },
      h("h3", {}, this.t("anEggs")),
      h(
        "div",
        { className: "an-table", style: `grid-template-columns: minmax(110px, 1.4fr) repeat(${years.length}, minmax(52px, 1fr))` },
        h("div"),
        years.map((y) => h("div", { className: "an-th" }, y)),
        h("div", { className: "an-name" }, `🥚 ${this.t("ev_eggs")}`),
        rows.map((r) => h("div", { className: "an-cell" }, r.eggs ? number(r.eggs) : "—")),
        h("div", { className: "an-name" }, `🐔 ${this.t("anHens")}`),
        rows.map((r) => h("div", { className: "an-cell" }, r.hens ? number(r.hens, 1) : "—")),
        h("div", { className: "an-name" }, this.t("anPerHen")),
        rows.map((r) => h("div", { className: "an-cell" }, r.perHen != null && r.eggs ? number(r.perHen) : "—")),
        h("div", { className: "an-name" }, this.t("anEggCost")),
        rows.map((r) => h("div", { className: "an-cell" }, r.costPerEgg != null ? this._money(r.costPerEgg) : "—")),
      ),
    );
  }

  /** Per year: firewood, branches and foraging of a zone and its sub-zones, by unit. */
  _woodBox(zone) {
    const box = this._woodHarvestBox(zone);
    if (!box) return null;
    const burn = h("button", { type: "button", onclick: () => this._openEvent({ kind: "wood_burned", done_on: today(), zone_id: zone.id, unit: this._woodUnit() }, { zone_id: zone.id }) }, `🔥 ${this.t("woodBurnNow")}`);
    return h("div", {}, this._woodStockBox(), box, zone.kind === "woodland" ? burn : null);
  }

  _woodHarvestBox(zone) {
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
      if (y >= year || e.kind === "review" || e.kind === "eggs") return false;
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
      if (!f.kind && e.kind === "eggs") return false; // every day: shown in the hen house card
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
            this._diaryLimit = 0;
            this._render();
          },
        },
        options.map(([v, text]) => h("option", { value: v, selected: v === f[name] }, text)),
      );
    const week = addDays(today(), 7);
    const soon = this._data.tasks.filter((t) => !t.done_on && t.due_on <= week);
    const later = this._data.tasks.filter((t) => !t.done_on && t.due_on > week).length;
    return [
      this._weatherStrip(),
      this._alertsBox(),
      this._todoBox(soon, null, h("button", { type: "button", onclick: () => this._openTask({ kind: "note", due_on: today() }) }, this.t("addTask"))),
      later ? h("button", { type: "button", className: "link todo-later", onclick: () => this._setTab("calendar") }, this.t("todoLater", { count: later })) : null,
      this._nurseryBox(),
      this._houseplantsBox(),
      this._compostBoxes(),
      this._woodReminder(),
      this._quickButtons(),
      this._quickPlants(),
      this._monthBox(),
      this._lastYearsBox(this._data.events),
      h(
        "div",
        { className: "row filters" },
        filter("kind", [["", this.t("allKinds")], ...Object.keys(EVENT_ICONS).map((k) => [k, `${EVENT_ICONS[k]} ${this.t(`ev_${k}`)}`])]),
        filter("zone", [["", this.t("allZones")], ...this._zoneOptions().slice(1)]),
        filter("year", [["", this.t("allYears")], ...years.map((y) => [y, y])]),
      ),
      events.length ? this._renderTimeline(this._diaryPage(events)) : h("p", { className: "hint" }, this.t("emptyDiary")),
      events.length > (this._diaryLimit || DIARY_PAGE)
        ? h(
            "button",
            { type: "button", className: "link quick-more", onclick: () => ((this._diaryLimit = (this._diaryLimit || DIARY_PAGE) + DIARY_PAGE), this._render()) },
            this.t("diaryMore", { count: events.length - (this._diaryLimit || DIARY_PAGE) }),
          )
        : null,
    ];
  }

  /** The most recent entries only: years of diary would make every save slow to draw. */
  _diaryPage(events) {
    return [...events].sort((a, b) => b.done_on.localeCompare(a.done_on)).slice(0, this._diaryLimit || DIARY_PAGE);
  }

  // ----- daily use: one tap to log the usual things -----

  _quickButtons() {
    const coops = this._data.zones.filter((z) => z.kind === "coop");
    const open = (kind, extra = {}) => this._openEvent({ kind, done_on: today(), ...extra });
    const button = (icon, label, onclick) => h("button", { type: "button", className: "quick-button", onclick }, h("span", {}, icon), label);
    return h(
      "div",
      { className: "quick-buttons" },
      button("🍅", this.t("ev_harvest"), () => open("harvest")),
      coops.length ? button("🥚", this.t("ev_eggs"), () => open("eggs", coops.length === 1 ? { zone_id: coops[0].id } : {})) : null,
      button("💧", this.t("ev_watering"), () => open("watering")),
      button("📝", this.t("ev_note"), () => open("note")),
      button("＋", this.t("quickOther"), () => this._newEvent()),
    );
  }

  /** "today", "yesterday", "3 days ago", or the date. */
  _ago(iso) {
    const days = daysBetween(iso, today());
    if (days === 0) return this.t("agoToday");
    if (days === 1) return this.t("agoYesterday");
    if (days > 1 && days < 7) return this.t("agoDays", { count: days });
    return this._date(iso, iso.slice(0, 4) !== today().slice(0, 4));
  }

  _quickPlants() {
    const search = h("input", {
      type: "search",
      placeholder: this.t("quickSearch"),
      value: this._quickQuery || "",
      oninput: (ev) => {
        this._quickQuery = ev.target.value;
        this._fillQuick();
      },
    });
    this._quickEl = h("div", { className: "quick-list" });
    this._fillQuick();
    return h("div", { className: "quick-box" }, h("label", { className: "search" }, "🔎", search), this._quickEl);
  }

  /** Active plantings and hen houses: the ones in harvest first, then the most recently updated. */
  _quickRows() {
    const now = today();
    const month = Number(now.slice(5, 7));
    const last = new Map();
    const lastHarvest = new Map();
    for (const e of this._data.events) {
      const key = e.planting_id ? `p:${e.planting_id}` : e.zone_id ? `z:${e.zone_id}` : null;
      if (!key) continue;
      if (!last.has(key) || e.done_on > last.get(key).done_on) last.set(key, e);
      if ((e.kind === "harvest" || e.kind === "eggs") && e.quantity && (!lastHarvest.has(key) || e.done_on > lastHarvest.get(key).done_on)) lastHarvest.set(key, e);
    }
    const rows = this._data.plantings
      .filter((p) => p.status === "active" && !this._inNursery(p) && !this._isIndoor(p))
      .map((p) => {
        const key = `p:${p.id}`;
        const harvest = lastHarvest.get(key);
        const crop = this._crop(p.species);
        return {
          key,
          planting: p,
          icon: PLANT_ICONS[p.plant_type] || "🌱",
          name: `${p.name}${p.kind === "group" && p.quantity > 1 ? ` (${p.quantity})` : ""}`,
          where: p.zone_id ? this._zone(p.zone_id)?.name : "",
          search: [p.name, p.species, p.variety, p.zone_id && this._zone(p.zone_id)?.name].filter(Boolean).join(" ").toLowerCase(),
          last: last.get(key),
          harvest,
          now: !!(crop?.harvest?.includes(month) || (harvest && daysBetween(harvest.done_on, now) <= 30)),
          harvests: !!(harvest || crop?.harvest?.length),
        };
      });
    for (const zone of this._data.zones.filter((z) => z.kind === "coop")) {
      const key = `z:${zone.id}`;
      const zones = new Set([zone.id, ...this._zoneDescendants(zone.id)]);
      rows.push({
        key,
        zone,
        coop: true,
        icon: "🐔",
        name: zone.name,
        where: this._hensText(this._hensAt(zones, now)),
        search: zone.name.toLowerCase(),
        last: last.get(key),
        harvest: lastHarvest.get(key),
        now: true,
        harvests: true,
      });
    }
    const recent = (a, b) => (b.last?.done_on || "").localeCompare(a.last?.done_on || "") || a.name.localeCompare(b.name);
    return rows.sort(recent);
  }

  _fillQuick() {
    if (!this._quickEl) return;
    const query = (this._quickQuery || "").trim().toLowerCase();
    const rows = this._quickRows();
    const sections = [];
    if (query) sections.push([this.t("quickFound"), rows.filter((r) => r.search.includes(query))]);
    else {
      const others = rows.filter((r) => !r.now);
      sections.push([this.t("quickNow"), rows.filter((r) => r.now)]);
      sections.push([this.t("quickRecent"), this._quickAll ? others : others.slice(0, 8), others.length > 8 && !this._quickAll]);
    }
    this._quickEl.replaceChildren(
      ...sections
        .filter(([, list]) => list.length)
        .flatMap(([title, list, more]) => [
          h("div", { className: "quick-title" }, title),
          ...list.map((row) => this._quickRow(row)),
          more
            ? h("button", { type: "button", className: "link quick-more", onclick: () => ((this._quickAll = true), this._fillQuick()) }, this.t("quickAll", { count: rows.length }))
            : null,
        ])
        .filter(Boolean),
    );
    if (!this._quickEl.children.length) this._quickEl.append(h("p", { className: "hint" }, query ? this.t("quickNone") : this.t("empty")));
  }

  _quickRow(row) {
    const open = this._quickOpen === row.key;
    const lastText = row.last ? `${this._ago(row.last.done_on)} ${EVENT_ICONS[row.last.kind] || ""}${row.last.quantity ? ` ${this._eventQuantity(row.last)}` : ""}` : "";
    const select = () => (row.coop ? this._selectZone(row.zone.id) : this._select(row.planting.id));
    const action = row.coop ? this.t("eggsAdd") : row.harvests ? `+ ${this.t("ev_harvest")}` : `+ ${this.t("quickEvent")}`;
    const onAction = () => {
      if (!row.harvests) return this._newEvent({ planting_id: row.planting.id }, { planting_id: row.planting.id });
      this._quickOpen = open ? null : row.key;
      this._quickValue = row.harvest?.quantity ?? (row.coop ? 1 : 1);
      this._fillQuick();
    };
    return h(
      "div",
      { className: `quick-row${open ? " open" : ""}` },
      h(
        "div",
        { className: "quick-line" },
        h("span", { className: "quick-icon" }, row.icon),
        h(
          "button",
          { type: "button", className: "quick-name", onclick: select },
          h("strong", {}, row.name),
          h("span", { className: "sub" }, [row.where, lastText].filter(Boolean).join(" · ")),
        ),
        this._quickSaved?.[row.key] ? h("span", { className: "quick-saved" }, `✓ ${this._quickSaved[row.key]}`) : null,
        h("button", { type: "button", className: `quick-action${open ? "" : " primary"}`, onclick: onAction }, open ? this.t("close") : action),
      ),
      open ? this._quickStepper(row) : null,
    );
  }

  _quickStepper(row) {
    const unit = row.coop ? "eggs" : row.harvest?.unit || "kg";
    const counted = unit === "eggs" || unit === "pieces";
    const step = (value) => (counted ? 1 : value < 2 ? 0.1 : value < 20 ? 0.5 : 1);
    const label = h("strong", { className: "quick-value" });
    const show = () => {
      const number = new Intl.NumberFormat(this._lang(), { maximumFractionDigits: 1 }).format(this._quickValue);
      label.textContent = unit === "eggs" ? `${number} 🥚` : `${number} ${this.t(`u_${unit}`)}`;
    };
    const change = (sign) => {
      const value = this._quickValue + sign * step(sign < 0 ? this._quickValue - 1e-9 : this._quickValue);
      this._quickValue = Math.max(counted ? 1 : 0.1, Math.round(value * 10) / 10);
      show();
    };
    show();
    const save = async () => {
      const quantity = this._quickValue;
      const data = row.coop
        ? { kind: "eggs", zone_id: row.zone.id, quantity, done_on: today() }
        : { kind: "harvest", planting_id: row.planting.id, quantity, unit, done_on: today() };
      const result = await this._call("add_event", data);
      if (!result) return;
      this._quickOpen = null;
      this._quickSaved = { ...(this._quickSaved || {}), [row.key]: label.textContent };
      this._fillQuick();
    };
    return h(
      "div",
      { className: "quick-stepper" },
      h("button", { type: "button", "aria-label": "−", onclick: () => change(-1) }, "−"),
      label,
      h("button", { type: "button", "aria-label": "+", onclick: () => change(1) }, "+"),
      h("button", { type: "button", className: "primary", onclick: save }, `✔ ${this.t("save")}`),
    );
  }

  /** Last year's annual crops that have no copy for the coming season yet. */
  _repeatCandidates() {
    const now = new Date();
    const target = now.getMonth() >= 8 ? now.getFullYear() + 1 : now.getFullYear();
    const annual = (p) => {
      // Herbs and flowers can be perennial: only the ones whose season ended.
      if (p.plant_type) return p.plant_type === "vegetable" || (["herb", "flower"].includes(p.plant_type) && p.status !== "active");
      return ["vegetable_garden", "greenhouse", "pots"].includes(this._zone(p.zone_id)?.kind);
    };
    const sameCrop = (a, b) => (a.taxon_id && a.taxon_id === b.taxon_id) || this._cropKey(a.species) === this._cropKey(b.species);
    const list = this._data.plantings
      .filter((p) => annual(p) && p.status !== "dead" && this._plantingYear(p) === target - 1)
      .filter((p) => !this._data.plantings.some((o) => o !== p && o.zone_id === p.zone_id && sameCrop(o, p) && (this._plantingYear(o) === target || o.name.includes(String(target)))))
      .map((p) => {
        const review = this._data.events.find((e) => e.kind === "review" && e.planting_id === p.id);
        return { planting: p, rating: review?.rating, avoid: review?.avoid };
      })
      .sort((a, b) => a.planting.name.localeCompare(b.planting.name));
    return { target, list };
  }

  _repeatBox() {
    const { target, list } = this._repeatCandidates();
    if (!list.length) return null;
    if (!this._repeatOpen)
      return h(
        "button",
        { type: "button", className: "repeat-card", onclick: () => ((this._repeatOpen = true), this._render()) },
        h("strong", {}, `🔁 ${this.t("repeatTitle")}`),
        h("span", { className: "sub" }, this.t("repeatHint", { count: list.length, from: target - 1, to: target })),
      );
    this._repeatOff ||= new Set(list.filter((c) => c.avoid || (c.rating && c.rating <= 2)).map((c) => c.planting.id));
    const button = h("button", { type: "button", className: "primary" });
    const count = () => (button.textContent = this._plural("repeatCreate", list.length - list.filter((c) => this._repeatOff.has(c.planting.id)).length));
    count();
    button.addEventListener("click", async () => {
      button.disabled = true;
      let made = 0;
      for (const c of list.filter((c) => !this._repeatOff.has(c.planting.id))) {
        if (await this._call("repeat_planting", { id: c.planting.id, year: target })) made++;
      }
      this._repeatOpen = false;
      this._repeatOff = null;
      this._render();
      this._showMessage(`✓ ${this.t("repeatDone", { count: made, year: target })}`);
    });
    return h(
      "div",
      { className: "repeat-box" },
      h("div", { className: "cal-head" }, h("h3", {}, `🔁 ${this.t("repeatTitle")} ${target - 1} → ${target}`), h("button", { type: "button", onclick: () => ((this._repeatOpen = false), this._render()) }, "✕")),
      h("p", { className: "hint" }, this.t("repeatNote")),
      list.map((c) => {
        const box = h("input", { type: "checkbox", checked: !this._repeatOff.has(c.planting.id) });
        box.addEventListener("change", () => {
          if (box.checked) this._repeatOff.delete(c.planting.id);
          else this._repeatOff.add(c.planting.id);
          count();
        });
        const zone = c.planting.zone_id && this._zone(c.planting.zone_id)?.name;
        return h(
          "label",
          { className: "repeat-row" },
          box,
          h("span", { className: "repeat-name" }, h("strong", {}, c.planting.name), h("span", { className: "sub" }, [c.planting.variety, zone].filter(Boolean).join(" · "))),
          h("span", { className: "sub" }, [c.rating ? `⭐ ${c.rating}` : null, c.avoid ? `❌ ${c.avoid}` : null].filter(Boolean).join(" ")),
        );
      }),
      button,
    );
  }

  // ----- seed → nursery → garden -----

  _inNursery(planting) {
    return this._zoneFamily({ planting_id: planting.id }) === "nursery";
  }

  _nurseryZones() {
    return this._data.zones.filter((z) => this._zoneFamily({ zone_id: z.id }) === "nursery");
  }

  /** Past sowings of the same crop: days to come up and share of seeds that did. */
  _germStats(species, except = null) {
    const key = this._cropKey(species);
    return this._data.plantings
      // A part planted out keeps the dates of its batch: count the batch once.
      .filter((p) => p.id !== except && !p.from_planting_id && p.sown_on && p.germinated_on && this._cropKey(p.species) === key)
      .map((p) => {
        const lot = p.seed_lot_id && this._data.seeds.find((x) => x.id === p.seed_lot_id);
        return {
          planting: p,
          year: p.sown_on.slice(0, 4),
          days: daysBetween(p.sown_on, p.germinated_on),
          rate: p.sown_count && p.germinated_count != null ? Math.round((p.germinated_count / p.sown_count) * 100) : null,
          lotAge: lot?.year ? Number(p.sown_on.slice(0, 4)) - lot.year + 1 : null,
        };
      })
      .filter((x) => x.days >= 0)
      .sort((a, b) => a.planting.sown_on.localeCompare(b.planting.sown_on));
  }

  _germRange(stats) {
    if (!stats.length) return null;
    const days = stats.map((x) => x.days);
    const rates = stats.map((x) => x.rate).filter((r) => r != null);
    return { min: Math.min(...days), max: Math.max(...days), rate: rates.length ? Math.round(rates.reduce((a, b) => a + b, 0) / rates.length) : null };
  }

  _germHistoryText(species, except = null) {
    const stats = this._germStats(species, except);
    if (!stats.length) return "";
    const last = stats.at(-1);
    if (stats.length === 1) return this.t("sowHistoryOne", { days: last.days, rate: last.rate ?? "?" });
    const range = this._germRange(stats);
    return this.t("sowHistory", { min: range.min, max: range.max, rate: range.rate ?? "?" });
  }

  _germText(planting) {
    if (!planting) return this.t("ev_germinated");
    const rate = planting.sown_count && planting.germinated_count != null ? ` / ${planting.sown_count} (${Math.round((planting.germinated_count / planting.sown_count) * 100)}%)` : "";
    const days = planting.sown_on && planting.germinated_on ? ` · ${this.t("daysShort", { count: daysBetween(planting.sown_on, planting.germinated_on) })}` : "";
    return this.t("germText", { count: planting.germinated_count ?? "", rate, days });
  }

  /** Number input with − and + buttons. */
  _stepper(name, value, min = 1, max = 9999, onchange = () => {}) {
    const input = h("input", { name, type: "number", min, max, step: 1, value, inputMode: "numeric", oninput: () => onchange(Number(input.value)) });
    const move = (delta) => {
      input.value = Math.min(max, Math.max(min, Number(input.value || 0) + delta));
      onchange(Number(input.value));
    };
    return h(
      "div",
      { className: "stepper" },
      h("button", { type: "button", "aria-label": "−", onclick: () => move(-1) }, "−"),
      input,
      h("button", { type: "button", "aria-label": "+", onclick: () => move(1) }, "+"),
    );
  }

  _openSow(preset = {}) {
    const nursery = this._nurseryZones()[0];
    this._clearSelection();
    this._showMessage("");
    this._sowForm = { count: 24, zone_id: nursery?.id || "", sown_on: today(), ...preset };
    this._render();
  }

  _renderSowForm() {
    const f = this._sowForm;
    const lots = this._data.seeds.filter((x) => !x.finished || x.id === f.seed_lot_id);
    const lotSelect = h(
      "select",
      { name: "seed_lot_id" },
      h("option", { value: "" }, this.t("sowNoLot")),
      lots.map((lot) => h("option", { value: lot.id, selected: lot.id === f.seed_lot_id }, `${this._seedName(lot)}${lot.year ? ` · ${lot.year}` : ""}`)),
    );
    const species = h("input", { name: "species", value: f.species || "", placeholder: "Solanum lycopersicum" });
    const speciesLabel = h("label", {}, this.t("species"), species);
    const expect = h("div", { className: "expect" });
    const update = () => {
      const lot = lots.find((x) => x.id === lotSelect.value);
      speciesLabel.hidden = !!lot;
      const name = lot ? lot.species : species.value;
      const lines = [];
      const history = this._germHistoryText(name);
      if (history) lines.push(history);
      if (lot?.year) {
        const age = new Date().getFullYear() - lot.year + 1;
        const life = lot.viability_years || SEED_VIABILITY[this._taxon(lot.taxon_id)?.family || this._crop(lot.species)?.family] || 3;
        lines.push(this.t("sowLotAge", { year: lot.year, age, life, old: age > life ? this.t("sowLotOld") : "" }));
      }
      expect.replaceChildren(h("strong", {}, this.t("sowExpect")), ...lines.map((line) => h("span", {}, line)));
      expect.hidden = !lines.length;
    };
    lotSelect.addEventListener("change", update);
    species.addEventListener("change", update);
    update();
    const zones = [...this._data.zones].sort((a, b) => (b.kind === "nursery") - (a.kind === "nursery") || a.name.localeCompare(b.name));
    return [
      h(
        "form",
        { onsubmit: (ev) => this._saveSow(ev) },
        h("h2", {}, this.t("sowTitle")),
        h("label", {}, this.t("sowLot"), lotSelect),
        speciesLabel,
        h("label", {}, this.t("sowCount"), this._stepper("count", f.count, 1, 999)),
        h(
          "label",
          {},
          this.t("sowWhere"),
          h("select", { name: "zone_id" }, zones.map((z) => h("option", { value: z.id, selected: z.id === f.zone_id }, `${ZONE_ICONS[z.kind] || "📍"} ${this._zonePath(z.id)}`))),
        ),
        this._field(f, "sown_on", { type: "date", required: true }),
        expect,
        this._formButtons(null, null),
      ),
    ];
  }

  async _saveSow(ev) {
    ev.preventDefault();
    const v = Object.fromEntries(new FormData(ev.target));
    const lot = this._data.seeds.find((x) => x.id === v.seed_lot_id);
    const species = lot ? lot.species : v.species?.trim();
    if (!species) return this._showMessage(this.t("species"), true);
    const count = Math.max(1, Number(v.count) || 1);
    const name = lot ? this._seedName(lot).replace(" · ", " ") : species;
    const data = {
      name,
      species,
      taxon_id: lot?.taxon_id || null,
      variety: lot?.variety || null,
      seed_lot_id: lot?.id || null,
      plant_type: this._plantTypeFor(species),
      origin: "sown",
      sown_on: v.sown_on,
      kind: count > 1 ? "group" : "single",
      quantity: count,
      sown_count: count,
      zone_id: v.zone_id || null,
    };
    if (await this._call("add_planting", data)) {
      this._close();
      this._showMessage(`✓ ${this.t("sowDone", { name, count })}`);
    }
  }

  /** Diary: every batch in a nursery, how long since sowing, and what comes next. */
  _nurseryBox() {
    const batches = this._data.plantings.filter((p) => p.status === "active" && this._inNursery(p));
    if (!batches.length) return null;
    const now = today();
    const month = Number(now.slice(5, 7));
    const cards = batches
      .sort((a, b) => (a.sown_on || "").localeCompare(b.sown_on || ""))
      .map((p) => {
        const range = this._germRange(this._germStats(p.species, p.id));
        const lot = p.seed_lot_id && this._data.seeds.find((x) => x.id === p.seed_lot_id);
        let state = "";
        let label;
        let window = null;
        let pos;
        let scale;
        if (!p.germinated_on) {
          const days = p.sown_on ? daysBetween(p.sown_on, now) : 0;
          const late = range && days > range.max;
          state = late ? "late" : "";
          label = late ? this.t("germLate", { days, min: range.min, max: range.max }) : this.t("germWaiting", { days });
          const end = Math.max((range?.max || 14) * 1.6, days + 2);
          if (range) window = [range.min / end, range.max / end];
          pos = days / end;
          scale = range ? this.t("germScaleSow", { min: range.min, max: range.max }) : "";
        } else {
          const days = daysBetween(p.germinated_on, now);
          const out = this._crop(p.species)?.plant_out || [];
          const season = !out.length || out.includes(month) || out.includes((month % 12) + 1);
          const ready = days >= READY_DAYS && season;
          state = ready ? "ready" : "";
          label = ready ? this.t("germReady") : this.t("germBorn", { days });
          const end = 60;
          window = [READY_DAYS / end, 45 / end];
          pos = Math.min(days, end) / end;
          const names = out.map((m) => new Intl.DateTimeFormat(this._lang(), { month: "short" }).format(new Date(2025, m - 1, 15)));
          scale = this.t("germScaleOut", { months: names.join(", ") || "—", days });
        }
        const sub = [
          `${p.quantity} · ${this._zone(p.zone_id)?.name || ""}`,
          p.sown_on ? `${this.t("ev_sowing")} ${this._date(p.sown_on, false)}` : null,
          p.germinated_on ? this._germText(p) : null,
          lot?.year ? `${this.t("anGermLot")} ${lot.year}` : null,
        ].filter(Boolean);
        return h(
          "div",
          { className: `batch ${state}` },
          h(
            "div",
            { className: "batch-head" },
            h("button", { type: "button", className: "main link-plain", onclick: () => this._select(p.id) }, h("strong", {}, p.name), h("span", { className: "sub" }, sub.join(" · "))),
            h("span", { className: "batch-state" }, label),
          ),
          h(
            "div",
            { className: "batch-bar" },
            window ? h("i", { style: `left:${window[0] * 100}%;width:${(window[1] - window[0]) * 100}%` }) : null,
            h("b", { style: `left:calc(${Math.min(pos, 1) * 100}% - 2px)` }),
          ),
          scale ? h("div", { className: "sub" }, scale) : null,
          h(
            "div",
            { className: "row" },
            h("button", { type: "button", onclick: () => this._openGerm(p) }, this.t("germ")),
            p.germinated_on ? h("button", { type: "button", className: "primary", onclick: () => this._openTransplant(p) }, this.t("transplant")) : null,
          ),
        );
      });
    const plants = batches.reduce((n, p) => n + (p.quantity || 1), 0);
    return h(
      "div",
      { className: "nursery" },
      h("div", { className: "cal-head" }, h("h3", {}, this.t("nurseryTitle")), h("span", { className: "sub" }, this.t("nurseryCount", { batches: batches.length, plants }))),
      cards,
    );
  }

  _openGerm(planting) {
    this._clearSelection();
    this._showMessage("");
    this._germForm = {
      planting,
      germinated_on: planting.germinated_on || today(),
      count: planting.germinated_count ?? planting.sown_count ?? planting.quantity,
    };
    this._render();
  }

  _renderGermForm() {
    const f = this._germForm;
    const p = f.planting;
    const after = h("div", { className: "expect" });
    const date = this._field(f, "germinated_on", { type: "date", required: true, max: today() });
    const update = () => {
      const day = date.querySelector("input").value;
      const count = Number(form?.elements.count.value ?? f.count);
      const days = p.sown_on && day ? daysBetween(p.sown_on, day) : null;
      const rate = p.sown_count ? Math.round((count / p.sown_count) * 100) : null;
      const history = this._germHistoryText(p.species, p.id);
      after.replaceChildren(
        days != null ? h("strong", {}, this.t("germAfter", { days, rate: rate ?? "?" })) : null,
        history ? h("span", {}, history) : null,
      );
    };
    let form = null;
    date.querySelector("input").addEventListener("input", update);
    form = h(
      "form",
      { onsubmit: (ev) => this._saveGerm(ev) },
      h("h2", {}, `${this.t("germTitle")} · ${p.name}`),
      date,
      h("label", {}, `${this.t("germCount")}${p.sown_count ? ` (/${p.sown_count})` : ""}`, this._stepper("count", f.count, 0, p.sown_count || 9999, update)),
      after,
      this._formButtons(null, null),
    );
    update();
    return [form];
  }

  async _saveGerm(ev) {
    ev.preventDefault();
    const v = Object.fromEntries(new FormData(ev.target));
    const p = this._germForm.planting;
    const count = Math.max(0, Number(v.count) || 0);
    const data = { id: p.id, germinated_on: v.germinated_on, germinated_count: count };
    if (count > 0) Object.assign(data, { quantity: count, kind: count > 1 ? "group" : "single" });
    if (await this._call("update_planting", data)) {
      this._close();
      this._showMessage(`✓ ${this.t("germDone", { name: p.name, count })}`);
    }
  }

  _openTransplant(planting, preset = {}) {
    const garden = this._data.zones.find((z) => ["vegetable_garden", "greenhouse"].includes(z.kind));
    this._clearSelection();
    this._showMessage("");
    this._transplantForm = { planting, quantity: planting.quantity, zone_id: garden?.id || "", done_on: today(), ...preset };
    this._render();
  }

  /** A cold night soon after planting out tender seedlings. */
  _coldWarning(planting, day) {
    const crop = this._crop(planting.species);
    const tender = crop?.warm || (crop?.hardiness_c ?? -5) > 0;
    const limit = tender ? 10 : 2;
    const cold = (this._outlook?.forecast || []).find((d) => d.date >= day && daysBetween(day, d.date) <= 3 && d.t_min != null && d.t_min < limit);
    return cold ? this.t("tpCold", { temp: Math.round(cold.t_min), date: this._date(cold.date, false) }) : "";
  }

  _renderTransplantForm() {
    const f = this._transplantForm;
    const p = f.planting;
    const note = h("div", { className: "expect" });
    const cold = h("div", { className: "alert-line" });
    let form = null;
    const update = () => {
      const moved = Math.min(p.quantity, Math.max(1, Number(form?.elements.quantity.value ?? f.quantity)));
      const left = p.quantity - moved;
      note.textContent = left ? this.t("tpLeft", { moved, left }) : this.t("tpAllNote", { count: p.quantity });
      const warning = this._coldWarning(p, form?.elements.done_on.value || f.done_on);
      cold.textContent = warning;
      cold.hidden = !warning;
    };
    const stepper = this._stepper("quantity", f.quantity, 1, p.quantity, update);
    const zones = this._data.zones.filter((z) => z.kind !== "nursery" && !["compost", "coop", "woodland"].includes(z.kind));
    form = h(
      "form",
      { onsubmit: (ev) => this._saveTransplant(ev) },
      h("h2", {}, `${this.t("tpTitle")} · ${p.name}`),
      h("p", { className: "hint" }, [this.t("nurseryCount", { batches: 1, plants: p.quantity }).split(" · ")[1], p.germinated_on ? this._germText(p) : null].filter(Boolean).join(" · ")),
      h(
        "label",
        {},
        this.t("tpHow"),
        h("div", { className: "row" }, stepper, h("button", { type: "button", style: "flex:none", onclick: () => ((form.elements.quantity.value = p.quantity), update()) }, this.t("tpAll"))),
      ),
      h(
        "label",
        {},
        this.t("tpZone"),
        h("select", { name: "zone_id", required: true }, zones.map((z) => h("option", { value: z.id, selected: z.id === f.zone_id }, `${ZONE_ICONS[z.kind] || "📍"} ${this._zonePath(z.id)}`))),
      ),
      this._field(f, "done_on", { type: "date", required: true, oninput: update }),
      note,
      cold,
      this._formButtons(null, null),
    );
    update();
    return [form];
  }

  async _saveTransplant(ev) {
    ev.preventDefault();
    const v = Object.fromEntries(new FormData(ev.target));
    const f = this._transplantForm;
    const quantity = Math.min(f.planting.quantity, Math.max(1, Number(v.quantity) || 1));
    const data = { id: f.planting.id, quantity, zone_id: v.zone_id, done_on: v.done_on };
    if (f.latlng) Object.assign(data, { latitude: round(f.latlng.lat), longitude: round(f.latlng.lng) });
    const result = await this._call("transplant", data);
    if (!result) return;
    const message = `✓ ${this.t("tpDone", { name: f.planting.name, count: quantity })}`;
    if (!f.latlng && this._zone(v.zone_id)?.geometry) {
      // Without a point yet: let the user tap where they went.
      this._tab = "plantings";
      this._startPlacing(result.id);
      this._showMessage(`${message} — ${this.t("tpPlace")}`);
      return;
    }
    this._close();
    this._showMessage(message);
  }

  /** Tap on a zone of the map: the usual next step first, the zone card one tap away. */
  _tapZone(id, latlng) {
    const zone = this._zone(id);
    if (!zone || ["compost", "coop", "woodland"].includes(zone.kind)) return this._selectZone(id);
    this._clearSelection();
    this._showMessage("");
    this._zoneTap = { id, latlng };
    this._syncMap();
    this._render();
  }

  _renderZoneTap() {
    const { id, latlng } = this._zoneTap;
    const zone = this._zone(id);
    if (!zone) return [];
    const inside = new Set([id, ...this._zoneDescendants(id)]);
    const count = this._data.plantings.filter((p) => p.status === "active" && inside.has(p.zone_id)).length;
    const nursery = zone.kind === "nursery";
    const ready = nursery ? [] : this._data.plantings.filter((p) => p.status === "active" && p.germinated_on && this._inNursery(p));
    const outList = this._zoneTapOut
      ? ready.map((p) =>
          h("button", { type: "button", className: "outline", onclick: () => this._openTransplant(p, { zone_id: id, latlng }) }, `${p.name} · ${p.quantity}`),
        )
      : [];
    return [
      h(
        "div",
        { className: "zone-tap" },
        h("div", { className: "batch-head" }, h("span", { style: "font-size:26px" }, ZONE_ICONS[zone.kind] || "📍"), h("div", { className: "main" }, h("strong", {}, zone.name), h("span", { className: "sub" }, this.t("zoneTapSub", { count })))),
        nursery
          ? h("button", { type: "button", className: "big", onclick: () => this._openSow({ zone_id: id }) }, this.t("zoneSowHere"))
          : h("button", { type: "button", className: "big", onclick: () => this._newPlantingAt(latlng, id) }, this.t("zoneHere")),
        ready.length
          ? h(
              "button",
              {
                type: "button",
                className: "outline",
                onclick: () => (ready.length === 1 ? this._openTransplant(ready[0], { zone_id: id, latlng }) : ((this._zoneTapOut = !this._zoneTapOut), this._render())),
              },
              this.t("zoneFromNursery", { count: ready.length }),
            )
          : null,
        outList,
        h(
          "div",
          { className: "row" },
          h("button", { type: "button", onclick: () => this._newEvent({ zone_id: id }, { zone_id: id }) }, `+ ${this.t("quickEvent")}`),
          h("button", { type: "button", onclick: () => this._selectZone(id) }, this.t("zoneCard")),
          h("button", { type: "button", onclick: () => this._close() }, "✕"),
        ),
      ),
    ];
  }

  /** Analysis: days to come up and share of seeds that did, per crop and year (with the age of the seeds). */
  _germinationBox() {
    const keys = new Map();
    for (const p of this._data.plantings) {
      if (!p.sown_on || !p.germinated_on || p.from_planting_id) continue;
      const key = this._cropKey(p.species);
      if (!keys.has(key)) keys.set(key, p);
    }
    if (!keys.size) return null;
    return h(
      "div",
      { className: "an-box" },
      h("h3", {}, this.t("anGerm")),
      [...keys.values()].map((first) => {
        const stats = this._germStats(first.species);
        const max = Math.max(...stats.map((x) => x.days), 1);
        return h(
          "div",
          { className: "an-timing" },
          h("strong", {}, capitalize(this._taxon(first.taxon_id)?.common_names?.[this._lang()]) || first.species),
          stats.map((x) =>
            h(
              "div",
              { className: "an-cmp" },
              h("span", {}, `${x.year}${x.lotAge ? ` (${x.lotAge})` : ""}`),
              h("i", { className: x.rate != null && x.rate < 65 ? "" : "good", style: `width:${Math.max((x.days / max) * 100, 6)}%` }),
              h("span", {}, `${this.t("daysShort", { count: x.days })}${x.rate != null ? ` · ${x.rate}%` : ""}`),
            ),
          ),
        );
      }),
    );
  }

  /** Analysis: the plantings that died, per year and cause. */
  _lossesBox() {
    const deaths = this._data.events.filter((e) => e.kind === "removal" && e.reason === "died").sort((a, b) => b.done_on.localeCompare(a.done_on));
    if (!deaths.length) return null;
    const years = new Map();
    for (const e of deaths) {
      const year = e.done_on.slice(0, 4);
      if (!years.has(year)) years.set(year, []);
      years.get(year).push(e);
    }
    return h(
      "div",
      { className: "an-box" },
      h("h3", {}, this.t("anLosses")),
      [...years.entries()].map(([year, list]) =>
        h(
          "div",
          { className: "sub", style: "white-space:normal" },
          h("strong", {}, `${year}: `),
          list.map((e) => `${this._targetName(e)} (${DEATH_CAUSES[e.cause] || "❔"} ${this.t(`cause_${e.cause || "unknown"}`)})`).join(", "),
        ),
      ),
    );
  }


  // ----- houseplants -----

  _isIndoor(planting) {
    return this._zoneFamily({ planting_id: planting.id }) === "indoor";
  }

  _houseplants() {
    return this._data.plantings.filter((p) => p.status === "active" && this._isIndoor(p));
  }

  /** Last date of an event kind on a planting ("" if none). */
  _lastDone(planting, kind) {
    return this._data.events.filter((e) => e.planting_id === planting.id && e.kind === kind).reduce((max, e) => (e.done_on > max ? e.done_on : max), "");
  }

  /** Same rule as models.watering_interval: half as much again from November to February. */
  _waterInterval(planting, day = today()) {
    if (!planting.water_days) return null;
    const winter = [11, 12, 1, 2].includes(Number(day.slice(5, 7)));
    return Math.max(Math.round(planting.water_days * (winter ? 1.5 : 1)), 1);
  }

  _moistureOf(planting) {
    const state = planting.moisture_entity && this._hass.states[planting.moisture_entity];
    const value = state ? Number(state.state) : NaN;
    return Number.isFinite(value) ? value : null;
  }

  /** Next watering day of a houseplant (today or earlier when due), or null without a plan. */
  _nextWatering(planting) {
    const moisture = this._moistureOf(planting);
    if (moisture != null) return moisture < (planting.moisture_min ?? 20) ? today() : null;
    const interval = this._waterInterval(planting);
    if (!interval) return null;
    const since = this._lastDone(planting, "watering") || planting.planted_on;
    return since ? addDays(since, interval) : today();
  }

  _nextFeeding(planting) {
    if (!planting.fertilize_weeks) return null;
    const month = Number(today().slice(5, 7));
    if (month < 3 || month > 9) return null;
    const since = this._lastDone(planting, "fertilizing");
    return since ? addDays(since, planting.fertilize_weeks * 7) : today();
  }

  /** Spring (March–May) and at least two years since the last repotting or planting. */
  _repotDue(planting) {
    const month = Number(today().slice(5, 7));
    if (month < 3 || month > 5) return false;
    const since = this._lastDone(planting, "repotting") || planting.planted_on;
    return !since || daysBetween(since, today()) >= 730;
  }

  _newHouseplant() {
    const room = this._data.zones.find((z) => z.kind === "indoor");
    this._clearSelection();
    this._showMessage("");
    this._tab = "plantings";
    this._form = { name: "", species: "", kind: "single", quantity: 1, status: "active", origin: "planted", planted_on: today(), zone_id: room?.id || null, plant_type: "houseplant", water_days: 7 };
    this._render();
  }

  /** Diary: the houseplants to water (and feed) today, by room, ticked and logged in one go. */
  _houseplantsBox() {
    const plants = this._houseplants();
    if (!plants.length && !this._data.zones.some((z) => z.kind === "indoor")) return null;
    const now = today();
    const until = this._vacationUntil;
    const thirsty = plants.filter((p) => {
      const next = this._nextWatering(p);
      return next && next <= (until || now);
    });
    const hungry = until ? [] : plants.filter((p) => this._nextFeeding(p) && this._nextFeeding(p) <= now);
    const repot = until ? [] : plants.filter((p) => this._repotDue(p));
    const ticked = new Set(thirsty.map((p) => p.id));
    const roomOf = (p) => this._zone(p.zone_id)?.name || "";
    const list = (items, set) => {
      const rooms = new Map();
      for (const p of items) {
        if (!rooms.has(roomOf(p))) rooms.set(roomOf(p), []);
        rooms.get(roomOf(p)).push(p);
      }
      return [...rooms.entries()].flatMap(([room, group]) => [
        h("div", { className: "quick-title" }, room),
        ...group.map((p) => {
          const box = h("input", { type: "checkbox", checked: true });
          box.addEventListener("change", () => (box.checked ? set.add(p.id) : set.delete(p.id)));
          const moisture = this._moistureOf(p);
          const last = this._lastDone(p, "watering");
          const detail = [moisture != null ? `💧 ${Math.round(moisture)}%` : null, last ? `${this.t("lastWater")} ${this._ago(last)}` : null].filter(Boolean).join(" · ");
          return h("label", { className: "repeat-row" }, box, h("span", { className: "repeat-name" }, h("strong", {}, p.name), h("span", { className: "sub" }, detail)));
        }),
      ]);
    };
    const log = async (kind, set, done) => {
      let count = 0;
      for (const id of set) if (await this._call("add_event", { kind, planting_id: id, done_on: today() })) count++;
      this._vacationUntil = null;
      this._showMessage(`✓ ${this.t(done, { count })}`);
    };
    const fed = new Set(hungry.map((p) => p.id));
    const upcoming = plants
      .map((p) => ({ p, next: this._nextWatering(p) }))
      .filter((x) => x.next && x.next > now)
      .sort((a, b) => a.next.localeCompare(b.next))[0];
    const vacation = h("input", { type: "date", min: addDays(now, 1), value: until || "", "aria-label": this.t("vacationBack") });
    vacation.addEventListener("change", () => {
      this._vacationUntil = vacation.value || null;
      this._render();
    });
    return h(
      "div",
      { className: "nursery" },
      h(
        "div",
        { className: "cal-head" },
        h("h3", {}, until ? this.t("vacationTitle", { date: this._date(until, false) }) : this.t("indoorTitle")),
        h("button", { type: "button", onclick: () => this._newHouseplant() }, `+ ${this.t("pt_houseplant")}`),
      ),
      thirsty.length
        ? [
            ...list(thirsty, ticked),
            h("button", { type: "button", className: "primary", onclick: () => log("watering", ticked, "wateredDone") }, `💧 ${this.t("wateredNow")}`),
          ]
        : h(
            "p",
            { className: "hint" },
            plants.length ? `${this.t("nothingToWater")}${upcoming ? ` · ${this.t("nextWater", { name: upcoming.p.name, date: this._date(upcoming.next, false) })}` : ""}` : this.t("indoorEmpty"),
          ),
      hungry.length
        ? [
            h("div", { className: "quick-title" }, this.t("toFeed")),
            ...list(hungry, fed).filter((el) => !el.classList.contains("quick-title")),
            h("button", { type: "button", onclick: () => log("fertilizing", fed, "fedDone") }, `🌿 ${this.t("fedNow")}`),
          ]
        : null,
      repot.length ? h("div", { className: "sub", style: "white-space:normal" }, `🪴 ${this.t("repotHint", { names: repot.map((p) => p.name).join(", ") })}`) : null,
      plants.length ? h("label", { className: "show-gone" }, `🏖️ ${this.t("vacationBack")}`, vacation, until ? h("button", { type: "button", onclick: () => ((this._vacationUntil = null), this._render()) }, "✕") : null) : null,
    );
  }

  /** Planting sheet: the user's own care notes, folded under the crop data. */
  _careNotes(planting) {
    const text = h("textarea", { rows: 4, value: planting.care ?? "", placeholder: this.t("careNotesHint") });
    const first = (planting.care || "").split("\n")[0];
    return h(
      "details",
      { className: "care-notes" },
      h("summary", {}, `🩺 ${this.t("careNotes")}`, first ? h("span", { className: "sub" }, ` · ${first}`) : null),
      text,
      h(
        "button",
        {
          type: "button",
          onclick: async () => {
            const care = text.value.trim() || null;
            if ((await this._call("update_planting", { id: planting.id, care })) !== null) this._showMessage(this.t("saved", { name: planting.name }));
          },
        },
        this.t("save"),
      ),
    );
  }

  /** Planting form: watering plan, only for plants in an indoor zone. */
  _careFields(f) {
    const sensors = Object.entries(this._hass.states)
      .filter(([id, st]) => id.startsWith("sensor.") && st.attributes?.device_class === "moisture")
      .map(([id, st]) => [id, st.attributes.friendly_name || id]);
    const succulent = ["opuntia", "echeveria", "aloe", "crassula", "haworthia", "sansevieria", "dracaena", "zamioculcas", "kalanchoe", "mammillaria", "euphorbia"];
    const guess = succulent.includes(this._cropKey(f.species).split(" ")[0]) ? 20 : 7;
    return h(
      "fieldset",
      { className: "care" },
      h("legend", {}, `🪴 ${this.t("careTitle")}`),
      h(
        "div",
        { className: "row" },
        this._field(f, "water_days", { type: "number", min: 1, max: 365, step: 1, inputMode: "numeric", placeholder: String(guess) }),
        this._field(f, "fertilize_weeks", { type: "number", min: 1, max: 52, step: 1, inputMode: "numeric", placeholder: "4" }),
      ),
      sensors.length
        ? h(
            "div",
            { className: "row" },
            this._selectField(f, "moisture_entity", [["", "—"], ...sensors]),
            this._field(f, "moisture_min", { type: "number", min: 0, max: 100, step: 1, placeholder: "20" }),
          )
        : null,
      h("p", { className: "hint" }, this.t("careHint")),
    );
  }

  // ----- firewood: stock, seasoning, winters -----

  /** Winter of a date: "2025/26" for November 2025 or February 2026. */
  _winterOf(iso) {
    const year = Number(iso.slice(0, 4));
    const start = Number(iso.slice(5, 7)) >= 7 ? year : year - 1;
    return `${start}/${String((start + 1) % 100).padStart(2, "0")}`;
  }

  /** Firewood per unit: cut, burnt, in stock, seasoned (cut at least WOOD_SEASON_MONTHS before `day`, oldest burnt first). */
  _woodStock(day = today()) {
    const cut = this._data.events.filter((e) => e.kind === "wood_cutting" && e.quantity);
    const burnt = this._data.events.filter((e) => e.kind === "wood_burned" && e.quantity);
    const units = new Map();
    const unit = (u) => {
      if (!units.has(u)) units.set(u, { unit: u, cut: 0, burnt: 0, seasoned: 0, winters: new Map() });
      return units.get(u);
    };
    const ripe = addMonths(day, -WOOD_SEASON_MONTHS);
    for (const e of cut) {
      const s = unit(e.unit || "q");
      s.cut += e.quantity;
      if (e.done_on <= ripe) s.seasoned += e.quantity;
    }
    for (const e of burnt) {
      const s = unit(e.unit || "q");
      s.burnt += e.quantity;
      const winter = this._winterOf(e.done_on);
      s.winters.set(winter, (s.winters.get(winter) || 0) + e.quantity);
    }
    for (const s of units.values()) {
      s.stock = s.cut - s.burnt;
      s.seasoned = Math.max(Math.min(s.seasoned - s.burnt, s.stock), 0);
      const last = [...s.winters.values()].slice(-3);
      s.need = last.length ? last.reduce((a, b) => a + b, 0) / last.length : null;
    }
    return [...units.values()];
  }

  /** Days of frost of a winter (November–March), from the weather history. */
  _frostDays(winter) {
    const start = Number(winter.slice(0, 4));
    const from = `${start}-11-01`;
    const to = `${start + 1}-03-31`;
    return (this._outlook?.climate?.extremes || [])
      .filter((x) => x.kind === "frost" && x.start >= from && x.start <= to)
      .reduce((n, x) => n + daysBetween(x.start, x.end) + 1, 0);
  }

  /** March–May: ask once how much firewood the winter took. */
  _woodReminder() {
    const now = today();
    const month = Number(now.slice(5, 7));
    const wood = this._data.zones.find((z) => z.kind === "woodland");
    if (!wood || month < 3 || month > 5) return null;
    const winter = this._winterOf(now);
    if (this._data.events.some((e) => e.kind === "wood_burned" && this._winterOf(e.done_on) === winter)) return null;
    return h(
      "div",
      { className: "task" },
      h(
        "button",
        { type: "button", className: "task-main", onclick: () => this._openEvent({ kind: "wood_burned", done_on: now, zone_id: wood.id, unit: this._woodUnit() }, { zone_id: wood.id }) },
        h("span", {}, `🔥 ${this.t("woodAsk", { winter })}`),
        h("span", { className: "sub" }, this.t("woodAskHint")),
      ),
    );
  }

  _woodStockBox() {
    const stock = this._woodStock();
    if (!stock.length) return null;
    const now = today();
    // The winter to plan: from January to September the one starting this October, in autumn the one under way.
    const nextStart = Number(now.slice(0, 4));
    const october = `${nextStart}-10-01` > now ? `${nextStart}-10-01` : now;
    const ready = this._woodStock(october);
    return h(
      "div",
      { className: "seasons" },
      h("h3", {}, this.t("woodStock")),
      stock.map((s) => {
        const atOctober = ready.find((r) => r.unit === s.unit)?.seasoned ?? 0;
        const lines = [
          this.t("woodStockLine", { stock: this._quantity(Math.max(s.stock, 0), s.unit), seasoned: this._quantity(s.seasoned, s.unit) }),
        ];
        if (s.need) {
          const short = s.need - atOctober;
          lines.push(this.t(short > 0 ? "woodShort" : "woodEnough", { winter: `${nextStart}/${String((nextStart + 1) % 100).padStart(2, "0")}`, need: this._quantity(s.need, s.unit), ready: this._quantity(atOctober, s.unit), missing: this._quantity(Math.max(short, 0), s.unit) }));
          const after = Math.max(s.need * 2 - Math.max(s.stock, 0), 0);
          const by = addMonths(`${nextStart + 1}-10-01`, -WOOD_SEASON_MONTHS);
          if (after > 0) lines.push(by > now ? this.t("woodCut", { amount: this._quantity(after, s.unit), by: this._date(by) }) : this.t("woodCutNow", { amount: this._quantity(after, s.unit) }));
        }
        const winters = [...s.winters.entries()].sort((a, b) => b[0].localeCompare(a[0])).slice(0, 5);
        return h(
          "div",
          { className: "season" },
          lines.map((line) => h("div", { className: "sub", style: "white-space:normal" }, line)),
          winters.length
            ? h(
                "div",
                { className: "sub", style: "white-space:normal" },
                winters.map(([w, q]) => `🔥 ${w}: ${this._quantity(q, s.unit)}${this._frostDays(w) ? ` · ❄️ ${this._frostDays(w)}` : ""}`).join("  ·  "),
              )
            : null,
        );
      }),
    );
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
    extras.stars = h("div", { className: "review" }, this._starsField(f.rating));
    extras.reason = this._selectField(f, "reason", LEAVE_REASONS.map((r) => [r, `${LEAVE_ICONS[r]} ${this.t(`lr_${r}`)}`]));
    const causeField = h(
      "label",
      {},
      this.t("cause"),
      h("select", { name: "cause" }, Object.entries(DEATH_CAUSES).map(([c, icon]) => h("option", { value: c, selected: c === (f.cause || "unknown") }, `${icon} ${this.t(`cause_${c}`)}`))),
    );
    const endSelect = h(
      "select",
      { name: "end_reason", onchange: () => (causeField.hidden = endSelect.value !== "died") },
      Object.entries(END_REASONS).map(([r, icon]) => h("option", { value: r, selected: r === (f.reason && END_REASONS[f.reason] ? f.reason : "finished") }, `${icon} ${this.t(`end_${r}`)}`)),
    );
    extras.end = h("div", { className: "row" }, h("label", {}, this.t("endReason"), endSelect), causeField);
    causeField.hidden = endSelect.value !== "died";
    extras.review = h(
      "div",
      { className: "review" },
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
    // Woodland, compost and hen house targets get their own kinds; gardens the others. The current kind always stays visible.
    const filterKinds = () => {
      const family = this._zoneFamily(currentTarget());
      const own = { woodland: [...WOOD_KINDS, ...WOODLAND_ALSO], compost: [...COMPOST_KINDS, ...YARD_ALSO], coop: [...COOP_KINDS, ...YARD_ALSO], indoor: INDOOR_KINDS }[family];
      const special = [...WOOD_KINDS, ...COMPOST_KINDS, ...COOP_KINDS];
      kinds.querySelectorAll("button").forEach((b) => {
        const kind = b.dataset.kind;
        b.hidden = kind !== kindInput.value && (own ? !own.includes(kind) : special.includes(kind));
      });
    };
    const showExtras = () => {
      const kind = kindInput.value;
      updateLast();
      extras.review.hidden = kind !== "review";
      extras.stars.hidden = !["review", "compost_harvest"].includes(kind);
      extras.reason.hidden = kind !== "flock_out";
      extras.end.hidden = kind !== "removal";
      quantityLabel.firstChild.textContent = this.t(QUANTITY_LABEL[kind] || "quantity_h");
      unitLabel.hidden = (QUANTITY_UNITS[kind] || []).length < 2;
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
    const unitLabel = h("label", {}, this.t("unit"), unitSelect);
    const quantityLabel = h(
      "label",
      {},
      this.t("quantity_h"),
      h("input", { name: "quantity", type: "number", min: 0, step: "any", value: f.quantity ?? "", inputMode: "decimal" }),
    );
    extras.harvest = h(
      "div",
      { className: "row" },
      quantityLabel,
      unitLabel,
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
      extras.reason,
      extras.end,
      extras.stars,
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
      rating: ["review", "compost_harvest"].includes(v.kind) && v.rating ? Number(v.rating) : null,
      reason: v.kind === "flock_out" ? v.reason || null : v.kind === "removal" ? v.end_reason || null : null,
      cause: v.kind === "removal" && v.end_reason === "died" ? v.cause || "unknown" : null,
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
    if (data.kind === "removal" && !id && data.reason !== "died" && data.reason !== "removed") {
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
  _todoBox(tasks, back = null, headExtra = null) {
    const open = tasks.filter((t) => !t.done_on).sort((a, b) => a.due_on.localeCompare(b.due_on));
    const now = today();
    return h(
      "div",
      { className: "todo" },
      headExtra ? h("div", { className: "cal-head" }, h("h3", {}, this.t("tabTodo")), headExtra) : h("h3", {}, this.t("tabTodo")),
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
    const params = new URLSearchParams(window.location.search);
    const id = params.get("task");
    const zone = params.get("zone");
    if (!(id || zone) || !this._loaded) return;
    history.replaceState(history.state, "", window.location.pathname);
    if (zone && this._zone(zone)) {
      // From the compost reminder: the diary form already filled in.
      this._openEvent({ kind: params.get("kind") || "note", done_on: today(), zone_id: zone }, { zone_id: zone });
      return;
    }
    const task = this._data.tasks.find((t) => t.id === id);
    if (task && !task.done_on) this._completeFromTask(task);
    else if (task) this._setTab("diary");
  }

  set route(route) {
    this._route = route;
    if (this._hass && this._layout) this._openTaskFromUrl();
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
                  this._germHistoryText(lot.species) ? h("div", { className: "sub" }, this._germHistoryText(lot.species)) : null,
                ),
                lot.finished
                  ? null
                  : h(
                      "button",
                      {
                        type: "button",
                        className: "primary sow-button",
                        onclick: (ev) => {
                          ev.stopPropagation();
                          this._openSow({ seed_lot_id: lot.id });
                        },
                      },
                      `🌱 ${this.t("sow")}`,
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
          h("label", {}, this.t("quantity_s"), h("input", { name: "quantity", value: f.quantity ?? "" })),
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

  /** Plant type guessed from the species: woody habit by genus, else the crop table's category. */
  _plantTypeFor(species) {
    const key = this._cropKey(species);
    if (!key) return null;
    const genus = key.split(" ")[0];
    return this._genusTypes?.[genus] || (this._cropDefaults[key] || this._cropDefaults[genus])?.plant_type || null;
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
      if (!v.plant_type && !issues.plant_type) v.plant_type = this._plantTypeFor(v.species) || ZONE_PLANT_TYPE[this._zone(v.zone_id)?.kind] || null;
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
    const turns = this._compostDue().map(({ zone, days }) =>
      h(
        "div",
        { className: "action-card warn" },
        h(
          "button",
          { type: "button", className: "action-main", onclick: () => this._selectZone(zone.id) },
          h("span", { className: "action-date" }, this.t("compostDays", { days })),
          h("span", { className: "action-title" }, `♻️ ${this.t("ev_compost_turn")}`),
          h("span", { className: "sub" }, zone.name),
        ),
        h("button", { type: "button", className: "tick", title: this.t("done"), onclick: () => this._openEvent({ kind: "compost_turn", done_on: today(), zone_id: zone.id }) }, "✔"),
      ),
    );
    const services = this._data.tools
      .filter((t) => t.next_service_on && t.next_service_on <= end && t.status !== "broken")
      .sort((a, b) => a.next_service_on.localeCompare(b.next_service_on))
      .map((t) =>
        h(
          "div",
          { className: `action-card${t.next_service_on < now ? " late" : ""}` },
          h(
            "button",
            { type: "button", className: "action-main", onclick: () => this._openTool(t) },
            h("span", { className: "action-date" }, `${weekday.format(new Date(`${t.next_service_on}T12:00:00`))} ${this._date(t.next_service_on, false)}`),
            h("span", { className: "action-title" }, `🔧 ${this.t("toolService")}`),
            h("span", { className: "sub" }, t.name),
            t.next_service_on < now ? h("span", { className: "action-verdict" }, this.t("overdue")) : null,
          ),
          h("button", { type: "button", className: "tick", title: this.t("done"), onclick: () => this._toolServiced(t) }, "✔"),
        ),
      );
    const alerts = this._outlook?.alerts || [];
    const when = (a) => (a.start === a.end ? this._date(a.start, false) : `${this._date(a.start, false)}–${this._date(a.end, false)}`);
    return h(
      "div",
      { className: "cal-box" },
      this._weatherStrip(),
      h(
        "div",
        { className: "cal-head" },
        h("h3", {}, this.t("calNext")),
        h("button", { type: "button", onclick: () => this._openTask({ kind: "note", due_on: today() }) }, this.t("addTask")),
      ),
      cards.length || turns.length || services.length ? h("div", { className: "action-cards" }, cards, turns, services) : h("p", { className: "hint" }, this.t("nothingToDo")),
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

  /** Next 14 days: weather, alerts and the planned activities (green/orange by the weather verdict, ↪ on a better day). */
  _weatherStrip() {
    const days = (this._outlook?.forecast || []).slice(0, 14);
    if (!days.length) return h("p", { className: "hint" }, this.t("calNoForecast"));
    const alerts = this._outlook?.alerts || [];
    const advice = this._outlook?.advice || {};
    const tasks = this._data.tasks.filter((t) => !t.done_on);
    const weekday = new Intl.DateTimeFormat(this._lang(), { weekday: "short" });
    const alertIcon = { frost: "❄️", cold: "🥶", heatwave: "🔥", heat_extreme: "🔥", heat_stress: "🥵" };
    const now = today();
    const columns = days.map((day) => {
      const dayAlerts = alerts.filter((a) => a.start <= day.date && day.date <= a.end);
      const due = tasks.filter((t) => t.due_on === day.date);
      const better = tasks.filter((t) => advice[t.id]?.best === day.date);
      return h(
        "div",
        { className: `day-col${dayAlerts.length ? " alert" : ""}${day.date === now ? " today" : ""}` },
        h("div", { className: "day-name" }, `${weekday.format(new Date(`${day.date}T12:00:00`)).replace(".", "")} ${Number(day.date.slice(8))}`),
        h("div", { className: "wx" }, this._weatherIcon(day)),
        h("div", { className: "t-max" }, `${day.t_max != null ? Math.round(day.t_max) : "–"}°`),
        h("div", { className: "sub" }, `${day.t_min != null ? Math.round(day.t_min) : "–"}°`),
        h("div", { className: "sub rain" }, day.rain_mm ? `${Math.round(day.rain_mm)} mm` : ""),
        h(
          "div",
          { className: "day-chips" },
          dayAlerts.map((a) =>
            h("span", { className: `alert-chip ${a.kind}`, title: this.t(`al_${a.kind}`, { when: this._date(a.start, false), value: a.value }) }, alertIcon[a.kind]),
          ),
          due.map((t) => {
            const verdict = advice[t.id];
            const state = !verdict ? "" : verdict.issues.length ? " warn" : " good";
            return h("button", { type: "button", className: `task-chip${state}`, title: this._taskLabel(t), onclick: () => this._openTask(t) }, EVENT_ICONS[t.kind] || "📝");
          }),
          better.map((t) => h("button", { type: "button", className: "task-chip better", title: `↪ ${this._taskLabel(t)}`, onclick: () => this._openTask(t) }, "↪")),
        ),
      );
    });
    return h("div", { className: "days" }, columns);
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
    const letters = new Intl.DateTimeFormat(this._lang(), { month: this._narrow ? "narrow" : "short" });
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

  _groupHeader(group, summary, addTask = null) {
    const open = !this._calClosed().has(group.id);
    return h(
      "div",
      { className: "tl-group-row" },
      h(
        "button",
        { type: "button", className: "tl-group", onclick: () => this._toggleGroup(group.id), "aria-expanded": open ? "true" : "false" },
        h("span", { className: "tl-arrow" }, open ? "▾" : "▸"),
        h("strong", {}, group.zone ? `${ZONE_ICONS[group.zone.kind] || "📍"} ${group.name}` : group.name),
        h("span", { className: "sub" }, summary),
      ),
      addTask ? h("button", { type: "button", className: "tl-add", title: this.t("addTask"), "aria-label": this.t("addTask"), onclick: addTask }, "+") : null,
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
      if (group.zone && this._zoneFamily({ zone_id: group.zone.id }) === "indoor") continue;
      const plantings = group.plantings.filter((p) => p.status === "active");
      const zoneTasks = group.zone ? openTasks.filter((t) => t.zone_id === group.zone.id) : openTasks.filter((t) => !t.planting_id && !t.zone_id);
      const plantTasks = openTasks.filter((t) => plantings.some((p) => p.id === t.planting_id));
      const zoneBands = group.zone ? ZONE_SEASONS[group.zone.kind] || [] : [];
      if (!plantings.length && !zoneTasks.length && !zoneBands.length) continue;
      const count = zoneTasks.length + plantTasks.length;
      rows.push(
        this._groupHeader(
          group,
          [plantings.length ? this._plural("calPlant", plantings.length) : null, count ? this._plural("calTask", count) : null].filter(Boolean).join(" · "),
          () => this._openTask({ kind: "note", due_on: today(), ...(group.zone ? { zone_id: group.zone.id } : {}) }),
        ),
      );
      if (this._calClosed().has(group.id)) continue;
      if (zoneBands.length || zoneTasks.length) {
        const bands = zoneBands.map(([key, months]) => {
          legendKeys.add(key);
          return this._monthSegments(months).map(([from, to]) => ({ from, to, lane: key, color: CAL_COLOR[key], title: this.t(`cal_${key}`) }));
        });
        rows.push(
          this._bandRow(
            group.zone ? `🗺️ ${this.t("calWholeZone")}` : this.t("calGeneral"),
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
    const tools = this._data.tools.filter((t) => t.next_service_on && t.status !== "broken" && t.next_service_on.slice(0, 4) <= year);
    if (tools.length) {
      const group = { id: "_tools", name: `🔧 ${this.t("tabTools")}` };
      rows.push(this._groupHeader(group, this._plural("calTask", tools.length)));
      if (!this._calClosed().has(group.id))
        for (const t of tools.sort((a, b) => a.name.localeCompare(b.name))) {
          const late = t.next_service_on < today();
          const x = this._yearFraction(late ? today() : t.next_service_on);
          const pill = h(
            "button",
            { type: "button", className: `tl-pill${late ? " late" : ""}`, "data-row": 0, style: `left:${x * 100}%;top:4px`, title: `${this._date(t.next_service_on)} · ${t.name}`, onclick: () => this._openTool(t) },
            `🔧 ${this.t("toolService")}`,
          );
          rows.push(this._bandRow(t.name, () => this._openTool(t), [], [pill]));
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
            title: `${this._date(e.done_on)} ${this._eventLabel(e)}${e.quantity ? ` ${this._eventQuantity(e)}` : ""}`,
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
      if (zoneEvents.length) rows.push(this._bandRow(`🗺️ ${this.t("calWholeZone")}`, () => this._selectZone(group.zone.id), [], marks(zoneEvents)));
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

  // ---------- analysis over the years ----------

  /** One row per crop and zone: harvests per year (main unit), plants per year, reviews, expenses. */
  _cropRows() {
    const rows = new Map();
    for (const p of this._data.plantings) {
      const key = `${p.zone_id || ""}|${p.taxon_id ? `t:${p.taxon_id}` : this._cropKey(p.species)}`;
      if (!rows.has(key)) {
        const taxon = this._taxon(p.taxon_id);
        rows.set(key, {
          key,
          zone_id: p.zone_id && this._zone(p.zone_id) ? p.zone_id : "",
          name: capitalize(taxon?.common_names?.[this._lang()]) || p.name.replace(/\s*\b(19|20)\d\d\b/, "").trim() || p.species,
          plantings: [],
        });
      }
      rows.get(key).plantings.push(p);
    }
    const thisYear = new Date().getFullYear();
    for (const row of rows.values()) {
      const ids = new Set(row.plantings.map((p) => p.id));
      const harvests = this._data.events.filter((e) => e.kind === "harvest" && ids.has(e.planting_id) && e.quantity);
      const units = {};
      harvests.forEach((e) => (units[e.unit || "kg"] = (units[e.unit || "kg"] || 0) + 1));
      row.unit = Object.entries(units).sort((a, b) => b[1] - a[1])[0]?.[0] || "kg";
      row.years = {};
      for (const e of harvests.filter((e) => (e.unit || "kg") === row.unit)) {
        const year = e.done_on.slice(0, 4);
        const y = (row.years[year] ||= { total: 0, plants: new Map(), ratings: [] });
        y.total += e.quantity;
        const p = this._planting(e.planting_id);
        y.plants.set(p.id, p.kind === "group" ? p.quantity || 1 : 1);
      }
      for (const e of this._data.events.filter((e) => e.kind === "review" && ids.has(e.planting_id) && e.rating)) {
        const y = (row.years[e.done_on.slice(0, 4)] ||= { total: 0, plants: new Map(), ratings: [] });
        y.ratings.push(e.rating);
      }
      const young = row.plantings.some((p) => ["tree", "fruit_tree"].includes(p.plant_type) && ageOf(p) != null && ageOf(p) < 5);
      const sorted = Object.keys(row.years).sort();
      for (const year of sorted) {
        const y = row.years[year];
        const plants = [...y.plants.values()].reduce((a, b) => a + b, 0);
        y.perPlant = y.total && plants ? y.total / plants : null;
        y.plantCount = plants;
        const before = sorted.filter((other) => other < year).map((other) => row.years[other].perPlant).filter((v) => v != null);
        const ratio = !young && y.perPlant != null && before.length ? y.perPlant / median(before) : null;
        const rating = y.ratings.length ? y.ratings.reduce((a, b) => a + b, 0) / y.ratings.length : null;
        const parts = [ratio != null ? Math.min(ratio, 1.5) : null, rating != null ? rating / 3.5 : null].filter((v) => v != null);
        y.index = parts.length ? parts.reduce((a, b) => a + b, 0) / parts.length : null;
        y.ratio = ratio;
        y.rating = rating;
      }
      const spent = this._data.expenses.filter((e) => !e.income && ids.has(e.planting_id)).reduce((sum, e) => sum + e.amount, 0);
      const amount = Object.values(row.years).reduce((sum, y) => sum + y.total, 0);
      row.costPerUnit = spent && amount ? spent / amount : null;
      row.current = row.plantings.some((p) => p.status === "active") || sorted.includes(String(thisYear));
    }
    return [...rows.values()].filter((row) => Object.keys(row.years).length);
  }

  _tone(index) {
    if (index == null) return "";
    return index >= 0.9 ? "good" : index >= 0.7 ? "mid" : "bad";
  }

  _renderAnalysis() {
    const zone = this._analysisZone || "";
    const perPlant = !!this._analysisPerPlant;
    const inZone = (zoneId) => !zone || zoneId === zone || this._zoneDescendants(zone).has(zoneId);
    const rows = this._cropRows().filter((row) => inZone(row.zone_id));
    const extremes = this._outlook?.climate?.extremes || [];
    const allYears = new Set([
      ...rows.flatMap((row) => Object.keys(row.years)),
      ...this._data.expenses.map((e) => e.spent_on.slice(0, 4)),
      ...this._data.events.map((e) => e.done_on.slice(0, 4)),
    ]);
    const years = [...allYears].sort().slice(-5);
    if (!years.length) return [h("p", { className: "hint" }, this.t("anEmpty"))];
    const zoneSelect = h(
      "select",
      {
        onchange: (ev) => {
          this._analysisZone = ev.target.value;
          this._render();
        },
      },
      [["", this.t("allZones")], ...this._zoneOptions().slice(1)].map(([v, text]) => h("option", { value: v, selected: v === zone }, text)),
    );
    const weatherOf = (year) => {
      const ofYear = extremes.filter((x) => x.start.startsWith(year));
      const days = (kind) => ofYear.filter((x) => x.kind === kind).reduce((n, x) => n + (Date.parse(x.end) - Date.parse(x.start)) / 86400000 + 1, 0);
      return {
        heat: days("heatwave"),
        frost: ofYear.filter((x) => x.kind === "frost").length,
        hail: ofYear.filter((x) => x.kind === "hail").length,
      };
    };
    const weatherText = (w) =>
      [
        w.heat ? this.t("anHeatDays", { count: w.heat }) : null,
        w.frost ? this.t("anFrosts", { count: w.frost }) : null,
        w.hail ? this.t("anHail") : null,
      ]
        .filter(Boolean)
        .join(" · ") || this.t("anNoExtremes");
    const tiles = years.map((year) => {
      const indices = rows.map((row) => row.years[year]?.index).filter((v) => v != null);
      const index = indices.length ? indices.reduce((a, b) => a + b, 0) / indices.length : null;
      const kg = rows.filter((row) => row.unit === "kg").reduce((sum, row) => sum + (row.years[year]?.total || 0), 0);
      const money = this._data.expenses.filter((e) => e.spent_on.startsWith(year));
      const balance = money.reduce((sum, e) => sum + (e.income ? e.amount : -e.amount), 0);
      const tone = this._tone(index);
      return h(
        "div",
        { className: "an-tile" },
        h("div", { className: "an-tile-head" }, h("strong", {}, year), tone ? h("span", { className: `an-badge ${tone}` }, this.t(`an_${tone}`)) : null),
        h("div", { className: "sub" }, `${index != null ? `${this.t("anIndex")} ${index.toFixed(2).replace(".", ",")}` : ""}${index != null && kg ? " · " : ""}${kg ? this._quantity(kg, "kg") : ""}`),
        money.length ? h("div", { className: "sub" }, `${this.t("balance")} ${balance >= 0 ? "+" : ""}${this._money(balance)}`) : null,
        h("div", { className: "sub" }, weatherText(weatherOf(year))),
      );
    });
    const toggle = h(
      "div",
      { className: "segmented" },
      h("button", { type: "button", className: perPlant ? "" : "active", onclick: () => ((this._analysisPerPlant = false), this._render()) }, this.t("anTotal")),
      h("button", { type: "button", className: perPlant ? "active" : "", onclick: () => ((this._analysisPerPlant = true), this._render()) }, this.t("anPerPlant")),
    );
    const groups = new Map();
    rows.forEach((row) => {
      if (!groups.has(row.zone_id)) groups.set(row.zone_id, []);
      groups.get(row.zone_id).push(row);
    });
    const table = h(
      "div",
      { className: "an-table", style: `grid-template-columns: minmax(110px, 1.4fr) repeat(${years.length}, minmax(52px, 1fr)) minmax(60px, auto)` },
      h("div"),
      years.map((y) => h("div", { className: "an-th" }, y)),
      h("div", { className: "an-th" }, this.t("anCost")),
      [...groups.entries()].flatMap(([zoneId, list]) => [
        h("div", { className: "an-zone" }, zoneId ? this._zonePath(zoneId) : this.t("calNoZone")),
        ...list.flatMap((row) => [
          h(
            "button",
            { type: "button", className: "an-name", onclick: () => ((this._analysisRow = row.key), this._render()) },
            row.name,
          ),
          ...years.map((year) => {
            const y = row.years[year];
            const value = y ? (perPlant ? y.perPlant : y.total) : null;
            const title = y ? [`${y.plantCount} ${this.t("anPlants")}`, y.rating ? `${y.rating.toFixed(1)} ★` : null, y.ratio ? `×${y.ratio.toFixed(2)}` : null].filter(Boolean).join(" · ") : "";
            return h("div", { className: `an-cell ${this._tone(y?.index)}`, title }, value != null ? this._quantity(value, row.unit) : "—");
          }),
          h("div", { className: "an-cost" }, row.costPerUnit ? `${this._money(row.costPerUnit)}/${this.t(`u_${row.unit}`)}` : "—"),
        ]),
      ]),
    );
    const selected = rows.find((row) => row.key === this._analysisRow) || rows[0];
    return [
      h(
        "div",
        { className: "row filters", style: "align-items:center" },
        h("h2", { style: "flex:2" }, this.t("anTitle")),
        zoneSelect,
      ),
      h("div", { className: "an-tiles" }, tiles),
      h(
        "div",
        { className: "an-box" },
        h("div", { className: "cal-head" }, h("h3", {}, this.t("anYields")), toggle),
        rows.length ? table : h("p", { className: "hint" }, this.t("anNoHarvest")),
        h("p", { className: "hint" }, this.t("anYieldsHint")),
      ),
      this._eggsBox(years),
      this._germinationBox(),
      this._lossesBox(),
      this._data.events.some((e) => e.kind === "wood_burned") ? h("div", { className: "an-box" }, this._woodStockBox()) : null,
      selected ? this._weatherYieldBox(selected, years, weatherOf, perPlant) : null,
      this._timingBox(rows),
      this._moonBox(),
      this._lessonsBox(),
    ];
  }

  _weatherYieldBox(row, years, weatherOf, perPlant) {
    const values = years.map((year) => {
      const y = row.years[year];
      return { year, value: y ? (perPlant ? y.perPlant : y.total) : null, index: y?.index, weather: weatherOf(year) };
    });
    const max = Math.max(...values.map((v) => v.value || 0), 0.0001);
    const hot = values.filter((v) => v.value != null && v.weather.heat >= 5);
    const mild = values.filter((v) => v.value != null && v.weather.heat < 5);
    const avg = (list) => list.reduce((s, v) => s + v.value, 0) / list.length;
    const note =
      hot.length && mild.length
        ? this.t("anHeatEffect", { pct: Math.round((1 - avg(hot) / avg(mild)) * 100) })
        : null;
    return h(
      "div",
      { className: "an-box" },
      h("h3", {}, this.t("anWeatherYield", { name: row.name })),
      h(
        "div",
        { className: "an-bars" },
        values.map((v) =>
          h(
            "div",
            { className: "an-bar" },
            h("span", { className: "sub" }, v.value != null ? this._quantity(v.value, row.unit) : "—"),
            h("i", { className: this._tone(v.index), style: `height:${v.value ? Math.max((v.value / max) * 120, 3) : 0}px` }),
            h("strong", {}, v.year),
            h("span", { className: "sub" }, v.weather.heat ? this.t("anHeatDays", { count: v.weather.heat }) : ""),
            h("span", { className: "sub" }, v.weather.frost ? this.t("anFrosts", { count: v.weather.frost }) : ""),
            h("span", { className: "sub" }, v.weather.hail ? this.t("anHail") : ""),
          ),
        ),
      ),
      note ? h("div", { className: "alert-line" }, note) : null,
      h("p", { className: "hint" }, this.t("anPickCrop")),
    );
  }

  /** Yield per plant by the month the work was done (pruning, planting out), when there are at least two cases. */
  _timingBox(rows) {
    const lines = [];
    const monthName = new Intl.DateTimeFormat(this._lang(), { month: "long" });
    for (const row of rows) {
      const ids = new Set(row.plantings.map((p) => p.id));
      for (const kind of ["pruning", "planted"]) {
        const byMonth = {};
        for (const [year, y] of Object.entries(row.years)) {
          if (y.perPlant == null) continue;
          let dates = [];
          if (kind === "planted") dates = row.plantings.filter((p) => p.planted_on?.startsWith(year)).map((p) => p.planted_on);
          else
            dates = this._data.events
              .filter((e) => e.kind === kind && ids.has(e.planting_id))
              .filter((e) => e.done_on.startsWith(year) || e.done_on.startsWith(String(Number(year) - 1)) && Number(e.done_on.slice(5, 7)) >= 9)
              .map((e) => e.done_on);
          if (!dates.length) continue;
          const month = Number(dates.sort()[0].slice(5, 7));
          (byMonth[month] ||= []).push(y.perPlant);
        }
        const groups = Object.entries(byMonth).map(([m, list]) => ({ month: Number(m), avg: list.reduce((a, b) => a + b, 0) / list.length, n: list.length }));
        if (groups.length < 2 || groups.reduce((n, g) => n + g.n, 0) < 2) continue;
        groups.sort((a, b) => b.avg - a.avg);
        const best = groups[0];
        const worst = groups.at(-1);
        lines.push({ row, kind, best, worst });
      }
    }
    if (!lines.length) return h("div", { className: "an-box" }, h("h3", {}, this.t("anTiming")), h("p", { className: "hint" }, this.t("anTimingEmpty")));
    return h(
      "div",
      { className: "an-box" },
      h("h3", {}, this.t("anTiming")),
      lines.slice(0, 6).map(({ row, kind, best, worst }) =>
        h(
          "div",
          { className: "an-timing" },
          h("strong", {}, `${kind === "planted" ? this.t("ev_planted") : this.t(`ev_${kind}`)} · ${row.name}`),
          h("div", { className: "an-cmp" }, h("span", {}, monthName.format(new Date(2025, best.month - 1, 15))), h("i", { className: "good", style: "width:100%" }), h("span", {}, `${this._quantity(best.avg, row.unit)}/${this.t("anPlantShort")}`)),
          h("div", { className: "an-cmp" }, h("span", {}, monthName.format(new Date(2025, worst.month - 1, 15))), h("i", { style: `width:${Math.max((worst.avg / best.avg) * 100, 4)}%` }), h("span", {}, `${this._quantity(worst.avg, row.unit)}/${this.t("anPlantShort")}`)),
          h("span", { className: "sub" }, this.t("anSeasons", { a: best.n, b: worst.n })),
        ),
      ),
      h("p", { className: "hint" }, this.t("anTimingHint")),
    );
  }

  /** Average season rating by the moon phase at sowing (or planting), with how many cases. */
  _moonBox() {
    const group = { new_moon: "new", waxing_crescent: "waxing", first_quarter: "waxing", waxing_gibbous: "waxing", full_moon: "full", waning_gibbous: "waning", last_quarter: "waning", waning_crescent: "waning" };
    const stats = { new: [], waxing: [], full: [], waning: [] };
    for (const p of this._data.plantings) {
      const phase = p.sown_moon_phase || p.moon_phase;
      const start = p.sown_on || p.planted_on;
      if (!phase || !start) continue;
      const review = this._data.events.find((e) => e.kind === "review" && e.planting_id === p.id && e.rating && e.done_on.slice(0, 4) === start.slice(0, 4));
      if (review) stats[group[phase]].push(review.rating);
    }
    const total = Object.values(stats).reduce((n, list) => n + list.length, 0);
    const avg = (list) => (list.length ? list.reduce((a, b) => a + b, 0) / list.length : null);
    const values = Object.entries(stats).map(([key, list]) => ({ key, avg: avg(list), n: list.length }));
    const known = values.filter((v) => v.avg != null).map((v) => v.avg);
    const spread = known.length > 1 ? Math.max(...known) - Math.min(...known) : 0;
    return h(
      "div",
      { className: "an-box" },
      h("h3", {}, this.t("anMoon")),
      total
        ? h(
            "div",
            { className: "an-bars moon" },
            values.map((v) =>
              h(
                "div",
                { className: "an-bar" },
                h("span", { className: "sub" }, v.avg != null ? `${v.avg.toFixed(1).replace(".", ",")} ★` : "—"),
                h("i", { className: "moon", style: `height:${v.avg ? (v.avg / 5) * 90 : 0}px` }),
                h("strong", {}, this.t(`anMoon_${v.key}`)),
                h("span", { className: "sub" }, this.t("anCases", { count: v.n })),
              ),
            ),
          )
        : null,
      h("p", { className: "hint" }, !total ? this.t("anMoonEmpty") : total < 20 || spread < 0.6 ? this.t("anMoonWeak") : this.t("anMoonNote")),
    );
  }

  _lessonsBox() {
    const reviews = this._data.events
      .filter((e) => e.kind === "review" && (e.keep || e.avoid))
      .sort((a, b) => b.done_on.localeCompare(a.done_on))
      .slice(0, 8);
    if (!reviews.length) return null;
    const line = (e, text) => h("div", { className: "sub", style: "white-space:normal" }, `${e.done_on.slice(0, 4)} · ${this._targetName(e)}: ${text}`);
    return h(
      "div",
      { className: "an-box an-lessons" },
      h("h3", {}, this.t("anLessons")),
      h("div", { className: "keep" }, h("strong", {}, this.t("keep")), reviews.filter((e) => e.keep).map((e) => line(e, e.keep))),
      h("div", { className: "avoid" }, h("strong", {}, this.t("avoid")), reviews.filter((e) => e.avoid).map((e) => line(e, e.avoid))),
    );
  }

  // ---------- rotation ----------

  /** Season of a planting: its sowing or planting date, a year in its name, else its first diary entry. */
  _plantingYear(p) {
    const named = p.name.match(/\b(19|20)\d\d\b/);
    const date = p.sown_on || p.planted_on || (named ? `${named[0]}` : null) || this._data.events.filter((e) => e.planting_id === p.id).map((e) => e.done_on).sort()[0];
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
                  !due && t.next_service_on ? h("div", { className: "sub" }, `🔧 ${this._date(t.next_service_on)}${t.service_months ? ` · ${this.t("everyMonths", { count: t.service_months })}` : ""}`) : null,
                ),
                due
                  ? h(
                      "button",
                      {
                        type: "button",
                        onclick: (ev) => {
                          ev.stopPropagation();
                          this._toolServiced(t);
                        },
                      },
                      `✔ ${this.t("toolServiceDone")}`,
                    )
                  : null,
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
        this._field(f, "category", { placeholder: this.t("toolCategoryHint") }),
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
          this._field(f, "service_months", { type: "number", min: 1, max: 120, step: 1, inputMode: "numeric" }),
        ),
        f.id && f.next_service_on ? h("button", { type: "button", onclick: () => this._toolServiced(f) }, `✔ ${this.t("toolServiceDone")}`) : null,
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
      service_months: v.service_months ? Number(v.service_months) : null,
      notes: v.notes?.trim() || null,
    };
    const id = this._toolForm.id;
    if (!id && v.price) data.price = Number(v.price);
    if (await this._call(id ? "update_tool" : "add_tool", id ? { id, ...data } : data)) this._saved(data.name);
  }

  /** Service done today: the next one after the tool's interval, or none. */
  async _toolServiced(tool) {
    const next = tool.service_months ? addMonths(today(), tool.service_months) : null;
    if (await this._call("update_tool", { id: tool.id, next_service_on: next, status: "ok" })) {
      this._toolForm = null;
      this._render();
      this._showMessage(`✓ ${tool.name}${next ? ` · ${this.t("nextService", { date: this._date(next) })}` : ""}`);
    }
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
    const box = z.id ? (this._woodEl = h("div", {}, this._zoneBox(z))) : null;
    // Hen house and compost: the daily things first, the zone settings below.
    const first = ["compost", "coop"].includes(z.kind);
    return [
      first ? box : null,
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
      first ? null : box,
      z.id && !["woodland", "compost", "coop"].includes(z.kind) ? this._rotationBox(z) : null,
      z.id ? this._diaryBox({ zone_id: z.id }) : null,
      z.id ? this._lastYearsBox(this._data.events.filter((e) => e.zone_id === z.id || this._zoneDescendants(z.id).has(e.zone_id)), { zone_id: z.id }) : null,
    ];
  }
}

function capitalize(text) {
  return text ? text[0].toUpperCase() + text.slice(1) : "";
}

function addDays(iso, days) {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function addMonths(iso, months) {
  const [y, m, d] = iso.split("-").map(Number);
  const total = m - 1 + months;
  const year = y + Math.floor(total / 12);
  const month = (((total % 12) + 12) % 12) + 1;
  const last = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return `${year}-${String(month).padStart(2, "0")}-${String(Math.min(d, last)).padStart(2, "0")}`;
}

function daysBetween(from, to) {
  return Math.round((Date.parse(`${to}T12:00:00`) - Date.parse(`${from}T12:00:00`)) / 86400000);
}

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
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
