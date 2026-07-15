import Foundation

/// Central configuration for the wrapped web app.
///
/// The iOS shell loads this URL inside a WKWebView and keeps all navigation
/// in-app. With everything running locally, it defaults to the Next.js dev
/// server. Point it at a deployed URL only if you stop running the server
/// locally.
enum AppConfig {
    /// The web app URL loaded by the WKWebView.
    /// Local dev server (`npm run dev`). Works in the simulator because the
    /// simulator shares the Mac's network, so `localhost` = this Mac.
    static let appURLString = "http://localhost:3000"

    static var resolvedURL: URL {
        guard let url = URL(string: appURLString) else {
            fatalError("AppConfig.appURLString is invalid: \(appURLString)")
        }
        return url
    }
}

