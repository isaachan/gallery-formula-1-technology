import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AudioWithControls } from "../../src/blocks/media/audio-with-controls";

describe("AudioWithControls", () => {
  it("renders explicit controls and duration without autoplay", async () => {
    render(
      <AudioWithControls
        media={{
          id: "media-engine-audio",
          alt: { zh: "Honda RA168E 怠速与加速音效" },
          src: "https://media.example.com/engine.mp3",
          credit: "编辑部原创录音",
        }}
      />,
    );

    const audio = screen.getByLabelText(
      "Honda RA168E 怠速与加速音效",
    ) as HTMLAudioElement;
    expect(audio).toHaveAttribute("preload", "none");
    expect(audio).not.toHaveAttribute("autoplay");

    Object.defineProperty(audio, "duration", {
      configurable: true,
      value: 95,
    });
    fireEvent.loadedMetadata(audio);

    expect(screen.getByText("00:00 / 01:35")).toBeInTheDocument();

    await fireEvent.click(screen.getByRole("button", { name: "播放" }));
    expect(screen.getByRole("button", { name: "暂停" })).toBeInTheDocument();
    expect(screen.getByText("编辑部原创录音")).toBeInTheDocument();
  });

  it("stops playback explicitly", async () => {
    render(
      <AudioWithControls
        media={{
          id: "media-engine-audio",
          alt: { zh: "Honda RA168E 怠速与加速音效" },
          src: "https://media.example.com/engine.mp3",
        }}
      />,
    );

    const audio = screen.getByLabelText(
      "Honda RA168E 怠速与加速音效",
    ) as HTMLAudioElement;
    const pauseSpy = vi.spyOn(audio, "pause");

    Object.defineProperty(audio, "duration", {
      configurable: true,
      value: 125,
    });
    fireEvent.loadedMetadata(audio);

    await fireEvent.click(screen.getByRole("button", { name: "播放" }));
    Object.defineProperty(audio, "currentTime", {
      configurable: true,
      writable: true,
      value: 42,
    });
    fireEvent.timeUpdate(audio);
    expect(screen.getByText("00:42 / 02:05")).toBeInTheDocument();

    await fireEvent.click(screen.getByRole("button", { name: "停止" }));
    expect(pauseSpy).toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "播放" })).toBeInTheDocument();
    expect(screen.getByText("00:00 / 02:05")).toBeInTheDocument();
    expect(audio.currentTime).toBe(0);
  });

  it("stops playback when unmounted", async () => {
    const { unmount } = render(
      <AudioWithControls
        media={{
          id: "media-engine-audio",
          alt: { zh: "Honda RA168E 怠速与加速音效" },
          src: "https://media.example.com/engine.mp3",
        }}
      />,
    );

    const audio = screen.getByLabelText(
      "Honda RA168E 怠速与加速音效",
    ) as HTMLAudioElement;
    const pauseSpy = vi.spyOn(audio, "pause");

    Object.defineProperty(audio, "currentTime", {
      configurable: true,
      writable: true,
      value: 18,
    });
    await fireEvent.click(screen.getByRole("button", { name: "播放" }));

    unmount();
    expect(pauseSpy).toHaveBeenCalledTimes(1);
    expect(audio.currentTime).toBe(0);
  });

  it("shows a safe fallback message when the audio fails to load", () => {
    render(
      <AudioWithControls
        media={{
          id: "media-engine-audio",
          alt: { zh: "Honda RA168E 怠速与加速音效" },
          src: "https://media.example.com/broken.mp3",
        }}
      />,
    );

    const audio = screen.getByLabelText("Honda RA168E 怠速与加速音效");
    fireEvent.error(audio);

    expect(
      screen.getByText("音频暂时无法播放：Honda RA168E 怠速与加速音效"),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "播放" }),
    ).not.toBeInTheDocument();
  });
});
