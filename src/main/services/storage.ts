import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import type { AppData, Game, MediaItem, AppSettings, MediaPlaylist, UserProfile, CloudSyncSettings } from '../../renderer/src/types';

// =========================================================================
// MÃ PIN ADMIN GỐC / DỰ PHÒNG (PIN_PRI)
// - Mã PIN này là bất biến, chỉ có tác giả (developer) thay đổi trực tiếp tại đây trong code.
// - Dù người khác có biết hoặc đổi PIN_PUB thì PIN_PRI này vẫn luôn luôn mở được quyền Admin!
// - Khi đổi mã PIN Admin trong Cài Đặt, CHỈ CÓ PIN_PUB BỊ ĐỔI, PIN_PRI KHÔNG BAO GIỜ BỊ THAY ĐỔI.
// =========================================================================
export const ADMIN_PIN_PRI = '080920'; // Bạn có thể sửa mã PIN gốc này tuỳ ý tại đây trong code

export class StorageService {
  private static instance: StorageService;
  private rootDir: string;
  private dataDir: string;
  private dataFile: string;
  private backupFile: string;
  private coversDir: string;
  private logsDir: string;
  private gamesDir: string;
  private downloadsDir: string;
  private toolsDir: string;
  private mediaDownloadsDir: string;

  private data: AppData;

  private constructor() {
    // Determine root directory: portable relative to execPath in prod, or project root in dev
    const isDev = process.env.NODE_ENV === 'development' || !process.resourcesPath || Boolean(process.defaultApp);
    this.rootDir = isDev 
      ? process.cwd() 
      : path.dirname(process.execPath);

    this.dataDir = path.join(this.rootDir, 'Data');
    this.dataFile = path.join(this.dataDir, 'data.json');
    this.backupFile = path.join(this.dataDir, 'data.json.bak');
    this.coversDir = path.join(this.dataDir, 'covers');
    this.logsDir = path.join(this.dataDir, 'logs');
    this.gamesDir = path.join(this.rootDir, 'Games');
    this.downloadsDir = path.join(this.rootDir, 'Downloads');
    this.toolsDir = path.join(this.rootDir, '7z');
    this.mediaDownloadsDir = path.join(this.dataDir, 'media_downloads');

    this.ensureDirectories();
    this.data = this.loadData();
  }

