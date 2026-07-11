"use client";

import { useEffect } from "react";
import { reportRouteError } from "@/lib/error-reporting";
import "./globals.css";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    reportRouteError({
      route: "root-layout",
      digest: error.digest,
      message: error.message,
    });
  }, [error]);

  return (
    <html lang="zh-CN">
      <body>
        <div className="app-shell">
          <main className="not-found">
            <p className="eyebrow">ERROR</p>
            <h1 className="season-detail-title">应用暂时无法加载</h1>
            <p className="section-text" role="alert">
              应用外壳渲染时出现了问题，已记录诊断信息。
            </p>
            <button
              type="button"
              className="cta tap-target"
              onClick={() => reset()}
            >
              重试
            </button>
          </main>
        </div>
      </body>
    </html>
  );
}
