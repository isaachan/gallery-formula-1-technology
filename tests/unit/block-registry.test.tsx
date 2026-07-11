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

  it("renders a diagram block with its image and required textual explanation", () => {
    render(
      <>
        {renderContentBlocks([
          {
            id: "story-diagram",
            type: "diagram",
            heading: { zh: "涡轮增压路径" },
            media: sampleImageMedia,
            explanation: {
              zh: "进气经过涡轮增压后温度升高，中冷器负责在进入气缸前降温。",
            },
            sourceIds: ["source-f1-technical"],
          },
        ])}
      </>,
    );

    expect(screen.getByRole("img", { name: "引擎剖面图" })).toBeInTheDocument();
    expect(
      screen.getByText(
        "进气经过涡轮增压后温度升高，中冷器负责在进入气缸前降温。",
      ),
    ).toBeInTheDocument();
  });

  it("renders a safe development diagnostic for a diagram block missing an explanation", () => {
    render(
      <>
        {renderContentBlocks(
          [
            {
              id: "story-bad-diagram",
              type: "diagram",
              media: sampleImageMedia,
            },
          ],
          { developmentDiagnostics: true },
        )}
      </>,
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      'Block "story-bad-diagram" cannot be previewed: missing media reference, alternative text, or a textual explanation.',
    );
  });

  it("renders an animation block with a pause/play toggle, poster fallback, and explanation", () => {
    render(
      <>
        {renderContentBlocks([
          {
            id: "story-animation",
            type: "animation",
            heading: { zh: "涡轮增压动画" },
            media: {
              id: "media-turbo-animation",
              alt: { zh: "涡轮增压气流动画" },
              videoSrc: "https://media.example.com/turbo-loop.mp4",
              posterSrc: "https://media.example.com/turbo-poster.jpg",
              credit: "编辑部原创动画",
            },
            explanation: {
              zh: "动画展示了废气驱动涡轮旋转并压缩进气的过程。",
            },
          },
        ])}
      </>,
    );

    const video = document.querySelector("video");
    expect(video).toHaveAttribute(
      "poster",
      "https://media.example.com/turbo-poster.jpg",
    );
    expect(video).toHaveAttribute(
      "src",
      "https://media.example.com/turbo-loop.mp4",
    );

    const toggle = screen.getByRole("button", { name: /动画/ });
    expect(toggle).toHaveAttribute("aria-pressed", "true");
    expect(toggle).toHaveTextContent("暂停动画");

    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-pressed", "false");
    expect(toggle).toHaveTextContent("播放动画");

    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-pressed", "true");
    expect(toggle).toHaveTextContent("暂停动画");

    expect(
      screen.getByText("动画展示了废气驱动涡轮旋转并压缩进气的过程。"),
    ).toBeInTheDocument();
    expect(screen.getByText("编辑部原创动画")).toBeInTheDocument();
  });

  it("renders a safe development diagnostic for an animation block missing a video or poster source", () => {
    render(
      <>
        {renderContentBlocks(
          [
            {
              id: "story-bad-animation",
              type: "animation",
              media: {
                id: "media-turbo-animation",
                alt: { zh: "涡轮增压气流动画" },
                videoSrc: "",
                posterSrc: "",
              },
              explanation: { zh: "说明文本。" },
            },
          ],
          { developmentDiagnostics: true },
        )}
      </>,
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      'Block "story-bad-animation" cannot be previewed: missing media, poster/video source, or a textual explanation.',
    );
  });

  it("renders a video block with native controls, no autoplay, credit, and transcript", () => {
    render(
      <>
        {renderContentBlocks([
          {
            id: "story-video",
            type: "video",
            heading: { zh: "塞纳车载视角" },
            media: {
              id: "media-onboard-clip",
              alt: { zh: "1988 摩纳哥站车载视角片段" },
              videoSrc: "https://media.example.com/onboard.mp4",
              posterSrc: "https://media.example.com/onboard-poster.jpg",
              credit: "编辑部原创片段",
            },
            transcript: {
              zh: "画面展示了驾驶员视角下通过隧道路段的过程，未包含对白。",
            },
            sourceIds: ["source-mclaren-archive"],
          },
        ])}
      </>,
    );

    const video = document.querySelector("video");
    expect(video).toHaveAttribute("controls");
    expect(video).not.toHaveAttribute("autoplay");
    expect(video).toHaveAttribute(
      "poster",
      "https://media.example.com/onboard-poster.jpg",
    );
    expect(
      screen.getByText(
        "画面展示了驾驶员视角下通过隧道路段的过程，未包含对白。",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("编辑部原创片段")).toBeInTheDocument();
    expect(screen.getByText("Sources:")).toBeInTheDocument();
  });

  it("renders a safe development diagnostic for a video block missing a transcript", () => {
    render(
      <>
        {renderContentBlocks(
          [
            {
              id: "story-bad-video",
              type: "video",
              media: {
                id: "media-onboard-clip",
                alt: { zh: "1988 摩纳哥站车载视角片段" },
                videoSrc: "https://media.example.com/onboard.mp4",
                posterSrc: "https://media.example.com/onboard-poster.jpg",
              },
            },
          ],
          { developmentDiagnostics: true },
        )}
      </>,
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      'Block "story-bad-video" cannot be previewed: missing media, poster/video source, or a transcript.',
    );
  });

  it("renders an audio block with explicit controls, credit, and transcript", async () => {
    render(
      <>
        {renderContentBlocks([
          {
            id: "story-audio",
            type: "audio",
            heading: { zh: "引擎音效" },
            media: {
              id: "media-engine-audio",
              alt: { zh: "Honda RA168E 怠速与加速音效" },
              src: "https://media.example.com/engine.mp3",
              credit: "编辑部原创录音",
            },
            transcript: {
              zh: "非语音音频：引擎从怠速到加速的转速提升声音描述。",
            },
            sourceIds: ["source-f1-technical"],
          },
        ])}
      </>,
    );

    const audio = document.querySelector("audio");
    expect(audio).toHaveAttribute("preload", "none");
    expect(audio).not.toHaveAttribute("autoplay");
    expect(audio).toHaveAttribute(
      "src",
      "https://media.example.com/engine.mp3",
    );
    expect(screen.getByRole("button", { name: "播放" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "停止" })).toBeInTheDocument();
    Object.defineProperty(audio, "duration", {
      configurable: true,
      value: 95,
    });
    fireEvent.loadedMetadata(audio as HTMLAudioElement);
    expect(screen.getByText("00:00 / 01:35")).toBeInTheDocument();
    await fireEvent.click(screen.getByRole("button", { name: "播放" }));
    expect(screen.getByRole("button", { name: "暂停" })).toBeInTheDocument();
    expect(
      screen.getByText("非语音音频：引擎从怠速到加速的转速提升声音描述。"),
    ).toBeInTheDocument();
    expect(screen.getByText("编辑部原创录音")).toBeInTheDocument();
  });

  it("renders a safe development diagnostic for an audio block missing a transcript or description", () => {
    render(
      <>
        {renderContentBlocks(
          [
            {
              id: "story-bad-audio",
              type: "audio",
              media: {
                id: "media-engine-audio",
                alt: { zh: "Honda RA168E 怠速与加速音效" },
                src: "https://media.example.com/engine.mp3",
              },
            },
          ],
          { developmentDiagnostics: true },
        )}
      </>,
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      'Block "story-bad-audio" cannot be previewed: missing media, audio source, or a transcript/description.',
    );
  });

  it("renders a safe development diagnostic for a model3d block missing media, sources, or a description", () => {
    render(
      <>
        {renderContentBlocks(
          [
            {
              id: "story-bad-model3d",
              type: "model3d",
              media: {
                id: "media-ra168e-model",
                alt: { zh: "RA168E 引擎三维模型" },
                modelSrc: "",
                posterSrc: "",
              },
            },
          ],
          { developmentDiagnostics: true },
        )}
      </>,
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      'Block "story-bad-model3d" cannot be previewed: missing media, model/poster source, or a textual description.',
    );
  });

  describe("model3d block with WebGL available", () => {
    const originalGetContext = HTMLCanvasElement.prototype.getContext;

    beforeEach(() => {
      // @ts-expect-error -- jsdom lacks WebGL; stub a truthy context for the support check.
      window.WebGLRenderingContext = function WebGLRenderingContext() {};
      // @ts-expect-error -- test-only stub, arguments intentionally ignored.
      HTMLCanvasElement.prototype.getContext = () => ({});
    });

    afterEach(() => {
      // @ts-expect-error -- restore the unstubbed jsdom state.
      delete window.WebGLRenderingContext;
      HTMLCanvasElement.prototype.getContext = originalGetContext;
    });

    it("renders the poster with an explicit launch control before loading the viewer", () => {
      render(
        <>
          {renderContentBlocks([
            {
              id: "story-model3d",
              type: "model3d",
              heading: { zh: "引擎三维模型" },
              media: {
                id: "media-ra168e-model",
                alt: { zh: "RA168E 引擎三维模型" },
                modelSrc: "/demo/ra168e-model.glb",
                posterSrc: "/demo/ra168e-model-poster.jpg",
                credit: "编辑部原创模型",
              },
              description: {
                zh: "模型展示了发动机缸体与涡轮增压器的相对位置，无 WebGL 时显示静态预览图与本段说明。",
              },
              sourceIds: ["source-f1-technical"],
            },
          ])}
        </>,
      );

      expect(
        screen.getByRole("img", { name: "RA168E 引擎三维模型" }),
      ).toHaveAttribute("src", "/demo/ra168e-model-poster.jpg");
      expect(
        screen.getByRole("button", { name: "查看 3D 模型" }),
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          "模型展示了发动机缸体与涡轮增压器的相对位置，无 WebGL 时显示静态预览图与本段说明。",
        ),
      ).toBeInTheDocument();
      expect(screen.getByText("编辑部原创模型")).toBeInTheDocument();
      expect(screen.getByText("Sources:")).toBeInTheDocument();
    });

    it("warns before loading the model when the device prefers reduced data, and proceeds only after a second explicit tap", () => {
      const originalConnection = (
        navigator as Navigator & { connection?: unknown }
      ).connection;
      Object.defineProperty(navigator, "connection", {
        configurable: true,
        value: {
          saveData: true,
          addEventListener: () => {},
          removeEventListener: () => {},
        },
      });

      try {
        render(
          <>
            {renderContentBlocks([
              {
                id: "story-model3d-save-data",
                type: "model3d",
                media: {
                  id: "media-ra168e-model",
                  alt: { zh: "RA168E 引擎三维模型" },
                  modelSrc: "/demo/ra168e-model.glb",
                  posterSrc: "/demo/ra168e-model-poster.jpg",
                },
                description: {
                  zh: "模型展示了发动机缸体与涡轮增压器的相对位置。",
                },
              },
            ])}
          </>,
        );

        fireEvent.click(screen.getByRole("button", { name: "查看 3D 模型" }));

        expect(
          screen.getByText(
            "检测到您的设备已开启省流量模式，加载 3D 模型会产生额外流量。",
          ),
        ).toBeInTheDocument();
        expect(
          screen.queryByRole("button", { name: "查看 3D 模型" }),
        ).not.toBeInTheDocument();

        fireEvent.click(
          screen.getByRole("button", { name: "仍要加载 3D 模型" }),
        );

        expect(
          screen.queryByText(
            "检测到您的设备已开启省流量模式，加载 3D 模型会产生额外流量。",
          ),
        ).not.toBeInTheDocument();
      } finally {
        Object.defineProperty(navigator, "connection", {
          configurable: true,
          value: originalConnection,
        });
      }
    });
  });

  it("renders a static poster with a textual explanation when WebGL is unsupported", () => {
    render(
      <>
        {renderContentBlocks([
          {
            id: "story-model3d-no-webgl",
            type: "model3d",
            media: {
              id: "media-ra168e-model",
              alt: { zh: "RA168E 引擎三维模型" },
              modelSrc: "/demo/ra168e-model.glb",
              posterSrc: "/demo/ra168e-model-poster.jpg",
            },
            description: {
              zh: "模型展示了发动机缸体与涡轮增压器的相对位置。",
            },
          },
        ])}
      </>,
    );

    expect(
      screen.getByRole("img", { name: "RA168E 引擎三维模型" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "查看 3D 模型" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText("此设备不支持 3D 查看，已显示静态预览图。"),
    ).toBeInTheDocument();
  });

  describe("content-only image-to-3D upgrade", () => {
    const originalGetContext = HTMLCanvasElement.prototype.getContext;

    beforeEach(() => {
      // @ts-expect-error -- jsdom lacks WebGL; stub a truthy context for the support check.
      window.WebGLRenderingContext = function WebGLRenderingContext() {};
      // @ts-expect-error -- test-only stub, arguments intentionally ignored.
      HTMLCanvasElement.prototype.getContext = () => ({});
    });

    afterEach(() => {
      // @ts-expect-error -- restore the unstubbed jsdom state.
      delete window.WebGLRenderingContext;
      HTMLCanvasElement.prototype.getContext = originalGetContext;
    });

    it("upgrades a primary visual from image to model3d through a content-only change, with no renderer branching per entity", () => {
      const sharedBlockId = "technology-honda-ra168e-primary-visual";
      const sharedHeading = { zh: "RA168E 主视觉" };
      const sharedSourceIds = ["source-f1-technical"];

      const beforeImageBlock = {
        id: sharedBlockId,
        type: "image",
        heading: sharedHeading,
        media: sampleImageMedia,
        sourceIds: sharedSourceIds,
      };

      const afterModel3DBlock = {
        id: sharedBlockId,
        type: "model3d",
        heading: sharedHeading,
        media: {
          id: "media-ra168e-model",
          alt: { zh: "RA168E 引擎三维模型" },
          modelSrc: "/demo/ra168e-model.glb",
          posterSrc: "/demo/ra168e-model-poster.jpg",
        },
        description: { zh: "以三维模型呈现同一台发动机的构造。" },
        sourceIds: sharedSourceIds,
      };

      // Only the block's `type` and `media`/`description` fields differ
      // between the two entries below — the entity, its heading, its
      // sources, and the surrounding renderContentBlocks call are
      // unchanged, matching the "content and asset-manifest changes only"
      // contract for an image-to-3D upgrade.
      const { rerender } = render(
        <>{renderContentBlocks([beforeImageBlock])}</>,
      );

      expect(
        screen.getByRole("img", { name: "引擎剖面图" }),
      ).toBeInTheDocument();
      expect(
        document.querySelector(`[data-block-id="${sharedBlockId}"]`),
      ).toHaveAttribute("data-block-type", "image");

      rerender(<>{renderContentBlocks([afterModel3DBlock])}</>);

      expect(
        screen.queryByRole("img", { name: "引擎剖面图" }),
      ).not.toBeInTheDocument();
      expect(
        document.querySelector(`[data-block-id="${sharedBlockId}"]`),
      ).toHaveAttribute("data-block-type", "model3d");
      expect(
        screen.getByRole("img", { name: "RA168E 引擎三维模型" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "查看 3D 模型" }),
      ).toBeInTheDocument();
      expect(
        screen.getByText("以三维模型呈现同一台发动机的构造。"),
      ).toBeInTheDocument();
      expect(screen.getAllByText("Sources:")).toHaveLength(1);
    });
  });
});
