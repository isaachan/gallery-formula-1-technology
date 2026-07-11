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
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "f1-person-page-"));
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

describe("PersonPage", () => {
  it("renders profile, achievements, teams, derived cars, and representative seasons", async () => {
    process.env.CONTENT_ROOT = await buildFixtureContentRoot();
    const { default: PersonPage } = await import(
      "../../src/app/people/[slug]/page"
    );

    const element = await PersonPage({
      params: Promise.resolve({ slug: "ayrton-senna" }),
    });
    render(element);

    expect(
      screen.getByRole("heading", { name: "艾尔顿·塞纳" }),
    ).toBeInTheDocument();
    expect(screen.getByText("车手")).toBeInTheDocument();
    expect(screen.getByText("Brazilian")).toBeInTheDocument();
    expect(screen.getByText("1984 - 1994")).toBeInTheDocument();
    expect(screen.getByText("🏆 1988 年世界冠军")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "迈凯伦" })).toHaveAttribute(
      "href",
      "/teams/mclaren",
    );
    expect(screen.getByRole("link", { name: "迈凯伦 MP4/4" })).toHaveAttribute(
      "href",
      "/cars/mclaren-mp4-4",
    );
    expect(screen.getByRole("link", { name: "1988 赛季" })).toHaveAttribute(
      "href",
      "/seasons/1988",
    );
  });

  it("returns not-found for a person slug that does not exist", async () => {
    process.env.CONTENT_ROOT = await buildFixtureContentRoot();
    const { default: PersonPage } = await import(
      "../../src/app/people/[slug]/page"
    );

    await expect(
      PersonPage({ params: Promise.resolve({ slug: "no-such-person" }) }),
    ).rejects.toThrow("NEXT_HTTP_ERROR_FALLBACK;404");
  });
});
