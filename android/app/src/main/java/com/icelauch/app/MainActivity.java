package com.icelauch.app;

import android.graphics.Color;
import android.os.Build;
import android.os.Bundle;
import android.view.WindowManager;
import android.webkit.WebSettings;
import android.webkit.WebView;
import androidx.core.view.WindowCompat;
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

    private void configureEdgeToEdgeAndCutout() {
        try {
            // Android 9+ (API 28+): Extend window behind waterdrop / punch-hole camera cutouts
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                WindowManager.LayoutParams lp = getWindow().getAttributes();
                lp.layoutInDisplayCutoutMode = WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES;
                getWindow().setAttributes(lp);
            }

            // WindowCompat edge-to-edge layout
            WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
            getWindow().setStatusBarColor(Color.TRANSPARENT);
            getWindow().setNavigationBarColor(Color.TRANSPARENT);

            // Android 10+ (API 29+): Disable navigation bar contrast enforcement to prevent dark bar around gesture bar
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                getWindow().setNavigationBarContrastEnforced(false);
            }
        } catch (Exception ignored) {}
    }

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(ApkInstallerPlugin.class);
        registerPlugin(ScreenOrientationPlugin.class);
        super.onCreate(savedInstanceState);
        configureEdgeToEdgeAndCutout();
        configureWebViewSettings();
    }

    @Override
    public void onResume() {
        super.onResume();
        configureEdgeToEdgeAndCutout();
        configureWebViewSettings();
    }
}
