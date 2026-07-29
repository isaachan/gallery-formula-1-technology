import { access, readFile, readdir } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import {
  formatValidationIssue,
  validateCommonEntityDocument,
} from "../../src/domain/common-entity.mjs";
import { validateTypedEntityDocument } from "../../src/domain/season-entities.mjs";
import { validateMediaAssetFiles } from "../../src/domain/media-file-validation.mjs";
import {
  collectContentReferences,
  reverseReferenceRules,
} from "../../src/domain/content-reference-contract.mjs";

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

export async function validateContentRoot(contentRoot, options = {}) {
  const rootPath = path.resolve(contentRoot);
  const publicRoot = options.publicRoot
    ? path.resolve(options.publicRoot)
    : path.join(path.dirname(rootPath), "public");
  const failures = [];
  const validatedDocuments = [];

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

  const jsonFiles = await collectJsonFiles(rootPath);
  for (const filePath of jsonFiles) {
    const relativePath = path.relative(rootPath, filePath);

    let parsed;
    try {
      parsed = JSON.parse(await readFile(filePath, "utf8"));
    } catch {
      failures.push(`${relativePath}:<root> must contain valid JSON`);
      continue;
    }

    const result =
      typeof parsed?.type === "string"
        ? validateTypedEntityDocument(parsed)
        : validateCommonEntityDocument(parsed);
    if (!result.success) {
      failures.push(
        ...result.issues.map((issue) =>
          formatValidationIssue(relativePath, issue),
        ),
      );
    } else if (parsed.type === "mediaAsset") {
      const fileIssues = await validateMediaAssetFiles(parsed, {
        publicRoot,
      });
      failures.push(
        ...fileIssues.map((issue) =>
          formatValidationIssue(relativePath, issue),
        ),
      );
    }

    validatedDocuments.push({
      filePath: relativePath,
      document: parsed,
    });
  }

  failures.push(...validateContentGraph(validatedDocuments));

  return failures;
}

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

function pushGraphIssue(issues, filePath, fieldPath, message) {
  issues.push(`${filePath}:${fieldPath} ${message}`);
}

function expectedTypeDescription(expectedTypes) {
  return expectedTypes.length === 1
    ? expectedTypes[0]
    : `one of [${expectedTypes.join(", ")}]`;
}

function reverseReferenceFailure(source, target, reference) {
  switch (reference.reverseRule) {
    case reverseReferenceRules.eraIncludesSeason:
      return Array.isArray(target.seasonIds) &&
        target.seasonIds.includes(source.id)
        ? null
        : `requires era "${target.id}" to include season "${source.id}" in seasonIds`;
    case reverseReferenceRules.seasonUsesEra:
      return target.eraId === source.id
        ? null
        : `requires season "${target.id}" to point back to era "${source.id}" via eraId`;
    case reverseReferenceRules.raceBelongsToSeason:
      return target.seasonId === source.id
        ? null
        : `requires race "${target.id}" to point back to season "${source.id}" via seasonId`;
    case reverseReferenceRules.seasonIncludesRace:
      return Array.isArray(target.raceIds) && target.raceIds.includes(source.id)
        ? null
        : `requires season "${target.id}" to include race "${source.id}" in raceIds`;
    case reverseReferenceRules.standingBelongsToSeason:
      return target.seasonId === source.id
        ? null
        : `requires standing "${target.id}" to point back to season "${source.id}" via seasonId`;
    case reverseReferenceRules.seasonIncludesStanding:
      return Array.isArray(target.standingIds) &&
        target.standingIds.includes(source.id)
        ? null
        : `requires season "${target.id}" to include standing "${source.id}" in standingIds`;
    case reverseReferenceRules.carIncludesSeason:
      return Array.isArray(target.seasonIds) &&
        target.seasonIds.includes(source.id)
        ? null
        : `requires car "${target.id}" to include season "${source.id}" in seasonIds`;
    case reverseReferenceRules.seasonIncludesCar:
      return Array.isArray(target.entrantCarIds) &&
        target.entrantCarIds.includes(source.id)
        ? null
        : `requires season "${target.id}" to include car "${source.id}" in entrantCarIds`;
    case reverseReferenceRules.technologyIncludesSeason:
      return Array.isArray(target.seasonIds) &&
        target.seasonIds.includes(source.id)
        ? null
        : `requires technology "${target.id}" to include season "${source.id}" in seasonIds`;
    case reverseReferenceRules.seasonIncludesTechnology:
      return Array.isArray(target.featuredTechnologyIds) &&
        target.featuredTechnologyIds.includes(source.id)
        ? null
        : `requires season "${target.id}" to include technology "${source.id}" in featuredTechnologyIds`;
    case reverseReferenceRules.carUsesTeam:
      return target.constructorId === source.id
        ? null
        : `requires car "${target.id}" to point back to team "${source.id}" via constructorId`;
    case reverseReferenceRules.teamIncludesCar:
      return Array.isArray(target.carIds) && target.carIds.includes(source.id)
        ? null
        : `requires team "${target.id}" to include car "${source.id}" in carIds`;
    case reverseReferenceRules.personIncludesTeam:
      return Array.isArray(target.teamIds) && target.teamIds.includes(source.id)
        ? null
        : `requires person "${target.id}" to include team "${source.id}" in teamIds`;
    case reverseReferenceRules.teamIncludesPerson:
      return Array.isArray(target.personIds) &&
        target.personIds.includes(source.id)
        ? null
        : `requires team "${target.id}" to include person "${source.id}" in personIds`;
    case reverseReferenceRules.technologyIncludesCar:
      return Array.isArray(target.carIds) && target.carIds.includes(source.id)
        ? null
        : `requires technology "${target.id}" to include car "${source.id}" in carIds`;
    case reverseReferenceRules.carIncludesTechnology:
      return Array.isArray(target.technologyIds) &&
        target.technologyIds.includes(source.id)
        ? null
        : `requires car "${target.id}" to include technology "${source.id}" in technologyIds`;
    default:
      return null;
  }
}

