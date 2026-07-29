import XCTest
@testable import F1Chronicle

final class AppSchemeHandlerTests: XCTestCase {
    private var temporaryRoot: URL!

    override func setUpWithError() throws {
        temporaryRoot = FileManager.default.temporaryDirectory
            .appendingPathComponent("F1ChronicleSchemeTests-\(UUID().uuidString)")
        try FileManager.default.createDirectory(
            at: temporaryRoot,
            withIntermediateDirectories: true
        )
        try Data("<h1>Home</h1>".utf8).write(
            to: temporaryRoot.appendingPathComponent("index.html")
        )
        let museum = temporaryRoot.appendingPathComponent("museum")
        try FileManager.default.createDirectory(
            at: museum,
            withIntermediateDirectories: true
        )
        try Data("<h1>Museum</h1>".utf8).write(
            to: museum.appendingPathComponent("index.html")
        )
        try Data(#"{"schemaVersion":1}"#.utf8).write(
            to: temporaryRoot.appendingPathComponent("build-manifest.json")
        )
    }

    override func tearDownWithError() throws {
        if temporaryRoot != nil {
            try? FileManager.default.removeItem(at: temporaryRoot)
        }
    }

    func testResolvesRootNestedRouteAndManifestFromBundleRoot() throws {
        let handler = AppSchemeHandler(webAssetsURL: temporaryRoot)
        let cases = [
            ("applocal://localhost/", "text/html", "<h1>Home</h1>"),
            ("applocal://localhost/museum/", "text/html", "<h1>Museum</h1>"),
            (
                "applocal://localhost/build-manifest.json",
                "application/json",
                #"{"schemaVersion":1}"#
            ),
        ]

        for (rawURL, mimeType, body) in cases {
            let response = try AppSchemeHandler.resolve(
                request: URLRequest(
                    url: try XCTUnwrap(URL(string: rawURL))
                ),
                webAssetsURL: temporaryRoot
            )

            XCTAssertEqual(response.statusCode, 200, rawURL)
            XCTAssertEqual(response.mimeType, mimeType, rawURL)
            XCTAssertEqual(String(decoding: response.data, as: UTF8.self), body)
        }
    }

    func testRejectsWrongSchemeAndHost() throws {
        XCTAssertThrowsError(
            try AppSchemeHandler.resolve(
                request: URLRequest(
                    url: try XCTUnwrap(URL(string: "https://localhost/"))
                ),
                webAssetsURL: temporaryRoot
            )
        ) { error in
            XCTAssertEqual(error as? SchemeResolutionError, .invalidScheme)
        }

        XCTAssertThrowsError(
            try AppSchemeHandler.resolve(
                request: URLRequest(
                    url: try XCTUnwrap(URL(string: "applocal://evil.example/"))
                ),
                webAssetsURL: temporaryRoot
            )
        ) { error in
            XCTAssertEqual(error as? SchemeResolutionError, .invalidHost)
        }
    }

    func testRejectsUnsupportedMethod() throws {
        var request = URLRequest(
            url: try XCTUnwrap(URL(string: "applocal://localhost/"))
        )
        request.httpMethod = "POST"

        XCTAssertThrowsError(
            try AppSchemeHandler.resolve(
                request: request,
                webAssetsURL: temporaryRoot
            )
        ) { error in
            XCTAssertEqual(error as? SchemeResolutionError, .unsupportedMethod)
        }
    }

    func testRejectsEncodedAndPlainPathTraversal() throws {
        let traversalURLs = [
            "applocal://localhost/../secret.txt",
            "applocal://localhost/%2e%2e/secret.txt",
            "applocal://localhost/%2E%2E%2Fsecret.txt",
        ]

        for rawURL in traversalURLs {
            XCTAssertThrowsError(
                try AppSchemeHandler.resolve(
                    request: URLRequest(
                        url: try XCTUnwrap(URL(string: rawURL))
                    ),
                    webAssetsURL: temporaryRoot
                ),
                rawURL
            ) { error in
                XCTAssertEqual(
                    error as? SchemeResolutionError,
                    .pathTraversal,
                    rawURL
                )
            }
        }
    }

    func testMissingFileReturnsExplicitFailureInsteadOfHomeDocument() throws {
        let request = URLRequest(
            url: try XCTUnwrap(
                URL(string: "applocal://localhost/missing-artifact.json")
            )
        )

        XCTAssertThrowsError(
            try AppSchemeHandler.resolve(
                request: request,
                webAssetsURL: temporaryRoot
            )
        ) { error in
            XCTAssertEqual(error as? SchemeResolutionError, .missingFile)
        }
    }
}
