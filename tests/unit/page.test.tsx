import { render, screen } from "@testing-library/react";
import Home from "../../src/app/page";

describe("Home page", () => {
  it("renders the brand header, museum link, and the season timeline", async () => {
    render(await Home({ searchParams: Promise.resolve({}) }));

    expect(screen.getByText("GRAND PRIX")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /博物馆/ })).toHaveAttribute(
      "href",
      "/museum",
    );
    expect(screen.getAllByText("'80s").length).toBeGreaterThan(0);
    expect(
      screen.getByRole("region", { name: "F1 season timeline" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", {
        name: "1988 · 艾尔顿·塞纳 · 迈凯伦 MP4/4",
      }),
    ).toHaveAttribute("href", "/seasons/1988");
  });
});
