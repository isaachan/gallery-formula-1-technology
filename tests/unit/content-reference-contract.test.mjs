import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { collectContentReferences } from "../../src/domain/content-reference-contract.mjs";
import { validateContentRoot } from "../../tools/content/validate-content.mjs";

const requiredDirectories = [
  "cars",
  "circuits",
  "eras",
  "media",
  "people",
  "races",
  "seasons",
  "sources",
  "standings",
  "teams",
  "technologies",
];

const relatedEntityTypes = [
  "season",
  "race",
  "circuit",
  "standing",
  "car",
  "team",
  "person",
  "technology",
  "era",
  "source",
];

const temporaryRoots = [];

afterEach(async () => {
  await Promise.all(
    temporaryRoots
      .splice(0)
      .map((root) => fs.rm(root, { recursive: true, force: true })),
  );
});

function simplify(references) {
  return references.map(({ fieldPath, expectedTypes, referencedId }) => ({
    fieldPath,
    expectedTypes,
    referencedId,
  }));
}

async function createContentRoot(files) {
  const root = await fs.mkdtemp(
    path.join(os.tmpdir(), "f1-reference-contract-"),
  );
  temporaryRoots.push(root);
  await Promise.all(
    requiredDirectories.map((directory) =>
      fs.mkdir(path.join(root, directory), { recursive: true }),
    ),
  );
  await Promise.all(
    Object.entries(files).map(async ([relativePath, document]) => {
      const destination = path.join(root, relativePath);
      await fs.mkdir(path.dirname(destination), { recursive: true });
      await fs.writeFile(destination, JSON.stringify(document, null, 2));
    }),
  );
  return root;
}

