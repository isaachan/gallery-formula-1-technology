import { validateCommonEntityDocument } from "./common-entity.mjs";

const PERSON_KINDS = ["driver", "engineer", "designer", "principal"];

function isPlainObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function isWholeNumber(value) {
  return Number.isInteger(value);
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

function validateLocalizedStringMap(value, path, issues) {
  if (!isPlainObject(value) || Object.keys(value).length === 0) {
    pushIssue(
      issues,
      path,
      "must be an object with one or more localized specification values",
    );
    return;
  }

  for (const [key, localizedValue] of Object.entries(value)) {
    const valuePath = `${path}.${key}`;
    if (!isPlainObject(localizedValue)) {
      pushIssue(issues, valuePath, "must be a localized object");
      continue;
    }

    if (!isNonEmptyString(localizedValue.zh)) {
      pushIssue(
        issues,
        `${valuePath}.zh`,
        "must be a non-empty Chinese string",
      );
    }

    if (
      localizedValue.en !== undefined &&
      !isNonEmptyString(localizedValue.en)
    ) {
      pushIssue(
        issues,
        `${valuePath}.en`,
        "must be a non-empty string when provided",
      );
    }
  }
}

function validateCarDocument(document) {
  const issues = [];
  const base = validateCommonEntityDocument(document);
  issues.push(...base.issues);

  if (document.type !== "car") {
    pushIssue(issues, "type", 'must be exactly "car"');
  }

  validateStringArray(document.seasonIds, "seasonIds", issues, {
    unique: true,
  });

  if (!isNonEmptyString(document.constructorId)) {
    pushIssue(issues, "constructorId", "must be a non-empty team id");
  }

  validateStringArray(document.driverIds, "driverIds", issues, {
    unique: true,
  });
  validateStringArray(document.technologyIds, "technologyIds", issues, {
    unique: true,
  });

  if (!isNonEmptyString(document.engine)) {
    pushIssue(issues, "engine", "must be a non-empty string");
  }

  validateLocalizedStringMap(document.specifications, "specifications", issues);

  if (
    document.wins !== undefined &&
    (!isWholeNumber(document.wins) || document.wins < 0)
  ) {
    pushIssue(issues, "wins", "must be a non-negative integer when provided");
  }

  return {
    success: issues.length === 0,
    issues,
  };
}

function validateTeamDocument(document) {
  const issues = [];
  const base = validateCommonEntityDocument(document);
  issues.push(...base.issues);

  if (document.type !== "team") {
    pushIssue(issues, "type", 'must be exactly "team"');
  }

  if (!isNonEmptyString(document.teamKind)) {
    pushIssue(issues, "teamKind", "must be a non-empty team kind");
  }

  validateStringArray(document.seasonIds, "seasonIds", issues, {
    unique: true,
  });
  validateStringArray(document.personIds, "personIds", issues, {
    unique: true,
  });
  validateStringArray(document.carIds, "carIds", issues, { unique: true });

  if (
    document.baseCountryCode !== undefined &&
    !/^[A-Z]{2,3}$/.test(document.baseCountryCode)
  ) {
    pushIssue(
      issues,
      "baseCountryCode",
      "must be a 2 or 3 letter uppercase country code when provided",
    );
  }

  return {
    success: issues.length === 0,
    issues,
  };
}

function validateActiveYears(value, path, issues) {
  if (!isPlainObject(value)) {
    pushIssue(issues, path, "must be an object when provided");
    return;
  }

  if (!isWholeNumber(value.from) || value.from < 1900 || value.from > 2100) {
    pushIssue(
      issues,
      `${path}.from`,
      "must be an integer year between 1900 and 2100",
    );
  }

  if (
    value.to !== undefined &&
    (!isWholeNumber(value.to) || value.to < value.from || value.to > 2100)
  ) {
    pushIssue(
      issues,
      `${path}.to`,
      "must be an integer year not earlier than from and no later than 2100",
    );
  }
}

function validatePersonDocument(document) {
  const issues = [];
  const base = validateCommonEntityDocument(document);
  issues.push(...base.issues);

  if (document.type !== "person") {
    pushIssue(issues, "type", 'must be exactly "person"');
  }

  if (!PERSON_KINDS.includes(document.personKind)) {
    pushIssue(
      issues,
      "personKind",
      `must be one of: ${PERSON_KINDS.join(", ")}`,
    );
  }

  if (
    document.nationality !== undefined &&
    !isNonEmptyString(document.nationality)
  ) {
    pushIssue(
      issues,
      "nationality",
      "must be a non-empty string when provided",
    );
  }

  if (document.activeYears !== undefined) {
    validateActiveYears(document.activeYears, "activeYears", issues);
  }

  validateStringArray(document.teamIds, "teamIds", issues, { unique: true });
  validateStringArray(
    document.representativeSeasonIds,
    "representativeSeasonIds",
    issues,
    { unique: true },
  );

  if (document.championshipYears !== undefined) {
    if (!Array.isArray(document.championshipYears)) {
      pushIssue(issues, "championshipYears", "must be an array when provided");
    } else {
      const years = new Set();
      document.championshipYears.forEach((year, index) => {
        if (!isWholeNumber(year) || year < 1950 || year > 2100) {
          pushIssue(
            issues,
            `championshipYears[${index}]`,
            "must be an integer year between 1950 and 2100",
          );
        } else if (years.has(year)) {
          pushIssue(
            issues,
            `championshipYears[${index}]`,
            "must not contain duplicate years",
          );
        } else {
          years.add(year);
        }
      });
    }
  }

  return {
    success: issues.length === 0,
    issues,
  };
}

export function validateParticipantEntityDocument(document) {
  switch (document?.type) {
    case "car":
      return validateCarDocument(document);
    case "team":
      return validateTeamDocument(document);
    case "person":
      return validatePersonDocument(document);
    default:
      return validateCommonEntityDocument(document);
  }
}
