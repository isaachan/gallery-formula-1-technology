import { act, fireEvent, render, screen } from "@testing-library/react";
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

// The car/emphasis position is driven by a continuous requestAnimationFrame
// poll rather than 'scroll' events (see Timeline.tsx — iOS WebKit has been
// observed to fire few or no scroll events for a nested overflow container
// during touch scrolling). The poll re-schedules itself every frame, so a
// stub that auto-invokes synchronously would recurse forever; instead
// capture the latest callback and let tests pump it manually to simulate a
// frame elapsing.
let latestRafCallback: FrameRequestCallback | null = null;

function pumpAnimationFrame() {
  act(() => {
    latestRafCallback?.(0);
  });
}

describe("Timeline", () => {
  beforeEach(() => {
    latestRafCallback = null;
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
      latestRafCallback = callback;
      return 0;
    });
    vi.stubGlobal("cancelAnimationFrame", () => {});
    window.sessionStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    window.sessionStorage.clear();
  });

  it("renders a link node for a highlighted season and a button node for an ordinary season, each with a descriptive label", () => {
    render(<Timeline seasons={seasons} />);

    expect(
      screen.getByRole("link", {
        name: "1950 · 法里纳 · Alfa Romeo 158",
      }),
    ).toHaveAttribute("href", "/seasons/1950");
    expect(
      screen.getByRole("button", {
        name: "1951 · 方吉奥 · Alfa Romeo 159",
      }),
    ).toBeInTheDocument();
  });

  it("renders the highlighted card as a link to the canonical season URL and the ordinary pill as a non-navigating card", () => {
    const { container } = render(<Timeline seasons={seasons} />);

    const highlightedCard = container.querySelector(
      ".timeline-card-highlighted",
    );
    expect(highlightedCard).toHaveTextContent("★ 元年");
    expect(highlightedCard).toHaveTextContent("1950 赛季");
    expect(highlightedCard?.tagName).toBe("A");
    expect(highlightedCard).toHaveAttribute("href", "/seasons/1950");

    const ordinaryCard = container.querySelector(".timeline-card-ordinary");
    expect(ordinaryCard).toHaveTextContent("方吉奥");
    expect(ordinaryCard).toHaveTextContent("🔧 机械增压");
    expect(ordinaryCard?.tagName).toBe("ARTICLE");
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

  it("opens a preview popover with champion, car, and tag when an ordinary season node is activated, and toggles it closed on a second activation", () => {
    render(<Timeline seasons={seasons} />);
    const node = screen.getByRole("button", {
      name: "1951 · 方吉奥 · Alfa Romeo 159",
    });

    expect(node).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(node);

    expect(node).toHaveAttribute("aria-expanded", "true");
    const popover = screen.getByRole("group", { name: "1951 赛季预览" });
    expect(popover).toHaveTextContent("方吉奥");
    expect(popover).toHaveTextContent("Alfa Romeo 159");
    expect(popover).toHaveTextContent("机械增压");
    expect(
      screen.getByRole("link", { name: /进入该赛季 GO!/ }),
    ).toHaveAttribute("href", "/seasons/1951");

    fireEvent.click(node);
    expect(
      screen.queryByRole("group", { name: "1951 赛季预览" }),
    ).not.toBeInTheDocument();
    expect(node).toHaveAttribute("aria-expanded", "false");
  });

  it("closes the popover and returns focus to the node when Escape is pressed", () => {
    render(<Timeline seasons={seasons} />);
    const node = screen.getByRole("button", {
      name: "1951 · 方吉奥 · Alfa Romeo 159",
    });

    fireEvent.click(node);
    expect(
      screen.getByRole("group", { name: "1951 赛季预览" }),
    ).toBeInTheDocument();

    fireEvent.keyDown(document, { key: "Escape" });

    expect(
      screen.queryByRole("group", { name: "1951 赛季预览" }),
    ).not.toBeInTheDocument();
    expect(node).toHaveFocus();
  });

  it("closes the popover via its close button", () => {
    render(<Timeline seasons={seasons} />);
    fireEvent.click(
      screen.getByRole("button", { name: "1951 · 方吉奥 · Alfa Romeo 159" }),
    );

    fireEvent.click(screen.getByRole("button", { name: "关闭预览" }));

    expect(
      screen.queryByRole("group", { name: "1951 赛季预览" }),
    ).not.toBeInTheDocument();
  });

  it("scrolls to and focuses the deep-linked year when initialFocusYear is provided", () => {
    render(<Timeline seasons={seasons} initialFocusYear={1951} />);

    const node = screen.getByRole("button", {
      name: "1951 · 方吉奥 · Alfa Romeo 159",
    });
    expect(node).toHaveFocus();
  });

  it("restores the scroll position and open popover from a previous session", () => {
    const { unmount } = render(<Timeline seasons={seasons} />);
    fireEvent.click(
      screen.getByRole("button", { name: "1951 · 方吉奥 · Alfa Romeo 159" }),
    );
    unmount();

    render(<Timeline seasons={seasons} />);

    expect(
      screen.getByRole("group", { name: "1951 赛季预览" }),
    ).toBeInTheDocument();
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
    // The car position poll (see Timeline.tsx) picks up scrollTop on the
    // next animation frame rather than a 'scroll' event.
    pumpAnimationFrame();

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
