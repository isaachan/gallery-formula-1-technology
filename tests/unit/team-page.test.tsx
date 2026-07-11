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
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "f1-team-page-"));
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

describe("TeamPage", () => {
  it("renders team kind, base country, people, cars, and seasons", async () => {
    process.env.CONTENT_ROOT = await buildFixtureContentRoot();
    const { default: TeamPage } = await import(
      "../../src/app/teams/[slug]/page"
    );

    const element = await TeamPage({
      params: Promise.resolve({ slug: "mclaren" }),
    });
    render(element);

    expect(screen.getByRole("heading", { name: "迈凯伦" })).toBeInTheDocument();
    expect(screen.getByText("constructor")).toBeInTheDocument();
    expect(screen.getByText("GBR")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "艾尔顿·塞纳" })).toHaveAttribute(
      "href",
      "/people/ayrton-senna",
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

  it("returns not-found for a team slug that does not exist", async () => {
    process.env.CONTENT_ROOT = await buildFixtureContentRoot();
    const { default: TeamPage } = await import(
      "../../src/app/teams/[slug]/page"
    );

    await expect(
      TeamPage({ params: Promise.resolve({ slug: "no-such-team" }) }),
    ).rejects.toThrow("NEXT_HTTP_ERROR_FALLBACK;404");
  });
});
