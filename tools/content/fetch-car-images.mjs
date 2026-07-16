// Bulk-download a freely-licensed lead photo for every car from Wikipedia/
// Wikimedia Commons, write a media manifest per car, and set coverMediaId on
// each car entity. Routes through the corporate proxy (proxy.nioint.com:8080)
// since GitHub/Wikipedia are otherwise blocked.
//
// Resumable: skips a car whose manifest already exists. Outputs a status
// report to /tmp/car-images-status.json for the task list (#Done / #NotFound).
import { readFile, writeFile, readdir } from "node:fs/promises";
import { existsSync, statSync } from "node:fs";
import { execSync } from "node:child_process";
import path from "node:path";

const ROOT = path.resolve(".");
const CARS_DIR = path.join(ROOT, "content/cars");
const MEDIA_DIR = path.join(ROOT, "content/media");
const IMG_DIR = path.join(ROOT, "public/images/web");
const PROXY = "http://proxy.nioint.com:8080";
const UA = "F1ChronicleBot/1.0 (educational F1 history app)";
const STATUS_OUT = "/tmp/car-images-status.json";

function curl(url, { maxTime = 30 } = {}) {
  try {
    return execSync(
      `curl -s -x "${PROXY}" --max-time ${maxTime} -A "${UA}" ${JSON.stringify(url)}`,
      {
        encoding: "utf8",
        maxBuffer: 20 * 1024 * 1024,
        stdio: ["pipe", "pipe", "ignore"],
      },
    );
  } catch {
    return "";
  }
}

function fetchJson(url) {
  const body = curl(url);
  if (!body) return null;
  try {
    return JSON.parse(body);
  } catch {
    return null;
  }
}

// Download + compress an image to <=500KB. Returns true on success.
function downloadAndCompress(url, destPath) {
  execSync(
    `curl -s -x "${PROXY}" --max-time 60 -A "${UA}" ${JSON.stringify(url)} -o ${JSON.stringify(destPath)}`,
    { stdio: "ignore" },
  );
  if (!existsSync(destPath) || statSync(destPath).size < 1000) return false;
  // Compress iteratively until under budget.
  let q = 80;
  let z = 1600;
  for (let i = 0; i < 6; i++) {
    execSync(
      `sips -s format jpeg -s formatOptions ${q} -Z ${z} ${JSON.stringify(destPath)} --out ${JSON.stringify(destPath)}`,
      { stdio: "ignore" },
    );
    if (statSync(destPath).size <= 512000) return true;
    q = Math.max(45, q - 10);
    z = Math.max(900, Math.round(z * 0.85));
  }
  return statSync(destPath).size <= 512000;
}

// Wikipedia REST summary -> {title, image}. Handles redirects.
function wikiSummary(title) {
  const enc = encodeURIComponent(title.replace(/ /g, "_"));
  const data = fetchJson(
    `https://en.wikipedia.org/api/rest_v1/page/summary/${enc}`,
  );
  if (!data || data.type === "disambiguation" || !data.originalimage)
    return null;
  return {
    title: data.title,
    image: data.originalimage.source,
    desc: data.extract,
  };
}

// Commons extmetadata -> license info for a file page.
function commonsLicense(filePageTitle) {
  const enc = encodeURIComponent(filePageTitle);
  const data = fetchJson(
    `https://commons.wikimedia.org/w/api.php?action=query&titles=${enc}&prop=imageinfo&iiprop=extmetadata&format=json`,
  );
  if (!data || !data.query) return null;
  const page = Object.values(data.query.pages)[0];
  if (!page.imageinfo) return null;
  const m = page.imageinfo[0].extmetadata || {};
  const clean = (v) =>
    v
      ? String(v)
          .replace(/<[^>]+>/g, "")
          .trim()
      : undefined;
  return {
    license: clean(m.LicenseShortName && m.LicenseShortName.value),
    artist: clean(m.Artist && m.Artist.value),
    credit: clean(m.Credit && m.Credit.value),
    licenseUrl: clean(m.LicenseUrl && m.LicenseUrl.value),
  };
}

// Derive a Commons "File:" page title from an upload.wikimedia.org URL.
function commonsFileFromUrl(url) {
  // .../thumb/a/ab/Name.jpg/640px-Name.jpg  -> Name.jpg
  // .../a/ab/Name.jpg                       -> Name.jpg
  const noThumb = url.replace("/thumb", "");
  const m = noThumb.match(/\/[0-9a-f]{1,2}\/([^/]+(?:\.[A-Za-z0-9]+))$/);
  if (!m) return null;
  return `File:${decodeURIComponent(m[1]).replace(/_/g, " ")}`;
}

