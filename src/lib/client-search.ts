import type { SearchResult } from "@/content/content-repository";

type SearchIndexEntry = SearchResult & { haystack: string };

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
): Promise<SearchResult[]> {
  const needle = query.trim().toLowerCase();
  if (!needle) return [];

  const index = await getIndex();
  return index
    .filter((entry) => entry.haystack.includes(needle))
    .map(({ haystack: _haystack, ...card }) => card);
}

function getIndex(): Promise<SearchIndexEntry[]> {
  if (!indexPromise) {
    indexPromise = fetch("search-index.json")
      .then((response) => response.json() as Promise<SearchIndexEntry[]>)
      .catch(() => [] as SearchIndexEntry[]);
  }
  return indexPromise;
}
