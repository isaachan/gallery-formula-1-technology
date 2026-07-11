import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { validateContentRoot } from "../../tools/content/validate-content.mjs";

const requiredDirectories = [
  "cars",
  "circuits",
  "eras",
  "media",
  "people",
  "races",
  "seasons",
  "sources",
  "standings",
  "teams",
  "technologies",
];

const temporaryRoots = [];

afterEach(async () => {
  await Promise.all(
    temporaryRoots.splice(0).map(async (temporaryRoot) => {
      await fs.rm(temporaryRoot, { recursive: true, force: true });
    }),
  );
});

describe("validateContentRoot", () => {
  it("returns no failures when the expected content directories exist", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "f1-content-"));
    temporaryRoots.push(root);

    await Promise.all(
      requiredDirectories.map(async (directory) => {
        await fs.mkdir(path.join(root, directory), { recursive: true });
      }),
    );

    await expect(validateContentRoot(root)).resolves.toEqual([]);
  });

  it("returns actionable directory failures when structure is incomplete", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "f1-content-"));
    temporaryRoots.push(root);
    await fs.mkdir(path.join(root, "seasons"), { recursive: true });

    const failures = await validateContentRoot(root);

    expect(failures).toContain(
      `Missing content directory: ${path.join(root, "cars")}`,
    );
    expect(failures).toContain(
      `Missing content directory: ${path.join(root, "technologies")}`,
    );
  });
});
