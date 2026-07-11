import { render, screen } from "@testing-library/react";
import Home from "../../src/app/page";

describe("Home page", () => {
  it("renders the project title and deployment diagnostics", async () => {
    render(await Home());

    expect(
      screen.getByRole("heading", { name: "F1 赛道年代记" }),
    ).toBeInTheDocument();
    expect(screen.getByText("US-A01")).toBeInTheDocument();
    expect(screen.getByText("US-A02")).toBeInTheDocument();
    expect(screen.getByText("npm run validate:content")).toBeInTheDocument();
    expect(screen.getByText("/api/diagnostics")).toBeInTheDocument();
  });
});