export function validateContentGraph(entries) {
  const issues = [];
  const idIndex = new Map();
  const slugIndex = new Map();

  for (const entry of entries) {
    const { filePath, document } = entry;

    if (typeof document.id === "string") {
      const existing = idIndex.get(document.id);
      if (existing) {
        pushGraphIssue(
          issues,
          filePath,
          "id",
          `duplicates id "${document.id}" already defined in ${existing.filePath}`,
        );
      } else {
        idIndex.set(document.id, entry);
      }
    }

    if (typeof document.slug === "string") {
      const existing = slugIndex.get(document.slug);
      if (existing) {
        pushGraphIssue(
          issues,
          filePath,
          "slug",
          `duplicates slug "${document.slug}" already defined in ${existing.filePath}`,
        );
      } else {
        slugIndex.set(document.slug, entry);
      }
    }
  }

  for (const entry of entries) {
    const { filePath, document } = entry;
    const references = collectContentReferences(document);

    for (const reference of references) {
      const target = idIndex.get(reference.referencedId);
      const expected = expectedTypeDescription(reference.expectedTypes);
      if (!target) {
        pushGraphIssue(
          issues,
          filePath,
          reference.fieldPath,
          `entity "${reference.sourceEntityId}" expected ${expected} reference "${reference.referencedId}" but target is missing`,
        );
        continue;
      }

      if (!reference.expectedTypes.includes(target.document.type)) {
        pushGraphIssue(
          issues,
          filePath,
          reference.fieldPath,
          `entity "${reference.sourceEntityId}" expected ${expected} reference "${reference.referencedId}" but actual type is "${target.document.type}"`,
        );
        continue;
      }

      const reverseFailure = reverseReferenceFailure(
        document,
        target.document,
        reference,
      );
      if (reverseFailure) {
        pushGraphIssue(issues, filePath, reference.fieldPath, reverseFailure);
      }
    }
  }

  for (const entry of entries) {
    const { filePath, document } = entry;

    if (document.type === "race" && typeof document.date === "string") {
      const season = idIndex.get(document.seasonId)?.document;
      const raceYear = Number.parseInt(document.date.slice(0, 4), 10);
      if (season && season.year !== raceYear) {
        pushGraphIssue(
          issues,
          filePath,
          "date",
          `year ${raceYear} must match linked season year ${season.year}`,
        );
      }
    }

    if (document.type === "person" && document.championshipYears) {
      const representativeYears = new Set(
        (document.representativeSeasonIds ?? [])
          .map((seasonId) => idIndex.get(seasonId)?.document?.year)
          .filter(Boolean),
      );
      for (const year of document.championshipYears) {
        if (representativeYears.size > 0 && !representativeYears.has(year)) {
          pushGraphIssue(
            issues,
            filePath,
            "championshipYears",
            `championship year ${year} must appear in representativeSeasonIds`,
          );
        }
      }
    }
  }

  return issues;
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
