"use client";

import Link from "next/link";
import { useState } from "react";
import type { RaceView } from "@/content/content-repository";
import { flagEmojiForCountryCode } from "@/lib/flag-emoji";

const COLLAPSED_COUNT = 3;

function raceGpName(title: string): string {
  // Race titles are stored as "{year} {GP name}大奖赛" (e.g. "1988
  // 摩纳哥大奖赛"); the season page already shows the year in its header,
  // so strip the leading year for the tighter prototype-style row label.
  return title.replace(/^\d{4}\s*/, "");
}

export function RaceList({
  races,
  championCarId,
}: {
  races: RaceView[];
  championCarId?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const visibleRaces = expanded ? races : races.slice(0, COLLAPSED_COUNT);

  return (
    <div className="season-races-panel">
      {visibleRaces.map((race) => {
        const isChampionRace = race.winnerCar?.id === championCarId;
        return (
          <div
            key={race.id}
            className="season-race-row"
            data-highlight={isChampionRace}
          >
            <div className="season-race-round" data-highlight={isChampionRace}>
              {race.round}
            </div>
            <div className="season-race-flag" aria-hidden="true">
              {flagEmojiForCountryCode(race.countryCode)}
            </div>
            <div className="season-race-info">
              <div className="season-race-name">
                {raceGpName(race.title)}
                {isChampionRace ? (
                  <span className="season-race-note">冠军车夺冠</span>
                ) : null}
              </div>
              {race.winner ? (
                <div className="season-race-winner">
                  🏆{" "}
                  {race.winner.href ? (
                    <Link href={race.winner.href}>{race.winner.title}</Link>
                  ) : (
                    race.winner.title
                  )}
                </div>
              ) : null}
            </div>
            {race.winnerCar ? (
              <div className="season-race-car-chip">
                🏎️ {race.winnerCar.title}
              </div>
            ) : null}
          </div>
        );
      })}
      {races.length > COLLAPSED_COUNT ? (
        <button
          type="button"
          className="season-races-toggle tap-target"
          onClick={() => setExpanded((current) => !current)}
        >
          {expanded ? "收起 ▴" : `ALL · 查看全部 ${races.length} 站 ▾`}
        </button>
      ) : null}
    </div>
  );
}
