"use client";

import { useState } from "react";
import type { EntityCard } from "@/content/content-repository";
import { MuseumSheet } from "@/components/museum-sheet";

export function HomeMuseumLauncher({
  cars,
  people,
  technologies,
}: {
  cars: EntityCard[];
  people: EntityCard[];
  technologies: EntityCard[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className="museum-button tap-target"
        onClick={() => setOpen(true)}
      >
        <span aria-hidden="true">🏛️</span>
        博物馆
      </button>
      {open ? (
        <>
          <div
            className="museum-sheet-backdrop"
            onClick={() => setOpen(false)}
          />
          <MuseumSheet
            cars={cars}
            people={people}
            technologies={technologies}
            variant="overlay"
            onClose={() => setOpen(false)}
          />
        </>
      ) : null}
    </>
  );
}
