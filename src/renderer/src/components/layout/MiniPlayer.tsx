import React, { useRef, useState, useEffect, useMemo } from 'react';
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
  Maximize2,
  Disc
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
  const [proxyAudioSrc, setProxyAudioSrc] = useState<string>('');
  const [fallbackLevel, setFallbackLevel] = useState<number>(0);

  const effectiveVolume = externalVolume !== undefined ? externalVolume : volume;
  const effectiveIsMuted = externalIsMuted !== undefined ? externalIsMuted : isMuted;

  // Reset fallback level whenever current track changes
  useEffect(() => {
    setFallbackLevel(0);
  }, [currentTrack?.id]);

  // Resolve direct audio stream synchronously with multi-endpoint fallback
  const audioSrc = useMemo(() => {
    if (!currentTrack) return '';
    if (currentTrack.localFilePath && currentTrack.downloadStatus === 'downloaded') {
      return `file://${currentTrack.localFilePath}`;
    }
    if (proxyAudioSrc) return proxyAudioSrc;
    return fallbackLevel > 0
      ? getDirectAudioStreamUrl(currentTrack.link, fallbackLevel)
      : getDirectAudioStreamUrl(currentTrack.link);
  }, [currentTrack, proxyAudioSrc, fallbackLevel]);

  // Support PC Electron local proxy server when applicable
  useEffect(() => {
    if (!currentTrack) {
      setProxyAudioSrc('');
      return;
    }
    if (window.api && (currentTrack.link.includes('drive.google.com') || currentTrack.link.includes('drive.usercontent.google.com'))) {
      window.api.getStreamUrl(currentTrack.link).then((proxyUrl: string) => {
        setProxyAudioSrc(proxyUrl);
      }).catch(() => {
        setProxyAudioSrc('');
      });
    } else {
      setProxyAudioSrc('');
    }
  }, [currentTrack?.id, currentTrack?.link]);

  // Play / Pause - Smooth and stall-free across Android WebView and Desktop
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!currentTrack || !audioSrc) {
      audio.pause();
      return;
    }

    if (isPlaying) {
      // Android WebKit: explicit load ensures audio pipeline warms up
      if (audio.readyState === 0) {
        audio.load();
      }
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          if (err.name !== 'AbortError') {
            console.warn('[AudioEngine] Play failed:', err);
          }
        });
      }
    } else {
      audio.pause();
    }
  }, [isPlaying, currentTrack?.id, audioSrc]);

  const handleCanPlay = () => {
    const audio = audioRef.current;
    if (audio && isPlaying && audio.paused) {
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          if (err.name !== 'AbortError') {
            console.warn('[AudioEngine] Auto-resume on canplay error:', err);
          }
        });
      }
    }
  };

  const handleAudioError = (e: React.SyntheticEvent<HTMLAudioElement, Event>) => {
    console.warn(`[AudioEngine] Stream error on "${currentTrack?.title}" (fallbackLevel: ${fallbackLevel}):`, e);
    if (fallbackLevel < 2) {
      setFallbackLevel((prev) => prev + 1);
    }
  };

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
      onSeekTo: (targetTime: number) => {
        if (targetTime !== undefined && audioRef.current) {
          audioRef.current.currentTime = targetTime;
          setCurrentTime(targetTime);
          onTimeUpdate?.(targetTime, audioRef.current.duration || 0);
          updateMediaSessionPositionState(targetTime, audioRef.current.duration || 0);
        }
      },
    });
  }, [currentTrack, isPlaying, onPlayPause, onNext, onPrev]);

  // Sync external volume / mute
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = effectiveVolume;
      audioRef.current.muted = effectiveIsMuted;
    }
  }, [effectiveVolume, effectiveIsMuted]);

  // Restore last playback position on track load
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
    setCurrentTime(val);
    if (audioRef.current) {
      audioRef.current.currentTime = val;
    }
    onTimeUpdate?.(val, duration);
    updateMediaSessionPositionState(val, duration);
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

  const coverUrl = currentTrack?.coverPath
    ? (currentTrack.coverPath.startsWith('http') || currentTrack.coverPath.startsWith('data:') || currentTrack.coverPath.startsWith('file:')
        ? currentTrack.coverPath
        : `file://${currentTrack.coverPath}`)
    : '';

  return (
    <>
      {/* 
        Single persistent audio engine in DOM.
        Kept continuously mounted to guarantee immediate playback without unmounting delays or WebKit gesture loss.
      */}
      <audio
        ref={audioRef}
        src={audioSrc || (currentTrack ? currentTrack.link : undefined)}
        preload="auto"
        playsInline
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onCanPlay={handleCanPlay}
        onEnded={onNext}
        onError={handleAudioError}
        loop={isRepeat}
      />

      {/* Steam & Spotify Cinema Redesigned PC MiniPlayer Bar */}
      {currentTrack && !isTurntableActive && !hideVisualBar && (
        <div className="h-18 bg-[#0D1017]/95 backdrop-blur-2xl border-t border-white/10 px-6 flex items-center justify-between z-40 select-none shadow-[0_-8px_32px_rgba(0,0,0,0.65)]">
          {/* Left: Track Info & Artwork */}
          <div
            onClick={onNavigateToTrack}
            className={`flex items-center gap-3.5 w-1/4 min-w-[220px] ${
              onNavigateToTrack ? 'cursor-pointer group' : ''
            }`}
            title={onNavigateToTrack ? 'Nhấp để mở Máy Hát Đĩa Than' : undefined}
          >
            <div className="relative shrink-0">
              {coverUrl ? (
                <img
                  src={coverUrl}
                  alt={currentTrack.title}
                  className="w-11 h-11 object-cover rounded-xl shadow-lg border border-white/10 group-hover:border-amber-400/80 transition-all group-hover:scale-105"
                />
              ) : (
                <div className="w-11 h-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-amber-400 group-hover:border-amber-400/80 transition-all">
                  <Music className="w-5 h-5" />
                </div>
              )}
              {isPlaying && (
                <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-amber-400 border-2 border-[#0D1017] flex items-center justify-center animate-ping" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="text-xs font-bold text-white truncate group-hover:text-amber-400 transition-colors">
                  {currentTrack.title}
                </p>
                {/* Dancing Equalizer next to title */}
                {isPlaying && (
                  <div className="flex items-end gap-0.5 h-3 shrink-0" title="Đang phát">
                    <span className="w-0.5 bg-amber-400 rounded-full animate-pulse" style={{ height: '50%', animationDuration: '400ms' }} />
                    <span className="w-0.5 bg-amber-400 rounded-full animate-pulse" style={{ height: '100%', animationDuration: '600ms' }} />
                    <span className="w-0.5 bg-amber-400 rounded-full animate-pulse" style={{ height: '30%', animationDuration: '500ms' }} />
                    <span className="w-0.5 bg-amber-400 rounded-full animate-pulse" style={{ height: '80%', animationDuration: '450ms' }} />
                  </div>
                )}
              </div>
              <p className="text-[11px] text-gray-400 truncate mt-0.5 flex items-center gap-1.5">
                <span>{currentTrack.artist || currentTrack.album || currentTrack.category || 'Âm Nhạc'}</span>
                {currentTrack.subType === 'podcast' && (
                  <span className="text-[9px] px-1 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 font-semibold">
                    PODCAST
                  </span>
                )}
              </p>
            </div>

            {/* Quick Vinyl Turntable Icon Button */}
            {onNavigateToTrack && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onNavigateToTrack();
                }}
                className="p-1.5 rounded-lg text-gray-400 hover:text-amber-400 hover:bg-white/10 active:scale-95 transition-all ml-1 shrink-0"
                title="Mở toàn màn hình Máy Hát Đĩa Than"
              >
                <Disc className={`w-4 h-4 ${isPlaying ? 'animate-spin' : ''}`} style={{ animationDuration: '5s' }} />
              </button>
            )}
          </div>

          {/* Center: Controls & Scrub Bar (Spotify Cinema Style) */}
          <div className="flex flex-col items-center gap-1.5 flex-1 max-w-xl px-6">
            <div className="flex items-center gap-5">
              <button
                type="button"
                onClick={() => setIsShuffle(!isShuffle)}
                className={`p-1.5 rounded-full transition-colors ${
                  isShuffle ? 'text-amber-400 bg-amber-400/10' : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
                title={isShuffle ? 'Tắt phát ngẫu nhiên' : 'Bật phát ngẫu nhiên'}
              >
                <Shuffle className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={onPrev}
                className="p-1.5 rounded-full text-gray-300 hover:text-white hover:bg-white/10 active:scale-90 transition-all"
                title="Bài trước"
              >
                <SkipBack className="w-4 h-4" />
              </button>

              {/* Glowing Amber Play/Pause button */}
              <button
                type="button"
                onClick={onPlayPause}
                className="w-10 h-10 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black flex items-center justify-center shadow-[0_0_20px_rgba(251,191,36,0.35)] transition-all hover:scale-105 active:scale-95"
                title={isPlaying ? 'Tạm dừng' : 'Phát'}
              >
                {isPlaying ? (
                  <Pause className="w-4 h-4 fill-black text-black" />
                ) : (
                  <Play className="w-4 h-4 fill-black text-black ml-0.5" />
                )}
              </button>

              <button
                type="button"
                onClick={onNext}
                className="p-1.5 rounded-full text-gray-300 hover:text-white hover:bg-white/10 active:scale-90 transition-all"
                title="Bài tiếp theo"
              >
                <SkipForward className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setIsRepeat(!isRepeat)}
                className={`p-1.5 rounded-full transition-colors ${
                  isRepeat ? 'text-amber-400 bg-amber-400/10' : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
                title={isRepeat ? 'Tắt lặp lại' : 'Lặp lại bài này'}
              >
                <Repeat className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Seek Bar */}
            <div className="flex items-center gap-2.5 w-full text-[11px] font-mono text-gray-400">
              <span className="w-9 text-right tabular-nums">{formatTime(currentTime)}</span>
              <div className="relative flex-1 flex items-center group/seek">
                <input
                  type="range"
                  min={0}
                  max={duration || 100}
                  step={0.5}
                  value={currentTime}
                  onChange={handleSeek}
                  className="w-full h-1 bg-white/15 rounded-lg appearance-none cursor-pointer accent-amber-400 hover:h-1.5 transition-all"
                />
              </div>
              <span className="w-9 text-left tabular-nums">{formatTime(duration)}</span>
            </div>
          </div>

          {/* Right: Equalizer, Volume Slider & Close Button */}
          <div className="flex items-center gap-3 w-1/4 justify-end">
            <button
              type="button"
              onClick={toggleMute}
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
              title={effectiveIsMuted || effectiveVolume === 0 ? 'Bật âm thanh' : 'Tắt âm thanh'}
            >
              {effectiveIsMuted || effectiveVolume === 0 ? (
                <VolumeX className="w-4 h-4 text-rose-400" />
              ) : (
                <Volume2 className="w-4 h-4 text-gray-300" />
              )}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={effectiveIsMuted ? 0 : effectiveVolume}
              onChange={handleVolumeChange}
              className="w-20 h-1 bg-white/15 rounded-lg appearance-none cursor-pointer accent-amber-400 hover:h-1.5 transition-all"
              title={`Âm lượng: ${Math.round((effectiveIsMuted ? 0 : effectiveVolume) * 100)}%`}
            />

            {/* Maximize to Turntable shortcut */}
            {onNavigateToTrack && (
              <button
                type="button"
                onClick={onNavigateToTrack}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors ml-1"
                title="Mở toàn màn hình trình phát"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-rose-400 hover:bg-white/10 transition-colors ml-1"
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
