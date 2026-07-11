import Link from "next/link";
import { Timeline, type TimelineSeason } from "@/timeline/Timeline";

// The prototype-approved highlighted-season list (design/F1 赛道年代记.dc.html);
// normative per US-C01.6 until an approved design change updates it.
const HIGHLIGHTED_YEARS = new Set([
  1950, 1957, 1959, 1968, 1976, 1978, 1988, 1992, 1994, 2004, 2009, 2014, 2021,
  2025,
]);

function buildDemoTimelineSeasons(): TimelineSeason[] {
  const seasons: TimelineSeason[] = [];
  for (let year = 1950; year <= 2025; year++) {
    const highlighted = HIGHLIGHTED_YEARS.has(year);
    seasons.push({
      id: `demo-season-${year}`,
      year,
      highlighted,
      // Placeholder demo text only — real season content is authored
      // through the researched content pipeline (docs/DEVELOPMENT_PLAN.md
      // Epic G), not fabricated here. 1988 already has real content behind
      // its link; the rest will follow the same pipeline.
      title: `${year} 赛季（示例数据）`,
      championName: "示例车手",
      championCar: "示例赛车",
      tag: highlighted ? "示例技术" : undefined,
      badge: highlighted ? "示例年份" : undefined,
    });
  }
  return seasons;
}

const demoTimelineSeasons = buildDemoTimelineSeasons();

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  const { year: yearParam } = await searchParams;
  const parsedFocusYear = yearParam ? Number.parseInt(yearParam, 10) : NaN;
  const initialFocusYear = Number.isInteger(parsedFocusYear)
    ? parsedFocusYear
    : undefined;

  return (
    <div className="app-shell">
      <main className="home">
        <header className="topbar">
          <div className="brand">
            <div className="brand-mark">
              GRAND PRIX <span>図鑑</span>
            </div>
            <p className="brand-subtitle">沿着赛道，驶过 76 个赛季</p>
          </div>
          <Link className="museum-button tap-target" href="/museum">
            <span aria-hidden="true">🏛️</span>
            博物馆
          </Link>
        </header>

        <Timeline
          seasons={demoTimelineSeasons}
          initialFocusYear={initialFocusYear}
        />
      </main>
    </div>
  );
}
