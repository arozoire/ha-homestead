// Builds custom_components/homestead/data/cropgraph.json from the @cropgraph/core npm package.
// Usage: npm install --no-save @cropgraph/core@3 zod@3 && node scripts/build_cropgraph.mjs
// CropGraph code is MIT; its crop calendar data is CC-BY-4.0 (USDA Cooperative Extension and others).
import { writeFileSync } from "node:fs";
import * as cg from "@cropgraph/core";

const key = (name) =>
  name.toLowerCase().replace(/\s[x×]\s|×/g, " ").split(/\s+/).filter(Boolean).slice(0, 2).join(" ");
const ACTIONS = { start_indoors: "i", direct_sow: "s", transplant: "t", plant_now: "t" };
const ANCHORS = { last_spring: "s", first_fall: "f" };

const meta = cg.getCropCalendarMeta();
const crops = {};
const slugToKey = {};
// The plain entry of a species first (shortest slug), cultivars after.
const entries = [...cg.listCrops({})].sort((a, b) => a.slug.length - b.slug.length);
for (const c of entries) {
  const k = key(c.scientificName);
  if (!k.includes(" ")) continue;
  slugToKey[c.slug] ??= k;
  if (crops[k]) continue;
  const rotation = cg.getRotationAdvice?.(c.slug);
  crops[k] = {
    n: c.commonName,
    c: c.category,
    s: c.season,
    d: c.daysToHarvest ? [c.daysToHarvest.min, c.daysToHarvest.max] : undefined,
    t: c.minSoilTempF != null ? Math.round(((c.minSoilTempF - 32) * 5) / 9) : undefined,
    w: (c.windows || []).map((w) => [ACTIONS[w.action], ANCHORS[w.anchor], w.fromFrostDays, w.toFrostDays]),
    f: rotation?.scientificFamily || rotation?.data?.scientificFamily || undefined,
  };
}
for (const [slug, k] of Object.entries(slugToKey)) {
  const found = cg.getCompanions(slug);
  for (const rel of found?.companions || found?.data?.companions || []) {
    const other = slugToKey[rel.companion];
    if (!other || other === k) continue;
    const field = rel.type === "antagonist" ? "x" : rel.type === "beneficial" ? "g" : null;
    if (!field) continue;
    crops[k][field] = [...new Set([...(crops[k][field] || []), other])];
  }
}
const out = {
  _source: `CropGraph ${meta.version} (https://github.com/Cropgraph/cropgraph), data CC-BY-4.0: ${meta.source}`,
  _format:
    "key = 'genus species'; n common name (en); c category; s season; d days to harvest [min,max]; t min soil °C; " +
    "w windows [action i=sow indoors s=sow outdoors t=plant out, anchor s=last spring frost f=first fall frost, from, to days]; " +
    "f family; g good companions; x antagonists (keys)",
  crops,
};
writeFileSync(new URL("../custom_components/homestead/data/cropgraph.json", import.meta.url), JSON.stringify(out));
console.log(Object.keys(crops).length, "species");
