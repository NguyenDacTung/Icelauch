import https from 'https';
import http from 'http';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { URL } from 'url';
import type { UserProfile, Game, MediaItem, MediaPlaylist } from '../../renderer/src/types';

function cleanQuestionMarks(text?: string): string {
  if (!text) return '';
  return text
    .replace(/Chiếu R\?+p/gi, 'Chiếu Rạp')
    .replace(/Hành đ\?+ng/gi, 'Hành động')
    .replace(/Hoạt h\?+nh/gi, 'Hoạt hình')
    .replace(/Thủ ph\?+m/gi, 'Thủ phạm')
    .replace(/Lồng Ti\?+ng/gi, 'Lồng Tiếng')
    .replace(/Trinh Th\?+m/gi, 'Trinh Thám')
    .replace(/Vi\?+t/gi, 'Việt');
}

const META_REGEX = /<!--ICELAUCH_META:([\s\S]*?)-->/;

function encodeDescriptionMetadata(cleanDesc: string = '', meta: Record<string, any>): string {
  const descWithoutMeta = (cleanDesc || '').replace(META_REGEX, '').trim();
  const validKeys = Object.keys(meta).filter((k) => meta[k] !== undefined && meta[k] !== null);
  if (validKeys.length === 0) return descWithoutMeta;
  const cleanMeta: Record<string, any> = {};
  for (const k of validKeys) cleanMeta[k] = meta[k];
  const metaStr = `<!--ICELAUCH_META:${JSON.stringify(cleanMeta)}-->`;
  return descWithoutMeta ? `${descWithoutMeta}\n${metaStr}` : metaStr;
}

