import fs from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  getLatestSchemaVersion,
  migrateDocumentFamily,
} from "../../src/domain/migrations.mjs";
import { validateCommonEntityDocument } from "../../src/domain/common-entity.mjs";

const fixturesRoot = path.join(
  process.cwd(),
  "tests/fixtures/content/migrations",
);

async function readFixture(fileName: string) {
  const raw = await fs.readFile(path.join(fixturesRoot, fileName), "utf8");
  return JSON.parse(raw);
}

describe("migrateDocumentFamily", () => {
  it("upgrades a v0 common entity fixture to the v1 contract", async () => {
    const before = await readFixture("common-entity-v0-before.json");
    const after = await readFixture("common-entity-v1-after.json");

    expect(migrateDocumentFamily("commonEntity", before)).toEqual(after);
  });

  it("is idempotent for already-migrated v1 content", async () => {
    const after = await readFixture("common-entity-v1-after.json");

    expect(migrateDocumentFamily("commonEntity", after)).toEqual(after);
  });

  it("preserves stable ids and produces valid v1 content", async () => {
    const before = await readFixture("common-entity-v0-before.json");
    const migrated = migrateDocumentFamily("commonEntity", before);

    expect(migrated.id).toBe(before.id);
    expect(migrated.schemaVersion).toBe(getLatestSchemaVersion("commonEntity"));
    expect(validateCommonEntityDocument(migrated)).toEqual({
      success: true,
      issues: [],
    });
  });
});
