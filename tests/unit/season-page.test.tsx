import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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

function createSeasonDocument(
  year: number,
  overrides: Record<string, unknown> = {},
) {
  return {
    schemaVersion: 1,
    type: "season",
    id: `season-${year}`,
    slug: `${year}-season`,
    status: "published",
    title: { zh: `${year} 赛季` },
    summary: { zh: `${year} 赛季摘要。` },
    sourceIds: ["source-honda-archive"],
    blocks: [],
    updatedAt: "2026-07-11T12:00:00.000Z",
    year,
    eraId: "era-1980s",
    highlighted: year === 1988,
    championPersonId: "person-ayrton-senna",
    championCarId: "car-mclaren-mp4-4",
    raceIds: ["race-1988-brazil"],
    standingIds: ["standing-1988-drivers"],
    entrantCarIds: ["car-mclaren-mp4-4"],
    featuredTechnologyIds: ["technology-honda-ra168e"],
    ...overrides,
  };
}

const temporaryRoots: string[] = [];
const originalContentRoot = process.env.CONTENT_ROOT;

async function buildFixtureContentRoot(
  extraFiles: Array<[string, unknown]> = [],
) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "f1-season-page-"));
  temporaryRoots.push(root);

  await Promise.all(
    SEASON_1988_FIXTURES.map(async ([source, destination]) => {
      const destinationPath = path.join(root, destination);
      await fs.mkdir(path.dirname(destinationPath), { recursive: true });
      await fs.copyFile(path.join(FIXTURE_ROOT, source), destinationPath);
    }),
  );

  await Promise.all(
    extraFiles.map(async ([destination, document]) => {
      const destinationPath = path.join(root, destination);
      await fs.mkdir(path.dirname(destinationPath), { recursive: true });
      await fs.writeFile(destinationPath, JSON.stringify(document, null, 2));
    }),
  );

  return root;
}

beforeEach(() => {
  vi.resetModules();
});

afterEach(async () => {
  if (originalContentRoot === undefined) {
    delete process.env.CONTENT_ROOT;
  } else {
    process.env.CONTENT_ROOT = originalContentRoot;
  }
  await Promise.all(
    temporaryRoots
      .splice(0)
      .map((root) => fs.rm(root, { recursive: true, force: true })),
  );
});

