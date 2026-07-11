import { access, readFile, readdir } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import {
  formatValidationIssue,
  validateCommonEntityDocument,
} from "../../src/domain/common-entity.mjs";
import { validateTypedEntityDocument } from "../../src/domain/season-entities.mjs";

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

function collectReferenceFields(document) {
  const references = [];
  const pushReference = (fieldPath, value, targetType) => {
    if (typeof value === "string" && value.trim().length > 0) {
      references.push({ fieldPath, value, targetType });
    }
  };
  const pushReferenceArray = (fieldPath, values, targetType) => {
    if (Array.isArray(values)) {
      values.forEach((value, index) =>
        pushReference(`${fieldPath}[${index}]`, value, targetType),
      );
    }
  };

  switch (document.type) {
    case "season":
      pushReference("eraId", document.eraId, "era");
      pushReference("championPersonId", document.championPersonId, "person");
      pushReference("championCarId", document.championCarId, "car");
      pushReferenceArray("raceIds", document.raceIds, "race");
      pushReferenceArray("standingIds", document.standingIds, "standing");
      pushReferenceArray("entrantCarIds", document.entrantCarIds, "car");
      pushReferenceArray(
        "featuredTechnologyIds",
        document.featuredTechnologyIds,
        "technology",
      );
      break;
    case "race":
      pushReference("seasonId", document.seasonId, "season");
      pushReference("circuitId", document.circuitId, "circuit");
      pushReference("winnerPersonId", document.winnerPersonId, "person");
      pushReference("winnerCarId", document.winnerCarId, "car");
      break;
    case "standing":
      pushReference("seasonId", document.seasonId, "season");
      if (Array.isArray(document.entries)) {
        document.entries.forEach((entry, index) =>
          pushReference(
            `entries[${index}].competitorId`,
            entry?.competitorId,
            document.standingKind === "driver" ? "person" : "team",
          ),
        );
      }
      break;
    case "car":
      pushReferenceArray("seasonIds", document.seasonIds, "season");
      pushReference("constructorId", document.constructorId, "team");
      pushReferenceArray("driverIds", document.driverIds, "person");
      pushReferenceArray("technologyIds", document.technologyIds, "technology");
      break;
    case "team":
      pushReferenceArray("seasonIds", document.seasonIds, "season");
      pushReferenceArray("personIds", document.personIds, "person");
      pushReferenceArray("carIds", document.carIds, "car");
      break;
    case "person":
      pushReferenceArray("teamIds", document.teamIds, "team");
      pushReferenceArray(
        "representativeSeasonIds",
        document.representativeSeasonIds,
        "season",
      );
      break;
    case "technology":
      pushReference("firstSeasonId", document.firstSeasonId, "season");
      pushReferenceArray("seasonIds", document.seasonIds, "season");
      pushReferenceArray("carIds", document.carIds, "car");
      break;
    case "era":
      pushReferenceArray("seasonIds", document.seasonIds, "season");
      break;
    case "source":
      if (Array.isArray(document.supportedClaims)) {
        document.supportedClaims.forEach((claim, index) =>
          pushReference(
            `supportedClaims[${index}].entityId`,
            claim?.entityId,
            null,
          ),
        );
      }
      break;
    case "mediaAsset":
      pushReference("posterMediaId", document.posterMediaId, "mediaAsset");
      pushReference("fallbackMediaId", document.fallbackMediaId, "mediaAsset");
      break;
    default:
      break;
  }

  return references;
}

function validateContentGraph(entries) {
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
    const references = collectReferenceFields(document);

    for (const reference of references) {
      const target = idIndex.get(reference.value);
      if (!target) {
        pushGraphIssue(
          issues,
          filePath,
          reference.fieldPath,
          `references missing target id "${reference.value}"`,
        );
        continue;
      }

      if (
        reference.targetType &&
        target.document.type !== reference.targetType
      ) {
        pushGraphIssue(
          issues,
          filePath,
          reference.fieldPath,
          `must reference a ${reference.targetType} but found ${target.document.type}`,
        );
      }
    }
  }

  for (const entry of entries) {
    const { filePath, document } = entry;

    if (document.type === "season") {
      for (const raceId of document.raceIds ?? []) {
        const race = idIndex.get(raceId)?.document;
        if (race && race.seasonId !== document.id) {
          pushGraphIssue(
            issues,
            filePath,
            "raceIds",
            `requires reverse race link for "${raceId}" back to season "${document.id}"`,
          );
        }
      }

      for (const standingId of document.standingIds ?? []) {
        const standing = idIndex.get(standingId)?.document;
        if (standing && standing.seasonId !== document.id) {
          pushGraphIssue(
            issues,
            filePath,
            "standingIds",
            `requires reverse standing link for "${standingId}" back to season "${document.id}"`,
          );
        }
      }
    }

    if (document.type === "team") {
      for (const carId of document.carIds ?? []) {
        const car = idIndex.get(carId)?.document;
        if (car && car.constructorId !== document.id) {
          pushGraphIssue(
            issues,
            filePath,
            "carIds",
            `requires car "${carId}" to point back via constructorId`,
          );
        }
      }

      for (const personId of document.personIds ?? []) {
        const person = idIndex.get(personId)?.document;
        if (
          person &&
          (!Array.isArray(person.teamIds) ||
            !person.teamIds.includes(document.id))
        ) {
          pushGraphIssue(
            issues,
            filePath,
            "personIds",
            `requires person "${personId}" to include team "${document.id}" in teamIds`,
          );
        }
      }
    }

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
