import React from 'react';
import { Monitor, X, AlertTriangle, ArrowRight, ShieldAlert } from 'lucide-react';
import type { DeviceType } from '../../utils/deviceDetector';

interface DeviceIncompatibleModalProps {
  isOpen: boolean;
  gameName: string;
  deviceType: DeviceType;
  onClose: () => void;
}

export const DeviceIncompatibleModal: React.FC<DeviceIncompatibleModalProps> = ({
  isOpen,
  gameName,
  deviceType,
  onClose,
}) => {
  if (!isOpen) return null;

  const deviceLabel = deviceType === 'android_tv' ? 'Android TV' : 'Điện thoại Android';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in select-none">
      <div className="bg-[#12141A] border border-ice-border rounded-2xl w-full max-w-md overflow-hidden shadow-2xl p-6 text-center space-y-5 animate-scale-up">
        {/* Device Icon Graphic */}
        <div className="relative mx-auto w-16 h-16 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-500/10">
          <Monitor className="w-8 h-8" />
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-rose-600 text-white flex items-center justify-center text-xs font-bold border-2 border-[#12141A]">
            ✕
          </div>
        </div>

        <div className="space-y-2">
          <span className="px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-rose-500/20 text-rose-300 border border-rose-500/30 inline-block">
            Không Tương Thích {deviceLabel}
          </span>
          <h3 className="text-lg font-bold text-white tracking-wide">
            Game Dành Riêng Cho Windows PC
          </h3>
          <p className="text-xs text-ice-subtext leading-relaxed px-2">
            Tựa game <strong className="text-white">"{gameName}"</strong> là trò chơi máy tính Windows (định dạng <em>.exe / 7-Zip</em>). Thiết bị <strong>{deviceLabel}</strong> hiện tại không hỗ trợ cài đặt và khởi chạy trực tiếp.
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-white/5 border border-white/5 text-xs text-ice-subtext text-left space-y-1">
          <span className="text-ice-accent font-semibold flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5" />
            Hướng dẫn trải nghiệm:
          </span>
          <p className="text-[11px] leading-relaxed">
            Vui lòng cài đặt và mở <strong>Icelauch trên máy tính Windows</strong> của bạn để tải về và chơi game với hiệu năng tối ưu nhất.
          </p>
        </div>

        <button
          onClick={onClose}
          className="w-full h-11 rounded-xl bg-gradient-to-r from-ice-accent to-blue-600 hover:from-ice-accentHover hover:to-blue-500 text-white text-xs font-bold uppercase tracking-wider shadow-lg shadow-blue-950/40 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
        >
          Đã Hiểu
        </button>
      </div>
    </div>
  );
};
