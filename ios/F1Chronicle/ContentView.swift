import SwiftUI

/// Hosts the wrapped web view with loading, offline/error, and back navigation.
struct ContentView: View {
    @State private var isLoading = true
    @State private var loadFailed = false
    @State private var canGoBack = false
    @State private var reloadToken = 0

    var body: some View {
        ZStack {
            Color("WebViewBackground")
                .ignoresSafeArea()

            WebView(url: AppConfig.resolvedURL,
                    isLoading: $isLoading,
                    loadFailed: $loadFailed,
                    canGoBack: $canGoBack)
                .opacity(loadFailed ? 0 : 1)
                .id(reloadToken)

            if loadFailed {
                offlineView
            } else if isLoading {
                ProgressView()
                    .scaleEffect(1.2)
            }
        }
        .overlay(alignment: .topLeading) {
            if canGoBack && !loadFailed {
                Button {
                    // Hand back-button to the in-app web history.
                    NotificationCenter.default.post(name: .goBackInWebView, object: nil)
                } label: {
                    Image(systemName: "chevron.left")
                        .font(.system(size: 17, weight: .semibold))
                        .padding(10)
                        .background(.ultraThinMaterial, in: Circle())
                }
                .accessibilityLabel("返回")
                .padding(.leading, 12)
                .padding(.top, 4)
                .opacity(isLoading ? 0 : 1)
            }
        }
    }

    private var offlineView: some View {
        VStack(spacing: 16) {
            Image(systemName: "wifi.slash")
                .font(.system(size: 44))
                .foregroundStyle(.secondary)
            Text("无法加载内容")
                .font(.headline)
            Text("请检查网络连接后重试。")
                .font(.subheadline)
                .foregroundStyle(.secondary)
            Button("重试") {
                loadFailed = false
                isLoading = true
                reloadToken &+= 1
            }
            .buttonStyle(.borderedProminent)
        }
        .padding()
    }
}

extension Notification.Name {
    static let goBackInWebView = Notification.Name("goBackInWebView")
}
