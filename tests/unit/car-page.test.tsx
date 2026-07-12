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
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "f1-car-page-"));
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

const MCLAREN_ARCHIVE_SOURCE: [string, unknown] = [
  "sources/source-mclaren-archive.json",
  {
    schemaVersion: 1,
    type: "source",
    id: "source-mclaren-archive",
    slug: "mclaren-archive",
    status: "published",
    title: { zh: "迈凯伦档案" },
    summary: { zh: "迈凯伦官方历史档案。" },
    sourceIds: ["source-mclaren-archive"],
    blocks: [],
    updatedAt: "2026-07-11T12:00:00.000Z",
    sourceType: "official",
    url: "https://example.com/mclaren-archive",
    accessedOn: "2026-07-11",
    supportedClaims: [{ entityId: "car-mclaren-mp4-4", field: "summary" }],
  },
];

describe("CarPage", () => {
  it("renders specifications, constructor, drivers, seasons, technologies, and sources", async () => {
    process.env.CONTENT_ROOT = await buildFixtureContentRoot([
      MCLAREN_ARCHIVE_SOURCE,
    ]);
    const { default: CarPage } = await import("../../src/app/cars/[slug]/page");

    const element = await CarPage({
      params: Promise.resolve({ slug: "mclaren-mp4-4" }),
    });
    const { container } = render(element);

    expect(
      screen.getByRole("heading", { name: "迈凯伦 MP4/4" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Honda RA168E")).toBeInTheDocument();
    expect(screen.getByText("15 胜")).toBeInTheDocument();
    expect(screen.getByText("👑 冠军车")).toBeInTheDocument();
    expect(
      screen.getAllByRole("link", { name: "迈凯伦" }).at(0),
    ).toHaveAttribute("href", "/teams/mclaren");
    expect(screen.getByRole("link", { name: "艾尔顿·塞纳" })).toHaveAttribute(
      "href",
      "/people/ayrton-senna",
    );
    expect(screen.getByRole("link", { name: "返回" })).toHaveAttribute(
      "href",
      "/seasons/1988",
    );
    expect(screen.getByRole("link", { name: "本田 RA168E" })).toHaveAttribute(
      "href",
      "/technologies/honda-ra168e",
    );
    expect(screen.getByText("迈凯伦档案")).toBeInTheDocument();
    expect(container.querySelector(".entity-spec-row")).toHaveTextContent(
      "碳纤维单体壳",
    );
    expect(screen.getByText("拖入实车照片 ①")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "报告 迈凯伦 MP4/4 的内容问题" }),
    ).toHaveAttribute("href", expect.stringContaining("mailto:"));
  });

  it("returns not-found for a car slug that does not exist", async () => {
    process.env.CONTENT_ROOT = await buildFixtureContentRoot();
    const { default: CarPage } = await import("../../src/app/cars/[slug]/page");

    await expect(
      CarPage({ params: Promise.resolve({ slug: "no-such-car" }) }),
    ).rejects.toThrow("NEXT_HTTP_ERROR_FALLBACK;404");
  });
});
