import Link from "next/link";
import { buildDemoTimelineSeasons } from "@/timeline/demo-seasons";
import { Timeline } from "@/timeline/Timeline";

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
