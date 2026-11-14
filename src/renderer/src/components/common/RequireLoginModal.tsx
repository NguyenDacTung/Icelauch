import React from 'react';
import { X, Lock, LogIn, Sparkles } from 'lucide-react';

interface RequireLoginModalProps {
  isOpen: boolean;
  actionText?: string;
  onClose: () => void;
  onGoToLogin: () => void;
}

export const RequireLoginModal: React.FC<RequireLoginModalProps> = ({
  isOpen,
  actionText = 'lưu trữ vào Thư Viện cá nhân hoặc tải game',
  onClose,
  onGoToLogin,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-sm bg-ice-surface/95 border border-ice-border rounded-2xl p-6 shadow-2xl flex flex-col items-center text-center space-y-4 animate-scale-up">
        {/* Icon */}
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500/20 to-blue-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner">
          <Lock className="w-7 h-7" />
        </div>

        {/* Text */}
        <div className="space-y-1.5">
          <h3 className="text-base font-black text-white">Yêu Cầu Đăng Nhập</h3>
          <p className="text-xs text-ice-subtext leading-relaxed">
            Để <strong className="text-white">{actionText}</strong>, bạn cần đăng nhập tài khoản để đồng bộ tiến độ và dữ liệu cá nhân.
          </p>
        </div>

        {/* Feature bullets */}
        <div className="w-full p-3 rounded-xl bg-black/40 border border-white/5 text-[11px] text-ice-muted text-left space-y-1">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-ice-accent shrink-0" />
            <span>Lưu game & phim yêu thích riêng biệt theo từng người</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>Tự động đếm giờ chơi & lưu tiến độ xem video</span>
          </div>
        </div>

        {/* Actions */}
        <div className="w-full flex gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition-all"
          >
            Để Sau
          </button>
          <button
            type="button"
            onClick={() => {
              onClose();
              onGoToLogin();
            }}
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-ice-accent to-blue-600 hover:from-blue-500 hover:to-blue-600 text-xs font-black text-white shadow-lg transition-all flex items-center justify-center gap-1.5"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Đăng Nhập Ngay</span>
          </button>
        </div>
      </div>
    </div>
  );
};

