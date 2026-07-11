import { render, screen } from "@testing-library/react";
import {
  getRegisteredBlockTypes,
  renderContentBlocks,
} from "../../src/blocks/block-registry";

describe("block registry", () => {
  it("registers every planned block type", () => {
    expect(getRegisteredBlockTypes()).toEqual([
      "richText",
      "image",
      "gallery",
      "diagram",
      "animation",
      "audio",
      "video",
      "model3d",
      "factGrid",
      "quote",
      "relatedEntities",
    ]);
  });

  it("preserves block order and stable ids during rendering", () => {
    const { container } = render(
      <>
        {renderContentBlocks([
          {
            id: "story-intro",
            type: "richText",
            heading: { zh: "先出现" },
          },
          {
            id: "story-media",
            type: "image",
            heading: { zh: "后出现" },
          },
        ])}
      </>,
    );

    const renderedBlocks = Array.from(
      container.querySelectorAll("[data-block-id]"),
    );

    expect(renderedBlocks).toHaveLength(2);
    expect(renderedBlocks[0]).toHaveAttribute("data-block-id", "story-intro");
    expect(renderedBlocks[1]).toHaveAttribute("data-block-id", "story-media");
  });

  it("renders a safe development diagnostic for unknown blocks", () => {
    render(
      <>
        {renderContentBlocks(
          [
            {
              id: "story-unknown",
              type: "timelineScroller",
            },
          ],
          { developmentDiagnostics: true },
        )}
      </>,
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      'Unknown block type "timelineScroller" was blocked from publication.',
    );
  });

  it("hides implementation details in production fallback mode", () => {
    render(
      <>
        {renderContentBlocks(
          [
            {
              id: "story-unknown",
              type: "timelineScroller",
            },
          ],
          { developmentDiagnostics: false },
        )}
      </>,
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "A content block could not be previewed safely.",
    );
  });
});
