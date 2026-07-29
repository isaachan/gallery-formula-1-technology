import XCTest
@testable import F1Chronicle

final class BuildManifestTests: XCTestCase {
    private var temporaryRoot: URL!

    override func setUpWithError() throws {
        temporaryRoot = FileManager.default.temporaryDirectory
            .appendingPathComponent("F1ChronicleManifestTests-\(UUID().uuidString)")
        try FileManager.default.createDirectory(
            at: temporaryRoot,
            withIntermediateDirectories: true
        )
    }

    override func tearDownWithError() throws {
        if temporaryRoot != nil {
            try? FileManager.default.removeItem(at: temporaryRoot)
        }
    }

    func testLoadsCompleteCompatibleManifest() throws {
        let url = try writeManifest(
            """
            {
              "schemaVersion": 1,
              "appVersion": "1.2.3",
              "contentVersion": "content-abc123",
              "buildCommit": "1234567890abcdef1234567890abcdef12345678",
              "builtAt": "2026-07-29T12:34:56.000Z",
              "contentPackId": "bundled-2026-07-29",
              "graphVersion": "graph-v1",
              "mediaManifestVersion": "media-v1"
            }
            """
        )

        let manifest = try BuildManifest.load(from: url)
        XCTAssertEqual(manifest.schemaVersion, 1)
        XCTAssertEqual(manifest.appVersion, "1.2.3")
        XCTAssertEqual(manifest.contentVersion, "content-abc123")
        XCTAssertEqual(
            manifest.buildCommit,
            "1234567890abcdef1234567890abcdef12345678"
        )
        XCTAssertEqual(manifest.contentPackId, "bundled-2026-07-29")
        XCTAssertEqual(manifest.graphVersion, "graph-v1")
        XCTAssertEqual(manifest.mediaManifestVersion, "media-v1")
        XCTAssertNoThrow(
            try manifest.validateCompatibility(
                expectedSchemaVersion: 1,
                appVersion: "1.2.3"
            )
        )
    }

    func testMissingManifestFailsClosed() {
        let missing = temporaryRoot.appendingPathComponent("missing.json")
        XCTAssertThrowsError(try BuildManifest.load(from: missing))
    }

    func testMalformedManifestFailsClosed() throws {
        let malformed = temporaryRoot.appendingPathComponent("malformed.json")
        try Data("{not-json".utf8).write(to: malformed)

        XCTAssertThrowsError(try BuildManifest.load(from: malformed))
    }

    func testMissingRequiredVersionFieldFailsClosed() throws {
        let url = try writeManifest(
            """
            {
              "schemaVersion": 1,
              "appVersion": "1.2.3"
            }
            """
        )

        XCTAssertThrowsError(try BuildManifest.load(from: url))
    }

    func testIncompatibleSchemaFailsClosed() throws {
        let manifest = try BuildManifest.load(
            from: writeManifest(validManifest.replacingOccurrences(
                of: #""schemaVersion": 1"#,
                with: #""schemaVersion": 2"#
            ))
        )

        XCTAssertThrowsError(
            try manifest.validateCompatibility(
                expectedSchemaVersion: 1,
                appVersion: "1.2.3"
            )
        )
    }

    func testIncompatibleApplicationVersionFailsClosed() throws {
        let manifest = try BuildManifest.load(from: writeManifest(validManifest))

        XCTAssertThrowsError(
            try manifest.validateCompatibility(
                expectedSchemaVersion: 1,
                appVersion: "9.9.9"
            )
        )
    }

    private var validManifest: String {
        """
        {
          "schemaVersion": 1,
          "appVersion": "1.2.3",
          "contentVersion": "content-abc123",
          "buildCommit": "1234567890abcdef1234567890abcdef12345678",
          "builtAt": "2026-07-29T12:34:56.000Z",
          "contentPackId": "bundled-2026-07-29",
          "graphVersion": "graph-v1",
          "mediaManifestVersion": "media-v1"
        }
        """
    }

    private func writeManifest(_ contents: String) throws -> URL {
        let url = temporaryRoot.appendingPathComponent("\(UUID().uuidString).json")
        try Data(contents.utf8).write(to: url)
        return url
    }
}
