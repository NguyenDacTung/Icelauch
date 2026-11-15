import React, { useRef, useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  VolumeX, 
  Repeat, 
  Shuffle, 
  Music, 
  X,
  Maximize2
} from 'lucide-react';
import type { MediaItem } from '../../types';
import { getDirectAudioStreamUrl } from '../../utils/mediaUrl';
import { 
  updateMediaSession, 
  updateMediaSessionPositionState, 
  clearMediaSession 
} from '../../utils/mediaSession';

interface MiniPlayerProps {
  currentTrack: MediaItem | null;
  playlist: MediaItem[];
  isPlaying: boolean;
  isTurntableActive?: boolean;
  hideVisualBar?: boolean;
  onPlayPause: () => void;
  onNext: () => void;
  onPrev: () => void;
  onClose: () => void;
  onTrackProgress: (position: number) => void;
  onNavigateToTrack?: () => void;
  currentTime?: number;
  duration?: number;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  seekTime?: number | null;
  onSeeked?: () => void;
  volume?: number;
  isMuted?: boolean;
  onVolumeChange?: (volume: number) => void;
  onToggleMute?: () => void;
}

export const MiniPlayer: React.FC<MiniPlayerProps> = ({
  currentTrack,
  isPlaying,
  isTurntableActive = false,
  hideVisualBar = false,
  onPlayPause,
  onNext,
  onPrev,
  onClose,
  onTrackProgress,
  onNavigateToTrack,
  currentTime: externalCurrentTime,
  duration: externalDuration,
  onTimeUpdate,
  seekTime,
  onSeeked,
  volume: externalVolume,
  isMuted: externalIsMuted,
  onVolumeChange,
  onToggleMute,
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastReportedTimeRef = useRef<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolume] = useState<number>(0.8);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isRepeat, setIsRepeat] = useState<boolean>(false);
  const [isShuffle, setIsShuffle] = useState<boolean>(false);
  const [audioSrc, setAudioSrc] = useState<string>(
    currentTrack?.link ? getDirectAudioStreamUrl(currentTrack.link) : ''
  );

  const effectiveVolume = externalVolume !== undefined ? externalVolume : volume;
  const effectiveIsMuted = externalIsMuted !== undefined ? externalIsMuted : isMuted;

  // 1. Support offline downloaded files vs proxy vs direct stream URL
  useEffect(() => {
    if (!currentTrack) return;
    if (currentTrack.localFilePath && currentTrack.downloadStatus === 'downloaded') {
      setAudioSrc(`file://${currentTrack.localFilePath}`);
      return;
    }
    if (window.api && (currentTrack.link.includes('drive.google.com') || currentTrack.link.includes('drive.usercontent.google.com'))) {
      window.api.getStreamUrl(currentTrack.link).then((proxyUrl: string) => {
        setAudioSrc(proxyUrl);
      }).catch(() => {
        setAudioSrc(getDirectAudioStreamUrl(currentTrack.link));
      });
    } else {
      setAudioSrc(getDirectAudioStreamUrl(currentTrack.link));
    }
  }, [currentTrack?.id, currentTrack?.link, currentTrack?.localFilePath, currentTrack?.downloadStatus]);

  // 2. Play / Pause - Uninterrupted across tabs, independent of isTurntableActive
  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying && currentTrack) {
        audioRef.current.play().catch((e) => console.warn('Audio play error:', e));
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, currentTrack, audioSrc]);

  // 3. Web Media Session API sync (lock screen, notification shade, Bluetooth controls, background playback)
  useEffect(() => {
    if (!currentTrack) {
      clearMediaSession();
      return;
    }

    updateMediaSession(currentTrack, isPlaying, {
      onPlay: onPlayPause,
      onPause: onPlayPause,
      onNext: onNext,
      onPrev: onPrev,
      onSeekTo: (seekPos) => {
        if (audioRef.current) {
          audioRef.current.currentTime = seekPos;
          setCurrentTime(seekPos);
          onTimeUpdate?.(seekPos, audioRef.current.duration || 0);
        }
      },
    });
  }, [currentTrack, isPlaying, onPlayPause, onNext, onPrev]);

  // 3. Sync volume and mute to the persistent audio element
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = effectiveVolume;
      audioRef.current.muted = effectiveIsMuted;
    }
  }, [effectiveVolume, effectiveIsMuted]);

  // 4. Handle initial position and track changes
  useEffect(() => {
    if (audioRef.current && currentTrack?.lastPosition) {
      audioRef.current.currentTime = currentTrack.lastPosition;
    }
    lastReportedTimeRef.current = 0;
  }, [currentTrack?.id]);

  // 5. Handle external seek requests (from VinylTurntablePlayer)
  useEffect(() => {
    if (seekTime !== undefined && seekTime !== null && audioRef.current) {
      audioRef.current.currentTime = seekTime;
      setCurrentTime(seekTime);
      onSeeked?.();
    }
  }, [seekTime]);

  if (!currentTrack) return null;

  // 6. Throttled progress report to avoid IPC flooding (every 3 seconds)
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const cur = audioRef.current.currentTime;
      const dur = audioRef.current.duration || 0;
      setCurrentTime(cur);
      onTimeUpdate?.(cur, dur);

      if (Math.abs(cur - lastReportedTimeRef.current) >= 3) {
        lastReportedTimeRef.current = cur;
        onTrackProgress(cur);
        updateMediaSessionPositionState(cur, dur);
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      const dur = audioRef.current.duration || 0;
      setDuration(dur);
      onTimeUpdate?.(audioRef.current.currentTime, dur);
      updateMediaSessionPositionState(audioRef.current.currentTime, dur);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = val;
      setCurrentTime(val);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    onVolumeChange?.(val);
    if (audioRef.current) {
      audioRef.current.volume = val;
    }
    if (val > 0) {
      setIsMuted(false);
    }
  };

  const toggleMute = () => {
    if (onToggleMute) {
      onToggleMute();
    } else {
      setIsMuted(!isMuted);
    }
  };

  const formatTime = (secs: number) => {
    if (!secs || isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const coverUrl = currentTrack.coverPath
    ? (currentTrack.coverPath.startsWith('http') || currentTrack.coverPath.startsWith('data:') || currentTrack.coverPath.startsWith('file:')
        ? currentTrack.coverPath
        : `file://${currentTrack.coverPath}`)
    : '';

  return (
    <>
      {/* Single persistent audio engine in DOM */}
      <audio
        ref={audioRef}
        src={audioSrc || currentTrack.link}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={onNext}
        loop={isRepeat}
      />

      {/* Visual MiniPlayer bar hidden when VinylTurntablePlayer is active OR when in mobile view */}
      {!isTurntableActive && !hideVisualBar && (
        <div className="h-16 bg-[#12141A] border-t border-ice-border px-6 flex items-center justify-between z-40 select-none shadow-2xl">
          {/* Track Info (clickable to return to playing song) */}
          <div
            onClick={onNavigateToTrack}
            className={`flex items-center gap-3 w-1/4 min-w-[200px] ${
              onNavigateToTrack ? 'cursor-pointer group' : ''
            }`}
            title={onNavigateToTrack ? 'Nhấp để quay lại bài hát đang phát' : undefined}
          >
            {coverUrl ? (
              <img
                src={coverUrl}
                alt={currentTrack.title}
                className="w-10 h-10 object-cover rounded shadow-md border border-ice-border group-hover:border-amber-400/80 transition-colors"
              />
            ) : (
              <div className="w-10 h-10 rounded bg-ice-card border border-ice-border flex items-center justify-center text-ice-accent group-hover:border-amber-400/80 transition-colors">
                <Music className="w-5 h-5" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-white truncate group-hover:text-amber-400 transition-colors">
                {currentTrack.title}
              </p>
              <p className="text-[11px] text-ice-subtext truncate">
                {currentTrack.artist || currentTrack.category || 'Âm Nhạc'}
              </p>
            </div>

            {/* Dedicated Return-to-Playing-Song button with Maximize2 icon */}
            {onNavigateToTrack && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onNavigateToTrack();
                }}
                className="p-1.5 rounded-lg text-ice-subtext hover:text-amber-400 hover:bg-white/10 transition-colors ml-1 shrink-0"
                title="Quay lại bài hát đang phát"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Player Controls & Seekbar */}
          <div className="flex flex-col items-center gap-1.5 flex-1 max-w-xl px-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsShuffle(!isShuffle)}
                className={`p-1 transition-colors ${isShuffle ? 'text-ice-accent' : 'text-ice-subtext hover:text-white'}`}
                title="Xáo trộn"
              >
                <Shuffle className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={onPrev}
                className="p-1 text-ice-subtext hover:text-white transition-colors"
                title="Bài trước"
              >
                <SkipBack className="w-4 h-4" />
              </button>

              <button
                onClick={onPlayPause}
                className="w-8 h-8 rounded-full bg-white hover:scale-105 text-black flex items-center justify-center shadow-lg transition-transform"
              >
                {isPlaying ? <Pause className="w-4 h-4 fill-black" /> : <Play className="w-4 h-4 fill-black ml-0.5" />}
              </button>

              <button
                onClick={onNext}
                className="p-1 text-ice-subtext hover:text-white transition-colors"
                title="Bài tiếp"
              >
                <SkipForward className="w-4 h-4" />
              </button>

              <button
                onClick={() => setIsRepeat(!isRepeat)}
                className={`p-1 transition-colors ${isRepeat ? 'text-ice-accent' : 'text-ice-subtext hover:text-white'}`}
                title="Lặp lại"
              >
                <Repeat className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Seek Bar */}
            <div className="flex items-center gap-2 w-full text-[10px] text-ice-subtext">
              <span>{formatTime(currentTime)}</span>
              <input
                type="range"
                min={0}
                max={duration || 100}
                step={0.5}
                value={currentTime}
                onChange={handleSeek}
                className="flex-1 h-1 bg-ice-border rounded-lg appearance-none cursor-pointer accent-ice-accent"
              />
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Volume & Close */}
          <div className="flex items-center gap-3 w-1/4 justify-end">
            <button onClick={toggleMute} className="text-ice-subtext hover:text-white transition-colors">
              {effectiveIsMuted || effectiveVolume === 0 ? <VolumeX className="w-4 h-4 text-ice-error" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={effectiveIsMuted ? 0 : effectiveVolume}
              onChange={handleVolumeChange}
              className="w-20 h-1 bg-ice-border rounded-lg appearance-none cursor-pointer accent-ice-accent"
            />
            <button
              onClick={onClose}
              className="p-1 text-ice-subtext hover:text-white transition-colors ml-2"
              title="Đóng trình phát"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};
