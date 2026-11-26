# Crop calendars that work worldwide

Design agreed for issue #51. It covers the months to sow, plant out, harvest, prune and feed that the panel, the alerts and the work lists use. Read it before changing `crops.py`, `data/crops.json` or the climate code.

## The problem

Until 0.24 the built-in table holds **fixed months for a temperate climate** (northern Italy), shifted by the garden's frost dates. That is wrong wherever the limit is not frost:

| Garden | What limits the crops | Example |
|---|---|---|
| Milan / Turin | Winter frost | Tomatoes planted out in May, harvested July–October |
| Phoenix (hot desert) | **Summer heat**; frost rare or absent | Tomatoes in February–March and again in August; lettuce and broccoli in winter; peaches ripen in May |
| Saigon (tropical monsoon) | **Rain**: wet season and dry season; never frost | Many vegetables grown in the dry season; waterlogging and disease in the wet one |

Fixing one city at a time does not scale. The calendar must come from **what each crop needs** combined with **the garden's own climate**.

## Four layers (each one corrects the one below)

### 1. Crop needs (data, `data/crops.json`)
What the plant tolerates, not when to plant it:
- cold it survives, frost class;
- soil temperature range for sprouting;
- heat that stops fruit set or makes it bolt;
- days to harvest, and counted from what;
- how it is started (indoor weeks, direct sowing, transplant);
- life cycle (annual, biennial, perennial, grown as);
- for fruit trees: chill hours, bloom warmth, bloom-to-harvest days.

Add:
- **Water needs**: tolerates waterlogging or not, needs steady water or not. This is needed for the rain layer.
- **Practice rules** that do not come from temperature, written per species or genus, for example:
  - cherry and apricot: **summer pruning** after harvest, against gummosis and silver leaf;
  - peach: prune at the end of winter;
  - olive: prune in spring, after the last frost;
  - garlic: planted in autumn (or late winter), harvested in early summer.

Built from CropGraph (CC-BY-4.0) plus a hand-checked list of common garden crops (`scripts/build_crops.py`). Values a source does not give are marked as estimated.

### 2. The garden's climate (automatic)
Weekly normals from the weather history Homestead already loads (sensors first, then the Open-Meteo archive):
- mean max;
- mean min;
- coldest night in 9 years out of 10;
- **rain**: mean weekly total and the share of wet weeks.

A start week is good when the plant survives every night until harvest, its fruit or head forms below its heat limit, and, for crops that dislike waterlogging, it does not fall in the wettest weeks.

With less than 3 years of history, fall back to frost-anchored windows. A frost-free garden anchors on its coldest week, never on Italian dates.

### 3. Microclimate per zone (user, or learned from a sensor)
A greenhouse, a south wall or a cold hollow changes the calendar of that zone only. A setting on the zone:

| Zone climate | Effect on the normals |
|---|---|
| Open ground (default) | none |
| Unheated greenhouse / tunnel | nights about +3 °C, no rain, light frosts avoided |
| Heated greenhouse | minimum never below the temperature the user sets |
| Sheltered / south wall | +1 to +2 °C |
| Cold hollow / exposed | nights about −2 °C |
| **Measured** | the zone has its own temperature sensor: after a few weeks the offset against the outdoor sensor or archive is **computed automatically** |

The calendar of a planting uses its zone (or the nearest parent zone with a setting). The same tomato shows earlier months in the greenhouse than in the open bed.

### 4. User corrections (already exist)
`CropProfile` per species always wins, as today.

## The temperate reference table stays

The hand-made months of the current table are good for temperate gardens and must not be lost:
- When the garden's normals are close to the climate the table was made for (northern/central Italy), the curated months win, shifted by the frost dates as today.
  - "Close" means: last spring frost within about 3 weeks and summer mean max within about 3 °C. Tune it, but keep the idea.
- Elsewhere, the computed months are used.
- Species missing from the computed data keep their curated months.

## Expected results (acceptance tests)

Tests must cover at least these, with Milan-like and Phoenix-like weekly normals (see `tests/test_crop_climate.py` in the fork for the normals). A Saigon-like case should be added with the rain layer.

| Crop | Milan-like | Phoenix-like |
|---|---|---|
| Tomato | sow indoors Feb–Apr, plant out Apr–Jun, harvest Jul–Oct | plant out Feb–Mar and Aug–Oct |
| Zucchini | sow outdoors Apr–Jun | spring and late summer |
| Lettuce | spring and autumn, not mid-summer | winter |
| Garlic | plant Oct–Nov (or Feb–Mar), harvest Jun–Jul, **never "all year"** | plant in autumn, harvest late spring |
| Onion | sow Jan–Mar (indoors) or Sep, harvest Jun–Aug, not a 9-month window | autumn–winter |
| Cherry | **pruning Jul–Aug**, harvest May–Jun | — |
| Peach | pruning Feb–Mar, harvest Jun–Sep | harvest May–Jun |
| Olive | pruning Mar–Apr, **harvest Oct–Dec** | — |
| Grapevine | pruning Jan–Feb, **harvest Aug–Oct** | — |
| Tagetes, Zinnia | keep sowing and flowering months | — |

A computed window that is clearly too wide (more than about 7 months for a single sowing of an annual) is a sign of a bug.

## Who does what

| Part | Who |
|---|---|
| Layers 1–2 (needs, weekly normals, computed months), keeping the reference table | FedgarLurch, PR for #51 |
| Rain normals and water needs (tropical gardens) | Same PR if possible, or a follow-up |
| Layer 3 (microclimate per zone, learned offset from a zone sensor) | Maintainer, after #51 is merged |
| Practice rules for more species | Anyone, small PRs with a source |

## Compatibility

- The month lists stay the interface. The panel, alerts, work lists and `CropProfile` keep working, and `weeks` can be added for detail.
- Stored user data does not change; only the built-in table and its computation do.
- `heat_max_c`, `min_soil_c`, `hardiness_c`, `family`, `good`/`bad` companions, `spacing_cm`, `plant_type`, `exposure` must stay available, because other features read them.
