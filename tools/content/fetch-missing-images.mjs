// Deeper image fetch: searches Wikimedia Commons (not just the Wikipedia lead
// image) for every car/person still missing a photo. Freely-licensed matches
// (CC BY/CC BY-SA/CC0/PD/GFDL) are downloaded, compressed, and wired in.
// Entities whose only matches are non-free are written to a license-clearance
// table (docs/image-license-clearance.md) so a human can clear/purchase rights.
//
// Resumable (skips entities that already have coverMediaId).
// Proxy: FETCH_PROXY env (default corporate); use "none" for direct/VPN-direct.
import { readFile, writeFile, readdir } from "node:fs/promises";
import { existsSync, statSync, unlinkSync } from "node:fs";
import { execSync } from "node:child_process";
import path from "node:path";

const ROOT = path.resolve(".");
const MEDIA_DIR = path.join(ROOT, "content/media");
const IMG_DIR = path.join(ROOT, "public/images/web");
const CLEARANCE_OUT = path.join(ROOT, "docs/image-license-clearance.md");
const STATUS_OUT = "/tmp/missing-images-status.json";
const PROXY = process.env.FETCH_PROXY ?? "http://proxy.nioint.com:8080";
const UA = "F1ChronicleBot/1.0 (educational F1 history app)";

const FREE_RE = /(CC BY|CC0|Public domain|GFDL|CC-BY|CC SA)/i;
// Wikimedia "non-free" / fair-use / unclear markers we will NOT auto-download.
const NONFREE_RE =
  /(non-commercial|no derivative|no-Commercial|ND|NC|fair use|fair-use|unknown|no known|all rights)/i;

function curl(url, { maxTime = 25 } = {}) {
  const proxyArg = PROXY === "none" ? "" : `-x "${PROXY}"`;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const out = execSync(
        `curl -s ${proxyArg} --connect-timeout 10 --max-time ${maxTime} --speed-time 15 --speed-limit 1000 -A "${UA}" ${JSON.stringify(url)}`,
        {
          encoding: "utf8",
          maxBuffer: 30 * 1024 * 1024,
          stdio: ["pipe", "pipe", "ignore"],
        },
      );
      if (out && out.length > 5) return out;
    } catch {
      /* retry */
    }
  }
  return "";
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
const clean = (v) =>
  v
    ? String(v)
        .replace(/<[^>]+>/g, "")
        .trim()
    : undefined;

/** Search Commons for files matching `query`. Returns ranked candidates. */
function commonsSearch(query) {
  const enc = encodeURIComponent(query);
  const d = fetchJson(
    `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${enc}&gsrnamespace=6&gsrlimit=10&prop=imageinfo&iiprop=url%7Cextmetadata%7Cmime%7Csize%7Cthumburl&iiurlwidth=800&format=json`,
  );
  if (!d || !d.query) return [];
  const pages = Object.values(d.query.pages || {});
  const cands = [];
  for (const p of pages) {
    const ii = p.imageinfo && p.imageinfo[0];
    if (!ii) continue;
    const mime = ii.mime || "";
    if (!/jpeg|png/i.test(mime)) continue;
    const m = ii.extmetadata || {};
    const license = clean(m.LicenseShortName && m.LicenseShortName.value);
    const artist = clean(m.Artist && m.Artist.value);
    cands.push({
      title: p.title,
      filePage: `https://commons.wikimedia.org/wiki/${encodeURIComponent(p.title.replace(/ /g, "_"))}`,
      url: ii.url,
      thumb: ii.thumburl || ii.url,
      license,
      licenseUrl: clean(m.LicenseUrl && m.LicenseUrl.value),
      artist,
      width: ii.width,
      height: ii.height,
    });
  }
  return cands;
}

function isImageFile(p) {
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
  if (fd[0] === 0xff && fd[1] === 0xd8) return true;
  if (fd.slice(0, 4).toString("ascii") === "\x89PNG") return true;
  if (fd.slice(0, 3).toString("ascii") === "GIF") return true;
  return false;
}
function downloadAndCompress(url, destPath) {
  const proxyArg = PROXY === "none" ? "" : `-x "${PROXY}"`;
  try {
    execSync(
      `curl -s ${proxyArg} --connect-timeout 10 --max-time 90 --speed-time 20 --speed-limit 1000 -A "${UA}" ${JSON.stringify(url)} -o ${JSON.stringify(destPath)}`,
      { stdio: "ignore" },
    );
  } catch {
    return false;
  }
  if (!existsSync(destPath) || statSync(destPath).size < 1000) {
    try {
      unlinkSync(destPath);
    } catch {}
    return false;
  }
  if (!isImageFile(destPath)) {
    try {
      unlinkSync(destPath);
    } catch {}
    return false;
  }
  let q = 80,
    z = 1280;
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
    q = Math.max(45, q - 10);
    z = Math.max(800, Math.round(z * 0.85));
  }
  return statSync(destPath).size <= 512000;
}

async function readEntities() {
  const out = [];
  for (const [type, dir] of [
    ["car", "content/cars"],
    ["person", "content/people"],
  ]) {
    for (const f of await readdir(path.join(ROOT, dir))) {
      if (!f.endsWith(".json")) continue;
      const d = JSON.parse(await readFile(path.join(ROOT, dir, f), "utf8"));
      if (!d.coverMediaId) out.push({ type, dir, doc: d });
    }
  }
  return out;
}

