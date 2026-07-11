type Diagnostics = { appVersion: string; contentVersion: string };

let cachedDiagnostics: Diagnostics | null = null;
let diagnosticsPromise: Promise<Diagnostics> | null = null;

function getDiagnostics(): Promise<Diagnostics> {
  if (cachedDiagnostics) {
    return Promise.resolve(cachedDiagnostics);
  }
  if (!diagnosticsPromise) {
    diagnosticsPromise = fetch("/api/diagnostics")
      .then((response) => response.json())
      .then((data: Diagnostics) => {
        cachedDiagnostics = data;
        return data;
      })
      .catch(() => ({ appVersion: "unknown", contentVersion: "unknown" }));
  }
  return diagnosticsPromise;
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
