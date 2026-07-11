import type { Metadata } from "next";
import Link from "next/link";
import { getContentRepository } from "@/content/get-repository";
import { MuseumBrowser } from "./museum-browser";

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
      <main className="season-detail">
        <Link href="/" className="season-detail-back tap-target">
          ← 返回时间轴
        </Link>
        <p className="eyebrow">MUSEUM</p>
        <h1 className="season-detail-title">博物馆</h1>
        <p className="section-text">
          按兴趣而非时间顺序探索车辆、人物与技术，每张卡片都可以跳回它在时间轴上的代表赛季。
        </p>
        <MuseumBrowser
          cars={cars}
          people={people}
          technologies={technologies}
        />
      </main>
    </div>
  );
}
