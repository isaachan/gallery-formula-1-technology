import fs from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { validateMediaAssetDocument } from "../../src/domain/media-entities.mjs";
import { validateTypedEntityDocument } from "../../src/domain/season-entities.mjs";

const fixturesRoot = path.join(
  process.cwd(),
  "tests/fixtures/content/media-entities",
);

async function readFixture(group: "valid" | "invalid", fileName: string) {
  const raw = await fs.readFile(
    path.join(fixturesRoot, group, fileName),
    "utf8",
  );
  return JSON.parse(raw);
}

describe("validateMediaAssetDocument", () => {
  it("accepts valid image and model fixtures", async () => {
    const image = await readFixture("valid", "image-entry.json");
    const model = await readFixture("valid", "model-entry.json");

    expect(validateMediaAssetDocument(image)).toEqual({
      success: true,
      issues: [],
    });
    expect(validateMediaAssetDocument(model)).toEqual({
      success: true,
      issues: [],
    });
  });

  it("returns media-specific issues for invalid model data", async () => {
    const model = await readFixture("invalid", "broken-model.json");
    const result = validateMediaAssetDocument(model);

    expect(result.success).toBe(false);
    expect(result.issues).toEqual(
      expect.arrayContaining([
        {
          path: "src",
          message: "must be a non-empty source URL or path",
        },
        {
          path: "alt.zh",
          message: "must be a non-empty Chinese string",
        },
        {
          path: "rights.status",
          message:
            "must be one of: owned, licensed, public-domain, permission-required",
        },
        {
          path: "posterMediaId",
          message: "is required for video and model3d assets",
        },
        {
          path: "model.format",
          message: "must be one of: gltf, glb",
        },
        {
          path: "model.scale",
          message: "must be a positive number when provided",
        },
      ]),
    );
  });

  it("is reachable through the shared typed dispatch", async () => {
    const image = await readFixture("valid", "image-entry.json");

    expect(validateTypedEntityDocument(image)).toEqual({
      success: true,
      issues: [],
    });
  });
});
