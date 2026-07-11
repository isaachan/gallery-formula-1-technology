"use client";

import { useEffect, useRef, useState } from "react";
import { getLocalizedText, type LocaleText } from "../locale-text";
import { useReducedMotion } from "./use-reduced-motion";

export type AnimationMedia = {
  id: string;
  alt: LocaleText;
  videoSrc: string;
  posterSrc: string;
  credit?: string;
};

export function AnimationWithControls({
  media,
  locale = "zh",
}: {
  media: AnimationMedia;
  locale?: keyof LocaleText;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const [manualOverride, setManualOverride] = useState<boolean | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [failed, setFailed] = useState(false);
  const alt = getLocalizedText(media.alt, locale) ?? "";
  const intendedPlaying = manualOverride ?? !prefersReducedMotion;

  useEffect(() => {
    const node = videoRef.current;
    if (!node) {
      return;
    }

    if (intendedPlaying) {
      const playResult = node.play();
      if (playResult && typeof playResult.catch === "function") {
        playResult.catch(() => {});
      }
    } else {
      node.pause();
    }
  }, [intendedPlaying]);

  if (failed) {
    return (
      <div
        className="media-frame media-frame-error"
        role="img"
        aria-label={alt}
      >
        <p className="media-fallback-copy">
          {alt ? `动画暂时无法播放：${alt}` : "动画暂时无法播放"}
        </p>
      </div>
    );
  }

  return (
    <div className="animation-figure" data-media-id={media.id}>
      <video
        ref={videoRef}
        className="media-frame animation-frame"
        poster={media.posterSrc}
        src={media.videoSrc}
        muted
        loop
        playsInline
        aria-label={alt}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onError={() => setFailed(true)}
      />
      <div className="animation-controls">
        <button
          type="button"
          className="animation-toggle tap-target"
          aria-pressed={isPlaying}
          onClick={() => setManualOverride(!isPlaying)}
        >
          {isPlaying ? "暂停动画" : "播放动画"}
        </button>
        {media.credit ? (
          <span className="media-credit">{media.credit}</span>
        ) : null}
      </div>
    </div>
  );
}
