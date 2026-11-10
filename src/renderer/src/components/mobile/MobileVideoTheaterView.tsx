import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  Play,
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

  const parsed = parseMediaUrl(media.link);
  const isYouTube = parsed.kind === 'youtube' && parsed.id;
  const isGoogleDrive = parsed.kind === 'gdrive' && parsed.id;

  // Playback modes: 'embed' (Drive player / YouTube), 'direct' (native HTML5 video), 'proxy' (Electron VIP)
  const defaultMode: 'embed' | 'direct' | 'proxy' =
    isGoogleDrive || isYouTube ? 'embed' : 'direct';

  const [playbackMode, setPlaybackMode] = useState<'embed' | 'direct' | 'proxy'>(defaultMode);
  const [showFullDesc, setShowFullDesc] = useState(false);
  const [isLoadingStream, setIsLoadingStream] = useState(true);
  const [loadingStatus, setLoadingStatus] = useState('Đang nạp video...');

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

  useEffect(() => {
    setIsLoadingStream(true);
    setLoadingStatus('Đang nạp video...');
    const timer = setTimeout(() => {
      setIsLoadingStream(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, [media.id, playbackMode]);

  // Video progress reporting
  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const cur = videoRef.current.currentTime;
    const dur = videoRef.current.duration || 0;
    if (Math.floor(cur) % 5 === 0 && dur > 0) {
      onUpdateProgress?.(media.id, cur, cur / dur > 0.9);
    }
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
          onClick={() => window.open(media.link, '_blank')}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 font-semibold text-xs border border-cyan-500/20 active:scale-95 transition-all shrink-0"
          title="Mở trên ứng dụng hoặc trình duyệt ngoài"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span className="text-[11px]">Mở ngoài</span>
        </button>
      </div>

      {/* 2. THEATER VIDEO CONTAINER (HEIGHT 275PX - 320PX SO GOOGLE DRIVE CONTROLS NEVER GET SQUEEZED) */}
      <div className="relative w-full h-[275px] sm:h-[320px] bg-black flex items-center justify-center shrink-0 shadow-2xl overflow-hidden">
        {/* Video Render Modes */}
        {playbackMode === 'proxy' && proxyUrl ? (
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
            controls
            autoPlay
            playsInline
            preload="auto"
            onCanPlay={() => setIsLoadingStream(false)}
            onWaiting={() => {
              setIsLoadingStream(true);
              setLoadingStatus('Đang tải video...');
            }}
            onPlaying={() => setIsLoadingStream(false)}
            onTimeUpdate={handleTimeUpdate}
            className="w-full h-full object-contain absolute inset-0"
          />
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

      {/* 3. PLAYBACK MODE SWITCHER WITH EXPLANATIONS */}
      <div className="bg-[#12151F] px-3 py-2.5 border-b border-white/5 flex flex-col gap-1.5 shrink-0">
        <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider shrink-0 flex items-center gap-1">
            <Tv className="w-3.5 h-3.5 text-cyan-400" />
            Chế độ phát:
          </span>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Option 1: Drive / Web Embed */}
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
                <span>{isGoogleDrive ? '⚡ Drive Player (Nhanh)' : 'YouTube Player'}</span>
              </button>
            )}

            {/* Option 2: Native HTML5 Direct Video */}
            <button
              type="button"
              onClick={() => {
                sfx.playClick();
                setPlaybackMode('direct');
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                playbackMode === 'direct'
                  ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/25'
                  : 'bg-white/5 text-slate-400 hover:text-white border border-white/10'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Video HTML5</span>
            </button>

            {/* Option 3: PC Proxy VIP (if running with Electron) */}
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

            {/* Option 4: Open in External Browser / App (VLC / MX Player / Drive App) */}
            <button
              type="button"
              onClick={() => window.open(media.link, '_blank')}
              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-white/10 text-white/90 border border-white/10 flex items-center gap-1 hover:bg-white/20 transition-colors"
              title="Mở trên trình duyệt hoặc ứng dụng ngoài (VLC, Drive...)"
            >
              <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
              <span>Mở ngoài</span>
            </button>
          </div>
        </div>

        {/* Guidance tip if HTML5 mode is active on a Google Drive URL */}
        {isGoogleDrive && playbackMode === 'direct' && (
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] leading-tight">
            <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-400" />
            <span>Link Google Drive nên dùng <b>Drive Player</b> hoặc <b>Mở ngoài</b> để xem nhanh nhất. Chế độ HTML5 chỉ tối ưu cho file MP4 trực tiếp.</span>
          </div>
        )}
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
