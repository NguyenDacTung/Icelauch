import React, { useState, useEffect, useRef } from 'react';
import { Navbar } from './components/layout/Navbar';
import { DownloadTray } from './components/layout/DownloadTray';
import { MiniPlayer } from './components/layout/MiniPlayer';
import { HomeView } from './components/home/HomeView';
import { GameDetailView } from './components/home/GameDetailView';
import { LibraryView } from './components/library/LibraryView';
import { MediaView } from './components/media/MediaView';
import { SettingsView } from './components/common/SettingsView';
import { AdminAuthModal } from './components/admin/AdminAuthModal';
import { GameFormModal } from './components/admin/GameFormModal';
import { MediaFormModal } from './components/admin/MediaFormModal';
import { BannerManagerModal } from './components/admin/BannerManagerModal';
import { PasswordPromptModal } from './components/common/PasswordPromptModal';
import { FirstRunModal } from './components/common/FirstRunModal';
import { setActiveProxyPort } from './utils/mediaUrl';
import { SeasonalParticleEngine } from './components/common/SeasonalParticleEngine';
import { AppWallpaper } from './components/common/AppWallpaper';
import { FloatingMiniDiscWidget } from './components/media/FloatingMiniDiscWidget';
import { UpdateToast } from './components/common/UpdateToast';
import { ProfilePickerView } from './components/profile/ProfilePickerView';
import { ProfileModal } from './components/profile/ProfileModal';
import { ChangeAdminPinModal } from './components/admin/ChangeAdminPinModal';
import { DeviceSimulatorBar } from './components/admin/DeviceSimulatorBar';
import { DevicePhoneFrame } from './components/common/DevicePhoneFrame';
import { DeviceIncompatibleModal } from './components/common/DeviceIncompatibleModal';
import { DeviceType, detectHardwareDevice, isMobileOrTV } from './utils/deviceDetector';
import { MobileHomeView } from './components/mobile/MobileHomeView';
import { MobileMediaView } from './components/mobile/MobileMediaView';
import { MobileLibraryView } from './components/mobile/MobileLibraryView';
import { MobileGameDetailView } from './components/mobile/MobileGameDetailView';
import { MobileSettingsView } from './components/mobile/MobileSettingsView';
import { MobileVinylPlayerModal } from './components/mobile/MobileVinylPlayerModal';
import { DeviceTVFrame } from './components/tv/DeviceTVFrame';
import { TVHomeMediaView } from './components/tv/TVHomeMediaView';
import { TVGameView } from './components/tv/TVGameView';
import { TVVideoTheaterView } from './components/tv/TVVideoTheaterView';
import { sfx } from './utils/sfx';
import { registerItemToBanner } from './utils/bannerResolver';
import type { 
  AppData, 
  Game, 
  MediaItem, 
  NavigationTab, 
  DownloadProgress, 
  InstallProgress, 
  MediaPlaylist, 
  AppSettings, 
  AppBannerSettings,
  UserProfile,
  CloudSyncSettings
} from './types';

