import type { Metadata } from "next";
import { getContentRepository } from "@/content/get-repository";
import { MuseumSheet } from "@/components/museum-sheet";

export const metadata: Metadata = {
  title: "博物馆 | F1 Track Chronicle",
  description: "按车辆、人物与科技分类浏览 F1 历史条目。",
};

export default async function MuseumPage() {
  const repository = await getContentRepository();
  const [cars, people, technologies] = await Promise.all([
    repository.listMuseum("car"),
    repository.listMuseum("person"),
    repository.listMuseum("technology"),
  ]);

  return (
    <div className="app-shell">
      <main className="museum-page">
        <MuseumSheet
          cars={cars}
          people={people}
          technologies={technologies}
          variant="page"
          closeHref="/"
        />
      </main>
    </div>
  );
}
