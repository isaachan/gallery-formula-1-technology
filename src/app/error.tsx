"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { reportRouteError } from "@/lib/error-reporting";

export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const pathname = usePathname();

  useEffect(() => {
    reportRouteError({
      route: pathname,
      digest: error.digest,
      message: error.message,
    });
  }, [error, pathname]);

  return (
    <div className="app-shell">
      <main className="not-found">
        <p className="eyebrow">ERROR</p>
        <h1 className="season-detail-title">页面暂时无法显示</h1>
        <p className="section-text" role="alert">
          这个页面渲染时出现了问题，已记录诊断信息。你可以重试，或先返回时间轴。
        </p>
        <div className="season-detail-chip-row">
          <button
            type="button"
            className="cta tap-target"
            onClick={() => reset()}
          >
            重试
          </button>
          <Link href="/" className="cta tap-target">
            ← 返回时间轴
          </Link>
        </div>
      </main>
    </div>
  );
}
