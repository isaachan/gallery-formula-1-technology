import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  GalleryCarSvg,
  galleryCarProfileForSeason,
} from "../../src/components/car-illustrations";

describe("gallery car illustrations", () => {
  it("uses historically ordered silhouette families", () => {
    expect(galleryCarProfileForSeason(1955)).toBe("front-engine");
    expect(galleryCarProfileForSeason(1965)).toBe("cigar");
    expect(galleryCarProfileForSeason(1974)).toBe("wedge");
    expect(galleryCarProfileForSeason(1988)).toBe("turbo");
    expect(galleryCarProfileForSeason(2004)).toBe("grooved-tyre");
    expect(galleryCarProfileForSeason(2014)).toBe("narrow-wing");
    expect(galleryCarProfileForSeason(2024)).toBe("ground-effect-return");
  });

  it("combines a season silhouette with a team livery", () => {
    const { container } = render(
      <GalleryCarSvg seasonYear={1988} teamSlug="mclaren" />,
    );

    const illustration = container.querySelector("svg");
    expect(illustration).toHaveAttribute("data-profile", "turbo");
    expect(illustration).toHaveAttribute("data-livery", "speedmark");
  });
});
