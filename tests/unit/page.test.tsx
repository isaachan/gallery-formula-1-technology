import { render, screen } from "@testing-library/react";
import Home from "../../src/app/page";

describe("Home page", () => {
  it("renders the project title and deployment diagnostics", async () => {
    render(await Home({ searchParams: Promise.resolve({}) }));

    expect(
      screen.getByRole("heading", { name: "F1 赛道年代记" }),
    ).toBeInTheDocument();
    expect(screen.getByText("US-A02")).toBeInTheDocument();
    expect(screen.getByText("US-A03")).toBeInTheDocument();
    expect(screen.getByText("US-B02.1")).toBeInTheDocument();
    expect(screen.getByText("US-B02.2")).toBeInTheDocument();
    expect(screen.getByText("博物馆")).toBeInTheDocument();
    expect(screen.getAllByText("'80s").length).toBeGreaterThan(0);
    expect(screen.getByText("块注册预览")).toBeInTheDocument();
    expect(screen.getByText("叙事块预览")).toBeInTheDocument();
    expect(screen.getByText("时间轴赛道预览")).toBeInTheDocument();
    expect(screen.getByText("npm run validate:content")).toBeInTheDocument();
    expect(screen.getByText("/api/diagnostics")).toBeInTheDocument();
  });
});
