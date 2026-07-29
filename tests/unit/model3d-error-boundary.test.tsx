import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Model3DErrorBoundary } from "../../src/blocks/media/model3d-error-boundary";

function Thrower(): never {
  throw new Error("model failed to parse");
}

describe("Model3DErrorBoundary", () => {
  beforeEach(async () => {
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
          appVersion: "1.2.3",
          contentVersion: "content-abc123",
        }),
      );
    });
  });
});
