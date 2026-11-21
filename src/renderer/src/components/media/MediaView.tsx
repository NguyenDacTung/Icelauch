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
  ListMusic,
  Shuffle,
  Repeat
} from 'lucide-react';
import { VideoTheaterView } from './VideoTheaterView';
import { VinylTurntablePlayer } from './VinylTurntablePlayer';
import { MediaHeroBanner } from './MediaHeroBanner';
import { PlaylistFormModal } from './PlaylistFormModal';
import { AddToPlaylistModal } from './AddToPlaylistModal';
import { GenreShelfScroller } from '../common/GenreShelfScroller';
import { SurpriseMediaModal } from './SurpriseMediaModal';
import { AdminPlaylistManagerModal } from '../admin/AdminPlaylistManagerModal';
import { parseMediaUrl, formatMediaCardSubtitle } from '../../utils/mediaUrl';
import { useTheme } from '../../hooks/useTheme';
import { TerraBotanicalCardFrame } from '../common/TerraBotanicalCardFrame';
import { TerraAppleFavoriteIcon } from '../common/TerraAppleFavoriteIcon';
import { IgnisFireAura } from '../common/IgnisFireAura';
import type { MediaItem, MediaPlaylist, MediaSubType, AppBannerSettings, AppSettings } from '../../types';
import { sfx } from '../../utils/sfx';
import { matchSmartSearch } from '../../utils/searchHelper';

interface MediaViewProps {
  media: MediaItem[];
  playlists?: MediaPlaylist[];
  userPlaylists?: MediaPlaylist[];
  bannerSettings?: AppBannerSettings;
  settings?: AppSettings;
  isAdmin: boolean;
  searchQuery: string;
  currentTrack?: MediaItem | null;
  activeAudioTrack?: MediaItem | null;
  onActiveAudioTrackChange?: (track: MediaItem | null) => void;
  isPlayingAudio?: boolean;
  audioCurrentTime?: number;
  audioDuration?: number;
  audioVolume?: number;
  audioIsMuted?: boolean;
  onTogglePlayAudio?: () => void;
  onSeekAudio?: (time: number) => void;
  onNextAudio?: () => void;
  onPrevAudio?: () => void;
  onVolumeChange?: (volume: number) => void;
  onToggleMuteAudio?: () => void;
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
  onActiveBannerChange?: (bannerImg: string) => void;
}

