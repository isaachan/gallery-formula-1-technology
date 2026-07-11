import { isSupportedBlockType, supportedBlockTypes } from "./block-types.mjs";

type LocaleText = {
  zh: string;
  en?: string;
};

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

type RenderableBlock =
  | PreviewBlock
  | RichTextBlock
  | QuoteBlock
  | FactGridBlock;
type BlockRenderer = (
  props: BlockRendererProps<RenderableBlock>,
) => React.JSX.Element;

function getLocalizedText(
  value: LocaleText | undefined,
  locale: keyof LocaleText,
) {
  if (!value) {
    return null;
  }

  return value[locale] ?? value.zh;
}

function hasLocalizedText(value: LocaleText | undefined) {
  return Boolean(value?.zh?.trim());
}

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

function PlaceholderBlock({
  block,
  locale = "zh",
  label,
}: BlockRendererProps & { label: string }) {
  const heading = getLocalizedText(block.heading, locale);

  return (
    <article
      className="block-preview"
      data-block-id={block.id}
      data-block-type={block.type}
    >
      <div className="block-preview-meta">
        <span className="block-preview-type">{label}</span>
        <span className="block-preview-id">{block.id}</span>
      </div>
      <p className="block-preview-copy">
        {heading ?? "该区块已注册，可通过内容顺序稳定编排。"}
      </p>
    </article>
  );
}

const blockRenderers: Record<KnownBlockType, BlockRenderer> = {
  richText: (props) => (
    <RichTextBlockView {...(props as BlockRendererProps<RichTextBlock>)} />
  ),
  image: (props) => <PlaceholderBlock {...props} label="Image block" />,
  gallery: (props) => <PlaceholderBlock {...props} label="Gallery block" />,
  diagram: (props) => <PlaceholderBlock {...props} label="Diagram block" />,
  animation: (props) => <PlaceholderBlock {...props} label="Animation block" />,
  audio: (props) => <PlaceholderBlock {...props} label="Audio block" />,
  video: (props) => <PlaceholderBlock {...props} label="Video block" />,
  model3d: (props) => <PlaceholderBlock {...props} label="3D model block" />,
  factGrid: (props) => (
    <FactGridBlockView {...(props as BlockRendererProps<FactGridBlock>)} />
  ),
  quote: (props) => (
    <QuoteBlockView {...(props as BlockRendererProps<QuoteBlock>)} />
  ),
  relatedEntities: (props) => (
    <PlaceholderBlock {...props} label="Related entities block" />
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
