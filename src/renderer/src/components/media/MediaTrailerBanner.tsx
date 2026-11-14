import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  SkipForward,
  RotateCw,
  Shuffle,
  Repeat,
  Film,
  Sparkles,
  Maximize2,
  Tv,
  Layers,
  ChevronRight,
  ChevronLeft,
  Pin,
  ExternalLink
} from 'lucide-react';
import { parseMediaUrl, getActiveProxyPort } from '../../utils/mediaUrl';
import { detectHardwareDevice, isAndroidMobile, isAndroidTV, type DeviceType } from '../../utils/deviceDetector';
import type { TrailerItem, TrailerSettings } from '../../types';
import { sfx } from '../../utils/sfx';

export interface MediaTrailerBannerProps {
  trailers?: TrailerItem[];
  settings?: TrailerSettings;
  deviceType?: DeviceType;
  onSelectMedia?: (mediaId: string) => void;
  onTrailerChange?: (trailer: TrailerItem) => void;
  className?: string;
  aspectRatio?: '21:9' | '16:9';
  autoPlay?: boolean;
  defaultMuted?: boolean;
}

export const MediaTrailerBanner: React.FC<MediaTrailerBannerProps> = ({
  trailers: propTrailers,
  settings,
  deviceType,
  onSelectMedia,
  onTrailerChange,
  className = '',
  aspectRatio: defaultAspectRatio,
  autoPlay = true,
  defaultMuted = true,
}) => {
  // 1. Resolve configuration and trailer list
  const isEnabled = settings?.enabled ?? true;
  const activeTrailers = (propTrailers && propTrailers.length > 0)
    ? propTrailers
    : (settings?.trailers || []);

  const effectiveDevice: DeviceType = deviceType || detectHardwareDevice();
  const isMobile = isAndroidMobile(effectiveDevice);
  const isTV = isAndroidTV(effectiveDevice);
  const isPC = !isMobile && !isTV;

  // Active trailer & playback state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isMuted, setIsMuted] = useState(defaultMuted);
  const [playbackMode, setPlaybackMode] = useState<'auto-next' | 'loop' | 'shuffle'>(
    settings?.playbackMode || 'auto-next'
  );
  const [aspectRatio, setAspectRatio] = useState<'21:9' | '16:9'>(
    defaultAspectRatio || (isPC ? '21:9' : '16:9')
  );

  // Non-seekable progress visualization (ambient, no scrubber/seeking)
  const [progressPercent, setProgressPercent] = useState(0);
  const [currentTimeText, setCurrentTimeText] = useState('0:00');
  const [durationText, setDurationText] = useState('0:00');

  // Viewport intersection observer (auto pause & mute on scroll away)
  const [isIntersecting, setIsIntersecting] = useState(true);
  const wasPlayingBeforeScrollRef = useRef<boolean>(autoPlay);
  const wasMutedBeforeScrollRef = useRef<boolean>(defaultMuted);

  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const thumbnailsScrollRef = useRef<HTMLDivElement>(null);

  // Sync settings playbackMode changes
  useEffect(() => {
    if (settings?.playbackMode) {
      setPlaybackMode(settings.playbackMode);
    }
  }, [settings?.playbackMode]);

  // Keep index within bounds
  useEffect(() => {
    if (currentIndex >= activeTrailers.length && activeTrailers.length > 0) {
      setCurrentIndex(0);
    }
  }, [activeTrailers.length, currentIndex]);

  const currentTrailer: TrailerItem | undefined = activeTrailers[currentIndex];

  // Notify parent of trailer change
  useEffect(() => {
    if (currentTrailer && onTrailerChange) {
      onTrailerChange(currentTrailer);
    }
  }, [currentTrailer, onTrailerChange]);

  // 2. IntersectionObserver setup: auto-pause and mute when scrolled out of view
  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        // Visible if at least 25% is in view
        const visible = entry.isIntersecting && entry.intersectionRatio >= 0.25;
        setIsIntersecting(visible);
      },
      { threshold: [0, 0.25, 0.5, 0.75, 1.0] }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // React to viewport intersection visibility changes
  useEffect(() => {
    if (!isIntersecting) {
      // Scrolled out of view: Auto-pause & mute
      if (isPlaying) {
        wasPlayingBeforeScrollRef.current = true;
        setIsPlaying(false);
      }
      if (!isMuted) {
        wasMutedBeforeScrollRef.current = false;
        setIsMuted(true);
      }
    } else {
      // Scrolled back into view: resume if was playing before scroll
      if (wasPlayingBeforeScrollRef.current) {
        wasPlayingBeforeScrollRef.current = false;
        setIsPlaying(true);
      }
      if (wasMutedBeforeScrollRef.current === false) {
        wasMutedBeforeScrollRef.current = true;
        setIsMuted(false);
      }
    }
  }, [isIntersecting, isPlaying, isMuted]);

  // 3. YouTube Embed & Direct Video Detection
  const parsed = currentTrailer ? parseMediaUrl(currentTrailer.videoUrl) : null;
  const isYouTube = parsed?.kind === 'youtube' && Boolean(parsed.id);

  // YouTube postMessage command dispatcher
  const sendYouTubeCommand = useCallback((func: string, args: any = '') => {
    if (!iframeRef.current || !iframeRef.current.contentWindow) return;
    try {
      iframeRef.current.contentWindow.postMessage(
        JSON.stringify({ event: 'command', func, args }),
        '*'
      );
    } catch {
      // Ignore cross-origin postMessage errors
    }
  }, []);

  // Helper format seconds to mm:ss
  const formatTime = (seconds: number): string => {
    if (!seconds || isNaN(seconds) || seconds < 0) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Next Trailer Navigation
  const handleNextTrailer = useCallback((fromAutoEnd: boolean = false) => {
    if (activeTrailers.length === 0) return;

    // Single trailer loop handling
    if (activeTrailers.length === 1) {
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
        videoRef.current.play().catch(() => {});
      } else if (isYouTube) {
        sendYouTubeCommand('seekTo', [0, true]);
        sendYouTubeCommand('playVideo');
      }
      return;
    }

    if (fromAutoEnd && playbackMode === 'loop') {
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
        videoRef.current.play().catch(() => {});
      } else if (isYouTube) {
        sendYouTubeCommand('seekTo', [0, true]);
        sendYouTubeCommand('playVideo');
      }
      return;
    }

    if (playbackMode === 'shuffle') {
      let nextIdx = Math.floor(Math.random() * activeTrailers.length);
      if (nextIdx === currentIndex && activeTrailers.length > 1) {
        nextIdx = (currentIndex + 1) % activeTrailers.length;
      }
      setCurrentIndex(nextIdx);
    } else {
      // auto-next or manual next
      setCurrentIndex((prev) => (prev + 1) % activeTrailers.length);
    }
    setProgressPercent(0);
  }, [activeTrailers.length, playbackMode, currentIndex, isYouTube, sendYouTubeCommand]);

  // Previous Trailer Navigation
  const handlePrevTrailer = useCallback(() => {
    if (activeTrailers.length <= 1) return;
    sfx.playClick();
    setCurrentIndex((prev) => (prev - 1 + activeTrailers.length) % activeTrailers.length);
    setProgressPercent(0);
  }, [activeTrailers.length]);

  // Toggle Play / Pause
  const handleTogglePlay = () => {
    sfx.playClick();
    const nextState = !isPlaying;
    setIsPlaying(nextState);
    if (isYouTube) {
      sendYouTubeCommand(nextState ? 'playVideo' : 'pauseVideo');
    } else if (videoRef.current) {
      if (nextState) {
        videoRef.current.play().catch(() => {});
      } else {
        videoRef.current.pause();
      }
    }
  };

  // Toggle Mute / Unmute
  const handleToggleMute = () => {
    sfx.playClick();
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    if (isYouTube) {
      sendYouTubeCommand(nextMute ? 'mute' : 'unMute');
    } else if (videoRef.current) {
      videoRef.current.muted = nextMute;
    }
  };

  // Cycle Playback Mode
  const cyclePlaybackMode = () => {
    sfx.playClick();
    const modes: ('auto-next' | 'loop' | 'shuffle')[] = ['auto-next', 'loop', 'shuffle'];
    const nextIdx = (modes.indexOf(playbackMode) + 1) % modes.length;
    setPlaybackMode(modes[nextIdx]);
  };

  // Listen to YouTube state changes via postMessage
  useEffect(() => {
    if (!isYouTube) return;

    const handleMessage = (event: MessageEvent) => {
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (data?.event === 'onStateChange') {
          // YT.PlayerState: 0 = ENDED, 1 = PLAYING, 2 = PAUSED
          if (data.info === 0) {
            handleNextTrailer(true);
          } else if (data.info === 1) {
            setIsPlaying(true);
          } else if (data.info === 2) {
            setIsPlaying(false);
          }
        }
        if (data?.event === 'infoDelivery' && data?.info?.currentTime && data?.info?.duration) {
          const ct = data.info.currentTime;
          const dur = data.info.duration;
          setCurrentTimeText(formatTime(ct));
          setDurationText(formatTime(dur));
          setProgressPercent(Math.min(100, (ct / dur) * 100));
        }
      } catch {
        // Ignored
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [isYouTube, handleNextTrailer]);

  // Synchronize HTML5 video play/pause & mute states
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
      if (isPlaying && isIntersecting) {
        videoRef.current.play().catch(() => {});
      } else {
        videoRef.current.pause();
      }
    }
  }, [isPlaying, isMuted, isIntersecting, currentIndex]);

  // Scroll active thumbnail into view
  useEffect(() => {
    if (!thumbnailsScrollRef.current) return;
    const activeEl = thumbnailsScrollRef.current.children[currentIndex] as HTMLElement;
    if (activeEl) {
      activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [currentIndex]);

  if (!isEnabled || activeTrailers.length === 0 || !currentTrailer) {
    return null;
  }

  // Construct YouTube URL with parameters
  const ytVideoId = isYouTube ? parsed!.id : '';
  const port = getActiveProxyPort();
  const ytSrc = isYouTube
    ? `http://127.0.0.1:${port}/youtube/${ytVideoId}?autoplay=${isPlaying && isIntersecting ? 1 : 0}&mute=${isMuted ? 1 : 0}`
    : '';
  const fallbackYtSrc = isYouTube
    ? `https://www.youtube-nocookie.com/embed/${ytVideoId}?autoplay=${isPlaying && isIntersecting ? 1 : 0}&mute=${isMuted ? 1 : 0}&controls=0&disablekb=1&modestbranding=1&rel=0&iv_load_policy=3&playsinline=1&enablejsapi=1`
    : '';

  // Aspect ratio class selection
  const aspectClass = isTV
    ? 'aspect-video'
    : isMobile
    ? 'aspect-video'
    : aspectRatio === '21:9'
    ? 'aspect-[21/9] min-h-[360px] max-h-[580px]'
    : 'aspect-video max-h-[560px]';

  return (
    <div
      ref={containerRef}
      className={`relative w-full rounded-2xl md:rounded-3xl overflow-hidden bg-[#0A0C10] border border-ice-border/60 shadow-2xl group/trailer select-none ${aspectClass} ${className}`}
      data-testid="media-trailer-banner"
    >
      {/* 1. CINEMATIC VIDEO STAGE (Non-seekable) */}
      <div className="absolute inset-0 w-full h-full overflow-hidden bg-black flex items-center justify-center">
        {isYouTube ? (
          <iframe
            ref={iframeRef}
            key={`yt-${currentTrailer.id}-${currentIndex}`}
            src={ytSrc}
            title={currentTrailer.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            className="w-full h-full object-cover scale-[1.04] pointer-events-none transition-opacity duration-700"
            onError={(e) => {
              // Fallback to youtube-nocookie embed if local proxy bridge is unavailable
              (e.currentTarget as HTMLIFrameElement).src = fallbackYtSrc;
            }}
          />
        ) : (
          <video
            ref={videoRef}
            key={`video-${currentTrailer.id}-${currentIndex}`}
            src={currentTrailer.videoUrl.startsWith('file:') || currentTrailer.videoUrl.startsWith('http') ? currentTrailer.videoUrl : `file://${currentTrailer.videoUrl}`}
            playsInline
            autoPlay={isPlaying && isIntersecting}
            muted={isMuted}
            controls={false} // Non-seekable teaser player: no seek bar or scrubber
            onEnded={() => handleNextTrailer(true)}
            onTimeUpdate={() => {
              if (videoRef.current) {
                const ct = videoRef.current.currentTime;
                const dur = videoRef.current.duration || 1;
                setCurrentTimeText(formatTime(ct));
                setDurationText(formatTime(dur));
                setProgressPercent(Math.min(100, (ct / dur) * 100));
              }
            }}
            className="w-full h-full object-cover"
          />
        )}

        {/* Ambient Gradient Masks for Cinematic Depth and Text Legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0D14] via-[#0A0D14]/40 to-black/30 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0A0D14]/90 via-[#0A0D14]/30 to-transparent w-full md:w-3/4 pointer-events-none" />
      </div>

      {/* 2. TOP METADATA & STATUS BAR */}
      <div className="absolute top-3 left-3 right-3 md:top-5 md:left-6 md:right-6 z-20 flex items-center justify-between gap-2 pointer-events-auto">
        {/* Left Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Live Teaser Status Pill */}
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] md:text-xs font-black uppercase tracking-wider bg-red-600/90 text-white shadow-lg backdrop-blur-md border border-red-400/40">
            <span className={`w-2 h-2 rounded-full bg-white ${isPlaying && isIntersecting ? 'animate-ping' : ''}`} />
            <span>CINEMA TEASER</span>
          </span>

          {/* Genre / Tag Badge */}
          {currentTrailer.tag && (
            <span className="px-2.5 py-1 rounded-full text-[10px] md:text-xs font-bold bg-white/10 hover:bg-white/20 text-cyan-300 backdrop-blur-md border border-cyan-500/30 transition-colors">
              {currentTrailer.tag}
            </span>
          )}

          {/* Pinned Trailer Badge */}
          {currentTrailer.isPinned && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
              <Pin className="w-3 h-3 fill-amber-400" />
              <span>Ghim</span>
            </span>
          )}

          {/* TV Indicator */}
          {isTV && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              <Tv className="w-3 h-3" />
              <span>TV Leanback</span>
            </span>
          )}
        </div>

        {/* Right Header Options (PC / Responsive Extras) */}
        <div className="flex items-center gap-2">
          {/* Playback Mode Switcher */}
          <button
            type="button"
            onClick={cyclePlaybackMode}
            title={`Chế độ phát: ${
              playbackMode === 'auto-next' ? 'Tự chuyển tiếp' : playbackMode === 'loop' ? 'Lặp lại' : 'Ngẫu nhiên'
            }`}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/50 hover:bg-black/70 text-white/90 hover:text-white text-[11px] font-medium backdrop-blur-md border border-white/10 transition-colors shadow-md"
          >
            {playbackMode === 'auto-next' && <RotateCw className="w-3.5 h-3.5 text-cyan-400" />}
            {playbackMode === 'loop' && <Repeat className="w-3.5 h-3.5 text-amber-400" />}
            {playbackMode === 'shuffle' && <Shuffle className="w-3.5 h-3.5 text-purple-400" />}
            <span className="hidden sm:inline capitalize font-mono text-[10px]">
              {playbackMode === 'auto-next' ? 'Auto-Next' : playbackMode === 'loop' ? 'Loop' : 'Shuffle'}
            </span>
          </button>

          {/* PC Aspect Ratio Switcher (21:9 Widescreen vs 16:9 Standard) */}
          {isPC && (
            <button
              type="button"
              onClick={() => {
                sfx.playClick();
                setAspectRatio((prev) => (prev === '21:9' ? '16:9' : '21:9'));
              }}
              title={aspectRatio === '21:9' ? 'Chuyển sang chuẩn 16:9' : 'Chuyển sang rạp chiếu 21:9'}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/50 hover:bg-black/70 text-white/80 hover:text-white text-[11px] font-medium backdrop-blur-md border border-white/10 transition-colors shadow-md"
            >
              <Maximize2 className="w-3.5 h-3.5 text-ice-accent" />
              <span className="font-mono text-[10px]">{aspectRatio}</span>
            </button>
          )}

          {/* Trailer Counter */}
          {activeTrailers.length > 1 && (
            <span className="px-2 py-1 rounded-lg bg-black/50 text-white/70 text-[10px] font-mono backdrop-blur-md border border-white/10">
              {currentIndex + 1} / {activeTrailers.length}
            </span>
          )}
        </div>
      </div>

      {/* 3. CENTER / BOTTOM METADATA & PLAYER CONTROLS */}
      <div className="absolute bottom-4 left-3 right-3 md:bottom-6 md:left-6 md:right-6 z-20 flex flex-col md:flex-row md:items-end justify-between gap-4 pointer-events-auto">
        {/* Left: Trailer Info & Action Button */}
        <div className="space-y-2 max-w-xl">
          <h2 className="text-xl md:text-3xl lg:text-4xl font-black text-white leading-tight drop-shadow-xl line-clamp-2">
            {currentTrailer.title}
          </h2>

          <div className="flex items-center gap-3">
            {/* Associated Media Link button */}
            {currentTrailer.mediaId && onSelectMedia && (
              <button
                type="button"
                onClick={() => {
                  sfx.playClick();
                  onSelectMedia(currentTrailer.mediaId!);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-black font-extrabold text-xs shadow-lg shadow-amber-500/25 transition-all active:scale-95"
              >
                <Film className="w-3.5 h-3.5 fill-black" />
                <span>Xem Chi Tiết Phim</span>
              </button>
            )}

            {/* Non-seekable Elapsed Time Indicator */}
            {(currentTimeText !== '0:00' || durationText !== '0:00') && (
              <span className="text-[11px] font-mono text-white/70 bg-black/40 px-2 py-1 rounded-md backdrop-blur-sm border border-white/10">
                {currentTimeText} / {durationText}
              </span>
            )}
          </div>
        </div>

        {/* Right: Core Playback Controls (Play/Pause, Mute/Unmute, Next Trailer) */}
        <div className="flex items-center gap-2 self-start md:self-end">
          {/* Prev Trailer Button (when multiple) */}
          {activeTrailers.length > 1 && (
            <button
              type="button"
              onClick={handlePrevTrailer}
              data-tv-focus="trailer-prev"
              className="w-10 h-10 md:w-11 md:h-11 rounded-xl md:rounded-2xl bg-black/60 hover:bg-white/20 text-white flex items-center justify-center backdrop-blur-md border border-white/15 outline-none transition-all active:scale-95 shadow-lg"
              title="Trailer trước"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}

          {/* Play / Pause Toggle Button */}
          <button
            type="button"
            onClick={handleTogglePlay}
            data-tv-focus="trailer-play"
            className="h-10 px-4 md:h-11 md:px-5 rounded-xl md:rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-black font-black text-xs md:text-sm flex items-center gap-2 shadow-xl shadow-cyan-500/30 outline-none transition-all active:scale-95"
            title={isPlaying ? 'Tạm dừng trailer' : 'Phát tiếp trailer'}
          >
            {isPlaying ? (
              <>
                <Pause className="w-4 h-4 md:w-5 md:h-5 fill-black" />
                <span>TẠM DỪNG</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 md:w-5 md:h-5 fill-black" />
                <span>PHÁT TIẾP</span>
              </>
            )}
          </button>

          {/* Mute / Unmute Toggle Button */}
          <button
            type="button"
            onClick={handleToggleMute}
            data-tv-focus="trailer-mute"
            className={`w-10 h-10 md:w-11 md:h-11 rounded-xl md:rounded-2xl flex items-center justify-center backdrop-blur-md border outline-none transition-all active:scale-95 shadow-lg ${
              isMuted
                ? 'bg-black/60 hover:bg-white/20 text-white/80 border-white/15'
                : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border-amber-500/40'
            }`}
            title={isMuted ? 'Bật âm thanh' : 'Tắt âm thanh'}
          >
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5 text-amber-400" />}
          </button>

          {/* Next Trailer Button */}
          {activeTrailers.length > 1 && (
            <button
              type="button"
              onClick={() => {
                sfx.playClick();
                handleNextTrailer(false);
              }}
              data-tv-focus="trailer-next"
              className="h-10 px-3.5 md:h-11 md:px-4 rounded-xl md:rounded-2xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs flex items-center gap-1.5 backdrop-blur-md border border-white/20 outline-none transition-all active:scale-95 shadow-lg"
              title="Trailer tiếp theo"
            >
              <span>Tiếp</span>
              <SkipForward className="w-4 h-4 fill-white" />
            </button>
          )}
        </div>
      </div>

      {/* 4. PC WIDESCREEN THUMBNAILS SELECTOR STRIP */}
      {isPC && activeTrailers.length > 1 && (
        <div className="absolute bottom-16 right-6 z-20 hidden lg:flex flex-col items-end gap-1.5 pointer-events-auto">
          <div className="text-[10px] font-bold uppercase tracking-wider text-white/50 flex items-center gap-1">
            <Layers className="w-3 h-3 text-cyan-400" />
            <span>Danh sách teaser ({activeTrailers.length})</span>
          </div>

          <div
            ref={thumbnailsScrollRef}
            className="flex items-center gap-2 max-w-md overflow-x-auto p-1.5 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 scrollbar-none"
          >
            {activeTrailers.map((t, idx) => {
              const isSelected = idx === currentIndex;
              const tParsed = parseMediaUrl(t.videoUrl);
              const thumbUrl = tParsed.thumbnailUrl || 'https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?auto=format&fit=crop&w=300&q=80';

              return (
                <button
                  key={t.id || idx}
                  type="button"
                  onClick={() => {
                    sfx.playClick();
                    setCurrentIndex(idx);
                  }}
                  className={`relative flex-shrink-0 w-24 h-14 rounded-lg overflow-hidden border transition-all duration-200 group/thumb ${
                    isSelected
                      ? 'border-cyan-400 ring-2 ring-cyan-400/50 scale-105 shadow-lg'
                      : 'border-white/15 opacity-60 hover:opacity-100 hover:border-white/40'
                  }`}
                  title={t.title}
                >
                  <img
                    src={thumbUrl}
                    alt={t.title}
                    className="w-full h-full object-cover group-hover/thumb:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  <span className="absolute bottom-1 left-1 right-1 text-[9px] font-bold text-white truncate drop-shadow">
                    {t.title}
                  </span>
                  {isSelected && (
                    <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. MOBILE TOUCH-FRIENDLY TRAILER CHIPS SELECTOR */}
      {isMobile && activeTrailers.length > 1 && (
        <div className="absolute top-14 left-3 right-3 z-20 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none pointer-events-auto">
          {activeTrailers.map((t, idx) => {
            const isSelected = idx === currentIndex;
            return (
              <button
                key={t.id || idx}
                type="button"
                onClick={() => {
                  sfx.playClick();
                  setCurrentIndex(idx);
                }}
                className={`flex-shrink-0 px-2.5 py-1 rounded-full text-[10px] font-bold transition-all shadow-sm ${
                  isSelected
                    ? 'bg-cyan-500 text-black font-extrabold ring-1 ring-cyan-300'
                    : 'bg-black/60 text-white/80 border border-white/15'
                }`}
              >
                {t.title}
              </button>
            );
          })}
        </div>
      )}

      {/* 6. AMBIENT NON-SEEKABLE PROGRESS INDICATOR */}
      {/* Pure visual ambient progress line at the very bottom edge (No scrubber, no seek, completely non-seekable) */}
      <div
        className="absolute bottom-0 left-0 right-0 h-1 bg-white/10 z-30 pointer-events-none"
        aria-hidden="true"
      >
        <div
          className="h-full bg-gradient-to-r from-cyan-500 via-amber-400 to-red-500 transition-all duration-300 ease-linear shadow-[0_0_8px_rgba(6,182,212,0.8)]"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  );
};
