import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { renderContentBlocks } from "@/blocks/block-registry";
import { ContentFeedback } from "@/components/content-feedback";
import { getContentRepository } from "@/content/get-repository";
import { buildContentFeedbackMailto } from "@/lib/content-feedback";
import { getBuildDiagnostics } from "@/lib/diagnostics";

async function loadCar(slug: string) {
  const repository = await getContentRepository();
  const entity = await repository.getEntityBySlug("car", slug);
  return entity && entity.car ? entity : null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const entity = await loadCar(slug);

  if (!entity) {
    return { title: "Car Not Found | F1 Track Chronicle" };
  }

  return {
    title: `${entity.title} | F1 Track Chronicle`,
    description: entity.summary,
  };
}

export default async function CarPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const entity = await loadCar(slug);

  if (!entity) {
    notFound();
  }

  const car = entity.car!;
  const specEntries = Object.entries(car.specifications);
  const diagnostics = await getBuildDiagnostics();
  const feedbackRecipient =
    process.env.NEXT_PUBLIC_FEEDBACK_EMAIL ?? "editor@example.com";
  const feedbackContext = {
    title: entity.title,
    canonicalPath: `/cars/${entity.slug}`,
    entityType: "car" as const,
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

        <p className="eyebrow">CAR</p>
        <h1 className="season-detail-title">{entity.title}</h1>
        <p className="section-text">{entity.summary}</p>

        <section aria-labelledby="car-overview">
          <div className="section-head">
            <h2 className="section-title" id="car-overview">
              规格概览
            </h2>
          </div>
          <div className="season-detail-meta-grid">
            <article className="season-detail-meta-card">
              <p className="season-detail-meta-label">动力单元</p>
              <p className="season-detail-meta-value">{car.engine}</p>
            </article>
            {car.wins !== undefined ? (
              <article className="season-detail-meta-card">
                <p className="season-detail-meta-label">获胜场次</p>
                <p className="season-detail-meta-value">{car.wins}</p>
              </article>
            ) : null}
            <article className="season-detail-meta-card">
              <p className="season-detail-meta-label">车队</p>
              <p className="season-detail-meta-value">
                {car.constructor?.href ? (
                  <Link href={car.constructor.href}>
                    {car.constructor.title}
                  </Link>
                ) : (
                  (car.constructor?.title ?? "待补充")
                )}
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

        {specEntries.length > 0 ? (
          <section aria-labelledby="car-specifications">
            <h2 className="section-title" id="car-specifications">
              技术规格
            </h2>
            <dl className="entity-spec-list">
              {specEntries.map(([key, value]) => (
                <div key={key} className="entity-spec-row">
                  <dt>{key}</dt>
                  <dd>{value.zh}</dd>
                </div>
              ))}
            </dl>
          </section>
        ) : null}

        {car.drivers.length > 0 ? (
          <section aria-labelledby="car-drivers">
            <h2 className="section-title" id="car-drivers">
              车手
            </h2>
            <div className="season-detail-chip-row">
              {car.drivers.map((driver) =>
                driver.href ? (
                  <Link
                    key={driver.id}
                    href={driver.href}
                    className="season-detail-chip tap-target"
                  >
                    {driver.title}
                  </Link>
                ) : (
                  <span key={driver.id} className="season-detail-chip">
                    {driver.title}
                  </span>
                ),
              )}
            </div>
          </section>
        ) : null}

        {car.seasons.length > 0 ? (
          <section aria-labelledby="car-seasons">
            <h2 className="section-title" id="car-seasons">
              参赛赛季
            </h2>
            <div className="season-detail-chip-row">
              {car.seasons.map((season) =>
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

        {car.technologies.length > 0 ? (
          <section aria-labelledby="car-technologies">
            <h2 className="section-title" id="car-technologies">
              相关技术
            </h2>
            <div className="season-detail-chip-row">
              {car.technologies.map((technology) =>
                technology.href ? (
                  <Link
                    key={technology.id}
                    href={technology.href}
                    className="season-detail-chip tap-target"
                  >
                    {technology.title}
                  </Link>
                ) : (
                  <span key={technology.id} className="season-detail-chip">
                    {technology.title}
                  </span>
                ),
              )}
            </div>
          </section>
        ) : null}

        {car.representativeSeason?.href ? (
          <Link
            href={car.representativeSeason.href}
            className="entity-timeline-cta tap-target"
          >
            在时间轴上查看 {car.representativeSeason.title} ▸
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
