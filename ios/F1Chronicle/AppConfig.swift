import Foundation

/// Central configuration for the wrapped web app.
///
/// Set `appURLString` to the deployed URL of the F1 Track Chronicle web app
/// (e.g. your Vercel production URL). The iOS shell loads this URL inside a
/// WKWebView and keeps all navigation in-app.
enum AppConfig {
    /// The web app URL loaded by the WKWebView.
    /// Replace with your production deployment URL before building for release.
    static let appURLString = "https://f1-track-chronicle.vercel.app"

    /// Local development URL — used when `USE_LOCAL_DEV_URL` is set in the
    /// environment (handy when running `npm run dev` on the same machine).
    static var resolvedURLString: String {
        if ProcessInfo.processInfo.environment["USE_LOCAL_DEV_URL"] != nil {
            return "http://localhost:3000"
        }
        return appURLString
    }

    static var resolvedURL: URL {
        guard let url = URL(string: resolvedURLString) else {
            fatalError("AppConfig.appURLString is invalid: \(resolvedURLString)")
        }
        return url
    }
}
