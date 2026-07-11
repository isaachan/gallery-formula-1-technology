import fs from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { validateCommonEntityDocument } from "../../src/domain/common-entity.mjs";
import { validateMediaAssetDocument } from "../../src/domain/media-entities.mjs";
import { validateParticipantEntityDocument } from "../../src/domain/participant-entities.mjs";
import { validateTypedEntityDocument } from "../../src/domain/season-entities.mjs";
import { validateTopicEntityDocument } from "../../src/domain/topic-entities.mjs";

type ValidationResult = {
  success: boolean;
  issues: Array<{ path: string; message: string }>;
};

type FamilyConfig = {
  name: string;
  root: string;
  validate: (document: unknown) => ValidationResult;
};

const fixtureFamilies: FamilyConfig[] = [
  {
    name: "common-entity",
    root: path.join(process.cwd(), "tests/fixtures/content/common-entity"),
    validate: validateCommonEntityDocument,
  },
  {
    name: "season-entities",
    root: path.join(process.cwd(), "tests/fixtures/content/season-entities"),
    validate: validateTypedEntityDocument,
  },
  {
    name: "participant-entities",
    root: path.join(
      process.cwd(),
      "tests/fixtures/content/participant-entities",
    ),
    validate: validateParticipantEntityDocument,
  },
  {
    name: "topic-entities",
    root: path.join(process.cwd(), "tests/fixtures/content/topic-entities"),
    validate: validateTopicEntityDocument,
  },
  {
    name: "media-entities",
    root: path.join(process.cwd(), "tests/fixtures/content/media-entities"),
    validate: validateMediaAssetDocument,
  },
];

async function listFixtureFiles(root: string, group: string) {
  const directory = path.join(root, group);
  const entries = await fs.readdir(directory, { withFileTypes: true });

  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
    .map((entry) => entry.name)
    .sort();
}

async function readFixture(root: string, group: string, fileName: string) {
  const raw = await fs.readFile(path.join(root, group, fileName), "utf8");
  return JSON.parse(raw);
}

describe("content fixture matrix", () => {
  for (const family of fixtureFamilies) {
    it(`accepts every valid and boundary fixture for ${family.name}`, async () => {
      for (const group of ["valid", "boundary"] as const) {
        const fixtureFiles = await listFixtureFiles(family.root, group);

        expect(fixtureFiles.length).toBeGreaterThan(0);

        for (const fileName of fixtureFiles) {
          const result = family.validate(
            await readFixture(family.root, group, fileName),
          );

          expect(result).toEqual({
            success: true,
            issues: [],
          });
        }
      }
    });

    it(`rejects every invalid fixture for ${family.name}`, async () => {
      const fixtureFiles = await listFixtureFiles(family.root, "invalid");

      expect(fixtureFiles.length).toBeGreaterThan(0);

      for (const fileName of fixtureFiles) {
        const result = family.validate(
          await readFixture(family.root, "invalid", fileName),
        );

        expect(result.success).toBe(false);
        expect(result.issues.length).toBeGreaterThan(0);
      }
    });
  }
});
