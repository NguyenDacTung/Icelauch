package com.icelauch.app;

import android.content.Intent;
import android.net.Uri;
import androidx.core.content.FileProvider;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;

@CapacitorPlugin(name = "ApkInstaller")
public class ApkInstallerPlugin extends Plugin {

    @PluginMethod
    public void downloadAndInstall(PluginCall call) {
        String apkUrl = call.getString("url");
        if (apkUrl == null || apkUrl.isEmpty()) {
            call.reject("URL không được để trống");
            return;
        }

        new Thread(() -> {
            try {
                URL url = new URL(apkUrl);
                HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                conn.setRequestProperty("User-Agent", "Icelauch-Android-Updater");
                conn.setInstanceFollowRedirects(true);
                conn.connect();

                int responseCode = conn.getResponseCode();
                // Follow HTTP 301, 302, 307, 308 redirects (GitHub Releases redirect to AWS S3 storage)
                while (responseCode == HttpURLConnection.HTTP_MOVED_PERM
                        || responseCode == HttpURLConnection.HTTP_MOVED_TEMP
                        || responseCode == 307
                        || responseCode == 308) {
                    String redirectUrl = conn.getHeaderField("Location");
                    if (redirectUrl == null) break;
                    url = new URL(redirectUrl);
                    conn = (HttpURLConnection) url.openConnection();
                    conn.setRequestProperty("User-Agent", "Icelauch-Android-Updater");
                    conn.connect();
                    responseCode = conn.getResponseCode();
                }

                int fileLength = conn.getContentLength();
                File cacheDir = getContext().getCacheDir();
                File apkFile = new File(cacheDir, "Icelauch-update.apk");
                if (apkFile.exists()) {
                    apkFile.delete();
                }

                InputStream in = conn.getInputStream();
                FileOutputStream out = new FileOutputStream(apkFile);

                byte[] buffer = new byte[8192];
                int bytesRead;
                long totalBytesRead = 0;
                long lastProgressTime = 0;

                while ((bytesRead = in.read(buffer)) != -1) {
                    out.write(buffer, 0, bytesRead);
                    totalBytesRead += bytesRead;
                    long now = System.currentTimeMillis();
                    if (now - lastProgressTime > 100 && fileLength > 0) {
                        lastProgressTime = now;
                        int progress = (int) (totalBytesRead * 100 / fileLength);
                        JSObject progressObj = new JSObject();
                        progressObj.put("progress", progress);
                        notifyListeners("downloadProgress", progressObj);
                    }
                }

                out.flush();
                out.close();
                in.close();

                // Notify 100%
                JSObject finalProgress = new JSObject();
                finalProgress.put("progress", 100);
                notifyListeners("downloadProgress", finalProgress);

                // Trigger Android native package installation
                Intent intent = new Intent(Intent.ACTION_VIEW);
                Uri apkUri = FileProvider.getUriForFile(
                        getContext(),
                        getContext().getPackageName() + ".fileprovider",
                        apkFile
                );
                intent.setDataAndType(apkUri, "application/vnd.android.package-archive");
                intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_GRANT_READ_URI_PERMISSION);
                getContext().startActivity(intent);

                JSObject ret = new JSObject();
                ret.put("success", true);
                ret.put("filePath", apkFile.getAbsolutePath());
                call.resolve(ret);

            } catch (Exception e) {
                JSObject errObj = new JSObject();
                errObj.put("error", e.getMessage());
                notifyListeners("downloadError", errObj);
                call.reject("Lỗi khi tải hoặc mở file cài đặt: " + e.getMessage(), e);
            }
        }).start();
    }
}
