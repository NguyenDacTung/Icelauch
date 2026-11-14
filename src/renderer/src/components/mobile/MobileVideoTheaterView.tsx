import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  Play,
  Pause,
  ExternalLink,
  Film,
  Download,
  Trash2,
  ListVideo,
  Flame,
  CheckCircle2,
  Tv,
  Globe,
  Zap,
  AlertCircle,
  RotateCcw,
  RotateCw,
  Maximize2,
  Smartphone,
  Sparkles,
} from 'lucide-react';
import { parseMediaUrl, getActiveProxyPort } from '../../utils/mediaUrl';
import type { MediaItem, MediaPlaylist } from '../../types';
import { SafeImage } from '../common/SafeImage';
import { sfx } from '../../utils/sfx';

interface MobileVideoTheaterViewProps {
  media: MediaItem;
  allVideos: MediaItem[];
  playlists?: MediaPlaylist[];
  isAdmin: boolean;
  onBack: () => void;
  onSelectVideo: (item: MediaItem) => void;
  onEditMedia?: (item: MediaItem) => void;
  onUpdateProgress?: (id: string, position: number, watched: boolean) => void;
  onDownloadMedia?: (id: string) => void;
  onDeleteDownloaded?: (id: string) => void;
}

export type PlaybackEngine = 'external' | 'desktop' | 'embed' | 'direct' | 'proxy';

