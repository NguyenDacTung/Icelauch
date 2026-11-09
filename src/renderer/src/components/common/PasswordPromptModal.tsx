import React, { useState } from 'react';
import { Key, Eye, EyeOff, AlertCircle, X, Check } from 'lucide-react';

interface PasswordPromptModalProps {
  isOpen: boolean;
  gameId: string;
  gameName: string;
  isRetry?: boolean;
  isAdmin: boolean;
  onClose: () => void;
  onSubmit: (password: string, saveForGame: boolean) => void;
}

export const PasswordPromptModal: React.FC<PasswordPromptModalProps> = ({
  isOpen,
  gameName,
  isRetry,
  isAdmin,
  onClose,
  onSubmit,
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [saveForGame, setSaveForGame] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;
    onSubmit(password, saveForGame && isAdmin);
    setPassword('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 select-none">
      <div className="bg-ice-card border border-ice-border rounded-xl w-full max-w-sm overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-ice-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-white tracking-wide">
              Cần mật khẩu giải nén
            </h3>
          </div>
          <button onClick={onClose} className="text-ice-subtext hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs text-ice-text">
          {isRetry && (
            <div className="p-2.5 rounded bg-ice-error/15 border border-ice-error/30 text-xs text-ice-error flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>Mật khẩu không đúng. Vui lòng nhập lại.</span>
            </div>
          )}

          <div>
            <p className="text-ice-subtext">Game yêu cầu mật khẩu để giải nén:</p>
            <p className="font-semibold text-white text-sm mt-0.5">{gameName}</p>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-white">Mật khẩu file nén</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                autoFocus
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu..."
                className="w-full h-10 rounded bg-ice-bg border border-ice-border pl-3 pr-9 text-white focus:outline-none focus:border-amber-400"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ice-subtext hover:text-white"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {isAdmin && (
            <label className="flex items-center gap-2 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={saveForGame}
                onChange={(e) => setSaveForGame(e.target.checked)}
                className="w-4 h-4 rounded border-ice-border bg-ice-bg text-amber-500 focus:ring-0"
              />
              <span className="text-[11px] text-white">
                Lưu mật khẩu cho game này (Chế độ Admin)
              </span>
            </label>
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-ice-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded text-xs font-medium text-ice-subtext hover:text-white transition-colors"
            >
              Huỷ
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded bg-ice-accent hover:bg-ice-accentHover text-white text-xs font-bold tracking-wide flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Check className="w-4 h-4" />
              <span>Xác nhận</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

