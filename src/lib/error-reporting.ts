type Diagnostics = { appVersion: string; contentVersion: string };

// The app is now a static export with no runtime server, so there is no
// /api/diagnostics endpoint to fetch. Version detail is baked into each page
// at build time instead; renderer/route error reports fall back to "static".
const STATIC_DIAGNOSTICS: Diagnostics = {
  appVersion: "static",
  contentVersion: "static",
};

function getDiagnostics(): Promise<Diagnostics> {
  return Promise.resolve(STATIC_DIAGNOSTICS);
}

export type RendererFailureContext = {
  kind: "image" | "audio" | "video" | "animation" | "model3d";
  blockId?: string;
  mediaId?: string;
  message?: string;
};

/**
 * The operational sink for media-renderer failures. There is no APM/error
 * tracker wired up yet, so this logs a structured, non-personal report to
 * the console with diagnostic versions attached (US-H03.1/US-H03.2) — swap
 * the console.error for a real reporting SDK call without touching callers.
 */
export function reportRendererFailure(context: RendererFailureContext): void {
  void getDiagnostics().then((diagnostics) => {
    console.error("[renderer-failure]", { ...context, ...diagnostics });
  });
}

export type RouteErrorContext = {
  route: string;
  digest?: string;
  message: string;
};

export function reportRouteError(context: RouteErrorContext): void {
  void getDiagnostics().then((diagnostics) => {
    console.error("[route-error]", { ...context, ...diagnostics });
  });
}
