# Panel design rules

How the "Garden" panel looks and behaves. Read this before proposing a UI change; for anything beyond a small fix, open an issue with a sketch first. Design proposals that go against these rules will be asked to change.

## Who uses it, and where

- **Mostly on a phone, outdoors**: one hand, gloves or dirty fingers, sun on the screen. A computer is the second case.
- The user wants to **log something in a few seconds** and leave. Every extra tap or field costs.
- Many users are not technical. No jargon in the interface ("sensor entity", "payload"…).

## Navigation (fixed)

- **Five sections, never more**: 📓 Diary · 📅 Calendar · 🗺️ Map · 📈 Analysis · ⋯ More. On a phone they are the bottom bar; on a computer a row under the header.
- New features go **inside** an existing section: a box in the zone or plant card, a box in the Diary, a page in More. Do not add a sixth tab.
- Shortcuts (pinned zones and modules) are the user's own row of chips under the header; do not put features there.
- **Modules** (backyard animals, bees, water and fish, woodland, houseplants, compost) can be switched off. A switched-off module must disappear from menus, zone kinds and event kinds. A new animal or zone family goes into a module, existing or new.

## Look

- **Home Assistant theme variables only**: `--primary-color`, `--primary-text-color`, `--secondary-text-color`, `--card-background-color`, `--secondary-background-color`, `--divider-color`, `--error-color`, `--warning-color`, `--success-color`, plus the panel's `--homestead-accent`. The panel must look right in light **and** dark themes. No hard-coded backgrounds.
- Semantic colours only where they mean something: green = fine / done, orange = soon / careful, red = late / problem, blue = water and rain.
- **Emoji as icons** (🍅 🐔 💧 📸…). No icon fonts, no image icons, no external assets.
- Cards: rounded corners, a thin divider border, generous spacing. Dense tables only in Analysis.
- No animations beyond what helps understanding (a bar filling, a sheet opening).

## Touch and layout

- **Touch targets at least 44 px high** (40 px for secondary buttons in a row). Big primary buttons for the main action of a screen.
- Must work at **390 px wide** without horizontal scrolling, and on a wide screen (the map sits beside the content).
- While typing, the bottom bar hides (the keyboard is up); after leaving a field it comes back with a short delay. Do not break this.
- Forms: the fewest fields possible; everything else prefilled (today's date, last unit used, the zone you came from). Optional fields go in a closed `<details>`.
- Overlays: use the existing sheet pattern (`_sheet`) for small editors, the lightbox for pictures.
- Long lists: show the recent items first and a "show older" button; never render thousands of rows.

## Words

- Short labels, plain words, one idea per line. Numbers with their unit.
- Every visible text goes through `this.t(...)` with keys in all 6 `frontend/i18n/*.json` files.
- Dates through the panel's date helper (it follows the user's HA date format); units through `deg`, `rainText`, `formatArea`… (metric or imperial).

## Behaviour

- **Show what can be computed** instead of asking for it (counts, balances, seasons, the next good day).
- Advice says **why** and **from what data** when possible ("rain 2 mm from Open-Meteo, soil sensor unavailable").
- Writes go through Home Assistant services (`call_service` with `return_response`); the panel never edits storage directly.
- Data updates arrive live; a redraw must not lose what the user is typing or where they scrolled.

## Technical constraints

- One vanilla web component in `frontend/homestead-panel.js`, built with the small `h()` helper. **No framework, no build step, no CDN**; Leaflet is vendored in `frontend/vendor/`.
- Per-device choices (shortcuts, map shown or not) live in `localStorage`, wrapped in try/catch. Choices for the whole house live in the stored data.
- Test the screens you touch at phone and computer width. A screenshot in the PR helps the review.
