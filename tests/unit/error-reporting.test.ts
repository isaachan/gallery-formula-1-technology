import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const manifest = {
  schemaVersion: 1,
  appVersion: "1.2.3",
  contentVersion: "content-abc123",
  buildCommit: "1234567890abcdef1234567890abcdef12345678",
  builtAt: "2026-07-29T12:34:56.000Z",
  contentPackId: "bundled-2026-07-29",
  graphVersion: "graph-v1",
  mediaManifestVersion: "media-v1",
};

describe("error-reporting", () => {
  beforeEach(async () => {
    vi.resetModules();
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { setBuildManifestProvider } = await import(
      "../../src/lib/error-reporting"
    );
    setBuildManifestProvider(() => manifest);
  });

  afterEach(async () => {
    const { resetBuildManifest } = await import(
      "../../src/lib/error-reporting"
    );
    resetBuildManifest();
    vi.restoreAllMocks();
  });

  it("reports a renderer failure with diagnostic versions attached", async () => {
    const { reportRendererFailure } = await import(
      "../../src/lib/error-reporting"
    );

    reportRendererFailure({
      kind: "image",
      mediaId: "media-x",
      message: "boom",
    });

    await vi.waitFor(() => {
      expect(console.error).toHaveBeenCalledWith(
        "[renderer-failure]",
        expect.objectContaining({
          kind: "image",
          mediaId: "media-x",
          message: "boom",
          appVersion: "1.2.3",
          contentVersion: "content-abc123",
          buildCommit: manifest.buildCommit,
          contentPackId: manifest.contentPackId,
        }),
      );
    });
  });

  it("reports a route error with diagnostic versions attached", async () => {
    const { reportRouteError } = await import("../../src/lib/error-reporting");

    reportRouteError({
      routeFamily: "season",
      entityId: "1988",
      digest: "digest-1",
      message: "render failed",
    });

    await vi.waitFor(() => {
      expect(console.error).toHaveBeenCalledWith(
        "[route-error]",
        expect.objectContaining({
          routeFamily: "season",
          entityId: "1988",
          digest: "digest-1",
          message: "render failed",
          appVersion: "1.2.3",
        }),
      );
    });
  });

  it("reports a bounded failure when the manifest provider rejects", async () => {
    const { reportRendererFailure, setBuildManifestProvider } = await import(
      "../../src/lib/error-reporting"
    );
    setBuildManifestProvider(() => Promise.reject(new Error("missing")));

    reportRendererFailure({ kind: "video", mediaId: "media-y" });

    await vi.waitFor(() => {
      expect(console.error).toHaveBeenCalledWith("[renderer-failure]", {
        manifestStatus: "unavailable",
        manifestError: "Error",
      });
    });
    expect(console.error).not.toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        mediaId: "media-y",
        appVersion: "static",
        contentVersion: "static",
      }),
    );
  });
});
