import XCTest

final class F1ChronicleUITests: XCTestCase {
    override func setUpWithError() throws {
        continueAfterFailure = false
    }

    func testBundledApplicationLaunchesWithoutNetworkDependency() {
        let app = XCUIApplication()
        app.launch()

        XCTAssertTrue(
            app.staticTexts["沿着赛道，驶过 76 个赛季"]
                .waitForExistence(timeout: 10),
            "The bundled local document should render its home subtitle."
        )
        XCTAssertFalse(app.staticTexts["无法加载内容"].exists)
    }
}
