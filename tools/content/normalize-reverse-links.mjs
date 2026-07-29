import { readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import {
  collectContentReferences,
  reverseReferenceRules,
} from "../../src/domain/content-reference-contract.mjs";

async function collectJsonFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const discovered = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        return collectJsonFiles(entryPath);
      }
      return entry.name.endsWith(".json") ? [entryPath] : [];
    }),
  );
  return discovered.flat().sort();
}

function stringTokenEnd(source, start) {
  for (let index = start + 1; index < source.length; index += 1) {
    if (source[index] === "\\") {
      index += 1;
    } else if (source[index] === '"') {
      return index;
    }
  }
  throw new Error("Unterminated JSON string");
}

function arrayTokenEnd(source, start) {
  let depth = 0;
  for (let index = start; index < source.length; index += 1) {
    if (source[index] === '"') {
      index = stringTokenEnd(source, index);
    } else if (source[index] === "[") {
      depth += 1;
    } else if (source[index] === "]") {
      depth -= 1;
      if (depth === 0) {
        return index;
      }
    }
  }
  throw new Error("Unterminated JSON array");
}

function findTopLevelArray(source, field) {
  let objectDepth = 0;
  let arrayDepth = 0;

  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    if (character === '"') {
      const end = stringTokenEnd(source, index);
      if (objectDepth === 1 && arrayDepth === 0) {
        const key = JSON.parse(source.slice(index, end + 1));
        let valueStart = end + 1;
        while (/\s/.test(source[valueStart])) {
          valueStart += 1;
        }
        if (key === field && source[valueStart] === ":") {
          valueStart += 1;
          while (/\s/.test(source[valueStart])) {
            valueStart += 1;
          }
          if (source[valueStart] !== "[") {
            throw new Error(`Top-level ${field} is not an array`);
          }
          return {
            start: valueStart,
            end: arrayTokenEnd(source, valueStart),
          };
        }
      }
      index = end;
    } else if (character === "{") {
      objectDepth += 1;
    } else if (character === "}") {
      objectDepth -= 1;
    } else if (character === "[") {
      arrayDepth += 1;
    } else if (character === "]") {
      arrayDepth -= 1;
    }
  }

  throw new Error(`Missing top-level array field ${field}`);
}

function appendTopLevelArrayValues(source, field, values) {
  const { start, end } = findTopLevelArray(source, field);
  const inside = source.slice(start + 1, end);
  const serialized = values.map((value) => JSON.stringify(value));
  let replacement;

  if (inside.trim().length === 0) {
    replacement = `[${serialized.join(", ")}]`;
  } else if (inside.includes("\n")) {
    const finalNewline = inside.lastIndexOf("\n");
    const beforeClosingIndent = inside.slice(0, finalNewline);
    const closingIndent = inside.slice(finalNewline);
    const itemIndent = inside.match(/\n([ \t]+)\S/)?.[1];
    if (itemIndent === undefined) {
      throw new Error(`Cannot determine indentation for ${field}`);
    }
    replacement = `[${beforeClosingIndent},\n${itemIndent}${serialized.join(
      `,\n${itemIndent}`,
    )}${closingIndent}]`;
  } else {
    const trailingWhitespace = inside.match(/\s*$/)?.[0] ?? "";
    const existingValues = inside.slice(
      0,
      inside.length - trailingWhitespace.length,
    );
    const inlineReplacement = `[${existingValues}, ${serialized.join(
      ", ",
    )}${trailingWhitespace}]`;
    const lineStart = source.lastIndexOf("\n", start) + 1;
    const linePrefix = source.slice(lineStart, start);
    if (linePrefix.length + inlineReplacement.length <= 100) {
      replacement = inlineReplacement;
    } else {
      const propertyIndent = linePrefix.match(/^\s*/)?.[0] ?? "";
      const itemIndent = `${propertyIndent}  `;
      replacement = `[\n${itemIndent}${[...JSON.parse(`[${inside}]`), ...values]
        .map((value) => JSON.stringify(value))
        .join(`,\n${itemIndent}`)}\n${propertyIndent}]`;
    }
  }

  return `${source.slice(0, start)}${replacement}${source.slice(end + 1)}`;
}

function ensureArrayIncludes(document, field, referencedId, corrections) {
  if (!Array.isArray(document[field])) {
    throw new Error(
      `Cannot normalize ${document.id}.${field}: expected an existing array`,
    );
  }
  if (document[field].includes(referencedId)) {
    return;
  }

  document[field].push(referencedId);
  corrections.push({
    entityId: document.id,
    field,
    referencedId,
  });
}

function requireScalar(document, field, referencedId) {
  if (document[field] !== referencedId) {
    throw new Error(
      `Cannot normalize ${document.id}.${field}: expected "${referencedId}" but found ${JSON.stringify(document[field])}`,
    );
  }
}

