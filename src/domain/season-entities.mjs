import {
  formatValidationIssue,
  validateCommonEntityDocument,
} from "./common-entity.mjs";
import { validateParticipantEntityDocument } from "./participant-entities.mjs";
import { validateTopicEntityDocument } from "./topic-entities.mjs";

const STANDING_KINDS = ["driver", "constructor"];

function isPlainObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function isWholeNumber(value) {
  return Number.isInteger(value);
}

function isIsoDate(value) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function pushIssue(issues, path, message) {
  issues.push({ path, message });
}

function validateStringArray(value, path, issues, options = {}) {
  const { unique = false } = options;

  if (!Array.isArray(value)) {
    pushIssue(issues, path, "must be an array");
    return;
  }

  if (!value.every(isNonEmptyString)) {
    pushIssue(issues, path, "must contain non-empty strings");
  }

  if (unique && new Set(value).size !== value.length) {
    pushIssue(issues, path, "must not contain duplicate values");
  }
}

function validateSeasonDocument(document) {
  const issues = [];
  const base = validateCommonEntityDocument(document);
  issues.push(...base.issues);

  if (document.type !== "season") {
    pushIssue(issues, "type", 'must be exactly "season"');
  }

  if (
    !isWholeNumber(document.year) ||
    document.year < 1950 ||
    document.year > 2100
  ) {
    pushIssue(issues, "year", "must be an integer year between 1950 and 2100");
  }

  if (!isNonEmptyString(document.eraId)) {
    pushIssue(issues, "eraId", "must be a non-empty era id");
  }

  if (typeof document.highlighted !== "boolean") {
    pushIssue(issues, "highlighted", "must be a boolean");
  }

  for (const field of ["championPersonId", "championCarId"]) {
    if (!isNonEmptyString(document[field])) {
      pushIssue(issues, field, "must be a non-empty string");
    }
  }

  for (const field of [
    "raceIds",
    "standingIds",
    "entrantCarIds",
    "featuredTechnologyIds",
  ]) {
    validateStringArray(document[field], field, issues, { unique: true });
  }

  return {
    success: issues.length === 0,
    issues,
  };
}

function validateRaceDocument(document) {
  const issues = [];
  const base = validateCommonEntityDocument(document);
  issues.push(...base.issues);

  if (document.type !== "race") {
    pushIssue(issues, "type", 'must be exactly "race"');
  }

  if (!isNonEmptyString(document.seasonId)) {
    pushIssue(issues, "seasonId", "must be a non-empty season id");
  }

  if (!isNonEmptyString(document.circuitId)) {
    pushIssue(issues, "circuitId", "must be a non-empty circuit id");
  }

  if (!isWholeNumber(document.round) || document.round <= 0) {
    pushIssue(issues, "round", "must be a positive integer");
  }

  if (!isIsoDate(document.date)) {
    pushIssue(issues, "date", "must be an ISO 8601 calendar date (YYYY-MM-DD)");
  }

  for (const field of ["winnerPersonId", "winnerCarId"]) {
    if (document[field] !== undefined && !isNonEmptyString(document[field])) {
      pushIssue(issues, field, "must be a non-empty string when provided");
    }
  }

  return {
    success: issues.length === 0,
    issues,
  };
}

function validateCircuitDocument(document) {
  const issues = [];
  const base = validateCommonEntityDocument(document);
  issues.push(...base.issues);

  if (document.type !== "circuit") {
    pushIssue(issues, "type", 'must be exactly "circuit"');
  }

  if (!/^[A-Z]{2,3}$/.test(document.countryCode ?? "")) {
    pushIssue(
      issues,
      "countryCode",
      "must be a 2 or 3 letter uppercase country code",
    );
  }

  if (!isPlainObject(document.location)) {
    pushIssue(issues, "location", "must be a localized object");
  } else {
    if (!isNonEmptyString(document.location.zh)) {
      pushIssue(issues, "location.zh", "must be a non-empty Chinese string");
    }
    if (
      document.location.en !== undefined &&
      !isNonEmptyString(document.location.en)
    ) {
      pushIssue(
        issues,
        "location.en",
        "must be a non-empty string when provided",
      );
    }
  }

  if (
    document.firstGrandPrixYear !== undefined &&
    (!isWholeNumber(document.firstGrandPrixYear) ||
      document.firstGrandPrixYear < 1900 ||
      document.firstGrandPrixYear > 2100)
  ) {
    pushIssue(
      issues,
      "firstGrandPrixYear",
      "must be an integer year between 1900 and 2100 when provided",
    );
  }

  return {
    success: issues.length === 0,
    issues,
  };
}

