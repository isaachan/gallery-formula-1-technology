import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: () => "/seasons/1988",
}));

describe("RouteError", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        json: () =>
          Promise.resolve({ appVersion: "1.2.3", contentVersion: "abc123" }),
      }),
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
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
          route: "/seasons/1988",
          digest: "digest-1",
          message: "boom",
          appVersion: "static",
        }),
      );
    });
  });
});