describe("collectContentReferences", () => {
  it("collects common and nested block references with exact indexed paths", () => {
    const document = {
      id: "technology-active-suspension",
      type: "technology",
      sourceIds: ["source-one", "source-two"],
      coverMediaId: "media-cover",
      blocks: [
        {
          id: "prose",
          type: "richText",
          sourceIds: ["source-block"],
        },
        {
          id: "image",
          type: "image",
          mediaId: "media-image",
        },
        {
          id: "gallery",
          type: "gallery",
          sourceIds: ["source-gallery"],
          mediaIds: ["media-a", "media-b"],
        },
        {
          id: "related",
          type: "relatedEntities",
          entityIds: ["car-one", "person-one"],
        },
      ],
    };

    expect(simplify(collectContentReferences(document))).toEqual([
      {
        fieldPath: "sourceIds[0]",
        expectedTypes: ["source"],
        referencedId: "source-one",
      },
      {
        fieldPath: "sourceIds[1]",
        expectedTypes: ["source"],
        referencedId: "source-two",
      },
      {
        fieldPath: "coverMediaId",
        expectedTypes: ["mediaAsset"],
        referencedId: "media-cover",
      },
      {
        fieldPath: "blocks[0].sourceIds[0]",
        expectedTypes: ["source"],
        referencedId: "source-block",
      },
      {
        fieldPath: "blocks[1].mediaId",
        expectedTypes: ["mediaAsset"],
        referencedId: "media-image",
      },
      {
        fieldPath: "blocks[2].sourceIds[0]",
        expectedTypes: ["source"],
        referencedId: "source-gallery",
      },
      {
        fieldPath: "blocks[2].mediaIds[0]",
        expectedTypes: ["mediaAsset"],
        referencedId: "media-a",
      },
      {
        fieldPath: "blocks[2].mediaIds[1]",
        expectedTypes: ["mediaAsset"],
        referencedId: "media-b",
      },
      {
        fieldPath: "blocks[3].entityIds[0]",
        expectedTypes: relatedEntityTypes,
        referencedId: "car-one",
      },
      {
        fieldPath: "blocks[3].entityIds[1]",
        expectedTypes: relatedEntityTypes,
        referencedId: "person-one",
      },
    ]);
  });

  it.each([
    [
      "season",
      {
        id: "season-1988",
        type: "season",
        eraId: "era-1980s",
        championPersonId: "person-senna",
        championCarId: "car-mp4-4",
        raceIds: ["race-brazil"],
        standingIds: ["standing-drivers"],
        entrantCarIds: ["car-mp4-4"],
        featuredTechnologyIds: ["technology-turbo"],
      },
      [
        ["eraId", ["era"], "era-1980s"],
        ["championPersonId", ["person"], "person-senna"],
        ["championCarId", ["car"], "car-mp4-4"],
        ["raceIds[0]", ["race"], "race-brazil"],
        ["standingIds[0]", ["standing"], "standing-drivers"],
        ["entrantCarIds[0]", ["car"], "car-mp4-4"],
        ["featuredTechnologyIds[0]", ["technology"], "technology-turbo"],
      ],
    ],
    [
      "race",
      {
        id: "race-brazil",
        type: "race",
        seasonId: "season-1988",
        circuitId: "circuit-rio",
        winnerPersonId: "person-prost",
        winnerCarId: "car-mp4-4",
      },
      [
        ["seasonId", ["season"], "season-1988"],
        ["circuitId", ["circuit"], "circuit-rio"],
        ["winnerPersonId", ["person"], "person-prost"],
        ["winnerCarId", ["car"], "car-mp4-4"],
      ],
    ],
    [
      "driver standing",
      {
        id: "standing-drivers",
        type: "standing",
        standingKind: "driver",
        seasonId: "season-1988",
        entries: [{ competitorId: "person-senna" }],
      },
      [
        ["seasonId", ["season"], "season-1988"],
        ["entries[0].competitorId", ["person"], "person-senna"],
      ],
    ],
    [
      "constructor standing",
      {
        id: "standing-constructors",
        type: "standing",
        standingKind: "constructor",
        seasonId: "season-1988",
        entries: [{ competitorId: "team-mclaren" }],
      },
      [
        ["seasonId", ["season"], "season-1988"],
        ["entries[0].competitorId", ["team"], "team-mclaren"],
      ],
    ],
    [
      "car",
      {
        id: "car-mp4-4",
        type: "car",
        seasonIds: ["season-1988"],
        constructorId: "team-mclaren",
        driverIds: ["person-senna"],
        technologyIds: ["technology-turbo"],
      },
      [
        ["seasonIds[0]", ["season"], "season-1988"],
        ["constructorId", ["team"], "team-mclaren"],
        ["driverIds[0]", ["person"], "person-senna"],
        ["technologyIds[0]", ["technology"], "technology-turbo"],
      ],
    ],
    [
      "team",
      {
        id: "team-mclaren",
        type: "team",
        seasonIds: ["season-1988"],
        personIds: ["person-senna"],
        carIds: ["car-mp4-4"],
      },
      [
        ["seasonIds[0]", ["season"], "season-1988"],
        ["personIds[0]", ["person"], "person-senna"],
        ["carIds[0]", ["car"], "car-mp4-4"],
      ],
    ],
    [
      "person",
      {
        id: "person-senna",
        type: "person",
        teamIds: ["team-mclaren"],
        representativeSeasonIds: ["season-1988"],
      },
      [
        ["teamIds[0]", ["team"], "team-mclaren"],
        ["representativeSeasonIds[0]", ["season"], "season-1988"],
      ],
    ],
    [
      "technology",
      {
        id: "technology-turbo",
        type: "technology",
        firstSeasonId: "season-1977",
        seasonIds: ["season-1988"],
        carIds: ["car-mp4-4"],
      },
      [
        ["firstSeasonId", ["season"], "season-1977"],
        ["seasonIds[0]", ["season"], "season-1988"],
        ["carIds[0]", ["car"], "car-mp4-4"],
      ],
    ],
    [
      "era",
      {
        id: "era-1980s",
        type: "era",
        seasonIds: ["season-1988"],
      },
      [["seasonIds[0]", ["season"], "season-1988"]],
    ],
    [
      "source",
      {
        id: "source-review",
        type: "source",
        supportedClaims: [{ entityId: "season-1988" }],
      },
      [["supportedClaims[0].entityId", relatedEntityTypes, "season-1988"]],
    ],
    [
      "media",
      {
        id: "media-video",
        type: "mediaAsset",
        posterMediaId: "media-poster",
        fallbackMediaId: "media-fallback",
      },
      [
        ["posterMediaId", ["mediaAsset"], "media-poster"],
        ["fallbackMediaId", ["mediaAsset"], "media-fallback"],
      ],
    ],
  ])("collects every typed %s relationship", (_label, document, expected) => {
    expect(
      simplify(collectContentReferences(document)).map(
        ({ fieldPath, expectedTypes, referencedId }) => [
          fieldPath,
          expectedTypes,
          referencedId,
        ],
      ),
    ).toEqual(expected);
  });

  it("records the source entity id on every collected reference", () => {
    const references = collectContentReferences({
      id: "car-mp4-4",
      type: "car",
      sourceIds: ["source-review"],
      constructorId: "team-mclaren",
    });

    expect(references.map((reference) => reference.sourceEntityId)).toEqual([
      "car-mp4-4",
      "car-mp4-4",
    ]);
  });

  it.each([
    ["season", { eraId: "era-x" }, "eraId", "eraIncludesSeason"],
    ["era", { seasonIds: ["season-x"] }, "seasonIds[0]", "seasonUsesEra"],
    ["season", { raceIds: ["race-x"] }, "raceIds[0]", "raceBelongsToSeason"],
    ["race", { seasonId: "season-x" }, "seasonId", "seasonIncludesRace"],
    [
      "season",
      { standingIds: ["standing-x"] },
      "standingIds[0]",
      "standingBelongsToSeason",
    ],
    [
      "standing",
      { seasonId: "season-x" },
      "seasonId",
      "seasonIncludesStanding",
    ],
    [
      "season",
      { entrantCarIds: ["car-x"] },
      "entrantCarIds[0]",
      "carIncludesSeason",
    ],
    ["car", { seasonIds: ["season-x"] }, "seasonIds[0]", "seasonIncludesCar"],
    [
      "season",
      { featuredTechnologyIds: ["technology-x"] },
      "featuredTechnologyIds[0]",
      "technologyIncludesSeason",
    ],
    [
      "technology",
      { seasonIds: ["season-x"] },
      "seasonIds[0]",
      "seasonIncludesTechnology",
    ],
    ["team", { carIds: ["car-x"] }, "carIds[0]", "carUsesTeam"],
    ["car", { constructorId: "team-x" }, "constructorId", "teamIncludesCar"],
    ["team", { personIds: ["person-x"] }, "personIds[0]", "personIncludesTeam"],
    ["person", { teamIds: ["team-x"] }, "teamIds[0]", "teamIncludesPerson"],
    [
      "car",
      { technologyIds: ["technology-x"] },
      "technologyIds[0]",
      "technologyIncludesCar",
    ],
    ["technology", { carIds: ["car-x"] }, "carIds[0]", "carIncludesTechnology"],
  ])(
    "marks the %s.%s relationship with explicit reverse rule %s",
    (type, fields, fieldPath, reverseRule) => {
      const reference = collectContentReferences({
        id: `${type}-source`,
        type,
        ...fields,
      }).find((candidate) => candidate.fieldPath === fieldPath);

      expect(reference?.reverseRule).toBe(reverseRule);
    },
  );
});