export default function App() {
  const [appData, setAppData] = useState<AppData | null>(null);
  const [currentTab, setCurrentTab] = useState<NavigationTab>('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const [viewingDetailGame, setViewingDetailGame] = useState<Game | null>(null);
  const [tvPlayingMedia, setTvPlayingMedia] = useState<MediaItem | null>(null);
  const [isDownloadTrayOpen, setIsDownloadTrayOpen] = useState(false);

  // Admin state
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminTimeRemaining, setAdminTimeRemaining] = useState(15 * 60); // 15 mins
  const [isAdminAuthOpen, setIsAdminAuthOpen] = useState(false);
  const adminTimerRef = useRef<any>(null);

  // Modals state
  const [isGameFormOpen, setIsGameFormOpen] = useState(false);
  const [editingGame, setEditingGame] = useState<Game | null>(null);
  const [isMediaFormOpen, setIsMediaFormOpen] = useState(false);
  const [editingMedia, setEditingMedia] = useState<MediaItem | null>(null);
  const [isBannerManagerOpen, setIsBannerManagerOpen] = useState(false);
  const [isFirstRunOpen, setIsFirstRunOpen] = useState(false);
  const [isChangeAdminPinOpen, setIsChangeAdminPinOpen] = useState(false);
  const [passwordPromptData, setPasswordPromptData] = useState<{
    gameId: string;
    gameName: string;
    isRetry?: boolean;
  } | null>(null);

  // Audio player state
  const [currentTrack, setCurrentTrack] = useState<MediaItem | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isMobileVinylOpen, setIsMobileVinylOpen] = useState(false);

  // Multi-User Profile State
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [activeProfile, setActiveProfile] = useState<UserProfile | null>(null);
  const [isProfilePickerOpen, setIsProfilePickerOpen] = useState(false);
  const [isEditingCurrentProfile, setIsEditingCurrentProfile] = useState(false);
  const [cloudSyncSettings, setCloudSyncSettings] = useState<CloudSyncSettings>({
    enabled: false,
    supabaseUrl: '',
    supabaseAnonKey: '',
    autoSyncIntervalMinutes: 5,
    lastSyncStatus: 'idle',
  });

  // Cross-Platform & Device Simulator State
  const [simulatedDevice, setSimulatedDevice] = useState<DeviceType>('windows_pc');
  const [incompatibleGame, setIncompatibleGame] = useState<Game | null>(null);

  const effectiveDevice: DeviceType = isAdmin ? simulatedDevice : detectHardwareDevice();

  // Load Initial App Data
  const loadData = async () => {
    if (window.api) {
      try {
        const data = await window.api.getAppData();
        setAppData(data);
        if (window.api.getProxyPort) {
          const port = await window.api.getProxyPort();
          if (port) setActiveProxyPort(port);
        }

        // Multi-User Profile Auto-Login & Initialization
        if (window.api.getProfiles) {
          const loadedProfiles = await window.api.getProfiles();
          setProfiles(loadedProfiles || []);

          const active = await window.api.getActiveProfile();
          const rememberedId = await window.api.getRememberedProfileId();

          if (active) {
            setActiveProfile(active);
            setIsProfilePickerOpen(false);
          } else if (rememberedId) {
            const remembered = (loadedProfiles || []).find((p: UserProfile) => p.id === rememberedId);
            if (remembered) {
              setActiveProfile(remembered);
              setIsProfilePickerOpen(false);
            } else if ((loadedProfiles || []).length > 0) {
              setIsProfilePickerOpen(true);
            }
          } else if ((loadedProfiles || []).length > 0) {
            setIsProfilePickerOpen(true);
          }
        }

        if (window.api.getCloudSyncSettings) {
          const cloud = await window.api.getCloudSyncSettings();
          if (cloud) setCloudSyncSettings(cloud);
        }
      } catch (err) {
        console.error('Failed to get app data from IPC:', err);
      }
    } else {
      console.warn('window.api not available yet, setting fallback default data...');
      setAppData({
        games: [],
        media: [],
        settings: {
          deleteArchiveDefault: true,
          runAsAdminDefault: false,
          appRootPath: 'C:\\Icelauch',
          gamesPath: 'C:\\Icelauch\\Games',
          downloadsPath: 'C:\\Icelauch\\Downloads',
        },
      });
    }
  };

  useEffect(() => {
    loadData();

    // Listen to IPC events
    if (window.api) {
      const unsubGame = window.api.onGameUpdated((updatedGame: Game) => {
        setAppData((prev) => {
          if (!prev) return prev;
          const idx = prev.games.findIndex((g) => g.id === updatedGame.id);
          const newGames = [...prev.games];
          if (idx !== -1) {
            newGames[idx] = updatedGame;
          } else {
            newGames.push(updatedGame);
          }
          return { ...prev, games: newGames };
        });
        setViewingDetailGame((prev) => (prev && prev.id === updatedGame.id ? updatedGame : prev));
      });

      const unsubDownload = window.api.onDownloadProgress(({ gameId, progress }: { gameId: string; progress: DownloadProgress }) => {
        setAppData((prev) => {
          if (!prev) return prev;
          const newGames = prev.games.map((g) => {
            if (g.id === gameId) {
              return { ...g, downloadProgress: progress };
            }
            return g;
          });
          return { ...prev, games: newGames };
        });
        setViewingDetailGame((prev) => (prev && prev.id === gameId ? { ...prev, downloadProgress: progress } : prev));
      });

      const unsubInstall = window.api.onInstallProgress(({ gameId, progress }: { gameId: string; progress: InstallProgress }) => {
        setAppData((prev) => {
          if (!prev) return prev;
          const newGames = prev.games.map((g) => {
            if (g.id === gameId) {
              return { ...g, installProgress: progress };
            }
            return g;
          });
          return { ...prev, games: newGames };
        });
        setViewingDetailGame((prev) => (prev && prev.id === gameId ? { ...prev, installProgress: progress } : prev));
      });

      const unsubPassword = window.api.onPromptPassword((data: { gameId: string; gameName: string; isRetry?: boolean }) => {
        setPasswordPromptData(data);
      });

      const unsubMedia = window.api.onMediaUpdated ? window.api.onMediaUpdated((updatedMedia: MediaItem) => {
        setAppData((prev) => {
          if (!prev) return prev;
          const idx = prev.media.findIndex((m) => m.id === updatedMedia.id);
          const newMedia = [...prev.media];
          if (idx !== -1) {
            newMedia[idx] = updatedMedia;
          } else {
            newMedia.push(updatedMedia);
          }
          return { ...prev, media: newMedia };
        });
      }) : () => {};

      const unsubMediaDownload = window.api.onMediaDownloadProgress ? window.api.onMediaDownloadProgress(({ mediaId, progress }: { mediaId: string; progress: number }) => {
        setAppData((prev) => {
          if (!prev) return prev;
          const newMedia = prev.media.map((m) => {
            if (m.id === mediaId) {
              return { ...m, downloadProgress: progress, downloadStatus: 'downloading' as const };
            }
            return m;
          });
          return { ...prev, media: newMedia };
        });
      }) : () => {};

      const unsubCloud = (window.api as any).onCloudSynced ? (window.api as any).onCloudSynced((data: { profiles: UserProfile[]; message: string }) => {
        if (data?.profiles) {
          setProfiles(data.profiles);
          setCloudSyncSettings((prev) => ({
            ...prev,
            lastSyncedAt: new Date().toISOString(),
            lastSyncStatus: 'success',
            lastSyncMessage: data.message,
          }));
        }
      }) : () => {};

      return () => {
        unsubGame();
        unsubDownload();
        unsubInstall();
        unsubPassword();
        unsubMedia();
        unsubMediaDownload();
        unsubCloud();
      };
    }
  }, []);

  // Admin Auto-Lock Timer (15 minutes of inactivity)
  useEffect(() => {
    if (isAdmin) {
      setAdminTimeRemaining(15 * 60);
      adminTimerRef.current = setInterval(() => {
        setAdminTimeRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(adminTimerRef.current);
            setIsAdmin(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (adminTimerRef.current) clearInterval(adminTimerRef.current);
    }
    return () => {
      if (adminTimerRef.current) clearInterval(adminTimerRef.current);
    };
  }, [isAdmin]);

  const handleLockAdmin = () => {
    setIsAdmin(false);
  };

  const handleAdminSuccess = () => {
    setIsAdmin(true);
  };

  // Game actions
  const handleLaunchGame = async (id: string) => {
    if (window.api) await window.api.launchGame(id);
  };

  const handleDownloadGame = async (id: string) => {
    if (!window.api) return;
    const game = appData?.games.find((g) => g.id === id);
    if (!game) return;

    // If user enabled "Luôn hỏi vị trí lưu trước khi tải game mới" and game has no specific installPath
    if (appData?.settings.askInstallLocationBeforeDownload && !game.installPath) {
      const defaultPath = appData.settings.defaultGamesInstallPath || appData.settings.gamesPath;
      const chosenFolder = await window.api.browseFolder({
        title: `Chọn thư mục cài đặt cho ${game.name} (trên bất kỳ ổ đĩa nào)`,
        defaultPath,
      });
      if (chosenFolder) {
        await window.api.saveGame({
          id: game.id,
          installPath: chosenFolder,
        });
      }
    }

    await window.api.downloadGame(id);
  };

  const handleCancelDownload = async (id: string) => {
    if (confirm('Bạn có chắc muốn huỷ tiến trình tải/cài đặt này?')) {
      if (window.api) await window.api.cancelDownload(id, true);
    }
  };

  const handleRetryGame = async (id: string) => {
    if (window.api) await window.api.retryGame(id);
  };

  const handleToggleLibrary = async (id: string) => {
    if (activeProfile && window.api?.updateProfileLibrary) {
      const isNowInLibrary = !activeProfile.library?.includes(id);
      await window.api.updateProfileLibrary(activeProfile.id, id, isNowInLibrary);
      setActiveProfile((prev) => {
        if (!prev) return prev;
        const newLib = isNowInLibrary
          ? [...(prev.library || []), id]
          : (prev.library || []).filter((item) => item !== id);
        return { ...prev, library: newLib };
      });
      // Also update in profiles list
      setProfiles((prev) =>
        prev.map((p) => {
          if (p.id === activeProfile.id) {
            const newLib = isNowInLibrary
              ? [...(p.library || []), id]
              : (p.library || []).filter((item) => item !== id);
            return { ...p, library: newLib };
          }
          return p;
        })
      );
    } else if (window.api) {
      await window.api.toggleInLibrary(id);
    }
  };

  const handleOpenFolder = async (target: 'app' | 'games' | 'downloads' | 'gameDir', gameId?: string) => {
    if (window.api) await window.api.openFolder(target, gameId);
  };

  const handleUninstallGame = async (id: string) => {
    if (confirm('Xoá thư mục game? Dữ liệu lưu game (save) có thể bị mất.')) {
      if (window.api) await window.api.uninstallGame(id);
    }
  };

  const handleSaveGame = async (gameData: Partial<Game>) => {
    if (window.api) {
      const savedGame = await window.api.saveGame(gameData);
      
      // Auto register to banner if pinned or autoAddNew is enabled for newly created games
      if (appData && savedGame && (gameData.isBannerPinned || (!gameData.id && appData.settings.bannerSettings?.games.autoAddNew))) {
        const updatedBannerSettings = registerItemToBanner(
          appData.settings.bannerSettings,
          'games',
          savedGame.id,
          'game',
          gameData.isBannerPermanent ? null : 7,
          gameData.isBannerPermanent
        );
        await window.api.saveSettings({ bannerSettings: updatedBannerSettings });
      }

      await loadData();
    }
  };

  const handleDeleteGame = async (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xoá game này khỏi danh mục Icelauch?')) {
      const deleteFiles = confirm('Bạn có muốn xoá luôn thư mục cài đặt game trên đĩa không?');
      if (window.api) {
        await window.api.deleteGame(id, deleteFiles);
        await loadData();
      }
    }
  };

  const handleSaveGameSettings = async (gameId: string, updates: Partial<Game>) => {
    if (window.api) {
      await window.api.saveGame({ id: gameId, ...updates });
      await loadData();
    }
  };

  const handleSelectCustomExe = async (gameId: string) => {
    if (window.api) {
      const filePath = await window.api.browseFile({
        title: 'Chọn file chạy .exe',
        filters: [{ name: 'Executable Files', extensions: ['exe'] }],
      });
      if (filePath) {
        await window.api.setGameMainExe(gameId, filePath);
        await loadData();
      }
    }
  };

  const handleAutoPickExe = async (gameId: string) => {
    if (window.api) {
      await window.api.autoPickExe(gameId);
      await loadData();
    }
  };

  const handleToggleHideGame = async (gameId: string) => {
    if (!appData) return;
    const target = appData.games.find((g) => g.id === gameId);
    if (!target) return;
    const newHidden = !target.hidden;
    const updated = { ...target, hidden: newHidden };
    setAppData({
      ...appData,
      games: appData.games.map((g) => (g.id === gameId ? updated : g)),
    });
    setViewingDetailGame((prev) => (prev && prev.id === gameId ? updated : prev));
    if (window.api) {
      await window.api.saveGame({ id: gameId, hidden: newHidden });
    }
  };

  const handleToggleHideMedia = async (mediaId: string) => {
    if (!appData) return;
    const target = appData.media.find((m) => m.id === mediaId);
    if (!target) return;
    const newHidden = !target.hidden;
    const updated = { ...target, hidden: newHidden };
    setAppData({
      ...appData,
      media: appData.media.map((m) => (m.id === mediaId ? updated : m)),
    });
    if (window.api) {
      await window.api.saveMedia({ id: mediaId, hidden: newHidden });
    }
  };

  // Media actions
  const handlePlayAudio = (track: MediaItem) => {
    setCurrentTrack(track);
    setIsPlayingAudio(true);
    if (effectiveDevice === 'android_mobile') {
      setIsMobileVinylOpen(true);
    }
  };

  const handleSaveMedia = async (mediaData: Partial<MediaItem>) => {
    if (window.api) {
      const savedMedia = await window.api.saveMedia(mediaData);

      // Auto register to banner if pinned or autoAddNew is enabled for newly created media
      if (appData && savedMedia) {
        const secKey: keyof AppBannerSettings = 
          mediaData.type === 'video' 
            ? 'videos' 
            : mediaData.subType === 'podcast' 
            ? 'podcasts' 
            : 'music';

        if (mediaData.isBannerPinned || (!mediaData.id && appData.settings.bannerSettings?.[secKey]?.autoAddNew)) {
          const updatedBannerSettings = registerItemToBanner(
            appData.settings.bannerSettings,
            secKey,
            savedMedia.id,
            'media',
            mediaData.isBannerPermanent ? null : 7,
            mediaData.isBannerPermanent
          );
          await window.api.saveSettings({ bannerSettings: updatedBannerSettings });
        }
      }

      await loadData();
    }
  };

  const handleSaveBannerSettings = async (newBannerSettings: AppBannerSettings) => {
    if (!appData) return;
    const updatedSettings: AppSettings = {
      ...appData.settings,
      bannerSettings: newBannerSettings,
    };
    setAppData({ ...appData, settings: updatedSettings });
    if (window.api) {
      await window.api.saveSettings({ bannerSettings: newBannerSettings });
    }
  };

  const handleDeleteMedia = async (id: string) => {
    if (confirm('Bạn có chắc muốn xoá mục này?')) {
      if (window.api) {
        await window.api.deleteMedia(id);
        await loadData();
      }
    }
  };

  const handleUpdateMediaProgress = async (mediaId: string, position: number, watched: boolean) => {
    if (activeProfile && window.api?.updateProfileWatchProgress) {
      const mediaItem = appData?.media.find((m) => m.id === mediaId);
      const duration = mediaItem?.duration || 0;
      await window.api.updateProfileWatchProgress(activeProfile.id, mediaId, position, duration, watched);
      setActiveProfile((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          watchProgress: {
            ...prev.watchProgress,
            [mediaId]: {
              currentTime: position,
              duration,
              completed: watched,
              lastWatchedAt: Date.now(),
            },
          },
        };
      });
    }
    if (window.api) {
      await window.api.updateMediaProgress(mediaId, position, watched);
    }
  };

  // Profile Management Handlers
  const handleSelectProfile = async (
    profile: UserProfile,
    remember: boolean
  ): Promise<{ success: boolean; error?: string }> => {
    if (window.api?.loginProfile) {
      const res = await window.api.loginProfile({ id: profile.id, pin: (profile as any).enteredPin || '', remember });
      if (res.success && res.profile) {
        setActiveProfile(res.profile);
        setIsProfilePickerOpen(false);
        sfx.playSuccess();
        return { success: true };
      }
      return { success: false, error: res.error || 'Mã PIN không đúng' };
    }
    setActiveProfile(profile);
    setIsProfilePickerOpen(false);
    return { success: true };
  };

  const handleSelectGuest = () => {
    setActiveProfile(null);
    setIsProfilePickerOpen(false);
    sfx.playClick();
  };

  const handleSaveProfile = async (data: {
    id?: string;
    nickname: string;
    avatar: string;
    pin: string;
    remember: boolean;
  }) => {
    if (window.api?.saveProfile) {
      let pinHash = '';
      if (data.pin && window.api.hashPin) {
        pinHash = await window.api.hashPin(data.pin);
      }

      const existing = profiles.find((p) => p.id === data.id);
      const toSave: UserProfile = {
        id: data.id || `user-${Date.now()}`,
        nickname: data.nickname,
        avatar: data.avatar,
        pinHash: pinHash || existing?.pinHash || '',
        createdDate: existing?.createdDate || new Date().toISOString(),
        lastActiveDate: new Date().toISOString(),
        library: existing?.library || [],
        favoriteMedia: existing?.favoriteMedia || [],
        watchProgress: existing?.watchProgress || {},
        gameStats: existing?.gameStats || {},
      };

      const saved = await window.api.saveProfile(toSave);
      const updatedProfiles = await window.api.getProfiles();
      setProfiles(updatedProfiles);
      setActiveProfile(saved);
      setIsProfilePickerOpen(false);

      if (data.remember && window.api.loginProfile) {
        await window.api.loginProfile({ id: saved.id, pin: data.pin, remember: true });
      }

      sfx.playSuccess();
    }
  };

  const handleDeleteProfile = async (id: string) => {
    if (window.api?.deleteProfile) {
      await window.api.deleteProfile(id);
      const updated = await window.api.getProfiles();
      setProfiles(updated);
      if (activeProfile?.id === id) {
        setActiveProfile(null);
        setIsProfilePickerOpen(true);
      }
      sfx.playSuccess();
    }
  };

  const handleSwitchProfile = () => {
    sfx.playClick();
    setIsProfilePickerOpen(true);
  };

  const handleLogoutProfile = async () => {
    sfx.playClick();
    if (window.api?.logoutProfile) {
      await window.api.logoutProfile();
    }
    setActiveProfile(null);
    setIsProfilePickerOpen(true);
  };

  const handleSaveCloudSync = async (settings: Partial<CloudSyncSettings>) => {
    if (window.api?.saveCloudSyncSettings) {
      const updated = await window.api.saveCloudSyncSettings(settings);
      setCloudSyncSettings(updated);
    }
  };

  const handleSavePlaylist = async (playlist: Partial<MediaPlaylist>) => {
    if (window.api && window.api.savePlaylist) {
      await window.api.savePlaylist(playlist);
      await loadData();
    }
  };

  const handleDeletePlaylist = async (id: string) => {
    if (window.api && window.api.deletePlaylist) {
      await window.api.deletePlaylist(id);
      await loadData();
    }
  };

  const handleDownloadMedia = async (id: string) => {
    if (window.api && window.api.downloadMedia) {
      await window.api.downloadMedia(id);
    }
  };

  const handleDeleteDownloadedMedia = async (id: string) => {
    if (window.api && window.api.deleteDownloadedMedia) {
      await window.api.deleteDownloadedMedia(id);
      await loadData();
    }
  };

  const handleSaveSettings = async (settingsUpdate: Partial<AppSettings>) => {
    if (!appData) return;
    const newSettings = { ...appData.settings, ...settingsUpdate };
    setAppData({ ...appData, settings: newSettings });
    if (window.api) {
      await window.api.saveSettings(settingsUpdate);
    }
  };

  // Password submission for 7-zip
  const handleSubmitArchivePassword = async (password: string, saveForGame: boolean) => {
    if (passwordPromptData && window.api) {
      await window.api.submitArchivePassword(passwordPromptData.gameId, password, saveForGame);
      setPasswordPromptData(null);
    }
  };

  // Settings & JSON actions
  const handleExportData = async (mode: 'full' | 'share') => {
    if (window.api) {
      const res = await window.api.exportData(mode);
      if (res.success) {
        alert(`Đã xuất dữ liệu thành công: ${res.filePath}`);
      }
    }
  };

  const handleImportData = async () => {
    if (window.api) {
      const res = await window.api.importData();
      if (res.success) {
        alert(`Đã nhập thành công ${res.count} mục vào danh mục!`);
        await loadData();
      } else if (res.error && res.error !== 'Cancelled') {
        alert(`Lỗi nhập dữ liệu: ${res.error}`);
      }
    }
  };

  const handleLoadDemoData = async () => {
    if (confirm('Nạp bộ dữ liệu mẫu (Demo) cho Icelauch? Các mục trùng lặp sẽ được cập nhật.')) {
      if (window.api) {
        await window.api.loadDemoData();
        await loadData();
      }
    }
  };

  const handleFirstRunComplete = async (loadDemo: boolean) => {
    setIsFirstRunOpen(false);
    if (loadDemo) {
      await handleLoadDemoData();
    } else {
      await loadData();
    }
  };

  if (!appData) {
    return (
      <div className="h-screen w-screen bg-ice-bg flex flex-col items-center justify-center text-ice-subtext space-y-3">
        <div className="w-10 h-10 border-2 border-ice-accent border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-semibold tracking-wider uppercase text-white">Đang khởi tạo Icelauch...</p>
      </div>
    );
  }

  const activeDownloads = appData.games.filter(
    (g) => g.status === 'downloading' || g.status === 'installing' || g.status === 'error'
  );

  return (
    <div className="h-screen w-screen bg-ice-bg text-ice-text flex flex-col overflow-hidden">
      {/* 1. Top Navbar (56px) */}
      <Navbar
        currentTab={currentTab}
        onTabChange={(tab) => {
          setViewingDetailGame(null);
          setCurrentTab(tab);
        }}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        activeDownloadsCount={activeDownloads.length}
        isDownloadTrayOpen={isDownloadTrayOpen}
        onToggleDownloadTray={() => setIsDownloadTrayOpen(!isDownloadTrayOpen)}
        isAdmin={isAdmin}
        adminTimeRemaining={adminTimeRemaining}
        onOpenAdminAuth={() => setIsAdminAuthOpen(true)}
        onLockAdmin={handleLockAdmin}
        onOpenBannerManager={() => setIsBannerManagerOpen(true)}
        activeProfile={activeProfile}
        onSwitchProfile={handleSwitchProfile}
        onEditCurrentProfile={() => setIsEditingCurrentProfile(true)}
        onLogoutProfile={handleLogoutProfile}
      />

      {/* 2. Download Tray Floating Panel */}
      <DownloadTray
        isOpen={isDownloadTrayOpen}
        onClose={() => setIsDownloadTrayOpen(false)}
        games={appData.games}
        onCancelDownload={handleCancelDownload}
        onRetry={handleRetryGame}
      />

      {/* Admin Device Simulator Switcher Toolbar */}
      {isAdmin && (
        <DeviceSimulatorBar
          currentDevice={simulatedDevice}
          onChangeDevice={(dev) => {
            setSimulatedDevice(dev);
            if (dev !== 'windows_pc' && currentTab === 'home') {
              setCurrentTab('media');
            }
          }}
          isAdmin={isAdmin}
        />
      )}

      {/* 3. Main Page Content View */}
      <main className="flex-1 flex overflow-hidden relative">
        {effectiveDevice === 'android_tv' ? (
          <DeviceTVFrame
            currentTab={currentTab}
            onTabChange={(tab) => setCurrentTab(tab as NavigationTab)}
            onExitSimulation={() => setSimulatedDevice('windows_pc')}
            isAdmin={isAdmin}
            adminTimeRemaining={adminTimeRemaining}
            onOpenAdminAuth={() => setIsAdminAuthOpen(true)}
            onLockAdmin={handleLockAdmin}
            activeProfile={activeProfile}
            onSwitchProfile={handleSwitchProfile}
            onEditCurrentProfile={() => setIsEditingCurrentProfile(true)}
            onLogoutProfile={handleLogoutProfile}
          >
            {tvPlayingMedia ? (
              <TVVideoTheaterView
                media={tvPlayingMedia}
                onBack={() => setTvPlayingMedia(null)}
                onUpdateProgress={handleUpdateMediaProgress}
              />
            ) : (
              <>
                {/* TV Tab 1: Giải Trí (Default Main Tab) */}
                {currentTab === 'media' && (
                  <TVHomeMediaView
                    media={appData.media}
                    bannerSettings={appData.settings.bannerSettings?.videos}
                    onPlayMedia={(item) => setTvPlayingMedia(item)}
                    onToggleLibrary={handleToggleLibrary}
                  />
                )}

                {/* TV Tab 2: Game (PC Showcase) */}
                {currentTab === 'home' && (
                  <TVGameView
                    games={appData.games}
                    bannerSettings={appData.settings.bannerSettings?.games}
                    onSelectGame={(game) => setViewingDetailGame(game)}
                    onIncompatibleClick={(game) => setIncompatibleGame(game)}
                    onToggleLibrary={handleToggleLibrary}
                  />
                )}

                {/* TV Tab 3: Yêu thích (Library) */}
                {currentTab === 'library' && (
                  <TVHomeMediaView
                    media={appData.media.filter((m) => activeProfile?.library?.includes(m.id))}
                    onPlayMedia={(item) => setTvPlayingMedia(item)}
                    onToggleLibrary={handleToggleLibrary}
                  />
                )}

                {/* TV Tab 4: Cài Đặt */}
                {currentTab === 'settings' && (
                  <MobileSettingsView
                    settings={appData.settings}
                    isAdmin={isAdmin}
                    cloudSync={cloudSyncSettings}
                    onChangePin={() => setIsChangeAdminPinOpen(true)}
                    onOpenAdminAuth={() => setIsAdminAuthOpen(true)}
                    onSaveSettings={handleSaveSettings}
                    onSaveCloudSync={handleSaveCloudSync}
                  />
                )}
              </>
            )}
          </DeviceTVFrame>
        ) : effectiveDevice === 'android_mobile' ? (
          <DevicePhoneFrame
            currentTab={currentTab}
            onTabChange={setCurrentTab}
            onExitSimulation={() => setSimulatedDevice('windows_pc')}
            isAdmin={isAdmin}
            adminTimeRemaining={adminTimeRemaining}
            onOpenAdminAuth={() => setIsAdminAuthOpen(true)}
            onLockAdmin={handleLockAdmin}
            activeProfile={activeProfile}
            onSwitchProfile={handleSwitchProfile}
            onEditCurrentProfile={() => setIsEditingCurrentProfile(true)}
            onLogoutProfile={handleLogoutProfile}
          >
            {viewingDetailGame ? (
              <MobileGameDetailView
                game={viewingDetailGame}
                isAdmin={isAdmin}
                onBack={() => setViewingDetailGame(null)}
                onToggleLibrary={handleToggleLibrary}
                onIncompatibleClick={(game) => setIncompatibleGame(game)}
                onOpenFolder={(id) => handleOpenFolder('gameDir', id)}
                globalActionButtons={appData.settings.globalActionButtons || []}
              />
            ) : (
              <>
                {currentTab === 'home' && (
                  <MobileHomeView
                    games={appData.games}
                    allMedia={appData.media}
                    settings={appData.settings}
                    isAdmin={isAdmin}
                    searchQuery={searchQuery}
                    onSelectGame={(game) => setViewingDetailGame(game)}
                    onIncompatibleClick={(game) => setIncompatibleGame(game)}
                    onToggleLibrary={handleToggleLibrary}
                  />
                )}

                {currentTab === 'library' && (
                  <MobileLibraryView
                    games={appData.games}
                    selectedGameId={selectedGameId}
                    isAdmin={isAdmin}
                    userLibraryIds={activeProfile?.library}
                    globalActionButtons={appData.settings.globalActionButtons || []}
                    onSelectGame={(game) => setSelectedGameId(game.id)}
                    onIncompatibleClick={(game) => setIncompatibleGame(game)}
                    onOpenFolder={(id) => handleOpenFolder('gameDir', id)}
                    onToggleLibrary={handleToggleLibrary}
                  />
                )}

                {currentTab === 'media' && (
                  <MobileMediaView
                    media={appData.media}
                    playlists={appData.playlists || []}
                    bannerSettings={appData.settings.bannerSettings?.videos}
                    isAdmin={isAdmin}
                    searchQuery={searchQuery}
                    onPlayAudio={handlePlayAudio}
                    onSaveMedia={handleSaveMedia}
                    onDeleteMedia={handleDeleteMedia}
                    onUpdateMediaProgress={handleUpdateMediaProgress}
                    onDownloadMedia={handleDownloadMedia}
                    onDeleteDownloaded={handleDeleteDownloadedMedia}
                  />
                )}

                {currentTab === 'settings' && (
                  <MobileSettingsView
                    settings={appData.settings}
                    isAdmin={isAdmin}
                    cloudSync={cloudSyncSettings}
                    onChangePin={() => setIsChangeAdminPinOpen(true)}
                    onOpenAdminAuth={() => setIsAdminAuthOpen(true)}
                    onSaveSettings={handleSaveSettings}
                    onSaveCloudSync={handleSaveCloudSync}
                  />
                )}
              </>
            )}
          </DevicePhoneFrame>
        ) : (
          <>
            {viewingDetailGame ? (
              <GameDetailView
                game={viewingDetailGame}
                isAdmin={isAdmin}
                deviceType={effectiveDevice}
                onIncompatibleClick={(game) => setIncompatibleGame(game)}
                onBack={() => setViewingDetailGame(null)}
                onLaunch={handleLaunchGame}
                onDownload={handleDownloadGame}
                onCancelDownload={handleCancelDownload}
                onRetry={handleRetryGame}
                onToggleLibrary={handleToggleLibrary}
                onToggleHide={handleToggleHideGame}
                onEditGame={(game) => {
                  setEditingGame(game);
                  setIsGameFormOpen(true);
                }}
                onOpenFolder={(id) => handleOpenFolder('gameDir', id)}
                globalActionButtons={appData.settings.globalActionButtons || []}
              />
            ) : (
              <>
                {currentTab === 'home' && (
                  <HomeView
                    games={appData.games}
                    allMedia={appData.media}
                    settings={appData.settings}
                    isAdmin={isAdmin}
                    searchQuery={searchQuery}
                    deviceType={effectiveDevice}
                    onIncompatibleClick={(game) => setIncompatibleGame(game)}
                    onSelectGame={(game) => setViewingDetailGame(game)}
                    onSelectMedia={(mediaItem) => {
                      setCurrentTab('media');
                    }}
                    onLaunch={handleLaunchGame}
                    onDownload={handleDownloadGame}
                    onCancelDownload={handleCancelDownload}
                    onRetry={handleRetryGame}
                    onToggleLibrary={handleToggleLibrary}
                    onToggleHide={handleToggleHideGame}
                    onOpenFolder={(id) => handleOpenFolder('gameDir', id)}
                    onUninstall={handleUninstallGame}
                    onEditGame={(game) => {
                      setEditingGame(game);
                      setIsGameFormOpen(true);
                    }}
                    onDeleteGame={handleDeleteGame}
                    onOpenAddGame={() => {
                      setEditingGame(null);
                      setIsGameFormOpen(true);
                    }}
                    onLoadDemoData={handleLoadDemoData}
                  />
                )}

                {currentTab === 'library' && (
                  <LibraryView
                    games={appData.games}
                    selectedGameId={selectedGameId}
                    isAdmin={isAdmin}
                    userLibraryIds={activeProfile?.library}
                    onSelectGame={(game) => setSelectedGameId(game.id)}
                    onOpenDetail={(game) => setViewingDetailGame(game)}
                    onLaunch={handleLaunchGame}
                    onDownload={handleDownloadGame}
                    onCancelDownload={handleCancelDownload}
                    onRetry={handleRetryGame}
                    onOpenFolder={(id) => handleOpenFolder('gameDir', id)}
                    onUninstall={handleUninstallGame}
                    onSaveGameSettings={handleSaveGameSettings}
                    onSelectCustomExe={handleSelectCustomExe}
                    onAutoPickExe={handleAutoPickExe}
                    onToggleLibrary={handleToggleLibrary}
                    globalActionButtons={appData.settings.globalActionButtons || []}
                  />
                )}

                {currentTab === 'media' && (
                  <MediaView
                    media={appData.media}
                    playlists={appData.playlists || []}
                    bannerSettings={appData.settings.bannerSettings}
                    isAdmin={isAdmin}
                    searchQuery={searchQuery}
                    onPlayAudio={handlePlayAudio}
                    onSaveMedia={handleSaveMedia}
                    onDeleteMedia={handleDeleteMedia}
                    onToggleHide={handleToggleHideMedia}
                    onOpenAddMedia={() => {
                      setEditingMedia(null);
                      setIsMediaFormOpen(true);
                    }}
                    onEditMedia={(item) => {
                      setEditingMedia(item);
                      setIsMediaFormOpen(true);
                    }}
                    onUpdateMediaProgress={handleUpdateMediaProgress}
                    onSavePlaylist={handleSavePlaylist}
                    onDeletePlaylist={handleDeletePlaylist}
                    onDownloadMedia={handleDownloadMedia}
                    onDeleteDownloaded={handleDeleteDownloadedMedia}
                  />
                )}

                {currentTab === 'settings' && (
                  <SettingsView
                    settings={appData.settings}
                    isAdmin={isAdmin}
                    onOpenFolder={handleOpenFolder}
                    onExportData={handleExportData}
                    onImportData={handleImportData}
                    onLoadDemoData={handleLoadDemoData}
                    onChangePin={() => setIsChangeAdminPinOpen(true)}
                    onOpenAdminAuth={() => setIsAdminAuthOpen(true)}
                    onOpenBannerManager={() => setIsBannerManagerOpen(true)}
                    onSaveSettings={handleSaveSettings}
                    cloudSync={cloudSyncSettings}
                    onSaveCloudSync={handleSaveCloudSync}
                    onUpdateTags={async (type, tags) => {
                      const updatedSettings = {
                        ...appData.settings,
                        [type === 'game' ? 'gameTags' : 'mediaTags']: tags,
                      };
                      setAppData({ ...appData, settings: updatedSettings });
                      if (window.api) {
                        await window.api.saveSettings({
                          [type === 'game' ? 'gameTags' : 'mediaTags']: tags,
                        });
                      }
                    }}
                  />
                )}
              </>
            )}
          </>
        )}
      </main>

      {/* 4. Bottom Sticky Mini Audio Player (64px) */}
      <MiniPlayer
        currentTrack={currentTrack}
        playlist={appData.media.filter((m) => m.type === 'audio')}
        isPlaying={isPlayingAudio}
        onPlayPause={() => setIsPlayingAudio(!isPlayingAudio)}
        onNext={() => {
          const audios = appData.media.filter((m) => m.type === 'audio');
          if (audios.length <= 1) return;
          const idx = audios.findIndex((a) => a.id === currentTrack?.id);
          const next = audios[(idx + 1) % audios.length];
          setCurrentTrack(next);
        }}
        onPrev={() => {
          const audios = appData.media.filter((m) => m.type === 'audio');
          if (audios.length <= 1) return;
          const idx = audios.findIndex((a) => a.id === currentTrack?.id);
          const prev = audios[(idx - 1 + audios.length) % audios.length];
          setCurrentTrack(prev);
        }}
        onClose={() => {
          setIsPlayingAudio(false);
          setCurrentTrack(null);
        }}
        onTrackProgress={(pos) => {
          if (currentTrack) {
            handleUpdateMediaProgress(currentTrack.id, pos, false);
          }
        }}
      />

      {/* 5. Modals */}
      {/* Admin Auth Modal (Always requires PIN verification) */}
      <AdminAuthModal
        isOpen={isAdminAuthOpen}
        hasPinSet={true}
        onClose={() => setIsAdminAuthOpen(false)}
        onSuccess={handleAdminSuccess}
        onSetPin={async (pin) => window.api.setPin(pin)}
        onVerifyPin={async (pin) => window.api.verifyPin(pin)}
        onResetPin={async (key, newPin) => window.api.resetPinWithRecoveryKey(key, newPin)}
      />

      {/* Change Admin PIN Modal (Requires knowing current PIN_PUB or PIN_PRI) */}
      <ChangeAdminPinModal
        isOpen={isChangeAdminPinOpen}
        onClose={() => setIsChangeAdminPinOpen(false)}
        onSuccess={() => {
          setIsChangeAdminPinOpen(false);
          loadData();
        }}
      />

      {/* Add / Edit Game Modal */}
      <GameFormModal
        key={editingGame ? editingGame.id : 'new-game'}
        game={editingGame}
        isOpen={isGameFormOpen}
        onClose={() => {
          setIsGameFormOpen(false);
          setEditingGame(null);
        }}
        onSave={handleSaveGame}
        availableTags={appData.settings.gameTags || []}
        globalActionButtons={appData.settings.globalActionButtons || []}
        onAddNewGlobalTag={async (newTag) => {
          const current = appData.settings.gameTags || [];
          if (!current.includes(newTag)) {
            const updated = [...current, newTag];
            setAppData({
              ...appData,
              settings: { ...appData.settings, gameTags: updated },
            });
            if (window.api) {
              await window.api.saveSettings({ gameTags: updated });
            }
          }
        }}
        onBrowseFile={async (type) => {
          return window.api.browseFile({
            title: type === 'cover' ? 'Chọn ảnh bìa' : 'Chọn ảnh banner',
            filters: [{ name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'webp'] }],
          });
        }}
      />

      {/* Add / Edit Media Modal */}
      <MediaFormModal
        key={editingMedia ? editingMedia.id : 'new-media'}
        media={editingMedia}
        isOpen={isMediaFormOpen}
        onClose={() => {
          setIsMediaFormOpen(false);
          setEditingMedia(null);
        }}
        onSave={handleSaveMedia}
        onBrowseFile={async (type) => {
          return window.api.browseFile({
            title: type === 'cover' ? 'Chọn ảnh bìa / Poster' : 'Chọn ảnh banner',
            filters: [{ name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'webp'] }],
          });
        }}
        availableTags={appData.settings.mediaTags || []}
        onAddNewGlobalTag={async (newTag) => {
          const current = appData.settings.mediaTags || [];
          if (!current.includes(newTag)) {
            const updated = [...current, newTag];
            setAppData({
              ...appData,
              settings: { ...appData.settings, mediaTags: updated },
            });
            if (window.api) {
              await window.api.saveSettings({ mediaTags: updated });
            }
          }
        }}
      />

      {/* Centralized Banner Manager Modal */}
      <BannerManagerModal
        isOpen={isBannerManagerOpen}
        onClose={() => setIsBannerManagerOpen(false)}
        games={appData.games}
        mediaList={appData.media}
        bannerSettings={appData.settings.bannerSettings}
        onSaveBannerSettings={handleSaveBannerSettings}
      />

      {/* Password Prompt Modal for 7-zip */}
      {passwordPromptData && (
        <PasswordPromptModal
          isOpen={true}
          gameId={passwordPromptData.gameId}
          gameName={passwordPromptData.gameName}
          isRetry={passwordPromptData.isRetry}
          isAdmin={isAdmin}
          onClose={() => setPasswordPromptData(null)}
          onSubmit={handleSubmitArchivePassword}
        />
      )}

      {/* First-Run Onboarding Modal */}
      <FirstRunModal
        isOpen={isFirstRunOpen}
        appRootPath={appData.settings.appRootPath}
        onComplete={handleFirstRunComplete}
        onSetPin={async (pin) => window.api.setPin(pin)}
        onOpenFolder={(target) => handleOpenFolder(target)}
      />

      {/* Custom App Wallpaper */}
      <AppWallpaper
        config={appData.settings.wallpaperConfig}
        lowSpecMode={appData.settings.lowSpecMode}
      />

      {/* Seasonal Particle Engine (Winter Snow, Autumn Leaves, Spring Sakura, Summer Fireflies, Cyber Stardust) */}
      <SeasonalParticleEngine
        config={appData.settings.particleConfig}
        enabled={
          appData.settings.ambientSnowEnabled !== false &&
          (!appData.settings.wallpaperConfig?.enabled || appData.settings.wallpaperConfig?.showWithParticles !== false)
        }
        lowSpecMode={appData.settings.lowSpecMode}
      />

      {/* Persistent Background Vinyl Disc Widget (Bottom-right corner) */}
      {currentTrack && (appData.settings.backgroundAudioEnabled !== false) && currentTab !== 'media' && (
        <FloatingMiniDiscWidget
          currentTrack={currentTrack}
          isPlaying={isPlayingAudio}
          currentTime={0}
          duration={currentTrack.duration || 100}
          onTogglePlay={() => setIsPlayingAudio(!isPlayingAudio)}
          onNext={() => {
            const audios = appData.media.filter((m) => m.type === 'audio');
            if (audios.length <= 1) return;
            const idx = audios.findIndex((a) => a.id === currentTrack.id);
            const next = audios[(idx + 1) % audios.length];
            setCurrentTrack(next);
          }}
          onPrev={() => {
            const audios = appData.media.filter((m) => m.type === 'audio');
            if (audios.length <= 1) return;
            const idx = audios.findIndex((a) => a.id === currentTrack.id);
            const prev = audios[(idx - 1 + audios.length) % audios.length];
            setCurrentTrack(prev);
          }}
          onSeek={(pos) => handleUpdateMediaProgress(currentTrack.id, pos, false)}
          onOpenFullPlayer={() => {
            setCurrentTab('media');
          }}
          onClose={() => {
            setIsPlayingAudio(false);
            setCurrentTrack(null);
          }}
        />
      )}

      {/* Netflix-Style Profile Picker */}
      {isProfilePickerOpen && (
        <ProfilePickerView
          profiles={profiles}
          onSelectProfile={handleSelectProfile}
          onSelectGuest={handleSelectGuest}
          onSaveProfile={handleSaveProfile}
          onDeleteProfile={handleDeleteProfile}
        />
      )}

      {/* Profile Edit Modal for active profile */}
      {isEditingCurrentProfile && activeProfile && (
        <ProfileModal
          isOpen={true}
          profile={activeProfile}
          onClose={() => setIsEditingCurrentProfile(false)}
          onSave={async (data) => {
            await handleSaveProfile(data);
            setIsEditingCurrentProfile(false);
          }}
          onDelete={handleDeleteProfile}
        />
      )}

      {/* Device Incompatibility Notice Modal (PC Game on Mobile / Android TV) */}
      <DeviceIncompatibleModal
        isOpen={!!incompatibleGame}
        gameName={incompatibleGame?.name || ''}
        deviceType={effectiveDevice}
        onClose={() => setIncompatibleGame(null)}
      />

      {/* Mobile Fullscreen Vinyl Turntable Player Modal */}
      <MobileVinylPlayerModal
        isOpen={isMobileVinylOpen}
        track={currentTrack}
        playlist={appData?.media.filter((m) => m.type === 'audio') || []}
        isPlaying={isPlayingAudio}
        onClose={() => setIsMobileVinylOpen(false)}
        onPlayPause={() => setIsPlayingAudio(!isPlayingAudio)}
        onNext={() => {
          const audios = appData?.media.filter((m) => m.type === 'audio') || [];
          if (audios.length <= 1) return;
          const idx = audios.findIndex((a) => a.id === currentTrack?.id);
          const next = audios[(idx + 1) % audios.length];
          setCurrentTrack(next);
        }}
        onPrev={() => {
          const audios = appData?.media.filter((m) => m.type === 'audio') || [];
          if (audios.length <= 1) return;
          const idx = audios.findIndex((a) => a.id === currentTrack?.id);
          const prev = audios[(idx - 1 + audios.length) % audios.length];
          setCurrentTrack(prev);
        }}
        onSelectTrack={(t) => setCurrentTrack(t)}
      />

      {/* Floating In-App OTA Update Toast */}
      <UpdateToast onGoToSettings={() => setCurrentTab('settings')} />
    </div>
  );
}
