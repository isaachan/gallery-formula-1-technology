import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fireEvent, render, screen, within } from "@testing-library/react";
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

function createRaceDocument(
  round: number,
  overrides: Record<string, unknown> = {},
) {
  return {
    schemaVersion: 1,
    type: "race",
    id: `race-1988-r${round}`,
    slug: `race-1988-r${round}`,
    status: "published",
    title: { zh: `1988 第${round}站大奖赛` },
    summary: { zh: `第 ${round} 站摘要` },
    sourceIds: ["source-honda-archive"],
    blocks: [],
    updatedAt: "2026-07-11T12:00:00.000Z",
    seasonId: "season-1988",
    circuitId: "circuit-jacarepagua",
    round,
    date: "1988-04-03",
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
  it("renders the prototype-matching header, hero, champion strip, and gallery", async () => {
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
          supportedClaims: [{ entityId: "season-1988", field: "summary" }],
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

    const heading = screen.getByRole("heading", { name: /1988/ });
    expect(heading).toHaveAttribute("tabindex", "-1");
    expect(screen.getByText("SEASON 39 / 76")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "🔊 引擎声" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "返回时间轴" })).toHaveAttribute(
      "href",
      "/?year=1988",
    );

    // Hero stage shows the champion car's name and constructor/driver sub.
    expect(screen.getAllByText("迈凯伦 MP4/4").length).toBeGreaterThan(0);
    expect(screen.getAllByText("迈凯伦 · 艾尔顿·塞纳").length).toBeGreaterThan(
      0,
    );

    // Champion strip.
    expect(screen.getByText("WORLD CHAMPION")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "艾尔顿·塞纳" })).toHaveAttribute(
      "href",
      "/people/ayrton-senna",
    );

    // Car gallery: the champion car gets the crown + gold border.
    const galleryLink = screen.getByRole("link", { name: /查看细节/ });
    expect(galleryLink).toHaveAttribute("href", "/cars/mclaren-mp4-4");
    expect(galleryLink.closest(".season-car-gallery-card")).toHaveAttribute(
      "data-champion",
      "true",
    );

    // Sources footer stays visible for citation even though the prototype
    // itself has no such section.
    expect(screen.getByText(/资料来源/)).toBeInTheDocument();
    expect(screen.getByText(/FIA 赛季回顾/)).toBeInTheDocument();

    expect(
      screen.getByRole("link", { name: "报告 1988 赛季 的内容问题" }),
    ).toHaveAttribute("href", expect.stringContaining("mailto:"));
  });

  it("still surfaces real richText story content, even though the prototype has no such section", async () => {
    process.env.CONTENT_ROOT = await buildFixtureContentRoot([
      [
        "seasons/season-1988.json",
        createSeasonDocument(1988, {
          blocks: [
            {
              id: "season-1988-story",
              type: "richText",
              heading: { zh: "赛季故事" },
              content: { zh: "涡轮时代的最后一舞。" },
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

    expect(screen.getByText("涡轮时代的最后一舞。")).toBeInTheDocument();
  });

  it("shows only the driver top 3 and links each row to the person page", async () => {
    process.env.CONTENT_ROOT = await buildFixtureContentRoot();
    const { default: SeasonPage } = await import(
      "../../src/app/seasons/[year]/page"
    );

    const element = await SeasonPage({
      params: Promise.resolve({ year: "1988" }),
    });
    render(element);

    expect(screen.getByText("车手榜")).toBeInTheDocument();
    expect(screen.getByText("TOP 3")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /艾尔顿·塞纳[\s\S]*90[\s\S]*pt/ }),
    ).toHaveAttribute("href", "/people/ayrton-senna");
    // No constructor standings block on this page - only the driver top 3.
    expect(screen.queryByText("车队积分榜")).not.toBeInTheDocument();
  });

  it("renders a technology card with its format badge", async () => {
    process.env.CONTENT_ROOT = await buildFixtureContentRoot();
    const { default: SeasonPage } = await import(
      "../../src/app/seasons/[year]/page"
    );

    const element = await SeasonPage({
      params: Promise.resolve({ year: "1988" }),
    });
    render(element);

    const techLink = screen.getByRole("link", { name: /本田 RA168E/ });
    expect(techLink).toHaveAttribute("href", "/technologies/honda-ra168e");
    expect(within(techLink).getByText("📖 图文")).toBeInTheDocument();
  });

  it("keeps race lists collapsed to the first 3 rounds until expanded", async () => {
    process.env.CONTENT_ROOT = await buildFixtureContentRoot([
      [
        "seasons/season-1988.json",
        createSeasonDocument(1988, {
          raceIds: [1, 2, 3, 4, 5, 6].map((round) => `race-1988-r${round}`),
        }),
      ],
      ...[1, 2, 3, 4, 5, 6].map(
        (round) =>
          [`races/race-1988-r${round}.json`, createRaceDocument(round)] as [
            string,
            unknown,
          ],
      ),
    ]);
    const { default: SeasonPage } = await import(
      "../../src/app/seasons/[year]/page"
    );

    const element = await SeasonPage({
      params: Promise.resolve({ year: "1988" }),
    });
    render(element);

    expect(screen.getByText("第1站大奖赛")).toBeInTheDocument();
    expect(screen.getByText("第3站大奖赛")).toBeInTheDocument();
    expect(screen.queryByText("第4站大奖赛")).not.toBeInTheDocument();

    const toggle = screen.getByRole("button", {
      name: "ALL · 查看全部 6 站 ▾",
    });
    fireEvent.click(toggle);

    expect(screen.getByText("第4站大奖赛")).toBeInTheDocument();
    expect(screen.getByText("第6站大奖赛")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "收起 ▴" })).toBeInTheDocument();
  });

  it("degrades gracefully for a season scoped to just the champion car", async () => {
    process.env.CONTENT_ROOT = await buildFixtureContentRoot([
      ["seasons/season-1987.json", createSeasonDocument(1987)],
    ]);
    const { default: SeasonPage } = await import(
      "../../src/app/seasons/[year]/page"
    );

    const element = await SeasonPage({
      params: Promise.resolve({ year: "1987" }),
    });
    render(element);

    expect(screen.getByText("CARS · 1 辆")).toBeInTheDocument();
    expect(screen.getByText(/资料整理中/)).toBeInTheDocument();
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

    expect(screen.getByRole("link", { name: /1987 赛季/ })).toHaveAttribute(
      "href",
      "/seasons/1987",
    );
    expect(screen.getByRole("link", { name: /1989 赛季/ })).toHaveAttribute(
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
      screen.queryByRole("link", { name: /1987 赛季/ }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /1989 赛季/ })).toHaveAttribute(
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

    expect(screen.getByRole("link", { name: /1987 赛季/ })).toHaveAttribute(
      "href",
      "/seasons/1987",
    );
    expect(
      screen.queryByRole("link", { name: /1989 赛季/ }),
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