export const MediaView: React.FC<MediaViewProps> = ({
  media,
  playlists = [],
  userPlaylists = [],
  bannerSettings,
  settings,
  isAdmin,
  searchQuery,
  currentTrack,
  activeAudioTrack: propActiveAudioTrack,
  onActiveAudioTrackChange,
  isPlayingAudio = false,
  audioCurrentTime = 0,
  audioDuration = 0,
  audioVolume = 0.8,
  audioIsMuted = false,
  onTogglePlayAudio,
  onSeekAudio,
  onNextAudio,
  onPrevAudio,
  onVolumeChange,
  onToggleMuteAudio,
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
  onActiveBannerChange,
}) => {
  const { theme } = useTheme();
  const isLightMode = ['solar', 'aer', 'aqua'].includes(theme);
  // 3 Sub-Tabs: 'video' | 'music' | 'podcast'
  const [activeTab, setActiveTab] = useState<'video' | 'music' | 'podcast'>('video');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [filterOfflineOnly, setFilterOfflineOnly] = useState(false);
  const [activeVideo, setActiveVideo] = useState<MediaItem | null>(null);
  const [internalActiveAudioTrack, setInternalActiveAudioTrack] = useState<MediaItem | null>(null);
  const [hoveredCardId, setHoveredCardId] = useState<string | null>(null);
  const effectiveActiveAudioTrack = propActiveAudioTrack !== undefined ? propActiveAudioTrack : internalActiveAudioTrack;

  const setActiveAudio = (track: MediaItem | null) => {
    if (onActiveAudioTrackChange) {
      onActiveAudioTrackChange(track);
    }
    setInternalActiveAudioTrack(track);
  };

  // Auto-switch activeTab to 'podcast' or 'music' when effectiveActiveAudioTrack is set
  useEffect(() => {
    if (effectiveActiveAudioTrack) {
      if (effectiveActiveAudioTrack.subType === 'podcast') {
        setActiveTab('podcast');
      } else {
        setActiveTab('music');
      }
    }
  }, [effectiveActiveAudioTrack?.id, effectiveActiveAudioTrack?.subType]);

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
  const [isAdminPlaylistManagerOpen, setIsAdminPlaylistManagerOpen] = useState(false);
  const [isSurpriseModalOpen, setIsSurpriseModalOpen] = useState(false);
  const [isPlaylistRepeat, setIsPlaylistRepeat] = useState(false);

  // Playback handlers
  const handleOpenVideo = (video: MediaItem) => {
    sfx.playClick();
    onPauseAudio?.();
    setActiveVideo(video);
  };

  const handleOpenAudio = (track: MediaItem) => {
    sfx.playClick();
    onTurntableOpenChange?.(true);
    setActiveAudio(track);
    onActiveAudioTrackChange?.(track);
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

  // Extract all unique tags for current active tab (case-insensitive deduplication)
  const availableTags = useMemo(() => {
    const rawTags = tabMedia
      .flatMap((m) => m.tags || (m.category ? m.category.split(',').map((s) => s.trim()) : []))
      .filter(Boolean);
    const seen = new Set<string>();
    const unique: string[] = [];
    for (const tag of rawTags) {
      const lower = tag.toLowerCase();
      if (!seen.has(lower)) {
        seen.add(lower);
        unique.push(tag);
      }
    }
    return unique;
  }, [tabMedia]);

  // Filter & Search using smart multi-token matcher
  const filteredMedia = tabMedia.filter((m) => {
    const matchesSearch = matchSmartSearch(
      [
        m.title,
        m.secondaryTitle,
        m.episode,
        m.episode ? `#${m.episode}` : null,
        m.episode ? `tập ${m.episode}` : null,
        m.category,
        m.artist,
        m.description,
        m.tags,
      ],
      searchQuery
    );

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
    const isPlayingCurrent = currentTrack && item.id === currentTrack.id;

    const isCardHovered = hoveredCardId === item.id;

    return (
      <div
        key={item.id}
        onMouseEnter={() => setHoveredCardId(item.id)}
        onMouseLeave={() => setHoveredCardId(null)}
        onClick={() => {
          if (item.type === 'video') handleOpenVideo(item);
          else handleOpenAudio(item);
        }}
        style={{ isolation: 'isolate' }}
        className={`group relative rounded-xl border cursor-pointer flex flex-col ${theme === 'aer'
          ? 'bg-white border-[#CBD5E1] hover:border-[#0284C7] transition-none shadow-none overflow-hidden'
          : theme === 'ignis'
            ? 'bg-ice-card border-ice-border hover:border-ice-accent/60 hover:shadow-xl transition-all duration-300 overflow-visible hover:scale-[1.06] hover:z-30'
            : theme === 'terra'
              ? 'bg-ice-card border-ice-border hover:border-ice-accent/60 hover:shadow-xl transition-all duration-300 overflow-visible hover:-translate-y-1'
              : isLightMode
                ? 'bg-ice-card border-ice-border hover:border-ice-accent/80 hover:shadow-xl transition-all duration-300 overflow-hidden hover:-translate-y-1'
                : 'bg-ice-card border-ice-border hover:border-amber-400/80 hover:shadow-xl transition-all duration-300 overflow-hidden hover:-translate-y-1'
          } ${isPlayingCurrent
            ? theme === 'aer' ? 'border-[#0284C7] ring-2 ring-[#0284C7]/40' : theme === 'aqua' ? 'border-sky-500 ring-2 ring-sky-500/40 shadow-sky-500/20' : 'border-amber-400 ring-2 ring-amber-500/50 shadow-amber-500/20'
            : ''
          } ${isShelf ? 'w-[170px] shrink-0' : ''
          }`}
      >
        {/* Ignis Mode: Bottom-to-Top Organic Fire Aura */}
        {theme === 'ignis' && (
          <IgnisFireAura isHovered={isCardHovered} />
        )}

        {/* Terra Mode: Outer Botanical Vine Frame */}
        {theme === 'terra' && (
          <TerraBotanicalCardFrame isFavorite={isFav} />
        )}

        <div style={{ isolation: 'isolate' }} className="aspect-[2/3] w-full relative overflow-hidden bg-black flex items-center justify-center rounded-t-xl">
          {hasCover && coverImg ? (
            <img
              src={coverImg.startsWith('http') ? coverImg : `file://${coverImg}`}
              alt={item.title}
              loading="lazy"
              decoding="async"
              style={{
                objectPosition: item.listCardPosition || item.coverPosition || '50% 50%',
                transform: (item.listCardZoom || item.coverZoom) ? `scale(${item.listCardZoom || item.coverZoom})` : undefined,
                transformOrigin: item.listCardPosition || item.coverPosition || '50% 50%',
              }}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div
              className={`w-full h-full flex flex-col items-center justify-center p-3 text-center select-none bg-gradient-to-br from-ice-card via-ice-hover to-ice-bg`}
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
                className="p-1.5 rounded-full backdrop-blur-md bg-black/60 btn-keep-white text-white hover:bg-black/80 hover:text-white transition-all shadow-sm"
                title="Thêm vào danh sách phát cá nhân"
              >
                <ListPlus className="w-3.5 h-3.5 text-white stroke-[2]" />
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
                className={`p-1.5 rounded-full backdrop-blur-md transition-all ${theme === 'terra'
                  ? isFav
                    ? 'bg-[#2B241D] text-red-500 border border-[#7C5332] shadow-sm'
                    : 'bg-[#2B241D]/90 text-[#7C5332] hover:bg-[#332A21] border border-[#7C5332]/60'
                  : isFav
                    ? 'bg-rose-500 text-white'
                    : 'bg-black/60 text-white/70 hover:text-rose-400'
                  }`}
                title={isFav ? 'Bỏ thích' : 'Yêu thích'}
              >
                {theme === 'terra' ? (
                  <TerraAppleFavoriteIcon isFavorite={isFav} size={15} />
                ) : (
                  <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-current' : ''}`} />
                )}
              </button>
            )}
          </div>

          {/* Optional order index badge */}
          {orderIndex !== undefined && (
            <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-black/80 text-[10px] font-mono text-white font-bold border border-white/20 z-10 shadow-sm">
              #{orderIndex}
            </div>
          )}

          <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 flex items-center justify-center transition-colors">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg transform scale-75 opacity-0 group-hover:opacity-100 group-hover:scale-100 transition-all ${theme === 'aer'
              ? 'bg-[#0284C7] text-white shadow-none'
              : theme === 'aqua'
                ? 'bg-sky-500 text-white shadow-sky-500/30'
                : theme === 'solar'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-amber-500/20'
                  : 'bg-amber-400 text-black'
              }`}>
              <Play className={`w-4 h-4 ml-0.5 ${theme === 'aer' || theme === 'aqua' ? 'fill-white text-white' : 'fill-current'}`} />
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
            <h4 className="text-xs font-bold text-ice-text truncate group-hover:text-ice-accent">
              {item.title}
            </h4>
            <p className="text-[10px] text-ice-muted truncate mt-0.5" title={formatMediaCardSubtitle(item)}>
              {formatMediaCardSubtitle(item)}
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
  if (effectiveActiveAudioTrack) {
    return (
      <VinylTurntablePlayer
        media={effectiveActiveAudioTrack}
        allAudio={tabMedia}
        playlists={tabPlaylists}
        isAdmin={isAdmin}
        isPlaying={isPlayingAudio}
        currentTime={audioCurrentTime}
        duration={audioDuration}
        volume={audioVolume}
        isMuted={audioIsMuted}
        onTogglePlay={onTogglePlayAudio}
        onSeek={onSeekAudio}
        onNext={onNextAudio}
        onPrev={onPrevAudio}
        onVolumeChange={onVolumeChange}
        onToggleMute={onToggleMuteAudio}
        onBack={() => {
          onTurntableOpenChange?.(false);
          setActiveAudio(null);
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
        <div className="p-6 rounded-2xl bg-gradient-to-r from-ice-card via-ice-hover/70 to-ice-card border border-ice-border shadow-xl flex flex-wrap md:flex-nowrap items-center gap-6">
          <div className={`overflow-hidden bg-black/70 shrink-0 border border-white/15 shadow-xl ${viewingPlaylist.coverAspectRatio === '16:9' ? 'w-48 aspect-video rounded-xl' : 'w-32 h-32 rounded-2xl'
            }`}>
            {viewingPlaylist.coverPath ? (
              <img
                src={viewingPlaylist.coverPath.startsWith('http') ? viewingPlaylist.coverPath : `file://${viewingPlaylist.coverPath}`}
                alt={viewingPlaylist.name}
                loading="lazy"
                decoding="async"
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

            <h1 className="text-2xl font-black text-ice-text tracking-wide truncate">
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
                      handleOpenAudio(first);
                    }
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-lg active:scale-95 ${theme === 'aer'
                    ? 'bg-[#0284C7] hover:bg-[#0369A1] text-white shadow-none'
                    : theme === 'aqua'
                      ? 'bg-sky-500 hover:bg-sky-400 text-white shadow-sky-500/20'
                      : theme === 'solar'
                        ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-black shadow-amber-500/20'
                        : 'bg-amber-400 hover:bg-amber-300 text-black shadow-amber-400/20'
                    }`}
                >
                  <Play className={`w-4 h-4 ${theme === 'aer' || theme === 'aqua' ? 'fill-white' : 'fill-black'}`} />
                  <span>Phát Tất Cả</span>
                </button>
              )}

              {/* Shuffle Play Button */}
              {processedItems.length > 0 && (
                <button
                  onClick={() => {
                    sfx.playClick();
                    const shuffled = [...processedItems].sort(() => Math.random() - 0.5);
                    const first = shuffled[0];
                    if (first.type === 'video') setActiveVideo(first);
                    else {
                      handleOpenAudio(first);
                    }
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 hover:text-white border border-white/10 text-xs font-semibold transition-all active:scale-95"
                  title="Phát ngẫu nhiên một mục"
                >
                  <Shuffle className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Phát Ngẫu Nhiên</span>
                </button>
              )}

              {/* Repeat Playlist Toggle */}
              <button
                onClick={() => {
                  sfx.playClick();
                  setIsPlaylistRepeat(!isPlaylistRepeat);
                }}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-all active:scale-95 ${isPlaylistRepeat
                  ? theme === 'aer'
                    ? 'bg-[#0284C7]/20 border-[#0284C7] text-[#0284C7]'
                    : theme === 'aqua'
                      ? 'bg-sky-500/20 border-sky-400 text-sky-700'
                      : theme === 'solar'
                        ? 'bg-amber-400/20 border-amber-500 text-amber-900 font-bold'
                        : 'bg-amber-400/20 border-amber-400/50 text-amber-300'
                  : isLightMode
                    ? 'bg-slate-100 border-slate-300 text-slate-700 hover:text-slate-950'
                    : 'bg-white/5 border-white/10 text-white/70 hover:text-white'
                  }`}
                title={isPlaylistRepeat ? 'Đang bật lặp lại danh sách' : 'Bật lặp lại danh sách'}
              >
                <Repeat className="w-3.5 h-3.5" />
                <span>{isPlaylistRepeat ? 'Lặp: Bật' : 'Lặp Lại'}</span>
              </button>

              {/* Favorite Heart / Apple Button */}
              {onToggleFavoritePlaylist && (
                <button
                  onClick={() => onToggleFavoritePlaylist(viewingPlaylist.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-all active:scale-95 ${theme === 'terra'
                    ? isPlaylistFavorite
                      ? 'bg-[#FAF7F2] text-red-600 border border-[#78553A]/70 shadow-sm'
                      : 'bg-[#FAF7F2]/90 text-[#78553A] hover:bg-[#EDE6D8] border border-[#78553A]/40'
                    : isPlaylistFavorite
                      ? 'bg-rose-500/20 border-rose-500/50 text-rose-400'
                      : 'bg-white/5 border-white/10 text-white/70 hover:text-white'
                    }`}
                  title={isPlaylistFavorite ? 'Đã yêu thích' : 'Lưu vào yêu thích'}
                >
                  {theme === 'terra' ? (
                    <TerraAppleFavoriteIcon isFavorite={isPlaylistFavorite} size={15} />
                  ) : (
                    <Heart className={`w-3.5 h-3.5 ${isPlaylistFavorite ? 'fill-current text-rose-500' : ''}`} />
                  )}
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
            <span className="text-xs font-bold text-ice-text uppercase tracking-wider">Danh Sách Video / Bài Hát</span>
            <span className="text-xs text-ice-muted font-mono">({processedItems.length})</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Sort Toggle Button */}
            <button
              onClick={() => {
                sfx.playClick();
                setPlaylistSortAsc(!playlistSortAsc);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-ice-hover hover:bg-ice-border/40 border border-ice-border text-xs font-semibold text-ice-text transition-all"
              title="Đổi thứ tự hiển thị"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
              <span>{playlistSortAsc ? 'Thứ tự: Từ trên xuống (1 → N)' : 'Thứ tự: Từ dưới lên (N → 1)'}</span>
            </button>

            {/* Mini Search Button & Input */}
            <div className="relative flex items-center">
              {isPlaylistSearchOpen ? (
                <div className="flex items-center gap-1 bg-ice-card border border-amber-400/50 rounded-lg px-2.5 py-1 animate-fade-in shadow-md">
                  <Search className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                  <input
                    type="text"
                    value={playlistSearch}
                    onChange={(e) => setPlaylistSearch(e.target.value)}
                    placeholder="Tìm trong danh sách này..."
                    autoFocus
                    className="w-44 bg-transparent text-xs text-ice-text placeholder-ice-muted focus:outline-none"
                  />
                  {playlistSearch && (
                    <button onClick={() => setPlaylistSearch('')} className="text-ice-muted hover:text-ice-text">
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
                  className={`p-1.5 rounded-lg border transition-colors ${isLightMode
                    ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-600 hover:text-ice-accent'
                    : 'bg-white/5 hover:bg-white/10 border-white/10 text-ice-subtext hover:text-amber-400'
                    }`}
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
            className={`flex items-center gap-2 py-2 rounded-xl text-xs font-bold transition-all duration-300 ${activeTab === 'video'
              ? theme === 'aer'
                ? 'px-4 bg-[#0284C7] text-white border border-[#0284C7] shadow-none'
                : theme === 'aqua'
                ? 'px-4 bg-sky-500 text-white border border-sky-400 shadow-md shadow-sky-500/20'
                : theme === 'solar'
                ? 'px-4 bg-amber-500 text-slate-950 font-black border border-amber-400 shadow-md shadow-amber-500/20'
                : 'px-4 bg-white/10 text-white border border-white/20 shadow-md'
              : theme === 'aer'
              ? 'px-3 text-slate-600 hover:text-[#0284C7] hover:bg-slate-200/70 border border-transparent'
              : theme === 'aqua'
              ? 'px-3 text-slate-600 hover:text-sky-700 hover:bg-sky-50 border border-transparent'
              : theme === 'solar'
              ? 'px-3 text-slate-700 hover:text-amber-950 hover:bg-amber-100/60 border border-transparent'
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
            className={`flex items-center gap-2 py-2 rounded-xl text-xs font-bold transition-all duration-300 ${activeTab === 'music'
              ? theme === 'aer'
                ? 'px-4 bg-[#0284C7] text-white border border-[#0284C7] shadow-none'
                : theme === 'aqua'
                ? 'px-4 bg-sky-500 text-white border border-sky-400 shadow-md shadow-sky-500/20'
                : theme === 'solar'
                ? 'px-4 bg-amber-500 text-slate-950 font-black border border-amber-400 shadow-md shadow-amber-500/20'
                : 'px-4 bg-white/10 text-white border border-white/20 shadow-md'
              : theme === 'aer'
              ? 'px-3 text-slate-600 hover:text-[#0284C7] hover:bg-slate-200/70 border border-transparent'
              : theme === 'aqua'
              ? 'px-3 text-slate-600 hover:text-sky-700 hover:bg-sky-50 border border-transparent'
              : theme === 'solar'
              ? 'px-3 text-slate-700 hover:text-amber-950 hover:bg-amber-100/60 border border-transparent'
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
            className={`flex items-center gap-2 py-2 rounded-xl text-xs font-bold transition-all duration-300 ${activeTab === 'podcast'
              ? theme === 'aer'
                ? 'px-4 bg-[#0284C7] text-white border border-[#0284C7] shadow-none'
                : theme === 'aqua'
                ? 'px-4 bg-sky-500 text-white border border-sky-400 shadow-md shadow-sky-500/20'
                : theme === 'solar'
                ? 'px-4 bg-amber-500 text-slate-950 font-black border border-amber-400 shadow-md shadow-amber-500/20'
                : 'px-4 bg-white/10 text-white border border-white/20 shadow-md'
              : theme === 'aer'
              ? 'px-3 text-slate-600 hover:text-[#0284C7] hover:bg-slate-200/70 border border-transparent'
              : theme === 'aqua'
              ? 'px-3 text-slate-600 hover:text-sky-700 hover:bg-sky-50 border border-transparent'
              : theme === 'solar'
              ? 'px-3 text-slate-700 hover:text-amber-950 hover:bg-amber-100/60 border border-transparent'
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
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 ${
                theme === 'aer'
                  ? 'bg-[#B8C7D9] hover:bg-[#A6B8CB] text-[#0284C7] border border-[#64748B]'
                  : theme === 'aqua'
                  ? 'bg-sky-100 hover:bg-sky-200 text-sky-800 border border-sky-300'
                  : theme === 'solar'
                  ? 'bg-amber-100 hover:bg-amber-200 text-amber-950 font-bold border border-amber-300'
                  : 'bg-white/10 hover:bg-white/15 text-white border border-white/15'
              }`}
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
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${filterOfflineOnly
              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-sm'
              : isLightMode
                ? 'bg-ice-card text-slate-700 border-ice-border hover:text-slate-950'
                : 'bg-ice-card text-ice-subtext border-ice-border hover:text-white'
              }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Chỉ mục đã tải</span>
          </button>

          {/* Surprise Media Button ("Hôm nay xem gì" / "Hôm nay nghe gì") */}
          <button
            onClick={() => {
              sfx.playClick();
              setIsSurpriseModalOpen(true);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer ${theme === 'aer'
              ? 'bg-[#0284C7] hover:bg-[#0369A1] text-white border border-[#0284C7] shadow-none'
              : theme === 'aqua'
                ? 'bg-sky-500 hover:bg-sky-400 text-white border border-sky-400 shadow-md shadow-sky-500/20'
                : theme === 'solar'
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-black border border-amber-400 shadow-md shadow-amber-500/20'
                : 'bg-gradient-to-r from-amber-400/20 to-amber-500/20 hover:from-amber-400/30 hover:to-amber-500/30 border border-amber-400/40 text-amber-300'
            }`}
            title={activeTab === 'video' ? 'Vòng quay ngẫu nhiên gợi ý phim hay' : 'Gợi ý ngẫu nhiên một giai điệu hay'}
          >
            <Sparkles className={`w-3.5 h-3.5 animate-pulse ${
              theme === 'solar' ? 'text-slate-950' : 'text-white'
            }`} />
            <span>{activeTab === 'video' ? 'Hôm Nay Xem Gì?' : 'Hôm Nay Nghe Gì?'}</span>
          </button>

          {isAdmin && (
            <button
              onClick={() => {
                sfx.playClick();
                setShowHiddenOnly(!showHiddenOnly);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${showHiddenOnly
                ? isLightMode
                  ? 'bg-amber-500/20 text-amber-800 border-amber-500/50 shadow-sm font-bold'
                  : 'bg-amber-500/20 text-amber-400 border-amber-500/50 shadow-sm'
                : isLightMode
                  ? 'bg-ice-card text-slate-700 border-ice-border hover:text-slate-950'
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
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 border ${isLightMode
                    ? 'bg-slate-200/80 hover:bg-slate-300 text-slate-800 border-slate-300'
                    : 'bg-white/10 hover:bg-white/15 text-white border-white/15'
                    }`}
                  title="Quản lý thể loại / tag giải trí"
                >
                  <Tag className={`w-3.5 h-3.5 ${isLightMode ? 'text-ice-accent' : 'text-amber-400'}`} />
                  <span>Quản Lý Thể Loại</span>
                </button>
              )}

              {/* Admin Playlist Manager Button */}
              {onSavePlaylist && (
                <button
                  onClick={() => {
                    sfx.playClick();
                    setIsAdminPlaylistManagerOpen(true);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 border ${isLightMode
                    ? 'bg-slate-200/80 hover:bg-slate-300 text-slate-800 border-slate-300'
                    : 'bg-white/10 hover:bg-white/15 text-white border-white/15'
                    }`}
                  title="Quản lý danh sách phát Admin cho Phim, Nhạc, Audio"
                >
                  <ListMusic className={`w-3.5 h-3.5 ${isLightMode ? 'text-ice-accent' : 'text-amber-400'}`} />
                  <span>Quản Lý Playlist</span>
                </button>
              )}

              {onSavePlaylist && (
                <button
                  onClick={() => {
                    sfx.playClick();
                    setEditingPlaylist(null);
                    setIsPlaylistModalOpen(true);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 border ${isLightMode
                    ? 'bg-slate-200/80 hover:bg-slate-300 text-slate-800 border-slate-300'
                    : 'bg-white/10 hover:bg-white/15 text-white border-white/15'
                    }`}
                >
                  <ListPlus className={`w-3.5 h-3.5 ${isLightMode ? 'text-ice-accent' : 'text-amber-400'}`} />
                  <span>Tạo Danh Sách</span>
                </button>
              )}

              <button
                onClick={() => {
                  sfx.playClick();
                  onOpenAddMedia();
                }}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 ${theme === 'aer'
                  ? 'bg-[#0284C7] hover:bg-[#0369A1] text-white shadow-none'
                  : theme === 'aqua'
                    ? 'bg-sky-500 hover:bg-sky-400 text-white shadow-sky-500/20'
                    : theme === 'solar'
                      ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-black shadow-amber-500/20'
                      : 'bg-amber-400 hover:bg-amber-300 text-black'
                  }`}
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
              handleOpenAudio(item);
            }
          }}
          onActiveBannerChange={onActiveBannerChange}
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
                    handleOpenAudio(item);
                  } else {
                    setActiveVideo(item);
                  }
                }}
                className={`flex items-center gap-3 bg-ice-card hover:bg-ice-hover border border-ice-border rounded-xl p-3 min-w-[280px] max-w-[320px] cursor-pointer transition-all hover:-translate-y-1 hover:shadow-xl group shrink-0 ${isLightMode ? 'hover:border-ice-accent/60' : 'hover:border-amber-400/60'
                  }`}
              >
                <div className="w-16 aspect-video rounded-lg overflow-hidden bg-black/70 shrink-0 border border-ice-border relative">
                  {item.coverPath ? (
                    <img
                      src={item.coverPath.startsWith('http') ? item.coverPath : `file://${item.coverPath}`}
                      alt={item.title}
                      loading="lazy"
                      decoding="async"
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
                  <h4 className="text-xs font-bold text-ice-text truncate group-hover:text-ice-accent transition-colors">
                    {item.title}
                  </h4>
                  <p className="text-[10px] text-ice-muted truncate mt-0.5">Đã xem {percent}%</p>
                </div>

                <div className={`p-2 rounded-full transition-all shrink-0 ${theme === 'aer'
                  ? 'bg-[#0284C7]/20 text-[#0284C7] group-hover:bg-[#0284C7] group-hover:text-white'
                  : theme === 'aqua'
                    ? 'bg-sky-500/20 text-sky-600 group-hover:bg-sky-500 group-hover:text-white'
                    : theme === 'solar'
                      ? 'bg-amber-500/20 text-amber-700 group-hover:bg-amber-500 group-hover:text-slate-950'
                      : 'bg-amber-500/20 text-amber-400 group-hover:bg-amber-500 group-hover:text-black'
                  }`}>
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
          iconAccentColor={theme === 'aer' ? 'bg-[#0284C7]' : theme === 'aqua' ? 'bg-sky-500' : theme === 'solar' ? 'bg-amber-500' : 'bg-amber-400'}
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
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${selectedTag === 'all'
              ? theme === 'aer'
                ? 'bg-[#0284C7] text-white border-[#0284C7]'
                : theme === 'aqua'
                ? 'bg-sky-500 text-white border-sky-400 shadow-sm'
                : theme === 'solar'
                ? 'bg-amber-500 text-slate-950 font-black border-amber-400 shadow-sm'
                : 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm'
              : theme === 'aer'
              ? 'bg-white text-slate-700 border-slate-300 hover:text-[#0284C7] hover:border-[#0284C7]'
              : theme === 'aqua'
              ? 'bg-white text-slate-700 border-sky-200 hover:text-sky-700 hover:border-sky-400'
              : theme === 'solar'
              ? 'bg-white text-slate-700 border-amber-200 hover:text-amber-950 hover:border-amber-400'
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
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${selectedTag === tag
                ? theme === 'aer'
                  ? 'bg-[#0284C7] text-white border-[#0284C7]'
                  : theme === 'aqua'
                  ? 'bg-sky-500 text-white border-sky-400 shadow-sm'
                  : theme === 'solar'
                  ? 'bg-amber-500 text-slate-950 font-black border-amber-400 shadow-sm'
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm'
                : theme === 'aer'
                ? 'bg-white text-slate-700 border-slate-300 hover:text-[#0284C7] hover:border-[#0284C7]'
                : theme === 'aqua'
                ? 'bg-white text-slate-700 border-sky-200 hover:text-sky-700 hover:border-sky-400'
                : theme === 'solar'
                ? 'bg-white text-slate-700 border-amber-200 hover:text-amber-950 hover:border-amber-400'
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
                  className={`px-6 py-2.5 rounded-xl font-bold text-xs border border-ice-border transition-all shadow-md active:scale-95 ${isLightMode
                    ? 'bg-ice-card hover:bg-slate-100 text-slate-800 hover:border-ice-accent'
                    : 'bg-ice-card hover:bg-white/10 text-white hover:border-amber-400'
                    }`}
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

      {/* Surprise Media Modal ("Hôm nay xem gì" / "Hôm nay nghe gì") */}
      {isSurpriseModalOpen && (
        <SurpriseMediaModal
          isOpen={isSurpriseModalOpen}
          onClose={() => setIsSurpriseModalOpen(false)}
          type={activeTab === 'video' ? 'movie' : activeTab === 'music' ? 'music' : 'podcast'}
          mediaList={
            activeTab === 'video'
              ? media.filter((m) => m.type === 'video')
              : activeTab === 'music'
                ? media.filter((m) => m.type === 'audio' && (!m.subType || m.subType === 'music'))
                : media.filter((m) => m.type === 'audio' && m.subType === 'podcast')
          }
          onPlay={(item) => {
            if (item.type === 'video') handleOpenVideo(item);
            else handleOpenAudio(item);
          }}
        />
      )}

      {/* Admin Playlist Manager Modal */}
      {isAdminPlaylistManagerOpen && onSavePlaylist && onDeletePlaylist && (
        <AdminPlaylistManagerModal
          isOpen={isAdminPlaylistManagerOpen}
          onClose={() => setIsAdminPlaylistManagerOpen(false)}
          playlists={playlists}
          allMedia={media}
          defaultTab={activeTab}
          onSavePlaylist={onSavePlaylist}
          onDeletePlaylist={onDeletePlaylist}
        />
      )}
    </div>
  );
};