  public static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }

  private ensureDirectories(): void {
    const dirs = [
      this.dataDir,
      this.coversDir,
      this.logsDir,
      this.gamesDir,
      this.downloadsDir,
      this.toolsDir,
      this.mediaDownloadsDir,
    ];
    for (const dir of dirs) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }
  }

  public getPaths() {
    const s = this.data?.settings;
    const effectiveGamesDir = s?.defaultGamesInstallPath && fs.existsSync(s.defaultGamesInstallPath)
      ? s.defaultGamesInstallPath
      : (s?.gamesPath && fs.existsSync(s.gamesPath) ? s.gamesPath : this.gamesDir);

    const effectiveDownloadsDir = s?.downloadsPath && fs.existsSync(s.downloadsPath)
      ? s.downloadsPath
      : this.downloadsDir;

    return {
      rootDir: this.rootDir,
      dataDir: this.dataDir,
      dataFile: this.dataFile,
      coversDir: this.coversDir,
      logsDir: this.logsDir,
      gamesDir: effectiveGamesDir,
      downloadsDir: effectiveDownloadsDir,
      toolsDir: this.toolsDir,
      mediaDownloadsDir: this.mediaDownloadsDir,
      sevenZipExe: path.join(this.toolsDir, '7z.exe'),
    };
  }

  private getDefaultData(): AppData {
    return {
      games: [],
      media: [],
      playlists: [],
      profiles: [],
      activeProfileId: null,
      rememberedProfileId: null,
      cloudSync: {
        enabled: false,
        supabaseUrl: '',
        supabaseAnonKey: '',
        autoSyncIntervalMinutes: 5,
        lastSyncStatus: 'idle',
      },
      settings: {
        deleteArchiveDefault: true,
        runAsAdminDefault: false,
        sfxEnabled: true,
        ambientSnowEnabled: true,
        backgroundAudioEnabled: true,
        userGamerTitle: 'Tân Binh Băng Giá',
        particleConfig: {
          theme: 'winter',
          speed: 1.0,
          density: 35,
          opacity: 0.7
        },
        wallpaperConfig: {
          enabled: false,
          imagePath: '',
          position: '50% 50%',
          zoom: 1.0,
          blur: 0,
          darkness: 30,
          showWithParticles: true
        },
        lowSpecMode: false,
        globalActionButtons: [
          {
            id: 'btn-steam-default',
            label: 'Mở ứng dụng Steam',
            description: 'Khởi chạy ứng dụng Steam trên máy trước khi vào game',
            icon: 'steam',
            type: 'app',
            target: 'steam://open/main',
            isDefault: true,
            runAsAdmin: false
          },
          {
            id: 'btn-discord-default',
            label: 'Vào Discord Voice Chat',
            description: 'Kết nối phòng thoại Discord cùng bạn bè',
            icon: 'discord',
            type: 'link',
            target: 'https://discord.com/app',
            isDefault: false,
            runAsAdmin: false
          }
        ],
        gameTags: [
          'Coop',
          'Hành động',
          'Nhập vai (RPG)',
          'Chiến thuật',
          'Kinh dị',
          'Mô phỏng',
          'Thế giới mở',
          'Bắn súng (FPS)',
          'Phiêu lưu',
          'Indie',
          'Giải đố'
        ],
        mediaTags: [
          'Hoạt hình',
          'Phim Chiếu Rạp',
          'Phim Lẻ',
          'Phim Bộ',
          'YouTube',
          'Nhạc Chill',
          'Nhạc Game',
          'EDM',
          'Pop',
          'MV',
          'Podcast',
          'Sách nói'
        ],
        appRootPath: this.rootDir,
        gamesPath: this.gamesDir,
        downloadsPath: this.downloadsDir,
        pinSalt: '68a2eedda4e5986fa0c907a17ba19386',
        pinHash: '9ad350ea4bb56920e2694e958be3f47af530c358f985d29bedafded954bee082',
      },
    };
  }

  private loadData(): AppData {
    try {
      if (fs.existsSync(this.dataFile)) {
        const raw = fs.readFileSync(this.dataFile, 'utf-8');
        const parsed = JSON.parse(raw);
        parsed.games = parsed.games || [];
        parsed.media = parsed.media || [];
        parsed.playlists = parsed.playlists || [];
        parsed.profiles = parsed.profiles || [];
        parsed.activeProfileId = parsed.activeProfileId || null;
        parsed.rememberedProfileId = parsed.rememberedProfileId || null;
        parsed.cloudSync = parsed.cloudSync || {
          enabled: false,
          supabaseUrl: '',
          supabaseAnonKey: '',
          autoSyncIntervalMinutes: 5,
          lastSyncStatus: 'idle',
        };
        parsed.media.forEach((m: any, idx: number) => {
          if (!m.id) {
            m.id = `media-${idx + 1}-${Date.now()}`;
          }
        });
        parsed.games.forEach((g: any, idx: number) => {
          if (!g.id) {
            g.id = `game-${idx + 1}-${Date.now()}`;
          }
        });
        parsed.settings = parsed.settings || {};
        parsed.settings.appRootPath = this.rootDir;
        parsed.settings.gamesPath = parsed.settings.gamesPath || this.gamesDir;
        parsed.settings.downloadsPath = parsed.settings.downloadsPath || this.downloadsDir;
        if (!parsed.settings.gameTags || parsed.settings.gameTags.length === 0) {
          parsed.settings.gameTags = [
            'Coop',
            'Hành động',
            'Nhập vai (RPG)',
            'Chiến thuật',
            'Kinh dị',
            'Mô phỏng',
            'Thế giới mở',
            'Bắn súng (FPS)',
            'Phiêu lưu',
            'Indie',
            'Giải đố'
          ];
        }
        if (!parsed.settings.mediaTags || parsed.settings.mediaTags.length === 0) {
          parsed.settings.mediaTags = [
            'Hoạt hình',
            'Phim Chiếu Rạp',
            'Phim Lẻ',
            'Phim Bộ',
            'YouTube',
            'Nhạc Chill',
            'Nhạc Game',
            'EDM',
            'Pop',
            'MV'
          ];
        }
        if (!parsed.settings.particleConfig) {
          parsed.settings.particleConfig = {
            theme: parsed.settings.ambientSnowEnabled === false ? 'none' : 'winter',
            speed: 1.0,
            density: 35,
            opacity: 0.7
          };
        }
        if (!parsed.settings.wallpaperConfig) {
          parsed.settings.wallpaperConfig = {
            enabled: false,
            imagePath: '',
            position: '50% 50%',
            zoom: 1.0,
            blur: 0,
            darkness: 30,
            showWithParticles: true
          };
        }
        if (!parsed.settings.globalActionButtons || parsed.settings.globalActionButtons.length === 0) {
          parsed.settings.globalActionButtons = [
            {
              id: 'btn-steam-default',
              label: 'Mở ứng dụng Steam',
              description: 'Khởi chạy ứng dụng Steam trên máy trước khi vào game',
              icon: 'steam',
              type: 'app',
              target: 'steam://open/main',
              isDefault: true,
              runAsAdmin: false
            },
            {
              id: 'btn-discord-default',
              label: 'Vào Discord Voice Chat',
              description: 'Kết nối phòng thoại Discord cùng bạn bè',
              icon: 'discord',
              type: 'link',
              target: 'https://discord.com/app',
              isDefault: false,
              runAsAdmin: false
            }
          ];
        }
        return parsed;
      }
    } catch (err) {
      console.error('Failed to read data.json, attempting backup recovery...', err);
      if (fs.existsSync(this.backupFile)) {
        try {
          const raw = fs.readFileSync(this.backupFile, 'utf-8');
          return JSON.parse(raw);
        } catch (backupErr) {
          console.error('Failed to read backup file as well:', backupErr);
        }
      }
    }
    const defaultData = this.getDefaultData();
    this.saveDataAtomic(defaultData);
    return defaultData;
  }

  public saveDataAtomic(newData?: AppData): void {
    if (newData) {
      this.data = newData;
    }
    const tempFile = `${this.dataFile}.tmp`;
    const serialized = JSON.stringify(this.data, null, 2);

    try {
      // 1. Write backup if current data.json is valid
      if (fs.existsSync(this.dataFile)) {
        try {
          fs.copyFileSync(this.dataFile, this.backupFile);
        } catch {}
      }

      // 2. Write temp file
      fs.writeFileSync(tempFile, serialized, 'utf-8');

      // 3. Atomic rename
      fs.renameSync(tempFile, this.dataFile);
    } catch (err) {
      console.error('Atomic write to data.json failed:', err);
      // Clean up temp file if exists
      if (fs.existsSync(tempFile)) {
        try { fs.unlinkSync(tempFile); } catch {}
      }
      throw err;
    }
  }

  public getData(): AppData {
    return this.data;
  }

  public getSettings(): AppSettings {
    return this.data.settings;
  }

  public getGames(): Game[] {
    return this.data.games;
  }

  public getGame(id: string): Game | undefined {
    return this.data.games.find(g => g.id === id);
  }

  public saveGame(gameInput: Partial<Game>): Game {
    const now = new Date().toISOString();
    let game: Game;
    const id = gameInput.id || crypto.randomUUID();

    const idx = this.data.games.findIndex(g => g.id === id);
    if (idx !== -1) {
      game = { 
        ...this.data.games[idx], 
        ...gameInput,
        id,
      };
      this.data.games[idx] = game;
    } else {
      game = {
        name: 'Untitled Game',
        coverPath: '',
        downloadLinks: [],
        runAsAdmin: false,
        deleteArchiveAfterInstall: true,
        status: 'uninstalled',
        inLibrary: false,
        featured: false,
        addedAt: now,
        ...gameInput,
        id,
      };
      this.data.games.push(game);
    }

    this.saveDataAtomic();
    return game;
  }

  public deleteGame(id: string, deleteFiles: boolean): boolean {
    const idx = this.data.games.findIndex(g => g.id === id);
    if (idx === -1) return false;
    const game = this.data.games[idx];

    if (deleteFiles && game.installPath && fs.existsSync(game.installPath)) {
      try {
        fs.rmSync(game.installPath, { recursive: true, force: true });
      } catch (err) {
        console.error(`Failed to delete game files at ${game.installPath}:`, err);
      }
    }

    this.data.games.splice(idx, 1);
    this.saveDataAtomic();
    return true;
  }

  public getMedia(): MediaItem[] {
    return this.data.media;
  }

  public saveMedia(mediaInput: Partial<MediaItem>): MediaItem {
    const now = new Date().toISOString();
    let item: MediaItem;
    const id = mediaInput.id || crypto.randomUUID();

    const idx = this.data.media.findIndex(m => m.id === id);
    if (idx !== -1) {
      item = { 
        ...this.data.media[idx], 
        ...mediaInput,
        id,
      };
      this.data.media[idx] = item;
    } else {
      item = {
        title: 'Untitled Media',
        type: 'video',
        link: '',
        lastPosition: 0,
        watched: false,
        addedAt: now,
        ...mediaInput,
        id,
      };
      this.data.media.push(item);
    }

    this.saveDataAtomic();
    return item;
  }

  public deleteMedia(id: string): boolean {
    const idx = this.data.media.findIndex(m => m.id === id);
    if (idx === -1) return false;
    this.data.media.splice(idx, 1);
    this.saveDataAtomic();
    return true;
  }

  public updateMediaProgress(id: string, position: number, watched: boolean): void {
    const item = this.data.media.find(m => m.id === id);
    if (item) {
      item.lastPosition = position;
      if (watched) item.watched = true;
      this.saveDataAtomic();
    }
  }

  // Playlists
  public getPlaylists(): MediaPlaylist[] {
    return this.data.playlists || [];
  }

  public getPlaylist(id: string): MediaPlaylist | undefined {
    return (this.data.playlists || []).find(p => p.id === id);
  }

  public savePlaylist(playlistInput: Partial<MediaPlaylist>): MediaPlaylist {
    if (!this.data.playlists) this.data.playlists = [];
    const now = new Date().toISOString();
    let playlist: MediaPlaylist;
    const id = playlistInput.id || crypto.randomUUID();

    const idx = this.data.playlists.findIndex(p => p.id === id);
    if (idx !== -1) {
      playlist = {
        ...this.data.playlists[idx],
        ...playlistInput,
        id,
      };
      this.data.playlists[idx] = playlist;
    } else {
      playlist = {
        name: 'Danh Sách Phát Mới',
        type: 'video',
        itemIds: [],
        createdAt: now,
        ...playlistInput,
        id,
      };
      this.data.playlists.push(playlist);
    }

    this.saveDataAtomic();
    return playlist;
  }

  public deletePlaylist(id: string): boolean {
    if (!this.data.playlists) return false;
    const idx = this.data.playlists.findIndex(p => p.id === id);
    if (idx === -1) return false;
    this.data.playlists.splice(idx, 1);
    this.saveDataAtomic();
    return true;
  }

  public updateSettings(settingsUpdate: Partial<AppSettings>): AppSettings {
    this.data.settings = { ...this.data.settings, ...settingsUpdate };
    this.saveDataAtomic();
    return this.data.settings;
  }

  // Admin PIN & Security
  public hashPin(pin: string, salt: string): string {
    return crypto.pbkdf2Sync(pin, salt, 10000, 32, 'sha256').toString('hex');
  }

  public verifyPin(pin: string): boolean {
    if (!pin) return false;
    const clean = pin.trim();

    // 1. Kiểm tra mã PIN Gốc Dự Phòng (PIN_PRI) - Bất biến trong code
    if (clean === ADMIN_PIN_PRI) {
      return true;
    }

    // 2. Kiểm tra mã PIN Admin Công Khai Hiện Tại (PIN_PUB)
    const { pinHash, pinSalt } = this.data.settings;
    if (pinHash && pinSalt) {
      const computed = this.hashPin(clean, pinSalt);
      if (computed === pinHash) {
        return true;
      }
    }

    return false;
  }

  public changeAdminPin(currentPin: string, newPin: string): { success: boolean; error?: string } {
    // 1. Bắt buộc phải biết PIN hiện tại (PIN_PUB hoặc PIN_PRI) mới được đổi
    if (!this.verifyPin(currentPin)) {
      return { 
        success: false, 
        error: 'Mã PIN hiện tại không chính xác! Bạn phải nhập đúng mã PIN Admin hiện tại (PIN_PUB hoặc PIN_PRI) để đổi.' 
      };
    }

    // 2. Kiểm tra định dạng mã PIN mới (4 - 10 chữ số)
    const cleanNewPin = newPin ? newPin.trim() : '';
    if (cleanNewPin.length < 4 || cleanNewPin.length > 10 || !/^\d+$/.test(cleanNewPin)) {
      return { 
        success: false, 
        error: 'Mã PIN mới phải từ 4 đến 10 chữ số (chỉ gồm các số 0-9).' 
      };
    }

    // 3. CHỈ cập nhật PIN_PUB (lưu vào settings trong data.json)
    // PIN_PRI nằm trong code nên không bao giờ bị thay đổi!
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = this.hashPin(cleanNewPin, salt);

    this.data.settings.pinSalt = salt;
    this.data.settings.pinHash = hash;
    this.saveDataAtomic();

    return { success: true };
  }

  public setPin(pin: string): { success: boolean; recoveryKey: string } {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = this.hashPin(pin, salt);

    // Generate readable recovery key: ICE-XXXX-XXXX-XXXX
    const rawKey = crypto.randomBytes(6).toString('hex').toUpperCase();
    const recoveryKey = `ICE-${rawKey.slice(0, 4)}-${rawKey.slice(4, 8)}-${rawKey.slice(8, 12)}`;
    const recoveryKeyHash = crypto.createHash('sha256').update(recoveryKey).digest('hex');

    this.data.settings.pinSalt = salt;
    this.data.settings.pinHash = hash;
    this.data.settings.recoveryKeyHash = recoveryKeyHash;
    this.saveDataAtomic();

    return { success: true, recoveryKey };
  }

  public resetPinWithRecoveryKey(recoveryKey: string, newPin: string): boolean {
    const hash = crypto.createHash('sha256').update(recoveryKey.trim().toUpperCase()).digest('hex');
    if (this.data.settings.recoveryKeyHash !== hash) {
      return false;
    }
    const salt = crypto.randomBytes(16).toString('hex');
    this.data.settings.pinSalt = salt;
    this.data.settings.pinHash = this.hashPin(newPin, salt);
    this.saveDataAtomic();
    return true;
  }

  public exportData(mode: 'full' | 'share'): string {
    if (mode === 'share') {
      const shareData = {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        games: this.data.games.map(g => ({
          name: g.name,
          coverPath: g.coverPath,
          bannerPath: g.bannerPath,
          description: g.description,
          downloadLinks: g.downloadLinks,
          expectedSize: g.expectedSize,
          genre: g.genre,
        })),
        media: this.data.media.map(m => ({
          type: m.type,
          title: m.title,
          link: m.link,
          coverPath: m.coverPath,
          category: m.category,
        })),
      };
      return JSON.stringify(shareData, null, 2);
    }
    return JSON.stringify(this.data, null, 2);
  }

  public importData(jsonString: string): { success: boolean; count?: number; error?: string } {
    try {
      const parsed = JSON.parse(jsonString);
      let count = 0;
      if (Array.isArray(parsed.games)) {
        for (const g of parsed.games) {
          this.saveGame(g);
          count++;
        }
      }
      if (Array.isArray(parsed.media)) {
        for (const m of parsed.media) {
          this.saveMedia(m);
          count++;
        }
      }
      return { success: true, count };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Invalid JSON file' };
    }
  }

  public loadDemoData(): AppData {
    const demoGames: Game[] = [
      {
        id: 'demo-cyberpunk-2077',
        name: 'Cyberpunk 2077: Phantom Liberty',
        coverPath: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=600&q=80',
        bannerPath: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1600&q=80',
        description: 'Game nhập vai hành động thế giới mở tại Night City tương lai.',
        downloadLinks: ['https://drive.google.com/file/d/sample-part1/view'],
        expectedSize: 68719476736, // 64 GB
        archivePassword: 'icelauch-pass',
        runAsAdmin: true,
        deleteArchiveAfterInstall: true,
        status: 'ready',
        inLibrary: true,
        featured: true,
        genre: 'Nhập vai',
        addedAt: new Date().toISOString(),
        lastPlayed: 'Hôm qua, 20:30',
      },
      {
        id: 'demo-elden-ring',
        name: 'Elden Ring: Shadow of the Erdtree',
        coverPath: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=600&q=80',
        bannerPath: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=1600&q=80',
        description: 'Tuyệt tác hành động thế giới mở đến từ FromSoftware.',
        downloadLinks: ['https://drive.google.com/file/d/sample-elden/view'],
        expectedSize: 51539607552, // 48 GB
        runAsAdmin: false,
        deleteArchiveAfterInstall: true,
        status: 'uninstalled',
        inLibrary: true,
        featured: true,
        genre: 'Hành động',
        addedAt: new Date().toISOString(),
      },
      {
        id: 'demo-hollow-knight',
        name: 'Hollow Knight: Silksong',
        coverPath: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=600&q=80',
        bannerPath: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1600&q=80',
        description: 'Hành trình khám phá vương quốc côn trùng kỳ bí và đầy thử thách.',
        downloadLinks: ['https://drive.google.com/file/d/sample-hollow/view'],
        expectedSize: 8589934592, // 8 GB
        runAsAdmin: false,
        deleteArchiveAfterInstall: true,
        status: 'downloading',
        inLibrary: true,
        featured: false,
        genre: 'Phiêu lưu',
        addedAt: new Date().toISOString(),
        downloadProgress: {
          bytesDownloaded: 3865470566,
          totalBytes: 8589934592,
          percentage: 45,
          speedMBps: 12.8,
          etaSeconds: 360,
          currentPart: 1,
          totalParts: 1,
          statusText: 'Đang tải game... 45%',
        },
      },
      {
        id: 'demo-forza-horizon',
        name: 'Forza Horizon 5 Premium',
        coverPath: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=600&q=80',
        description: 'Lễ hội đua xe thế giới mở tại Mexico tuyệt đẹp.',
        downloadLinks: ['https://drive.google.com/file/d/sample-forza/view'],
        expectedSize: 118111600640,
        runAsAdmin: false,
        deleteArchiveAfterInstall: true,
        status: 'uninstalled',
        inLibrary: false,
        featured: false,
        genre: 'Đua xe',
        addedAt: new Date().toISOString(),
      }
    ];

    const demoMedia: MediaItem[] = [
      {
        id: 'demo-media-1',
        type: 'video',
        title: 'Cyberpunk 2077 - Official Cinematic 4K Trailer',
        link: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        coverPath: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80',
        category: 'Trailer Game',
        lastPosition: 120,
        duration: 596,
        watched: false,
        addedAt: new Date().toISOString(),
      },
      {
        id: 'demo-media-2',
        type: 'video',
        title: 'Tears of Steel - Sci-Fi Short Movie',
        link: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
        coverPath: 'https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?auto=format&fit=crop&w=800&q=80',
        category: 'Phim Ngắn',
        lastPosition: 45,
        duration: 734,
        watched: false,
        addedAt: new Date().toISOString(),
      },
      {
        id: 'demo-audio-1',
        type: 'audio',
        title: 'City Ambient - Night City Lo-Fi Beats',
        link: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
        category: 'Gaming Lo-Fi',
        lastPosition: 30,
        duration: 372,
        watched: false,
        addedAt: new Date().toISOString(),
      },
      {
        id: 'demo-audio-2',
        type: 'audio',
        title: 'Epic Orchestral Theme - The Erdtree',
        link: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
        category: 'Soundtrack',
        lastPosition: 0,
        duration: 423,
        watched: false,
        addedAt: new Date().toISOString(),
      }
    ];

    this.data.games = demoGames;
    this.data.media = demoMedia;
    this.saveDataAtomic();
    return this.data;
  }

  // ==========================================
  // MULTI-USER PROFILES & CLOUD SYNC SERVICES
  // ==========================================

  public getProfiles(): UserProfile[] {
    return this.data.profiles || [];
  }

  public getProfile(id: string): UserProfile | null {
    return (this.data.profiles || []).find((p) => p.id === id) || null;
  }

  public getActiveProfile(): UserProfile | null {
    if (!this.data.activeProfileId) return null;
    return this.getProfile(this.data.activeProfileId);
  }

  public getRememberedProfileId(): string | null {
    return this.data.rememberedProfileId || null;
  }

  public setRememberedProfileId(id: string | null): void {
    this.data.rememberedProfileId = id;
    this.saveDataAtomic();
  }

  public setActiveProfileId(id: string | null): void {
    this.data.activeProfileId = id;
    if (id) {
      const p = this.getProfile(id);
      if (p) {
        p.lastActiveDate = new Date().toISOString();
      }
    }
    this.saveDataAtomic();
  }

  public saveProfile(profile: UserProfile): UserProfile {
    if (!this.data.profiles) {
      this.data.profiles = [];
    }

    const idx = this.data.profiles.findIndex((p) => p.id === profile.id);
    if (idx !== -1) {
      this.data.profiles[idx] = {
        ...this.data.profiles[idx],
        ...profile,
        lastActiveDate: new Date().toISOString(),
      };
      profile = this.data.profiles[idx];
    } else {
      if (!profile.id) {
        profile.id = `user-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      }
      profile.createdDate = profile.createdDate || new Date().toISOString();
      profile.lastActiveDate = new Date().toISOString();
      profile.library = profile.library || [];
      profile.favoriteMedia = profile.favoriteMedia || [];
      profile.watchProgress = profile.watchProgress || {};
      profile.gameStats = profile.gameStats || {};
      this.data.profiles.push(profile);
    }

    this.saveDataAtomic();
    return profile;
  }

  public deleteProfile(id: string): boolean {
    if (!this.data.profiles) return false;
    const initialLen = this.data.profiles.length;
    this.data.profiles = this.data.profiles.filter((p) => p.id !== id);

    if (this.data.activeProfileId === id) {
      this.data.activeProfileId = null;
    }
    if (this.data.rememberedProfileId === id) {
      this.data.rememberedProfileId = null;
    }

    this.saveDataAtomic();
    return this.data.profiles.length < initialLen;
  }

  public setAllProfiles(profiles: UserProfile[]): void {
    this.data.profiles = profiles;
    this.saveDataAtomic();
  }

  public updateProfileLibrary(profileId: string, gameId: string, inLibrary: boolean): void {
    const prof = this.getProfile(profileId);
    if (!prof) return;

    prof.library = prof.library || [];
    if (inLibrary) {
      if (!prof.library.includes(gameId)) prof.library.push(gameId);
    } else {
      prof.library = prof.library.filter((id) => id !== gameId);
    }
    this.saveDataAtomic();
  }

  public updateProfileWatchProgress(
    profileId: string,
    mediaId: string,
    position: number,
    duration: number,
    completed: boolean
  ): void {
    const prof = this.getProfile(profileId);
    if (!prof) return;

    prof.watchProgress = prof.watchProgress || {};
    prof.watchProgress[mediaId] = {
      currentTime: position,
      duration: duration || 0,
      completed,
      lastWatchedAt: Date.now(),
    };
    this.saveDataAtomic();
  }

  public updateProfileFavoriteMedia(profileId: string, mediaId: string, isFav: boolean): void {
    const prof = this.getProfile(profileId);
    if (!prof) return;

    prof.favoriteMedia = prof.favoriteMedia || [];
    if (isFav) {
      if (!prof.favoriteMedia.includes(mediaId)) prof.favoriteMedia.push(mediaId);
    } else {
      prof.favoriteMedia = prof.favoriteMedia.filter((id) => id !== mediaId);
    }
    this.saveDataAtomic();
  }

  public updateProfileGameStats(profileId: string, gameId: string, playedMinutes: number): void {
    const prof = this.getProfile(profileId);
    if (!prof) return;

    prof.gameStats = prof.gameStats || {};
    const curr = prof.gameStats[gameId] || { totalPlayMinutes: 0, lastPlayedAt: 0 };
    prof.gameStats[gameId] = {
      totalPlayMinutes: curr.totalPlayMinutes + playedMinutes,
      lastPlayedAt: Date.now(),
    };
    this.saveDataAtomic();
  }

  public getCloudSyncSettings(): CloudSyncSettings {
    return this.data.cloudSync || {
      enabled: false,
      supabaseUrl: '',
      supabaseAnonKey: '',
      autoSyncIntervalMinutes: 5,
      lastSyncStatus: 'idle',
    };
  }

  public saveCloudSyncSettings(settings: Partial<CloudSyncSettings>): CloudSyncSettings {
    this.data.cloudSync = {
      ...(this.data.cloudSync || {
        enabled: false,
        supabaseUrl: '',
        supabaseAnonKey: '',
        autoSyncIntervalMinutes: 5,
        lastSyncStatus: 'idle',
      }),
      ...settings,
    };
    this.saveDataAtomic();
    return this.data.cloudSync;
  }
}
