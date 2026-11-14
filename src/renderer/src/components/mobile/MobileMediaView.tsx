import React, { useState, useEffect, useDeferredValue } from 'react';
import {
  Film,
  Music,
  Radio,
  Search,
  X,
  Play,
  Sparkles,
  ChevronRight,
  Flame,
  Plus,
} from 'lucide-react';
import type { MediaItem, MediaPlaylist, SectionBannerSettings } from '../../types';
import { MobileHeroBanner } from './MobileHeroBanner';
import { HorizontalScroller } from '../common/HorizontalScroller';
import { MobileVideoTheaterView } from './MobileVideoTheaterView';
import { SafeImage } from '../common/SafeImage';
import { sfx } from '../../utils/sfx';

interface MobileMediaViewProps {
  media: MediaItem[];
  playlists: MediaPlaylist[];
  bannerSettings?: SectionBannerSettings;
  isAdmin: boolean;
  searchQuery: string;
  activeTheaterMedia?: MediaItem | null;
  onSelectTheaterMedia?: (item: MediaItem | null) => void;
  onPlayAudio?: (item: MediaItem) => void;
  onSaveMedia?: (item: Partial<MediaItem>) => void;
  onDeleteMedia?: (id: string) => void;
  onUpdateMediaProgress?: (id: string, position: number, watched: boolean) => void;
  onDownloadMedia?: (id: string) => void;
  onDeleteDownloaded?: (id: string) => void;
  onMinimizeToMiniPlayer?: (item: MediaItem) => void;
}

