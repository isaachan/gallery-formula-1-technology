import fs from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ignoredDirectories = new Set([
  ".git",
  ".next",
  "node_modules",
  "out",
  "WebAssets",
]);
const historicalReviews = new Set([
  "docs/ARCHITECTURE_REVIEW_2026-07-29.md",
  "docs/ARCHITECTURE_REVIEW_IMPLEMENTATION_PLAN_2026-07-29.md",
]);

async function collectFiles(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const discovered = await Promise.all(
    entries.map(async (entry) => {
      if (entry.isDirectory() && ignoredDirectories.has(entry.name)) {
        return [];
      }
      const entryPath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        return collectFiles(entryPath);
      }
      return [entryPath];
    }),
  );
  return discovered.flat();
}

describe("obsolete diagnostics endpoint contract", () => {
  it("is absent outside dated historical architecture reviews", async () => {
    const repositoryRoot = process.cwd();
    const thisTest = path.relative(repositoryRoot, import.meta.filename);
    const offenders = [];

    for (const filePath of await collectFiles(repositoryRoot)) {
      const relativePath = path.relative(repositoryRoot, filePath);
      if (
        relativePath === thisTest ||
        historicalReviews.has(relativePath) ||
        !/\.(?:md|mjs|ts|tsx|js|jsx|yml|yaml|sh)$/.test(relativePath)
      ) {
        continue;
      }
      const content = await fs.readFile(filePath, "utf8");
      if (content.includes("/api/diagnostics")) {
        offenders.push(relativePath);
      }
    }

    expect(offenders).toEqual([]);
  });
});
