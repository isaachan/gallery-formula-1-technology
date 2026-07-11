import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { renderContentBlocks } from "@/blocks/block-registry";
import { getContentRepository } from "@/content/get-repository";

async function loadTeam(slug: string) {
  const repository = await getContentRepository();
  const entity = await repository.getEntityBySlug("team", slug);
  return entity && entity.team ? entity : null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const entity = await loadTeam(slug);

  if (!entity) {
    return { title: "Team Not Found | F1 Track Chronicle" };
  }

  return {
    title: `${entity.title} | F1 Track Chronicle`,
    description: entity.summary,
  };
}

export default async function TeamPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const entity = await loadTeam(slug);

  if (!entity) {
    notFound();
  }

  const team = entity.team!;

  return (
    <div className="app-shell">
      <main className="season-detail">
        <Link href="/museum" className="season-detail-back tap-target">
          ← 返回博物馆
        </Link>

        <p className="eyebrow">TEAM</p>
        <h1 className="season-detail-title">{entity.title}</h1>
        <p className="section-text">{entity.summary}</p>

        <section aria-labelledby="team-overview">
          <div className="section-head">
            <h2 className="section-title" id="team-overview">
              概览
            </h2>
          </div>
          <div className="season-detail-meta-grid">
            <article className="season-detail-meta-card">
              <p className="season-detail-meta-label">类型</p>
              <p className="season-detail-meta-value">{team.teamKind}</p>
            </article>
            {team.baseCountryCode ? (
              <article className="season-detail-meta-card">
                <p className="season-detail-meta-label">主基地国家</p>
                <p className="season-detail-meta-value">
                  {team.baseCountryCode}
                </p>
              </article>
            ) : null}
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

        {team.people.length > 0 ? (
          <section aria-labelledby="team-people">
            <h2 className="section-title" id="team-people">
              人员
            </h2>
            <div className="season-detail-chip-row">
              {team.people.map((person) =>
                person.href ? (
                  <Link
                    key={person.id}
                    href={person.href}
                    className="season-detail-chip tap-target"
                  >
                    {person.title}
                  </Link>
                ) : (
                  <span key={person.id} className="season-detail-chip">
                    {person.title}
                  </span>
                ),
              )}
            </div>
          </section>
        ) : null}

        {team.cars.length > 0 ? (
          <section aria-labelledby="team-cars">
            <h2 className="section-title" id="team-cars">
              车辆
            </h2>
            <div className="season-detail-chip-row">
              {team.cars.map((car) =>
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

        {team.seasons.length > 0 ? (
          <section aria-labelledby="team-seasons">
            <h2 className="section-title" id="team-seasons">
              参赛赛季
            </h2>
            <div className="season-detail-chip-row">
              {team.seasons.map((season) =>
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

        <div className="block-preview-stack">
          {renderContentBlocks(
            entity.blocks as Parameters<typeof renderContentBlocks>[0],
          )}
        </div>
      </main>
    </div>
  );
}
