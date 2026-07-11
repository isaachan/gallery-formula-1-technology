import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Timeline, type TimelineSeason } from "../../src/timeline/Timeline";

const seasons: TimelineSeason[] = [
  {
    id: "season-1950",
    year: 1950,
    highlighted: true,
    title: "1950 赛季",
    championName: "法里纳",
    championCar: "Alfa Romeo 158",
    badge: "元年",
  },
  {
    id: "season-1951",
    year: 1951,
    highlighted: false,
    title: "1951 赛季",
    championName: "方吉奥",
    championCar: "Alfa Romeo 159",
    tag: "机械增压",
  },
];

describe("Timeline", () => {
  beforeEach(() => {
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
      callback(0);
      return 0;
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders exactly one node per season with a descriptive accessible label", () => {
    render(<Timeline seasons={seasons} />);

    expect(
      screen.getByRole("button", {
        name: "1950 · 法里纳 · Alfa Romeo 158",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: "1951 · 方吉奥 · Alfa Romeo 159",
      }),
    ).toBeInTheDocument();
  });

  it("renders the highlighted card treatment for a highlighted season and the ordinary pill for others", () => {
    const { container } = render(<Timeline seasons={seasons} />);

    const highlightedCard = container.querySelector(
      ".timeline-card-highlighted",
    );
    expect(highlightedCard).toHaveTextContent("★ 元年");
    expect(highlightedCard).toHaveTextContent("1950 赛季");

    const ordinaryCard = container.querySelector(".timeline-card-ordinary");
    expect(ordinaryCard).toHaveTextContent("方吉奥");
    expect(ordinaryCard).toHaveTextContent("🔧 机械增压");
  });

  it("calls onSelectSeason with the matching season when a node is activated", () => {
    const onSelectSeason = vi.fn();
    render(<Timeline seasons={seasons} onSelectSeason={onSelectSeason} />);

    fireEvent.click(
      screen.getByRole("button", {
        name: "1951 · 方吉奥 · Alfa Romeo 159",
      }),
    );

    expect(onSelectSeason).toHaveBeenCalledWith(seasons[1]);
  });

  it("renders every decade chip and jumps the scroll container when one is activated", () => {
    const { container } = render(<Timeline seasons={seasons} />);
    const scrollRegion = container.querySelector(
      ".timeline-scroll",
    ) as HTMLDivElement;
    const scrollToSpy = vi.spyOn(scrollRegion, "scrollTo");

    fireEvent.click(screen.getByRole("button", { name: "'50s" }));
    expect(scrollToSpy).toHaveBeenCalledWith({ top: 0, behavior: "smooth" });

    fireEvent.click(screen.getByRole("button", { name: "'60s" }));
    // No 1960s content exists in this two-season fixture, so there is no
    // banner to jump to and the click is a safe no-op.
    expect(scrollToSpy).toHaveBeenCalledTimes(1);
  });

  it("updates the decorative car's position when the track is scrolled", () => {
    const { container } = render(<Timeline seasons={seasons} />);
    const scrollRegion = container.querySelector(
      ".timeline-scroll",
    ) as HTMLDivElement;
    const car = container.querySelector(".timeline-car") as HTMLDivElement;
    const initialTransform = car.style.transform;

    Object.defineProperty(scrollRegion, "scrollTop", {
      value: 400,
      configurable: true,
    });
    fireEvent.scroll(scrollRegion);

    expect(car.style.transform).not.toBe(initialTransform);
  });

  it("uses instant scrolling for decade jumps when reduced motion is preferred", () => {
    const originalMatchMedia = window.matchMedia;
    window.matchMedia = ((query: string) => ({
      matches: query.includes("prefers-reduced-motion"),
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    })) as typeof window.matchMedia;

    try {
      const { container } = render(<Timeline seasons={seasons} />);
      const scrollRegion = container.querySelector(
        ".timeline-scroll",
      ) as HTMLDivElement;
      const scrollToSpy = vi.spyOn(scrollRegion, "scrollTo");

      fireEvent.click(screen.getByRole("button", { name: "'50s" }));

      expect(scrollToSpy).toHaveBeenCalledWith({ top: 0, behavior: "auto" });
    } finally {
      window.matchMedia = originalMatchMedia;
    }
  });
});
