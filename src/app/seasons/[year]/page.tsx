import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { renderContentBlocks } from "@/blocks/block-registry";
import { CarHeroStage } from "@/components/car-hero-stage";
import {
  colorForTeamSlug,
  GalleryCarSvg,
} from "@/components/car-illustrations";
import { ContentFeedback } from "@/components/content-feedback";
import { EngineSoundButton } from "@/components/engine-sound-button";
import { getContentRepository } from "@/content/get-repository";
import type { TechnologyFormat } from "@/content/content-repository";
import { buildContentFeedbackMailto } from "@/lib/content-feedback";
import { getBuildDiagnostics } from "@/lib/diagnostics";
import { RaceList } from "./race-list";
import { SeasonHeading } from "./season-heading";

const TECH_FORMAT_BADGE: Record<TechnologyFormat, string> = {
  animation: "▶ 动画",
  diagram: "🔍 图解",
  model3d: "🧊 3D",
  article: "📖 图文",
};

const TECH_FORMAT_ICON: Record<TechnologyFormat, string> = {
  animation: "▶",
  diagram: "🔍",
  model3d: "🧊",
  article: "📖",
};

export async function generateStaticParams() {
  const repository = await getContentRepository();
  return repository.listSeasonYears().map((year) => ({ year: String(year) }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ year: string }>;
}): Promise<Metadata> {
  const { year: yearParam } = await params;
  const year = Number.parseInt(yearParam, 10);

  if (!Number.isInteger(year) || String(year) !== yearParam) {
    return {
      title: "Season Not Found | F1 Track Chronicle",
    };
  }

  const repository = await getContentRepository();
  const season = await repository.getSeasonByYear(year);

  if (!season) {
    return {
      title: "Season Not Found | F1 Track Chronicle",
    };
  }

  return {
    title: `${season.title} | F1 Track Chronicle`,
    description: season.summary,
  };
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
  const adjacent = await repository.getAdjacentSeasons(year);
  const diagnostics = await getBuildDiagnostics();

  if (!season) {
    notFound();
  }

  const feedbackRecipient =
    process.env.NEXT_PUBLIC_FEEDBACK_EMAIL ?? "editor@example.com";
  const feedbackContext = {
    title: season.title,
    canonicalPath: `/seasons/${season.year}`,
    entityType: "season" as const,
    entityId: season.id,
    appVersion: diagnostics.appVersion,
    contentVersion: diagnostics.contentVersion,
  };

  const seasonIndex = season.year - 1950 + 1;
  const heroColor = colorForTeamSlug(season.championCar?.teamSlug);
  const driverStanding = season.standings.find((s) => s.kind === "driver");
  const top3 = driverStanding ? driverStanding.entries.slice(0, 3) : [];
  const medalClass = ["gold", "silver", "bronze"];

  return (
    <div className="app-shell">
      <main className="season-detail">
        <header className="season-hero-header">
          <Link
            href={`/?year=${season.year}`}
            className="season-hero-back tap-target"
            aria-label="返回时间轴"
          >
            ←
          </Link>
          <div className="season-hero-titleblock">
            <SeasonHeading className="season-hero-title">
              {season.year} <span>シーズン</span>
            </SeasonHeading>
            <p className="season-hero-index">SEASON {seasonIndex} / 76</p>
          </div>
          <EngineSoundButton className="season-hero-engine-btn tap-target" />
        </header>

        <CarHeroStage
          color={heroColor}
          name={season.championCar?.title}
          subtitle={
            season.championCar
              ? [
                  season.championCar.constructorTitle,
                  season.championCar.driverTitle,
                ]
                  .filter(Boolean)
                  .join(" · ")
              : undefined
          }
          eraLabel={season.era?.title}
        />

        {season.champion ? (
          <div className="season-champion-strip">
            <span className="season-champion-badge" aria-hidden="true">
              👑
            </span>
            <div>
              <p className="season-champion-label">WORLD CHAMPION</p>
              <p className="season-champion-name">
                {season.champion.href ? (
                  <Link href={season.champion.href}>
                    {season.champion.title}
                  </Link>
                ) : (
                  season.champion.title
                )}
              </p>
            </div>
          </div>
        ) : null}

        {season.entrantCars.length > 0 ? (
          <section aria-labelledby="season-entrants">
            <h2 className="season-section-heading" id="season-entrants">
              参赛车图鉴 <span>CARS · {season.entrantCars.length} 辆</span>
            </h2>
            <div className="season-car-gallery">
              {season.entrantCars.map((car) => {
                const isChampion = car.id === season.championCar?.id;
                return car.href ? (
                  <Link
                    key={car.id}
                    href={car.href}
                    className="season-car-gallery-card"
                    data-champion={isChampion}
                  >
                    {isChampion ? (
                      <span
                        className="season-car-gallery-crown"
                        aria-hidden="true"
                      >
                        👑
                      </span>
                    ) : null}
                    <GalleryCarSvg color={colorForTeamSlug(car.teamSlug)} />
                    <span className="season-car-gallery-name">{car.title}</span>
                    <span className="season-car-gallery-sub">
                      {[car.constructorTitle, car.driverTitle]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                    <span className="season-car-gallery-link">查看细节 ▸</span>
                  </Link>
                ) : (
                  <div key={car.id} className="season-car-gallery-card">
                    <GalleryCarSvg color={colorForTeamSlug(car.teamSlug)} />
                    <span className="season-car-gallery-name">{car.title}</span>
                  </div>
                );
              })}
              {season.entrantCars.length <= 1 ? (
                <div className="season-car-gallery-more">
                  <span aria-hidden="true">🚧</span>
                  <span>
                    其余参赛车
                    <br />
                    资料整理中
                  </span>
                </div>
              ) : null}
            </div>
          </section>
        ) : null}

        {season.races.length > 0 ? (
          <section aria-labelledby="season-races">
            <h2 className="season-section-heading" id="season-races">
              分站赛 <span>RACES · 冠军与冠军车</span>
            </h2>
            <RaceList
              races={season.races}
              championCarId={season.championCar?.id}
            />
          </section>
        ) : null}

        {top3.length > 0 ? (
          <section aria-labelledby="season-standings">
            <h2 className="season-section-heading" id="season-standings">
              车手榜 <span>TOP 3</span>
            </h2>
            <div className="season-standings-panel">
              {top3.map((entry, index) => {
                const row = (
                  <>
                    <span
                      className="season-standing-medal"
                      data-medal={medalClass[index]}
                    >
                      {entry.position}
                    </span>
                    <span className="season-standing-name">
                      {entry.competitor?.title ?? "未解析条目"}
                    </span>
                    <span className="season-standing-points">
                      {entry.points}
                      <span> pt</span>
                    </span>
                    <span
                      className="season-standing-chevron"
                      aria-hidden="true"
                    >
                      ▸
                    </span>
                  </>
                );
                return entry.competitor?.href ? (
                  <Link
                    key={entry.position}
                    href={entry.competitor.href}
                    className="season-standing-row"
                  >
                    {row}
                  </Link>
                ) : (
                  <div key={entry.position} className="season-standing-row">
                    {row}
                  </div>
                );
              })}
            </div>
          </section>
        ) : null}

        {season.featuredTechnologies.length > 0 ? (
          <section aria-labelledby="season-tech">
            <h2 className="season-section-heading" id="season-tech">
              本季技术 <span>TECH</span>
            </h2>
            <div className="season-tech-cards">
              {season.featuredTechnologies.map((tech) =>
                tech.href ? (
                  <Link
                    key={tech.id}
                    href={tech.href}
                    className="season-tech-card"
                  >
                    <span className="season-tech-format-badge">
                      {TECH_FORMAT_BADGE[tech.format]}
                    </span>
                    <span className="season-tech-icon" aria-hidden="true">
                      {TECH_FORMAT_ICON[tech.format]}
                    </span>
                    <span className="season-tech-title">{tech.title}</span>
                  </Link>
                ) : (
                  <div key={tech.id} className="season-tech-card">
                    <span className="season-tech-title">{tech.title}</span>
                  </div>
                ),
              )}
            </div>
          </section>
        ) : null}

        {season.blocks.length > 0 ? (
          <div className="season-story-blocks">
            {renderContentBlocks(
              season.blocks as Parameters<typeof renderContentBlocks>[0],
            )}
          </div>
        ) : null}

        <div className="season-footer-nav">
          {adjacent.previous ? (
            <Link
              href={adjacent.previous.href ?? "#"}
              className="season-footer-prev tap-target"
            >
              ◀ {adjacent.previous.title}
            </Link>
          ) : (
            <span className="season-footer-spacer" aria-hidden="true" />
          )}
          {adjacent.next ? (
            <Link
              href={adjacent.next.href ?? "#"}
              className="season-footer-next tap-target"
            >
              {adjacent.next.title} ▶
            </Link>
          ) : null}
        </div>

        {season.sources.length > 0 ? (
          <p className="season-sources-footer">
            资料来源：
            {season.sources.map((source, index) => (
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
