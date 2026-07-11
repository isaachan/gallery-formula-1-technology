"use client";

import { useState } from "react";
import { getLocalizedText, type LocaleText } from "../locale-text";

export type VideoMedia = {
  id: string;
  alt: LocaleText;
  videoSrc: string;
  posterSrc: string;
  credit?: string;
};

export function VideoWithControls({
  media,
  locale = "zh",
}: {
  media: VideoMedia;
  locale?: keyof LocaleText;
}) {
  const [failed, setFailed] = useState(false);
  const alt = getLocalizedText(media.alt, locale) ?? "";

  if (failed) {
    return (
      <div
        className="media-frame media-frame-error"
        role="img"
        aria-label={alt}
      >
        <p className="media-fallback-copy">
          {alt ? `视频暂时无法播放：${alt}` : "视频暂时无法播放"}
        </p>
      </div>
    );
  }

  return (
    <div className="video-figure" data-media-id={media.id}>
      <video
        className="media-frame video-frame"
        poster={media.posterSrc}
        src={media.videoSrc}
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