function validateStandingEntries(entries, path, issues) {
  if (!Array.isArray(entries) || entries.length === 0) {
    pushIssue(issues, path, "must contain at least one standing entry");
    return;
  }

  const positions = new Set();
  const competitorIds = new Set();

  entries.forEach((entry, index) => {
    const entryPath = `${path}[${index}]`;
    if (!isPlainObject(entry)) {
      pushIssue(issues, entryPath, "must be an object");
      return;
    }

    if (!isWholeNumber(entry.position) || entry.position <= 0) {
      pushIssue(issues, `${entryPath}.position`, "must be a positive integer");
    } else if (positions.has(entry.position)) {
      pushIssue(
        issues,
        `${entryPath}.position`,
        "must be unique within the standings",
      );
    } else {
      positions.add(entry.position);
    }

    if (!isNonEmptyString(entry.competitorId)) {
      pushIssue(
        issues,
        `${entryPath}.competitorId`,
        "must be a non-empty string",
      );
    } else if (competitorIds.has(entry.competitorId)) {
      pushIssue(
        issues,
        `${entryPath}.competitorId`,
        "must be unique within the standings",
      );
    } else {
      competitorIds.add(entry.competitorId);
    }

    if (typeof entry.points !== "number" || entry.points < 0) {
      pushIssue(issues, `${entryPath}.points`, "must be a non-negative number");
    }

    if (
      entry.wins !== undefined &&
      (!isWholeNumber(entry.wins) || entry.wins < 0)
    ) {
      pushIssue(
        issues,
        `${entryPath}.wins`,
        "must be a non-negative integer when provided",
      );
    }
  });
}

function validateStandingDocument(document) {
  const issues = [];
  const base = validateCommonEntityDocument(document);
  issues.push(...base.issues);

  if (document.type !== "standing") {
    pushIssue(issues, "type", 'must be exactly "standing"');
  }

  if (!STANDING_KINDS.includes(document.standingKind)) {
    pushIssue(
      issues,
      "standingKind",
      `must be one of: ${STANDING_KINDS.join(", ")}`,
    );
  }

  if (!isNonEmptyString(document.seasonId)) {
    pushIssue(issues, "seasonId", "must be a non-empty season id");
  }

  validateStandingEntries(document.entries, "entries", issues);

  if (
    document.defaultVisibleCount !== undefined &&
    (!isWholeNumber(document.defaultVisibleCount) ||
      document.defaultVisibleCount <= 0)
  ) {
    pushIssue(
      issues,
      "defaultVisibleCount",
      "must be a positive integer when provided",
    );
  }

  if (
    document.standingKind === "driver" &&
    document.defaultVisibleCount !== 3
  ) {
    pushIssue(
      issues,
      "defaultVisibleCount",
      "must be exactly 3 for driver standings",
    );
  }

  return {
    success: issues.length === 0,
    issues,
  };
}

export function validateTypedEntityDocument(document) {
  switch (document?.type) {
    case "season":
      return validateSeasonDocument(document);
    case "race":
      return validateRaceDocument(document);
    case "circuit":
      return validateCircuitDocument(document);
    case "standing":
      return validateStandingDocument(document);
    case "car":
    case "team":
    case "person":
      return validateParticipantEntityDocument(document);
    case "technology":
    case "era":
    case "source":
      return validateTopicEntityDocument(document);
    default:
      return validateCommonEntityDocument(document);
  }
}

export function formatTypedValidationIssues(filePath, result) {
  return result.issues.map((issue) => formatValidationIssue(filePath, issue));
}
