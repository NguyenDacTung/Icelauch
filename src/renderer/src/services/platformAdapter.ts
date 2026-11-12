import type { Game, MediaItem, MediaPlaylist, UserProfile, AppData, CloudSyncSettings } from '../types';
import type { DeviceType } from '../utils/deviceDetector';

export const DEFAULT_SUPABASE_URL = 'https://wqmmagfrwwctvipopazx.supabase.co';
export const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_l1vNbLKXXhLNnfi1pI5UnQ_0EaqbXuJ';

const STORAGE_KEY_APP_DATA = 'icelauch_cached_app_data';
const STORAGE_KEY_PROFILES = 'icelauch_cached_profiles';
const STORAGE_KEY_ACTIVE_PROFILE_ID = 'icelauch_active_profile_id';
const STORAGE_KEY_DEVICE_PREF = 'icelauch_device_preference';
const STORAGE_KEY_DEVICE_PROMPTED = 'icelauch_device_prompted';

export function isElectron(): boolean {
  return typeof window !== 'undefined' && Boolean((window as any).api);
}

export function isAndroidPlatform(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  const isAndroidUA = /Android/i.test(ua);
  const isCapacitor = Boolean((window as any).Capacitor);
  return (isAndroidUA || isCapacitor) && !isElectron();
}

export function getStoredDevicePreference(): DeviceType | null {
  try {
    const val = localStorage.getItem(STORAGE_KEY_DEVICE_PREF);
    if (val === 'android_tv' || val === 'android_mobile' || val === 'windows_pc') {
      return val as DeviceType;
    }
  } catch (e) {
    console.error('Error reading device preference:', e);
  }
  return null;
}

export function setStoredDevicePreference(device: DeviceType): void {
  try {
    localStorage.setItem(STORAGE_KEY_DEVICE_PREF, device);
    localStorage.setItem(STORAGE_KEY_DEVICE_PROMPTED, 'true');
  } catch (e) {
    console.error('Error saving device preference:', e);
  }
}

export function hasPromptedDeviceChoice(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY_DEVICE_PROMPTED) === 'true';
  } catch {
    return false;
  }
}

export function cleanQuestionMarks(text?: string): string {
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

/**
 * Direct REST API fetch from Supabase Cloud for Android & Web clients
 */
export async function fetchDirectCloudCatalog(
  supabaseUrl: string = DEFAULT_SUPABASE_URL,
  anonKey: string = DEFAULT_SUPABASE_ANON_KEY
): Promise<{
  games: Game[];
  media: MediaItem[];
  profiles: UserProfile[];
  playlists: MediaPlaylist[];
}> {
  const headers = {
    apikey: anonKey,
    Authorization: `Bearer ${anonKey}`,
  };

  try {
    const [gamesRes, mediaRes, profilesRes, playlistsRes] = await Promise.all([
      fetch(`${supabaseUrl}/rest/v1/icelauch_games?select=*&order=updated_at.desc`, { headers }),
      fetch(`${supabaseUrl}/rest/v1/icelauch_media?select=*&order=updated_at.desc`, { headers }),
      fetch(`${supabaseUrl}/rest/v1/icelauch_profiles?select=*&order=last_active.desc`, { headers }),
      fetch(`${supabaseUrl}/rest/v1/icelauch_playlists?select=*&order=updated_at.desc`, { headers }),
    ]);

    const rawGames = gamesRes.ok ? await gamesRes.json() : [];
    const rawMedia = mediaRes.ok ? await mediaRes.json() : [];
    const rawProfiles = profilesRes.ok ? await profilesRes.json() : [];
    const rawPlaylists = playlistsRes.ok ? await playlistsRes.json() : [];

    // Map database snake_case to frontend camelCase
    const games: Game[] = (rawGames || []).map((row: any) => ({
      id: row.id,
      name: cleanQuestionMarks(row.name),
      driveUrl: row.drive_url || '',
      downloadLinks: row.drive_url ? [{ name: 'Google Drive', url: row.drive_url, speedRating: 'fast' }] : [],
      trailerUrl: row.trailer_url,
      bannerPath: row.banner_url,
      coverPath: row.cover_url,
      description: cleanQuestionMarks(row.description),
      category: cleanQuestionMarks(row.category),
      genre: cleanQuestionMarks(row.genre),
      tags: Array.isArray(row.tags) ? row.tags.map((t: string) => cleanQuestionMarks(t)) : [],
      actionButtonIds: Array.isArray(row.action_buttons) ? row.action_buttons : [],
      featured: row.featured ?? false,
      releaseYear: row.release_year,
      developer: row.developer,
      expectedSize: row.file_size ? Number(row.file_size) : undefined,
      installed: false,
    }));

    const media: MediaItem[] = (rawMedia || []).map((row: any) => ({
      id: row.id,
      title: cleanQuestionMarks(row.title),
      type: (row.type as 'video' | 'audio') || 'video',
      link: row.link || '',
      coverPath: row.cover_path,
      bannerPath: row.banner_path,
      description: cleanQuestionMarks(row.description),
      category: cleanQuestionMarks(row.category),
      tags: Array.isArray(row.tags) ? row.tags.map((t: string) => cleanQuestionMarks(t)) : [],
      duration: row.duration || 0,
      isBannerPinned: row.is_banner_pinned ?? false,
      watched: false,
      lastPosition: 0,
      addedAt: row.updated_at || new Date().toISOString(),
    }));

    const profiles: UserProfile[] = (rawProfiles || []).map((row: any) => ({
      id: row.id,
      nickname: row.nickname,
      avatar: row.avatar || 'avatar_1',
      pinHash: row.pin_hash,
      createdDate: row.created_at,
      lastActiveDate: row.last_active,
      library: [],
      favoriteMedia: [],
      watchProgress: {},
    }));

    const playlists: MediaPlaylist[] = (rawPlaylists || []).map((row: any) => ({
      id: row.id,
      title: row.title,
      name: row.title,
      description: row.description,
      coverPath: row.cover_path,
      itemIds: Array.isArray(row.item_ids) ? row.item_ids : [],
      createdAt: row.updated_at || new Date().toISOString(),
    }));

    // Cache to localStorage
    try {
      localStorage.setItem(STORAGE_KEY_APP_DATA, JSON.stringify({ games, media, playlists }));
      localStorage.setItem(STORAGE_KEY_PROFILES, JSON.stringify(profiles));
    } catch (e) {
      console.warn('Could not cache to localStorage:', e);
    }

    return { games, media, profiles, playlists };
  } catch (err) {
    console.error('Failed to fetch from Supabase REST API:', err);
    // Return cached data if available
    try {
      const cachedData = localStorage.getItem(STORAGE_KEY_APP_DATA);
      const cachedProfiles = localStorage.getItem(STORAGE_KEY_PROFILES);
      if (cachedData) {
        const parsed = JSON.parse(cachedData);
        return {
          games: parsed.games || [],
          media: parsed.media || [],
          playlists: parsed.playlists || [],
          profiles: cachedProfiles ? JSON.parse(cachedProfiles) : [],
        };
      }
    } catch (e) {
      console.error('Failed to parse cache:', e);
    }

    return { games: [], media: [], profiles: [], playlists: [] };
  }
}

