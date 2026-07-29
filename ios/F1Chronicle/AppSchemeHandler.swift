import Foundation
import WebKit

enum SchemeResolutionError: Error, Equatable {
    case invalidScheme
    case invalidHost
    case unsupportedMethod
    case pathTraversal
    case missingFile
    case unreadableFile
}

struct ResolvedAsset: Equatable {
    let statusCode: Int
    let mimeType: String
    let data: Data
    let fileURL: URL
}

/// Serves only validated files contained by the bundled WebAssets directory.
/// Unknown routes are explicit 404s; they never fall back to the home page.
final class AppSchemeHandler: NSObject, WKURLSchemeHandler {
    static let scheme = "applocal"
    static let host = "localhost"

    static var rootURL: URL {
        URL(string: "\(scheme)://\(host)/")!
    }

    static let mimeTypes: [String: String] = [
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

    let webAssetsURL: URL?

    init(
        webAssetsURL: URL? = Bundle.main.url(
            forResource: "WebAssets",
            withExtension: nil
        )
    ) {
        self.webAssetsURL = webAssetsURL
        super.init()
    }

    static func resolve(
        request: URLRequest,
        webAssetsURL: URL
    ) throws -> ResolvedAsset {
        guard let url = request.url,
              url.scheme?.lowercased() == scheme else {
            throw SchemeResolutionError.invalidScheme
        }
        guard url.host?.lowercased() == host,
              url.port == nil,
              url.user == nil,
              url.password == nil else {
            throw SchemeResolutionError.invalidHost
        }
        guard request.httpMethod == nil ||
                request.httpMethod?.uppercased() == "GET" else {
            throw SchemeResolutionError.unsupportedMethod
        }

        guard let encodedPath = URLComponents(
            url: url,
            resolvingAgainstBaseURL: false
        )?.percentEncodedPath else {
            throw SchemeResolutionError.pathTraversal
        }
        let decodedPath = fullyDecodedPath(encodedPath)
        let segments = decodedPath.split(
            separator: "/",
            omittingEmptySubsequences: true
        )
        guard !decodedPath.contains("\\"),
              !decodedPath.contains("\0"),
              !segments.contains("."),
              !segments.contains("..") else {
            throw SchemeResolutionError.pathTraversal
        }

        var relativePath = segments.map(String.init).joined(separator: "/")
        if relativePath.isEmpty {
            relativePath = "index.html"
        } else if decodedPath.hasSuffix("/") {
            relativePath += "/index.html"
        }

        let root = webAssetsURL
            .standardizedFileURL
            .resolvingSymlinksInPath()
        let candidate = root
            .appendingPathComponent(relativePath, isDirectory: false)
            .standardizedFileURL
            .resolvingSymlinksInPath()
        let containedPrefix = root.path.hasSuffix("/")
            ? root.path
            : "\(root.path)/"
        guard candidate.path.hasPrefix(containedPrefix) else {
            throw SchemeResolutionError.pathTraversal
        }

        var isDirectory: ObjCBool = false
        guard FileManager.default.fileExists(
            atPath: candidate.path,
            isDirectory: &isDirectory
        ), !isDirectory.boolValue else {
            throw SchemeResolutionError.missingFile
        }
        guard let data = try? Data(contentsOf: candidate) else {
            throw SchemeResolutionError.unreadableFile
        }

        return ResolvedAsset(
            statusCode: 200,
            mimeType: mimeTypes[candidate.pathExtension.lowercased()]
                ?? "application/octet-stream",
            data: data,
            fileURL: candidate
        )
    }

    func response(for request: URLRequest) throws -> ResolvedAsset {
        guard let webAssetsURL else {
            throw SchemeResolutionError.missingFile
        }
        return try Self.resolve(
            request: request,
            webAssetsURL: webAssetsURL
        )
    }

    private static func fullyDecodedPath(_ path: String) -> String {
        var decoded = path
        for _ in 0..<4 {
            guard let next = decoded.removingPercentEncoding,
                  next != decoded else {
                break
            }
            decoded = next
        }
        return decoded
    }

    func webView(
        _ webView: WKWebView,
        start urlSchemeTask: WKURLSchemeTask
    ) {
        let request = urlSchemeTask.request
        let responseURL = request.url ?? AppSchemeHandler.rootURL
        do {
            guard let webAssetsURL else {
                throw SchemeResolutionError.missingFile
            }
            let asset = try Self.resolve(
                request: request,
                webAssetsURL: webAssetsURL
            )
            send(
                task: urlSchemeTask,
                url: responseURL,
                statusCode: asset.statusCode,
                mimeType: asset.mimeType,
                data: asset.data
            )
        } catch let error as SchemeResolutionError {
            send(
                task: urlSchemeTask,
                url: responseURL,
                statusCode: Self.statusCode(for: error),
                mimeType: "text/plain",
                data: Data()
            )
        } catch {
            send(
                task: urlSchemeTask,
                url: responseURL,
                statusCode: 500,
                mimeType: "text/plain",
                data: Data()
            )
        }
    }

    private static func statusCode(for error: SchemeResolutionError) -> Int {
        switch error {
        case .invalidScheme, .invalidHost, .pathTraversal:
            return 403
        case .unsupportedMethod:
            return 405
        case .missingFile:
            return 404
        case .unreadableFile:
            return 500
        }
    }

    private func send(
        task: WKURLSchemeTask,
        url: URL,
        statusCode: Int,
        mimeType: String,
        data: Data
    ) {
        guard let response = HTTPURLResponse(
            url: url,
            statusCode: statusCode,
            httpVersion: "HTTP/1.1",
            headerFields: [
                "Content-Type": mimeType,
                "Cache-Control": "no-store",
                "X-Content-Type-Options": "nosniff",
            ]
        ) else {
            task.didFailWithError(
                NSError(domain: "AppSchemeHandler", code: statusCode)
            )
            return
        }
        task.didReceive(response)
        if !data.isEmpty {
            task.didReceive(data)
        }
        task.didFinish()
    }

    func webView(
        _ webView: WKWebView,
        stop urlSchemeTask: WKURLSchemeTask
    ) {
        // File reads are bounded and synchronous; there is no task to cancel.
    }
}
