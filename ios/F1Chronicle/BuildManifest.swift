import Foundation

enum BuildManifestError: Error, Equatable {
    case missing
    case malformed
    case incompatibleSchema(expected: Int, actual: Int)
    case incompatibleAppVersion(expected: String, actual: String)
}

struct BuildManifest: Decodable, Equatable {
    let schemaVersion: Int
    let appVersion: String
    let contentVersion: String
    let buildCommit: String
    let builtAt: String
    let contentPackId: String
    let graphVersion: String
    let mediaManifestVersion: String

    static func load(from url: URL) throws -> BuildManifest {
        guard FileManager.default.fileExists(atPath: url.path) else {
            throw BuildManifestError.missing
        }
        do {
            return try JSONDecoder().decode(
                BuildManifest.self,
                from: Data(contentsOf: url)
            )
        } catch {
            throw BuildManifestError.malformed
        }
    }

    func validateCompatibility(
        expectedSchemaVersion: Int,
        appVersion expectedAppVersion: String
    ) throws {
        guard schemaVersion == expectedSchemaVersion else {
            throw BuildManifestError.incompatibleSchema(
                expected: expectedSchemaVersion,
                actual: schemaVersion
            )
        }
        guard appVersion == expectedAppVersion else {
            throw BuildManifestError.incompatibleAppVersion(
                expected: expectedAppVersion,
                actual: appVersion
            )
        }
    }
}
