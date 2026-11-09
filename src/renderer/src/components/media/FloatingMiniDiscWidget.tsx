import React, { useState } from 'react';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Maximize2, 
  Volume2, 
  VolumeX, 
  X, 
  Disc,
  Sparkles
} from 'lucide-react';
import type { MediaItem, MediaPlaylist } from '../../types';
import { sfx } from '../../utils/sfx';

interface FloatingMiniDiscWidgetProps {
  currentTrack: MediaItem | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  onTogglePlay: () => void;
  onNext: () => void;
  onPrev: () => void;
  onSeek: (seconds: number) => void;
  onOpenFullPlayer: () => void;
  onClose: () => void;
}

export const FloatingMiniDiscWidget: React.FC<FloatingMiniDiscWidgetProps> = ({
  currentTrack,
  isPlaying,
  currentTime,
  duration,
  onTogglePlay,
  onNext,
  onPrev,
  onSeek,
  onOpenFullPlayer,
  onClose,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  if (!currentTrack) return null;

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '00:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const coverUrl = currentTrack.coverPath
    ? (currentTrack.coverPath.startsWith('http') || currentTrack.coverPath.startsWith('data:') ? currentTrack.coverPath : `file://${currentTrack.coverPath}`)
    : '';

  return (
    <div
      className="fixed bottom-6 right-6 z-40 select-none flex flex-col items-end"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Compact Expanded Tool Card on Hover */}
      {isHovered && (
        <div className="mb-3 w-80 p-4 rounded-2xl bg-ice-card/95 backdrop-blur-xl border border-amber-500/30 shadow-2xl space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 truncate pr-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Đang Phát Dưới Nền</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  sfx.playClick();
                  onOpenFullPlayer();
                }}
                className="p-1 rounded-lg text-ice-muted hover:text-white hover:bg-white/10"
                title="Mở toàn màn hình"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => {
                  sfx.playClick();
                  onClose();
                }}
                className="p-1 rounded-lg text-ice-muted hover:text-red-400 hover:bg-white/10"
                title="Đóng phát ngầm"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Track metadata */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl overflow-hidden bg-black/60 border border-white/10 shrink-0">
              {coverUrl ? (
                <img src={coverUrl} alt={currentTrack.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-amber-400">
                  <Disc className="w-6 h-6" />
                </div>
              )}
            </div>
            <div className="flex-1 truncate">
              <h4 className="text-xs font-bold text-white truncate">{currentTrack.title}</h4>
              <p className="text-[10px] text-amber-400/90 truncate">
                {currentTrack.artist || currentTrack.category || 'Âm Nhạc'}
              </p>
            </div>
          </div>

          {/* Scrubber */}
          <div className="space-y-1">
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime}
              onChange={(e) => onSeek(parseFloat(e.target.value))}
              className="w-full h-1 rounded-lg appearance-none bg-white/20 accent-amber-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-ice-muted font-mono">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Quick Controls */}
          <div className="flex items-center justify-center gap-4 pt-1">
            <button
              onClick={() => {
                sfx.playClick();
                onPrev();
              }}
              className="p-1.5 rounded-full hover:bg-white/10 text-ice-text hover:text-white"
              title="Bài trước"
            >
              <SkipBack className="w-4 h-4 fill-current" />
            </button>

            <button
              onClick={() => {
                sfx.playClick();
                onTogglePlay();
              }}
              className="p-2.5 rounded-full bg-amber-500 hover:bg-amber-400 text-black shadow-lg shadow-amber-500/30 transition-transform active:scale-95"
              title={isPlaying ? 'Tạm dừng' : 'Phát tiếp'}
            >
              {isPlaying ? <Pause className="w-4 h-4 fill-black" /> : <Play className="w-4 h-4 fill-black ml-0.5" />}
            </button>

            <button
              onClick={() => {
                sfx.playClick();
                onNext();
              }}
              className="p-1.5 rounded-full hover:bg-white/10 text-ice-text hover:text-white"
              title="Bài tiếp theo"
            >
              <SkipForward className="w-4 h-4 fill-current" />
            </button>
          </div>
        </div>
      )}

      {/* Floating Mini Vinyl Disc Badge (Always Visible when background playback is active) */}
      <div
        onClick={() => {
          sfx.playClick();
          onTogglePlay();
        }}
        className="relative w-14 h-14 rounded-full bg-[#111317] border-2 border-amber-500/80 shadow-[0_0_20px_rgba(217,119,6,0.35)] cursor-pointer flex items-center justify-center group overflow-hidden transition-all hover:scale-105 active:scale-95"
        title="Nhấp để Tạm dừng / Phát tiếp, rê chuột để mở bảng điều khiển"
      >
        {/* Spinning Vinyl Graphic */}
        <div
          className="w-full h-full rounded-full flex items-center justify-center bg-gradient-to-tr from-[#0a0a0c] via-[#1a1b22] to-[#0a0a0c]"
          style={{
            animation: isPlaying ? 'spin 5s linear infinite' : 'none',
          }}
        >
          {/* Vinyl grooves */}
          <div className="absolute inset-1.5 rounded-full border border-white/10 pointer-events-none" />
          <div className="absolute inset-3 rounded-full border border-white/10 pointer-events-none" />

          {/* Center artwork */}
          <div className="w-6 h-6 rounded-full overflow-hidden border border-amber-400 bg-black flex items-center justify-center">
            {coverUrl ? (
              <img src={coverUrl} alt="disc" className="w-full h-full object-cover" />
            ) : (
              <Disc className="w-4 h-4 text-amber-400" />
            )}
          </div>
        </div>

        {/* Center Play/Pause indicator on hover */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
          {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white ml-0.5" />}
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