function decodeDescriptionMetadata(rawDesc: string = ''): { description: string; meta: Record<string, any> } {
  if (!rawDesc) return { description: '', meta: {} };
  const match = rawDesc.match(META_REGEX);
  if (!match) return { description: rawDesc, meta: {} };
  try {
    const meta = JSON.parse(match[1]);
    const cleanDesc = rawDesc.replace(META_REGEX, '').trim();
    return { description: cleanDesc, meta };
  } catch (e) {
    return { description: rawDesc, meta: {} };
  }
}

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
          'Accept': 'application/json; charset=utf-8',
          'Content-Type': 'application/json; charset=utf-8',
          ...(options.headers || {}),
        };

        if (bodyStr) {
          reqHeaders['Content-Length'] = Buffer.byteLength(bodyStr, 'utf8').toString();
        }

        const req = client.request(
          parsed,
          {
            method: options.method,
            headers: reqHeaders,
            timeout: 15000,
          },
          (res) => {
            const chunks: Buffer[] = [];
            res.on('data', (chunk) => {
              chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
            });
            res.on('end', () => {
              let parsedData = null;
              try {
                const fullBuffer = Buffer.concat(chunks);
                const resBody = fullBuffer.toString('utf8');
                if (resBody) {
                  parsedData = JSON.parse(resBody);
                }
              } catch {
                try {
                  parsedData = Buffer.concat(chunks).toString('utf8');
                } catch {
                  parsedData = null;
                }
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
          req.write(bodyStr, 'utf8');
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
            const chunks: Buffer[] = [];
            res.on('data', (c) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));
            res.on('end', () => {
              let parsedData = null;
              try {
                const resBody = Buffer.concat(chunks).toString('utf8');
                parsedData = JSON.parse(resBody);
              } catch {
                try {
                  parsedData = Buffer.concat(chunks).toString('utf8');
                } catch {
                  parsedData = null;
                }
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

    // Also fetch all user data from icelauch_user_data to merge private credentials and library
    const userDataMap = new Map<string, any>();
    try {
      const userDataEndpoint = `${baseUrl}/rest/v1/icelauch_user_data?select=*`;
      const userDataRes = await this.makeRequest(userDataEndpoint, anonKey, { method: 'GET' });
      if (userDataRes.status >= 200 && userDataRes.status < 300 && Array.isArray(userDataRes.data)) {
        for (const row of userDataRes.data) {
          if (row.profile_id) {
            userDataMap.set(row.profile_id, row);
          }
        }
      }
    } catch (e) {
      console.warn('Failed to pull user data map in pullProfiles:', e);
    }

    return remoteProfiles
      .filter((r) => r.id !== 'icedrop_cloud_hub' && r.id !== 'icelauch_device_registry' && !String(r.id).startsWith('icelauch_'))
      .map((r) => {
        const udata = userDataMap.get(r.id);
        const gs = udata?.game_stats || {};
        return {
          id: r.id,
          username: gs.username || r.nickname?.toLowerCase().replace(/\s+/g, ''),
          nickname: r.nickname,
          avatar: r.avatar || 'avatar_1',
          role: gs.role || (r.pin_hash ? 'admin' : 'user'),
          pinHash: r.pin_hash || '',
          passwordHash: gs.passwordHash,
          passwordSalt: gs.passwordSalt,
          requiresPasswordReset: gs.requiresPasswordReset,
          bannedUntil: gs.bannedUntil,
          banReason: gs.banReason,
          createdDate: r.created_at || new Date().toISOString(),
          lastActiveDate: r.last_active || new Date().toISOString(),
          library: Array.isArray(udata?.library) ? udata.library : [],
          favoriteMedia: Array.isArray(udata?.favorite_media) ? udata.favorite_media : [],
          favoritePlaylists: Array.isArray(gs.favoritePlaylists) ? gs.favoritePlaylists : [],
          customPlaylists: Array.isArray(gs.customPlaylists) ? gs.customPlaylists : [],
          watchProgress: udata?.watch_progress || {},
          gameStats: gs,
        };
      });
  }

  public async pullUserData(supabaseUrl: string, anonKey: string, profileId: string): Promise<any | null> {
    const baseUrl = this.cleanUrl(supabaseUrl);
    const endpoint = `${baseUrl}/rest/v1/icelauch_user_data?profile_id=eq.${encodeURIComponent(profileId)}&select=*`;
    const res = await this.makeRequest(endpoint, anonKey, { method: 'GET' });

    if (res.status >= 200 && res.status < 300 && Array.isArray(res.data) && res.data.length > 0) {
      const row = res.data[0];
      const gs = row.game_stats || {};
      return {
        library: row.library || [],
        watchProgress: row.watch_progress || {},
        favoriteMedia: row.favorite_media || [],
        favoritePlaylists: gs.favoritePlaylists || [],
        customPlaylists: gs.customPlaylists || [],
        username: gs.username,
        role: gs.role,
        passwordHash: gs.passwordHash,
        passwordSalt: gs.passwordSalt,
        requiresPasswordReset: gs.requiresPasswordReset,
        bannedUntil: gs.bannedUntil,
        banReason: gs.banReason,
        gameStats: gs,
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
      game_stats: {
        ...(profile.gameStats || {}),
        username: profile.username,
        role: profile.role,
        passwordHash: profile.passwordHash,
        passwordSalt: profile.passwordSalt,
        requiresPasswordReset: profile.requiresPasswordReset,
        favoritePlaylists: profile.favoritePlaylists || [],
        customPlaylists: profile.customPlaylists || [],
        bannedUntil: profile.bannedUntil,
        banReason: profile.banReason,
      },
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

  public async deleteProfile(supabaseUrl: string, anonKey: string, profileId: string): Promise<boolean> {
    const baseUrl = this.cleanUrl(supabaseUrl);
    await this.makeRequest(`${baseUrl}/rest/v1/icelauch_user_data?profile_id=eq.${encodeURIComponent(profileId)}`, anonKey, {
      method: 'DELETE',
    });
    const res = await this.makeRequest(`${baseUrl}/rest/v1/icelauch_profiles?id=eq.${encodeURIComponent(profileId)}`, anonKey, {
      method: 'DELETE',
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
    return rows.map((r) => {
      const decoded = decodeDescriptionMetadata(r.description);
      const meta = decoded.meta || {};
      return {
        id: r.id,
        name: cleanQuestionMarks(r.name),
        coverPath: r.cover_url || '',
        bannerPath: r.banner_url || undefined,
        trailerUrl: r.trailer_url || undefined,
        description: cleanQuestionMarks(decoded.description),
        genre: cleanQuestionMarks(r.genre),
        tags: Array.isArray(r.tags) ? r.tags.map((t: string) => cleanQuestionMarks(t)) : [],
        actionButtonIds: r.action_buttons || [],
        downloadLinks: r.drive_url ? r.drive_url.split('\n').map((s: string) => s.trim()).filter(Boolean) : [],
        backupLinks: r.drive_url ? r.drive_url.split('\n').map((s: string) => s.trim()).filter(Boolean).slice(1) : [],
        extensions: Array.isArray(r.extensions) ? r.extensions : [],
        expectedSize: r.file_size ? Number(r.file_size) : undefined,
        featured: Boolean(r.featured),
        hidden: Boolean(r.hidden),
        runAsAdmin: false,
        deleteArchiveAfterInstall: true,
        status: 'uninstalled',
        inLibrary: false,
        addedAt: r.updated_at || new Date().toISOString(),
        screenshots: Array.isArray(meta.screenshots) ? meta.screenshots : [],
        coverPosition: meta.coverPosition,
        coverZoom: meta.coverZoom,
        coverSharpen: meta.coverSharpen,
        bannerPosition: meta.bannerPosition,
        bannerZoom: meta.bannerZoom,
        bannerBlur: meta.bannerBlur,
        bannerDarkness: meta.bannerDarkness,
        bannerEdgeDarkness: meta.bannerEdgeDarkness,
        bannerSharpen: meta.bannerSharpen,
        listCardPosition: meta.listCardPosition,
        listCardZoom: meta.listCardZoom,
        transform_metadata: r.transform_metadata || meta.transform_metadata || undefined,
      };
    });
  }

  public async upsertGame(supabaseUrl: string, anonKey: string, game: Game): Promise<boolean> {
    const baseUrl = this.cleanUrl(supabaseUrl);
    const endpoint = `${baseUrl}/rest/v1/icelauch_games`;

    const meta: Record<string, any> = {
      screenshots: game.screenshots,
      coverPosition: game.coverPosition,
      coverZoom: game.coverZoom,
      coverSharpen: game.coverSharpen,
      bannerPosition: game.bannerPosition,
      bannerZoom: game.bannerZoom,
      bannerBlur: game.bannerBlur,
      bannerDarkness: game.bannerDarkness,
      bannerEdgeDarkness: game.bannerEdgeDarkness,
      bannerSharpen: game.bannerSharpen,
      listCardPosition: game.listCardPosition,
      listCardZoom: game.listCardZoom,
      transform_metadata: game.transform_metadata,
    };
    const finalDescription = encodeDescriptionMetadata(game.description || '', meta);

    const payload: Record<string, any> = {
      id: game.id,
      name: game.name,
      drive_url: game.downloadLinks && game.downloadLinks.length > 0 ? game.downloadLinks.join('\n') : null,
      trailer_url: game.trailerUrl || null,
      banner_url: game.bannerPath || null,
      cover_url: game.coverPath || null,
      description: finalDescription,
      genre: game.genre || '',
      tags: game.tags || [],
      action_buttons: game.actionButtonIds || [],
      featured: Boolean(game.featured),
      hidden: Boolean(game.hidden),
      file_size: game.expectedSize ? Math.round(game.expectedSize) : null,
      updated_at: new Date().toISOString(),
    };
    if (game.transform_metadata) {
      payload.transform_metadata = game.transform_metadata;
    }

    const res = await this.makeRequest(endpoint, anonKey, {
      method: 'POST',
      body: payload,
      headers: { 'Prefer': 'resolution=merge-duplicates' },
    });
    return res.status >= 200 && res.status < 300;
  }

  public async deleteGame(supabaseUrl: string, anonKey: string, gameId: string): Promise<boolean> {
    const baseUrl = this.cleanUrl(supabaseUrl);
    const endpoint = `${baseUrl}/rest/v1/icelauch_games?id=eq.${encodeURIComponent(gameId)}`;
    const res = await this.makeRequest(endpoint, anonKey, {
      method: 'DELETE',
    });
    return res.status >= 200 && res.status < 300;
  }

  public async deleteMediaItem(supabaseUrl: string, anonKey: string, mediaId: string): Promise<boolean> {
    const baseUrl = this.cleanUrl(supabaseUrl);
    const endpoint = `${baseUrl}/rest/v1/icelauch_media?id=eq.${encodeURIComponent(mediaId)}`;
    const res = await this.makeRequest(endpoint, anonKey, {
      method: 'DELETE',
    });
    return res.status >= 200 && res.status < 300;
  }

  public async publishSystemSettings(supabaseUrl: string, anonKey: string, systemSettings: any): Promise<boolean> {
    return this.upsertPlaylist(supabaseUrl, anonKey, {
      id: '__system_catalog_settings__',
      name: '__system_catalog_settings__',
      type: 'video',
      description: JSON.stringify(systemSettings),
      itemIds: [],
      createdAt: new Date().toISOString(),
    });
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
    return rows.map((r) => {
      const links = r.link ? r.link.split('\n').map((s: string) => s.trim()).filter(Boolean) : [];
      const decoded = decodeDescriptionMetadata(r.description);
      const meta = decoded.meta || {};
      return {
        id: r.id,
        title: cleanQuestionMarks(r.title),
        secondaryTitle: meta.secondaryTitle || r.secondary_title || undefined,
        episode: meta.episode !== undefined && meta.episode !== null ? String(meta.episode) : (r.episode !== undefined && r.episode !== null ? String(r.episode) : undefined),
        type: r.type || 'video',
        subType: meta.subType || (r.type === 'audio' ? 'music' : undefined),
        artist: meta.artist,
        album: meta.album,
        link: links[0] || '',
        backupLinks: links.slice(1),
        coverPath: r.cover_path || undefined,
        bannerPath: r.banner_path || undefined,
        description: cleanQuestionMarks(decoded.description),
        category: cleanQuestionMarks(r.category),
        tags: Array.isArray(r.tags) ? r.tags.map((t: string) => cleanQuestionMarks(t)) : [],
        duration: r.duration || 0,
        isBannerPinned: Boolean(r.is_banner_pinned),
        hidden: Boolean(r.hidden),
        lastPosition: 0,
        watched: false,
        addedAt: r.updated_at || new Date().toISOString(),
        coverPosition: meta.coverPosition,
        coverZoom: meta.coverZoom,
        coverSharpen: meta.coverSharpen,
        bannerPosition: meta.bannerPosition,
        bannerZoom: meta.bannerZoom,
        bannerBlur: meta.bannerBlur,
        bannerDarkness: meta.bannerDarkness,
        bannerEdgeDarkness: meta.bannerEdgeDarkness,
        bannerSharpen: meta.bannerSharpen,
        listCardPosition: meta.listCardPosition,
        listCardZoom: meta.listCardZoom,
        transform_metadata: r.transform_metadata || meta.transform_metadata || undefined,
      };
    });
  }

  public async upsertMediaItem(supabaseUrl: string, anonKey: string, item: MediaItem): Promise<boolean> {
    const baseUrl = this.cleanUrl(supabaseUrl);
    const endpoint = `${baseUrl}/rest/v1/icelauch_media`;

    const meta: Record<string, any> = {
      secondaryTitle: item.secondaryTitle,
      episode: item.episode,
      subType: item.subType,
      artist: item.artist,
      album: item.album,
      coverPosition: item.coverPosition,
      coverZoom: item.coverZoom,
      coverSharpen: item.coverSharpen,
      bannerPosition: item.bannerPosition,
      bannerZoom: item.bannerZoom,
      bannerBlur: item.bannerBlur,
      bannerDarkness: item.bannerDarkness,
      bannerEdgeDarkness: item.bannerEdgeDarkness,
      bannerSharpen: item.bannerSharpen,
      listCardPosition: item.listCardPosition,
      listCardZoom: item.listCardZoom,
      transform_metadata: item.transform_metadata,
    };
    const finalDescription = encodeDescriptionMetadata(item.description || '', meta);

    const payload: Record<string, any> = {
      id: item.id,
      title: item.title,
      type: item.type || 'video',
      link: [item.link, ...(item.backupLinks || [])].filter(Boolean).join('\n'),
      cover_path: item.coverPath || null,
      banner_path: item.bannerPath || null,
      description: finalDescription,
      category: item.category || '',
      tags: item.tags || [],
      duration: item.duration || 0,
      is_banner_pinned: Boolean(item.isBannerPinned),
      hidden: Boolean(item.hidden),
      updated_at: new Date().toISOString(),
    };
    if (item.transform_metadata) {
      payload.transform_metadata = item.transform_metadata;
    }

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
    return rows.map((r) => {
      let type: 'video' | 'audio' = r.type || 'video';
      let subType: any = r.sub_type;
      let coverAspectRatio: '1:1' | '16:9' = r.cover_aspect_ratio || (type === 'video' ? '16:9' : '1:1');
      let desc = r.description || '';

      if (desc.startsWith('__META:')) {
        try {
          const metaEnd = desc.indexOf('__\n');
          if (metaEnd !== -1) {
            const meta = JSON.parse(desc.slice(7, metaEnd));
            if (meta.type) type = meta.type;
            if (meta.subType) subType = meta.subType;
            if (meta.coverAspectRatio) coverAspectRatio = meta.coverAspectRatio;
            desc = desc.slice(metaEnd + 3);
          }
        } catch {}
      }

      return {
        id: r.id,
        name: r.title,
        type,
        subType,
        coverAspectRatio,
        description: desc,
        coverPath: r.cover_path || undefined,
        itemIds: Array.isArray(r.item_ids) ? r.item_ids : [],
        createdAt: r.updated_at || new Date().toISOString(),
      };
    });
  }

  public async upsertPlaylist(supabaseUrl: string, anonKey: string, playlist: MediaPlaylist): Promise<boolean> {
    const baseUrl = this.cleanUrl(supabaseUrl);
    const endpoint = `${baseUrl}/rest/v1/icelauch_playlists`;
    const metaPrefix = `__META:${JSON.stringify({
      type: playlist.type || 'video',
      subType: playlist.subType,
      coverAspectRatio: playlist.coverAspectRatio || (playlist.type === 'video' ? '16:9' : '1:1'),
    })}__\n`;
    const cleanDesc = (playlist.description || '').replace(/^__META:.*?__\n/, '');

    const payload = {
      id: playlist.id,
      title: playlist.name,
      description: metaPrefix + cleanDesc,
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

  public async deletePlaylist(supabaseUrl: string, anonKey: string, playlistId: string): Promise<boolean> {
    const baseUrl = this.cleanUrl(supabaseUrl);
    const endpoint = `${baseUrl}/rest/v1/icelauch_playlists?id=eq.${encodeURIComponent(playlistId)}`;
    const res = await this.makeRequest(endpoint, anonKey, {
      method: 'DELETE',
    });
    return res.status >= 200 && res.status < 300;
  }

  // --- 4.5. ADMIN PUBLISH CATALOG & CLIENT PULL CATALOG ---

  public async publishCatalog(
    supabaseUrl: string,
    anonKey: string,
    games: Game[],
    media: MediaItem[],
    playlists: MediaPlaylist[] = [],
    systemSettings?: {
      gameTags?: string[];
      movieTags?: string[];
      musicTags?: string[];
      podcastTags?: string[];
      bannerSettings?: any;
      globalActionButtons?: any;
      adminPinHash?: string;
      adminPinSalt?: string;
    }
  ): Promise<{ success: boolean; message: string; count: number }> {
    const test = await this.testConnection(supabaseUrl, anonKey);
    if (!test.success) {
      throw new Error(test.message);
    }

    let gameCount = 0;
    for (const game of games) {
      if (game.coverPath && !game.coverPath.startsWith('http')) {
        game.coverPath = (await this.uploadLocalImage(supabaseUrl, anonKey, game.coverPath, 'covers')) || game.coverPath;
      }
      if (game.bannerPath && !game.bannerPath.startsWith('http')) {
        game.bannerPath = (await this.uploadLocalImage(supabaseUrl, anonKey, game.bannerPath, 'banners')) || game.bannerPath;
      }
      const ok = await this.upsertGame(supabaseUrl, anonKey, game);
      if (ok) gameCount++;
    }

    let mediaCount = 0;
    for (const item of media) {
      if (item.coverPath && !item.coverPath.startsWith('http')) {
        item.coverPath = (await this.uploadLocalImage(supabaseUrl, anonKey, item.coverPath, 'covers')) || item.coverPath;
      }
      if (item.bannerPath && !item.bannerPath.startsWith('http')) {
        item.bannerPath = (await this.uploadLocalImage(supabaseUrl, anonKey, item.bannerPath, 'banners')) || item.bannerPath;
      }
      const ok = await this.upsertMediaItem(supabaseUrl, anonKey, item);
      if (ok) mediaCount++;
    }

    // Strict Segregation: Only upload system playlists, NEVER upload user private/custom playlists
    const systemPlaylists = playlists.filter((p) => !p.isUserCustom && !p.ownerProfileId && p.id !== '__system_catalog_settings__');
    let playlistCount = 0;
    for (const playlist of systemPlaylists) {
      if (playlist.coverPath && !playlist.coverPath.startsWith('http')) {
        playlist.coverPath = (await this.uploadLocalImage(supabaseUrl, anonKey, playlist.coverPath, 'covers')) || playlist.coverPath;
      }
      const ok = await this.upsertPlaylist(supabaseUrl, anonKey, playlist);
      if (ok) playlistCount++;
    }

    // Upload global system settings (tags, banner settings, action buttons)
    if (systemSettings) {
      await this.upsertPlaylist(supabaseUrl, anonKey, {
        id: '__system_catalog_settings__',
        name: '__system_catalog_settings__',
        type: 'video',
        description: JSON.stringify(systemSettings),
        itemIds: [],
        createdAt: new Date().toISOString(),
      });
    }

    return {
      success: true,
      message: `Đã xuất bản thành công ${gameCount} game, ${mediaCount} phim & video, ${playlistCount} playlist hệ thống và cấu hình thể loại/banner lên Cloud!`,
      count: gameCount + mediaCount + playlistCount,
    };
  }

  public async pullCatalog(
    supabaseUrl: string,
    anonKey: string
  ): Promise<{
    games: Game[];
    media: MediaItem[];
    playlists: MediaPlaylist[];
    systemSettings?: any;
    message: string;
  }> {
    const test = await this.testConnection(supabaseUrl, anonKey);
    if (!test.success) {
      throw new Error(test.message);
    }

    const [remoteGames, remoteMedia, remotePlaylists] = await Promise.all([
      this.pullGames(supabaseUrl, anonKey),
      this.pullMedia(supabaseUrl, anonKey),
      this.pullPlaylists(supabaseUrl, anonKey),
    ]);

    const settingsItem = remotePlaylists.find((p) => p.id === '__system_catalog_settings__');
    let systemSettings: any = null;
    if (settingsItem && settingsItem.description) {
      try {
        systemSettings = JSON.parse(settingsItem.description);
      } catch (e) {
        console.warn('Failed to parse system catalog settings:', e);
      }
    }
    const cleanPlaylists = remotePlaylists.filter((p) => p.id !== '__system_catalog_settings__');

    return {
      games: remoteGames,
      media: remoteMedia,
      playlists: cleanPlaylists,
      systemSettings,
      message: `Đã tải về thành công ${remoteGames.length} game và ${remoteMedia.length} phim từ Cloud!`,
    };
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
        if (rg.screenshots && rg.screenshots.length > 0) local.screenshots = rg.screenshots;
        if (rg.coverPosition) local.coverPosition = rg.coverPosition;
        if (rg.coverZoom) local.coverZoom = rg.coverZoom;
        if (rg.coverSharpen !== undefined) local.coverSharpen = rg.coverSharpen;
        if (rg.listCardPosition) local.listCardPosition = rg.listCardPosition;
        if (rg.listCardZoom) local.listCardZoom = rg.listCardZoom;
        if (rg.bannerPosition) local.bannerPosition = rg.bannerPosition;
        if (rg.bannerZoom) local.bannerZoom = rg.bannerZoom;
        if (rg.transform_metadata) local.transform_metadata = rg.transform_metadata;
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
        if (rm.subType) local.subType = rm.subType;
        if (rm.artist) local.artist = rm.artist;
        if (rm.album) local.album = rm.album;
        if (rm.coverPosition) local.coverPosition = rm.coverPosition;
        if (rm.coverZoom) local.coverZoom = rm.coverZoom;
        if (rm.coverSharpen !== undefined) local.coverSharpen = rm.coverSharpen;
        if (rm.listCardPosition) local.listCardPosition = rm.listCardPosition;
        if (rm.listCardZoom) local.listCardZoom = rm.listCardZoom;
        if (rm.bannerPosition) local.bannerPosition = rm.bannerPosition;
        if (rm.bannerZoom) local.bannerZoom = rm.bannerZoom;
        if (rm.transform_metadata) local.transform_metadata = rm.transform_metadata;
      }
    }
    const finalMedia = Array.from(mediaMap.values());

    // C. Sync Playlists Catalog (Strictly shared system playlists only)
    const systemLocalPlaylists = localPlaylists.filter((p) => !p.isUserCustom && !p.ownerProfileId);
    for (const p of systemLocalPlaylists) {
      if (p.coverPath) {
        p.coverPath = await this.uploadLocalImage(supabaseUrl, anonKey, p.coverPath, 'covers');
      }
      await this.upsertPlaylist(supabaseUrl, anonKey, p);
    }
    const remotePlaylists = await this.pullPlaylists(supabaseUrl, anonKey);
    const playlistMap = new Map<string, MediaPlaylist>();
    for (const p of localPlaylists) playlistMap.set(p.id, p);
    for (const rp of remotePlaylists) {
      if (!playlistMap.has(rp.id)) playlistMap.set(rp.id, rp);
    }
    const finalPlaylists = Array.from(playlistMap.values());

    // D. User Profiles & Personal Data: Segregated and kept strictly local
    // Do NOT upload user profiles, PIN hashes, or personal data to Supabase public bucket/tables
    const finalProfiles = localProfiles;
    try {
      const remoteProfiles = await this.pullProfiles(supabaseUrl, anonKey);
      const profileMap = new Map<string, UserProfile>();
      for (const p of finalProfiles) {
        profileMap.set(p.id, p);
      }
      for (const rp of remoteProfiles) {
        if (!profileMap.has(rp.id)) {
          profileMap.set(rp.id, rp);
        } else {
          // Merge remote fields into existing local profile
          const existing = profileMap.get(rp.id)!;
          profileMap.set(rp.id, {
            ...rp,
            ...existing,
            username: existing.username || rp.username,
            passwordHash: existing.passwordHash || rp.passwordHash,
            passwordSalt: existing.passwordSalt || rp.passwordSalt,
            library: Array.from(new Set([...(existing.library || []), ...(rp.library || [])])),
            favoriteMedia: Array.from(new Set([...(existing.favoriteMedia || []), ...(rp.favoriteMedia || [])])),
            watchProgress: { ...(rp.watchProgress || {}), ...(existing.watchProgress || {}) },
          });
        }
      }
      finalProfiles.length = 0;
      finalProfiles.push(...Array.from(profileMap.values()));
    } catch (profileErr) {
      console.warn('Failed to pull profiles during syncAll:', profileErr);
    }

    return {
      updatedProfiles: finalProfiles,
      updatedGames: finalGames,
      updatedMedia: finalMedia,
      updatedPlaylists: finalPlaylists,
      message: `Đồng bộ thành công danh mục dùng chung (${finalGames.length} game, ${finalMedia.length} phim/media, ${finalPlaylists.length} playlists, ${finalProfiles.length} tài khoản)!`,
    };
  }
}
