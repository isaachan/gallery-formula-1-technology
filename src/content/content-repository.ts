import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

type Locale = "zh" | "en";

type LocaleText = {
  zh: string;
  en?: string;
};

type ContentDocument = {
  id: string;
  slug: string;
  type: string;
  status: "draft" | "published" | "archived";
  title: LocaleText;
  summary?: LocaleText;
  subtitle?: LocaleText;
  blocks?: unknown[];
  [field: string]: unknown;
};

export type EntityCard = {
  id: string;
  slug: string;
  type: string;
  title: string;
  subtitle?: string;
  href?: string;
};

export type TimelineEntry = {
  id: string;
  slug: string;
  year: number;
  title: string;
  highlighted: boolean;
  eraId: string;
};

export type RaceView = EntityCard & {
  round: number;
  date: string;
  winner: EntityCard | null;
};

export type StandingEntryView = {
  position: number;
  competitor: EntityCard | null;
  points: number;
  wins?: number;
};

export type StandingView = EntityCard & {
  kind: "driver" | "constructor";
  entries: StandingEntryView[];
  defaultVisibleCount?: number;
};

export type SeasonView = {
  id: string;
  slug: string;
  year: number;
  title: string;
  summary: string;
  highlighted: boolean;
  era: EntityCard | null;
  champion: EntityCard | null;
  championCar: EntityCard | null;
  standings: StandingView[];
  races: RaceView[];
  entrantCars: EntityCard[];
  featuredTechnologies: EntityCard[];
  sources: EntityCard[];
  blocks: unknown[];
};

export type AdjacentSeasons = {
  previous: EntityCard | null;
  next: EntityCard | null;
};

export type EntityView = {
  id: string;
  slug: string;
  type: string;
  title: string;
  summary: string;
  subtitle?: string;
  blocks: unknown[];
  season?: SeasonView;
  /** Races this person won, derived from race.winnerPersonId (not stored on the person document itself). */
  racesWon?: EntityCard[];
};

export type MuseumFilters = Record<string, never>;

export type SearchResult = EntityCard;

async function collectJsonFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const discovered = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        return collectJsonFiles(entryPath);
      }
      return entry.name.endsWith(".json") ? [entryPath] : [];
    }),
  );
  return discovered.flat();
}

async function loadDocuments(contentRoot: string): Promise<ContentDocument[]> {
  const files = await collectJsonFiles(path.resolve(contentRoot));
  const parsed = await Promise.all(
    files.map(async (filePath) => {
      try {
        return JSON.parse(await readFile(filePath, "utf8"));
      } catch {
        return null;
      }
    }),
  );

  return parsed.filter(
    (document): document is ContentDocument =>
      typeof document?.id === "string" && typeof document?.type === "string",
  );
}

function localize(value: LocaleText | undefined, locale: Locale): string {
  if (!value) {
    return "";
  }
  return value[locale] ?? value.zh;
}

function canonicalHref(
  document: ContentDocument | undefined,
): string | undefined {
  if (!document) {
    return undefined;
  }

  switch (document.type) {
    case "season":
      return typeof document.year === "number"
        ? `/seasons/${document.year}`
        : undefined;
    case "car":
      return `/cars/${document.slug}`;
    case "person":
      return `/people/${document.slug}`;
    case "technology":
      return `/technologies/${document.slug}`;
    case "team":
      return `/teams/${document.slug}`;
    case "era":
      return `/eras/${document.slug}`;
    case "source":
      return `/sources/${document.slug}`;
    default:
      return undefined;
  }
}

export class ContentRepository {
  private readonly byId: Map<string, ContentDocument>;

  private constructor(byId: Map<string, ContentDocument>) {
    this.byId = byId;
  }

  static async load(
    contentRoot: string,
    options: { includeDrafts?: boolean } = {},
  ): Promise<ContentRepository> {
    const { includeDrafts = false } = options;
    const documents = await loadDocuments(contentRoot);
    const visible = includeDrafts
      ? documents
      : documents.filter((document) => document.status === "published");

    return new ContentRepository(new Map(visible.map((doc) => [doc.id, doc])));
  }

  private byType(type: string): ContentDocument[] {
    return [...this.byId.values()].filter((doc) => doc.type === type);
  }

  private toCard(
    document: ContentDocument | undefined,
    locale: Locale,
  ): EntityCard | null {
    if (!document) {
      return null;
    }
    return {
      id: document.id,
      slug: document.slug,
      type: document.type,
      title: localize(document.title, locale),
      subtitle: document.subtitle
        ? localize(document.subtitle, locale)
        : undefined,
      href: canonicalHref(document),
    };
  }

  private buildStandingView(
    standing: ContentDocument,
    locale: Locale,
  ): StandingView {
    const standingKind = standing.standingKind as "driver" | "constructor";

    return {
      ...(this.toCard(standing, locale) as EntityCard),
      kind: standingKind,
      defaultVisibleCount: standing.defaultVisibleCount as number | undefined,
      entries: (
        (standing.entries as Array<Record<string, unknown>> | undefined) ?? []
      ).map((entry) => ({
        position: entry.position as number,
        competitor: this.toCard(
          this.byId.get(entry.competitorId as string),
          locale,
        ),
        points: entry.points as number,
        wins: entry.wins as number | undefined,
      })),
    };
  }

