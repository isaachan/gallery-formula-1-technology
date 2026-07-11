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

export type SeasonView = {
  id: string;
  slug: string;
  year: number;
  title: string;
  summary: string;
  highlighted: boolean;
  champion: EntityCard | null;
  championCar: EntityCard | null;
  races: RaceView[];
  entrantCars: EntityCard[];
  featuredTechnologies: EntityCard[];
  blocks: unknown[];
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

    return {
      id: season.id,
      slug: season.slug,
      year: season.year as number,
      title: localize(season.title, locale),
      summary: localize(season.summary, locale),
      highlighted: Boolean(season.highlighted),
      champion: this.toCard(
        this.byId.get(season.championPersonId as string),
        locale,
      ),
      championCar: this.toCard(
        this.byId.get(season.championCarId as string),
        locale,
      ),
      races,
      entrantCars,
      featuredTechnologies,
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
