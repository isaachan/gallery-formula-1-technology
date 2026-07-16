"use client";

import { HeroCarSvg } from "@/components/car-illustrations";
import { useRotatableDrag } from "@/components/rotatable-stage";

export function CarHeroStage({
  color,
  name,
  subtitle,
  eraLabel,
  championBadge,
  dragLabel = "◀ 拖动旋转 ▶",
  dark = false,
  imageUrl,
  imageAlt,
  imageCredit,
}: {
  color: string;
  name?: string;
  subtitle?: string;
  eraLabel?: string;
  championBadge?: string;
  dragLabel?: string;
  dark?: boolean;
  /** When provided, a real photo replaces the rotatable 3D placeholder. */
  imageUrl?: string;
  imageAlt?: string;
  imageCredit?: string;
}) {
  const { dragHandlers, transform } = useRotatableDrag();

  return (
    <div
      className={dark ? "car-hero-stage car-hero-stage-dark" : "car-hero-stage"}
      {...(imageUrl ? {} : dragHandlers)}
    >
      {imageUrl ? null : <div className="car-hero-drag-badge">{dragLabel}</div>}
      {eraLabel ? <div className="car-hero-era-label">{eraLabel}</div> : null}
      {championBadge ? (
        <div className="car-hero-champion-badge">{championBadge}</div>
      ) : null}
      <div className="car-hero-svg-wrap">
        {imageUrl ? (
          <img
            className="car-hero-photo"
            src={imageUrl}
            alt={imageAlt ?? name ?? "car"}
            loading="eager"
            decoding="async"
          />
        ) : (
          <div style={{ transform }}>
            <HeroCarSvg color={color} />
          </div>
        )}
      </div>
      {imageCredit ? (
        <div className="car-hero-photo-credit">{imageCredit}</div>
      ) : null}
      {name ? (
        <div className="car-hero-caption">
          <div className="car-hero-name">{name}</div>
          {subtitle ? (
            <div className="car-hero-subtitle">{subtitle}</div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
