import fs from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { validateParticipantEntityDocument } from "../../src/domain/participant-entities.mjs";
import { validateTypedEntityDocument } from "../../src/domain/season-entities.mjs";

const fixturesRoot = path.join(
  process.cwd(),
  "tests/fixtures/content/participant-entities",
);

async function readFixture(group: "valid" | "invalid", fileName: string) {
  const raw = await fs.readFile(
    path.join(fixturesRoot, group, fileName),
    "utf8",
  );
  return JSON.parse(raw);
}

describe("validateParticipantEntityDocument", () => {
  it("accepts valid car, team, and person fixtures", async () => {
    const car = await readFixture("valid", "car-entry.json");
    const team = await readFixture("valid", "team-entry.json");
    const person = await readFixture("valid", "person-entry.json");

    expect(validateParticipantEntityDocument(car)).toEqual({
      success: true,
      issues: [],
    });
    expect(validateParticipantEntityDocument(team)).toEqual({
      success: true,
      issues: [],
    });
    expect(validateParticipantEntityDocument(person)).toEqual({
      success: true,
      issues: [],
    });
  });

  it("returns participant-specific issues for invalid car data", async () => {
    const car = await readFixture("invalid", "broken-car.json");
    const result = validateParticipantEntityDocument(car);

    expect(result.success).toBe(false);
    expect(result.issues).toEqual(
      expect.arrayContaining([
        {
          path: "seasonIds",
          message: "must not contain duplicate values",
        },
        {
          path: "constructorId",
          message: "must be a non-empty team id",
        },
        {
          path: "driverIds",
          message: "must contain non-empty strings",
        },
        {
          path: "engine",
          message: "must be a non-empty string",
        },
        {
          path: "specifications.chassis.zh",
          message: "must be a non-empty Chinese string",
        },
        {
          path: "wins",
          message: "must be a non-negative integer when provided",
        },
      ]),
    );
  });

  it("is reachable through the shared typed dispatch", async () => {
    const person = await readFixture("valid", "person-entry.json");

    expect(validateTypedEntityDocument(person)).toEqual({
      success: true,
      issues: [],
    });
  });
});
