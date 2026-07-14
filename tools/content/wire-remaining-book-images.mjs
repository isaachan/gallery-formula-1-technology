import { readFile, writeFile, readdir } from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve("content");
const OUT = path.join(ROOT, "media");
const BOOK = "source-book-f1-illustrated-engineering";
const BOOK_TITLE = "《图解 F1 赛车工程技术》";

const data = JSON.parse(await readFile("/tmp/unused_figs.json", "utf8"));

// 1. Generate media manifests for every unused figure.
const chapterMedia = {}; // chapter -> [mediaId,...]
const figToMedia = {}; // figId -> mediaId
let manifestCount = 0;
for (const [chap, spec] of Object.entries(data)) {
  chapterMedia[chap] = [];
  for (const fig of spec.figs) {
    const mediaId = `media-book-${fig.id}`;
    figToMedia[fig.id] = mediaId;
    chapterMedia[chap].push(mediaId);
    let cap = fig.cap && fig.cap.trim();
    if (!cap) cap = `F1 技术图解（第 ${fig.page} 页）`;
    const doc = {
      schemaVersion: 1,
      type: "mediaAsset",
      id: mediaId,
      kind: "image",
      src: `/images/book/${fig.id}.jpg`,
      alt: {
        zh: cap,
        en: `Technical illustration from the book (p.${fig.page})`,
      },
      caption: {
        zh: `${cap}（出自${BOOK_TITLE}）`,
        en: `Illustration from ${BOOK_TITLE} (p.${fig.page})`,
      },
      credit: `出自${BOOK_TITLE}`,
      rights: { status: "licensed", sourceUrl: "https://www.cmpbook.com/" },
    };
    await writeFile(
      path.join(OUT, `${mediaId}.json`),
      JSON.stringify(doc, null, 2) + "\n",
      "utf8",
    );
    manifestCount++;
  }
}
console.log(`Wrote ${manifestCount} media manifests.`);

// 2. Add a gallery block per chapter to each of that chapter's mapped technologies.
let blockCount = 0;
for (const [chap, spec] of Object.entries(data)) {
  if (!spec.techs || !spec.techs.length || !chapterMedia[chap].length) continue;
  const mediaIds = chapterMedia[chap];
  for (const techId of spec.techs) {
    const file = path.join(ROOT, "technologies", `${techId}.json`);
    let doc;
    try {
      doc = JSON.parse(await readFile(file, "utf8"));
    } catch {
      // techId may be a season id (Ch1 maps to seasons) — skip non-technology targets here.
      continue;
    }
    // Avoid duplicate gallery per chapter on the same technology.
    const existingGallery = (doc.blocks || []).some(
      (b) => b.type === "gallery" && b.id === `${chap}-gallery`,
    );
    if (existingGallery) continue;
    doc.blocks = doc.blocks || [];
    doc.blocks.push({
      id: `${chap}-gallery`,
      type: "gallery",
      heading: { zh: `${chap} 相关图集` },
      mediaIds,
      sourceIds: [BOOK],
    });
    if (!doc.sourceIds.includes(BOOK)) doc.sourceIds.push(BOOK);
    doc.updatedAt = "2026-07-14T12:00:00.000Z";
    await writeFile(file, JSON.stringify(doc, null, 2) + "\n", "utf8");
    blockCount++;
  }
}
console.log(`Added/updated galleries on ${blockCount} technology files.`);

// 3. Ch1 also targets highlighted seasons — add a gallery to those.
const ch1Media = chapterMedia["Ch1"] || [];
if (ch1Media.length) {
  const seasonTargets = [
    "season-1988",
    "season-2022",
    "season-1968",
    "season-1979",
  ];
  let sCount = 0;
  for (const sid of seasonTargets) {
    const file = path.join(ROOT, "seasons", `${sid}.json`);
    let doc;
    try {
      doc = JSON.parse(await readFile(file, "utf8"));
    } catch {
      continue;
    }
    const exists = (doc.blocks || []).some(
      (b) => b.id === "ch1-history-gallery",
    );
    if (exists) continue;
    doc.blocks = doc.blocks || [];
    doc.blocks.push({
      id: "ch1-history-gallery",
      type: "gallery",
      heading: { zh: "历史影像图集" },
      mediaIds: ch1Media,
      sourceIds: [BOOK],
    });
    if (!doc.sourceIds.includes(BOOK)) doc.sourceIds.push(BOOK);
    doc.updatedAt = "2026-07-14T12:00:00.000Z";
    await writeFile(file, JSON.stringify(doc, null, 2) + "\n", "utf8");
    sCount++;
  }
  console.log(`Added Ch1 history gallery to ${sCount} seasons.`);
}