export const MobileMediaView: React.FC<MobileMediaViewProps> = ({
  media,
  playlists = [],
  bannerSettings,
  isAdmin,
  searchQuery,
  activeTheaterMedia: propActiveTheaterMedia,
  onSelectTheaterMedia,
  onPlayAudio,
  onSaveMedia,
  onDeleteMedia,
  onUpdateMediaProgress,
  onDownloadMedia,
  onDeleteDownloaded,
}) => {
  const [mediaTab, setMediaTab] = useState<'video' | 'music' | 'podcast'>('video');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [localSearch, setLocalSearch] = useState<string>('');
  const [visibleCount, setVisibleCount] = useState<number>(10);
  const deferredSearch = useDeferredValue(localSearch);
  const [localActiveTheaterMedia, setLocalActiveTheaterMedia] = useState<MediaItem | null>(null);

  useEffect(() => {
    setVisibleCount(10);
  }, [mediaTab, selectedCategory, localSearch, searchQuery]);

  const activeMedia = propActiveTheaterMedia !== undefined ? propActiveTheaterMedia : localActiveTheaterMedia;
  const handleSetActiveMedia = (item: MediaItem | null) => {
    setLocalActiveTheaterMedia(item);
    onSelectTheaterMedia?.(item);
  };

  const videoList = media.filter((m) => m.type === 'video');
  const musicList = media.filter((m) => m.type === 'audio' && (m.subType === 'music' || !m.subType));
  const podcastList = media.filter((m) => m.type === 'audio' && m.subType === 'podcast');

  const currentList = mediaTab === 'video' ? videoList : mediaTab === 'music' ? musicList : podcastList;

  // Extract all categories
  const categories = Array.from(
    new Set(
      currentList
        .flatMap((m) => (m.category ? m.category.split(',').map((s) => s.trim()) : []))
        .filter(Boolean)
    )
  );

  const effectiveSearch = (deferredSearch || searchQuery).trim().toLowerCase();

  // Filtered list by category and search
  const filteredList = currentList.filter((m) => {
    const matchesSearch =
      !effectiveSearch ||
      m.title.toLowerCase().includes(effectiveSearch) ||
      (m.category && m.category.toLowerCase().includes(effectiveSearch));

    const matchesCat =
      selectedCategory === 'all' ||
      (m.category && m.category.toLowerCase().includes(selectedCategory.toLowerCase()));

    return matchesSearch && matchesCat;
  });

  // Continue watching list (has lastPosition > 10 and not watched)
  const continueWatching = videoList.filter(
    (m) => m.lastPosition && m.lastPosition > 10 && !m.watched
  );

  // If currently watching in Mobile Theater
  if (activeMedia) {
    return (
      <MobileVideoTheaterView
        media={activeMedia}
        allVideos={videoList}
        playlists={playlists}
        isAdmin={isAdmin}
        onBack={() => handleSetActiveMedia(null)}
        onSelectVideo={(item) => handleSetActiveMedia(item)}
        onUpdateProgress={onUpdateMediaProgress}
        onDownloadMedia={onDownloadMedia}
        onDeleteDownloaded={onDeleteDownloaded}
      />
    );
  }

  return (
    <div className="flex-1 w-full h-full flex flex-col bg-[#07090E] select-none overflow-y-auto no-scrollbar p-3.5 space-y-4">
      {/* 1. TOP MOBILE SEARCH BAR & SUB-TABS */}
      <div className="space-y-2.5 shrink-0 pt-1">
        {/* Search Input Form */}
        <form
          action=""
          onSubmit={(e) => {
            e.preventDefault();
            (document.activeElement as HTMLElement)?.blur();
          }}
          className="flex items-center gap-2 w-full"
        >
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              enterKeyHint="search"
              inputMode="search"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder={`Tìm kiếm ${mediaTab === 'video' ? 'phim & video' : mediaTab === 'music' ? 'bài hát' : 'podcast'}...`}
              className="w-full h-10 pl-9.5 pr-8 rounded-2xl bg-[#141722] border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 shadow-inner"
            />
            {localSearch && (
              <button
                type="button"
                onClick={() => setLocalSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
                title="Xóa tìm kiếm"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <button
            type="submit"
            className="h-10 px-3.5 rounded-2xl bg-cyan-500/15 hover:bg-cyan-500/25 active:scale-95 text-cyan-400 font-bold text-xs border border-cyan-500/30 flex items-center gap-1.5 transition-all shrink-0"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Tìm</span>
          </button>
        </form>

        {/* Media Sub-Tabs (Phim, Nhạc, Audio) */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1 bg-[#12151F] p-1 rounded-2xl border border-white/5">
            <button
              type="button"
              onClick={() => {
                sfx.playClick();
                setMediaTab('video');
                setSelectedCategory('all');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                mediaTab === 'video'
                  ? 'bg-cyan-500 text-black shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Film className="w-3.5 h-3.5" />
              <span>Phim</span>
            </button>

            <button
              type="button"
              onClick={() => {
                sfx.playClick();
                setMediaTab('music');
                setSelectedCategory('all');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                mediaTab === 'music'
                  ? 'bg-cyan-500 text-black shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Music className="w-3.5 h-3.5" />
              <span>Nhạc</span>
            </button>

            <button
              type="button"
              onClick={() => {
                sfx.playClick();
                setMediaTab('podcast');
                setSelectedCategory('all');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                mediaTab === 'podcast'
                  ? 'bg-cyan-500 text-black shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              <span>Audio</span>
            </button>
          </div>

          <span className="text-[11px] text-slate-400 font-semibold px-2">
            {filteredList.length} mục
          </span>
        </div>
      </div>

      {/* 2. MOBILE HERO BANNER (Only when not searching) */}
      {!effectiveSearch && (
        <MobileHeroBanner
          items={currentList}
          type="media"
          bannerSettings={bannerSettings}
          onPlayMedia={(item) => {
            if (item.type === 'video') handleSetActiveMedia(item);
            else onPlayAudio?.(item);
          }}
        />
      )}

      {/* 3. CATEGORY FILTER CHIPS ROW */}
      {categories.length > 0 && (
        <HorizontalScroller className="gap-1.5 shrink-0" showButtons={false}>
          <button
            type="button"
            onClick={() => {
              sfx.playClick();
              setSelectedCategory('all');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all ${
              selectedCategory === 'all'
                ? 'bg-cyan-500 text-black shadow-sm'
                : 'bg-white/5 text-slate-400 hover:text-white border border-white/5'
            }`}
          >
            Tất cả
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => {
                sfx.playClick();
                setSelectedCategory(cat);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all ${
                selectedCategory === cat
                  ? 'bg-cyan-500 text-black shadow-sm'
                  : 'bg-white/5 text-slate-400 hover:text-white border border-white/5'
              }`}
            >
              {cat}
            </button>
          ))}
        </HorizontalScroller>
      )}

      {/* 4. CONTINUE WATCHING (IF APPLICABLE) */}
      {mediaTab === 'video' && !effectiveSearch && continueWatching.length > 0 && (
        <div className="space-y-2 shrink-0">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-white flex items-center gap-1.5 uppercase tracking-wide">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Tiếp Tục Xem</span>
            </span>
            <span className="text-[10px] text-slate-400 font-semibold">
              {continueWatching.length} video
            </span>
          </div>

          <HorizontalScroller className="gap-2.5" scrollStep={200}>
            {continueWatching.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  sfx.playClick();
                  handleSetActiveMedia(item);
                }}
                className="w-44 aspect-video rounded-2xl overflow-hidden bg-black border border-white/10 relative shrink-0 cursor-pointer group shadow-md active:scale-98 transition-all"
              >
                <SafeImage
                  src={item.coverPath || item.bannerPath}
                  alt={item.title}
                  title={item.title}
                  fallbackType="video"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent flex flex-col justify-end p-2.5">
                  <p className="text-xs font-bold text-white line-clamp-1">{item.title}</p>
                </div>
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                  <div className="w-9 h-9 rounded-full bg-cyan-500 text-black flex items-center justify-center shadow-lg">
                    <Play className="w-4 h-4 fill-black" />
                  </div>
                </div>
              </div>
            ))}
          </HorizontalScroller>
        </div>
      )}

      {/* 5. NETFLIX-STYLE GENRE ROWS (When tab is video & not searching & "all" category) */}
      {mediaTab === 'video' && !effectiveSearch && selectedCategory === 'all' && categories.length > 0 && (
        <div className="space-y-5">
          {categories.slice(0, 4).map((cat) => {
            const catVideos = videoList.filter(
              (m) => m.category && m.category.toLowerCase().includes(cat.toLowerCase())
            );
            if (catVideos.length === 0) return null;

            return (
              <div key={cat} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-white flex items-center gap-1.5 uppercase tracking-wide">
                    <Flame className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{cat}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      sfx.playClick();
                      setSelectedCategory(cat);
                    }}
                    className="text-[10px] text-cyan-400 font-bold flex items-center gap-0.5 hover:underline"
                  >
                    Xem tất cả ({catVideos.length}) <ChevronRight className="w-3 h-3" />
                  </button>
                </div>

                <HorizontalScroller className="gap-2.5" scrollStep={200}>
                  {catVideos.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => {
                        sfx.playClick();
                        handleSetActiveMedia(item);
                      }}
                      className="w-36 aspect-[2/3] rounded-2xl overflow-hidden bg-[#12151F] border border-white/10 relative shrink-0 cursor-pointer group shadow-md active:scale-98 transition-all flex flex-col"
                    >
                      <div className="relative w-full h-full bg-black">
                        <SafeImage
                          src={item.coverPath || item.bannerPath}
                          alt={item.title}
                          title={item.title}
                          fallbackType="video"
                          style={{
                            objectPosition: item.listCardPosition || item.coverPosition || '50% 50%',
                            transform: (item.listCardZoom || item.coverZoom) ? `scale(${item.listCardZoom || item.coverZoom})` : undefined,
                            transformOrigin: item.listCardPosition || item.coverPosition || '50% 50%',
                          }}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent flex flex-col justify-end p-2">
                          <p className="text-xs font-bold text-white line-clamp-1">{item.title}</p>
                          <span className="text-[9px] text-cyan-300/80">{cat}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </HorizontalScroller>
              </div>
            );
          })}
        </div>
      )}

      {/* 6. TOÀN BỘ KHO PHIM / NHẠC (LƯỚI 2 CỘT CHUẨN DI ĐỘNG) */}
      <div className="space-y-2 pb-6">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black text-white flex items-center gap-1.5 uppercase tracking-wide">
            <Film className="w-3.5 h-3.5 text-cyan-400" />
            <span>
              {effectiveSearch
                ? `Kết quả tìm kiếm (${filteredList.length})`
                : selectedCategory !== 'all'
                ? `Danh Mục: ${selectedCategory} (${filteredList.length})`
                : `Toàn Bộ Kho ${mediaTab === 'video' ? 'Phim' : mediaTab === 'music' ? 'Bài Hát' : 'Audio'}`}
            </span>
          </span>
          <span className="text-[10px] text-slate-400 font-semibold">Lưới 2 cột</span>
        </div>

        {filteredList.length > 0 ? (
          <>
            <div className="grid grid-cols-2 gap-2.5">
              {filteredList.slice(0, visibleCount).map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    sfx.playClick();
                    if (item.type === 'video') handleSetActiveMedia(item);
                    else onPlayAudio?.(item);
                  }}
                  className="rounded-2xl overflow-hidden bg-[#12151F] border border-white/10 cursor-pointer group hover:border-cyan-500/50 transition-all shadow-md flex flex-col active:scale-98"
                >
                  {/* 4:6 (2:3) List Card Poster */}
                  <div className="relative aspect-[2/3] w-full bg-black overflow-hidden">
                    <SafeImage
                      src={item.coverPath || item.bannerPath}
                      alt={item.title}
                      title={item.title}
                      fallbackType={item.type === 'audio' ? 'audio' : 'video'}
                      style={{
                        objectPosition: item.listCardPosition || item.coverPosition || '50% 50%',
                        transform: (item.listCardZoom || item.coverZoom) ? `scale(${item.listCardZoom || item.coverZoom})` : undefined,
                        transformOrigin: item.listCardPosition || item.coverPosition || '50% 50%',
                      }}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-1.5 right-1.5 flex items-center gap-1">
                      {item.tags && item.tags.length > 0 && (
                        <span className="px-1.5 py-0.2 rounded text-[8px] font-black bg-black/75 text-cyan-300 border border-cyan-400/30">
                          {item.tags[0]}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-2.5 flex-1 flex flex-col justify-between space-y-1">
                    <div>
                      <h4 className="text-xs font-bold text-white line-clamp-1 group-hover:text-cyan-400 transition-colors">
                        {item.title}
                      </h4>
                      <span className="text-[10px] text-slate-400 line-clamp-1">
                        {item.category || (item.type === 'video' ? 'Phim' : 'Nhạc')}
                      </span>
                    </div>
                    <div className="pt-1 flex items-center justify-between text-[10px] text-cyan-400 font-semibold">
                      <span>{item.type === 'video' ? 'Xem ngay' : 'Phát nhạc'}</span>
                      <Play className="w-3 h-3 fill-current" />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Load More Button for Mobile (10 items = 5 rows x 2 cols) */}
            {visibleCount < filteredList.length && (
              <div className="pt-2 pb-4 flex justify-center">
                <button
                  type="button"
                  onClick={() => setVisibleCount((prev) => prev + 10)}
                  className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white font-bold text-xs tracking-wide transition-all shadow-sm active:scale-98 flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-4 h-4 text-cyan-400" />
                  <span>Xem Thêm (+10 Mục • Còn lại {filteredList.length - visibleCount})</span>
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-2">
            <span className="text-sm font-bold text-white">Không tìm thấy nội dung phù hợp</span>
            <p className="text-xs text-slate-400 max-w-[240px]">
              Vui lòng thử từ khóa khác hoặc chọn &quot;Tất cả&quot; thể loại.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
