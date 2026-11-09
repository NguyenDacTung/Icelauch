import React, { useState } from 'react';
import { 
  Film, 
  Gamepad2, 
  Bookmark,
  Sliders, 
  Wifi, 
  BatteryMedium, 
  Signal,
  User,
  ShieldCheck,
  ShieldAlert,
  LogOut,
  Users,
  Edit3,
  X,
  Lock,
  Unlock,
  Sparkles,
} from 'lucide-react';
import type { NavigationTab, UserProfile } from '../../types';
import { AvatarBadge } from './AvatarBadge';

interface DevicePhoneFrameProps {
  children: React.ReactNode;
  currentTab: NavigationTab;
  onTabChange: (tab: NavigationTab) => void;
  onExitSimulation?: () => void;
  isAdmin?: boolean;
  adminTimeRemaining?: number;
  onOpenAdminAuth?: () => void;
  onLockAdmin?: () => void;
  activeProfile?: UserProfile | null;
  onSwitchProfile?: () => void;
  onEditCurrentProfile?: () => void;
  onLogoutProfile?: () => void;
}

export const DevicePhoneFrame: React.FC<DevicePhoneFrameProps> = ({
  children,
  currentTab,
  onTabChange,
  onExitSimulation,
  isAdmin = false,
  adminTimeRemaining = 900,
  onOpenAdminAuth,
  onLockAdmin,
  activeProfile = null,
  onSwitchProfile,
  onEditCurrentProfile,
  onLogoutProfile,
}) => {
  const [isAccountSheetOpen, setIsAccountSheetOpen] = useState(false);

  // Mobile navigation tabs order: Media first, then Game (renamed), then Library, then Settings
  const mobileNavItems: { id: NavigationTab; label: string; icon: any }[] = [
    { id: 'media', label: 'Giải Trí', icon: Film },
    { id: 'home', label: 'Game', icon: Gamepad2 },
    { id: 'library', label: 'Thư Viện', icon: Bookmark },
    { id: 'settings', label: 'Cài Đặt', icon: Sliders },
  ];

  const formatAdminTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="flex-1 w-full h-full flex flex-col items-center justify-center p-2 select-none overflow-hidden relative">
      {/* Phone Hardware Chassis (Realistic 390px x 820px) */}
      <div className="relative w-[390px] h-[820px] max-h-[96vh] rounded-[48px] p-2.5 bg-gradient-to-b from-[#2E3342] via-[#1A1D26] to-[#12141A] shadow-[0_0_50px_rgba(0,0,0,0.85),0_20px_40px_rgba(0,0,0,0.6)] border border-white/10 flex flex-col">
        {/* Outer Metal Bezel Highlight */}
        <div className="relative w-full h-full rounded-[38px] overflow-hidden bg-[#0F1115] flex flex-col border border-black/80 shadow-inner">
          {/* Top Status Bar (Time, Dynamic Island, Wifi, Battery) */}
          <div className="h-9 px-6 flex items-center justify-between text-[11px] font-bold text-white/90 bg-transparent shrink-0 z-30 select-none">
            <span>09:41</span>
            {/* Dynamic Island / Camera Notch */}
            <div className="w-24 h-5 rounded-full bg-black flex items-center justify-end px-2 border border-white/10 shadow-sm">
              <div className="w-2.5 h-2.5 rounded-full bg-[#1A1D26] border border-white/20" />
            </div>
            <div className="flex items-center gap-1.5 text-white/80">
              <Signal className="w-3 h-3" />
              <Wifi className="w-3 h-3" />
              <BatteryMedium className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Main App Screen Inside Phone */}
          <div className="flex-1 w-full overflow-hidden flex flex-col relative">
            {children}
          </div>

          {/* Bottom iPhone-Style Floating Rounded Dock Bar */}
          <div className="mx-3 mb-2 h-14 rounded-full bg-[#14171F]/90 backdrop-blur-2xl border border-white/10 shadow-[0_10px_35px_rgba(0,0,0,0.7)] flex items-center justify-around px-2 shrink-0 z-30">
            {mobileNavItems.map((item) => {
              const isActive = currentTab === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onTabChange(item.id)}
                  className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-full transition-all ${
                    isActive ? 'text-amber-400 scale-105 font-bold' : 'text-ice-subtext hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-[10px] font-semibold">{item.label}</span>
                </button>
              );
            })}

            {/* 5th Navigation Item: Profile & Admin Quick Button */}
            <button
              type="button"
              onClick={() => setIsAccountSheetOpen(true)}
              className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-full transition-all ${
                isAccountSheetOpen ? 'text-amber-400 scale-105' : 'text-ice-subtext hover:text-white'
              }`}
              title="Tài khoản & Quản trị"
            >
              {activeProfile?.avatar ? (
                <div className="relative">
                  <AvatarBadge avatar={activeProfile.avatar} nickname={activeProfile.nickname} size="xs" />
                  {isAdmin && (
                    <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-500 border border-black" />
                  )}
                </div>
              ) : isAdmin ? (
                <ShieldCheck className="w-4 h-4 text-amber-400" />
              ) : (
                <User className="w-4 h-4" />
              )}
              <span className="text-[10px] font-semibold line-clamp-1 max-w-[54px]">
                {activeProfile?.nickname || 'Tài Khoản'}
              </span>
            </button>
          </div>

          {/* Phone Home Indicator Line */}
          <div className="h-2 flex items-center justify-center bg-[#0F1115] shrink-0">
            <div className="w-32 h-1 rounded-full bg-white/25" />
          </div>

          {/* Bottom Sheet Menu: Account & Admin Controls */}
          {isAccountSheetOpen && (
            <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col justify-end animate-fade-in">
              <div className="w-full bg-[#14171F] border-t border-ice-border rounded-t-3xl p-4 space-y-3.5 shadow-2xl animate-scale-up">
                {/* Header with Close */}
                <div className="flex items-center justify-between pb-2 border-b border-ice-border/60">
                  <div className="flex items-center gap-2.5">
                    <AvatarBadge avatar={activeProfile?.avatar} nickname={activeProfile?.nickname} size="sm" />
                    <div>
                      <h3 className="text-sm font-black text-white leading-tight">
                        {activeProfile?.nickname || 'Khách (Chưa đăng nhập)'}
                      </h3>
                      <span className="text-[10px] text-ice-subtext">
                        {activeProfile ? 'Hồ sơ cá nhân' : 'Chế độ trải nghiệm'}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsAccountSheetOpen(false)}
                    className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Admin Status Card */}
                <div className="p-3 rounded-2xl bg-black/40 border border-white/5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                      <span>Chế Độ Admin:</span>
                    </span>
                    <span className={`text-[11px] font-black px-2 py-0.5 rounded-full ${
                      isAdmin ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-white/10 text-ice-subtext'
                    }`}>
                      {isAdmin ? `BẬT (${formatAdminTime(adminTimeRemaining)})` : 'ĐÃ KHÓA'}
                    </span>
                  </div>

                  {isAdmin ? (
                    <button
                      type="button"
                      onClick={() => {
                        onLockAdmin?.();
                        setIsAccountSheetOpen(false);
                      }}
                      className="w-full h-9 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>Khóa Admin Ngay</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        onOpenAdminAuth?.();
                        setIsAccountSheetOpen(false);
                      }}
                      className="w-full h-9 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-black text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md active:scale-98"
                    >
                      <Unlock className="w-3.5 h-3.5 fill-black" />
                      <span>Mở Khóa Admin</span>
                    </button>
                  )}
                </div>

                {/* Profile Actions List */}
                <div className="space-y-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      onSwitchProfile?.();
                      setIsAccountSheetOpen(false);
                    }}
                    className="w-full h-10 px-3.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-bold flex items-center justify-between border border-white/5 transition-all"
                  >
                    <span className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-ice-accent" />
                      <span>Đổi Hồ Sơ Người Dùng</span>
                    </span>
                    <span className="text-[10px] text-ice-subtext">Netflix Picker ↗</span>
                  </button>

                  {activeProfile && (
                    <button
                      type="button"
                      onClick={() => {
                        onEditCurrentProfile?.();
                        setIsAccountSheetOpen(false);
                      }}
                      className="w-full h-10 px-3.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-bold flex items-center justify-between border border-white/5 transition-all"
                    >
                      <span className="flex items-center gap-2">
                        <Edit3 className="w-4 h-4 text-emerald-400" />
                        <span>Chỉnh Sửa Tên & Avatar</span>
                      </span>
                    </button>
                  )}

                  {activeProfile && (
                    <button
                      type="button"
                      onClick={() => {
                        onLogoutProfile?.();
                        setIsAccountSheetOpen(false);
                      }}
                      className="w-full h-10 px-3.5 rounded-xl bg-red-600/15 hover:bg-red-600/25 text-red-300 text-xs font-bold flex items-center gap-2 border border-red-500/30 transition-all"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Đăng Xuất Khỏi Thiết Bị</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
