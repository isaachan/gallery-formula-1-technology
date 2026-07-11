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

  it("lists museum entries for cars, people, and technologies, each with a representative timeline link", async () => {
    const root = await buildFixtureContentRoot();
    const repository = await ContentRepository.load(root);

    const cars = await repository.listMuseum("car");
    const people = await repository.listMuseum("person");
    const technologies = await repository.listMuseum("technology");

    expect(cars.map((card) => card.id)).toEqual(["car-mclaren-mp4-4"]);
    expect(cars[0].timelineHref).toBe("/?year=1988");
    expect(people.map((card) => card.id)).toEqual(["person-ayrton-senna"]);
    expect(people[0].timelineHref).toBe("/?year=1988");
    expect(technologies.map((card) => card.id)).toEqual([
      "technology-honda-ra168e",
    ]);
    expect(technologies[0].timelineHref).toBe("/?year=1988");
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

  it("searches by year and by relationship, not just direct title text", async () => {
    const root = await buildFixtureContentRoot();
    const repository = await ContentRepository.load(root);

    const byYear = await repository.search("1988");
    const byTeamRelationship = await repository.search("迈凯伦");

    expect(byYear.map((result) => result.id)).toEqual(
      expect.arrayContaining(["season-1988", "person-ayrton-senna"]),
    );
    // person-ayrton-senna doesn't mention "迈凯伦" in its own title/subtitle,
    // only via its teamIds relationship to team-mclaren.
    expect(byTeamRelationship.map((result) => result.id)).toEqual(
      expect.arrayContaining(["team-mclaren", "person-ayrton-senna"]),
    );
  });

  it("returns an empty list for a search query with no matches", async () => {
    const root = await buildFixtureContentRoot();
    const repository = await ContentRepository.load(root);

    await expect(
      repository.search("no-such-entity-in-this-graph"),
    ).resolves.toEqual([]);
  });

  it("enriches a car with its constructor, drivers, seasons, technologies, and specs", async () => {
    const root = await buildFixtureContentRoot();
    const repository = await ContentRepository.load(root);

    const car = await repository.getEntityBySlug("car", "mclaren-mp4-4");

    expect(car?.car?.engine).toBe("Honda RA168E");
    expect(car?.car?.wins).toBe(15);
    expect(car?.car?.specifications.chassis.zh).toBe("碳纤维单体壳");
    expect(car?.car?.constructor).toMatchObject({ id: "team-mclaren" });
    expect(car?.car?.drivers.map((driver) => driver.id)).toEqual([
      "person-ayrton-senna",
    ]);
    expect(car?.car?.seasons.map((season) => season.id)).toEqual([
      "season-1988",
    ]);
    expect(car?.car?.technologies.map((tech) => tech.id)).toEqual([
      "technology-honda-ra168e",
    ]);
    expect(car?.car?.representativeSeason).toMatchObject({
      id: "season-1988",
    });
  });

  it("enriches a person with teams, derived cars driven, and representative seasons", async () => {
    const root = await buildFixtureContentRoot();
    const repository = await ContentRepository.load(root);

    const person = await repository.getEntityBySlug("person", "ayrton-senna");

    expect(person?.person?.personKind).toBe("driver");
    expect(person?.person?.nationality).toBe("Brazilian");
    expect(person?.person?.championshipYears).toEqual([1988, 1990, 1991]);
    expect(person?.person?.teams.map((team) => team.id)).toEqual([
      "team-mclaren",
    ]);
    // Senna's cars driven is derived from car.driverIds, not stored on the
    // person document itself.
    expect(person?.person?.cars.map((car) => car.id)).toEqual([
      "car-mclaren-mp4-4",
    ]);
    expect(
      person?.person?.representativeSeasons.map((season) => season.id),
    ).toEqual(["season-1988"]);
  });

  it("enriches a technology with related cars, seasons, other technologies, and a representative season", async () => {
    const root = await buildFixtureContentRoot([
      [
        "technologies/technology-low-line-packaging.json",
        {
          schemaVersion: 1,
          type: "technology",
          id: "technology-low-line-packaging",
          slug: "low-line-packaging",
          status: "published",
          title: { zh: "低车身包装" },
          summary: { zh: "降低整车高度以提升空气动力效率。" },
          sourceIds: ["source-honda-archive"],
          blocks: [],
          updatedAt: "2026-07-11T12:00:00.000Z",
          category: "aerodynamics",
          seasonIds: ["season-1988"],
          carIds: ["car-mclaren-mp4-4"],
          difficulty: "advanced",
        },
      ],
    ]);
    const repository = await ContentRepository.load(root);

    const technology = await repository.getEntityBySlug(
      "technology",
      "honda-ra168e",
    );

    expect(technology?.technology?.category).toBe("engine");
    expect(technology?.technology?.difficulty).toBe("advanced");
    expect(technology?.technology?.relatedCars.map((car) => car.id)).toEqual([
      "car-mclaren-mp4-4",
    ]);
    expect(
      technology?.technology?.relatedSeasons.map((season) => season.id),
    ).toEqual(["season-1988"]);
    // Shares car-mclaren-mp4-4 with technology-low-line-packaging, so that
    // technology should surface as related even though neither document
    // references the other directly.
    expect(
      technology?.technology?.relatedTechnologies.map((tech) => tech.id),
    ).toEqual(["technology-low-line-packaging"]);
    expect(technology?.technology?.representativeSeason).toMatchObject({
      id: "season-1988",
    });
  });

  it("enriches a team with its people, cars, and seasons", async () => {
    const root = await buildFixtureContentRoot();
    const repository = await ContentRepository.load(root);

    const team = await repository.getEntityBySlug("team", "mclaren");

    expect(team?.team?.teamKind).toBe("constructor");
    expect(team?.team?.baseCountryCode).toBe("GBR");
    expect(team?.team?.people.map((person) => person.id)).toEqual([
      "person-ayrton-senna",
    ]);
    expect(team?.team?.cars.map((car) => car.id)).toEqual([
      "car-mclaren-mp4-4",
    ]);
    expect(team?.team?.seasons.map((season) => season.id)).toEqual([
      "season-1988",
    ]);
  });

  describe("resolveBlocks", () => {
    it("resolves an image block's mediaId to an inline media object", async () => {
      const root = await buildFixtureContentRoot([
        [
          "seasons/season-1988.json",
          {
            schemaVersion: 1,
            type: "season",
            id: "season-1988",
            slug: "1988-season",
            status: "published",
            title: { zh: "1988 赛季" },
            summary: { zh: "x" },
            sourceIds: ["source-fia-season-review"],
            updatedAt: "2026-07-11T12:00:00.000Z",
            year: 1988,
            eraId: "era-1980s",
            blocks: [
              {
                id: "block-image",
                type: "image",
                heading: { zh: "主视觉" },
                mediaId: "media-primary-visual",
                sourceIds: [],
              },
            ],
          },
        ],
        [
          "media/media-primary-visual.json",
          {
            schemaVersion: 1,
            type: "mediaAsset",
            id: "media-primary-visual",
            kind: "image",
            src: "/demo/primary.jpg",
            alt: { zh: "主视觉替代文本" },
            caption: { zh: "说明文字" },
            credit: "编辑部原创",
          },
        ],
      ]);
      const repository = await ContentRepository.load(root);

      const season = await repository.getSeasonByYear(1988);
      const block = season?.blocks[0] as Record<string, unknown>;

      expect(block.media).toMatchObject({
        id: "media-primary-visual",
        src: "/demo/primary.jpg",
        credit: "编辑部原创",
      });
    });

    it("resolves a gallery block's mediaIds to an items array of media objects", async () => {
      const root = await buildFixtureContentRoot([
        [
          "seasons/season-1988.json",
          {
            schemaVersion: 1,
            type: "season",
            id: "season-1988",
            slug: "1988-season",
            status: "published",
            title: { zh: "1988 赛季" },
            summary: { zh: "x" },
            sourceIds: ["source-fia-season-review"],
            updatedAt: "2026-07-11T12:00:00.000Z",
            year: 1988,
            eraId: "era-1980s",
            blocks: [
              {
                id: "block-gallery",
                type: "gallery",
                mediaIds: ["media-a", "media-b"],
                sourceIds: [],
              },
            ],
          },
        ],
        [
          "media/media-a.json",
          {
            schemaVersion: 1,
            type: "mediaAsset",
            id: "media-a",
            kind: "image",
            src: "/demo/a.jpg",
            alt: { zh: "A" },
          },
        ],
        [
          "media/media-b.json",
          {
            schemaVersion: 1,
            type: "mediaAsset",
            id: "media-b",
            kind: "image",
            src: "/demo/b.jpg",
            alt: { zh: "B" },
          },
        ],
      ]);
      const repository = await ContentRepository.load(root);

      const season = await repository.getSeasonByYear(1988);
      const block = season?.blocks[0] as {
        items: Array<{ media?: { src: string } }>;
      };

      expect(block.items.map((item) => item.media?.src)).toEqual([
        "/demo/a.jpg",
        "/demo/b.jpg",
      ]);
    });

    it("resolves a video block's mediaId and posterMediaId, and a model3d block similarly", async () => {
      const root = await buildFixtureContentRoot([
        [
          "seasons/season-1988.json",
          {
            schemaVersion: 1,
            type: "season",
            id: "season-1988",
            slug: "1988-season",
            status: "published",
            title: { zh: "1988 赛季" },
            summary: { zh: "x" },
            sourceIds: ["source-fia-season-review"],
            updatedAt: "2026-07-11T12:00:00.000Z",
            year: 1988,
            eraId: "era-1980s",
            blocks: [
              {
                id: "block-video",
                type: "video",
                mediaId: "media-clip",
                transcript: { zh: "转录文本" },
                sourceIds: [],
              },
              {
                id: "block-model3d",
                type: "model3d",
                mediaId: "media-model",
                description: { zh: "模型说明" },
                sourceIds: [],
              },
            ],
          },
        ],
        [
          "media/media-clip.json",
          {
            schemaVersion: 1,
            type: "mediaAsset",
            id: "media-clip",
            kind: "video",
            src: "/demo/clip.mp4",
            alt: { zh: "片段" },
            posterMediaId: "media-clip-poster",
          },
        ],
        [
          "media/media-clip-poster.json",
          {
            schemaVersion: 1,
            type: "mediaAsset",
            id: "media-clip-poster",
            kind: "poster",
            src: "/demo/clip-poster.jpg",
            alt: { zh: "片段海报" },
          },
        ],
        [
          "media/media-model.json",
          {
            schemaVersion: 1,
            type: "mediaAsset",
            id: "media-model",
            kind: "model3d",
            src: "/demo/model.glb",
            alt: { zh: "模型" },
            posterMediaId: "media-clip-poster",
            model: { format: "glb" },
          },
        ],
      ]);
      const repository = await ContentRepository.load(root);

      const season = await repository.getSeasonByYear(1988);
      const [videoBlock, modelBlock] = season!.blocks as Array<
        Record<string, unknown>
      >;

      expect(videoBlock.media).toMatchObject({
        videoSrc: "/demo/clip.mp4",
        posterSrc: "/demo/clip-poster.jpg",
      });
      expect(modelBlock.media).toMatchObject({
        modelSrc: "/demo/model.glb",
        posterSrc: "/demo/clip-poster.jpg",
      });
    });

    it("resolves a relatedEntities block's entityIds to summaries, dropping an unresolvable one", async () => {
      const root = await buildFixtureContentRoot([
        [
          "seasons/season-1988.json",
          {
            schemaVersion: 1,
            type: "season",
            id: "season-1988",
            slug: "1988-season",
            status: "published",
            title: { zh: "1988 赛季" },
            summary: { zh: "x" },
            sourceIds: ["source-fia-season-review"],
            updatedAt: "2026-07-11T12:00:00.000Z",
            year: 1988,
            eraId: "era-1980s",
            blocks: [
              {
                id: "block-related",
                type: "relatedEntities",
                entityIds: ["person-ayrton-senna", "no-such-entity"],
                sourceIds: [],
              },
            ],
          },
        ],
      ]);
      const repository = await ContentRepository.load(root);

      const season = await repository.getSeasonByYear(1988);
      const block = season?.blocks[0] as {
        items: Array<{
          entityId: string;
          entity?: { title: unknown; href?: string };
        }>;
      };

      expect(block.items[0].entityId).toBe("person-ayrton-senna");
      expect(block.items[0].entity?.href).toBe("/people/ayrton-senna");
      expect(block.items[1].entityId).toBe("no-such-entity");
      expect(block.items[1].entity).toBeUndefined();
    });
  });
});
