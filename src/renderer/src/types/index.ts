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

export interface GameExtension {
  id: string;
  name: string;             // Ví dụ: "Bản Việt Hóa v1.2", "DLC Blood & Wine", "Update 1.0.5"
  category: 'viethoa' | 'dlc' | 'update' | 'mod' | 'other';
  description?: string;     // Hướng dẫn cài đặt, chép đè file...
  links: string[];          // [Link chính, Link dự phòng 1, Link dự phòng 2]
  version?: string;
  fileSize?: number;
  createdAt: string;
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
  listCardPath?: string;
  listCardPosition?: string;
  listCardZoom?: number;
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
  backupLinks?: string[];
  extensions?: GameExtension[];
  controllerConfig?: GameControllerConfig;
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
  coverAspectRatio?: '1:1' | '16:9';
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
  backupLinks?: string[];
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
  listCardPath?: string;
  listCardPosition?: string;
  listCardZoom?: number;
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
  // TV Settings
  tvAutoPlayTrailer?: boolean;
  // Trailer Banner Settings
  trailerSettings?: TrailerSettings;
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

export interface PasswordResetRequest {
  id: string;
  profileId?: string;
  username: string;
  nickname: string;
  requestedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  resolvedAt?: string;
}

export interface UserProfile {
  id: string;                      // Unique UUID or slug
  username?: string;               // Tên tài khoản đăng nhập
  nickname: string;                // Display name (2 - 20 chars)
  avatar: string;                  // Built-in avatar id ('cyber_1', 'game_1', etc.) or local file / URL
  role?: 'admin' | 'user';         // Phân quyền
  passwordHash?: string;           // SHA-256 hash của mật khẩu (cho User)
  passwordSalt?: string;           // Salt bảo mật
  pinHash?: string;                // SHA-256 hash of PIN (cho Admin)
  requiresPasswordReset?: boolean; // Cờ yêu cầu đổi mật khẩu khi đăng nhập
  bannedUntil?: string;            // ISO timestamp nếu bị cấm (null/undefined nếu bình thường)
  banReason?: string;              // Lý do bị cấm
  customGameTags?: Record<string, string[]>; // Game ID -> danh sách tags cá nhân
  friendCode?: string;             // Mã kết bạn (ví dụ: ICE-4921)
  createdDate: string;             // ISO 8601
  lastActiveDate: string;          // ISO 8601
  library: string[];               // game IDs in personal library
  favoriteMedia: string[];         // media IDs in personal favorites
  favoritePlaylists?: string[];    // playlist IDs in personal favorites
  watchProgress: Record<string, {
    currentTime: number;
    duration: number;
    completed: boolean;
    lastWatchedAt: number;
  }>;
  gameStats?: Record<string, {
    totalPlayMinutes: number;
    lastPlayedAt: number;
  }>;
}

export interface IceDropShareItem {
  id: string;
  senderProfileId?: string;
  senderName?: string;
  type: 'text' | 'link';
  content: string;
  pinCode: string;                 // Mã 4 số nhận chéo tài khoản
  createdAt: string;
  expiresAt: string;               // Hết hạn sau 10 phút
}

export type GameControllerMode = 'gamepad' | 'keyboard_mouse' | 'disabled';

export interface VirtualButtonBinding {
  id: string;             // 'btn_a', 'btn_b', 'btn_x', 'btn_y', 'dpad', 'joystick', 'lb', 'rb', 'lt', 'rt', 'key_custom'
  label: string;          // 'A', 'B', 'Space', 'Shift', 'Click Trái'
  type: 'gamepad_btn' | 'key' | 'mouse_btn' | 'dpad' | 'joystick';
  targetKey?: string;     // Key code on PC, e.g., 'Space', 'KeyW', 'KeyA', 'KeyS', 'KeyD', 'ShiftLeft'
  x: number;              // Coordinate % from 0 - 100 on landscape screen
  y: number;              // Coordinate % from 0 - 100 on landscape screen
  size?: number;          // Custom size
  enabled: boolean;       // Enabled / visible
}

export interface GameControllerConfig {
  mode: GameControllerMode;       // 'gamepad' | 'keyboard_mouse' | 'disabled'
  presetName?: string;            // 'Xbox 360 Chuẩn', 'Bàn Phím & Chuột', 'Tùy Chỉnh'
  customButtons?: VirtualButtonBinding[];
}

export interface PairedDevice {
  id: string;
  name: string;
  type: 'phone' | 'pc';
  ip?: string;
  lastConnectedAt?: string;
  isOnline?: boolean;
}

export interface CloudSyncSettings {
  enabled: boolean;
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  autoSyncIntervalMinutes?: number;
  lastSyncedAt?: string;
  lastSyncStatus?: 'success' | 'error' | 'idle';
  lastSyncMessage?: string;
}

export interface AppData {
  games: Game[];
  media: MediaItem[];
  playlists?: MediaPlaylist[];
  profiles?: UserProfile[];
  passwordResets?: PasswordResetRequest[];
  iceDropShares?: IceDropShareItem[];
  activeProfileId?: string | null;
  rememberedProfileId?: string | null;
  cloudSync?: CloudSyncSettings;
  settings: AppSettings;
}

export type NavigationTab = 'home' | 'library' | 'media' | 'extras' | 'settings';

export interface TrailerItem {
  id: string;
  title: string;
  tag: string;
  videoUrl: string;
  mediaId?: string;
  isPinned?: boolean;
}

export interface TrailerSettings {
  enabled: boolean;
  playbackMode: 'auto-next' | 'loop' | 'shuffle';
  trailers: TrailerItem[];
}

