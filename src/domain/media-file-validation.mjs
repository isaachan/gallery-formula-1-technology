import { access, readFile, stat } from "node:fs/promises";
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

function readPngDimensions(buffer) {
  const signature = "89504e470d0a1a0a";
  if (buffer.subarray(0, 8).toString("hex") !== signature) {
    return null;
  }

  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

function readJpegDimensions(buffer) {
  if (buffer[0] !== 0xff || buffer[1] !== 0xd8) {
    return null;
  }

  let offset = 2;
  while (offset < buffer.length) {
    if (buffer[offset] !== 0xff) {
      offset += 1;
      continue;
    }

    const marker = buffer[offset + 1];
    const blockLength = buffer.readUInt16BE(offset + 2);
    const isStartOfFrame =
      marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker);

    if (isStartOfFrame) {
      return {
        height: buffer.readUInt16BE(offset + 5),
        width: buffer.readUInt16BE(offset + 7),
      };
    }

    offset += 2 + blockLength;
  }

  return null;
}

function readWebpDimensions(buffer) {
  if (
    buffer.subarray(0, 4).toString("ascii") !== "RIFF" ||
    buffer.subarray(8, 12).toString("ascii") !== "WEBP"
  ) {
    return null;
  }

  const chunkType = buffer.subarray(12, 16).toString("ascii");
  if (chunkType === "VP8X") {
    return {
      width: 1 + buffer.readUIntLE(24, 3),
      height: 1 + buffer.readUIntLE(27, 3),
    };
  }

  if (chunkType === "VP8L") {
    const bits = buffer.readUInt32LE(21);
    return {
      width: (bits & 0x3fff) + 1,
      height: ((bits >> 14) & 0x3fff) + 1,
    };
  }

  return null;
}

function readSvgDimensions(buffer) {
  const source = buffer.toString("utf8");
  const widthMatch = source.match(/\bwidth="(\d+(?:\.\d+)?)"/i);
  const heightMatch = source.match(/\bheight="(\d+(?:\.\d+)?)"/i);

  if (widthMatch && heightMatch) {
    return {
      width: Math.round(Number(widthMatch[1])),
      height: Math.round(Number(heightMatch[1])),
    };
  }

  const viewBoxMatch = source.match(
    /\bviewBox="(?:[-\d.]+\s+){2}([-\d.]+)\s+([-\d.]+)"/i,
  );
  if (viewBoxMatch) {
    return {
      width: Math.round(Number(viewBoxMatch[1])),
      height: Math.round(Number(viewBoxMatch[2])),
    };
  }

  return null;
}

async function readLocalDimensions(filePath) {
  const buffer = await readFile(filePath);

  return (
    readPngDimensions(buffer) ??
    readJpegDimensions(buffer) ??
    readWebpDimensions(buffer) ??
    readSvgDimensions(buffer)
  );
}

async function checkSource(
  src,
  {
    fieldPath,
    expectedMimeType,
    expectedWidth,
    expectedHeight,
    budgetLimits,
    publicRoot,
  },
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

  if (
    Number.isFinite(expectedWidth) &&
    Number.isFinite(expectedHeight) &&
    ["image/jpeg", "image/png", "image/webp", "image/svg+xml"].includes(
      expectedMimeType,
    )
  ) {
    const actualDimensions = await readLocalDimensions(filePath);
    if (
      actualDimensions &&
      (actualDimensions.width !== expectedWidth ||
        actualDimensions.height !== expectedHeight)
    ) {
      issues.push({
        path: fieldPath,
        message: `declares ${expectedWidth}x${expectedHeight} but the file is ${actualDimensions.width}x${actualDimensions.height}`,
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
            expectedWidth: variant.width,
            expectedHeight: variant.height,
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
