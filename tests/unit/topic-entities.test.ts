import fs from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { validateTopicEntityDocument } from "../../src/domain/topic-entities.mjs";
import { validateTypedEntityDocument } from "../../src/domain/season-entities.mjs";

const fixturesRoot = path.join(
  process.cwd(),
  "tests/fixtures/content/topic-entities",
);

async function readFixture(group: "valid" | "invalid", fileName: string) {
  const raw = await fs.readFile(
    path.join(fixturesRoot, group, fileName),
    "utf8",
  );
  return JSON.parse(raw);
}

describe("validateTopicEntityDocument", () => {
  it("accepts valid technology, era, and source fixtures", async () => {
    const technology = await readFixture("valid", "technology-entry.json");
    const era = await readFixture("valid", "era-entry.json");
    const source = await readFixture("valid", "source-entry.json");

    expect(validateTopicEntityDocument(technology)).toEqual({
      success: true,
      issues: [],
    });
    expect(validateTopicEntityDocument(era)).toEqual({
      success: true,
      issues: [],
    });
    expect(validateTopicEntityDocument(source)).toEqual({
      success: true,
      issues: [],
    });
  });

  it("returns topic-specific issues for invalid source data", async () => {
    const source = await readFixture("invalid", "broken-source.json");
    const result = validateTopicEntityDocument(source);

    expect(result.success).toBe(false);
    expect(result.issues).toEqual(
      expect.arrayContaining([
        {
          path: "sourceType",
          message:
            "must be one of: official, book, article, archive, database, video",
        },
        {
          path: "url",
          message: "must be a non-empty URL string",
        },
        {
          path: "accessedOn",
          message: "must be an ISO 8601 calendar date (YYYY-MM-DD)",
        },
        {
          path: "supportedClaims[0].entityId",
          message: "must be a non-empty entity id",
        },
        {
          path: "supportedClaims[0].field",
          message: "must be a non-empty field path",
        },
      ]),
    );
  });

  it("is reachable through the shared typed dispatch", async () => {
    const technology = await readFixture("valid", "technology-entry.json");

    expect(validateTypedEntityDocument(technology)).toEqual({
      success: true,
      issues: [],
    });
  });
});
