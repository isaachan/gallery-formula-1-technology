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

const temporaryRoots: string[] = [];
const originalContentRoot = process.env.CONTENT_ROOT;

async function buildFixtureContentRoot(
  extraFiles: Array<[string, unknown]> = [],
) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "f1-technology-page-"));
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

describe("TechnologyPage", () => {
  it("renders category, difficulty, related cars/seasons, and a timeline action", async () => {
    process.env.CONTENT_ROOT = await buildFixtureContentRoot([
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
    const { default: TechnologyPage } = await import(
      "../../src/app/technologies/[slug]/page"
    );

    const element = await TechnologyPage({
      params: Promise.resolve({ slug: "honda-ra168e" }),
    });
    render(element);

    expect(
      screen.getByRole("heading", { name: "本田 RA168E" }),
    ).toBeInTheDocument();
    expect(screen.getByText("1988 赛季 · 动力单元")).toBeInTheDocument();
    expect(screen.getByText("进阶")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "迈凯伦 MP4/4" })).toHaveAttribute(
      "href",
      "/cars/mclaren-mp4-4",
    );
    expect(screen.getByRole("link", { name: "1988 赛季" })).toHaveAttribute(
      "href",
      "/seasons/1988",
    );
    expect(screen.getByRole("link", { name: "低车身包装" })).toHaveAttribute(
      "href",
      "/technologies/low-line-packaging",
    );
    expect(screen.getByRole("link", { name: "1988 ↩" })).toHaveAttribute(
      "href",
      "/seasons/1988",
    );
    expect(
      screen.getByRole("link", { name: "报告 本田 RA168E 的内容问题" }),
    ).toHaveAttribute("href", expect.stringContaining("mailto:"));
  });

  it("renders the animation hero stage when the technology has a real animation block", async () => {
    process.env.CONTENT_ROOT = await buildFixtureContentRoot([
      [
        "media/media-turbo-animation-poster.json",
        {
          schemaVersion: 1,
          type: "mediaAsset",
          id: "media-turbo-animation-poster",
          kind: "poster",
          src: "https://media.example.com/turbo-poster.jpg",
          alt: { zh: "涡轮增压循环动画海报帧" },
          rights: { status: "owned" },
        },
      ],
      [
        "media/media-turbo-animation.json",
        {
          schemaVersion: 1,
          type: "mediaAsset",
          id: "media-turbo-animation",
          kind: "video",
          src: "https://media.example.com/turbo-loop.mp4",
          alt: { zh: "涡轮增压气流动画" },
          posterMediaId: "media-turbo-animation-poster",
          rights: { status: "owned" },
        },
      ],
      [
        "technologies/technology-honda-ra168e.json",
        {
          schemaVersion: 1,
          type: "technology",
          id: "technology-honda-ra168e",
          slug: "honda-ra168e",
          status: "published",
          title: { zh: "本田 RA168E", en: "Honda RA168E" },
          summary: { zh: "1988 年代表性涡轮动力单元。" },
          sourceIds: ["source-honda-archive"],
          blocks: [
            {
              id: "ra168e-turbo-animation",
              type: "animation",
              mediaId: "media-turbo-animation",
              explanation: {
                zh: "动画展示了废气驱动涡轮旋转并压缩进气的过程。",
              },
            },
          ],
          updatedAt: "2026-07-11T12:00:00.000Z",
          category: "engine",
          firstSeasonId: "season-1988",
          seasonIds: ["season-1988"],
          carIds: ["car-mclaren-mp4-4"],
          difficulty: "advanced",
        },
      ],
    ]);
    const { default: TechnologyPage } = await import(
      "../../src/app/technologies/[slug]/page"
    );

    const element = await TechnologyPage({
      params: Promise.resolve({ slug: "honda-ra168e" }),
    });
    render(element);

    expect(screen.getByText("▶ 动画演示 · 本田 RA168E")).toBeInTheDocument();
    const video = document.querySelector("video");
    expect(video).toHaveAttribute(
      "poster",
      "https://media.example.com/turbo-poster.jpg",
    );
  });

  it("returns not-found for a technology slug that does not exist", async () => {
    process.env.CONTENT_ROOT = await buildFixtureContentRoot();
    const { default: TechnologyPage } = await import(
      "../../src/app/technologies/[slug]/page"
    );

    await expect(
      TechnologyPage({
        params: Promise.resolve({ slug: "no-such-technology" }),
      }),
    ).rejects.toThrow("NEXT_HTTP_ERROR_FALLBACK;404");
  });
});
