"use client";

export default function MuseumError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="app-shell">
      <main className="season-detail">
        <p className="eyebrow">MUSEUM</p>
        <p className="section-text" role="alert">
          博物馆内容暂时无法加载，请稍后重试。
        </p>
        <button
          type="button"
          className="museum-button tap-target"
          onClick={() => reset()}
        >
          重试
        </button>
      </main>
    </div>
  );
}
