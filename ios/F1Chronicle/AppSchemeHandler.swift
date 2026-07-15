import Foundation
import WebKit

/// Serves the bundled static web app (the Next.js `out/` export copied into
/// `WebAssets/`) over a custom URL scheme (`applocal`). Using a custom scheme
/// with a host means the web app's absolute asset paths (`/_next/...`,
/// `/search-index.json`, route paths) resolve correctly against
/// `applocal://localhost/...`, which the handler maps to files in the bundle.
///
/// This is what lets the app run fully offline with no server — the WebView
/// loads `applocal://localhost/` and every resource is read from the app bundle.
final class AppSchemeHandler: NSObject, WKURLSchemeHandler {

    /// The custom scheme this handler serves.
    static let scheme = "applocal"
    /// The host used as the web root.
    static let host = "localhost"

    /// The base URL the web app should be loaded from.
    static var rootURL: URL {
        URL(string: "\(scheme)://\(host)/")!
    }

    private static let mimeTypes: [String: String] = [
        "html": "text/html",
        "js": "text/javascript",
        "mjs": "text/javascript",
        "css": "text/css",
        "json": "application/json",
        "svg": "image/svg+xml",
        "png": "image/png",
        "jpg": "image/jpeg",
        "jpeg": "image/jpeg",
        "webp": "image/webp",
        "avif": "image/avif",
        "gif": "image/gif",
        "ico": "image/x-icon",
        "woff": "font/woff",
        "woff2": "font/woff2",
        "wasm": "application/wasm",
        "txt": "text/plain",
        "map": "application/json",
    ]

    func webView(_ webView: WKWebView, start urlSchemeTask: WKURLSchemeTask) {
        let url = urlSchemeTask.request.url
        var path = url?.path ?? "/"
        if path.isEmpty || path == "/" {
            path = "/index.html"
        }
        // Trailing slash -> folder index.html (Next export uses trailingSlash).
        if path.hasSuffix("/") {
            path += "index.html"
        }

        guard
            let webAssetsURL = Bundle.main.url(forResource: "WebAssets", withExtension: nil)
        else {
            urlSchemeTask.didReceive(HTTPURLResponse(
                url: url!,
                statusCode: 500,
                httpVersion: nil,
                headerFields: nil
            )!)
            urlSchemeTask.didFinish()
            return
        }

        // Strip leading slash so we can append to the WebAssets dir.
        let relative = path.hasPrefix("/") ? String(path.dropFirst()) : path
        let fileURL = webAssetsURL.appendingPathComponent(relative)

        guard FileManager.default.fileExists(atPath: fileURL.path) else {
            // Fallback to index.html (SPA-style) for unmatched routes.
            let indexURL = webAssetsURL.appendingPathComponent("index.html")
            if FileManager.default.fileExists(atPath: indexURL.path),
               let data = try? Data(contentsOf: indexURL) {
                respond(urlSchemeTask: urlSchemeTask, url: url!, fileURL: indexURL, data: data)
                return
            }
            urlSchemeTask.didReceive(HTTPURLResponse(
                url: url!,
                statusCode: 404,
                httpVersion: nil,
                headerFields: nil
            )!)
            urlSchemeTask.didFinish()
            return
        }

        guard let data = try? Data(contentsOf: fileURL) else {
            urlSchemeTask.didFailWithError(NSError(
                domain: "AppSchemeHandler",
                code: 1,
                userInfo: [NSLocalizedDescriptionKey: "Unable to read \(fileURL.lastPathComponent)"]
            ))
            return
        }
        respond(urlSchemeTask: urlSchemeTask, url: url!, fileURL: fileURL, data: data)
    }

    private func respond(
        urlSchemeTask: WKURLSchemeTask,
        url: URL,
        fileURL: URL,
        data: Data
    ) {
        let ext = fileURL.pathExtension.lowercased()
        let mime = AppSchemeHandler.mimeTypes[ext] ?? "application/octet-stream"
        let response = HTTPURLResponse(
            url: url,
            statusCode: 200,
            httpVersion: "HTTP/1.1",
            headerFields: [
                "Content-Type": mime,
                "Cache-Control": "no-cache",
            ]
        )!
        urlSchemeTask.didReceive(response)
        urlSchemeTask.didReceive(data)
        urlSchemeTask.didFinish()
    }

    func webView(_ webView: WKWebView, stop urlSchemeTask: WKURLSchemeTask) {
        // Nothing to cancel; file reads are synchronous.
    }
}
