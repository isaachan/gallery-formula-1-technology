import { supportedBlockTypes as registeredBlockTypes } from "../blocks/block-types.mjs";

const ENTITY_STATUSES = ["draft", "published", "archived"];
const IMAGE_LAYOUTS = ["full", "inset", "portrait"];
const MODEL_CAMERAS = ["front", "three-quarter", "exploded"];
const MODEL_INTERACTIONS = ["orbit", "turntable"];
const FACT_GRID_ACCENTS = ["default", "highlight"];

function isPlainObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function isIsoDateTime(value) {
  return (
    typeof value === "string" &&
    value.includes("T") &&
    !Number.isNaN(Date.parse(value))
  );
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

function validateStringArray(value, path, issues, options = {}) {
  const { nonEmpty = false, unique = false } = options;

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

function validateBlockBase(block, path, issues) {
  if (!isNonEmptyString(block.id)) {
    pushIssue(issues, `${path}.id`, "must be a stable non-empty string");
  }

  if (block.heading !== undefined) {
    validateLocaleText(block.heading, `${path}.heading`, issues);
  }

  if (block.sourceIds !== undefined) {
    validateStringArray(block.sourceIds, `${path}.sourceIds`, issues, {
      unique: true,
    });
  }
}

function validateRichTextBlock(block, path, issues) {
  validateBlockBase(block, path, issues);
  validateLocaleText(block.content, `${path}.content`, issues);
}

function validateImageLikeBlock(block, path, issues) {
  validateBlockBase(block, path, issues);

  if (!isNonEmptyString(block.mediaId)) {
    pushIssue(issues, `${path}.mediaId`, "must be a non-empty media asset id");
  }

  if (block.layout !== undefined && !IMAGE_LAYOUTS.includes(block.layout)) {
    pushIssue(
      issues,
      `${path}.layout`,
      `must be one of: ${IMAGE_LAYOUTS.join(", ")}`,
    );
  }
}

function validateGalleryBlock(block, path, issues) {
  validateBlockBase(block, path, issues);
  validateStringArray(block.mediaIds, `${path}.mediaIds`, issues, {
    nonEmpty: true,
    unique: true,
  });
}

function validateFactGridBlock(block, path, issues) {
  validateBlockBase(block, path, issues);

  if (!Array.isArray(block.items) || block.items.length === 0) {
    pushIssue(issues, `${path}.items`, "must contain at least one fact item");
    return;
  }

  block.items.forEach((item, index) => {
    const itemPath = `${path}.items[${index}]`;
    if (!isPlainObject(item)) {
      pushIssue(issues, itemPath, "must be an object");
      return;
    }
    validateLocaleText(item.label, `${itemPath}.label`, issues);
    validateLocaleText(item.value, `${itemPath}.value`, issues);
    if (item.accent !== undefined && !FACT_GRID_ACCENTS.includes(item.accent)) {
      pushIssue(
        issues,
        `${itemPath}.accent`,
        `must be one of: ${FACT_GRID_ACCENTS.join(", ")}`,
      );
    }
  });
}

function validateQuoteBlock(block, path, issues) {
  validateBlockBase(block, path, issues);
  validateLocaleText(block.quote, `${path}.quote`, issues);
  if (block.attribution !== undefined) {
    validateLocaleText(block.attribution, `${path}.attribution`, issues);
  }
}

function validateModel3dBlock(block, path, issues) {
  validateImageLikeBlock(block, path, issues);

  if (
    block.initialCamera !== undefined &&
    !MODEL_CAMERAS.includes(block.initialCamera)
  ) {
    pushIssue(
      issues,
      `${path}.initialCamera`,
      `must be one of: ${MODEL_CAMERAS.join(", ")}`,
    );
  }

  if (
    block.interaction !== undefined &&
    !MODEL_INTERACTIONS.includes(block.interaction)
  ) {
    pushIssue(
      issues,
      `${path}.interaction`,
      `must be one of: ${MODEL_INTERACTIONS.join(", ")}`,
    );
  }

  if (block.annotations !== undefined) {
    if (!Array.isArray(block.annotations)) {
      pushIssue(
        issues,
        `${path}.annotations`,
        "must be an array when provided",
      );
      return;
    }

    block.annotations.forEach((annotation, index) => {
      const annotationPath = `${path}.annotations[${index}]`;
      if (!isPlainObject(annotation)) {
        pushIssue(issues, annotationPath, "must be an object");
        return;
      }
      validateLocaleText(annotation.label, `${annotationPath}.label`, issues);
      if (
        !Array.isArray(annotation.position) ||
        annotation.position.length !== 3 ||
        !annotation.position.every((value) => typeof value === "number")
      ) {
        pushIssue(
          issues,
          `${annotationPath}.position`,
          "must be a numeric [x, y, z] tuple",
        );
      }
    });
  }
}

function validateRelatedEntitiesBlock(block, path, issues) {
  validateBlockBase(block, path, issues);
  validateStringArray(block.entityIds, `${path}.entityIds`, issues, {
    nonEmpty: true,
    unique: true,
  });
}

export function validateContentBlock(block, path = "blocks[0]") {
  const issues = [];

  if (!isPlainObject(block)) {
    return [{ path, message: "must be an object" }];
  }

  if (!isNonEmptyString(block.type)) {
    return [{ path: `${path}.type`, message: "must be a non-empty string" }];
  }

  switch (block.type) {
    case "richText":
      validateRichTextBlock(block, path, issues);
      break;
    case "image":
    case "diagram":
    case "animation":
    case "audio":
    case "video":
      validateImageLikeBlock(block, path, issues);
      break;
    case "gallery":
      validateGalleryBlock(block, path, issues);
      break;
    case "factGrid":
      validateFactGridBlock(block, path, issues);
      break;
    case "quote":
      validateQuoteBlock(block, path, issues);
      break;
    case "model3d":
      validateModel3dBlock(block, path, issues);
      break;
    case "relatedEntities":
      validateRelatedEntitiesBlock(block, path, issues);
      break;
    default:
      pushIssue(
        issues,
        `${path}.type`,
        `must be a supported block type, received "${block.type}"`,
      );
  }

  return issues;
}

export function validateCommonEntityDocument(document) {
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

  if (!isNonEmptyString(document.type)) {
    pushIssue(issues, "type", "must be a non-empty string");
  }

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)+$/.test(document.id ?? "")) {
    pushIssue(
      issues,
      "id",
      "must be a stable kebab-case id with at least one namespace segment",
    );
  }

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(document.slug ?? "")) {
    pushIssue(issues, "slug", "must be a kebab-case slug");
  }

  if (!ENTITY_STATUSES.includes(document.status)) {
    pushIssue(
      issues,
      "status",
      `must be one of: ${ENTITY_STATUSES.join(", ")}`,
    );
  }

  validateLocaleText(document.title, "title", issues);
  validateLocaleText(document.summary, "summary", issues);

  if (document.subtitle !== undefined) {
    validateLocaleText(document.subtitle, "subtitle", issues);
  }

  if (document.aliases !== undefined) {
    validateStringArray(document.aliases, "aliases", issues, { unique: true });
  }

  if (
    document.coverMediaId !== undefined &&
    !isNonEmptyString(document.coverMediaId)
  ) {
    pushIssue(issues, "coverMediaId", "must be a non-empty string");
  }

  validateStringArray(document.sourceIds, "sourceIds", issues, {
    nonEmpty: true,
    unique: true,
  });

  if (document.redirectFrom !== undefined) {
    validateStringArray(document.redirectFrom, "redirectFrom", issues, {
      unique: true,
    });

    if (
      Array.isArray(document.redirectFrom) &&
      document.redirectFrom.includes(document.slug)
    ) {
      pushIssue(issues, "redirectFrom", "must not include the current slug");
    }
  }

  if (!Array.isArray(document.blocks)) {
    pushIssue(issues, "blocks", "must be an array");
  } else {
    document.blocks.forEach((block, index) => {
      issues.push(...validateContentBlock(block, `blocks[${index}]`));
    });
  }

  if (
    document.authoredBy !== undefined &&
    !isNonEmptyString(document.authoredBy)
  ) {
    pushIssue(issues, "authoredBy", "must be a non-empty string when provided");
  }

  if (
    document.reviewedBy !== undefined &&
    !isNonEmptyString(document.reviewedBy)
  ) {
    pushIssue(issues, "reviewedBy", "must be a non-empty string when provided");
  }

  if (!isIsoDateTime(document.updatedAt)) {
    pushIssue(issues, "updatedAt", "must be an ISO 8601 datetime string");
  }

  if (document.publishAt !== undefined && !isIsoDateTime(document.publishAt)) {
    pushIssue(issues, "publishAt", "must be an ISO 8601 datetime string");
  }

  return {
    success: issues.length === 0,
    issues,
  };
}

export function formatValidationIssue(filePath, issue) {
  return `${filePath}:${issue.path || "<root>"} ${issue.message}`;
}

export const supportedBlockTypes = [...registeredBlockTypes];

export const supportedEntityStatuses = ENTITY_STATUSES;
