// Populates each season's `entrantCarIds` from Wikipedia's "Teams and drivers" table.
//
// For a given season year, this script:
//   1. Fetches the season article's wikitext (cached) and parses the entrant table.
//   2. Collapses rows into unique (constructor, chassis) pairs and picks the first-
//      listed chassis per constructor as that season's representative car.
//   3. Resolves each constructor to a repository team id via the curated rule table
//      in entrant-cars-resolver.mjs (same-name-different-organization cases are
//      encoded there). Constructors with no team record are skipped and logged —
//      never guessed.
//   4. Resolves driver display names to person ids via normalized exact match.
//   5. Emits a car document per (constructor, season) that doesn't already exist,
//      modeled on the 1988 reference season's non-champion template.
//   6. Updates season.entrantCarIds (champion car first) and creates one source
//      record per season backing the entrant claims.
//
// The champion car (season.championCarId) is always preserved and placed first in
// entrantCarIds. Existing cars for a (constructor, season) are reused rather than
// duplicated, so the script is idempotent.
//
// Usage:
//   node tools/content/populate-entrant-cars.mjs --years=2020-2025 [--write] [--summary]

import { readFile, writeFile, readdir } from "node:fs/promises";
import path from "node:path";
import {
  fetchSeasonWikitext,
  parseEntrantTable,
  collapseCars,
} from "./entrant-cars-parser.mjs";
import {
  resolveConstructorId,
  resolveDriverIds,
  buildPersonIndex,
  buildSeasonSurnameIndex,
  normalizeName,
} from "./entrant-cars-resolver.mjs";

const CONTENT_ROOT = "content";
const SOURCE_ID = (year) => `source-wikipedia-${year}-f1-season`;
const SEASON_ID = (year) => `season-${year}`;
const NOW_ISO = "2026-07-22T12:00:00.000Z";
const ACCESSED_ON = "2026-07-22";

async function loadDir(typeDir) {
  const dir = path.join(CONTENT_ROOT, typeDir);
  const files = (await readdir(dir)).filter((f) => f.endsWith(".json"));
  const docs = [];
  for (const f of files) {
    docs.push(JSON.parse(await readFile(path.join(dir, f), "utf8")));
  }
  return docs;
}

