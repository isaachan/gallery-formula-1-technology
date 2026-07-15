#!/usr/bin/env bash
# Builds the web app (static export) and copies it into the iOS app bundle
# location so the app ships fully offline. Run this before building the iOS
# app in Xcode whenever the web content changes.
#
#   cd ios && ./sync-web-assets.sh
#
set -euo pipefail

# Resolve repo root (ios/ is one level down).
IOS_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$IOS_DIR/.." && pwd)"
DEST="$IOS_DIR/F1Chronicle/WebAssets"

echo ">> Building web app (static export)…"
cd "$ROOT"
# Static export prerenders ~730 pages; raise the open-file limit (best effort —
# macOS caps this at kern.maxfilesperproc). The reduced worker count in
# next.config.ts (experimental.cpus) keeps concurrency low enough to fit.
ulimit -n 65536 2>/dev/null || true
npm run build

echo ">> Syncing out/ -> $DEST"
rm -rf "$DEST"
mkdir -p "$DEST"
cp -R "$ROOT/out/." "$DEST/"
echo ">> Done. $(find "$DEST" -name '*.html' | wc -l | tr -d ' ') HTML pages bundled."
echo "   Now (re)generate the Xcode project and build:  cd ios && xcodegen generate"
