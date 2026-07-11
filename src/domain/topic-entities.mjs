import { validateCommonEntityDocument } from "./common-entity.mjs";

const TECHNOLOGY_CATEGORIES = [
  "engine",
  "aerodynamics",
  "chassis",
  "safety",
  "electronics",
  "tyres",
  "other",
];

const TECHNOLOGY_DIFFICULTIES = ["introductory", "advanced"];
const SOURCE_TYPES = [
  "official",
  "book",
  "article",
  "archive",
  "database",
  "video",
];

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
  const { unique = false, nonEmpty = false } = options;

  if (!Array.isArray(value)) {
    pushIssue(issues, path, "must be an array");
    return;
  }

  if (nonEmpty && value.length === 0) {
    pushIssue(issues, path, "must contain at least one item");
  }

  if (!value.every(isNonEmptyString)) {
    pushIssue(issues, path, "must contain non-empty strings");
  }

  if (unique && new Set(value).size !== value.length) {
    pushIssue(issues, path, "must not contain duplicate values");
  }
}

function validateTechnologyDocument(document) {
  const issues = [];
  const base = validateCommonEntityDocument(document);
  issues.push(...base.issues);

  if (document.type !== "technology") {
    pushIssue(issues, "type", 'must be exactly "technology"');
  }

  if (!TECHNOLOGY_CATEGORIES.includes(document.category)) {
    pushIssue(
      issues,
      "category",
      `must be one of: ${TECHNOLOGY_CATEGORIES.join(", ")}`,
    );
  }

  if (
    document.firstSeasonId !== undefined &&
    !isNonEmptyString(document.firstSeasonId)
  ) {
    pushIssue(
      issues,
      "firstSeasonId",
      "must be a non-empty season id when provided",
    );
  }

  validateStringArray(document.seasonIds, "seasonIds", issues, {
    unique: true,
  });
  validateStringArray(document.carIds, "carIds", issues, { unique: true });

  if (!TECHNOLOGY_DIFFICULTIES.includes(document.difficulty)) {
    pushIssue(
      issues,
      "difficulty",
      `must be one of: ${TECHNOLOGY_DIFFICULTIES.join(", ")}`,
    );
  }

  return {
    success: issues.length === 0,
    issues,
  };
}

function validateEraDocument(document) {
  const issues = [];
  const base = validateCommonEntityDocument(document);
  issues.push(...base.issues);

  if (document.type !== "era") {
    pushIssue(issues, "type", 'must be exactly "era"');
  }

  if (!isWholeNumber(document.startYear) || document.startYear < 1950) {
    pushIssue(
      issues,
      "startYear",
      "must be an integer year no earlier than 1950",
    );
  }

  if (
    !isWholeNumber(document.endYear) ||
    document.endYear < document.startYear
  ) {
    pushIssue(
      issues,
      "endYear",
      "must be an integer year not earlier than startYear",
    );
  }

  if (!/^#[0-9a-fA-F]{6}$/.test(document.color ?? "")) {
    pushIssue(issues, "color", "must be a 6-digit hex color");
  }

  validateStringArray(document.seasonIds, "seasonIds", issues, {
    unique: true,
  });

  return {
    success: issues.length === 0,
    issues,
  };
}

function validateSourceClaims(value, path, issues) {
  if (!Array.isArray(value) || value.length === 0) {
    pushIssue(issues, path, "must contain at least one supported-claim entry");
    return;
  }

  value.forEach((claim, index) => {
    const claimPath = `${path}[${index}]`;
    if (!isPlainObject(claim)) {
      pushIssue(issues, claimPath, "must be an object");
      return;
    }

    if (!isNonEmptyString(claim.entityId)) {
      pushIssue(
        issues,
        `${claimPath}.entityId`,
        "must be a non-empty entity id",
      );
    }

    if (!isNonEmptyString(claim.field)) {
      pushIssue(issues, `${claimPath}.field`, "must be a non-empty field path");
    }

    if (claim.notes !== undefined && !isNonEmptyString(claim.notes)) {
      pushIssue(
        issues,
        `${claimPath}.notes`,
        "must be a non-empty string when provided",
      );
    }
  });
}

function validateSourceDocument(document) {
  const issues = [];
  const base = validateCommonEntityDocument(document);
  issues.push(...base.issues);

  if (document.type !== "source") {
    pushIssue(issues, "type", 'must be exactly "source"');
  }

  if (!SOURCE_TYPES.includes(document.sourceType)) {
    pushIssue(
      issues,
      "sourceType",
      `must be one of: ${SOURCE_TYPES.join(", ")}`,
    );
  }

  if (!isNonEmptyString(document.url)) {
    pushIssue(issues, "url", "must be a non-empty URL string");
  }

  if (!isIsoDate(document.accessedOn)) {
    pushIssue(
      issues,
      "accessedOn",
      "must be an ISO 8601 calendar date (YYYY-MM-DD)",
    );
  }

  if (
    document.publisher !== undefined &&
    !isNonEmptyString(document.publisher)
  ) {
    pushIssue(issues, "publisher", "must be a non-empty string when provided");
  }

  if (document.author !== undefined && !isNonEmptyString(document.author)) {
    pushIssue(issues, "author", "must be a non-empty string when provided");
  }

  validateSourceClaims(document.supportedClaims, "supportedClaims", issues);

  return {
    success: issues.length === 0,
    issues,
  };
}

export function validateTopicEntityDocument(document) {
  switch (document?.type) {
    case "technology":
      return validateTechnologyDocument(document);
    case "era":
      return validateEraDocument(document);
    case "source":
      return validateSourceDocument(document);
    default:
      return validateCommonEntityDocument(document);
  }
}
