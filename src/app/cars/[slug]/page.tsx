import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { renderContentBlocks } from "@/blocks/block-registry";
import { CarHeroStage } from "@/components/car-hero-stage";
import { colorForTeamSlug } from "@/components/car-illustrations";
import { ContentFeedback } from "@/components/content-feedback";
import { EngineSoundButton } from "@/components/engine-sound-button";
import { getContentRepository } from "@/content/get-repository";
import { buildContentFeedbackMailto } from "@/lib/content-feedback";
import { getBuildDiagnostics } from "@/lib/diagnostics";

async function loadCar(slug: string) {
  const repository = await getContentRepository();
  const entity = await repository.getEntityBySlug("car", slug);
  return entity && entity.car ? entity : null;
}

export async function generateStaticParams() {
  const repository = await getContentRepository();
  return repository.listEntitySlugs("car").map((slug) => ({ slug }));
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
  const heroColor = colorForTeamSlug(car.constructor?.slug);
  const storyBlocks = (entity.blocks as unknown[]) ?? [];
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
        <header className="season-hero-header">
          <Link
            href={car.representativeSeason?.href ?? "/museum"}
            className="season-hero-back tap-target"
            aria-label="返回"
          >
            ←
          </Link>
          <div className="season-hero-titleblock">
            <h1 className="car-hero-title">{entity.title}</h1>
            <p className="car-hero-meta-line">
              {[car.constructor?.title, car.representativeSeason?.title]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>
          <EngineSoundButton className="car-hero-engine-btn tap-target" />
        </header>

        <CarHeroStage
          color={heroColor}
          dragLabel="3D ぐるぐる · 拖动旋转"
          championBadge={car.isChampionCar ? "👑 冠军车" : undefined}
        />

        <div className="car-spec-card">
          <div className="car-spec-row">
            <span className="car-spec-label">车队 TEAM</span>
            <span className="car-spec-value">
              {car.constructor?.href ? (
                <Link href={car.constructor.href}>{car.constructor.title}</Link>
              ) : (
                (car.constructor?.title ?? "待补充")
              )}
            </span>
          </div>
          <div className="car-spec-row">
            <span className="car-spec-label">车手 DRIVERS</span>
            <span className="car-spec-value">
              {car.drivers.length > 0
                ? car.drivers.map((driver, index) => (
                    <span key={driver.id}>
                      {index > 0 ? " / " : ""}
                      {driver.href ? (
                        <Link href={driver.href}>{driver.title}</Link>
                      ) : (
                        driver.title
                      )}
                    </span>
                  ))
                : "待补充"}
            </span>
          </div>
          <div className="car-spec-row">
            <span className="car-spec-label">引擎 ENGINE</span>
            <span className="car-spec-value">{car.engine}</span>
          </div>
          {car.wins !== undefined ? (
            <div className="car-spec-row">
              <span className="car-spec-label">分站胜利 WINS</span>
              <span className="car-spec-value car-spec-value-accent">
                {car.wins} 胜
              </span>
            </div>
          ) : null}
        </div>

        {entity.summary ? <p className="car-note">{entity.summary}</p> : null}

        {storyBlocks.length > 0 ? (
          <section aria-labelledby="car-story">
            <h2 className="season-section-heading" id="car-story">
              图解与故事 <span>STORY</span>
            </h2>
            <div className="season-story-blocks">
              {renderContentBlocks(
                storyBlocks as Parameters<typeof renderContentBlocks>[0],
              )}
            </div>
          </section>
        ) : (
          <>
            <h2 className="season-section-heading">
              物料 <span>MATERIALS · 有多少放多少</span>
            </h2>
            <div className="car-material-row">
              <div className="car-material-card" data-state="enabled">
                <div className="car-material-icon" aria-hidden="true">
                  🧊
                </div>
                <div className="car-material-title">3D 模型</div>
                <div className="car-material-note">
                  伪3D已启用 · 名车后续换真3D
                </div>
              </div>
              <div className="car-material-card" data-state="placeholder">
                <div className="car-material-icon" aria-hidden="true">
                  🎬
                </div>
                <div className="car-material-title">视频</div>
                <div className="car-material-note">物料收集中 · 占位</div>
              </div>
            </div>
            <div className="car-photo-slots">
              <div className="car-photo-slot">拖入实车照片 ①</div>
              <div className="car-photo-slot">拖入实车照片 ②</div>
            </div>
          </>
        )}

        {specEntries.length > 0 ? (
          <section aria-labelledby="car-specifications">
            <h2 className="season-section-heading" id="car-specifications">
              技术规格 <span>SPECIFICATIONS</span>
            </h2>
            <dl className="entity-spec-list" style={{ margin: "0 18px" }}>
              {specEntries.map(([key, value]) => (
                <div key={key} className="entity-spec-row">
                  <dt>{key}</dt>
                  <dd>{value.zh}</dd>
                </div>
              ))}
            </dl>
          </section>
        ) : null}

        {car.technologies.length > 0 ? (
          <section aria-labelledby="car-technologies">
            <h2 className="season-section-heading" id="car-technologies">
              相关技术 <span>TECH</span>
            </h2>
            <div
              className="season-detail-chip-row"
              style={{ margin: "0 18px" }}
            >
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
