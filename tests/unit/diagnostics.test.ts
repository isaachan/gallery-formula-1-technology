import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  computeContentVersion,
  getBuildDiagnostics,
} from "../../src/lib/diagnostics";

describe("diagnostics helpers", () => {
  it("computes a deterministic hash for the content directory", async () => {
    const contentRoot = await fs.mkdtemp(
      path.join(os.tmpdir(), "f1-diagnostics-"),
    );
    const seasonsDirectory = path.join(contentRoot, "seasons");

    await fs.mkdir(seasonsDirectory, { recursive: true });
    await fs.writeFile(
      path.join(seasonsDirectory, "1950.json"),
      JSON.stringify({ id: "season-1950" }),
      "utf8",
    );

    process.env.CONTENT_ROOT = contentRoot;
    const firstVersion = await computeContentVersion();
    const secondVersion = await computeContentVersion();

    expect(firstVersion).toHaveLength(12);
    expect(firstVersion).toBe(secondVersion);
  });

  it("returns app, content, and git diagnostics", async () => {
    process.env.APP_VERSION = "1.2.3";
    process.env.CONTENT_VERSION = "abc123def456";
    process.env.GITHUB_SHA = "1234567890abcdef";

    await expect(getBuildDiagnostics()).resolves.toMatchObject({
      appVersion: "1.2.3",
      contentVersion: "abc123def456",
      gitSha: "1234567890ab",
    });
  });
});
