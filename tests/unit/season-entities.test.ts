import fs from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  formatTypedValidationIssues,
  validateTypedEntityDocument,
} from "../../src/domain/season-entities.mjs";

const fixturesRoot = path.join(
  process.cwd(),
  "tests/fixtures/content/season-entities",
);

async function readFixture(group: "valid" | "invalid", fileName: string) {
  const raw = await fs.readFile(
    path.join(fixturesRoot, group, fileName),
    "utf8",
  );
  return JSON.parse(raw);
}

describe("validateTypedEntityDocument", () => {
  it("accepts valid season, race, circuit, and standing fixtures", async () => {
    const season = await readFixture("valid", "season-entry.json");
    const race = await readFixture("valid", "race-entry.json");
    const circuit = await readFixture("valid", "circuit-entry.json");
    const standing = await readFixture("valid", "driver-standing-entry.json");

    expect(validateTypedEntityDocument(season)).toEqual({
      success: true,
      issues: [],
    });
    expect(validateTypedEntityDocument(race)).toEqual({
      success: true,
      issues: [],
    });
    expect(validateTypedEntityDocument(circuit)).toEqual({
      success: true,
      issues: [],
    });
    expect(validateTypedEntityDocument(standing)).toEqual({
      success: true,
      issues: [],
    });
  });

  it("returns standings-specific issues for invalid data", async () => {
    const standing = await readFixture(
      "invalid",
      "broken-driver-standing.json",
    );
    const result = validateTypedEntityDocument(standing);

    expect(result.success).toBe(false);
    expect(result.issues).toEqual(
      expect.arrayContaining([
        {
          path: "defaultVisibleCount",
          message: "must be exactly 3 for driver standings",
        },
        {
          path: "entries[1].position",
          message: "must be unique within the standings",
        },
        {
          path: "entries[1].competitorId",
          message: "must be unique within the standings",
        },
        {
          path: "entries[1].points",
          message: "must be a non-negative number",
        },
      ]),
    );
  });

  it("formats file-path diagnostics for typed entities", () => {
    const formatted = formatTypedValidationIssues(
      "content/standings/1988.json",
      {
        success: false,
        issues: [
          {
            path: "entries[1].points",
            message: "must be a non-negative number",
          },
        ],
      },
    );

    expect(formatted).toEqual([
      "content/standings/1988.json:entries[1].points must be a non-negative number",
    ]);
  });
});
