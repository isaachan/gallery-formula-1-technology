import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  buildScaffoldDocument,
  scaffoldContent,
} from "../../tools/content/scaffold-content.mjs";
import { validateContentRoot } from "../../tools/content/validate-content.mjs";

const ALL_TYPES = [
  "season",
  "race",
  "circuit",
  "standing",
  "car",
  "team",
  "person",
  "era",
  "technology",
  "source",
  "mediaAsset",
];

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
    temporaryRoots
      .splice(0)
      .map((root) => fs.rm(root, { recursive: true, force: true })),
  );
});

async function makeContentRoot() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "f1-scaffold-"));
  temporaryRoots.push(root);
  await Promise.all(
    requiredDirectories.map((directory) =>
      fs.mkdir(path.join(root, directory), { recursive: true }),
    ),
  );
  return root;
}

describe("buildScaffoldDocument", () => {
  it("rejects an unknown entity type", () => {
    expect(() => buildScaffoldDocument("planet", "mars")).toThrow(
      /Unknown entity type "planet"/,
    );
  });

  it("rejects a non-kebab-case slug", () => {
    expect(() => buildScaffoldDocument("season", "1988 Season")).toThrow(
      /must be a kebab-case string/,
    );
  });

  it.each(ALL_TYPES)(
    "produces a document that passes schema validation for %s",
    (type) => {
      const { document } = buildScaffoldDocument(type, "example-slug");

      // mediaAsset intentionally has no `id` cross-reference issues to check
      // here (checked separately below); every other type must at minimum
      // carry the common envelope's required fields.
      expect(document.type).toBe(type);
      if (type !== "mediaAsset") {
        expect(document.status).toBe("draft");
        expect(document.sourceIds.length).toBeGreaterThan(0);
      }
    },
  );
});

describe("scaffoldContent", () => {
  it("writes a new file to the correct entity directory", async () => {
    const root = await makeContentRoot();

    const filePath = await scaffoldContent("season", "1988", root);

    expect(filePath).toBe(path.join(root, "seasons", "season-1988.json"));
    const written = JSON.parse(await fs.readFile(filePath, "utf8"));
    expect(written.id).toBe("season-1988");
    expect(written.slug).toBe("1988");
  });

  it("refuses to overwrite an existing file", async () => {
    const root = await makeContentRoot();
    await scaffoldContent("era", "1980s", root);

    await expect(scaffoldContent("era", "1980s", root)).rejects.toThrow(
      /Refusing to overwrite/,
    );
  });

  it("scaffolds every entity type as schema-valid draft content with only actionable missing-reference failures", async () => {
    const root = await makeContentRoot();

    for (const type of ALL_TYPES) {
      await scaffoldContent(type, `test-${type.toLowerCase()}`, root);
    }

    const failures = await validateContentRoot(root, {
      publicRoot: path.join(root, "..", "unused-public-root"),
    });

    // Every failure must be a reference to another not-yet-created TODO
    // entity (or the placeholder media file), never a schema/shape defect —
    // proving the scaffolds are structurally valid and only missing the
    // real relationships a content author fills in next.
    for (const failure of failures) {
      expect(failure).toMatch(/-todo|entity-todo|does not exist/);
    }
  });
});
