import { autoUpdater } from 'electron-updater';
import { BrowserWindow, ipcMain, app } from 'electron';

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
      try {
        const result = await autoUpdater.checkForUpdates();
        return { success: true, version: result?.updateInfo?.version };
      } catch (err: any) {
        console.warn('updater:check error:', err?.message);
        return { success: false, error: err?.message || String(err) };
      }
    });

    ipcMain.handle('updater:download', async () => {
      try {
        this.send('updater:status', { status: 'downloading' } as UpdateStatusPayload);
        await autoUpdater.downloadUpdate();
        return { success: true };
      } catch (err: any) {
        return { success: false, error: err?.message || String(err) };
      }
    });

    ipcMain.handle('updater:install', () => {
      autoUpdater.quitAndInstall(false, true);
    });
  }
}

