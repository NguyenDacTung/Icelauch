import { app, BrowserWindow, ipcMain, shell, dialog, session, Menu, nativeTheme } from 'electron';
import path from 'path';
import fs from 'fs';
import https from 'https';
import http from 'http';
import * as child_process from 'child_process';
import { StorageService, DEFAULT_SUPABASE_URL, DEFAULT_SUPABASE_ANON_KEY } from './services/storage';
import { StreamProxyService } from './services/streamProxy';
import { DownloadManager } from './services/downloader';
import { GoogleDriveService } from './services/gdrive';
import { ExtractorService } from './services/extractor';
import { ExeScannerService } from './services/exeScanner';
import { GameRunnerService } from './services/gameRunner';
import { MediaDownloadManager } from './services/mediaDownloader';
import { UpdateManager } from './services/updateManager';
import { SupabaseSyncService } from './services/supabaseSync';
import crypto from 'crypto';
import type { Game, MediaItem, AppSettings, MediaPlaylist, UserProfile, CloudSyncSettings } from '../renderer/src/types';

// Force dark theme across Windows DWM and remove global application menu
nativeTheme.themeSource = 'dark';
Menu.setApplicationMenu(null);

let mainWindow: BrowserWindow | null = null;

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

async function createWindow() {
  const candidateIcons = [
    path.join(__dirname, '../../public/icon.png'),
    path.join(__dirname, '../../icon.png'),
    path.join(process.cwd(), 'icon.png'),
    path.join(process.cwd(), 'public/icon.png'),
  ];
  const iconPath = candidateIcons.find((p) => fs.existsSync(p));

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1000,
    minHeight: 640,
    title: 'Icelauch - Game & Media Launcher',
    icon: iconPath,
    backgroundColor: '#0F1115',
    frame: false, // Sleek frameless window, eliminates default white titlebar and menu bar
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: false, // Allows cross-origin video streaming and custom protocols
    },
    show: false,
  });

  mainWindow.setMenu(null);
  mainWindow.removeMenu();
  mainWindow.setMenuBarVisibility(false);

  mainWindow.once('ready-to-show', () => {
    mainWindow?.maximize();
    mainWindow?.show();
    if (mainWindow) {
      UpdateManager.getInstance().setMainWindow(mainWindow);
    }
  });

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: 'deny' };
  });

  if (isDev && process.env['ELECTRON_RENDERER_URL']) {
    await mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL']);
  } else {
    const distHtml = path.join(__dirname, '../../dist/index.html');
    const rendererHtml = path.join(__dirname, '../renderer/index.html');
    if (fs.existsSync(distHtml)) {
      await mainWindow.loadFile(distHtml);
    } else {
      await mainWindow.loadFile(rendererHtml);
    }
  }
}

