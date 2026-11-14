import React, { useState, useEffect, useMemo } from 'react';
import {
  Film,
  Music,
  Play,
  Plus,
  Clock,
  MoreVertical,
  Trash2,
  Edit3,
  Sparkles,
  Search,
  CheckCircle2,
  Tag,
  Eye,
  EyeOff,
  Tv,
  Flame,
  ChevronRight,
  Disc,
  Radio,
  Mic,
  ListPlus,
  Download,
  ListVideo,
  Heart,
  ArrowUpDown,
  ChevronLeft,
  ArrowLeft,
  X,
  ListMusic
} from 'lucide-react';
import { VideoTheaterView } from './VideoTheaterView';
import { VinylTurntablePlayer } from './VinylTurntablePlayer';
import { MediaHeroBanner } from './MediaHeroBanner';
import { PlaylistFormModal } from './PlaylistFormModal';
import { AddToPlaylistModal } from './AddToPlaylistModal';
import { GenreShelfScroller } from '../common/GenreShelfScroller';
import { parseMediaUrl } from '../../utils/mediaUrl';
import type { MediaItem, MediaPlaylist, MediaSubType, AppBannerSettings, AppSettings } from '../../types';
import { sfx } from '../../utils/sfx';

interface MediaViewProps {
  media: MediaItem[];
  playlists?: MediaPlaylist[];
  userPlaylists?: MediaPlaylist[];
  bannerSettings?: AppBannerSettings;
  settings?: AppSettings;
  isAdmin: boolean;
  searchQuery: string;
  favoriteMediaIds?: string[];
  favoritePlaylistIds?: string[];
  onToggleFavoriteMedia?: (id: string) => void;
  onToggleFavoritePlaylist?: (id: string) => void;
  onPlayAudio?: (track: MediaItem) => void;
  onPauseAudio?: () => void;
  onTurntableOpenChange?: (open: boolean) => void;
  onSaveMedia: (media: Partial<MediaItem>, playlistIds?: string[]) => void;
  onDeleteMedia: (id: string) => void;
  onToggleHide?: (id: string) => void;
  onEditMedia?: (media: MediaItem) => void;
  onOpenAddMedia: () => void;
  onOpenTagManager?: (mode: 'movie' | 'music' | 'podcast') => void;
  onUpdateMediaProgress: (id: string, position: number, watched: boolean) => void;
  onSavePlaylist?: (playlist: Partial<MediaPlaylist>) => void;
  onDeletePlaylist?: (id: string) => void;
  onDownloadMedia?: (id: string) => void;
  onDeleteDownloaded?: (id: string) => void;
  onMinimizeToMiniPlayer?: (media: MediaItem) => void;
  onToggleItemInUserPlaylist?: (playlistId: string, mediaId: string) => Promise<void>;
  onCreateUserPlaylist?: (name: string, type: 'video' | 'audio', initialMediaId?: string) => Promise<void>;
  onNavigateToUserPlaylists?: () => void;
}