export const MobileVideoTheaterView: React.FC<MobileVideoTheaterViewProps> = ({
  media,
  allVideos,
  playlists = [],
  isAdmin,
  onBack,
  onSelectVideo,
  onEditMedia,
  onUpdateProgress,
  onDownloadMedia,
  onDeleteDownloaded,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const hasLocalElectronProxy = typeof window !== 'undefined' && Boolean((window as any).electron);

  const allMediaLinks = [media.link, ...(media.backupLinks || [])].filter(Boolean);
  const [activeLinkIndex, setActiveLinkIndex] = useState(0);
  const currentActiveLink = allMediaLinks[activeLinkIndex] || media.link;

  const parsed = parseMediaUrl(currentActiveLink);
  const isYouTube = parsed.kind === 'youtube' && parsed.id;
  const isGoogleDrive = parsed.kind === 'gdrive' && parsed.id;
  const isFacebook = parsed.kind === 'facebook';

  // Default playback mode
  const defaultMode: PlaybackEngine = isGoogleDrive ? 'external' : (isYouTube || isFacebook) ? 'embed' : 'direct';

  const [playbackMode, setPlaybackMode] = useState<PlaybackEngine>(defaultMode);
  const [showFullDesc, setShowFullDesc] = useState(false);
  const [isLoadingStream, setIsLoadingStream] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState('Đang nạp video...');

  // Auto fallback to next backup link when error occurs
  const handleTriggerBackupLink = () => {
    if (activeLinkIndex < allMediaLinks.length - 1) {
      const nextIdx = activeLinkIndex + 1;
      setActiveLinkIndex(nextIdx);
      setLoadingStatus(`Link lỗi! Đang chuyển sang Nguồn dự phòng ${nextIdx}...`);
      setIsLoadingStream(true);
      setTimeout(() => setIsLoadingStream(false), 2000);
    }
  };

  // Custom Desktop/HTML5 player controls state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const driveEmbedUrl = parsed.id
    ? `https://drive.google.com/file/d/${parsed.id}/preview`
    : parsed.embedUrl || media.link;

  const youtubeEmbedUrl = parsed.id
    ? `https://www.youtube-nocookie.com/embed/${parsed.id}?autoplay=1&rel=0&playsinline=1&enablejsapi=1`
    : parsed.embedUrl || media.link;

  const proxyUrl =
    hasLocalElectronProxy && parsed.id
      ? `http://127.0.0.1:${getActiveProxyPort()}/drive/${parsed.id}`
      : null;

  // Stream URL for Desktop HTML5 mode
  const directStreamUrl = isGoogleDrive && parsed.id
    ? `https://drive.usercontent.google.com/download?id=${parsed.id}&export=download&authuser=0`
    : parsed.directUrl || media.link;

  useEffect(() => {
    if (playbackMode === 'embed' || playbackMode === 'desktop') {
      setIsLoadingStream(true);
      setLoadingStatus('Đang nạp video...');
      const timer = setTimeout(() => {
        setIsLoadingStream(false);
      }, 1800);
      return () => clearTimeout(timer);
    }
  }, [media.id, playbackMode]);

  // Handle native video time updates
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

  const handleTogglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleSeek = (newTime: number) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleSkip = (seconds: number) => {
    if (!videoRef.current) return;
    const target = Math.max(0, Math.min(duration || 0, videoRef.current.currentTime + seconds));
    handleSeek(target);
  };

  const handleFullscreen = () => {
    if (!videoRef.current) return;
    if (videoRef.current.requestFullscreen) {
      videoRef.current.requestFullscreen();
    }
  };

  const formatSeconds = (sec: number) => {
    if (!sec || isNaN(sec)) return '00:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    const h = Math.floor(m / 60);
    const remM = m % 60;
    if (h > 0) {
      return `${h}:${remM < 10 ? '0' : ''}${remM}:${s < 10 ? '0' : ''}${s}`;
    }
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleOpenExternal = () => {
    sfx.playClick();
    window.open(media.link, '_blank');
  };

  // Related & Playlist videos
  const currentPlaylist = playlists.find((p) => p.itemIds.includes(media.id));
  const playlistItems = currentPlaylist
    ? (currentPlaylist.itemIds.map((id) => allVideos.find((v) => v.id === id)).filter(Boolean) as MediaItem[])
    : [];

  const relatedVideos = allVideos.filter((v) => v.id !== media.id);

  return (
    <div
      ref={containerRef}
      className="flex-1 w-full h-full flex flex-col bg-[#07090E] select-none overflow-y-auto no-scrollbar"
    >
      {/* 1. TOP HEADER BAR (DEDICATED, SAFE FROM NOTCH, NEVER BLOCKS VIDEO CONTROLS) */}
      <div className="sticky top-0 z-40 w-full bg-[#0D1017]/95 backdrop-blur-md border-b border-white/10 px-3 py-2 flex items-center justify-between pt-[max(0.5rem,env(safe-area-inset-top,0px))] shrink-0 shadow-md">
        <button
          type="button"
          onClick={() => {
            sfx.playClick();
            onBack();
          }}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium text-xs border border-white/10 active:scale-95 transition-all shrink-0"
          title="Quay lại danh sách"
        >
          <ArrowLeft className="w-4 h-4 text-cyan-400" />
          <span>Quay lại</span>
        </button>

        <div className="flex-1 min-w-0 mx-2 text-center">
          <p className="text-xs font-bold text-white truncate">{media.title}</p>
          <p className="text-[10px] text-slate-400 truncate">{media.category || 'Phim & Video'}</p>
        </div>

        <button
          type="button"
          onClick={handleOpenExternal}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 font-semibold text-xs border border-cyan-500/20 active:scale-95 transition-all shrink-0"
          title="Mở trên VLC, MX Player hoặc app Google Drive"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span className="text-[11px]">Mở ngoài</span>
        </button>
      </div>

      {/* 2. THEATER VIDEO CONTAINER (HEIGHT 275PX - 320PX) */}
      <div className="relative w-full h-[275px] sm:h-[320px] bg-black flex items-center justify-center shrink-0 shadow-2xl overflow-hidden">
        {/* MODE 1: EXTERNAL APP LAUNCHER CARD (VLC / MX PLAYER / DRIVE) */}
        {playbackMode === 'external' ? (
          <div className="absolute inset-0 w-full h-full flex flex-col items-center justify-center p-4 text-center overflow-hidden">
            {/* Background Poster Blur */}
            <div className="absolute inset-0 -z-10">
              <SafeImage
                src={media.bannerPath || media.coverPath}
                alt={media.title}
                title={media.title}
                fallbackType="video"
                className="w-full h-full object-cover filter blur-md opacity-30 scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-black/60" />
            </div>

            {/* Glowing Big Play Button */}
            <button
              type="button"
              onClick={handleOpenExternal}
              className="group relative flex flex-col items-center gap-2.5 active:scale-95 transition-all"
            >
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-xl shadow-cyan-500/30 group-hover:scale-110 transition-transform">
                <Play className="w-8 h-8 fill-black text-black ml-1" />
              </div>
              <div className="space-y-0.5">
                <span className="text-sm font-black text-white tracking-wide block">
                  MỞ BẰNG APP NGOÀI (VLC / DRIVE)
                </span>
                <span className="text-[11px] text-cyan-300 font-medium block">
                  Tăng tốc GPU • 60-120fps • Vuốt chỉnh âm lượng & độ sáng
                </span>
              </div>
            </button>

            {/* Sub-actions */}
            <div className="mt-4 flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  sfx.playClick();
                  setPlaybackMode('desktop');
                }}
                className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px] font-semibold border border-white/10 flex items-center gap-1.5"
              >
                <Tv className="w-3.5 h-3.5 text-amber-400" />
                <span>Xem trong App (Rạp Desktop)</span>
              </button>

              {isGoogleDrive && (
                <button
                  type="button"
                  onClick={() => {
                    sfx.playClick();
                    setPlaybackMode('embed');
                  }}
                  className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 text-[11px] font-semibold border border-white/10 flex items-center gap-1.5"
                >
                  <Globe className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Drive Preview Gốc</span>
                </button>
              )}
            </div>
          </div>
        ) : playbackMode === 'proxy' && proxyUrl ? (
          <video
            ref={videoRef}
            src={proxyUrl}
            controls
            autoPlay
            playsInline
            preload="auto"
            onCanPlay={() => setIsLoadingStream(false)}
            onWaiting={() => {
              setIsLoadingStream(true);
              setLoadingStatus('Đang nạp bộ đệm 16MB...');
            }}
            onPlaying={() => setIsLoadingStream(false)}
            onTimeUpdate={handleTimeUpdate}
            className="w-full h-full object-contain absolute inset-0"
          />
        ) : isFacebook ? (
          <iframe
            src={parsed.embedUrl}
            title={media.title}
            allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
            allowFullScreen
            onLoad={() => setIsLoadingStream(false)}
            className="w-full h-full border-0 absolute inset-0"
          />
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
          /* MODE 2: DESKTOP / DIRECT VIDEO WITH SCRUBBER STRICTLY AT BOTTOM */
          <div className="relative w-full h-full bg-black flex items-center justify-center group">
            <video
              ref={videoRef}
              src={directStreamUrl}
              playsInline
              preload="auto"
              onCanPlay={() => setIsLoadingStream(false)}
              onWaiting={() => {
                setIsLoadingStream(true);
                setLoadingStatus('Đang tải luồng video...');
              }}
              onPlaying={() => {
                setIsLoadingStream(false);
                setIsPlaying(true);
              }}
              onPause={() => setIsPlaying(false)}
              onTimeUpdate={handleTimeUpdate}
              onClick={handleTogglePlay}
              onError={handleTriggerBackupLink}
              className="w-full h-full object-contain absolute inset-0"
            />

            {/* Custom Bottom Scrubber Bar (Never at Top) */}
            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/95 via-black/80 to-transparent p-2.5 pt-6 flex flex-col gap-1.5 z-20">
              {/* Progress Slider */}
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={0}
                  max={duration || 100}
                  value={currentTime}
                  onChange={(e) => handleSeek(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
              </div>

              {/* Bottom Control Buttons */}
              <div className="flex items-center justify-between text-white">
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={handleTogglePlay}
                    className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center active:scale-95 transition-all"
                  >
                    {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5 fill-white" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSkip(-10)}
                    className="p-1 rounded-lg hover:bg-white/10 text-slate-300"
                    title="Lùi 10s"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSkip(10)}
                    className="p-1 rounded-lg hover:bg-white/10 text-slate-300"
                    title="Tiến 10s"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                  </button>

                  <span className="text-[11px] font-mono text-slate-300">
                    {formatSeconds(currentTime)} / {formatSeconds(duration)}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleFullscreen}
                    className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white"
                    title="Toàn màn hình"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Loading Overlay */}
        {isLoadingStream && (
          <div className="absolute inset-0 bg-black/75 z-30 flex flex-col items-center justify-center gap-2 pointer-events-none transition-opacity duration-300">
            <div className="w-9 h-9 rounded-full border-2 border-cyan-500/20 border-t-cyan-400 animate-spin" />
            <span className="text-[11px] font-semibold text-cyan-300 font-mono animate-pulse">
              {loadingStatus}
            </span>
          </div>
        )}
      </div>

      {/* 3. PLAYBACK ENGINE SWITCHER (3 ENGINES ON MOBILE) */}
      <div className="bg-[#12151F] px-3 py-2.5 border-b border-white/5 flex flex-col gap-1.5 shrink-0">
        <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider shrink-0 flex items-center gap-1">
            <Tv className="w-3.5 h-3.5 text-cyan-400" />
            Chế độ:
          </span>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Engine 1: External App (VLC / MX Player / Drive) */}
            <button
              type="button"
              onClick={() => {
                sfx.playClick();
                setPlaybackMode('external');
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                playbackMode === 'external'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-black shadow-md shadow-cyan-500/25'
                  : 'bg-white/5 text-slate-400 hover:text-white border border-white/10'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>🚀 App Ngoài (VLC/Drive)</span>
            </button>

            {/* Engine 2: Desktop Cinema Player (Timeline at bottom) */}
            <button
              type="button"
              onClick={() => {
                sfx.playClick();
                setPlaybackMode('desktop');
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                playbackMode === 'desktop'
                  ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/25'
                  : 'bg-white/5 text-slate-400 hover:text-white border border-white/10'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>🎬 Rạp Desktop (Đáy)</span>
            </button>

            {/* Engine 3: Drive / YouTube Web Embed */}
            {(isGoogleDrive || isYouTube) && (
              <button
                type="button"
                onClick={() => {
                  sfx.playClick();
                  setPlaybackMode('embed');
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                  playbackMode === 'embed'
                    ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/25'
                    : 'bg-white/5 text-slate-400 hover:text-white border border-white/10'
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>{isGoogleDrive ? '🌐 Drive Gốc' : 'YouTube Player'}</span>
              </button>
            )}

            {/* Option: PC Proxy VIP (if running with Electron) */}
            {hasLocalElectronProxy && isGoogleDrive && (
              <button
                type="button"
                onClick={() => {
                  sfx.playClick();
                  setPlaybackMode('proxy');
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                  playbackMode === 'proxy'
                    ? 'bg-amber-500 text-black shadow-md'
                    : 'bg-white/5 text-slate-400 hover:text-white border border-white/10'
                }`}
              >
                <span>🚀 Proxy VIP</span>
              </button>
            )}
          </div>
        </div>

        {/* Tip depending on mode */}
        {playbackMode === 'desktop' && isGoogleDrive && (
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-[11px] leading-tight">
            <Sparkles className="w-3.5 h-3.5 shrink-0 text-cyan-400" />
            <span>Chế độ Rạp Desktop: Thanh tua luôn nằm cố định ở đáy, không có nút viên thuốc nổi. Nếu file nặng tải chậm, bạn có thể bấm <b>App Ngoài</b> để xem tức thì.</span>
          </div>
        )}

        {/* Source Mirror Selector (If multiple links exist) */}
        {allMediaLinks.length > 1 && (
          <div className="flex items-center gap-1.5 pt-1 border-t border-white/5 overflow-x-auto no-scrollbar">
            <span className="text-[10px] text-amber-300 font-bold uppercase tracking-wider shrink-0">
              Nguồn phát:
            </span>
            {allMediaLinks.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  sfx.playClick();
                  setActiveLinkIndex(idx);
                }}
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                  activeLinkIndex === idx
                    ? 'bg-amber-400 text-black shadow-sm'
                    : 'bg-white/5 text-slate-400 hover:text-white'
                }`}
              >
                {idx === 0 ? 'Nguồn 1 (Chính)' : `Nguồn ${idx + 1} (Dự phòng)`}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Prominent Quick-Action Card for VLC / MX Player */}
      <div className="mx-3.5 mt-3 p-3 rounded-2xl bg-gradient-to-r from-cyan-950/40 via-blue-950/40 to-[#121520] border border-cyan-500/30 flex items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center shrink-0">
            <ExternalLink className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-black text-white truncate">Xem Bằng VLC / MX Player / Drive</p>
            <p className="text-[10px] text-slate-400 truncate">Hỗ trợ cử chỉ vuốt, tăng tốc GPU và không lỗi giao diện</p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleOpenExternal}
          className="px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold text-xs shadow-md shadow-cyan-500/25 active:scale-95 transition-all shrink-0"
        >
          Mở Ngay
        </button>
      </div>

      {/* 4. MOVIE DETAILS & ACTIONS CONTAINER */}
      <div className="p-3.5 space-y-3">
        {/* Title & Category */}
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              {media.category || 'Phim & Video'}
            </span>
            {media.tags && media.tags.length > 0 && (
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-white/10 text-white/90 border border-white/10">
                {media.tags[0]}
              </span>
            )}
            {media.downloadStatus === 'downloaded' && (
              <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center gap-0.5">
                <CheckCircle2 className="w-2.5 h-2.5" />
                <span>Đã tải về</span>
              </span>
            )}
          </div>

          <h1 className="text-base font-black text-white leading-snug">
            {media.title}
          </h1>

          {/* Expandable Description */}
          {media.description && (
            <div className="text-xs text-slate-300 leading-relaxed">
              <p className={showFullDesc ? '' : 'line-clamp-2'}>
                {media.description}
              </p>
              {media.description.length > 80 && (
                <button
                  type="button"
                  onClick={() => setShowFullDesc(!showFullDesc)}
                  className="text-[11px] text-cyan-400 font-semibold mt-0.5"
                >
                  {showFullDesc ? 'Thu gọn' : 'Xem thêm...'}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Download Row */}
        {onDownloadMedia && (
          <div className="flex items-center gap-2 pt-1 border-t border-white/5">
            {media.downloadStatus === 'downloaded' ? (
              <button
                type="button"
                onClick={() => onDeleteDownloaded?.(media.id)}
                className="flex-1 h-9 rounded-xl bg-rose-600/15 hover:bg-rose-600/25 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Xóa bản tải offline</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onDownloadMedia(media.id)}
                className="flex-1 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all border border-white/10"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Tải xem ngoại tuyến</span>
              </button>
            )}

            {isAdmin && onEditMedia && (
              <button
                type="button"
                onClick={() => onEditMedia(media)}
                className="h-9 px-3.5 rounded-xl bg-white/10 text-white text-xs font-bold border border-white/10"
              >
                Sửa
              </button>
            )}
          </div>
        )}

        {/* 5. PLAYLIST / EPISODES LIST (IF APPLICABLE) */}
        {playlistItems.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-white/5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <ListVideo className="w-4 h-4 text-cyan-400" />
                <span>Danh sách tập ({playlistItems.length})</span>
              </span>
              <span className="text-[10px] text-slate-400">{currentPlaylist?.name}</span>
            </div>

            <div className="space-y-1.5">
              {playlistItems.map((item, idx) => {
                const isCurrent = item.id === media.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      sfx.playClick();
                      onSelectVideo(item);
                    }}
                    className={`flex items-center gap-3 p-2 rounded-xl cursor-pointer transition-all border ${
                      isCurrent
                        ? 'bg-cyan-500/20 border-cyan-500/50 text-white font-bold'
                        : 'bg-[#12151D] hover:bg-white/5 border-white/5 text-slate-300'
                    }`}
                  >
                    <div className="relative w-16 aspect-video rounded-lg overflow-hidden bg-black shrink-0">
                      <SafeImage
                        src={item.coverPath || item.bannerPath}
                        alt={item.title}
                        title={item.title}
                        fallbackType="video"
                        className="w-full h-full object-cover"
                      />
                      {isCurrent && (
                        <div className="absolute inset-0 bg-cyan-500/40 flex items-center justify-center">
                          <Play className="w-4 h-4 fill-white" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold line-clamp-1">{item.title}</p>
                      <span className="text-[10px] text-slate-400">Tập {idx + 1}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 6. RELATED / DISCOVER MORE VIDEOS */}
        {relatedVideos.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-white/5">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Film className="w-4 h-4 text-cyan-400" />
              <span>Phim & Video liên quan</span>
            </span>

            <div className="space-y-2">
              {relatedVideos.slice(0, 6).map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    sfx.playClick();
                    onSelectVideo(item);
                  }}
                  className="flex items-center gap-3 p-2 rounded-xl bg-[#12151D] hover:bg-white/5 border border-white/5 cursor-pointer transition-all active:scale-98"
                >
                  <div className="w-20 aspect-video rounded-lg overflow-hidden bg-black shrink-0">
                    <SafeImage
                      src={item.coverPath || item.bannerPath}
                      alt={item.title}
                      title={item.title}
                      fallbackType="video"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <span className="text-[9px] font-semibold text-cyan-400 uppercase tracking-wider">
                      {item.category || 'Phim'}
                    </span>
                    <p className="text-xs font-bold text-white line-clamp-1">{item.title}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
