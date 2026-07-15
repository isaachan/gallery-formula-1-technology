import { fireEvent, render, screen } from "@testing-library/react";
import Home from "../../src/app/page";

describe("Home page", () => {
  it("renders the brand header, museum launcher, and the season timeline", async () => {
    render(await Home());

    expect(screen.getByText("GRAND PRIX")).toBeInTheDocument();
    expect(screen.getAllByText("'80s").length).toBeGreaterThan(0);
    expect(
      screen.getByRole("region", { name: "F1 season timeline" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", {
        name: "1988 · 艾尔顿·塞纳 · 迈凯伦 MP4/4",
      }),
    ).toHaveAttribute("href", "/seasons/1988");

    const museumButton = screen.getByRole("button", { name: /博物馆/ });
    expect(
      screen.queryByRole("heading", { name: /博物馆/ }),
    ).not.toBeInTheDocument();
    fireEvent.click(museumButton);
    expect(screen.getByText(/🏛️ 博物馆/)).toBeInTheDocument();

    const closeButton = screen.getByRole("button", { name: "关闭博物馆" });
    fireEvent.click(closeButton);
    expect(screen.queryByText(/🏛️ 博物馆/)).not.toBeInTheDocument();
  });
});
