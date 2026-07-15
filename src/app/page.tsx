import { getContentRepository } from "@/content/get-repository";
import { HomeMuseumLauncher } from "@/components/home-museum-launcher";
import { Timeline } from "@/timeline/Timeline";

export default async function Home() {
  const repository = await getContentRepository();
  const [timelineSeasons, cars, people, technologies] = await Promise.all([
    repository.getTimeline(),
    repository.listMuseum("car"),
    repository.listMuseum("person"),
    repository.listMuseum("technology"),
  ]);

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
          <HomeMuseumLauncher
            cars={cars}
            people={people}
            technologies={technologies}
          />
        </header>

        <Timeline seasons={timelineSeasons} />
      </main>
    </div>
  );
}
