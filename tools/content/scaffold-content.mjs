import { access, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const ENTITY_TYPES = {
  season: { directory: "seasons", idPrefix: "season" },
  race: { directory: "races", idPrefix: "race" },
  circuit: { directory: "circuits", idPrefix: "circuit" },
  standing: { directory: "standings", idPrefix: "standing" },
  car: { directory: "cars", idPrefix: "car" },
  team: { directory: "teams", idPrefix: "team" },
  person: { directory: "people", idPrefix: "person" },
  era: { directory: "eras", idPrefix: "era" },
  technology: { directory: "technologies", idPrefix: "technology" },
  source: { directory: "sources", idPrefix: "source" },
  mediaAsset: { directory: "media", idPrefix: "media" },
};

function commonEnvelope(type, id, slug) {
  return {
    schemaVersion: 1,
    type,
    id,
    slug,
    status: "draft",
    title: { zh: "待补充标题" },
    summary: { zh: "待补充摘要。" },
    sourceIds: ["source-todo"],
    blocks: [],
    updatedAt: new Date().toISOString(),
  };
}

const TYPE_BUILDERS = {
  season(id, slug) {
    return {
      ...commonEnvelope("season", id, slug),
      year: 1950,
      eraId: "era-todo",
      highlighted: false,
      championPersonId: "person-todo",
      championCarId: "car-todo",
      raceIds: [],
      standingIds: [],
      entrantCarIds: [],
      featuredTechnologyIds: [],
    };
  },
  race(id, slug) {
    return {
      ...commonEnvelope("race", id, slug),
      seasonId: "season-todo",
      circuitId: "circuit-todo",
      round: 1,
      date: "1950-01-01",
    };
  },
  circuit(id, slug) {
    return {
      ...commonEnvelope("circuit", id, slug),
      countryCode: "XXX",
      location: { zh: "待补充地点" },
    };
  },
  standing(id, slug) {
    return {
      ...commonEnvelope("standing", id, slug),
      standingKind: "driver",
      seasonId: "season-todo",
      defaultVisibleCount: 3,
      entries: [{ position: 1, competitorId: "person-todo", points: 0 }],
    };
  },
  car(id, slug) {
    return {
      ...commonEnvelope("car", id, slug),
      seasonIds: [],
      constructorId: "team-todo",
      driverIds: [],
      technologyIds: [],
      engine: "待补充",
      specifications: { chassis: { zh: "待补充" } },
    };
  },
  team(id, slug) {
    return {
      ...commonEnvelope("team", id, slug),
      teamKind: "constructor",
      seasonIds: [],
      personIds: [],
      carIds: [],
    };
  },
  person(id, slug) {
    return {
      ...commonEnvelope("person", id, slug),
      personKind: "driver",
      teamIds: [],
      representativeSeasonIds: [],
    };
  },
  era(id, slug) {
    return {
      ...commonEnvelope("era", id, slug),
      startYear: 1950,
      endYear: 1959,
      color: "#888888",
      seasonIds: [],
    };
  },
  technology(id, slug) {
    return {
      ...commonEnvelope("technology", id, slug),
      category: "other",
      difficulty: "introductory",
      seasonIds: [],
      carIds: [],
    };
  },
  source(id, slug) {
    return {
      ...commonEnvelope("source", id, slug),
      sourceType: "official",
      url: "https://example.com/todo",
      accessedOn: new Date().toISOString().slice(0, 10),
      supportedClaims: [{ entityId: "entity-todo", field: "summary.zh" }],
    };
  },
  mediaAsset(id) {
    return {
      schemaVersion: 1,
      type: "mediaAsset",
      id,
      kind: "image",
      src: "/media/todo.jpg",
      alt: { zh: "待补充替代文本" },
      rights: { status: "permission-required" },
    };
  },
};

export function buildScaffoldDocument(type, slug) {
  const config = ENTITY_TYPES[type];
  if (!config) {
    throw new Error(
      `Unknown entity type "${type}". Supported types: ${Object.keys(ENTITY_TYPES).join(", ")}`,
    );
  }

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    throw new Error(`slug "${slug}" must be a kebab-case string`);
  }

  const id = `${config.idPrefix}-${slug}`;
  return { id, config, document: TYPE_BUILDERS[type](id, slug) };
}

export async function scaffoldContent(type, slug, contentRoot) {
  const { id, config, document } = buildScaffoldDocument(type, slug);
  const filePath = path.join(
    path.resolve(contentRoot),
    config.directory,
    `${id}.json`,
  );

  try {
    await access(filePath);
    throw new Error(`Refusing to overwrite existing file: ${filePath}`);
  } catch (error) {
    if (error?.code !== "ENOENT") {
      throw error;
    }
  }

  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(document, null, 2)}\n`, "utf8");

  return filePath;
}

export async function main() {
  const [type, slug] = process.argv.slice(2);

  if (!type || !slug) {
    console.error(
      `Usage: node tools/content/scaffold-content.mjs <type> <slug>\nSupported types: ${Object.keys(ENTITY_TYPES).join(", ")}`,
    );
    process.exitCode = 1;
    return;
  }

  const contentRoot = process.env.CONTENT_ROOT ?? "content";

  try {
    const filePath = await scaffoldContent(type, slug, contentRoot);
    console.log(`Created ${filePath}`);
    console.log(
      "Run `npm run validate:content` to see the remaining TODO relationships and fields that need real values.",
    );
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (invokedPath === path.resolve(new URL(import.meta.url).pathname)) {
  await main();
}
