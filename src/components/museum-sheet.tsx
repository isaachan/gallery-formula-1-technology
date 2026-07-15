"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { EntityCard, SearchResult } from "@/content/content-repository";
import { searchMuseumClient } from "@/lib/client-search";

type MuseumTab = "car" | "technology" | "person";

const TAB_LABELS: Record<MuseumTab, string> = {
  car: "🏎️ 名车",
  technology: "🔧 技术",
  person: "🪖 车手",
};

const TYPE_LABELS: Record<string, string> = {
  season: "赛季",
  car: "车辆",
  person: "人物",
  technology: "科技",
  team: "车队",
  era: "年代",
};

const STORAGE_KEY = "f1-museum-state";

type PersistedState = {
  tab: MuseumTab;
  scrollTop: number;
};

function readPersistedState(): PersistedState | null {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as Partial<PersistedState>;
    if (parsed.tab && parsed.tab in TAB_LABELS) {
      return {
        tab: parsed.tab,
        scrollTop: typeof parsed.scrollTop === "number" ? parsed.scrollTop : 0,
      };
    }
    return null;
  } catch {
    return null;
  }
}

function writePersistedState(state: PersistedState) {
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // sessionStorage may be unavailable (e.g. private browsing); the tab
    // still works, it just won't be restored on return.
  }
}

function timelineYear(timelineHref: string | undefined): string | null {
  const match = timelineHref?.match(/year=(\d+)/);
  return match ? match[1] : null;
}

function MuseumRow({ entity }: { entity: EntityCard }) {
  const year = timelineYear(entity.timelineHref);

  return (
    <div className="museum-sheet-row">
      {entity.href ? (
        <Link href={entity.href} className="museum-sheet-row-main">
          <span className="museum-sheet-row-title">
            {entity.title} <span className="museum-sheet-row-chevron">▸</span>
          </span>
          {entity.subtitle ? (
            <span className="museum-sheet-row-note">{entity.subtitle}</span>
          ) : null}
        </Link>
      ) : (
        <span className="museum-sheet-row-main">
          <span className="museum-sheet-row-title">{entity.title}</span>
          {entity.subtitle ? (
            <span className="museum-sheet-row-note">{entity.subtitle}</span>
          ) : null}
        </span>
      )}
      {year && entity.timelineHref ? (
        <Link
          href={entity.timelineHref}
          className="museum-sheet-row-locate tap-target"
        >
          {year} ↩
        </Link>
      ) : null}
    </div>
  );
}

function MuseumRowList({
  entities,
  emptyMessage,
}: {
  entities: EntityCard[];
  emptyMessage: string;
}) {
  if (entities.length === 0) {
    return <p className="museum-empty">{emptyMessage}</p>;
  }

  return (
    <>
      {entities.map((entity) => (
        <MuseumRow key={entity.id} entity={entity} />
      ))}
    </>
  );
}

