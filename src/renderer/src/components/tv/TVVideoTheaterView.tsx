import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  ExternalLink,
  Tv,
  Globe,
  Zap,
  MousePointer,
  ListVideo,
  Flame,
  CheckCircle2,
  Sliders,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import { parseMediaUrl } from '../../utils/mediaUrl';
import type { MediaItem } from '../../types';
import { sfx } from '../../utils/sfx';

interface TVVideoTheaterViewProps {
  media: MediaItem;
  onBack: () => void;
  onUpdateProgress?: (id: string, position: number, watched: boolean) => void;
  allVideos?: MediaItem[];
  onSelectVideo?: (item: MediaItem) => void;
}

export type TVPlaybackMode = 'embed' | 'direct' | 'external';

export const TVVideoTheaterView: React.FC<TVVideoTheaterViewProps> = ({
  media,
  onBack,
  onUpdateProgress,
  allVideos = [],
  onSelectVideo,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const parsed = parseMediaUrl(media.link);
  const isYouTube = parsed.kind === 'youtube' && parsed.id;
  const isGoogleDrive = parsed.kind === 'gdrive' && parsed.id;

  // TV Playback modes: 'embed' (Drive preview / YouTube), 'direct' (HTML5 video), 'external' (VLC/MX Player)
  const [playbackMode, setPlaybackMode] = useState<TVPlaybackMode>(
    isGoogleDrive || isYouTube ? 'embed' : 'direct'
  );

  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(media.lastPosition || 0);
  const [duration, setDuration] = useState(0);
  const [isLoadingStream, setIsLoadingStream] = useState(true);
  const [loadingStatus, setLoadingStatus] = useState('Đang nạp video...');

  // Remote D-pad Control States
  const [isTimelineActive, setIsTimelineActive] = useState(false);
  const [scrubTime, setScrubTime] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isVirtualMouseActive, setIsVirtualMouseActive] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 960, y: 540 });

  // Quick action HUD indicator (e.g. "+10s", "-10s", "Tạm dừng")
  const [hudMessage, setHudMessage] = useState<string | null>(null);
  const hudTimer = useRef<NodeJS.Timeout | null>(null);

  const triggerHud = (msg: string) => {
    setHudMessage(msg);
    if (hudTimer.current) clearTimeout(hudTimer.current);
    hudTimer.current = setTimeout(() => setHudMessage(null), 1500);
  };

  const driveEmbedUrl = parsed.id
    ? `https://drive.google.com/file/d/${parsed.id}/preview`
    : parsed.embedUrl || media.link;

  const youtubeEmbedUrl = parsed.id
    ? `https://www.youtube-nocookie.com/embed/${parsed.id}?autoplay=1&rel=0&playsinline=1&enablejsapi=1`
    : parsed.embedUrl || media.link;

  useEffect(() => {
    setIsLoadingStream(true);
    setLoadingStatus('Đang nạp video...');
    const timer = setTimeout(() => setIsLoadingStream(false), 1500);
    return () => clearTimeout(timer);
  }, [media.id, playbackMode]);

  // Video progress reporting
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

  const togglePlay = () => {
    sfx.playClick();
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
        triggerHud('⏸ Tạm Dừng');
      } else {
        videoRef.current.play().catch(console.warn);
        setIsPlaying(true);
        triggerHud('▶ Tiếp Tục');
      }
    } else {
      setIsPlaying(!isPlaying);
      triggerHud(isPlaying ? '⏸ Tạm Dừng' : '▶ Tiếp Tục');
    }
  };

  const seekDelta = (seconds: number) => {
    sfx.playClick();
    if (videoRef.current) {
      const target = Math.max(0, Math.min(duration || 100, videoRef.current.currentTime + seconds));
      videoRef.current.currentTime = target;
      setCurrentTime(target);
      triggerHud(seconds > 0 ? `⏩ +${seconds}s` : `⏪ ${seconds}s`);
    } else {
      triggerHud(seconds > 0 ? `⏩ +${seconds}s` : `⏪ ${seconds}s`);
    }
  };

  const seekToTime = (newTime: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
    triggerHud(`⏱ ${formatTime(newTime)}`);
  };

  const formatTime = (secs: number) => {
    if (!secs || isNaN(secs)) return '00:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    const h = Math.floor(m / 60);
    const remM = m % 60;
    if (h > 0) {
      return `${h}:${remM.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // REMOTE CONTROL KEYBOARD / D-PAD LISTENER
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. Virtual Mouse Mode
      if (isVirtualMouseActive) {
        const step = 35;
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          setMousePos((p) => ({ ...p, y: Math.max(20, p.y - step) }));
          return;
        }
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setMousePos((p) => ({ ...p, y: Math.min(window.innerHeight - 20, p.y + step) }));
          return;
        }
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          setMousePos((p) => ({ ...p, x: Math.max(20, p.x - step) }));
          return;
        }
        if (e.key === 'ArrowRight') {
          e.preventDefault();
          setMousePos((p) => ({ ...p, x: Math.min(window.innerWidth - 20, p.x + step) }));
          return;
        }
        if (e.key === 'Enter') {
          e.preventDefault();
          sfx.playClick();
          const target = document.elementFromPoint(mousePos.x, mousePos.y);
          if (target) {
            target.dispatchEvent(
              new MouseEvent('click', { bubbles: true, cancelable: true, clientX: mousePos.x, clientY: mousePos.y })
            );
          }
          return;
        }
        if (e.key === 'Escape' || e.key === 'Backspace') {
          e.preventDefault();
          setIsVirtualMouseActive(false);
          triggerHud('Tắt Chuột Ảo');
          return;
        }
        return;
      }

      // 2. Options Drawer is Open (Handled by buttons focus or Escape/Down to close)
      if (isMenuOpen) {
        if (e.key === 'Escape' || e.key === 'Backspace' || e.key === 'ArrowDown') {
          e.preventDefault();
          setIsMenuOpen(false);
          return;
        }
        return;
      }

      // 3. Timeline Scrubber is Active (Activated by ArrowDown)
      if (isTimelineActive) {
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          sfx.playClick();
          setScrubTime((prev) => Math.max(0, prev - 15));
          return;
        }
        if (e.key === 'ArrowRight') {
          e.preventDefault();
          sfx.playClick();
          setScrubTime((prev) => Math.min(duration || 100, prev + 15));
          return;
        }
        if (e.key === 'Enter' || e.key === 'ArrowDown' || e.key === ' ') {
          e.preventDefault();
          sfx.playClick();
          seekToTime(scrubTime);
          setIsTimelineActive(false);
          return;
        }
        if (e.key === 'Escape' || e.key === 'Backspace' || e.key === 'ArrowUp') {
          e.preventDefault();
          setIsTimelineActive(false);
          return;
        }
        return;
      }

      // 4. Normal Remote Playback Controls (Timeline & Menu both hidden)
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        sfx.playClick();
        setScrubTime(currentTime);
        setIsTimelineActive(true);
        return;
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        sfx.playClick();
        setIsMenuOpen(true);
        return;
      }

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        seekDelta(-10);
        return;
      }

      if (e.key === 'ArrowRight') {
        e.preventDefault();
        seekDelta(10);
        return;
      }

      if (e.key === 'Enter' || e.key === ' ' || e.key === 'MediaPlayPause') {
        e.preventDefault();
        togglePlay();
        return;
      }

      if (e.key === 'Escape' || e.key === 'Backspace') {
        e.preventDefault();
        sfx.playClick();
        onBack();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isVirtualMouseActive,
    mousePos,
    isMenuOpen,
    isTimelineActive,
    scrubTime,
    currentTime,
    duration,
    isPlaying,
  ]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-black flex items-center justify-center overflow-hidden select-none"
    >
      {/* 1. VIDEO VIEWPORT */}
      {playbackMode === 'external' ? (
        <div className="flex flex-col items-center justify-center text-center p-8 space-y-4">
          <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center shadow-2xl shadow-amber-500/40">
            <ExternalLink className="w-10 h-10 text-black" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-black text-white">ĐANG MỞ BẰNG APP NGOÀI (VLC / MX PLAYER)</h2>
            <p className="text-sm text-slate-400">Video đang được phát trên ứng dụng chuyên dụng của TV với tăng tốc GPU.</p>
          </div>
          <button
            type="button"
            onClick={() => window.open(media.link, '_blank')}
            className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-sm shadow-xl"
          >
            Mở Lại Ứng Dụng
          </button>
        </div>
      ) : playbackMode === 'embed' && isYouTube ? (
        <iframe
          src={youtubeEmbedUrl}
          title={media.title}
          referrerPolicy="strict-origin-when-cross-origin"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          onLoad={() => setIsLoadingStream(false)}
          className="w-full h-full border-0 absolute inset-0"
        />
      ) : playbackMode === 'embed' && isGoogleDrive ? (
        <iframe
          src={driveEmbedUrl}
          title={media.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          onLoad={() => setIsLoadingStream(false)}
          className="w-full h-full border-0 absolute inset-0"
        />
      ) : (
        <video
          ref={videoRef}
          src={parsed.directUrl || media.link}
          controls={false}
          autoPlay
          playsInline
          preload="auto"
          onCanPlay={() => setIsLoadingStream(false)}
          onWaiting={() => {
            setIsLoadingStream(true);
            setLoadingStatus('Đang tải dữ liệu...');
          }}
          onPlaying={() => setIsLoadingStream(false)}
          onTimeUpdate={handleTimeUpdate}
          className="w-full h-full object-contain absolute inset-0"
        />
      )}

      {/* 2. QUICK HUD POPUP (e.g. "+10s", "Tạm Dừng") */}
      {hudMessage && (
        <div className="absolute top-12 z-50 px-6 py-3 rounded-2xl bg-black/85 backdrop-blur-md border border-white/20 text-white font-extrabold text-lg shadow-2xl flex items-center gap-2 animate-bounce">
          <span>{hudMessage}</span>
        </div>
      )}

      {/* 3. TIMELINE DRAWER (ACTIVATED BY PRESSING DOWN ON REMOTE) */}
      {isTimelineActive && (
        <div className="absolute bottom-0 inset-x-0 z-40 bg-gradient-to-t from-black via-black/90 to-transparent p-8 pt-16 flex flex-col gap-3 animate-in fade-in slide-in-from-bottom duration-200">
          <div className="flex items-center justify-between text-white font-bold text-sm">
            <span className="flex items-center gap-2 text-amber-400">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
              <span>CHẾ ĐỘ TUA THỜI GIAN (BẤM TRÁI / PHẢI ĐỂ TUA)</span>
            </span>
            <span className="text-xs font-mono text-slate-300">
              Bấm OK hoặc phím Xuống để xác nhận
            </span>
          </div>

          {/* Large TV Progress Scrubber Slider */}
          <div className="relative w-full h-3 bg-white/20 rounded-full overflow-hidden flex items-center cursor-pointer">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-amber-300 transition-all duration-100"
              style={{
                width: `${duration > 0 ? (scrubTime / duration) * 100 : 0}%`,
              }}
            />
          </div>

          <div className="flex items-center justify-between text-lg font-mono text-white">
            <span className="text-amber-400 font-extrabold">{formatTime(scrubTime)}</span>
            <span className="text-slate-400 text-sm">{formatTime(duration)}</span>
          </div>
        </div>
      )}

      {/* 4. QUICK OPTIONS DRAWER (ACTIVATED BY PRESSING UP ON REMOTE) */}
      {isMenuOpen && (
        <div className="absolute top-0 inset-x-0 z-40 bg-gradient-to-b from-black via-black/95 to-transparent p-8 pb-16 flex flex-col gap-4 animate-in fade-in slide-in-from-top duration-200 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  sfx.playClick();
                  onBack();
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-amber-400 hover:text-black text-white text-xs font-bold border border-white/20 focus:ring-4 focus:ring-amber-400 outline-none"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Quay lại TV</span>
              </button>
              <h2 className="text-base font-black text-white truncate max-w-xl">{media.title}</h2>
            </div>

            <button
              type="button"
              onClick={() => setIsMenuOpen(false)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 text-slate-300 text-xs font-bold border border-white/10"
            >
              <span>Đóng [Xuống]</span>
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          {/* Mode Switchers */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Nguồn phát:</span>

            {isGoogleDrive && (
              <button
                type="button"
                onClick={() => {
                  sfx.playClick();
                  setPlaybackMode('embed');
                  setIsMenuOpen(false);
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all ${
                  playbackMode === 'embed'
                    ? 'bg-amber-500 text-black border-amber-400 shadow-lg shadow-amber-500/30'
                    : 'bg-white/10 text-white border-white/15'
                }`}
              >
                <Globe className="w-4 h-4" />
                <span>Drive Preview Gốc</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                sfx.playClick();
                setPlaybackMode('direct');
                setIsMenuOpen(false);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all ${
                playbackMode === 'direct'
                  ? 'bg-amber-500 text-black border-amber-400 shadow-lg shadow-amber-500/30'
                  : 'bg-white/10 text-white border-white/15'
              }`}
            >
              <Zap className="w-4 h-4" />
              <span>Video Trực Tiếp HTML5</span>
            </button>

            <button
              type="button"
              onClick={() => {
                sfx.playClick();
                window.open(media.link, '_blank');
              }}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-xs font-black flex items-center gap-2 shadow-lg"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Mở Bằng VLC / MX Player Ngoài</span>
            </button>

            {/* Virtual Mouse Toggle */}
            <button
              type="button"
              onClick={() => {
                sfx.playClick();
                setIsVirtualMouseActive(!isVirtualMouseActive);
                setIsMenuOpen(false);
                triggerHud(isVirtualMouseActive ? 'Đã tắt Chuột Ảo' : 'Đã bật Chuột Ảo');
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all ${
                isVirtualMouseActive
                  ? 'bg-emerald-500 text-black border-emerald-400 shadow-lg'
                  : 'bg-white/10 text-white border-white/15'
              }`}
            >
              <MousePointer className="w-4 h-4" />
              <span>{isVirtualMouseActive ? 'Tắt Chuột Ảo' : 'Bật Chuột Ảo TV'}</span>
            </button>
          </div>
        </div>
      )}

      {/* 5. VIRTUAL MOUSE CURSOR (WHEN ACTIVATED) */}
      {isVirtualMouseActive && (
        <div
          className="fixed pointer-events-none z-50 transition-all duration-75"
          style={{ left: `${mousePos.x}px`, top: `${mousePos.y}px` }}
        >
          <div className="relative">
            <MousePointer className="w-8 h-8 fill-amber-400 text-black drop-shadow-2xl animate-pulse" />
            <span className="absolute left-6 top-6 px-2 py-0.5 rounded bg-amber-500 text-black text-[9px] font-black uppercase tracking-wider shadow">
              Bấm OK Click
            </span>
          </div>
        </div>
      )}

      {/* 6. REMOTE HELPER PILL AT BOTTOM (DISCREET) */}
      {!isTimelineActive && !isMenuOpen && !isVirtualMouseActive && (
        <div className="absolute bottom-4 left-6 z-30 flex items-center gap-3 px-4 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[11px] text-white/70">
          <span>⬇️ <b>Xuống:</b> Hiện tua timeline</span>
          <span>•</span>
          <span>⬆️ <b>Lên:</b> Tùy chọn nguồn phát</span>
          <span>•</span>
          <span>⬅️➡️ <b>Trái/Phải:</b> Tua 10s</span>
          <span>•</span>
          <span>🔘 <b>OK:</b> Play/Pause</span>
        </div>
      )}
    </div>
  );
};
