"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

export type DecadeChip = {
  decade: number;
  label: string;
};

export function DecadeSelector({
  decades,
  activeDecade,
  onSelect,
}: {
  decades: DecadeChip[];
  activeDecade: number | null;
  onSelect: (decade: number) => void;
}) {
  const rowRef = useRef<HTMLDivElement>(null);
  const chipRefs = useRef(new Map<number, HTMLButtonElement>());
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (activeDecade === null) {
      return;
    }
    const chip = chipRefs.current.get(activeDecade);
    chip?.scrollIntoView({
      behavior: prefersReducedMotion ? "auto" : "smooth",
      inline: "center",
      block: "nearest",
    });
  }, [activeDecade, prefersReducedMotion]);

  return (
    <nav className="chip-row" aria-label="Decades" ref={rowRef}>
      {decades.map((chip) => (
        <button
          key={chip.decade}
          ref={(node) => {
            if (node) {
              chipRefs.current.set(chip.decade, node);
            } else {
              chipRefs.current.delete(chip.decade);
            }
          }}
          type="button"
          className={`chip chip-${chip.decade}s tap-target`}
          data-active={chip.decade === activeDecade}
          aria-current={chip.decade === activeDecade ? "true" : undefined}
          onClick={() => onSelect(chip.decade)}
        >
          {chip.label}
        </button>
      ))}
    </nav>
  );
}
