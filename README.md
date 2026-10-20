<p align="center"><img src="https://raw.githubusercontent.com/arozoire/ha-homestead/main/custom_components/homestead/brand/icon.png" width="128" alt="HA Homestead"></p>

# HA Homestead

**English** · [Italiano](README.it.md)

A Home Assistant integration to manage your vegetable garden, orchard and garden: plants, fruit trees, beds, a diary, expenses, tools, seeds, harvests and weather-aware advice.

> Status: **v0.13** (see *What it does today*). Full specification in [SPEC.md](SPEC.md) (Italian).

## Guiding principle

**Keep Home Assistant clean**: no areas created, few aggregated entities, clean removal (uninstalling the integration deletes its data).

## What it does today (v0.13)

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
| Weather | Each event records the weather of the week before (+3 days after for treatments and sowing): mean/min/max temperature, humidity, rain, soil moisture. From your sensors (HA long-term statistics, chosen in *Configure*), the rest from Open-Meteo (free, no account) |
| Planned tasks | *📋 To do* in the Diary tab and in the plant card: type, plant or zone, date, *every year*; ✔ opens the diary event already filled in. Services `add_task`, `update_task`, `delete_task`, `complete_task` |
| Phone reminders | Time and phones in *Configure*; tap → prefilled diary form; ✔ Done from the notification |
| HA to-do and calendar | `todo.ha_homestead_garden_tasks` (ticking = recording it in today's diary; items can be added from the HA app) and `calendar.ha_homestead_garden` (planned tasks + ✔ done events) |
| Start of the plant | The diary shows sowing, planting/transplanting or "there for ~N years" at the bottom (from the plant data) |
| Convenience | 🗺️ in the header hides/shows the map; *+ Harvest* (repeats the last quantity), *🔁 Repeat next year* (new crop with the same species, variety and zone) |
| Expenses | *Expenses* tab (expenses, revenue, balance) in the panel (yearly total by category, edit, delete) or services `add_expense`/`update_expense`/`delete_expense`; the price of plants and tools becomes an expense; in the plant card: total spent + *+ Expense* |
| Tools | *Tools* tab (status in colour, 🔧 service overdue) or services `add_tool`/`update_tool`/`delete_tool` |
| Photos | In the plant card: *📷 Add photo* (phone camera or gallery), reduced to 1600 px and stored in `/media/homestead/`; visible only to HA users |
| "No map" background | From the layer picker: zoom up to level 23 to work inside a bed |
| Menu | 📓 Diary (opens first), 📅 Calendar, 🗺️ Map (Plants / Zones), 📈 Analysis, ⋯ More (Seeds, Expenses, Tools, Settings, Backup, Reset everything); at the bottom on phones, at the top on computers; the map only in the Map tab and the plant/zone cards |
| 📓 Quick diary | 14-day weather with alerts and tasks, this week's to-dos, buttons 🍅 Harvest, 🥚 Eggs, 💧 Watering, 📝 Note; plants *Harvesting now* and *Recently updated* with one-tap **+ Harvest** (last quantity, − / +, ✔), search; the full diary with filters below |
| 🔁 Repeat the vegetable garden | Map tab: last year's annual crops to tick (rating and "avoid" shown) become new plants with the same zone and variety |
| 🔧 Tool service | *Service every (months)* + next date; ✔ Service done moves the next one; in the Calendar (Tools group and the 2-week cards) and a phone reminder on the day |
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
| Seeds | *Seeds* tab: species, variety, year, supplier, quantity; warning when they age (typical life per family, editable); the lot is chosen in the sown plant. Services `add_seed_lot`, `update_seed_lot`, `delete_seed_lot` |
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
| Backup | At the bottom of the list: *💾 Export* downloads a JSON file with everything; *📂 Restore* (admins only) replaces all data with the file's, after confirmation |

Species: plants only (kingdom Plantae); species already imported are found without internet too; online searches are kept in memory for 24 h. Home Assistant must be able to reach `api.gbif.org` and `www.wikidata.org` (open data, no account).

The data is also in the Home Assistant backups (`.storage/homestead.data`); the panel backup is for moving or restoring it by hand.

Maps: **Esri World Imagery** satellite (free, no account or ads) and **OpenStreetMap**. Leaflet ships with the integration, no library is downloaded from a CDN; only the map tiles come from the internet.

### Settings

*Settings → Devices & services → HA Homestead → **Configure*** (or ⚙️ at the top of the panel):

| Setting | Default |
|---|---|
| Weather sensors (temperature, humidity, rain, soil moisture) | none: Open-Meteo is used |
| **Send reminders to** (one or more `notify.mobile_app_…`) | none: no notifications |
| **Reminder time** | 08:00 |
| **Weather forecast** (an HA weather entity, e.g. Met.no) | none: Open-Meteo is used |
| **Frost and heat alerts on phones** | only with a task planned on those days |
| Heat wave: maximum / night minimum / days in a row | 35 °C / 22 °C / 3 |
| Extreme heat: maximum (even one day) | 40 °C |

Every day at the chosen time a notification arrives for each task planned for today (plus a summary of overdue tasks). **Tapping** it opens the panel on the prefilled diary form; the **✔ Done** button records it in the diary right away.

Entities created: `sensor.ha_homestead_plantings`, `sensor.ha_homestead_expenses_this_year`, `sensor.ha_homestead_tools_needing_service`, `todo.ha_homestead_garden_tasks`, `calendar.ha_homestead_garden` (all under a single "HA Homestead" device).

## Data sources

| Data | Source | Licence |
|---|---|---|
| Species (names, family, pictures) | [Wikidata](https://www.wikidata.org), [GBIF](https://www.gbif.org), [Wikimedia Commons](https://commons.wikimedia.org) | CC0 / CC-BY / licences of the Commons files |
| Crop calendar, companions, families | [CropGraph](https://github.com/Cropgraph/cropgraph) (USDA Cooperative Extension and others), extracted into `data/cropgraph.json` with `scripts/build_cropgraph.mjs` | code MIT, data **CC-BY-4.0** |
| Base crop table (~85 species) | indicative values for a temperate climate, written for this project | MIT |
| Weather | your sensors, the HA weather entity, [Open-Meteo](https://open-meteo.com) | CC-BY-4.0 (Open-Meteo) |

## Installation (HACS, custom repository)

1. HACS → ⋮ menu → *Custom repositories* → `https://github.com/arozoire/ha-homestead`, category *Integration*.
2. Install **HA Homestead** and restart Home Assistant.
3. *Settings → Devices & services → Add integration → HA Homestead*.

## Development

```bash
pip install -r requirements_test.txt ruff
ruff check custom_components tests
pytest
```

## Roadmap

v1 plants + map + expenses + tools → v2 diary and calendar → v3 seeds and rotations → v4 weather and harvest with a season index → v5 analysis and publication. Details in [SPEC.md](SPEC.md) (Italian).
