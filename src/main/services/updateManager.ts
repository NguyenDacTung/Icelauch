import { autoUpdater } from 'electron-updater';
import { BrowserWindow, ipcMain, app, shell } from 'electron';
import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';

export interface UpdateStatusPayload {
  status: 'checking' | 'available' | 'not-available' | 'downloading' | 'downloaded' | 'error';
  version?: string;
  releaseDate?: string;
  releaseNotes?: string;
  error?: string;
}

export interface UpdateProgressPayload {
  percent: number;
  bytesPerSecond: number;
  transferred: number;
  total: number;
}

export class UpdateManager {
  private static instance: UpdateManager;
  private mainWindow: BrowserWindow | null = null;
  private isChecking = false;
  private pendingPcDownloadUrl: string | null = null;

  private constructor() {
    // Configure autoUpdater
    autoUpdater.autoDownload = false; // User controls when to download
    autoUpdater.autoInstallOnAppQuit = true;
    autoUpdater.allowPrerelease = false;

    this.setupListeners();
  }

  public static getInstance(): UpdateManager {
    if (!UpdateManager.instance) {
      UpdateManager.instance = new UpdateManager();
    }
    return UpdateManager.instance;
  }

  public setMainWindow(win: BrowserWindow) {
    this.mainWindow = win;
  }

