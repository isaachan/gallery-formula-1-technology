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

async function buildFixtureContentRoot(includeEntities = true) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "f1-museum-page-"));
  temporaryRoots.push(root);

  if (includeEntities) {
    await Promise.all(
      SEASON_1988_FIXTURES.map(async ([source, destination]) => {
        const destinationPath = path.join(root, destination);
        await fs.mkdir(path.dirname(destinationPath), { recursive: true });
        await fs.copyFile(path.join(FIXTURE_ROOT, source), destinationPath);
      }),
    );
  }

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

describe("MuseumPage", () => {
  it("lists published cars, people, and technologies with representative timeline links", async () => {
    process.env.CONTENT_ROOT = await buildFixtureContentRoot();
    const { default: MuseumPage } = await import("../../src/app/museum/page");

    render(await MuseumPage());

    expect(screen.getByRole("heading", { name: /博物馆/ })).toBeInTheDocument();
    expect(
      screen.getByText(
        (_, element) =>
          Boolean(element?.classList.contains("museum-sheet-row-title")) &&
          element?.textContent === "迈凯伦 MP4/4 ▸",
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "关闭博物馆" })).toHaveAttribute(
      "href",
      "/",
    );
  });

  it("shows the empty state when no entities have been published yet", async () => {
    process.env.CONTENT_ROOT = await buildFixtureContentRoot(false);
    const { default: MuseumPage } = await import("../../src/app/museum/page");

    render(await MuseumPage());

    expect(screen.getByText("暂无已发布的车辆条目。")).toBeInTheDocument();
  });
});
