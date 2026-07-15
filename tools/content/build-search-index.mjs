// Generates the client-side museum search index from the raw content files.
// Output: public/search-index.json — fetched lazily by the museum search on
// first query, so the app works fully offline / as a static export with no
// server action. Pure Node (no TS import): reads content JSON directly and
// replicates ContentRepository.search()'s haystack (titles, aliases, resolved
// relationship titles, years).
import { readFile, writeFile, readdir } from "node:fs/promises";
import path from "node:path";

const CONTENT_ROOT = path.resolve("content");
const OUT = path.resolve("public/search-index.json");

const ALLOWED_TYPES = new Set([
  "season",
  "car",
  "person",
  "technology",
  "team",
  "era",
]);
const REL_ID_FIELDS = [
  "constructorId",
  "championPersonId",
  "championCarId",
  "eraId",
  "firstSeasonId",
];
const REL_ID_LIST_FIELDS = [
  "driverIds",
  "technologyIds",
  "seasonIds",
  "teamIds",
  "personIds",
  "carIds",
  "representativeSeasonIds",
];

// Route prefix per entity type (matches src/content/canonical-href.ts).
const TYPE_PREFIX = {
  season: "/seasons",
  car: "/cars",
  person: "/people",
  technology: "/technologies",
  team: "/teams",
  era: "/museum",
};

async function readAllDocs() {
  const docs = new Map();
  for (const dir of await readdir(CONTENT_ROOT)) {
    const sub = path.join(CONTENT_ROOT, dir);
    let entries;
    try {
      entries = await readdir(sub);
    } catch {
      continue;
    }
    for (const file of entries) {
      if (!file.endsWith(".json")) continue;
      try {
        const doc = JSON.parse(await readFile(path.join(sub, file), "utf8"));
        if (doc && doc.id && doc.type) docs.set(doc.id, doc);
      } catch {
        // skip invalid
      }
    }
  }
  return docs;
}

const docs = await readAllDocs();
const isPublished = (doc) =>
  doc.type === "mediaAsset" || doc.status === "published";

function loc(text, locale) {
  if (!text) return undefined;
  if (typeof text === "string") return text;
  return text[locale] ?? text.zh ?? text.en;
}

function relationshipTerms(doc) {
  const ids = [
    ...REL_ID_FIELDS.map((f) => doc[f]),
    ...REL_ID_LIST_FIELDS.flatMap((f) => doc[f] ?? []),
  ].filter(Boolean);
  return ids
    .map((id) => docs.get(id))
    .flatMap((ref) =>
      ref ? [ref.title?.zh, ref.title?.en].filter(Boolean) : [],
    );
}

function yearTerms(doc) {
  const years = [doc.year, ...(doc.championshipYears ?? [])];
  if (doc.activeYears) years.push(doc.activeYears.from, doc.activeYears.to);
  return years.filter((y) => typeof y === "number").map(String);
}

function museumNote(doc) {
  // Light subtitle fallback for cards lacking one.
  if (doc.type === "season") return `${doc.year} 赛季`;
  return undefined;
}

const index = [];
for (const doc of docs.values()) {
  if (!ALLOWED_TYPES.has(doc.type)) continue;
  if (!isPublished(doc)) continue;
  const title = loc(doc.title, "zh");
  if (!title) continue;
  const slug = doc.slug;
  const subtitle = loc(doc.subtitle, "zh") ?? museumNote(doc);
  const prefix = TYPE_PREFIX[doc.type] ?? "/museum";
  // seasons are addressed by year, others by slug.
  const href =
    doc.type === "season" && typeof doc.year === "number"
      ? `${prefix}/${doc.year}`
      : slug
        ? `${prefix}/${slug}`
        : undefined;
  const haystack = [
    doc.title?.zh,
    doc.title?.en,
    doc.subtitle?.zh,
    doc.subtitle?.en,
    ...(doc.aliases ?? []),
    ...relationshipTerms(doc),
    ...yearTerms(doc),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  index.push({
    id: doc.id,
    slug,
    type: doc.type,
    title,
    subtitle,
    href,
    haystack,
  });
}

await writeFile(OUT, JSON.stringify(index) + "\n", "utf8");
console.log(`Wrote search index: ${index.length} entries -> ${OUT}`);
