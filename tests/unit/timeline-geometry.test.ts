import { describe, expect, it } from "vitest";
import {
  CAR_ROTATION_LIMIT,
  EMPHASIS_DISTANCE,
  TRACK_CENTER_X,
  TRACK_LEFT_X,
  TRACK_RIGHT_X,
  computeCarPosition,
  computeNearestDecade,
  computeTimelineLayout,
  isNodeEmphasized,
} from "../../src/timeline/geometry";

describe("computeTimelineLayout", () => {
  it("positions alternating ordinary nodes and generates the prototype's exact path", () => {
    const layout = computeTimelineLayout([
      { id: "season-1950", year: 1950, highlighted: false },
      { id: "season-1951", year: 1951, highlighted: false },
    ]);

    expect(layout.nodes).toEqual([
      {
        id: "season-1950",
        year: 1950,
        x: TRACK_LEFT_X,
        y: 158,
        side: "L",
        highlighted: false,
      },
      {
        id: "season-1951",
        year: 1951,
        x: TRACK_RIGHT_X,
        y: 242,
        side: "R",
        highlighted: false,
      },
    ]);
    expect(layout.banners).toEqual([]);
    expect(layout.totalHeight).toBe(454);
    expect(layout.pathD).toBe(
      "M195,-30 C195,50 64,98 64,158 C64,204.2 326,195.8 326,242 C326,312 195,324 195,394",
    );
  });

  it("does not insert a decade banner for the first season even when it starts on a decade boundary", () => {
    const layout = computeTimelineLayout([
      { id: "season-1950", year: 1950, highlighted: false },
    ]);

    expect(layout.banners).toEqual([]);
  });

  it("inserts a decade banner before the first season of a new decade", () => {
    const layout = computeTimelineLayout([
      { id: "season-1958", year: 1958, highlighted: false },
      { id: "season-1959", year: 1959, highlighted: false },
      { id: "season-1960", year: 1960, highlighted: false },
    ]);

    expect(layout.banners).toEqual([{ decade: 1960, y: 116 + 84 + 84 }]);
    // The banner consumes 96px of height before the 1960 node is placed.
    expect(layout.nodes[2].y).toBe(116 + 84 + 84 + 96 + 42);
  });

  it("gives highlighted seasons more vertical space than ordinary seasons", () => {
    const layout = computeTimelineLayout([
      { id: "season-a", year: 1988, highlighted: true },
      { id: "season-b", year: 1989, highlighted: false },
    ]);

    expect(layout.nodes[0].y).toBe(116 + 100); // 200 / 2
    expect(layout.nodes[1].y).toBe(116 + 200 + 42);
  });

  it("uses a shorter ordinary-node height in compact mode without shrinking highlighted nodes", () => {
    const compact = computeTimelineLayout(
      [
        { id: "season-a", year: 1988, highlighted: false },
        { id: "season-b", year: 1989, highlighted: true },
      ],
      { compact: true },
    );

    expect(compact.nodes[0].y).toBe(116 + 29); // 58 / 2
    expect(compact.nodes[1].y).toBe(116 + 58 + 100);
  });

  it("returns a minimal fallback layout for an empty season list", () => {
    const layout = computeTimelineLayout([]);

    expect(layout.nodes).toEqual([]);
    expect(layout.banners).toEqual([]);
    expect(layout.totalHeight).toBe(116 + 170);
    expect(layout.pathD).toBe(
      `M${TRACK_CENTER_X},-30 C${TRACK_CENTER_X},50 ${TRACK_CENTER_X},${286 - 130} ${TRACK_CENTER_X},${286 - 60}`,
    );
  });
});

describe("computeCarPosition", () => {
  const layout = computeTimelineLayout([
    { id: "season-1950", year: 1950, highlighted: false },
    { id: "season-1951", year: 1951, highlighted: false },
    { id: "season-1952", year: 1952, highlighted: false },
  ]);

  it("clamps to the first anchor when scrolled above the track start", () => {
    const position = computeCarPosition(-10_000, layout);
    expect(position.y).toBe(40);
    expect(position.x).toBe(TRACK_CENTER_X);
  });

  it("clamps to the last anchor when scrolled past the track end", () => {
    const position = computeCarPosition(10_000, layout);
    expect(position.y).toBe(layout.totalHeight - 80);
    expect(position.x).toBe(TRACK_CENTER_X);
  });

  it("keeps the rotation within the normative +/-60 degree limit", () => {
    for (const scrollTop of [-500, 0, 100, 250, 400, 900, 5000]) {
      const position = computeCarPosition(scrollTop, layout);
      expect(position.angle).toBeGreaterThanOrEqual(-CAR_ROTATION_LIMIT);
      expect(position.angle).toBeLessThanOrEqual(CAR_ROTATION_LIMIT);
    }
  });

  it("reaches x=64 at the midpoint between the start anchor and the first node", () => {
    // Anchor A = {195, 40}, anchor B = node[0] = {64, 158}; t=0.5 is the
    // midpoint of the eased horizontal interpolation.
    const midY = 40 + (158 - 40) / 2;
    const position = computeCarPosition(midY - 330, layout);
    expect(position.x).toBeCloseTo((195 + 64) / 2, 5);
  });
});

describe("computeNearestDecade", () => {
  it("returns the decade of the node nearest the car's y position", () => {
    const layout = computeTimelineLayout([
      { id: "season-1988", year: 1988, highlighted: false },
      { id: "season-1999", year: 1999, highlighted: false },
    ]);

    expect(computeNearestDecade(layout.nodes[0].y, layout)).toBe(1980);
    expect(computeNearestDecade(layout.nodes[1].y, layout)).toBe(1990);
  });

  it("returns null when the layout has no nodes", () => {
    expect(computeNearestDecade(0, computeTimelineLayout([]))).toBeNull();
  });
});

describe("isNodeEmphasized", () => {
  it("is emphasized strictly inside the 190px threshold and dimmed at or beyond it", () => {
    expect(isNodeEmphasized(0, EMPHASIS_DISTANCE - 1)).toBe(true);
    expect(isNodeEmphasized(0, EMPHASIS_DISTANCE)).toBe(false);
    expect(isNodeEmphasized(0, EMPHASIS_DISTANCE + 1)).toBe(false);
  });
});
