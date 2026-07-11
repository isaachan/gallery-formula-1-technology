import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MuseumBrowser } from "../../src/app/museum/museum-browser";
import { searchMuseum } from "../../src/app/museum/actions";

vi.mock("../../src/app/museum/actions", () => ({
  searchMuseum: vi.fn(),
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

describe("MuseumBrowser", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    vi.mocked(searchMuseum).mockReset();
  });

  afterEach(() => {
    window.sessionStorage.clear();
  });

  it("shows the car tab by default and switches tabs on activation", () => {
    render(<MuseumBrowser cars={cars} people={people} technologies={[]} />);

    expect(screen.getByText("迈凯伦 MP4/4")).toBeInTheDocument();
    expect(screen.getByText("查看时间轴 ▸")).toHaveAttribute(
      "href",
      "/?year=1988",
    );

    fireEvent.click(screen.getByRole("tab", { name: "人物" }));
    expect(screen.getByText("艾尔顿·塞纳")).toBeInTheDocument();
    expect(screen.queryByText("迈凯伦 MP4/4")).not.toBeInTheDocument();
  });

  it("shows an empty-state message for a tab with no published entries", () => {
    render(<MuseumBrowser cars={[]} people={[]} technologies={[]} />);

    expect(screen.getByText("暂无已发布的车辆条目。")).toBeInTheDocument();
  });

  it("restores the previously selected tab from sessionStorage", () => {
    window.sessionStorage.setItem(
      "f1-museum-state",
      JSON.stringify({ tab: "person", scrollTop: 0 }),
    );

    render(<MuseumBrowser cars={cars} people={people} technologies={[]} />);

    expect(screen.getByText("艾尔顿·塞纳")).toBeInTheDocument();
    expect(screen.queryByText("迈凯伦 MP4/4")).not.toBeInTheDocument();
  });

  it("searches and shows typed, contextual results", async () => {
    vi.mocked(searchMuseum).mockResolvedValue([
      {
        id: "person-ayrton-senna",
        slug: "ayrton-senna",
        type: "person",
        title: "艾尔顿·塞纳",
        subtitle: "McLaren · 1988 冠军",
        href: "/people/ayrton-senna",
      },
    ]);

    render(<MuseumBrowser cars={cars} people={people} technologies={[]} />);

    fireEvent.change(screen.getByLabelText("搜索博物馆"), {
      target: { value: "塞纳" },
    });
    fireEvent.click(screen.getByRole("button", { name: "搜索" }));

    const resultsList = await screen.findByLabelText("搜索结果");
    expect(resultsList).toHaveTextContent("人物");
    expect(resultsList).toHaveTextContent("McLaren · 1988 冠军");
  });

  it("shows a no-results message for a query with no matches", async () => {
    vi.mocked(searchMuseum).mockResolvedValue([]);

    render(<MuseumBrowser cars={cars} people={people} technologies={[]} />);

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
    vi.mocked(searchMuseum).mockRejectedValue(new Error("network down"));

    render(<MuseumBrowser cars={cars} people={people} technologies={[]} />);

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
