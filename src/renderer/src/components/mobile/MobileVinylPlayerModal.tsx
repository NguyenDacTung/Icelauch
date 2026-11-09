import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Disc,
  Music,
  ListMusic,
  Sparkles,
} from 'lucide-react';
import type { MediaItem } from '../../types';

interface MobileVinylPlayerModalProps {
  isOpen: boolean;
  track: MediaItem | null;
  playlist: MediaItem[];
  isPlaying: boolean;
  onClose: () => void;
  onPlayPause: () => void;
  onNext: () => void;
  onPrev: () => void;
  onSelectTrack: (item: MediaItem) => void;
}

export const MobileVinylPlayerModal: React.FC<MobileVinylPlayerModalProps> = ({
  isOpen,
  track,
  playlist = [],
  isPlaying,
  onClose,
  onPlayPause,
  onNext,
  onPrev,
  onSelectTrack,
}) => {
  const [showPlaylist, setShowPlaylist] = useState(false);

  if (!isOpen || !track) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#0A0C10]/95 backdrop-blur-2xl flex flex-col p-4 animate-scale-up select-none">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-3 shrink-0">
        <div className="flex items-center gap-1.5 text-xs text-amber-400 font-bold uppercase tracking-wider">
          <Disc className={`w-4 h-4 ${isPlaying ? 'animate-spin' : ''}`} style={{ animationDuration: '4s' }} />
          <span>Máy Hát Đĩa Than Di Động</span>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Center Vinyl Record Player (Realistic Rotating Record with Tonearm) */}
      <div className="flex-1 flex flex-col items-center justify-center relative my-2">
        {/* Vinyl Disc Body */}
        <div className="relative w-64 h-64 rounded-full bg-[#111318] border-4 border-[#222630] shadow-[0_0_50px_rgba(0,0,0,0.9),0_0_20px_rgba(245,158,11,0.2)] flex items-center justify-center overflow-hidden">
          {/* Vinyl Grooves Effect */}
          <div className="absolute inset-2 rounded-full border border-white/5" />
          <div className="absolute inset-6 rounded-full border border-white/5" />
          <div className="absolute inset-10 rounded-full border border-white/5" />
          <div className="absolute inset-14 rounded-full border border-white/5" />

          {/* Center Record Label / Artwork */}
          <div
            className={`w-28 h-28 rounded-full overflow-hidden border-4 border-amber-500/60 shadow-lg relative ${
              isPlaying ? 'animate-spin' : ''
            }`}
            style={{ animationDuration: '6s' }}
          >
            <img
              src={track.coverPath || track.bannerPath || ''}
              alt={track.title}
              className="w-full h-full object-cover"
            />
            {/* Center Spindle Hole */}
            <div className="absolute inset-0 m-auto w-4 h-4 rounded-full bg-[#0A0C10] border-2 border-white/40 shadow-inner" />
          </div>
        </div>

        {/* Tonearm Graphic Overlay */}
        <div
          className={`absolute top-4 right-10 w-16 h-28 origin-top-right transition-transform duration-700 pointer-events-none ${
            isPlaying ? 'rotate-12' : '-rotate-12 opacity-60'
          }`}
        >
          <div className="w-1.5 h-20 bg-gradient-to-b from-amber-400 to-amber-600 rounded-full mx-auto shadow-md" />
          <div className="w-3.5 h-5 bg-neutral-300 rounded-sm mx-auto shadow-sm" />
        </div>
      </div>

      {/* Track Info */}
      <div className="text-center space-y-1 py-2 shrink-0">
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase tracking-wider inline-block">
          {track.subType === 'podcast' ? 'Podcast' : 'Bài Hát'}
        </span>
        <h2 className="text-base font-black text-white line-clamp-1">
          {track.title}
        </h2>
        <p className="text-xs text-ice-subtext line-clamp-1">
          {track.artist || track.category || 'Nghệ sĩ ẩn danh'}
        </p>
      </div>

      {/* Control Buttons Row */}
      <div className="flex items-center justify-center gap-6 py-3 shrink-0">
        <button
          type="button"
          onClick={onPrev}
          className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center active:scale-95 transition-all"
        >
          <SkipBack className="w-5 h-5" />
        </button>

        <button
          type="button"
          onClick={onPlayPause}
          className="w-14 h-14 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-black flex items-center justify-center shadow-lg shadow-amber-500/30 active:scale-95 transition-all"
        >
          {isPlaying ? <Pause className="w-6 h-6 fill-black" /> : <Play className="w-6 h-6 fill-black ml-0.5" />}
        </button>

        <button
          type="button"
          onClick={onNext}
          className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center active:scale-95 transition-all"
        >
          <SkipForward className="w-5 h-5" />
        </button>
      </div>

      {/* Bottom Playlist Toggle */}
      <div className="pt-2 border-t border-ice-border/60 shrink-0">
        <button
          type="button"
          onClick={() => setShowPlaylist(!showPlaylist)}
          className="w-full h-9 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-semibold flex items-center justify-center gap-1.5 border border-white/10"
        >
          <ListMusic className="w-4 h-4 text-amber-400" />
          <span>Danh sách phát ({playlist.length} bài)</span>
        </button>

        {showPlaylist && (
          <div className="max-h-36 overflow-y-auto no-scrollbar space-y-1 mt-2">
            {playlist.map((item) => (
              <div
                key={item.id}
                onClick={() => onSelectTrack(item)}
                className={`flex items-center justify-between p-2 rounded-lg text-xs cursor-pointer ${
                  item.id === track.id ? 'bg-amber-500/20 text-amber-300 font-bold' : 'text-ice-subtext hover:text-white'
                }`}
              >
                <span className="line-clamp-1">{item.title}</span>
                {item.id === track.id && <Disc className="w-3 h-3 animate-spin shrink-0" />}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
