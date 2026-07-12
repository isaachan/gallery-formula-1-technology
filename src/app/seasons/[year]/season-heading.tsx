"use client";

import type { ReactNode } from "react";
import { useEffect, useRef } from "react";

export function SeasonHeading({
  children,
  className = "season-detail-title",
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    ref.current?.focus();
  }, []);

  return (
    <h1 ref={ref} className={className} tabIndex={-1}>
      {children}
    </h1>
  );
}
