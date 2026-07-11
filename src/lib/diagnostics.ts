import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

type BuildDiagnostics = {
  appVersion: string;
  contentVersion: string;
  gitSha: string;
  generatedAt: string;
};

function getContentRoot() {
  const configuredRoot = process.env.CONTENT_ROOT ?? "content";
  return path.isAbsolute(configuredRoot)
    ? configuredRoot
    : path.join(/* turbopackIgnore: true */ process.cwd(), configuredRoot);
}

async function collectFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        return collectFiles(entryPath);
      }

      if (entry.name === ".gitkeep") {
        return [];
      }

      return [entryPath];
    }),
  );

  return files.flat().sort();
}

export async function computeContentVersion() {
  const hash = createHash("sha256");
  const contentRoot = getContentRoot();
  const files = await collectFiles(contentRoot);

  for (const filePath of files) {
    const relativePath = path.relative(contentRoot, filePath);
    hash.update(relativePath);
    hash.update(await readFile(filePath));
  }

  return hash.digest("hex").slice(0, 12);
}

export async function getBuildDiagnostics(): Promise<BuildDiagnostics> {
  const packageJsonPath = path.join(
    /* turbopackIgnore: true */ process.cwd(),
    "package.json",
  );
  const packageJson = JSON.parse(await readFile(packageJsonPath, "utf8")) as {
    version?: string;
  };

  const appVersion = process.env.APP_VERSION ?? packageJson.version ?? "0.0.0";
  const gitSha =
    process.env.VERCEL_GIT_COMMIT_SHA ??
    process.env.GITHUB_SHA ??
    process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA ??
    "development";
  const contentVersion =
    process.env.CONTENT_VERSION ?? (await computeContentVersion());

  return {
    appVersion,
    contentVersion,
    gitSha: gitSha.slice(0, 12),
    generatedAt: new Date().toISOString(),
  };
}
