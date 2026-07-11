import { fireEvent, render, screen } from "@testing-library/react";
import {
  getRegisteredBlockTypes,
  renderContentBlocks,
} from "../../src/blocks/block-registry";

const sampleImageMedia = {
  id: "media-ra168e-cutaway",
  alt: { zh: "引擎剖面图", en: "Engine cutaway" },
  src: "https://media.example.com/ra168e-fallback.jpg",
  variants: [
    {
      src: "https://media.example.com/ra168e-480.avif",
      mimeType: "image/avif",
      width: 480,
      height: 270,
    },
    {
      src: "https://media.example.com/ra168e-1280.avif",
      mimeType: "image/avif",
      width: 1280,
      height: 720,
    },
  ],
  caption: { zh: "引擎舱布局示意" },
  credit: "编辑部原创插画",
  focalPoint: { x: 0.25, y: 0.75 },
};

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

  it("renders an image block with responsive variants, reserved dimensions, focal point, caption, and credit", () => {
    const { container } = render(
      <>
        {renderContentBlocks([
          {
            id: "story-image",
            type: "image",
            heading: { zh: "主视觉" },
            layout: "portrait",
            media: sampleImageMedia,
            sourceIds: ["source-f1-technical"],
          },
        ])}
      </>,
    );

    const image = screen.getByRole("img", { name: "引擎剖面图" });
    expect(image.tagName).toBe("IMG");
    expect(image).toHaveAttribute("width", "480");
    expect(image).toHaveAttribute("height", "270");
    expect(image).toHaveAttribute(
      "src",
      "https://media.example.com/ra168e-fallback.jpg",
    );
    expect(image.style.objectPosition).toBe("25% 75%");
    expect(image.style.aspectRatio).toBe("480 / 270");

    expect(
      container.querySelectorAll('source[type="image/avif"]'),
    ).toHaveLength(1);

    expect(screen.getByText("引擎舱布局示意")).toBeInTheDocument();
    expect(screen.getByText("编辑部原创插画")).toBeInTheDocument();
    expect(screen.getByText("Sources:")).toBeInTheDocument();
    expect(
      container.querySelector('[data-block-type="image"]'),
    ).toHaveAttribute("data-layout", "portrait");
  });

  it("renders a safe development diagnostic for an image block missing media or alt text", () => {
    render(
      <>
        {renderContentBlocks(
          [
            {
              id: "story-bad-image",
              type: "image",
            },
          ],
          { developmentDiagnostics: true },
        )}
      </>,
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      'Block "story-bad-image" cannot be previewed: missing media reference or alternative text.',
    );
  });

  it("falls back to an informative state without collapsing the page when an image fails to load", () => {
    render(
      <>
        {renderContentBlocks([
          {
            id: "story-image-failure",
            type: "image",
            media: sampleImageMedia,
          },
        ])}
      </>,
    );

    const image = screen.getByRole("img", { name: "引擎剖面图" });
    fireEvent.error(image);

    expect(screen.getByRole("img", { name: "引擎剖面图" })).toHaveTextContent(
      "图片暂时无法显示",
    );
  });

  it("renders gallery items and isolates a malformed item without breaking the rest of the gallery", () => {
    render(
      <>
        {renderContentBlocks(
          [
            {
              id: "story-gallery",
              type: "gallery",
              heading: { zh: "车辆图集" },
              items: [
                {
                  media: {
                    id: "media-front",
                    alt: { zh: "前 3/4 视角" },
                    src: "https://media.example.com/front.jpg",
                  },
                },
                {},
                {
                  media: {
                    id: "media-rear",
                    alt: { zh: "尾翼细节" },
                    src: "https://media.example.com/rear.jpg",
                  },
                },
              ],
            },
          ],
          { developmentDiagnostics: true },
        )}
      </>,
    );

    expect(
      screen.getByRole("img", { name: "前 3/4 视角" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "尾翼细节" })).toBeInTheDocument();
    expect(
      screen.getByText(
        "Gallery item 1 cannot be previewed: missing media reference or alternative text.",
      ),
    ).toBeInTheDocument();
  });

  it("renders a safe development diagnostic for a gallery with no items", () => {
    render(
      <>
        {renderContentBlocks(
          [
            {
              id: "story-empty-gallery",
              type: "gallery",
              items: [],
            },
          ],
          { developmentDiagnostics: true },
        )}
      </>,
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      'Block "story-empty-gallery" cannot be previewed: missing gallery items.',
    );
  });

  it("renders related-entity links to canonical routes and isolates a broken reference", () => {
    render(
      <>
        {renderContentBlocks(
          [
            {
              id: "story-related",
              type: "relatedEntities",
              heading: { zh: "相关内容" },
              items: [
                {
                  entityId: "person-ayrton-senna",
                  entity: {
                    id: "person-ayrton-senna",
                    entityType: "person",
                    title: { zh: "塞纳" },
                    subtitle: { zh: "McLaren · 1988 冠军" },
                    href: "/people/ayrton-senna",
                  },
                },
                { entityId: "car-missing-reference" },
              ],
              sourceIds: ["source-mclaren-archive"],
            },
          ],
          { developmentDiagnostics: true },
        )}
      </>,
    );

    const link = screen.getByRole("link", { name: /塞纳/ });
    expect(link).toHaveAttribute("href", "/people/ayrton-senna");
    expect(screen.getByText("McLaren · 1988 冠军")).toBeInTheDocument();
    expect(
      screen.getByText(
        'Related entity "car-missing-reference" could not be resolved and was skipped.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("Sources:")).toBeInTheDocument();
  });

  it("renders a safe development diagnostic for related-entity blocks with no items", () => {
    render(
      <>
        {renderContentBlocks(
          [
            {
              id: "story-empty-related",
              type: "relatedEntities",
              items: [],
            },
          ],
          { developmentDiagnostics: true },
        )}
      </>,
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      'Block "story-empty-related" cannot be previewed: missing related entities.',
    );
  });
});
