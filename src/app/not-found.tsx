import Link from "next/link";

export default function NotFound() {
  return (
    <div className="app-shell">
      <main className="not-found">
        <p className="eyebrow">404</p>
        <h1 className="season-detail-title">未找到该页面</h1>
        <p className="section-text">
          你要找的年份或页面不存在，可能链接有误或内容尚未发布。
        </p>
        <Link href="/" className="cta tap-target">
          ← 返回时间轴
        </Link>
      </main>
    </div>
  );
}
