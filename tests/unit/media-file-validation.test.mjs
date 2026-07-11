import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { validateMediaAssetFiles } from "../../src/domain/media-file-validation.mjs";

const temporaryRoots = [];
const originalAllowedOrigins = process.env.CONTENT_MEDIA_ALLOWED_ORIGINS;

afterEach(async () => {
  await Promise.all(
    temporaryRoots
      .splice(0)
      .map((root) => fs.rm(root, { recursive: true, force: true })),
  );
  if (originalAllowedOrigins === undefined) {
    delete process.env.CONTENT_MEDIA_ALLOWED_ORIGINS;
  } else {
    process.env.CONTENT_MEDIA_ALLOWED_ORIGINS = originalAllowedOrigins;
  }
});

async function makePublicRoot() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "f1-public-"));
  temporaryRoots.push(root);
  return root;
}

describe("validateMediaAssetFiles", () => {
  it("passes when every local source exists with a matching mimeType and byte budget", async () => {
    const publicRoot = await makePublicRoot();
    await fs.mkdir(path.join(publicRoot, "media"), { recursive: true });
    await fs.writeFile(
      path.join(publicRoot, "media", "cutaway.jpg"),
      Buffer.alloc(1024, 1),
    );

    const issues = await validateMediaAssetFiles(
      {
        kind: "image",
        src: "/media/cutaway.jpg",
        variants: [
          { src: "/media/cutaway.jpg", mimeType: "image/jpeg", width: 480 },
        ],
      },
      { publicRoot },
    );

    expect(issues).toEqual([]);
  });

  it("reports a missing local file with the resolved path", async () => {
    const publicRoot = await makePublicRoot();

    const issues = await validateMediaAssetFiles(
      { kind: "image", src: "/media/missing.jpg" },
      { publicRoot },
    );

    expect(issues).toEqual([
      {
        path: "src",
        message: expect.stringContaining("does not exist"),
      },
    ]);
    expect(issues[0].message).toContain(
      path.join(publicRoot, "media", "missing.jpg"),
    );
  });

  it("reports a mimeType that disagrees with the file extension", async () => {
    const publicRoot = await makePublicRoot();
    await fs.mkdir(path.join(publicRoot, "media"), { recursive: true });
    await fs.writeFile(path.join(publicRoot, "media", "clip.mp4"), "x");

    const issues = await validateMediaAssetFiles(
      {
        kind: "video",
        variants: [{ src: "/media/clip.mp4", mimeType: "image/jpeg" }],
      },
      { publicRoot },
    );

    expect(issues).toEqual([
      {
        path: "variants[0].src",
        message:
          'declares mimeType "image/jpeg" but the file extension ".mp4" implies "video/mp4"',
      },
    ]);
  });

  it("warns when an image variant exceeds the 500KB budget", async () => {
    const publicRoot = await makePublicRoot();
    await fs.mkdir(path.join(publicRoot, "media"), { recursive: true });
    await fs.writeFile(
      path.join(publicRoot, "media", "heavy.jpg"),
      Buffer.alloc(600 * 1024, 1),
    );

    const issues = await validateMediaAssetFiles(
      {
        kind: "image",
        variants: [{ src: "/media/heavy.jpg", mimeType: "image/jpeg" }],
      },
      { publicRoot },
    );

    expect(issues).toEqual([
      {
        path: "variants[0].src",
        message: expect.stringContaining("above the recommended 500KB budget"),
      },
    ]);
  });

  it("requires explicit approval when a 3D model exceeds the 15MB limit", async () => {
    const publicRoot = await makePublicRoot();
    await fs.mkdir(path.join(publicRoot, "media"), { recursive: true });
    await fs.writeFile(
      path.join(publicRoot, "media", "engine.glb"),
      Buffer.alloc(16 * 1024 * 1024, 1),
    );

    const issues = await validateMediaAssetFiles(
      { kind: "model3d", src: "/media/engine.glb" },
      { publicRoot },
    );

    expect(issues).toEqual([
      {
        path: "src",
        message: expect.stringContaining("requires explicit recorded approval"),
      },
    ]);
  });

  it("rejects a remote origin that is not in the configured allowlist", async () => {
    delete process.env.CONTENT_MEDIA_ALLOWED_ORIGINS;
    const publicRoot = await makePublicRoot();

    const issues = await validateMediaAssetFiles(
      { kind: "image", src: "https://untrusted.example.com/photo.jpg" },
      { publicRoot },
    );

    expect(issues).toEqual([
      {
        path: "src",
        message: expect.stringContaining(
          'origin "https://untrusted.example.com" that is not in the configured allowlist',
        ),
      },
    ]);
  });

  it("allows a remote origin explicitly listed in CONTENT_MEDIA_ALLOWED_ORIGINS", async () => {
    process.env.CONTENT_MEDIA_ALLOWED_ORIGINS = "https://media.example.com";
    const publicRoot = await makePublicRoot();

    const issues = await validateMediaAssetFiles(
      { kind: "image", src: "https://media.example.com/photo.jpg" },
      { publicRoot },
    );

    expect(issues).toEqual([]);
  });
});
