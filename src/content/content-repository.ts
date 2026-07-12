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
  timelineHref?: string;
};

export type TimelineEntry = {
  id: string;
  slug: string;
  year: number;
  title: string;
  highlighted: boolean;
  eraId: string;
  championName?: string;
  championCar?: string;
  tag?: string;
  badge?: string;
  corner?: string;
};

export type SeasonEntrantCar = EntityCard & {
  constructorTitle?: string;
  driverTitle?: string;
  teamSlug?: string;
};

export type TechnologyFormat = "animation" | "diagram" | "model3d" | "article";

export type TechnologyCard = EntityCard & {
  format: TechnologyFormat;
};

export type RaceView = EntityCard & {
  round: number;
  date: string;
  winner: EntityCard | null;
  winnerCar: EntityCard | null;
  circuit: EntityCard | null;
  countryCode?: string;
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
  championCar: SeasonEntrantCar | null;
  standings: StandingView[];
  races: RaceView[];
  entrantCars: SeasonEntrantCar[];
  featuredTechnologies: TechnologyCard[];
  sources: EntityCard[];
  blocks: unknown[];
};

export type AdjacentSeasons = {
  previous: EntityCard | null;
  next: EntityCard | null;
};

export type CarView = {
  engine: string;
  wins?: number;
  specifications: Record<string, LocaleText>;
  constructor: EntityCard | null;
  drivers: EntityCard[];
  seasons: EntityCard[];
  technologies: EntityCard[];
  representativeSeason: EntityCard | null;
};

export type PersonView = {
  personKind: string;
  nationality?: string;
  activeYears?: { from: number; to?: number };
  championshipYears: number[];
  teams: EntityCard[];
  cars: EntityCard[];
  representativeSeasons: EntityCard[];
};

export type TechnologyView = {
  category: string;
  difficulty: string;
  relatedCars: EntityCard[];
  relatedSeasons: EntityCard[];
  relatedTechnologies: EntityCard[];
  representativeSeason: EntityCard | null;
};

export type TeamView = {
  teamKind: string;
  baseCountryCode?: string;
  people: EntityCard[];
  cars: EntityCard[];
  seasons: EntityCard[];
};

