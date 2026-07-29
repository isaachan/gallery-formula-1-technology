import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { promisify } from "node:util";

export const BUILD_MANIFEST_SCHEMA_VERSION = 1;

const execFileAsync = promisify(execFile);

function requireNonEmptyString(value, field) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${field} must be a non-empty string`);
  }
  return value;
}

function resolveBuiltAt(now) {
  const value = typeof now === "function" ? now() : now;
  if (value instanceof Date) {
    return value.toISOString();
  }
  return requireNonEmptyString(value, "builtAt");
}

export function createBuildManifest(
  {
    appVersion,
    contentVersion,
    commit,
    builtAt,
    clock,
    contentPackId,
    graphVersion,
    mediaManifestVersion,
  },
  now = clock ?? builtAt ?? (() => new Date()),
) {
  return {
    schemaVersion: BUILD_MANIFEST_SCHEMA_VERSION,
    appVersion: requireNonEmptyString(appVersion, "appVersion"),
    contentVersion: requireNonEmptyString(contentVersion, "contentVersion"),
    buildCommit: requireNonEmptyString(commit, "commit"),
    builtAt: resolveBuiltAt(now),
    contentPackId: requireNonEmptyString(contentPackId, "contentPackId"),
    graphVersion: requireNonEmptyString(graphVersion, "graphVersion"),
    mediaManifestVersion: requireNonEmptyString(
      mediaManifestVersion,
      "mediaManifestVersion",
    ),
  };
}

export async function writeBuildManifest(outputPath, manifest) {
  await mkdir(path.dirname(path.resolve(outputPath)), { recursive: true });
  await writeFile(
    path.resolve(outputPath),
    `${JSON.stringify(manifest, null, 2)}\n`,
    "utf8",
  );
}

async function collectFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(directory, entry.name);
      return entry.isDirectory()
        ? collectFiles(entryPath)
        : entry.name === ".gitkeep"
          ? []
          : [entryPath];
    }),
  );
  return files.flat().sort();
}

async function computeContentVersion(contentRoot) {
  const hash = createHash("sha256");
  for (const filePath of await collectFiles(contentRoot)) {
    hash.update(path.relative(contentRoot, filePath));
    hash.update(await readFile(filePath));
  }
  return hash.digest("hex").slice(0, 12);
}

async function resolveBuildCommit() {
  const configured =
    process.env.BUILD_COMMIT ??
    process.env.GITHUB_SHA ??
    process.env.VERCEL_GIT_COMMIT_SHA;
  if (configured) {
    return configured;
  }
  const { stdout } = await execFileAsync("git", ["rev-parse", "HEAD"]);
  return stdout.trim();
}

export async function main() {
  const packageJson = JSON.parse(
    await readFile(path.resolve("package.json"), "utf8"),
  );
  const contentRoot = path.resolve(process.env.CONTENT_ROOT ?? "content");
  const contentVersion =
    process.env.CONTENT_VERSION ?? (await computeContentVersion(contentRoot));
  const manifest = createBuildManifest(
    {
      appVersion: process.env.APP_VERSION ?? packageJson.version,
      contentVersion,
      commit: await resolveBuildCommit(),
      contentPackId:
        process.env.CONTENT_PACK_ID ?? `bundled-${contentVersion}`,
      graphVersion: process.env.GRAPH_VERSION ?? "1",
      mediaManifestVersion: process.env.MEDIA_MANIFEST_VERSION ?? "1",
    },
    process.env.BUILD_TIMESTAMP ?? (() => new Date()),
  );

  const outputPath = path.resolve(
    process.env.BUILD_MANIFEST_OUT ?? "public/build-manifest.json",
  );
  await writeBuildManifest(outputPath, manifest);
  console.log(`Wrote build manifest -> ${outputPath}`);
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (invokedPath === path.resolve(new URL(import.meta.url).pathname)) {
  await main();
}
