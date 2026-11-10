import React from 'react';
import { Film, Gamepad2, Bookmark, Sliders, X } from 'lucide-react';
import type { NavigationTab, UserProfile } from '../../types';

interface DevicePhoneFrameProps {
  children: React.ReactNode;
  currentTab: NavigationTab;
  onTabChange: (tab: NavigationTab) => void;
  onTabReTap?: (tab: NavigationTab) => void;
  onExitSimulation?: () => void;
  isSimulated?: boolean;
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
  onTabReTap,
  onExitSimulation,
  isSimulated = false,
}) => {
  // 4 Primary Mobile Navigation Tabs
  const mobileNavItems: { id: NavigationTab; label: string; icon: any }[] = [
    { id: 'media', label: 'Giải Trí', icon: Film },
    { id: 'home', label: 'Game', icon: Gamepad2 },
    { id: 'library', label: 'Thư Viện', icon: Bookmark },
    { id: 'settings', label: 'Cài Đặt', icon: Sliders },
  ];

  const handleTabClick = (tabId: NavigationTab) => {
    if (currentTab === tabId) {
      onTabReTap?.(tabId);
    } else {
      onTabChange(tabId);
    }
  };

  const renderBottomNav = () => (
    <nav className="h-16 w-full bg-[#10131B]/95 backdrop-blur-2xl border-t border-white/10 flex items-center justify-around px-3 shrink-0 z-40 select-none shadow-[0_-4px_20px_rgba(0,0,0,0.5)]">
      {mobileNavItems.map((item) => {
        const isActive = currentTab === item.id;
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => handleTabClick(item.id)}
            className={`flex-1 flex flex-col items-center justify-center py-1.5 rounded-xl transition-all duration-200 active:scale-95 ${isActive
                ? 'text-cyan-400 font-bold'
                : 'text-slate-400 hover:text-white font-medium'
              }`}
          >
            <div className="relative">
              <Icon
                className={`w-5 h-5 transition-transform duration-200 ${isActive ? 'scale-110 drop-shadow-[0_0_8px_rgba(34,211,238,0.6)]' : ''
                  }`}
              />
              {isActive && (
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_#22d3ee]" />
              )}
            </div>
            <span className="text-[11px] mt-1 tracking-tight">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );

  // 1. SIMULATOR MODE (Only when Admin is previewing phone on PC Electron)
  if (isSimulated) {
    return (
      <div className="flex-1 w-full h-full flex flex-col items-center justify-center p-3 select-none overflow-hidden relative bg-[#07090E]">
        {/* Top exit simulation indicator */}
        <div className="mb-2 flex items-center gap-2">
          <span className="text-xs text-ice-subtext font-semibold">Đang giả lập màn hình Điện Thoại</span>
          {onExitSimulation && (
            <button
              type="button"
              onClick={onExitSimulation}
              className="px-2 py-0.5 rounded-md bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold flex items-center gap-1"
            >
              <X className="w-3 h-3" />
              <span>Thoát</span>
            </button>
          )}
        </div>

        {/* Realistic Phone Frame */}
        <div className="relative w-[390px] h-[820px] max-h-[92vh] rounded-[48px] p-2.5 bg-gradient-to-b from-[#2E3342] via-[#1A1D26] to-[#12141A] shadow-[0_0_50px_rgba(0,0,0,0.9),0_20px_40px_rgba(0,0,0,0.7)] border border-white/15 flex flex-col">
          <div className="relative w-full h-full rounded-[38px] overflow-hidden bg-[#0A0C10] flex flex-col border border-black/80 shadow-inner">
            {/* Top Simulated Notch */}
            <div className="h-7 w-full flex items-center justify-center shrink-0 z-30 select-none">
              <div className="w-24 h-4 rounded-full bg-black flex items-center justify-end px-2 border border-white/10 shadow-sm">
                <div className="w-2 h-2 rounded-full bg-[#1A1D26]" />
              </div>
            </div>

            {/* App Screen Content */}
            <div className="flex-1 w-full overflow-hidden flex flex-col relative">
              {children}
            </div>

            {/* Bottom Nav */}
            {renderBottomNav()}

            {/* Bottom Home Line */}
            <div className="h-3 flex items-center justify-center bg-[#10131B] shrink-0">
              <div className="w-28 h-1 rounded-full bg-white/20" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2. REAL MOBILE NATIVE MODE (Edge-to-Edge 100% Fullscreen)
  return (
    <div className="w-full h-full flex flex-col bg-[#0A0C10] text-white select-none overflow-hidden relative">
      {/* Native Safe-Area-Inset Top (For Phone Notch / Hole Punch) */}
      <div className="h-[env(safe-area-inset-top,0px)] bg-transparent shrink-0" />

      {/* Main App Content Viewport */}
      <main className="flex-1 w-full overflow-hidden flex flex-col relative">
        {children}
      </main>

      {/* Native Mobile Bottom Navigation Bar */}
      {renderBottomNav()}

      {/* Native Safe-Area-Inset Bottom (For Phone Navigation Gesture Bar) */}
      <div className="h-[env(safe-area-inset-bottom,0px)] bg-[#10131B] shrink-0" />
    </div>
  );
};
