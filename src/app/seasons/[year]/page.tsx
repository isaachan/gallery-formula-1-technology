import Link from "next/link";
import { notFound } from "next/navigation";
import { renderContentBlocks } from "@/blocks/block-registry";
import { getContentRepository } from "@/content/get-repository";

export default async function SeasonPage({
  params,
}: {
  params: Promise<{ year: string }>;
}) {
  const { year: yearParam } = await params;
  const year = Number.parseInt(yearParam, 10);

  if (!Number.isInteger(year) || String(year) !== yearParam) {
    notFound();
  }

  const repository = await getContentRepository();
  const season = await repository.getSeasonByYear(year);

  if (!season) {
    notFound();
  }

  return (
    <div className="app-shell">
      <main className="season-detail">
        <Link
          href={`/?year=${season.year}`}
          className="season-detail-back tap-target"
        >
          ← 返回时间轴
        </Link>

        <p className="eyebrow">SEASON {season.year}</p>
        <h1 className="season-detail-title">{season.title}</h1>
        <p className="section-text">{season.summary}</p>

        {season.champion ? (
          <div className="season-detail-champion">
            <span className="season-detail-champion-badge">👑</span>
            <div>
              <p className="season-detail-champion-label">WORLD CHAMPION</p>
              <p className="season-detail-champion-name">
                {season.champion.title}
                {season.championCar ? ` · ${season.championCar.title}` : ""}
              </p>
            </div>
          </div>
        ) : null}

        {season.races.length > 0 ? (
          <section aria-labelledby="season-races">
            <h2 className="section-title" id="season-races">
              分站赛
            </h2>
            <ul className="season-detail-race-list">
              {season.races.map((race) => (
                <li key={race.id}>
                  <span className="season-detail-race-round">
                    R{race.round}
                  </span>
                  <span>{race.title}</span>
                  {race.winner ? (
                    <span className="season-detail-race-winner">
                      🏆 {race.winner.title}
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {season.featuredTechnologies.length > 0 ? (
          <section aria-labelledby="season-tech">
            <h2 className="section-title" id="season-tech">
              本季技术
            </h2>
            <ul className="season-detail-tech-list">
              {season.featuredTechnologies.map((technology) => (
                <li key={technology.id}>{technology.title}</li>
              ))}
            </ul>
          </section>
        ) : null}

        <div className="block-preview-stack">
          {renderContentBlocks(
            season.blocks as Parameters<typeof renderContentBlocks>[0],
          )}
        </div>
      </main>
    </div>
  );
}
