import React, { useRef, useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Minimize, 
  RotateCcw, 
  ArrowLeft, 
  Clock, 
  Gauge,
  Film,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { parseMediaUrl } from '../../utils/mediaUrl';
import type { MediaItem } from '../../types';

interface VideoPlayerModalProps {
  media: MediaItem | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateProgress: (mediaId: string, position: number, watched: boolean) => void;
}

export const VideoPlayerModal: React.FC<VideoPlayerModalProps> = ({
  media,
  isOpen,
  onClose,
  onUpdateProgress,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.9);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [resumePrompt, setResumePrompt] = useState<{ show: boolean; position: number }>({ show: false, position: 0 });
  const [proxyUrl, setProxyUrl] = useState<string>('');
  const [playerMode, setPlayerMode] = useState<'stream' | 'native'>('stream'); // For Google Drive: 'stream' (preview embed) or 'native' (proxy HTML5)

  const controlsTimeoutRef = useRef<any>(null);

  const parsed = media ? parseMediaUrl(media.link) : null;

  useEffect(() => {
    if (isOpen && media) {
      if (media.lastPosition && media.lastPosition > 10 && !media.watched) {
        setResumePrompt({ show: true, position: media.lastPosition });
      } else {
        setResumePrompt({ show: false, position: 0 });
      }

      // If it's a direct or gdrive link, get proxy stream url
      if (window.api && parsed?.kind !== 'youtube') {
        window.api.getStreamUrl(media.link).then((url: string) => {
          setProxyUrl(url);
        });
      }

      setIsPlaying(true);
    } else {
      setIsPlaying(false);
      setProxyUrl('');
    }
  }, [isOpen, media?.id]);

  // Auto-hide controls
  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 3000);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (parsed?.kind === 'youtube' || (parsed?.kind === 'gdrive' && playerMode === 'stream')) {
        // If iframe is playing, Esc closes modal
        if (e.code === 'Escape') onClose();
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        seekDelta(10);
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        seekDelta(-10);
      } else if (e.code === 'KeyF') {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.code === 'KeyM') {
        e.preventDefault();
        toggleMute();
      } else if (e.code === 'Escape') {
        if (isFullscreen) {
          document.exitFullscreen?.();
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isPlaying, isFullscreen, volume, isMuted, parsed?.kind, playerMode]);

  if (!isOpen || !media || !parsed) return null;

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play().catch(e => console.warn(e));
        setIsPlaying(true);
      }
    }
  };

  const seekDelta = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, Math.min(duration, videoRef.current.currentTime + seconds));
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen?.().then(() => setIsFullscreen(true));
    } else {
      document.exitFullscreen?.().then(() => setIsFullscreen(false));
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const cur = videoRef.current.currentTime;
      setCurrentTime(cur);

      const watched = duration > 0 && cur / duration >= 0.95;
      onUpdateProgress(media.id, cur, watched);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration || 0);
    }
  };

  const handleResume = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = resumePrompt.position;
      videoRef.current.play().catch(e => console.warn(e));
      setIsPlaying(true);
    }
    setResumePrompt({ show: false, position: 0 });
  };

  const formatTime = (secs: number) => {
    if (!secs || isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const speedOptions = [0.5, 0.75, 1, 1.25, 1.5, 2];

  // Determine if using iframe (YouTube or Google Drive stream mode)
  const isYouTube = parsed.kind === 'youtube';
  const isGoogleDriveStream = parsed.kind === 'gdrive' && playerMode === 'stream';

  return (
    <div 
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="fixed inset-0 z-50 bg-black flex items-center justify-center select-none overflow-hidden"
    >
      {/* 1. YOUTUBE EMBEDDED PLAYER */}
      {isYouTube && (
        <div className="w-full h-full relative">
          <iframe
            src={parsed.embedUrl}
            title={media.title}
            referrerPolicy="strict-origin-when-cross-origin"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="w-full h-full border-0"
          />
        </div>
      )}

      {/* 2. GOOGLE DRIVE ADAPTIVE STREAM PLAYER (Best for 1.5h+ 1080p) */}
      {isGoogleDriveStream && (
        <div className="w-full h-full relative">
          <iframe
            src={parsed.embedUrl}
            title={media.title}
            referrerPolicy="strict-origin-when-cross-origin"
            allow="autoplay; fullscreen"
            allowFullScreen
            className="w-full h-full border-0"
          />
        </div>
      )}

      {/* 3. HTML5 DIRECT VIDEO PLAYER (For raw MP4 or Drive Proxy mode) */}
      {!isYouTube && !isGoogleDriveStream && (
        <video
          ref={videoRef}
          src={proxyUrl || media.link}
          autoPlay
          playsInline
          preload="auto"
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onClick={togglePlay}
          className="w-full h-full object-contain cursor-pointer"
        />
      )}

      {/* Resume from last position banner (For HTML5 video mode) */}
      {resumePrompt.show && !isYouTube && !isGoogleDriveStream && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 bg-ice-card/95 border border-ice-accent/60 px-5 py-3 rounded-xl shadow-2xl flex items-center gap-4 z-50 animate-in fade-in slide-in-from-top-3">
          <Clock className="w-4 h-4 text-ice-accent" />
          <span className="text-xs text-white">
            Xem tiếp từ <strong className="text-ice-accent">{formatTime(resumePrompt.position)}</strong>?
          </span>
          <button
            onClick={handleResume}
            className="px-3 py-1 rounded bg-ice-accent hover:bg-ice-accentHover text-white text-xs font-bold transition-colors"
          >
            Xem tiếp
          </button>
          <button
            onClick={() => setResumePrompt({ show: false, position: 0 })}
            className="text-xs text-ice-subtext hover:text-white transition-colors"
          >
            Từ đầu
          </button>
        </div>
      )}

      {/* Top Header Overlay */}
      <div 
        className={`absolute top-0 left-0 right-0 p-5 bg-gradient-to-b from-black/80 to-transparent flex items-center justify-between transition-opacity duration-300 z-40 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <button
          onClick={onClose}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/60 hover:bg-black/80 text-white/90 hover:text-white text-xs font-semibold backdrop-blur-sm border border-white/20 transition-colors shadow-lg"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại</span>
        </button>

        <div className="flex items-center gap-3 max-w-lg">
          <h2 className="text-sm font-bold text-white drop-shadow truncate">
            {media.title}
          </h2>
          {isYouTube && (
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-600 text-white flex-shrink-0">
              YouTube 4K
            </span>
          )}
          {parsed.kind === 'gdrive' && (
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-ice-accent/30 text-ice-accent border border-ice-accent/50 flex-shrink-0">
              Google Drive 1080p
            </span>
          )}
        </div>

        {/* Right switch: For Google Drive links, allow switching between Stream & Native HTML5 */}
        <div className="flex items-center gap-2">
          {parsed.kind === 'gdrive' && (
            <button
              onClick={() => setPlayerMode(playerMode === 'stream' ? 'native' : 'stream')}
              className="px-2.5 py-1 rounded bg-black/60 border border-white/20 text-ice-text hover:text-white text-[11px] font-medium transition-colors"
              title="Đổi chế độ phát Google Drive"
            >
              {playerMode === 'stream' ? 'Chuyển sang HTML5 Proxy' : 'Chuyển sang Google Stream'}
            </button>
          )}

          <button
            onClick={() => window.open(media.link, '_blank')}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-black/60 border border-white/20 text-ice-text hover:text-white text-[11px] font-medium transition-colors"
            title="Mở link nguồn trên trình duyệt"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Mở trình duyệt</span>
          </button>

          {(isYouTube || isGoogleDriveStream) && (
            <button
              onClick={toggleFullscreen}
              className="p-1.5 rounded bg-black/60 border border-white/20 text-white hover:bg-black/80"
              title="Toàn màn hình"
            >
              <Maximize className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Bottom Controls Bar overlay (For native HTML5 player) */}
      {!isYouTube && !isGoogleDriveStream && (
        <div 
          className={`absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex flex-col gap-3 transition-opacity duration-300 z-40 ${
            showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          {/* Seekbar */}
          <div className="flex items-center gap-3 text-xs text-white/80 font-mono">
            <span>{formatTime(currentTime)}</span>
            <input
              type="range"
              min={0}
              max={duration || 100}
              step={0.5}
              value={currentTime}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                if (videoRef.current) {
                  videoRef.current.currentTime = val;
                  setCurrentTime(val);
                }
              }}
              className="flex-1 h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-ice-accent"
            />
            <span>{formatTime(duration)}</span>
          </div>

          {/* Control Buttons */}
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center gap-4">
              <button
                onClick={togglePlay}
                className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
              >
                {isPlaying ? <Pause className="w-5 h-5 fill-white" /> : <Play className="w-5 h-5 fill-white ml-0.5" />}
              </button>

              <button
                onClick={() => seekDelta(-10)}
                className="text-white/70 hover:text-white transition-colors"
                title="Lùi 10 giây"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              {/* Volume */}
              <div className="flex items-center gap-2">
                <button onClick={toggleMute} className="text-white/70 hover:text-white transition-colors">
                  {isMuted || volume === 0 ? <VolumeX className="w-5 h-5 text-ice-error" /> : <Volume2 className="w-5 h-5" />}
                </button>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={isMuted ? 0 : volume}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setVolume(val);
                    if (videoRef.current) videoRef.current.volume = val;
                    if (val > 0) setIsMuted(false);
                  }}
                  className="w-20 h-1 bg-white/30 rounded appearance-none cursor-pointer accent-ice-accent"
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Speed selector */}
              <div className="flex items-center gap-1.5 text-xs text-white/80">
                <Gauge className="w-4 h-4 text-white/60" />
                <select
                  value={playbackRate}
                  onChange={(e) => {
                    const rate = parseFloat(e.target.value);
                    setPlaybackRate(rate);
                    if (videoRef.current) videoRef.current.playbackRate = rate;
                  }}
                  className="bg-black/40 border border-white/20 rounded px-2 py-1 text-xs text-white focus:outline-none cursor-pointer"
                >
                  {speedOptions.map((rate) => (
                    <option key={rate} value={rate} className="bg-ice-card text-white">
                      {rate}x
                    </option>
                  ))}
                </select>
              </div>

              {/* Fullscreen */}
              <button
                onClick={toggleFullscreen}
                className="p-1.5 text-white/70 hover:text-white transition-colors"
                title={isFullscreen ? 'Thu nhỏ' : 'Toàn màn hình (F)'}
              >
                {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
