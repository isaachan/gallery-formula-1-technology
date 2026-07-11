"use client";

import { useState } from "react";
import { getLocalizedText, type LocaleText } from "../locale-text";

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
  const [failed, setFailed] = useState(false);
  const alt = getLocalizedText(media.alt, locale) ?? "";

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
        className="audio-frame"
        src={media.src}
        controls
        preload="none"
        aria-label={alt}
        onError={() => setFailed(true)}
      />
      {media.credit ? (
        <span className="media-credit">{media.credit}</span>
      ) : null}
    </div>
  );
}
