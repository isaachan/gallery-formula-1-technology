// Bulk-download a freely-licensed profile photo for every person (drivers,
// engineers, designers, principals) from Wikipedia/Wikimedia Commons, write a
// media manifest per person, and set coverMediaId. Routes through the corporate
// proxy. Resumable (skips people whose manifest already exists). Writes a status
// report to /tmp/people-images-status.json (#Done / #NotFound).
import { readFile, writeFile, readdir } from "node:fs/promises";
import { existsSync, statSync } from "node:fs";
import { execSync } from "node:child_process";
import path from "node:path";

const ROOT = path.resolve(".");
const PEOPLE_DIR = path.join(ROOT, "content/people");
const MEDIA_DIR = path.join(ROOT, "content/media");
const IMG_DIR = path.join(ROOT, "public/images/web");
const PROXY = process.env.FETCH_PROXY ?? "http://proxy.nioint.com:8080";
const UA = "F1ChronicleBot/1.0 (educational F1 history app)";
const STATUS_OUT = "/tmp/people-images-status.json";

if (process.env.FETCH_PROXY === "none") {
  // opt-out of proxying (e.g. when on a VPN that gives direct access)
}

function curl(url, { maxTime = 30 } = {}) {
  const proxyArg = PROXY === "none" ? "" : `-x "${PROXY}"`;
  try {
    return execSync(
      `curl -s ${proxyArg} --connect-timeout 10 --max-time ${maxTime} --speed-time 15 --speed-limit 1000 -A "${UA}" ${JSON.stringify(url)}`,
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
function isImageFile(p) {
  // Sniff magic bytes so an HTML error page (404) isn't mistaken for an image.
  let fd;
  try {
    fd = execSync(`head -c 12 ${JSON.stringify(p)}`, {
      encoding: "buffer",
      stdio: ["pipe", "pipe", "ignore"],
    });
  } catch {
    return false;
  }
  if (fd.length < 3) return false;
  if (fd[0] === 0xff && fd[1] === 0xd8) return true; // JPEG
  if (fd.slice(0, 4).toString("ascii") === "\x89PNG") return true; // PNG
  if (fd.slice(0, 3).toString("ascii") === "GIF") return true; // GIF
  if (
    fd.slice(0, 4).toString("ascii") === "RIFF" &&
    fd.slice(8, 12).toString("ascii") === "WEBP"
  )
    return true; // WebP
  return false;
}
function downloadAndCompress(url, destPath) {
  const proxyArg = PROXY === "none" ? "" : `-x "${PROXY}"`;
  try {
    execSync(
      `curl -s ${proxyArg} --connect-timeout 10 --max-time 60 --speed-time 15 --speed-limit 1000 -A "${UA}" ${JSON.stringify(url)} -o ${JSON.stringify(destPath)}`,
      { stdio: "ignore" },
    );
  } catch {
    return false;
  }
  if (!existsSync(destPath) || statSync(destPath).size < 1000) return false;
  if (!isImageFile(destPath)) return false; // HTML error page, SVG, etc.
  let q = 80,
    z = 800;
  for (let i = 0; i < 6; i++) {
    try {
      execSync(
        `sips -s format jpeg -s formatOptions ${q} -Z ${z} ${JSON.stringify(destPath)} --out ${JSON.stringify(destPath)}`,
        { stdio: "ignore" },
      );
    } catch {
      return false;
    }
    if (statSync(destPath).size <= 512000) return true;
    q = Math.max(40, q - 10);
    z = Math.max(400, Math.round(z * 0.8));
  }
  return statSync(destPath).size <= 512000;
}
function wikiSummary(title) {
  const enc = encodeURIComponent(title.replace(/ /g, "_"));
  const d = fetchJson(
    `https://en.wikipedia.org/api/rest_v1/page/summary/${enc}`,
  );
  if (!d || d.type === "disambiguation" || !d.originalimage) return null;
  return { title: d.title, image: d.originalimage.source };
}
function commonsLicense(filePageTitle) {
  const enc = encodeURIComponent(filePageTitle);
  const d = fetchJson(
    `https://commons.wikimedia.org/w/api.php?action=query&titles=${enc}&prop=imageinfo&iiprop=extmetadata&format=json`,
  );
  if (!d || !d.query) return null;
  const page = Object.values(d.query.pages)[0];
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
function commonsFileFromUrl(url) {
  const noThumb = url.replace("/thumb", "");
  const m = noThumb.match(/\/[0-9a-f]{1,2}\/([^/]+(?:\.[A-Za-z0-9]+))$/);
  return m ? `File:${decodeURIComponent(m[1]).replace(/_/g, " ")}` : null;
}
function sizedThumb(url, px = 400) {
  const thumbMatch = url.match(
    /^(.*\/thumb\/[0-9a-f]{1,2}\/[0-9a-f]{1,2}\/([^/]+\.[A-Za-z0-9]+))\/[0-9]+px-.*$/,
  );
  if (thumbMatch) return `${thumbMatch[1]}/${px}px-${thumbMatch[2]}`;
  const origMatch = url.match(
    /^(.*\/(?:commons|en)\/[0-9a-f]{1,2}\/[0-9a-f]{1,2}\/([^/]+\.[A-Za-z0-9]+))$/,
  );
  if (origMatch)
    return `${origMatch[1].replace(/\/(commons|en)\//, "/$1/thumb/")}/${px}px-${origMatch[2]}`;
  return url;
}

async function main() {
  const people = [];
  for (const f of await readdir(PEOPLE_DIR)) {
    if (!f.endsWith(".json")) continue;
    people.push(JSON.parse(await readFile(path.join(PEOPLE_DIR, f), "utf8")));
  }
  // Prefer the English name for the Wikipedia search title.
  people.sort((a, b) => (a.title?.en || "").localeCompare(b.title?.en || ""));

  const status = {};
  const titleCache = new Map();
  let dotCount = 0;

  for (const person of people) {
    const slug = person.slug;
    const mediaId = `media-web-${slug}-photo`;
    const manifestPath = path.join(MEDIA_DIR, `${mediaId}.json`);

    if (existsSync(manifestPath)) {
      status[person.id] = { tag: "#Done", mediaId };
      continue;
    }

    const title = person.title?.en || slug;
    const cached = titleCache.get(title);
    if (cached === null) {
      status[person.id] = {
        tag: "#NotFound",
        reason: "no Wikipedia lead image (shared name)",
      };
      continue;
    }
    if (cached) {
      const shared = JSON.parse(
        await readFile(path.join(MEDIA_DIR, `${cached}.json`), "utf8"),
      );
      const own = { ...shared, id: mediaId };
      await writeFile(
        manifestPath,
        JSON.stringify(own, null, 2) + "\n",
        "utf8",
      );
      person.coverMediaId = mediaId;
      await writeFile(
        path.join(PEOPLE_DIR, `${person.id}.json`),
        JSON.stringify(person, null, 2) + "\n",
        "utf8",
      );
      status[person.id] = { tag: "#Done", mediaId, sharedFrom: cached };
      continue;
    }

    process.stdout.write(`\n[${title}] `);
    const summary = wikiSummary(title);
    if (!summary || !summary.image) {
      status[person.id] = {
        tag: "#NotFound",
        reason: "no Wikipedia lead image",
      };
      titleCache.set(title, null);
      continue;
    }
    const lic = commonsLicense(commonsFileFromUrl(summary.image)) || {};
    const free = /(CC BY|CC0|Public domain|GFDL|CC SA|CC-BY)/i.test(
      [lic.license, lic.licenseUrl].filter(Boolean).join(" "),
    );
    if (!free) {
      status[person.id] = {
        tag: "#NotFound",
        reason: `non-free license: ${lic.license || "unknown"}`,
      };
      titleCache.set(title, null);
      continue;
    }

    const imgPath = path.join(IMG_DIR, `${slug}-photo.jpg`);
    let ok = downloadAndCompress(sizedThumb(summary.image, 400), imgPath);
    if (!ok) {
      // Fall back to the original full-size image if the thumb URL 404s.
      ok = downloadAndCompress(summary.image, imgPath);
    }
    if (!ok) {
      status[person.id] = {
        tag: "#NotFound",
        reason: "download/compress failed",
      };
      continue;
    }

    const creditAuthor = lic.artist || "Wikimedia Commons";
    const doc = {
      schemaVersion: 1,
      type: "mediaAsset",
      id: mediaId,
      kind: "image",
      src: `/images/web/${slug}-photo.jpg`,
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
    person.coverMediaId = mediaId;
    await writeFile(
      path.join(PEOPLE_DIR, `${person.id}.json`),
      JSON.stringify(person, null, 2) + "\n",
      "utf8",
    );
    titleCache.set(title, mediaId);
    status[person.id] = { tag: "#Done", mediaId, license: lic.license };
    process.stdout.write(".");
    if (++dotCount % 50 === 0) process.stdout.write(` [${dotCount}]\n`);
  }

  await writeFile(STATUS_OUT, JSON.stringify(status, null, 2), "utf8");
  const done = Object.values(status).filter((s) => s.tag === "#Done").length;
  const nf = Object.values(status).filter((s) => s.tag === "#NotFound").length;
  console.log(
    `\n\n#Done: ${done} | #NotFound: ${nf} | total: ${people.length}`,
  );
  console.log(`Status report -> ${STATUS_OUT}`);
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