function applyReverseRule(source, target, reference, corrections) {
  switch (reference.reverseRule) {
    case reverseReferenceRules.eraIncludesSeason:
      ensureArrayIncludes(target, "seasonIds", source.id, corrections);
      break;
    case reverseReferenceRules.seasonUsesEra:
      requireScalar(target, "eraId", source.id);
      break;
    case reverseReferenceRules.raceBelongsToSeason:
      requireScalar(target, "seasonId", source.id);
      break;
    case reverseReferenceRules.seasonIncludesRace:
      ensureArrayIncludes(target, "raceIds", source.id, corrections);
      break;
    case reverseReferenceRules.standingBelongsToSeason:
      requireScalar(target, "seasonId", source.id);
      break;
    case reverseReferenceRules.seasonIncludesStanding:
      ensureArrayIncludes(target, "standingIds", source.id, corrections);
      break;
    case reverseReferenceRules.carIncludesSeason:
      ensureArrayIncludes(target, "seasonIds", source.id, corrections);
      break;
    case reverseReferenceRules.seasonIncludesCar:
      ensureArrayIncludes(target, "entrantCarIds", source.id, corrections);
      break;
    case reverseReferenceRules.technologyIncludesSeason:
      ensureArrayIncludes(target, "seasonIds", source.id, corrections);
      break;
    case reverseReferenceRules.seasonIncludesTechnology:
      ensureArrayIncludes(
        target,
        "featuredTechnologyIds",
        source.id,
        corrections,
      );
      break;
    case reverseReferenceRules.carUsesTeam:
      requireScalar(target, "constructorId", source.id);
      break;
    case reverseReferenceRules.teamIncludesCar:
      ensureArrayIncludes(target, "carIds", source.id, corrections);
      break;
    case reverseReferenceRules.personIncludesTeam:
      ensureArrayIncludes(target, "teamIds", source.id, corrections);
      break;
    case reverseReferenceRules.teamIncludesPerson:
      ensureArrayIncludes(target, "personIds", source.id, corrections);
      break;
    case reverseReferenceRules.technologyIncludesCar:
      ensureArrayIncludes(target, "carIds", source.id, corrections);
      break;
    case reverseReferenceRules.carIncludesTechnology:
      ensureArrayIncludes(target, "technologyIds", source.id, corrections);
      break;
    default:
      break;
  }
}

export async function normalizeReverseLinks(contentRoot, options = {}) {
  const { write = false } = options;
  const rootPath = path.resolve(contentRoot);
  const files = await collectJsonFiles(rootPath);
  const entries = await Promise.all(
    files.map(async (filePath) => {
      const source = await readFile(filePath, "utf8");
      return {
        filePath,
        source,
        document: JSON.parse(source),
      };
    }),
  );
  const byId = new Map(entries.map((entry) => [entry.document.id, entry]));
  const corrections = [];

  for (const { document } of entries) {
    for (const reference of collectContentReferences(document)) {
      const target = byId.get(reference.referencedId)?.document;
      if (!target) {
        throw new Error(
          `Cannot normalize ${document.id}.${reference.fieldPath}: missing target "${reference.referencedId}"`,
        );
      }
      if (!reference.expectedTypes.includes(target.type)) {
        throw new Error(
          `Cannot normalize ${document.id}.${reference.fieldPath}: target "${target.id}" has type "${target.type}"`,
        );
      }
      applyReverseRule(document, target, reference, corrections);
    }
  }

  if (write) {
    const correctionsByEntity = Map.groupBy(
      corrections,
      (correction) => correction.entityId,
    );
    await Promise.all(
      entries
        .filter(({ document }) => correctionsByEntity.has(document.id))
        .map(({ filePath, source, document }) => {
          const correctionsByField = Map.groupBy(
            correctionsByEntity.get(document.id),
            (correction) => correction.field,
          );
          let updatedSource = source;
          for (const [field, fieldCorrections] of correctionsByField) {
            updatedSource = appendTopLevelArrayValues(
              updatedSource,
              field,
              fieldCorrections.map((correction) => correction.referencedId),
            );
          }
          return writeFile(filePath, updatedSource, "utf8");
        }),
    );
  }

  return corrections;
}

export async function main() {
  const write = process.argv.includes("--write");
  const configuredRoot = process.env.CONTENT_ROOT ?? "content";
  const corrections = await normalizeReverseLinks(configuredRoot, { write });
  const countsByField = new Map();

  for (const correction of corrections) {
    const key = correction.field;
    countsByField.set(key, (countsByField.get(key) ?? 0) + 1);
  }

  console.log(
    `${write ? "Applied" : "Found"} ${corrections.length} reverse-link corrections.`,
  );
  for (const [field, count] of [...countsByField].sort(([left], [right]) =>
    left.localeCompare(right),
  )) {
    console.log(`- ${field}: ${count}`);
  }
  if (!write && corrections.length > 0) {
    console.log("Run with --write to apply these deterministic corrections.");
  }
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (invokedPath === path.resolve(new URL(import.meta.url).pathname)) {
  await main();
}
