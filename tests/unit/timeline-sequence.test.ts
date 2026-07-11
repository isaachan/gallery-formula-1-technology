import { describe, expect, it } from "vitest";
import {
  validateSeasonRange,
  validateSeasonSequence,
} from "../../src/timeline/sequence";

describe("validateSeasonSequence", () => {
  it("returns no issues for a complete, gap-free, duplicate-free sequence", () => {
    const seasons = [1950, 1951, 1952].map((year) => ({ year }));
    expect(validateSeasonSequence(seasons)).toEqual([]);
  });

  it("returns no issues for an empty list", () => {
    expect(validateSeasonSequence([])).toEqual([]);
  });

  it("reports a gap for a missing year within the observed range", () => {
    const seasons = [1950, 1951, 1953].map((year) => ({ year }));
    expect(validateSeasonSequence(seasons)).toEqual([
      { type: "gap", year: 1952 },
    ]);
  });

  it("reports every duplicate year", () => {
    const seasons = [1950, 1951, 1951, 1952, 1952].map((year) => ({ year }));
    expect(validateSeasonSequence(seasons)).toEqual([
      { type: "duplicate", year: 1951 },
      { type: "duplicate", year: 1952 },
    ]);
  });

  it("reports both gaps and duplicates together, sorted by year", () => {
    const seasons = [1950, 1950, 1953].map((year) => ({ year }));
    expect(validateSeasonSequence(seasons)).toEqual([
      { type: "duplicate", year: 1950 },
      { type: "gap", year: 1951 },
      { type: "gap", year: 1952 },
    ]);
  });
});

describe("validateSeasonRange", () => {
  it("reports gaps for years missing from the required range even beyond the observed min/max", () => {
    const seasons = [1951, 1952].map((year) => ({ year }));
    const issues = validateSeasonRange(seasons, { from: 1950, to: 1953 });

    expect(issues).toEqual([
      { type: "gap", year: 1950 },
      { type: "gap", year: 1953 },
    ]);
  });

  it("returns no issues when the range is exactly covered once each", () => {
    const seasons = [1950, 1951, 1952].map((year) => ({ year }));
    expect(validateSeasonRange(seasons, { from: 1950, to: 1952 })).toEqual([]);
  });
});
