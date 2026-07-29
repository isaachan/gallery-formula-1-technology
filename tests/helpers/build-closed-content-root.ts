import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const FIXTURE_ROOT = path.resolve(__dirname, "../fixtures/content");

const SEASON_1988_FIXTURES = [
  ["season-entities/valid/season-entry.json", "seasons/season-1988.json"],
  ["season-entities/valid/race-entry.json", "races/race-1988-brazil.json"],
  [
    "season-entities/valid/circuit-entry.json",
    "circuits/circuit-jacarepagua.json",
  ],
  [
    "season-entities/valid/driver-standing-entry.json",
    "standings/standing-1988-drivers.json",
  ],
  ["participant-entities/valid/car-entry.json", "cars/car-mclaren-mp4-4.json"],
  [
    "participant-entities/valid/person-entry.json",
    "people/person-ayrton-senna.json",
  ],
  ["participant-entities/valid/team-entry.json", "teams/team-mclaren.json"],
  ["topic-entities/valid/era-entry.json", "eras/era-1980s.json"],
  [
    "topic-entities/valid/technology-entry.json",
    "technologies/technology-honda-ra168e.json",
  ],
  [
    "topic-entities/valid/source-entry.json",
    "sources/source-honda-archive.json",
  ],
] as const;

const SUPPORTING_SOURCES = [
  ["source-mclaren-archive", "car-mclaren-mp4-4"],
  ["source-circuit-db", "circuit-jacarepagua"],
  ["source-era-overview", "era-1980s"],
  ["source-fia-senna-biography", "person-ayrton-senna"],
  ["source-fia-brazil-1988", "race-1988-brazil"],
  ["source-fia-driver-standings-1988", "standing-1988-drivers"],
  ["source-fia-season-review", "season-1988"],
] as const;

function closeRepresentativeRelationships(document: Record<string, unknown>) {
  if (document.type === "season") {
    document.raceIds = ["race-1988-brazil"];
    document.standingIds = ["standing-1988-drivers"];
    document.entrantCarIds = ["car-mclaren-mp4-4"];
  } else if (document.type === "standing") {
    document.entries = (document.entries as unknown[]).slice(0, 1);
  } else if (document.type === "car") {
    document.driverIds = ["person-ayrton-senna"];
    document.technologyIds = ["technology-honda-ra168e"];
  } else if (document.type === "team") {
    document.personIds = ["person-ayrton-senna"];
  } else if (document.type === "person") {
    document.teamIds = ["team-mclaren"];
    document.representativeSeasonIds = ["season-1988"];
  }
  return document;
}

function supportingSource(
  sourceId: string,
  entityId: string,
): [string, unknown] {
  return [
    `sources/${sourceId}.json`,
    {
      schemaVersion: 1,
      type: "source",
      id: sourceId,
      slug: sourceId,
      status: "published",
      title: { zh: sourceId },
      summary: { zh: "测试来源。" },
      sourceIds: [sourceId],
      blocks: [],
      updatedAt: "2026-07-11T12:00:00.000Z",
      sourceType: "official",
      url: `https://example.com/${sourceId}`,
      accessedOn: "2026-07-11",
      supportedClaims: [{ entityId, field: "summary" }],
    },
  ];
}

export async function buildClosedContentRoot({
  temporaryRoots,
  prefix,
  extraFiles = [],
  includeEntities = true,
}: {
  temporaryRoots: string[];
  prefix: string;
  extraFiles?: Array<[string, unknown]>;
  includeEntities?: boolean;
}) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), prefix));
  temporaryRoots.push(root);

  if (includeEntities) {
    await Promise.all(
      SEASON_1988_FIXTURES.map(async ([source, destination]) => {
        const destinationPath = path.join(root, destination);
        const document = closeRepresentativeRelationships(
          JSON.parse(
            await fs.readFile(path.join(FIXTURE_ROOT, source), "utf8"),
          ) as Record<string, unknown>,
        );
        await fs.mkdir(path.dirname(destinationPath), { recursive: true });
        await fs.writeFile(destinationPath, JSON.stringify(document, null, 2));
      }),
    );

    await Promise.all(
      SUPPORTING_SOURCES.map(([sourceId, entityId]) =>
        supportingSource(sourceId, entityId),
      ).map(async ([destination, document]) => {
        const destinationPath = path.join(root, destination);
        await fs.mkdir(path.dirname(destinationPath), { recursive: true });
        await fs.writeFile(destinationPath, JSON.stringify(document, null, 2));
      }),
    );

    const prostPath = path.join(root, "people/person-alain-prost.json");
    await fs.mkdir(path.dirname(prostPath), { recursive: true });
    await fs.writeFile(
      prostPath,
      JSON.stringify(
        {
          schemaVersion: 1,
          type: "person",
          id: "person-alain-prost",
          slug: "alain-prost",
          status: "published",
          title: { zh: "阿兰·普罗斯特", en: "Alain Prost" },
          summary: { zh: "1988 年巴西大奖赛冠军。" },
          sourceIds: ["source-honda-archive"],
          blocks: [],
          updatedAt: "2026-07-11T12:00:00.000Z",
          personKind: "driver",
          teamIds: [],
          representativeSeasonIds: ["season-1988"],
        },
        null,
        2,
      ),
    );
  }

  await Promise.all(
    extraFiles.map(async ([destination, document]) => {
      const destinationPath = path.join(root, destination);
      await fs.mkdir(path.dirname(destinationPath), { recursive: true });
      await fs.writeFile(destinationPath, JSON.stringify(document, null, 2));
    }),
  );

  return root;
}