  private buildSeasonView(season: ContentDocument, locale: Locale): SeasonView {
    const races = ((season.raceIds as string[] | undefined) ?? [])
      .map((raceId) => this.byId.get(raceId))
      .filter((race): race is ContentDocument => Boolean(race))
      .map((race) => ({
        ...(this.toCard(race, locale) as EntityCard),
        round: race.round as number,
        date: race.date as string,
        winner: this.toCard(
          this.byId.get(race.winnerPersonId as string),
          locale,
        ),
      }));

    const entrantCars = ((season.entrantCarIds as string[] | undefined) ?? [])
      .map((id) => this.toCard(this.byId.get(id), locale))
      .filter((card): card is EntityCard => Boolean(card));

    const featuredTechnologies = (
      (season.featuredTechnologyIds as string[] | undefined) ?? []
    )
      .map((id) => this.toCard(this.byId.get(id), locale))
      .filter((card): card is EntityCard => Boolean(card));

    const standings = ((season.standingIds as string[] | undefined) ?? [])
      .map((standingId) => this.byId.get(standingId))
      .filter((standing): standing is ContentDocument => Boolean(standing))
      .map((standing) => this.buildStandingView(standing, locale));

    const sources = ((season.sourceIds as string[] | undefined) ?? [])
      .map((sourceId) => this.toCard(this.byId.get(sourceId), locale))
      .filter((card): card is EntityCard => Boolean(card));

    return {
      id: season.id,
      slug: season.slug,
      year: season.year as number,
      title: localize(season.title, locale),
      summary: localize(season.summary, locale),
      highlighted: Boolean(season.highlighted),
      era: this.toCard(this.byId.get(season.eraId as string), locale),
      champion: this.toCard(
        this.byId.get(season.championPersonId as string),
        locale,
      ),
      championCar: this.toCard(
        this.byId.get(season.championCarId as string),
        locale,
      ),
      standings,
      races,
      entrantCars,
      featuredTechnologies,
      sources,
      blocks: season.blocks ?? [],
    };
  }

  async getTimeline(locale: Locale = "zh"): Promise<TimelineEntry[]> {
    return this.byType("season")
      .map((season) => ({
        id: season.id,
        slug: season.slug,
        year: season.year as number,
        title: localize(season.title, locale),
        highlighted: Boolean(season.highlighted),
        eraId: season.eraId as string,
      }))
      .sort((a, b) => a.year - b.year);
  }

  async getSeasonByYear(
    year: number,
    locale: Locale = "zh",
  ): Promise<SeasonView | null> {
    const season = this.byType("season").find((doc) => doc.year === year);
    return season ? this.buildSeasonView(season, locale) : null;
  }

  async getAdjacentSeasons(
    year: number,
    locale: Locale = "zh",
  ): Promise<AdjacentSeasons> {
    const timeline = await this.getTimeline(locale);
    const index = timeline.findIndex((entry) => entry.year === year);
    if (index === -1) {
      return {
        previous: null,
        next: null,
      };
    }

    const toSeasonCard = (
      entry: TimelineEntry | undefined,
    ): EntityCard | null => {
      if (!entry) {
        return null;
      }

      const season = this.byType("season").find((doc) => doc.id === entry.id);
      return this.toCard(season, locale);
    };

    return {
      previous: toSeasonCard(timeline[index - 1]),
      next: toSeasonCard(timeline[index + 1]),
    };
  }

  async getEntityBySlug(
    type: string,
    slug: string,
    locale: Locale = "zh",
  ): Promise<EntityView | null> {
    const document = this.byType(type).find((doc) => doc.slug === slug);
    if (!document) {
      return null;
    }

    const view: EntityView = {
      id: document.id,
      slug: document.slug,
      type: document.type,
      title: localize(document.title, locale),
      summary: localize(document.summary, locale),
      subtitle: document.subtitle
        ? localize(document.subtitle, locale)
        : undefined,
      blocks: document.blocks ?? [],
    };

    if (document.type === "season") {
      view.season = this.buildSeasonView(document, locale);
    }

    if (document.type === "person") {
      view.racesWon = this.byType("race")
        .filter((race) => race.winnerPersonId === document.id)
        .map((race) => this.toCard(race, locale))
        .filter((card): card is EntityCard => Boolean(card));
    }

    return view;
  }

  async listMuseum(
    type: "car" | "person" | "technology",
    _filters?: MuseumFilters,
    locale: Locale = "zh",
  ): Promise<EntityCard[]> {
    return this.byType(type)
      .map((doc) => this.toCard(doc, locale))
      .filter((card): card is EntityCard => Boolean(card));
  }

  async search(query: string, locale: Locale = "zh"): Promise<SearchResult[]> {
    const needle = query.trim().toLowerCase();
    if (!needle) {
      return [];
    }

    return [...this.byId.values()]
      .filter((document) => {
        const haystack = [
          document.title?.zh,
          document.title?.en,
          document.subtitle?.zh,
          document.subtitle?.en,
          ...((document.aliases as string[] | undefined) ?? []),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return haystack.includes(needle);
      })
      .map((document) => this.toCard(document, locale))
      .filter((card): card is EntityCard => Boolean(card));
  }
}
