import type { Game, MediaItem, MediaPlaylist, UserProfile, AppData, CloudSyncSettings } from '../types';
import type { DeviceType } from '../utils/deviceDetector';

export const DEFAULT_SUPABASE_URL = 'https://wqmmagfrwwctvipopazx.supabase.co';
export const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_l1vNbLKXXhLNnfi1pI5UnQ_0EaqbXuJ';

/**
 * Mã PIN Admin gốc / dự phòng (PIN_PRI) - Bất biến trên toàn bộ hệ thống
 */
export const ADMIN_PIN_PRI = '42336737';

export const META_REGEX = /<!--ICELAUCH_META:([\s\S]*?)-->/;

/**
 * Gói metadata (screenshots, image crop/zoom/position) vào description để đồng bộ Cloud an toàn
 */
export function encodeDescriptionMetadata(
  cleanDesc: string = '',
  meta: Record<string, any>
): string {
  const descWithoutMeta = (cleanDesc || '').replace(META_REGEX, '').trim();
  const validKeys = Object.keys(meta).filter((k) => meta[k] !== undefined && meta[k] !== null);
  if (validKeys.length === 0) {
    return descWithoutMeta;
  }
  const cleanMeta: Record<string, any> = {};
  for (const k of validKeys) {
    cleanMeta[k] = meta[k];
  }
  const metaStr = `<!--ICELAUCH_META:${JSON.stringify(cleanMeta)}-->`;
  return descWithoutMeta ? `${descWithoutMeta}\n${metaStr}` : metaStr;
}

/**
 * Giải mã description và trích xuất metadata (screenshots, crop, zoom, v.v.)
 */
