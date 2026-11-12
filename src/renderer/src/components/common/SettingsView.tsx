import React, { useState } from 'react';
import { 
  FolderOpen, 
  KeyRound, 
  HardDrive, 
  FileDown, 
  FileUp, 
  Sparkles, 
  ShieldCheck, 
  Check, 
  AlertCircle, 
  Info, 
  Tag, 
  Plus, 
  X, 
  Trash2, 
  Gamepad2, 
  Film,
  Palette,
  ExternalLink,
  AppWindow,
  Sliders,
  Image as ImageIcon,
  Zap,
  Volume2,
  Lock,
  Edit3,
  Play,
  RefreshCw,
  Download,
  GitBranch,
  Cloud,
  Database,
  CheckCircle2,
  Copy
} from 'lucide-react';
import type { 
  AppSettings, 
  AppActionButton, 
  ParticleConfig, 
  WallpaperConfig, 
  SeasonTheme,
  CloudSyncSettings
} from '../../types';
import { ActionButtonModal } from '../admin/ActionButtonModal';
import { sfx } from '../../utils/sfx';

type SettingsTab = 'appearance' | 'integrations' | 'storage' | 'cloud' | 'admin' | 'updates';

interface SettingsViewProps {
  settings: AppSettings;
  isAdmin: boolean;
  onOpenFolder: (target: 'app' | 'games' | 'downloads') => void;
  onExportData: (mode: 'full' | 'share') => void;
  onImportData: () => void;
  onLoadDemoData: () => void;
  onChangePin: () => void;
  onOpenAdminAuth?: () => void;
  onOpenBannerManager?: () => void;
  onUpdateTags?: (type: 'game' | 'media', tags: string[]) => void;
  onSaveSettings?: (settings: Partial<AppSettings>) => void;
  cloudSync?: CloudSyncSettings;
  onSaveCloudSync?: (settings: Partial<CloudSyncSettings>) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  isAdmin,
  onOpenFolder,
  onExportData,
  onImportData,
  onLoadDemoData,
  onChangePin,
  onOpenAdminAuth,
  onOpenBannerManager,
  onUpdateTags,
  onSaveSettings,
  cloudSync,
  onSaveCloudSync,
}) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('appearance');

  // --- 1. APPEARANCE & THEME STATES ---
  const currentParticle: ParticleConfig = settings.particleConfig || {
    theme: (settings.ambientSnowEnabled === false ? 'none' : 'winter') as SeasonTheme,
    speed: 1.0,
    density: 35,
    opacity: 0.7,
  };
  const [particleTheme, setParticleTheme] = useState<SeasonTheme>(currentParticle.theme);
  const [particleSpeed, setParticleSpeed] = useState<number>(currentParticle.speed);
  const [particleDensity, setParticleDensity] = useState<number>(currentParticle.density);
  const [particleOpacity, setParticleOpacity] = useState<number>(currentParticle.opacity);

  const currentWallpaper: WallpaperConfig = settings.wallpaperConfig || {
    enabled: false,
    imagePath: '',
    position: '50% 50%',
    zoom: 1.0,
    blur: 0,
    darkness: 30,
    showWithParticles: true,
  };
  const [wallpaperEnabled, setWallpaperEnabled] = useState<boolean>(currentWallpaper.enabled);
  const [wallpaperPath, setWallpaperPath] = useState<string>(currentWallpaper.imagePath || '');
  const [wallpaperPosition, setWallpaperPosition] = useState<string>(currentWallpaper.position || '50% 50%');
  const [wallpaperZoom, setWallpaperZoom] = useState<number>(currentWallpaper.zoom ?? 1.0);
  const [wallpaperBlur, setWallpaperBlur] = useState<number>(currentWallpaper.blur ?? 0);
  const [wallpaperDarkness, setWallpaperDarkness] = useState<number>(currentWallpaper.darkness ?? 30);
  const [showWithParticles, setShowWithParticles] = useState<boolean>(currentWallpaper.showWithParticles ?? true);

  const [lowSpecMode, setLowSpecMode] = useState<boolean>(settings.lowSpecMode ?? false);
  const [sfxEnabled, setSfxEnabled] = useState<boolean>(settings.sfxEnabled ?? true);
  const [bgAudioEnabled, setBgAudioEnabled] = useState<boolean>(settings.backgroundAudioEnabled ?? true);
  const [gamerTitle, setGamerTitle] = useState<string>(settings.userGamerTitle || 'Tân Binh Băng Giá');

  // --- 2. ACTION BUTTONS STATES ---
  const [actionButtons, setActionButtons] = useState<AppActionButton[]>(
    settings.globalActionButtons || []
  );
  const [editingBtn, setEditingBtn] = useState<AppActionButton | null>(null);
  const [isBtnModalOpen, setIsBtnModalOpen] = useState(false);
  const [btnFeedback, setBtnFeedback] = useState<{ id: string; msg: string; isError?: boolean } | null>(null);

  // --- 3. STORAGE & DEFAULTS ---
  const [deleteArchive, setDeleteArchive] = useState(settings.deleteArchiveDefault ?? true);
  const [runAdminDefault, setRunAdminDefault] = useState(settings.runAsAdminDefault ?? false);
  const [defaultGamesPath, setDefaultGamesPath] = useState(
    settings.defaultGamesInstallPath || settings.gamesPath
  );
  const [askBeforeDownload, setAskBeforeDownload] = useState(
    settings.askInstallLocationBeforeDownload ?? false
  );
  const [diskSpace, setDiskSpace] = useState<{
    freeGb: number;
    totalGb: number;
    driveLetter: string;
  } | null>(null);

  React.useEffect(() => {
    if (window.api?.getDiskSpace) {
      window.api.getDiskSpace(defaultGamesPath).then((res: any) => {
        if (res) setDiskSpace(res);
      });
    }
  }, [defaultGamesPath]);

  const handleChangeGamesFolder = async () => {
    try {
      sfx.playClick();
      const folder = await window.api.browseFolder({
        title: 'Chọn thư mục cài game (trên bất kỳ ổ đĩa C:, D:, E:...)',
        defaultPath: defaultGamesPath,
      });
      if (folder) {
        setDefaultGamesPath(folder);
        onSaveSettings?.({ defaultGamesInstallPath: folder });
        sfx.playSuccess();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleResetGamesFolder = () => {
    sfx.playClick();
    setDefaultGamesPath(settings.gamesPath);
    onSaveSettings?.({ defaultGamesInstallPath: undefined });
    sfx.playSuccess();
  };

  // --- 4. TAGS (ADMIN) ---
  const [newGameTag, setNewGameTag] = useState('');
  const [newMediaTag, setNewMediaTag] = useState('');
  const gameTags = settings.gameTags || ['Coop', 'Hành động', 'Nhập vai (RPG)', 'Chiến thuật', 'Kinh dị', 'Mô phỏng', 'Thế giới mở', 'Bắn súng (FPS)', 'Phiêu lưu', 'Indie'];
  const mediaTags = settings.mediaTags || ['Hoạt hình', 'Phim Chiếu Rạp', 'Phim Lẻ', 'Phim Bộ', 'YouTube', 'Nhạc Chill', 'Nhạc Game', 'EDM', 'Pop', 'MV'];

  // Save Appearance Config
  const handleSaveAppearance = (override?: Partial<AppSettings>) => {
    sfx.playSuccess();
    const updatedParticle: ParticleConfig = {
      theme: particleTheme,
      speed: particleSpeed,
      density: particleDensity,
      opacity: particleOpacity,
    };
    const updatedWallpaper: WallpaperConfig = {
      enabled: wallpaperEnabled,
      imagePath: wallpaperPath.trim(),
      position: wallpaperPosition,
      zoom: wallpaperZoom,
      blur: wallpaperBlur,
      darkness: wallpaperDarkness,
      showWithParticles,
    };

    onSaveSettings?.({
      particleConfig: updatedParticle,
      wallpaperConfig: updatedWallpaper,
      ambientSnowEnabled: particleTheme !== 'none',
      lowSpecMode,
      sfxEnabled,
      backgroundAudioEnabled: bgAudioEnabled,
      userGamerTitle: gamerTitle.trim() || 'Chiến Binh Băng Giá',
      ...override,
    });
  };

  // Browse local wallpaper file
  const handleBrowseWallpaper = async () => {
    try {
      sfx.playClick();
      const res = await window.api.browseFile({
        title: 'Chọn ảnh nền màn hình',
        filters: [
          { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'webp', 'bmp'] }
        ]
      });
      if (res) {
        setWallpaperPath(res);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Save / Delete Action Buttons
  const handleSaveActionButton = (savedBtn: AppActionButton) => {
    let updated: AppActionButton[];
    const exists = actionButtons.some((b) => b.id === savedBtn.id);
    if (exists) {
      updated = actionButtons.map((b) => (b.id === savedBtn.id ? savedBtn : b));
    } else {
      updated = [...actionButtons, savedBtn];
    }
    setActionButtons(updated);
    onSaveSettings?.({ globalActionButtons: updated });
    setIsBtnModalOpen(false);
    setEditingBtn(null);
  };

  const handleDeleteActionButton = (id: string) => {
    sfx.playClick();
    if (confirm('Bạn có chắc chắn muốn xoá nút liên kết này khỏi thư viện?')) {
      const updated = actionButtons.filter((b) => b.id !== id);
      setActionButtons(updated);
      onSaveSettings?.({ globalActionButtons: updated });
    }
  };

  const handleTestActionButton = async (btn: AppActionButton) => {
    sfx.playClick();
    try {
      const res = await window.api.launchAction(btn.target, btn.type, btn.runAsAdmin);
      if (res && res.success) {
        sfx.playSuccess();
        setBtnFeedback({ id: btn.id, msg: 'Khởi chạy thử thành công!' });
      } else {
        sfx.playError();
        setBtnFeedback({ id: btn.id, msg: res?.error || 'Lỗi khởi chạy', isError: true });
      }
    } catch (err: any) {
      sfx.playError();
      setBtnFeedback({ id: btn.id, msg: err?.message || 'Lỗi', isError: true });
    }
    setTimeout(() => setBtnFeedback(null), 3000);
  };

  // Tag Handlers
  const handleAddTag = (type: 'game' | 'media') => {
    const val = (type === 'game' ? newGameTag : newMediaTag).trim();
    if (!val) return;
    const current = type === 'game' ? gameTags : mediaTags;
    if (!current.includes(val)) {
      const updated = [...current, val];
      onUpdateTags?.(type, updated);
    }
    if (type === 'game') setNewGameTag('');
    else setNewMediaTag('');
  };

  const handleRemoveTag = (type: 'game' | 'media', tagToRemove: string) => {
    const current = type === 'game' ? gameTags : mediaTags;
    const updated = current.filter((t) => t !== tagToRemove);
    onUpdateTags?.(type, updated);
  };

  // --- 5. IN-APP AUTO-UPDATER STATES ---
  const [appVersion, setAppVersion] = useState<string>('1.0.0');
  const [updaterStatus, setUpdaterStatus] = useState<'idle' | 'checking' | 'available' | 'not-available' | 'downloading' | 'downloaded' | 'error'>('idle');
  const [newVersionInfo, setNewVersionInfo] = useState<{ version?: string; releaseDate?: string; releaseNotes?: string } | null>(null);
  const [updateDownloadPercent, setUpdateDownloadPercent] = useState<number>(0);
  const [updateError, setUpdateError] = useState<string | null>(null);

  React.useEffect(() => {
    if (window.api?.getAppVersion) {
      window.api.getAppVersion().then((ver: string) => ver && setAppVersion(ver));
    }

    if (window.api?.onUpdateStatus) {
      const unsub = window.api.onUpdateStatus((data: any) => {
        setUpdaterStatus(data.status);
        if (data.status === 'available') {
          setNewVersionInfo({
            version: data.version,
            releaseDate: data.releaseDate,
            releaseNotes: data.releaseNotes,
          });
        }
        if (data.status === 'error') {
          setUpdateError(data.error || 'Lỗi kiểm tra cập nhật');
        }
      });
      return () => unsub?.();
    }
  }, []);

  React.useEffect(() => {
    if (window.api?.onUpdateProgress) {
      const unsub = window.api.onUpdateProgress((prog: any) => {
        setUpdaterStatus('downloading');
        setUpdateDownloadPercent(prog.percent);
      });
      return () => unsub?.();
    }
  }, []);

  const handleCheckUpdates = async () => {
    sfx.playClick();
    setUpdaterStatus('checking');
    setUpdateError(null);
    try {
      const res = await window.api?.checkUpdates?.();
      if (!res?.success && res?.error) {
        setUpdateError(res.error);
        setUpdaterStatus('error');
      }
    } catch (err: any) {
      setUpdateError(err?.message || String(err));
      setUpdaterStatus('error');
    }
  };

  const handleDownloadUpdate = async () => {
    sfx.playClick();
    setUpdaterStatus('downloading');
    await window.api?.downloadUpdate?.();
  };

  const handleInstallUpdate = () => {
    sfx.playClick();
    window.api?.installUpdate?.();
  };

  // --- 6. SUPABASE CLOUD SYNC STATES & HANDLERS ---
  const DEFAULT_SUPABASE_URL = 'https://wqmmagfrwwctvipopazx.supabase.co';
  const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_l1vNbLKXXhLNnfi1pI5UnQ_0EaqbXuJ';

  const [cloudEnabled, setCloudEnabled] = useState(cloudSync?.enabled ?? true);
  const [supabaseUrl, setSupabaseUrl] = useState(cloudSync?.supabaseUrl || DEFAULT_SUPABASE_URL);
  const [supabaseAnonKey, setSupabaseAnonKey] = useState(cloudSync?.supabaseAnonKey || DEFAULT_SUPABASE_ANON_KEY);
  const [syncInterval, setSyncInterval] = useState(cloudSync?.autoSyncIntervalMinutes || 5);
  const [cloudTestResult, setCloudTestResult] = useState<{ success?: boolean; message?: string } | null>(null);
  const [isTestingCloud, setIsTestingCloud] = useState(false);
  const [isSyncingCloud, setIsSyncingCloud] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);

  React.useEffect(() => {
    if (cloudSync) {
      setCloudEnabled(cloudSync.enabled ?? true);
      setSupabaseUrl(cloudSync.supabaseUrl || DEFAULT_SUPABASE_URL);
      setSupabaseAnonKey(cloudSync.supabaseAnonKey || DEFAULT_SUPABASE_ANON_KEY);
      setSyncInterval(cloudSync.autoSyncIntervalMinutes || 5);
    }
  }, [cloudSync]);

  const handleTestCloudConnection = async () => {
    sfx.playClick();
    setIsTestingCloud(true);
    setCloudTestResult(null);
    try {
      const res = await window.api.testSupabaseConnection(supabaseUrl, supabaseAnonKey);
      setCloudTestResult(res);
      if (res.success) sfx.playSuccess();
      else sfx.playError();
    } catch (err: any) {
      setCloudTestResult({ success: false, message: err?.message || 'Lỗi kiểm tra' });
      sfx.playError();
    } finally {
      setIsTestingCloud(false);
    }
  };

  const handleSaveCloudSettings = () => {
    sfx.playSuccess();
    onSaveCloudSync?.({
      enabled: cloudEnabled,
      supabaseUrl: supabaseUrl.trim(),
      supabaseAnonKey: supabaseAnonKey.trim(),
      autoSyncIntervalMinutes: syncInterval,
    });
  };

  const [isPublishingCloud, setIsPublishingCloud] = useState(false);
  const [isPullingCloud, setIsPullingCloud] = useState(false);

  const handleManualCloudSync = async () => {
    sfx.playClick();
    setIsSyncingCloud(true);
    setSyncMessage(null);
    try {
      const targetUrl = (supabaseUrl && supabaseUrl.trim()) || DEFAULT_SUPABASE_URL;
      const targetKey = (supabaseAnonKey && supabaseAnonKey.trim()) || DEFAULT_SUPABASE_ANON_KEY;
      const res = await window.api.syncCloud({ url: targetUrl, key: targetKey });
      if (res.success) {
        sfx.playSuccess();
        setSyncMessage(`✓ ${res.message}`);
        setCloudEnabled(true);
        onSaveCloudSync?.({
          enabled: true,
          supabaseUrl: targetUrl,
          supabaseAnonKey: targetKey,
          autoSyncIntervalMinutes: syncInterval,
        });
      } else {
        sfx.playError();
        setSyncMessage(`✕ ${res.message}`);
      }
    } catch (err: any) {
      sfx.playError();
      setSyncMessage(`✕ ${err?.message || 'Lỗi đồng bộ'}`);
    } finally {
      setIsSyncingCloud(false);
    }
  };

  const handlePublishCloudCatalog = async () => {
    if (!window.confirm('Hành động này sẽ xuất bản toàn bộ danh mục Game, Phim và Gói mở rộng từ máy này lên Cloud làm phiên bản chuẩn cho toàn bộ người dùng. Tiếp tục?')) {
      return;
    }
    sfx.playClick();
    setIsPublishingCloud(true);
    setSyncMessage(null);
    try {
      const targetUrl = (supabaseUrl && supabaseUrl.trim()) || DEFAULT_SUPABASE_URL;
      const targetKey = (supabaseAnonKey && supabaseAnonKey.trim()) || DEFAULT_SUPABASE_ANON_KEY;
      const res = await window.api.publishCloudCatalog?.({ url: targetUrl, key: targetKey });
      if (res?.success) {
        sfx.playSuccess();
        setSyncMessage(`✓ ${res.message || 'Đã xuất bản danh mục lên Cloud thành công!'}`);
      } else {
        sfx.playError();
        setSyncMessage(`✕ Lỗi xuất bản: ${res?.message || 'Không thể kết nối'}`);
      }
    } catch (err: any) {
      sfx.playError();
      setSyncMessage(`✕ Lỗi xuất bản: ${err?.message || 'Thao tác thất bại'}`);
    } finally {
      setIsPublishingCloud(false);
    }
  };

  const handlePullCloudCatalog = async () => {
    sfx.playClick();
    setIsPullingCloud(true);
    setSyncMessage(null);
    try {
      const targetUrl = (supabaseUrl && supabaseUrl.trim()) || DEFAULT_SUPABASE_URL;
      const targetKey = (supabaseAnonKey && supabaseAnonKey.trim()) || DEFAULT_SUPABASE_ANON_KEY;
      const res = await window.api.pullCloudCatalog?.({ url: targetUrl, key: targetKey });
      if (res?.success) {
        sfx.playSuccess();
        setSyncMessage(`✓ ${res.message || 'Đã tải danh mục mới nhất từ Cloud thành công!'}`);
      } else {
        sfx.playError();
        setSyncMessage(`✕ Lỗi tải dữ liệu: ${res?.message || 'Không thể kết nối'}`);
      }
    } catch (err: any) {
      sfx.playError();
      setSyncMessage(`✕ Lỗi tải dữ liệu: ${err?.message || 'Thao tác thất bại'}`);
    } finally {
      setIsPullingCloud(false);
    }
  };

  const handleCopySchemaSql = () => {
    sfx.playClick();
    const sql = `-- ICELAUCH MULTI-USER & FULL CATALOG CLOUD SYNC SCHEMA
CREATE TABLE IF NOT EXISTS icelauch_profiles (
  id TEXT PRIMARY KEY,
  nickname TEXT NOT NULL,
  avatar TEXT NOT NULL DEFAULT 'avatar_1',
  pin_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  last_active TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS icelauch_user_data (
  profile_id TEXT PRIMARY KEY REFERENCES icelauch_profiles(id) ON DELETE CASCADE,
  library JSONB DEFAULT '[]'::jsonb,
  watch_progress JSONB DEFAULT '{}'::jsonb,
  favorite_media JSONB DEFAULT '[]'::jsonb,
  game_stats JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS icelauch_games (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  drive_url TEXT,
  trailer_url TEXT,
  banner_url TEXT,
  cover_url TEXT,
  description TEXT,
  category TEXT,
  genre TEXT,
  tags JSONB DEFAULT '[]'::jsonb,
  action_buttons JSONB DEFAULT '[]'::jsonb,
  featured BOOLEAN DEFAULT false,
  release_year INT,
  developer TEXT,
  file_size BIGINT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS icelauch_media (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'video',
  link TEXT NOT NULL,
  cover_path TEXT,
  banner_path TEXT,
  description TEXT,
  category TEXT,
  tags JSONB DEFAULT '[]'::jsonb,
  duration INT DEFAULT 0,
  is_banner_pinned BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS icelauch_playlists (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  cover_path TEXT,
  item_ids JSONB DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE icelauch_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE icelauch_user_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE icelauch_games ENABLE ROW LEVEL SECURITY;
ALTER TABLE icelauch_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE icelauch_playlists ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Icelauch Profiles Anon All" ON icelauch_profiles;
DROP POLICY IF EXISTS "Icelauch User Data Anon All" ON icelauch_user_data;
DROP POLICY IF EXISTS "Icelauch Games Anon All" ON icelauch_games;
DROP POLICY IF EXISTS "Icelauch Media Anon All" ON icelauch_media;
DROP POLICY IF EXISTS "Icelauch Playlists Anon All" ON icelauch_playlists;

CREATE POLICY "Icelauch Profiles Anon All" ON icelauch_profiles FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Icelauch User Data Anon All" ON icelauch_user_data FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Icelauch Games Anon All" ON icelauch_games FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Icelauch Media Anon All" ON icelauch_media FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Icelauch Playlists Anon All" ON icelauch_playlists FOR ALL TO anon USING (true) WITH CHECK (true);

INSERT INTO storage.buckets (id, name, public)
VALUES ('icelauch-assets', 'icelauch-assets', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public Read Assets" ON storage.objects;
DROP POLICY IF EXISTS "Public Upload Assets" ON storage.objects;
DROP POLICY IF EXISTS "Public Update Assets" ON storage.objects;

CREATE POLICY "Public Read Assets" ON storage.objects FOR SELECT TO public USING (bucket_id = 'icelauch-assets');
CREATE POLICY "Public Upload Assets" ON storage.objects FOR INSERT TO anon WITH CHECK (bucket_id = 'icelauch-assets');
CREATE POLICY "Public Update Assets" ON storage.objects FOR UPDATE TO anon WITH CHECK (bucket_id = 'icelauch-assets');`;

    navigator.clipboard.writeText(sql);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 3000);
  };

  return (
    <div className="flex-1 w-full overflow-y-auto select-none custom-scrollbar">
      <div className="w-full max-w-5xl mx-auto px-8 py-8 space-y-6">
        {/* Title & Header */}
        <div>
          <h1 className="text-2xl font-black text-white tracking-wide flex items-center gap-2.5">
            <Sliders className="w-6 h-6 text-amber-400" />
            <span>CÀI ĐẶT & QUẢN TRỊ HỆ THỐNG</span>
          </h1>
          <p className="text-xs text-ice-subtext mt-1">
            Tùy chỉnh giao diện, hiệu ứng mùa hè/đông/thu/xuân, thư viện nút mở app ngoài, lưu trữ di động và bảo mật.
          </p>
        </div>

      {/* 4 Categorized Tabs Navigation */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-ice-card border border-ice-border shadow-md">
        <button
          onClick={() => {
            sfx.playClick();
            setActiveTab('appearance');
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'appearance'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-md'
              : 'text-ice-subtext hover:text-white hover:bg-white/5 border border-transparent'
          }`}
        >
          <Palette className="w-4 h-4 text-amber-400" />
          <span>Giao Diện & Trải Nghiệm</span>
        </button>

        <button
          onClick={() => {
            sfx.playClick();
            setActiveTab('integrations');
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'integrations'
              ? 'bg-blue-600/25 text-blue-300 border border-blue-500/50 shadow-md'
              : 'text-ice-subtext hover:text-white hover:bg-white/5 border border-transparent'
          }`}
        >
          <ExternalLink className="w-4 h-4 text-blue-400" />
          <span>Nút Liên Kết & Tích Hợp</span>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-black/40">
            {actionButtons.length}
          </span>
        </button>

        <button
          onClick={() => {
            sfx.playClick();
            setActiveTab('storage');
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'storage'
              ? 'bg-emerald-600/25 text-emerald-300 border border-emerald-500/50 shadow-md'
              : 'text-ice-subtext hover:text-white hover:bg-white/5 border border-transparent'
          }`}
        >
          <HardDrive className="w-4 h-4 text-emerald-400" />
          <span>Lưu Trữ & Thư Mục</span>
        </button>

        <button
          onClick={() => {
            sfx.playClick();
            setActiveTab('cloud');
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'cloud'
              ? 'bg-indigo-600/25 text-indigo-300 border border-indigo-500/50 shadow-md'
              : 'text-ice-subtext hover:text-white hover:bg-white/5 border border-transparent'
          }`}
        >
          <Cloud className="w-4 h-4 text-indigo-400" />
          <span>Đồng Bộ Đám Mây</span>
          {cloudEnabled && (
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Đang bật đồng bộ" />
          )}
        </button>

        <button
          onClick={() => {
            sfx.playClick();
            if (!isAdmin) {
              onOpenAdminAuth?.();
            } else {
              setActiveTab('admin');
            }
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'admin'
              ? 'bg-red-500/25 text-red-300 border border-red-500/50 shadow-md'
              : 'text-ice-subtext hover:text-white hover:bg-white/5 border border-transparent'
          }`}
        >
          {isAdmin ? <ShieldCheck className="w-4 h-4 text-amber-400" /> : <Lock className="w-4 h-4 text-ice-muted" />}
          <span>Quản Trị Hệ Thống</span>
          {!isAdmin && <span className="text-[10px] text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">Khóa</span>}
        </button>

        <button
          onClick={() => {
            sfx.playClick();
            setActiveTab('updates');
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'updates'
              ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-500/50 shadow-md'
              : 'text-ice-subtext hover:text-white hover:bg-white/5 border border-transparent'
          }`}
        >
          <RefreshCw className={`w-4 h-4 text-cyan-400 ${updaterStatus === 'checking' ? 'animate-spin' : ''}`} />
          <span>Phiên Bản & Cập Nhật</span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold">
            v{appVersion}
          </span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: GIAO DIỆN & TRẢI NGHIỆM */}
      {/* ========================================================= */}
      {activeTab === 'appearance' && (
        <div className="space-y-6">
          {/* Low-Spec Mode Performance Toggle Banner */}
          <section className="bg-gradient-to-r from-cyan-950/40 via-blue-950/30 to-ice-card border border-cyan-500/30 rounded-2xl p-5 shadow-lg flex items-center justify-between">
            <div className="space-y-1 pr-4">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-cyan-400" />
                <h3 className="text-sm font-bold text-white">Chế Độ Máy Yếu / Tiết Kiệm Tài Nguyên (Low-Spec Mode)</h3>
              </div>
              <p className="text-xs text-ice-subtext leading-relaxed">
                Khi bật, hệ thống sẽ tạm dừng toàn bộ hiệu ứng Canvas chuyển động và giảm bộ lọc mờ nặng, giúp launcher chạy mượt mà 60 FPS ổn định trên mọi máy cấu hình thấp hoặc laptop tiết kiệm pin.
              </p>
            </div>
            <button
              onClick={() => {
                const next = !lowSpecMode;
                setLowSpecMode(next);
                handleSaveAppearance({ lowSpecMode: next });
              }}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 shrink-0 ${
                lowSpecMode
                  ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/20'
                  : 'bg-ice-card text-ice-subtext border border-ice-border hover:text-white'
              }`}
            >
              <Zap className="w-4 h-4" />
              <span>{lowSpecMode ? 'ĐANG BẬT (TỐI ƯU 60FPS)' : 'ĐANG TẮT'}</span>
            </button>
          </section>

          {/* Seasonal Particle Studio */}
          <section className="bg-ice-card rounded-2xl border border-ice-border p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-ice-border/60 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Studio Hiệu Ứng Theo Mùa (Seasonal Particles)
                </h3>
              </div>
              <span className="text-xs text-ice-muted">Hiệu ứng lơ lửng toàn màn hình</span>
            </div>

            {/* Theme Picker */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
              {[
                { id: 'winter', label: '❄️ Mùa Đông', sub: 'Tuyết rơi nhẹ' },
                { id: 'autumn', label: '🍂 Mùa Thu', sub: 'Lá vàng chao nghiêng' },
                { id: 'spring', label: '🌸 Mùa Xuân', sub: 'Cánh hoa anh đào' },
                { id: 'summer', label: '💡 Mùa Hè', sub: 'Đom đóm phát sáng' },
                { id: 'cyber', label: '🌌 Cyber Stardust', sub: 'Bụi sao neon' },
                { id: 'none', label: '❌ Tắt Hiệu Ứng', sub: 'Không hiển thị hạt' },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    sfx.playClick();
                    setParticleTheme(t.id as SeasonTheme);
                  }}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
                    particleTheme === t.id
                      ? 'bg-amber-500/20 border-amber-500 text-white font-bold shadow-md shadow-amber-500/10'
                      : 'bg-[#0E1118] border-ice-border/60 text-ice-muted hover:text-white hover:border-ice-border'
                  }`}
                >
                  <span className="text-xs font-bold">{t.label}</span>
                  <span className="text-[10px] text-ice-muted mt-0.5">{t.sub}</span>
                </button>
              ))}
            </div>

            {/* Sliders for Speed, Density, Opacity */}
            {particleTheme !== 'none' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                {/* Speed */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-ice-subtext font-medium">Tốc độ rơi / di chuyển</span>
                    <span className="text-amber-400 font-mono font-bold">{particleSpeed.toFixed(1)}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.2"
                    max="3.0"
                    step="0.1"
                    value={particleSpeed}
                    onChange={(e) => setParticleSpeed(parseFloat(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                </div>

                {/* Density */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-ice-subtext font-medium">Mật độ số lượng hạt</span>
                    <span className="text-amber-400 font-mono font-bold">{particleDensity} hạt</span>
                  </div>
                  <input
                    type="range"
                    min="15"
                    max="80"
                    step="5"
                    value={particleDensity}
                    onChange={(e) => setParticleDensity(parseInt(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                </div>

                {/* Opacity */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-ice-subtext font-medium">Độ mờ / trong suốt</span>
                    <span className="text-amber-400 font-mono font-bold">{Math.round(particleOpacity * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="1.0"
                    step="0.05"
                    value={particleOpacity}
                    onChange={(e) => setParticleOpacity(parseFloat(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                </div>
              </div>
            )}
          </section>

          {/* Custom App Wallpaper Studio */}
          <section className="bg-ice-card rounded-2xl border border-ice-border p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-ice-border/60 pb-3">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Hình Nền Ứng Dụng Tùy Chỉnh (Custom App Wallpaper)
                </h3>
              </div>
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-white select-none">
                <input
                  type="checkbox"
                  checked={wallpaperEnabled}
                  onChange={(e) => setWallpaperEnabled(e.target.checked)}
                  className="w-4 h-4 rounded accent-amber-500"
                />
                <span>Bật hình nền tùy chỉnh</span>
              </label>
            </div>

            {wallpaperEnabled && (
              <div className="space-y-5">
                {/* Image Path input & browse */}
                <div>
                  <label className="block text-xs font-semibold text-ice-subtext mb-1">
                    Đường dẫn file ảnh trên máy hoặc Link ảnh Web
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={wallpaperPath}
                      onChange={(e) => setWallpaperPath(e.target.value)}
                      placeholder="VD: C:\Pictures\Wallpaper.jpg hoặc https://images.unsplash.com/..."
                      className="flex-1 bg-[#0A0C10] border border-ice-border focus:border-amber-400 rounded-xl px-3.5 py-2 text-xs text-white outline-none font-mono"
                    />
                    <button
                      type="button"
                      onClick={handleBrowseWallpaper}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-ice-hover text-white text-xs font-semibold border border-ice-border transition-colors shrink-0"
                    >
                      <FolderOpen className="w-3.5 h-3.5 text-amber-400" />
                      <span>Chọn ảnh từ máy</span>
                    </button>
                  </div>
                </div>

                {/* Wallpaper Controls: Position, Zoom, Blur, Darkness */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                  {/* Position */}
                  <div className="space-y-2">
                    <label className="text-xs text-ice-subtext font-medium">Tâm điểm hiển thị</label>
                    <select
                      value={wallpaperPosition}
                      onChange={(e) => setWallpaperPosition(e.target.value)}
                      className="w-full bg-[#0A0C10] border border-ice-border rounded-xl px-3 py-2 text-xs text-white outline-none"
                    >
                      <option value="50% 50%">Chính giữa (Center 50% 50%)</option>
                      <option value="50% 20%">Phía trên (Top 50% 20%)</option>
                      <option value="50% 80%">Phía dưới (Bottom 50% 80%)</option>
                      <option value="20% 50%">Lệch trái (Left 20% 50%)</option>
                      <option value="80% 50%">Lệch phải (Right 80% 50%)</option>
                    </select>
                  </div>

                  {/* Zoom */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-ice-subtext font-medium">Phóng to (Zoom)</span>
                      <span className="text-amber-400 font-mono font-bold">{wallpaperZoom.toFixed(1)}x</span>
                    </div>
                    <input
                      type="range"
                      min="1.0"
                      max="3.0"
                      step="0.1"
                      value={wallpaperZoom}
                      onChange={(e) => setWallpaperZoom(parseFloat(e.target.value))}
                      className="w-full accent-amber-500 cursor-pointer"
                    />
                  </div>

                  {/* Blur */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-ice-subtext font-medium">Độ làm mờ (Blur)</span>
                      <span className="text-amber-400 font-mono font-bold">{wallpaperBlur}px</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="20"
                      step="1"
                      value={wallpaperBlur}
                      onChange={(e) => setWallpaperBlur(parseInt(e.target.value))}
                      className="w-full accent-amber-500 cursor-pointer"
                    />
                  </div>

                  {/* Darkness overlay */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-ice-subtext font-medium">Lớp phủ tối (Darkness)</span>
                      <span className="text-amber-400 font-mono font-bold">{wallpaperDarkness}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="90"
                      step="5"
                      value={wallpaperDarkness}
                      onChange={(e) => setWallpaperDarkness(parseInt(e.target.value))}
                      className="w-full accent-amber-500 cursor-pointer"
                    />
                  </div>
                </div>

                <label className="flex items-center gap-2 cursor-pointer text-xs text-white select-none pt-2">
                  <input
                    type="checkbox"
                    checked={showWithParticles}
                    onChange={(e) => setShowWithParticles(e.target.checked)}
                    className="w-4 h-4 rounded accent-amber-500"
                  />
                  <span>Hiển thị đồng thời cùng hiệu ứng hạt theo mùa</span>
                </label>
              </div>
            )}
          </section>

          {/* Sound & Title */}
          <section className="bg-ice-card rounded-2xl border border-ice-border p-6 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-ice-border/60 pb-3">
              <Volume2 className="w-4 h-4 text-amber-400" />
              Âm Thanh Tương Tác & Danh Hiệu
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <label className="flex items-center gap-2.5 cursor-pointer text-xs text-white select-none">
                <input
                  type="checkbox"
                  checked={sfxEnabled}
                  onChange={(e) => setSfxEnabled(e.target.checked)}
                  className="w-4 h-4 rounded accent-amber-500"
                />
                <span>Âm thanh tương tác UI (Clicks & Hovers)</span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer text-xs text-white select-none">
                <input
                  type="checkbox"
                  checked={bgAudioEnabled}
                  onChange={(e) => setBgAudioEnabled(e.target.checked)}
                  className="w-4 h-4 rounded accent-amber-500"
                />
                <span>Cho phép chạy nhạc/audio dưới nền</span>
              </label>

              <div className="space-y-1">
                <label className="text-xs text-ice-subtext font-medium block">Danh hiệu người chơi</label>
                <input
                  type="text"
                  value={gamerTitle}
                  onChange={(e) => setGamerTitle(e.target.value)}
                  className="w-full bg-[#0A0C10] border border-ice-border rounded-xl px-3 py-1.5 text-xs text-white outline-none font-bold"
                />
              </div>
            </div>
          </section>

          {/* Save Appearance Button */}
          <div className="flex justify-end pt-2">
            <button
              onClick={() => handleSaveAppearance()}
              className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition-all shadow-md flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>Áp Dụng Thay Đổi Giao Diện</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: NÚT LIÊN KẾT & TÍCH HỢP */}
      {/* ========================================================= */}
      {activeTab === 'integrations' && (
        <div className="space-y-6">
          <section className="bg-ice-card rounded-2xl border border-ice-border p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ice-border/60 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <ExternalLink className="w-4 h-4 text-blue-400" />
                  Thư Viện Nút Liên Kết & Khởi Chạy Ứng Dụng Ngoài
                </h3>
                <p className="text-xs text-ice-subtext mt-0.5">
                  Quản lý các nút liên kết nhanh (Steam, Discord, Mod, link web) hiển thị trong trang chi tiết game và thư viện.
                </p>
              </div>

              {isAdmin ? (
                <button
                  onClick={() => {
                    sfx.playClick();
                    setEditingBtn(null);
                    setIsBtnModalOpen(true);
                  }}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition-colors shadow flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Thêm Nút Mới</span>
                </button>
              ) : (
                <button
                  onClick={onOpenAdminAuth}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold transition-colors flex items-center gap-1.5"
                  title="Nhập mã PIN Admin để thêm hoặc sửa nút liên kết"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Mở Khóa Admin Để Thêm / Sửa Nút</span>
                </button>
              )}
            </div>

            {/* List of buttons */}
            {actionButtons.length === 0 ? (
              <div className="text-center py-8 text-xs text-ice-muted">
                Chưa có nút liên kết nào được tạo. Hãy bấm "+ Thêm Nút Mới" để tạo nút đầu tiên.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                {actionButtons.map((btn) => {
                  const feedback = btnFeedback?.id === btn.id ? btnFeedback : null;

                  return (
                    <div
                      key={btn.id}
                      className="p-4 rounded-xl bg-[#0E1118] border border-ice-border/80 flex items-center justify-between gap-3 hover:border-amber-400/50 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-black/50 border border-white/5 flex items-center justify-center shrink-0">
                          {btn.icon === 'steam' && <span className="text-blue-400 text-base">🎮</span>}
                          {btn.icon === 'discord' && <span className="text-indigo-400 text-base">💬</span>}
                          {btn.icon === 'app' && <AppWindow className="w-5 h-5 text-cyan-400" />}
                          {btn.icon === 'link' && <ExternalLink className="w-5 h-5 text-amber-400" />}
                          {btn.icon === 'gamepad' && <Gamepad2 className="w-5 h-5 text-emerald-400" />}
                          {btn.icon === 'book' && <span className="text-purple-400 text-base">📖</span>}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white truncate">{btn.label}</span>
                            {btn.isDefault && (
                              <span className="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.2 rounded font-mono">
                                Mặc định
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-ice-subtext font-mono truncate mt-0.5" title={btn.target}>
                            {btn.target}
                          </p>
                          {feedback && (
                            <p className={`text-[10px] font-semibold mt-1 ${feedback.isError ? 'text-red-400' : 'text-emerald-400'}`}>
                              {feedback.msg}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Controls */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => handleTestActionButton(btn)}
                          className="px-2.5 py-1.5 rounded-lg bg-ice-card hover:bg-ice-hover text-ice-accent border border-ice-border text-xs font-semibold transition-colors"
                          title="Thử khởi chạy ngay"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                        </button>

                        {isAdmin && (
                          <>
                            <button
                              onClick={() => {
                                sfx.playClick();
                                setEditingBtn(btn);
                                setIsBtnModalOpen(true);
                              }}
                              className="p-1.5 rounded-lg text-ice-muted hover:text-white hover:bg-white/10"
                              title="Sửa nút"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteActionButton(btn.id)}
                              className="p-1.5 rounded-lg text-ice-muted hover:text-red-400 hover:bg-white/10"
                              title="Xóa nút"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: LƯU TRỮ & THƯ MỤC */}
      {/* ========================================================= */}
      {activeTab === 'storage' && (
        <div className="space-y-6">
          {/* Multi-Drive Custom Game Storage Manager */}
          <section className="bg-gradient-to-br from-[#121622] via-[#151926] to-[#0E1118] rounded-2xl border border-amber-500/40 p-6 space-y-4 shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ice-border/60 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-amber-400" />
                  Thư Mục Cài Đặt Game Mặc Định (Hỗ Trợ Đa Ổ Đĩa)
                </h3>
                <p className="text-xs text-ice-subtext mt-0.5">
                  Linh hoạt chọn ổ đĩa lưu game (C:, D:, E:...). Các game lưu ở các ổ khác nhau vẫn hoạt động độc lập và hoàn toàn như nhau.
                </p>
              </div>

              {diskSpace && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/60 border border-white/10 text-xs font-mono">
                  <span className="text-ice-muted font-bold">{diskSpace.driveLetter}</span>
                  <span className={diskSpace.freeGb < 20 ? 'text-red-400 font-bold' : 'text-emerald-400 font-bold'}>
                    Còn trống {diskSpace.freeGb} GB
                  </span>
                  <span className="text-ice-muted">/ {diskSpace.totalGb} GB</span>
                </div>
              )}
            </div>

            <div className="space-y-3 pt-1">
              <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-[#0A0C10] border border-ice-border">
                <div className="min-w-0 flex-1 mr-4">
                  <p className="text-xs font-semibold text-white">Đường dẫn thư mục cài đặt hiện tại:</p>
                  <p className="text-xs font-mono text-amber-300 truncate mt-1" title={defaultGamesPath}>
                    {defaultGamesPath}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={handleChangeGamesFolder}
                    className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold flex items-center gap-1.5 transition-colors shadow"
                  >
                    <FolderOpen className="w-3.5 h-3.5" />
                    <span>Đổi Thư Mục / Ổ Khác</span>
                  </button>

                  {defaultGamesPath !== settings.gamesPath && (
                    <button
                      onClick={handleResetGamesFolder}
                      className="px-3 py-2 rounded-xl bg-ice-card hover:bg-ice-hover text-ice-subtext hover:text-white text-xs font-medium border border-ice-border transition-colors"
                      title="Đặt lại về Games mặc định trong thư mục App"
                    >
                      Về Mặc Định
                    </button>
                  )}
                </div>
              </div>

              {/* Option to ask install location before download */}
              <label className="flex items-center gap-2.5 cursor-pointer text-xs text-white select-none pt-1">
                <input
                  type="checkbox"
                  checked={askBeforeDownload}
                  onChange={(e) => {
                    setAskBeforeDownload(e.target.checked);
                    onSaveSettings?.({ askInstallLocationBeforeDownload: e.target.checked });
                  }}
                  className="w-4 h-4 rounded accent-amber-500"
                />
                <span>Luôn hỏi vị trí thư mục trước khi tải game mới (Thích hợp khi dùng nhiều ổ đĩa và muốn chọn riêng từng game)</span>
              </label>
            </div>
          </section>

          <section className="bg-ice-card rounded-2xl border border-ice-border p-6 space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-ice-border/60 pb-3">
              <HardDrive className="w-4 h-4 text-emerald-400" />
              Vị trí Lưu trữ Dữ liệu Portable (100% Độc Lập)
            </h2>
            <p className="text-xs text-ice-subtext leading-relaxed">
              Mọi dữ liệu game, file tải về và cấu hình được lưu trực tiếp trong thư mục ứng dụng để đảm bảo tính di động không cần cài đặt Windows Registry.
            </p>

            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#0A0C10] border border-ice-border">
                <div className="min-w-0 flex-1 mr-4">
                  <p className="text-xs font-semibold text-white">Thư mục gốc ứng dụng (App Root)</p>
                  <p className="text-[11px] font-mono text-ice-subtext truncate mt-0.5">{settings.appRootPath}</p>
                </div>
                <button
                  onClick={() => onOpenFolder('app')}
                  className="px-3 py-1.5 rounded-lg bg-ice-card hover:bg-ice-hover text-white text-xs font-semibold border border-ice-border flex items-center gap-1.5 transition-colors shrink-0"
                >
                  <FolderOpen className="w-3.5 h-3.5 text-amber-400" />
                  Mở Thư Mục
                </button>
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#0A0C10] border border-ice-border">
                <div className="min-w-0 flex-1 mr-4">
                  <p className="text-xs font-semibold text-white">Thư mục cài đặt trò chơi (Games)</p>
                  <p className="text-[11px] font-mono text-ice-subtext truncate mt-0.5">{settings.gamesPath}</p>
                </div>
                <button
                  onClick={() => onOpenFolder('games')}
                  className="px-3 py-1.5 rounded-lg bg-ice-card hover:bg-ice-hover text-white text-xs font-semibold border border-ice-border flex items-center gap-1.5 transition-colors shrink-0"
                >
                  <FolderOpen className="w-3.5 h-3.5 text-amber-400" />
                  Mở Thư Mục
                </button>
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#0A0C10] border border-ice-border">
                <div className="min-w-0 flex-1 mr-4">
                  <p className="text-xs font-semibold text-white">Thư mục tải về file nén (Downloads)</p>
                  <p className="text-[11px] font-mono text-ice-subtext truncate mt-0.5">{settings.downloadsPath}</p>
                </div>
                <button
                  onClick={() => onOpenFolder('downloads')}
                  className="px-3 py-1.5 rounded-lg bg-ice-card hover:bg-ice-hover text-white text-xs font-semibold border border-ice-border flex items-center gap-1.5 transition-colors shrink-0"
                >
                  <FolderOpen className="w-3.5 h-3.5 text-amber-400" />
                  Mở Thư Mục
                </button>
              </div>
            </div>
          </section>

          {/* Extraction Defaults */}
          <section className="bg-ice-card rounded-2xl border border-ice-border p-6 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-ice-border/60 pb-3">
              Tùy Chọn Cài Đặt Mặc Định
            </h3>
            <div className="space-y-3">
              <label className="flex items-center gap-2.5 cursor-pointer text-xs text-white select-none">
                <input
                  type="checkbox"
                  checked={deleteArchive}
                  onChange={(e) => {
                    setDeleteArchive(e.target.checked);
                    onSaveSettings?.({ deleteArchiveDefault: e.target.checked });
                  }}
                  className="w-4 h-4 rounded accent-amber-500"
                />
                <span>Tự động xóa file nén sau khi cài đặt thành công (Tiết kiệm bộ nhớ)</span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer text-xs text-white select-none">
                <input
                  type="checkbox"
                  checked={runAdminDefault}
                  onChange={(e) => {
                    setRunAdminDefault(e.target.checked);
                    onSaveSettings?.({ runAsAdminDefault: e.target.checked });
                  }}
                  className="w-4 h-4 rounded accent-amber-500"
                />
                <span>Mặc định yêu cầu quyền Quản trị (Admin UAC) khi thêm game mới</span>
              </label>
            </div>
          </section>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB: ĐỒNG BỘ ĐÁM MÂY SUPABASE */}
      {/* ========================================================= */}
      {activeTab === 'cloud' && (
        <div className="space-y-6 animate-fade-in">
          {/* Header Banner */}
          <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-900/30 via-[#161922] to-blue-900/20 border border-indigo-500/30 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shrink-0 shadow-md">
                <Cloud className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
                  <span>Đồng Bộ Đám Mây Đa Thiết Bị (Supabase BaaS)</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold">
                    Zero-Friction
                  </span>
                </h3>
                <p className="text-xs text-ice-subtext mt-0.5 max-w-xl">
                  Đồng bộ 2 chiều tiến độ xem phim dở, danh sách game yêu thích và hồ sơ cá nhân xuyên suốt mọi máy tính PC, Laptop và Android TV mà không cần đăng ký tài khoản phức tạp.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {isAdmin ? (
                <>
                  <button
                    type="button"
                    onClick={handlePublishCloudCatalog}
                    disabled={isPublishingCloud || isSyncingCloud}
                    title="Xuất bản danh mục Game, Phim và Gói mở rộng từ máy này lên Cloud cho toàn bộ người dùng"
                    className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all ${
                      isPublishingCloud
                        ? 'bg-white/10 text-white/50 cursor-not-allowed'
                        : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-indigo-950/50 transform hover:-translate-y-0.5 active:scale-95'
                    }`}
                  >
                    <Cloud className={`w-3.5 h-3.5 ${isPublishingCloud ? 'animate-bounce' : ''}`} />
                    <span>{isPublishingCloud ? 'Đang xuất bản...' : '☁️ Tải Lên Cloud (Publish)'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handlePullCloudCatalog}
                    disabled={isPullingCloud || isSyncingCloud}
                    title="Tải danh mục chuẩn mới nhất từ Cloud về máy này"
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all bg-white/10 hover:bg-white/20 text-white border border-white/15 active:scale-95`}
                  >
                    <FileDown className={`w-3.5 h-3.5 ${isPullingCloud ? 'animate-bounce' : ''}`} />
                    <span>{isPullingCloud ? 'Đang tải...' : '📥 Tải Danh Mục Mới'}</span>
                  </button>
                </>
              ) : null}

              <button
                type="button"
                onClick={handleManualCloudSync}
                disabled={isSyncingCloud || isPublishingCloud || isPullingCloud}
                title={isAdmin ? "Đồng bộ 2 chiều dữ liệu cá nhân" : "Đồng bộ an toàn: Tải danh mục mới nhất và lưu dữ liệu cá nhân của bạn"}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                  isSyncingCloud
                    ? 'bg-white/10 text-white/50 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-950/40 transform hover:-translate-y-0.5 active:scale-95'
                }`}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncingCloud ? 'animate-spin' : ''}`} />
                <span>{isSyncingCloud ? 'Đang đồng bộ...' : isAdmin ? 'Đồng Bộ Hồ Sơ' : 'Đồng Bộ Ngay'}</span>
              </button>
            </div>
          </div>

          {/* Sync Message Feedback */}
          {syncMessage && (
            <div className={`p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2 border ${
              syncMessage.startsWith('✓')
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
            }`}>
              <span>{syncMessage}</span>
            </div>
          )}

          {/* User Auto-Sync Interval Card (Visible to All Users) */}
          <section className="p-6 rounded-2xl bg-ice-card border border-ice-border shadow-md space-y-4">
            <div className="flex items-center justify-between border-b border-ice-border/60 pb-3">
              <div>
                <span className="text-sm font-bold text-white block">Tùy Chọn Tự Động Đồng Bộ Ngầm</span>
                <span className="text-xs text-ice-subtext block mt-0.5">
                  Tự động đồng bộ tiến độ phim, danh sách yêu thích và thư viện game sau mỗi khoảng thời gian
                </span>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                cloudEnabled ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-white/10 text-ice-muted'
              }`}>
                {cloudEnabled ? 'ĐANG KÍCH HOẠT' : 'CHƯA BẬT'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-ice-subtext uppercase tracking-wider">
                  Chu kỳ Tự Động Đồng Bộ
                </label>
                <select
                  value={syncInterval}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setSyncInterval(val);
                    onSaveCloudSync?.({ autoSyncIntervalMinutes: val });
                  }}
                  className="w-full h-10 px-3.5 rounded-xl bg-black/40 border border-ice-border text-xs text-white focus:outline-none focus:border-indigo-400 font-semibold"
                >
                  <option value={3}>Mỗi 3 phút</option>
                  <option value={5}>Mỗi 5 phút (Khuyên dùng)</option>
                  <option value={15}>Mỗi 15 phút</option>
                  <option value={30}>Mỗi 30 phút</option>
                </select>
              </div>

              <div className="space-y-1.5 flex flex-col justify-end">
                <div className="text-[11px] text-ice-subtext leading-relaxed p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                  <span className="text-indigo-300 font-bold block mb-0.5">⚡ Tự động hóa ngầm:</span>
                  Ứng dụng tự động kiểm tra và đồng bộ khi khởi động, định kỳ mỗi {syncInterval} phút và trước khi thoát.
                </div>
              </div>
            </div>
          </section>

          {/* Non-Admin Security Notice */}
          {!isAdmin ? (
            <div className="p-6 rounded-2xl bg-[#141722]/80 border border-amber-500/30 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    Cấu Hình Máy Chủ Supabase (Dành Riêng Cho Quản Trị Viên)
                  </h4>
                  <p className="text-xs text-ice-subtext mt-0.5">
                    Thông tin kết nối Supabase Project URL, Khóa API Anon và lệnh khởi tạo bảng SQL được ẩn để bảo vệ hệ thống. Nhập mã PIN Admin để chỉnh sửa.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onOpenAdminAuth}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black text-xs font-bold shrink-0 transition-all flex items-center gap-1.5 shadow-md active:scale-98"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Mở Khóa Quản Trị</span>
              </button>
            </div>
          ) : (
            <>
              {/* Section 1: Configuration Form (Admin Only) */}
              <section className="p-6 rounded-2xl bg-ice-card border border-amber-500/40 shadow-md space-y-5">
                <div className="flex items-center justify-between pb-4 border-b border-ice-border/60">
                  <div className="space-y-0.5">
                    <span className="text-sm font-bold text-white flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-amber-400" />
                      <span>Cấu Hình Kết Nối Supabase (Quản Trị Viên)</span>
                    </span>
                    <span className="text-xs text-ice-subtext block">
                      Sử dụng cơ sở dữ liệu PostgreSQL miễn phí của Supabase để lưu trữ an toàn
                    </span>
                  </div>

                  {/* Master Toggle */}
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <span className="text-xs font-bold text-ice-subtext">Kích hoạt:</span>
                    <input
                      type="checkbox"
                      checked={cloudEnabled}
                      onChange={(e) => setCloudEnabled(e.target.checked)}
                      className="w-5 h-5 rounded accent-indigo-500 cursor-pointer"
                    />
                  </label>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-ice-subtext uppercase tracking-wider">
                      Supabase Project URL *
                    </label>
                    <input
                      type="text"
                      value={supabaseUrl}
                      onChange={(e) => setSupabaseUrl(e.target.value)}
                      placeholder="https://your-project-id.supabase.co"
                      className="w-full h-10 px-3.5 rounded-xl bg-black/40 border border-ice-border text-xs text-white placeholder-ice-subtext/50 focus:outline-none focus:border-indigo-400 font-mono transition-colors"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-ice-subtext uppercase tracking-wider">
                      Supabase Anon Public API Key *
                    </label>
                    <input
                      type="password"
                      value={supabaseAnonKey}
                      onChange={(e) => setSupabaseAnonKey(e.target.value)}
                      placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                      className="w-full h-10 px-3.5 rounded-xl bg-black/40 border border-ice-border text-xs text-white placeholder-ice-subtext/50 focus:outline-none focus:border-indigo-400 font-mono transition-colors"
                    />
                    <span className="text-[11px] text-ice-subtext block">
                      🔒 Chỉ cần dùng Anon Key (Public Key), tuyệt đối KHÔNG cần dùng Service Role Key bí mật.
                    </span>
                  </div>
                </div>

                {/* Test Connection Result Box */}
                {cloudTestResult && (
                  <div className={`p-3.5 rounded-xl text-xs font-medium border flex items-center gap-2.5 ${
                    cloudTestResult.success
                      ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                      : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
                  }`}>
                    {cloudTestResult.success ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                    ) : (
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                    )}
                    <span>{cloudTestResult.message}</span>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center justify-between pt-2 gap-3">
                  <button
                    type="button"
                    onClick={handleTestCloudConnection}
                    disabled={isTestingCloud || !supabaseUrl || !supabaseAnonKey}
                    className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold flex items-center gap-2 transition-colors border border-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Database className={`w-3.5 h-3.5 text-indigo-400 ${isTestingCloud ? 'animate-spin' : ''}`} />
                    <span>{isTestingCloud ? 'Đang kiểm tra kết nối...' : 'Kiểm Tra Kết Nối'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveCloudSettings}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white text-xs font-black tracking-wider uppercase flex items-center gap-2 shadow-lg shadow-emerald-950/40 transition-all transform hover:-translate-y-0.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>Lưu Cài Đặt Đồng Bộ</span>
                  </button>
                </div>
              </section>

              {/* Section 2: One-Click SQL Schema Guide (Admin Only) */}
              <section className="p-6 rounded-2xl bg-ice-card border border-ice-border shadow-md space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-sm font-bold text-white block">Hướng Dẫn Khởi Tạo Bảng Supabase (1 Lần Duy Nhất)</span>
                    <span className="text-xs text-ice-subtext block">
                      Nếu bạn vừa tạo Project Supabase mới, hãy sao chép đoạn mã SQL này và chạy trong SQL Editor
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleCopySchemaSql}
                    className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                      copiedSql
                        ? 'bg-emerald-500 text-black shadow-md'
                        : 'bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/40'
                    }`}
                  >
                    {copiedSql ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedSql ? 'Đã Sao Chép SQL!' : 'Sao Chép Mã SQL Schema'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                  <div className="p-3.5 rounded-xl bg-white/5 border border-white/5 space-y-1">
                    <span className="text-xs font-bold text-amber-400 block">Bước 1: Tạo Project Miễn Phí</span>
                    <p className="text-[11px] text-ice-subtext leading-relaxed">
                      Truy cập <strong>supabase.com</strong>, tạo một Project mới bất kỳ (chọn vùng Singapore để tốc độ nhanh nhất).
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white/5 border border-white/5 space-y-1">
                    <span className="text-xs font-bold text-amber-400 block">Bước 2: Chạy Mã SQL</span>
                    <p className="text-[11px] text-ice-subtext leading-relaxed">
                      Vào thanh menu bên trái &gt; <strong>SQL Editor</strong> &gt; Bấm <em>New query</em> &gt; Dán đoạn mã vừa sao chép ở trên rồi bấm <strong>Run</strong>.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white/5 border border-white/5 space-y-1">
                    <span className="text-xs font-bold text-amber-400 block">Bước 3: Lấy Khóa API</span>
                    <p className="text-[11px] text-ice-subtext leading-relaxed">
                      Vào <strong>Project Settings &gt; Data API</strong>, copy <em>Project URL</em> và <em>anon public key</em> dán vào bảng trên là xong!
                    </p>
                  </div>
                </div>
              </section>
            </>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 4: QUẢN TRỊ HỆ THỐNG (ADMIN ONLY) */}
      {/* ========================================================= */}
      {activeTab === 'admin' && (
        <div className="space-y-6">
          {!isAdmin ? (
            <div className="p-8 text-center bg-ice-card rounded-2xl border border-ice-border space-y-4">
              <ShieldCheck className="w-12 h-12 text-amber-400 mx-auto" />
              <h3 className="text-base font-bold text-white">Yêu Cầu Quyền Quản Trị Viên (Admin)</h3>
              <p className="text-xs text-ice-subtext max-w-md mx-auto leading-relaxed">
                Khu vực này chứa các chức năng nhạy cảm như đổi mã PIN, quản lý tags thể loại, sao lưu JSON và nạp dữ liệu.
              </p>
              <button
                onClick={onOpenAdminAuth}
                className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition-all shadow-md"
              >
                Nhập Mã PIN Admin Để Mở Khóa
              </button>
            </div>
          ) : (
            <>
              {/* Security & PIN */}
              <section className="bg-ice-card rounded-2xl border border-ice-border p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-ice-border/60 pb-3">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-amber-400" />
                    Bảo Mật & Mã PIN Quản Trị
                  </h3>
                  <button
                    onClick={onChangePin}
                    className="px-4 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 text-xs font-bold transition-all"
                  >
                    Đổi Mã PIN (4 - 10 số)
                  </button>
                </div>
                <p className="text-xs text-ice-subtext leading-relaxed">
                  Mã PIN bảo vệ các quyền thêm/sửa/xoá game, quản lý video và cấu hình hệ thống. Có thể sử dụng từ 4 đến 10 chữ số.
                </p>
              </section>

              {/* Centralized Banner Manager */}
              <section className="bg-ice-card rounded-2xl border border-ice-border p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-ice-border/60 pb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-amber-400" />
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                      Quản Lý Banner Nổi Bật Toàn Hệ Thống
                    </h3>
                  </div>
                  {onOpenBannerManager && (
                    <button
                      onClick={onOpenBannerManager}
                      className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Mở Quản Lý Banner</span>
                    </button>
                  )}
                </div>
                <p className="text-xs text-ice-subtext leading-relaxed">
                  Quản lý tập trung các slot Banner cho Trang chủ Game, Phim & Video, Âm Nhạc, Audio & Podcast. Tùy chỉnh số lượng banner tối đa, thời hạn hiển thị nổi bật (mặc định 7 ngày) và cơ chế tự động bù slot bằng mục xem/chơi nhiều nhất hoặc ngẫu nhiên.
                </p>
              </section>

              {/* Tag Management */}
              <section className="bg-ice-card rounded-2xl border border-ice-border p-6 space-y-6">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-ice-border/60 pb-3">
                  <Tag className="w-4 h-4 text-amber-400" />
                  Quản Lý Danh Mục Thể Loại (Tags)
                </h3>

                {/* Game Tags */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Gamepad2 className="w-4 h-4 text-ice-accent" />
                      Thể Loại Game
                    </span>
                    <span className="text-[11px] text-ice-muted font-mono">{gameTags.length} tags</span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {gameTags.map((t) => (
                      <span
                        key={t}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-ice-card border border-ice-border text-xs text-ice-text"
                      >
                        {t}
                        <button
                          onClick={() => handleRemoveTag('game', t)}
                          className="hover:text-red-400 transition-colors p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 max-w-sm pt-1">
                    <input
                      type="text"
                      value={newGameTag}
                      onChange={(e) => setNewGameTag(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddTag('game')}
                      placeholder="Thêm tag game mới..."
                      className="flex-1 bg-[#0A0C10] border border-ice-border rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:border-amber-400"
                    />
                    <button
                      onClick={() => handleAddTag('game')}
                      className="px-3 py-1.5 rounded-xl bg-ice-hover text-white text-xs font-semibold border border-ice-border"
                    >
                      Thêm
                    </button>
                  </div>
                </div>

                {/* Media Tags */}
                <div className="space-y-3 pt-3 border-t border-ice-border/40">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Film className="w-4 h-4 text-amber-400" />
                      Thể Loại Giải Trí (Phim, Nhạc, Audio)
                    </span>
                    <span className="text-[11px] text-ice-muted font-mono">{mediaTags.length} tags</span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {mediaTags.map((t) => (
                      <span
                        key={t}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-ice-card border border-ice-border text-xs text-ice-text"
                      >
                        {t}
                        <button
                          onClick={() => handleRemoveTag('media', t)}
                          className="hover:text-red-400 transition-colors p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 max-w-sm pt-1">
                    <input
                      type="text"
                      value={newMediaTag}
                      onChange={(e) => setNewMediaTag(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddTag('media')}
                      placeholder="Thêm tag giải trí mới..."
                      className="flex-1 bg-[#0A0C10] border border-ice-border rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:border-amber-400"
                    />
                    <button
                      onClick={() => handleAddTag('media')}
                      className="px-3 py-1.5 rounded-xl bg-ice-hover text-white text-xs font-semibold border border-ice-border"
                    >
                      Thêm
                    </button>
                  </div>
                </div>
              </section>

              {/* Backup & Import Data */}
              <section className="bg-ice-card rounded-2xl border border-ice-border p-6 space-y-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-ice-border/60 pb-3">
                  <FileDown className="w-4 h-4 text-blue-400" />
                  Sao Lưu & Đồng Bộ Dữ Liệu
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    onClick={() => onExportData('full')}
                    className="p-4 rounded-xl bg-[#0A0C10] border border-ice-border hover:border-blue-400 text-left transition-colors space-y-1.5 group"
                  >
                    <div className="flex items-center gap-2 text-xs font-bold text-white group-hover:text-blue-400">
                      <FileDown className="w-4 h-4" />
                      Xuất File JSON Đầy Đủ
                    </div>
                    <p className="text-[11px] text-ice-muted">Sao lưu toàn bộ game, media và cài đặt</p>
                  </button>

                  <button
                    onClick={onImportData}
                    className="p-4 rounded-xl bg-[#0A0C10] border border-ice-border hover:border-amber-400 text-left transition-colors space-y-1.5 group"
                  >
                    <div className="flex items-center gap-2 text-xs font-bold text-white group-hover:text-amber-400">
                      <FileUp className="w-4 h-4" />
                      Nhập File JSON
                    </div>
                    <p className="text-[11px] text-ice-muted">Khôi phục danh sách từ bản sao lưu</p>
                  </button>

                  <button
                    onClick={onLoadDemoData}
                    className="p-4 rounded-xl bg-[#0A0C10] border border-ice-border hover:border-purple-400 text-left transition-colors space-y-1.5 group"
                  >
                    <div className="flex items-center gap-2 text-xs font-bold text-white group-hover:text-purple-400">
                      <Sparkles className="w-4 h-4" />
                      Nạp Dữ Liệu Mẫu
                    </div>
                    <p className="text-[11px] text-ice-muted">Thêm game và media demo có sẵn</p>
                  </button>
                </div>
              </section>
            </>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 5: PHIÊN BẢN & CẬP NHẬT TỰ ĐỘNG (OTA) */}
      {/* ========================================================= */}
      {activeTab === 'updates' && (
        <div className="space-y-6">
          {/* Main Version Banner */}
          <section className="bg-gradient-to-r from-[#0C1525] via-ice-card to-[#0A0D14] border border-cyan-500/40 rounded-2xl p-6 shadow-xl relative overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
              <div className="space-y-2">
                <div className="flex items-center gap-2.5">
                  <span className="px-2.5 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 text-xs font-black tracking-wider uppercase border border-cyan-500/40">
                    Bản Phát Hành Chính Thức
                  </span>
                  <span className="text-xs text-ice-subtext font-mono">Windows 10/11 x64</span>
                </div>

                <div className="flex items-baseline gap-3">
                  <h2 className="text-3xl font-black text-white tracking-tight">Icelauch</h2>
                  <span className="text-2xl font-black text-cyan-400 font-mono">v{appVersion}</span>
                </div>

                <p className="text-xs text-ice-subtext leading-relaxed max-w-lg">
                  Hệ thống tự động kiểm tra và cập nhật các bản vá lỗi, tính năng mới trực tiếp từ GitHub Releases mà không làm gián đoạn trải nghiệm của bạn.
                </p>
              </div>

              {/* Status and Action Buttons */}
              <div className="flex flex-col gap-2.5 shrink-0 min-w-[200px]">
                {updaterStatus === 'available' ? (
                  <button
                    onClick={handleDownloadUpdate}
                    className="h-11 px-5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black text-xs font-black tracking-wider uppercase flex items-center justify-center gap-2 shadow-lg shadow-amber-950/40 transition-all"
                  >
                    <Download className="w-4 h-4" />
                    <span>Tải Bản v{newVersionInfo?.version || 'Mới'}</span>
                  </button>
                ) : updaterStatus === 'downloading' ? (
                  <div className="space-y-1.5 p-3 rounded-xl bg-black/50 border border-amber-500/30 text-center">
                    <p className="text-[11px] font-bold text-amber-300 flex items-center justify-center gap-1.5">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Đang tải ngầm: {updateDownloadPercent}%</span>
                    </p>
                    <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-400 transition-all duration-300"
                        style={{ width: `${updateDownloadPercent}%` }}
                      />
                    </div>
                  </div>
                ) : updaterStatus === 'downloaded' ? (
                  <button
                    onClick={handleInstallUpdate}
                    className="h-11 px-5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white text-xs font-black tracking-wider uppercase flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40 transition-all"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Khởi Động Lại Ngay</span>
                  </button>
                ) : (
                  <button
                    onClick={handleCheckUpdates}
                    disabled={updaterStatus === 'checking'}
                    className="h-11 px-5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 hover:border-cyan-400 text-xs font-bold tracking-wide flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 ${updaterStatus === 'checking' ? 'animate-spin' : ''}`} />
                    <span>{updaterStatus === 'checking' ? 'Đang Kiểm Tra...' : 'Kiểm Tra Bản Mới'}</span>
                  </button>
                )}

                <a
                  href="https://github.com/NguyenDacTung/Icelauch"
                  target="_blank"
                  rel="noreferrer"
                  className="h-9 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-ice-subtext hover:text-white border border-ice-border text-xs font-medium flex items-center justify-center gap-2 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Kho GitHub</span>
                </a>
              </div>
            </div>

            {/* Error notice if any */}
            {updateError && (
              <div className="mt-4 p-4 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs flex flex-col gap-2.5">
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-bold text-red-200">
                      {updateError.includes('checksum') || updateError.includes('sha512')
                        ? 'Lỗi kiểm tra tính toàn vẹn (Checksum Hash) khi tải tự động'
                        : 'Không thể cập nhật tự động'}
                    </p>
                    <p className="text-[11px] text-red-300/80 font-mono break-all">{updateError}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    sfx.playClick();
                    window.api?.openExternal?.('https://github.com/NguyenDacTung/Icelauch/releases');
                  }}
                  className="self-start px-3.5 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-white border border-red-500/40 text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 shadow-sm"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
                  <span>Tải Bộ Cài Đặt Trực Tiếp Từ GitHub Releases</span>
                </button>
              </div>
            )}
          </section>

          {/* New Version Changelog (If Available) */}
          {newVersionInfo && newVersionInfo.version && (
            <section className="bg-ice-card rounded-2xl border border-amber-500/40 p-6 space-y-3">
              <div className="flex items-center justify-between border-b border-ice-border/60 pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <h3 className="text-sm font-bold text-white">
                    Thông Tin Bản Cập Nhật Mới: v{newVersionInfo.version}
                  </h3>
                </div>
                {newVersionInfo.releaseDate && (
                  <span className="text-[11px] text-ice-subtext font-mono">
                    Ngày phát hành: {new Date(newVersionInfo.releaseDate).toLocaleDateString('vi-VN')}
                  </span>
                )}
              </div>

              {newVersionInfo.releaseNotes ? (
                newVersionInfo.releaseNotes.includes('<h') ||
                newVersionInfo.releaseNotes.includes('<ul') ||
                newVersionInfo.releaseNotes.includes('<li') ||
                newVersionInfo.releaseNotes.includes('<p>') ? (
                  <div
                    className="text-xs text-ice-text bg-black/40 p-4 rounded-xl border border-ice-border/70 overflow-y-auto max-h-72 space-y-2 leading-relaxed release-notes-content"
                    dangerouslySetInnerHTML={{ __html: newVersionInfo.releaseNotes }}
                  />
                ) : (
                  <div className="text-xs text-ice-text bg-black/40 p-4 rounded-xl border border-ice-border whitespace-pre-wrap leading-relaxed max-h-72 overflow-y-auto">
                    {newVersionInfo.releaseNotes}
                  </div>
                )
              ) : (
                <p className="text-xs text-ice-subtext">
                  Bản cập nhật bao gồm các cải tiến hiệu năng và sửa lỗi hệ thống.
                </p>
              )}
            </section>
          )}

          {/* Safe Architecture Notice */}
          <section className="bg-ice-card rounded-2xl border border-ice-border p-6 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Cam Kết Bảo Toàn Dữ Liệu 100% (Zero Data Loss)</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-ice-subtext">
              <div className="p-4 rounded-xl bg-[#0A0C10] border border-ice-border/70 space-y-1.5">
                <h4 className="font-bold text-white flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Kho Dữ Liệu `Data/` Luôn An Toàn</span>
                </h4>
                <p className="text-[11px] leading-relaxed text-ice-muted">
                  Toàn bộ danh mục trò chơi, phim ảnh, danh sách phát, mã PIN Admin và tiến độ xem dở nằm riêng trong thư mục Data và không bao giờ bị ghi đè khi cập nhật app.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#0A0C10] border border-ice-border/70 space-y-1.5">
                <h4 className="font-bold text-white flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Thư Mục Cài Game `Games/` Độc Lập</span>
                </h4>
                <p className="text-[11px] leading-relaxed text-ice-muted">
                  Tất cả các trò chơi đã giải nén trên ổ C:, D: hoặc USB đều giữ nguyên 100%, không cần phải tải hay cài đặt lại sau mỗi lần nâng cấp phần mềm.
                </p>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* Action Button Create/Edit Modal */}
      {isBtnModalOpen && (
        <ActionButtonModal
          button={editingBtn}
          onClose={() => {
            setIsBtnModalOpen(false);
            setEditingBtn(null);
          }}
          onSave={handleSaveActionButton}
        />
      )}
      </div>
    </div>
  );
};
