import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  ArrowLeft, 
  Play, 
  Pause, 
  Maximize, 
  Minimize, 
  Volume2, 
  VolumeX, 
  Clock, 
  Check, 
  Film, 
  Sparkles, 
  Edit3, 
  Tag, 
  Tv, 
  Download, 
  Trash2, 
  ListVideo, 
  Flame, 
  Smartphone, 
  Monitor,
  Repeat,
  Shuffle,
  ArrowUpDown,
  ArrowRight,
  Search,
  X,
  RotateCcw,
  RotateCw,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert
} from 'lucide-react';
import { formatMediaCardSubtitle, parseMediaUrl, getActiveProxyPort } from '../../utils/mediaUrl';
import type { MediaItem, MediaPlaylist } from '../../types';
import { sfx } from '../../utils/sfx';

interface VideoTheaterViewProps {
  media: MediaItem;
  allVideos: MediaItem[];
  playlists?: MediaPlaylist[];
  isAdmin: boolean;
  onBack: () => void;
  onMinimizeToMiniPlayer?: (media: MediaItem) => void;
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
  onMinimizeToMiniPlayer,
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
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isControlsHovered, setIsControlsHovered] = useState(false);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Aspect Ratio mode: '16:9' (Cinema landscape - default), '9:16' (Reel vertical), or 'auto'
  const [aspectMode, setAspectMode] = useState<'16:9' | '9:16' | 'auto'>('16:9');

  // Playlists containing this video
  const containingPlaylists = useMemo(() => {
    return playlists.filter((p) => p.itemIds?.includes(media.id));
  }, [playlists, media.id]);

  const [activePlaylistId, setActivePlaylistId] = useState<string | null>(() => {
    return containingPlaylists[0]?.id || null;
  });

  useEffect(() => {
    if (containingPlaylists.length > 0 && (!activePlaylistId || !containingPlaylists.some((p) => p.id === activePlaylistId))) {
      setActivePlaylistId(containingPlaylists[0].id);
    }
  }, [containingPlaylists, activePlaylistId]);

  const currentPlaylist = containingPlaylists.find((p) => p.id === activePlaylistId) || containingPlaylists[0];

  // Sidebar Tab: 'playlist' | 'related' | 'featured'
  const [sidebarTab, setSidebarTab] = useState<'playlist' | 'related' | 'featured'>(() => {
    return containingPlaylists.length > 0 ? 'playlist' : 'related';
  });

  useEffect(() => {
    if (containingPlaylists.length > 0) {
      setSidebarTab('playlist');
    }
  }, [media.id, containingPlaylists.length]);

  // Sidebar Controls State
  const [sidebarPlayMode, setSidebarPlayMode] = useState<'repeat' | 'sequential' | 'shuffle'>('sequential');
  const [sidebarSortAsc, setSidebarSortAsc] = useState<boolean>(true);
  const [sidebarSearch, setSidebarSearch] = useState<string>('');

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

  const [isLoadingStream, setIsLoadingStream] = useState(true);
  const [loadingStatus, setLoadingStatus] = useState('Đang nạp bộ đệm 16MB...');
  const [showFallbackPrompt, setShowFallbackPrompt] = useState(false);

  // Universal BGM Interruption: Stop background music when viewing any video
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('icelauch-pause-bgm'));
  }, [media.id, sourceMode]);

  useEffect(() => {
    setIsLoadingStream(true);
    setLoadingStatus('Đang nạp bộ đệm 16MB...');
    setShowFallbackPrompt(false);
  }, [media.id, sourceMode]);

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

  // Drive fallback timeout detection: if stream takes > 10s to load, suggest backup player
  useEffect(() => {
    if (sourceMode === 'stream' && isGoogleDrive && isLoadingStream) {
      const timer = setTimeout(() => {
        if (isLoadingStream) {
          setShowFallbackPrompt(true);
        }
      }, 10000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [sourceMode, isGoogleDrive, isLoadingStream]);

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

  // Custom Video Player Controls Handlers
  const togglePlay = () => {
    sfx.playClick();
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
      window.dispatchEvent(new CustomEvent('icelauch-pause-bgm'));
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
    sfx.playClick();
    if (!videoRef.current) return;
    const target = Math.max(0, Math.min(duration || 0, videoRef.current.currentTime + seconds));
    handleSeek(target);
  };

  const handleVolumeChange = (newVol: number) => {
    if (!videoRef.current) return;
    videoRef.current.volume = newVol;
    setVolume(newVol);
    if (newVol > 0 && isMuted) {
      videoRef.current.muted = false;
      setIsMuted(false);
    }
  };

  const toggleMute = () => {
    sfx.playClick();
    if (!videoRef.current) return;
    const nextMuted = !isMuted;
    videoRef.current.muted = nextMuted;
    setIsMuted(nextMuted);
  };

  const handleCycleSpeed = () => {
    sfx.playClick();
    if (!videoRef.current) return;
    const speeds = [0.75, 1, 1.25, 1.5, 2];
    const curIdx = speeds.indexOf(playbackRate);
    const nextSpeed = speeds[(curIdx + 1) % speeds.length];
    videoRef.current.playbackRate = nextSpeed;
    setPlaybackRate(nextSpeed);
  };

  // Sidebar Candidate Lists
  const rawPlaylistItems = useMemo(() => {
    if (!currentPlaylist) return [];
    return currentPlaylist.itemIds
      .map((id) => allVideos.find((v) => v.id === id))
      .filter(Boolean) as MediaItem[];
  }, [currentPlaylist, allVideos]);

  const rawRelatedVideos = useMemo(() => {
    return allVideos.filter((v) => {
      if (v.id === media.id) return false;
      if (media.tags && v.tags) {
        return v.tags.some((t) => media.tags!.includes(t));
      }
      return v.category === media.category;
    });
  }, [allVideos, media]);

  const rawFeaturedVideos = useMemo(() => {
    return allVideos.filter((v) => v.id !== media.id);
  }, [allVideos, media.id]);

  // Generic processor for sorting & searching internal sidebar lists
  const processSidebarList = (items: MediaItem[]) => {
    let list = [...items];
    if (sidebarSearch.trim()) {
      const q = sidebarSearch.toLowerCase().trim();
      list = list.filter((item) => {
        const titleMatch = item.title.toLowerCase().includes(q);
        const secMatch = item.secondaryTitle?.toLowerCase().includes(q);
        const epMatch = 
          item.episode?.toLowerCase().includes(q) ||
          `#${item.episode}`.toLowerCase().includes(q) ||
          `tập ${item.episode}`.toLowerCase().includes(q);
        const tagMatch = item.tags?.some((t) => t.toLowerCase().includes(q));
        return titleMatch || secMatch || epMatch || tagMatch;
      });
    }
    if (!sidebarSortAsc) {
      list.reverse();
    }
    return list;
  };

  const processedPlaylistItems = useMemo(() => processSidebarList(rawPlaylistItems), [rawPlaylistItems, sidebarSearch, sidebarSortAsc]);
  const processedRelatedVideos = useMemo(() => processSidebarList(rawRelatedVideos), [rawRelatedVideos, sidebarSearch, sidebarSortAsc]);
  const processedFeaturedVideos = useMemo(() => processSidebarList(rawFeaturedVideos), [rawFeaturedVideos, sidebarSearch, sidebarSortAsc]);

  const activeSidebarItems = sidebarTab === 'playlist'
    ? processedPlaylistItems
    : sidebarTab === 'related'
    ? processedRelatedVideos
    : processedFeaturedVideos;

  // Auto-next playback handler according to 3 mutually exclusive modes
  const handleVideoEnded = () => {
    onUpdateProgress?.(media.id, duration, true);

    if (sidebarPlayMode === 'repeat') {
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
        videoRef.current.play();
        setIsPlaying(true);
      }
      return;
    }

    if (activeSidebarItems.length === 0) return;

    if (sidebarPlayMode === 'shuffle') {
      const candidates = activeSidebarItems.filter((x) => x.id !== media.id);
      const target = candidates.length > 0
        ? candidates[Math.floor(Math.random() * candidates.length)]
        : activeSidebarItems[0];
      if (target) onSelectVideo(target);
      return;
    }

    // Default 'sequential'
    const curIdx = activeSidebarItems.findIndex((x) => x.id === media.id);
    if (curIdx !== -1 && curIdx < activeSidebarItems.length - 1) {
      onSelectVideo(activeSidebarItems[curIdx + 1]);
    } else if (activeSidebarItems.length > 0) {
      // Loop back to first item in sequential list
      onSelectVideo(activeSidebarItems[0]);
    }
  };

  // Determine effective aspect ratio container classes
  const isVertical = aspectMode === '9:16' || (aspectMode === 'auto' && parsed.isReel);

  // Tags
  const tagsList = media.tags && media.tags.length > 0
    ? media.tags
    : (media.category ? media.category.split(',').map((s) => s.trim()) : ['Phim & Video']);

  return (
    <div className="flex-1 flex flex-col bg-ice-bg text-ice-text overflow-y-auto select-none">
      {/* Top Navigation Bar */}
      <div className="sticky top-0 z-30 flex items-center justify-between px-6 py-3 glass-header border-b border-ice-border/60">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              sfx.playClick();
              onBack();
            }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-ice-card hover:bg-ice-hover text-ice-text text-xs font-semibold border border-ice-border transition-colors shadow-sm"
          >
            <ArrowLeft className="w-4 h-4 text-amber-500 dark:text-amber-400" />
            <span>Quay lại</span>
          </button>
          <div className="hidden sm:flex items-center gap-2 text-xs text-ice-subtext">
            <span>Rạp Giải Trí</span>
            <span>/</span>
            <span className="text-ice-text font-medium truncate max-w-sm">{media.title}</span>
            {media.episode && (
              <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-mono text-[10px] font-bold">
                #{media.episode}
              </span>
            )}
          </div>
        </div>

        {/* Quick Top Actions (Privacy Shield: External Open & Copy Link Removed) */}
        <div className="flex items-center gap-2">
          {onMinimizeToMiniPlayer && (
            <button
              onClick={() => onMinimizeToMiniPlayer(media)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-ice-accent/20 hover:bg-ice-accent/30 text-cyan-300 border border-ice-accent/40 text-xs font-semibold transition-colors shadow-sm"
              title="Thu nhỏ video xuống góc màn hình (Picture-in-Picture)"
            >
              <Minimize className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Thu nhỏ PiP</span>
            </button>
          )}

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
              onMouseEnter={() => setIsControlsHovered(true)}
              onMouseLeave={() => setIsControlsHovered(false)}
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
                  playsInline
                  preload="auto"
                  onClick={togglePlay}
                  onCanPlay={() => setIsLoadingStream(false)}
                  onWaiting={() => { setIsLoadingStream(true); setLoadingStatus('Đang nạp thêm dữ liệu...'); }}
                  onPlaying={() => {
                    setIsLoadingStream(false);
                    setIsPlaying(true);
                    window.dispatchEvent(new CustomEvent('icelauch-pause-bgm'));
                  }}
                  onPause={() => setIsPlaying(false)}
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
                  className="w-full h-full object-contain relative z-10 cursor-pointer"
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
                  onLoad={() => setIsLoadingStream(false)}
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
                  onLoad={() => setIsLoadingStream(false)}
                  className="w-full h-full border-0 relative z-10"
                />
              )}

              {/* 4. Google Drive Stream (Iframe) with Auto-Error Detection */}
              {sourceMode === 'stream' && isGoogleDrive && (
                <iframe
                  src={parsed.embedUrl}
                  title={media.title}
                  allow="autoplay; fullscreen"
                  allowFullScreen
                  onLoad={() => setIsLoadingStream(false)}
                  onError={() => {
                    setIsLoadingStream(false);
                    setShowFallbackPrompt(true);
                  }}
                  className="w-full h-full border-0 relative z-10"
                />
              )}

              {/* 5. Custom HTML5 Cinema Player (Proxy or Direct Stream) */}
              {(sourceMode === 'proxy' || (sourceMode === 'stream' && !isGoogleDrive && !isYouTube && !isFacebook)) && (
                <video
                  ref={videoRef}
                  src={sourceMode === 'proxy' && proxyUrl ? proxyUrl : media.link}
                  autoPlay
                  playsInline
                  preload="auto"
                  onClick={togglePlay}
                  onCanPlay={() => setIsLoadingStream(false)}
                  onWaiting={() => { setIsLoadingStream(true); setLoadingStatus('Đang nạp thêm dữ liệu...'); }}
                  onPlaying={() => {
                    setIsLoadingStream(false);
                    setIsPlaying(true);
                    window.dispatchEvent(new CustomEvent('icelauch-pause-bgm'));
                  }}
                  onPause={() => setIsPlaying(false)}
                  onError={() => {
                    setIsLoadingStream(false);
                    setShowFallbackPrompt(true);
                  }}
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
                  className="w-full h-full object-contain relative z-10 cursor-pointer"
                />
              )}

              {/* Custom Controls Overlay for HTML5 Cinema Player */}
              {(sourceMode === 'proxy' || sourceMode === 'offline' || (sourceMode === 'stream' && !isGoogleDrive && !isYouTube && !isFacebook)) && (
                <div
                  className={`absolute inset-0 z-20 flex flex-col justify-between p-4 bg-gradient-to-t from-black/90 via-transparent to-black/40 transition-opacity duration-300 pointer-events-none ${
                    isControlsHovered || !isPlaying ? 'opacity-100' : 'opacity-0'
                  }`}
                >
                  {/* Top Bar inside Player */}
                  <div className="flex items-center justify-between pointer-events-auto">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[11px] font-bold shadow-md">
                        {sourceMode === 'proxy' ? '🛡️ Trình phát Dự phòng (HTML5 Cinema)' : '⚡ Trình phát Trực tiếp'}
                      </span>
                    </div>

                    <button
                      onClick={toggleFullscreen}
                      className="p-2 rounded-lg bg-black/60 hover:bg-black/90 text-white hover:text-amber-400 border border-white/20 transition-all shadow-lg"
                      title="Toàn màn hình"
                    >
                      {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Big Center Play/Pause button on Pause */}
                  {!isPlaying && (
                    <div className="self-center pointer-events-auto">
                      <button
                        onClick={togglePlay}
                        className="w-16 h-16 rounded-full bg-amber-500/90 hover:bg-amber-400 text-black flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all"
                      >
                        <Play className="w-8 h-8 fill-black ml-1" />
                      </button>
                    </div>
                  )}

                  {/* Bottom Scrubber & Controls */}
                  <div className="space-y-2 pointer-events-auto">
                    {/* Scrubber Progress Slider */}
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min={0}
                        max={duration || 100}
                        value={currentTime}
                        onChange={(e) => handleSeek(parseFloat(e.target.value))}
                        className="w-full h-1.5 bg-white/30 rounded-lg appearance-none cursor-pointer accent-amber-500 hover:h-2 transition-all"
                      />
                    </div>

                    {/* Bottom Control Buttons */}
                    <div className="flex items-center justify-between text-white text-xs">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={togglePlay}
                          className="p-1.5 rounded-lg hover:bg-white/10 text-white hover:text-amber-400 transition-colors"
                          title={isPlaying ? 'Tạm dừng' : 'Phát'}
                        >
                          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
                        </button>

                        <button
                          onClick={() => handleSkip(-10)}
                          className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
                          title="Lùi 10 giây"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleSkip(10)}
                          className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
                          title="Tiến 10 giây"
                        >
                          <RotateCw className="w-4 h-4" />
                        </button>

                        {/* Volume Control */}
                        <div className="flex items-center gap-1.5 pl-1">
                          <button onClick={toggleMute} className="text-slate-300 hover:text-white">
                            {isMuted || volume === 0 ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
                          </button>
                          <input
                            type="range"
                            min={0}
                            max={1}
                            step={0.05}
                            value={isMuted ? 0 : volume}
                            onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                            className="w-16 h-1 bg-white/30 rounded appearance-none cursor-pointer accent-amber-500"
                          />
                        </div>

                        <span className="font-mono text-[11px] text-slate-300">
                          {formatTime(currentTime)} / {formatTime(duration)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Playback Speed Cycle */}
                        <button
                          onClick={handleCycleSpeed}
                          className="px-2 py-0.5 rounded bg-white/15 hover:bg-white/25 text-white font-mono text-[11px] font-bold transition-colors"
                          title="Tốc độ phát"
                        >
                          {playbackRate}x
                        </button>

                        <button
                          onClick={toggleFullscreen}
                          className="p-1.5 rounded hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
                          title="Toàn màn hình"
                        >
                          <Maximize className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Amber Cinematic Loading Overlay (< 0.5s) */}
              {isLoadingStream && (
                <div className="absolute inset-0 bg-black/70 backdrop-blur-sm z-20 flex flex-col items-center justify-center gap-3 transition-opacity duration-300 pointer-events-none">
                  <div className="relative flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full border-4 border-amber-500/20 border-t-amber-500 animate-spin" />
                    <Flame className="w-5 h-5 text-amber-400 absolute animate-pulse" />
                  </div>
                  <span className="text-xs font-bold text-amber-300/90 tracking-wide font-mono animate-pulse">
                    {loadingStatus}
                  </span>
                </div>
              )}

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

            {/* Interactive Fallback Prompt Dialog when Drive encounters an issue */}
            {showFallbackPrompt && (
              <div className="p-4 rounded-2xl bg-amber-950/40 border-2 border-amber-500/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/40">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-bold text-amber-300">
                      Trình phát Drive đang gặp sự cố tải hoặc mạng chậm
                    </h4>
                    <p className="text-[11px] text-ice-subtext">
                      Bạn có muốn đổi sang <strong className="text-amber-400">Trình phát Dự phòng (HTML5 Cinema)</strong> để phát mượt hơn không?
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <button
                    onClick={() => setShowFallbackPrompt(false)}
                    className="px-3 py-1.5 rounded-lg text-ice-subtext hover:text-white text-xs transition-colors"
                  >
                    Tiếp tục đợi Drive
                  </button>
                  <button
                    onClick={() => {
                      sfx.playSuccess();
                      setSourceMode('proxy');
                      setShowFallbackPrompt(false);
                    }}
                    className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold shadow-md shadow-amber-500/20 transition-all flex items-center gap-1.5"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Đổi sang Trình phát Dự phòng</span>
                  </button>
                </div>
              </div>
            )}

            {/* Sub-Video Control & Playback Source Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-ice-card border border-ice-border shadow-md">
              {/* Playback Source Dropdown & Quick Backup Toggle */}
              <div className="flex flex-wrap items-center gap-2.5">
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
                    className="bg-ice-card text-ice-text border border-ice-border hover:border-amber-400 focus:border-amber-400 rounded-xl px-3 py-1.5 text-xs font-bold outline-none cursor-pointer transition-colors pr-8 appearance-none shadow-inner"
                  >
                    {isDownloaded && (
                      <option value="offline" className="bg-ice-card text-emerald-400">
                        💾 Bản Offline (Đã tải về máy)
                      </option>
                    )}
                    {isGoogleDrive && (
                      <>
                        <option value="stream" className="bg-ice-card text-blue-400">
                          ⚡ Google Drive Trực Tiếp
                        </option>
                        <option value="proxy" className="bg-ice-card text-amber-400">
                          🛡️ Trình phát Dự phòng (HTML5 Cinema Player)
                        </option>
                      </>
                    )}
                    {isYouTube && (
                      <option value="youtube" className="bg-ice-card text-red-400">
                        ▶️ YouTube HD Player
                      </option>
                    )}
                    {isFacebook && (
                      <option value="facebook" className="bg-ice-card text-blue-400">
                        🎬 Facebook Video Player
                      </option>
                    )}
                  </select>
                  <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-ice-muted text-[10px]">
                    ▼
                  </div>
                </div>

                {/* Instant Backup Player Switch Button for Drive */}
                {isGoogleDrive && (
                  <button
                    onClick={() => {
                      sfx.playClick();
                      setSourceMode(sourceMode === 'stream' ? 'proxy' : 'stream');
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                      sourceMode === 'proxy'
                        ? 'bg-amber-500 text-black border-amber-400 shadow-sm'
                        : 'bg-ice-hover text-ice-subtext hover:text-white border-ice-border'
                    }`}
                    title="Chuyển đổi giữa Trình phát Google Drive và Trình phát Dự phòng"
                  >
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
                    <span>{sourceMode === 'proxy' ? 'Đang dùng: Trình phát Dự phòng' : 'Đổi sang Trình phát Dự phòng'}</span>
                  </button>
                )}

                {sourceMode === 'offline' && (
                  <span className="hidden md:inline-flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                    <Check className="w-3 h-3" /> Chơi mượt không tốn mạng
                  </span>
                )}
              </div>

              {/* Aspect Ratio, Download & Action Buttons */}
              <div className="flex items-center gap-2">
                {/* Aspect Ratio Toggle */}
                <div className="flex items-center gap-1 bg-ice-hover/50 border border-ice-border/60 p-1 rounded-xl">
                  <button
                    onClick={() => {
                      sfx.playClick();
                      setAspectMode('16:9');
                    }}
                    className={`px-2 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                      aspectMode === '16:9'
                        ? 'bg-amber-500/20 text-amber-500 border border-amber-500/40 shadow-sm'
                        : 'text-ice-subtext hover:text-ice-text'
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
                        ? 'bg-amber-500/20 text-amber-500 border border-amber-500/40 shadow-sm'
                        : 'text-ice-subtext hover:text-ice-text'
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

            {/* Video Meta Info: Movie Title, #Episode Badge & Secondary Title */}
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
                  {(media as any).year && (
                    <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-ice-hover text-ice-muted">
                      {(media as any).year}
                    </span>
                  )}
                  {(media as any).rating && (
                    <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-ice-hover text-ice-muted">
                      ★ {(media as any).rating}
                    </span>
                  )}
                </div>

                {/* Main Title + Episode Badge */}
                <div className="flex items-baseline flex-wrap gap-2.5">
                  <h1 className="text-2xl font-extrabold text-ice-text tracking-tight leading-snug">
                    {media.title}
                  </h1>
                  {media.episode && (
                    <span className="px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-sm">
                      #{media.episode}
                    </span>
                  )}
                </div>

                {/* Secondary Title (Tên khác / Tên phụ) */}
                {media.secondaryTitle && (
                  <p className="text-sm font-medium text-ice-subtext italic">
                    {media.secondaryTitle}
                  </p>
                )}

                {/* All Playlists containing this video: 1-click navigation */}
                {containingPlaylists.length > 0 && (
                  <div className="pt-2 flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-ice-subtext flex items-center gap-1.5">
                      <ListVideo className="w-3.5 h-3.5 text-amber-400" />
                      <span>Thuộc danh sách phát:</span>
                    </span>
                    {containingPlaylists.map((pl) => (
                      <button
                        key={pl.id}
                        onClick={() => {
                          sfx.playClick();
                          setActivePlaylistId(pl.id);
                          setSidebarTab('playlist');
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                          sidebarTab === 'playlist' && activePlaylistId === pl.id
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow'
                            : 'bg-ice-card hover:bg-ice-hover text-ice-text border-ice-border'
                        }`}
                        title="Bấm để xem danh sách phát này trong cột bên cạnh"
                      >
                        <ListVideo className="w-3 h-3 text-amber-400" />
                        <span>{pl.name}</span>
                        <span className="text-[10px] text-ice-muted">({pl.itemIds?.length || 0})</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {media.description && (
                <div className="pt-2 border-t border-ice-border/40 text-sm text-ice-text/90 leading-relaxed whitespace-pre-line">
                  {media.description}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: Sidebar Tabs & Controls (Playlist / Related / Featured) */}
          <div className="lg:col-span-4 space-y-3">
            {/* 1. Sidebar Navigation Tabs */}
            <div className="flex items-center p-1 bg-ice-card border border-ice-border/60 rounded-xl">
              {containingPlaylists.length > 0 && (
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
                  Cùng Series ({containingPlaylists.length})
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

            {/* 2. Recommendation Toolbar: 3 Play Modes + Sort + Search */}
            <div className="p-2.5 bg-ice-card border border-ice-border/60 rounded-xl space-y-2">
              <div className="flex items-center justify-between gap-1">
                {/* 3 Playback Modes (Mutually exclusive: Repeat One | Sequential | Shuffle) */}
                <div className="flex items-center gap-1 p-0.5 bg-ice-bg rounded-lg border border-ice-border/40">
                  <button
                    onClick={() => {
                      sfx.playClick();
                      setSidebarPlayMode('repeat');
                    }}
                    className={`p-1.5 rounded text-xs transition-all flex items-center gap-1 ${
                      sidebarPlayMode === 'repeat'
                        ? 'bg-amber-500 text-black font-bold shadow-sm'
                        : 'text-ice-subtext hover:text-white'
                    }`}
                    title="Phát lặp lại (Chỉ lặp lại phim/video đang xem)"
                  >
                    <Repeat className="w-3.5 h-3.5" />
                    <span className="text-[10px] hidden sm:inline">Lặp lại</span>
                  </button>

                  <button
                    onClick={() => {
                      sfx.playClick();
                      setSidebarPlayMode('sequential');
                    }}
                    className={`p-1.5 rounded text-xs transition-all flex items-center gap-1 ${
                      sidebarPlayMode === 'sequential'
                        ? 'bg-amber-500 text-black font-bold shadow-sm'
                        : 'text-ice-subtext hover:text-white'
                    }`}
                    title="Phát theo thứ tự danh sách"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                    <span className="text-[10px] hidden sm:inline">Theo thứ tự</span>
                  </button>

                  <button
                    onClick={() => {
                      sfx.playClick();
                      setSidebarPlayMode('shuffle');
                    }}
                    className={`p-1.5 rounded text-xs transition-all flex items-center gap-1 ${
                      sidebarPlayMode === 'shuffle'
                        ? 'bg-amber-500 text-black font-bold shadow-sm'
                        : 'text-ice-subtext hover:text-white'
                    }`}
                    title="Phát ngẫu nhiên"
                  >
                    <Shuffle className="w-3.5 h-3.5" />
                    <span className="text-[10px] hidden sm:inline">Ngẫu nhiên</span>
                  </button>
                </div>

                {/* Sort Order Button (1 -> N vs N -> 1) */}
                <button
                  onClick={() => {
                    sfx.playClick();
                    setSidebarSortAsc(!sidebarSortAsc);
                  }}
                  className={`p-1.5 rounded-lg border transition-all flex items-center gap-1 text-xs ${
                    sidebarSortAsc
                      ? 'bg-ice-hover text-ice-text border-ice-border hover:text-white'
                      : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  }`}
                  title={sidebarSortAsc ? 'Thứ tự: Từ trên xuống (1 → N)' : 'Thứ tự: Từ dưới lên (N → 1)'}
                >
                  <ArrowUpDown className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-[10px] font-mono">{sidebarSortAsc ? '1→N' : 'N→1'}</span>
                </button>
              </div>

              {/* Internal List Search Input */}
              <div className="relative flex items-center">
                <Search className="w-3.5 h-3.5 text-ice-subtext absolute left-2.5 pointer-events-none" />
                <input
                  type="text"
                  value={sidebarSearch}
                  onChange={(e) => setSidebarSearch(e.target.value)}
                  placeholder="Tìm trong danh sách này..."
                  className="w-full bg-ice-bg border border-ice-border/60 rounded-lg pl-8 pr-7 py-1 text-xs text-ice-text placeholder-ice-subtext focus:outline-none focus:border-amber-400"
                />
                {sidebarSearch && (
                  <button
                    onClick={() => setSidebarSearch('')}
                    className="absolute right-2 text-ice-subtext hover:text-white"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* 3. Sidebar Items List Container */}
            <div className="p-4 rounded-2xl bg-ice-card/60 border border-ice-border/60 space-y-3">
              {/* Tab 1: Current Playlist / Series */}
              {sidebarTab === 'playlist' && currentPlaylist && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between pb-2 border-b border-ice-border/40">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <ListVideo className="w-4 h-4 text-amber-400" />
                      <span>{currentPlaylist.name}</span>
                    </span>
                    <span className="text-[11px] text-ice-muted">{processedPlaylistItems.length} tập</span>
                  </div>

                  {/* Multiple playlists switcher if video belongs to > 1 */}
                  {containingPlaylists.length > 1 && (
                    <div className="flex items-center gap-1.5 pb-1">
                      <span className="text-[10px] text-ice-subtext shrink-0">Chọn Series:</span>
                      <select
                        value={activePlaylistId || ''}
                        onChange={(e) => setActivePlaylistId(e.target.value)}
                        className="bg-ice-bg border border-ice-border rounded-lg px-2 py-0.5 text-xs text-ice-text flex-1"
                      >
                        {containingPlaylists.map((pl) => (
                          <option key={pl.id} value={pl.id}>
                            {pl.name} ({pl.itemIds?.length || 0} tập)
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                    {processedPlaylistItems.length === 0 ? (
                      <p className="text-xs text-ice-muted py-6 text-center">Không tìm thấy video phù hợp</p>
                    ) : (
                      processedPlaylistItems.map((item, idx) => {
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
                            <span className={`w-5 text-center text-xs font-bold ${isCurrent ? 'text-amber-500 dark:text-amber-400' : 'text-ice-muted'}`}>
                              {idx + 1}
                            </span>
                            <div className="flex-1 truncate">
                              <h4 className={`text-xs font-semibold truncate ${isCurrent ? 'text-amber-700 dark:text-amber-300' : 'text-ice-text'}`}>
                                {item.title}
                              </h4>
                              <p className="text-[10px] text-ice-subtext truncate">
                                {formatMediaCardSubtitle(item)}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {/* Tab 2: Related Videos */}
              {sidebarTab === 'related' && (
                <div className="space-y-2">
                  <div className="pb-2 border-b border-ice-border/40">
                    <span className="text-xs font-bold text-ice-text flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-ice-accent" />
                      <span>Video Cùng Thể Loại ({processedRelatedVideos.length})</span>
                    </span>
                  </div>

                  <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                    {processedRelatedVideos.length === 0 ? (
                      <p className="text-xs text-ice-muted py-6 text-center">Không có video phù hợp</p>
                    ) : (
                      processedRelatedVideos.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => {
                            sfx.playClick();
                            onSelectVideo(item);
                          }}
                          className="flex items-center gap-3 p-2 rounded-xl hover:bg-ice-hover cursor-pointer transition-all border border-transparent hover:border-ice-border/60"
                        >
                          <div className="w-20 aspect-video rounded-lg overflow-hidden bg-ice-hover/50 shrink-0 border border-ice-border/40">
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
                            <h4 className="text-xs font-semibold text-ice-text truncate">{item.title}</h4>
                            <p className="text-[10px] text-ice-subtext truncate">
                              {formatMediaCardSubtitle(item)}
                            </p>
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
                    <span className="text-xs font-bold text-ice-text flex items-center gap-1.5">
                      <Flame className="w-4 h-4 text-orange-400" />
                      <span>Video Thịnh Hành / Nổi Bật ({processedFeaturedVideos.length})</span>
                    </span>
                  </div>

                  <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                    {processedFeaturedVideos.length === 0 ? (
                      <p className="text-xs text-ice-muted py-6 text-center">Không có video phù hợp</p>
                    ) : (
                      processedFeaturedVideos.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => {
                            sfx.playClick();
                            onSelectVideo(item);
                          }}
                          className="flex items-center gap-3 p-2 rounded-xl hover:bg-ice-hover cursor-pointer transition-all border border-transparent hover:border-ice-border/60"
                        >
                          <div className="w-20 aspect-video rounded-lg overflow-hidden bg-ice-hover/50 shrink-0 border border-ice-border/40">
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
                            <h4 className="text-xs font-semibold text-ice-text truncate">{item.title}</h4>
                            <p className="text-[10px] text-ice-subtext truncate">
                              {formatMediaCardSubtitle(item)}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
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
