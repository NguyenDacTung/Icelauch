import React, { useState } from 'react';
import {
  X,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Disc,
  ListMusic,
  ChevronDown,
} from 'lucide-react';
import type { MediaItem } from '../../types';

interface MobileVinylPlayerModalProps {
  isOpen: boolean;
  track: MediaItem | null;
  playlist: MediaItem[];
  isPlaying: boolean;
  currentTime?: number;
  duration?: number;
  onClose: () => void;
  onPlayPause: () => void;
  onNext: () => void;
  onPrev: () => void;
  onSeek?: (time: number) => void;
  onSelectTrack: (item: MediaItem) => void;
}

export const MobileVinylPlayerModal: React.FC<MobileVinylPlayerModalProps> = ({
  isOpen,
  track,
  playlist = [],
  isPlaying,
  currentTime = 0,
  duration = 0,
  onClose,
  onPlayPause,
  onNext,
  onPrev,
  onSeek,
  onSelectTrack,
}) => {
  const [showPlaylist, setShowPlaylist] = useState(false);

  if (!isOpen || !track) return null;

  const formatTime = (secs: number) => {
    if (!secs || isNaN(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const coverUrl = track.coverPath || track.bannerPath || '';
  const resolvedCover = coverUrl
    ? coverUrl.startsWith('http') || coverUrl.startsWith('data:') || coverUrl.startsWith('file:')
      ? coverUrl
      : `file://${coverUrl}`
    : '';

  return (
    <div className="fixed inset-0 z-50 bg-[#0A0C10]/98 backdrop-blur-2xl flex flex-col justify-between p-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))] animate-scale-up select-none overflow-hidden">
      {/* Top Header: Minimize Chevron Down & Close Button (>= 44x44px touch targets) */}
      <div className="flex items-center justify-between pb-2 shrink-0">
        <button
          type="button"
          onClick={onClose}
          className="w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-white flex items-center justify-center transition-all"
          title="Thu nhỏ về mini player"
          aria-label="Thu nhỏ về mini player"
        >
          <ChevronDown className="w-6 h-6 text-slate-300" />
        </button>

        <div className="flex items-center gap-1.5 text-xs text-amber-400 font-bold uppercase tracking-wider">
          <Disc className={`w-4 h-4 ${isPlaying ? 'animate-spin' : ''}`} style={{ animationDuration: '4s' }} />
          <span>Máy Hát Đĩa Than</span>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-white flex items-center justify-center transition-all"
          title="Đóng trình phát"
          aria-label="Đóng trình phát"
        >
          <X className="w-5 h-5 text-slate-300" />
        </button>
      </div>

      {/* Center Vinyl Record Player (Realistic Rotating Record with Tonearm) */}
      <div className="flex-1 flex flex-col items-center justify-center relative my-2 min-h-[220px]">
        {/* Vinyl Disc Body */}
        <div className="relative w-56 h-56 sm:w-64 sm:h-64 rounded-full bg-[#111318] border-4 border-[#222630] shadow-[0_0_50px_rgba(0,0,0,0.9),0_0_20px_rgba(245,158,11,0.2)] flex items-center justify-center overflow-hidden">
          {/* Vinyl Grooves Effect */}
          <div className="absolute inset-2 rounded-full border border-white/5" />
          <div className="absolute inset-6 rounded-full border border-white/5" />
          <div className="absolute inset-10 rounded-full border border-white/5" />
          <div className="absolute inset-14 rounded-full border border-white/5" />

          {/* Center Record Label / Artwork */}
          <div
            className={`w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border-4 border-amber-500/60 shadow-lg relative ${
              isPlaying ? 'animate-spin' : ''
            }`}
            style={{ animationDuration: '6s' }}
          >
            {resolvedCover ? (
              <img
                src={resolvedCover}
                alt={track.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-[#181B24] flex items-center justify-center text-amber-400">
                <Disc className="w-10 h-10" />
              </div>
            )}
            {/* Center Spindle Hole */}
            <div className="absolute inset-0 m-auto w-4 h-4 rounded-full bg-[#0A0C10] border-2 border-white/40 shadow-inner" />
          </div>
        </div>

        {/* Tonearm Graphic Overlay */}
        <div
          className={`absolute top-2 right-8 sm:right-12 w-16 h-28 origin-top-right transition-transform duration-700 pointer-events-none ${
            isPlaying ? 'rotate-12' : '-rotate-12 opacity-60'
          }`}
        >
          <div className="w-1.5 h-20 bg-gradient-to-b from-amber-400 to-amber-600 rounded-full mx-auto shadow-md" />
          <div className="w-3.5 h-5 bg-neutral-300 rounded-sm mx-auto shadow-sm" />
        </div>
      </div>

      {/* Track Info */}
      <div className="text-center space-y-1 py-1.5 shrink-0 px-4">
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase tracking-wider inline-block">
          {track.subType === 'podcast' ? 'Podcast' : 'Bài Hát'}
        </span>
        <h2 className="text-lg font-black text-white line-clamp-1">
          {track.title}
        </h2>
        <p className="text-xs text-slate-400 line-clamp-1">
          {track.artist || track.category || 'Nghệ sĩ ẩn danh'}
        </p>
      </div>

      {/* Touch-Friendly Scrubber Seekbar with Current Time and Duration */}
      <div className="w-full max-w-sm mx-auto px-2 py-2 shrink-0 flex flex-col gap-1.5">
        <div className="relative flex items-center">
          <input
            type="range"
            min={0}
            max={duration || 100}
            step={0.5}
            value={currentTime}
            onChange={(e) => onSeek?.(parseFloat(e.target.value))}
            className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-amber-400 active:accent-amber-300 touch-pan-x"
            aria-label="Thanh trượt thời gian bài hát"
          />
        </div>
        <div className="flex items-center justify-between text-xs font-medium text-slate-400 px-0.5">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Control Buttons Row (All Touch Targets >= 44x44px) */}
      <div className="flex items-center justify-center gap-6 py-2 shrink-0">
        <button
          type="button"
          onClick={onPrev}
          className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-white flex items-center justify-center transition-all"
          title="Bài trước"
          aria-label="Bài trước"
        >
          <SkipBack className="w-5 h-5 text-slate-200" />
        </button>

        <button
          type="button"
          onClick={onPlayPause}
          className="w-16 h-16 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 active:scale-95 text-black flex items-center justify-center shadow-lg shadow-amber-500/30 transition-transform"
          title={isPlaying ? 'Tạm dừng' : 'Phát'}
          aria-label={isPlaying ? 'Tạm dừng' : 'Phát'}
        >
          {isPlaying ? (
            <Pause className="w-7 h-7 fill-black text-black" />
          ) : (
            <Play className="w-7 h-7 fill-black text-black ml-1" />
          )}
        </button>

        <button
          type="button"
          onClick={onNext}
          className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-white flex items-center justify-center transition-all"
          title="Bài tiếp theo"
          aria-label="Bài tiếp theo"
        >
          <SkipForward className="w-5 h-5 text-slate-200" />
        </button>
      </div>

      {/* Bottom Playlist Toggle & Drawer */}
      <div className="pt-2 border-t border-white/10 shrink-0">
        <button
          type="button"
          onClick={() => setShowPlaylist(!showPlaylist)}
          className="w-full h-11 rounded-xl bg-white/5 hover:bg-white/10 active:bg-white/15 text-white text-xs font-semibold flex items-center justify-center gap-2 border border-white/10 transition-colors"
        >
          <ListMusic className="w-4 h-4 text-amber-400" />
          <span>Danh sách phát ({playlist.length} bài)</span>
        </button>

        {showPlaylist && (
          <div className="max-h-36 overflow-y-auto no-scrollbar space-y-1 mt-2 p-1 rounded-xl bg-black/40 border border-white/5">
            {playlist.map((item) => (
              <div
                key={item.id}
                onClick={() => onSelectTrack(item)}
                className={`flex items-center justify-between p-2.5 rounded-lg text-xs cursor-pointer active:scale-[0.99] transition-all min-h-[44px] ${
                  item.id === track.id
                    ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <span className="line-clamp-1 flex-1 pr-2">{item.title}</span>
                {item.id === track.id && <Disc className="w-3.5 h-3.5 text-amber-400 animate-spin shrink-0" />}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
