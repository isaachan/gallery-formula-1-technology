import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { renderContentBlocks } from "@/blocks/block-registry";
import { ContentFeedback } from "@/components/content-feedback";
import { getContentRepository } from "@/content/get-repository";
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
  introductory: "入门",
  advanced: "进阶",
};

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

  return (
    <div className="app-shell">
      <main className="season-detail">
        <Link href="/museum" className="season-detail-back tap-target">
          ← 返回博物馆
        </Link>

        <p className="eyebrow">TECHNOLOGY</p>
        <h1 className="season-detail-title">{entity.title}</h1>
        <p className="section-text">{entity.summary}</p>

        <section aria-labelledby="technology-overview">
          <div className="section-head">
            <h2 className="section-title" id="technology-overview">
              概览
            </h2>
          </div>
          <div className="season-detail-meta-grid">
            <article className="season-detail-meta-card">
              <p className="season-detail-meta-label">类别</p>
              <p className="season-detail-meta-value">
                {CATEGORY_LABELS[technology.category] ?? technology.category}
              </p>
            </article>
            <article className="season-detail-meta-card">
              <p className="season-detail-meta-label">难度</p>
              <p className="season-detail-meta-value">
                {DIFFICULTY_LABELS[technology.difficulty] ??
                  technology.difficulty}
              </p>
            </article>
            <article className="season-detail-meta-card">
              <p className="season-detail-meta-label">资料来源</p>
              <ul className="season-detail-source-list">
                {entity.sources.map((source) => (
                  <li key={source.id}>{source.title}</li>
                ))}
              </ul>
            </article>
          </div>
        </section>

        {technology.relatedCars.length > 0 ? (
          <section aria-labelledby="technology-cars">
            <h2 className="section-title" id="technology-cars">
              相关车辆
            </h2>
            <div className="season-detail-chip-row">
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

        {technology.relatedSeasons.length > 0 ? (
          <section aria-labelledby="technology-seasons">
            <h2 className="section-title" id="technology-seasons">
              相关赛季
            </h2>
            <div className="season-detail-chip-row">
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

        {technology.relatedTechnologies.length > 0 ? (
          <section aria-labelledby="technology-related">
            <h2 className="section-title" id="technology-related">
              相关技术
            </h2>
            <div className="season-detail-chip-row">
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

        {technology.representativeSeason?.href ? (
          <Link
            href={technology.representativeSeason.href}
            className="entity-timeline-cta tap-target"
          >
            在时间轴上查看 {technology.representativeSeason.title} ▸
          </Link>
        ) : null}

        <div className="block-preview-stack">
          {renderContentBlocks(
            entity.blocks as Parameters<typeof renderContentBlocks>[0],
          )}
        </div>

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
