# F1Chronicle — iOS app

A thin native iOS shell (SwiftUI + `WKWebView`) that bundles the **F1 Track
Chronicle** web app and runs it **fully offline** — no server, no URL, no
network required. The Next.js app is statically exported (`output: "export"`)
into `WebAssets/` and served from the app bundle over a custom URL scheme
(`applocal://localhost/`) by `AppSchemeHandler`.

The project is generated with [XcodeGen](https://github.com/yonaskolb/XcodeGen)
from `project.yml`, so the `.xcodeproj` is reproducible and diff-friendly.

## How it works

1. `sync-web-assets.sh` runs `npm run build` (static export → `out/`) and copies
   it into `F1Chronicle/WebAssets/`.
2. `WebAssets/` is added to the app as a **folder reference** (structure
   preserved) and bundled into the app.
3. `AppSchemeHandler` serves files from `WebAssets/` over the `applocal` scheme,
   so the web app's absolute asset paths (`/_next/...`, `/search-index.json`,
   routes) resolve correctly against `applocal://localhost/`.

## Prerequisites

- **Xcode 15+** (full Xcode, not just Command Line Tools).
- Node 22 / npm (for building the web content).
- XcodeGen: `brew install xcodegen`

## What to do (first time, and whenever web content changes)

```sh
# 1. Build the web app and copy it into the iOS bundle location
cd ios
./sync-web-assets.sh

# 2. Regenerate the Xcode project (picks up the WebAssets folder reference)
xcodegen generate

# 3. Build & run on a simulator
xcodebuild -project F1Chronicle.xcodeproj -scheme F1Chronicle \
  -sdk iphonesimulator -destination 'platform=iOS Simulator,name=iPhone 17' build
open F1Chronicle.xcodeproj        # then ⌘R in Xcode
```

Or just open `F1Chronicle.xcodeproj` in Xcode and press **⌘R** after steps 1–2.

## Run on a real iPhone

No URL is needed — the app is self-contained. For a device build:

1. Plug in your iPhone; enable **Developer Mode** (Settings → Privacy & Security).
2. In Xcode → **Signing & Capabilities** → set **Team** (your Apple ID; add it
   under Xcode → Settings → Accounts) and a unique **Bundle Identifier**
   (e.g. `com.yourname.f1chronicle`).
3. Select the device and press **⌘R**.
4. On the phone: Settings → **General → VPN & Device Management** → trust your
   developer profile.

(Free Apple ID: app valid 7 days, re-sign by re-running ⌘R.)

## Notes

- The web app is mobile-first (390px baseline), so it renders correctly in the
  WebView. JavaScript, gestures, lazy 3D, audio, and video all work offline.
- `WebAssets/` is gitignored — regenerate it with `./sync-web-assets.sh`.
- Editing web content (the `content/` JSON or pages): re-run `sync-web-assets.sh`
  + rebuild the iOS app. Editing only Swift: just ⌘R again.
- Local **web** preview (no iOS): `npm run build && npm run start` serves `out/`.
