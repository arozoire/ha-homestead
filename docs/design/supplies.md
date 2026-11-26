# Supplies: feed, fertiliser, treatments

Design agreed with the maintainer; nothing is built yet. Read it before working on stocks, products or the shopping list. It can be built in three steps, each one a separate PR.

## Principle

**No daily weighing.** The user only records what they already know:
- a bag was **bought**;
- it was **opened**;
- it is **finished**.

Consumption is computed backwards from those dates. "Everything that can be computed is shown by itself" (see [ui.md](ui.md)).

## Data

### `SupplyLot` (collection `supplies`)
One row per bag, box or bottle, like a seed lot.

| Field | Example | Notes |
|---|---|---|
| `product_id` | → layer-feed product | optional: a free `name` works too |
| `name` | "Layer feed, brand X" | |
| `quantity`, `unit` | 25, kg | units: kg, g, l, ml, pieces (imperial shown via the panel helpers) |
| `bought_on`, `price`, `supplier` | 2026-07-28, 18 €, "Co-op" | a price creates a linked expense, as for seed lots |
| `opened_on`, `finished_on` | 2026-08-01, 2026-11-26 | `finished_on` empty = in use or still closed |
| `expires_on` | 2027-06-30 | **expiry date**, optional |
| `zone_id` | the coop | who uses it: a coop, an apiary, a tank, a vegetable zone, or none |
| `notes` | | |

### `Product` (collection `products`), from step 3
What a product is, shared by all its bags.

| Field | Example |
|---|---|
| `name`, `brand` | "Organic tomato fertiliser", brand Y |
| `kind` | feed, fertiliser, treatment, bee_feed, fish_feed, bedding, other |
| `npk` | [6, 4, 12] (fertiliser) |
| `organic` | true = allowed in organic gardening |
| `dose`, `dose_unit` | 50 g/m², 30 g/10 L, per plant |
| `active_ingredient`, `copper_percent` | copper oxychloride, 20 % |
| `pre_harvest_days` | 7 (**pre-harvest interval**, from the label) |

Events of kind fertilizing or treatment get an optional `product_id`. The free `product` text stays for older entries and quick notes.

## Step 1: consumption computed backwards

For every finished lot, compute:
- `per_day = quantity / days(opened_on → finished_on)`, also shown per week;
- **per animal**, when the zone has animals: divide by the average number of animals over that period, using the existing arrivals/departures logic (the same "hen-days" used for eggs per hen).

Show the trend per period, one point per finished bag, with the season visible (hens eat more in winter).

Example: 25 kg opened 1 Aug, finished 26 Nov.
- 117 days → **214 g a day, 1.5 kg a week**.
- With 6 hens → **~36 g per hen per day**.

Where it shows:
- a **Supplies** box in the zone card (coop, apiary, tank);
- a list under *More → Supplies*;
- in Analysis: consumption per period, and the **real cost per egg** (€ per kg × kg per day ÷ eggs per day), replacing the estimate from linked expenses when bag data exist.

Also:
- **Unusual consumption**: a period 30 % above the average for the same number of animals → a hint ("rats, wild birds or a wasteful feeder?").
- **Expiry**:
  - a lot past `expires_on`, or within 30 days of it, is flagged;
  - an expired treatment shows a warning when chosen in the event form;
  - when buying, an unexpired lot of the same product that is still closed is pointed out ("you already have one").

## Step 2: forecast and shopping list

- For the open lot, take the rate of recent bags for the same zone and product, adjusted for the current number of animals.
  - This gives the **expected end date**: "runs out around 23 Mar".
  - Optional reminder: a few days before, in the morning notification.
- **Shopping list**: we already push to `todo.shopping_list`, or the first to-do list that is not ours.
  - Automatic when a lot is marked finished, or N days before the expected end. N is an option; default 10 days.
  - Item text: product, size, last price and supplier ("Layer feed 25 kg, last 18 € at Co-op").
  - **Once only**: no duplicate if the item is already on the list and not done.
  - The same for fertiliser and treatment lots.

## Step 3: products, doses and safety

- Product catalogue (above). The event form proposes the product's dose; NPK and organic status are shown in the plant and zone history.
- **Pre-harvest interval**:
  - a treatment with `pre_harvest_days` on a planting or zone, then a harvest logged earlier than the interval → a clear warning in the event form and in *Today*: "Treated on 10/06 with X: harvest from 17/06";
  - the work lists hide harvests of that crop until then.
- **Copper per year**:
  - sum the copper from treatments: dose × copper share × treated area;
  - show the total per year against the organic limit (4 kg/ha a year averaged over 7 years, 28 kg/ha in 7 years in the EU);
  - warn near the limit.
- **Fertiliser used**: estimate how much of the open lot each fertilising event used (dose × zone area, or per plant), so its expected end is known too.

## Not now

- Barcode scanning: no open database for garden products.
- Daily weighing of feed.
- Water and battery levels for the animals: they come from Home Assistant sensors (a tank level, a battery). They could be shown later in the zone card through an entity picker, but no separate tracking.

## Tests to include

- Backwards consumption: 25 kg from 1 Aug to 26 Nov gives 214 g/day. Per hen with a flock that changed size during the period.
- Forecast end date from two earlier bags.
- Shopping item added once, not twice.
- Expiry flags: expired, within 30 days, missing date.
- Step 3:
  - pre-harvest warning on the day before and the day after the interval;
  - copper total per year from two treatments on zones of known area.
