import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { LocaleText } from "@/blocks/locale-text";
import {
  AnimationWithControls,
  type AnimationMedia,
} from "@/blocks/media/animation-with-controls";
import {
  ImageWithFallback,
  type MediaLike,
} from "@/blocks/media/image-with-fallback";
import {
  Model3DViewer,
  type Model3DMedia,
} from "@/blocks/media/model3d-viewer";
import { ContentFeedback } from "@/components/content-feedback";
import { NarrationButton } from "@/components/narration-button";
import { getContentRepository } from "@/content/get-repository";
import type { TechnologyFormat } from "@/content/content-repository";
import { buildContentFeedbackMailto } from "@/lib/content-feedback";
import { getBuildDiagnostics } from "@/lib/diagnostics";

const CATEGORY_LABELS: Record<string, string> = {
  engine: "动力单元",
  aerodynamics: "空气动力学",
  chassis: "底盘",
  safety: "安全",
  electronics: "电子系统",
  tyres: "轮胎",
  other: "其他",
};

const DIFFICULTY_LABELS: Record<string, string> = {
  introductory: "科普",
  advanced: "进阶",
};

const TECH_FORMAT_BADGE: Record<TechnologyFormat, string> = {
  animation: "▶ 动画",
  diagram: "🔍 图解",
  model3d: "🧊 3D",
  article: "📖 图文",
};

type RawBlock = {
  id?: string;
  type?: string;
  media?: unknown;
  explanation?: LocaleText;
  description?: LocaleText;
};

function findBlock(blocks: unknown[], type: string): RawBlock | undefined {
  return (blocks as RawBlock[]).find((block) => block?.type === type);
}

async function loadTechnology(slug: string) {
  const repository = await getContentRepository();
  const entity = await repository.getEntityBySlug("technology", slug);
  return entity && entity.technology ? entity : null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const entity = await loadTechnology(slug);

  if (!entity) {
    return { title: "Technology Not Found | F1 Track Chronicle" };
  }

  return {
    title: `${entity.title} | F1 Track Chronicle`,
    description: entity.summary,
  };
}

