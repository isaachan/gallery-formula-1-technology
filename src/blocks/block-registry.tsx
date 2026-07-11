import { isSupportedBlockType, supportedBlockTypes } from "./block-types.mjs";
import {
  getLocalizedText,
  hasLocalizedText,
  type LocaleText,
} from "./locale-text";
import { ImageWithFallback, type MediaLike } from "./media/image-with-fallback";
import {
  AnimationWithControls,
  type AnimationMedia,
} from "./media/animation-with-controls";
import {
  VideoWithControls,
  type VideoMedia,
} from "./media/video-with-controls";
import {
  AudioWithControls,
  type AudioMedia,
} from "./media/audio-with-controls";
import { Model3DViewer, type Model3DMedia } from "./media/model3d-viewer";

type PreviewBlock = {
  id: string;
  type: string;
  heading?: LocaleText;
  sourceIds?: string[];
};

type BlockRendererProps<TBlock extends PreviewBlock = PreviewBlock> = {
  block: TBlock;
  locale?: keyof LocaleText;
  developmentDiagnostics?: boolean;
};

type KnownBlockType = (typeof supportedBlockTypes)[number];

type RichTextBlock = PreviewBlock & {
  type: "richText";
  content?: LocaleText;
};

type QuoteBlock = PreviewBlock & {
  type: "quote";
  quote?: LocaleText;
  attribution?: LocaleText;
};

type FactGridBlock = PreviewBlock & {
  type: "factGrid";
  items?: Array<{
    label?: LocaleText;
    value?: LocaleText;
    accent?: "default" | "highlight";
  }>;
};

type ImageBlock = PreviewBlock & {
  type: "image";
  layout?: "full" | "inset" | "portrait";
  media?: MediaLike;
};

type GalleryBlock = PreviewBlock & {
  type: "gallery";
  items?: Array<{ media?: MediaLike }>;
};

type DiagramBlock = PreviewBlock & {
  type: "diagram";
  layout?: "full" | "inset" | "portrait";
  media?: MediaLike;
  explanation?: LocaleText;
};

type AnimationBlock = PreviewBlock & {
  type: "animation";
  media?: AnimationMedia;
  explanation?: LocaleText;
};

type VideoBlock = PreviewBlock & {
  type: "video";
  media?: VideoMedia;
  transcript?: LocaleText;
};

type AudioBlock = PreviewBlock & {
  type: "audio";
  media?: AudioMedia;
  transcript?: LocaleText;
};

type Model3DBlock = PreviewBlock & {
  type: "model3d";
  media?: Model3DMedia;
  description?: LocaleText;
  initialCamera?: "front" | "three-quarter" | "exploded";
  interaction?: "orbit" | "turntable";
};

type RelatedEntityType =
  | "season"
  | "race"
  | "circuit"
  | "car"
  | "team"
  | "person"
  | "technology"
  | "era";

type RelatedEntitySummary = {
  id: string;
  entityType: RelatedEntityType;
  title: LocaleText;
  subtitle?: LocaleText;
  href: string;
};

type RelatedEntitiesBlock = PreviewBlock & {
  type: "relatedEntities";
  items?: Array<{ entityId: string; entity?: RelatedEntitySummary }>;
};

type RenderableBlock =
  | PreviewBlock
  | RichTextBlock
  | QuoteBlock
  | FactGridBlock
  | ImageBlock
  | GalleryBlock
  | DiagramBlock
  | AnimationBlock
  | VideoBlock
  | AudioBlock
  | Model3DBlock
  | RelatedEntitiesBlock;
type BlockRenderer = (
  props: BlockRendererProps<RenderableBlock>,
) => React.JSX.Element;

function renderSourceReferences(sourceIds: string[] | undefined) {
  if (!sourceIds || sourceIds.length === 0) {
    return null;
  }

  return (
    <p className="block-source-list">
      Sources:{" "}
      {sourceIds.map((sourceId, index) => (
        <span key={sourceId}>
          {index > 0 ? ", " : ""}
          {sourceId}
        </span>
      ))}
    </p>
  );
}