  private send(channel: string, ...args: any[]) {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send(channel, ...args);
    }
  }

  private setupListeners() {
    autoUpdater.on('checking-for-update', () => {
      this.isChecking = true;
      this.send('updater:status', { status: 'checking' } as UpdateStatusPayload);
    });

    autoUpdater.on('update-available', (info) => {
      this.isChecking = false;
      const releaseNotesText = typeof info.releaseNotes === 'string'
        ? info.releaseNotes
        : Array.isArray(info.releaseNotes)
        ? info.releaseNotes.map((n: any) => (typeof n === 'string' ? n : n.note || '')).join('\n')
        : '';

      this.send('updater:status', {
        status: 'available',
        version: info.version,
        releaseDate: info.releaseDate,
        releaseNotes: releaseNotesText,
      } as UpdateStatusPayload);
    });

    autoUpdater.on('update-not-available', (info) => {
      this.isChecking = false;
      this.send('updater:status', {
        status: 'not-available',
        version: info?.version || app.getVersion(),
      } as UpdateStatusPayload);
    });

    autoUpdater.on('download-progress', (progress) => {
      this.send('updater:progress', {
        percent: Math.round(progress.percent * 10) / 10,
        bytesPerSecond: progress.bytesPerSecond,
        transferred: progress.transferred,
        total: progress.total,
      } as UpdateProgressPayload);
    });

    autoUpdater.on('update-downloaded', (info) => {
      this.send('updater:status', {
        status: 'downloaded',
        version: info.version,
      } as UpdateStatusPayload);
    });

    autoUpdater.on('error', (err) => {
      this.isChecking = false;
      console.warn('UpdateManager error:', err?.message || err);
      this.send('updater:status', {
        status: 'error',
        error: err?.message || String(err),
      } as UpdateStatusPayload);
    });
  }

  public setupIpc() {
    ipcMain.handle('updater:get-version', () => {
      return app.getVersion();
    });

    ipcMain.handle('updater:check', async () => {
      if (this.isChecking) return { success: true, message: 'Đang kiểm tra...' };
      this.isChecking = true;
      this.send('updater:status', { status: 'checking' } as UpdateStatusPayload);

      // 1. Prioritize Supabase Release Registry first (Eliminates GitHub 404 on private repositories)
      try {
        const fetchSupabase = () =>
          new Promise<any>((resolve) => {
            const req = https.get(
              'https://wqmmagfrwwctvipopazx.supabase.co/rest/v1/icelauch_user_data?profile_id=eq.icelauch_device_registry&select=game_stats',
              {
                headers: {
                  apikey: 'sb_publishable_l1vNbLKXXhLNnfi1pI5UnQ_0EaqbXuJ',
                  Authorization: 'Bearer sb_publishable_l1vNbLKXXhLNnfi1pI5UnQ_0EaqbXuJ',
                },
              },
              (res) => {
                let d = '';
                res.on('data', (c) => (d += c));
                res.on('end', () => {
                  try {
                    const rows = JSON.parse(d);
                    resolve(rows[0]?.game_stats?.latest_release || null);
                  } catch {
                    resolve(null);
                  }
                });
              }
            );
            req.on('error', () => resolve(null));
          });

        const rel = await fetchSupabase();
        if (rel && rel.version) {
          this.isChecking = false;
          const currentVer = app.getVersion();
          // Semantic compare versions
          const cleanRel = rel.version.replace(/^v/i, '').trim();
          const cleanCur = currentVer.replace(/^v/i, '').trim();
          const rParts = cleanRel.split('.').map((n: string) => parseInt(n, 10) || 0);
          const cParts = cleanCur.split('.').map((n: string) => parseInt(n, 10) || 0);
          let isNewer = false;
          for (let i = 0; i < Math.max(rParts.length, cParts.length); i++) {
            const r = rParts[i] || 0;
            const c = cParts[i] || 0;
            if (r > c) { isNewer = true; break; }
            if (r < c) { isNewer = false; break; }
          }

          if (isNewer) {
            this.pendingPcDownloadUrl = rel.pcSetupUrl || '';
            this.send('updater:status', {
              status: 'available',
              version: rel.version,
              releaseNotes: rel.releaseNotes || `Bản phát hành v${rel.version}`,
            } as UpdateStatusPayload);
            return { success: true, version: rel.version };
          } else {
            this.send('updater:status', {
              status: 'not-available',
              version: currentVer,
            } as UpdateStatusPayload);
            return { success: true, version: currentVer };
          }
        }
      } catch (supaErr) {
        console.warn('[UpdateManager] Supabase check error:', supaErr);
      }

      // 2. Fallback to autoUpdater only if Supabase had no release records
      try {
        const result = await autoUpdater.checkForUpdates();
        this.isChecking = false;
        return { success: true, version: result?.updateInfo?.version };
      } catch (err: any) {
        this.isChecking = false;
        console.warn('[UpdateManager] GitHub fallback check error:', err?.message || err);
        this.send('updater:status', {
          status: 'error',
          error: err?.message || String(err),
        } as UpdateStatusPayload);
        return { success: false, error: err?.message || String(err) };
      }
    });

    ipcMain.handle('updater:download', async () => {
      try {
        this.send('updater:status', { status: 'downloading' } as UpdateStatusPayload);

        // If we have a direct PC Setup URL from Google Drive / Supabase
        if (this.pendingPcDownloadUrl) {
          const downloadUrl = this.pendingPcDownloadUrl;
          const tempPath = path.join(app.getPath('temp'), `Icelauch-Setup-Update.exe`);

          await new Promise<void>((resolve, reject) => {
            const client = downloadUrl.startsWith('https') ? https : http;
            const fileStream = fs.createWriteStream(tempPath);

            const downloadReq = (url: string) => {
              client.get(url, (res) => {
                // Follow redirects
                if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                  return downloadReq(res.headers.location);
                }
                const totalBytes = parseInt(res.headers['content-length'] || '0', 10);
                let receivedBytes = 0;

                res.on('data', (chunk) => {
                  receivedBytes += chunk.length;
                  if (totalBytes > 0) {
                    this.send('updater:progress', {
                      percent: Math.round((receivedBytes / totalBytes) * 1000) / 10,
                      bytesPerSecond: 0,
                      transferred: receivedBytes,
                      total: totalBytes,
                    } as UpdateProgressPayload);
                  }
                });

                res.pipe(fileStream);
                fileStream.on('finish', () => {
                  fileStream.close();
                  resolve();
                });
                fileStream.on('error', reject);
              }).on('error', reject);
            };

            downloadReq(downloadUrl);
          });

          this.send('updater:status', { status: 'downloaded' } as UpdateStatusPayload);
          return { success: true };
        }

        await autoUpdater.downloadUpdate();
        return { success: true };
      } catch (err: any) {
        return { success: false, error: err?.message || String(err) };
      }
    });

    ipcMain.handle('updater:install', async () => {
      const tempPath = path.join(app.getPath('temp'), `Icelauch-Setup-Update.exe`);
      if (fs.existsSync(tempPath)) {
        await shell.openPath(tempPath);
        setTimeout(() => {
          app.quit();
        }, 1000);
        return;
      }
      autoUpdater.quitAndInstall(false, true);
    });
  }
}

