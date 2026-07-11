import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const CONTENT_ROOT = path.join(process.cwd(), "content");
const PUBLIC_ROOT = path.join(process.cwd(), "public");

function isEntityDocument(document) {
  return typeof document?.type === "string" && document.type !== "mediaAsset";
}

function collectMediaReferences(document) {
  const references = new Set();

  for (const block of document.blocks ?? []) {
    if (typeof block?.mediaId === "string" && block.mediaId.length > 0) {
      references.add(block.mediaId);
    }

    if (Array.isArray(block?.items)) {
      for (const item of block.items) {
        if (typeof item?.mediaId === "string" && item.mediaId.length > 0) {
          references.add(item.mediaId);
        }
      }
    }
  }

  return [...references];
}

async function collectJsonFiles(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
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

async function readDocuments() {
  const files = await collectJsonFiles(CONTENT_ROOT);
  const documents = await Promise.all(
    files.map(async (filePath) => {
      const contents = await fs.readFile(filePath, "utf8");
      return {
        filePath,
        document: JSON.parse(contents),
      };
    }),
  );

  const mediaAssets = new Map();
  const entitiesByMediaId = new Map();

  for (const entry of documents) {
    if (entry.document.type === "mediaAsset") {
      mediaAssets.set(entry.document.id, entry);
      continue;
    }

    if (!isEntityDocument(entry.document)) {
      continue;
    }

    for (const mediaId of collectMediaReferences(entry.document)) {
      const entityList = entitiesByMediaId.get(mediaId) ?? [];
      entityList.push({
        id: entry.document.id,
        type: entry.document.type,
        title: entry.document.title?.zh ?? entry.document.id,
        filePath: path.relative(process.cwd(), entry.filePath),
      });
      entitiesByMediaId.set(mediaId, entityList);
    }
  }

  return {
    mediaAssets,
    entitiesByMediaId,
  };
}

async function checkLocalAsset(src) {
  const localPath = path.join(PUBLIC_ROOT, src.replace(/^\//, ""));
  await fs.access(localPath);
}

async function checkRemoteAsset(src) {
  const response = await fetch(src, {
    method: "HEAD",
    redirect: "follow",
  });

  if (!response.ok) {
    throw new Error(`remote responded with ${response.status}`);
  }
}

async function main() {
  const { mediaAssets, entitiesByMediaId } = await readDocuments();
  const failures = [];

  for (const [mediaId, entry] of mediaAssets) {
    const src = entry.document.src;

    try {
      if (typeof src !== "string" || src.length === 0) {
        throw new Error("missing src");
      }

      if (/^https?:\/\//.test(src)) {
        await checkRemoteAsset(src);
      } else {
        await checkLocalAsset(src);
      }
    } catch (error) {
      const affectedEntities = entitiesByMediaId.get(mediaId) ?? [];
      failures.push({
        mediaId,
        src,
        reason: error instanceof Error ? error.message : String(error),
        entities: affectedEntities,
      });
    }
  }

  if (failures.length > 0) {
    nodeReplSafeWrite(JSON.stringify({ failures }, null, 2));
    process.exitCode = 1;
    return;
  }

  nodeReplSafeWrite(
    JSON.stringify(
      {
        checkedAssets: mediaAssets.size,
        affectedEntities: [...entitiesByMediaId.values()].flat().length,
      },
      null,
      2,
    ),
  );
}

function nodeReplSafeWrite(value) {
  process.stdout.write(`${value}\n`);
}

await main();
