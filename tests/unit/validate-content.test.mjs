import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
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

const temporaryRoots = [];

afterEach(async () => {
  await Promise.all(
    temporaryRoots.splice(0).map(async (temporaryRoot) => {
      await fs.rm(temporaryRoot, { recursive: true, force: true });
    }),
  );
});

describe("validateContentRoot", () => {
  it("returns no failures when the expected content directories exist", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "f1-content-"));
    temporaryRoots.push(root);

    await Promise.all(
      requiredDirectories.map(async (directory) => {
        await fs.mkdir(path.join(root, directory), { recursive: true });
      }),
    );

    await expect(validateContentRoot(root)).resolves.toEqual([]);
  });

  it("returns actionable directory failures when structure is incomplete", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "f1-content-"));
    temporaryRoots.push(root);
    await fs.mkdir(path.join(root, "seasons"), { recursive: true });

    const failures = await validateContentRoot(root);

    expect(failures).toContain(
      `Missing content directory: ${path.join(root, "cars")}`,
    );
    expect(failures).toContain(
      `Missing content directory: ${path.join(root, "technologies")}`,
    );
  });

  it("reports file-path and field-level diagnostics for invalid entity JSON", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "f1-content-"));
    temporaryRoots.push(root);

    await Promise.all(
      requiredDirectories.map(async (directory) => {
        await fs.mkdir(path.join(root, directory), { recursive: true });
      }),
    );

    await fs.writeFile(
      path.join(root, "technologies", "broken-tech.json"),
      JSON.stringify({
        schemaVersion: 1,
        type: "technology",
        id: "broken",
        slug: "Broken Slug",
        status: "draft",
        title: { zh: "  " },
        summary: { zh: "summary" },
        sourceIds: ["source-1"],
        blocks: [],
        updatedAt: "not-a-date",
      }),
      "utf8",
    );

    const failures = await validateContentRoot(root);

    expect(failures).toContain(
      "technologies/broken-tech.json:id must be a stable kebab-case id with at least one namespace segment",
    );
    expect(failures).toContain(
      "technologies/broken-tech.json:slug must be a kebab-case slug",
    );
    expect(failures).toContain(
      "technologies/broken-tech.json:title.zh must be a non-empty Chinese string",
    );
    expect(failures).toContain(
      "technologies/broken-tech.json:updatedAt must be an ISO 8601 datetime string",
    );
  });

  it("reports standings-specific validation failures through the shared content validator", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "f1-content-"));
    temporaryRoots.push(root);

    await Promise.all(
      requiredDirectories.map(async (directory) => {
        await fs.mkdir(path.join(root, directory), { recursive: true });
      }),
    );

    await fs.writeFile(
      path.join(root, "standings", "broken-standing.json"),
      JSON.stringify({
        schemaVersion: 1,
        type: "standing",
        id: "standing-1988-drivers",
        slug: "1988-driver-standings",
        status: "published",
        title: { zh: "1988 车手积分榜" },
        summary: { zh: "summary" },
        sourceIds: ["source-1"],
        blocks: [],
        updatedAt: "2026-07-11T12:00:00.000Z",
        standingKind: "driver",
        seasonId: "season-1988",
        defaultVisibleCount: 1,
        entries: [
          { position: 1, competitorId: "person-a", points: 25 },
          { position: 1, competitorId: "person-a", points: -5 },
        ],
      }),
      "utf8",
    );

    const failures = await validateContentRoot(root);

    expect(failures).toContain(
      "standings/broken-standing.json:defaultVisibleCount must be exactly 3 for driver standings",
    );
    expect(failures).toContain(
      "standings/broken-standing.json:entries[1].position must be unique within the standings",
    );
    expect(failures).toContain(
      "standings/broken-standing.json:entries[1].points must be a non-negative number",
    );
  });

  it("reports car, team, and person validation failures through the shared content validator", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "f1-content-"));
    temporaryRoots.push(root);

    await Promise.all(
      requiredDirectories.map(async (directory) => {
        await fs.mkdir(path.join(root, directory), { recursive: true });
      }),
    );

    await fs.writeFile(
      path.join(root, "cars", "broken-car.json"),
      JSON.stringify({
        schemaVersion: 1,
        type: "car",
        id: "car-mclaren-mp4-4",
        slug: "mclaren-mp4-4",
        status: "published",
        title: { zh: "迈凯伦 MP4/4" },
        summary: { zh: "summary" },
        sourceIds: ["source-1"],
        blocks: [],
        updatedAt: "2026-07-11T12:00:00.000Z",
        seasonIds: ["season-1988", "season-1988"],
        constructorId: "",
        driverIds: ["person-a"],
        technologyIds: ["technology-a"],
        engine: "",
        specifications: {},
      }),
      "utf8",
    );

    const failures = await validateContentRoot(root);

    expect(failures).toContain(
      "cars/broken-car.json:seasonIds must not contain duplicate values",
    );
    expect(failures).toContain(
      "cars/broken-car.json:constructorId must be a non-empty team id",
    );
    expect(failures).toContain(
      "cars/broken-car.json:engine must be a non-empty string",
    );
    expect(failures).toContain(
      "cars/broken-car.json:specifications must be an object with one or more localized specification values",
    );
  });
});
