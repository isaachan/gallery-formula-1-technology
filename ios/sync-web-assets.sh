#!/usr/bin/env bash
# Builds or stages the web app static export and copies it into the iOS app
# bundle location so the app ships fully offline. Run this before building the
# iOS app in Xcode whenever the web content changes.
#
#   cd ios && ./sync-web-assets.sh
#
set -euo pipefail

# Resolve repo root (ios/ is one level down).
IOS_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$IOS_DIR/.." && pwd)"
DEST="$IOS_DIR/F1Chronicle/WebAssets"
BACKUP_DEST="$IOS_DIR/F1Chronicle/.WebAssets.previous"
STAGE_ROOT="$(mktemp -d "$IOS_DIR/.web-assets-stage.XXXXXX")"
STAGED_DEST="$STAGE_ROOT/WebAssets"
SOURCE_EXPORT="${WEB_ASSETS_SOURCE:-$ROOT/out}"

cleanup() {
  if [[ -d "$STAGE_ROOT" ]]; then
    rm -rf "$STAGE_ROOT"
  fi
}
trap cleanup EXIT

cd "$ROOT"

if [[ -n "${WEB_ASSETS_SOURCE:-}" ]]; then
  echo ">> Using prebuilt web export from $SOURCE_EXPORT"
else
  echo ">> Building web app (static export)…"
  # Static export prerenders 1000+ pages; raise the open-file limit (best effort).
  # CI should usually pass WEB_ASSETS_SOURCE so macOS only verifies and bundles
  # the Ubuntu-built export instead of rebuilding the whole graph.
  ulimit -n 65536 2>/dev/null || true
  npm run build
fi

if [[ ! -d "$SOURCE_EXPORT" ]]; then
  echo "Static export not found at $SOURCE_EXPORT" >&2
  exit 1
fi

echo ">> Staging $SOURCE_EXPORT for verification"
mkdir -p "$STAGED_DEST"
cp -R "$SOURCE_EXPORT/." "$STAGED_DEST/"

node - "$STAGED_DEST" "$ROOT/package.json" <<'NODE'
const fs = require("node:fs");
const path = require("node:path");

const [assetsRoot, packageJsonPath] = process.argv.slice(2);
const requiredFiles = [
  "index.html",
  "build-manifest.json",
  "search-index.json",
];
for (const relativePath of requiredFiles) {
  const candidate = path.join(assetsRoot, relativePath);
  if (!fs.statSync(candidate, { throwIfNoEntry: false })?.isFile()) {
    throw new Error(`Staged WebAssets is missing ${relativePath}`);
  }
}

const manifest = JSON.parse(
  fs.readFileSync(path.join(assetsRoot, "build-manifest.json"), "utf8"),
);
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
if (manifest.schemaVersion !== 1) {
  throw new Error(`Unsupported build manifest schema ${manifest.schemaVersion}`);
}
if (manifest.appVersion !== packageJson.version) {
  throw new Error(
    `Build manifest app version ${manifest.appVersion} does not match ${packageJson.version}`,
  );
}
if (!/^[0-9a-f]{40,64}$/i.test(manifest.buildCommit)) {
  throw new Error("Build manifest must contain a full Git commit hash");
}
for (const field of [
  "contentVersion",
  "builtAt",
  "contentPackId",
  "graphVersion",
  "mediaManifestVersion",
]) {
  if (typeof manifest[field] !== "string" || manifest[field].length === 0) {
    throw new Error(`Build manifest is missing ${field}`);
  }
}

const searchIndex = JSON.parse(
  fs.readFileSync(path.join(assetsRoot, "search-index.json"), "utf8"),
);
if (searchIndex.schemaVersion !== 1 || !Array.isArray(searchIndex.entries)) {
  throw new Error("Staged search index is incompatible");
}
NODE

echo ">> Replacing $DEST with verified WebAssets"
if [[ -e "$BACKUP_DEST" ]]; then
  echo "Stale WebAssets backup exists at $BACKUP_DEST; refusing to overwrite it." >&2
  exit 1
fi
if [[ -e "$DEST" ]]; then
  mv "$DEST" "$BACKUP_DEST"
fi
if ! mv "$STAGED_DEST" "$DEST"; then
  if [[ -e "$BACKUP_DEST" ]]; then
    mv "$BACKUP_DEST" "$DEST"
  fi
  exit 1
fi
if [[ -e "$BACKUP_DEST" ]]; then
  rm -rf "$BACKUP_DEST"
fi

echo ">> Done. $(find "$DEST" -name '*.html' | wc -l | tr -d ' ') HTML pages bundled."
echo "   Now (re)generate the Xcode project and build:  cd ios && xcodegen generate"
