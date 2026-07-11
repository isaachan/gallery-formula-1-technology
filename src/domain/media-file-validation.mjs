import { access, stat } from "node:fs/promises";
import path from "node:path";

const EXTENSION_MIME_MAP = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".svg": "image/svg+xml",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".ogg": "audio/ogg",
  ".glb": "model/gltf-binary",
  ".gltf": "model/gltf+json",
};

const IMAGE_BYTE_WARN_LIMIT = 500 * 1024;
const MODEL_BYTE_WARN_LIMIT = 8 * 1024 * 1024;
const MODEL_BYTE_APPROVAL_LIMIT = 15 * 1024 * 1024;

function getAllowedRemoteOrigins() {
  return (process.env.CONTENT_MEDIA_ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function isRemoteUrl(src) {
  return /^https?:\/\//i.test(src);
}

function resolveLocalFilePath(src, publicRoot) {
  const relative = src.startsWith("/") ? src.slice(1) : src;
  return path.join(publicRoot, relative);
}

function budgetLimitsFor(kind) {
  return kind === "model3d"
    ? {
        warnLimit: MODEL_BYTE_WARN_LIMIT,
        approvalLimit: MODEL_BYTE_APPROVAL_LIMIT,
      }
    : { warnLimit: IMAGE_BYTE_WARN_LIMIT, approvalLimit: null };
}

async function checkSource(
  src,
  { fieldPath, expectedMimeType, budgetLimits, publicRoot },
) {
  const issues = [];

  if (isRemoteUrl(src)) {
    const allowedOrigins = getAllowedRemoteOrigins();
    const origin = new URL(src).origin;
    if (!allowedOrigins.includes(origin)) {
      issues.push({
        path: fieldPath,
        message: `references a remote origin "${origin}" that is not in the configured allowlist (set CONTENT_MEDIA_ALLOWED_ORIGINS to permit it)`,
      });
    }
    return issues;
  }

  const filePath = resolveLocalFilePath(src, publicRoot);
  try {
    await access(filePath);
  } catch {
    issues.push({
      path: fieldPath,
      message: `references a file that does not exist: ${filePath}`,
    });
    return issues;
  }

  const extension = path.extname(filePath).toLowerCase();
  const inferredMimeType = EXTENSION_MIME_MAP[extension];
  if (
    expectedMimeType &&
    inferredMimeType &&
    inferredMimeType !== expectedMimeType
  ) {
    issues.push({
      path: fieldPath,
      message: `declares mimeType "${expectedMimeType}" but the file extension "${extension}" implies "${inferredMimeType}"`,
    });
  }

  if (budgetLimits) {
    const { size } = await stat(filePath);
    if (budgetLimits.approvalLimit && size > budgetLimits.approvalLimit) {
      issues.push({
        path: fieldPath,
        message: `is ${Math.round(size / 1024)}KB, which exceeds the ${Math.round(budgetLimits.approvalLimit / 1024)}KB limit and requires explicit recorded approval`,
      });
    } else if (size > budgetLimits.warnLimit) {
      issues.push({
        path: fieldPath,
        message: `is ${Math.round(size / 1024)}KB, above the recommended ${Math.round(budgetLimits.warnLimit / 1024)}KB budget`,
      });
    }
  }

  return issues;
}

export async function validateMediaAssetFiles(document, { publicRoot }) {
  const budgetLimits = budgetLimitsFor(document.kind);
  const checks = [];

  if (typeof document.src === "string") {
    checks.push(
      checkSource(document.src, {
        fieldPath: "src",
        budgetLimits,
        publicRoot,
      }),
    );
  }

  if (Array.isArray(document.variants)) {
    document.variants.forEach((variant, index) => {
      if (typeof variant?.src === "string") {
        checks.push(
          checkSource(variant.src, {
            fieldPath: `variants[${index}].src`,
            expectedMimeType: variant.mimeType,
            budgetLimits,
            publicRoot,
          }),
        );
      }
    });
  }

  const results = await Promise.all(checks);
  return results.flat();
}
