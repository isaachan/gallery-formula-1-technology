import Foundation
import WebKit

enum NavigationDecision: Equatable {
    case allowInApp
    case openExternally
    case block
}

/// One fail-closed document-navigation policy for the bundled application.
/// Resource requests are separately constrained by the content rule list in
/// WebView, while all local file delivery is constrained by AppSchemeHandler.
struct NavigationPolicy {
    let approvedExternalHosts: Set<String>

    init(approvedExternalHosts: Set<String>) {
        self.approvedExternalHosts = Set(
            approvedExternalHosts.map { $0.lowercased() }
        )
    }

    func decide(
        url: URL,
        navigationType: WKNavigationType
    ) -> NavigationDecision {
        let scheme = url.scheme?.lowercased()
        let host = url.host?.lowercased()

        if scheme == AppSchemeHandler.scheme,
           host == AppSchemeHandler.host,
           url.port == nil,
           url.user == nil,
           url.password == nil {
            return .allowInApp
        }

        guard navigationType == .linkActivated else {
            return .block
        }

        if ["mailto", "tel", "sms"].contains(scheme) {
            return .openExternally
        }

        if scheme == "https",
           let host,
           approvedExternalHosts.contains(host) {
            return .openExternally
        }

        return .block
    }

    func decision(for url: URL) -> NavigationDecision {
        decide(url: url, navigationType: .linkActivated)
    }
}
