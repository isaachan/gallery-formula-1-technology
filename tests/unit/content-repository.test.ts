import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { ContentRepository } from "../../src/content/content-repository";

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

const temporaryRoots: string[] = [];

afterEach(async () => {
  await Promise.all(
    temporaryRoots
      .splice(0)
      .map((root) => fs.rm(root, { recursive: true, force: true })),
  );
});

async function buildFixtureContentRoot(
  extraFiles: Array<[string, unknown]> = [],
) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "f1-content-graph-"));
  temporaryRoots.push(root);

  await Promise.all(
    SEASON_1988_FIXTURES.map(async ([source, destination]) => {
      const destinationPath = path.join(root, destination);
      await fs.mkdir(path.dirname(destinationPath), { recursive: true });
      await fs.copyFile(path.join(FIXTURE_ROOT, source), destinationPath);
    }),
  );

  await Promise.all(
    (
      [
        [
          "sources/source-fia-season-review.json",
          {
            schemaVersion: 1,
            type: "source",
            id: "source-fia-season-review",
            slug: "fia-season-review",
            status: "published",
            title: { zh: "FIA 赛季回顾" },
            summary: { zh: "1988 赛季官方回顾来源。" },
            sourceIds: ["source-fia-season-review"],
            blocks: [],
            updatedAt: "2026-07-11T12:00:00.000Z",
            sourceType: "official",
            url: "https://example.com/fia-season-review",
            accessedOn: "2026-07-11",
            supportedClaims: [
              {
                entityId: "season-1988",
                field: "summary",
              },
            ],
          },
        ],
        ...extraFiles,
      ] satisfies Array<[string, unknown]>
    ).map(async ([destination, document]) => {
      const destinationPath = path.join(root, destination);
      await fs.mkdir(path.dirname(destinationPath), { recursive: true });
      await fs.writeFile(destinationPath, JSON.stringify(document, null, 2));
    }),
  );

  return root;
}

describe("ContentRepository", () => {
  it("returns a compact, year-ordered timeline of published seasons", async () => {
    const root = await buildFixtureContentRoot([
      [
        "seasons/season-1991-draft.json",
        {
          schemaVersion: 1,
          type: "season",
          id: "season-1991",
          slug: "1991-season",
          status: "draft",
          title: { zh: "1991 赛季" },
          summary: { zh: "尚未发布。" },
          sourceIds: ["source-fia-season-review"],
          blocks: [],
          updatedAt: "2026-07-11T12:00:00.000Z",
          year: 1991,
          eraId: "era-1980s",
        },
      ],
    ]);

    const repository = await ContentRepository.load(root);
    const timeline = await repository.getTimeline();

    expect(timeline).toEqual([
      {
        id: "season-1988",
        slug: "1988-season",
        year: 1988,
        title: "1988 赛季",
        highlighted: true,
        eraId: "era-1980s",
      },
    ]);
  });

  it("includes drafts only when explicitly requested", async () => {
    const root = await buildFixtureContentRoot([
      [
        "seasons/season-1991-draft.json",
        {
          schemaVersion: 1,
          type: "season",
          id: "season-1991",
          slug: "1991-season",
          status: "draft",
          title: { zh: "1991 赛季" },
          summary: { zh: "尚未发布。" },
          sourceIds: ["source-fia-season-review"],
          blocks: [],
          updatedAt: "2026-07-11T12:00:00.000Z",
          year: 1991,
          eraId: "era-1980s",
        },
      ],
    ]);

    const withDrafts = await ContentRepository.load(root, {
      includeDrafts: true,
    });
    const timeline = await withDrafts.getTimeline();

    expect(timeline.map((entry) => entry.year)).toEqual([1988, 1991]);
  });

  it("resolves a season's champion, champion car, and races with winners", async () => {
    const root = await buildFixtureContentRoot();
    const repository = await ContentRepository.load(root);

    const season = await repository.getSeasonByYear(1988);

    expect(season).not.toBeNull();
    expect(season?.title).toBe("1988 赛季");
    expect(season?.champion).toEqual({
      id: "person-ayrton-senna",
      slug: "ayrton-senna",
      type: "person",
      title: "艾尔顿·塞纳",
      subtitle: undefined,
      href: "/people/ayrton-senna",
    });
    expect(season?.championCar?.id).toBe("car-mclaren-mp4-4");
    expect(season?.era?.id).toBe("era-1980s");
    expect(season?.standings).toHaveLength(1);
    expect(season?.standings[0]).toMatchObject({
      id: "standing-1988-drivers",
      kind: "driver",
      defaultVisibleCount: 3,
    });
    expect(season?.races).toHaveLength(1);
    expect(season?.races[0]).toMatchObject({
      id: "race-1988-brazil",
      round: 1,
      date: "1988-04-03",
    });
    // race-1988-brazil's winnerPersonId (person-alain-prost) has no fixture
    // in this graph, so the resolved reference is safely null rather than throwing.
    expect(season?.races[0].winner).toBeNull();
    expect(season?.sources.map((source) => source.id)).toEqual([
      "source-fia-season-review",
    ]);
    expect(season?.blocks).toEqual([]);
  });

  it("returns null for a season year that does not exist", async () => {
    const root = await buildFixtureContentRoot();
    const repository = await ContentRepository.load(root);

    await expect(repository.getSeasonByYear(2099)).resolves.toBeNull();
  });

  it("resolves an entity by slug and enriches season entities with season detail", async () => {
    const root = await buildFixtureContentRoot();
    const repository = await ContentRepository.load(root);

    const entity = await repository.getEntityBySlug("season", "1988-season");

    expect(entity?.title).toBe("1988 赛季");
    expect(entity?.season?.champion?.id).toBe("person-ayrton-senna");
  });

  it("derives races won for a person as a reverse relationship not stored in content", async () => {
    const root = await buildFixtureContentRoot();
    const repository = await ContentRepository.load(root);

    const person = await repository.getEntityBySlug("person", "ayrton-senna");

    // race-1988-brazil's winnerPersonId is person-alain-prost, not Senna, so
    // this derived relationship must correctly come back empty rather than
    // accidentally including every race in the graph.
    expect(person?.racesWon).toEqual([]);
  });

  it("lists museum entries for cars, people, and technologies", async () => {
    const root = await buildFixtureContentRoot();
    const repository = await ContentRepository.load(root);

    const cars = await repository.listMuseum("car");
    const people = await repository.listMuseum("person");
    const technologies = await repository.listMuseum("technology");

    expect(cars.map((card) => card.id)).toEqual(["car-mclaren-mp4-4"]);
    expect(people.map((card) => card.id)).toEqual(["person-ayrton-senna"]);
    expect(technologies.map((card) => card.id)).toEqual([
      "technology-honda-ra168e",
    ]);
  });

  it("searches across titles regardless of locale", async () => {
    const root = await buildFixtureContentRoot();
    const repository = await ContentRepository.load(root);

    const bySenna = await repository.search("塞纳");
    const byEnglishName = await repository.search("mclaren");

    expect(bySenna.map((result) => result.id)).toContain("person-ayrton-senna");
    expect(byEnglishName.map((result) => result.id)).toEqual(
      expect.arrayContaining(["car-mclaren-mp4-4", "team-mclaren"]),
    );
  });

  it("returns an empty list for a search query with no matches", async () => {
    const root = await buildFixtureContentRoot();
    const repository = await ContentRepository.load(root);

    await expect(
      repository.search("no-such-entity-in-this-graph"),
    ).resolves.toEqual([]);
  });
});
