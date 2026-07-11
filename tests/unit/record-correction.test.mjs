import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { recordCorrectionMetadata } from "../../tools/content/record-correction.mjs";

const temporaryRoots = [];

afterEach(async () => {
  await Promise.all(
    temporaryRoots
      .splice(0)
      .map((root) => fs.rm(root, { recursive: true, force: true })),
  );
});

async function makeEntityFile(document) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "f1-correction-"));
  temporaryRoots.push(root);
  const filePath = path.join(root, "season-1988.json");
  await fs.writeFile(
    filePath,
    `${JSON.stringify(document, null, 2)}\n`,
    "utf8",
  );
  return { root, filePath };
}

describe("recordCorrectionMetadata", () => {
  it("updates reviewedBy and updatedAt on the target entity", async () => {
    const { root, filePath } = await makeEntityFile({
      schemaVersion: 1,
      type: "season",
      id: "season-1988",
      slug: "1988-season",
      status: "published",
      title: { zh: "1988 赛季" },
      summary: { zh: "摘要" },
      sourceIds: ["source-example"],
      blocks: [],
      updatedAt: "2026-07-11T12:00:00.000Z",
    });

    const result = await recordCorrectionMetadata(
      [
        filePath,
        "--reviewed-by",
        "Content QA",
        "--updated-at",
        "2026-07-12T08:00:00.000Z",
      ],
      root,
    );

    expect(result.document.reviewedBy).toBe("Content QA");
    expect(result.document.updatedAt).toBe("2026-07-12T08:00:00.000Z");

    const saved = JSON.parse(await fs.readFile(filePath, "utf8"));
    expect(saved.reviewedBy).toBe("Content QA");
    expect(saved.updatedAt).toBe("2026-07-12T08:00:00.000Z");
  });

  it("supports dry-run mode without changing the file", async () => {
    const original = {
      schemaVersion: 1,
      type: "technology",
      id: "technology-honda-ra168e",
      slug: "honda-ra168e",
      status: "published",
      title: { zh: "本田 RA168E" },
      summary: { zh: "摘要" },
      sourceIds: ["source-example"],
      blocks: [],
      updatedAt: "2026-07-11T12:00:00.000Z",
      reviewedBy: "Earlier Reviewer",
    };
    const { root, filePath } = await makeEntityFile(original);

    const result = await recordCorrectionMetadata(
      [filePath, "--reviewed-by", "Content QA", "--dry-run"],
      root,
    );

    expect(result.dryRun).toBe(true);
    expect(result.document.reviewedBy).toBe("Content QA");

    const saved = JSON.parse(await fs.readFile(filePath, "utf8"));
    expect(saved.reviewedBy).toBe("Earlier Reviewer");
  });

  it("requires a reviewer name", async () => {
    const { root, filePath } = await makeEntityFile({
      schemaVersion: 1,
      type: "person",
      id: "person-ayrton-senna",
      slug: "ayrton-senna",
      status: "published",
      title: { zh: "艾尔顿·塞纳" },
      summary: { zh: "摘要" },
      sourceIds: ["source-example"],
      blocks: [],
      updatedAt: "2026-07-11T12:00:00.000Z",
    });

    await expect(recordCorrectionMetadata([filePath], root)).rejects.toThrow(
      /Missing required --reviewed-by value/,
    );
  });
});
