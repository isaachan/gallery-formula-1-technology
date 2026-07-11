import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { renderContentBlocks } from "@/blocks/block-registry";
import { getContentRepository } from "@/content/get-repository";

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

  return (
    <div className="app-shell">
      <main className="season-detail">
        <Link href="/museum" className="season-detail-back tap-target">
          ← 返回博物馆
        </Link>

        <p className="eyebrow">PERSON</p>
        <h1 className="season-detail-title">{entity.title}</h1>
        {entity.subtitle ? (
          <p className="section-text">{entity.subtitle}</p>
        ) : null}
        <p className="section-text">{entity.summary}</p>

        <section aria-labelledby="person-overview">
          <div className="section-head">
            <h2 className="section-title" id="person-overview">
              档案
            </h2>
          </div>
          <div className="season-detail-meta-grid">
            <article className="season-detail-meta-card">
              <p className="season-detail-meta-label">身份</p>
              <p className="season-detail-meta-value">
                {PERSON_KIND_LABELS[person.personKind] ?? person.personKind}
              </p>
            </article>
            {person.nationality ? (
              <article className="season-detail-meta-card">
                <p className="season-detail-meta-label">国籍</p>
                <p className="season-detail-meta-value">{person.nationality}</p>
              </article>
            ) : null}
            {person.activeYears ? (
              <article className="season-detail-meta-card">
                <p className="season-detail-meta-label">活跃年份</p>
                <p className="season-detail-meta-value">
                  {person.activeYears.from}
                  {person.activeYears.to ? ` - ${person.activeYears.to}` : "-"}
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

        {person.championshipYears.length > 0 ||
        (entity.racesWon?.length ?? 0) > 0 ? (
          <section aria-labelledby="person-achievements">
            <h2 className="section-title" id="person-achievements">
              成就
            </h2>
            {person.championshipYears.length > 0 ? (
              <div className="season-detail-chip-row">
                {person.championshipYears.map((year) => (
                  <span key={year} className="season-detail-chip">
                    🏆 {year} 年世界冠军
                  </span>
                ))}
              </div>
            ) : null}
            {entity.racesWon && entity.racesWon.length > 0 ? (
              <div className="season-detail-chip-row">
                {entity.racesWon.map((race) => (
                  <span key={race.id} className="season-detail-chip">
                    {race.title}
                  </span>
                ))}
              </div>
            ) : null}
          </section>
        ) : null}

        {person.teams.length > 0 ? (
          <section aria-labelledby="person-teams">
            <h2 className="section-title" id="person-teams">
              效力车队
            </h2>
            <div className="season-detail-chip-row">
              {person.teams.map((team) =>
                team.href ? (
                  <Link
                    key={team.id}
                    href={team.href}
                    className="season-detail-chip tap-target"
                  >
                    {team.title}
                  </Link>
                ) : (
                  <span key={team.id} className="season-detail-chip">
                    {team.title}
                  </span>
                ),
              )}
            </div>
          </section>
        ) : null}

        {person.cars.length > 0 ? (
          <section aria-labelledby="person-cars">
            <h2 className="section-title" id="person-cars">
              驾驶车辆
            </h2>
            <div className="season-detail-chip-row">
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

        {person.representativeSeasons.length > 0 ? (
          <section aria-labelledby="person-seasons">
            <h2 className="section-title" id="person-seasons">
              代表赛季
            </h2>
            <div className="season-detail-chip-row">
              {person.representativeSeasons.map((season) =>
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
