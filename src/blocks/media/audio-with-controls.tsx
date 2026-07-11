"use client";

import { useEffect, useRef, useState } from "react";
import { getLocalizedText, type LocaleText } from "../locale-text";
import { reportRendererFailure } from "@/lib/error-reporting";

export type AudioMedia = {
  id: string;
  alt: LocaleText;
  src: string;
  credit?: string;
};

export function AudioWithControls({
  media,
  locale = "zh",
}: {
  media: AudioMedia;
  locale?: keyof LocaleText;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [failed, setFailed] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const alt = getLocalizedText(media.alt, locale) ?? "";

  useEffect(() => {
    const audio = audioRef.current;

    return () => {
      if (!audio) {
        return;
      }

      audio.pause();
      audio.currentTime = 0;
    };
  }, []);

  const formatTime = (value: number | null) => {
    if (value === null || !Number.isFinite(value)) {
      return "--:--";
    }

    const minutes = Math.floor(value / 60);
    const seconds = Math.floor(value % 60);
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  };

  const handlePlayPause = async () => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    if (!isPlaying) {
      try {
        await audio.play();
      } catch {
        reportRendererFailure({
          kind: "audio",
          mediaId: media.id,
          message: "play() rejected",
        });
        setFailed(true);
      }
      return;
    }

    audio.pause();
  };

  const handleStop = () => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    audio.pause();
    audio.currentTime = 0;
    setCurrentTime(0);
    setIsPlaying(false);
  };

  if (failed) {
    return (
      <div className="audio-figure audio-figure-error" data-media-id={media.id}>
        <p className="media-fallback-copy">
          {alt ? `音频暂时无法播放：${alt}` : "音频暂时无法播放"}
        </p>
      </div>
    );
  }

  return (
    <div className="audio-figure" data-media-id={media.id}>
      <audio
        ref={audioRef}
        className="audio-frame"
        src={media.src}
        preload="none"
        aria-label={alt}
        onError={() => {
          reportRendererFailure({ kind: "audio", mediaId: media.id });
          setFailed(true);
        }}
        onLoadedMetadata={(event) => {
          setDuration(event.currentTarget.duration);
        }}
        onTimeUpdate={(event) => {
          setCurrentTime(event.currentTarget.currentTime);
        }}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => {
          setCurrentTime(0);
          setIsPlaying(false);
        }}
      />
      <div className="audio-controls" aria-label="音频控制">
        <button
          type="button"
          className="museum-button audio-control-button"
          onClick={() => void handlePlayPause()}
        >
          {isPlaying ? "暂停" : "播放"}
        </button>
        <button
          type="button"
          className="museum-button audio-control-button"
          onClick={handleStop}
        >
          停止
        </button>
        <span className="audio-duration" aria-live="polite">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
      </div>
      {media.credit ? (
        <span className="media-credit">{media.credit}</span>
      ) : null}
    </div>
  );
}
