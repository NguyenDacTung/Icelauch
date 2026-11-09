import https from 'https';
import http from 'http';
import { URL } from 'url';
import type { UserProfile, CloudSyncSettings } from '../../renderer/src/types';

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
            timeout: 10000,
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
          reject(new Error('Yêu cầu tới Supabase bị quá thời gian chờ (10s)'));
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
          message: 'Kết nối Supabase thành công! Bảng icelauch_profiles sẵn sàng.',
        };
      } else if (res.status === 404 || (res.data && res.data.message && res.data.message.includes('relation "public.icelauch_profiles" does not exist'))) {
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
   * Pull all profiles from Supabase Cloud
   */
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

  /**
   * Pull user data (library, watch progress, favorites) for a profile
   */
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

  /**
   * Upsert a profile into Supabase
   */
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

  /**
   * Upsert user personalized data into Supabase
   */
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

  /**
   * Full 2-Way Sync between Local and Supabase
   */
  public async syncAll(
    supabaseUrl: string,
    anonKey: string,
    localProfiles: UserProfile[]
  ): Promise<{ updatedProfiles: UserProfile[]; message: string }> {
    const test = await this.testConnection(supabaseUrl, anonKey);
    if (!test.success) {
      throw new Error(test.message);
    }

    // 1. Pull remote profiles
    const remoteProfiles = await this.pullProfiles(supabaseUrl, anonKey);
    const mergedMap = new Map<string, UserProfile>();

    // Put local profiles into map
    for (const lp of localProfiles) {
      mergedMap.set(lp.id, { ...lp });
    }

    // Process remote profiles
    for (const rp of remoteProfiles) {
      const local = mergedMap.get(rp.id);
      if (!local) {
        // New profile from another device! Pull its data
        const userData = await this.pullUserData(supabaseUrl, anonKey, rp.id);
        mergedMap.set(rp.id, {
          ...rp,
          library: userData?.library || [],
          watchProgress: userData?.watchProgress || {},
          favoriteMedia: userData?.favoriteMedia || [],
          gameStats: userData?.gameStats || {},
        });
      } else {
        // Exists on both sides: check last active and merge
        const localActive = new Date(local.lastActiveDate || 0).getTime();
        const remoteActive = new Date(rp.lastActiveDate || 0).getTime();

        if (remoteActive > localActive) {
          // Remote is newer, update basic metadata & fetch newer user data
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

    // 2. Push all merged profiles and their user data back to cloud
    const finalProfiles = Array.from(mergedMap.values());
    for (const prof of finalProfiles) {
      await this.upsertProfile(supabaseUrl, anonKey, prof);
      await this.upsertUserData(supabaseUrl, anonKey, prof);
    }

    return {
      updatedProfiles: finalProfiles,
      message: `Đồng bộ thành công ${finalProfiles.length} hồ sơ với Supabase Cloud`,
    };
  }
}

