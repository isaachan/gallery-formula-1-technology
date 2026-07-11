import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("error-reporting", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("reports a renderer failure with diagnostic versions attached", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        json: () =>
          Promise.resolve({ appVersion: "1.2.3", contentVersion: "abc123" }),
      }),
    );
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
          contentVersion: "abc123",
        }),
      );
    });
  });

  it("reports a route error with diagnostic versions attached", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        json: () =>
          Promise.resolve({ appVersion: "1.2.3", contentVersion: "abc123" }),
      }),
    );
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
          appVersion: "1.2.3",
        }),
      );
    });
  });

  it("falls back to 'unknown' diagnostic versions when the diagnostics fetch fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("network down")),
    );
    const { reportRendererFailure } = await import(
      "../../src/lib/error-reporting"
    );

    reportRendererFailure({ kind: "video", mediaId: "media-y" });

    await vi.waitFor(() => {
      expect(console.error).toHaveBeenCalledWith(
        "[renderer-failure]",
        expect.objectContaining({
          appVersion: "unknown",
          contentVersion: "unknown",
        }),
      );
    });
  });
});
