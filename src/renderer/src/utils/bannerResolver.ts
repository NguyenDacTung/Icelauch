import type { 
  Game, 
  MediaItem, 
  SectionBannerSettings, 
  AppBannerSettings, 
  BannerItemConfig 
} from '../types';

export interface ResolvedBannerItem<T = Game | MediaItem> {
  item: T;
  isPinned: boolean;
  isPermanent: boolean;
  isNew: boolean;
  daysRemaining?: number;
  badgeText: string;
  badgeType: 'pinned' | 'new' | 'popular' | 'random';
}

export const DEFAULT_SECTION_BANNER_SETTINGS: SectionBannerSettings = {
  maxBanners: 5,
  defaultExpiryDays: 7,
  autoAddNew: true,
  fallbackMode: 'views_then_random',
  autoSlideIntervalSeconds: 7,
  pinnedItems: [],
};

export const DEFAULT_APP_BANNER_SETTINGS: AppBannerSettings = {
  games: { ...DEFAULT_SECTION_BANNER_SETTINGS },
  videos: { ...DEFAULT_SECTION_BANNER_SETTINGS },
  music: { ...DEFAULT_SECTION_BANNER_SETTINGS },
  podcasts: { ...DEFAULT_SECTION_BANNER_SETTINGS },
};

/**
 * Clean up expired items and enforce FIFO when exceeding maxBanners.
 * Permanent items are never evicted by FIFO.
 */
export function sanitizePinnedItems(
  pinnedItems: BannerItemConfig[],
  maxBanners: number
): BannerItemConfig[] {
  const now = new Date().getTime();

  // 1. Filter out expired items (unless permanent)
  const validItems = pinnedItems.filter((p) => {
    if (p.isPermanent) return true;
    if (!p.expiresAt) return true;
    const expiry = new Date(p.expiresAt).getTime();
    return expiry > now;
  });

  // 2. If valid items exceed maxBanners, apply FIFO eviction to oldest non-permanent items
  if (validItems.length <= maxBanners) {
    return validItems;
  }

  // Count how many we need to evict
  let toEvict = validItems.length - maxBanners;
  const result: BannerItemConfig[] = [];

  // Sort candidate non-permanent by pinnedAt ascending (oldest first)
  const nonPermanentIds = new Set(
    validItems
      .filter((p) => !p.isPermanent)
      .sort((a, b) => new Date(a.pinnedAt).getTime() - new Date(b.pinnedAt).getTime())
      .slice(0, toEvict)
      .map((p) => p.id)
  );

  for (const item of validItems) {
    if (nonPermanentIds.has(item.id)) {
      continue; // Evicted
    }
    result.push(item);
  }

  return result;
}

/**
 * Resolves the final list of Banner items for any section
 */
