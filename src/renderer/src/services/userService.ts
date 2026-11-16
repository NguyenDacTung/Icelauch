import { DEFAULT_SUPABASE_URL, DEFAULT_SUPABASE_ANON_KEY } from './platformAdapter';
import type { UserProfile } from '../types';

/**
 * Service for syncing private user profile and user data (library, watch progress,
 * favorites, personal playlists) with Supabase Cloud on Mobile and Web platforms.
 */
export class UserService {
  private static cleanUrl(url: string = DEFAULT_SUPABASE_URL): string {
    return url.replace(/\/+$/, '');
  }

  private static getHeaders(anonKey: string = DEFAULT_SUPABASE_ANON_KEY): Record<string, string> {
    return {
      'apikey': anonKey,
      'Authorization': `Bearer ${anonKey}`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Save / Upsert user profile & user data to Supabase
   */
  public static async saveUserProfileToCloud(
    profile: UserProfile,
    supabaseUrl: string = DEFAULT_SUPABASE_URL,
    anonKey: string = DEFAULT_SUPABASE_ANON_KEY
  ): Promise<boolean> {
    try {
      const baseUrl = this.cleanUrl(supabaseUrl);
      const headers = this.getHeaders(anonKey);

      // 1. Upsert to icelauch_profiles
      const profilePayload = {
        id: profile.id,
        nickname: profile.nickname,
        avatar: profile.avatar || 'avatar_1',
        pin_hash: profile.pinHash || '',
        last_active: profile.lastActiveDate || new Date().toISOString(),
      };

      const profRes = await fetch(`${baseUrl}/rest/v1/icelauch_profiles`, {
        method: 'POST',
        headers: {
          ...headers,
          'Prefer': 'resolution=merge-duplicates',
        },
        body: JSON.stringify(profilePayload),
      });

      if (!profRes.ok) {
        console.warn('[UserService] Failed to upsert profile:', await profRes.text());
      }

      // 2. Upsert to icelauch_user_data
      const userDataPayload = {
        profile_id: profile.id,
        library: profile.library || [],
        watch_progress: profile.watchProgress || {},
        favorite_media: profile.favoriteMedia || [],
        game_stats: {
          ...(profile.gameStats || {}),
          username: profile.username ? profile.username.trim().toLowerCase() : undefined,
          role: profile.role || 'user',
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

      const dataRes = await fetch(`${baseUrl}/rest/v1/icelauch_user_data`, {
        method: 'POST',
        headers: {
          ...headers,
          'Prefer': 'resolution=merge-duplicates',
        },
        body: JSON.stringify(userDataPayload),
      });

      return dataRes.ok;
    } catch (err) {
      console.error('[UserService] saveUserProfileToCloud error:', err);
      return false;
    }
  }

  /**
   * Fetch full user private data (library, watch progress, favorites, custom playlists)
   */
  public static async fetchUserDataFromCloud(
    profileId: string,
    supabaseUrl: string = DEFAULT_SUPABASE_URL,
    anonKey: string = DEFAULT_SUPABASE_ANON_KEY
  ): Promise<Partial<UserProfile> | null> {
    try {
      const baseUrl = this.cleanUrl(supabaseUrl);
      const headers = this.getHeaders(anonKey);

      const endpoint = `${baseUrl}/rest/v1/icelauch_user_data?profile_id=eq.${encodeURIComponent(profileId)}&select=*`;
      const res = await fetch(endpoint, { method: 'GET', headers });

      if (res.ok) {
        const rows = await res.json();
        if (Array.isArray(rows) && rows.length > 0) {
          const row = rows[0];
          const gs = row.game_stats || {};
          return {
            library: Array.isArray(row.library) ? row.library : [],
            watchProgress: row.watch_progress || {},
            favoriteMedia: Array.isArray(row.favorite_media) ? row.favorite_media : [],
            favoritePlaylists: Array.isArray(gs.favoritePlaylists) ? gs.favoritePlaylists : [],
            customPlaylists: Array.isArray(gs.customPlaylists) ? gs.customPlaylists : [],
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
      }
      return null;
    } catch (err) {
      console.warn('[UserService] fetchUserDataFromCloud error:', err);
      return null;
    }
  }

  /**
   * Update personal game library in cloud
   */
  public static async syncUserLibraryToCloud(
    profileId: string,
    library: string[],
    supabaseUrl: string = DEFAULT_SUPABASE_URL,
    anonKey: string = DEFAULT_SUPABASE_ANON_KEY
  ): Promise<boolean> {
    try {
      const baseUrl = this.cleanUrl(supabaseUrl);
      const headers = this.getHeaders(anonKey);

      const res = await fetch(`${baseUrl}/rest/v1/icelauch_user_data?profile_id=eq.${encodeURIComponent(profileId)}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          library,
          updated_at: new Date().toISOString(),
        }),
      });

      return res.ok;
    } catch (err) {
      console.warn('[UserService] syncUserLibraryToCloud error:', err);
      return false;
    }
  }

  /**
   * Update personal favorite media in cloud
   */
  public static async syncUserFavoritesToCloud(
    profileId: string,
    favoriteMedia: string[],
    supabaseUrl: string = DEFAULT_SUPABASE_URL,
    anonKey: string = DEFAULT_SUPABASE_ANON_KEY
  ): Promise<boolean> {
    try {
      const baseUrl = this.cleanUrl(supabaseUrl);
      const headers = this.getHeaders(anonKey);

      const res = await fetch(`${baseUrl}/rest/v1/icelauch_user_data?profile_id=eq.${encodeURIComponent(profileId)}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          favorite_media: favoriteMedia,
          updated_at: new Date().toISOString(),
        }),
      });

      return res.ok;
    } catch (err) {
      console.warn('[UserService] syncUserFavoritesToCloud error:', err);
      return false;
    }
  }

  /**
   * Check if a username is available across Supabase accounts to prevent collisions
   */
  public static async checkUsernameAvailable(
    username: string,
    excludeProfileId?: string,
    supabaseUrl: string = DEFAULT_SUPABASE_URL,
    anonKey: string = DEFAULT_SUPABASE_ANON_KEY
  ): Promise<{ available: boolean; existingProfileId?: string }> {
    try {
      const cleanUsername = username.trim().toLowerCase();
      if (!cleanUsername) return { available: false };

      const baseUrl = this.cleanUrl(supabaseUrl);
      const headers = this.getHeaders(anonKey);

      // Check icelauch_user_data for registered usernames
      const res = await fetch(`${baseUrl}/rest/v1/icelauch_user_data?select=profile_id,game_stats`, {
        method: 'GET',
        headers,
      });

      if (res.ok) {
        const rows = await res.json();
        for (const row of rows || []) {
          if (row.profile_id === excludeProfileId) continue;
          const uname = row.game_stats?.username ? String(row.game_stats.username).toLowerCase() : '';
          if (uname === cleanUsername) {
            return { available: false, existingProfileId: row.profile_id };
          }
        }
      }

      return { available: true };
    } catch (err) {
      console.warn('[UserService] checkUsernameAvailable error:', err);
      return { available: true };
    }
  }
}
