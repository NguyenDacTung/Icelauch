import React, { useState, useEffect } from 'react';
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
  Shield
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

  const navItems: { id: NavigationTab; label: string }[] = [
    { id: 'home', label: 'TRANG CHỦ' },
    { id: 'library', label: 'THƯ VIỆN' },
    { id: 'media', label: 'GIẢI TRÍ' },
    { id: 'extras', label: 'TIỆN ÍCH' },
    { id: 'settings', label: 'CÀI ĐẶT' },
  ];

  return (
    <header className="relative flex-shrink-0 z-30 select-none px-4 pt-2.5 pb-1">
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

      {/* Main Full-Width Floating Island Navigation Bar with window drag support */}
      <div 
        className="h-15 glass-header-elevated px-4 flex items-center justify-between transition-all duration-300"
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
          <nav className="flex items-center gap-1.5 bg-ice-bg/40 p-1 rounded-xl border border-ice-border/40">
            {navItems.map((item) => {
              const isActive = currentTab === item.id;
              const isAqua = theme === 'aqua';

              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`relative px-3.5 py-1.5 text-xs font-bold tracking-wide rounded-lg transition-all duration-300 cursor-pointer ${
                    isActive 
                      ? isAqua
                        ? 'liquid-water-pill text-white shadow-[0_0_15px_rgba(56,189,248,0.55)] scale-[1.02]'
                        : 'bg-ice-accent text-white shadow-sm' 
                      : 'text-ice-subtext hover:text-ice-text hover:bg-ice-hover/60'
                  }`}
                >
                  {item.label}
                  {/* Subtle water droplet bead on Aqua mode */}
                  {isActive && isAqua && (
                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-cyan-300 shadow-[0_0_6px_#38bdf8] animate-pulse" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Right Section: Search, Theme Toggle, Downloads, Admin, Window Controls */}
        <div className="flex items-center gap-2" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
          {/* Search Bar - Concentric Pill Shape */}
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
    </header>
  );
};

