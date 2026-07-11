"use server";

import { getContentRepository } from "@/content/get-repository";
import type { SearchResult } from "@/content/content-repository";

const SUBJECT_TYPES = new Set([
  "season",
  "car",
  "person",
  "technology",
  "team",
  "era",
]);

export async function searchMuseum(query: string): Promise<SearchResult[]> {
  const repository = await getContentRepository();
  const results = await repository.search(query);
  return results.filter((result) => SUBJECT_TYPES.has(result.type));
}
