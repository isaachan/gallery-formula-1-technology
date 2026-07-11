import Link from "next/link";
import { notFound } from "next/navigation";
import { renderContentBlocks } from "@/blocks/block-registry";
import { getContentRepository } from "@/content/get-repository";

function standingLabel(kind: "driver" | "constructor") {
  return kind === "driver" ? "车手积分榜" : "车队积分榜";
}

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

        <section
          className="season-detail-overview"
          aria-labelledby="season-overview"
        >
          <div className="section-head">
            <h2 className="section-title" id="season-overview">
              赛季概览
            </h2>
          </div>
          <div className="season-detail-meta-grid">
            <article className="season-detail-meta-card">
              <p className="season-detail-meta-label">年代背景</p>
              <p className="season-detail-meta-value">
                {season.era?.href ? (
                  <Link href={season.era.href}>{season.era.title}</Link>
                ) : (
                  (season.era?.title ?? "待补充")
                )}
              </p>
            </article>
            <article className="season-detail-meta-card">
              <p className="season-detail-meta-label">冠军赛车</p>
              <p className="season-detail-meta-value">
                {season.championCar?.href ? (
                  <Link href={season.championCar.href}>
                    {season.championCar.title}
                  </Link>
                ) : (
                  (season.championCar?.title ?? "待补充")
                )}
              </p>
            </article>
            <article className="season-detail-meta-card">
              <p className="season-detail-meta-label">资料来源</p>
              <ul className="season-detail-source-list">
                {season.sources.map((source) => (
                  <li key={source.id}>{source.title}</li>
                ))}
              </ul>
            </article>
          </div>
        </section>

        {season.champion ? (
          <div className="season-detail-champion">
            <span className="season-detail-champion-badge">👑</span>
            <div>
              <p className="season-detail-champion-label">WORLD CHAMPION</p>
              <p className="season-detail-champion-name">
                {season.champion.href ? (
                  <Link href={season.champion.href}>
                    {season.champion.title}
                  </Link>
                ) : (
                  season.champion.title
                )}
                {season.championCar ? " · " : ""}
                {season.championCar?.href ? (
                  <Link href={season.championCar.href}>
                    {season.championCar.title}
                  </Link>
                ) : (
                  (season.championCar?.title ?? "")
                )}
              </p>
            </div>
          </div>
        ) : null}

        {season.entrantCars.length > 0 ? (
          <section aria-labelledby="season-entrants">
            <h2 className="section-title" id="season-entrants">
              参赛车辆
            </h2>
            <div className="season-detail-chip-row">
              {season.entrantCars.map((car) =>
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

        {season.standings.length > 0 ? (
          <section aria-labelledby="season-standings">
            <h2 className="section-title" id="season-standings">
              积分榜
            </h2>
            <div className="season-detail-standing-grid">
              {season.standings.map((standing) => (
                <article
                  key={standing.id}
                  className="season-detail-standing-card"
                >
                  <h3 className="season-detail-standing-title">
                    {standingLabel(standing.kind)}
                  </h3>
                  <ol className="season-detail-standing-list">
                    {standing.entries
                      .slice(
                        0,
                        standing.defaultVisibleCount ?? standing.entries.length,
                      )
                      .map((entry) => (
                        <li key={`${standing.id}-${entry.position}`}>
                          <span className="season-detail-standing-position">
                            {entry.position}
                          </span>
                          <span className="season-detail-standing-name">
                            {entry.competitor?.href ? (
                              <Link href={entry.competitor.href}>
                                {entry.competitor.title}
                              </Link>
                            ) : (
                              (entry.competitor?.title ?? "未解析条目")
                            )}
                          </span>
                          <span className="season-detail-standing-points">
                            {entry.points} 分
                          </span>
                        </li>
                      ))}
                  </ol>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {season.races.length > 0 ? (
          <section aria-labelledby="season-races">
            <h2 className="section-title" id="season-races">
              分站赛
            </h2>
            <ul className="season-detail-race-list">
              {season.races.slice(0, 5).map((race) => (
                <li key={race.id}>
                  <span className="season-detail-race-round">
                    R{race.round}
                  </span>
                  <span>{race.title}</span>
                  {race.winner ? (
                    <span className="season-detail-race-winner">
                      🏆{" "}
                      {race.winner.href ? (
                        <Link href={race.winner.href}>{race.winner.title}</Link>
                      ) : (
                        race.winner.title
                      )}
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
            {season.races.length > 5 ? (
              <details className="season-detail-races-more">
                <summary>显示全部 {season.races.length} 场分站赛</summary>
                <ul className="season-detail-race-list">
                  {season.races.slice(5).map((race) => (
                    <li key={race.id}>
                      <span className="season-detail-race-round">
                        R{race.round}
                      </span>
                      <span>{race.title}</span>
                      {race.winner ? (
                        <span className="season-detail-race-winner">
                          🏆{" "}
                          {race.winner.href ? (
                            <Link href={race.winner.href}>
                              {race.winner.title}
                            </Link>
                          ) : (
                            race.winner.title
                          )}
                        </span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </details>
            ) : null}
          </section>
        ) : null}

        {season.featuredTechnologies.length > 0 ? (
          <section aria-labelledby="season-tech">
            <h2 className="section-title" id="season-tech">
              本季技术
            </h2>
            <div className="season-detail-chip-row">
              {season.featuredTechnologies.map((technology) =>
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

        <div className="block-preview-stack">
          {renderContentBlocks(
            season.blocks as Parameters<typeof renderContentBlocks>[0],
          )}
        </div>
      </main>
    </div>
  );
}
