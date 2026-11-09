import React from 'react';
import { Smartphone, Tv, Check, Sparkles } from 'lucide-react';
import type { DeviceType } from '../../utils/deviceDetector';
import { sfx } from '../../utils/sfx';

interface DeviceSelectionModalProps {
  isOpen: boolean;
  onSelectDevice: (device: DeviceType) => void;
  onClose?: () => void;
}

export const DeviceSelectionModal: React.FC<DeviceSelectionModalProps> = ({
  isOpen,
  onSelectDevice,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in select-none">
      <div className="w-full max-w-2xl bg-[#0E121B] border-2 border-amber-500/50 rounded-3xl p-6 sm:p-8 shadow-[0_20px_70px_rgba(0,0,0,0.9)] space-y-6 text-white text-center">
        {/* Header */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-mono font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Chào mừng đến với Icelauch</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black tracking-wide uppercase">
            Chọn Chế Độ Thiết Bị Của Bạn
          </h2>
          <p className="text-xs sm:text-sm text-ice-subtext max-w-lg mx-auto">
            Để mang lại trải nghiệm tối ưu nhất, vui lòng cho chúng tôi biết bạn đang sử dụng Icelauch trên thiết bị nào:
          </p>
        </div>

        {/* Device Selection Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {/* Card 1: Android Phone */}
          <button
            type="button"
            onClick={() => {
              sfx.playClick();
              onSelectDevice('android_mobile');
            }}
            className="p-6 rounded-2xl bg-[#141824] hover:bg-[#1A2030] border-2 border-white/10 hover:border-amber-400 text-left transition-all group flex flex-col justify-between h-56 shadow-lg active:scale-98"
          >
            <div className="space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
                <Smartphone className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white group-hover:text-amber-300 transition-colors uppercase">
                  Điện Thoại Di Động
                </h3>
                <p className="text-xs text-ice-subtext mt-1 leading-relaxed">
                  Giao diện cảm ứng chạm 1 tay, phím bấm to, cuộn mượt mà trên màn hình điện thoại hoặc máy tính bảng.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-white/10 text-xs">
              <span className="font-mono text-[10px] text-cyan-300 bg-cyan-500/10 px-2 py-0.5 rounded-md font-bold">
                CẢM ỨNG (TOUCH)
              </span>
              <span className="text-amber-400 font-bold group-hover:underline">Chọn chế độ này →</span>
            </div>
          </button>

          {/* Card 2: Android TV */}
          <button
            type="button"
            onClick={() => {
              sfx.playClick();
              onSelectDevice('android_tv');
            }}
            className="p-6 rounded-2xl bg-[#141824] hover:bg-[#1A2030] border-2 border-white/10 hover:border-amber-400 text-left transition-all group flex flex-col justify-between h-56 shadow-lg active:scale-98"
          >
            <div className="space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
                <Tv className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white group-hover:text-amber-300 transition-colors uppercase">
                  Android TV / Smart TV
                </h3>
                <p className="text-xs text-ice-subtext mt-1 leading-relaxed">
                  Giao diện 10-foot phòng khách, hỗ trợ 100% phím Lên / Xuống / Trái / Phải / OK trên điều khiển Remote TV.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-white/10 text-xs">
              <span className="font-mono text-[10px] text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-md font-bold">
                ĐIỀU KHIỂN (REMOTE D-PAD)
              </span>
              <span className="text-amber-400 font-bold group-hover:underline">Chọn chế độ này →</span>
            </div>
          </button>
        </div>

        {/* Footer Note */}
        <p className="text-[11px] text-ice-muted">
          💡 Bạn luôn có thể chuyển đổi lại giữa hai chế độ bất cứ lúc nào trong mục <strong>Cài Đặt</strong>.
        </p>
      </div>
    </div>
  );
};

