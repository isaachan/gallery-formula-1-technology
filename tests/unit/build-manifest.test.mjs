import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  createBuildManifest,
  writeBuildManifest,
} from "../../tools/content/build-manifest.mjs";

const temporaryRoots = [];

const manifestInput = {
  appVersion: "1.2.3",
  contentVersion: "content-abc123",
  commit: "1234567890abcdef1234567890abcdef12345678",
  contentPackId: "bundled-2026-07-29",
  graphVersion: "graph-v1",
  mediaManifestVersion: "media-v1",
};
const fixedNow = () => new Date("2026-07-29T12:34:56.000Z");

afterEach(async () => {
  await Promise.all(
    temporaryRoots
      .splice(0)
      .map((root) => fs.rm(root, { recursive: true, force: true })),
  );
});

describe("build manifest", () => {
  it("creates the complete versioned contract from injected values", () => {
    expect(createBuildManifest(manifestInput, fixedNow)).toEqual({
      schemaVersion: 1,
      appVersion: "1.2.3",
      contentVersion: "content-abc123",
      buildCommit: "1234567890abcdef1234567890abcdef12345678",
      builtAt: "2026-07-29T12:34:56.000Z",
      contentPackId: "bundled-2026-07-29",
      graphVersion: "graph-v1",
      mediaManifestVersion: "media-v1",
    });
  });

  it("uses an injected clock without reading the wall clock", () => {
    const manifest = createBuildManifest(
      manifestInput,
      () => new Date("2000-01-02T03:04:05.000Z"),
    );

    expect(manifest.builtAt).toBe("2000-01-02T03:04:05.000Z");
  });

  it("preserves the full build commit for release identification", () => {
    expect(createBuildManifest(manifestInput, fixedNow).buildCommit).toBe(
      manifestInput.commit,
    );
  });

  it.each([
    "appVersion",
    "contentVersion",
    "commit",
    "contentPackId",
    "graphVersion",
    "mediaManifestVersion",
  ])("rejects a missing required %s", (field) => {
    expect(() =>
      createBuildManifest({ ...manifestInput, [field]: "" }, fixedNow),
    ).toThrow(field);
  });

  it("writes the deterministic manifest contract to the requested artifact path", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "f1-build-manifest-"));
    temporaryRoots.push(root);
    const outputPath = path.join(root, "nested", "build-manifest.json");
    const manifest = createBuildManifest(manifestInput, fixedNow);

    await writeBuildManifest(outputPath, manifest);

    await expect(
      fs.readFile(outputPath, "utf8").then(JSON.parse),
    ).resolves.toEqual(manifest);
  });
});
