import https from 'https';
import http from 'http';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { URL } from 'url';
import type { UserProfile, Game, MediaItem, MediaPlaylist } from '../../renderer/src/types';

export class SupabaseSyncService {
  private static instance: SupabaseSyncService;

  private constructor() {}

  public static getInstance(): SupabaseSyncService {
    if (!SupabaseSyncService.instance) {
      SupabaseSyncService.instance = new SupabaseSyncService();
    }
    return SupabaseSyncService.instance;
  }

  /**
   * Helper to execute PostgREST HTTPS requests
   */
  private makeRequest(
    fullUrl: string,
    anonKey: string,
    options: {
      method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
      body?: any;
      headers?: Record<string, string>;
    }
  ): Promise<{ status: number; data: any }> {
    return new Promise((resolve, reject) => {
      try {
        const parsed = new URL(fullUrl);
        const isHttps = parsed.protocol === 'https:';
        const client = isHttps ? https : http;

        const bodyStr = options.body ? JSON.stringify(options.body) : '';

        const reqHeaders: Record<string, string> = {
          'apikey': anonKey,
          'Authorization': `Bearer ${anonKey}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          ...(options.headers || {}),
        };

        if (bodyStr) {
          reqHeaders['Content-Length'] = Buffer.byteLength(bodyStr).toString();
        }

        const req = client.request(
          parsed,
          {
            method: options.method,
            headers: reqHeaders,
            timeout: 15000,
          },
          (res) => {
            let resBody = '';
            res.on('data', (chunk) => {
              resBody += chunk;
            });
            res.on('end', () => {
              let parsedData = null;
              try {
                if (resBody) {
                  parsedData = JSON.parse(resBody);
                }
              } catch {
                parsedData = resBody;
              }
              resolve({ status: res.statusCode || 500, data: parsedData });
            });
          }
        );

        req.on('timeout', () => {
          req.destroy();
          reject(new Error('Yêu cầu tới Supabase bị quá thời gian chờ (15s)'));
        });

        req.on('error', (err) => {
          reject(err);
        });

        if (bodyStr) {
          req.write(bodyStr);
        }
        req.end();
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Helper to upload binary files (Images) to Supabase Storage
   */
  private makeBinaryRequest(
    fullUrl: string,
    anonKey: string,
    buffer: Buffer,
    contentType: string
  ): Promise<{ status: number; data: any }> {
    return new Promise((resolve, reject) => {
      try {
        const parsed = new URL(fullUrl);
        const isHttps = parsed.protocol === 'https:';
        const client = isHttps ? https : http;

        const req = client.request(
          parsed,
          {
            method: 'POST',
            headers: {
              'apikey': anonKey,
              'Authorization': `Bearer ${anonKey}`,
              'Content-Type': contentType,
              'Content-Length': buffer.length.toString(),
              'x-upsert': 'true',
            },
            timeout: 25000,
          },
          (res) => {
            let resBody = '';
            res.on('data', (c) => (resBody += c));
            res.on('end', () => {
              let parsedData = null;
              try {
                parsedData = JSON.parse(resBody);
              } catch {
                parsedData = resBody;
              }
              resolve({ status: res.statusCode || 500, data: parsedData });
            });
          }
        );

        req.on('timeout', () => {
          req.destroy();
          reject(new Error('Tải ảnh lên Supabase Storage bị quá thời gian chờ (25s)'));
        });

        req.on('error', reject);
        req.write(buffer);
        req.end();
      } catch (err) {
        reject(err);
      }
    });
  }

  private cleanUrl(rawUrl: string): string {
    return rawUrl.trim().replace(/\/+$/, '');
  }

  /**
   * Test Supabase connection and verify whether tables exist
   */
  public async testConnection(supabaseUrl: string, anonKey: string): Promise<{ success: boolean; message: string }> {
    if (!supabaseUrl || !anonKey) {
      return { success: false, message: 'Vui lòng điền đủ Supabase Project URL và Anon Key' };
    }

    const baseUrl = this.cleanUrl(supabaseUrl);
    try {
      const endpoint = `${baseUrl}/rest/v1/icelauch_profiles?select=id&limit=1`;
      const res = await this.makeRequest(endpoint, anonKey, { method: 'GET' });

      if (res.status >= 200 && res.status < 300) {
        return {
          success: true,
          message: 'Kết nối Supabase thành công! Bảng dữ liệu sẵn sàng.',
        };
      } else if (res.status === 404 || (res.data && res.data.message && res.data.message.includes('does not exist'))) {
        return {
          success: false,
          message: 'Kết nối được Supabase nhưng chưa tạo bảng! Vui lòng chạy file SQL Schema trong SQL Editor của Supabase.',
        };
      } else {
        return {
          success: false,
          message: `Lỗi kết nối (${res.status}): ${res.data?.message || JSON.stringify(res.data)}`,
        };
      }
    } catch (err: any) {
      return {
        success: false,
        message: `Không thể kết nối đến máy chủ Supabase: ${err.message || 'Lỗi mạng'}`,
      };
    }
  }

  /**
   * Automatically uploads a local image file to Supabase Storage and returns its permanent Public CDN URL
   */
  public async uploadLocalImage(
    supabaseUrl: string,
    anonKey: string,
    filePathOrUrl?: string,
    subfolder: 'covers' | 'banners' = 'covers'
  ): Promise<string | undefined> {
    if (!filePathOrUrl) return undefined;
    const trimmed = filePathOrUrl.trim();

    // Already a remote URL or data URI
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:')) {
      return trimmed;
    }

    // Check if local file exists
    if (!fs.existsSync(trimmed)) {
      return trimmed;
    }

    try {
      const fileBuffer = fs.readFileSync(trimmed);
      const ext = path.extname(trimmed).toLowerCase() || '.jpg';
      let mimeType = 'image/jpeg';
      if (ext === '.png') mimeType = 'image/png';
      else if (ext === '.webp') mimeType = 'image/webp';
      else if (ext === '.gif') mimeType = 'image/gif';
      else if (ext === '.svg') mimeType = 'image/svg+xml';

      const fileHash = crypto.createHash('md5').update(fileBuffer).digest('hex').substring(0, 10);
      const safeBase = path.basename(trimmed, ext).replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 30);
      const remoteFileName = `${fileHash}_${safeBase}${ext}`;
      const uploadPath = `${subfolder}/${remoteFileName}`;

      const baseUrl = this.cleanUrl(supabaseUrl);
      const uploadUrl = `${baseUrl}/storage/v1/object/icelauch-assets/${uploadPath}`;

      const uploadRes = await this.makeBinaryRequest(uploadUrl, anonKey, fileBuffer, mimeType);
      if (uploadRes.status >= 200 && uploadRes.status < 300) {
        const publicUrl = `${baseUrl}/storage/v1/object/public/icelauch-assets/${uploadPath}`;
        console.log(`[Supabase Storage] Uploaded local image: ${trimmed} -> ${publicUrl}`);
        return publicUrl;
      } else {
        console.warn(`[Supabase Storage] Notice (${uploadRes.status}):`, uploadRes.data?.message || uploadRes.data);
        return trimmed;
      }
    } catch (err: any) {
      console.warn(`[Supabase Storage] Upload failed for ${trimmed}:`, err?.message);
      return trimmed;
    }
  }

  // --- 1. PROFILES & USER DATA ---

  public async pullProfiles(supabaseUrl: string, anonKey: string): Promise<UserProfile[]> {
    const baseUrl = this.cleanUrl(supabaseUrl);
    const endpoint = `${baseUrl}/rest/v1/icelauch_profiles?select=*`;
    const res = await this.makeRequest(endpoint, anonKey, { method: 'GET' });

    if (res.status < 200 || res.status >= 300) {
      throw new Error(res.data?.message || `Không thể tải profiles (Status ${res.status})`);
    }

    const remoteProfiles: any[] = Array.isArray(res.data) ? res.data : [];
    return remoteProfiles.map((r) => ({
      id: r.id,
      nickname: r.nickname,
      avatar: r.avatar || 'avatar_1',
      pinHash: r.pin_hash,
      createdDate: r.created_at || new Date().toISOString(),
      lastActiveDate: r.last_active || new Date().toISOString(),
      library: [],
      favoriteMedia: [],
      watchProgress: {},
      gameStats: {},
    }));
  }

  public async pullUserData(supabaseUrl: string, anonKey: string, profileId: string): Promise<any | null> {
    const baseUrl = this.cleanUrl(supabaseUrl);
    const endpoint = `${baseUrl}/rest/v1/icelauch_user_data?profile_id=eq.${encodeURIComponent(profileId)}&select=*`;
    const res = await this.makeRequest(endpoint, anonKey, { method: 'GET' });

    if (res.status >= 200 && res.status < 300 && Array.isArray(res.data) && res.data.length > 0) {
      const row = res.data[0];
      return {
        library: row.library || [],
        watchProgress: row.watch_progress || {},
        favoriteMedia: row.favorite_media || [],
        gameStats: row.game_stats || {},
      };
    }
    return null;
  }

  public async upsertProfile(supabaseUrl: string, anonKey: string, profile: UserProfile): Promise<boolean> {
    const baseUrl = this.cleanUrl(supabaseUrl);
    const endpoint = `${baseUrl}/rest/v1/icelauch_profiles`;
    const payload = {
      id: profile.id,
      nickname: profile.nickname,
      avatar: profile.avatar,
      pin_hash: profile.pinHash,
      last_active: profile.lastActiveDate || new Date().toISOString(),
    };

    const res = await this.makeRequest(endpoint, anonKey, {
      method: 'POST',
      body: payload,
      headers: {
        'Prefer': 'resolution=merge-duplicates',
      },
    });

    return res.status >= 200 && res.status < 300;
  }

  public async upsertUserData(supabaseUrl: string, anonKey: string, profile: UserProfile): Promise<boolean> {
    const baseUrl = this.cleanUrl(supabaseUrl);
    const endpoint = `${baseUrl}/rest/v1/icelauch_user_data`;
    const payload = {
      profile_id: profile.id,
      library: profile.library || [],
      watch_progress: profile.watchProgress || {},
      favorite_media: profile.favoriteMedia || [],
      game_stats: profile.gameStats || {},
      updated_at: new Date().toISOString(),
    };

    const res = await this.makeRequest(endpoint, anonKey, {
      method: 'POST',
      body: payload,
      headers: {
        'Prefer': 'resolution=merge-duplicates',
      },
    });

    return res.status >= 200 && res.status < 300;
  }

  // --- 2. GAMES CATALOG ---

  public async pullGames(supabaseUrl: string, anonKey: string): Promise<Game[]> {
    const baseUrl = this.cleanUrl(supabaseUrl);
    const endpoint = `${baseUrl}/rest/v1/icelauch_games?select=*`;
    const res = await this.makeRequest(endpoint, anonKey, { method: 'GET' });
    if (res.status < 200 || res.status >= 300) {
      return [];
    }
    const rows: any[] = Array.isArray(res.data) ? res.data : [];
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      coverPath: r.cover_url || '',
      bannerPath: r.banner_url || undefined,
      trailerUrl: r.trailer_url || undefined,
      description: r.description || '',
      genre: r.genre || '',
      tags: r.tags || [],
      actionButtonIds: r.action_buttons || [],
      downloadLinks: r.drive_url ? [r.drive_url] : [],
      expectedSize: r.file_size ? Number(r.file_size) : undefined,
      featured: Boolean(r.featured),
      runAsAdmin: false,
      deleteArchiveAfterInstall: true,
      status: 'uninstalled',
      inLibrary: false,
      addedAt: r.updated_at || new Date().toISOString(),
    }));
  }

  public async upsertGame(supabaseUrl: string, anonKey: string, game: Game): Promise<boolean> {
    const baseUrl = this.cleanUrl(supabaseUrl);
    const endpoint = `${baseUrl}/rest/v1/icelauch_games`;
    const payload = {
      id: game.id,
      name: game.name,
      drive_url: game.downloadLinks && game.downloadLinks.length > 0 ? game.downloadLinks[0] : null,
      trailer_url: game.trailerUrl || null,
      banner_url: game.bannerPath || null,
      cover_url: game.coverPath || null,
      description: game.description || '',
      genre: game.genre || '',
      tags: game.tags || [],
      action_buttons: game.actionButtonIds || [],
      featured: Boolean(game.featured),
      file_size: game.expectedSize || null,
      updated_at: new Date().toISOString(),
    };

    const res = await this.makeRequest(endpoint, anonKey, {
      method: 'POST',
      body: payload,
      headers: { 'Prefer': 'resolution=merge-duplicates' },
    });
    return res.status >= 200 && res.status < 300;
  }

  // --- 3. MEDIA CATALOG ---

  public async pullMedia(supabaseUrl: string, anonKey: string): Promise<MediaItem[]> {
    const baseUrl = this.cleanUrl(supabaseUrl);
    const endpoint = `${baseUrl}/rest/v1/icelauch_media?select=*`;
    const res = await this.makeRequest(endpoint, anonKey, { method: 'GET' });
    if (res.status < 200 || res.status >= 300) {
      return [];
    }
    const rows: any[] = Array.isArray(res.data) ? res.data : [];
    return rows.map((r) => ({
      id: r.id,
      title: r.title,
      type: r.type || 'video',
      link: r.link,
      coverPath: r.cover_path || undefined,
      bannerPath: r.banner_path || undefined,
      description: r.description || '',
      category: r.category || '',
      tags: r.tags || [],
      duration: r.duration || 0,
      isBannerPinned: Boolean(r.is_banner_pinned),
      lastPosition: 0,
      watched: false,
      addedAt: r.updated_at || new Date().toISOString(),
    }));
  }

  public async upsertMediaItem(supabaseUrl: string, anonKey: string, item: MediaItem): Promise<boolean> {
    const baseUrl = this.cleanUrl(supabaseUrl);
    const endpoint = `${baseUrl}/rest/v1/icelauch_media`;
    const payload = {
      id: item.id,
      title: item.title,
      type: item.type || 'video',
      link: item.link,
      cover_path: item.coverPath || null,
      banner_path: item.bannerPath || null,
      description: item.description || '',
      category: item.category || '',
      tags: item.tags || [],
      duration: item.duration || 0,
      is_banner_pinned: Boolean(item.isBannerPinned),
      updated_at: new Date().toISOString(),
    };

    const res = await this.makeRequest(endpoint, anonKey, {
      method: 'POST',
      body: payload,
      headers: { 'Prefer': 'resolution=merge-duplicates' },
    });
    return res.status >= 200 && res.status < 300;
  }

  // --- 4. PLAYLISTS CATALOG ---

  public async pullPlaylists(supabaseUrl: string, anonKey: string): Promise<MediaPlaylist[]> {
    const baseUrl = this.cleanUrl(supabaseUrl);
    const endpoint = `${baseUrl}/rest/v1/icelauch_playlists?select=*`;
    const res = await this.makeRequest(endpoint, anonKey, { method: 'GET' });
    if (res.status < 200 || res.status >= 300) return [];
    const rows: any[] = Array.isArray(res.data) ? res.data : [];
    return rows.map((r) => ({
      id: r.id,
      name: r.title,
      type: 'video',
      description: r.description || '',
      coverPath: r.cover_path || undefined,
      itemIds: r.item_ids || [],
      createdAt: r.updated_at || new Date().toISOString(),
    }));
  }

  public async upsertPlaylist(supabaseUrl: string, anonKey: string, playlist: MediaPlaylist): Promise<boolean> {
    const baseUrl = this.cleanUrl(supabaseUrl);
    const endpoint = `${baseUrl}/rest/v1/icelauch_playlists`;
    const payload = {
      id: playlist.id,
      title: playlist.name,
      description: playlist.description || '',
      cover_path: playlist.coverPath || null,
      item_ids: playlist.itemIds || [],
      updated_at: new Date().toISOString(),
    };
    const res = await this.makeRequest(endpoint, anonKey, {
      method: 'POST',
      body: payload,
      headers: { 'Prefer': 'resolution=merge-duplicates' },
    });
    return res.status >= 200 && res.status < 300;
  }

  // --- 5. COMPREHENSIVE 2-WAY FULL CATALOG & PROFILES SYNC ---

  public async syncAll(
    supabaseUrl: string,
    anonKey: string,
    localProfiles: UserProfile[],
    localGames: Game[] = [],
    localMedia: MediaItem[] = [],
    localPlaylists: MediaPlaylist[] = []
  ): Promise<{
    updatedProfiles: UserProfile[];
    updatedGames: Game[];
    updatedMedia: MediaItem[];
    updatedPlaylists: MediaPlaylist[];
    message: string;
  }> {
    const test = await this.testConnection(supabaseUrl, anonKey);
    if (!test.success) {
      throw new Error(test.message);
    }

    // A. Sync Games Catalog (Upload local images -> Upsert -> Merge with remote)
    const processedGames = [...localGames];
    for (const game of processedGames) {
      if (game.coverPath) {
        game.coverPath = (await this.uploadLocalImage(supabaseUrl, anonKey, game.coverPath, 'covers')) || game.coverPath;
      }
      if (game.bannerPath) {
        game.bannerPath = (await this.uploadLocalImage(supabaseUrl, anonKey, game.bannerPath, 'banners')) || game.bannerPath;
      }
      await this.upsertGame(supabaseUrl, anonKey, game);
    }

    const remoteGames = await this.pullGames(supabaseUrl, anonKey);
    const gameMap = new Map<string, Game>();
    for (const g of processedGames) gameMap.set(g.id, g);
    for (const rg of remoteGames) {
      if (!gameMap.has(rg.id)) {
        gameMap.set(rg.id, rg);
      } else {
        // Merge links, banners, covers if remote has updated
        const local = gameMap.get(rg.id)!;
        if (rg.downloadLinks && rg.downloadLinks.length > 0) local.downloadLinks = rg.downloadLinks;
        local.trailerUrl = rg.trailerUrl || local.trailerUrl;
        local.coverPath = rg.coverPath || local.coverPath;
        local.bannerPath = rg.bannerPath || local.bannerPath;
        local.description = rg.description || local.description;
      }
    }
    const finalGames = Array.from(gameMap.values());

    // B. Sync Media Catalog (Upload local images -> Upsert -> Merge with remote)
    const processedMedia = [...localMedia];
    for (const item of processedMedia) {
      if (item.coverPath) {
        item.coverPath = await this.uploadLocalImage(supabaseUrl, anonKey, item.coverPath, 'covers');
      }
      if (item.bannerPath) {
        item.bannerPath = await this.uploadLocalImage(supabaseUrl, anonKey, item.bannerPath, 'banners');
      }
      await this.upsertMediaItem(supabaseUrl, anonKey, item);
    }

    const remoteMedia = await this.pullMedia(supabaseUrl, anonKey);
    const mediaMap = new Map<string, MediaItem>();
    for (const m of processedMedia) mediaMap.set(m.id, m);
    for (const rm of remoteMedia) {
      if (!mediaMap.has(rm.id)) {
        mediaMap.set(rm.id, rm);
      } else {
        const local = mediaMap.get(rm.id)!;
        local.link = rm.link || local.link;
        local.coverPath = rm.coverPath || local.coverPath;
        local.bannerPath = rm.bannerPath || local.bannerPath;
        local.description = rm.description || local.description;
        local.tags = rm.tags || local.tags;
      }
    }
    const finalMedia = Array.from(mediaMap.values());

    // C. Sync Playlists Catalog
    const processedPlaylists = [...localPlaylists];
    for (const p of processedPlaylists) {
      if (p.coverPath) {
        p.coverPath = await this.uploadLocalImage(supabaseUrl, anonKey, p.coverPath, 'covers');
      }
      await this.upsertPlaylist(supabaseUrl, anonKey, p);
    }
    const remotePlaylists = await this.pullPlaylists(supabaseUrl, anonKey);
    const playlistMap = new Map<string, MediaPlaylist>();
    for (const p of processedPlaylists) playlistMap.set(p.id, p);
    for (const rp of remotePlaylists) {
      if (!playlistMap.has(rp.id)) playlistMap.set(rp.id, rp);
    }
    const finalPlaylists = Array.from(playlistMap.values());

    // D. Sync User Profiles & Personalized Data
    const remoteProfiles = await this.pullProfiles(supabaseUrl, anonKey);
    const mergedProfiles = new Map<string, UserProfile>();
    for (const lp of localProfiles) mergedProfiles.set(lp.id, { ...lp });

    for (const rp of remoteProfiles) {
      const local = mergedProfiles.get(rp.id);
      if (!local) {
        const userData = await this.pullUserData(supabaseUrl, anonKey, rp.id);
        mergedProfiles.set(rp.id, {
          ...rp,
          library: userData?.library || [],
          watchProgress: userData?.watchProgress || {},
          favoriteMedia: userData?.favoriteMedia || [],
          gameStats: userData?.gameStats || {},
        });
      } else {
        const localActive = new Date(local.lastActiveDate || 0).getTime();
        const remoteActive = new Date(rp.lastActiveDate || 0).getTime();
        if (remoteActive > localActive) {
          local.nickname = rp.nickname;
          local.avatar = rp.avatar;
          local.pinHash = rp.pinHash;
          local.lastActiveDate = rp.lastActiveDate;
          const userData = await this.pullUserData(supabaseUrl, anonKey, rp.id);
          if (userData) {
            local.library = userData.library || local.library;
            local.watchProgress = { ...local.watchProgress, ...(userData.watchProgress || {}) };
            local.favoriteMedia = userData.favoriteMedia || local.favoriteMedia;
            local.gameStats = { ...local.gameStats, ...(userData.gameStats || {}) };
          }
        }
      }
    }

    const finalProfiles = Array.from(mergedProfiles.values());
    for (const prof of finalProfiles) {
      await this.upsertProfile(supabaseUrl, anonKey, prof);
      await this.upsertUserData(supabaseUrl, anonKey, prof);
    }

    return {
      updatedProfiles: finalProfiles,
      updatedGames: finalGames,
      updatedMedia: finalMedia,
      updatedPlaylists: finalPlaylists,
      message: `Đồng bộ thành công ${finalProfiles.length} hồ sơ, ${finalGames.length} game và ${finalMedia.length} phim/media lên Supabase Cloud!`,
    };
  }
}
