// Builds docs/image-license-clearance.md: for every car/person still missing a
// photo, queries Wikimedia Commons once and records the best candidate image,
// its stated license, and its source page — so a human can review/clear rights
// one by one. No downloads (fast); just classification + a review table.
//
// Re-run any time; proxy via FETCH_PROXY (default corporate; "none" for direct).
import { readFile, writeFile, readdir } from "node:fs/promises";
import { execSync } from "node:child_process";
import path from "node:path";

const ROOT = path.resolve(".");
const CLEARANCE_OUT = path.join(ROOT, "docs/image-license-clearance.md");
const PROXY = process.env.FETCH_PROXY ?? "http://proxy.nioint.com:8080";
const UA = "F1ChronicleBot/1.0 (educational F1 history app)";
const FREE_RE = /(CC BY|CC0|Public domain|GFDL|CC-BY|CC SA)/i;

function curl(url) {
  const proxyArg = PROXY === "none" ? "" : `-x "${PROXY}"`;
  for (let a = 0; a < 3; a++) {
    try {
      const out = execSync(
        `curl -s ${proxyArg} --connect-timeout 10 --max-time 25 --speed-time 15 --speed-limit 1000 -A "${UA}" ${JSON.stringify(url)}`,
        {
          encoding: "utf8",
          maxBuffer: 30 * 1024 * 1024,
          stdio: ["pipe", "pipe", "ignore"],
        },
      );
      if (out && out.length > 5) return out;
    } catch {}
  }
  return "";
}
const clean = (v) =>
  v
    ? String(v)
        .replace(/<[^>]+>/g, "")
        .trim()
    : "";

function commonsSearch(query) {
  const d = JSON.parse(
    curl(
      `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(query)}&gsrnamespace=6&gsrlimit=8&prop=imageinfo&iiprop=url%7Cextmetadata%7Cmime&iiurlwidth=400&format=json`,
    ) || "{}",
  );
  const pages = d && d.query ? Object.values(d.query.pages || {}) : [];
  const cands = [];
  for (const p of pages) {
    const ii = p.imageinfo && p.imageinfo[0];
    if (!ii || !/jpeg|png/i.test(ii.mime || "")) continue;
    const m = ii.extmetadata || {};
    cands.push({
      title: p.title,
      filePage: `https://commons.wikimedia.org/wiki/${encodeURIComponent(p.title.replace(/ /g, "_"))}`,
      thumb: ii.thumburl || ii.url,
      license:
        clean(m.LicenseShortName && m.LicenseShortName.value) || "unknown",
      artist: clean(m.Artist && m.Artist.value),
    });
  }
  return cands;
}

async function main() {
  const rows = [];
  for (const [type, dir, typeZh] of [
    ["car", "content/cars", "赛车"],
    ["person", "content/people", "人物"],
  ]) {
    for (const f of await readdir(path.join(ROOT, dir))) {
      if (!f.endsWith(".json")) continue;
      const doc = JSON.parse(await readFile(path.join(ROOT, dir, f), "utf8"));
      if (doc.coverMediaId) continue; // already has a photo
      const name = doc.title?.en || doc.id.replace(/^(car|person)-/, "");
      const queries =
        type === "car" ? [name, name.replace(/\bF1\b/, "").trim()] : [name];
      let cands = [];
      for (const q of queries) {
        if (!q) continue;
        cands = commonsSearch(q);
        if (cands.length) break;
      }
      const best = cands[0];
      const isFree = best && FREE_RE.test(best.license);
      rows.push({
        type: typeZh,
        id: doc.id,
        name,
        thumb: best?.thumb,
        filePage: best?.filePage,
        license: best?.license || "（Commons 无结果）",
        artist: best?.artist || "",
        action: !best
          ? "需自行寻找/购买"
          : isFree
            ? "自由版权，重跑脚本可自动下载"
            : "需联系作者清理授权或购买",
      });
      process.stdout.write(".");
    }
  }

  let md = `# 图片授权清理清单 (Image license clearance)\n\n`;
  md += `共 ${rows.length} 个条目仍缺少图片。每个条目列出 Wikimedia Commons 上的最佳候选图、标注授权与来源链接，供逐一处理。\n\n`;
  md += `- **标注授权为 CC BY / CC BY-SA / Public domain 等**：属自由版权，可直接使用（重跑 \\\`node tools/content/fetch-missing-images.mjs\\\` 通常会自动下载）。\n`;
  md += `- **非自由版权或无 Commons 结果**：需联系作者/来源获取授权，或自行购买/拍摄替代图片。\n\n`;
  md += `| 类型 | 名称 | 标注授权 | 建议操作 | 作者 | 候选缩略图 | 来源页面 | id |\n`;
  md += `|---|---|---|---|---|---|---|---|\n`;
  for (const r of rows.sort((a, b) =>
    a.type !== b.type ? 0 : a.name.localeCompare(b.name),
  )) {
    const c = (s) => (s || "").replace(/\|/g, "/").replace(/\n/g, " ").trim();
    md += `| ${r.type} | ${c(r.name)} | ${c(r.license)} | ${c(r.action)} | ${c(r.artist)} | ${r.thumb ? `[查看](${c(r.thumb)})` : "—"} | ${r.filePage ? `[来源](${c(r.filePage)})` : "—"} | ${c(r.id)} |\n`;
  }
  await writeFile(CLEARANCE_OUT, md, "utf8");
  console.log(`\nWrote ${rows.length} rows -> ${CLEARANCE_OUT}`);
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
