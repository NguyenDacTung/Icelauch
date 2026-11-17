package com.icelauch.app;

import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private void configureWebViewSettings() {
        try {
            if (this.bridge != null) {
                final WebView webView = this.bridge.getWebView();
                if (webView != null) {
                    webView.post(new Runnable() {
                        @Override
                        public void run() {
                            try {
                                WebSettings settings = webView.getSettings();
                                settings.setMediaPlaybackRequiresUserGesture(false);
                                settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
                                settings.setDomStorageEnabled(true);
                                settings.setDatabaseEnabled(true);
                                settings.setAllowFileAccess(true);
                                settings.setAllowContentAccess(true);
                            } catch (Exception ignored) {}
                        }
                    });
                }
            }
        } catch (Exception ignored) {}
    }

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(ApkInstallerPlugin.class);
        super.onCreate(savedInstanceState);
        configureWebViewSettings();
    }

    @Override
    public void onResume() {
        super.onResume();
        configureWebViewSettings();
    }
}
