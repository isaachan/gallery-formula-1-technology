import fs from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  formatValidationIssue,
  supportedBlockTypes,
  supportedEntityStatuses,
  validateCommonEntityDocument,
} from "../../src/domain/common-entity.mjs";

const fixturesRoot = path.join(
  process.cwd(),
  "tests/fixtures/content/common-entity",
);

async function readFixture(group: "valid" | "invalid", fileName: string) {
  const raw = await fs.readFile(
    path.join(fixturesRoot, group, fileName),
    "utf8",
  );
  return JSON.parse(raw);
}

describe("validateCommonEntityDocument", () => {
  it("accepts a valid common entity document fixture", async () => {
    const fixture = await readFixture("valid", "technology-entry.json");

    expect(validateCommonEntityDocument(fixture)).toEqual({
      success: true,
      issues: [],
    });
  });

  it("returns field-level issues for an invalid fixture", async () => {
    const fixture = await readFixture("invalid", "missing-zh-and-block.json");

    const result = validateCommonEntityDocument(fixture);

    expect(result.success).toBe(false);
    expect(result.issues).toEqual(
      expect.arrayContaining([
        { path: "schemaVersion", message: "must be exactly 1" },
        {
          path: "id",
          message:
            "must be a stable kebab-case id with at least one namespace segment",
        },
        { path: "title.zh", message: "must be a non-empty Chinese string" },
        {
          path: "blocks[0].type",
          message: 'must be a supported block type, received "unknown"',
        },
      ]),
    );
  });

  it("formats actionable file-path diagnostics", () => {
    expect(
      formatValidationIssue("content/technologies/ra168e.json", {
        path: "title.zh",
        message: "must be a non-empty Chinese string",
      }),
    ).toBe(
      "content/technologies/ra168e.json:title.zh must be a non-empty Chinese string",
    );
  });

  it("exposes the supported lifecycle statuses and initial block registry", () => {
    expect(supportedEntityStatuses).toEqual(["draft", "published", "archived"]);
    expect(supportedBlockTypes).toEqual([
      "richText",
      "image",
      "gallery",
      "diagram",
      "animation",
      "audio",
      "video",
      "model3d",
      "factGrid",
      "quote",
      "relatedEntities",
    ]);
  });
});
