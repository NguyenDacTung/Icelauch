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
import { setActiveProxyPort, getActiveProxyPort } from './utils/mediaUrl';
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
import { MobileUpdateModal } from './components/mobile/MobileUpdateModal';
import { checkMobileUpdate, checkTVUpdate, type MobileUpdateInfo, type TVUpdateInfo } from './utils/apkUpdater';
import { DeviceTVFrame } from './components/tv/DeviceTVFrame';
import { TVHomeMediaView } from './components/tv/TVHomeMediaView';
import { TVGameView } from './components/tv/TVGameView';
import { TVVideoTheaterView } from './components/tv/TVVideoTheaterView';
import { TVSettingsView } from './components/tv/TVSettingsView';
import { TVUpdateModal } from './components/tv/TVUpdateModal';
import { DeviceSelectionModal } from './components/common/DeviceSelectionModal';
import { ExtrasView } from './components/extras/ExtrasView';
import { AdminUserManagementModal } from './components/admin/AdminUserManagementModal';
import { GameInstallModal } from './components/home/GameInstallModal';
import { MobileLandscapeGamepad } from './components/extras/MobileLandscapeGamepad';
import type { GameControllerConfig } from './types';
import { RequireLoginModal } from './components/common/RequireLoginModal';
import { FloatingMiniPlayer } from './components/media/FloatingMiniPlayer';
import { App as CapApp } from '@capacitor/app';
import {
  isElectron,
  isAndroidPlatform,
  getStoredDevicePreference,
  setStoredDevicePreference,
  hasPromptedDeviceChoice,
  fetchDirectCloudCatalog,
  verifyAdminPin,
  setAdminPinMobile,
  DEFAULT_SUPABASE_URL,
  DEFAULT_SUPABASE_ANON_KEY
} from './services/platformAdapter';
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
  CloudSyncSettings,
  PasswordResetRequest
} from './types';

