/**
 * Timeline track geometry, ported from the approved design prototype
 * (design/F1 赛道年代记.dc.html, `_layout`/`_carAt`). These distances,
 * thresholds, and formulas are normative per docs/DEVELOPMENT_PLAN.md
 * (US-C01) unless an approved design change updates both this module and
 * its tests.
 */

export type TimelineSeasonInput = {
  id: string;
  year: number;
  highlighted: boolean;
};

export type TimelineNode = {
  id: string;
  year: number;
  x: number;
  y: number;
  side: "L" | "R";
  highlighted: boolean;
};

export type DecadeBanner = {
  decade: number;
  y: number;
};

export type TimelineLayout = {
  nodes: TimelineNode[];
  banners: DecadeBanner[];
  totalHeight: number;
  pathD: string;
};

export const TRACK_CENTER_X = 195;
export const TRACK_LEFT_X = 64;
export const TRACK_RIGHT_X = 326;

const NORMAL_NODE_HEIGHT = 84;
const NORMAL_NODE_HEIGHT_COMPACT = 58;
const HIGHLIGHTED_NODE_HEIGHT = 200;
const BANNER_HEIGHT = 96;
const TOP_OFFSET = 116;
const BOTTOM_PADDING = 170;

/** Cards fade to 0.42 opacity beyond this distance from the decorative car; see US-C01.5. */
export const EMPHASIS_DISTANCE = 190;
export const EMPHASIZED_OPACITY = 1;
export const DIMMED_OPACITY = 0.42;

/** The decorative car's rotation never exceeds this many degrees from vertical; see US-C01.4. */
export const CAR_ROTATION_LIMIT = 60;

/** The car sits this many pixels below the scroll region's current top edge. */
const CAR_SCROLL_OFFSET = 330;

export function computeTimelineLayout(
  seasons: TimelineSeasonInput[],
  options: { compact?: boolean } = {},
): TimelineLayout {
  const { compact = false } = options;
  const normalHeight = compact
    ? NORMAL_NODE_HEIGHT_COMPACT
    : NORMAL_NODE_HEIGHT;

  let y = TOP_OFFSET;
  const nodes: TimelineNode[] = [];
  const banners: DecadeBanner[] = [];
  const points: Array<{ x: number; y: number }> = [];

  seasons.forEach((season, index) => {
    if (season.year % 10 === 0 && season.year !== seasons[0]?.year) {
      banners.push({ decade: season.year, y });
      y += BANNER_HEIGHT;
    }

    const height = season.highlighted ? HIGHLIGHTED_NODE_HEIGHT : normalHeight;
    const x = index % 2 === 0 ? TRACK_LEFT_X : TRACK_RIGHT_X;
    const nodeY = y + height / 2;

    nodes.push({
      id: season.id,
      year: season.year,
      x,
      y: nodeY,
      side: x === TRACK_LEFT_X ? "L" : "R",
      highlighted: season.highlighted,
    });
    points.push({ x, y: nodeY });

    y += height;
  });

  const totalHeight = y + BOTTOM_PADDING;

  return {
    nodes,
    banners,
    totalHeight,
    pathD: buildPathD(points, totalHeight),
  };
}

function buildPathD(
  points: Array<{ x: number; y: number }>,
  totalHeight: number,
): string {
  if (points.length === 0) {
    return `M${TRACK_CENTER_X},-30 C${TRACK_CENTER_X},50 ${TRACK_CENTER_X},${totalHeight - 130} ${TRACK_CENTER_X},${totalHeight - 60}`;
  }

  let d = `M${TRACK_CENTER_X},-30 C${TRACK_CENTER_X},50 ${points[0].x},${points[0].y - 60} ${points[0].x},${points[0].y}`;

  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1];
    const b = points[i];
    const dy = (b.y - a.y) * 0.55;
    d += ` C${a.x},${a.y + dy} ${b.x},${b.y - dy} ${b.x},${b.y}`;
  }

  const last = points[points.length - 1];
  d += ` C${last.x},${last.y + 70} ${TRACK_CENTER_X},${totalHeight - 130} ${TRACK_CENTER_X},${totalHeight - 60}`;

  return d;
}

export type CarPosition = {
  x: number;
  y: number;
  angle: number;
};

/**
 * Computes the decorative car's position and heading for a given scroll
 * offset. `layout` must come from {@link computeTimelineLayout} for the
 * same season list.
 */
export function computeCarPosition(
  scrollTop: number,
  layout: TimelineLayout,
): CarPosition {
  const anchors: Array<{ x: number; y: number }> = [
    { x: TRACK_CENTER_X, y: 40 },
    ...layout.nodes.map((node) => ({ x: node.x, y: node.y })),
    { x: TRACK_CENTER_X, y: layout.totalHeight - 80 },
  ];

  const targetY = Math.max(
    anchors[0].y,
    Math.min(scrollTop + CAR_SCROLL_OFFSET, anchors[anchors.length - 1].y),
  );

  let i = 0;
  while (i < anchors.length - 2 && anchors[i + 1].y < targetY) {
    i++;
  }

  const a = anchors[i];
  const b = anchors[i + 1];
  const t = (targetY - a.y) / Math.max(1, b.y - a.y);

  const x = a.x + (b.x - a.x) * (0.5 - 0.5 * Math.cos(Math.PI * t));
  const dxdt = (b.x - a.x) * 0.5 * Math.PI * Math.sin(Math.PI * t);
  const dydt = b.y - a.y;
  const angle = (Math.atan2(-dxdt, dydt) * 180) / Math.PI;

  return {
    x,
    y: targetY,
    angle: Math.max(-CAR_ROTATION_LIMIT, Math.min(CAR_ROTATION_LIMIT, angle)),
  };
}

/** The decade (e.g. 1980) whose banner/nodes are nearest the car's current y. */
export function computeNearestDecade(
  carY: number,
  layout: TimelineLayout,
): number | null {
  if (layout.nodes.length === 0) {
    return null;
  }

  let nearest = layout.nodes[0];
  let nearestDistance = Infinity;

  for (const node of layout.nodes) {
    const distance = Math.abs(node.y - carY);
    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearest = node;
    }
  }

  return Math.floor(nearest.year / 10) * 10;
}

/** Whether a card at `nodeY` should render at full opacity given the car's `carY`. */
export function isNodeEmphasized(carY: number, nodeY: number): boolean {
  return Math.abs(carY - nodeY) < EMPHASIS_DISTANCE;
}
