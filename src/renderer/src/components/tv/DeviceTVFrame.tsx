import React, { useState, useEffect, useRef } from 'react';
import {
  Film,
  Gamepad2,
  Bookmark,
  Sliders,
  User,
  ShieldCheck,
  Tv,
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  ArrowRight,
  CornerDownLeft,
  Home,
  Wifi,
  Clock,
  Sparkles,
  HelpCircle,
  X,
  Volume2
} from 'lucide-react';
import type { UserProfile } from '../../types';
import { AvatarBadge } from '../common/AvatarBadge';
import { sfx } from '../../utils/sfx';

interface DeviceTVFrameProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  onExitSimulation: () => void;
  isAdmin: boolean;
  adminTimeRemaining: number;
  onOpenAdminAuth: () => void;
  onLockAdmin: () => void;
  activeProfile: UserProfile | null;
  onSwitchProfile: (profile: UserProfile | null) => void;
  onEditCurrentProfile: () => void;
  onLogoutProfile: () => void;
  children: React.ReactNode;
}

export const DeviceTVFrame: React.FC<DeviceTVFrameProps> = ({
  currentTab,
  onTabChange,
  onExitSimulation,
  isAdmin,
  adminTimeRemaining,
  onOpenAdminAuth,
  onLockAdmin,
  activeProfile,
  onSwitchProfile,
  onEditCurrentProfile,
  onLogoutProfile,
  children,
}) => {
  const [currentTimeStr, setCurrentTimeStr] = useState('');
  const [showRemoteHelper, setShowRemoteHelper] = useState(true);
  const [focusedKey, setFocusedKey] = useState<string | null>(null);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const tvContainerRef = useRef<HTMLDivElement>(null);

  // Digital clock update
  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      setCurrentTimeStr(d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  // TV Main Navigation Tabs: Media (Giải Trí) is #1, Game is #2 (as requested)
  const tvNavTabs = [
    { id: 'media', label: 'Giải Trí', icon: Film, badge: 'Chính' },
    { id: 'home', label: 'Game', icon: Gamepad2, badge: 'PC' },
    { id: 'library', label: 'Yêu Thích', icon: Bookmark },
    { id: 'settings', label: 'Cài Đặt', icon: Sliders },
  ];

  // Spatial Keyboard & TV Remote Controller Event Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in text input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        navigateSpatial(e.key);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        triggerCurrentFocus();
      } else if (e.key === 'Escape' || e.key === 'Backspace') {
        e.preventDefault();
        handleBackAction();
      } else if (e.key === 'Home') {
        e.preventDefault();
        onTabChange('media');
        sfx.playClick();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentTab, isAccountMenuOpen]);

  // Spatial Navigation Engine
  const navigateSpatial = (direction: 'ArrowUp' | 'ArrowDown' | 'ArrowLeft' | 'ArrowRight') => {
    if (!tvContainerRef.current) return;
    const focusable = Array.from(
      tvContainerRef.current.querySelectorAll<HTMLElement>('[data-tv-focus]')
    ).filter((el) => {
      const rect = el.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0 && window.getComputedStyle(el).display !== 'none';
    });

    if (focusable.length === 0) return;

    const currentActive = document.activeElement as HTMLElement;
    const currentIndex = focusable.indexOf(currentActive);

    let nextIndex = 0;
    if (currentIndex === -1) {
      nextIndex = 0;
    } else {
      const curRect = currentActive.getBoundingClientRect();
      const curCenter = { x: curRect.left + curRect.width / 2, y: curRect.top + curRect.height / 2 };

      let bestCandidate = -1;
      let minDistance = Infinity;

      focusable.forEach((el, idx) => {
        if (idx === currentIndex) return;
        const rect = el.getBoundingClientRect();
        const center = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
        const dx = center.x - curCenter.x;
        const dy = center.y - curCenter.y;

        let isValid = false;
        if (direction === 'ArrowRight' && dx > 15) isValid = true;
        if (direction === 'ArrowLeft' && dx < -15) isValid = true;
        if (direction === 'ArrowDown' && dy > 15) isValid = true;
        if (direction === 'ArrowUp' && dy < -15) isValid = true;

        if (isValid) {
          // Weight orthogonal distance heavier
          const distance = direction === 'ArrowLeft' || direction === 'ArrowRight'
            ? Math.abs(dx) + Math.abs(dy) * 2.5
            : Math.abs(dy) + Math.abs(dx) * 2.5;

          if (distance < minDistance) {
            minDistance = distance;
            bestCandidate = idx;
          }
        }
      });

      if (bestCandidate !== -1) {
        nextIndex = bestCandidate;
      } else {
        // Fallback wrapping within tab or row
        if (direction === 'ArrowRight') nextIndex = (currentIndex + 1) % focusable.length;
        else if (direction === 'ArrowLeft') nextIndex = (currentIndex - 1 + focusable.length) % focusable.length;
        else if (direction === 'ArrowDown') nextIndex = Math.min(focusable.length - 1, currentIndex + 4);
        else if (direction === 'ArrowUp') nextIndex = Math.max(0, currentIndex - 4);
      }
    }

    const nextEl = focusable[nextIndex];
    if (nextEl) {
      nextEl.focus();
      nextEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
      sfx.playTick(1200);
      setFocusedKey(nextEl.getAttribute('data-tv-focus'));
    }
  };

  const triggerCurrentFocus = () => {
    const currentActive = document.activeElement as HTMLElement;
    if (currentActive && currentActive.hasAttribute('data-tv-focus')) {
      sfx.playClick();
      currentActive.click();
    }
  };

  const handleBackAction = () => {
    sfx.playClick();
    if (isAccountMenuOpen) {
      setIsAccountMenuOpen(false);
      return;
    }
    if (currentTab !== 'media') {
      onTabChange('media');
    }
  };

  return (
    <div className="flex-1 w-full h-full bg-[#05070A] flex flex-col items-center justify-center p-3 select-none overflow-hidden relative font-sans">
      {/* 1. TV SCREEN CONTAINER (16:9 High-Tech Smart TV Design) */}
      <div
        ref={tvContainerRef}
        className="relative w-full max-w-[1520px] aspect-[16/9] bg-[#0A0D14] rounded-2xl border-4 border-[#1E2330] shadow-[0_25px_80px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col"
      >
        {/* TOP TV LEANBACK NAVIGATION BAR */}
        <header className="h-16 px-6 bg-gradient-to-b from-[#10141D] to-[#0A0D14]/90 backdrop-blur-xl border-b border-white/10 flex items-center justify-between shrink-0 z-30">
          {/* Logo & Platform Badge */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 p-0.5 shadow-lg shadow-amber-500/20 flex items-center justify-center">
                <Tv className="w-5 h-5 text-black" />
              </div>
              <span className="text-base font-black text-white tracking-wider font-mono">
                ICE<span className="text-amber-400">TV</span>
              </span>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Android TV
            </span>
          </div>

          {/* Main Navigation Pills (D-Pad Navigable) */}
          <nav className="flex items-center gap-2">
            {tvNavTabs.map((tab) => {
              const isActive = currentTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  data-tv-focus={`nav-${tab.id}`}
                  type="button"
                  onClick={() => onTabChange(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all outline-none ${
                    isActive
                      ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/30 font-black'
                      : 'bg-white/5 hover:bg-white/10 text-white/80 hover:text-white border border-white/5'
                  } focus:ring-4 focus:ring-amber-400 focus:scale-105 focus:shadow-xl`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-extrabold uppercase ${
                      isActive ? 'bg-black/20 text-black' : 'bg-white/10 text-ice-subtext'
                    }`}>
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Status Tray: Account & Clock */}
          <div className="flex items-center gap-4">
            {/* Account & Profile Button */}
            <button
              data-tv-focus="nav-account"
              type="button"
              onClick={() => setIsAccountMenuOpen(!isAccountMenuOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-white text-xs font-semibold outline-none focus:ring-4 focus:ring-amber-400 focus:scale-105 transition-all"
            >
              <AvatarBadge
                avatar={activeProfile?.avatar}
                nickname={activeProfile?.nickname}
                size="xs"
              />
              <span className="max-w-[80px] truncate">
                {activeProfile?.nickname || 'Tài Khoản'}
              </span>
              {isAdmin && (
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              )}
            </button>

            {/* Time & Connectivity */}
            <div className="flex items-center gap-2 text-xs text-white/80 font-mono font-bold pl-2 border-l border-white/10">
              <Wifi className="w-3.5 h-3.5 text-emerald-400" />
              <span>{currentTimeStr || '12:00'}</span>
            </div>
          </div>
        </header>

        {/* TV MAIN CONTENT VIEW AREA */}
        <div className="flex-1 w-full overflow-hidden flex flex-col relative bg-[#0A0D14]">
          {children}
        </div>

        {/* ACCOUNT / PROFILE TV OVERLAY MODAL */}
        {isAccountMenuOpen && (
          <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center animate-fade-in p-6">
            <div className="w-full max-w-md bg-[#131722] border-2 border-amber-500/50 rounded-3xl p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <AvatarBadge avatar={activeProfile?.avatar} nickname={activeProfile?.nickname} size="md" />
                  <div>
                    <h3 className="text-base font-black text-white">
                      {activeProfile?.nickname || 'Tài Khoản Khách'}
                    </h3>
                    <p className="text-xs text-ice-subtext">
                      {isAdmin ? '🛡️ Quản trị viên đã kích hoạt' : 'Người dùng tiêu chuẩn'}
                    </p>
                  </div>
                </div>
                <button
                  data-tv-focus="modal-close"
                  type="button"
                  onClick={() => setIsAccountMenuOpen(false)}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center outline-none focus:ring-4 focus:ring-amber-400"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2">
                <button
                  data-tv-focus="modal-profile-edit"
                  type="button"
                  onClick={() => {
                    setIsAccountMenuOpen(false);
                    onEditCurrentProfile();
                  }}
                  className="w-full h-11 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold flex items-center gap-3 px-4 outline-none focus:ring-4 focus:ring-amber-400 focus:scale-102"
                >
                  <User className="w-4 h-4 text-amber-400" />
                  <span>Đổi Tên & Ảnh Đại Diện</span>
                </button>

                {isAdmin ? (
                  <button
                    data-tv-focus="modal-admin-lock"
                    type="button"
                    onClick={() => {
                      setIsAccountMenuOpen(false);
                      onLockAdmin();
                    }}
                    className="w-full h-11 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center gap-3 px-4 outline-none focus:ring-4 focus:ring-amber-400 focus:scale-102"
                  >
                    <ShieldCheck className="w-4 h-4 text-amber-400" />
                    <span>Khóa Chế Độ Admin</span>
                  </button>
                ) : (
                  <button
                    data-tv-focus="modal-admin-unlock"
                    type="button"
                    onClick={() => {
                      setIsAccountMenuOpen(false);
                      onOpenAdminAuth();
                    }}
                    className="w-full h-11 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center gap-3 px-4 outline-none focus:ring-4 focus:ring-amber-400 focus:scale-102"
                  >
                    <ShieldCheck className="w-4 h-4 text-amber-400" />
                    <span>Mở Khóa Quản Trị (Nhập PIN)</span>
                  </button>
                )}

                <button
                  data-tv-focus="modal-logout"
                  type="button"
                  onClick={() => {
                    setIsAccountMenuOpen(false);
                    onLogoutProfile();
                  }}
                  className="w-full h-11 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-300 text-xs font-bold flex items-center gap-3 px-4 outline-none focus:ring-4 focus:ring-red-400 focus:scale-102"
                >
                  <ArrowLeft className="w-4 h-4 text-red-400" />
                  <span>Đổi Tài Khoản Khác</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. TV STAND (Realistic Bezel / Table Stand Aesthetic) */}
      <div className="w-48 h-3.5 bg-gradient-to-b from-[#252A38] to-[#12151E] rounded-b-xl shadow-lg mt-0.5 border-t border-[#333C4F]" />
      <div className="w-80 h-2 bg-gradient-to-r from-transparent via-[#1E2330] to-transparent mt-0.5" />

      {/* 3. VIRTUAL TV REMOTE CONTROLLER HELPER (For PC & Mouse Simulation Testing) */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end">
        {showRemoteHelper ? (
          <div className="bg-[#141722]/95 border border-amber-500/50 rounded-2xl p-3 shadow-2xl backdrop-blur-md space-y-2.5 w-60 animate-in slide-in-from-bottom-3 text-white">
            <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
              <span className="text-[11px] font-black uppercase text-amber-400 tracking-wider flex items-center gap-1.5">
                <Tv className="w-3.5 h-3.5" />
                <span>Điều Khiển TV (Remote)</span>
              </span>
              <button
                type="button"
                onClick={() => setShowRemoteHelper(false)}
                className="text-white/60 hover:text-white p-0.5 rounded"
                title="Thu nhỏ điều khiển"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* D-Pad Buttons */}
            <div className="flex flex-col items-center gap-1 py-1">
              <button
                type="button"
                onClick={() => navigateSpatial('ArrowUp')}
                className="w-9 h-9 rounded-xl bg-white/10 hover:bg-amber-400 hover:text-black flex items-center justify-center transition-all shadow active:scale-95"
                title="Lên trên (Phím Mũi Tên Lên)"
              >
                <ArrowUp className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => navigateSpatial('ArrowLeft')}
                  className="w-9 h-9 rounded-xl bg-white/10 hover:bg-amber-400 hover:text-black flex items-center justify-center transition-all shadow active:scale-95"
                  title="Sang trái (Phím Mũi Tên Trái)"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={triggerCurrentFocus}
                  className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-400 text-black font-black text-xs flex items-center justify-center shadow-lg active:scale-90 transition-all"
                  title="Nút OK / Chọn (Phím Enter)"
                >
                  OK
                </button>
                <button
                  type="button"
                  onClick={() => navigateSpatial('ArrowRight')}
                  className="w-9 h-9 rounded-xl bg-white/10 hover:bg-amber-400 hover:text-black flex items-center justify-center transition-all shadow active:scale-95"
                  title="Sang phải (Phím Mũi Tên Phải)"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
              <button
                type="button"
                onClick={() => navigateSpatial('ArrowDown')}
                className="w-9 h-9 rounded-xl bg-white/10 hover:bg-amber-400 hover:text-black flex items-center justify-center transition-all shadow active:scale-95"
                title="Xuống dưới (Phím Mũi Tên Xuống)"
              >
                <ArrowDown className="w-4 h-4" />
              </button>
            </div>

            {/* Home & Back Shortcuts */}
            <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-white/10">
              <button
                type="button"
                onClick={() => onTabChange('media')}
                className="h-8 rounded-lg bg-white/10 hover:bg-white/20 text-[10px] font-bold flex items-center justify-center gap-1"
                title="Về Trang Chính (Phím Home)"
              >
                <Home className="w-3 h-3 text-amber-400" />
                <span>Trang Chủ</span>
              </button>
              <button
                type="button"
                onClick={handleBackAction}
                className="h-8 rounded-lg bg-white/10 hover:bg-white/20 text-[10px] font-bold flex items-center justify-center gap-1"
                title="Quay lại (Phím Esc / Backspace)"
              >
                <CornerDownLeft className="w-3 h-3 text-red-400" />
                <span>Quay Lại</span>
              </button>
            </div>

            <p className="text-[9px] text-ice-muted leading-tight text-center">
              💡 Bạn có thể dùng phím mũi tên & Enter trên bàn phím hoặc rê chuột trực tiếp.
            </p>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowRemoteHelper(true)}
            className="p-3 rounded-2xl bg-amber-500 text-black font-black text-xs shadow-2xl flex items-center gap-2 hover:bg-amber-400 transition-all"
            title="Mở Bàn Phím / Remote TV"
          >
            <Tv className="w-4 h-4" />
            <span>Mở Điều Khiển TV</span>
          </button>
        )}
      </div>
    </div>
  );
};
