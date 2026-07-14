# F1Chronicle — iOS app

A thin native iOS shell (SwiftUI + `WKWebView`) that wraps the deployed
**F1 Track Chronicle** web app. It loads the web app full-screen, keeps all
in-site navigation in-app, and hands `mailto:`/`tel:` links to the system.

The project is generated with [XcodeGen](https://github.com/yonaskolb/XcodeGen)
from `project.yml`, so the `.xcodeproj` is reproducible and diff-friendly.

## Prerequisites

- **Xcode 15+** (not just Command Line Tools). Install from the Mac App Store.
- The web app deployed to a public URL (e.g. Vercel). The shell loads that URL
  at runtime — it does not bundle the web build.

## What you need to do next

1. **Install Xcode** (if not already):
   ```sh
   xcode-select --install    # Command Line Tools only — NOT enough
   # Install full Xcode from the Mac App Store, then:
   sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
   ```

2. **Set your web app URL.** Edit `F1Chronicle/AppConfig.swift`:
   ```swift
   static let appURLString = "https://your-deployment.vercel.app"
   ```
   For local dev against `npm run dev` on the same Mac, run the scheme with the
   environment variable `USE_LOCAL_DEV_URL=1` (it then loads `http://localhost:3000`;
   `localhost` insecure loads are already allowed in `Info.plist`).

3. **Open the project:**
   ```sh
   open F1Chronicle.xcodeproj
   ```

4. **Build & run** on an iPhone simulator (⌘R). For a real device, select your
   team under **Signing & Capabilities** (set `DEVELOPMENT_TEAM` in `project.yml`
   or in Xcode) and connect the device.

## App icon

`Assets.xcassets/AppIcon.appiconset` is an empty 1024×1024 single-size slot
(Xcode 14+ asset catalog). Drop a 1024×1024 PNG into the set in Xcode before
release builds.

## Regenerating the project

If you change `project.yml`:
```sh
xcodegen generate
```

## Notes

- The web app is mobile-first (390px baseline), so it renders correctly inside
  the `WKWebView` viewport on iPhone.
- JavaScript, gestures, lazy 3D, audio, and video all work — they are the web
  app's own behaviour running in the system WebView.
- App Store submission requires a paid Apple Developer account, a real device
  provisioning profile, and the app icon.
