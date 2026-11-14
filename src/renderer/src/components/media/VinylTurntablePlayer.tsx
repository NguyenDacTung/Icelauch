import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  VolumeX, 
  Repeat, 
  Shuffle, 
  Download, 
  Trash2, 
  Check, 
  ListMusic, 
  Sparkles, 
  ExternalLink, 
  Disc,
  Radio,
  Share2,
  Clock
} from 'lucide-react';
import type { MediaItem, MediaPlaylist } from '../../types';
import { parseMediaUrl, getActiveProxyPort } from '../../utils/mediaUrl';
import { sfx } from '../../utils/sfx';

interface VinylTurntablePlayerProps {
  media: MediaItem;
  allAudio: MediaItem[];
  playlists: MediaPlaylist[];
  isAdmin: boolean;
  onBack: () => void;
  onSelectTrack: (item: MediaItem) => void;
  onUpdateProgress?: (id: string, position: number, watched: boolean) => void;
  onDownloadMedia?: (id: string) => void;
  onDeleteDownloaded?: (id: string) => void;
}

export const VinylTurntablePlayer: React.FC<VinylTurntablePlayerProps> = ({
  media,
  allAudio,
  playlists,
  isAdmin,
  onBack,
  onSelectTrack,
  onUpdateProgress,
  onDownloadMedia,
  onDeleteDownloaded,
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(media.lastPosition || 0);
  const [duration, setDuration] = useState(media.duration || 0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [showPlaylistDrawer, setShowPlaylistDrawer] = useState(true);
  const [selectedSource, setSelectedSource] = useState<'offline' | 'stream' | 'proxy' | 'direct'>('stream');

  const parsed = parseMediaUrl(media.link);
  const proxyUrl = parsed.id ? `http://127.0.0.1:${getActiveProxyPort()}/drive/${parsed.id}` : null;
  const isDownloaded = Boolean(media.localFilePath && media.downloadStatus === 'downloaded');

  // Determine active audio src based on selected source
  let activeAudioSrc = media.link;
  if (selectedSource === 'offline' && media.localFilePath) {
    activeAudioSrc = `file://${media.localFilePath}`;
  } else if (selectedSource === 'proxy' && proxyUrl) {
    activeAudioSrc = proxyUrl;
  } else if (selectedSource === 'stream' && isDownloaded) {
    // If downloaded, default to offline
    activeAudioSrc = `file://${media.localFilePath}`;
  }

  // Find playlist for this track
  const currentPlaylist = playlists.find((p) => p.itemIds.includes(media.id));
  const playlistTracks = currentPlaylist
    ? currentPlaylist.itemIds.map((id) => allAudio.find((a) => a.id === id)).filter(Boolean) as MediaItem[]
    : allAudio.filter((a) => a.id !== media.id);

  // Auto-set offline if file is available
  useEffect(() => {
    if (isDownloaded) {
      setSelectedSource('offline');
    } else if (proxyUrl) {
      setSelectedSource('proxy');
    } else {
      setSelectedSource('stream');
    }
  }, [media.id, isDownloaded, proxyUrl]);

  // Ensure audio tag pauses cleanly on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  // Handle Play/Pause
  const togglePlay = () => {
    sfx.playClick();
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch((e) => console.warn(e));
    }
  };

  // Skip Next / Prev
  const handleNext = () => {
    sfx.playClick();
    const list = playlistTracks.length > 0 ? playlistTracks : allAudio;
    const currIdx = list.findIndex((x) => x.id === media.id);
    if (currIdx !== -1 && currIdx < list.length - 1) {
      onSelectTrack(list[currIdx + 1]);
    } else if (list.length > 0) {
      onSelectTrack(list[0]);
    }
  };

  const handlePrev = () => {
    sfx.playClick();
    const list = playlistTracks.length > 0 ? playlistTracks : allAudio;
    const currIdx = list.findIndex((x) => x.id === media.id);
    if (currIdx > 0) {
      onSelectTrack(list[currIdx - 1]);
    } else if (list.length > 0) {
      onSelectTrack(list[list.length - 1]);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setCurrentTime(val);
    if (audioRef.current) {
      audioRef.current.currentTime = val;
    }
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '00:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Cover image
  const coverUrl = media.coverPath
    ? (media.coverPath.startsWith('http') || media.coverPath.startsWith('data:') ? media.coverPath : `file://${media.coverPath}`)
    : parsed.thumbnailUrl || '';

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0B0D11] text-white select-none overflow-hidden">
      {/* Hidden Audio Tag */}
      <audio
        ref={audioRef}
        src={activeAudioSrc}
        autoPlay
        loop={isLooping}
        onTimeUpdate={() => {
          if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
            onUpdateProgress?.(media.id, audioRef.current.currentTime, false);
          }
        }}
        onLoadedMetadata={() => {
          if (audioRef.current) {
            setDuration(audioRef.current.duration);
            if (media.lastPosition && media.lastPosition > 5 && !media.watched) {
              audioRef.current.currentTime = media.lastPosition;
            }
          }
        }}
        onEnded={() => {
          onUpdateProgress?.(media.id, duration, true);
          handleNext();
        }}
        onError={(e) => console.warn('Audio tag playback error:', e)}
      />

      {/* Top Header Bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-ice-border/60 bg-ice-card/50 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              sfx.playClick();
              onBack();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-ice-bg hover:bg-ice-hover text-ice-text hover:text-white border border-ice-border text-xs font-semibold transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay lại</span>
          </button>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1">
              <Disc className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '4s' }} />
              {currentPlaylist ? currentPlaylist.name : 'Đĩa Than Âm Nhạc'}
            </span>
            <h1 className="text-sm font-bold text-white truncate max-w-md">{media.title}</h1>
          </div>
        </div>

        {/* Source Switcher Pills */}
        <div className="flex items-center gap-2">
          {isDownloaded && (
            <button
              onClick={() => setSelectedSource('offline')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 border transition-all ${
                selectedSource === 'offline'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-md'
                  : 'bg-ice-bg text-ice-muted border-ice-border hover:text-white'
              }`}
            >
              <Check className="w-3 h-3 text-emerald-400" />
              <span>Bản Offline</span>
            </button>
          )}

          {proxyUrl && (
            <button
              onClick={() => setSelectedSource('proxy')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 border transition-all ${
                selectedSource === 'proxy'
                  ? 'bg-blue-500/20 text-blue-300 border-blue-500/50 shadow-md'
                  : 'bg-ice-bg text-ice-muted border-ice-border hover:text-white'
              }`}
            >
              <Sparkles className="w-3 h-3 text-blue-400" />
              <span>HTML5 Proxy</span>
            </button>
          )}

          {/* Download offline action */}
          {!isDownloaded ? (
            <button
              onClick={() => {
                sfx.playClick();
                onDownloadMedia?.(media.id);
              }}
              disabled={media.downloadStatus === 'downloading'}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-ice-bg hover:bg-ice-hover text-ice-accent border border-ice-accent/30 text-xs font-medium transition-colors"
              title="Tải về máy để nghe offline không cần mạng"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{media.downloadStatus === 'downloading' ? `Đang tải ${media.downloadProgress || 0}%` : 'Tải về máy'}</span>
            </button>
          ) : (
            <button
              onClick={() => {
                sfx.playClick();
                if (confirm('Bạn có muốn xoá file tải về của bài này để giải phóng bộ nhớ?')) {
                  onDeleteDownloaded?.(media.id);
                }
              }}
              className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs"
              title="Xoá file offline trên máy"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={() => setShowPlaylistDrawer(!showPlaylistDrawer)}
            className={`p-1.5 rounded-lg border text-xs transition-colors ${
              showPlaylistDrawer
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-ice-bg text-ice-muted border-ice-border hover:text-white'
            }`}
            title="Bật/tắt danh sách bài hát"
          >
            <ListMusic className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Turntable Stage */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT: Vinyl Turntable Display & Player Controls */}
        <div className="flex-1 flex flex-col items-center justify-center p-8 relative overflow-hidden">
          {/* Ambient colored lighting behind disc */}
          <div className="absolute w-96 h-96 rounded-full bg-gradient-to-tr from-amber-500/10 via-blue-500/15 to-purple-500/10 blur-3xl pointer-events-none" />

          {/* Turntable Base Platter */}
          <div className="relative w-80 h-80 sm:w-96 sm:h-96 rounded-full bg-[#111317] border-4 border-[#222631] shadow-[0_0_60px_rgba(0,0,0,0.8)] flex items-center justify-center">
            {/* Spinning Vinyl Record Disc */}
            <div
              className="relative w-72 h-72 sm:w-84 sm:h-84 rounded-full bg-gradient-to-tr from-[#0a0a0c] via-[#1a1b22] to-[#0a0a0c] border border-white/10 shadow-2xl flex items-center justify-center overflow-hidden"
              style={{
                animation: isPlaying ? 'spin 6s linear infinite' : 'none',
              }}
            >
              {/* Concentric Vinyl Grooves */}
              <div className="absolute inset-3 rounded-full border border-white/5 pointer-events-none" />
              <div className="absolute inset-8 rounded-full border border-white/5 pointer-events-none" />
              <div className="absolute inset-14 rounded-full border border-white/5 pointer-events-none" />
              <div className="absolute inset-20 rounded-full border border-white/5 pointer-events-none" />
              <div className="absolute inset-26 rounded-full border border-white/5 pointer-events-none" />

              {/* Shimmer / Sheen across vinyl */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none transform -rotate-45" />

              {/* Center Vinyl Label (Cover Art) */}
              <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden border-2 border-amber-500/60 shadow-lg bg-black flex items-center justify-center">
                {coverUrl ? (
                  <img
                    src={coverUrl}
                    alt={media.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Disc className="w-12 h-12 text-amber-400" />
                )}
                {/* Center spindle hole */}
                <div className="absolute w-4 h-4 rounded-full bg-[#111317] border border-white/40 shadow-inner" />
              </div>
            </div>

            {/* Tonearm (Kim Đĩa Than) */}
            <div
              className="absolute -top-3 right-4 w-28 sm:w-32 origin-top-right transition-transform duration-700 pointer-events-none z-20"
              style={{
                transform: isPlaying ? 'rotate(18deg)' : 'rotate(-15deg)',
              }}
            >
              {/* Tonearm pivot mount */}
              <div className="absolute right-0 top-0 w-8 h-8 rounded-full bg-[#2A2E3D] border border-white/20 shadow-md flex items-center justify-center">
                <div className="w-4 h-4 rounded-full bg-amber-500/80" />
              </div>
              {/* Arm metal rod */}
              <div className="absolute right-3 top-3 w-28 h-1.5 bg-gradient-to-l from-gray-300 via-gray-400 to-gray-500 rounded-full shadow" />
              {/* Stylus needle cartridge */}
              <div className="absolute left-0 top-1 w-6 h-4 bg-amber-500 rounded-sm shadow-md" />
            </div>
          </div>

          {/* Track Info */}
          <div className="mt-6 text-center space-y-1 max-w-lg">
            <h2 className="text-xl font-bold text-white tracking-wide truncate">{media.title}</h2>
            <p className="text-xs text-amber-400/90 font-medium">
              {media.artist || currentPlaylist?.name || media.category || 'Âm Nhạc Icelauch'}
            </p>
          </div>

          {/* Scrubber & Audio Controls Bar */}
          <div className="w-full max-w-xl mt-6 space-y-3">
            {/* Scrubber Bar */}
            <div className="space-y-1">
              <input
                type="range"
                min={0}
                max={duration || 100}
                value={currentTime}
                onChange={handleSeek}
                className="w-full h-1.5 rounded-lg appearance-none bg-white/20 accent-amber-400 cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-ice-muted font-mono">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Buttons Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsShuffle(!isShuffle)}
                  className={`p-2 rounded-lg border text-xs transition-colors ${
                    isShuffle ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' : 'text-ice-muted border-transparent hover:text-white'
                  }`}
                  title="Phát ngẫu nhiên"
                >
                  <Shuffle className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsLooping(!isLooping)}
                  className={`p-2 rounded-lg border text-xs transition-colors ${
                    isLooping ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' : 'text-ice-muted border-transparent hover:text-white'
                  }`}
                  title="Lặp lại bài hát"
                >
                  <Repeat className="w-4 h-4" />
                </button>
              </div>

              {/* Main Play/Pause Cluster */}
              <div className="flex items-center gap-4">
                <button
                  onClick={handlePrev}
                  className="p-2.5 rounded-full bg-ice-card hover:bg-ice-hover text-white transition-all active:scale-95"
                  title="Bài trước"
                >
                  <SkipBack className="w-5 h-5 fill-white" />
                </button>

                <button
                  onClick={togglePlay}
                  className="p-4 rounded-full bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-black shadow-xl shadow-amber-500/30 transition-all active:scale-95"
                  title={isPlaying ? 'Tạm dừng' : 'Phát tiếp'}
                >
                  {isPlaying ? <Pause className="w-6 h-6 fill-black" /> : <Play className="w-6 h-6 fill-black ml-0.5" />}
                </button>

                <button
                  onClick={handleNext}
                  className="p-2.5 rounded-full bg-ice-card hover:bg-ice-hover text-white transition-all active:scale-95"
                  title="Bài tiếp theo"
                >
                  <SkipForward className="w-5 h-5 fill-white" />
                </button>
              </div>

              {/* Volume */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (audioRef.current) {
                      audioRef.current.muted = !isMuted;
                      setIsMuted(!isMuted);
                    }
                  }}
                  className="text-ice-muted hover:text-white transition-colors"
                >
                  {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
                </button>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={isMuted ? 0 : volume}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    setVolume(v);
                    setIsMuted(false);
                    if (audioRef.current) {
                      audioRef.current.volume = v;
                      audioRef.current.muted = false;
                    }
                  }}
                  className="w-20 h-1.5 rounded-lg appearance-none bg-white/20 accent-amber-400 cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: Playlist / Queue Drawer */}
        {showPlaylistDrawer && (
          <div className="w-80 border-l border-ice-border/60 bg-ice-card/60 flex flex-col shrink-0 animate-in slide-in-from-right duration-200">
            <div className="p-4 border-b border-ice-border/60 flex items-center justify-between">
              <div className="flex items-center gap-2 text-white font-bold text-xs">
                <ListMusic className="w-4 h-4 text-amber-400" />
                <span>{currentPlaylist ? currentPlaylist.name : 'Danh Sách Đang Phát'}</span>
              </div>
              <span className="text-[11px] text-ice-muted">{playlistTracks.length} bài</span>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {playlistTracks.map((item, idx) => {
                const isCurrent = item.id === media.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      sfx.playClick();
                      onSelectTrack(item);
                    }}
                    className={`flex items-center gap-2.5 p-2 rounded-xl cursor-pointer transition-all ${
                      isCurrent
                        ? 'bg-amber-500/20 border border-amber-500/40 text-white'
                        : 'hover:bg-ice-hover text-ice-text border border-transparent'
                    }`}
                  >
                    <span className="w-5 text-center text-[11px] font-bold text-ice-muted">
                      {isCurrent ? <Disc className="w-3.5 h-3.5 text-amber-400 animate-spin" /> : idx + 1}
                    </span>
                    <div className="flex-1 truncate">
                      <p className={`text-xs font-semibold truncate ${isCurrent ? 'text-amber-300' : 'text-white'}`}>
                        {item.title}
                      </p>
                      <p className="text-[10px] text-ice-muted truncate">
                        {item.artist || item.category || 'Audio'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

