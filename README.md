<p align="center"><img src="https://raw.githubusercontent.com/arozoire/ha-homestead/main/custom_components/homestead/brand/icon.png" width="128" alt="HA Homestead"></p>

# HA Homestead

**English** · [Italiano](README.it.md)

<p align="center"><a href="https://www.buymeacoffee.com/arozoire" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" height="40"></a></p>

A Home Assistant integration to manage your vegetable garden, orchard and garden: plants, fruit trees, beds, a diary, expenses, tools, seeds, harvests and weather-aware advice.

> Status: **v0.19** (see *What it does today*). Full specification in [SPEC.md](SPEC.md) (Italian).

## Ask your AI assistant

ChatGPT, Claude, Gemini or Perplexity can help you install and configure HA Homestead: point them to **[docs/ai-assistant.md](docs/ai-assistant.md)** (what it does, setup steps, and the CSV format if you already have a list of plants or seeds to import).

## Guiding principle

**Keep Home Assistant clean**: no areas created, few aggregated entities, clean removal (uninstalling deletes its data from HA; your photos stay in the media folder with a last backup).

## What it does today

| Feature | How |
|---|---|
| Zones (beds, orchard, greenhouse) | Drawn by clicking in the panel; services `add_zone`, `update_zone`, `delete_zone`; internal hierarchy, area computed from the polygon |
| "Garden" panel | Sidebar entry: satellite map, plants and zones, backup |
| Plants and trees | Services `homestead.add_planting`, `update_planting`, `delete_planting`; `add_planting` (single or group, form at planting, height, rootstock, position, price) |
| Species | "Species" field searching **GBIF** and **Wikidata** (common or scientific name); the chosen species is imported and stored locally (common names it/fr/en, family, genus). Service `homestead.import_taxon` |
| Plant dates | Origin: *already there* (estimated age), *planted by me* (planting date + age at planting), *sown by me* (sowing + transplanting); the age updates by itself |
| Moon phase | Recorded automatically at sowing and planting |
| Diary | *Diary* tab (filters by type, zone, year) and a *Diary* section in the plant and zone cards: pruning, fertilising, watering, treatment, sowing, harvest (quantity), grafting, problem, note; automatic moon phase; photos; an event on a zone applies to all its plants; optional cost and revenue become linked transactions. Services `add_event`, `update_event`, `delete_event` |
| Seasons | In the plant card, *📊 Seasons*: one row per year (and per crop of the same species) with sowing, transplanting, pruning with moon and weather, treatments, harvest, ⭐ rating, ✅ repeat / ❌ avoid |
| Season review | *⭐ Season review* event (rating 1–5, harvest poor/normal/abundant, repeat, avoid); asked right after *🏁 End of crop* and, from September, in the plant card |
| Weather | Each event records the weather of the week before (+3 days after for treatments and sowing): mean/min/max temperature, humidity, rain, soil moisture, soil temperature and EC (an Ecowitt WH52, for example). From your sensors — the soil ones can also be set per zone (zone form, *Soil sensors of this zone*; empty = the zone above, then the general ones) — (HA long-term statistics, chosen in *Configure*), the rest from Open-Meteo (free, no account) |
| Planned tasks | *📋 To do* in the Diary tab and in the plant card: type, plant or zone, date, *every year*; ✔ opens the diary event already filled in. Services `add_task`, `update_task`, `delete_task`, `complete_task` |
| 🗓️ Jobs of the weekend | In the Calendar, *What do I do…*: pick a job (✂️ pruning, 🌿 feeding, 🍎 harvest, 🌱 sowing) and a period (weekend, week, month): the plants whose crop data has that job now and that are not done yet this season (seed lots to sow, for sowing), with the weather of each day; the other plants fade on the year line. **Create list task**: one task with all of them, one notification; in the To do you tick them one by one (each tick writes the diary of that plant; a harvest asks the quantity, a seed lot opens the sowing form), *All done*, *＋ Add*, *↪ Reschedule* (tomorrow, next weekend or a date: the ones not done yet go to a new task). Services `add_task` with `planting_ids` / `seed_ids`, `complete_task` with `items`, `postpone_task` |
| 📸 Photos over the years | *More → Zone photos*: pick zones and single plants (a plant that dies leaves the plan by itself) and **periods** (early / mid / late of a month, 14 days each) or *every N weeks*. Each period opens one list task (one notification, again 3 days before the end); **📸 Take** opens the live camera with the previous photo shown through (adjustable transparency) to keep the same framing, or the phone camera at full resolution. Originals are kept **uncompressed** in the HA media folder chosen in the options (a NAS added in *Settings → System → Storage* works), with a small copy for the lists. In the zone and plant cards, *📸 Over the years*: years × periods grid, **↔ Compare** two photos with a slider, **▶ Timelapse**, download the original. Service `set_photo_plan` |
| 📐 Zone in plan | *📐 In plan* on the zone card (or tapping a zone): the zone as a technical drawing in metres, grid down to 10 cm. **📏 Sides**: type the real lengths; **↺ ↻ ▭ Align**: turn the drawing (15° steps, or the longest side flat; north arrow, remembered per zone); **▦ Bed**: a rectangle measured from the corner of the zone, or **drawn** corner by corner (snapped to the grid and to existing corners); **🌱 Plant**: one plant, **a row** (a group along a line) or **fill a bed** (how many fit, staggered). Drag plants to move them, they snap to the grid; each plant shows the **icon of its crop** (🍅 🥕 🧅 🫘 🍓 …) with a **ring coloured by group** — same crop, variety and planting date, so a tomato planted two weeks later is another colour — and **🏷️ Legend** lists the groups (tap one to light it up); **✂️ Split** a group (×8) into single plants, as many as you choose, laid along its row to drag into place; the spread circle comes from the crop card. **🤝 Bad neighbours** within 1 m (CropGraph companions) and **🐝 pollinators** of self-sterile fruit trees (only when the variety is known; kiwi males) |
| 💧 Water | *How it is watered* on zones and plants (rain only, can, hose, drip, from above, valve). **Water balance** per zone, nothing to fill in: rain minus evaporation (Open-Meteo ET₀) since the last watering, the zone's soil moisture sensors win (several are averaged); a pot or a young tree can have its own sensors too; bars of the last 14 days on the zone card, one tap logs the watering. **🌳 Young trees**: trees, shrubs and vines followed for 2 years from planting out (or transplanting), not from their age. Morning reminder *to water today* |
| ✨ Today in the garden | In the Diary, all computed: water per zone, young trees, **cold hours** since 1 November (with the need of each fruit species on its card), **degree days** since January compared with last year, **daylight** (long-day onions), **can it go out?** for seed lots and seedlings (soil from the sensor or the Open-Meteo forecast, nights, a better day), pests that usually arrive now, treatments to judge |
| 🐛 Pests | Event *Problem* with what and how bad; *Treatment* with *did it work?* (asked 10 days later). On the plant card the problems of that crop over the years; after two years the degree days at which they arrive |
| 🌰 Own seeds, 🔁 succession, 🔄 next year | *🌰 Collect the seeds* from a plant → seed lot linked to its mother plant, and the **line** of the variety (germination and harvest per plant, generation by generation). *🔁 Succession sowing* from a seed lot: a task that comes back every N weeks until a date. *🔄 The garden next year*: on a vegetable zone (September–March) the family proposed for each bed after the last 3 years |
| 📄 The year in one page | *More → The year in one page*: harvest, eggs, balance, new plants, best harvests, weather, pests, what to repeat and avoid; *🖨️ Print* |
| Phone reminders | Time and phones in *Configure*; tap → prefilled diary form; ✔ Done from the notification |
| HA to-do and calendar | `todo.ha_homestead_garden_tasks` (ticking = recording it in today's diary; items can be added from the HA app) and `calendar.ha_homestead_garden` (planned tasks + ✔ done events) |
| Start of the plant | The diary shows sowing, planting/transplanting or "there for ~N years" at the bottom (from the plant data) |
| Convenience | 🗺️ in the header hides/shows the map; *+ Harvest* (repeats the last quantity), *🔁 Repeat next year* (new crop with the same species, variety and zone) |
| Expenses | *Expenses* tab (expenses, revenue, balance) in the panel (yearly total by category, edit, delete) or services `add_expense`/`update_expense`/`delete_expense`; the price of plants and tools becomes an expense; in the plant card: total spent + *+ Expense* |
| Tools | *Tools* tab (status in colour, 🔧 service overdue, 💶 total cost: purchase + linked expenses, and cost per year) or services `add_tool`/`update_tool`/`delete_tool` |
| Photos | In the plant card: *📷 Add photo* (phone camera or gallery), reduced to 1600 px and stored in `/media/homestead/`; visible only to HA users |
| "No map" background | From the layer picker: zoom up to level 23 to work inside a bed |
| Menu | 📓 Diary (opens first), 📅 Calendar, 🗺️ Map (Plants / Zones), 📈 Analysis, ⋯ More (Seeds, Expenses, Tools, Settings, Backup, Reset everything); at the bottom on phones, at the top on computers; the map only in the Map tab and the plant/zone cards |
| 📓 Quick diary | 14-day weather with alerts and tasks, this week's to-dos, buttons 🍅 Harvest, 🥚 Eggs, 💧 Watering, 📝 Note; plants *Harvesting now* and *Recently updated* with one-tap **+ Harvest** (last quantity, − / +, ✔), search; the full diary with filters below |
| 🔁 Repeat the vegetable garden | Map tab: last year's annual crops to tick (rating and "avoid" shown) become new plants with the same zone and variety |
| 🔧 Tool service | *Service every (months)* + next date; ✔ Service done moves the next one (optional cost → expense linked to the tool); in the Calendar (Tools group and the 2-week cards) and a phone reminder on the day |
| Automatic plant type | From the species: tree, fruit tree, shrub, climber by genus (apple, hazel, vine, oak…), vegetable/herb/flower from the CropGraph category; proposed when choosing the species and with 🏷️ *Fill in missing types* for existing plants |
| Dead or removed plants | Hidden from the map and the Map tab list; *Show dead or removed plants* to see them again (they stay in the diary and the analysis) |
| 🌱 Seedbed | Zone of type *Seedbed*; from the Seeds tab *🌱 Sow* (how many seeds, where, what to expect from past years and the age of the lot); in the Diary *🌱 In the seedbed*: days since sowing, *late* compared to past years, *ready to transplant*; *🌿 Germinated* (date and how many → days and germination %); *↪️ Transplant* all or part (the part becomes a new plant), warning if a cold night is coming; Analysis *Germination over the years* |
| Tap on a zone | On the map: *+ Plant here* at the tapped point, *🌱 Sow here* on the seedbed, *Transplant from the seedbed*, *+ Event*, *Zone card* |
| 🏁 End of a plant | Reason: ✅ finished (then the season review), 💀 died (cause: frost, drought, disease, pests, animals), 🗑️ removed; Analysis *💀 Losses over the years* |
| 🪴 Houseplants | *Indoor* zone per room; per plant *water every N days* (slower in winter) or a soil moisture sensor, *fertilise every N weeks* (March–September), repotting proposed in spring (fields shown only for plants in an indoor zone); in the Diary the *to water* round per room with a single **💧 Watered**, *🏖️ away until* to know what to water before leaving; morning reminder |
| 🩺 Care notes | For each plant, below the crop sheet, a collapsed *Care* box for your own notes (when to prune, what it likes, what went wrong) |
| 🔥 Firewood | *Wood burned* at the end of winter (quintals, steres or m³): woodpile, seasoned wood (18 months), use per winter with frost days, how much is needed for next winter and how much to cut |
| 🌍 Languages | Italian, English, French, German, Spanish, Dutch (panel, services, settings, notifications) |
| 🗑️ Reset everything | In *More*, administrators only, by typing RESET: deletes data and photos, keeps settings and weather history |
| 📅 Calendar | 📅 button at the top: instead of the map, *To do in the next 2 weeks* (large cards with a weather verdict, overdue in red, ✔), alerts, weather; the **year as a continuous line** with a *today* line on the right day, plants grouped by zone (groups open and close), planned tasks as pills on their date, woodland work; *📜 History*: per year, the events done on their date below the extreme weather (frost, heat waves, hail, heavy rain) |
| 📈 Analysis | Full-width tab: a box per year (season index, kg, balance, extreme weather); harvests per crop and zone over the last 5 years, **Total or Per plant** (10 tomatoes one year, 15 the next), colour = yield per plant compared with previous years + season rating, cost per kg; harvest and weather of the chosen crop; pruning or planting month compared; moon phase at sowing vs rating (with a warning when data is thin); lessons (repeat / avoid); eggs per year |
| ♻️ Compost | Zone of type *Compost bin*: only *turn* and *harvest* events (quality ★1–5 and notes, no kg); after 4 weeks without turning: a hint in the Diary and the Calendar, a phone notification (then once a week) |
| 🐔 Chicken coop | Zone of type *Coop*: quick **+ Eggs** with date (also past days) and count; hens as a flock with *+ Arrival* (number, breed, price) and *− Departure* (number, reason: fox, disease, old age, sold…); current hens computed; eggs over the last 7 days, month, year, per hen, cost per egg (from feed and care expenses); eggs do not fill the Diary or the HA calendar |
| Frost and heat alerts | Frost below each plant's hardiness (young or tender plants from 0 °C), heat wave (3 days with max ≥ 35 °C **and** min ≥ 22 °C), extreme heat (≥ 40 °C), too hot for cool-season crops; box in the Diary, sensor `sensor.ha_homestead_weather_alerts`, phone notification as chosen: never, only with a task planned on those days, always |
| Weather rules | For each planned task: treatment (rain within 48 h, wind, heat), pruning (frost in the following days, rain), sowing (cold nights for warm-season crops), watering (rain coming)… with the nearest good day; also in the phone reminder |
| Frost dates and history | Computed from your sensors (HA statistics), Open-Meteo for the missing years; used to adapt the crop calendar |
| Extended crop calendar | ~1,350 species from CropGraph with dates adapted to your frosts, family and companions (🤝 good with / 🚫 keep away from, ✓ those already in the garden) |
| CSV import | *Plants* and *Seeds* tabs: *📄 CSV template* downloads the file with the columns (`;` separator, opens in Excel); *📥 Import CSV* shows each row before importing: values not understood (zone, type, date dd/mm/yyyy, numbers) are fixed there, rows already present stay unticked |
| Species picture | In the species search suggestions and next to the linked species: a photo from Wikimedia Commons (Wikidata property P18); a tap opens it large; species imported earlier get it when chosen again |
| Price at creation | New plant: *Price* and *Supplier* become an expense right away |
| Plant type | Tree, fruit tree, shrub, climber, vegetable, herb, flower: icon on the map and in the list (proposed from the zone type) |
| In past years | *📅 In past years, at this time* box (plant, zone and Diary cards); in the event form *↩️ Last time* with date, quantity, moon, weather and season rating |
| Zone work | Tillage, weeding, mulching, mowing: one event on the zone (e.g. the whole vegetable garden) |
| Balance | *Expenses* tab: chosen year (or all), expenses, revenue, balance, month by month, per plant |
| Woodland and firewood | Zone of type *Woodland* with its main tree species; events clearing, wood cutting (species, quantity in quintals, steres or m³), brushwood, foraging (mushrooms, chestnuts…); firewood per year in the zone card |
| Seeds | *Seeds* tab: species, variety, year, supplier, quantity; warning when they age (typical life per family, editable); the lot is chosen in the sown plant. Filters (search, year, genus, supplier, to use/finished) and *☑ Select* for several lots at once: *🌱 Sow* (one sowing per lot, same zone and date), *📋 Plan* (one sowing task with the list), *✔ Finished*, *🗑️ Delete*. Services `add_seed_lot`, `update_seed_lot`, `delete_seed_lot` |
| Rotation | Advice in the plant form if the same family was in the same zone in the last 3 years; crops per year in the zone card |
| Shopping list | 🛒 from seeds and fertiliser/treatment products → the HA shopping list (`todo.shopping_list`) |
| Crop data | Plant card *🌿 Crop sheet*: exposure, hardiness, spacing, months for sowing, planting, flowering and harvest (base table of ~85 species, indicative values for a temperate climate; *✏️ Correct* saves your values). In the Diary *📆 This month*: seeds to sow, seedlings to plant out, harvests. Services `set_crop_profile`, `delete_crop_profile` |
| Export | Service `homestead.export` (response with all the data) |

### "Garden" panel

| Action | How |
|---|---|
| New plant | *+ New plant* → click on the map → fill in name and species |
| Place an existing plant | Click the plant marked "not on the map" in the list → click on the map |
| Move | Select the plant → drag the marker |
| Status | Green = active, red = dead, grey = removed |
| New zone | *Zones* tab → *+ New zone* → click the corners → *Done* → name and type |
| Zone of a plant | Proposed automatically when the plant falls inside a polygon (the smallest zone) |
| Backup | In *More*: *💾 Export JSON* downloads all the data and the links to the photos (not the photo files); *🗜️ Export with photos (.zip)* adds every photo file, originals included (it can be large); *📂 Restore* (admins only) takes either file and replaces all data, after confirmation. From a .zip the photos come back too, into the local media folder if the original one (a NAS) is not there |

Species: plants only (kingdom Plantae); species already imported are found without internet too; online searches are kept in memory for 24 h. Home Assistant must be able to reach `api.gbif.org` and `www.wikidata.org` (open data, no account).

The data is also in the Home Assistant backups (`.storage/homestead.data`), the photos too if the backup includes the media folder (not a NAS). Removing the integration deletes its data from HA but **keeps the photos** in the media folder, with a last backup next to them (`homestead/homestead-last-backup.json`): adding the integration again shows *♻️ Garden found* in the Diary to restore everything in one tap. To remove them for good, delete the `homestead` folder from *Media*. HACS does not back anything up.

Maps: **Esri World Imagery** satellite (free, no account or ads) and **OpenStreetMap**. Leaflet ships with the integration, no library is downloaded from a CDN; only the map tiles come from the internet.

### Settings

*Settings → Devices & services → HA Homestead → **Configure*** (or ⚙️ at the top of the panel):

| Setting | Default |
|---|---|
| Weather sensors (temperature, humidity, rain, soil moisture, soil temperature, soil EC), **one or more each** (averaged; for temperature also the lowest and highest of all) | none: Open-Meteo is used |
| **Send reminders to** (one or more `notify.mobile_app_…`) | none: no notifications |
| **Reminder time** | 08:00 |
| **Weather forecast** (an HA weather entity, e.g. Met.no) | none: Open-Meteo is used |
| **Frost and heat alerts on phones** | only with a task planned on those days |
| Heat wave: maximum / night minimum / days in a row | 35 °C / 22 °C / 3 |
| Extreme heat: maximum (even one day) | 40 °C |
| **Units**: as Home Assistant, metric, or imperial (°F, inches, feet, acres, lb/oz, gallons; data is stored in metric, the heat limits above are shown in °F) | as Home Assistant |

Every day at the chosen time a notification arrives for each task planned for today (plus a summary of overdue tasks). **Tapping** it opens the panel on the prefilled diary form; the **✔ Done** button records it in the diary right away.

Entities created: `sensor.ha_homestead_plantings`, `sensor.ha_homestead_expenses_this_year`, `sensor.ha_homestead_tools_needing_service`, `sensor.ha_homestead_weather_alerts`, `todo.ha_homestead_garden_tasks`, `calendar.ha_homestead_garden` (all under a single "HA Homestead" device).

## Data sources

| Data | Source | Licence |
|---|---|---|
| Species (names, family, pictures) | [Wikidata](https://www.wikidata.org), [GBIF](https://www.gbif.org), [Wikimedia Commons](https://commons.wikimedia.org) | CC0 / CC-BY / licences of the Commons files |
| Crop calendar, companions, families | [CropGraph](https://github.com/Cropgraph/cropgraph) (USDA Cooperative Extension and others), extracted into `data/cropgraph.json` with `scripts/build_cropgraph.mjs` | code MIT, data **CC-BY-4.0** |
| Base crop table (~85 species) | indicative values for a temperate climate, written for this project | MIT |
| Weather | your sensors, the HA weather entity, [Open-Meteo](https://open-meteo.com) | CC-BY-4.0 (Open-Meteo) |

## Installation

HA Homestead is in the default HACS list: no custom repository needed.

[![Open your Home Assistant instance and open this repository in HACS.](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=arozoire&repository=ha-homestead&category=integration)

1. In HACS, search for **HA Homestead** (or use the button above) and download it.
2. Restart Home Assistant.
3. *Settings → Devices & services → Add integration → HA Homestead*. A **Garden** item appears in the sidebar.

## Common questions

**How do I track my vegetable garden in Home Assistant?**
Install HA Homestead from HACS. The *Garden* panel puts your plants and beds on a satellite map, with a diary, tasks and phone reminders; no helpers or automations to write. An AI assistant can guide you through the setup ([guide](docs/ai-assistant.md)).

**Can I keep a diary of pruning, treatments and harvests with the weather and the moon phase?**
Yes: every diary event stores the moon phase and a weather snapshot of the days around it (your sensors, else Open-Meteo). Planned treatments, pruning and sowing get a weather check and the best nearby day.

**How do I manage fruit trees and an orchard in Home Assistant?**
Draw the orchard as a zone, place each tree on the map. You get the crop sheet (pruning, flowering, harvest months), frost alerts by hardiness, cold hours for fruiting, pollinator checks and two years of watering follow-up after planting.

**Can it track garden expenses and harvests?**
Yes: expenses (plants, seeds, tools, services) and sales, harvests with quantities, a yearly balance and multi-year analysis per crop and zone.

**Can I manage my seed collection and get sowing reminders?**
Yes: seed lots with age warnings, *what to sow now* from the crop calendar set on your own frost dates, succession sowing and rotation advice per bed.

**Where is my data, and how do I back it up?**
In Home Assistant: `.storage/homestead.data` (part of the normal HA backups), photos in the media folder. *More → 💾 Export JSON* or *🗜️ Export with photos (.zip)*; *📂 Restore* takes either. No cloud account.

## Development

```bash
pip install -r requirements_test.txt ruff
ruff check custom_components tests
pytest
```

## Roadmap

v1 plants + map + expenses + tools → v2 diary and calendar → v3 seeds and rotations → v4 weather and harvest with a season index → v5 analysis and publication. Details in [SPEC.md](SPEC.md) (Italian).