describe("SeasonPage", () => {
  it("renders the season summary for a year that exists", async () => {
    process.env.CONTENT_ROOT = await buildFixtureContentRoot([
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
    ]);
    const { default: SeasonPage } = await import(
      "../../src/app/seasons/[year]/page"
    );

    const element = await SeasonPage({
      params: Promise.resolve({ year: "1988" }),
    });
    const { container } = render(element);

    expect(
      screen.getByRole("heading", { name: "1988 赛季" }),
    ).toBeInTheDocument();
    expect(
      container.querySelector(".season-detail-champion-name"),
    ).toHaveTextContent("艾尔顿·塞纳 · 迈凯伦 MP4/4");
    expect(screen.getByText("年代背景")).toBeInTheDocument();
    expect(screen.getByText("1980 年代")).toBeInTheDocument();
    expect(screen.getByText("积分榜")).toBeInTheDocument();
    expect(screen.getByText("车手积分榜")).toBeInTheDocument();
    expect(screen.getByText("参赛车辆")).toBeInTheDocument();
    expect(screen.getByText("FIA 赛季回顾")).toBeInTheDocument();
    expect(
      screen.getAllByRole("link", { name: "迈凯伦 MP4/4" })[0],
    ).toHaveAttribute("href", "/cars/mclaren-mp4-4");
    expect(screen.getByRole("link", { name: "本田 RA168E" })).toHaveAttribute(
      "href",
      "/technologies/honda-ra168e",
    );
    expect(screen.getByRole("link", { name: "← 返回时间轴" })).toHaveAttribute(
      "href",
      "/?year=1988",
    );
    expect(screen.getByRole("heading", { name: "1988 赛季" })).toHaveAttribute(
      "tabindex",
      "-1",
    );
  });

  it("keeps long race lists compact until expanded", async () => {
    process.env.CONTENT_ROOT = await buildFixtureContentRoot([
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
      [
        "seasons/season-1988.json",
        {
          schemaVersion: 1,
          type: "season",
          id: "season-1988",
          slug: "1988-season",
          status: "published",
          title: { zh: "1988 赛季" },
          summary: { zh: "迈凯伦 MP4/4 统治的一年。" },
          sourceIds: ["source-honda-archive"],
          blocks: [],
          updatedAt: "2026-07-11T12:00:00.000Z",
          year: 1988,
          eraId: "era-1980s",
          highlighted: true,
          championPersonId: "person-ayrton-senna",
          championCarId: "car-mclaren-mp4-4",
          raceIds: [
            "race-1988-01",
            "race-1988-02",
            "race-1988-03",
            "race-1988-04",
            "race-1988-05",
            "race-1988-06",
          ],
          standingIds: ["standing-1988-drivers"],
          entrantCarIds: ["car-mclaren-mp4-4"],
          featuredTechnologyIds: ["technology-honda-ra168e"],
        },
      ],
      [
        "races/race-1988-01.json",
        {
          schemaVersion: 1,
          type: "race",
          id: "race-1988-01",
          slug: "race-1988-01",
          status: "published",
          title: { zh: "揭幕战" },
          summary: { zh: "揭幕战摘要" },
          sourceIds: ["source-honda-archive"],
          blocks: [],
          updatedAt: "2026-07-11T12:00:00.000Z",
          seasonId: "season-1988",
          circuitId: "circuit-jacarepagua",
          round: 1,
          date: "1988-04-03",
          winnerPersonId: "person-ayrton-senna",
        },
      ],
      [
        "races/race-1988-02.json",
        {
          schemaVersion: 1,
          type: "race",
          id: "race-1988-02",
          slug: "race-1988-02",
          status: "published",
          title: { zh: "第二站" },
          summary: { zh: "第二站摘要" },
          sourceIds: ["source-honda-archive"],
          blocks: [],
          updatedAt: "2026-07-11T12:00:00.000Z",
          seasonId: "season-1988",
          circuitId: "circuit-jacarepagua",
          round: 2,
          date: "1988-04-17",
        },
      ],
      [
        "races/race-1988-03.json",
        {
          schemaVersion: 1,
          type: "race",
          id: "race-1988-03",
          slug: "race-1988-03",
          status: "published",
          title: { zh: "第三站" },
          summary: { zh: "第三站摘要" },
          sourceIds: ["source-honda-archive"],
          blocks: [],
          updatedAt: "2026-07-11T12:00:00.000Z",
          seasonId: "season-1988",
          circuitId: "circuit-jacarepagua",
          round: 3,
          date: "1988-05-01",
        },
      ],
      [
        "races/race-1988-04.json",
        {
          schemaVersion: 1,
          type: "race",
          id: "race-1988-04",
          slug: "race-1988-04",
          status: "published",
          title: { zh: "第四站" },
          summary: { zh: "第四站摘要" },
          sourceIds: ["source-honda-archive"],
          blocks: [],
          updatedAt: "2026-07-11T12:00:00.000Z",
          seasonId: "season-1988",
          circuitId: "circuit-jacarepagua",
          round: 4,
          date: "1988-05-15",
        },
      ],
      [
        "races/race-1988-05.json",
        {
          schemaVersion: 1,
          type: "race",
          id: "race-1988-05",
          slug: "race-1988-05",
          status: "published",
          title: { zh: "第五站" },
          summary: { zh: "第五站摘要" },
          sourceIds: ["source-honda-archive"],
          blocks: [],
          updatedAt: "2026-07-11T12:00:00.000Z",
          seasonId: "season-1988",
          circuitId: "circuit-jacarepagua",
          round: 5,
          date: "1988-05-29",
        },
      ],
      [
        "races/race-1988-06.json",
        {
          schemaVersion: 1,
          type: "race",
          id: "race-1988-06",
          slug: "race-1988-06",
          status: "published",
          title: { zh: "第六站" },
          summary: { zh: "第六站摘要" },
          sourceIds: ["source-honda-archive"],
          blocks: [],
          updatedAt: "2026-07-11T12:00:00.000Z",
          seasonId: "season-1988",
          circuitId: "circuit-jacarepagua",
          round: 6,
          date: "1988-06-12",
        },
      ],
    ]);
    const { default: SeasonPage } = await import(
      "../../src/app/seasons/[year]/page"
    );

    const element = await SeasonPage({
      params: Promise.resolve({ year: "1988" }),
    });
    render(element);

    expect(
      screen.getByText((content) => content.includes("显示全部 6 场分站赛")),
    ).toBeInTheDocument();
    const collapsedRaces = document.querySelector(
      ".season-detail-races-more",
    ) as HTMLDetailsElement | null;
    expect(collapsedRaces).not.toBeNull();
    expect(collapsedRaces?.open).toBe(false);
    expect(collapsedRaces).toHaveTextContent("第六站");
  });

  it("renders optional engine audio without blocking the rest of the season page", async () => {
    process.env.CONTENT_ROOT = await buildFixtureContentRoot([
      [
        "seasons/season-1988.json",
        createSeasonDocument(1988, {
          blocks: [
            {
              id: "season-1988-engine-audio",
              type: "audio",
              heading: { zh: "引擎音效" },
              media: {
                id: "media-engine-audio",
                alt: { zh: "Honda RA168E 怠速与加速音效" },
                src: "https://media.example.com/engine.mp3",
                credit: "编辑部原创录音",
              },
              transcript: {
                zh: "非语音音频：引擎从怠速到加速的转速提升声音描述。",
              },
              sourceIds: ["source-honda-archive"],
            },
          ],
        }),
      ],
    ]);
    const { default: SeasonPage } = await import(
      "../../src/app/seasons/[year]/page"
    );

    const element = await SeasonPage({
      params: Promise.resolve({ year: "1988" }),
    });
    render(element);

    expect(screen.getByText("引擎音效")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "播放" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "停止" })).toBeInTheDocument();
    expect(
      screen.getByText("非语音音频：引擎从怠速到加速的转速提升声音描述。"),
    ).toBeInTheDocument();
    expect(screen.getByText("编辑部原创录音")).toBeInTheDocument();
    expect(screen.getByText("年代背景")).toBeInTheDocument();
  });

  it("renders adjacent season navigation and hides missing boundaries", async () => {
    process.env.CONTENT_ROOT = await buildFixtureContentRoot([
      ["seasons/season-1987.json", createSeasonDocument(1987)],
      ["seasons/season-1989.json", createSeasonDocument(1989)],
    ]);
    const { default: SeasonPage } = await import(
      "../../src/app/seasons/[year]/page"
    );

    const element = await SeasonPage({
      params: Promise.resolve({ year: "1988" }),
    });
    render(element);

    expect(
      screen.getByRole("navigation", { name: "相邻赛季导航" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "← 1987 赛季" })).toHaveAttribute(
      "href",
      "/seasons/1987",
    );
    expect(screen.getByRole("link", { name: "1989 赛季 →" })).toHaveAttribute(
      "href",
      "/seasons/1989",
    );
  });

  it("renders only the next-season control on the first boundary", async () => {
    process.env.CONTENT_ROOT = await buildFixtureContentRoot([
      ["seasons/season-1989.json", createSeasonDocument(1989)],
    ]);
    const { default: SeasonPage } = await import(
      "../../src/app/seasons/[year]/page"
    );

    const element = await SeasonPage({
      params: Promise.resolve({ year: "1988" }),
    });
    render(element);

    expect(
      screen.queryByRole("link", { name: "← 1987 赛季" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "1989 赛季 →" })).toHaveAttribute(
      "href",
      "/seasons/1989",
    );
  });

  it("renders only the previous-season control on the last boundary", async () => {
    process.env.CONTENT_ROOT = await buildFixtureContentRoot([
      ["seasons/season-1987.json", createSeasonDocument(1987)],
    ]);
    const { default: SeasonPage } = await import(
      "../../src/app/seasons/[year]/page"
    );

    const element = await SeasonPage({
      params: Promise.resolve({ year: "1988" }),
    });
    render(element);

    expect(screen.getByRole("link", { name: "← 1987 赛季" })).toHaveAttribute(
      "href",
      "/seasons/1987",
    );
    expect(
      screen.queryByRole("link", { name: "1989 赛季 →" }),
    ).not.toBeInTheDocument();
  });

  it("omits adjacent navigation when no neighboring season exists", async () => {
    process.env.CONTENT_ROOT = await buildFixtureContentRoot();
    const { default: SeasonPage } = await import(
      "../../src/app/seasons/[year]/page"
    );

    const element = await SeasonPage({
      params: Promise.resolve({ year: "1988" }),
    });
    render(element);

    expect(
      screen.queryByRole("navigation", { name: "相邻赛季导航" }),
    ).not.toBeInTheDocument();
  });

  it("builds season-specific metadata", async () => {
    process.env.CONTENT_ROOT = await buildFixtureContentRoot();
    const { generateMetadata } = await import(
      "../../src/app/seasons/[year]/page"
    );

    await expect(
      generateMetadata({ params: Promise.resolve({ year: "1988" }) }),
    ).resolves.toMatchObject({
      title: "1988 赛季 | F1 Track Chronicle",
      description: "迈凯伦 MP4/4 统治的一年。",
    });
  });

  it("calls notFound for a year with no matching season", async () => {
    process.env.CONTENT_ROOT = await buildFixtureContentRoot();
    const { default: SeasonPage } = await import(
      "../../src/app/seasons/[year]/page"
    );

    await expect(
      SeasonPage({ params: Promise.resolve({ year: "1951" }) }),
    ).rejects.toThrow("NEXT_HTTP_ERROR_FALLBACK;404");
  });

  it("calls notFound for a non-numeric year param", async () => {
    process.env.CONTENT_ROOT = await buildFixtureContentRoot();
    const { default: SeasonPage } = await import(
      "../../src/app/seasons/[year]/page"
    );

    await expect(
      SeasonPage({ params: Promise.resolve({ year: "not-a-year" }) }),
    ).rejects.toThrow("NEXT_HTTP_ERROR_FALLBACK;404");
  });
});
