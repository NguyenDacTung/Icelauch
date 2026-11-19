import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, X, Music } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import { TerraExteriorGrass } from '../common/TerraExteriorGrass';
import { IgnisMagmaCracks } from '../common/IgnisMagmaCracks';
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
  const { theme } = useTheme();
  const [isBurningToClose, setIsBurningToClose] = useState<boolean>(false);
  const closeTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
      }
    };
  }, []);

  // Reset burn state if track changes
  useEffect(() => {
    setIsBurningToClose(false);
  }, [currentTrack?.id]);

  const handleClosePlayer = () => {
    if (theme === 'ignis' && !isBurningToClose) {
      setIsBurningToClose(true);
      closeTimerRef.current = setTimeout(() => {
        onClose();
        setIsBurningToClose(false);
      }, 850);
    } else {
      onClose();
    }
  };

  if (!currentTrack) return null;

  const progressPercent = duration > 0 ? Math.min(100, Math.max(0, (currentTime / duration) * 100)) : 0;

  const coverUrl = currentTrack.coverPath || currentTrack.bannerPath || '';
  const resolvedCover = coverUrl
    ? coverUrl.startsWith('http') || coverUrl.startsWith('data:') || coverUrl.startsWith('file:')
      ? coverUrl
      : `file://${coverUrl}`
    : '';

  return (
    <div className={`w-full max-w-full sm:max-w-md mx-auto z-30 select-none shrink-0 flex flex-col transition-all duration-300 rounded-2xl relative shadow-xl overflow-hidden ${theme === 'aer'
        ? 'bg-[#CAD6E2]/95 border-[1.5px] border-[#94A3B8] shadow-sm backdrop-blur-md'
        : theme === 'ignis'
          ? `bg-[#261712]/95 border-2 border-[#8C4320] shadow-[0_8px_24px_rgba(0,0,0,0.85)] backdrop-blur-xl ${isPlaying ? 'scale-[1.015]' : 'scale-100'} ${isBurningToClose ? 'ignis-burning-player' : ''}`
          : theme === 'terra'
            ? 'bg-[#2B241D]/95 border-2 border-[#7C5332] shadow-[0_8px_20px_rgba(0,0,0,0.65)] backdrop-blur-xl'
            : theme === 'aqua'
              ? 'bg-sky-100/40 border border-sky-300/60 shadow-[0_12px_36px_rgba(2,132,199,0.25),inset_0_1px_1px_rgba(255,255,255,0.7)] backdrop-blur-2xl aqua-wave-bar'
              : theme === 'solar'
                ? 'bg-white/90 border border-amber-300/60 shadow-lg backdrop-blur-xl'
                : theme === 'aurora'
                  ? 'overflow-hidden glass-header-elevated border border-emerald-400/30 aurora-drift-bar backdrop-blur-2xl'
                  : 'bg-[#0F141C]/85 border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] backdrop-blur-2xl'
      }`}>
      {/* Ignis Mode: Magma Cracks Veins */}
      {theme === 'ignis' && (
        <IgnisMagmaCracks isPlaying={isPlaying} />
      )}

      {/* Ignis Mode: Paper-Burn Dissolution Ember Wave sweeping right-to-left */}
      {theme === 'ignis' && isBurningToClose && (
        <div className="absolute inset-0 pointer-events-none z-30 overflow-visible">
          <div
            className="absolute inset-y-0 w-8 pointer-events-none"
            style={{
              animation: 'ignisEmberSweep 0.85s cubic-bezier(0.35, 0, 0.25, 1) forwards',
              background: 'linear-gradient(to left, rgba(255, 251, 235, 0.95) 0%, rgba(251, 191, 36, 0.85) 30%, rgba(249, 115, 22, 0.7) 65%, transparent 100%)',
              boxShadow: '0 0 14px 4px rgba(249, 115, 22, 0.9), 0 0 24px 6px rgba(220, 38, 38, 0.6)',
              filter: 'blur(1px)',
            }}
          />
          <span className="absolute right-3 top-2 w-1.5 h-1.5 rounded-full bg-[#FFFBEB] shadow-[0_0_8px_#FBBF24] animate-ping" />
          <span className="absolute right-10 top-3 w-2 h-2 rounded-full bg-[#FBBF24] shadow-[0_0_10px_#F97316] animate-ping" style={{ animationDelay: '0.15s' }} />
          <span className="absolute right-24 top-1 w-1.5 h-1.5 rounded-full bg-[#F97316] shadow-[0_0_8px_#EA580C] animate-ping" style={{ animationDelay: '0.35s' }} />
        </div>
      )}

      {/* Terra Mode: Exterior Grass along top outer edge */}
      {theme === 'terra' && (
        <TerraExteriorGrass progressPercent={progressPercent} />
      )}

      {/* 2px Progress Bar at Top */}
      <div className={`w-full h-[2px] relative overflow-hidden ${theme === 'aer'
          ? 'bg-[#CBD5E1]'
          : theme === 'ignis'
            ? 'bg-[#381E15]'
            : theme === 'terra'
              ? 'bg-[#3A3026]'
              : 'bg-ice-border/40'
        }`}>
        <div
          className={`h-full transition-all duration-200 ${theme === 'aer'
              ? 'bg-[#0284C7]'
              : theme === 'ignis'
                ? 'bg-gradient-to-r from-[#DC2626] via-[#F97316] to-[#FBBF24]'
                : theme === 'terra'
                  ? 'bg-[#65A30D]'
                  : 'bg-ice-accent'
            }`}
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* 52px Inner Content (Total mini player height = 54px including 2px progress bar) */}
      <div className="h-[52px] w-full px-3 flex items-center justify-between gap-2.5">
        {/* Track Thumbnail & Title */}
        <div
          onClick={onOpenFullPlayer}
          className="flex items-center gap-2.5 flex-1 min-w-0 cursor-pointer active:opacity-75 transition-opacity"
        >
          {resolvedCover ? (
            <img
              src={resolvedCover}
              alt={currentTrack.title}
              loading="lazy"
              decoding="async"
              className={`w-[38px] h-[38px] rounded-xl object-cover shrink-0 shadow-sm border ${theme === 'aer'
                  ? 'border-[#CBD5E1] rounded-lg shadow-none'
                  : theme === 'ignis'
                    ? 'border-[#8C4320]'
                    : theme === 'terra'
                      ? 'border-[#7C5332]'
                      : 'border-ice-border/60'
                }`}
            />
          ) : (
            <div className={`w-[38px] h-[38px] rounded-xl flex items-center justify-center shrink-0 border ${theme === 'aer'
                ? 'bg-[#E2E8F0] border-[#CBD5E1] text-[#0284C7] rounded-lg'
                : theme === 'ignis'
                  ? 'bg-[#1C120E] border-[#8C4320] text-[#F97316]'
                  : theme === 'terra'
                    ? 'bg-[#211C17] border-[#7C5332] text-[#65A30D]'
                    : 'bg-ice-hover border-ice-border/60 text-ice-accent'
              }`}>
              <Music className="w-5 h-5" />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <p className={`text-xs font-bold truncate leading-tight ${theme === 'aer'
                ? 'text-[#0F172A]'
                : theme === 'ignis'
                  ? 'text-[#FFF7ED]'
                  : theme === 'terra'
                    ? 'text-[#F3ECE1]'
                    : 'text-ice-text'
              }`}>
              {currentTrack.title}
            </p>
            <p className={`text-[11px] truncate mt-0.5 leading-tight ${theme === 'aer'
                ? 'text-[#475569]'
                : theme === 'ignis'
                  ? 'text-[#D6B4A6]'
                  : theme === 'terra'
                    ? 'text-[#B5A898]'
                    : 'text-ice-subtext'
              }`}>
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
            className={`w-10 h-10 flex items-center justify-center text-white cursor-pointer ${theme === 'aer'
                ? 'rounded-lg bg-[#0284C7] hover:bg-[#0369A1] shadow-none active:scale-95 transition-none'
                : theme === 'ignis'
                  ? 'rounded-full bg-gradient-to-r from-[#F97316] to-[#DC2626] shadow-[0_0_12px_rgba(249,115,22,0.6)] hover:opacity-90 active:scale-95 transition-transform'
                  : theme === 'terra'
                    ? 'rounded-full bg-[#65A30D] hover:bg-[#84CC16] shadow-md hover:opacity-90 active:scale-95 transition-transform'
                    : 'rounded-full bg-ice-accent shadow-md hover:opacity-90 active:scale-95 transition-transform'
              }`}
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
              handleClosePlayer();
            }}
            className={`w-9 h-9 flex items-center justify-center transition-none ${theme === 'aer'
                ? 'rounded-lg text-[#475569] hover:text-[#0F172A] active:bg-[#CBD5E1]'
                : theme === 'ignis'
                  ? 'rounded-full text-[#D6B4A6] hover:text-[#DC2626] active:bg-[#381E15]'
                  : theme === 'terra'
                    ? 'rounded-full text-[#B5A898] hover:text-[#F3ECE1] active:bg-[#3A3026]'
                    : 'rounded-full text-ice-subtext hover:text-ice-text active:bg-ice-hover'
              }`}
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
