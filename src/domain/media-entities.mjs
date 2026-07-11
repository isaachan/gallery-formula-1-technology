const MEDIA_KINDS = ["image", "audio", "video", "model3d", "poster"];
const RIGHTS_STATUSES = [
  "owned",
  "licensed",
  "public-domain",
  "permission-required",
];
const MODEL_FORMATS = ["gltf", "glb"];

function isPlainObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function isPositiveNumber(value) {
  return typeof value === "number" && value > 0;
}

function pushIssue(issues, path, message) {
  issues.push({ path, message });
}

function validateLocaleText(value, path, issues) {
  if (!isPlainObject(value)) {
    pushIssue(issues, path, "must be an object with zh and optional en fields");
    return;
  }

  if (!isNonEmptyString(value.zh)) {
    pushIssue(issues, `${path}.zh`, "must be a non-empty Chinese string");
  }

  if (value.en !== undefined && !isNonEmptyString(value.en)) {
    pushIssue(issues, `${path}.en`, "must be a non-empty string when provided");
  }
}

function validateVariant(variant, path, issues) {
  if (!isPlainObject(variant)) {
    pushIssue(issues, path, "must be an object");
    return;
  }

  if (!isNonEmptyString(variant.src)) {
    pushIssue(issues, `${path}.src`, "must be a non-empty string");
  }

  if (!isNonEmptyString(variant.mimeType)) {
    pushIssue(issues, `${path}.mimeType`, "must be a non-empty MIME type");
  }

  for (const field of ["width", "height", "bytes"]) {
    if (
      variant[field] !== undefined &&
      (!Number.isInteger(variant[field]) || variant[field] <= 0)
    ) {
      pushIssue(
        issues,
        `${path}.${field}`,
        "must be a positive integer when provided",
      );
    }
  }
}

function validateRights(rights, path, issues) {
  if (!isPlainObject(rights)) {
    pushIssue(issues, path, "must be an object");
    return;
  }

  if (!RIGHTS_STATUSES.includes(rights.status)) {
    pushIssue(
      issues,
      `${path}.status`,
      `must be one of: ${RIGHTS_STATUSES.join(", ")}`,
    );
  }

  for (const field of ["license", "sourceUrl"]) {
    if (rights[field] !== undefined && !isNonEmptyString(rights[field])) {
      pushIssue(
        issues,
        `${path}.${field}`,
        "must be a non-empty string when provided",
      );
    }
  }

  if (rights.expiresAt !== undefined && !isNonEmptyString(rights.expiresAt)) {
    pushIssue(
      issues,
      `${path}.expiresAt`,
      "must be a non-empty string when provided",
    );
  }
}

function validateModel(model, path, issues) {
  if (!isPlainObject(model)) {
    pushIssue(issues, path, "must be an object when provided");
    return;
  }

  if (!MODEL_FORMATS.includes(model.format)) {
    pushIssue(
      issues,
      `${path}.format`,
      `must be one of: ${MODEL_FORMATS.join(", ")}`,
    );
  }

  for (const field of ["draco", "meshopt", "ktx2"]) {
    if (model[field] !== undefined && typeof model[field] !== "boolean") {
      pushIssue(issues, `${path}.${field}`, "must be a boolean when provided");
    }
  }

  if (model.scale !== undefined && !isPositiveNumber(model.scale)) {
    pushIssue(
      issues,
      `${path}.scale`,
      "must be a positive number when provided",
    );
  }

  if (model.cameraTarget !== undefined) {
    if (
      !Array.isArray(model.cameraTarget) ||
      model.cameraTarget.length !== 3 ||
      !model.cameraTarget.every((value) => typeof value === "number")
    ) {
      pushIssue(
        issues,
        `${path}.cameraTarget`,
        "must be a numeric [x, y, z] tuple",
      );
    }
  }
}

export function validateMediaAssetDocument(document) {
  const issues = [];

  if (!isPlainObject(document)) {
    return {
      success: false,
      issues: [{ path: "", message: "document must be an object" }],
    };
  }

  if (document.schemaVersion !== 1) {
    pushIssue(issues, "schemaVersion", "must be exactly 1");
  }

  if (document.type !== "mediaAsset") {
    pushIssue(issues, "type", 'must be exactly "mediaAsset"');
  }

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)+$/.test(document.id ?? "")) {
    pushIssue(
      issues,
      "id",
      "must be a stable kebab-case id with at least one namespace segment",
    );
  }

  if (!MEDIA_KINDS.includes(document.kind)) {
    pushIssue(issues, "kind", `must be one of: ${MEDIA_KINDS.join(", ")}`);
  }

  if (!isNonEmptyString(document.src)) {
    pushIssue(issues, "src", "must be a non-empty source URL or path");
  }

  if (document.variants !== undefined) {
    if (!Array.isArray(document.variants) || document.variants.length === 0) {
      pushIssue(
        issues,
        "variants",
        "must contain at least one variant when provided",
      );
    } else {
      document.variants.forEach((variant, index) => {
        validateVariant(variant, `variants[${index}]`, issues);
      });
    }
  }

  validateLocaleText(document.alt, "alt", issues);

  if (document.caption !== undefined) {
    validateLocaleText(document.caption, "caption", issues);
  }

  if (document.credit !== undefined && !isNonEmptyString(document.credit)) {
    pushIssue(issues, "credit", "must be a non-empty string when provided");
  }

  validateRights(document.rights, "rights", issues);

  for (const field of ["posterMediaId", "fallbackMediaId"]) {
    if (document[field] !== undefined && !isNonEmptyString(document[field])) {
      pushIssue(issues, field, "must be a non-empty string when provided");
    }
  }

  if (
    ["video", "model3d"].includes(document.kind) &&
    !isNonEmptyString(document.posterMediaId)
  ) {
    pushIssue(
      issues,
      "posterMediaId",
      "is required for video and model3d assets",
    );
  }

  if (document.focalPoint !== undefined) {
    if (!isPlainObject(document.focalPoint)) {
      pushIssue(issues, "focalPoint", "must be an object when provided");
    } else {
      for (const field of ["x", "y"]) {
        if (
          typeof document.focalPoint[field] !== "number" ||
          document.focalPoint[field] < 0 ||
          document.focalPoint[field] > 1
        ) {
          pushIssue(
            issues,
            `focalPoint.${field}`,
            "must be a number between 0 and 1",
          );
        }
      }
    }
  }

  if (document.model !== undefined) {
    validateModel(document.model, "model", issues);
  }

  if (document.kind === "model3d" && document.model === undefined) {
    pushIssue(issues, "model", "is required for model3d assets");
  }

  return {
    success: issues.length === 0,
    issues,
  };
}