// Build a sized 1280px thumb URL from any upload.wikimedia.org image URL.
function sizedThumb(url, px = 1280) {
  // Already a thumb?
  const thumbMatch = url.match(
    /^(.*\/thumb\/[0-9a-f]{1,2}\/[0-9a-f]{1,2}\/([^/]+\.[A-Za-z0-9]+))\/[0-9]+px-.*$/,
  );
  if (thumbMatch) {
    const base = thumbMatch[1];
    const file = thumbMatch[2];
    return `${base}/${px}px-${file}`;
  }
  // Original (non-thumb): synthesize a thumb URL.
  const origMatch = url.match(
    /^(.*\/(?:commons|en)\/[0-9a-f]{1,2}\/[0-9a-f]{1,2}\/([^/]+\.[A-Za-z0-9]+))$/,
  );
  if (origMatch) {
    const dir = origMatch[1];
    const file = origMatch[2];
    // Need the hash prefix path; reconstruct via /thumb/<same path>/<px>px-<file>
    const thumbBase = dir.replace(/\/(commons|en)\//, "/$1/thumb/");
    return `${thumbBase}/${px}px-${file}`;
  }
  return url; // give up on sizing; download original
}

async function main() {
  const cars = [];
  for (const f of await readdir(CARS_DIR)) {
    if (!f.endsWith(".json")) continue;
    const d = JSON.parse(await readFile(path.join(CARS_DIR, f), "utf8"));
    cars.push(d);
  }

  const status = {}; // carId -> {tag, mediaId?, reason?}
  const titleCache = new Map(); // searchTitle -> mediaId (dedupe)

  for (const car of cars) {
    const mediaId = `media-web-${car.id.replace(/^car-/, "")}-photo`;
    const manifestPath = path.join(MEDIA_DIR, `${mediaId}.json`);
    const title = (car.title && car.title.en) || car.id.replace(/^car-/, "");

    if (existsSync(manifestPath)) {
      status[car.id] = { tag: "#Done", mediaId };
      continue;
    }

    // Dedupe: same search title already resolved?
    const cached = titleCache.get(title);
    if (cached === null) {
      // Same title previously yielded no image — skip this car too.
      status[car.id] = {
        tag: "#NotFound",
        reason: "no Wikipedia lead image (shared title)",
      };
      continue;
    }
    if (cached) {
      // Copy the shared manifest into this car's own manifest id.
      const shared = JSON.parse(
        await readFile(path.join(MEDIA_DIR, `${cached}.json`), "utf8"),
      );
      const own = { ...shared, id: mediaId };
      await writeFile(
        manifestPath,
        JSON.stringify(own, null, 2) + "\n",
        "utf8",
      );
      car.coverMediaId = mediaId;
      await writeFile(
        path.join(CARS_DIR, `${car.id}.json`),
        JSON.stringify(car, null, 2) + "\n",
        "utf8",
      );
      status[car.id] = { tag: "#Done", mediaId, sharedFrom: cached };
      continue;
    }

    const summary = wikiSummary(title);
    if (!summary || !summary.image) {
      status[car.id] = { tag: "#NotFound", reason: "no Wikipedia lead image" };
      titleCache.set(title, null);
      continue;
    }

    const lic = commonsLicense(commonsFileFromUrl(summary.image)) || {};
    // Only accept clearly-free licenses.
    const free = /(CC BY|CC0|Public domain|GFDL|CC SA|CC-BY)/i.test(
      [lic.license, lic.licenseUrl].filter(Boolean).join(" "),
    );
    if (!free) {
      status[car.id] = {
        tag: "#NotFound",
        reason: `non-free license: ${lic.license || "unknown"}`,
      };
      continue;
    }

    const imgPath = path.join(
      IMG_DIR,
      `${car.id.replace(/^car-/, "")}-photo.jpg`,
    );
    const ok = downloadAndCompress(sizedThumb(summary.image, 1280), imgPath);
    if (!ok) {
      status[car.id] = { tag: "#NotFound", reason: "download/compress failed" };
      continue;
    }

    const creditAuthor = lic.artist || "Wikimedia Commons";
    const doc = {
      schemaVersion: 1,
      type: "mediaAsset",
      id: mediaId,
      kind: "image",
      src: `/images/web/${car.id.replace(/^car-/, "")}-photo.jpg`,
      alt: { zh: title, en: title },
      caption: { zh: title, en: title },
      credit: `${creditAuthor}（维基共享资源）`,
      rights: {
        status:
          lic.license && /public/i.test(lic.license)
            ? "public-domain"
            : "licensed",
        license: lic.license || "see source",
        sourceUrl: lic.credit || summary.image,
      },
    };
    await writeFile(manifestPath, JSON.stringify(doc, null, 2) + "\n", "utf8");
    car.coverMediaId = mediaId;
    await writeFile(
      path.join(CARS_DIR, `${car.id}.json`),
      JSON.stringify(car, null, 2) + "\n",
      "utf8",
    );
    titleCache.set(title, mediaId);
    status[car.id] = {
      tag: "#Done",
      mediaId,
      license: lic.license,
      credit: creditAuthor,
    };
    process.stdout.write(".");
  }

  await writeFile(STATUS_OUT, JSON.stringify(status, null, 2), "utf8");
  const done = Object.values(status).filter((s) => s.tag === "#Done").length;
  const notfound = Object.values(status).filter(
    (s) => s.tag === "#NotFound",
  ).length;
  console.log(
    `\n\n#Done: ${done} | #NotFound: ${notfound} | total: ${cars.length}`,
  );
  console.log(`Status report -> ${STATUS_OUT}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