export default async function TechnologyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const entity = await loadTechnology(slug);

  if (!entity) {
    notFound();
  }

  const technology = entity.technology!;
  const diagnostics = await getBuildDiagnostics();
  const feedbackRecipient =
    process.env.NEXT_PUBLIC_FEEDBACK_EMAIL ?? "editor@example.com";
  const feedbackContext = {
    title: entity.title,
    canonicalPath: `/technologies/${entity.slug}`,
    entityType: "technology" as const,
    entityId: entity.id,
    appVersion: diagnostics.appVersion,
    contentVersion: diagnostics.contentVersion,
  };

  const categoryLabel =
    CATEGORY_LABELS[technology.category] ?? technology.category;
  const difficultyLabel =
    DIFFICULTY_LABELS[technology.difficulty] ?? technology.difficulty;
  const representativeSeason = technology.representativeSeason;
  const blocks = entity.blocks as unknown[];

  const animationBlock =
    technology.format === "animation"
      ? findBlock(blocks, "animation")
      : undefined;
  const diagramBlock =
    technology.format === "diagram" ? findBlock(blocks, "diagram") : undefined;
  const model3dBlock =
    technology.format === "model3d" ? findBlock(blocks, "model3d") : undefined;

  return (
    <div className="app-shell">
      <main className="season-detail">
        <header className="season-hero-header">
          <Link
            href={representativeSeason?.href ?? "/museum"}
            className="season-hero-back tap-target"
            aria-label="返回"
          >
            ←
          </Link>
          <div className="season-hero-titleblock">
            <h1 className="car-hero-title">{entity.title}</h1>
            <p className="car-hero-meta-line">
              {[representativeSeason?.title, categoryLabel]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>
          <span className="tech-level-chip" data-level={technology.difficulty}>
            {difficultyLabel}
          </span>
          <span className="tech-format-badge">
            {TECH_FORMAT_BADGE[technology.format]}
          </span>
        </header>

        {animationBlock?.media ? (
          <div className="tech-hero-stage" data-tone="dark">
            <span className="tech-hero-stage-badge" data-tone="dark">
              ▶ 动画演示 · {entity.title}
            </span>
            <div className="tech-hero-media">
              <AnimationWithControls
                media={animationBlock.media as AnimationMedia}
              />
            </div>
          </div>
        ) : diagramBlock?.media ? (
          <div className="tech-hero-stage" data-tone="sky">
            <span className="tech-hero-stage-badge" data-tone="sky">
              🔍 图解 · {entity.title}
            </span>
            <div className="tech-hero-media">
              <ImageWithFallback media={diagramBlock.media as MediaLike} />
            </div>
          </div>
        ) : model3dBlock?.media ? (
          <div className="tech-hero-stage" data-tone="dark">
            <span className="tech-hero-stage-badge" data-tone="dark">
              🧊 3D 分解模型 · 拖动旋转
            </span>
            <div className="tech-hero-media">
              <Model3DViewer media={model3dBlock.media as Model3DMedia} />
            </div>
          </div>
        ) : (
          <div className="tech-photo-slot">拖入历史照片</div>
        )}

        <div className="person-story-card">
          <div className="person-story-heading">
            <div className="person-story-title">
              讲解 <span>EXPLAINER</span>
            </div>
            <NarrationButton
              text={entity.summary}
              className="person-narration-btn"
            />
          </div>
          <p className="person-story-body">{entity.summary}</p>
        </div>

        {representativeSeason?.href ? (
          <div className="person-locate-card">
            <div>
              <p className="person-locate-title">该技术在时间轴上的位置</p>
              <p className="person-locate-sub">点击定位回赛道上的那个弯</p>
            </div>
            <Link
              href={representativeSeason.href}
              className="person-locate-btn tap-target"
            >
              {representativeSeason.title.replace(/\s*赛季$/, "")} ↩
            </Link>
          </div>
        ) : null}

        {technology.relatedSeasons.length > 0 ? (
          <section aria-labelledby="technology-seasons">
            <h2 className="season-section-heading" id="technology-seasons">
              相关赛季 <span>SEASONS</span>
            </h2>
            <div
              className="season-detail-chip-row"
              style={{ margin: "0 18px" }}
            >
              {technology.relatedSeasons.map((season) =>
                season.href ? (
                  <Link
                    key={season.id}
                    href={season.href}
                    className="season-detail-chip tap-target"
                  >
                    {season.title}
                  </Link>
                ) : (
                  <span key={season.id} className="season-detail-chip">
                    {season.title}
                  </span>
                ),
              )}
            </div>
          </section>
        ) : null}

        {technology.relatedCars.length > 0 ? (
          <section aria-labelledby="technology-cars">
            <h2 className="season-section-heading" id="technology-cars">
              相关车辆 <span>CARS</span>
            </h2>
            <div
              className="season-detail-chip-row"
              style={{ margin: "0 18px" }}
            >
              {technology.relatedCars.map((car) =>
                car.href ? (
                  <Link
                    key={car.id}
                    href={car.href}
                    className="season-detail-chip tap-target"
                  >
                    {car.title}
                  </Link>
                ) : (
                  <span key={car.id} className="season-detail-chip">
                    {car.title}
                  </span>
                ),
              )}
            </div>
          </section>
        ) : null}

        {technology.relatedTechnologies.length > 0 ? (
          <section aria-labelledby="technology-related">
            <h2 className="season-section-heading" id="technology-related">
              相关技术 <span>RELATED</span>
            </h2>
            <div
              className="season-detail-chip-row"
              style={{ margin: "0 18px" }}
            >
              {technology.relatedTechnologies.map((related) =>
                related.href ? (
                  <Link
                    key={related.id}
                    href={related.href}
                    className="season-detail-chip tap-target"
                  >
                    {related.title}
                  </Link>
                ) : (
                  <span key={related.id} className="season-detail-chip">
                    {related.title}
                  </span>
                ),
              )}
            </div>
          </section>
        ) : null}

        {entity.sources.length > 0 ? (
          <p className="season-sources-footer">
            资料来源：
            {entity.sources.map((source, index) => (
              <span key={source.id}>
                {index > 0 ? "、" : ""}
                {source.title}
              </span>
            ))}
          </p>
        ) : null}

        <ContentFeedback
          recipient={feedbackRecipient}
          mailtoHref={buildContentFeedbackMailto(
            feedbackRecipient,
            feedbackContext,
          )}
          context={feedbackContext}
        />
      </main>
    </div>
  );
}
