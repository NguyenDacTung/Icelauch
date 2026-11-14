import React, { useState, useEffect } from 'react';
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
  ListVideo
} from 'lucide-react';
import { VideoTheaterView } from './VideoTheaterView';
import { VinylTurntablePlayer } from './VinylTurntablePlayer';
import { MediaHeroBanner } from './MediaHeroBanner';
import { PlaylistFormModal } from '../admin/PlaylistFormModal';
import { parseMediaUrl } from '../../utils/mediaUrl';
import type { MediaItem, MediaPlaylist, MediaSubType, AppBannerSettings } from '../../types';
import { sfx } from '../../utils/sfx';

interface MediaViewProps {
  media: MediaItem[];
  playlists?: MediaPlaylist[];
  bannerSettings?: AppBannerSettings;
  isAdmin: boolean;
  searchQuery: string;
  onPlayAudio?: (track: MediaItem) => void;
  onSaveMedia: (media: Partial<MediaItem>) => void;
  onDeleteMedia: (id: string) => void;
  onToggleHide?: (id: string) => void;
  onEditMedia?: (media: MediaItem) => void;
  onOpenAddMedia: () => void;
  onUpdateMediaProgress: (id: string, position: number, watched: boolean) => void;
  onSavePlaylist?: (playlist: Partial<MediaPlaylist>) => void;
  onDeletePlaylist?: (id: string) => void;
  onDownloadMedia?: (id: string) => void;
  onDeleteDownloaded?: (id: string) => void;
  onMinimizeToMiniPlayer?: (media: MediaItem) => void;
}

