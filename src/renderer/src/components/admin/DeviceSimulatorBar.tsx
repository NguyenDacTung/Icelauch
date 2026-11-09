import React from 'react';
import { Monitor, Smartphone, Tv, Sparkles, X } from 'lucide-react';
import type { DeviceType } from '../../utils/deviceDetector';

interface DeviceSimulatorBarProps {
  currentDevice: DeviceType;
  onChangeDevice: (device: DeviceType) => void;
  isAdmin: boolean;
}

export const DeviceSimulatorBar: React.FC<DeviceSimulatorBarProps> = ({
  currentDevice,
  onChangeDevice,
  isAdmin,
}) => {
  if (!isAdmin) return null;

  return (
    <div className="bg-[#161A23] border-b border-amber-500/30 px-4 py-1.5 flex items-center justify-between text-xs select-none z-40">
      <div className="flex items-center gap-2 text-amber-300 font-semibold text-[11px]">
        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
        <span className="hidden sm:inline">Giả Lập Thiết Bị Admin:</span>
      </div>

      <div className="flex items-center gap-1.5 bg-black/40 p-0.5 rounded-xl border border-white/10">
        <button
          type="button"
          onClick={() => onChangeDevice('windows_pc')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
            currentDevice === 'windows_pc'
              ? 'bg-ice-accent text-white shadow-sm'
              : 'text-ice-subtext hover:text-white'
          }`}
          title="Giao diện máy tính Windows PC mặc định"
        >
          <Monitor className="w-3.5 h-3.5" />
          <span>Windows PC</span>
        </button>

        <button
          type="button"
          onClick={() => onChangeDevice('android_mobile')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
            currentDevice === 'android_mobile'
              ? 'bg-amber-500 text-black shadow-sm'
              : 'text-ice-subtext hover:text-white'
          }`}
          title="Giả lập khung điện thoại Android (Tỉ lệ 9:19.5, Full-Art banner, Media lên đầu)"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>Android Phone</span>
        </button>

        <button
          type="button"
          onClick={() => onChangeDevice('android_tv')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
            currentDevice === 'android_tv'
              ? 'bg-purple-600 text-white shadow-sm'
              : 'text-ice-subtext hover:text-white'
          }`}
          title="Giả lập Android TV (Khung rạp chiếu 16:9, tối ưu D-Pad Remote)"
        >
          <Tv className="w-3.5 h-3.5" />
          <span>Android TV</span>
        </button>
      </div>

      {currentDevice !== 'windows_pc' && (
        <button
          type="button"
          onClick={() => onChangeDevice('windows_pc')}
          className="text-[11px] text-amber-300 hover:text-white flex items-center gap-1 underline font-semibold transition-colors"
        >
          <span>Thoát giả lập</span>
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  );
};

