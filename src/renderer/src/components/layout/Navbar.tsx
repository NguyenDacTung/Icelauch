import React, { useState, useEffect, useRef } from 'react';
import appLogo from '../../assets/icon.png';
import { 
  Gamepad2, 
  Download, 
  Lock, 
  Unlock, 
  Search, 
  X, 
  ShieldAlert,
  Sparkles,
  Minus,
  Square,
  Copy,
  Users,
  Shield,
  Droplet,
  Landmark,
  Layers,
  Film,
  Wrench,
  SlidersHorizontal
} from 'lucide-react';
import { UserMenuWidget } from '../profile/UserMenuWidget';
import { ThemeToggleSwitch } from '../common/ThemeToggleSwitch';
import { useTheme } from '../../hooks/useTheme';
import type { NavigationTab, UserProfile } from '../../types';

interface NavbarProps {
  currentTab: NavigationTab;
  onTabChange: (tab: NavigationTab) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  activeDownloadsCount: number;
  isDownloadTrayOpen: boolean;
  onToggleDownloadTray: () => void;
  isAdmin: boolean;
  adminTimeRemaining: number; // in seconds
  onOpenAdminAuth: () => void;
  onLockAdmin: () => void;
  onOpenBannerManager?: () => void;
  onOpenUserManagement?: () => void;
  onOpenDeviceManager?: () => void;
  activeProfile?: UserProfile | null;
  onSwitchProfile?: () => void;
  onEditCurrentProfile?: () => void;
  onLogoutProfile?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onTabChange,
  searchQuery,
  onSearchChange,
  activeDownloadsCount,
  isDownloadTrayOpen,
  onToggleDownloadTray,
  isAdmin,
  adminTimeRemaining,
  onOpenAdminAuth,
  onLockAdmin,
  onOpenBannerManager,
  onOpenUserManagement,
  onOpenDeviceManager,
  activeProfile = null,
  onSwitchProfile,
  onEditCurrentProfile,
  onLogoutProfile,
}) => {
  const [logoError, setLogoError] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const { theme } = useTheme();

  useEffect(() => {
    if (window.api?.isWindowMaximized) {
      window.api.isWindowMaximized().then((max: boolean) => setIsMaximized(Boolean(max)));
    }
  }, []);

  const handleMinimize = () => {
    window.api?.minimizeWindow?.();
  };

  const handleMaximize = async () => {
    const max = await window.api?.maximizeWindow?.();
    setIsMaximized(Boolean(max));
  };

  const handleClose = () => {
    window.api?.closeWindow?.();
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const isAqua = theme === 'aqua';
  const isTerra = theme === 'terra';
  const isIgnis = theme === 'ignis';
  const isAer = theme === 'aer';

  const getTerraTabIcon = (tabId: NavigationTab) => {
    switch (tabId) {
      case 'home':
        return <Landmark className="w-4 h-4 stroke-[2.2]" />;
      case 'library':
        return <Layers className="w-4 h-4 stroke-[2.2]" />;
      case 'media':
        return <Film className="w-4 h-4 stroke-[2.2]" />;
      case 'extras':
        return <Wrench className="w-4 h-4 stroke-[2.2]" />;
      case 'settings':
        return <SlidersHorizontal className="w-4 h-4 stroke-[2.2]" />;
      default:
        return null;
    }
  };
  const navContainerRef = useRef<HTMLDivElement | null>(null);
  const [dropletStyle, setDropletStyle] = useState<{ left: number; width: number; opacity: number }>({ left: 0, width: 0, opacity: 0 });

  const [isRippleEnabled, setIsRippleEnabled] = useState<boolean>(() => {
    try {
      return localStorage.getItem('icelauch_aqua_ripple_enabled') !== 'false';
    } catch {
      return true;
    }
  });

  const toggleAquaRipple = () => {
    const next = !isRippleEnabled;
    setIsRippleEnabled(next);
    try {
      localStorage.setItem('icelauch_aqua_ripple_enabled', String(next));
    } catch {}
    window.dispatchEvent(new CustomEvent('icelauch:aqua-ripple-toggle', { detail: { enabled: next } }));
  };

  useEffect(() => {
    if (!isAqua || !navContainerRef.current) return;
    const activeBtn = navContainerRef.current.querySelector(`[data-tab-id="${currentTab}"]`) as HTMLElement | null;
    if (activeBtn) {
      setDropletStyle({
        left: activeBtn.offsetLeft,
        width: activeBtn.offsetWidth,
        opacity: 1,
      });
    }
  }, [currentTab, isAqua]);

  const navItems: { id: NavigationTab; label: string }[] = [
    { id: 'home', label: 'TRANG CHỦ' },
    { id: 'library', label: 'THƯ VIỆN' },
    { id: 'media', label: 'GIẢI TRÍ' },
    { id: 'extras', label: 'TIỆN ÍCH' },
    { id: 'settings', label: 'CÀI ĐẶT' },
  ];

  return (
    <header className={`relative flex-shrink-0 z-30 select-none ${isAqua ? 'aqua-header-wrapper px-0 pt-0 pb-1' : 'px-4 pt-2.5 pb-1'}`}>
      {/* Top Admin banner if active */}
      {isAdmin && (
        <div className="mb-2 h-7 bg-amber-500/15 border border-amber-500/30 rounded-xl px-3.5 flex items-center justify-between text-xs text-amber-300 shadow-sm backdrop-blur-md">
          <div className="flex items-center gap-1.5 font-medium">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
            <span>Chế độ Admin đang bật — Tự khoá sau {formatTime(adminTimeRemaining)}</span>
          </div>
          <div className="flex items-center gap-4">
            {onOpenBannerManager && (
              <button
                onClick={onOpenBannerManager}
                className="hover:text-amber-200 transition-colors underline text-[11px] flex items-center gap-1 font-semibold"
              >
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>Quản Lý Banner</span>
              </button>
            )}
            <button 
              onClick={onLockAdmin}
              className="hover:text-amber-200 transition-colors underline text-[11px]"
            >
              Khoá ngay
            </button>
          </div>
        </div>
      )}

      {/* Ignis Mode: 3 Distinct Basalt / Obsidian Chamfered Stone Blocks */}
      {isIgnis ? (
        <div
          className="h-15 flex items-center justify-between gap-3 select-none"
          style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
          onDoubleClick={handleMaximize}
        >
          {/* Block 1: Left - Logo & Brand (Obsidian Chamfered Stone Block) */}
          <div
            className="h-13 px-4 flex items-center obsidian-header-block obsidian-chamfer cursor-pointer group shrink-0"
            style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
            onClick={() => onTabChange('home')}
          >
            <div className="flex items-center gap-2.5">
              {!logoError ? (
                <img
                  src={appLogo}
                  alt="Icelauch"
                  onError={(e) => {
                    if (e.currentTarget.src.includes('icon.png')) {
                      setLogoError(true);
                    } else {
                      e.currentTarget.src = './icon.png';
                    }
                  }}
                  className="w-7 h-7 rounded-lg object-contain shadow-md group-hover:scale-105 transition-transform"
                />
              ) : (
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-700 to-[#1C120E] border border-amber-600/40 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                  <Gamepad2 className="w-3.5 h-3.5 text-amber-400" />
                </div>
              )}
              <div className="flex flex-col">
                <span className="font-black text-xs tracking-widest text-[#FFF7ED] group-hover:text-[#F97316] transition-colors flex items-center gap-1">
                  ICELAUCH
                  <Sparkles className="w-3 h-3 text-[#F97316] opacity-0 group-hover:opacity-100 transition-opacity" />
                </span>
              </div>
            </div>
          </div>

          {/* Block 2: Center - 5 Tabs (Obsidian Chamfered Stone Block) */}
          <nav
            ref={navContainerRef}
            className="h-13 px-3 flex items-center gap-1.5 obsidian-header-block obsidian-chamfer shrink-0"
            style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
          >
            {navItems.map((item) => {
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  data-tab-id={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`group/tab relative z-10 transition-all duration-300 cursor-pointer obsidian-chamfer-tab px-4 py-1.5 text-xs font-bold tracking-wider ${
                    isActive
                      ? 'ignis-tab-active font-black scale-[1.04]'
                      : 'text-[#D6B4A6] hover:text-[#FFF7ED] hover:bg-[#381E15] border border-[#4A2518]/60'
                  }`}
                  title={item.label}
                >
                  {/* Molten Magma Fissure Lines on Active Tab */}
                  {isActive && (
                    <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible" fill="none">
                      <path d="M 2 3 Q 12 1 24 2.5 T 48 1.5 T 72 3" stroke="#FBBF24" strokeWidth="1.2" strokeLinecap="round" filter="drop-shadow(0 0 3px #F97316)" />
                      <path d="M 16 2.5 L 18 6.5" stroke="#F97316" strokeWidth="1" strokeLinecap="round" />
                      <path d="M 42 2 L 40 6.5" stroke="#F97316" strokeWidth="1" strokeLinecap="round" />
                      <path d="M 2 calc(100% - 3px) Q 14 calc(100% - 1px) 28 calc(100% - 2.5px) T 56 calc(100% - 1.5px) T 72 calc(100% - 3px)" stroke="#FBBF24" strokeWidth="1.2" strokeLinecap="round" filter="drop-shadow(0 0 3px #F97316)" />
                    </svg>
                  )}
                  <span className={isActive ? 'ignis-tab-active-text relative z-10' : ''}>
                    {item.label}
                  </span>
                </button>
              );
            })}
          </nav>

          {/* Block 3: Right - Search, Theme Switch, Downloads, Admin, Window Controls */}
          <div
            className="h-13 px-4 flex items-center gap-2 obsidian-header-block obsidian-chamfer shrink-0"
            style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
          >
            {/* Search Bar */}
            <div className="relative w-44 lg:w-52">
              <Search className="w-3.5 h-3.5 text-[#D6B4A6] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Tìm kiếm..."
                className="w-full h-7.5 pl-8 pr-7 rounded-md bg-[#1C120E] border border-[#4A2518] text-xs text-[#FFF7ED] placeholder-[#D6B4A6]/60 focus:outline-none focus:border-[#F97316] transition-colors shadow-inner"
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#D6B4A6] hover:text-[#FFF7ED]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Solar / Lunar Morphing Theme Switch (Dimmed + Grayscale in Ignis) */}
            <ThemeToggleSwitch size="sm" />

            {/* Download Tray Button */}
            <button
              onClick={onToggleDownloadTray}
              className={`relative flex items-center gap-1.5 h-7.5 px-2.5 rounded-md text-xs font-semibold border transition-all ${
                isDownloadTrayOpen
                  ? 'bg-[#F97316] text-[#FFF7ED] border-[#F97316] shadow-sm'
                  : activeDownloadsCount > 0
                  ? 'bg-[#F97316]/20 text-[#F97316] border-[#F97316]/50 hover:bg-[#F97316]/30'
                  : 'bg-[#1C120E] text-[#D6B4A6] border-[#4A2518] hover:text-[#FFF7ED] hover:border-[#8C4320]'
              }`}
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Tải xuống</span>
              {activeDownloadsCount > 0 && (
                <span className="flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold bg-[#F97316] text-white rounded-full">
                  {activeDownloadsCount}
                </span>
              )}
            </button>

            {/* Admin Buttons if Admin */}
            {isAdmin && onOpenBannerManager && (
              <button
                onClick={onOpenBannerManager}
                className="flex items-center gap-1.5 h-7.5 px-2.5 rounded-md text-xs font-semibold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 transition-colors shadow-sm"
                title="Quản lý Banner nổi bật toàn hệ thống"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Banner</span>
              </button>
            )}

            {isAdmin && onOpenUserManagement && (
              <button
                onClick={onOpenUserManagement}
                className="flex items-center gap-1.5 h-7.5 px-2.5 rounded-md text-xs font-semibold bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/40 transition-colors shadow-sm cursor-pointer"
                title="Quản lý người dùng & phân quyền"
              >
                <Users className="w-3.5 h-3.5 text-blue-400" />
                <span className="hidden md:inline">Người Dùng</span>
              </button>
            )}

            {isAdmin && onOpenDeviceManager && (
              <button
                onClick={onOpenDeviceManager}
                className="flex items-center gap-1.5 h-7.5 px-2.5 rounded-md text-xs font-semibold bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 transition-colors shadow-sm cursor-pointer"
                title="Quản lý thiết bị cấp quyền & cấp mã OTP"
              >
                <Shield className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden md:inline">Thiết Bị</span>
              </button>
            )}

            {/* Multi-User Profile Widget */}
            {onSwitchProfile && onEditCurrentProfile && onLogoutProfile && (
              <UserMenuWidget
                activeProfile={activeProfile}
                onSwitchProfile={onSwitchProfile}
                onEditCurrentProfile={onEditCurrentProfile}
                onLogoutProfile={onLogoutProfile}
              />
            )}

            {/* Admin Lock Button */}
            <button
              onClick={isAdmin ? onLockAdmin : onOpenAdminAuth}
              className={`flex items-center gap-1.5 h-7.5 px-2.5 rounded-md text-xs font-medium border transition-colors ${
                isAdmin
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 hover:bg-amber-500/30 font-semibold'
                  : 'bg-[#1C120E] text-[#D6B4A6] border-[#4A2518] hover:text-[#FFF7ED] hover:border-[#8C4320]'
              }`}
              title={isAdmin ? 'Nhấp để khoá Chế độ Admin' : 'Mở Chế độ Admin'}
            >
              {isAdmin ? (
                <>
                  <Unlock className="w-3.5 h-3.5 text-amber-400" />
                  <span className="font-semibold">Admin</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  <span>Admin</span>
                </>
              )}
            </button>

            {/* Window Caption Controls */}
            <div className="flex items-center ml-1 pl-2 border-l border-[#4A2518] gap-1">
              <button
                onClick={handleMinimize}
                className="w-7 h-7 rounded-md flex items-center justify-center text-[#D6B4A6] hover:text-[#FFF7ED] hover:bg-[#381E15] transition-colors"
                title="Thu nhỏ cửa sổ"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleMaximize}
                className="w-7 h-7 rounded-md flex items-center justify-center text-[#D6B4A6] hover:text-[#FFF7ED] hover:bg-[#381E15] transition-colors"
                title={isMaximized ? "Khôi phục kích thước cửa sổ" : "Phóng to toàn màn hình"}
              >
                {isMaximized ? (
                  <Copy className="w-3 h-3 rotate-180" />
                ) : (
                  <Square className="w-3 h-3" />
                )}
              </button>
              <button
                onClick={handleClose}
                className="w-7 h-7 rounded-md flex items-center justify-center text-[#D6B4A6] hover:text-white hover:bg-rose-600 transition-colors"
                title="Đóng ứng dụng"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ) : isAer ? (
        /* Aer Mode: 3 Distinct Swiss Wireframe Capsules Connected by Center Hairline Axis */
        <div
          className="h-15 w-full flex items-center justify-between gap-3 relative select-none"
          style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
          onDoubleClick={handleMaximize}
        >
          {/* Central Horizontal Hairline Axis connecting the capsules */}
          <div className="absolute top-1/2 left-0 right-0 h-[1.5px] bg-[#CBD5E1] -translate-y-1/2 pointer-events-none z-0" />

          {/* Capsule 1: Left - Logo & Brand */}
          <div
            className="h-11 px-3.5 bg-[#B8C7D9] border-[1.5px] border-[#64748B] rounded-xl flex items-center gap-2.5 cursor-pointer group shrink-0 relative z-10 shadow-none"
            style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
            onClick={() => onTabChange('home')}
          >
            <div className="flex items-center gap-2.5">
              {!logoError ? (
                <img
                  src={appLogo}
                  alt="Icelauch"
                  onError={(e) => {
                    if (e.currentTarget.src.includes('icon.png')) {
                      setLogoError(true);
                    } else {
                      e.currentTarget.src = './icon.png';
                    }
                  }}
                  className="w-7 h-7 rounded-lg object-contain group-hover:scale-105 transition-none"
                />
              ) : (
                <div className="w-7 h-7 rounded-lg bg-[#E2E8F0] border border-[#CBD5E1] flex items-center justify-center text-[#0284C7]">
                  <Gamepad2 className="w-3.5 h-3.5" />
                </div>
              )}
              <span className="font-bold text-xs tracking-wider text-[#0F172A] group-hover:text-[#0284C7] transition-none flex items-center gap-1">
                ICELAUCH
                <Sparkles className="w-3 h-3 text-[#0284C7] opacity-0 group-hover:opacity-100 transition-none" />
              </span>
            </div>
          </div>

          {/* Capsule 2: Center - 5 Navigation Tabs */}
          <nav
            ref={navContainerRef}
            className="h-11 px-2.5 bg-[#B8C7D9] border-[1.5px] border-[#64748B] rounded-xl flex items-center gap-1 shrink-0 relative z-10 shadow-none"
            style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
          >
            {navItems.map((item) => {
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  data-tab-id={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`relative px-3 py-1.5 rounded-lg text-xs transition-none flex items-center gap-1.5 ${
                    isActive
                      ? 'font-bold text-[#0F172A]'
                      : 'font-medium text-[#475569] hover:text-[#0F172A] hover:bg-[#CBD5E1]/80'
                  }`}
                >
                  {isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#0284C7] shrink-0" />
                  )}
                  <span>{item.label}</span>
                  {isActive && (
                    <div className="absolute bottom-0 left-2 right-2 h-[2.5px] bg-[#0284C7] rounded-full" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Capsule 3: Right - Tools, Search, Toggle, Profile, Controls */}
          <div
            className="h-11 px-3 bg-[#B8C7D9] border-[1.5px] border-[#64748B] rounded-xl flex items-center gap-2 shrink-0 relative z-10 shadow-none"
            style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
          >
            {/* Search Box */}
            <div className="relative flex items-center">
              <Search className="w-3.5 h-3.5 text-[#475569] absolute left-2.5 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Tìm kiếm..."
                className="w-32 lg:w-44 h-7 pl-8 pr-7 bg-[#E2E8F0] border border-[#CBD5E1] rounded-lg text-xs text-[#0F172A] placeholder-[#475569] focus:outline-none focus:border-[#0284C7] transition-none"
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[#475569] hover:text-[#0F172A]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Solar / Lunar Switch (Dimmed + Grayscale in Aer) */}
            <ThemeToggleSwitch size="sm" />

            {/* Download Tray Button */}
            <button
              onClick={onToggleDownloadTray}
              className={`relative flex items-center gap-1.5 h-7 px-2.5 rounded-lg text-xs font-semibold border transition-none ${
                isDownloadTrayOpen
                  ? 'bg-[#0284C7] text-white border-[#0284C7]'
                  : activeDownloadsCount > 0
                  ? 'bg-[#0284C7]/15 text-[#0284C7] border-[#0284C7]/50'
                  : 'bg-[#E2E8F0] text-[#0F172A] border-[#CBD5E1] hover:bg-[#CBD5E1]'
              }`}
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Tải xuống</span>
              {activeDownloadsCount > 0 && (
                <span className="flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold bg-[#0284C7] text-white rounded-full">
                  {activeDownloadsCount}
                </span>
              )}
            </button>

            {/* Admin Buttons if Admin */}
            {isAdmin && onOpenBannerManager && (
              <button
                onClick={onOpenBannerManager}
                className="flex items-center gap-1.5 h-7 px-2.5 rounded-lg text-xs font-semibold bg-amber-500/15 hover:bg-amber-500/25 text-amber-800 border border-amber-500/40 transition-none"
                title="Quản lý Banner nổi bật toàn hệ thống"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span className="hidden sm:inline">Banner</span>
              </button>
            )}

            {isAdmin && onOpenUserManagement && (
              <button
                onClick={onOpenUserManagement}
                className="flex items-center gap-1.5 h-7 px-2.5 rounded-lg text-xs font-semibold bg-blue-500/15 hover:bg-blue-500/25 text-blue-800 border border-blue-500/40 transition-none cursor-pointer"
                title="Quản lý người dùng & phân quyền"
              >
                <Users className="w-3.5 h-3.5 text-blue-600" />
                <span className="hidden md:inline">Người Dùng</span>
              </button>
            )}

            {isAdmin && onOpenDeviceManager && (
              <button
                onClick={onOpenDeviceManager}
                className="flex items-center gap-1.5 h-7 px-2.5 rounded-lg text-xs font-semibold bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-800 border border-cyan-500/40 transition-none cursor-pointer"
                title="Quản lý thiết bị cấp quyền & cấp mã OTP"
              >
                <Shield className="w-3.5 h-3.5 text-cyan-600" />
                <span className="hidden md:inline">Thiết Bị</span>
              </button>
            )}

            {/* Profile Widget */}
            {onSwitchProfile && onEditCurrentProfile && onLogoutProfile && (
              <UserMenuWidget
                activeProfile={activeProfile}
                onSwitchProfile={onSwitchProfile}
                onEditCurrentProfile={onEditCurrentProfile}
                onLogoutProfile={onLogoutProfile}
              />
            )}

            {/* Admin Lock / Unlock button */}
            <button
              onClick={() => {
                if (isAdmin) {
                  onLockAdmin?.();
                } else {
                  onOpenAdminAuth();
                }
              }}
              className={`flex items-center gap-1.5 h-7 px-2.5 rounded-lg text-xs font-medium border transition-none ${
                isAdmin
                  ? 'bg-amber-500/15 text-amber-800 border-amber-500/40'
                  : 'bg-[#E2E8F0] text-[#475569] border-[#CBD5E1] hover:text-[#0F172A]'
              }`}
            >
              {isAdmin ? (
                <>
                  <Unlock className="w-3.5 h-3.5 text-amber-600" />
                  <span className="font-semibold">Admin</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  <span>Admin</span>
                </>
              )}
            </button>

            {/* Window Caption Controls */}
            <div className="flex items-center ml-1 pl-2 border-l border-[#CBD5E1] gap-1">
              <button
                onClick={handleMinimize}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-[#475569] hover:text-[#0F172A] hover:bg-[#E2E8F0] transition-none"
                title="Thu nhỏ cửa sổ"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleMaximize}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-[#475569] hover:text-[#0F172A] hover:bg-[#E2E8F0] transition-none"
                title={isMaximized ? "Khôi phục kích thước cửa sổ" : "Phóng to toàn màn hình"}
              >
                {isMaximized ? (
                  <Copy className="w-3 h-3 rotate-180" />
                ) : (
                  <Square className="w-3 h-3" />
                )}
              </button>
              <button
                onClick={handleClose}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-[#475569] hover:text-white hover:bg-rose-600 transition-none"
                title="Đóng ứng dụng"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Main Full-Width Floating Island Navigation Bar with window drag support */
        <div 
          className={`h-15 flex items-center justify-between transition-all duration-300 ${
            isAqua
              ? 'aqua-top-drop-header px-6'
              : isTerra
              ? 'rounded-2xl bg-[#2B241D] border-2 border-[#7C5332] shadow-[0_8px_24px_rgba(0,0,0,0.65)] px-4'
              : 'glass-header-elevated px-4'
          }`}
          style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
          onDoubleClick={handleMaximize}
        >
        {/* Brand & Tabs */}
        <div className="flex items-center gap-6" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
          {/* Logo */}
          <div 
            onClick={() => onTabChange('home')}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            {!logoError ? (
              <img 
                src={appLogo} 
                alt="Icelauch" 
                onError={(e) => {
                  if (e.currentTarget.src.includes('icon.png')) {
                    setLogoError(true);
                  } else {
                    e.currentTarget.src = './icon.png';
                  }
                }}
                className="w-8 h-8 rounded-xl object-contain shadow-md group-hover:scale-105 transition-transform" 
              />
            ) : (
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-900 to-[#0A1628] border border-cyan-400/40 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                <Gamepad2 className="w-4 h-4 text-cyan-300" />
              </div>
            )}
            <div className="flex flex-col">
              <span className="font-extrabold text-sm tracking-wider text-ice-text group-hover:text-ice-accent transition-colors flex items-center gap-1">
                ICELAUCH
                <Sparkles className="w-3 h-3 text-ice-accent opacity-0 group-hover:opacity-100 transition-opacity" />
              </span>
            </div>
          </div>

          {/* Navigation Links with Spacious Floating Pills */}
          <nav 
            ref={navContainerRef}
            className={`relative flex items-center gap-1.5 p-1 transition-all ${
              isAqua
                ? 'bg-sky-200/50 border border-sky-300/70 shadow-inner rounded-2xl'
                : isTerra
                ? 'bg-[#211C17] border border-[#7C5332]/60 shadow-inner rounded-lg'
                : 'bg-ice-bg/40 border border-ice-border/40 rounded-xl'
            }`}
          >
            {/* Aqua Sliding 3D Liquid Droplet Indicator */}
            {isAqua && dropletStyle.opacity > 0 && (
              <div
                className="aqua-droplet-bubble"
                style={{
                  left: 0,
                  transform: `translate3d(${dropletStyle.left}px, -50%, 0)`,
                  width: `${dropletStyle.width}px`,
                  height: '32px',
                }}
              />
            )}

            {navItems.map((item) => {
              const isActive = currentTab === item.id;

              return (
                <button
                  key={item.id}
                  data-tab-id={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`group/tab relative z-10 transition-all duration-200 cursor-pointer ${
                    isTerra
                      ? isActive
                        ? 'p-2 rounded-md bg-[#65A30D] text-white shadow-sm scale-105'
                        : 'p-2 rounded-md text-[#B5A898] hover:text-[#F3ECE1] hover:bg-[#2B241D]'
                      : isActive 
                        ? isAqua
                          ? 'px-3.5 py-1.5 text-xs font-bold tracking-wide rounded-xl text-sky-950 font-black scale-[1.03]'
                          : 'px-3.5 py-1.5 text-xs font-bold tracking-wide rounded-xl bg-ice-accent text-white shadow-sm' 
                        : isAqua
                          ? 'px-3.5 py-1.5 text-xs font-bold tracking-wide rounded-xl text-slate-600 hover:text-sky-950 hover:bg-white/40'
                          : 'px-3.5 py-1.5 text-xs font-bold tracking-wide rounded-xl text-ice-subtext hover:text-ice-text hover:bg-ice-hover/60'
                  }`}
                  title={!isTerra ? undefined : item.label}
                >
                  {isTerra ? (
                    <>
                      {getTerraTabIcon(item.id)}
                      {/* Tooltip on Hover */}
                      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2.5 py-1 rounded bg-[#2B241D] text-[#F3ECE1] border border-[#7C5332] shadow-md text-[11px] font-bold tracking-wider opacity-0 pointer-events-none group-hover/tab:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50">
                        {item.label}
                      </div>
                    </>
                  ) : (
                    item.label
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Center Extended Search Bar on Aqua Mode */}
        {isAqua && (
          <div className="flex-1 max-w-xs md:max-w-sm lg:max-w-md mx-4" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
            <div className="relative w-full">
              <Search className="w-3.5 h-3.5 text-sky-800 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Tìm kiếm trò chơi, video, bài hát..."
                className="w-full h-9 pl-9 pr-8 rounded-full bg-white/75 hover:bg-white/90 focus:bg-white border border-sky-400/80 text-xs text-sky-950 placeholder-sky-900/70 focus:outline-none focus:ring-2 focus:ring-sky-400/50 shadow-inner transition-all font-medium"
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-sky-600 hover:text-sky-900"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Right Section: Search, Theme Toggle, Downloads, Admin, Window Controls */}
        <div className="flex items-center gap-2" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
          {/* Search Bar - Concentric Pill Shape (Only in non-Aqua modes) */}
          {!isAqua && (
            <div className="relative w-52 lg:w-60">
              <Search className="w-3.5 h-3.5 text-ice-subtext absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Tìm kiếm..."
                className="w-full h-8 pl-8 pr-7 rounded-full bg-ice-bg/70 border border-ice-border text-xs text-ice-text placeholder-ice-subtext focus:outline-none focus:border-ice-accent focus:bg-ice-bg transition-colors shadow-inner"
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ice-subtext hover:text-ice-text"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}

          {/* Aqua Mode: Quick Water Touch Ripple Toggle Button */}
          {isAqua && (
            <button
              type="button"
              onClick={toggleAquaRipple}
              className={`h-8 px-2.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer ${
                isRippleEnabled
                  ? 'bg-sky-500/25 text-sky-800 border-sky-400/80 shadow-xs'
                  : 'bg-ice-hover text-ice-muted border-ice-border opacity-50'
              }`}
              title={isRippleEnabled ? 'Hiệu ứng chạm gợn nước đang BẬT. Nhấp để TẮT' : 'Hiệu ứng chạm gợn nước đang TẮT. Nhấp để BẬT'}
            >
              <Droplet className={`w-3.5 h-3.5 ${isRippleEnabled ? 'text-sky-600 fill-sky-500' : 'text-ice-muted'}`} />
              <span className="hidden xl:inline text-[11px]">{isRippleEnabled ? 'Gợn nước: Bật' : 'Gợn nước: Tắt'}</span>
            </button>
          )}

          {/* Solar / Lunar Morphing Theme Switch */}
          <ThemeToggleSwitch size="sm" />

          {/* Download Tray Toggle Button */}
          <button
            onClick={onToggleDownloadTray}
            className={`relative flex items-center gap-1.5 h-8 px-2.5 rounded-xl text-xs font-semibold border transition-all ${
              isDownloadTrayOpen
                ? 'bg-ice-accent text-white border-ice-accent shadow-sm'
                : activeDownloadsCount > 0
                ? 'bg-ice-accent/15 text-ice-accent border-ice-accent/40 hover:bg-ice-accent/25'
                : 'bg-ice-bg/60 text-ice-subtext border-ice-border hover:text-ice-text hover:border-ice-subtext'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Tải xuống</span>
            {activeDownloadsCount > 0 && (
              <span className="flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold bg-ice-accent text-white rounded-full">
                {activeDownloadsCount}
              </span>
            )}
          </button>

          {/* Admin Banner Manager Shortcut */}
          {isAdmin && onOpenBannerManager && (
            <button
              onClick={onOpenBannerManager}
              className="flex items-center gap-1.5 h-8 px-2.5 rounded-xl text-xs font-semibold bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 transition-colors shadow-sm"
              title="Quản lý Banner nổi bật toàn hệ thống"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Quản Lý Banner</span>
            </button>
          )}

          {/* Admin User Management Shortcut */}
          {isAdmin && onOpenUserManagement && (
            <button
              onClick={onOpenUserManagement}
              className="flex items-center gap-1.5 h-8 px-2.5 rounded-xl text-xs font-semibold bg-blue-500/15 hover:bg-blue-500/25 text-blue-300 border border-blue-500/40 transition-colors shadow-sm cursor-pointer"
              title="Quản lý người dùng & phân quyền"
            >
              <Users className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden md:inline">Người Dùng</span>
            </button>
          )}

          {/* Admin Device Whitelist Shortcut */}
          {isAdmin && onOpenDeviceManager && (
            <button
              onClick={onOpenDeviceManager}
              className="flex items-center gap-1.5 h-8 px-2.5 rounded-xl text-xs font-semibold bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/40 transition-colors shadow-sm cursor-pointer"
              title="Quản lý thiết bị cấp quyền & cấp mã OTP"
            >
              <Shield className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden md:inline">Thiết Bị</span>
            </button>
          )}

          {/* Multi-User Profile Widget */}
          {onSwitchProfile && onEditCurrentProfile && onLogoutProfile && (
            <UserMenuWidget
              activeProfile={activeProfile}
              onSwitchProfile={onSwitchProfile}
              onEditCurrentProfile={onEditCurrentProfile}
              onLogoutProfile={onLogoutProfile}
            />
          )}

          {/* Admin Lock Button */}
          <button
            onClick={isAdmin ? onLockAdmin : onOpenAdminAuth}
            className={`flex items-center gap-1.5 h-8 px-2.5 rounded-xl text-xs font-medium border transition-colors ${
              isAdmin
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 hover:bg-amber-500/30 font-semibold'
                : 'bg-ice-bg/60 text-ice-subtext border-ice-border hover:text-ice-text hover:border-ice-subtext'
            }`}
            title={isAdmin ? 'Nhấp để khoá Chế độ Admin' : 'Mở Chế độ Admin'}
          >
            {isAdmin ? (
              <>
                <Unlock className="w-3.5 h-3.5 text-amber-400" />
                <span className="font-semibold">Admin</span>
              </>
            ) : (
              <>
                <Lock className="w-3.5 h-3.5" />
                <span>Admin</span>
              </>
            )}
          </button>

          {/* Modern Frameless Window Caption Controls */}
          <div className="flex items-center ml-1 pl-2 border-l border-ice-border/60 gap-1">
            <button
              onClick={handleMinimize}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-ice-subtext hover:text-ice-text hover:bg-ice-hover transition-colors"
              title="Thu nhỏ cửa sổ"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleMaximize}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-ice-subtext hover:text-ice-text hover:bg-ice-hover transition-colors"
              title={isMaximized ? "Khôi phục kích thước cửa sổ" : "Phóng to toàn màn hình"}
            >
              {isMaximized ? (
                <Copy className="w-3 h-3 rotate-180" />
              ) : (
                <Square className="w-3 h-3" />
              )}
            </button>
            <button
              onClick={handleClose}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-ice-subtext hover:text-white hover:bg-rose-600 transition-colors"
              title="Đóng ứng dụng"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
      )}
    </header>
  );
};

