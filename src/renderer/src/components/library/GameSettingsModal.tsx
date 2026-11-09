import React, { useState } from 'react';
import { 
  X, 
  Settings, 
  FolderOpen, 
  ShieldCheck, 
  Trash2, 
  FileCode, 
  RotateCcw,
  Check
} from 'lucide-react';
import type { Game } from '../../types';

interface GameSettingsModalProps {
  game: Game;
  isOpen: boolean;
  onClose: () => void;
  onSaveSettings: (gameId: string, updates: Partial<Game>) => void;
  onSelectCustomExe: (gameId: string) => void;
  onAutoPickExe: (gameId: string) => void;
  onOpenFolder: (gameId: string) => void;
  onUninstall: (gameId: string) => void;
}

export const GameSettingsModal: React.FC<GameSettingsModalProps> = ({
  game,
  isOpen,
  onClose,
  onSaveSettings,
  onSelectCustomExe,
  onAutoPickExe,
  onOpenFolder,
  onUninstall,
}) => {
  const [runAsAdmin, setRunAsAdmin] = useState(game.runAsAdmin);
  const [deleteArchive, setDeleteArchive] = useState(game.deleteArchiveAfterInstall);
  const [selectedExe, setSelectedExe] = useState(game.mainExe || '');

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveSettings(game.id, {
      runAsAdmin,
      deleteArchiveAfterInstall: deleteArchive,
      mainExe: selectedExe,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-ice-card border border-ice-border rounded-xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-ice-border flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Settings className="w-4 h-4 text-ice-accent" />
            <h3 className="text-sm font-bold text-white tracking-wide">
              Cài đặt game: {game.name}
            </h3>
          </div>
          <button onClick={onClose} className="text-ice-subtext hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-5 text-xs text-ice-text max-h-[70vh] overflow-y-auto">
          {/* File chạy .exe */}
          <div className="space-y-2">
            <label className="font-semibold text-white flex items-center justify-between">
              <span>File chạy chính (.exe)</span>
              <button
                type="button"
                onClick={() => onAutoPickExe(game.id)}
                className="text-[11px] text-ice-accent hover:underline flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Tự chọn lại</span>
              </button>
            </label>

            {game.exeCandidates && game.exeCandidates.length > 0 ? (
              <select
                value={selectedExe}
                onChange={(e) => setSelectedExe(e.target.value)}
                className="w-full h-9 rounded bg-ice-bg border border-ice-border px-3 text-xs text-white focus:outline-none focus:border-ice-accent"
              >
                {game.exeCandidates.map((exe) => (
                  <option key={exe} value={exe}>
                    {exe}
                  </option>
                ))}
              </select>
            ) : (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={selectedExe}
                  onChange={(e) => setSelectedExe(e.target.value)}
                  placeholder="Ví dụ: Game.exe hoặc Binaries/Win64/Game.exe"
                  className="flex-1 h-9 rounded bg-ice-bg border border-ice-border px-3 text-xs text-white focus:outline-none focus:border-ice-accent"
                />
                <button
                  type="button"
                  onClick={() => onSelectCustomExe(game.id)}
                  className="px-3 h-9 rounded bg-ice-hover hover:bg-ice-border text-white text-xs font-medium border border-ice-border flex items-center gap-1"
                >
                  <FileCode className="w-3.5 h-3.5 text-ice-accent" />
                  <span>Duyệt...</span>
                </button>
              </div>
            )}
            <p className="text-[11px] text-ice-subtext">
              Đường dẫn tương đối từ thư mục gốc của game.
            </p>
          </div>

          {/* Options */}
          <div className="space-y-3 pt-2 border-t border-ice-border">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={runAsAdmin}
                onChange={(e) => setRunAsAdmin(e.target.checked)}
                className="w-4 h-4 rounded border-ice-border bg-ice-bg text-ice-accent focus:ring-0 focus:ring-offset-0"
              />
              <div>
                <span className="font-semibold text-white flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                  Chạy bằng quyền Quản trị (Run as Administrator)
                </span>
                <p className="text-[11px] text-ice-subtext">
                  Bật nếu game yêu cầu quyền ghi thư mục hệ thống hoặc file save.
                </p>
              </div>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={deleteArchive}
                onChange={(e) => setDeleteArchive(e.target.checked)}
                className="w-4 h-4 rounded border-ice-border bg-ice-bg text-ice-accent focus:ring-0 focus:ring-offset-0"
              />
              <div>
                <span className="font-semibold text-white">
                  Xoá file nén sau khi giải nén xong
                </span>
                <p className="text-[11px] text-ice-subtext">
                  Tiết kiệm dung lượng ổ cứng (chỉ xoá khi cài đặt hoàn tất không lỗi).
                </p>
              </div>
            </label>
          </div>

          {/* Folder & Uninstall */}
          <div className="pt-3 border-t border-ice-border space-y-2">
            <button
              type="button"
              onClick={() => onOpenFolder(game.id)}
              className="w-full h-9 rounded bg-ice-bg hover:bg-ice-hover border border-ice-border text-ice-text hover:text-white text-xs font-medium flex items-center justify-center gap-2 transition-colors"
            >
              <FolderOpen className="w-4 h-4 text-amber-400" />
              <span>Mở thư mục cài đặt game</span>
            </button>

            {game.status === 'ready' && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onUninstall(game.id);
                }}
                className="w-full h-9 rounded bg-ice-error/10 hover:bg-ice-error/20 border border-ice-error/30 text-ice-error text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>Gỡ cài đặt game này</span>
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-ice-bg/80 border-t border-ice-border flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded text-xs font-medium text-ice-subtext hover:text-white transition-colors"
          >
            Đóng
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 rounded bg-ice-accent hover:bg-ice-accentHover text-white text-xs font-bold tracking-wide flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Check className="w-4 h-4" />
            <span>Lưu thay đổi</span>
          </button>
        </div>
      </div>
    </div>
  );
};

