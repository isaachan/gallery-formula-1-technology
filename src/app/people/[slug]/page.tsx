import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { renderContentBlocks } from "@/blocks/block-registry";
import { ContentFeedback } from "@/components/content-feedback";
import { NarrationButton } from "@/components/narration-button";
import { getContentRepository } from "@/content/get-repository";
import { buildContentFeedbackMailto } from "@/lib/content-feedback";
import { getBuildDiagnostics } from "@/lib/diagnostics";

const PERSON_KIND_LABELS: Record<string, string> = {
  driver: "车手",
  engineer: "工程师",
  designer: "设计师",
  principal: "车队领队",
};

async function loadPerson(slug: string) {
  const repository = await getContentRepository();
  const entity = await repository.getEntityBySlug("person", slug);
  return entity && entity.person ? entity : null;
}

export async function generateStaticParams() {
  const repository = await getContentRepository();
  return repository.listEntitySlugs("person").map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const entity = await loadPerson(slug);

  if (!entity) {
    return { title: "Person Not Found | F1 Track Chronicle" };
  }

  return {
    title: `${entity.title} | F1 Track Chronicle`,
    description: entity.summary,
  };
}

export default async function PersonPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const entity = await loadPerson(slug);

  if (!entity) {
    notFound();
  }

  const person = entity.person!;
  const diagnostics = await getBuildDiagnostics();
  const feedbackRecipient =
    process.env.NEXT_PUBLIC_FEEDBACK_EMAIL ?? "editor@example.com";
  const feedbackContext = {
    title: entity.title,
    canonicalPath: `/people/${entity.slug}`,
    entityType: "person" as const,
    entityId: entity.id,
    appVersion: diagnostics.appVersion,
    contentVersion: diagnostics.contentVersion,
  };

  const kindLabel = PERSON_KIND_LABELS[person.personKind] ?? person.personKind;
  const storyLabel = person.personKind === "driver" ? "车手故事" : "人物故事";
  const storyBlocks = (entity.blocks as unknown[]) ?? [];
  const representativeSeason = person.representativeSeasons[0];

  return (
    <div className="app-shell">
      <main className="season-detail">
        <header className="season-hero-header">
          <Link
            href="/museum"
            className="season-hero-back tap-target"
            aria-label="返回"
          >
            ←
          </Link>
          <div className="season-hero-titleblock">
            <h1 className="car-hero-title">
              {person.personKind === "driver" ? "🪖 " : ""}
              {entity.title}
            </h1>
            {person.englishName ? (
              <p className="car-hero-meta-line">{person.englishName}</p>
            ) : null}
          </div>
          {person.championshipYears.length > 0 ? (
            <span className="person-titles-badge">
              👑 ×{person.championshipYears.length}
            </span>
          ) : null}
        </header>

        <div className="person-profile-row">
          <div className="person-photo-col">
            {person.coverImage ? (
              <img
                className="person-photo"
                src={person.coverImage.src}
                alt={person.coverImage.alt ?? entity.title}
                loading="eager"
                decoding="async"
              />
            ) : (
              <div className="person-photo-slot">拖入车手照片</div>
            )}
            {person.coverImage?.credit ? (
              <div className="person-photo-credit">
                {person.coverImage.credit}
              </div>
            ) : null}
          </div>
          <div className="person-spec-card">
            <div className="person-spec-row">
              <span className="person-spec-label">世界冠军</span>
              <span className="person-spec-value person-spec-value-accent">
                {person.championshipYears.length > 0
                  ? person.championshipYears
                      .map((year) => `'${String(year).slice(-2)}`)
                      .join(" ")
                  : "—"}
              </span>
            </div>
            <div className="person-spec-row">
              <span className="person-spec-label">效力车队</span>
              <span className="person-spec-value">
                {person.teams.length > 0
                  ? person.teams.map((t) => t.title).join(" / ")
                  : "待补充"}
              </span>
            </div>
            <div className="person-spec-row">
              <span className="person-spec-label">标签</span>
              <span className="person-spec-value">{kindLabel}</span>
            </div>
            {person.nationality ? (
              <div className="person-spec-row">
                <span className="person-spec-label">国籍</span>
                <span className="person-spec-value">{person.nationality}</span>
              </div>
            ) : null}
            {person.activeYears ? (
              <div className="person-spec-row">
                <span className="person-spec-label">活跃年份</span>
                <span className="person-spec-value">
                  {person.activeYears.from}
                  {person.activeYears.to ? ` - ${person.activeYears.to}` : " -"}
                </span>
              </div>
            ) : null}
          </div>
        </div>

        <div className="person-story-card">
          <div className="person-story-heading">
            <div className="person-story-title">
              {storyLabel} <span>STORY</span>
            </div>
            <NarrationButton
              text={entity.summary}
              className="person-narration-btn"
            />
          </div>
          <p className="person-story-body">{entity.summary}</p>
        </div>

        {storyBlocks.length > 0 ? (
          <section aria-labelledby="person-story-blocks">
            <h2 className="season-section-heading" id="person-story-blocks">
              {storyLabel} <span>STORY</span>
            </h2>
            <div className="season-story-blocks">
              {renderContentBlocks(
                storyBlocks as Parameters<typeof renderContentBlocks>[0],
              )}
            </div>
          </section>
        ) : null}

        {representativeSeason?.href ? (
          <div className="person-locate-card">
            <div>
              <p className="person-locate-title">代表性赛季</p>
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

        {person.cars.length > 0 ? (
          <section aria-labelledby="person-cars">
            <h2 className="season-section-heading" id="person-cars">
              驾驶车辆 <span>CARS</span>
            </h2>
            <div
              className="season-detail-chip-row"
              style={{ margin: "0 18px" }}
            >
              {person.cars.map((car) =>
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
