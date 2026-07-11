import path from "node:path";
import { cache } from "react";
import { ContentRepository } from "./content-repository";

function getContentRoot() {
  const configuredRoot = process.env.CONTENT_ROOT ?? "content";
  return path.isAbsolute(configuredRoot)
    ? configuredRoot
    : path.join(/* turbopackIgnore: true */ process.cwd(), configuredRoot);
}

export function shouldIncludeDrafts() {
  if (process.env.CONTENT_INCLUDE_DRAFTS === "true") {
    return true;
  }

  return process.env.VERCEL_ENV === "preview";
}

/** Memoized per-request so route handlers/pages share one loaded graph. */
export const getContentRepository = cache(async () => {
  return ContentRepository.load(getContentRoot(), {
    includeDrafts: shouldIncludeDrafts(),
  });
});
