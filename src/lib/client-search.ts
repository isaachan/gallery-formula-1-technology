import type { SearchResult } from "@/content/content-repository";
import {
  defaultStaticAssetResolver,
  type StaticAssetResolver,
} from "@/lib/static-asset-resolver";

type SearchIndexEntry = SearchResult & { haystack: string };

type SearchIndexArtifact = {
  schemaVersion: number;
  entries: SearchIndexEntry[];
};

export type SearchIndexLoadOptions = {
  assetResolver?: StaticAssetResolver;
  fetcher?: typeof fetch;
};

const SEARCH_INDEX_SCHEMA_VERSION = 1;
let indexPromise: Promise<SearchIndexEntry[]> | null = null;

/**
 * Lazily fetches the precomputed search index (generated at build time by
 * tools/content/build-search-index.mjs into public/search-index.json) and
 * substring-matches the query against each entry's haystack.
 *
 * Replaces the old server action (`searchMuseum`) so the museum search works
 * fully client-side under static export / offline hosting.
 */
export async function searchMuseumClient(
  query: string,
  options: SearchIndexLoadOptions = {},
): Promise<SearchResult[]> {
  const needle = query.trim().toLowerCase();
  if (!needle) return [];

  const index = await getIndex(options);
  return index
    .filter((entry) => entry.haystack.includes(needle))
    .map((entry) => {
      const card = { ...entry } as SearchResult & { haystack?: string };
      delete card.haystack;
      return card;
    });
}

export function clearSearchIndexCache(): void {
  indexPromise = null;
}

export function retrySearchMuseumClient(
  query: string,
  options: SearchIndexLoadOptions = {},
): Promise<SearchResult[]> {
  clearSearchIndexCache();
  return searchMuseumClient(query, options);
}

function validateSearchIndexArtifact(value: unknown): SearchIndexEntry[] {
  const artifact = value as Partial<SearchIndexArtifact> | null;
  if (artifact?.schemaVersion !== SEARCH_INDEX_SCHEMA_VERSION) {
    throw new Error(
      `Unsupported search index schema version: ${String(artifact?.schemaVersion)}`,
    );
  }
  if (!Array.isArray(artifact.entries)) {
    throw new Error("Search index entries must be an array");
  }

  artifact.entries.forEach((entry, index) => {
    if (
      !entry ||
      typeof entry !== "object" ||
      typeof entry.id !== "string" ||
      typeof entry.slug !== "string" ||
      typeof entry.type !== "string" ||
      typeof entry.title !== "string" ||
      typeof entry.haystack !== "string"
    ) {
      throw new Error(`Search index entry ${index} is invalid`);
    }
  });

  return artifact.entries;
}

function getIndex(
  options: SearchIndexLoadOptions,
): Promise<SearchIndexEntry[]> {
  if (!indexPromise) {
    const resolver = options.assetResolver ?? defaultStaticAssetResolver;
    const fetcher = options.fetcher ?? fetch;
    indexPromise = fetcher(resolver.resolve("search-index.json")).then(
      async (response) => {
        if (!response.ok) {
          throw new Error(
            `Search index request failed with status ${response.status}`,
          );
        }
        return validateSearchIndexArtifact(await response.json());
      },
    );
  }
  return indexPromise;
}
