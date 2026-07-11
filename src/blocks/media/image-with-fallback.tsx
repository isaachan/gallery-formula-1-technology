"use client";

import { useState, type CSSProperties } from "react";
import { getLocalizedText, type LocaleText } from "../locale-text";
import { reportRendererFailure } from "@/lib/error-reporting";

export type MediaVariant = {
  src: string;
  mimeType: string;
  width?: number;
  height?: number;
};

export type MediaLike = {
  id: string;
  alt: LocaleText;
  src?: string;
  variants?: MediaVariant[];
  caption?: LocaleText;
  credit?: string;
  focalPoint?: { x: number; y: number };
};

const DEFAULT_SIZES = "(min-width: 48rem) 720px, 100vw";

function pickDimensionedVariant(variants: MediaVariant[]) {
  return variants.find(
    (variant) =>
      Number.isFinite(variant.width) && Number.isFinite(variant.height),
  );
}

function groupVariantsByMimeType(variants: MediaVariant[]) {
  const order: string[] = [];
  const groups = new Map<string, MediaVariant[]>();

  for (const variant of variants) {
    if (!groups.has(variant.mimeType)) {
      order.push(variant.mimeType);
      groups.set(variant.mimeType, []);
    }
    groups.get(variant.mimeType)!.push(variant);
  }

  return order.map((mimeType) => [mimeType, groups.get(mimeType)!] as const);
}

export function ImageWithFallback({
  media,
  locale = "zh",
  sizes = DEFAULT_SIZES,
}: {
  media: MediaLike;
  locale?: keyof LocaleText;
  sizes?: string;
}) {
  const [failed, setFailed] = useState(false);
  const alt = getLocalizedText(media.alt, locale) ?? "";
  const variants = media.variants ?? [];
  const dimensioned = pickDimensionedVariant(variants);
  const fallbackSrc = media.src ?? variants[variants.length - 1]?.src;
  const caption = getLocalizedText(media.caption, locale);

  if (failed || !fallbackSrc) {
    return (
      <figure className="media-figure" data-media-id={media.id}>
        <div
          className="media-frame media-frame-error"
          role="img"
          aria-label={alt}
        >
          <p className="media-fallback-copy">
            {alt ? `图片暂时无法显示：${alt}` : "图片暂时无法显示"}
          </p>
        </div>
        {caption || media.credit ? (
          <figcaption className="media-caption">
            {caption ? <span>{caption}</span> : null}
            {media.credit ? (
              <span className="media-credit">{media.credit}</span>
            ) : null}
          </figcaption>
        ) : null}
      </figure>
    );
  }

  const style: CSSProperties = {};
  if (dimensioned) {
    style.aspectRatio = `${dimensioned.width} / ${dimensioned.height}`;
  }
  if (media.focalPoint) {
    style.objectPosition = `${media.focalPoint.x * 100}% ${media.focalPoint.y * 100}%`;
  }

  const groups = groupVariantsByMimeType(variants);

  return (
    <figure className="media-figure" data-media-id={media.id}>
      <picture>
        {groups.map(([mimeType, group]) => (
          <source
            key={mimeType}
            type={mimeType}
            sizes={sizes}
            srcSet={group
              .map(
                (variant) =>
                  `${variant.src}${variant.width ? ` ${variant.width}w` : ""}`,
              )
              .join(", ")}
          />
        ))}
        <img
          className="media-frame"
          src={fallbackSrc}
          alt={alt}
          width={dimensioned?.width}
          height={dimensioned?.height}
          style={style}
          loading="lazy"
          onError={() => {
            reportRendererFailure({ kind: "image", mediaId: media.id });
            setFailed(true);
          }}
        />
      </picture>
      {caption || media.credit ? (
        <figcaption className="media-caption">
          {caption ? <span>{caption}</span> : null}
          {media.credit ? (
            <span className="media-credit">{media.credit}</span>
          ) : null}
        </figcaption>
      ) : null}
    </figure>
  );
}