export const MediaView: React.FC<MediaViewProps> = ({
  media,
  playlists = [],
  userPlaylists = [],
  bannerSettings,
  settings,
  isAdmin,
  searchQuery,
  favoriteMediaIds = [],
  favoritePlaylistIds = [],
  onToggleFavoriteMedia,
  onToggleFavoritePlaylist,
  onPlayAudio,
  onPauseAudio,
  onTurntableOpenChange,
  onSaveMedia,
  onDeleteMedia,
  onToggleHide,
  onEditMedia,
  onOpenAddMedia,
  onOpenTagManager,
  onUpdateMediaProgress,
  onSavePlaylist,
  onDeletePlaylist,
  onDownloadMedia,
  onDeleteDownloaded,
  onMinimizeToMiniPlayer,
  onToggleItemInUserPlaylist,
  onCreateUserPlaylist,
  onNavigateToUserPlaylists,
}) => {
  // 3 Sub-Tabs: 'video' | 'music' | 'podcast'
  const [activeTab, setActiveTab] = useState<'video' | 'music' | 'podcast'>('video');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [filterOfflineOnly, setFilterOfflineOnly] = useState(false);
  const [activeVideo, setActiveVideo] = useState<MediaItem | null>(null);
  const [activeAudioTrack, setActiveAudioTrack] = useState<MediaItem | null>(null);
  const [showHiddenOnly, setShowHiddenOnly] = useState(false);
  const [visibleCount, setVisibleCount] = useState<number>(24);

  // User Playlist Exploration state
  const [viewingPlaylist, setViewingPlaylist] = useState<MediaPlaylist | null>(null);
  const [playlistSortAsc, setPlaylistSortAsc] = useState<boolean>(true);
  const [playlistSearch, setPlaylistSearch] = useState<string>('');
  const [isPlaylistSearchOpen, setIsPlaylistSearchOpen] = useState<boolean>(false);
  const [targetMediaForPlaylist, setTargetMediaForPlaylist] = useState<MediaItem | null>(null);

  useEffect(() => {
    setVisibleCount(24);
  }, [activeTab, selectedTag, filterOfflineOnly, searchQuery, showHiddenOnly]);

  // Playlist Form Modal state
  const [isPlaylistModalOpen, setIsPlaylistModalOpen] = useState(false);
  const [editingPlaylist, setEditingPlaylist] = useState<MediaPlaylist | null>(null);

  // Playback handlers
  const handleOpenVideo = (video: MediaItem) => {
    sfx.playClick();
    onPauseAudio?.();
    setActiveVideo(video);
  };

  const handleOpenAudio = (track: MediaItem) => {
    sfx.playClick();
    onTurntableOpenChange?.(true);
    setActiveAudioTrack(track);
    onPlayAudio?.(track);
  };

  // Filter out hidden items for normal users; apply admin hidden filter if active
  const baseMedia = media.filter((m) => {
    if (!isAdmin && m.hidden) return false;
    if (isAdmin && showHiddenOnly) return m.hidden;
    return true;
  });

  // Map subType
  const getSubtypeForTab = (tab: 'video' | 'music' | 'podcast') => {
    if (tab === 'video') return 'movie';
    if (tab === 'music') return 'music';
    return 'podcast';
  };

  // Filter media for the current active tab
  const tabMedia = baseMedia.filter((m) => {
    if (activeTab === 'video') {
      return m.type === 'video';
    } else if (activeTab === 'music') {
      return m.type === 'audio' && (m.subType === 'music' || !m.subType);
    } else {
      return m.type === 'audio' && m.subType === 'podcast';
    }
  });

  // Featured Media for this tab (isFeatured !== false, sorted by newest added)
  const featuredMedia = useMemo(() => {
    return tabMedia
      .filter((m) => m.isFeatured !== false)
      .sort((a, b) => new Date(b.addedAt || 0).getTime() - new Date(a.addedAt || 0).getTime())
      .slice(0, 15);
  }, [tabMedia]);

  // Extract all unique tags for current active tab
  const availableTags = Array.from(
    new Set(
      tabMedia.flatMap((m) => m.tags || (m.category ? m.category.split(',').map((s) => s.trim()) : []))
    )
  ).filter(Boolean);

  // Filter & Search
  const filteredMedia = tabMedia.filter((m) => {
    const matchesSearch =
      searchQuery === '' ||
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.artist && m.artist.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesTag =
      selectedTag === 'all' ||
      (m.tags && m.tags.includes(selectedTag)) ||
      (m.category && m.category.toLowerCase().includes(selectedTag.toLowerCase()));

    const matchesOffline = !filterOfflineOnly || (m.localFilePath && m.downloadStatus === 'downloaded');

    return matchesSearch && matchesTag && matchesOffline;
  });

  // Playlists for current tab
  const tabPlaylists = playlists.filter((p) => {
    if (activeTab === 'video') return p.type === 'video';
    if (activeTab === 'music') return p.type === 'audio';
    return p.type === 'audio';
  });

  const continueItems = tabMedia
    .filter((m) => m.lastPosition && m.lastPosition > 10 && !m.watched)
    .sort((a, b) => ((b as any).lastWatchedAt || 0) - ((a as any).lastWatchedAt || 0))
    .slice(0, 10);

  const formatDuration = (secs?: number) => {
    if (!secs) return '--:--';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Reusable Media Card
  const renderMediaCard = (item: MediaItem, isShelf = true, orderIndex?: number) => {
    const parsed = parseMediaUrl(item.link);
    const isFav = favoriteMediaIds.includes(item.id);
    const hasCover = Boolean(item.coverPath || item.bannerPath || (parsed.kind === 'youtube' && parsed.thumbnailUrl));
    const coverImg = item.coverPath || item.bannerPath || (parsed.kind === 'youtube' ? parsed.thumbnailUrl : null);
    const isDownloaded = Boolean(item.localFilePath && item.downloadStatus === 'downloaded');
    const IconComponent = item.type === 'video' ? Film : item.subType === 'podcast' ? Mic : Music;

    return (
      <div
        key={item.id}
        onClick={() => {
          if (item.type === 'video') handleOpenVideo(item);
          else handleOpenAudio(item);
        }}
        className={`group relative bg-ice-card rounded-xl overflow-hidden border border-ice-border hover:border-amber-400/80 hover:shadow-xl cursor-pointer transition-all duration-300 hover:-translate-y-1 flex flex-col ${
          isShelf ? 'w-[170px] shrink-0' : ''
        }`}
      >
        <div className="aspect-[2/3] w-full relative overflow-hidden bg-black flex items-center justify-center">
          {hasCover && coverImg ? (
            <img
              src={coverImg.startsWith('http') ? coverImg : `file://${coverImg}`}
              alt={item.title}
              style={{
                objectPosition: item.listCardPosition || item.coverPosition || '50% 50%',
                transform: (item.listCardZoom || item.coverZoom) ? `scale(${item.listCardZoom || item.coverZoom})` : undefined,
                transformOrigin: item.listCardPosition || item.coverPosition || '50% 50%',
              }}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div
              className={`w-full h-full flex flex-col items-center justify-center p-3 text-center select-none ${
                item.type === 'video'
                  ? 'bg-gradient-to-br from-[#121624] via-[#0E111A] to-[#080B10]'
                  : item.subType === 'podcast'
                  ? 'bg-gradient-to-br from-[#1E1224] via-[#140A1A] to-[#0A050D]'
                  : 'bg-gradient-to-br from-[#1E1A12] via-[#14110A] to-[#0A0805]'
              }`}
            >
              <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-amber-400 shadow-md">
                <IconComponent className="w-6 h-6" />
              </div>
              <span className="text-[10px] text-white/70 font-semibold line-clamp-2 mt-2 px-1">
                {item.title}
              </span>
            </div>
          )}

          {/* Action buttons on top right */}
          <div className="absolute top-2 right-2 z-10 flex items-center gap-1">
            {onToggleItemInUserPlaylist && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  sfx.playClick();
                  setTargetMediaForPlaylist(item);
                }}
                className="p-1.5 rounded-full backdrop-blur-md bg-black/60 text-white/70 hover:text-amber-400 hover:bg-black/80 transition-all"
                title="Thêm vào danh sách phát cá nhân"
              >
                <ListPlus className="w-3.5 h-3.5" />
              </button>
            )}
            {onToggleFavoriteMedia && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  sfx.playClick();
                  onToggleFavoriteMedia(item.id);
                }}
                className={`p-1.5 rounded-full backdrop-blur-md transition-all ${
                  isFav ? 'bg-rose-500 text-white' : 'bg-black/60 text-white/70 hover:text-rose-400'
                }`}
                title={isFav ? 'Bỏ thích' : 'Yêu thích'}
              >
                <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-current' : ''}`} />
              </button>
            )}
          </div>

          {/* Optional order index badge */}
          {orderIndex !== undefined && (
            <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-black/80 text-[10px] font-mono text-amber-300 font-bold border border-white/10 z-10">
              #{orderIndex}
            </div>
          )}

          <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 flex items-center justify-center transition-colors">
            <div className="w-10 h-10 rounded-full bg-amber-400 text-black flex items-center justify-center shadow-lg transform scale-75 opacity-0 group-hover:opacity-100 group-hover:scale-100 transition-all">
              <Play className="w-4 h-4 fill-black ml-0.5" />
            </div>
          </div>

          {isDownloaded && (
            <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded text-[8px] font-black uppercase bg-emerald-500 text-black shadow z-10">
              ĐÃ TẢI VỀ
            </span>
          )}

          {item.duration && (
            <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/80 text-white text-[10px] font-mono border border-white/10">
              {formatDuration(item.duration)}
            </div>
          )}
        </div>

        <div className="p-2.5 flex flex-col flex-1 justify-between gap-1">
          <div>
            <h4 className="text-xs font-bold text-white truncate group-hover:text-amber-300">
              {item.title}
            </h4>
            <p className="text-[10px] text-ice-muted truncate mt-0.5">
              {item.artist || item.category || (item.tags?.[0] ? `#${item.tags[0]}` : '')}
            </p>
          </div>

          {isAdmin && (
            <div className="flex items-center justify-end gap-1 pt-1.5 border-t border-ice-border/40">
              {onToggleHide && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    sfx.playClick();
                    onToggleHide(item.id);
                  }}
                  className="p-1 rounded text-ice-subtext hover:text-white"
                  title={item.hidden ? 'Hiện mục này' : 'Ẩn mục này'}
                >
                  {item.hidden ? <EyeOff className="w-3 h-3 text-amber-400" /> : <Eye className="w-3 h-3" />}
                </button>
              )}
              {onEditMedia && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    sfx.playClick();
                    onEditMedia(item);
                  }}
                  className="p-1 rounded text-ice-subtext hover:text-amber-400"
                  title="Sửa thông tin"
                >
                  <Edit3 className="w-3 h-3" />
                </button>
              )}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  sfx.playClick();
                  onDeleteMedia(item.id);
                }}
                className="p-1 rounded text-ice-subtext hover:text-rose-400"
                title="Xoá mục"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  // 1. VIDEO THEATER VIEW
  if (activeVideo) {
    return (
      <VideoTheaterView
        media={activeVideo}
        allVideos={baseMedia.filter((m) => m.type === 'video')}
        playlists={playlists}
        isAdmin={isAdmin}
        onBack={() => setActiveVideo(null)}
        onMinimizeToMiniPlayer={(m) => {
          setActiveVideo(null);
          onMinimizeToMiniPlayer?.(m);
        }}
        onSelectVideo={(item) => handleOpenVideo(item)}
        onEditMedia={onEditMedia}
        onUpdateProgress={onUpdateMediaProgress}
        onDownloadMedia={onDownloadMedia}
        onDeleteDownloaded={onDeleteDownloaded}
      />
    );
  }

  // 2. VINYL TURNTABLE AUDIO PLAYER
  if (activeAudioTrack) {
    return (
      <VinylTurntablePlayer
        media={activeAudioTrack}
        allAudio={tabMedia}
        playlists={tabPlaylists}
        isAdmin={isAdmin}
        onBack={() => {
          onTurntableOpenChange?.(false);
          setActiveAudioTrack(null);
        }}
        onSelectTrack={(item) => handleOpenAudio(item)}
        onUpdateProgress={onUpdateMediaProgress}
        onDownloadMedia={onDownloadMedia}
        onDeleteDownloaded={onDeleteDownloaded}
      />
    );
  }

  // 3. USER PLAYLIST DETAIL VIEW
  if (viewingPlaylist) {
    const rawItems = viewingPlaylist.itemIds
      .map((id) => tabMedia.find((m) => m.id === id))
      .filter((m): m is MediaItem => Boolean(m));

    let processedItems = [...rawItems];
    if (!playlistSortAsc) {
      processedItems.reverse();
    }
    if (playlistSearch.trim()) {
      const q = playlistSearch.toLowerCase();
      processedItems = processedItems.filter(
        (item) => item.title.toLowerCase().includes(q) || (item.artist && item.artist.toLowerCase().includes(q))
      );
    }

    const isPlaylistFavorite = favoritePlaylistIds.includes(viewingPlaylist.id);

    return (
      <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6 select-none animate-fade-in">
        {/* Back navigation */}
        <button
          onClick={() => {
            sfx.playClick();
            setViewingPlaylist(null);
            setPlaylistSearch('');
            setIsPlaylistSearchOpen(false);
          }}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 hover:text-white text-xs font-semibold border border-white/10 transition-all active:scale-95"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại kho giải trí</span>
        </button>

        {/* Playlist Header Card */}
        <div className="p-6 rounded-2xl bg-gradient-to-r from-[#141824] via-[#10141E] to-[#161B29] border border-white/10 shadow-2xl flex flex-wrap md:flex-nowrap items-center gap-6">
          <div className={`overflow-hidden bg-black/70 shrink-0 border border-white/15 shadow-xl ${
            viewingPlaylist.coverAspectRatio === '16:9' ? 'w-48 aspect-video rounded-xl' : 'w-32 h-32 rounded-2xl'
          }`}>
            {viewingPlaylist.coverPath ? (
              <img
                src={viewingPlaylist.coverPath.startsWith('http') ? viewingPlaylist.coverPath : `file://${viewingPlaylist.coverPath}`}
                alt={viewingPlaylist.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-amber-400">
                <Disc className="w-12 h-12" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md bg-amber-500/20 text-amber-400 text-[10px] font-black uppercase tracking-wider border border-amber-500/30">
                {viewingPlaylist.type === 'video' ? 'Danh Sách Tuyển Tập' : 'Album Nhạc'}
              </span>
              <span className="text-xs text-ice-muted font-mono">
                {viewingPlaylist.itemIds.length} mục
              </span>
            </div>

            <h1 className="text-2xl font-black text-white tracking-wide truncate">
              {viewingPlaylist.name}
            </h1>

            {viewingPlaylist.description && (
              <p className="text-xs text-ice-subtext line-clamp-2">{viewingPlaylist.description}</p>
            )}

            <div className="flex items-center gap-2 pt-2">
              {/* Play All Button */}
              {processedItems.length > 0 && (
                <button
                  onClick={() => {
                    sfx.playClick();
                    const first = processedItems[0];
                    if (first.type === 'video') setActiveVideo(first);
                    else {
                      setActiveAudioTrack(first);
                      onPlayAudio?.(first);
                    }
                  }}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-black text-xs font-bold transition-all shadow-lg shadow-amber-400/20 active:scale-95"
                >
                  <Play className="w-4 h-4 fill-black" />
                  <span>Phát Tất Cả</span>
                </button>
              )}

              {/* Favorite Heart Button */}
              {onToggleFavoritePlaylist && (
                <button
                  onClick={() => onToggleFavoritePlaylist(viewingPlaylist.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-all active:scale-95 ${
                    isPlaylistFavorite
                      ? 'bg-rose-500/20 border-rose-500/50 text-rose-400'
                      : 'bg-white/5 border-white/10 text-white/70 hover:text-white'
                  }`}
                  title={isPlaylistFavorite ? 'Đã yêu thích' : 'Lưu vào yêu thích'}
                >
                  <Heart className={`w-3.5 h-3.5 ${isPlaylistFavorite ? 'fill-current text-rose-500' : ''}`} />
                  <span>{isPlaylistFavorite ? 'Đã Lưu' : 'Lưu Danh Sách'}</span>
                </button>
              )}

              {/* Admin Edit */}
              {isAdmin && (
                <button
                  onClick={() => {
                    sfx.playClick();
                    setEditingPlaylist(viewingPlaylist);
                    setIsPlaylistModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-ice-muted hover:text-white border border-white/10 text-xs font-semibold transition-all"
                >
                  <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                  <span>Sửa Danh Sách</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Toolbar: Sort Direction + Mini Search */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-ice-card border border-ice-border">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-white uppercase tracking-wider">Danh Sách Video / Bài Hát</span>
            <span className="text-xs text-ice-muted font-mono">({processedItems.length})</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Sort Toggle Button */}
            <button
              onClick={() => {
                sfx.playClick();
                setPlaylistSortAsc(!playlistSortAsc);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-ice-text hover:text-white transition-all"
              title="Đổi thứ tự hiển thị"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-amber-400" />
              <span>{playlistSortAsc ? 'Thứ tự: Từ trên xuống (1 → N)' : 'Thứ tự: Từ dưới lên (N → 1)'}</span>
            </button>

            {/* Mini Search Button & Input */}
            <div className="relative flex items-center">
              {isPlaylistSearchOpen ? (
                <div className="flex items-center gap-1 bg-[#12151F] border border-amber-400/50 rounded-lg px-2.5 py-1 animate-fade-in shadow-md">
                  <Search className="w-3.5 h-3.5 text-amber-400" />
                  <input
                    type="text"
                    value={playlistSearch}
                    onChange={(e) => setPlaylistSearch(e.target.value)}
                    placeholder="Tìm trong danh sách này..."
                    autoFocus
                    className="w-44 bg-transparent text-xs text-white placeholder-ice-muted focus:outline-none"
                  />
                  {playlistSearch && (
                    <button onClick={() => setPlaylistSearch('')} className="text-ice-muted hover:text-white">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setIsPlaylistSearchOpen(false);
                      setPlaylistSearch('');
                    }}
                    className="text-xs text-ice-muted hover:text-rose-400 pl-1"
                  >
                    Đóng
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    sfx.playClick();
                    setIsPlaylistSearchOpen(true);
                  }}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-ice-subtext hover:text-amber-400 transition-colors"
                  title="Tìm kiếm trong danh sách này"
                >
                  <Search className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Playlist Items Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {processedItems.map((item, idx) => renderMediaCard(item, false, idx + 1))}
        </div>
      </div>
    );
  }

  // 4. MAIN ENTERTAINMENT CATALOG VIEW
  const displayedGenreTags = availableTags.slice(0, 10);

  return (
    <div className="flex-1 overflow-y-auto px-8 py-6 space-y-8 select-none">
      {/* 1. Header: 3 Sub-Tabs Bar & Admin Action */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-ice-border/60 pb-4">
        {/* Sub-Tabs: Phim & Video / Âm Nhạc / Audio & Podcast */}
        <div className="flex items-center gap-1.5 p-1 bg-ice-card border border-ice-border rounded-2xl shadow-sm">
          <button
            onClick={() => {
              sfx.playClick();
              setActiveTab('video');
              setSelectedTag('all');
            }}
            title="Phim & Video"
            className={`flex items-center gap-2 py-2 rounded-xl text-xs font-bold transition-all duration-300 ${
              activeTab === 'video'
                ? 'px-4 bg-blue-600/30 text-blue-400 border border-blue-500/50 shadow-md'
                : 'px-3 text-ice-subtext hover:text-white hover:bg-white/5 border border-transparent'
            }`}
          >
            <Film className="w-4 h-4 shrink-0" />
            {activeTab === 'video' && <span>Phim & Video</span>}
          </button>

          <button
            onClick={() => {
              sfx.playClick();
              setActiveTab('music');
              setSelectedTag('all');
            }}
            title="Âm Nhạc"
            className={`flex items-center gap-2 py-2 rounded-xl text-xs font-bold transition-all duration-300 ${
              activeTab === 'music'
                ? 'px-4 bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-md'
                : 'px-3 text-ice-subtext hover:text-white hover:bg-white/5 border border-transparent'
            }`}
          >
            <Music className="w-4 h-4 shrink-0" />
            {activeTab === 'music' && <span>Âm Nhạc</span>}
          </button>

          <button
            onClick={() => {
              sfx.playClick();
              setActiveTab('podcast');
              setSelectedTag('all');
            }}
            title="Podcast & Sách Nói"
            className={`flex items-center gap-2 py-2 rounded-xl text-xs font-bold transition-all duration-300 ${
              activeTab === 'podcast'
                ? 'px-4 bg-purple-600/30 text-purple-300 border border-purple-500/50 shadow-md'
                : 'px-3 text-ice-subtext hover:text-white hover:bg-white/5 border border-transparent'
            }`}
          >
            <Mic className="w-4 h-4 shrink-0" />
            {activeTab === 'podcast' && <span>Podcast & Sách Nói</span>}
          </button>
        </div>

        {/* Right Tools: Offline Toggle, Admin Hidden, Add Buttons */}
        <div className="flex items-center gap-3">
          {onNavigateToUserPlaylists && (
            <button
              onClick={() => {
                sfx.playClick();
                onNavigateToUserPlaylists();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold transition-all shadow-sm active:scale-95"
              title="Xem danh sách phát cá nhân trong Thư Viện"
            >
              <ListMusic className="w-3.5 h-3.5" />
              <span>Playlist Của Tôi</span>
            </button>
          )}

          <button
            onClick={() => {
              sfx.playClick();
              setFilterOfflineOnly(!filterOfflineOnly);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              filterOfflineOnly
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-sm'
                : 'bg-ice-card text-ice-subtext border-ice-border hover:text-white'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Chỉ mục đã tải</span>
          </button>

          {isAdmin && (
            <button
              onClick={() => {
                sfx.playClick();
                setShowHiddenOnly(!showHiddenOnly);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                showHiddenOnly
                  ? 'bg-amber-500/20 text-amber-400 border-amber-500/50 shadow-sm'
                  : 'bg-ice-card text-ice-subtext border-ice-border hover:text-white'
              }`}
            >
              {showHiddenOnly ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              <span>{showHiddenOnly ? 'Đang lọc mục ẩn' : 'Xem mục ẩn'}</span>
            </button>
          )}

          {isAdmin && (
            <div className="flex items-center gap-2">
              {onOpenTagManager && (
                <button
                  onClick={() => {
                    sfx.playClick();
                    onOpenTagManager(activeTab === 'video' ? 'movie' : activeTab === 'music' ? 'music' : 'podcast');
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white text-xs font-bold transition-all shadow-sm active:scale-95"
                  title="Quản lý thể loại / tag giải trí"
                >
                  <Tag className="w-3.5 h-3.5 text-amber-400" />
                  <span>Quản Lý Thể Loại</span>
                </button>
              )}

              {onSavePlaylist && (
                <button
                  onClick={() => {
                    sfx.playClick();
                    setEditingPlaylist(null);
                    setIsPlaylistModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white text-xs font-bold transition-all shadow-sm active:scale-95"
                >
                  <ListPlus className="w-3.5 h-3.5 text-amber-400" />
                  <span>Tạo Danh Sách</span>
                </button>
              )}

              <button
                onClick={() => {
                  sfx.playClick();
                  onOpenAddMedia();
                }}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black text-xs font-bold transition-all shadow-sm active:scale-95"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                <span>Thêm Mới</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 2. Upgraded Hero Banner with Ambient Glow & Smooth Transitions (16:9) */}
      {!searchQuery && (
        <MediaHeroBanner
          mediaList={tabMedia}
          type={activeTab === 'video' ? 'video' : 'audio'}
          bannerSettings={bannerSettings?.[activeTab === 'video' ? 'videos' : activeTab === 'music' ? 'music' : 'podcasts']}
          onPlayMedia={(item: MediaItem) => {
            sfx.playClick();
            if (item.type === 'video') {
              setActiveVideo(item);
            } else {
              setActiveAudioTrack(item);
              onPlayAudio?.(item);
            }
          }}
        />
      )}

      {/* 3. Continue Watching / Listening Shelf */}
      {continueItems.length > 0 && !searchQuery && (
        <GenreShelfScroller
          title={activeTab === 'video' ? 'Tiếp Tục Xem Dở' : 'Tiếp Tục Nghe Dở'}
          iconAccentColor="bg-red-500 animate-pulse"
        >
          {continueItems.map((item) => {
            const percent = item.duration ? Math.min(100, Math.round((item.lastPosition / item.duration) * 100)) : 0;
            const isAudio = item.type === 'audio';

            return (
              <div
                key={item.id}
                onClick={() => {
                  sfx.playClick();
                  if (isAudio) {
                    setActiveAudioTrack(item);
                    onPlayAudio?.(item);
                  } else {
                    setActiveVideo(item);
                  }
                }}
                className="flex items-center gap-3 bg-ice-card hover:bg-ice-hover border border-ice-border rounded-xl p-3 min-w-[280px] max-w-[320px] cursor-pointer transition-all hover:-translate-y-1 hover:shadow-xl hover:border-amber-400/60 group shrink-0"
              >
                <div className="w-16 aspect-video rounded-lg overflow-hidden bg-black/70 shrink-0 border border-ice-border relative">
                  {item.coverPath ? (
                    <img
                      src={item.coverPath.startsWith('http') ? item.coverPath : `file://${item.coverPath}`}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-ice-muted">
                      {isAudio ? <Music className="w-5 h-5 text-amber-400" /> : <Film className="w-5 h-5 text-blue-400" />}
                    </div>
                  )}
                  <div className="absolute bottom-0 inset-x-0 h-1 bg-white/20">
                    <div className="h-full bg-red-500" style={{ width: `${percent}%` }} />
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-white truncate group-hover:text-amber-300 transition-colors">
                    {item.title}
                  </h4>
                  <p className="text-[10px] text-ice-muted truncate mt-0.5">Đã xem {percent}%</p>
                </div>

                <div className="p-2 rounded-full bg-amber-500/20 text-amber-400 group-hover:bg-amber-500 group-hover:text-black transition-all shrink-0">
                  <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                </div>
              </div>
            );
          })}
        </GenreShelfScroller>
      )}

      {/* 4. Featured Shelf (Nổi Bật & Mới Cập Nhật) */}
      {featuredMedia.length > 0 && !searchQuery && (
        <GenreShelfScroller
          title="Nổi Bật & Mới Cập Nhật"
          iconAccentColor="bg-amber-400"
          count={featuredMedia.length}
        >
          {featuredMedia.map((item) => renderMediaCard(item, true))}
        </GenreShelfScroller>
      )}

      {/* 5. Tag Filter Pills Bar */}
      {availableTags.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <button
            onClick={() => {
              sfx.playClick();
              setSelectedTag('all');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
              selectedTag === 'all'
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm'
                : 'bg-ice-card text-ice-text border-ice-border hover:text-white'
            }`}
          >
            Tất cả
          </button>
          {availableTags.map((tag) => (
            <button
              key={tag}
              onClick={() => {
                sfx.playClick();
                setSelectedTag(tag);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                selectedTag === tag
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm'
                  : 'bg-ice-card text-ice-text border-ice-border hover:text-white'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {/* 6. Genre Shelves (Horizontal Netflix-style rows per genre, max 10 shelves, without scrollbars) */}
      {selectedTag === 'all' && !searchQuery && displayedGenreTags.length > 0 && (
        <div className="space-y-6 pt-1">
          {displayedGenreTags.map((tag) => {
            const tagItems = tabMedia.filter(
              (m) => (m.tags && m.tags.includes(tag)) || (m.category && m.category.toLowerCase().includes(tag.toLowerCase()))
            );
            if (tagItems.length === 0) return null;

            return (
              <GenreShelfScroller
                key={tag}
                title={tag}
                count={tagItems.length}
                onViewAll={() => setSelectedTag(tag)}
              >
                {tagItems.map((item) => renderMediaCard(item, true))}
              </GenreShelfScroller>
            );
          })}
        </div>
      )}

      {/* 7. All Media Items Section (Kho Tất Cả) */}
      <section className="space-y-4 pt-2">
        <div className="flex items-center justify-between border-b border-ice-border/60 pb-3">
          <h3 className="text-sm font-bold text-white tracking-wide uppercase flex items-center gap-2">
            <span className="w-1.5 h-3.5 bg-ice-accent rounded-sm" />
            <span>
              {searchQuery
                ? `Kết quả tìm kiếm cho "${searchQuery}"`
                : selectedTag !== 'all'
                ? `Thể loại: ${selectedTag}`
                : activeTab === 'video'
                ? 'Kho Phim & Video'
                : 'Kho Bài Hát & Tuyển Tập'}
            </span>
            <span className="text-xs text-ice-muted font-mono font-normal">({filteredMedia.length})</span>
          </h3>
        </div>

        {filteredMedia.length === 0 ? (
          <div className="py-16 text-center text-ice-muted space-y-3">
            <Film className="w-10 h-10 mx-auto opacity-30" />
            <p className="text-sm">Chưa có nội dung nào trong danh mục này</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {filteredMedia.slice(0, visibleCount).map((item) => renderMediaCard(item, false))}
            </div>

            {/* View More Button */}
            {filteredMedia.length > visibleCount && (
              <div className="flex justify-center pt-4">
                <button
                  onClick={() => {
                    sfx.playClick();
                    setVisibleCount((prev) => prev + 24);
                  }}
                  className="px-6 py-2.5 rounded-xl bg-ice-card hover:bg-white/10 text-white font-bold text-xs border border-ice-border hover:border-amber-400 transition-all shadow-md active:scale-95"
                >
                  Xem thêm ({filteredMedia.length - visibleCount} mục nữa)
                </button>
              </div>
            )}
          </>
        )}
      </section>

      {/* Playlist Form Modal */}
      {isPlaylistModalOpen && onSavePlaylist && (
        <PlaylistFormModal
          isOpen={isPlaylistModalOpen}
          playlist={editingPlaylist}
          allMedia={tabMedia}
          onClose={() => {
            setIsPlaylistModalOpen(false);
            setEditingPlaylist(null);
          }}
          onSave={onSavePlaylist}
          onDelete={onDeletePlaylist}
        />
      )}

      {/* Add To User Playlist Modal */}
      {targetMediaForPlaylist && onToggleItemInUserPlaylist && onCreateUserPlaylist && (
        <AddToPlaylistModal
          isOpen={Boolean(targetMediaForPlaylist)}
          onClose={() => setTargetMediaForPlaylist(null)}
          media={targetMediaForPlaylist}
          userPlaylists={userPlaylists || []}
          onToggleItemInPlaylist={onToggleItemInUserPlaylist}
          onCreatePlaylist={onCreateUserPlaylist}
        />
      )}
    </div>
  );
};