export type EntityView = {
  id: string;
  slug: string;
  type: string;
  title: string;
  summary: string;
  subtitle?: string;
  blocks: unknown[];
  sources: EntityCard[];
  season?: SeasonView;
  /** Races this person won, derived from race.winnerPersonId (not stored on the person document itself). */
  racesWon?: EntityCard[];
  car?: CarView;
  person?: PersonView;
  technology?: TechnologyView;
  team?: TeamView;
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
    // mediaAsset documents have no lifecycle/status field of their own (see
    // src/domain/media-entities.mjs) — their visibility follows whatever
    // entity references them, so they are never filtered out here.
    const visible = includeDrafts
      ? documents
      : documents.filter(
          (document) =>
            document.type === "mediaAsset" || document.status === "published",
        );

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

  /**
   * The prototype shows a format badge (▶ animation / 🔍 diagram / 🧊 3D /
   * 📖 article) on each technology card, derived from which content-block
   * type the technology actually carries. Most breadth-first-authored
   * technologies only have a plain summary (no blocks), which correctly
   * falls back to "article".
   */
  private technologyFormat(
    document: ContentDocument | undefined,
  ): TechnologyFormat {
    const blocks =
      (document?.blocks as Array<{ type?: string }> | undefined) ?? [];
    if (blocks.some((block) => block.type === "animation")) {
      return "animation";
    }
    if (blocks.some((block) => block.type === "diagram")) {
      return "diagram";
    }
    if (blocks.some((block) => block.type === "model3d")) {
      return "model3d";
    }
    return "article";
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

  private resolveEntrantCar(
    carId: string | undefined,
    locale: Locale,
  ): SeasonEntrantCar | null {
    const carDoc = this.byId.get(carId as string);
    const card = this.toCard(carDoc, locale);
    if (!card) {
      return null;
    }
    const constructorDoc = this.byId.get(carDoc?.constructorId as string);
    const driverDoc = this.byId.get(
      (carDoc?.driverIds as string[] | undefined)?.[0] as string,
    );
    return {
      ...card,
      constructorTitle: constructorDoc
        ? localize(constructorDoc.title, locale)
        : undefined,
      driverTitle: driverDoc ? localize(driverDoc.title, locale) : undefined,
      teamSlug: constructorDoc?.slug as string | undefined,
    };
  }

  private buildSeasonView(season: ContentDocument, locale: Locale): SeasonView {
    const races = ((season.raceIds as string[] | undefined) ?? [])
      .map((raceId) => this.byId.get(raceId))
      .filter((race): race is ContentDocument => Boolean(race))
      .map((race) => {
        const circuit = this.byId.get(race.circuitId as string);
        return {
          ...(this.toCard(race, locale) as EntityCard),
          round: race.round as number,
          date: race.date as string,
          winner: this.toCard(
            this.byId.get(race.winnerPersonId as string),
            locale,
          ),
          winnerCar: this.toCard(
            this.byId.get(race.winnerCarId as string),
            locale,
          ),
          circuit: this.toCard(circuit, locale),
          countryCode: circuit?.countryCode as string | undefined,
        };
      });

    const entrantCars = ((season.entrantCarIds as string[] | undefined) ?? [])
      .map((id) => this.resolveEntrantCar(id, locale))
      .filter((card): card is SeasonEntrantCar => Boolean(card));

    const featuredTechnologies = (
      (season.featuredTechnologyIds as string[] | undefined) ?? []
    )
      .map((id) => {
        const document = this.byId.get(id);
        const card = this.toCard(document, locale);
        return card
          ? { ...card, format: this.technologyFormat(document) }
          : null;
      })
      .filter((card): card is TechnologyCard => Boolean(card));

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
      championCar: this.resolveEntrantCar(
        season.championCarId as string,
        locale,
      ),
      standings,
      races,
      entrantCars,
      featuredTechnologies,
      sources,
      blocks: this.resolveBlocks((season.blocks as unknown[]) ?? []),
    };
  }

  async getTimeline(locale: Locale = "zh"): Promise<TimelineEntry[]> {
    return this.byType("season")
      .map((season) => {
        const highlighted = Boolean(season.highlighted);
        const headline = season.timelineHeadline as LocaleText | undefined;
        const champion = this.byId.get(season.championPersonId as string);
        const championCar = this.byId.get(season.championCarId as string);
        const firstTechId = (
          season.featuredTechnologyIds as string[] | undefined
        )?.[0];
        const technology = firstTechId ? this.byId.get(firstTechId) : undefined;

        return {
          id: season.id,
          slug: season.slug,
          year: season.year as number,
          title: highlighted
            ? localize(headline, locale) || localize(season.title, locale)
            : localize(season.title, locale),
          highlighted,
          eraId: season.eraId as string,
          championName: champion ? localize(champion.title, locale) : undefined,
          championCar: championCar
            ? localize(championCar.title, locale)
            : undefined,
          tag: technology ? localize(technology.title, locale) : undefined,
          badge: highlighted
            ? localize(season.timelineBadge as LocaleText | undefined, locale)
            : undefined,
          corner: highlighted
            ? (season.timelineCorner as string | undefined)
            : undefined,
        };
      })
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

  /**
   * Stored content blocks reference media/entities by id (`mediaId`,
   * `mediaIds`, `entityIds`) so the schema can validate them against the
   * graph. The block registry renders a denormalized shape instead (an
   * inline `media` object, resolved `entity` summaries) for convenience.
   * This bridges the two: it never mutates fields the renderer doesn't
   * care about, and an unresolvable reference is simply dropped so the
   * renderer's own per-block/per-item fallback handles it.
   */
  private resolveMediaLike(mediaId: string | undefined) {
    if (!mediaId) {
      return undefined;
    }
    const asset = this.byId.get(mediaId);
    if (!asset) {
      return undefined;
    }
    return {
      id: asset.id,
      alt: asset.alt as LocaleText,
      src: asset.src as string,
      variants: asset.variants as unknown[] | undefined,
      caption: asset.caption as LocaleText | undefined,
      credit: asset.credit as string | undefined,
      focalPoint: asset.focalPoint as { x: number; y: number } | undefined,
    };
  }

  private resolvePosterSrc(mediaId: string | undefined): string | undefined {
    if (!mediaId) {
      return undefined;
    }
    return this.byId.get(mediaId)?.src as string | undefined;
  }

  private resolveEntitySummary(entityId: string) {
    const document = this.byId.get(entityId);
    if (!document) {
      return undefined;
    }
    return {
      id: document.id,
      entityType: document.type,
      title: document.title as LocaleText,
      subtitle: document.subtitle as LocaleText | undefined,
      href: canonicalHref(document),
    };
  }

  private resolveBlocks(blocks: unknown[]): unknown[] {
    return blocks.map((raw) => {
      const block = raw as Record<string, unknown>;
      const base = {
        id: block.id,
        type: block.type,
        heading: block.heading,
        sourceIds: block.sourceIds,
      };

      switch (block.type) {
        case "richText":
          return { ...base, content: block.content };
        case "quote":
          return {
            ...base,
            quote: block.quote,
            attribution: block.attribution,
          };
        case "factGrid":
          return { ...base, items: block.items };
        case "image":
          return {
            ...base,
            layout: block.layout,
            media: this.resolveMediaLike(block.mediaId as string),
          };
        case "diagram":
          return {
            ...base,
            layout: block.layout,
            media: this.resolveMediaLike(block.mediaId as string),
            explanation: block.explanation,
          };
        case "gallery":
          return {
            ...base,
            items: ((block.mediaIds as string[] | undefined) ?? []).map(
              (mediaId) => ({ media: this.resolveMediaLike(mediaId) }),
            ),
          };
        case "animation":
        case "video": {
          const asset = this.byId.get(block.mediaId as string);
          const media = asset
            ? {
                id: asset.id,
                alt: asset.alt as LocaleText,
                videoSrc: asset.src as string,
                posterSrc: this.resolvePosterSrc(
                  asset.posterMediaId as string | undefined,
                ),
                credit: asset.credit as string | undefined,
              }
            : undefined;
          return {
            ...base,
            media,
            explanation: block.explanation,
            transcript: block.transcript,
          };
        }
        case "audio":
          return {
            ...base,
            media: this.resolveMediaLike(block.mediaId as string),
            transcript: block.transcript,
          };
        case "model3d": {
          const asset = this.byId.get(block.mediaId as string);
          const media = asset
            ? {
                id: asset.id,
                alt: asset.alt as LocaleText,
                modelSrc: asset.src as string,
                posterSrc: this.resolvePosterSrc(
                  asset.posterMediaId as string | undefined,
                ),
                credit: asset.credit as string | undefined,
              }
            : undefined;
          return {
            ...base,
            media,
            description: block.description,
            initialCamera: block.initialCamera,
            interaction: block.interaction,
          };
        }
        case "relatedEntities":
          return {
            ...base,
            items: ((block.entityIds as string[] | undefined) ?? []).map(
              (entityId) => ({
                entityId,
                entity: this.resolveEntitySummary(entityId),
              }),
            ),
          };
        default:
          return base;
      }
    });
  }

  private cardsFor(ids: string[] | undefined, locale: Locale): EntityCard[] {
    return (ids ?? [])
      .map((id) => this.toCard(this.byId.get(id), locale))
      .filter((card): card is EntityCard => Boolean(card));
  }

  private representativeSeasonCard(
    seasonId: string | undefined,
    fallbackSeasonIds: string[] | undefined,
    locale: Locale,
  ): EntityCard | null {
    const id = seasonId ?? fallbackSeasonIds?.[0];
    return id ? this.toCard(this.byId.get(id), locale) : null;
  }

  private buildCarView(document: ContentDocument, locale: Locale): CarView {
    const seasonIds = document.seasonIds as string[] | undefined;
    return {
      engine: document.engine as string,
      wins: document.wins as number | undefined,
      specifications:
        (document.specifications as Record<string, LocaleText>) ?? {},
      constructor: this.toCard(
        this.byId.get(document.constructorId as string),
        locale,
      ),
      drivers: this.cardsFor(
        document.driverIds as string[] | undefined,
        locale,
      ),
      seasons: this.cardsFor(seasonIds, locale),
      technologies: this.cardsFor(
        document.technologyIds as string[] | undefined,
        locale,
      ),
      representativeSeason: this.representativeSeasonCard(
        undefined,
        seasonIds,
        locale,
      ),
    };
  }

  private buildPersonView(
    document: ContentDocument,
    locale: Locale,
  ): PersonView {
    const cars = this.byType("car")
      .filter((car) =>
        ((car.driverIds as string[] | undefined) ?? []).includes(document.id),
      )
      .map((car) => this.toCard(car, locale))
      .filter((card): card is EntityCard => Boolean(card));

    return {
      personKind: document.personKind as string,
      nationality: document.nationality as string | undefined,
      activeYears: document.activeYears as
        | { from: number; to?: number }
        | undefined,
      championshipYears:
        (document.championshipYears as number[] | undefined) ?? [],
      teams: this.cardsFor(document.teamIds as string[] | undefined, locale),
      cars,
      representativeSeasons: this.cardsFor(
        document.representativeSeasonIds as string[] | undefined,
        locale,
      ),
    };
  }

  private buildTechnologyView(
    document: ContentDocument,
    locale: Locale,
  ): TechnologyView {
    const carIds = (document.carIds as string[] | undefined) ?? [];
    const relatedTechnologies = this.byType("technology")
      .filter(
        (technology) =>
          technology.id !== document.id &&
          ((technology.carIds as string[] | undefined) ?? []).some((id) =>
            carIds.includes(id),
          ),
      )
      .map((technology) => this.toCard(technology, locale))
      .filter((card): card is EntityCard => Boolean(card));

    return {
      category: document.category as string,
      difficulty: document.difficulty as string,
      relatedCars: this.cardsFor(carIds, locale),
      relatedSeasons: this.cardsFor(
        document.seasonIds as string[] | undefined,
        locale,
      ),
      relatedTechnologies,
      representativeSeason: this.representativeSeasonCard(
        document.firstSeasonId as string | undefined,
        document.seasonIds as string[] | undefined,
        locale,
      ),
    };
  }

  private buildTeamView(document: ContentDocument, locale: Locale): TeamView {
    return {
      teamKind: document.teamKind as string,
      baseCountryCode: document.baseCountryCode as string | undefined,
      people: this.cardsFor(document.personIds as string[] | undefined, locale),
      cars: this.cardsFor(document.carIds as string[] | undefined, locale),
      seasons: this.cardsFor(
        document.seasonIds as string[] | undefined,
        locale,
      ),
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
      blocks: this.resolveBlocks((document.blocks as unknown[]) ?? []),
      sources: this.cardsFor(
        document.sourceIds as string[] | undefined,
        locale,
      ),
    };

    if (document.type === "season") {
      view.season = this.buildSeasonView(document, locale);
    }

    if (document.type === "person") {
      view.racesWon = this.byType("race")
        .filter((race) => race.winnerPersonId === document.id)
        .map((race) => this.toCard(race, locale))
        .filter((card): card is EntityCard => Boolean(card));
      view.person = this.buildPersonView(document, locale);
    }

    if (document.type === "car") {
      view.car = this.buildCarView(document, locale);
    }

    if (document.type === "technology") {
      view.technology = this.buildTechnologyView(document, locale);
    }

    if (document.type === "team") {
      view.team = this.buildTeamView(document, locale);
    }

    return view;
  }

  private timelineHrefFor(document: ContentDocument): string | undefined {
    const seasonId = (() => {
      switch (document.type) {
        case "car":
          return (document.seasonIds as string[] | undefined)?.[0];
        case "person":
          return (
            document.representativeSeasonIds as string[] | undefined
          )?.[0];
        case "technology":
          return (
            (document.firstSeasonId as string | undefined) ??
            (document.seasonIds as string[] | undefined)?.[0]
          );
        default:
          return undefined;
      }
    })();

    const season = seasonId ? this.byId.get(seasonId) : undefined;
    return typeof season?.year === "number"
      ? `/?year=${season.year}`
      : undefined;
  }

  private toMuseumCard(
    document: ContentDocument,
    locale: Locale,
  ): EntityCard | null {
    const card = this.toCard(document, locale);
    if (!card) {
      return null;
    }
    return { ...card, timelineHref: this.timelineHrefFor(document) };
  }

  async listMuseum(
    type: "car" | "person" | "technology",
    _filters?: MuseumFilters,
    locale: Locale = "zh",
  ): Promise<EntityCard[]> {
    return this.byType(type)
      .map((doc) => this.toMuseumCard(doc, locale))
      .filter((card): card is EntityCard => Boolean(card));
  }

  private static readonly RELATIONSHIP_ID_FIELDS = [
    "constructorId",
    "championPersonId",
    "championCarId",
    "eraId",
    "firstSeasonId",
  ];

  private static readonly RELATIONSHIP_ID_LIST_FIELDS = [
    "driverIds",
    "technologyIds",
    "seasonIds",
    "teamIds",
    "personIds",
    "carIds",
    "representativeSeasonIds",
  ];

  private relationshipSearchTerms(document: ContentDocument): string[] {
    const referencedIds = [
      ...ContentRepository.RELATIONSHIP_ID_FIELDS.map(
        (field) => document[field] as string | undefined,
      ),
      ...ContentRepository.RELATIONSHIP_ID_LIST_FIELDS.flatMap(
        (field) => (document[field] as string[] | undefined) ?? [],
      ),
    ].filter((id): id is string => Boolean(id));

    return referencedIds
      .map((id) => this.byId.get(id))
      .flatMap((referenced) =>
        referenced ? [referenced.title?.zh, referenced.title?.en] : [],
      )
      .filter((title): title is string => Boolean(title));
  }

  private yearSearchTerms(document: ContentDocument): string[] {
    const years: Array<number | undefined> = [
      document.year as number | undefined,
      ...((document.championshipYears as number[] | undefined) ?? []),
    ];
    const activeYears = document.activeYears as
      | { from?: number; to?: number }
      | undefined;
    if (activeYears) {
      years.push(activeYears.from, activeYears.to);
    }

    return years
      .filter((year): year is number => typeof year === "number")
      .map((year) => String(year));
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
          ...this.relationshipSearchTerms(document),
          ...this.yearSearchTerms(document),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return haystack.includes(needle);
      })
      .map((document) => this.toMuseumCard(document, locale))
      .filter((card): card is EntityCard => Boolean(card));
  }
}
