import React, { useState } from 'react';
import { 
  X, 
  ExternalLink, 
  AppWindow, 
  Gamepad2, 
  BookOpen, 
  FolderSearch, 
  ShieldCheck, 
  MessageSquare,
  Sparkles
} from 'lucide-react';
import type { AppActionButton, ActionButtonIcon, ActionButtonType } from '../../types';
import { sfx } from '../../utils/sfx';

interface ActionButtonModalProps {
  button?: AppActionButton | null;
  onClose: () => void;
  onSave: (btn: AppActionButton) => void;
}

export const ActionButtonModal: React.FC<ActionButtonModalProps> = ({
  button,
  onClose,
  onSave,
}) => {
  const [label, setLabel] = useState(button?.label || '');
  const [description, setDescription] = useState(button?.description || '');
  const [icon, setIcon] = useState<ActionButtonIcon>(button?.icon || 'steam');
  const [type, setType] = useState<ActionButtonType>(button?.type || 'app');
  const [target, setTarget] = useState(button?.target || '');
  const [isDefault, setIsDefault] = useState(button?.isDefault ?? false);
  const [runAsAdmin, setRunAsAdmin] = useState(button?.runAsAdmin ?? false);
  const [error, setError] = useState('');

  const handleBrowseFile = async () => {
    try {
      sfx.playClick();
      const res = await window.api.browseFile({
        title: 'Chọn file thực thi (.exe) hoặc ứng dụng',
        filters: [
          { name: 'Executables & Shortcuts', extensions: ['exe', 'lnk', 'bat', 'cmd'] },
          { name: 'All Files', extensions: ['*'] }
        ]
      });
      if (res) {
        setTarget(res);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim()) {
      setError('Vui lòng nhập tên nút bấm');
      return;
    }
    if (!target.trim()) {
      setError('Vui lòng nhập đường dẫn file .exe hoặc link');
      return;
    }

    const savedBtn: AppActionButton = {
      id: button?.id || `act-btn-${Date.now()}`,
      label: label.trim(),
      description: description.trim() || undefined,
      icon,
      type,
      target: target.trim(),
      isDefault,
      runAsAdmin: type === 'app' ? runAsAdmin : false,
    };

    sfx.playSuccess();
    onSave(savedBtn);
  };

  const iconOptions: { id: ActionButtonIcon; name: string }[] = [
    { id: 'steam', name: 'Steam' },
    { id: 'discord', name: 'Discord' },
    { id: 'app', name: 'Ứng dụng' },
    { id: 'link', name: 'Trang Web' },
    { id: 'gamepad', name: 'Tay cầm / Game' },
    { id: 'book', name: 'Hướng dẫn / Doc' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm select-none animate-fadeIn">
      <div className="w-full max-w-lg bg-[#12151D] border border-ice-border rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-ice-border/60 bg-[#171A21]">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold text-white">
              {button ? 'Chỉnh Sửa Nút Liên Kết & Mở App' : 'Thêm Nút Liên Kết Mới'}
            </h2>
          </div>
          <button
            onClick={() => {
              sfx.playClick();
              onClose();
            }}
            className="p-1.5 rounded-lg text-ice-muted hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[80vh]">
          {error && (
            <div className="p-3 bg-red-500/20 border border-red-500/40 rounded-xl text-red-300 text-xs font-semibold">
              {error}
            </div>
          )}

          {/* Label */}
          <div>
            <label className="block text-xs font-semibold text-ice-subtext mb-1">
              Tên Nút Bấm <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="VD: Mở Steam, Kênh Thoại Discord, Xem Mod..."
              className="w-full bg-[#0A0C10] border border-ice-border focus:border-amber-400 rounded-xl px-3.5 py-2 text-xs text-white outline-none transition-colors"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-ice-subtext mb-1">
              Ghi Chú / Mô Tả Nhanh
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="VD: Yêu cầu mở trước khi khởi động game, vào phòng #3..."
              className="w-full bg-[#0A0C10] border border-ice-border focus:border-amber-400 rounded-xl px-3.5 py-2 text-xs text-white outline-none transition-colors"
            />
          </div>

          {/* Type Selector */}
          <div>
            <label className="block text-xs font-semibold text-ice-subtext mb-1.5">
              Loại Nút Hành Động
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  sfx.playClick();
                  setType('app');
                }}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-bold transition-all ${
                  type === 'app'
                    ? 'bg-blue-600/25 border-blue-500 text-blue-300 shadow-sm'
                    : 'bg-[#0A0C10] border-ice-border text-ice-subtext hover:text-white'
                }`}
              >
                <AppWindow className="w-4 h-4 text-blue-400" />
                <span>Khởi Chạy Ứng Dụng (.exe / protocol)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  sfx.playClick();
                  setType('link');
                }}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-bold transition-all ${
                  type === 'link'
                    ? 'bg-amber-500/25 border-amber-500 text-amber-300 shadow-sm'
                    : 'bg-[#0A0C10] border-ice-border text-ice-subtext hover:text-white'
                }`}
              >
                <ExternalLink className="w-4 h-4 text-amber-400" />
                <span>Mở Link Trình Duyệt Web</span>
              </button>
            </div>
          </div>

          {/* Icon Selector */}
          <div>
            <label className="block text-xs font-semibold text-ice-subtext mb-1.5">
              Icon Đại Diện
            </label>
            <div className="grid grid-cols-3 gap-2">
              {iconOptions.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    sfx.playClick();
                    setIcon(opt.id);
                  }}
                  className={`flex items-center gap-2 p-2 rounded-xl border text-xs font-medium transition-all ${
                    icon === opt.id
                      ? 'bg-amber-500/20 border-amber-500/50 text-white font-bold'
                      : 'bg-[#0A0C10] border-ice-border/60 text-ice-muted hover:text-white'
                  }`}
                >
                  {opt.id === 'steam' && <span className="text-blue-400 font-bold">🎮 Steam</span>}
                  {opt.id === 'discord' && <span className="text-indigo-400 font-bold">💬 Discord</span>}
                  {opt.id === 'app' && <span className="text-cyan-400 font-bold">📁 App .exe</span>}
                  {opt.id === 'link' && <span className="text-amber-400 font-bold">🌐 Web Link</span>}
                  {opt.id === 'gamepad' && <span className="text-emerald-400 font-bold">🕹️ Gamepad</span>}
                  {opt.id === 'book' && <span className="text-purple-400 font-bold">📖 Hướng Dẫn</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Target */}
          <div>
            <label className="block text-xs font-semibold text-ice-subtext mb-1">
              {type === 'app' ? 'Đường Dẫn File .exe hoặc Lệnh Protocol' : 'Địa Chỉ Liên Kết (URL)'}{' '}
              <span className="text-red-400">*</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                placeholder={
                  type === 'app'
                    ? 'VD: steam://open/main hoặc C:\\Program Files\\...\\app.exe'
                    : 'VD: https://discord.gg/... hoặc https://linkneverdie.com'
                }
                className="flex-1 bg-[#0A0C10] border border-ice-border focus:border-amber-400 rounded-xl px-3.5 py-2 text-xs text-white outline-none font-mono"
              />
              {type === 'app' && (
                <button
                  type="button"
                  onClick={handleBrowseFile}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-ice-card hover:bg-ice-hover text-white text-xs font-semibold border border-ice-border transition-colors shrink-0"
                >
                  <FolderSearch className="w-3.5 h-3.5 text-amber-400" />
                  <span>Chọn file</span>
                </button>
              )}
            </div>
            <p className="text-[11px] text-ice-muted mt-1">
              {type === 'app'
                ? 'Hỗ trợ giao thức steam://, discord://, spotify:// hoặc đường dẫn file .exe trên máy'
                : 'Đường dẫn liên kết web, tự động mở bằng trình duyệt mặc định'}
            </p>
          </div>

          {/* Options: Default for new games & Admin rights */}
          <div className="pt-2 space-y-2 border-t border-ice-border/40">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-white select-none">
              <input
                type="checkbox"
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
                className="rounded accent-amber-500 w-4 h-4 cursor-pointer"
              />
              <span>Đặt làm mặc định (Tự động gắn vào mọi game mới được thêm)</span>
            </label>

            {type === 'app' && (
              <label className="flex items-center gap-2 cursor-pointer text-xs text-white select-none">
                <input
                  type="checkbox"
                  checked={runAsAdmin}
                  onChange={(e) => setRunAsAdmin(e.target.checked)}
                  className="rounded accent-amber-500 w-4 h-4 cursor-pointer"
                />
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                <span>Khởi chạy dưới quyền Quản trị viên (Run as Administrator)</span>
              </label>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-ice-border/60">
            <button
              type="button"
              onClick={() => {
                sfx.playClick();
                onClose();
              }}
              className="px-4 py-2 rounded-xl bg-ice-card hover:bg-ice-hover text-ice-subtext hover:text-white text-xs font-semibold border border-ice-border transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition-colors shadow-md"
            >
              {button ? 'Cập Nhật Nút' : 'Thêm Nút'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

