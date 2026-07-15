import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Model3DErrorBoundary } from "../../src/blocks/media/model3d-error-boundary";

function Thrower(): never {
  throw new Error("model failed to parse");
}

describe("Model3DErrorBoundary", () => {
  beforeEach(() => {
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

  it("renders the fallback and reports the failure with the given mediaId", async () => {
    render(
      <Model3DErrorBoundary
        mediaId="media-ra168e-model"
        fallback={<p>模型加载失败</p>}
      >
        <Thrower />
      </Model3DErrorBoundary>,
    );

    expect(screen.getByText("模型加载失败")).toBeInTheDocument();

    await vi.waitFor(() => {
      expect(console.error).toHaveBeenCalledWith(
        "[renderer-failure]",
        expect.objectContaining({
          kind: "model3d",
          mediaId: "media-ra168e-model",
          message: "model failed to parse",
          appVersion: "static",
        }),
      );
    });
  });
});