function normalizeChassisForSlug(chassis) {
  return String(chassis || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function shortEngine(rawEngine) {
  // The raw engine cell often looks like "Ford Cosworth DFZ 3.5 V8" or
  // "Honda RA168E 1.5 V6 t". Keep the leading brand/family token sequence but
  // drop the purely descriptive displacement/cylinders/aspiration tail, which is
  // already captured in specifications. This matches the 1988 reference density
  // ("Ford DFR", "Megatron M12/13").
  const s = String(rawEngine || "").trim();
  // Cut at the first numeric token that begins a displacement (e.g. "3.5", "1.5").
  const cut = s.search(/\b\d+(\.\d+)?\s*(V\d+|L\d+|Inline|straight|flat)/i);
  if (cut > 0) return s.slice(0, cut).trim();
  return s;
}

// ---- main ----

async function main() {
  const args = process.argv.slice(2);
  const write = args.includes("--write");
  const summaryOnly = args.includes("--summary");
  const yearsArg = args.find((a) => a.startsWith("--years="));
  if (!yearsArg) {
    console.error(
      "Usage: node populate-entrant-cars.mjs --years=2020-2025 [--write] [--summary]",
    );
    process.exitCode = 1;
    return;
  }
  const years = parseYearsArg(yearsArg.slice("--years=".length));

  // Load repository indices.
  const [teams, persons, cars, seasons, sources, standings] = await Promise.all(
    [
      loadDir("teams"),
      loadDir("people"),
      loadDir("cars"),
      loadDir("seasons"),
      loadDir("sources"),
      loadDir("standings"),
    ],
  );
  const teamById = new Map(teams.map((t) => [t.id, t]));
  const personsById = new Map(persons.map((p) => [p.id, p]));
  const personIndex = buildPersonIndex(persons);
  const seasonByYear = new Map(seasons.map((s) => [s.year, s]));
  const existingSourceIds = new Set(sources.map((s) => s.id));
  // Per-season surname index for safe surname-unique driver resolution, built from
  // driver standings so candidate names are guaranteed to be era-correct.
  const surnameIndexByYear = new Map();
  for (const standing of standings) {
    if (standing.standingKind !== "driver") continue;
    const m = standing.seasonId?.match(/^season-(\d{4})$/);
    if (!m) continue;
    const yr = Number(m[1]);
    surnameIndexByYear.set(
      yr,
      buildSeasonSurnameIndex(standing.entries, personsById),
    );
  }
  // Index existing cars by (constructorId, seasonId) -> car id, for reuse.
  const carByConstructorSeason = new Map();
  const carById = new Map(cars.map((c) => [c.id, c]));
  for (const car of cars) {
    for (const seasonId of car.seasonIds || []) {
      const key = `${car.constructorId}|${seasonId}`;
      if (!carByConstructorSeason.has(key))
        carByConstructorSeason.set(key, car.id);
    }
  }

  const report = {
    seasonsProcessed: 0,
    carsCreated: 0,
    carsReused: 0,
    sourcesCreated: 0,
    unresolvedConstructors: [], // {year, constructor, link}
    unresolvedDrivers: [], // {year, name}
    skippedSeasons: [],
  };

  const filesToWrite = new Map(); // relative path -> serialized JSON string

  for (const year of years) {
    const season = seasonByYear.get(year);
    if (!season) {
      report.skippedSeasons.push({ year, reason: "no season document" });
      continue;
    }
    const seasonId = season.id;

    let entrantRows;
    try {
      const wikitext = await fetchSeasonWikitext(year);
      entrantRows = collapseCars(parseEntrantTable(wikitext));
    } catch (err) {
      report.skippedSeasons.push({ year, reason: err.message });
      continue;
    }

    // Group by resolved constructor; pick first-listed chassis per constructor.
    // (When a constructor has multiple chassis in a season, the first one listed
    // in the source table is used as the representative. This is deterministic
    // and documented; mid-season replacements are a later enrichment.)
    const byConstructor = new Map();
    for (const row of entrantRows) {
      const teamId = resolveConstructorId({
        link: row.constructorLink,
        display: row.constructor,
        year,
      });
      if (!teamId) {
        report.unresolvedConstructors.push({
          year,
          constructor: row.constructor,
          link: row.constructorLink,
          chassis: row.chassis,
        });
        continue;
      }
      if (!byConstructor.has(teamId)) {
        byConstructor.set(teamId, row);
      }
    }

    const newCarDocs = [];
    const entrantCarIds = [];
    const championCarId = season.championCarId;

    // Champion car first (if present in repository).
    if (championCarId && carById.has(championCarId)) {
      entrantCarIds.push(championCarId);
    }

    const sourceClaims = [{ entityId: seasonId, field: "entrantCarIds" }];

    // Process constructors in stable order (by first appearance in source table).
    const orderedTeamIds = [];
    for (const row of entrantRows) {
      const teamId = resolveConstructorId({
        link: row.constructorLink,
        display: row.constructor,
        year,
      });
      if (teamId && !orderedTeamIds.includes(teamId))
        orderedTeamIds.push(teamId);
    }

    for (const teamId of orderedTeamIds) {
      const row = byConstructor.get(teamId);
      const team = teamById.get(teamId);
      if (!team) continue; // resolved id not in repo — shouldn't happen, but guard.

      // Reuse an existing car for this (constructor, season) if one is present
      // (e.g. the champion car or a previously-authored record).
      const reuseKey = `${teamId}|${seasonId}`;
      let carId = carByConstructorSeason.get(reuseKey);
      let reused = Boolean(carId);

      if (!carId) {
        const chassisSlug = normalizeChassisForSlug(row.chassis);
        const candidateId = `car-${team.slug}-${chassisSlug}`;
        if (
          carById.has(candidateId) ||
          newCarDocs.some((c) => c.id === candidateId)
        ) {
          carId = candidateId;
          reused = true;
        } else {
          carId = candidateId;
        }
      }

      if (reused) {
        report.carsReused += 1;
      }

      // Resolve drivers for this constructor's chassis.
      const { ids: driverIds, unresolved } = resolveDriverIds(
        row.drivers,
        personIndex,
        surnameIndexByYear.get(year),
      );
      for (const name of unresolved) {
        report.unresolvedDrivers.push({ year, name, car: row.chassis });
      }

      if (!reused) {
        const teamZh = team.title?.zh || team.title?.en || team.slug;
        const teamEn = team.title?.en || team.slug;
        const carTitleZh = `${teamZh} ${row.chassis}`;
        const carTitleEn = `${teamEn} ${row.chassis}`;
        const engineShort = shortEngine(row.engine) || row.engine || "—";
        const carDoc = {
          schemaVersion: 1,
          type: "car",
          id: carId,
          slug: `${team.slug}-${normalizeChassisForSlug(row.chassis)}`,
          status: "published",
          title: { zh: carTitleZh, en: carTitleEn },
          summary: {
            zh: `${carTitleZh} 是${teamZh}为 ${year} 赛季打造的 F1 赛车。动力单元为 ${engineShort}。`,
            en: `${carTitleEn}, the Formula One car ${teamEn} entered in the ${year} season. Powered by ${engineShort}.`,
          },
          sourceIds: [SOURCE_ID(year)],
          updatedAt: NOW_ISO,
          seasonIds: [seasonId],
          constructorId: teamId,
          driverIds,
          technologyIds: [],
          engine: engineShort,
          specifications: {
            chassis: { zh: `${carTitleEn} 底盘`, en: `${carTitleEn} chassis` },
            engine: { zh: `${engineShort} 引擎`, en: `${engineShort} engine` },
          },
          blocks: [
            {
              id: `${team.slug}-${normalizeChassisForSlug(row.chassis)}-story`,
              type: "richText",
              heading: { zh: "赛车简介" },
              content: {
                zh: `${carTitleZh} 是${teamZh}为 ${year} 赛季打造的 F1 赛车，动力单元为 ${engineShort}。它是当年参赛阵容的一员，反映了所在年代的规则与技术水平。`,
              },
            },
          ],
        };
        newCarDocs.push(carDoc);
        carById.set(carId, carDoc);
        carByConstructorSeason.set(reuseKey, carId);
        report.carsCreated += 1;
      }

      if (!entrantCarIds.includes(carId)) entrantCarIds.push(carId);
      sourceClaims.push({ entityId: carId, field: "specifications" });
    }

    // Update season document.
    const updatedSeason = { ...season, entrantCarIds };
    filesToWrite.set(
      path.join("seasons", `season-${year}.json`),
      JSON.stringify(updatedSeason, null, 2) + "\n",
    );

    // Queue new car files.
    for (const car of newCarDocs) {
      filesToWrite.set(
        path.join("cars", `${car.id}.json`),
        JSON.stringify(car, null, 2) + "\n",
      );
    }

    // Create per-season source record (if not already present).
    if (!existingSourceIds.has(SOURCE_ID(year))) {
      const sourceDoc = {
        schemaVersion: 1,
        type: "source",
        status: "published",
        id: SOURCE_ID(year),
        slug: `wikipedia-${year}-f1-season`,
        title: {
          zh: `维基百科：${year} 年一级方程式世界锦标赛`,
          en: `Wikipedia: ${year} Formula One World Championship`,
        },
        summary: {
          zh: `${year} 赛季参赛阵容、赛历与分站结果的综合参考条目。`,
          en: `Comprehensive reference for the ${year} season entrants, calendar, and results.`,
        },
        sourceType: "article",
        url: `https://en.wikipedia.org/wiki/${year}_Formula_One_${
          year <= 1980 ? "season" : "World_Championship"
        }`,
        publisher: "Wikipedia",
        sourceIds: [SOURCE_ID(year)],
        blocks: [],
        updatedAt: NOW_ISO,
        accessedOn: ACCESSED_ON,
        supportedClaims: sourceClaims,
      };
      filesToWrite.set(
        path.join("sources", `${SOURCE_ID(year)}.json`),
        JSON.stringify(sourceDoc, null, 2) + "\n",
      );
      existingSourceIds.add(SOURCE_ID(year));
      report.sourcesCreated += 1;
    }

    report.seasonsProcessed += 1;
    if (!summaryOnly) {
      console.log(
        `${year}: ${entrantCarIds.length} entrant cars ` +
          `(${newCarDocs.length} new, ${entrantCarIds.length - newCarDocs.length} reused)` +
          (championCarId ? ` [champion ${championCarId}]` : ""),
      );
    }
  }

  // Report unresolved entities (surface, don't silently drop).
  if (report.unresolvedConstructors.length > 0) {
    const unique = new Map();
    for (const c of report.unresolvedConstructors) {
      const k = `${c.year}|${c.link}`;
      if (!unique.has(k)) unique.set(k, c);
    }
    console.log(
      `\nUnresolved constructors (${unique.size} entries — skipped, no team record):`,
    );
    for (const c of [...unique.values()].slice(0, 60)) {
      console.log(
        `  ${c.year} ${c.link || c.constructor} (chassis: ${c.chassis})`,
      );
    }
    if (unique.size > 60) console.log(`  ... and ${unique.size - 60} more`);
  }
  if (report.unresolvedDrivers.length > 0) {
    const unique = new Set(
      report.unresolvedDrivers.map((d) => `${d.year}|${d.name}`),
    );
    console.log(
      `\nUnresolved drivers (${unique.size} unique names — car docs created with empty driverIds):`,
    );
    for (const key of [...unique].slice(0, 40)) {
      const [y, n] = key.split("|");
      console.log(`  ${y} ${n}`);
    }
    if (unique.size > 40) console.log(`  ... and ${unique.size - 40} more`);
  }
  if (report.skippedSeasons.length > 0) {
    console.log(`\nSkipped seasons:`);
    for (const s of report.skippedSeasons)
      console.log(`  ${s.year}: ${s.reason}`);
  }

  console.log(
    `\nSummary: ${report.seasonsProcessed} seasons processed, ` +
      `${report.carsCreated} cars created, ${report.carsReused} reused, ` +
      `${report.sourcesCreated} sources created.`,
  );

  if (!write) {
    console.log(
      "\n(dry run — no files written. Re-run with --write to apply.)",
    );
    return;
  }

  for (const [relPath, content] of filesToWrite) {
    const full = path.join(CONTENT_ROOT, relPath);
    await writeFile(full, content, "utf8");
  }
  console.log(`\nWrote ${filesToWrite.size} files.`);
}

function parseYearsArg(arg) {
  const out = [];
  for (const part of arg.split(",")) {
    const trimmed = part.trim();
    const m = trimmed.match(/^(\d{4})-(\d{4})$/);
    if (m) {
      const a = Number(m[1]);
      const b = Number(m[2]);
      for (let y = Math.min(a, b); y <= Math.max(a, b); y++) out.push(y);
    } else if (/^\d{4}$/.test(trimmed)) {
      out.push(Number(trimmed));
    }
  }
  return out.sort((a, b) => a - b);
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (invokedPath === path.resolve(new URL(import.meta.url).pathname)) {
  await main();
}
