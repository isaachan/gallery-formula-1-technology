import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const CONTENT_ROOT = path.join(process.cwd(), "content", "media");
const WARNING_WINDOW_DAYS = 30;
const PUBLISHABLE_STATUSES = new Set(["owned", "licensed", "public-domain"]);

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

function daysUntil(dateString) {
  const today = new Date();
  const target = new Date(`${dateString}T00:00:00.000Z`);
  const millisecondsPerDay = 24 * 60 * 60 * 1000;
  return Math.floor((target.getTime() - today.getTime()) / millisecondsPerDay);
}

async function main() {
  const files = await collectJsonFiles(CONTENT_ROOT);
  const blocked = [];
  const expiring = [];

  for (const filePath of files) {
    const document = JSON.parse(await fs.readFile(filePath, "utf8"));
    const status = document?.rights?.status;

    if (!PUBLISHABLE_STATUSES.has(status)) {
      blocked.push({
        mediaId: document.id,
        status,
        filePath: path.relative(process.cwd(), filePath),
      });
    }

    if (typeof document?.rights?.expiresAt === "string") {
      const remainingDays = daysUntil(document.rights.expiresAt);
      if (remainingDays <= WARNING_WINDOW_DAYS) {
        expiring.push({
          mediaId: document.id,
          expiresAt: document.rights.expiresAt,
          remainingDays,
          filePath: path.relative(process.cwd(), filePath),
        });
      }
    }
  }

  const summary = {
    warningWindowDays: WARNING_WINDOW_DAYS,
    blocked,
    expiring,
  };

  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);

  if (blocked.length > 0 || expiring.some((entry) => entry.remainingDays < 0)) {
    process.exitCode = 1;
  }
}

await main();
