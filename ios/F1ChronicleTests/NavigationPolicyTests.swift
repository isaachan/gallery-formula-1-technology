import XCTest
import WebKit
@testable import F1Chronicle

final class NavigationPolicyTests: XCTestCase {
    private let policy = NavigationPolicy(
        approvedExternalHosts: ["www.formula1.com", "www.fia.com"]
    )

    func testOnlyLocalAppOriginIsAllowedInsideWebView() throws {
        let allowed = [
            "applocal://localhost/",
            "applocal://localhost/museum/",
            "applocal://localhost/seasons/1988/",
        ]

        for rawURL in allowed {
            let url = try XCTUnwrap(URL(string: rawURL))
            XCTAssertEqual(
                policy.decide(url: url, navigationType: .other),
                .allowInApp,
                rawURL
            )
        }
    }

    func testExplicitSystemSchemesOpenExternally() throws {
        let externalActions = [
            "mailto:editor@example.com",
            "tel:+123456789",
            "sms:+123456789",
        ]

        for rawURL in externalActions {
            let url = try XCTUnwrap(URL(string: rawURL))
            XCTAssertEqual(
                policy.decide(url: url, navigationType: .linkActivated),
                .openExternally,
                rawURL
            )
        }
    }

    func testApprovedHTTPSLinksOpenInSystemBrowser() throws {
        let approved = [
            "https://www.formula1.com/en/results.html",
            "https://www.fia.com/news",
        ]

        for rawURL in approved {
            let url = try XCTUnwrap(URL(string: rawURL))
            XCTAssertEqual(
                policy.decide(url: url, navigationType: .linkActivated),
                .openExternally,
                rawURL
            )
        }
    }

    func testExternalActionsRequireAnExplicitLinkActivation() throws {
        let externalOnlyWhenActivated = [
            "mailto:editor@example.com",
            "tel:+123456789",
            "sms:+123456789",
            "https://www.formula1.com/en/results.html",
        ]

        for rawURL in externalOnlyWhenActivated {
            let url = try XCTUnwrap(URL(string: rawURL))
            XCTAssertEqual(
                policy.decide(url: url, navigationType: .other),
                .block,
                rawURL
            )
        }
    }

    func testUnapprovedOrAmbiguousNavigationIsBlocked() throws {
        let blocked = [
            "applocal://evil.example/",
            "applocal://localhost.evil.example/",
            "applocal://user@localhost/",
            "applocal://localhost:443/",
            "https://evil.example/",
            "http://www.formula1.com/",
            "javascript:alert(1)",
            "data:text/html,blocked",
            "file:///tmp/index.html",
            "ftp://www.formula1.com/archive",
        ]

        for rawURL in blocked {
            let url = try XCTUnwrap(URL(string: rawURL))
            XCTAssertEqual(
                policy.decide(url: url, navigationType: .linkActivated),
                .block,
                rawURL
            )
        }
    }

    func testApprovedHostMatchingIsExact() throws {
        let deceptiveURL = try XCTUnwrap(
            URL(string: "https://www.formula1.com.evil.example/")
        )

        XCTAssertEqual(
            policy.decide(url: deceptiveURL, navigationType: .linkActivated),
            .block
        )
    }
}
