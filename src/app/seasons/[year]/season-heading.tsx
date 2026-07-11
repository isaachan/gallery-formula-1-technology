"use client";

import type { ReactNode } from "react";
import { useEffect, useRef } from "react";

export function SeasonHeading({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    ref.current?.focus();
  }, []);

  return (
    <h1 ref={ref} className="season-detail-title" tabIndex={-1}>
      {children}
    </h1>
  );
}
