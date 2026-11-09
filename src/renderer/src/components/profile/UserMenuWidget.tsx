import React, { useState, useRef, useEffect } from 'react';
import { 
  User, 
  Users, 
  Settings, 
  LogOut, 
  ChevronDown, 
  Sparkles, 
  Gamepad2, 
  Film,
  Check
} from 'lucide-react';
import { AvatarBadge } from '../common/AvatarBadge';
import type { UserProfile } from '../../types';

interface UserMenuWidgetProps {
  activeProfile: UserProfile | null;
  onSwitchProfile: () => void;
  onEditCurrentProfile: () => void;
  onLogoutProfile: () => void;
}

export const UserMenuWidget: React.FC<UserMenuWidgetProps> = ({
  activeProfile,
  onSwitchProfile,
  onEditCurrentProfile,
  onLogoutProfile,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  if (!activeProfile) {
    // Guest Mode
    return (
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 h-8 px-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 border border-white/10 transition-colors text-xs font-semibold"
          title="Tài khoản khách"
        >
          <div className="w-5 h-5 rounded-full bg-slate-700 flex items-center justify-center text-white/70">
            <User className="w-3 h-3" />
          </div>
          <span>Khách</span>
          <ChevronDown className="w-3 h-3 text-ice-subtext" />
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-2 w-52 rounded-xl bg-[#14171F] border border-ice-border shadow-2xl p-2 z-50 animate-fade-in space-y-1">
            <div className="px-3 py-2 border-b border-ice-border/50 text-left">
              <span className="text-[11px] font-bold text-white block">Chế Độ Khách (Guest)</span>
              <span className="text-[10px] text-ice-subtext block">Tiến độ tạm thời không được đồng bộ</span>
            </div>
            <button
              onClick={() => {
                setIsOpen(false);
                onSwitchProfile();
              }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-ice-accent hover:bg-ice-accent/15 transition-colors text-left"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Đăng Nhập Hồ Sơ</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  // Active Profile Mode
  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 h-8 pl-1.5 pr-2.5 rounded-lg bg-ice-card hover:bg-white/10 border border-ice-border hover:border-ice-accent/50 transition-all text-xs font-semibold group"
      >
        <AvatarBadge
          avatar={activeProfile.avatar}
          nickname={activeProfile.nickname}
          size="xs"
          showBorder={false}
        />
        <span className="text-white max-w-[100px] truncate">{activeProfile.nickname}</span>
        <ChevronDown className="w-3 h-3 text-ice-subtext group-hover:text-white transition-colors" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-[#14171F] border border-ice-border shadow-2xl p-3 z-50 animate-fade-in space-y-2">
          {/* User Profile Mini Header */}
          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white/5 border border-white/5">
            <AvatarBadge
              avatar={activeProfile.avatar}
              nickname={activeProfile.nickname}
              size="md"
            />
            <div className="overflow-hidden">
              <span className="font-bold text-sm text-white block truncate">
                {activeProfile.nickname}
              </span>
              <div className="flex items-center gap-2 text-[10px] text-ice-subtext">
                <span className="flex items-center gap-1">
                  <Gamepad2 className="w-3 h-3 text-ice-accent" />
                  {activeProfile.library?.length || 0} Game
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Film className="w-3 h-3 text-amber-400" />
                  {Object.keys(activeProfile.watchProgress || {}).length} Phim
                </span>
              </div>
            </div>
          </div>

          {/* Action List */}
          <div className="space-y-0.5 pt-1">
            <button
              onClick={() => {
                setIsOpen(false);
                onSwitchProfile();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-white/90 hover:bg-white/10 hover:text-white transition-colors text-left"
            >
              <Users className="w-4 h-4 text-ice-accent" />
              <span>Chuyển Đổi Hồ Sơ</span>
            </button>

            <button
              onClick={() => {
                setIsOpen(false);
                onEditCurrentProfile();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-white/90 hover:bg-white/10 hover:text-white transition-colors text-left"
            >
              <Settings className="w-4 h-4 text-amber-400" />
              <span>Chỉnh Sửa Hồ Sơ</span>
            </button>

            <div className="h-px bg-ice-border/60 my-1" />

            <button
              onClick={() => {
                setIsOpen(false);
                onLogoutProfile();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-rose-300 hover:bg-rose-500/15 transition-colors text-left"
            >
              <LogOut className="w-4 h-4 text-rose-400" />
              <span>Đăng Xuất (Vào Chế Độ Khách)</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
