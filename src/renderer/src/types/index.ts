export type GameStatus = 
  | 'uninstalled' 
  | 'downloading' 
  | 'downloaded' 
  | 'installing' 
  | 'ready' 
  | 'running' 
  | 'error';

export interface DownloadProgress {
  bytesDownloaded: number;
  totalBytes: number;
  percentage: number;
  speedMBps: number;
  etaSeconds: number;
  currentPart: number;
  totalParts: number;
  statusText: string;
}

export interface InstallProgress {
  percentage: number;
  statusText: string;
}

export interface Game {
  id: string;
  name: string;
  coverPath: string;
  bannerPath?: string;
  coverPosition?: string;
  bannerPosition?: string;
  coverZoom?: number;
  bannerZoom?: number;
  bannerBlur?: number;
  bannerDarkness?: number;
  bannerEdgeDarkness?: number; // 0 - 100: side fade darkness (0 = crystal clear, no side fade)
  bannerSharpen?: number;
  coverSharpen?: number;
  bannerFeaturedUntil?: string; // ISO date for expiration
  isBannerPermanent?: boolean;
  isBannerPinned?: boolean;
  playTimeMinutes?: number;
  viewCount?: number;
  trailerUrl?: string;
  screenshots?: string[];
  hidden?: boolean;
  description?: string;
  requirementsText?: string;
  actionButtonIds?: string[];
  downloadLinks: string[];
  expectedSize?: number;
  archivePassword?: string;
  installPath?: string;
  mainExe?: string;
  runAsAdmin: boolean;
  deleteArchiveAfterInstall: boolean;
  status: GameStatus;
  lastPlayed?: string;
  inLibrary: boolean;
  featured: boolean;
  genre?: string;
  tags?: string[];
  exeCandidates?: string[];
  addedAt: string;
  downloadProgress?: DownloadProgress;
  installProgress?: InstallProgress;
  errorDetails?: string;
}

export type MediaType = 'video' | 'audio';
export type MediaSubType = 'movie' | 'music' | 'podcast';

export interface MediaPlaylist {
  id: string;
  name: string;
  type: 'video' | 'audio';
  subType?: MediaSubType;
  description?: string;
  coverPath?: string;
  itemIds: string[];
  createdAt: string;
}

export interface MediaItem {
  id: string;
  type: 'video' | 'audio';
  subType?: MediaSubType;
  title: string;
  artist?: string;
  link: string;
  downloadStatus?: 'idle' | 'downloading' | 'downloaded' | 'error';
  downloadProgress?: number;
  localFilePath?: string;
  aspectRatioMode?: '16:9' | '9:16' | 'auto';
  coverPath?: string;
  bannerPath?: string;
  coverPosition?: string;
  bannerPosition?: string;
  coverZoom?: number;
  bannerZoom?: number;
  bannerBlur?: number;
  bannerDarkness?: number;
  bannerEdgeDarkness?: number; // 0 - 100: side fade darkness (0 = crystal clear, no side fade)
  bannerSharpen?: number;
  coverSharpen?: number;
  bannerFeaturedUntil?: string; // ISO date for expiration
  isBannerPermanent?: boolean;
  isBannerPinned?: boolean;
  viewCount?: number;
  playTimeMinutes?: number;
  description?: string;
  category?: string;
  tags?: string[];
  hidden?: boolean;
  lastPosition: number; // in seconds
  duration?: number; // in seconds
  watched: boolean;
  playlistId?: string;
  addedAt: string;
}

export interface AppSettings {
  pinHash?: string;
  pinSalt?: string;
  deleteArchiveDefault: boolean;
  runAsAdminDefault: boolean;
  gameTags?: string[];
  mediaTags?: string[];
  googleToken?: {
    accessToken: string;
    refreshToken: string;
    expiryDate: number;
    userEmail?: string;
  };
  appRootPath: string;
  gamesPath: string;
  downloadsPath: string;
  recoveryKeyHash?: string;
  // v1.3 Enhanced Settings
  sfxEnabled?: boolean;
  ambientSnowEnabled?: boolean;
  backgroundAudioEnabled?: boolean;
  userGamerTitle?: string;
  // v1.4 Theme, Particle Studio, Integrations & Low-Spec
  particleConfig?: ParticleConfig;
  wallpaperConfig?: WallpaperConfig;
  lowSpecMode?: boolean;
  globalActionButtons?: AppActionButton[];
  // Multi-drive custom game storage
  defaultGamesInstallPath?: string;
  askInstallLocationBeforeDownload?: boolean;
  // v1.5 Centralized Banner Manager
  bannerSettings?: AppBannerSettings;
}

export interface BannerItemConfig {
  id: string;                      // ID of Game or MediaItem
  targetType: 'game' | 'media';
  pinnedAt: string;                // ISO timestamp of pin date
  expiresAt?: string | null;       // ISO timestamp when expiry occurs (null if permanent)
  isPermanent?: boolean;           // Permanent pin: won't be evicted by FIFO
}

export interface SectionBannerSettings {
  maxBanners: number;              // Max slots (3 - 10, default: 5)
  defaultExpiryDays: number;       // Default run duration for newly added/pinned items (default: 7)
  autoAddNew: boolean;             // Automatically put newly created game/media into banner
  fallbackMode: 'views_then_random' | 'views_only' | 'random_only';
  autoSlideIntervalSeconds: number;// Slide interval in seconds (default: 7)
  pinnedItems: BannerItemConfig[]; // Ordered list of pinned configs
}

export interface AppBannerSettings {
  games: SectionBannerSettings;
  videos: SectionBannerSettings;
  music: SectionBannerSettings;
  podcasts: SectionBannerSettings;
}

export type ActionButtonIcon = 'steam' | 'discord' | 'link' | 'app' | 'gamepad' | 'book';
export type ActionButtonType = 'app' | 'link';

export interface AppActionButton {
  id: string;
  label: string;
  description?: string;
  icon: ActionButtonIcon;
  type: ActionButtonType;
  target: string;
  isDefault?: boolean;
  runAsAdmin?: boolean;
}

export type SeasonTheme = 'winter' | 'autumn' | 'spring' | 'summer' | 'cyber' | 'none';

export interface ParticleConfig {
  theme: SeasonTheme;
  speed: number;
  density: number;
  opacity: number;
}

export interface WallpaperConfig {
  enabled: boolean;
  imagePath?: string;
  position?: string;
  zoom?: number;
  blur?: number;
  darkness?: number;
  showWithParticles?: boolean;
}

export interface AppData {
  games: Game[];
  media: MediaItem[];
  playlists?: MediaPlaylist[];
  settings: AppSettings;
}

export type NavigationTab = 'home' | 'library' | 'media' | 'settings';

