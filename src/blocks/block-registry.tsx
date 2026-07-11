import { isSupportedBlockType, supportedBlockTypes } from "./block-types.mjs";

type LocaleText = {
  zh: string;
  en?: string;
};

type PreviewBlock = {
  id: string;
  type: string;
  heading?: LocaleText;
};

type BlockRendererProps<TBlock extends PreviewBlock = PreviewBlock> = {
  block: TBlock;
  locale?: keyof LocaleText;
};

type KnownBlockType = (typeof supportedBlockTypes)[number];
type BlockRenderer = (props: BlockRendererProps) => React.JSX.Element;

function getLocalizedText(
  value: LocaleText | undefined,
  locale: keyof LocaleText,
) {
  if (!value) {
    return null;
  }

  return value[locale] ?? value.zh;
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
  richText: (props) => <PlaceholderBlock {...props} label="Rich text block" />,
  image: (props) => <PlaceholderBlock {...props} label="Image block" />,
  gallery: (props) => <PlaceholderBlock {...props} label="Gallery block" />,
  diagram: (props) => <PlaceholderBlock {...props} label="Diagram block" />,
  animation: (props) => <PlaceholderBlock {...props} label="Animation block" />,
  audio: (props) => <PlaceholderBlock {...props} label="Audio block" />,
  video: (props) => <PlaceholderBlock {...props} label="Video block" />,
  model3d: (props) => <PlaceholderBlock {...props} label="3D model block" />,
  factGrid: (props) => <PlaceholderBlock {...props} label="Fact grid block" />,
  quote: (props) => <PlaceholderBlock {...props} label="Quote block" />,
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
  blocks: PreviewBlock[],
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
    return <Renderer key={block.id} block={block} locale={locale} />;
  });
}
