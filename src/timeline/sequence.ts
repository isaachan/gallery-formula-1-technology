export type SequenceIssue =
  | { type: "duplicate"; year: number }
  | { type: "gap"; year: number };

/**
 * Verifies that a season list contains exactly one entry per year across
 * its own min/max range, with no gaps or duplicates. Used to keep the
 * timeline honest as real content is added (US-C01.1's "no gaps or
 * duplicates" contract) without requiring the full 76-season set to exist
 * yet.
 */
export function validateSeasonSequence(
  seasons: Array<{ year: number }>,
): SequenceIssue[] {
  if (seasons.length === 0) {
    return [];
  }

  const issues: SequenceIssue[] = [];
  const counts = new Map<number, number>();

  for (const season of seasons) {
    counts.set(season.year, (counts.get(season.year) ?? 0) + 1);
  }

  for (const [year, count] of counts) {
    if (count > 1) {
      issues.push({ type: "duplicate", year });
    }
  }

  const years = [...counts.keys()];
  const minYear = Math.min(...years);
  const maxYear = Math.max(...years);

  for (let year = minYear; year <= maxYear; year++) {
    if (!counts.has(year)) {
      issues.push({ type: "gap", year });
    }
  }

  return issues.sort((a, b) => a.year - b.year);
}

/** Checks a season list exactly covers every year in `[from, to]` once each. */
export function validateSeasonRange(
  seasons: Array<{ year: number }>,
  range: { from: number; to: number },
): SequenceIssue[] {
  const issues = validateSeasonSequence(seasons);
  const years = new Set(seasons.map((season) => season.year));

  for (let year = range.from; year <= range.to; year++) {
    if (!years.has(year) && !issues.some((issue) => issue.year === year)) {
      issues.push({ type: "gap", year });
    }
  }

  return issues
    .filter((issue) => issue.year >= range.from && issue.year <= range.to)
    .sort((a, b) => a.year - b.year);
}
