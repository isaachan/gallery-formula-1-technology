import { describe, expect, it } from "vitest";
import { getContentRepository } from "@/content/get-repository";
import { buildDemoTimelineSeasons } from "@/timeline/demo-seasons";
import {
  validateSeasonRange,
  validateSeasonSequence,
} from "@/timeline/sequence";

describe("timeline sequence integration", () => {
  it("keeps the shipped demo timeline sequence complete from 1950 through 2025", () => {
    expect(
      validateSeasonRange(buildDemoTimelineSeasons(), {
        from: 1950,
        to: 2025,
      }),
    ).toEqual([]);
  });

  it("keeps repository-authored seasons gap-free and duplicate-free within their authored range", async () => {
    const repository = await getContentRepository();
    const seasons = await repository.getTimeline();

    expect(validateSeasonSequence(seasons)).toEqual([]);
  });
});