export function MuseumSheet({
  cars,
  people,
  technologies,
  variant,
  onClose,
  closeHref,
}: {
  cars: EntityCard[];
  people: EntityCard[];
  technologies: EntityCard[];
  variant: "overlay" | "page";
  onClose?: () => void;
  closeHref?: string;
}) {
  const [tab, setTab] = useState<MuseumTab>("car");
  const [restored, setRestored] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [searchError, setSearchError] = useState(false);
  const [searchPending, setSearchPending] = useState(false);

  // Restoring the previously selected tab/scroll position is a one-time
  // hydration step on mount, not a reaction to a prop/state change.
  useEffect(() => {
    const persisted = readPersistedState();
    if (persisted) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTab(persisted.tab);
      requestAnimationFrame(() => {
        scrollRef.current?.scrollTo({ top: persisted.scrollTop });
      });
    }
    setRestored(true);
  }, []);

  useEffect(() => {
    if (!restored) {
      return;
    }
    writePersistedState({ tab, scrollTop: scrollRef.current?.scrollTop ?? 0 });
  }, [tab, restored]);

  const handleScroll = () => {
    if (!restored) {
      return;
    }
    writePersistedState({ tab, scrollTop: scrollRef.current?.scrollTop ?? 0 });
  };

  const handleSearch = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) {
      setResults(null);
      setSearchError(false);
      return;
    }

    setSearchPending(true);
    setSearchError(false);
    try {
      const found = await searchMuseumClient(trimmed);
      setResults(found);
    } catch {
      setResults(null);
      setSearchError(true);
    } finally {
      setSearchPending(false);
    }
  };

  return (
    <div className="museum-sheet" data-variant={variant}>
      <div className="museum-sheet-topbar">
        {variant === "overlay" ? (
          <div className="museum-sheet-handle" aria-hidden="true" />
        ) : null}
        <div className="museum-sheet-header">
          {variant === "page" ? (
            <h1 className="museum-sheet-title">
              🏛️ 博物馆 <span>MUSEUM</span>
            </h1>
          ) : (
            <p className="museum-sheet-title">
              🏛️ 博物馆 <span>MUSEUM</span>
            </p>
          )}
          {onClose ? (
            <button
              type="button"
              className="museum-sheet-close"
              onClick={onClose}
              aria-label="关闭博物馆"
            >
              ✕
            </button>
          ) : closeHref ? (
            <Link
              href={closeHref}
              className="museum-sheet-close"
              aria-label="关闭博物馆"
            >
              ✕
            </Link>
          ) : null}
        </div>
        <div
          className="museum-sheet-tabs"
          role="tablist"
          aria-label="博物馆分类"
        >
          {(Object.keys(TAB_LABELS) as MuseumTab[]).map((candidate) => (
            <button
              key={candidate}
              type="button"
              role="tab"
              aria-selected={tab === candidate}
              className="museum-sheet-tab"
              data-active={tab === candidate}
              onClick={() => setTab(candidate)}
            >
              {TAB_LABELS[candidate]}
            </button>
          ))}
        </div>
        <p className="museum-sheet-hint">
          点右侧年份按钮，定位回赛道上的那个弯 ↩
        </p>

        <form
          className="museum-search"
          role="search"
          onSubmit={(event) => void handleSearch(event)}
        >
          <label className="museum-search-label" htmlFor="museum-search-input">
            搜索博物馆
          </label>
          <div className="museum-search-row">
            <input
              id="museum-search-input"
              type="search"
              className="museum-search-input"
              placeholder="车手姓名、车队、年份或技术名称"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <button type="submit" className="museum-button tap-target">
              搜索
            </button>
          </div>
        </form>
      </div>

      <div aria-live="polite">
        {searchPending ? <p className="museum-empty">搜索中…</p> : null}
        {searchError ? (
          <p className="museum-empty" role="alert">
            搜索暂时不可用，请稍后重试。
          </p>
        ) : null}
        {!searchPending && !searchError && results !== null ? (
          results.length === 0 ? (
            <p className="museum-empty">
              没有找到匹配的结果，请尝试其他关键词。
            </p>
          ) : (
            <ul className="museum-grid" aria-label="搜索结果">
              {results.map((result) => (
                <li key={result.id} className="museum-card">
                  <span className="museum-card-type">
                    {TYPE_LABELS[result.type] ?? result.type}
                  </span>
                  {result.href ? (
                    <Link href={result.href} className="museum-card-title">
                      {result.title}
                    </Link>
                  ) : (
                    <span className="museum-card-title">{result.title}</span>
                  )}
                  {result.subtitle ? (
                    <p className="museum-card-subtitle">{result.subtitle}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          )
        ) : null}
      </div>

      <div
        className="museum-sheet-list"
        role="tabpanel"
        ref={scrollRef}
        onScroll={handleScroll}
      >
        {tab === "car" ? (
          <MuseumRowList
            entities={cars}
            emptyMessage="暂无已发布的车辆条目。"
          />
        ) : null}
        {tab === "technology" ? (
          <MuseumRowList
            entities={technologies}
            emptyMessage="暂无已发布的技术条目。"
          />
        ) : null}
        {tab === "person" ? (
          <MuseumRowList
            entities={people}
            emptyMessage="暂无已发布的人物条目。"
          />
        ) : null}
      </div>
    </div>
  );
}