export function resolveBannerItems<T extends { id: string; hidden?: boolean; viewCount?: number; playTimeMinutes?: number; addedAt?: string; title?: string; name?: string }>(
  sectionSettings: SectionBannerSettings | undefined,
  allItems: T[],
  targetType: 'game' | 'media'
): ResolvedBannerItem<T>[] {
  const settings = sectionSettings || DEFAULT_SECTION_BANNER_SETTINGS;
  const maxSlots = Math.max(1, Math.min(10, settings.maxBanners || 5));
  const now = new Date().getTime();

  // Filter visible items
  const visibleItems = allItems.filter((item) => !item.hidden);
  if (visibleItems.length === 0) return [];

  const itemMap = new Map<string, T>();
  visibleItems.forEach((item) => itemMap.set(item.id, item));

  // Sanitize pinned list
  const sanitizedPinned = sanitizePinnedItems(settings.pinnedItems || [], maxSlots);
  const resolved: ResolvedBannerItem<T>[] = [];
  const usedIds = new Set<string>();

  // 1. Process Pinned / Featured Items
  for (const config of sanitizedPinned) {
    const item = itemMap.get(config.id);
    if (!item) continue;

    let daysRemaining: number | undefined;
    let isNew = false;

    if (config.expiresAt && !config.isPermanent) {
      const msLeft = new Date(config.expiresAt).getTime() - now;
      daysRemaining = Math.max(1, Math.ceil(msLeft / (1000 * 60 * 60 * 24)));
      isNew = true;
    }

    let badgeText = 'NỔI BẬT & ĐỀ XUẤT';
    let badgeType: 'pinned' | 'new' | 'popular' | 'random' = 'pinned';

    if (config.isPermanent) {
      badgeText = 'GHIM NỔI BẬT';
      badgeType = 'pinned';
    } else if (daysRemaining !== undefined) {
      badgeText = `MỚI & NỔI BẬT (${daysRemaining} NGÀY)`;
      badgeType = 'new';
    }

    resolved.push({
      item,
      isPinned: true,
      isPermanent: Boolean(config.isPermanent),
      isNew,
      daysRemaining,
      badgeText,
      badgeType,
    });
    usedIds.add(item.id);

    if (resolved.length >= maxSlots) break;
  }

  // 2. If slots are still available, fallback fill
  const remainingSlots = maxSlots - resolved.length;
  if (remainingSlots > 0) {
    const candidates = visibleItems.filter((item) => !usedIds.has(item.id));

    if (settings.fallbackMode === 'views_only' || settings.fallbackMode === 'views_then_random') {
      // Sort by popularity (viewCount or playTimeMinutes or addedAt)
      const sortedByPopularity = [...candidates].sort((a, b) => {
        const scoreA = (a.viewCount || 0) * 2 + (a.playTimeMinutes || 0);
        const scoreB = (b.viewCount || 0) * 2 + (b.playTimeMinutes || 0);
        if (scoreB !== scoreA) return scoreB - scoreA;
        return new Date(b.addedAt || 0).getTime() - new Date(a.addedAt || 0).getTime();
      });

      const takeCount = Math.min(remainingSlots, sortedByPopularity.length);
      for (let i = 0; i < takeCount; i++) {
        const item = sortedByPopularity[i];
        const isPopular = (item.viewCount || 0) > 0 || (item.playTimeMinutes || 0) > 0;
        resolved.push({
          item,
          isPinned: false,
          isPermanent: false,
          isNew: false,
          badgeText: isPopular ? 'PHỔ BIẾN & XEM NHIỀU' : 'GỢI Ý HÔM NAY',
          badgeType: isPopular ? 'popular' : 'random',
        });
        usedIds.add(item.id);
      }
    } else {
      // random_only
      const shuffled = [...candidates].sort(() => 0.5 - Math.random());
      const takeCount = Math.min(remainingSlots, shuffled.length);
      for (let i = 0; i < takeCount; i++) {
        const item = shuffled[i];
        resolved.push({
          item,
          isPinned: false,
          isPermanent: false,
          isNew: false,
          badgeText: 'KHÁM PHÁ NGẪU NHIÊN',
          badgeType: 'random',
        });
        usedIds.add(item.id);
      }
    }
  }

  // 3. Fallback: If still empty (e.g. fewer candidates than maxSlots), return what we have
  return resolved;
}

/**
 * Register a newly created or edited item into banner settings with auto-expiry
 */
export function registerItemToBanner(
  currentSettings: AppBannerSettings | undefined,
  sectionKey: keyof AppBannerSettings,
  itemId: string,
  targetType: 'game' | 'media',
  expiryDays?: number | null,
  isPermanent?: boolean
): AppBannerSettings {
  const fullSettings: AppBannerSettings = {
    games: { ...DEFAULT_SECTION_BANNER_SETTINGS, ...(currentSettings?.games || {}) },
    videos: { ...DEFAULT_SECTION_BANNER_SETTINGS, ...(currentSettings?.videos || {}) },
    music: { ...DEFAULT_SECTION_BANNER_SETTINGS, ...(currentSettings?.music || {}) },
    podcasts: { ...DEFAULT_SECTION_BANNER_SETTINGS, ...(currentSettings?.podcasts || {}) },
  };

  const section = fullSettings[sectionKey];
  const now = new Date();
  let expiresAt: string | null = null;

  if (!isPermanent) {
    const days = expiryDays && expiryDays > 0 ? expiryDays : section.defaultExpiryDays || 7;
    const expDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    expiresAt = expDate.toISOString();
  }

  // Remove existing entry if present
  const filtered = (section.pinnedItems || []).filter((p) => p.id !== itemId);

  // Add new item to front
  const newEntry: BannerItemConfig = {
    id: itemId,
    targetType,
    pinnedAt: now.toISOString(),
    expiresAt,
    isPermanent: Boolean(isPermanent),
  };

  section.pinnedItems = [newEntry, ...filtered];
  section.pinnedItems = sanitizePinnedItems(section.pinnedItems, section.maxBanners);

  return fullSettings;
}

/**
 * Remove an item from the banner
 */
export function unpinItemFromBanner(
  currentSettings: AppBannerSettings | undefined,
  sectionKey: keyof AppBannerSettings,
  itemId: string
): AppBannerSettings {
  const fullSettings: AppBannerSettings = {
    games: { ...DEFAULT_SECTION_BANNER_SETTINGS, ...(currentSettings?.games || {}) },
    videos: { ...DEFAULT_SECTION_BANNER_SETTINGS, ...(currentSettings?.videos || {}) },
    music: { ...DEFAULT_SECTION_BANNER_SETTINGS, ...(currentSettings?.music || {}) },
    podcasts: { ...DEFAULT_SECTION_BANNER_SETTINGS, ...(currentSettings?.podcasts || {}) },
  };

  const section = fullSettings[sectionKey];
  section.pinnedItems = (section.pinnedItems || []).filter((p) => p.id !== itemId);
  return fullSettings;
}

