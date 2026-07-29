import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: () => "/seasons/1988",
}));

describe("RouteError", () => {
  beforeEach(async () => {
    vi.resetModules();
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { setBuildManifestProvider } = await import(
      "../../src/lib/error-reporting"
    );
    setBuildManifestProvider(() => ({
      schemaVersion: 1,
      appVersion: "1.2.3",
      contentVersion: "content-abc123",
      buildCommit: "1234567890abcdef1234567890abcdef12345678",
      builtAt: "2026-07-29T12:34:56.000Z",
      contentPackId: "bundled-2026-07-29",
      graphVersion: "graph-v1",
      mediaManifestVersion: "media-v1",
    }));
  });

  afterEach(async () => {
    const { resetBuildManifest } = await import(
      "../../src/lib/error-reporting"
    );
    resetBuildManifest();
    vi.restoreAllMocks();
  });

  it("reports the route error with diagnostics and offers retry / return-to-timeline", async () => {
    const { default: RouteError } = await import("../../src/app/error");
    const reset = vi.fn();
    const error = Object.assign(new Error("boom"), { digest: "digest-1" });

    render(<RouteError error={error} reset={reset} />);

    expect(
      screen.getByRole("heading", { name: "页面暂时无法显示" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "← 返回时间轴" })).toHaveAttribute(
      "href",
      "/",
    );

    fireEvent.click(screen.getByRole("button", { name: "重试" }));
    expect(reset).toHaveBeenCalledTimes(1);

    await vi.waitFor(() => {
      expect(console.error).toHaveBeenCalledWith(
        "[route-error]",
        expect.objectContaining({
          routeFamily: "season",
          entityId: "1988",
          digest: "digest-1",
          message: "boom",
          appVersion: "1.2.3",
          contentVersion: "content-abc123",
        }),
      );
    });
  });
});
