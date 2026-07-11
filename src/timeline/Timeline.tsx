"use client";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { DecadeSelector, type DecadeChip } from "./DecadeSelector";
import {
  computeCarPosition,
  computeNearestDecade,
  computeTimelineLayout,
  isNodeEmphasized,
  type TimelineSeasonInput,
} from "./geometry";

export type TimelineSeason = TimelineSeasonInput & {
  title: string;
  championName?: string;
  championCar?: string;
  tag?: string;
  badge?: string;
};

const DECADES = Array.from({ length: 8 }, (_, index) => 1950 + index * 10);
const ROAD_VIEWBOX_WIDTH = 390;

function decadeLabel(decade: number) {
  return `'${String(decade).slice(2)}s`;
}

function eraAccentVar(year: number) {
  return `var(--era-${Math.floor(year / 10) * 10}s)`;
}

export function Timeline({
  seasons,
  compact = false,
  onSelectSeason,
}: {
  seasons: TimelineSeason[];
  compact?: boolean;
  onSelectSeason?: (season: TimelineSeason) => void;
}) {
  const layout = useMemo(
    () => computeTimelineLayout(seasons, { compact }),
    [seasons, compact],
  );
  const seasonsById = useMemo(
    () => new Map(seasons.map((season) => [season.id, season])),
    [seasons],
  );
  const scrollRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef(0);
  const prefersReducedMotion = useReducedMotion();

  const [car, setCar] = useState(() => computeCarPosition(0, layout));
  const [activeDecade, setActiveDecade] = useState<number | null>(() =>
    computeNearestDecade(car.y, layout),
  );

  useEffect(() => {
    setCar(computeCarPosition(scrollRef.current?.scrollTop ?? 0, layout));
  }, [layout]);

  useEffect(
    () => () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    },
    [],
  );

  const handleScroll = () => {
    const node = scrollRef.current;
    if (!node || rafRef.current) {
      return;
    }

    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = 0;
      const nextCar = computeCarPosition(node.scrollTop, layout);
      setCar(nextCar);
      setActiveDecade(computeNearestDecade(nextCar.y, layout));
    });
  };

  const jumpToDecade = (decade: number) => {
    const node = scrollRef.current;
    if (!node) {
      return;
    }
    const behavior = prefersReducedMotion ? "auto" : "smooth";

    if (decade === DECADES[0]) {
      node.scrollTo({ top: 0, behavior });
      return;
    }

    const banner = layout.banners.find((b) => b.decade === decade);
    if (banner) {
      node.scrollTo({ top: banner.y - 6, behavior });
    }
  };

  const decadeChips: DecadeChip[] = DECADES.map((decade) => ({
    decade,
    label: decadeLabel(decade),
  }));

  return (
    <div className="timeline">
      <DecadeSelector
        decades={decadeChips}
        activeDecade={activeDecade}
        onSelect={jumpToDecade}
      />
      <div
        className="timeline-scroll"
        ref={scrollRef}
        onScroll={handleScroll}
        role="region"
        aria-label="F1 season timeline"
      >
        <div className="timeline-track" style={{ height: layout.totalHeight }}>
          <svg
            className="timeline-road"
            viewBox={`0 0 ${ROAD_VIEWBOX_WIDTH} ${layout.totalHeight}`}
            preserveAspectRatio="xMidYMin meet"
            aria-hidden="true"
          >
            <path
              d={layout.pathD}
              fill="none"
              stroke="var(--color-track)"
              strokeWidth={34}
              strokeLinecap="round"
            />
            <path
              d={layout.pathD}
              fill="none"
              stroke="#ffffff"
              strokeWidth={3}
              strokeDasharray="10 14"
              opacity={0.8}
            />
          </svg>

          <div className="timeline-start-banner" aria-hidden="true">
            <div className="timeline-flag-strip" />
            <div className="timeline-start-badge">
              <strong>{seasons[0]?.year ?? 1950} 発車! START</strong>
            </div>
          </div>

          {layout.banners.map((banner) => (
            <div
              key={banner.decade}
              className="timeline-decade-banner"
              style={{ top: banner.y }}
              data-era={`${banner.decade}s`}
              aria-hidden="true"
            >
              <div className="timeline-flag-strip timeline-flag-strip-small" />
              <div className="timeline-decade-pill">
                <span
                  className="timeline-decade-year"
                  style={{ color: eraAccentVar(banner.decade) }}
                >
                  {decadeLabel(banner.decade)}
                </span>
              </div>
            </div>
          ))}

          {layout.nodes.map((node) => {
            const season = seasonsById.get(node.id);
            if (!season) {
              return null;
            }

            const emphasized = isNodeEmphasized(car.y, node.y);
            const accent = eraAccentVar(node.year);
            const label = [season.year, season.championName, season.championCar]
              .filter(Boolean)
              .join(" · ");
            const select = () => onSelectSeason?.(season);

            return (
              <Fragment key={node.id}>
                <button
                  type="button"
                  className="timeline-node"
                  data-highlighted={node.highlighted}
                  style={{
                    left: node.x,
                    top: node.y,
                    borderColor: node.highlighted ? undefined : accent,
                    opacity: emphasized ? 1 : undefined,
                  }}
                  aria-label={label}
                  onClick={select}
                />
                {node.highlighted ? (
                  <article
                    className="timeline-card timeline-card-highlighted"
                    data-side={node.side}
                    style={{
                      top: node.y - 86,
                      opacity: emphasized ? 1 : undefined,
                      borderColor: accent,
                    }}
                    onClick={select}
                  >
                    {season.badge ? (
                      <span className="timeline-card-badge">
                        ★ {season.badge}
                      </span>
                    ) : null}
                    <div className="timeline-card-headline">
                      <span
                        className="timeline-card-year"
                        style={{ color: accent }}
                      >
                        {season.year}
                      </span>
                    </div>
                    <div className="timeline-card-title">{season.title}</div>
                    {season.championName ? (
                      <div className="timeline-card-champion">
                        👑 {season.championName}
                        {season.championCar ? ` · ${season.championCar}` : ""}
                      </div>
                    ) : null}
                    <span
                      className="timeline-card-cta"
                      style={{ color: accent }}
                    >
                      进入该赛季 ▸
                    </span>
                  </article>
                ) : (
                  <article
                    className="timeline-card timeline-card-ordinary"
                    data-side={node.side}
                    style={{
                      top: node.y - (compact ? 20 : 28),
                      opacity: emphasized ? 1 : undefined,
                    }}
                    onClick={select}
                  >
                    <span className="timeline-card-row">
                      <span
                        className="timeline-card-year"
                        style={{ color: accent }}
                      >
                        {season.year}
                      </span>
                      {season.championName ? (
                        <span className="timeline-card-champion-name">
                          {season.championName}
                        </span>
                      ) : null}
                    </span>
                    {season.championCar ? (
                      <span className="timeline-card-champion-car">
                        {season.championCar}
                      </span>
                    ) : null}
                    {season.tag && !compact ? (
                      <span className="timeline-card-tag">🔧 {season.tag}</span>
                    ) : null}
                  </article>
                )}
              </Fragment>
            );
          })}

          <div
            className="timeline-car"
            style={{
              transform: `translate(${car.x - 13}px, ${car.y - 22}px) rotate(${car.angle}deg)`,
            }}
            aria-hidden="true"
          >
            <CarIcon />
          </div>

          <div
            className="timeline-finish-banner"
            style={{ top: layout.totalHeight - 92 }}
            aria-hidden="true"
          >
            <div className="timeline-flag-strip" />
            <div className="timeline-finish-badge">
              🏁 驶抵现在 · 新规元年，待续…
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CarIcon() {
  return (
    <svg width="26" height="44" viewBox="0 0 26 44" aria-hidden="true">
      <rect x="1" y="6" width="6" height="10" rx="2" fill="#3a3532" />
      <rect x="19" y="6" width="6" height="10" rx="2" fill="#3a3532" />
      <rect x="1" y="28" width="6" height="10" rx="2" fill="#3a3532" />
      <rect x="19" y="28" width="6" height="10" rx="2" fill="#3a3532" />
      <path d="M7 8 C7 3 19 3 19 8 L20 30 C20 40 6 40 6 30 Z" fill="#ff8fab" />
      <rect x="4" y="2" width="18" height="4" rx="2" fill="#e0527e" />
      <rect x="3" y="36" width="20" height="4" rx="2" fill="#e0527e" />
      <circle cx="13" cy="20" r="5" fill="#ffd23e" />
      <rect x="8" y="18.5" width="10" height="3" rx="1.5" fill="#3a3532" />
    </svg>
  );
}
