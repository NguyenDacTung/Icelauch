import React, { useState, useEffect, useRef } from 'react';
import { Film, Gamepad2, Bookmark, Sliders, X, Sparkles, Landmark, Layers, Wrench, SlidersHorizontal } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import type { NavigationTab, UserProfile } from '../../types';

interface DevicePhoneFrameProps {
  children: React.ReactNode;
  currentTab: NavigationTab;
  onTabChange: (tab: NavigationTab) => void;
  onTabReTap?: (tab: NavigationTab) => void;
  onExitSimulation?: () => void;
  isSimulated?: boolean;
  miniPlayer?: React.ReactNode;
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
  miniPlayer,
}) => {
  const { theme } = useTheme();
  const isAqua = theme === 'aqua';
  const isTerra = theme === 'terra';
  const isIgnis = theme === 'ignis';
  const isAer = theme === 'aer';
  const isSolar = theme === 'solar';
  const navRef = useRef<HTMLElement | null>(null);
  const [dropletStyle, setDropletStyle] = useState<{ left: number; width: number; opacity: number }>({ left: 0, width: 0, opacity: 0 });

  // 5 Primary Mobile Navigation Tabs
  const mobileNavItems: { id: NavigationTab; label: string; icon: any; terraIcon: any }[] = [
    { id: 'media', label: 'Giải Trí', icon: Film, terraIcon: Film },
    { id: 'home', label: 'Game', icon: Gamepad2, terraIcon: Landmark },
    { id: 'library', label: 'Thư Viện', icon: Bookmark, terraIcon: Layers },
    { id: 'extras', label: 'Tiện Ích', icon: Sparkles, terraIcon: Wrench },
    { id: 'settings', label: 'Cài Đặt', icon: Sliders, terraIcon: SlidersHorizontal },
  ];

  useEffect(() => {
    if (!isAqua || !navRef.current) return;
    const activeBtn = navRef.current.querySelector(`[data-tab-id="${currentTab}"]`) as HTMLElement | null;
    if (activeBtn) {
      setDropletStyle({
        left: activeBtn.offsetLeft,
        width: activeBtn.offsetWidth,
        opacity: 1,
      });
    }
  }, [currentTab, isAqua]);

  const handleTabClick = (tabId: NavigationTab) => {
    if (currentTab === tabId) {
      onTabReTap?.(tabId);
    } else {
      onTabChange(tabId);
    }
  };

  const renderBottomNav = () => (
    <nav 
      ref={navRef}
      className={`relative h-15 w-full max-w-md mx-auto flex items-center justify-around px-2 py-1 transition-all duration-300 ${
        isAer
          ? 'rounded-xl bg-[#CAD6E2]/90 border-[1.5px] border-[#94A3B8] shadow-none backdrop-blur-md'
          : isIgnis
          ? 'rounded-xl bg-[#261712]/90 border-2 border-[#8C4320] shadow-[0_8px_24px_rgba(0,0,0,0.85)] backdrop-blur-xl'
          : isTerra
          ? 'rounded-xl bg-[#2B241D]/90 border-2 border-[#7C5332] shadow-[0_8px_24px_rgba(0,0,0,0.65)] backdrop-blur-xl'
          : isAqua
          ? 'rounded-full bg-sky-100/35 border border-sky-300/50 shadow-[0_12px_36px_rgba(2,132,199,0.25),inset_0_1px_1px_rgba(255,255,255,0.7)] backdrop-blur-2xl'
          : isSolar
          ? 'rounded-full bg-white/85 border border-amber-300/60 shadow-[0_8px_32px_rgba(180,83,9,0.18)] backdrop-blur-xl'
          : 'rounded-full glass-pill-elevated bg-[#0F141C]/80 border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] backdrop-blur-2xl'
      }`}
    >
      {/* Aqua Liquid Droplet Sliding Indicator */}
      {isAqua && dropletStyle.opacity > 0 && (
        <div
          className="aqua-droplet-bubble"
          style={{
            transform: `translate3d(${dropletStyle.left}px, -50%, 0)`,
            width: `${dropletStyle.width}px`,
            height: '46px',
          }}
        />
      )}

      {mobileNavItems.map((item) => {
        const isActive = currentTab === item.id;
        const Icon = isTerra ? item.terraIcon : item.icon;
        return (
          <button
            key={item.id}
            data-tab-id={item.id}
            type="button"
            onClick={() => handleTabClick(item.id)}
            className={`relative z-10 flex-1 flex flex-col items-center justify-center py-1.5 px-1 transition-all duration-200 active:scale-95 ${
              isAer
                ? isActive
                  ? 'text-[#0F172A] font-bold border-b-2 border-[#0284C7]'
                  : 'text-[#475569] hover:text-[#0F172A] font-medium'
                : isIgnis
                ? isActive
                  ? 'bg-gradient-to-r from-[#F97316]/25 via-[#DC2626]/20 to-[#F97316]/25 border border-[#FBBF24] text-[#FFFBEB] rounded-lg shadow-[inset_0_0_8px_#F97316,0_0_10px_rgba(249,115,22,0.5)] font-black scale-105'
                  : 'text-[#D6B4A6] hover:text-[#FFF7ED] font-medium rounded-lg'
                : isTerra
                ? isActive
                  ? 'bg-[#65A30D]/20 text-[#65A30D] font-bold rounded-lg'
                  : 'text-[#B5A898] hover:text-[#F3ECE1] font-medium rounded-lg'
                : isSolar
                ? isActive
                  ? 'bg-amber-500 text-slate-950 font-black rounded-full shadow-md shadow-amber-500/20'
                  : 'text-slate-700 hover:text-slate-950 font-medium rounded-full'
                : isActive
                ? isAqua
                  ? 'text-sky-950 font-black rounded-full'
                  : 'bg-ice-accent/15 text-ice-accent font-bold shadow-sm rounded-full'
                : isAqua
                ? 'text-slate-600 hover:text-sky-950 font-medium rounded-full'
                : 'text-ice-subtext hover:text-ice-text font-medium rounded-full'
            }`}
          >
            <Icon
              className={`w-5 h-5 transition-transform duration-200 ${
                isAer
                  ? isActive
                    ? 'text-[#0284C7]'
                    : 'text-[#475569]'
                  : isIgnis
                  ? isActive
                    ? 'scale-110 text-[#FBBF24] drop-shadow-[0_0_6px_#FBBF24]'
                    : 'text-[#D6B4A6]'
                  : isTerra
                  ? isActive
                    ? 'scale-105 text-[#65A30D] stroke-[2.2]'
                    : 'text-[#B5A898] stroke-[1.8]'
                  : isSolar
                  ? isActive
                    ? 'text-slate-950 stroke-[2.5]'
                    : 'text-slate-700'
                  : isActive 
                  ? isAqua 
                  ? 'scale-110 drop-shadow-[0_0_8px_rgba(2,132,199,0.5)] text-sky-600'
                  : 'scale-110 drop-shadow-[0_0_6px_rgba(245,158,11,0.5)]' 
                  : ''
              }`}
            />
            <span className={`text-[10px] mt-0.5 tracking-tight ${
              isAer
                ? isActive
                  ? 'text-[#0F172A] font-bold'
                  : 'text-[#475569]'
                : isIgnis
                ? isActive
                  ? 'text-[#FFFBEB] font-bold drop-shadow-[0_0_4px_#FBBF24]'
                  : 'text-[#D6B4A6]'
                : isTerra
                ? isActive
                  ? 'text-[#65A30D] font-bold'
                  : 'text-[#B5A898]'
                : isSolar
                ? isActive
                  ? 'text-slate-950 font-black'
                  : 'text-slate-700 font-medium'
                : isActive 
                ? isAqua 
                  ? 'text-sky-950 font-black' 
                  : 'text-ice-accent font-bold' 
                : ''
            }`}>
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );

  // 1. SIMULATOR MODE (Only when Admin is previewing phone on PC Electron)
  if (isSimulated) {
    return (
      <div className="flex-1 w-full h-full flex flex-col items-center justify-center p-3 select-none overflow-hidden relative bg-ice-bg">
        {/* Top exit simulation indicator */}
        <div className="mb-2 flex items-center gap-2">
          <span className="text-xs text-ice-subtext font-semibold">Đang giả lập màn hình Điện Thoại</span>
          {onExitSimulation && (
            <button
              type="button"
              onClick={onExitSimulation}
              className="px-2 py-0.5 rounded-md bg-ice-hover/60 hover:bg-ice-hover text-ice-text text-[11px] font-bold flex items-center gap-1 border border-ice-border"
            >
              <X className="w-3 h-3" />
              <span>Thoát</span>
            </button>
          )}
        </div>

        {/* Realistic Phone Frame */}
        <div className={`relative w-[390px] h-[820px] max-h-[92vh] rounded-[48px] p-2.5 flex flex-col ${
          isAer
            ? 'bg-[#CAD6E2] border-2 border-[#94A3B8] shadow-none'
            : 'bg-gradient-to-b from-ice-card via-ice-card/90 to-ice-bg shadow-[0_0_50px_rgba(0,0,0,0.45),0_20px_40px_rgba(0,0,0,0.3)] border border-ice-border/40'
        }`}>
          <div className={`relative w-full h-full rounded-[38px] overflow-hidden flex flex-col ${
            isAer
              ? 'bg-[#EEF2F6] border border-[#CBD5E1]'
              : 'bg-ice-bg border border-ice-border/60 shadow-inner'
          }`}>
            {/* Top Simulated Floating Notch */}
            <div className="absolute top-2 inset-x-0 flex items-center justify-center pointer-events-none z-30 select-none">
              <div className="w-24 h-4 rounded-full bg-black flex items-center justify-end px-2 border border-white/10 shadow-sm">
                <div className="w-2 h-2 rounded-full bg-[#1A1D26]" />
              </div>
            </div>

            {/* App Screen Content - Edge-to-Edge */}
            <div className="flex-1 w-full overflow-hidden flex flex-col relative text-ice-text">
              {children}
            </div>

            {/* Simulator Floating Island Overlay */}
            <div className="absolute bottom-0 inset-x-0 z-40 pointer-events-none flex flex-col items-center pb-2 px-3">
              {miniPlayer && (
                <div className="w-full pointer-events-auto max-w-md mx-auto mb-2">
                  {miniPlayer}
                </div>
              )}
              <div className="w-full pointer-events-auto max-w-md mx-auto">
                {renderBottomNav()}
              </div>
              {/* Bottom Home Line */}
              <div className="h-2 flex items-center justify-center bg-transparent shrink-0 mt-1">
                <div className="w-24 h-1 rounded-full bg-ice-subtext/30" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2. REAL MOBILE NATIVE MODE (Edge-to-Edge 100% Fullscreen, Pure Floating Island)
  // Display cutout supports env(safe-area-inset-top, 0px) seamlessly across mobile views
  return (
    <div className="w-full h-full flex flex-col bg-ice-bg text-ice-text select-none overflow-hidden relative">
      {/* Main App Content Viewport - 100% Edge-to-Edge behind Cutout and Navigation */}
      <main className="flex-1 w-full overflow-hidden flex flex-col relative">
        {children}
      </main>

      {/* Pure Floating Island Navigation Overlay Container (Content scrolls freely underneath) */}
      <div className="absolute bottom-0 inset-x-0 z-40 pointer-events-none flex flex-col items-center pb-[max(0.5rem,env(safe-area-inset-bottom,0px))] px-3.5">
        {miniPlayer && (
          <div className="w-full pointer-events-auto max-w-md mx-auto mb-2">
            {miniPlayer}
          </div>
        )}
        <div className="w-full pointer-events-auto max-w-md mx-auto">
          {renderBottomNav()}
        </div>
      </div>
    </div>
  );
};
