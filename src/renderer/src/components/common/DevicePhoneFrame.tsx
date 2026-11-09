import React from 'react';
import { 
  Film, 
  Music, 
  Gamepad2, 
  Sliders, 
  Wifi, 
  BatteryMedium, 
  Signal
} from 'lucide-react';
import type { NavigationTab } from '../../types';

interface DevicePhoneFrameProps {
  children: React.ReactNode;
  currentTab: NavigationTab;
  onTabChange: (tab: NavigationTab) => void;
  onExitSimulation?: () => void;
}

export const DevicePhoneFrame: React.FC<DevicePhoneFrameProps> = ({
  children,
  currentTab,
  onTabChange,
  onExitSimulation,
}) => {
  // Mobile navigation tabs order: Media first, then Music, then Settings, then Games
  const mobileNavItems: { id: NavigationTab; label: string; icon: any }[] = [
    { id: 'media', label: 'Giải Trí', icon: Film },
    { id: 'home', label: 'Trang Chủ', icon: Gamepad2 },
    { id: 'library', label: 'Thư Viện', icon: Gamepad2 },
    { id: 'settings', label: 'Cài Đặt', icon: Sliders },
  ];

  return (
    <div className="flex-1 w-full h-full flex flex-col items-center justify-center p-3 select-none overflow-hidden relative">
      {/* Phone Hardware Chassis (Realistic 390px x 820px) */}
      <div className="relative w-[390px] h-[820px] max-h-[96vh] rounded-[48px] p-2.5 bg-gradient-to-b from-[#2E3342] via-[#1A1D26] to-[#12141A] shadow-[0_0_50px_rgba(0,0,0,0.8),0_20px_40px_rgba(0,0,0,0.6)] border border-white/10 flex flex-col">
        {/* Outer Metal Bezel Highlight */}
        <div className="relative w-full h-full rounded-[38px] overflow-hidden bg-[#0F1115] flex flex-col border border-black/80 shadow-inner">
          {/* Top Status Bar (Time, Dynamic Island, Wifi, Battery) */}
          <div className="h-9 px-6 flex items-center justify-between text-[11px] font-bold text-white/90 bg-transparent shrink-0 z-30 select-none">
            <span>09:41</span>
            {/* Dynamic Island / Camera Notch */}
            <div className="w-24 h-5 rounded-full bg-black flex items-center justify-end px-2 border border-white/10">
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

          {/* Bottom Mobile Navigation Bar */}
          <div className="h-14 bg-[#14171F]/95 backdrop-blur-md border-t border-ice-border/60 flex items-center justify-around px-2 shrink-0 z-30">
            {mobileNavItems.map((item) => {
              const isActive = currentTab === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
                    isActive ? 'text-ice-accent scale-105' : 'text-ice-subtext hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-[10px] font-semibold">{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Phone Home Indicator Line */}
          <div className="h-3 flex items-center justify-center bg-[#14171F] shrink-0">
            <div className="w-32 h-1 rounded-full bg-white/30" />
          </div>
        </div>
      </div>
    </div>
  );
};
