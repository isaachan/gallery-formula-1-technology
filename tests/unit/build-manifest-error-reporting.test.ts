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

describe("manifest-backed error reporting", () => {
  beforeEach(async () => {
    vi.resetModules();
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { resetBuildManifest, setBuildManifestProvider } = await import(
      "../../src/lib/error-reporting"
    );
    resetBuildManifest();
    setBuildManifestProvider(() => manifest);
  });

  afterEach(async () => {
    const { resetBuildManifest } = await import(
      "../../src/lib/error-reporting"
    );
    resetBuildManifest();
    vi.restoreAllMocks();
  });

  it("reports renderer failures with real manifest versions and only allowlisted context", async () => {
    const { reportRendererFailure } = await import(
      "../../src/lib/error-reporting"
    );

    reportRendererFailure({
      kind: "image",
      blockId: "hero",
      mediaId: "media-cover",
      message: "asset decode failed",
      searchText: "private search",
      feedbackDraft: "private draft",
      personalIdentifier: "person@example.com",
      url: "https://example.com/private?token=secret",
      pageContent: "private page content",
      unknown: "must not spread",
    } as Parameters<typeof reportRendererFailure>[0]);

    await vi.waitFor(() => expect(console.error).toHaveBeenCalled());
    const payload = vi.mocked(console.error).mock.calls.at(-1)?.[1];

    expect(payload).toEqual({
      kind: "image",
      blockId: "hero",
      mediaId: "media-cover",
      message: "asset decode failed",
      ...manifest,
    });
  });

  it("reports normalized route context without raw routes, URLs, or page content", async () => {
    const { reportRouteError } = await import("../../src/lib/error-reporting");

    reportRouteError({
      routeFamily: "season",
      entityId: "season-1988",
      digest: "digest-1",
      message: "render failed",
      route: "/seasons/1988?query=private",
      searchText: "private search",
      pageContent: "private page content",
    } as Parameters<typeof reportRouteError>[0]);

    await vi.waitFor(() => expect(console.error).toHaveBeenCalled());
    const payload = vi.mocked(console.error).mock.calls.at(-1)?.[1];

    expect(payload).toEqual({
      routeFamily: "season",
      entityId: "season-1988",
      digest: "digest-1",
      message: "render failed",
      ...manifest,
    });
  });

  it("does not fall back to fixed static versions", async () => {
    const { reportRendererFailure } = await import(
      "../../src/lib/error-reporting"
    );

    reportRendererFailure({ kind: "video", mediaId: "media-video" });

    await vi.waitFor(() => {
      expect(console.error).toHaveBeenCalledWith(
        "[renderer-failure]",
        expect.objectContaining({
          appVersion: "1.2.3",
          contentVersion: "content-abc123",
          graphVersion: "graph-v1",
          mediaManifestVersion: "media-v1",
        }),
      );
    });
    expect(console.error).not.toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        appVersion: "static",
        contentVersion: "static",
      }),
    );
  });

  it.each([
    ["malformed", null],
    ["missing required fields", { schemaVersion: 1, appVersion: "1.2.3" }],
    ["incompatible schema", { ...manifest, schemaVersion: 2 }],
  ])("fails closed for a %s diagnostics manifest", async (_name, value) => {
    const { reportRendererFailure, setBuildManifestProvider } = await import(
      "../../src/lib/error-reporting"
    );
    setBuildManifestProvider(
      () =>
        value as unknown as ReturnType<
          Exclude<Parameters<typeof setBuildManifestProvider>[0], undefined>
        >,
    );

    reportRendererFailure({
      kind: "image",
      mediaId: "private-media-context",
    });

    await vi.waitFor(() => {
      expect(console.error).toHaveBeenCalledWith("[renderer-failure]", {
        manifestStatus: "unavailable",
        manifestError: "Error",
      });
    });
    expect(console.error).not.toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        mediaId: "private-media-context",
        appVersion: expect.anything(),
      }),
    );
  });
});
