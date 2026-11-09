import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  Play,
  Pause,
  Maximize,
  Minimize,
  ExternalLink,
  Film,
  Download,
  Trash2,
  ListVideo,
  Sparkles,
  Tv,
  CheckCircle2,
} from 'lucide-react';
import { parseMediaUrl, getActiveProxyPort } from '../../utils/mediaUrl';
import type { MediaItem, MediaPlaylist } from '../../types';
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

  const [isPlaying, setIsPlaying] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState(media.lastPosition || 0);
  const [duration, setDuration] = useState(0);
  const [playbackMode, setPlaybackMode] = useState<'proxy' | 'direct'>('proxy');
  const [showFullDesc, setShowFullDesc] = useState(false);

  const parsed = parseMediaUrl(media.link);
  const isYouTube = parsed.kind === 'youtube' && parsed.id;
  const isGoogleDrive = parsed.kind === 'gdrive' && parsed.id;
  const isDirectVideo = parsed.kind === 'direct' || (!isYouTube && !isGoogleDrive);

  const proxyUrl = parsed.id ? `http://127.0.0.1:${getActiveProxyPort()}/drive/${parsed.id}` : null;

  // Handle Fullscreen
  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const toggleFullscreen = () => {
    sfx.playClick();
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen?.().catch((err) => console.warn(err));
    } else {
      document.exitFullscreen?.().catch((err) => console.warn(err));
    }
  };

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

  // Related & Playlist videos
  const currentPlaylist = playlists.find((p) => p.itemIds.includes(media.id));
  const playlistItems = currentPlaylist
    ? (currentPlaylist.itemIds.map((id) => allVideos.find((v) => v.id === id)).filter(Boolean) as MediaItem[])
    : [];

  const relatedVideos = allVideos.filter((v) => v.id !== media.id);

  return (
    <div ref={containerRef} className="flex-1 w-full h-full flex flex-col bg-[#0A0C10] select-none overflow-y-auto no-scrollbar">
      {/* 1. STICKY TOP 16:9 VIDEO PLAYER */}
      <div className="sticky top-0 z-30 w-full aspect-video min-h-[210px] shrink-0 bg-black shadow-2xl overflow-hidden flex items-center justify-center relative">
        {/* Top Floating Mini Back Button & Title */}
        <div className="absolute top-2.5 left-2.5 z-40 flex items-center gap-2">
          <button
            type="button"
            onClick={onBack}
            className="w-8 h-8 rounded-full bg-black/75 hover:bg-black text-white backdrop-blur-md border border-white/20 flex items-center justify-center shadow-lg active:scale-95 transition-all"
            title="Quay lại danh sách"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        </div>

        {/* Video Render Logic */}
        {media.localFilePath ? (
          <video
            ref={videoRef}
            src={`atom://${media.localFilePath}`}
            controls
            autoPlay
            playsInline
            onTimeUpdate={handleTimeUpdate}
            className="w-full h-full object-contain absolute inset-0"
          />
        ) : isYouTube ? (
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${parsed.id}?autoplay=1&rel=0&playsinline=1&enablejsapi=1`}
            title={media.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="w-full h-full border-0 absolute inset-0"
          />
        ) : isGoogleDrive && playbackMode === 'proxy' && proxyUrl ? (
          <video
            ref={videoRef}
            src={proxyUrl}
            controls
            autoPlay
            playsInline
            onTimeUpdate={handleTimeUpdate}
            className="w-full h-full object-contain absolute inset-0"
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
            controls
            autoPlay
            playsInline
            onTimeUpdate={handleTimeUpdate}
            className="w-full h-full object-contain absolute inset-0"
          />
        )}

        {/* Floating Fullscreen button */}
        <button
          type="button"
          onClick={toggleFullscreen}
          className="absolute bottom-2 right-2 z-40 p-1.5 rounded-lg bg-black/60 hover:bg-black/80 text-white backdrop-blur-md border border-white/20 shadow-md"
          title={isFullscreen ? 'Thu nhỏ' : 'Toàn màn hình'}
        >
          {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
        </button>
      </div>

      {/* 2. PLAYBACK SERVER / MODE SELECTION PILLS */}
      {(isGoogleDrive || isYouTube) && (
        <div className="bg-[#12141A] px-3 py-2 border-b border-ice-border flex items-center justify-between gap-2 overflow-x-auto no-scrollbar shrink-0">
          <span className="text-[11px] text-ice-subtext font-semibold shrink-0">Phương thức phát:</span>
          <div className="flex items-center gap-1.5 shrink-0">
            {isGoogleDrive && (
              <>
                <button
                  type="button"
                  onClick={() => setPlaybackMode('proxy')}
                  className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all ${
                    playbackMode === 'proxy'
                      ? 'bg-amber-500 text-black shadow-sm'
                      : 'bg-white/5 text-ice-subtext hover:text-white border border-white/10'
                  }`}
                >
                  🚀 Proxy VIP 1080p
                </button>
                <button
                  type="button"
                  onClick={() => setPlaybackMode('direct')}
                  className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all ${
                    playbackMode === 'direct'
                      ? 'bg-amber-500 text-black shadow-sm'
                      : 'bg-white/5 text-ice-subtext hover:text-white border border-white/10'
                  }`}
                >
                  🌐 Drive Preview
                </button>
              </>
            )}

            {isYouTube ? (
              <button
                type="button"
                onClick={() => window.open(media.link, '_blank')}
                className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-red-600/20 text-red-300 border border-red-500/30 flex items-center gap-1 hover:bg-red-600/30 transition-colors"
                title="Mở ứng dụng hoặc trang YouTube"
              >
                <ExternalLink className="w-3 h-3 text-red-400" />
                <span>Mở YouTube</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => window.open(media.link, '_blank')}
                className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-white/10 text-white/90 border border-white/15 flex items-center gap-1 hover:bg-white/20 transition-colors"
                title="Mở link trên trình duyệt ngoài"
              >
                <ExternalLink className="w-3 h-3 text-amber-400" />
                <span>Mở web ngoài</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* 3. MOVIE DETAILS & ACTIONS CONTAINER */}
      <div className="p-3.5 space-y-3">
        {/* Title & Category */}
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
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

          {/* Description */}
          {media.description && (
            <div className="text-xs text-ice-subtext leading-relaxed">
              <p className={showFullDesc ? '' : 'line-clamp-2'}>
                {media.description}
              </p>
              {media.description.length > 80 && (
                <button
                  type="button"
                  onClick={() => setShowFullDesc(!showFullDesc)}
                  className="text-[11px] text-ice-accent font-semibold mt-0.5"
                >
                  {showFullDesc ? 'Thu gọn' : 'Xem thêm...'}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Download / Management Row */}
        <div className="flex items-center gap-2 pt-1 border-t border-ice-border/60">
          {media.downloadStatus === 'downloaded' ? (
            <button
              type="button"
              onClick={() => onDeleteDownloaded?.(media.id)}
              className="flex-1 h-9 rounded-xl bg-red-600/15 hover:bg-red-600/25 border border-red-500/30 text-red-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Xóa bản tải offline</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onDownloadMedia?.(media.id)}
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

        {/* 4. PLAYLIST / EPISODES LIST (IF APPLICABLE) */}
        {playlistItems.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-ice-border/60">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <ListVideo className="w-4 h-4 text-amber-400" />
                <span>Danh sách tập ({playlistItems.length})</span>
              </span>
              <span className="text-[10px] text-ice-subtext">{currentPlaylist?.name}</span>
            </div>

            <div className="space-y-1.5">
              {playlistItems.map((item, idx) => {
                const isCurrent = item.id === media.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => onSelectVideo(item)}
                    className={`flex items-center gap-3 p-2 rounded-xl cursor-pointer transition-all border ${
                      isCurrent
                        ? 'bg-amber-500/20 border-amber-500/50 text-white font-bold'
                        : 'bg-ice-card hover:bg-white/5 border-ice-border/60 text-ice-text'
                    }`}
                  >
                    <div className="relative w-16 aspect-video rounded-lg overflow-hidden bg-black shrink-0">
                      <img
                        src={item.coverPath || item.bannerPath || ''}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                      {isCurrent && (
                        <div className="absolute inset-0 bg-amber-500/40 flex items-center justify-center">
                          <Play className="w-4 h-4 fill-white" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold line-clamp-1">{item.title}</p>
                      <span className="text-[10px] text-ice-subtext">Tập {idx + 1}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 5. RELATED / DISCOVER MORE VIDEOS */}
        {relatedVideos.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-ice-border/60">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Film className="w-4 h-4 text-ice-accent" />
              <span>Phim & Video liên quan</span>
            </span>

            <div className="space-y-2">
              {relatedVideos.slice(0, 6).map((item) => (
                <div
                  key={item.id}
                  onClick={() => onSelectVideo(item)}
                  className="flex items-center gap-3 p-2 rounded-xl bg-ice-card hover:bg-white/5 border border-ice-border/60 cursor-pointer transition-all"
                >
                  <div className="w-20 aspect-video rounded-lg overflow-hidden bg-black shrink-0">
                    <img
                      src={item.coverPath || item.bannerPath || ''}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <span className="text-[9px] font-semibold text-ice-accent uppercase tracking-wider">
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