export default function App() {
  const [appData, setAppData] = useState<AppData | null>(null);
  const [currentTab, setCurrentTab] = useState<NavigationTab>(() => {
    return detectHardwareDevice() === 'android_mobile' ? 'media' : 'home';
  });
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
  const isDesktopElectron = isElectron();
  const [simulatedDevice, setSimulatedDevice] = useState<DeviceType>('windows_pc');
  const [devicePreference, setDevicePreference] = useState<DeviceType | null>(() => getStoredDevicePreference());
  // Never block startup with device selection modal
  const [isDeviceModalOpen, setIsDeviceModalOpen] = useState<boolean>(false);
  const [incompatibleGame, setIncompatibleGame] = useState<Game | null>(null);

  // Desktop Electron MUST ALWAYS be native windows_pc unless Admin actively toggles simulator
  const effectiveDevice: DeviceType = isDesktopElectron
    ? (isAdmin ? simulatedDevice : 'windows_pc')
    : (isAdmin ? simulatedDevice : (devicePreference || detectHardwareDevice()));

  const isSimulating = isDesktopElectron && effectiveDevice !== 'windows_pc';
  const isMobileOrTvNative = !isSimulating && (effectiveDevice === 'android_mobile' || effectiveDevice === 'android_tv');

  // Purge any stale mobile/tv preferences on Desktop Electron
  useEffect(() => {
    if (isDesktopElectron) {
      try {
        const stored = localStorage.getItem('icelauch_device_preference');
        if (stored === 'android_tv' || stored === 'android_mobile') {
          localStorage.removeItem('icelauch_device_preference');
        }
      } catch {}
    }
  }, [isDesktopElectron]);

  const [mobileTheaterMedia, setMobileTheaterMedia] = useState<MediaItem | null>(null);
  const [mobileUpdateInfo, setMobileUpdateInfo] = useState<MobileUpdateInfo | null>(null);
  const [isMobileUpdateModalOpen, setIsMobileUpdateModalOpen] = useState(false);
  const [tvUpdateInfo, setTvUpdateInfo] = useState<TVUpdateInfo | null>(null);
  const [isTVUpdateModalOpen, setIsTVUpdateModalOpen] = useState(false);

  // Extras Hub & New Feature States
  const [isAdminUserMgmtOpen, setIsAdminUserMgmtOpen] = useState(false);
  const [installSettingsGame, setInstallSettingsGame] = useState<Game | null>(null);
  const [requireLoginModal, setRequireLoginModal] = useState<{
    isOpen: boolean;
    actionText: string;
    pendingAction?: () => void;
  }>({ isOpen: false, actionText: '' });
  const [miniPlayerMedia, setMiniPlayerMedia] = useState<MediaItem | null>(null);
  const [activeMobileGamepad, setActiveMobileGamepad] = useState<{
    isOpen: boolean;
    gameTitle?: string;
    config?: GameControllerConfig;
    hostIp: string;
  }>({ isOpen: false, hostIp: '127.0.0.1' });

  // Mobile Controller listener: auto-open landscape gamepad when PC launches game
  useEffect(() => {
    if (isMobileOrTvNative) {
      let ws: WebSocket | null = null;
      let checkTimer: any = null;

      const connectMobileListener = () => {
        try {
          const stored = localStorage.getItem('icelauch_paired_controller_device');
          if (stored) {
            const paired = JSON.parse(stored);
            if (paired.ip && (!ws || ws.readyState === WebSocket.CLOSED)) {
              ws = new WebSocket(`ws://${paired.ip}:18999`);
              ws.onmessage = (e) => {
                try {
                  const msg = JSON.parse(e.data);
                  if (msg.type === 'launch_controller') {
                    setActiveMobileGamepad({
                      isOpen: true,
                      gameTitle: msg.gameTitle || 'Game Đang Chạy',
                      config: msg.config,
                      hostIp: paired.ip,
                    });
                  }
                } catch {}
              };
            }
          }
        } catch {}
      };

      connectMobileListener();
      checkTimer = setInterval(connectMobileListener, 8000);

      return () => {
        if (checkTimer) clearInterval(checkTimer);
        if (ws) ws.close();
      };
    }
    return undefined;
  }, [isMobileOrTvNative]);

  useEffect(() => {
    // Check update silently on startup
    if (effectiveDevice === 'android_tv') {
      const timer = setTimeout(async () => {
        try {
          const info = await checkTVUpdate();
          if (info.updateAvailable) {
            setTvUpdateInfo(info);
            setIsTVUpdateModalOpen(true);
          }
        } catch (e) {
          console.warn('[App] Auto TV update check error:', e);
        }
      }, 3000);
      return () => clearTimeout(timer);
    } else if (effectiveDevice === 'android_mobile') {
      const timer = setTimeout(async () => {
        try {
          const info = await checkMobileUpdate();
          if (info.updateAvailable) {
            setMobileUpdateInfo(info);
            setIsMobileUpdateModalOpen(true);
          }
        } catch (e) {
          console.warn('[App] Auto mobile update check error:', e);
        }
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [effectiveDevice]);

  // Android Hardware & Gesture Back Button Handling (Swipe back without quitting app)
  useEffect(() => {
    let backListener: any = null;

    const setupBackHandler = async () => {
      try {
        backListener = await CapApp.addListener('backButton', () => {
          // 0. If mobile landscape gamepad is open, close it
          if (activeMobileGamepad.isOpen) {
            setActiveMobileGamepad((prev) => ({ ...prev, isOpen: false }));
            return;
          }

          // 1. If any modal is open, close it
          if (isEditingCurrentProfile) {
            setIsEditingCurrentProfile(false);
            return;
          }
          if (isAdminAuthOpen) {
            setIsAdminAuthOpen(false);
            return;
          }
          if (isProfilePickerOpen && activeProfile) {
            setIsProfilePickerOpen(false);
            return;
          }
          if (isMobileUpdateModalOpen) {
            setIsMobileUpdateModalOpen(false);
            return;
          }
          if (isMobileVinylOpen) {
            setIsMobileVinylOpen(false);
            return;
          }
          if (incompatibleGame) {
            setIncompatibleGame(null);
            return;
          }

          // 2. If viewing detail game or video theater, back to list
          if (viewingDetailGame) {
            setViewingDetailGame(null);
            return;
          }
          if (mobileTheaterMedia) {
            setMobileTheaterMedia(null);
            return;
          }
          if (tvPlayingMedia) {
            setTvPlayingMedia(null);
            return;
          }

          // 3. If on other tab, go back to main tab
          if (currentTab !== 'media') {
            setCurrentTab('media');
            return;
          }

          // 4. If already at root of main tab, exit app
          CapApp.exitApp();
        });
      } catch (e) {
        console.warn('Capacitor BackButton listener not active');
      }
    };

    setupBackHandler();

    return () => {
      if (backListener && backListener.remove) {
        backListener.remove();
      }
    };
  }, [
    isEditingCurrentProfile,
    isAdminAuthOpen,
    isProfilePickerOpen,
    activeProfile,
    isMobileUpdateModalOpen,
    isMobileVinylOpen,
    incompatibleGame,
    viewingDetailGame,
    mobileTheaterMedia,
    tvPlayingMedia,
    currentTab,
  ]);

  const handleMobileTabChange = (tab: NavigationTab) => {
    setViewingDetailGame(null);
    setMobileTheaterMedia(null);
    setCurrentTab(tab);
  };

  const handleMobileTabReTap = (_tab: NavigationTab) => {
    if (mobileTheaterMedia) {
      setMobileTheaterMedia(null);
    }
    if (viewingDetailGame) {
      setViewingDetailGame(null);
    }
  };

  const handleSelectDevice = (chosenDevice: DeviceType) => {
    setDevicePreference(chosenDevice);
    setStoredDevicePreference(chosenDevice);
    setIsDeviceModalOpen(false);
  };

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

        // Version update check: require re-login on new app version update; keep auto-login on same version
        const CURRENT_APP_VERSION = '1.1.1';
        const lastVersion = localStorage.getItem('icelauch_installed_version');
        const isNewVersion = Boolean(lastVersion && lastVersion !== CURRENT_APP_VERSION);
        localStorage.setItem('icelauch_installed_version', CURRENT_APP_VERSION);

        if (isNewVersion && window.api?.logoutProfile) {
          console.log(`[Version Upgrade] From ${lastVersion} to ${CURRENT_APP_VERSION}: Requiring re-login.`);
          await window.api.logoutProfile();
        }

        // Multi-User Profile Auto-Login & Initialization
        if (window.api.getProfiles) {
          const loadedProfiles = await window.api.getProfiles();
          setProfiles(loadedProfiles || []);

          const active = !isNewVersion ? await window.api.getActiveProfile() : null;
          const rememberedId = !isNewVersion ? await window.api.getRememberedProfileId() : null;

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

        // If local catalog is empty on PC, immediately fetch from Supabase Cloud
        if (data && data.games.length === 0 && data.media.length === 0 && window.api.syncCloud) {
          window.api.syncCloud().then(async (syncRes: any) => {
            if (syncRes && syncRes.success) {
              const freshData = await window.api.getAppData();
              if (freshData) setAppData(freshData);
              if (window.api.getProfiles) {
                const freshProfiles = await window.api.getProfiles();
                if (freshProfiles) setProfiles(freshProfiles);
              }
            }
          }).catch(console.warn);
        }
      } catch (err) {
        console.error('Failed to get app data from IPC:', err);
      }
    } else {
      console.log('Running on Android / Web platform (no Electron IPC). Fetching from Supabase Cloud...');
      try {
        const cloudData = await fetchDirectCloudCatalog();
        setAppData({
          games: cloudData.games,
          media: cloudData.media,
          playlists: cloudData.playlists,
          settings: {
            deleteArchiveDefault: true,
            runAsAdminDefault: false,
            appRootPath: '/storage/emulated/0/Icelauch',
            gamesPath: '/storage/emulated/0/Icelauch/Games',
            downloadsPath: '/storage/emulated/0/Icelauch/Downloads',
          },
        });
        setProfiles(cloudData.profiles || []);
        if (cloudData.profiles?.length > 0) {
          setActiveProfile(cloudData.profiles[0]);
        }
        setCloudSyncSettings({
          enabled: true,
          supabaseUrl: DEFAULT_SUPABASE_URL,
          supabaseAnonKey: DEFAULT_SUPABASE_ANON_KEY,
          autoSyncIntervalMinutes: 5,
          lastSyncStatus: 'success',
          lastSyncedAt: new Date().toISOString(),
          lastSyncMessage: `Đã kết nối Supabase Cloud (${cloudData.games.length} game, ${cloudData.media.length} phim)`,
        });
      } catch (e) {
        console.error('Error initializing direct Supabase on Android:', e);
      }
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

      const unsubCloud = (window.api as any).onCloudSynced ? (window.api as any).onCloudSynced((data: { profiles: UserProfile[]; games?: Game[]; media?: MediaItem[]; playlists?: MediaPlaylist[]; message: string }) => {
        if (data?.profiles) {
          setProfiles(data.profiles);
        }
        if (data?.games || data?.media || data?.playlists) {
          setAppData((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              profiles: data.profiles || prev.profiles,
              games: data.games || prev.games,
              media: data.media || prev.media,
              playlists: data.playlists || prev.playlists,
            };
          });
        }
        setCloudSyncSettings((prev) => ({
          ...prev,
          lastSyncedAt: new Date().toISOString(),
          lastSyncStatus: 'success',
          lastSyncMessage: data.message,
        }));
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
    if (!activeProfile) {
      setRequireLoginModal({
        isOpen: true,
        actionText: 'tải game vào máy tính cá nhân',
        pendingAction: () => handleDownloadGame(id),
      });
      return;
    }

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

  const handleSaveGameInstallPath = async (
    targetFolder: string,
    setAsDefault: boolean,
    startDownloadImmediately: boolean,
    controllerConfig?: GameControllerConfig
  ) => {
    if (!installSettingsGame) return;
    const g: Game = {
      ...installSettingsGame,
      installPath: targetFolder,
      controllerConfig: controllerConfig || installSettingsGame.controllerConfig,
    };

    if (setAsDefault && appData) {
      const updatedSettings = { ...appData.settings, defaultGamesInstallPath: targetFolder };
      setAppData({ ...appData, settings: updatedSettings });
      if (window.api?.saveSettings) {
        await window.api.saveSettings({ defaultGamesInstallPath: targetFolder });
      }
    }

    if (window.api?.saveGame) {
      await window.api.saveGame(g);
    }

    setAppData((prev) => (prev ? {
      ...prev,
      games: prev.games.map((item) => (item.id === g.id ? g : item)),
    } : null));

    if (startDownloadImmediately) {
      handleDownloadGame(g.id);
    }
  };

  const handleBanProfile = async (id: string, bannedUntil: string | null, reason?: string) => {
    if (window.api?.banProfile) {
      await window.api.banProfile({ id, bannedUntil, reason });
    }
    setProfiles((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          return { ...p, bannedUntil: bannedUntil || undefined, banReason: reason };
        }
        return p;
      })
    );
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
    if (!activeProfile) {
      setRequireLoginModal({
        isOpen: true,
        actionText: 'lưu trữ game vào Thư Viện cá nhân',
        pendingAction: () => handleToggleLibrary(id),
      });
      return;
    }

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

  const handleSaveGameExtensions = async (gameId: string, extensions: any[]) => {
    if (window.api) {
      await window.api.saveGame({ id: gameId, extensions });
      await loadData();
    } else {
      setAppData((prev) => {
        if (!prev) return prev;
        const newGames = prev.games.map((g) => (g.id === gameId ? { ...g, extensions } : g));
        return { ...prev, games: newGames };
      });
      if (viewingDetailGame && viewingDetailGame.id === gameId) {
        setViewingDetailGame((prev) => (prev ? { ...prev, extensions } : null));
      }
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
    credentials: { pin?: string; password?: string },
    remember: boolean
  ): Promise<{ success: boolean; error?: string }> => {
    if (window.api?.loginProfile) {
      const res = await window.api.loginProfile({
        id: profile.id,
        pin: credentials.pin,
        password: credentials.password,
        remember,
      });
      if (res.success && res.profile) {
        setActiveProfile(res.profile);
        setIsProfilePickerOpen(false);
        sfx.playSuccess();
        return { success: true };
      }
      return { success: false, error: res.error || 'Xác thực không chính xác' };
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
    username?: string;
    nickname: string;
    role?: 'admin' | 'user';
    avatar: string;
    pin?: string;
    password?: string;
    remember: boolean;
  }) => {
    if (window.api?.saveProfile) {
      let pinHash = '';
      if (data.pin && window.api.hashPin) {
        pinHash = await window.api.hashPin(data.pin);
      }

      let passwordHash = '';
      let passwordSalt = '';
      if (data.password && window.api.hashPassword) {
        const hashRes = await window.api.hashPassword({ password: data.password });
        passwordHash = hashRes.hash;
        passwordSalt = hashRes.salt;
      }

      const existing = profiles.find((p) => p.id === data.id);
      const toSave: UserProfile = {
        id: data.id || `user-${Date.now()}`,
        username: data.username || existing?.username || data.nickname.toLowerCase().replace(/\s+/g, ''),
        role: data.role || existing?.role || 'user',
        nickname: data.nickname,
        avatar: data.avatar,
        pinHash: pinHash || existing?.pinHash || '',
        passwordHash: passwordHash || existing?.passwordHash || '',
        passwordSalt: passwordSalt || existing?.passwordSalt || '',
        requiresPasswordReset: false,
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
        await window.api.loginProfile({
          id: saved.id,
          pin: data.pin,
          password: data.password,
          remember: true,
        });
      }

      sfx.playSuccess();
    }
  };

  const handleRequestPasswordReset = async (profile: UserProfile): Promise<{ success: boolean; message: string }> => {
    try {
      const request: PasswordResetRequest = {
        id: `reset-${Date.now()}`,
        profileId: profile.id,
        username: profile.username || profile.nickname,
        nickname: profile.nickname,
        requestedAt: new Date().toISOString(),
        status: 'pending',
      };
      if (appData) {
        const existingResets = appData.passwordResets || [];
        const updatedResets = [...existingResets.filter((r) => r.profileId !== profile.id), request];
        setAppData({ ...appData, passwordResets: updatedResets });
      }
      return { success: true, message: `Đã gửi yêu cầu đặt lại mật khẩu cho tài khoản "${profile.nickname}"!` };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Không thể gửi yêu cầu' };
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
    <div className={`h-screen w-screen ${appData.settings.wallpaperConfig?.enabled ? 'bg-transparent' : 'bg-ice-bg'} text-ice-text flex flex-col overflow-hidden relative isolate`}>
      {/* Custom App Wallpaper - Background Layer (zIndex 0, pointer-events none) */}
      <AppWallpaper
        config={appData.settings.wallpaperConfig}
        lowSpecMode={appData.settings.lowSpecMode}
      />

      {/* 1. Top Navbar (56px) - Desktop Windows PC only or Simulator */}
      {!isMobileOrTvNative && (
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
          onOpenUserManagement={() => setIsAdminUserMgmtOpen(true)}
          activeProfile={activeProfile}
          onSwitchProfile={handleSwitchProfile}
          onEditCurrentProfile={() => setIsEditingCurrentProfile(true)}
          onLogoutProfile={handleLogoutProfile}
        />
      )}

      {/* 2. Download Tray Floating Panel */}
      {!isMobileOrTvNative && (
        <DownloadTray
          isOpen={isDownloadTrayOpen}
          onClose={() => setIsDownloadTrayOpen(false)}
          games={appData.games}
          onCancelDownload={handleCancelDownload}
          onRetry={handleRetryGame}
        />
      )}

      {/* Admin Device Simulator Switcher Toolbar (Desktop only) */}
      {isAdmin && !isMobileOrTvNative && (
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
      <main className="flex-1 flex overflow-hidden relative z-10">
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
                {currentTab === 'extras' && (
                  <ExtrasView activeProfile={activeProfile} isAdmin={isAdmin} />
                )}

                {currentTab === 'settings' && (
                  <TVSettingsView
                    settings={appData.settings}
                    isAdmin={isAdmin}
                    cloudSync={cloudSyncSettings}
                    activeProfile={activeProfile}
                    onSwitchProfile={handleSwitchProfile}
                    onLockAdmin={handleLockAdmin}
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
            onTabChange={handleMobileTabChange}
            onTabReTap={handleMobileTabReTap}
            isSimulated={isSimulating}
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
            {viewingDetailGame && currentTab === 'home' ? (
              <MobileGameDetailView
                game={viewingDetailGame}
                isAdmin={isAdmin}
                onBack={() => setViewingDetailGame(null)}
                onToggleLibrary={handleToggleLibrary}
                onIncompatibleClick={(game) => setIncompatibleGame(game)}
                onOpenFolder={(id) => handleOpenFolder('gameDir', id)}
                onSaveExtensions={handleSaveGameExtensions}
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
                    allMedia={appData.media}
                    isAdmin={isAdmin}
                    activeProfile={activeProfile}
                    userLibraryIds={activeProfile?.library}
                    onSelectGame={(game) => {
                      setViewingDetailGame(game);
                      setCurrentTab('home');
                    }}
                    onSelectMedia={(item) => {
                      setMobileTheaterMedia(item);
                      setCurrentTab('media');
                    }}
                    onIncompatibleClick={(game) => setIncompatibleGame(game)}
                    onToggleLibrary={handleToggleLibrary}
                    onSwitchProfile={handleSwitchProfile}
                    onPlayAudio={handlePlayAudio}
                    onNavigateTab={handleMobileTabChange}
                  />
                )}

                {currentTab === 'media' && (
                  <MobileMediaView
                    media={appData.media}
                    playlists={appData.playlists || []}
                    bannerSettings={appData.settings.bannerSettings?.videos}
                    isAdmin={isAdmin}
                    searchQuery={searchQuery}
                    activeTheaterMedia={mobileTheaterMedia}
                    onSelectTheaterMedia={setMobileTheaterMedia}
                    onPlayAudio={handlePlayAudio}
                    onSaveMedia={handleSaveMedia}
                    onDeleteMedia={handleDeleteMedia}
                    onUpdateMediaProgress={handleUpdateMediaProgress}
                    onDownloadMedia={handleDownloadMedia}
                    onDeleteDownloaded={handleDeleteDownloadedMedia}
                    onMinimizeToMiniPlayer={(m: any) => setMiniPlayerMedia(m)}
                  />
                )}

                {currentTab === 'extras' && (
                  <ExtrasView activeProfile={activeProfile} isAdmin={isAdmin} />
                )}

                {currentTab === 'settings' && (
                  <MobileSettingsView
                    settings={appData.settings}
                    isAdmin={isAdmin}
                    cloudSync={cloudSyncSettings}
                    activeProfile={activeProfile}
                    onSwitchProfile={handleSwitchProfile}
                    onEditProfile={() => setIsEditingCurrentProfile(true)}
                    onLockAdmin={handleLockAdmin}
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
                onOpenInstallSettings={(game) => setInstallSettingsGame(game)}
                onSaveExtensions={handleSaveGameExtensions}
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
                    onOpenInstallSettings={(game) => setInstallSettingsGame(game)}
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
                    onMinimizeToMiniPlayer={(m: any) => setMiniPlayerMedia(m)}
                  />
                )}

                {currentTab === 'extras' && (
                  <ExtrasView activeProfile={activeProfile} isAdmin={isAdmin} />
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
                    onOpenUserManagement={() => setIsAdminUserMgmtOpen(true)}
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
        onSetPin={async (pin) => {
          if (window.api?.setPin) return window.api.setPin(pin);
          return setAdminPinMobile(pin);
        }}
        onVerifyPin={async (pin) => verifyAdminPin(pin)}
        onResetPin={async (key, newPin) => {
          if (window.api?.resetPinWithRecoveryKey) return window.api.resetPinWithRecoveryKey(key, newPin);
          return true;
        }}
      />

      {/* Admin User Management Modal */}
      <AdminUserManagementModal
        isOpen={isAdminUserMgmtOpen}
        profiles={profiles}
        onClose={() => setIsAdminUserMgmtOpen(false)}
        onEditProfile={(p) => {
          setIsAdminUserMgmtOpen(false);
          setIsEditingCurrentProfile(true);
        }}
        onDeleteProfile={async (id) => {
          if (window.api?.deleteProfile) {
            await window.api.deleteProfile(id);
          }
          setProfiles((prev) => prev.filter((p) => p.id !== id));
        }}
        onBanProfile={handleBanProfile}
      />

      {/* Game Install Location Picker Modal */}
      {installSettingsGame && (
        <GameInstallModal
          isOpen={Boolean(installSettingsGame)}
          game={installSettingsGame}
          currentInstallPath={installSettingsGame.installPath}
          defaultGamesPath={appData.settings.defaultGamesInstallPath || appData.settings.gamesPath}
          onClose={() => setInstallSettingsGame(null)}
          onSaveInstallPath={handleSaveGameInstallPath}
        />
      )}

      {/* Mobile Landscape Gamepad (Auto popup when PC launches game) */}
      <MobileLandscapeGamepad
        isOpen={activeMobileGamepad.isOpen}
        onClose={() => setActiveMobileGamepad((prev) => ({ ...prev, isOpen: false }))}
        hostIp={activeMobileGamepad.hostIp}
        gameTitle={activeMobileGamepad.gameTitle}
        config={activeMobileGamepad.config}
      />

      {/* Require Login Modal */}
      <RequireLoginModal
        isOpen={requireLoginModal.isOpen}
        actionText={requireLoginModal.actionText}
        onClose={() => setRequireLoginModal({ isOpen: false, actionText: '' })}
        onGoToLogin={() => {
          setRequireLoginModal({ isOpen: false, actionText: '' });
          setIsProfilePickerOpen(true);
        }}
      />

      {/* Floating Mini Player (Picture-in-Picture) */}
      <FloatingMiniPlayer
        media={miniPlayerMedia}
        proxyPort={getActiveProxyPort() || 18989}
        onClose={() => setMiniPlayerMedia(null)}
        onMaximize={(m) => {
          setMiniPlayerMedia(null);
          if (effectiveDevice === 'android_mobile') {
            setMobileTheaterMedia(m);
            setCurrentTab('media');
          } else {
            setCurrentTab('media');
          }
        }}
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

      {/* Seasonal Particle Engine (Winter Snow, Autumn Leaves, Spring Sakura, Summer Fireflies, Cyber Stardust) */}
      <SeasonalParticleEngine
        config={appData.settings.particleConfig}
        enabled={
          !isMobileOrTvNative &&
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
          onRequestPasswordReset={handleRequestPasswordReset}
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

      {/* First-Run Device Selection Modal for Android */}
      <DeviceSelectionModal
        isOpen={isDeviceModalOpen}
        onSelectDevice={handleSelectDevice}
        onClose={() => setIsDeviceModalOpen(false)}
      />

      {/* Mobile Native APK In-App Auto-Update Modal */}
      <MobileUpdateModal
        isOpen={isMobileUpdateModalOpen}
        updateInfo={mobileUpdateInfo}
        onClose={() => setIsMobileUpdateModalOpen(false)}
      />

      {/* Android TV In-App Auto-Update Modal */}
      <TVUpdateModal
        isOpen={isTVUpdateModalOpen}
        updateInfo={tvUpdateInfo}
        onClose={() => setIsTVUpdateModalOpen(false)}
      />

      {/* Floating In-App OTA Update Toast (PC) */}
      {!isMobileOrTvNative && <UpdateToast onGoToSettings={() => setCurrentTab('settings')} />}
    </div>
  );
}
