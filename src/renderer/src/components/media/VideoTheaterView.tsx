import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, 
  Play, 
  Pause, 
  Maximize, 
  Minimize, 
  Volume2, 
  VolumeX, 
  Clock, 
  ExternalLink, 
  Copy, 
  Check, 
  Film, 
  Sparkles, 
  Edit3, 
  Tag, 
  Share2,
  Tv,
  Download,
  Trash2,
  ListVideo,
  Flame,
  Smartphone,
  Monitor
} from 'lucide-react';
import { parseMediaUrl, getActiveProxyPort } from '../../utils/mediaUrl';
import type { MediaItem, MediaPlaylist } from '../../types';
import { sfx } from '../../utils/sfx';

interface VideoTheaterViewProps {
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

export const VideoTheaterView: React.FC<VideoTheaterViewProps> = ({
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
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(media.duration || 0);
  const [copied, setCopied] = useState(false);

  // Aspect Ratio mode: '16:9' (Cinema landscape - default as requested), '9:16' (Reel vertical), or 'auto'
  const [aspectMode, setAspectMode] = useState<'16:9' | '9:16' | 'auto'>('16:9');

  // Sidebar Tab: 'playlist' | 'related' | 'featured'
  const currentPlaylist = playlists.find((p) => p.itemIds.includes(media.id));
  const [sidebarTab, setSidebarTab] = useState<'playlist' | 'related' | 'featured'>(
    currentPlaylist ? 'playlist' : 'related'
  );

  const parsed = parseMediaUrl(media.link);
  const isYouTube = parsed.kind === 'youtube';
  const isGoogleDrive = parsed.kind === 'gdrive';
  const isFacebook = parsed.kind === 'facebook';
  const isDownloaded = Boolean(media.localFilePath && media.downloadStatus === 'downloaded');

  // Source selection state
  type SourceType = 'offline' | 'stream' | 'proxy' | 'youtube' | 'facebook' | 'direct';
  const [sourceMode, setSourceMode] = useState<SourceType>(() => {
    if (isDownloaded) return 'offline';
    if (isYouTube) return 'youtube';
    if (isFacebook) return 'facebook';
    return 'stream';
  });

  useEffect(() => {
    if (isDownloaded) {
      setSourceMode('offline');
    } else if (isYouTube) {
      setSourceMode('youtube');
    } else if (isFacebook) {
      setSourceMode('facebook');
    } else {
      setSourceMode('stream');
    }
  }, [media.id, isDownloaded, isYouTube, isFacebook]);

  // Construct local streaming proxy URL for Drive if in proxy mode
  const proxyUrl = parsed.id ? `http://127.0.0.1:${getActiveProxyPort()}/drive/${parsed.id}` : null;

  // Check last position for resume
  const [resumePrompt, setResumePrompt] = useState<{ show: boolean; position: number }>({
    show: false,
    position: 0,
  });

  useEffect(() => {
    if (media.lastPosition && media.lastPosition > 10 && !media.watched) {
      setResumePrompt({ show: true, position: media.lastPosition });
    } else {
      setResumePrompt({ show: false, position: 0 });
    }
  }, [media.id]);

  // Fullscreen change listener
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
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

  const handleCopyLink = () => {
    sfx.playClick();
    navigator.clipboard.writeText(media.link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return '00:00';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    if (hrs > 0) {
      return `${hrs}:${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
    }
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Playlists and Related videos
  const playlistItems = currentPlaylist
    ? currentPlaylist.itemIds.map((id) => allVideos.find((v) => v.id === id)).filter(Boolean) as MediaItem[]
    : [];

  const relatedVideos = allVideos.filter((v) => {
    if (v.id === media.id) return false;
    if (media.tags && v.tags) {
      return v.tags.some((t) => media.tags!.includes(t));
    }
    return v.category === media.category;
  });

  const featuredVideos = allVideos.filter((v) => v.id !== media.id);

  // Auto-next track when current video ends
  const handleVideoEnded = () => {
    onUpdateProgress?.(media.id, duration, true);
    if (playlistItems.length > 0) {
      const idx = playlistItems.findIndex((x) => x.id === media.id);
      if (idx !== -1 && idx < playlistItems.length - 1) {
        onSelectVideo(playlistItems[idx + 1]);
      }
    } else if (relatedVideos.length > 0) {
      onSelectVideo(relatedVideos[0]);
    }
  };

  // Determine effective aspect ratio container classes
  const isVertical = aspectMode === '9:16' || (aspectMode === 'auto' && parsed.isReel);

  // Tags
  const tagsList = media.tags && media.tags.length > 0
    ? media.tags
    : (media.category ? media.category.split(',').map((s) => s.trim()) : ['Phim & Video']);

  return (
    <div className="flex-1 flex flex-col bg-[#0A0C10] text-ice-text overflow-y-auto select-none">
      {/* Top Navigation Bar */}
      <div className="sticky top-0 z-30 flex items-center justify-between px-6 py-3 bg-[#0F1115]/90 backdrop-blur-md border-b border-ice-border/60">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              sfx.playClick();
              onBack();
            }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-ice-card hover:bg-ice-hover text-white text-xs font-semibold border border-ice-border transition-colors shadow-sm"
          >
            <ArrowLeft className="w-4 h-4 text-amber-400" />
            <span>Quay lại</span>
          </button>
          <div className="hidden sm:flex items-center gap-2 text-xs text-ice-subtext">
            <span>Rạp Giải Trí</span>
            <span>/</span>
            <span className="text-white font-medium truncate max-w-sm">{media.title}</span>
          </div>
        </div>

        {/* Quick Top Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.open(media.link, '_blank')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-ice-card hover:bg-ice-hover text-ice-text hover:text-white border border-ice-border text-xs transition-colors"
            title="Mở trên trình duyệt web ngoài"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Mở ngoài</span>
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded-lg bg-ice-card hover:bg-ice-hover text-ice-text hover:text-white border border-ice-border text-xs transition-colors"
            title={isFullscreen ? 'Thu nhỏ' : 'Toàn màn hình'}
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Theater Stage */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-6 lg:p-8 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT: Video Player Stage */}
          <div className="lg:col-span-8 space-y-4">
            <div
              ref={containerRef}
              className={`relative w-full rounded-2xl overflow-hidden bg-black border border-ice-border/80 shadow-2xl group/player flex items-center justify-center ${
                isVertical ? 'aspect-[9/16] max-h-[75vh] mx-auto' : 'aspect-video'
              }`}
            >
              {/* Ambient Glow Backdrop for vertical 9:16 Reels */}
              {isVertical && (
                <div
                  className="absolute inset-0 bg-cover bg-center filter blur-2xl opacity-40 scale-125 pointer-events-none"
                  style={{
                    backgroundImage: media.coverPath
                      ? `url(${media.coverPath.startsWith('http') ? media.coverPath : `file://${media.coverPath}`})`
                      : undefined,
                  }}
                />
              )}

              {/* 1. Offline Local File Player */}
              {sourceMode === 'offline' && media.localFilePath && (
                <video
                  ref={videoRef}
                  src={`file://${media.localFilePath}`}
                  autoPlay
                  controls
                  playsInline
                  onTimeUpdate={() => {
                    if (videoRef.current) {
                      setCurrentTime(videoRef.current.currentTime);
                      onUpdateProgress?.(media.id, videoRef.current.currentTime, false);
                    }
                  }}
                  onLoadedMetadata={() => {
                    if (videoRef.current) setDuration(videoRef.current.duration);
                  }}
                  onEnded={handleVideoEnded}
                  className="w-full h-full object-contain relative z-10"
                />
              )}

              {/* 2. YouTube Embedded Player */}
              {sourceMode === 'youtube' && (
                <iframe
                  src={parsed.embedUrl}
                  title={media.title}
                  referrerPolicy="strict-origin-when-cross-origin"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="w-full h-full border-0 relative z-10"
                />
              )}

              {/* 3. Facebook Video Plugin Player */}
              {sourceMode === 'facebook' && (
                <iframe
                  src={parsed.embedUrl}
                  title={media.title}
                  allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                  allowFullScreen
                  className="w-full h-full border-0 relative z-10"
                />
              )}

              {/* 4. Google Drive Stream (Iframe) */}
              {sourceMode === 'stream' && isGoogleDrive && (
                <iframe
                  src={parsed.embedUrl}
                  title={media.title}
                  allow="autoplay; fullscreen"
                  allowFullScreen
                  className="w-full h-full border-0 relative z-10"
                />
              )}

              {/* 5. HTML5 Proxy or Direct Stream Player */}
              {(sourceMode === 'proxy' || (sourceMode === 'stream' && !isGoogleDrive && !isYouTube && !isFacebook)) && (
                <video
                  ref={videoRef}
                  src={sourceMode === 'proxy' && proxyUrl ? proxyUrl : media.link}
                  autoPlay
                  controls
                  playsInline
                  onTimeUpdate={() => {
                    if (videoRef.current) {
                      setCurrentTime(videoRef.current.currentTime);
                      onUpdateProgress?.(media.id, videoRef.current.currentTime, false);
                    }
                  }}
                  onLoadedMetadata={() => {
                    if (videoRef.current) setDuration(videoRef.current.duration);
                  }}
                  onEnded={handleVideoEnded}
                  className="w-full h-full object-contain relative z-10"
                />
              )}

              {/* Fullscreen Button Overlay on Hover */}
              <div className="absolute top-3 right-3 flex items-center gap-2 opacity-0 group-hover/player:opacity-100 transition-opacity z-20">
                <button
                  onClick={toggleFullscreen}
                  className="p-2 rounded-lg bg-black/70 backdrop-blur-md text-white hover:text-amber-400 border border-white/20 transition-all shadow-lg"
                  title="Toàn màn hình"
                >
                  {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                </button>
              </div>

              {/* Resume Prompt Banner */}
              {resumePrompt.show && (
                <div className="absolute bottom-6 left-6 z-30 flex items-center gap-3 px-4 py-2.5 rounded-xl bg-black/85 backdrop-blur-md border border-amber-500/50 shadow-2xl animate-in fade-in duration-300">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span className="text-xs text-white">
                    Tiếp tục xem từ <strong className="text-amber-300 font-mono">{formatTime(resumePrompt.position)}</strong>?
                  </span>
                  <button
                    onClick={() => {
                      sfx.playClick();
                      if (videoRef.current) {
                        videoRef.current.currentTime = resumePrompt.position;
                      }
                      setResumePrompt({ show: false, position: 0 });
                    }}
                    className="px-2.5 py-1 rounded bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition-colors"
                  >
                    Xem tiếp
                  </button>
                  <button
                    onClick={() => setResumePrompt({ show: false, position: 0 })}
                    className="text-xs text-ice-muted hover:text-white"
                  >
                    Bỏ qua
                  </button>
                </div>
              )}
            </div>

            {/* Sub-Video Control & Playback Source Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-ice-card border border-ice-border shadow-md">
              {/* Playback Source Dropdown */}
              <div className="flex items-center gap-2.5">
                <div className="flex items-center gap-1.5 text-xs text-ice-subtext font-semibold">
                  <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="hidden sm:inline">Nguồn phát:</span>
                </div>

                <div className="relative">
                  <select
                    value={sourceMode}
                    onChange={(e) => {
                      sfx.playClick();
                      setSourceMode(e.target.value as any);
                    }}
                    className="bg-[#0B0D13] text-white border border-ice-border hover:border-amber-400 focus:border-amber-400 rounded-xl px-3 py-1.5 text-xs font-bold outline-none cursor-pointer transition-colors pr-8 appearance-none shadow-inner"
                  >
                    {isDownloaded && (
                      <option value="offline" className="bg-[#171A21] text-emerald-300">
                        💾 Bản Offline (Đã tải về máy)
                      </option>
                    )}
                    {isGoogleDrive && (
                      <>
                        <option value="stream" className="bg-[#171A21] text-blue-300">
                          ⚡ Google Drive Trực Tiếp
                        </option>
                        <option value="proxy" className="bg-[#171A21] text-amber-300">
                          🛡️ HTML5 Local Proxy (Chống lỗi Drive)
                        </option>
                      </>
                    )}
                    {isYouTube && (
                      <option value="youtube" className="bg-[#171A21] text-red-400">
                        ▶️ YouTube HD Player
                      </option>
                    )}
                    {isFacebook && (
                      <option value="facebook" className="bg-[#171A21] text-blue-400">
                        🎬 Facebook Video Player
                      </option>
                    )}
                  </select>
                  <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-ice-muted text-[10px]">
                    ▼
                  </div>
                </div>

                {sourceMode === 'offline' && (
                  <span className="hidden md:inline-flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                    <Check className="w-3 h-3" /> Chơi mượt không tốn mạng
                  </span>
                )}
              </div>

              {/* Aspect Ratio, Download & Action Buttons */}
              <div className="flex items-center gap-2">
                {/* Aspect Ratio Toggle */}
                <div className="flex items-center gap-1 bg-black/40 border border-ice-border/60 p-1 rounded-xl">
                  <button
                    onClick={() => {
                      sfx.playClick();
                      setAspectMode('16:9');
                    }}
                    className={`px-2 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                      aspectMode === '16:9'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                        : 'text-ice-muted hover:text-white'
                    }`}
                    title="Khung chuẩn 16:9 Điện ảnh"
                  >
                    <Monitor className="w-3.5 h-3.5" />
                    <span>16:9</span>
                  </button>
                  <button
                    onClick={() => {
                      sfx.playClick();
                      setAspectMode('9:16');
                    }}
                    className={`px-2 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                      aspectMode === '9:16'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                        : 'text-ice-muted hover:text-white'
                    }`}
                    title="Khung dọc 9:16 Reel"
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>9:16</span>
                  </button>
                </div>

                {/* Download / Delete */}
                {!isDownloaded ? (
                  <button
                    onClick={() => {
                      sfx.playClick();
                      onDownloadMedia?.(media.id);
                    }}
                    disabled={media.downloadStatus === 'downloading'}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-ice-hover hover:bg-ice-accent/20 text-ice-accent border border-ice-accent/40 text-xs font-semibold transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{media.downloadStatus === 'downloading' ? `Đang tải ${media.downloadProgress || 0}%` : 'Tải về'}</span>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      sfx.playClick();
                      if (confirm('Bạn có muốn xoá file video tải về trên máy để giải phóng dung lượng ổ cứng?')) {
                        onDeleteDownloaded?.(media.id);
                      }
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-semibold transition-colors"
                    title="Xoá bản video tải về máy"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Xoá bản tải</span>
                  </button>
                )}

                {/* Copy Link */}
                <button
                  onClick={handleCopyLink}
                  className="p-2 rounded-xl bg-ice-card hover:bg-ice-hover text-ice-muted hover:text-white border border-ice-border transition-colors"
                  title="Sao chép link video"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>

                {/* Admin Edit */}
                {isAdmin && onEditMedia && (
                  <button
                    onClick={() => {
                      sfx.playClick();
                      onEditMedia(media);
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 text-xs font-bold transition-all"
                    title="Chỉnh sửa thông tin"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Sửa</span>
                  </button>
                )}
              </div>
            </div>

            {/* Video Meta Info */}
            <div className="p-6 rounded-2xl bg-ice-card/60 border border-ice-border/60 space-y-4">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  {tagsList.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-ice-accent/15 border border-ice-accent/30 text-[11px] font-semibold text-ice-accent tracking-wide"
                    >
                      <Tag className="w-3 h-3" />
                      {tag}
                    </span>
                  ))}
                  {isDownloaded && (
                    <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-500/40 text-[11px] font-bold text-emerald-300">
                      ĐÃ TẢI VỀ MÁY
                    </span>
                  )}
                  {currentPlaylist && (
                    <span className="px-2.5 py-0.5 rounded-md bg-amber-500/20 border border-amber-500/40 text-[11px] font-bold text-amber-300">
                      {currentPlaylist.name}
                    </span>
                  )}
                </div>

                <h1 className="text-2xl font-extrabold text-white tracking-tight leading-snug">
                  {media.title}
                </h1>
              </div>

              {media.description && (
                <div className="pt-2 border-t border-ice-border/40 text-sm text-ice-text/90 leading-relaxed whitespace-pre-line">
                  {media.description}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: Sidebar Tabs (Playlist / Related / Featured) */}
          <div className="lg:col-span-4 space-y-4">
            {/* Sidebar Navigation Tabs */}
            <div className="flex items-center p-1 bg-ice-card border border-ice-border/60 rounded-xl">
              {currentPlaylist && (
                <button
                  onClick={() => {
                    sfx.playClick();
                    setSidebarTab('playlist');
                  }}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all ${
                    sidebarTab === 'playlist'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow'
                      : 'text-ice-muted hover:text-white'
                  }`}
                >
                  Cùng Series
                </button>
              )}
              <button
                onClick={() => {
                  sfx.playClick();
                  setSidebarTab('related');
                }}
                className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all ${
                  sidebarTab === 'related'
                    ? 'bg-blue-600/30 text-blue-300 border border-blue-500/40 shadow'
                    : 'text-ice-muted hover:text-white'
                }`}
              >
                Gợi Ý Cùng Thể Loại
              </button>
              <button
                onClick={() => {
                  sfx.playClick();
                  setSidebarTab('featured');
                }}
                className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all ${
                  sidebarTab === 'featured'
                    ? 'bg-purple-600/30 text-purple-300 border border-purple-500/40 shadow'
                    : 'text-ice-muted hover:text-white'
                }`}
              >
                Nổi Bật
              </button>
            </div>

            {/* Sidebar Items List */}
            <div className="p-4 rounded-2xl bg-ice-card/60 border border-ice-border/60 space-y-3">
              {/* Tab 1: Current Playlist / Series */}
              {sidebarTab === 'playlist' && currentPlaylist && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between pb-2 border-b border-ice-border/40">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <ListVideo className="w-4 h-4 text-amber-400" />
                      <span>{currentPlaylist.name}</span>
                    </span>
                    <span className="text-[11px] text-ice-muted">{playlistItems.length} tập</span>
                  </div>

                  <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                    {playlistItems.map((item, idx) => {
                      const isCurrent = item.id === media.id;
                      return (
                        <div
                          key={item.id}
                          onClick={() => {
                            sfx.playClick();
                            onSelectVideo(item);
                          }}
                          className={`flex items-center gap-3 p-2 rounded-xl cursor-pointer transition-all ${
                            isCurrent
                              ? 'bg-amber-500/20 border border-amber-500/50 shadow-md'
                              : 'hover:bg-ice-hover border border-transparent'
                          }`}
                        >
                          <span className={`w-5 text-center text-xs font-bold ${isCurrent ? 'text-amber-400' : 'text-ice-muted'}`}>
                            {idx + 1}
                          </span>
                          <div className="flex-1 truncate">
                            <h4 className={`text-xs font-semibold truncate ${isCurrent ? 'text-amber-300' : 'text-white'}`}>
                              {item.title}
                            </h4>
                            <p className="text-[10px] text-ice-muted">{item.tags?.[0] || 'Tập phim'}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Tab 2: Related Videos */}
              {sidebarTab === 'related' && (
                <div className="space-y-2">
                  <div className="pb-2 border-b border-ice-border/40">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-ice-accent" />
                      <span>Video Cùng Thể Loại ({relatedVideos.length})</span>
                    </span>
                  </div>

                  <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                    {relatedVideos.length === 0 ? (
                      <p className="text-xs text-ice-muted py-6 text-center">Không có video cùng thể loại khác</p>
                    ) : (
                      relatedVideos.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => {
                            sfx.playClick();
                            onSelectVideo(item);
                          }}
                          className="flex items-center gap-3 p-2 rounded-xl hover:bg-ice-hover cursor-pointer transition-all border border-transparent hover:border-ice-border/60"
                        >
                          <div className="w-20 aspect-video rounded-lg overflow-hidden bg-black/50 shrink-0">
                            {item.coverPath ? (
                              <img
                                src={item.coverPath.startsWith('http') ? item.coverPath : `file://${item.coverPath}`}
                                alt={item.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-ice-muted">
                                <Film className="w-4 h-4" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 truncate">
                            <h4 className="text-xs font-semibold text-white truncate">{item.title}</h4>
                            <p className="text-[10px] text-ice-muted">{item.tags?.[0] || 'Video'}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Tab 3: Featured Videos */}
              {sidebarTab === 'featured' && (
                <div className="space-y-2">
                  <div className="pb-2 border-b border-ice-border/40">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Flame className="w-4 h-4 text-orange-400" />
                      <span>Video Thịnh Hành / Nổi Bật</span>
                    </span>
                  </div>

                  <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                    {featuredVideos.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => {
                          sfx.playClick();
                          onSelectVideo(item);
                        }}
                        className="flex items-center gap-3 p-2 rounded-xl hover:bg-ice-hover cursor-pointer transition-all border border-transparent hover:border-ice-border/60"
                      >
                        <div className="w-20 aspect-video rounded-lg overflow-hidden bg-black/50 shrink-0">
                          {item.coverPath ? (
                            <img
                              src={item.coverPath.startsWith('http') ? item.coverPath : `file://${item.coverPath}`}
                              alt={item.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-ice-muted">
                              <Film className="w-4 h-4" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 truncate">
                          <h4 className="text-xs font-semibold text-white truncate">{item.title}</h4>
                          <p className="text-[10px] text-ice-muted">{item.tags?.[0] || 'Video'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
