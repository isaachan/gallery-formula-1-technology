"use client";

import Link from "next/link";
import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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
  corner?: string;
};

const DECADES = Array.from({ length: 8 }, (_, index) => 1950 + index * 10);
const ROAD_VIEWBOX_WIDTH = 390;
const SESSION_STORAGE_KEY = "f1-timeline-state";

// The road SVG is drawn in a 390-unit-wide coordinate space (matching the
// prototype's fixed 390px canvas) but the track itself is responsive, so on
// any viewport narrower than 390px the SVG's horizontal axis is stretched to
// fit (see the `preserveAspectRatio="none"` on `.timeline-road`). Nodes,
// cards, and the car are plain absolutely-positioned siblings of that SVG,
// not SVG children, so their horizontal offsets must be expressed as a
// percentage of the same 390-unit space rather than a literal pixel value —
// otherwise they drift off the (compressed) road on any viewport below
// 390px wide.
function toXPercent(x: number): string {
  return `${(x / ROAD_VIEWBOX_WIDTH) * 100}%`;
}

type PersistedTimelineState = {
  scrollTop: number;
  expandedSeasonId: string | null;
};

function decadeLabel(decade: number) {
  return `'${String(decade).slice(2)}s`;
}

function eraAccentVar(year: number) {
  return `var(--era-${Math.floor(year / 10) * 10}s)`;
}

function readPersistedState(): PersistedTimelineState | null {
  try {
    const raw = window.sessionStorage.getItem(SESSION_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as PersistedTimelineState) : null;
  } catch {
    return null;
  }
}

function writePersistedState(state: PersistedTimelineState) {
  try {
    window.sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage failures (private browsing, quota, etc.) — restoring
    // scroll position is a nicety, not essential functionality.
  }
}