async function setCoverMediaId(entity, mediaId) {
  entity.doc.coverMediaId = mediaId;
  await writeFile(
    path.join(ROOT, entity.dir, `${entity.doc.id}.json`),
    JSON.stringify(entity.doc, null, 2) + "\n",
    "utf8",
  );
}

async function writeManifest(
  mediaId,
  slug,
  name,
  license,
  sourceUrl,
  credit,
  isPd,
) {
  const doc = {
    schemaVersion: 1,
    type: "mediaAsset",
    id: mediaId,
    kind: "image",
    src: `/images/web/${slug}-photo.jpg`,
    alt: { zh: name, en: name },
    caption: { zh: name, en: name },
    credit: credit || "Wikimedia Commons",
    rights: {
      status: isPd ? "public-domain" : "licensed",
      license: license || "see source",
      sourceUrl: sourceUrl || "https://commons.wikimedia.org/",
    },
  };
  await writeFile(
    path.join(MEDIA_DIR, `${mediaId}.json`),
    JSON.stringify(doc, null, 2) + "\n",
    "utf8",
  );
}

async function main() {
  const entities = await readEntities();
  console.log(
    `Missing images: ${entities.length} (${entities.filter((e) => e.type === "car").length} cars, ${entities.filter((e) => e.type === "person").length} people)`,
  );

  const status = {};
  const clearance = []; // entities needing manual license clearance
  let processed = 0;

  for (const entity of entities) {
    const { type, doc } = entity;
    const name = doc.title?.en || doc.id.replace(/^(car|person)-/, "");
    const slug = doc.slug;
    processed++;
    process.stdout.write(`\n[${processed}/${entities.length}] ${name} `);

    // Try a couple of search queries: the full name, then a trimmed variant.
    const queries =
      type === "car" ? [name, name.replace(/\bF1\b/, "").trim()] : [name];
    let candidates = [];
    for (const q of queries) {
      if (!q) continue;
      candidates = commonsSearch(q);
      if (candidates.length) break;
    }

    if (!candidates.length) {
      status[doc.id] = { tag: "#NotFound", reason: "no Commons results" };
      process.stdout.write("→ no results");
      continue;
    }

    // Prefer a free candidate; prefer ones whose title contains the search term.
    const free = candidates.filter(
      (c) => FREE_RE.test(c.license || "") && !NONFREE_RE.test(c.license || ""),
    );
    const pick =
      free.find((c) =>
        c.title.toLowerCase().includes(name.split(" ")[0].toLowerCase()),
      ) || free[0];

    if (pick) {
      const mediaId = `media-web-${slug}-photo`;
      const dest = path.join(IMG_DIR, `${slug}-photo.jpg`);
      const ok =
        downloadAndCompress(pick.thumb, dest) ||
        downloadAndCompress(pick.url, dest);
      if (ok) {
        await writeManifest(
          mediaId,
          slug,
          name,
          pick.license,
          pick.filePage,
          pick.artist || "Wikimedia Commons",
          /public/i.test(pick.license || ""),
        );
        await setCoverMediaId(entity, mediaId);
        status[doc.id] = { tag: "#Done", license: pick.license };
        process.stdout.write(`✓ ${pick.license}`);
        continue;
      }
      // A free candidate existed but the download failed (transient proxy).
      // Don't put it in the clearance table — re-running will retry it.
      status[doc.id] = {
        tag: "#NotFound",
        reason: "free image download failed (retry)",
      };
      process.stdout.write("→ free download failed (will retry)");
      continue;
    }

    // No free candidate at all — record the best non-free one for manual
    // license clearance.
    const best = candidates[0];
    clearance.push({
      type,
      id: doc.id,
      name,
      filePage: best.filePage,
      thumb: best.thumb,
      license: best.license || "non-free / unknown",
      artist: best.artist || "",
      candidateCount: candidates.length,
      freeCount: free.length,
    });
    status[doc.id] = {
      tag: "#NeedsClearance",
      reason: best.license || "non-free",
    };
    process.stdout.write(`⚠ clearance (${best.license || "non-free"})`);
  }

  // Write clearance table.
  let md = `# 图片授权待清理清单 (Image license clearance)\n\n`;
  md += `共 ${clearance.length} 个条目未找到可直接使用的自由版权图片。请逐一联系来源/作者获取授权，或寻找替代图片。\n\n`;
  md += `| 类型 | 名称 | 候选图片 | 标注授权 | 作者/来源 | 文件页面 |\n`;
  md += `|---|---|---|---|---|---|\n`;
  for (const c of clearance.sort((a, b) => a.name.localeCompare(b.name))) {
    const cell = (s) => (s || "").replace(/\|/g, "/").replace(/\n/g, " ");
    md += `| ${c.type === "car" ? "赛车" : "人物"} | ${cell(c.name)} | [缩略图](${cell(c.thumb)}) | ${cell(c.license)} | ${cell(c.artist)} | [来源](${cell(c.filePage)}) |\n`;
  }
  await writeFile(CLEARANCE_OUT, md, "utf8");

  await writeFile(STATUS_OUT, JSON.stringify(status, null, 2), "utf8");
  const done = Object.values(status).filter((s) => s.tag === "#Done").length;
  const clearanceN = clearance.length;
  const nf = Object.values(status).filter((s) => s.tag === "#NotFound").length;
  console.log(`\n\n=== SUMMARY ===`);
  console.log(`#Done (free, auto): ${done}`);
  console.log(`#NeedsClearance:    ${clearanceN}  -> ${CLEARANCE_OUT}`);
  console.log(`#NotFound:          ${nf}`);
  console.log(`Total processed:    ${entities.length}`);
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
