import React from 'react';
import { Download, X, Play, RotateCcw, AlertCircle, HardDrive } from 'lucide-react';
import type { Game } from '../../types';

interface DownloadTrayProps {
  isOpen: boolean;
  onClose: () => void;
  games: Game[];
  onCancelDownload: (gameId: string) => void;
  onRetry: (gameId: string) => void;
}

export const DownloadTray: React.FC<DownloadTrayProps> = ({
  isOpen,
  onClose,
  games,
  onCancelDownload,
  onRetry,
}) => {
  if (!isOpen) return null;

  const activeGames = games.filter(
    (g) => g.status === 'downloading' || g.status === 'installing' || g.status === 'error'
  );

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  const formatEta = (seconds: number) => {
    if (!seconds || seconds <= 0) return '--';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    if (m >= 60) {
      const h = Math.floor(m / 60);
      return `${h} giờ ${m % 60} phút`;
    }
    return `${m} phút ${s}s`;
  };

  return (
    <div className="absolute top-14 right-4 w-96 max-h-[500px] z-50 glass-panel rounded-lg shadow-2xl flex flex-col overflow-hidden border border-ice-border animate-in fade-in slide-in-from-top-2 duration-150">
      {/* Header */}
      <div className="h-11 px-4 bg-ice-card/90 border-b border-ice-border flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-bold tracking-wide uppercase text-ice-text">
          <Download className="w-4 h-4 text-ice-accent" />
          <span>Danh sách tải & cài đặt ({activeGames.length})</span>
        </div>
        <button
          onClick={onClose}
          className="text-ice-subtext hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Content list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {activeGames.length === 0 ? (
          <div className="py-12 text-center text-ice-subtext text-xs flex flex-col items-center gap-2">
            <HardDrive className="w-8 h-8 opacity-40 text-ice-subtext" />
            <p>Không có game nào đang tải hoặc cài đặt</p>
          </div>
        ) : (
          activeGames.map((game) => {
            const isError = game.status === 'error';
            const isInstalling = game.status === 'installing';
            const progress = game.downloadProgress;
            const installProgress = game.installProgress;

            const percentage = isInstalling
              ? installProgress?.percentage || 0
              : progress?.percentage || 0;

            const statusText = isInstalling
              ? installProgress?.statusText || 'Đang giải nén & cài đặt...'
              : isError
              ? game.errorDetails || 'Tải file thất bại'
              : progress?.statusText || 'Đang tải game...';

            return (
              <div
                key={game.id}
                className="bg-ice-bg/90 rounded-md border border-ice-border/80 p-3 space-y-2 hover:border-ice-border transition-colors"
              >
                <div className="flex items-center gap-3">
                  {/* Thumbnail */}
                  <img
                    src={game.coverPath || 'https://via.placeholder.com/60x90'}
                    alt={game.name}
                    className="w-10 h-14 object-cover rounded border border-ice-border flex-shrink-0"
                  />

                  {/* Title & Speed */}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-semibold text-white truncate" title={game.name}>
                      {game.name}
                    </h4>
                    <p className="text-[11px] text-ice-subtext truncate mt-0.5">
                      {statusText}
                    </p>
                    {!isError && !isInstalling && progress && (
                      <div className="flex items-center gap-2 text-[10px] text-ice-subtext mt-1">
                        <span className="text-ice-accent font-medium">{progress.speedMBps.toFixed(1)} MB/s</span>
                        <span>•</span>
                        <span>Còn {formatEta(progress.etaSeconds)}</span>
                      </div>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-1">
                    {isError && (
                      <button
                        onClick={() => onRetry(game.id)}
                        className="p-1.5 rounded hover:bg-ice-hover text-ice-subtext hover:text-ice-accent transition-colors"
                        title="Thử lại tải / cài đặt"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => onCancelDownload(game.id)}
                      className="p-1.5 rounded hover:bg-ice-hover text-ice-subtext hover:text-ice-error transition-colors"
                      title={isError ? "Đóng / Xóa lỗi" : "Hủy tiến trình"}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-1">
                  <div className="h-1.5 w-full bg-ice-card rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 rounded-full ${
                        isError 
                          ? 'bg-ice-error' 
                          : isInstalling 
                          ? 'bg-amber-400' 
                          : 'bg-ice-accent'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-ice-subtext">
                    <span>{percentage}%</span>
                    {!isInstalling && progress && (
                      <span>
                        {formatBytes(progress.bytesDownloaded)} / {formatBytes(progress.totalBytes)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