export function Timeline({
  seasons,
  compact = false,
  initialFocusYear,
  onSelectSeason,
}: {
  seasons: TimelineSeason[];
  compact?: boolean;
  initialFocusYear?: number;
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
  const nodeRefs = useRef(new Map<string, HTMLElement>());
  const prefersReducedMotion = useReducedMotion();

  const [car, setCar] = useState(() => computeCarPosition(0, layout));
  const [activeDecade, setActiveDecade] = useState<number | null>(() =>
    computeNearestDecade(car.y, layout),
  );
  const [expandedSeasonId, setExpandedSeasonId] = useState<string | null>(null);

  useEffect(() => {
    setCar(computeCarPosition(scrollRef.current?.scrollTop ?? 0, layout));
  }, [layout]);

  // Drives the car position and card emphasis off a continuous rAF poll of
  // scrollTop rather than the 'scroll'/'scrollend' events: iOS WebKit
  // (Safari and in-app browsers like WeChat, which also run on WKWebView)
  // has been observed to fire few or no scroll/scrollend events for a
  // nested overflow container during touch-driven momentum scrolling,
  // leaving the car stuck at a stale position with the wrong cards dimmed.
  // Polling reads a cheap property every frame and only calls setState when
  // the value actually changed, and requestAnimationFrame itself already
  // pauses automatically while the tab is hidden, so this has no meaningful
  // cost over an event-driven approach while being immune to any browser's
  // scroll-event throttling quirks.
  useEffect(() => {
    let frameId = 0;
    let lastScrollTop: number | null = null;

    const tick = () => {
      const node = scrollRef.current;
      if (node && node.scrollTop !== lastScrollTop) {
        lastScrollTop = node.scrollTop;
        const nextCar = computeCarPosition(node.scrollTop, layout);
        setCar(nextCar);
        setActiveDecade(computeNearestDecade(nextCar.y, layout));
      }
      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [layout]);

  // Jump straight to a deep-linked year (US-C03), or otherwise restore the
  // scroll position/preview state from returning via the season page's
  // "back to timeline" link (US-C02). Deep links always win over restored
  // session state since they reflect a deliberate fresh navigation.
  useEffect(() => {
    const node = scrollRef.current;
    if (!node) {
      return;
    }

    if (initialFocusYear !== undefined) {
      const target = layout.nodes.find(
        (candidate) => candidate.year === initialFocusYear,
      );
      if (target) {
        node.scrollTop = Math.max(0, target.y - 300);
        setCar(computeCarPosition(node.scrollTop, layout));
        nodeRefs.current.get(target.id)?.focus();
      }
      return;
    }

    const persisted = readPersistedState();
    if (persisted) {
      node.scrollTop = persisted.scrollTop;
      setCar(computeCarPosition(persisted.scrollTop, layout));
      setExpandedSeasonId(persisted.expandedSeasonId);
    }
    // Restoring state is a one-time hydration step on mount, not a
    // reaction to later season/layout prop changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    writePersistedState({
      scrollTop: scrollRef.current?.scrollTop ?? 0,
      expandedSeasonId,
    });
  }, [expandedSeasonId, car.y]);

  useEffect(() => {
    if (!expandedSeasonId) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        nodeRefs.current.get(expandedSeasonId)?.focus();
        setExpandedSeasonId(null);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [expandedSeasonId]);

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

  const toggleSeason = useCallback(
    (season: TimelineSeason) => {
      onSelectSeason?.(season);
      setExpandedSeasonId((current) =>
        current === season.id ? null : season.id,
      );
    },
    [onSelectSeason],
  );

  const closePopover = useCallback(() => {
    if (expandedSeasonId) {
      nodeRefs.current.get(expandedSeasonId)?.focus();
    }
    setExpandedSeasonId(null);
  }, [expandedSeasonId]);

  const decadeChips: DecadeChip[] = DECADES.map((decade) => ({
    decade,
    label: decadeLabel(decade),
  }));

  const expandedSeason = expandedSeasonId
    ? seasonsById.get(expandedSeasonId)
    : undefined;
  const expandedNode = expandedSeasonId
    ? layout.nodes.find((node) => node.id === expandedSeasonId)
    : undefined;

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
        role="region"
        aria-label="F1 season timeline"
      >
        <div className="timeline-track" style={{ height: layout.totalHeight }}>
          <svg
            className="timeline-road"
            viewBox={`0 0 ${ROAD_VIEWBOX_WIDTH} ${layout.totalHeight}`}
            preserveAspectRatio="none"
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
            const setNodeRef = (element: HTMLElement | null) => {
              if (element) {
                nodeRefs.current.set(node.id, element);
              } else {
                nodeRefs.current.delete(node.id);
              }
            };

            if (node.highlighted) {
              const href = `/seasons/${season.year}`;
              const navigate = () => onSelectSeason?.(season);

              return (
                <Fragment key={node.id}>
                  <Link
                    href={href}
                    ref={setNodeRef}
                    className="timeline-node"
                    data-highlighted="true"
                    style={{
                      left: toXPercent(node.x),
                      top: node.y,
                      opacity: emphasized ? 1 : undefined,
                    }}
                    aria-label={label}
                    onClick={navigate}
                  />
                  <Link
                    href={href}
                    className="timeline-card timeline-card-highlighted"
                    data-side={node.side}
                    style={{
                      top: node.y - 86,
                      opacity: emphasized ? 1 : undefined,
                      borderColor: accent,
                    }}
                    onClick={navigate}
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
                      {season.corner ? (
                        <span className="timeline-card-corner">
                          {season.corner}
                        </span>
                      ) : null}
                    </div>
                    <div className="timeline-card-title">{season.title}</div>
                    {season.championName ? (
                      <div className="timeline-card-champion">
                        👑 {season.championName}
                        {season.championCar ? ` · ${season.championCar}` : ""}
                      </div>
                    ) : null}
                    <div className="timeline-card-footer">
                      <div className="timeline-card-footer-left">
                        {season.tag ? (
                          <span
                            className="timeline-card-legend-tag"
                            style={{ borderColor: accent, color: accent }}
                          >
                            {season.tag}
                          </span>
                        ) : null}
                        <span
                          className="timeline-card-cta"
                          style={{ color: accent }}
                        >
                          进入该赛季 ▸
                        </span>
                      </div>
                      <div
                        className="timeline-card-floaty-car"
                        aria-hidden="true"
                      >
                        <svg width="66" height="32" viewBox="0 0 66 32">
                          <path
                            d="M6 22c0-6 6-10 15-11l6-5h11l3 7c7 1 14 3 16 8l-3 4H9z"
                            fill={accent}
                          />
                          <rect
                            x="42"
                            y="9"
                            width="12"
                            height="4"
                            rx="2"
                            fill="#3a3532"
                          />
                          <rect
                            x="46"
                            y="12"
                            width="3"
                            height="11"
                            fill="#3a3532"
                          />
                          <circle cx="18" cy="24" r="6" fill="#3a3532" />
                          <circle cx="18" cy="24" r="2.4" fill="#fff" />
                          <circle cx="47" cy="24" r="6" fill="#3a3532" />
                          <circle cx="47" cy="24" r="2.4" fill="#fff" />
                          <circle cx="32" cy="10" r="4" fill="#ffd23e" />
                        </svg>
                      </div>
                    </div>
                  </Link>
                </Fragment>
              );
            }

            return (
              <Fragment key={node.id}>
                <button
                  ref={setNodeRef}
                  type="button"
                  className="timeline-node"
                  data-highlighted="false"
                  style={{
                    left: toXPercent(node.x),
                    top: node.y,
                    borderColor: accent,
                    opacity: emphasized ? 1 : undefined,
                  }}
                  aria-label={label}
                  aria-expanded={expandedSeasonId === node.id}
                  onClick={() => toggleSeason(season)}
                />
                <article
                  className="timeline-card timeline-card-ordinary"
                  data-side={node.side}
                  style={{
                    top: node.y - (compact ? 20 : 28),
                    opacity: emphasized ? 1 : undefined,
                  }}
                  onClick={() => toggleSeason(season)}
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
              </Fragment>
            );
          })}

          {expandedSeason && expandedNode ? (
            <div
              className="timeline-popover"
              data-side={expandedNode.side}
              style={{ top: expandedNode.y - 6 }}
              role="group"
              aria-label={`${expandedSeason.year} 赛季预览`}
            >
              <div className="timeline-popover-header">
                <span
                  className="timeline-popover-year"
                  style={{ color: eraAccentVar(expandedNode.year) }}
                >
                  {expandedSeason.year}
                </span>
                <button
                  type="button"
                  className="timeline-popover-close"
                  aria-label="关闭预览"
                  onClick={closePopover}
                >
                  ✕
                </button>
              </div>
              {expandedSeason.championName ? (
                <p className="timeline-popover-champion">
                  👑 {expandedSeason.championName}
                  {expandedSeason.championCar
                    ? ` · ${expandedSeason.championCar}`
                    : ""}
                </p>
              ) : null}
              {expandedSeason.tag ? (
                <p>
                  <span className="timeline-card-tag">
                    🔧 {expandedSeason.tag}
                  </span>
                </p>
              ) : null}
              <Link
                href={`/seasons/${expandedSeason.year}`}
                className="timeline-popover-cta"
                onClick={() => onSelectSeason?.(expandedSeason)}
              >
                进入该赛季 GO! ▸
              </Link>
            </div>
          ) : null}

          <div
            className="timeline-car"
            style={{
              left: `calc(${toXPercent(car.x)} - 13px)`,
              top: car.y - 22,
              transform: `rotate(${car.angle}deg)`,
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