function renderBlockHeading(
  block: PreviewBlock,
  locale: keyof LocaleText,
  label: string,
) {
  const heading = getLocalizedText(block.heading, locale);

  return (
    <div className="block-preview-meta">
      <span className="block-preview-type">{label}</span>
      <span className="block-preview-id">{block.id}</span>
      {heading ? <h3 className="block-heading">{heading}</h3> : null}
    </div>
  );
}

function MalformedBlockPreview({
  block,
  developmentDiagnostics,
  reason,
}: {
  block: PreviewBlock;
  developmentDiagnostics: boolean;
  reason: string;
}) {
  return (
    <article
      className="block-preview block-preview-warning"
      data-block-id={block.id}
      data-block-type={block.type}
      role="alert"
    >
      <div className="block-preview-meta">
        <span className="block-preview-type">Malformed block</span>
        <span className="block-preview-id">{block.id}</span>
      </div>
      <p className="block-preview-copy">
        {developmentDiagnostics
          ? `Block "${block.id}" cannot be previewed: ${reason}.`
          : "A content block could not be previewed safely."}
      </p>
    </article>
  );
}

function RichTextBlockView({
  block,
  locale = "zh",
  developmentDiagnostics = process.env.NODE_ENV !== "production",
}: BlockRendererProps<RichTextBlock>) {
  if (!hasLocalizedText(block.content)) {
    return (
      <MalformedBlockPreview
        block={block}
        developmentDiagnostics={developmentDiagnostics}
        reason="missing localized rich-text content"
      />
    );
  }

  const content = getLocalizedText(block.content, locale) ?? "";
  const paragraphs = content
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  return (
    <article
      className="content-block content-block-prose"
      data-block-id={block.id}
      data-block-type={block.type}
    >
      {renderBlockHeading(block, locale, "Rich text block")}
      <div className="prose-flow">
        {paragraphs.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>
      {renderSourceReferences(block.sourceIds)}
    </article>
  );
}

function QuoteBlockView({
  block,
  locale = "zh",
  developmentDiagnostics = process.env.NODE_ENV !== "production",
}: BlockRendererProps<QuoteBlock>) {
  if (!hasLocalizedText(block.quote)) {
    return (
      <MalformedBlockPreview
        block={block}
        developmentDiagnostics={developmentDiagnostics}
        reason="missing localized quote content"
      />
    );
  }

  return (
    <figure
      className="content-block content-block-quote"
      data-block-id={block.id}
      data-block-type={block.type}
    >
      {renderBlockHeading(block, locale, "Quote block")}
      <blockquote className="quote-body">
        <p>{getLocalizedText(block.quote, locale)}</p>
      </blockquote>
      {block.attribution ? (
        <figcaption className="quote-attribution">
          {getLocalizedText(block.attribution, locale)}
        </figcaption>
      ) : null}
      {renderSourceReferences(block.sourceIds)}
    </figure>
  );
}

function FactGridBlockView({
  block,
  locale = "zh",
  developmentDiagnostics = process.env.NODE_ENV !== "production",
}: BlockRendererProps<FactGridBlock>) {
  if (!Array.isArray(block.items) || block.items.length === 0) {
    return (
      <MalformedBlockPreview
        block={block}
        developmentDiagnostics={developmentDiagnostics}
        reason="missing fact-grid items"
      />
    );
  }

  const hasInvalidItem = block.items.some(
    (item) => !hasLocalizedText(item.label) || !hasLocalizedText(item.value),
  );
  if (hasInvalidItem) {
    return (
      <MalformedBlockPreview
        block={block}
        developmentDiagnostics={developmentDiagnostics}
        reason="fact-grid items must provide localized label and value"
      />
    );
  }

  return (
    <section
      className="content-block content-block-facts"
      data-block-id={block.id}
      data-block-type={block.type}
    >
      {renderBlockHeading(block, locale, "Fact grid block")}
      <dl className="fact-grid">
        {block.items.map((item, index) => (
          <div
            key={`${block.id}-${index}`}
            className="fact-grid-item"
            data-accent={item.accent ?? "default"}
          >
            <dt>{getLocalizedText(item.label, locale)}</dt>
            <dd>{getLocalizedText(item.value, locale)}</dd>
          </div>
        ))}
      </dl>
      {renderSourceReferences(block.sourceIds)}
    </section>
  );
}

function ImageBlockView({
  block,
  locale = "zh",
  developmentDiagnostics = process.env.NODE_ENV !== "production",
}: BlockRendererProps<ImageBlock>) {
  if (!block.media || !hasLocalizedText(block.media.alt)) {
    return (
      <MalformedBlockPreview
        block={block}
        developmentDiagnostics={developmentDiagnostics}
        reason="missing media reference or alternative text"
      />
    );
  }

  return (
    <article
      className="content-block content-block-image"
      data-block-id={block.id}
      data-block-type={block.type}
      data-layout={block.layout ?? "full"}
    >
      {renderBlockHeading(block, locale, "Image block")}
      <ImageWithFallback media={block.media} locale={locale} />
      {renderSourceReferences(block.sourceIds)}
    </article>
  );
}

function DiagramBlockView({
  block,
  locale = "zh",
  developmentDiagnostics = process.env.NODE_ENV !== "production",
}: BlockRendererProps<DiagramBlock>) {
  if (
    !block.media ||
    !hasLocalizedText(block.media.alt) ||
    !hasLocalizedText(block.explanation)
  ) {
    return (
      <MalformedBlockPreview
        block={block}
        developmentDiagnostics={developmentDiagnostics}
        reason="missing media reference, alternative text, or a textual explanation"
      />
    );
  }

  return (
    <article
      className="content-block content-block-diagram"
      data-block-id={block.id}
      data-block-type={block.type}
      data-layout={block.layout ?? "full"}
    >
      {renderBlockHeading(block, locale, "Diagram block")}
      <ImageWithFallback media={block.media} locale={locale} />
      <p className="diagram-explanation">
        {getLocalizedText(block.explanation, locale)}
      </p>
      {renderSourceReferences(block.sourceIds)}
    </article>
  );
}

function AnimationBlockView({
  block,
  locale = "zh",
  developmentDiagnostics = process.env.NODE_ENV !== "production",
}: BlockRendererProps<AnimationBlock>) {
  if (
    !block.media ||
    !hasLocalizedText(block.media.alt) ||
    !block.media.videoSrc ||
    !block.media.posterSrc ||
    !hasLocalizedText(block.explanation)
  ) {
    return (
      <MalformedBlockPreview
        block={block}
        developmentDiagnostics={developmentDiagnostics}
        reason="missing media, poster/video source, or a textual explanation"
      />
    );
  }

  return (
    <article
      className="content-block content-block-animation"
      data-block-id={block.id}
      data-block-type={block.type}
    >
      {renderBlockHeading(block, locale, "Animation block")}
      <AnimationWithControls media={block.media} locale={locale} />
      <p className="animation-explanation">
        {getLocalizedText(block.explanation, locale)}
      </p>
      {renderSourceReferences(block.sourceIds)}
    </article>
  );
}

function VideoBlockView({
  block,
  locale = "zh",
  developmentDiagnostics = process.env.NODE_ENV !== "production",
}: BlockRendererProps<VideoBlock>) {
  if (
    !block.media ||
    !hasLocalizedText(block.media.alt) ||
    !block.media.videoSrc ||
    !block.media.posterSrc ||
    !hasLocalizedText(block.transcript)
  ) {
    return (
      <MalformedBlockPreview
        block={block}
        developmentDiagnostics={developmentDiagnostics}
        reason="missing media, poster/video source, or a transcript"
      />
    );
  }

  return (
    <article
      className="content-block content-block-video"
      data-block-id={block.id}
      data-block-type={block.type}
    >
      {renderBlockHeading(block, locale, "Video block")}
      <VideoWithControls media={block.media} locale={locale} />
      <p className="media-transcript">
        {getLocalizedText(block.transcript, locale)}
      </p>
      {renderSourceReferences(block.sourceIds)}
    </article>
  );
}

function AudioBlockView({
  block,
  locale = "zh",
  developmentDiagnostics = process.env.NODE_ENV !== "production",
}: BlockRendererProps<AudioBlock>) {
  if (
    !block.media ||
    !hasLocalizedText(block.media.alt) ||
    !block.media.src ||
    !hasLocalizedText(block.transcript)
  ) {
    return (
      <MalformedBlockPreview
        block={block}
        developmentDiagnostics={developmentDiagnostics}
        reason="missing media, audio source, or a transcript/description"
      />
    );
  }

  return (
    <article
      className="content-block content-block-audio"
      data-block-id={block.id}
      data-block-type={block.type}
    >
      {renderBlockHeading(block, locale, "Audio block")}
      <AudioWithControls media={block.media} locale={locale} />
      <p className="media-transcript">
        {getLocalizedText(block.transcript, locale)}
      </p>
      {renderSourceReferences(block.sourceIds)}
    </article>
  );
}

function Model3DBlockView({
  block,
  locale = "zh",
  developmentDiagnostics = process.env.NODE_ENV !== "production",
}: BlockRendererProps<Model3DBlock>) {
  if (
    !block.media ||
    !hasLocalizedText(block.media.alt) ||
    !block.media.modelSrc ||
    !block.media.posterSrc ||
    !hasLocalizedText(block.description)
  ) {
    return (
      <MalformedBlockPreview
        block={block}
        developmentDiagnostics={developmentDiagnostics}
        reason="missing media, model/poster source, or a textual description"
      />
    );
  }

  return (
    <article
      className="content-block content-block-model3d"
      data-block-id={block.id}
      data-block-type={block.type}
    >
      {renderBlockHeading(block, locale, "3D model block")}
      <Model3DViewer
        media={block.media}
        locale={locale}
        initialCamera={block.initialCamera}
        interaction={block.interaction}
      />
      <p className="media-transcript">
        {getLocalizedText(block.description, locale)}
      </p>
      {renderSourceReferences(block.sourceIds)}
    </article>
  );
}

function GalleryItemFallback({
  index,
  developmentDiagnostics,
}: {
  index: number;
  developmentDiagnostics: boolean;
}) {
  return (
    <li className="gallery-item gallery-item-error" data-gallery-index={index}>
      <p className="media-fallback-copy">
        {developmentDiagnostics
          ? `Gallery item ${index} cannot be previewed: missing media reference or alternative text.`
          : "This item could not be shown safely."}
      </p>
    </li>
  );
}

function GalleryBlockView({
  block,
  locale = "zh",
  developmentDiagnostics = process.env.NODE_ENV !== "production",
}: BlockRendererProps<GalleryBlock>) {
  if (!Array.isArray(block.items) || block.items.length === 0) {
    return (
      <MalformedBlockPreview
        block={block}
        developmentDiagnostics={developmentDiagnostics}
        reason="missing gallery items"
      />
    );
  }

  return (
    <section
      className="content-block content-block-gallery"
      data-block-id={block.id}
      data-block-type={block.type}
    >
      {renderBlockHeading(block, locale, "Gallery block")}
      <ul className="gallery-grid">
        {block.items.map((item, index) => {
          if (!item.media || !hasLocalizedText(item.media.alt)) {
            return (
              <GalleryItemFallback
                key={`${block.id}-${index}`}
                index={index}
                developmentDiagnostics={developmentDiagnostics}
              />
            );
          }

          return (
            <li key={item.media.id} className="gallery-item">
              <ImageWithFallback media={item.media} locale={locale} />
            </li>
          );
        })}
      </ul>
      {renderSourceReferences(block.sourceIds)}
    </section>
  );
}

const RELATED_ENTITY_TYPE_LABELS: Record<RelatedEntityType, string> = {
  season: "Season",
  race: "Race",
  circuit: "Circuit",
  car: "Car",
  team: "Team",
  person: "Person",
  technology: "Technology",
  era: "Era",
};

function RelatedEntityItemFallback({
  entityId,
  developmentDiagnostics,
}: {
  entityId: string;
  developmentDiagnostics: boolean;
}) {
  return (
    <li
      className="related-entity-item related-entity-item-error"
      data-entity-id={entityId}
    >
      <p className="media-fallback-copy">
        {developmentDiagnostics
          ? `Related entity "${entityId}" could not be resolved and was skipped.`
          : "This related item is currently unavailable."}
      </p>
    </li>
  );
}

function RelatedEntitiesBlockView({
  block,
  locale = "zh",
  developmentDiagnostics = process.env.NODE_ENV !== "production",
}: BlockRendererProps<RelatedEntitiesBlock>) {
  if (!Array.isArray(block.items) || block.items.length === 0) {
    return (
      <MalformedBlockPreview
        block={block}
        developmentDiagnostics={developmentDiagnostics}
        reason="missing related entities"
      />
    );
  }

  return (
    <nav
      className="content-block content-block-related"
      data-block-id={block.id}
      data-block-type={block.type}
      aria-label={getLocalizedText(block.heading, locale) ?? "Related entities"}
    >
      {renderBlockHeading(block, locale, "Related entities block")}
      <ul className="related-entity-grid">
        {block.items.map((item) => {
          if (!item.entity) {
            return (
              <RelatedEntityItemFallback
                key={item.entityId}
                entityId={item.entityId}
                developmentDiagnostics={developmentDiagnostics}
              />
            );
          }

          const { entity } = item;
          const title = getLocalizedText(entity.title, locale);
          const subtitle = getLocalizedText(entity.subtitle, locale);

          return (
            <li key={entity.id} className="related-entity-item">
              <a className="related-entity-link" href={entity.href}>
                <span className="related-entity-type">
                  {RELATED_ENTITY_TYPE_LABELS[entity.entityType]}
                </span>
                <span className="related-entity-title">{title}</span>
                {subtitle ? (
                  <span className="related-entity-subtitle">{subtitle}</span>
                ) : null}
              </a>
            </li>
          );
        })}
      </ul>
      {renderSourceReferences(block.sourceIds)}
    </nav>
  );
}

const blockRenderers: Record<KnownBlockType, BlockRenderer> = {
  richText: (props) => (
    <RichTextBlockView {...(props as BlockRendererProps<RichTextBlock>)} />
  ),
  image: (props) => (
    <ImageBlockView {...(props as BlockRendererProps<ImageBlock>)} />
  ),
  gallery: (props) => (
    <GalleryBlockView {...(props as BlockRendererProps<GalleryBlock>)} />
  ),
  diagram: (props) => (
    <DiagramBlockView {...(props as BlockRendererProps<DiagramBlock>)} />
  ),
  animation: (props) => (
    <AnimationBlockView {...(props as BlockRendererProps<AnimationBlock>)} />
  ),
  audio: (props) => (
    <AudioBlockView {...(props as BlockRendererProps<AudioBlock>)} />
  ),
  video: (props) => (
    <VideoBlockView {...(props as BlockRendererProps<VideoBlock>)} />
  ),
  model3d: (props) => (
    <Model3DBlockView {...(props as BlockRendererProps<Model3DBlock>)} />
  ),
  factGrid: (props) => (
    <FactGridBlockView {...(props as BlockRendererProps<FactGridBlock>)} />
  ),
  quote: (props) => (
    <QuoteBlockView {...(props as BlockRendererProps<QuoteBlock>)} />
  ),
  relatedEntities: (props) => (
    <RelatedEntitiesBlockView
      {...(props as BlockRendererProps<RelatedEntitiesBlock>)}
    />
  ),
};

function UnknownBlockPreview({
  block,
  developmentDiagnostics,
}: {
  block: PreviewBlock;
  developmentDiagnostics: boolean;
}) {
  return (
    <article
      className="block-preview block-preview-warning"
      data-block-id={block.id}
      data-block-type={block.type}
      role="alert"
    >
      <div className="block-preview-meta">
        <span className="block-preview-type">Unsupported block</span>
        <span className="block-preview-id">{block.id}</span>
      </div>
      <p className="block-preview-copy">
        {developmentDiagnostics
          ? `Unknown block type "${block.type}" was blocked from publication.`
          : "A content block could not be previewed safely."}
      </p>
    </article>
  );
}

export function getRegisteredBlockTypes() {
  return [...supportedBlockTypes];
}

export function renderContentBlocks(
  blocks: RenderableBlock[],
  options: {
    locale?: keyof LocaleText;
    developmentDiagnostics?: boolean;
  } = {},
) {
  const {
    locale = "zh",
    developmentDiagnostics = process.env.NODE_ENV !== "production",
  } = options;

  return blocks.map((block) => {
    if (!isSupportedBlockType(block.type)) {
      return (
        <UnknownBlockPreview
          key={block.id}
          block={block}
          developmentDiagnostics={developmentDiagnostics}
        />
      );
    }

    const Renderer = blockRenderers[block.type];
    return (
      <Renderer
        key={block.id}
        block={block}
        locale={locale}
        developmentDiagnostics={developmentDiagnostics}
      />
    );
  });
}