export const MediaView: React.FC<MediaViewProps> = ({
  media,
  playlists = [],
  bannerSettings,
  isAdmin,
  searchQuery,
  onPlayAudio,
  onSaveMedia,
  onDeleteMedia,
  onToggleHide,
  onEditMedia,
  onOpenAddMedia,
  onUpdateMediaProgress,
  onSavePlaylist,
  onDeletePlaylist,
  onDownloadMedia,
  onDeleteDownloaded,
  onMinimizeToMiniPlayer,
}) => {
  // 3 Sub-Tabs: 'video' | 'music' | 'podcast'
  const [activeTab, setActiveTab] = useState<'video' | 'music' | 'podcast'>('video');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [filterOfflineOnly, setFilterOfflineOnly] = useState(false);
  const [activeVideo, setActiveVideo] = useState<MediaItem | null>(null);
  const [activeAudioTrack, setActiveAudioTrack] = useState<MediaItem | null>(null);
  const [showHiddenOnly, setShowHiddenOnly] = useState(false);
  const [visibleCount, setVisibleCount] = useState<number>(24);

  useEffect(() => {
    setVisibleCount(24);
  }, [activeTab, selectedTag, filterOfflineOnly, searchQuery, showHiddenOnly]);

  // Playlist Form Modal state
  const [isPlaylistModalOpen, setIsPlaylistModalOpen] = useState(false);
  const [editingPlaylist, setEditingPlaylist] = useState<MediaPlaylist | null>(null);

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

  // Continue watching / listening (items with lastPosition > 10 and not watched)
  const continueItems = tabMedia.filter((m) => m.lastPosition > 10 && !m.watched);

  // Playlists for current tab
  const tabPlaylists = playlists.filter((p) => {
    if (activeTab === 'video') return p.type === 'video';
    if (activeTab === 'music') return p.type === 'audio' && (p.subType === 'music' || !p.subType);
    return p.type === 'audio' && p.subType === 'podcast';
  });

  const formatDuration = (secs?: number) => {
    if (!secs) return '--:--';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
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
        onSelectVideo={(item) => setActiveVideo(item)}
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
        onBack={() => setActiveAudioTrack(null)}
        onSelectTrack={(item) => {
          setActiveAudioTrack(item);
          onPlayAudio?.(item);
        }}
        onUpdateProgress={onUpdateMediaProgress}
        onDownloadMedia={onDownloadMedia}
        onDeleteDownloaded={onDeleteDownloaded}
      />
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-8 py-6 space-y-8 select-none">
      {/* 1. Header: 3 Sub-Tabs Bar & Admin Action */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-ice-border/60 pb-4">
        {/* Sub-Tabs: Phim & Video / Âm Nhạc / Audio & Podcast - Dynamic expanding active tab */}
        <div className="flex items-center gap-1.5 p-1 bg-ice-card border border-ice-border rounded-2xl shadow-sm">
          <button
            onClick={() => {
              sfx.playClick();
              setActiveTab('video');
              setSelectedTag('all');
            }}
            title="Phim & Video"
            className={`flex items-center gap-2 py-2 rounded-xl text-xs font-bold transition-all duration-300 ${activeTab === 'video'
                ? 'px-4 bg-blue-600/30 text-blue-400 border border-blue-500/50 shadow-md'
                : 'px-3 text-ice-subtext hover:text-white hover:bg-white/5 border border-transparent'
              }`}
          >
            <Film className="w-4 h-4 shrink-0" />
            {activeTab === 'video' && (
              <>
                <span className="whitespace-nowrap">Phim & Video</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/40 font-mono">
                  {baseMedia.filter((m) => m.type === 'video').length}
                </span>
              </>
            )}
          </button>

          <button
            onClick={() => {
              sfx.playClick();
              setActiveTab('music');
              setSelectedTag('all');
            }}
            title="Âm Nhạc (Songs & Chill)"
            className={`flex items-center gap-2 py-2 rounded-xl text-xs font-bold transition-all duration-300 ${activeTab === 'music'
                ? 'px-4 bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-md'
                : 'px-3 text-ice-subtext hover:text-white hover:bg-white/5 border border-transparent'
              }`}
          >
            <Music className="w-4 h-4 shrink-0" />
            {activeTab === 'music' && (
              <>
                <span className="whitespace-nowrap">Âm Nhạc</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/40 font-mono">
                  {baseMedia.filter((m) => m.type === 'audio' && (m.subType === 'music' || !m.subType)).length}
                </span>
              </>
            )}
          </button>

          <button
            onClick={() => {
              sfx.playClick();
              setActiveTab('podcast');
              setSelectedTag('all');
            }}
            title="Audio & Podcast (Sách nói)"
            className={`flex items-center gap-2 py-2 rounded-xl text-xs font-bold transition-all duration-300 ${activeTab === 'podcast'
                ? 'px-4 bg-purple-600/30 text-purple-300 border border-purple-500/40 shadow-md'
                : 'px-3 text-ice-subtext hover:text-white hover:bg-white/5 border border-transparent'
              }`}
          >
            <Mic className="w-4 h-4 shrink-0" />
            {activeTab === 'podcast' && (
              <>
                <span className="whitespace-nowrap">Audio & Podcast</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/40 font-mono">
                  {baseMedia.filter((m) => m.type === 'audio' && m.subType === 'podcast').length}
                </span>
              </>
            )}
          </button>
        </div>

        {/* Admin Tools: Create Playlist & Add Media */}
        <div className="flex items-center gap-3">
          {/* Offline Downloaded Filter Toggle */}
          <button
            onClick={() => {
              sfx.playClick();
              setFilterOfflineOnly(!filterOfflineOnly);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${filterOfflineOnly
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm'
                : 'bg-ice-card text-ice-muted border-ice-border hover:text-white'
              }`}
            title="Chỉ hiển thị các video/bài hát đã tải về máy"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Đã tải về máy</span>
          </button>

          {isAdmin && (
            <>
              {onSavePlaylist && (
                <button
                  onClick={() => {
                    sfx.playClick();
                    setEditingPlaylist(null);
                    setIsPlaylistModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-ice-card hover:bg-ice-hover text-ice-text hover:text-white border border-ice-border text-xs font-bold transition-colors"
                >
                  <ListPlus className="w-3.5 h-3.5 text-amber-400" />
                  <span>+ Tạo Danh Sách Phát</span>
                </button>
              )}

              <button
                onClick={() => {
                  sfx.playClick();
                  onOpenAddMedia();
                }}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition-colors shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>
                  {activeTab === 'video' ? 'Thêm Phim / Video' : activeTab === 'music' ? 'Thêm Bài Hát' : 'Thêm Podcast'}
                </span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* 2. Hero Banner (Exact 16:9 Aspect Ratio Layout for each Tab) */}
      {tabMedia.length > 0 && !searchQuery && (
        <MediaHeroBanner
          mediaList={tabMedia}
          type={activeTab === 'video' ? 'video' : 'audio'}
          bannerSettings={
            activeTab === 'video'
              ? bannerSettings?.videos
              : activeTab === 'music'
                ? bannerSettings?.music
                : bannerSettings?.podcasts
          }
          onPlayMedia={(item) => {
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

      {/* 3. Continue Watching / Listening Row */}
      {continueItems.length > 0 && !searchQuery && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white tracking-wider uppercase flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
              <span>{activeTab === 'video' ? 'Tiếp Tục Xem Dở' : 'Tiếp Tục Nghe Dở'}</span>
            </h2>
          </div>

          <div className="flex items-center gap-4 overflow-x-auto pb-2 scrollbar-thin">
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
          </div>
        </section>
      )}

      {/* 4. Playlists / Series / Albums Row */}
      {tabPlaylists.length > 0 && !searchQuery && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white tracking-wider uppercase flex items-center gap-2">
              <ListVideo className="w-4 h-4 text-amber-400" />
              <span>
                {activeTab === 'video' ? 'Danh Sách Phát / Series Tuyển Tập' : activeTab === 'music' ? 'Albums & Tuyển Tập Nhạc' : 'Chuỗi Podcast & Sách Nói'}
              </span>
            </h2>
          </div>

          <div className="flex items-center gap-4 overflow-x-auto pb-2 scrollbar-thin">
            {tabPlaylists.map((pl) => {
              const count = pl.itemIds.length;
              return (
                <div
                  key={pl.id}
                  onClick={() => {
                    sfx.playClick();
                    // Open first item of playlist if available
                    const firstId = pl.itemIds[0];
                    const target = tabMedia.find((m) => m.id === firstId);
                    if (target) {
                      if (target.type === 'video') setActiveVideo(target);
                      else {
                        setActiveAudioTrack(target);
                        onPlayAudio?.(target);
                      }
                    }
                  }}
                  className="flex items-center gap-3 bg-ice-card hover:bg-ice-hover border border-ice-border rounded-xl p-3 min-w-[260px] max-w-[300px] cursor-pointer transition-all hover:-translate-y-1 hover:shadow-xl hover:border-amber-400/60 group shrink-0"
                >
                  <div className="w-14 h-14 rounded-xl overflow-hidden bg-black/60 shrink-0 border border-white/10 flex items-center justify-center">
                    {pl.coverPath ? (
                      <img
                        src={pl.coverPath.startsWith('http') ? pl.coverPath : `file://${pl.coverPath}`}
                        alt={pl.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <Disc className="w-6 h-6 text-amber-400" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-white truncate group-hover:text-amber-300">
                      {pl.name}
                    </h4>
                    <p className="text-[10px] text-ice-muted mt-0.5">{count} {activeTab === 'video' ? 'tập phim' : 'bài hát'}</p>
                  </div>

                  {isAdmin && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        sfx.playClick();
                        setEditingPlaylist(pl);
                        setIsPlaylistModalOpen(true);
                      }}
                      className="p-1.5 rounded-lg text-ice-muted hover:text-amber-400 hover:bg-white/10"
                      title="Sửa danh sách"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 5. Tag Filter Pills Bar */}
      {availableTags.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
          <button
            onClick={() => {
              sfx.playClick();
              setSelectedTag('all');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${selectedTag === 'all'
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
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${selectedTag === tag
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm'
                  : 'bg-ice-card text-ice-text border-ice-border hover:text-white'
                }`}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {/* 5.5 Video Genre Shelves (Horizontal Netflix-style rows per genre when viewing All) */}
      {activeTab === 'video' && selectedTag === 'all' && !searchQuery && availableTags.length > 0 && (
        <div className="space-y-6 pt-1">
          {availableTags.map((tag) => {
            const tagItems = tabMedia.filter(
              (m) => (m.tags && m.tags.includes(tag)) || (m.category && m.category.toLowerCase().includes(tag.toLowerCase()))
            );
            if (tagItems.length === 0) return null;

            return (
              <section key={tag} className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white tracking-wide uppercase flex items-center gap-2">
                    <span className="w-1.5 h-3.5 bg-amber-400 rounded-sm" />
                    <span>{tag}</span>
                    <span className="text-xs text-ice-muted font-mono font-normal">({tagItems.length})</span>
                  </h3>
                  <button
                    onClick={() => {
                      sfx.playClick();
                      setSelectedTag(tag);
                    }}
                    className="text-xs text-amber-400 hover:text-amber-300 font-semibold transition-colors flex items-center gap-1"
                  >
                    <span>Xem tất cả</span>
                    <span>&rarr;</span>
                  </button>
                </div>

                <div className="flex items-center gap-4 overflow-x-auto pb-2 scrollbar-thin">
                  {tagItems.map((item) => {
                    const parsed = parseMediaUrl(item.link);
                    const coverImg =
                      item.coverPath ||
                      item.bannerPath ||
                      parsed.thumbnailUrl ||
                      'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=600&q=80';
                    const isDownloaded = Boolean(item.localFilePath && item.downloadStatus === 'downloaded');

                    return (
                      <div
                        key={item.id}
                        onClick={() => {
                          sfx.playClick();
                          setActiveVideo(item);
                        }}
                        className="group relative bg-ice-card rounded-xl overflow-hidden border border-ice-border hover:border-amber-400/70 hover:shadow-xl cursor-pointer transition-all duration-300 hover:-translate-y-1 flex flex-col w-[240px] shrink-0"
                      >
                        <div className="aspect-video w-full relative overflow-hidden bg-black/90">
                          <img
                            src={coverImg.startsWith('http') ? coverImg : `file://${coverImg}`}
                            alt={item.title}
                            style={{
                              objectPosition: item.coverPosition || '50% 50%',
                              transform: item.coverZoom ? `scale(${item.coverZoom})` : undefined,
                              transformOrigin: item.coverPosition || '50% 50%',
                            }}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                          <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 flex items-center justify-center transition-colors">
                            <div className="w-10 h-10 rounded-full bg-amber-400 text-black flex items-center justify-center shadow-lg transform scale-75 opacity-0 group-hover:opacity-100 group-hover:scale-100 transition-all">
                              <Play className="w-4 h-4 fill-black ml-0.5" />
                            </div>
                          </div>
                          {isDownloaded && (
                            <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded text-[8px] font-black uppercase bg-emerald-500 text-black shadow">
                              ĐÃ TẢI VỀ
                            </span>
                          )}
                        </div>
                        <div className="p-2.5">
                          <h4 className="text-xs font-bold text-white truncate group-hover:text-amber-300">
                            {item.title}
                          </h4>
                          {item.description && (
                            <p className="text-[10px] text-ice-muted truncate mt-0.5">{item.description}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {/* 6. Media Grid (Video Cards or Audio Vinyl Cards) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-ice-border/60 pb-3">
          <h3 className="text-base font-bold text-white">
            {activeTab === 'video' ? 'Danh Sách Phim & Video' : activeTab === 'music' ? 'Kho Bài Hát' : 'Danh Sách Podcast'}
            <span className="text-xs text-ice-muted ml-2 font-normal">({filteredMedia.length})</span>
          </h3>
        </div>

        {filteredMedia.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {filteredMedia.slice(0, visibleCount).map((item) => {
                const parsed = parseMediaUrl(item.link);
                const coverImg =
                  item.coverPath ||
                  item.bannerPath ||
                  parsed.thumbnailUrl ||
                  'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=600&q=80';
                const isDownloaded = Boolean(item.localFilePath && item.downloadStatus === 'downloaded');

                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      sfx.playClick();
                      if (item.type === 'video') {
                        setActiveVideo(item);
                      } else {
                        setActiveAudioTrack(item);
                        onPlayAudio?.(item);
                      }
                    }}
                    className="group relative bg-ice-card rounded-2xl overflow-hidden border border-ice-border hover:border-amber-400/70 hover:shadow-2xl hover:shadow-amber-500/10 cursor-pointer transition-all duration-300 hover:-translate-y-1.5 flex flex-col"
                  >
                    {/* Thumbnail */}
                    <div className="aspect-video w-full relative overflow-hidden bg-black/90">
                      <img
                        src={coverImg.startsWith('http') ? coverImg : `file://${coverImg}`}
                        alt={item.title}
                        style={{
                          objectPosition: item.coverPosition || '50% 50%',
                          transform: item.coverZoom ? `scale(${item.coverZoom})` : undefined,
                          transformOrigin: item.coverPosition || '50% 50%',
                        }}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />

                      {/* Play Button Overlay */}
                      <div className="absolute inset-0 bg-black/40 group-hover:bg-black/15 flex items-center justify-center transition-colors">
                        <div className="w-12 h-12 rounded-full bg-amber-400 text-black flex items-center justify-center shadow-xl shadow-black/80 transform scale-75 opacity-0 group-hover:opacity-100 group-hover:scale-100 transition-all duration-200">
                          {item.type === 'video' ? <Play className="w-5 h-5 fill-black ml-0.5" /> : <Disc className="w-6 h-6 animate-spin" />}
                        </div>
                      </div>

                      {/* Badges */}
                      <div className="absolute top-2 left-2 flex flex-wrap items-center gap-1 z-10">
                        {isDownloaded && (
                          <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-emerald-500 text-black shadow">
                            ĐÃ TẢI VỀ
                          </span>
                        )}
                        {parsed.kind === 'youtube' && (
                          <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-red-600 text-white shadow">
                            YouTube
                          </span>
                        )}
                        {parsed.kind === 'facebook' && (
                          <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-blue-600 text-white shadow">
                            Facebook
                          </span>
                        )}
                        {parsed.kind === 'gdrive' && (
                          <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-ice-accent/30 text-ice-accent border border-ice-accent/50 shadow">
                            Drive
                          </span>
                        )}
                      </div>

                      {item.duration && (
                        <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/80 text-white text-[10px] font-mono border border-white/10">
                          {formatDuration(item.duration)}
                        </div>
                      )}
                    </div>

                    {/* Body Info */}
                    <div className="p-3.5 flex flex-col flex-1 justify-between gap-2">
                      <div>
                        <h4 className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors line-clamp-2">
                          {item.title}
                        </h4>
                        <p className="text-[11px] text-ice-muted mt-1 truncate">
                          {item.artist || item.category || (item.tags?.[0] ? `#${item.tags[0]}` : 'Media')}
                        </p>
                      </div>

                      {/* Admin Actions */}
                      {isAdmin && (
                        <div className="flex items-center justify-end gap-1 pt-2 border-t border-ice-border/40">
                          {onToggleHide && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                sfx.playClick();
                                onToggleHide(item.id);
                              }}
                              className={`p-1 rounded text-xs transition-colors ${item.hidden ? 'text-amber-400 font-bold' : 'text-ice-muted hover:text-white'
                                }`}
                              title={item.hidden ? 'Bỏ ẩn mục này' : 'Ẩn mục này'}
                            >
                              {item.hidden ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                            </button>
                          )}
                          {onEditMedia && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                sfx.playClick();
                                onEditMedia(item);
                              }}
                              className="p-1 rounded text-ice-muted hover:text-amber-400 transition-colors"
                              title="Sửa"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              sfx.playClick();
                              if (confirm('Bạn có chắc muốn xoá mục này không?')) {
                                onDeleteMedia(item.id);
                              }
                            }}
                            className="p-1 rounded text-ice-muted hover:text-red-400 transition-colors"
                            title="Xoá"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Load More Button for PC Media (24 items per batch) */}
            {visibleCount < filteredMedia.length && (
              <div className="pt-4 flex justify-center">
                <button
                  type="button"
                  onClick={() => {
                    sfx.playClick();
                    setVisibleCount((prev) => prev + 24);
                  }}
                  className="px-8 py-3 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs tracking-wider uppercase transition-all shadow-lg active:scale-95 flex items-center gap-2 hover:border-amber-400"
                >
                  <Plus className="w-4 h-4 text-amber-400" />
                  <span>Xem Thêm Phim & Video (+24 Mục • Còn lại {filteredMedia.length - visibleCount})</span>
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="py-20 flex flex-col items-center justify-center text-center space-y-3 rounded-2xl border border-dashed border-ice-border bg-ice-card/40">
            <Film className="w-10 h-10 text-ice-subtext opacity-50" />
            <h3 className="text-sm font-semibold text-white">Chưa có nội dung nào trong mục này</h3>
            <p className="text-xs text-ice-subtext max-w-sm">
              {searchQuery
                ? 'Không tìm thấy kết quả phù hợp với từ khoá tìm kiếm.'
                : 'Admin có thể bấm thêm nội dung mới ở góc trên bên phải.'}
            </p>
          </div>
        )}
      </section>

      {/* Playlist Form Modal */}
      {onSavePlaylist && (
        <PlaylistFormModal
          isOpen={isPlaylistModalOpen}
          onClose={() => {
            setIsPlaylistModalOpen(false);
            setEditingPlaylist(null);
          }}
          playlist={editingPlaylist}
          allMedia={media}
          defaultType={activeTab === 'video' ? 'video' : 'audio'}
          defaultSubType={getSubtypeForTab(activeTab)}
          onSave={onSavePlaylist}
          onDelete={onDeletePlaylist}
        />
      )}
    </div>
  );
};
