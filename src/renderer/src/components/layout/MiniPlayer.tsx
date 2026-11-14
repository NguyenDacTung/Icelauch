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
  X 
} from 'lucide-react';
import type { MediaItem } from '../../types';

interface MiniPlayerProps {
  currentTrack: MediaItem | null;
  playlist: MediaItem[];
  isPlaying: boolean;
  isTurntableActive?: boolean;
  onPlayPause: () => void;
  onNext: () => void;
  onPrev: () => void;
  onClose: () => void;
  onTrackProgress: (position: number) => void;
}

export const MiniPlayer: React.FC<MiniPlayerProps> = ({
  currentTrack,
  isPlaying,
  isTurntableActive = false,
  onPlayPause,
  onNext,
  onPrev,
  onClose,
  onTrackProgress,
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolume] = useState<number>(0.8);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isRepeat, setIsRepeat] = useState<boolean>(false);
  const [isShuffle, setIsShuffle] = useState<boolean>(false);
  const [audioSrc, setAudioSrc] = useState<string>(currentTrack?.link || '');

  useEffect(() => {
    if (!currentTrack) return;
    if (window.api && (currentTrack.link.includes('drive.google.com') || currentTrack.link.includes('drive.usercontent.google.com'))) {
      window.api.getStreamUrl(currentTrack.link).then((proxyUrl: string) => {
        setAudioSrc(proxyUrl);
      }).catch(() => {
        setAudioSrc(currentTrack.link);
      });
    } else {
      setAudioSrc(currentTrack.link);
    }
  }, [currentTrack?.id, currentTrack?.link]);

  useEffect(() => {
    if (audioRef.current) {
      if (isTurntableActive) {
        audioRef.current.pause();
        return;
      }
      if (isPlaying && currentTrack) {
        audioRef.current.play().catch((e) => console.warn('Audio play error:', e));
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, currentTrack, audioSrc, isTurntableActive]);

  useEffect(() => {
    if (audioRef.current && currentTrack?.lastPosition) {
      audioRef.current.currentTime = currentTrack.lastPosition;
    }
  }, [currentTrack?.id]);

  if (!currentTrack) return null;

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const cur = audioRef.current.currentTime;
      setCurrentTime(cur);
      onTrackProgress(cur);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration || 0);
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
    if (audioRef.current) {
      audioRef.current.volume = val;
    }
    if (val > 0) setIsMuted(false);
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const formatTime = (secs: number) => {
    if (!secs || isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="h-16 bg-[#12141A] border-t border-ice-border px-6 flex items-center justify-between z-40 select-none shadow-2xl">
      <audio
        ref={audioRef}
        src={audioSrc || currentTrack.link}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={onNext}
        loop={isRepeat}
      />

      {/* Track Info */}
      <div className="flex items-center gap-3 w-1/4 min-w-[200px]">
        {currentTrack.coverPath ? (
          <img
            src={currentTrack.coverPath}
            alt={currentTrack.title}
            className="w-10 h-10 object-cover rounded shadow-md border border-ice-border"
          />
        ) : (
          <div className="w-10 h-10 rounded bg-ice-card border border-ice-border flex items-center justify-center text-ice-accent">
            <Music className="w-5 h-5" />
          </div>
        )}
        <div className="min-w-0">
          <p className="text-xs font-semibold text-white truncate">{currentTrack.title}</p>
          <p className="text-[11px] text-ice-subtext truncate">{currentTrack.category || 'Audio'}</p>
        </div>
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
          {isMuted || volume === 0 ? <VolumeX className="w-4 h-4 text-ice-error" /> : <Volume2 className="w-4 h-4" />}
        </button>
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={isMuted ? 0 : volume}
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
  );
};

