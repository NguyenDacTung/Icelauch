import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Maximize,
  Minimize,
  ExternalLink,
  Volume2,
  VolumeX,
  Sparkles,
  Tv
} from 'lucide-react';
import { parseMediaUrl, getActiveProxyPort } from '../../utils/mediaUrl';
import type { MediaItem } from '../../types';
import { sfx } from '../../utils/sfx';

interface TVVideoTheaterViewProps {
  media: MediaItem;
  onBack: () => void;
  onUpdateProgress?: (id: string, position: number, watched: boolean) => void;
}

export const TVVideoTheaterView: React.FC<TVVideoTheaterViewProps> = ({
  media,
  onBack,
  onUpdateProgress,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [isPlaying, setIsPlaying] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState(media.lastPosition || 0);
  const [duration, setDuration] = useState(0);
  const [playbackMode, setPlaybackMode] = useState<'proxy' | 'direct'>('proxy');
  const [showControls, setShowControls] = useState(true);
  const hideControlsTimer = useRef<NodeJS.Timeout | null>(null);

  const parsed = parseMediaUrl(media.link);
  const isYouTube = parsed.kind === 'youtube' && parsed.id;
  const isGoogleDrive = parsed.kind === 'gdrive' && parsed.id;
  const proxyUrl = parsed.id ? `http://127.0.0.1:${getActiveProxyPort()}/drive/${parsed.id}` : null;

  // Auto-hide controls after 4s
  const triggerControls = () => {
    setShowControls(true);
    if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current);
    hideControlsTimer.current = setTimeout(() => {
      setShowControls(false);
    }, 4500);
  };

  useEffect(() => {
    triggerControls();
    return () => {
      if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current);
    };
  }, []);

  const togglePlay = () => {
    sfx.playClick();
    triggerControls();
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play().catch(console.warn);
        setIsPlaying(true);
      }
    }
  };

  const seekDelta = (seconds: number) => {
    sfx.playClick();
    triggerControls();
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, Math.min(duration, videoRef.current.currentTime + seconds));
    }
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const cur = videoRef.current.currentTime;
    const dur = videoRef.current.duration || 0;
    setCurrentTime(cur);
    setDuration(dur);
    if (Math.floor(cur) % 5 === 0 && dur > 0) {
      onUpdateProgress?.(media.id, cur, cur / dur > 0.9);
    }
  };

  const formatTime = (secs: number) => {
    if (!secs || isNaN(secs)) return '00:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={triggerControls}
      onClick={triggerControls}
      className="relative w-full h-full bg-black flex items-center justify-center overflow-hidden select-none"
    >
      {/* 1. ACTUAL VIDEO OR YOUTUBE IFRAME */}
      {media.localFilePath ? (
        <video
          ref={videoRef}
          src={`atom://${media.localFilePath}`}
          controls={false}
          autoPlay
          onTimeUpdate={handleTimeUpdate}
          className="w-full h-full object-contain"
        />
      ) : isYouTube ? (
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${parsed.id}?autoplay=1&rel=0&playsinline=1&enablejsapi=1`}
          title={media.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full border-0 absolute inset-0"
        />
      ) : isGoogleDrive && playbackMode === 'proxy' && proxyUrl ? (
        <video
          ref={videoRef}
          src={proxyUrl}
          controls={false}
          autoPlay
          onTimeUpdate={handleTimeUpdate}
          className="w-full h-full object-contain"
        />
      ) : isGoogleDrive ? (
        <iframe
          src={parsed.embedUrl || media.link}
          title={media.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full border-0 absolute inset-0"
        />
      ) : (
        <video
          ref={videoRef}
          src={parsed.directUrl || media.link}
          controls={false}
          autoPlay
          onTimeUpdate={handleTimeUpdate}
          className="w-full h-full object-contain"
        />
      )}

      {/* 2. ON-SCREEN TV CONTROL OVERLAY (D-PAD & REMOTE FRIENDLY) */}
      <div
        className={`absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/80 flex flex-col justify-between p-8 transition-opacity duration-300 z-30 ${
          showControls ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Top Header Bar */}
        <div className="flex items-center justify-between">
          <button
            data-tv-focus="player-back"
            type="button"
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-amber-400 hover:text-black text-white text-xs font-bold backdrop-blur-md border border-white/15 outline-none focus:ring-4 focus:ring-amber-400 focus:scale-105 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay lại TV</span>
          </button>

          <h2 className="text-base font-black text-white drop-shadow truncate max-w-xl">
            {media.title}
          </h2>

          <div className="flex items-center gap-2">
            {isGoogleDrive && (
              <button
                data-tv-focus="player-mode-toggle"
                type="button"
                onClick={() => setPlaybackMode(playbackMode === 'proxy' ? 'direct' : 'proxy')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all outline-none focus:ring-4 focus:ring-amber-400 ${
                  playbackMode === 'proxy'
                    ? 'bg-amber-500 text-black border-amber-400'
                    : 'bg-white/10 text-white border-white/20'
                }`}
              >
                {playbackMode === 'proxy' ? '🚀 Stream Proxy VIP' : '🌐 Drive Direct'}
              </button>
            )}

            <button
              data-tv-focus="player-external"
              type="button"
              onClick={() => window.open(media.link, '_blank')}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/15 outline-none focus:ring-4 focus:ring-amber-400"
              title="Mở trình duyệt ngoài"
            >
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Center Big Play/Pause & Seek Buttons */}
        <div className="flex items-center justify-center gap-8">
          <button
            data-tv-focus="player-rewind"
            type="button"
            onClick={() => seekDelta(-10)}
            className="w-14 h-14 rounded-2xl bg-white/15 hover:bg-white/30 text-white flex items-center justify-center backdrop-blur-md border border-white/20 outline-none focus:ring-4 focus:ring-amber-400 focus:scale-110 transition-all shadow-xl"
            title="Tua lại 10 giây"
          >
            <RotateCcw className="w-6 h-6" />
          </button>

          <button
            data-tv-focus="player-play-toggle"
            type="button"
            onClick={togglePlay}
            className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-500 to-amber-300 text-black flex items-center justify-center shadow-2xl outline-none focus:ring-4 focus:ring-amber-400 focus:scale-110 transition-all active:scale-95"
          >
            {isPlaying ? (
              <Pause className="w-8 h-8 fill-black" />
            ) : (
              <Play className="w-8 h-8 fill-black ml-1" />
            )}
          </button>

          <button
            data-tv-focus="player-forward"
            type="button"
            onClick={() => seekDelta(10)}
            className="w-14 h-14 rounded-2xl bg-white/15 hover:bg-white/30 text-white flex items-center justify-center backdrop-blur-md border border-white/20 outline-none focus:ring-4 focus:ring-amber-400 focus:scale-110 transition-all shadow-xl"
            title="Tua tới 10 giây"
          >
            <RotateCw className="w-6 h-6" />
          </button>
        </div>

        {/* Bottom Scrubber & Time */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-white/80">{formatTime(currentTime)}</span>
            <div className="flex-1 h-2 bg-white/20 rounded-full overflow-hidden relative">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-amber-300 transition-all duration-200"
                style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
              />
            </div>
            <span className="text-xs font-mono text-white/80">{formatTime(duration)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
