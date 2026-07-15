import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MuseumSheet } from "../../src/components/museum-sheet";
import { searchMuseumClient } from "../../src/lib/client-search";

vi.mock("../../src/lib/client-search", () => ({
  searchMuseumClient: vi.fn(),
}));

const cars = [
  {
    id: "car-mclaren-mp4-4",
    slug: "mclaren-mp4-4",
    type: "car",
    title: "迈凯伦 MP4/4",
    subtitle: "1988 冠军赛车",
    href: "/cars/mclaren-mp4-4",
    timelineHref: "/?year=1988",
  },
];

const people = [
  {
    id: "person-ayrton-senna",
    slug: "ayrton-senna",
    type: "person",
    title: "艾尔顿·塞纳",
    href: "/people/ayrton-senna",
    timelineHref: "/?year=1988",
  },
];

// The row title's "▸" chevron is a nested <span>, so its text is split
// across sibling nodes — the default string matcher can't reliably match
// the concatenated text, per testing-library's own "broken up by multiple
// elements" guidance. Match on the title element directly instead.
function rowTitle(text: string) {
  return screen.queryByText(
    (_, element) =>
      Boolean(element?.classList.contains("museum-sheet-row-title")) &&
      element?.textContent === text,
  );
}

describe("MuseumSheet", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    vi.mocked(searchMuseumClient).mockReset();
  });

  afterEach(() => {
    window.sessionStorage.clear();
  });

  it("shows the car tab by default and switches tabs on activation", () => {
    render(
      <MuseumSheet
        cars={cars}
        people={people}
        technologies={[]}
        variant="page"
        closeHref="/"
      />,
    );

    expect(rowTitle("迈凯伦 MP4/4 ▸")).toBeInTheDocument();
    expect(screen.getByText("1988 ↩")).toHaveAttribute("href", "/?year=1988");

    fireEvent.click(screen.getByRole("tab", { name: "🪖 车手" }));
    expect(rowTitle("艾尔顿·塞纳 ▸")).toBeInTheDocument();
    expect(rowTitle("迈凯伦 MP4/4 ▸")).not.toBeInTheDocument();
  });

  it("shows an empty-state message for a tab with no published entries", () => {
    render(
      <MuseumSheet
        cars={[]}
        people={[]}
        technologies={[]}
        variant="page"
        closeHref="/"
      />,
    );

    expect(screen.getByText("暂无已发布的车辆条目。")).toBeInTheDocument();
  });

  it("restores the previously selected tab from sessionStorage", () => {
    window.sessionStorage.setItem(
      "f1-museum-state",
      JSON.stringify({ tab: "person", scrollTop: 0 }),
    );

    render(
      <MuseumSheet
        cars={cars}
        people={people}
        technologies={[]}
        variant="page"
        closeHref="/"
      />,
    );

    expect(rowTitle("艾尔顿·塞纳 ▸")).toBeInTheDocument();
    expect(rowTitle("迈凯伦 MP4/4 ▸")).not.toBeInTheDocument();
  });

  it("renders the drag handle and calls onClose for the overlay variant", () => {
    const onClose = vi.fn();
    const { container } = render(
      <MuseumSheet
        cars={cars}
        people={people}
        technologies={[]}
        variant="overlay"
        onClose={onClose}
      />,
    );

    expect(container.querySelector(".museum-sheet-handle")).not.toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "关闭博物馆" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("searches and shows typed, contextual results", async () => {
    vi.mocked(searchMuseumClient).mockResolvedValue([
      {
        id: "person-ayrton-senna",
        slug: "ayrton-senna",
        type: "person",
        title: "艾尔顿·塞纳",
        subtitle: "McLaren · 1988 冠军",
        href: "/people/ayrton-senna",
      },
    ]);

    render(
      <MuseumSheet
        cars={cars}
        people={people}
        technologies={[]}
        variant="page"
        closeHref="/"
      />,
    );

    fireEvent.change(screen.getByLabelText("搜索博物馆"), {
      target: { value: "塞纳" },
    });
    fireEvent.click(screen.getByRole("button", { name: "搜索" }));

    const resultsList = await screen.findByLabelText("搜索结果");
    expect(resultsList).toHaveTextContent("人物");
    expect(resultsList).toHaveTextContent("McLaren · 1988 冠军");
  });

  it("shows a no-results message for a query with no matches", async () => {
    vi.mocked(searchMuseumClient).mockResolvedValue([]);

    render(
      <MuseumSheet
        cars={cars}
        people={people}
        technologies={[]}
        variant="page"
        closeHref="/"
      />,
    );

    fireEvent.change(screen.getByLabelText("搜索博物馆"), {
      target: { value: "no-such-subject" },
    });
    fireEvent.click(screen.getByRole("button", { name: "搜索" }));

    await waitFor(() => {
      expect(
        screen.getByText("没有找到匹配的结果，请尝试其他关键词。"),
      ).toBeInTheDocument();
    });
  });

  it("shows a safe error message when search fails", async () => {
    vi.mocked(searchMuseumClient).mockRejectedValue(new Error("network down"));

    render(
      <MuseumSheet
        cars={cars}
        people={people}
        technologies={[]}
        variant="page"
        closeHref="/"
      />,
    );

    fireEvent.change(screen.getByLabelText("搜索博物馆"), {
      target: { value: "塞纳" },
    });
    fireEvent.click(screen.getByRole("button", { name: "搜索" }));

    await waitFor(() => {
      expect(
        screen.getByText("搜索暂时不可用，请稍后重试。"),
      ).toBeInTheDocument();
    });
  });
});
