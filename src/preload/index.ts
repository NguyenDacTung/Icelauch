import { contextBridge, ipcRenderer } from 'electron';
import type { Game, MediaItem, AppData, AppSettings, DownloadProgress, InstallProgress, MediaPlaylist } from '../renderer/src/types';

export const API = {
  // Data operations
  getAppData: (): Promise<AppData> => ipcRenderer.invoke('data:get'),
  saveSettings: (settings: Partial<AppSettings>): Promise<AppSettings> => ipcRenderer.invoke('settings:save', settings),
  saveGame: (game: Partial<Game>): Promise<Game> => ipcRenderer.invoke('game:save', game),
  deleteGame: (id: string, deleteFiles: boolean): Promise<boolean> => ipcRenderer.invoke('game:delete', id, deleteFiles),
  saveMedia: (media: Partial<MediaItem>): Promise<MediaItem> => ipcRenderer.invoke('media:save', media),
  deleteMedia: (id: string): Promise<boolean> => ipcRenderer.invoke('media:delete', id),
  updateMediaProgress: (id: string, position: number, watched: boolean): Promise<void> => 
    ipcRenderer.invoke('media:update-progress', id, position, watched),

  // Media Actions & Playlists
  downloadMedia: (id: string): Promise<void> => ipcRenderer.invoke('media:download', id),
  cancelMediaDownload: (id: string): Promise<void> => ipcRenderer.invoke('media:cancel-download', id),
  deleteDownloadedMedia: (id: string): Promise<boolean> => ipcRenderer.invoke('media:delete-downloaded', id),
  savePlaylist: (playlist: Partial<MediaPlaylist>): Promise<MediaPlaylist> => ipcRenderer.invoke('playlist:save', playlist),
  deletePlaylist: (id: string): Promise<boolean> => ipcRenderer.invoke('playlist:delete', id),

  // Game actions
  downloadGame: (id: string): Promise<void> => ipcRenderer.invoke('game:download', id),
  cancelDownload: (id: string, deleteDownloaded: boolean): Promise<void> => ipcRenderer.invoke('game:cancel-download', id, deleteDownloaded),
  retryGame: (id: string): Promise<void> => ipcRenderer.invoke('game:retry', id),
  launchGame: (id: string): Promise<void> => ipcRenderer.invoke('game:launch', id),
  uninstallGame: (id: string): Promise<boolean> => ipcRenderer.invoke('game:uninstall', id),
  toggleInLibrary: (id: string): Promise<boolean> => ipcRenderer.invoke('game:toggle-library', id),
  setGameMainExe: (id: string, exePath: string): Promise<void> => ipcRenderer.invoke('game:set-main-exe', id, exePath),
  autoPickExe: (id: string): Promise<string | null> => ipcRenderer.invoke('game:auto-pick-exe', id),
  submitArchivePassword: (gameId: string, password: string, saveForAdmin: boolean): Promise<void> =>
    ipcRenderer.invoke('game:submit-password', gameId, password, saveForAdmin),

  // File and folder actions
  openFolder: (target: 'app' | 'games' | 'downloads' | 'gameDir', gameId?: string): Promise<void> =>
    ipcRenderer.invoke('system:open-folder', target, gameId),
  browseFile: (options: { title?: string; filters?: { name: string; extensions: string[] }[] }): Promise<string | null> =>
    ipcRenderer.invoke('system:browse-file', options),
  browseFiles: (options: { title?: string; filters?: { name: string; extensions: string[] }[] }): Promise<string[]> =>
    ipcRenderer.invoke('system:browse-files', options),
  browseFolder: (options?: { title?: string; defaultPath?: string }): Promise<string | null> =>
    ipcRenderer.invoke('system:browse-folder', options),
  getDiskSpace: (targetPath?: string): Promise<{ freeBytes: number; totalBytes: number; freeGb: number; totalGb: number; driveLetter: string } | null> =>
    ipcRenderer.invoke('system:get-disk-space', targetPath),
  saveImageFromUrlOrFile: (source: string, type: 'cover' | 'banner', id: string): Promise<string> =>
    ipcRenderer.invoke('system:save-image', source, type, id),
  launchAction: (target: string, type: 'app' | 'link', runAsAdmin?: boolean): Promise<{ success: boolean; error?: string }> =>
    ipcRenderer.invoke('system:launch-action', target, type, runAsAdmin),

  // Media streaming
  getStreamUrl: (link: string): Promise<string> => ipcRenderer.invoke('media:get-stream-url', link),
  getProxyPort: (): Promise<number> => ipcRenderer.invoke('system:get-proxy-port'),

  // Window management
  minimizeWindow: (): Promise<void> => ipcRenderer.invoke('window:minimize'),
  maximizeWindow: (): Promise<boolean> => ipcRenderer.invoke('window:maximize'),
  closeWindow: (): Promise<void> => ipcRenderer.invoke('window:close'),
  isWindowMaximized: (): Promise<boolean> => ipcRenderer.invoke('window:is-maximized'),

  // In-App Auto-Updater
  getAppVersion: (): Promise<string> => ipcRenderer.invoke('updater:get-version'),
  checkUpdates: (): Promise<{ success: boolean; version?: string; error?: string }> => ipcRenderer.invoke('updater:check'),
  downloadUpdate: (): Promise<{ success: boolean; error?: string }> => ipcRenderer.invoke('updater:download'),
  installUpdate: (): Promise<void> => ipcRenderer.invoke('updater:install'),

  // Admin & Security
  verifyPin: (pin: string): Promise<boolean> => ipcRenderer.invoke('admin:verify-pin', pin),
  setPin: (pin: string): Promise<{ success: boolean; recoveryKey: string }> => ipcRenderer.invoke('admin:set-pin', pin),
  resetPinWithRecoveryKey: (recoveryKey: string, newPin: string): Promise<boolean> => 
    ipcRenderer.invoke('admin:reset-pin', recoveryKey, newPin),
  exportData: (mode: 'full' | 'share'): Promise<{ success: boolean; filePath?: string; content?: string }> =>
    ipcRenderer.invoke('admin:export-data', mode),
  importData: (jsonString?: string): Promise<{ success: boolean; count?: number; error?: string }> =>
    ipcRenderer.invoke('admin:import-data', jsonString),
  loadDemoData: (): Promise<AppData> => ipcRenderer.invoke('admin:load-demo-data'),

  // Event Listeners
  onGameUpdated: (callback: (game: Game) => void) => {
    const handler = (_event: any, game: Game) => callback(game);
    ipcRenderer.on('game:updated', handler);
    return () => ipcRenderer.removeListener('game:updated', handler);
  },
  onDownloadProgress: (callback: (data: { gameId: string; progress: DownloadProgress }) => void) => {
    const handler = (_event: any, data: any) => callback(data);
    ipcRenderer.on('game:download-progress', handler);
    return () => ipcRenderer.removeListener('game:download-progress', handler);
  },
  onInstallProgress: (callback: (data: { gameId: string; progress: InstallProgress }) => void) => {
    const handler = (_event: any, data: any) => callback(data);
    ipcRenderer.on('game:install-progress', handler);
    return () => ipcRenderer.removeListener('game:install-progress', handler);
  },
  onPromptPassword: (callback: (data: { gameId: string; gameName: string; isRetry?: boolean }) => void) => {
    const handler = (_event: any, data: any) => callback(data);
    ipcRenderer.on('game:prompt-password', handler);
    return () => ipcRenderer.removeListener('game:prompt-password', handler);
  },
  onMediaUpdated: (callback: (media: MediaItem) => void) => {
    const handler = (_event: any, media: MediaItem) => callback(media);
    ipcRenderer.on('media:updated', handler);
    return () => ipcRenderer.removeListener('media:updated', handler);
  },
  onMediaDownloadProgress: (callback: (data: { mediaId: string; progress: number }) => void) => {
    const handler = (_event: any, data: any) => callback(data);
    ipcRenderer.on('media:download-progress', handler);
    return () => ipcRenderer.removeListener('media:download-progress', handler);
  },
  onUpdateStatus: (callback: (data: { status: 'checking' | 'available' | 'not-available' | 'downloading' | 'downloaded' | 'error'; version?: string; releaseDate?: string; releaseNotes?: string; error?: string }) => void) => {
    const handler = (_event: any, data: any) => callback(data);
    ipcRenderer.on('updater:status', handler);
    return () => ipcRenderer.removeListener('updater:status', handler);
  },
  onUpdateProgress: (callback: (data: { percent: number; bytesPerSecond: number; transferred: number; total: number }) => void) => {
    const handler = (_event: any, data: any) => callback(data);
    ipcRenderer.on('updater:progress', handler);
    return () => ipcRenderer.removeListener('updater:progress', handler);
  },
};

contextBridge.exposeInMainWorld('api', API);

export type ElectronAPI = typeof API;
