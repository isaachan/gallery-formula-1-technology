import { access, readdir } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const requiredDirectories = [
  "cars",
  "circuits",
  "eras",
  "media",
  "people",
  "races",
  "seasons",
  "sources",
  "standings",
  "teams",
  "technologies",
];

export async function validateContentRoot(contentRoot) {
  const rootPath = path.resolve(contentRoot);
  const failures = [];

  try {
    await access(rootPath);
  } catch {
    failures.push(`Missing content root: ${rootPath}`);
    return failures;
  }

  for (const directory of requiredDirectories) {
    try {
      await access(path.join(rootPath, directory));
    } catch {
      failures.push(
        `Missing content directory: ${path.join(rootPath, directory)}`,
      );
    }
  }

  return failures;
}

export async function main() {
  const configuredRoot = process.env.CONTENT_ROOT ?? "content";
  const failures = await validateContentRoot(configuredRoot);

  if (failures.length > 0) {
    console.error("Content validation failed:");
    for (const failure of failures) {
      console.error(`- ${failure}`);
    }
    process.exitCode = 1;
    return;
  }

  const discovered = await readdir(configuredRoot);
  console.log(`Content validation passed for ${configuredRoot}.`);
  console.log(`Discovered ${discovered.length} top-level entries.`);
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (invokedPath === path.resolve(new URL(import.meta.url).pathname)) {
  await main();
}
