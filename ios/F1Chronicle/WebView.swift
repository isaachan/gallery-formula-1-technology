import SwiftUI
import WebKit

/// A WKWebView wrapper that loads the F1 Track Chronicle web app and keeps
/// all in-site navigation inside the app. External schemes (mailto, tel, http
/// links that leave the host) are handed to the system.
struct WebView: UIViewRepresentable {
    private static let buildManifestSchemaVersion = 1
    private static let approvedExternalHosts: Set<String> = []
    private static let resourceRuleJSON = """
    [
      {
        "trigger": {
          "url-filter": "^https?://.*",
          "resource-type": [
            "document", "image", "style-sheet", "script", "font",
            "media", "svg-document", "raw"
          ]
        },
        "action": { "type": "block" }
      }
    ]
    """

    @Binding var isLoading: Bool
    @Binding var loadFailed: Bool
    @Binding var canGoBack: Bool

    func makeCoordinator() -> Coordinator {
        Coordinator(parent: self)
    }

    func makeUIView(context: Context) -> WKWebView {
        let config = WKWebViewConfiguration()
        config.allowsInlineMediaPlayback = true
        config.mediaTypesRequiringUserActionForPlayback = .all
        config.applicationNameForUserAgent = "F1Chronicle/1.0 (iOS)"
        config.websiteDataStore = .nonPersistent()

        // Serve the bundled static web app over a custom scheme so its absolute
        // asset paths (/_next/..., /search-index.json, routes) resolve against
        // the app bundle with no server — fully offline.
        let handler = AppSchemeHandler()
        config.setURLSchemeHandler(handler, forURLScheme: AppSchemeHandler.scheme)

        let preferences = WKPreferences()
        preferences.javaScriptCanOpenWindowsAutomatically = false
        config.preferences = preferences

        let webView = WKWebView(frame: .zero, configuration: config)
        webView.navigationDelegate = context.coordinator
        webView.uiDelegate = context.coordinator
        webView.allowsBackForwardNavigationGestures = true
        webView.allowsLinkPreview = true
        // The web app handles its own safe-area insets; do not double-adjust.
        webView.scrollView.contentInsetAdjustmentBehavior = .never
        webView.scrollView.bounces = false
        webView.isOpaque = false
        webView.backgroundColor = UIColor(named: "WebViewBackground") ?? .systemBackground
        context.coordinator.webView = webView

        // Observe in-app back requests from the overlay button.
        context.coordinator.backObserver = NotificationCenter.default.addObserver(
            forName: .goBackInWebView,
            object: nil,
            queue: .main
        ) { [weak contextCoordinator = context.coordinator] _ in
            contextCoordinator?.webView?.goBack()
        }

        guard validateBundledManifest(handler: handler) else {
            DispatchQueue.main.async {
                self.isLoading = false
                self.loadFailed = true
            }
            return webView
        }

        // Block all HTTP(S) subresources. The current release is bundled-only;
        // adding a remote media origin requires an explicit policy update.
        WKContentRuleListStore.default().compileContentRuleList(
            forIdentifier: "F1ChronicleBundledOnlyResources.v1",
            encodedContentRuleList: Self.resourceRuleJSON
        ) { ruleList, error in
            guard error == nil, let ruleList else {
                DispatchQueue.main.async {
                    self.isLoading = false
                    self.loadFailed = true
                }
                return
            }
            webView.configuration.userContentController
                .add(ruleList)
            webView.load(URLRequest(url: AppSchemeHandler.rootURL))
        }
        return webView
    }

    private func validateBundledManifest(handler: AppSchemeHandler) -> Bool {
        guard let webAssetsURL = handler.webAssetsURL,
              let appVersion = Bundle.main.object(
                forInfoDictionaryKey: "CFBundleShortVersionString"
              ) as? String else {
            return false
        }
        do {
            let manifest = try BuildManifest.load(
                from: webAssetsURL.appendingPathComponent(
                    "build-manifest.json"
                )
            )
            try manifest.validateCompatibility(
                expectedSchemaVersion: Self.buildManifestSchemaVersion,
                appVersion: appVersion
            )
            return true
        } catch {
            return false
        }
    }

    static func dismantleUIView(_ uiView: WKWebView, coordinator: Coordinator) {
        if let observer = coordinator.backObserver {
            NotificationCenter.default.removeObserver(observer)
            coordinator.backObserver = nil
        }
    }

    func updateUIView(_ uiView: WKWebView, context: Context) {
        // No per-state reloads; the web app owns routing.
    }

    final class Coordinator: NSObject, WKNavigationDelegate, WKUIDelegate {
        let parent: WebView
        let navigationPolicy = NavigationPolicy(
            approvedExternalHosts: WebView.approvedExternalHosts
        )
        weak var webView: WKWebView?
        var backObserver: NSObjectProtocol?

        init(parent: WebView) {
            self.parent = parent
        }

        func webView(_ webView: WKWebView,
                     didStartProvisionalNavigation navigation: WKNavigation!) {
            DispatchQueue.main.async {
                self.parent.isLoading = true
                self.parent.loadFailed = false
            }
        }

        func webView(_ webView: WKWebView,
                     didFinish navigation: WKNavigation!) {
            DispatchQueue.main.async {
                self.parent.isLoading = false
                self.parent.canGoBack = webView.canGoBack
            }
        }

        func webView(_ webView: WKWebView,
                     didFail navigation: WKNavigation!,
                     withError error: Error) {
            handleFailure(error)
        }

        func webView(_ webView: WKWebView,
                     didFailProvisionalNavigation navigation: WKNavigation!,
                     withError error: Error) {
            handleFailure(error)
        }

        private func handleFailure(_ error: Error) {
            // Ignore cancellations triggered by user navigation/reload.
            let ns = error as NSError
            if ns.code == NSURLErrorCancelled { return }
            DispatchQueue.main.async {
                self.parent.isLoading = false
                self.parent.loadFailed = true
            }
        }

        // Keep same-host http(s) navigation in-app; hand off other schemes.
        func webView(_ webView: WKWebView,
                     createWebViewWith configuration: WKWebViewConfiguration,
                     for navigationAction: WKNavigationAction,
                     windowFeatures: WKWindowFeatures) -> WKWebView? {
            if navigationAction.targetFrame == nil,
               let url = navigationAction.request.url {
                handle(
                    navigationDecision: navigationPolicy.decide(
                        url: url,
                        navigationType: navigationAction.navigationType
                    ),
                    url: url,
                    webView: webView
                )
            }
            return nil
        }

        func webView(_ webView: WKWebView,
                     decidePolicyFor navigationAction: WKNavigationAction,
                     decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
            guard let url = navigationAction.request.url else {
                decisionHandler(.cancel)
                return
            }

            let decision = navigationPolicy.decide(
                url: url,
                navigationType: navigationAction.navigationType
            )
            switch decision {
            case .allowInApp:
                decisionHandler(.allow)
            case .openExternally:
                openExternally(url)
                decisionHandler(.cancel)
            case .block:
                decisionHandler(.cancel)
            }
        }

        private func handle(
            navigationDecision: NavigationDecision,
            url: URL,
            webView: WKWebView
        ) {
            switch navigationDecision {
            case .allowInApp:
                webView.load(URLRequest(url: url))
            case .openExternally:
                openExternally(url)
            case .block:
                break
            }
        }

        private func openExternally(_ url: URL) {
            if UIApplication.shared.canOpenURL(url) {
                UIApplication.shared.open(url)
            }
        }
    }
}
