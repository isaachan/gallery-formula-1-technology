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

  it("renders rich text, fact grid, and quote blocks with semantic content", () => {
    render(
      <>
        {renderContentBlocks([
          {
            id: "story-intro",
            type: "richText",
            heading: { zh: "技术叙事" },
            content: { zh: "第一段。\n\n第二段。" },
            sourceIds: ["source-a"],
          },
          {
            id: "story-facts",
            type: "factGrid",
            heading: { zh: "结构事实" },
            items: [
              {
                label: { zh: "赛季" },
                value: { zh: "1988" },
                accent: "highlight",
              },
            ],
            sourceIds: ["source-b"],
          },
          {
            id: "story-quote",
            type: "quote",
            heading: { zh: "引用" },
            quote: { zh: "关键引述。" },
            attribution: { zh: "编辑注" },
          },
        ])}
      </>,
    );

    expect(
      screen.getByRole("heading", { name: "技术叙事" }),
    ).toBeInTheDocument();
    expect(screen.getByText("第一段。")).toBeInTheDocument();
    expect(screen.getByText("第二段。")).toBeInTheDocument();
    expect(screen.getByText("赛季")).toBeInTheDocument();
    expect(screen.getByText("1988")).toBeInTheDocument();
    expect(screen.getByText("关键引述。")).toBeInTheDocument();
    expect(screen.getByText("编辑注")).toBeInTheDocument();
    expect(screen.getAllByText("Sources:")).toHaveLength(2);
  });

  it("renders a safe development diagnostic for malformed rich text blocks", () => {
    render(
      <>
        {renderContentBlocks(
          [
            {
              id: "story-bad-rich-text",
              type: "richText",
            },
          ],
          { developmentDiagnostics: true },
        )}
      </>,
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      'Block "story-bad-rich-text" cannot be previewed: missing localized rich-text content.',
    );
  });
});
