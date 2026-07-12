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
}: {
  color: string;
  name?: string;
  subtitle?: string;
  eraLabel?: string;
  championBadge?: string;
  dragLabel?: string;
  dark?: boolean;
}) {
  const { dragHandlers, transform } = useRotatableDrag();

  return (
    <div
      className={dark ? "car-hero-stage car-hero-stage-dark" : "car-hero-stage"}
      {...dragHandlers}
    >
      <div className="car-hero-drag-badge">{dragLabel}</div>
      {eraLabel ? <div className="car-hero-era-label">{eraLabel}</div> : null}
      {championBadge ? (
        <div className="car-hero-champion-badge">{championBadge}</div>
      ) : null}
      <div className="car-hero-svg-wrap">
        <div style={{ transform }}>
          <HeroCarSvg color={color} />
        </div>
      </div>
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
