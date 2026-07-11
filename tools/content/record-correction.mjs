import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

function usage() {
  return [
    "Usage: node tools/content/record-correction.mjs <entity-json-path> --reviewed-by <name> [--authored-by <name>] [--updated-at <iso-datetime>] [--dry-run]",
    "",
    "Example:",
    '  node tools/content/record-correction.mjs content/seasons/season-1988.json --reviewed-by "Content QA"',
  ].join("\n");
}

function parseArguments(argv) {
  const [targetPath, ...rest] = argv;
  if (!targetPath) {
    throw new Error(usage());
  }

  const options = {
    targetPath,
    reviewedBy: undefined,
    authoredBy: undefined,
    updatedAt: new Date().toISOString(),
    dryRun: false,
  };

  for (let index = 0; index < rest.length; index += 1) {
    const arg = rest[index];
    switch (arg) {
      case "--reviewed-by":
        options.reviewedBy = rest[++index];
        break;
      case "--authored-by":
        options.authoredBy = rest[++index];
        break;
      case "--updated-at":
        options.updatedAt = rest[++index];
        break;
      case "--dry-run":
        options.dryRun = true;
        break;
      default:
        throw new Error(`Unknown argument "${arg}"\n\n${usage()}`);
    }
  }

  if (!options.reviewedBy || !options.reviewedBy.trim()) {
    throw new Error(`Missing required --reviewed-by value.\n\n${usage()}`);
  }

  return options;
}

function applyCorrectionMetadata(document, options) {
  return {
    ...document,
    reviewedBy: options.reviewedBy.trim(),
    authoredBy: options.authoredBy?.trim() || document.authoredBy,
    updatedAt: options.updatedAt,
  };
}

export async function recordCorrectionMetadata(argv, cwd = process.cwd()) {
  const options = parseArguments(argv);
  const absolutePath = path.resolve(cwd, options.targetPath);
  const parsed = JSON.parse(await readFile(absolutePath, "utf8"));
  const updated = applyCorrectionMetadata(parsed, options);
  const output = `${JSON.stringify(updated, null, 2)}\n`;

  if (!options.dryRun) {
    await writeFile(absolutePath, output, "utf8");
  }

  return {
    absolutePath,
    document: updated,
    output,
    dryRun: options.dryRun,
  };
}

export async function main() {
  try {
    const result = await recordCorrectionMetadata(process.argv.slice(2));
    console.log(
      `${result.dryRun ? "Prepared" : "Updated"} correction metadata for ${result.absolutePath}`,
    );
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (invokedPath === path.resolve(new URL(import.meta.url).pathname)) {
  await main();
}
