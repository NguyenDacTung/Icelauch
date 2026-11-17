import React from 'react';
import { Play, Pause, X, Music } from 'lucide-react';
import type { MediaItem } from '../../types';

export interface MobileMiniPlayerProps {
  currentTrack: MediaItem | null;
  isPlaying: boolean;
  currentTime?: number;
  duration?: number;
  onPlayPause: () => void;
  onOpenFullPlayer: () => void;
  onClose: () => void;
}

export const MobileMiniPlayer: React.FC<MobileMiniPlayerProps> = ({
  currentTrack,
  isPlaying,
  currentTime = 0,
  duration = 0,
  onPlayPause,
  onOpenFullPlayer,
  onClose,
}) => {
  if (!currentTrack) return null;

  const progressPercent = duration > 0 ? Math.min(100, Math.max(0, (currentTime / duration) * 100)) : 0;

  const coverUrl = currentTrack.coverPath || currentTrack.bannerPath || '';
  const resolvedCover = coverUrl
    ? coverUrl.startsWith('http') || coverUrl.startsWith('data:') || coverUrl.startsWith('file:')
      ? coverUrl
      : `file://${coverUrl}`
    : '';

  return (
    <div className="w-full max-w-full overflow-hidden glass-panel border-t border-ice-border/60 shadow-[0_-4px_20px_rgba(0,0,0,0.15)] z-30 select-none shrink-0 flex flex-col transition-all duration-300">
      {/* 2px Progress Bar at Top */}
      <div className="w-full h-[2px] bg-ice-border/40 relative overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-ice-accent to-amber-400 transition-all duration-200"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* 52px Inner Content (Total mini player height = 54px including 2px progress bar) */}
      <div className="h-[52px] w-full px-3 flex items-center justify-between gap-2.5">
        {/* Track Thumbnail & Title - Tappable to open full screen player */}
        <div
          onClick={onOpenFullPlayer}
          className="flex items-center gap-2.5 flex-1 min-w-0 cursor-pointer active:opacity-75 transition-opacity"
        >
          {resolvedCover ? (
            <img
              src={resolvedCover}
              alt={currentTrack.title}
              className="w-[38px] h-[38px] rounded-xl object-cover shrink-0 border border-ice-border/60 shadow-sm"
            />
          ) : (
            <div className="w-[38px] h-[38px] rounded-xl bg-ice-hover border border-ice-border/60 flex items-center justify-center text-ice-accent shrink-0">
              <Music className="w-5 h-5" />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-ice-text truncate leading-tight">
              {currentTrack.title}
            </p>
            <p className="text-[11px] text-ice-subtext truncate mt-0.5 leading-tight">
              {currentTrack.artist || currentTrack.category || 'Âm Nhạc'}
            </p>
          </div>
        </div>

        {/* Action Controls: Play/Pause and Close (No volume slider on mobile) */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onPlayPause();
            }}
            className="w-10 h-10 rounded-full bg-ice-accent hover:opacity-90 active:scale-95 text-white flex items-center justify-center shadow-md transition-transform"
            title={isPlaying ? 'Tạm dừng' : 'Phát'}
            aria-label={isPlaying ? 'Tạm dừng' : 'Phát'}
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 fill-white text-white" />
            ) : (
              <Play className="w-4 h-4 fill-white text-white ml-0.5" />
            )}
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="w-9 h-9 rounded-full text-ice-subtext hover:text-ice-text active:bg-ice-hover flex items-center justify-center transition-colors"
            title="Đóng trình phát"
            aria-label="Đóng trình phát"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
