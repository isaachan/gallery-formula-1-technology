import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("error-reporting", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
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
          appVersion: "static",
          contentVersion: "static",
        }),
      );
    });
  });

  it("reports a route error with diagnostic versions attached", async () => {
    const { reportRouteError } = await import("../../src/lib/error-reporting");

    reportRouteError({
      route: "/seasons/1988",
      digest: "digest-1",
      message: "render failed",
    });

    await vi.waitFor(() => {
      expect(console.error).toHaveBeenCalledWith(
        "[route-error]",
        expect.objectContaining({
          route: "/seasons/1988",
          digest: "digest-1",
          message: "render failed",
          appVersion: "static",
        }),
      );
    });
  });

  it("uses static diagnostic versions with no runtime fetch", async () => {
    // The app is a static export with no /api/diagnostics endpoint; versions
    // resolve synchronously to "static" without any network call.
    const { reportRendererFailure } = await import(
      "../../src/lib/error-reporting"
    );

    reportRendererFailure({ kind: "video", mediaId: "media-y" });

    await vi.waitFor(() => {
      expect(console.error).toHaveBeenCalledWith(
        "[renderer-failure]",
        expect.objectContaining({
          appVersion: "static",
          contentVersion: "static",
        }),
      );
    });
  });
});
