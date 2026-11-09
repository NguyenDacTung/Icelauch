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
  Copy
} from 'lucide-react';
import type { NavigationTab } from '../../types';

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
}) => {
  const [logoError, setLogoError] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);

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
    { id: 'settings', label: 'CÀI ĐẶT' },
  ];

  return (
    <header className="flex-shrink-0 z-40 select-none">
      {/* Top Admin banner if active */}
      {isAdmin && (
        <div className="h-6 bg-amber-500/15 border-b border-amber-500/30 px-4 flex items-center justify-between text-xs text-amber-300">
          <div className="flex items-center gap-1.5 font-medium">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
            <span>Chế độ Admin đang bật — Tự khoá sau {formatTime(adminTimeRemaining)}</span>
          </div>
          <div className="flex items-center gap-4">
            {onOpenBannerManager && (
              <button
                onClick={onOpenBannerManager}
                className="hover:text-white transition-colors underline text-[11px] flex items-center gap-1 font-semibold"
              >
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>Quản Lý Banner</span>
              </button>
            )}
            <button 
              onClick={onLockAdmin}
              className="hover:text-white transition-colors underline text-[11px]"
            >
              Khoá ngay
            </button>
          </div>
        </div>
      )}

      {/* Main 56px Navigation Bar with window drag support */}
      <div 
        className="h-14 bg-ice-card border-b border-ice-border px-4 flex items-center justify-between"
        style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
        onDoubleClick={handleMaximize}
      >
        {/* Brand & Tabs */}
        <div className="flex items-center gap-8" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
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
                className="w-8 h-8 rounded-lg object-contain shadow-md group-hover:scale-105 transition-transform" 
              />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-900 to-[#0A1628] border border-cyan-400/40 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                <Gamepad2 className="w-4 h-4 text-cyan-300" />
              </div>
            )}
            <div className="flex flex-col">
              <span className="font-bold text-base tracking-wider text-white group-hover:text-ice-accent transition-colors flex items-center gap-1">
                ICELAUCH
                <Sparkles className="w-3 h-3 text-ice-accent opacity-0 group-hover:opacity-100 transition-opacity" />
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`relative px-4 py-4 text-sm font-semibold tracking-wide transition-colors ${
                    isActive 
                      ? 'text-white' 
                      : 'text-ice-subtext hover:text-white'
                  }`}
                >
                  {item.label}
                  {isActive && (
                    <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-ice-accent rounded-full shadow-[0_0_8px_rgba(79,140,255,0.8)]" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Right Section: Search, Downloads, Admin, Window Controls */}
        <div className="flex items-center gap-2.5" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
          {/* Search Bar */}
          <div className="relative w-56 lg:w-64">
            <Search className="w-4 h-4 text-ice-subtext absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Tìm kiếm..."
              className="w-full h-8 pl-9 pr-7 rounded bg-ice-bg/80 border border-ice-border text-xs text-ice-text placeholder-ice-subtext focus:outline-none focus:border-ice-accent transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-ice-subtext hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Download Tray Toggle Button */}
          <button
            onClick={onToggleDownloadTray}
            className={`relative flex items-center gap-2 h-8 px-3 rounded text-xs font-medium border transition-colors ${
              isDownloadTrayOpen
                ? 'bg-ice-accent text-white border-ice-accent shadow-sm'
                : activeDownloadsCount > 0
                ? 'bg-ice-accent/15 text-ice-accent border-ice-accent/40 hover:bg-ice-accent/25'
                : 'bg-ice-bg/60 text-ice-subtext border-ice-border hover:text-white hover:border-ice-subtext'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Tải xuống</span>
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
              className="flex items-center gap-1.5 h-8 px-3 rounded text-xs font-semibold bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 transition-colors shadow-sm"
              title="Quản lý Banner nổi bật toàn hệ thống"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Quản Lý Banner</span>
            </button>
          )}

          {/* Admin Lock Button */}
          <button
            onClick={isAdmin ? onLockAdmin : onOpenAdminAuth}
            className={`flex items-center gap-1.5 h-8 px-3 rounded text-xs font-medium border transition-colors ${
              isAdmin
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 hover:bg-amber-500/30'
                : 'bg-ice-bg/60 text-ice-subtext border-ice-border hover:text-white hover:border-ice-subtext'
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
          <div className="flex items-center ml-1 pl-2.5 border-l border-ice-border/60 gap-1">
            <button
              onClick={handleMinimize}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-ice-subtext hover:text-white hover:bg-white/10 transition-colors"
              title="Thu nhỏ cửa sổ"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleMaximize}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-ice-subtext hover:text-white hover:bg-white/10 transition-colors"
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
              className="w-8 h-8 rounded-lg flex items-center justify-center text-ice-subtext hover:text-white hover:bg-rose-600 transition-colors"
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