// App lifecycle
app.whenReady().then(async () => {
  // 1. Fix YouTube Trailer Embeds (Bypass Error 152-4 and 153)
  const YOUTUBE_URL_PATTERNS = [
    'https://*.youtube.com/*',
    'https://youtube.com/*',
    'https://*.youtube-nocookie.com/*',
    'https://youtube-nocookie.com/*',
    'http://*.youtube.com/*',
    'http://youtube.com/*',
    'https://*.googlevideo.com/*',
    'https://*.ytimg.com/*',
  ];

  session.defaultSession.webRequest.onBeforeSendHeaders(
    { urls: YOUTUBE_URL_PATTERNS },
    (details, callback) => {
      // Never interfere with Google Drive streaming or Google Drive preview embeds
      if (
        details.url.includes('drive.google.com') ||
        details.url.includes('source=drive') ||
        (details.referrer && details.referrer.includes('drive.google.com'))
      ) {
        callback({ cancel: false, requestHeaders: details.requestHeaders });
        return;
      }

      const requestHeaders = { ...details.requestHeaders };
      // Always inject valid nocookie referer & origin across all YouTube/GoogleVideo endpoints to bypass Error 152-4
      requestHeaders['Referer'] = 'https://www.youtube-nocookie.com/';
      requestHeaders['Origin'] = 'https://www.youtube-nocookie.com';
      requestHeaders['User-Agent'] =
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
      callback({ cancel: false, requestHeaders });
    }
  );

  // 2. Allow YouTube and Google Drive streaming embeds inside Electron without iframe header blocks
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    const responseHeaders = { ...details.responseHeaders };
    delete responseHeaders['x-frame-options'];
    delete responseHeaders['X-Frame-Options'];
    if (responseHeaders['content-security-policy']) {
      responseHeaders['content-security-policy'] = responseHeaders['content-security-policy'].map((val) =>
        val.replace(/frame-ancestors[^;]+;?/gi, '')
      );
    }
    callback({ cancel: false, responseHeaders });
  });

  const storage = StorageService.getInstance();
  const streamProxy = StreamProxyService.getInstance();
  const downloader = DownloadManager.getInstance();
  const extractor = ExtractorService.getInstance();
  const exeScanner = ExeScannerService.getInstance();
  const gameRunner = GameRunnerService.getInstance();
  const mediaDownloader = MediaDownloadManager.getInstance();

  // 1. Downloader Callbacks
  downloader.setCallbacks({
    onProgress: (gameId, progress) => {
      const g = storage.getGame(gameId);
      if (g) {
        g.downloadProgress = progress;
        mainWindow?.webContents.send('game:download-progress', { gameId, progress });
      }
    },
    onCompleted: (gameId) => {
      const g = storage.getGame(gameId);
      if (g) {
        // Auto transition from Downloaded -> Installing (Extracting)
        g.status = 'installing';
        g.downloadProgress = undefined;
        g.installProgress = { percentage: 0, statusText: 'Đang bắt đầu giải nén...' };
        storage.saveGame(g);
        mainWindow?.webContents.send('game:updated', g);

        // Start 7-Zip Extraction
        extractor.extractGame(g).catch((err) => {
          console.error('Extractor exception:', err);
        });
      }
    },
    onError: (gameId, error) => {
      const g = storage.getGame(gameId);
      if (g) {
        g.status = 'error';
        g.errorDetails = error;
        storage.saveGame(g);
        mainWindow?.webContents.send('game:updated', g);
      }
    },
  });

  // 2. Extractor Callbacks
  extractor.setCallbacks({
    onProgress: (gameId, progress) => {
      const g = storage.getGame(gameId);
      if (g) {
        g.installProgress = progress;
        mainWindow?.webContents.send('game:install-progress', { gameId, progress });
      }
    },
    onPasswordPrompt: (gameId: string, gameName: string, isRetry: boolean) => {
      mainWindow?.webContents.send('game:prompt-password', {
        gameId,
        gameName,
        isRetry,
      });
    },
    onCompleted: (gameId, installDir) => {
      const g = storage.getGame(gameId);
      if (g) {
        // Auto scan and score executables
        const candidates = exeScanner.scanAndRankExecutables(installDir, g.name);
        g.installPath = installDir;
        g.exeCandidates = candidates.map((c) => c.relativePath);
        if (!g.mainExe && candidates.length > 0) {
          g.mainExe = candidates[0].relativePath;
        }
        g.status = 'ready';
        g.installProgress = undefined;
        storage.saveGame(g);
        mainWindow?.webContents.send('game:updated', g);
      }
    },
    onError: (gameId, error) => {
      const g = storage.getGame(gameId);
      if (g) {
        g.status = 'error';
        g.errorDetails = error;
        storage.saveGame(g);
        mainWindow?.webContents.send('game:updated', g);
      }
    },
  });

  // 3. GameRunner Status Listener
  gameRunner.setCallback((gameId, status) => {
    const g = storage.getGame(gameId);
    if (g) {
      g.status = status;
      if (status === 'running') {
        g.lastPlayed = new Date().toISOString();
      }
      storage.saveGame(g);
      mainWindow?.webContents.send('game:updated', g);
    }
  });

  // 4. Media Downloader Callbacks
  mediaDownloader.setCallbacks({
    onProgress: (mediaId, progress) => {
      mainWindow?.webContents.send('media:download-progress', { mediaId, progress });
    },
    onCompleted: (media) => {
      mainWindow?.webContents.send('media:updated', media);
    },
    onError: (mediaId, error) => {
      mainWindow?.webContents.send('media:error', { mediaId, error });
    },
  });

  try {
    await streamProxy.start();
  } catch (err) {
    console.error('Failed to start streaming proxy:', err);
  }

  // Register IPC Handlers
  ipcMain.handle('data:get', async () => {
    return storage.getData();
  });

  ipcMain.handle('settings:save', async (_event, settings: Partial<AppSettings>) => {
    return storage.updateSettings(settings);
  });

  // Game Handlers
  ipcMain.handle('game:save', async (_event, gameInput: Partial<Game>) => {
    const saved = storage.saveGame(gameInput);
    mainWindow?.webContents.send('game:updated', saved);
    return saved;
  });

  ipcMain.handle('game:delete', async (_event, id: string, deleteFiles: boolean) => {
    return storage.deleteGame(id, deleteFiles);
  });

  ipcMain.handle('game:toggle-library', async (_event, id: string) => {
    const game = storage.getGame(id);
    if (!game) return false;
    game.inLibrary = !game.inLibrary;
    storage.saveGame(game);
    mainWindow?.webContents.send('game:updated', game);
    return game.inLibrary;
  });

  ipcMain.handle('game:download', async (_event, id: string) => {
    const game = storage.getGame(id);
    if (!game) return;
    game.status = 'downloading';
    game.inLibrary = true;
    game.errorDetails = undefined;
    storage.saveGame(game);
    mainWindow?.webContents.send('game:updated', game);

    // Run real download in background
    downloader.startDownload(game);
  });

  ipcMain.handle('game:cancel-download', async (_event, id: string, deleteDownloaded: boolean) => {
    downloader.cancelDownload(id, deleteDownloaded);
    extractor.cancelExtraction(id);
    const game = storage.getGame(id);
    if (!game) return;
    game.status = 'uninstalled';
    game.downloadProgress = undefined;
    game.installProgress = undefined;
    storage.saveGame(game);
    mainWindow?.webContents.send('game:updated', game);
  });

  ipcMain.handle('game:retry', async (_event, id: string) => {
    const game = storage.getGame(id);
    if (!game) return;
    game.status = 'downloading';
    game.errorDetails = undefined;
    storage.saveGame(game);
    mainWindow?.webContents.send('game:updated', game);

    downloader.startDownload(game);
  });

  ipcMain.handle('game:launch', async (_event, id: string) => {
    const game = storage.getGame(id);
    if (!game) throw new Error('Game không tồn tại');
    await gameRunner.launchGame(game);
  });

  ipcMain.handle('game:uninstall', async (_event, id: string) => {
    const game = storage.getGame(id);
    if (!game) return false;

    if (game.installPath && fs.existsSync(game.installPath)) {
      try {
        fs.rmSync(game.installPath, { recursive: true, force: true });
      } catch (err) {
        console.error('Failed to remove install dir:', err);
      }
    }

    game.status = 'uninstalled';
    game.installPath = undefined;
    game.mainExe = undefined;
    game.exeCandidates = undefined;
    game.downloadProgress = undefined;
    game.installProgress = undefined;
    storage.saveGame(game);
    mainWindow?.webContents.send('game:updated', game);
    return true;
  });

  ipcMain.handle('game:set-main-exe', async (_event, id: string, exePath: string) => {
    const game = storage.getGame(id);
    if (game) {
      game.mainExe = exePath;
      storage.saveGame(game);
      mainWindow?.webContents.send('game:updated', game);
    }
  });

  ipcMain.handle('game:auto-pick-exe', async (_event, id: string) => {
    const game = storage.getGame(id);
    if (!game || !game.installPath) return null;
    const candidates = exeScanner.scanAndRankExecutables(game.installPath, game.name);
    game.exeCandidates = candidates.map((c) => c.relativePath);
    if (candidates.length > 0) {
      game.mainExe = candidates[0].relativePath;
    }
    storage.saveGame(game);
    mainWindow?.webContents.send('game:updated', game);
    return game.mainExe || null;
  });

  ipcMain.handle('game:submit-password', async (_event, gameId: string, password: string, saveForAdmin: boolean) => {
    if (saveForAdmin) {
      const game = storage.getGame(gameId);
      if (game) {
        game.archivePassword = password;
        storage.saveGame(game);
      }
    }
    extractor.providePassword(gameId, password);
  });

  // Media Handlers
  ipcMain.handle('media:save', async (_event, mediaInput: Partial<MediaItem>) => {
    const saved = storage.saveMedia(mediaInput);
    mainWindow?.webContents.send('media:updated', saved);
    return saved;
  });

  ipcMain.handle('media:delete', async (_event, id: string) => {
    return storage.deleteMedia(id);
  });

  ipcMain.handle('media:update-progress', async (_event, id: string, position: number, watched: boolean) => {
    storage.updateMediaProgress(id, position, watched);
  });

  ipcMain.handle('media:get-stream-url', async (_event, link: string) => {
    return streamProxy.getStreamUrl(link);
  });

  ipcMain.handle('media:download', async (_event, id: string) => {
    const item = storage.getMedia().find((m) => m.id === id);
    if (item) {
      mediaDownloader.startDownload(item);
    }
  });

  ipcMain.handle('media:cancel-download', async (_event, id: string) => {
    mediaDownloader.cancelDownload(id);
    const item = storage.getMedia().find((m) => m.id === id);
    if (item) {
      item.downloadStatus = 'idle';
      item.downloadProgress = undefined;
      storage.saveMedia(item);
      mainWindow?.webContents.send('media:updated', item);
    }
  });

  ipcMain.handle('media:delete-downloaded', async (_event, id: string) => {
    const item = storage.getMedia().find((m) => m.id === id);
    if (item) {
      const res = mediaDownloader.deleteDownloadedFile(item);
      mainWindow?.webContents.send('media:updated', item);
      return res;
    }
    return false;
  });

  // Playlists Handlers
  ipcMain.handle('playlist:save', async (_event, playlistInput: Partial<MediaPlaylist>) => {
    return storage.savePlaylist(playlistInput);
  });

  ipcMain.handle('playlist:delete', async (_event, id: string) => {
    return storage.deletePlaylist(id);
  });

  // Admin PIN
  ipcMain.handle('admin:verify-pin', async (_event, pin: string) => {
    return storage.verifyPin(pin);
  });

  ipcMain.handle('admin:change-pin', async (_event, { currentPin, newPin }: { currentPin: string; newPin: string }) => {
    return storage.changeAdminPin(currentPin, newPin);
  });

  ipcMain.handle('admin:set-pin', async (_event, pin: string) => {
    return storage.setPin(pin);
  });

  ipcMain.handle('admin:reset-pin', async (_event, recoveryKey: string, newPin: string) => {
    return storage.resetPinWithRecoveryKey(recoveryKey, newPin);
  });

  ipcMain.handle('admin:export-data', async (_event, mode: 'full' | 'share') => {
    const content = storage.exportData(mode);
    const { filePath } = await dialog.showSaveDialog(mainWindow!, {
      title: mode === 'full' ? 'Sao lưu dữ liệu Icelauch' : 'Xuất danh mục chia sẻ',
      defaultPath: mode === 'full' ? 'icelauch-backup.json' : 'icelauch-catalog.json',
      filters: [{ name: 'JSON Files', extensions: ['json'] }],
    });

    if (filePath) {
      fs.writeFileSync(filePath, content, 'utf-8');
      return { success: true, filePath, content };
    }
    return { success: false };
  });

  ipcMain.handle('admin:import-data', async (_event, jsonString?: string) => {
    if (!jsonString) {
      const { filePaths } = await dialog.showOpenDialog(mainWindow!, {
        title: 'Nhập dữ liệu Icelauch',
        filters: [{ name: 'JSON Files', extensions: ['json'] }],
        properties: ['openFile'],
      });
      if (filePaths && filePaths.length > 0) {
        jsonString = fs.readFileSync(filePaths[0], 'utf-8');
      }
    }

    if (!jsonString) return { success: false, error: 'Không có nội dung' };
    try {
      const count = storage.importData(jsonString);
      return { success: true, count };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Lỗi đọc file JSON' };
    }
  });

  ipcMain.handle('admin:load-demo-data', async () => {
    return storage.loadDemoData();
  });

  // System & Browse Handlers
  ipcMain.handle('system:open-folder', async (_event, target: 'app' | 'games' | 'downloads' | 'gameDir', gameId?: string) => {
    const paths = storage.getPaths();
    let folder = paths.rootDir;
    if (target === 'games') folder = paths.gamesDir;
    if (target === 'downloads') folder = paths.downloadsDir;
    if (target === 'gameDir' && gameId) {
      const g = storage.getGame(gameId);
      if (g?.installPath && fs.existsSync(g.installPath)) {
        folder = g.installPath;
      }
    }
    if (fs.existsSync(folder)) {
      shell.openPath(folder);
    }
  });

  ipcMain.handle('system:browse-file', async (_event, options) => {
    const res = await dialog.showOpenDialog(mainWindow!, {
      title: options?.title || 'Chọn tệp',
      filters: options?.filters || [{ name: 'All Files', extensions: ['*'] }],
      properties: ['openFile'],
    });
    return res.filePaths?.[0] || null;
  });

  ipcMain.handle('system:browse-files', async (_event, options) => {
    const res = await dialog.showOpenDialog(mainWindow!, {
      title: options?.title || 'Chọn các tệp',
      filters: options?.filters || [{ name: 'All Files', extensions: ['*'] }],
      properties: ['openFile', 'multiSelections'],
    });
    return res.filePaths || [];
  });

  ipcMain.handle('system:browse-folder', async (_event, options) => {
    const res = await dialog.showOpenDialog(mainWindow!, {
      title: options?.title || 'Chọn thư mục lưu trữ',
      defaultPath: options?.defaultPath,
      properties: ['openDirectory', 'createDirectory'],
    });
    return res.filePaths?.[0] || null;
  });

  ipcMain.handle('system:get-disk-space', async (_event, targetPath?: string) => {
    try {
      const p = targetPath && fs.existsSync(targetPath) ? targetPath : process.cwd();
      const stats = fs.statfsSync(p);
      const freeBytes = stats.bavail * stats.bsize;
      const totalBytes = stats.blocks * stats.bsize;
      const driveMatch = path.resolve(p).match(/^([A-Za-z]:)/);
      const driveLetter = driveMatch ? driveMatch[1].toUpperCase() : '';
      return {
        freeBytes,
        totalBytes,
        freeGb: Number((freeBytes / (1024 * 1024 * 1024)).toFixed(1)),
        totalGb: Number((totalBytes / (1024 * 1024 * 1024)).toFixed(1)),
        driveLetter,
      };
    } catch (e) {
      console.error('Failed to get disk space:', e);
      return null;
    }
  });

  ipcMain.handle('system:save-image', async (_event, source: string, type: 'cover' | 'banner', id: string) => {
    const paths = storage.getPaths();
    const coversDir = paths.coversDir;

    // Local file path
    if (fs.existsSync(source)) {
      const ext = path.extname(source) || '.jpg';
      const destName = `${id}-${type}-${Date.now()}${ext}`;
      const destPath = path.join(coversDir, destName);
      fs.copyFileSync(source, destPath);
      return destPath;
    }

    // Remote HTTP / HTTPS URL
    if (source.startsWith('http://') || source.startsWith('https://')) {
      return new Promise<string>((resolve, reject) => {
        try {
          const client = source.startsWith('https://') ? https : http;
          const req = client.get(source, (res) => {
            if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
              // Redirect
              const redirectUrl = res.headers.location;
              client.get(redirectUrl, (subRes) => {
                const ext = path.extname(new URL(redirectUrl).pathname) || '.jpg';
                const destName = `${id}-${type}-${Date.now()}${ext}`;
                const destPath = path.join(coversDir, destName);
                const fileStream = fs.createWriteStream(destPath);
                subRes.pipe(fileStream);
                fileStream.on('finish', () => resolve(destPath));
                fileStream.on('error', reject);
              });
              return;
            }

            const ext = path.extname(new URL(source).pathname) || '.jpg';
            const destName = `${id}-${type}-${Date.now()}${ext}`;
            const destPath = path.join(coversDir, destName);
            const fileStream = fs.createWriteStream(destPath);
            res.pipe(fileStream);
            fileStream.on('finish', () => resolve(destPath));
            fileStream.on('error', reject);
          });
          req.on('error', reject);
        } catch (e) {
          reject(e);
        }
      });
    }

    return source;
  });

  ipcMain.handle('system:get-proxy-port', () => {
    return streamProxy.getPort();
  });

  ipcMain.handle('system:launch-action', async (_event, target: string, type: 'app' | 'link', runAsAdmin?: boolean) => {
    try {
      if (!target || !target.trim()) {
        return { success: false, error: 'Đường dẫn hoặc lệnh không được để trống' };
      }
      const cleanTarget = target.trim();

      // Web links
      if (type === 'link' || cleanTarget.startsWith('http://') || cleanTarget.startsWith('https://')) {
        let url = cleanTarget;
        if (!cleanTarget.startsWith('http://') && !cleanTarget.startsWith('https://')) {
          url = `https://${cleanTarget}`;
        }
        await shell.openExternal(url);
        return { success: true };
      }

      // Custom Protocols like steam://, discord://
      if (/^[a-zA-Z0-9+.-]+:\/\//.test(cleanTarget)) {
        await shell.openExternal(cleanTarget);
        return { success: true };
      }

      // Local file or executable
      if (fs.existsSync(cleanTarget)) {
        if (runAsAdmin) {
          const psCmd = `Start-Process -FilePath "${cleanTarget}" -Verb RunAs`;
          child_process.spawn('powershell.exe', ['-NoProfile', '-WindowStyle', 'Hidden', '-Command', psCmd], {
            detached: true,
            stdio: 'ignore'
          }).unref();
        } else {
          await shell.openPath(cleanTarget);
        }
        return { success: true };
      }

      // Fallback try open external protocol
      await shell.openExternal(cleanTarget);
      return { success: true };
    } catch (err: any) {
      console.error('Failed to launch action:', err);
      return { success: false, error: err?.message || String(err) };
    }
  });

  // ==========================================
  // MULTI-USER PROFILES & CLOUD SYNC IPC
  // ==========================================
  ipcMain.handle('profile:get-all', () => {
    return storage.getProfiles();
  });

  ipcMain.handle('profile:get-active', () => {
    return storage.getActiveProfile();
  });

  ipcMain.handle('profile:get-remembered', () => {
    return storage.getRememberedProfileId();
  });

  ipcMain.handle('profile:save', (_event, profile: UserProfile) => {
    return storage.saveProfile(profile);
  });

  ipcMain.handle('profile:delete', (_event, id: string) => {
    return storage.deleteProfile(id);
  });

  ipcMain.handle('profile:login', (_event, { id, pin, remember }: { id: string; pin: string; remember?: boolean }) => {
    const p = storage.getProfile(id);
    if (!p) {
      return { success: false, error: 'Không tìm thấy hồ sơ người dùng' };
    }

    const hashedInput = crypto.createHash('sha256').update(pin || '').digest('hex');
    if (p.pinHash && p.pinHash !== hashedInput) {
      return { success: false, error: 'Mã PIN không chính xác' };
    }

    storage.setActiveProfileId(id);
    if (remember) {
      storage.setRememberedProfileId(id);
    } else if (storage.getRememberedProfileId() === id) {
      storage.setRememberedProfileId(null);
    }

    return { success: true, profile: p };
  });

  ipcMain.handle('profile:switch', () => {
    storage.setActiveProfileId(null);
    return { success: true };
  });

  ipcMain.handle('profile:logout', () => {
    storage.setActiveProfileId(null);
    storage.setRememberedProfileId(null);
    return { success: true };
  });

  ipcMain.handle('profile:update-library', (_event, { profileId, gameId, inLibrary }: { profileId: string; gameId: string; inLibrary: boolean }) => {
    storage.updateProfileLibrary(profileId, gameId, inLibrary);
    return { success: true };
  });

  ipcMain.handle('profile:update-watch-progress', (_event, { profileId, mediaId, position, duration, completed }: { profileId: string; mediaId: string; position: number; duration: number; completed: boolean }) => {
    storage.updateProfileWatchProgress(profileId, mediaId, position, duration, completed);
    return { success: true };
  });

  ipcMain.handle('profile:update-favorite', (_event, { profileId, mediaId, isFav }: { profileId: string; mediaId: string; isFav: boolean }) => {
    storage.updateProfileFavoriteMedia(profileId, mediaId, isFav);
    return { success: true };
  });

  ipcMain.handle('profile:hash-pin', (_event, pin: string) => {
    return crypto.createHash('sha256').update(pin || '').digest('hex');
  });

  // Cloud Sync Handlers
  ipcMain.handle('cloud:get-settings', () => {
    return storage.getCloudSyncSettings();
  });

  ipcMain.handle('cloud:save-settings', (_event, settings: Partial<CloudSyncSettings>) => {
    return storage.saveCloudSyncSettings(settings);
  });

  ipcMain.handle('cloud:test-connection', async (_event, { url, key }: { url: string; key: string }) => {
    return SupabaseSyncService.getInstance().testConnection(url, key);
  });

  ipcMain.handle('cloud:sync', async (_event, { url, key }: { url?: string; key?: string } = {}) => {
    const syncSettings = storage.getCloudSyncSettings();
    const targetUrl = (url && url.trim()) || syncSettings.supabaseUrl || DEFAULT_SUPABASE_URL;
    const targetKey = (key && key.trim()) || syncSettings.supabaseAnonKey || DEFAULT_SUPABASE_ANON_KEY;

    if (!targetUrl || !targetKey) {
      return { success: false, message: 'Chưa cấu hình Supabase Project URL hoặc Anon Key' };
    }

    try {
      const res = await SupabaseSyncService.getInstance().syncAll(
        targetUrl,
        targetKey,
        storage.getProfiles(),
        storage.getGames(),
        storage.getMedia(),
        storage.getPlaylists()
      );
      storage.setAllProfiles(res.updatedProfiles);
      storage.setAllGames(res.updatedGames);
      storage.setAllMedia(res.updatedMedia);
      storage.setAllPlaylists(res.updatedPlaylists);

      storage.saveCloudSyncSettings({
        lastSyncedAt: new Date().toISOString(),
        lastSyncStatus: 'success',
        lastSyncMessage: res.message,
      });

      mainWindow?.webContents.send('cloud:synced', {
        profiles: res.updatedProfiles,
        games: res.updatedGames,
        media: res.updatedMedia,
        playlists: res.updatedPlaylists,
        message: res.message,
      });

      return {
        success: true,
        message: res.message,
        profiles: res.updatedProfiles,
        games: res.updatedGames,
        media: res.updatedMedia,
      };
    } catch (err: any) {
      storage.saveCloudSyncSettings({
        lastSyncStatus: 'error',
        lastSyncMessage: err?.message || 'Lỗi đồng bộ',
      });
      return { success: false, message: err?.message || 'Lỗi đồng bộ đám mây' };
    }
  });

  // Window Management Controls (Frameless Modern Titlebar)
  ipcMain.handle('window:minimize', () => {
    mainWindow?.minimize();
  });
  ipcMain.handle('window:maximize', () => {
    if (mainWindow?.isMaximized()) {
      mainWindow.unmaximize();
      return false;
    } else {
      mainWindow?.maximize();
      return true;
    }
  });
  ipcMain.handle('window:close', () => {
    mainWindow?.close();
  });
  ipcMain.handle('window:is-maximized', () => {
    return mainWindow?.isMaximized() ?? false;
  });

  // Setup Auto-Updater IPC
  UpdateManager.getInstance().setupIpc();

  createWindow();

  // --- AUTOMATIC BACKGROUND SUPABASE CLOUD SYNC ---
  let isAutoSyncing = false;
  const runAutoCloudSync = async (reason: string = 'interval') => {
    if (isAutoSyncing) return;
    const syncSettings = storage.getCloudSyncSettings();
    if (!syncSettings.enabled || !syncSettings.supabaseUrl || !syncSettings.supabaseAnonKey) {
      return;
    }

    try {
      isAutoSyncing = true;
      console.log(`[Supabase Auto-Sync] Triggered by ${reason}...`);
      const res = await SupabaseSyncService.getInstance().syncAll(
        syncSettings.supabaseUrl,
        syncSettings.supabaseAnonKey,
        storage.getProfiles(),
        storage.getGames(),
        storage.getMedia(),
        storage.getPlaylists()
      );
      storage.setAllProfiles(res.updatedProfiles);
      storage.setAllGames(res.updatedGames);
      storage.setAllMedia(res.updatedMedia);
      storage.setAllPlaylists(res.updatedPlaylists);

      storage.saveCloudSyncSettings({
        lastSyncedAt: new Date().toISOString(),
        lastSyncStatus: 'success',
        lastSyncMessage: res.message,
      });
      mainWindow?.webContents.send('cloud:synced', {
        profiles: res.updatedProfiles,
        games: res.updatedGames,
        media: res.updatedMedia,
        playlists: res.updatedPlaylists,
        message: res.message,
      });
      console.log(`[Supabase Auto-Sync] Success: ${res.message}`);
    } catch (err: any) {
      console.warn(`[Supabase Auto-Sync] Failed (${reason}):`, err?.message);
      storage.saveCloudSyncSettings({
        lastSyncStatus: 'error',
        lastSyncMessage: err?.message || 'Lỗi tự động đồng bộ',
      });
    } finally {
      isAutoSyncing = false;
    }
  };

  // 1. Initial background sync 1s after launch
  setTimeout(() => runAutoCloudSync('startup'), 1000);

  // 2. Periodic sync check (checks every 60s if interval elapsed)
  let lastSyncTimestamp = Date.now();
  setInterval(() => {
    const syncSettings = storage.getCloudSyncSettings();
    if (!syncSettings.enabled) return;
    const intervalMinutes = syncSettings.autoSyncIntervalMinutes || 5;
    const intervalMs = intervalMinutes * 60 * 1000;
    if (Date.now() - lastSyncTimestamp >= intervalMs) {
      lastSyncTimestamp = Date.now();
      runAutoCloudSync('interval');
    }
  }, 60 * 1000);

  // 3. Final sync before quit
  app.on('before-quit', async () => {
    const syncSettings = storage.getCloudSyncSettings();
    if (syncSettings.enabled && syncSettings.supabaseUrl && syncSettings.supabaseAnonKey) {
      try {
        console.log('[Supabase Auto-Sync] Final sync before quit...');
        await SupabaseSyncService.getInstance().syncAll(
          syncSettings.supabaseUrl,
          syncSettings.supabaseAnonKey,
          storage.getProfiles(),
          storage.getGames(),
          storage.getMedia(),
          storage.getPlaylists()
        );
      } catch (e) {
        console.warn('Final quit sync error:', e);
      }
    }
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
