import { describe, expect, it } from "vitest";
import { getContentRepository } from "@/content/get-repository";
import {
  validateSeasonRange,
  validateSeasonSequence,
} from "@/timeline/sequence";

describe("timeline sequence integration", () => {
  it("keeps the real repository timeline complete from 1950 through 2025 with no gaps or duplicates", async () => {
    const repository = await getContentRepository();
    const seasons = await repository.getTimeline();

    expect(validateSeasonSequence(seasons)).toEqual([]);
    expect(validateSeasonRange(seasons, { from: 1950, to: 2025 })).toEqual([]);
  });
});