export function decodeDescriptionMetadata(rawDesc: string = ''): {
  description: string;
  meta: Record<string, any>;
} {
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

export const STORAGE_KEY_APP_DATA = 'icelauch_cached_app_data';
export const STORAGE_KEY_PROFILES = 'icelauch_cached_profiles';
export const STORAGE_KEY_ACTIVE_PROFILE_ID = 'icelauch_active_profile_id';
export const STORAGE_KEY_REMEMBERED_PROFILE_ID = 'icelauch_remembered_profile_id';
export const STORAGE_KEY_DEVICE_PREF = 'icelauch_device_preference';
export const STORAGE_KEY_DEVICE_PROMPTED = 'icelauch_device_prompted';

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
  // If running in Desktop Electron, ALWAYS return windows_pc
  if (isElectron()) {
    return 'windows_pc';
  }
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
  // Do not store mobile/tv preferences on Desktop Electron
  if (isElectron()) return;
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
  systemSettings?: any;
}> {
  const headers = {
    apikey: anonKey,
    Authorization: `Bearer ${anonKey}`,
  };

  try {
    const [gamesRes, mediaRes, profilesRes, playlistsRes, userDataRes] = await Promise.all([
      fetch(`${supabaseUrl}/rest/v1/icelauch_games?select=*&order=updated_at.desc`, { headers }),
      fetch(`${supabaseUrl}/rest/v1/icelauch_media?select=*&order=updated_at.desc`, { headers }),
      fetch(`${supabaseUrl}/rest/v1/icelauch_profiles?select=*&order=created_at.asc`, { headers }),
      fetch(`${supabaseUrl}/rest/v1/icelauch_playlists?select=*&order=updated_at.desc`, { headers }),
      fetch(`${supabaseUrl}/rest/v1/icelauch_user_data?select=*`, { headers }),
    ]);

    const rawGames = gamesRes.ok ? await gamesRes.json() : [];
    const rawMedia = mediaRes.ok ? await mediaRes.json() : [];
    const rawProfiles = profilesRes.ok ? await profilesRes.json() : [];
    const rawPlaylists = playlistsRes.ok ? await playlistsRes.json() : [];
    const rawUserData = userDataRes.ok ? await userDataRes.json() : [];

    const userDataMap = new Map<string, any>();
    (rawUserData || []).forEach((u: any) => {
      if (u && u.profile_id) userDataMap.set(u.profile_id, u);
    });

    // Map database snake_case to frontend camelCase & decode metadata envelope
    const games: Game[] = (rawGames || []).map((row: any) => {
      const decoded = decodeDescriptionMetadata(row.description);
      const meta = decoded.meta || {};
      return {
        id: row.id,
        name: cleanQuestionMarks(row.name),
        driveUrl: row.drive_url || '',
        downloadLinks: row.drive_url ? [{ name: 'Google Drive', url: row.drive_url, speedRating: 'fast' }] : [],
        trailerUrl: row.trailer_url,
        bannerPath: row.banner_url,
        coverPath: row.cover_url,
        description: cleanQuestionMarks(decoded.description),
        category: cleanQuestionMarks(row.category),
        genre: cleanQuestionMarks(row.genre),
        tags: Array.isArray(row.tags) ? row.tags.map((t: string) => cleanQuestionMarks(t)) : [],
        actionButtonIds: Array.isArray(row.action_buttons) ? row.action_buttons : [],
        featured: row.featured ?? false,
        releaseYear: row.release_year,
        developer: row.developer,
        expectedSize: row.file_size ? Number(row.file_size) : undefined,
        installed: false,
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
        transform_metadata: row.transform_metadata || meta.transform_metadata || undefined,
      };
    });

    const media: MediaItem[] = (rawMedia || []).map((row: any) => {
      const decoded = decodeDescriptionMetadata(row.description);
      const meta = decoded.meta || {};
      return {
        id: row.id,
        title: cleanQuestionMarks(row.title),
        type: (row.type as 'video' | 'audio') || 'video',
        subType: meta.subType || (row.type === 'audio' ? 'music' : undefined),
        artist: meta.artist,
        album: meta.album,
        link: row.link || '',
        coverPath: row.cover_path,
        bannerPath: row.banner_path,
        description: cleanQuestionMarks(decoded.description),
        category: cleanQuestionMarks(row.category),
        tags: Array.isArray(row.tags) ? row.tags.map((t: string) => cleanQuestionMarks(t)) : [],
        duration: row.duration || 0,
        isBannerPinned: row.is_banner_pinned ?? false,
        watched: false,
        lastPosition: 0,
        addedAt: row.updated_at || new Date().toISOString(),
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
        transform_metadata: row.transform_metadata || meta.transform_metadata || undefined,
      };
    });

    const profiles: UserProfile[] = (rawProfiles || [])
      .filter((row: any) => row.id !== 'icedrop_cloud_hub' && row.id !== 'icelauch_device_registry' && !String(row.id).startsWith('icelauch_'))
      .map((row: any) => {
        const udata = userDataMap.get(row.id);
        const gs = udata?.game_stats || {};
        return {
          id: row.id,
          username: gs.username || row.nickname?.toLowerCase().replace(/\s+/g, ''),
          nickname: row.nickname,
          avatar: row.avatar || 'avatar_1',
          role: gs.role || 'user',
          pinHash: row.pin_hash || '',
          passwordHash: gs.passwordHash,
          passwordSalt: gs.passwordSalt,
          requiresPasswordReset: gs.requiresPasswordReset,
          bannedUntil: gs.bannedUntil,
          banReason: gs.banReason,
          createdDate: row.created_at,
          lastActiveDate: row.last_active,
          library: Array.isArray(udata?.library) ? udata.library : [],
          favoriteMedia: Array.isArray(udata?.favorite_media) ? udata.favorite_media : [],
          favoritePlaylists: Array.isArray(gs.favoritePlaylists) ? gs.favoritePlaylists : [],
          customPlaylists: Array.isArray(gs.customPlaylists) ? gs.customPlaylists : [],
          watchProgress: udata?.watch_progress || {},
          gameStats: gs,
        };
      });

    // Extract system catalog settings (tags, banner settings)
    const settingsItem = (rawPlaylists || []).find((p: any) => p.id === '__system_catalog_settings__');
    let systemSettings: any = null;
    if (settingsItem && settingsItem.description) {
      try {
        let cleanDesc = settingsItem.description || '';
        const metaRegex = /^__META:.*?__\r?\n/;
        while (metaRegex.test(cleanDesc)) {
          cleanDesc = cleanDesc.replace(metaRegex, '');
        }
        systemSettings = JSON.parse(cleanDesc);
      } catch (e) {
        console.warn('Failed to parse system catalog settings in cloud:', e);
      }
    }
    const filteredPlaylists = (rawPlaylists || []).filter((p: any) => p.id !== '__system_catalog_settings__');

    const playlists: MediaPlaylist[] = filteredPlaylists.map((row: any) => ({
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
      if (systemSettings) {
        localStorage.setItem('icelauch_system_settings', JSON.stringify(systemSettings));
      }
    } catch (e) {
      console.warn('Could not cache to localStorage:', e);
    }

    return { games, media, profiles, playlists, systemSettings };
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

/**
 * Cross-platform Admin PIN verification (Electron + Mobile Capacitor/Web)
 */
export async function verifyAdminPin(pin: string): Promise<boolean> {
  if (!pin && (pin as any) !== 0) return false;
  const cleanPin = typeof pin === 'string' ? pin.trim() : String(pin || '').trim();

  // 1. Electron IPC check if available
  if (isElectron() && (window as any).api?.verifyPin) {
    return (window as any).api.verifyPin(cleanPin);
  }

  // 2. Master PIN Admin dự phòng (bất biến, luôn mở được mọi thiết bị)
  if (cleanPin === ADMIN_PIN_PRI) {
    return true;
  }

  // Mobile / Web verification
  try {
    const DEFAULT_INIT_HASH = '9ad350ea4bb56920e2694e958be3f47af530c358f985d29bedafded954bee082';
    const default1234 = '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4';
    const default123456 = '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92';

    let hasCustomPin = false;

    // 3. Kiểm tra mã PIN đồng bộ từ settings (PBKDF2 với salt)
    let sysPinHash: string | undefined;
    let sysPinSalt: string | undefined;

    const rawSys = localStorage.getItem('icelauch_system_settings');
    if (rawSys) {
      try {
        const parsed = JSON.parse(rawSys);
        sysPinHash = parsed.pinHash || parsed.adminPinHash;
        sysPinSalt = parsed.pinSalt || parsed.adminPinSalt;
      } catch {}
    }

    if (!sysPinHash) {
      const cachedAppStr = localStorage.getItem(STORAGE_KEY_APP_DATA);
      if (cachedAppStr) {
        try {
          const parsed = JSON.parse(cachedAppStr);
          if (parsed.settings?.pinHash && parsed.settings?.pinSalt) {
            sysPinHash = parsed.settings.pinHash;
            sysPinSalt = parsed.settings.pinSalt;
          }
        } catch {}
      }
    }

    if (sysPinHash && sysPinSalt) {
      if (sysPinHash !== DEFAULT_INIT_HASH) {
        hasCustomPin = true;
      }
      try {
        const enc = new TextEncoder();
        const keyMaterial = await crypto.subtle.importKey(
          'raw',
          enc.encode(cleanPin),
          { name: 'PBKDF2' },
          false,
          ['deriveBits']
        );
        const saltBuf = new Uint8Array(
          sysPinSalt.match(/.{1,2}/g)?.map((byte) => parseInt(byte, 16)) || []
        );
        const derivedBits = await crypto.subtle.deriveBits(
          {
            name: 'PBKDF2',
            salt: saltBuf,
            iterations: 10000,
            hash: 'SHA-256',
          },
          keyMaterial,
          256
        );
        const computed = Array.from(new Uint8Array(derivedBits))
          .map((b) => b.toString(16).padStart(2, '0'))
          .join('');
        if (computed === sysPinHash) {
          return true;
        }
      } catch (pbkdfErr) {
        console.warn('PBKDF2 check failed:', pbkdfErr);
      }
    }

    // 4. Kiểm tra tài khoản Profile Admin hoặc local hash
    const cachedProfilesStr = localStorage.getItem(STORAGE_KEY_PROFILES);
    let targetPinHash: string | undefined;

    if (cachedProfilesStr) {
      try {
        const profiles: UserProfile[] = JSON.parse(cachedProfilesStr);
        const adminProf = profiles.find((p) => p.role === 'admin' || (p.pinHash && !p.passwordHash));
        if (adminProf?.pinHash) {
          targetPinHash = adminProf.pinHash;
        }
      } catch {}
    }

    if (!targetPinHash) {
      targetPinHash = localStorage.getItem('icelauch_admin_pin_hash') || undefined;
    }

    if (targetPinHash) {
      if (targetPinHash !== default1234 && targetPinHash !== default123456) {
        hasCustomPin = true;
      }
      const encoder = new TextEncoder();
      const data = encoder.encode(cleanPin);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const inputHash = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

      if (inputHash === targetPinHash) {
        return true;
      }
    }

    // 5. Fallback: chỉ chấp nhận mã PIN mặc định '1234' hoặc '123456' nếu CHƯA cấu hình PIN tùy chỉnh
    if (!hasCustomPin) {
      if (cleanPin === '1234' || cleanPin === '123456') {
        return true;
      }
    }

    return false;
  } catch (err) {
    console.error('Error in mobile verifyAdminPin:', err);
    return cleanPin === ADMIN_PIN_PRI;
  }
}

export async function setAdminPinMobile(pin: string): Promise<{ success: boolean; recoveryKey: string }> {
  try {
    const encoder = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(pin));
    const inputHash = Array.from(new Uint8Array(hashBuffer)).map((b) => b.toString(16).padStart(2, '0')).join('');
    localStorage.setItem('icelauch_admin_pin_hash', inputHash);
    const recoveryKey = `ICE-KEY-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`;
    localStorage.setItem('icelauch_admin_recovery_key', recoveryKey);
    return { success: true, recoveryKey };
  } catch (e) {
    return { success: false, recoveryKey: '' };
  }
}

