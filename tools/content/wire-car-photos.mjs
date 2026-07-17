// Wire purchased/placed car photos into the app.
//
// CONVENTION: put each image in public/images/web/ named exactly
//   <car-id>.jpg        e.g.  car-red-bull-rb18.jpg
// (the car-id is the filename in content/cars/, e.g. car-red-bull-rb18)
//
// For every matching image this script will:
//   - compress it to <=500KB if needed
//   - write a media manifest (rights.status: "licensed")
//   - set coverMediaId on the car so the hero shows the photo
//
// Optional attribution: create a sidecar text file  <car-id>.txt  containing
// the credit/source line(s); it will be used as the media `credit`.
//
// Run:   node tools/content/wire-car-photos.mjs
import { readFile, writeFile, readdir, stat } from "node:fs/promises";
import { existsSync, statSync } from "node:fs";
import { execSync } from "node:child_process";
import path from "node:path";

const ROOT = path.resolve(".");
const CARS_DIR = path.join(ROOT, "content/cars");
const MEDIA_DIR = path.join(ROOT, "content/media");
const IMG_DIR = path.join(ROOT, "public/images/web");

function compressIfNeeded(filePath) {
  if (statSync(filePath).size <= 512000) return;
  let q = 80;
  let z = 1600;
  for (let i = 0; i < 6; i++) {
    execSync(
      `sips -s format jpeg -s formatOptions ${q} -Z ${z} ${JSON.stringify(filePath)} --out ${JSON.stringify(filePath)}`,
      { stdio: "ignore" },
    );
    if (statSync(filePath).size <= 512000) return;
    q = Math.max(45, q - 10);
    z = Math.max(900, Math.round(z * 0.85));
  }
}

async function main() {
  // Map car-id -> slug for media id/src naming.
  const carSlugs = new Map();
  for (const f of await readdir(CARS_DIR)) {
    if (!f.endsWith(".json")) continue;
    const d = JSON.parse(await readFile(path.join(CARS_DIR, f), "utf8"));
    carSlugs.set(d.id, d.slug);
  }

  const placed = (await readdir(IMG_DIR))
    .filter((f) => /^car-[a-z0-9-]+\.(jpg|jpeg|png)$/i.test(f))
    .sort();

  if (placed.length === 0) {
    console.log(
      "No purchased images found. Drop files named <car-id>.jpg into public/images/web/ and re-run.",
    );
    return;
  }

  let wired = 0;
  let unknown = 0;
  for (const file of placed) {
    const carId = file.replace(/\.(jpg|jpeg|png)$/i, "");
    const slug = carSlugs.get(carId);
    if (!slug) {
      console.log(`?  ${file}  -> no car entity matches "${carId}" (skipped)`);
      unknown++;
      continue;
    }

    // Normalize to <slug>-photo.jpg next to the wiki photos.
    const srcPath = path.join(IMG_DIR, file);
    const destName = `${slug}-photo.jpg`;
    const destPath = path.join(IMG_DIR, destName);
    if (path.resolve(srcPath) !== path.resolve(destPath)) {
      await writeFile(destPath, await readFile(srcPath));
      // Keep the original <car-id> file too if it has a different name? Remove to avoid clutter.
    }
    compressIfNeeded(destPath);

    const mediaId = `media-web-${slug}-photo`;
    // Optional sidecar credit.
    let credit = "购买图片 / purchased";
    const sidecar = path.join(IMG_DIR, `${carId}.txt`);
    if (existsSync(sidecar)) {
      credit =
        (await readFile(sidecar, "utf8")).trim().split("\n")[0] || credit;
    }

    const doc = {
      schemaVersion: 1,
      type: "mediaAsset",
      id: mediaId,
      kind: "image",
      src: `/images/web/${destName}`,
      alt: { zh: carId, en: carId },
      caption: { zh: carId, en: carId },
      credit,
      rights: { status: "licensed", sourceUrl: "purchased" },
    };
    await writeFile(
      path.join(MEDIA_DIR, `${mediaId}.json`),
      JSON.stringify(doc, null, 2) + "\n",
      "utf8",
    );

    const carFile = path.join(CARS_DIR, `${carId}.json`);
    const car = JSON.parse(await readFile(carFile, "utf8"));
    car.coverMediaId = mediaId;
    await writeFile(carFile, JSON.stringify(car, null, 2) + "\n", "utf8");

    console.log(
      `✓  ${carId}  ->  ${destName}  (${(statSync(destPath).size / 1024).toFixed(0)}KB)`,
    );
    wired++;
  }

  console.log(`\nWired ${wired} photo(s); ${unknown} unknown skipped.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
