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
    <div className="w-full max-w-full overflow-hidden bg-[#13161F]/95 backdrop-blur-xl border-t border-white/10 shadow-[0_-4px_20px_rgba(0,0,0,0.5)] z-30 select-none shrink-0 flex flex-col">
      {/* 2px Progress Bar at Top */}
      <div className="w-full h-[2px] bg-white/10 relative overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-cyan-400 to-amber-400 transition-all duration-200"
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
              className="w-[38px] h-[38px] rounded-lg object-cover shrink-0 border border-white/10 shadow-sm"
            />
          ) : (
            <div className="w-[38px] h-[38px] rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-cyan-400 shrink-0">
              <Music className="w-5 h-5" />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-white truncate leading-tight">
              {currentTrack.title}
            </p>
            <p className="text-[11px] text-slate-400 truncate mt-0.5 leading-tight">
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
            className="w-10 h-10 rounded-full bg-cyan-400 hover:bg-cyan-300 active:scale-95 text-black flex items-center justify-center shadow-md transition-transform"
            title={isPlaying ? 'Tạm dừng' : 'Phát'}
            aria-label={isPlaying ? 'Tạm dừng' : 'Phát'}
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 fill-black text-black" />
            ) : (
              <Play className="w-4 h-4 fill-black text-black ml-0.5" />
            )}
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="w-9 h-9 rounded-full text-slate-400 hover:text-white active:bg-white/10 flex items-center justify-center transition-colors"
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
