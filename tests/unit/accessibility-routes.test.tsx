import { render } from "@testing-library/react";
import axe from "axe-core";
import { describe, expect, it } from "vitest";
import HomePage from "../../src/app/page";
import MuseumPage from "../../src/app/museum/page";
import SeasonPage from "../../src/app/seasons/[year]/page";
import CarPage from "../../src/app/cars/[slug]/page";
import PersonPage from "../../src/app/people/[slug]/page";
import TechnologyPage from "../../src/app/technologies/[slug]/page";

async function expectNoAxeViolations(element: React.ReactElement) {
  const { container } = render(element);
  const results = await axe.run(container, {
    rules: {
      "color-contrast": { enabled: false },
    },
  });

  expect(results.violations).toEqual([]);
}

describe("route accessibility baselines", () => {
  it("keeps the home route free of automated accessibility violations", async () => {
    await expectNoAxeViolations(await HomePage());
  });

  it("keeps the season detail route free of automated accessibility violations", async () => {
    await expectNoAxeViolations(
      await SeasonPage({ params: Promise.resolve({ year: "1988" }) }),
    );
  });

  it("keeps the museum route free of automated accessibility violations", async () => {
    await expectNoAxeViolations(await MuseumPage());
  }, 30000);

  it("keeps the car route free of automated accessibility violations", async () => {
    await expectNoAxeViolations(
      await CarPage({ params: Promise.resolve({ slug: "mclaren-mp4-4" }) }),
    );
  });

  it("keeps the person route free of automated accessibility violations", async () => {
    await expectNoAxeViolations(
      await PersonPage({ params: Promise.resolve({ slug: "ayrton-senna" }) }),
    );
  });

  it("keeps the technology route free of automated accessibility violations", async () => {
    await expectNoAxeViolations(
      await TechnologyPage({
        params: Promise.resolve({ slug: "honda-ra168e" }),
      }),
    );
  });
});