describe("exhaustive graph diagnostics", () => {
  it("reports exact missing-target and actual-type diagnostics for common, nested, media, and allowed-set references", async () => {
    const root = await createContentRoot({
      "cars/car-test.json": {
        id: "car-test",
        type: "car",
        sourceIds: ["source-missing"],
        coverMediaId: "team-wrong-cover",
        blocks: [
          {
            type: "gallery",
            sourceIds: ["team-wrong-source"],
            mediaIds: ["media-missing", "person-wrong-media"],
          },
          {
            type: "relatedEntities",
            entityIds: ["media-not-an-entity"],
          },
        ],
      },
      "teams/team-wrong-cover.json": {
        id: "team-wrong-cover",
        type: "team",
      },
      "teams/team-wrong-source.json": {
        id: "team-wrong-source",
        type: "team",
      },
      "people/person-wrong-media.json": {
        id: "person-wrong-media",
        type: "person",
      },
      "media/media-not-an-entity.json": {
        id: "media-not-an-entity",
        type: "mediaAsset",
        src: "https://example.com/not-an-entity.jpg",
      },
    });

    const failures = await validateContentRoot(root);

    expect(failures).toContain(
      'cars/car-test.json:sourceIds[0] entity "car-test" expected source reference "source-missing" but target is missing',
    );
    expect(failures).toContain(
      'cars/car-test.json:coverMediaId entity "car-test" expected mediaAsset reference "team-wrong-cover" but actual type is "team"',
    );
    expect(failures).toContain(
      'cars/car-test.json:blocks[0].sourceIds[0] entity "car-test" expected source reference "team-wrong-source" but actual type is "team"',
    );
    expect(failures).toContain(
      'cars/car-test.json:blocks[0].mediaIds[0] entity "car-test" expected mediaAsset reference "media-missing" but target is missing',
    );
    expect(failures).toContain(
      'cars/car-test.json:blocks[0].mediaIds[1] entity "car-test" expected mediaAsset reference "person-wrong-media" but actual type is "person"',
    );
    expect(failures).toContain(
      `cars/car-test.json:blocks[1].entityIds[0] entity "car-test" expected one of [${relatedEntityTypes.join(", ")}] reference "media-not-an-entity" but actual type is "mediaAsset"`,
    );
  });

  it("reports media poster and fallback mismatches with their exact paths", async () => {
    const root = await createContentRoot({
      "media/media-video.json": {
        id: "media-video",
        type: "mediaAsset",
        posterMediaId: "media-poster-missing",
        fallbackMediaId: "team-not-media",
        src: "https://example.com/video.mp4",
      },
      "teams/team-not-media.json": {
        id: "team-not-media",
        type: "team",
      },
    });

    const failures = await validateContentRoot(root);

    expect(failures).toContain(
      'media/media-video.json:posterMediaId entity "media-video" expected mediaAsset reference "media-poster-missing" but target is missing',
    );
    expect(failures).toContain(
      'media/media-video.json:fallbackMediaId entity "media-video" expected mediaAsset reference "team-not-media" but actual type is "team"',
    );
  });

  it.each([
    [
      "season to era",
      {
        "seasons/season-x.json": {
          id: "season-x",
          type: "season",
          eraId: "era-x",
        },
        "eras/era-x.json": { id: "era-x", type: "era", seasonIds: [] },
      },
      'seasons/season-x.json:eraId requires era "era-x" to include season "season-x" in seasonIds',
    ],
    [
      "era to season",
      {
        "seasons/season-x.json": { id: "season-x", type: "season" },
        "eras/era-x.json": {
          id: "era-x",
          type: "era",
          seasonIds: ["season-x"],
        },
      },
      'eras/era-x.json:seasonIds[0] requires season "season-x" to point back to era "era-x" via eraId',
    ],
    [
      "season to race",
      {
        "seasons/season-x.json": {
          id: "season-x",
          type: "season",
          raceIds: ["race-x"],
        },
        "races/race-x.json": { id: "race-x", type: "race" },
      },
      'seasons/season-x.json:raceIds[0] requires race "race-x" to point back to season "season-x" via seasonId',
    ],
    [
      "race to season",
      {
        "seasons/season-x.json": {
          id: "season-x",
          type: "season",
          raceIds: [],
        },
        "races/race-x.json": {
          id: "race-x",
          type: "race",
          seasonId: "season-x",
        },
      },
      'races/race-x.json:seasonId requires season "season-x" to include race "race-x" in raceIds',
    ],
    [
      "season to standing",
      {
        "seasons/season-x.json": {
          id: "season-x",
          type: "season",
          standingIds: ["standing-x"],
        },
        "standings/standing-x.json": {
          id: "standing-x",
          type: "standing",
        },
      },
      'seasons/season-x.json:standingIds[0] requires standing "standing-x" to point back to season "season-x" via seasonId',
    ],
    [
      "standing to season",
      {
        "seasons/season-x.json": {
          id: "season-x",
          type: "season",
          standingIds: [],
        },
        "standings/standing-x.json": {
          id: "standing-x",
          type: "standing",
          seasonId: "season-x",
        },
      },
      'standings/standing-x.json:seasonId requires season "season-x" to include standing "standing-x" in standingIds',
    ],
    [
      "season to entrant car",
      {
        "seasons/season-x.json": {
          id: "season-x",
          type: "season",
          entrantCarIds: ["car-x"],
        },
        "cars/car-x.json": { id: "car-x", type: "car", seasonIds: [] },
      },
      'seasons/season-x.json:entrantCarIds[0] requires car "car-x" to include season "season-x" in seasonIds',
    ],
    [
      "car to season",
      {
        "seasons/season-x.json": {
          id: "season-x",
          type: "season",
          entrantCarIds: [],
        },
        "cars/car-x.json": {
          id: "car-x",
          type: "car",
          seasonIds: ["season-x"],
        },
      },
      'cars/car-x.json:seasonIds[0] requires season "season-x" to include car "car-x" in entrantCarIds',
    ],
    [
      "season to technology",
      {
        "seasons/season-x.json": {
          id: "season-x",
          type: "season",
          featuredTechnologyIds: ["technology-x"],
        },
        "technologies/technology-x.json": {
          id: "technology-x",
          type: "technology",
          seasonIds: [],
        },
      },
      'seasons/season-x.json:featuredTechnologyIds[0] requires technology "technology-x" to include season "season-x" in seasonIds',
    ],
    [
      "technology to season",
      {
        "seasons/season-x.json": {
          id: "season-x",
          type: "season",
          featuredTechnologyIds: [],
        },
        "technologies/technology-x.json": {
          id: "technology-x",
          type: "technology",
          seasonIds: ["season-x"],
        },
      },
      'technologies/technology-x.json:seasonIds[0] requires season "season-x" to include technology "technology-x" in featuredTechnologyIds',
    ],
    [
      "team to car",
      {
        "teams/team-x.json": {
          id: "team-x",
          type: "team",
          carIds: ["car-x"],
        },
        "cars/car-x.json": { id: "car-x", type: "car" },
      },
      'teams/team-x.json:carIds[0] requires car "car-x" to point back to team "team-x" via constructorId',
    ],
    [
      "car to team",
      {
        "teams/team-x.json": {
          id: "team-x",
          type: "team",
          carIds: [],
        },
        "cars/car-x.json": {
          id: "car-x",
          type: "car",
          constructorId: "team-x",
        },
      },
      'cars/car-x.json:constructorId requires team "team-x" to include car "car-x" in carIds',
    ],
    [
      "team to person",
      {
        "teams/team-x.json": {
          id: "team-x",
          type: "team",
          personIds: ["person-x"],
        },
        "people/person-x.json": { id: "person-x", type: "person", teamIds: [] },
      },
      'teams/team-x.json:personIds[0] requires person "person-x" to include team "team-x" in teamIds',
    ],
    [
      "person to team",
      {
        "teams/team-x.json": {
          id: "team-x",
          type: "team",
          personIds: [],
        },
        "people/person-x.json": {
          id: "person-x",
          type: "person",
          teamIds: ["team-x"],
        },
      },
      'people/person-x.json:teamIds[0] requires team "team-x" to include person "person-x" in personIds',
    ],
    [
      "car to technology",
      {
        "cars/car-x.json": {
          id: "car-x",
          type: "car",
          technologyIds: ["technology-x"],
        },
        "technologies/technology-x.json": {
          id: "technology-x",
          type: "technology",
          carIds: [],
        },
      },
      'cars/car-x.json:technologyIds[0] requires technology "technology-x" to include car "car-x" in carIds',
    ],
    [
      "technology to car",
      {
        "cars/car-x.json": {
          id: "car-x",
          type: "car",
          technologyIds: [],
        },
        "technologies/technology-x.json": {
          id: "technology-x",
          type: "technology",
          carIds: ["car-x"],
        },
      },
      'technologies/technology-x.json:carIds[0] requires car "car-x" to include technology "technology-x" in technologyIds',
    ],
  ])(
    "reports the required %s reverse invariant",
    async (_label, files, issue) => {
      const root = await createContentRoot(files);
      const failures = await validateContentRoot(root);

      expect(failures).toContain(issue);
    },
  );
});
