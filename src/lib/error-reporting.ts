import { defaultStaticAssetResolver } from "@/lib/static-asset-resolver";

export type RuntimeBuildManifest = {
  schemaVersion: number;
  appVersion: string;
  contentVersion: string;
  buildCommit: string;
  builtAt: string;
  contentPackId: string;
  graphVersion: string;
  mediaManifestVersion: string;
};

const BUILD_MANIFEST_SCHEMA_VERSION = 1;
let injectedBuildManifest: RuntimeBuildManifest | null = null;
let buildManifestPromise: Promise<RuntimeBuildManifest> | null = null;
export type BuildManifestProvider = () =>
  | RuntimeBuildManifest
  | Promise<RuntimeBuildManifest>;

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function parseBuildManifest(value: unknown): RuntimeBuildManifest {
  const candidate = value as Partial<RuntimeBuildManifest> | null;
  if (candidate?.schemaVersion !== BUILD_MANIFEST_SCHEMA_VERSION) {
    throw new Error(
      `Unsupported build manifest schema version: ${String(candidate?.schemaVersion)}`,
    );
  }

  const stringFields = [
    "appVersion",
    "contentVersion",
    "buildCommit",
    "builtAt",
    "contentPackId",
    "graphVersion",
    "mediaManifestVersion",
  ] as const;
  for (const field of stringFields) {
    if (!isNonEmptyString(candidate[field])) {
      throw new Error(`Build manifest ${field} must be a non-empty string`);
    }
  }

  return candidate as RuntimeBuildManifest;
}

const defaultBuildManifestProvider: BuildManifestProvider = async () => {
  const response = await fetch(
    defaultStaticAssetResolver.resolve("build-manifest.json"),
  );
  if (!response.ok) {
    throw new Error(
      `Build manifest request failed with status ${response.status}`,
    );
  }
  return parseBuildManifest(await response.json());
};

let buildManifestProvider: BuildManifestProvider = defaultBuildManifestProvider;

async function loadBuildManifest(): Promise<RuntimeBuildManifest> {
  if (injectedBuildManifest) {
    return injectedBuildManifest;
  }
  if (!buildManifestPromise) {
    buildManifestPromise = Promise.resolve(buildManifestProvider()).then(
      parseBuildManifest,
    );
  }
  return buildManifestPromise;
}

export function setBuildManifestProvider(
  provider: BuildManifestProvider,
): void {
  injectedBuildManifest = null;
  buildManifestProvider = provider;
  buildManifestPromise = null;
}

export function setBuildManifest(manifest: RuntimeBuildManifest): void {
  injectedBuildManifest = parseBuildManifest(manifest);
  buildManifestPromise = Promise.resolve(injectedBuildManifest);
}

export function resetBuildManifest(): void {
  injectedBuildManifest = null;
  buildManifestProvider = defaultBuildManifestProvider;
  buildManifestPromise = null;
}

export type RendererFailureContext = {
  kind: "image" | "audio" | "video" | "animation" | "model3d";
  blockId?: string;
  mediaId?: string;
  message?: string;
};

export type RouteErrorContext = {
  routeFamily:
    | "home"
    | "museum"
    | "season"
    | "car"
    | "person"
    | "technology"
    | "team"
    | "root-layout"
    | "unknown";
  entityId?: string;
  digest?: string;
  message: string;
};

function manifestReportFields(manifest: RuntimeBuildManifest) {
  return {
    schemaVersion: manifest.schemaVersion,
    appVersion: manifest.appVersion,
    contentVersion: manifest.contentVersion,
    buildCommit: manifest.buildCommit,
    builtAt: manifest.builtAt,
    contentPackId: manifest.contentPackId,
    graphVersion: manifest.graphVersion,
    mediaManifestVersion: manifest.mediaManifestVersion,
  };
}

function reportManifestFailure(label: string, error: unknown): void {
  console.error(label, {
    manifestStatus: "unavailable",
    manifestError:
      error instanceof Error ? error.name : "UnknownBuildManifestError",
  });
}

/**
 * Local-only structured renderer diagnostics. Values are copied field by
 * field so callers cannot accidentally add search text, feedback drafts,
 * personal identifiers, URLs, page content, or another unreviewed field.
 */
export function reportRendererFailure(context: RendererFailureContext): void {
  void loadBuildManifest().then(
    (manifest) => {
      console.error("[renderer-failure]", {
        kind: context.kind,
        ...(context.blockId ? { blockId: context.blockId } : {}),
        ...(context.mediaId ? { mediaId: context.mediaId } : {}),
        ...(context.message ? { message: context.message } : {}),
        ...manifestReportFields(manifest),
      });
    },
    (error: unknown) => reportManifestFailure("[renderer-failure]", error),
  );
}

/**
 * Local-only structured route diagnostics. Raw paths and URLs are deliberately
 * excluded; callers provide a finite route family and optional stable ID.
 */
export function reportRouteError(context: RouteErrorContext): void {
  void loadBuildManifest().then(
    (manifest) => {
      console.error("[route-error]", {
        routeFamily: context.routeFamily,
        ...(context.entityId ? { entityId: context.entityId } : {}),
        ...(context.digest ? { digest: context.digest } : {}),
        message: context.message,
        ...manifestReportFields(manifest),
      });
    },
    (error: unknown) => reportManifestFailure("[route-error]", error),
  );
}
