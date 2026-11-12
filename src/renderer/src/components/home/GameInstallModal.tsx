import React, { useState, useEffect } from 'react';
import {
  X,
  HardDrive,
  FolderOpen,
  Check,
  AlertCircle,
  Download,
  Settings2
} from 'lucide-react';
import type { Game } from '../../types';

interface DriveSpace {
  drive: string;
  freeGB: number;
  totalGB: number;
}

interface GameInstallModalProps {
  isOpen: boolean;
  game: Game;
  currentInstallPath?: string;
  defaultGamesPath?: string;
  onClose: () => void;
  onSaveInstallPath: (targetFolder: string, setAsDefault: boolean, startDownloadImmediately: boolean) => Promise<void>;
}

export const GameInstallModal: React.FC<GameInstallModalProps> = ({
  isOpen,
  game,
  currentInstallPath,
  defaultGamesPath = 'C:\\Icelauch\\Games',
  onClose,
  onSaveInstallPath,
}) => {
  const [selectedFolder, setSelectedFolder] = useState<string>('');
  const [setAsDefault, setSetAsDefault] = useState<boolean>(false);
  const [drives, setDrives] = useState<DriveSpace[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const initialPath = currentInstallPath || defaultGamesPath;
      setSelectedFolder(initialPath);
      setSetAsDefault(false);

      // Fetch Drives Space from Electron
      if (window.api?.getDrivesSpace) {
        window.api.getDrivesSpace().then((res: any) => {
          if (res && res.length > 0) setDrives(res);
        }).catch((e: any) => console.warn('Could not fetch drive space:', e));
      } else {
        // Fallback demo drives for testing/mobile
        setDrives([
          { drive: 'C:\\', freeGB: 45, totalGB: 256 },
          { drive: 'D:\\', freeGB: 320, totalGB: 1000 },
        ]);
      }
    }
  }, [isOpen, currentInstallPath, defaultGamesPath]);

  if (!isOpen) return null;

  const handleBrowseFolder = async () => {
    if (window.api?.browseFolder) {
      const folder = await window.api.browseFolder({
        title: 'Chọn thư mục cài đặt Game',
        defaultPath: selectedFolder,
      });
      if (folder) {
        setSelectedFolder(folder);
      }
    }
  };

  const handleSelectDrive = (driveLetter: string) => {
    const cleanDrive = driveLetter.endsWith('\\') ? driveLetter : `${driveLetter}\\`;
    setSelectedFolder(`${cleanDrive}Icelauch\\Games`);
  };

  const handleSubmit = async (startDownload: boolean) => {
    if (!selectedFolder.trim()) return;
    setLoading(true);
    try {
      await onSaveInstallPath(selectedFolder.trim(), setAsDefault, startDownload);
      onClose();
    } catch (e) {
      console.error('Error saving game install path:', e);
    } finally {
      setLoading(false);
    }
  };

  const expectedSizeGB = game.expectedSize ? (game.expectedSize / (1024 * 1024 * 1024)).toFixed(1) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg bg-ice-surface/95 border border-ice-border rounded-2xl flex flex-col shadow-2xl overflow-hidden animate-scale-up">
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-black/30">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-ice-accent/20 text-ice-accent border border-ice-accent/30 flex items-center justify-center">
              <Settings2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-black text-white">Cài Đặt Vị Trí Lưu Game</h2>
              <p className="text-[11px] text-ice-muted truncate max-w-[280px]">
                {game.name} {expectedSizeGB ? `(~${expectedSizeGB} GB)` : ''}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-ice-muted hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Drive Space Quick Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-ice-subtext uppercase tracking-wider flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5 text-amber-400" />
              <span>Dung lượng ổ đĩa khả dụng:</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {drives.map((d) => {
                const isSelected = selectedFolder.toUpperCase().startsWith(d.drive.toUpperCase());
                return (
                  <button
                    key={d.drive}
                    type="button"
                    onClick={() => handleSelectDrive(d.drive)}
                    className={`p-2.5 rounded-xl border text-left transition-all flex flex-col gap-1 ${
                      isSelected
                        ? 'bg-ice-accent/15 border-ice-accent text-white shadow-md'
                        : 'bg-black/30 border-ice-border text-ice-subtext hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-white">Ổ đĩa {d.drive}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-ice-accent" />}
                    </div>
                    <span className="text-[11px] text-ice-muted">
                      Trống: <strong className="text-emerald-400">{d.freeGB} GB</strong> / {d.totalGB} GB
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Target Folder Path Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-ice-subtext uppercase tracking-wider">
              Đường dẫn thư mục lưu game:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={selectedFolder}
                onChange={(e) => setSelectedFolder(e.target.value)}
                placeholder="Ví dụ: D:\Games"
                className="flex-1 h-9 px-3 rounded-xl bg-black/40 border border-ice-border text-xs text-white font-mono placeholder-ice-muted focus:outline-none focus:border-ice-accent transition-colors"
              />
              <button
                type="button"
                onClick={handleBrowseFolder}
                className="px-3 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white flex items-center gap-1.5 transition-all shadow"
                title="Duyệt thư mục trên máy tính"
              >
                <FolderOpen className="w-4 h-4 text-amber-400" />
                <span>Duyệt...</span>
              </button>
            </div>
            <p className="text-[10px] text-ice-muted">
              📁 Game sẽ được giải nén vào thư mục con: <span className="font-mono text-white/80">{selectedFolder}\{game.name}</span>
            </p>
          </div>

          {/* Set as Default Checkbox */}
          <div className="pt-2 border-t border-white/5">
            <label className="flex items-center gap-2.5 cursor-pointer group">
              <input
                type="checkbox"
                checked={setAsDefault}
                onChange={(e) => setSetAsDefault(e.target.checked)}
                className="w-4 h-4 rounded border-ice-border bg-black/40 text-ice-accent focus:ring-0 cursor-pointer"
              />
              <span className="text-xs text-ice-subtext group-hover:text-white transition-colors">
                Đặt làm vị trí cài đặt mặc định cho các game tiếp theo
              </span>
            </label>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-white/10 bg-black/30 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition-all"
          >
            Hủy Bỏ
          </button>
          <button
            type="button"
            disabled={loading || !selectedFolder.trim()}
            onClick={() => handleSubmit(false)}
            className="px-4 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-xs font-bold text-white transition-all"
          >
            Lưu Vị Trí
          </button>
          <button
            type="button"
            disabled={loading || !selectedFolder.trim()}
            onClick={() => handleSubmit(true)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-ice-accent to-blue-600 hover:from-blue-500 hover:to-blue-600 text-xs font-black text-white shadow-lg transition-all flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Lưu & Bắt Đầu Tải</span>
          </button>
        </div>
      </div>
    </div>
  );
};
