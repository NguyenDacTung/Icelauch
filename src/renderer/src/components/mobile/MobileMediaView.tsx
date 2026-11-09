import React, { useState } from 'react';
import {
  Film,
  Music,
  Radio,
  Search,
  X,
  Play,
  Clock,
  Sparkles,
  Plus,
  Filter,
} from 'lucide-react';
import type { MediaItem, MediaPlaylist, SectionBannerSettings } from '../../types';
import { MobileHeroBanner } from './MobileHeroBanner';
import { HorizontalScroller } from '../common/HorizontalScroller';
import { MobileVideoTheaterView } from './MobileVideoTheaterView';

interface MobileMediaViewProps {
  media: MediaItem[];
  playlists: MediaPlaylist[];
  bannerSettings?: SectionBannerSettings;
  isAdmin: boolean;
  searchQuery: string;
  onPlayAudio?: (item: MediaItem) => void;
  onSaveMedia?: (item: Partial<MediaItem>) => void;
  onDeleteMedia?: (id: string) => void;
  onUpdateMediaProgress?: (id: string, position: number, watched: boolean) => void;
  onDownloadMedia?: (id: string) => void;
  onDeleteDownloaded?: (id: string) => void;
}

export const MobileMediaView: React.FC<MobileMediaViewProps> = ({
  media,
  playlists = [],
  bannerSettings,
  isAdmin,
  searchQuery,
  onPlayAudio,
  onSaveMedia,
  onDeleteMedia,
  onUpdateMediaProgress,
  onDownloadMedia,
  onDeleteDownloaded,
}) => {
  const [mediaType, setMediaType] = useState<'video' | 'audio'>('video');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeTheaterMedia, setActiveTheaterMedia] = useState<MediaItem | null>(null);

  const videoList = media.filter((m) => m.type === 'video');
  const audioList = media.filter((m) => m.type === 'audio');
  const currentList = mediaType === 'video' ? videoList : audioList;

  // Extract categories
  const categories = Array.from(
    new Set(
      currentList
        .flatMap((m) => (m.category ? m.category.split(',').map((s) => s.trim()) : []))
        .filter(Boolean)
    )
  );

  // Filtered by category and search
  const filteredList = currentList.filter((m) => {
    const matchesSearch =
      !searchQuery ||
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.category && m.category.toLowerCase().includes(searchQuery.toLowerCase()));

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
  if (activeTheaterMedia) {
    return (
      <MobileVideoTheaterView
        media={activeTheaterMedia}
        allVideos={videoList}
        playlists={playlists}
        isAdmin={isAdmin}
        onBack={() => setActiveTheaterMedia(null)}
        onSelectVideo={(item) => setActiveTheaterMedia(item)}
        onUpdateProgress={onUpdateMediaProgress}
        onDownloadMedia={onDownloadMedia}
        onDeleteDownloaded={onDeleteDownloaded}
      />
    );
  }

  return (
    <div className="flex-1 w-full h-full flex flex-col bg-[#0A0C10] select-none overflow-y-auto no-scrollbar p-3 space-y-3.5">
      {/* 1. TOP SUB-NAV BAR (Active page shows icon + text, others icon only) */}
      <div className="flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-1.5 bg-[#14171F] p-1 rounded-xl border border-ice-border/70">
          <button
            type="button"
            onClick={() => setMediaType('video')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              mediaType === 'video'
                ? 'bg-amber-500 text-black shadow-md'
                : 'text-ice-subtext hover:text-white'
            }`}
            title="Phim & Video"
          >
            <Film className="w-4 h-4" />
            {mediaType === 'video' && <span>Phim & Video</span>}
          </button>

          <button
            type="button"
            onClick={() => setMediaType('audio')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              mediaType === 'audio'
                ? 'bg-amber-500 text-black shadow-md'
                : 'text-ice-subtext hover:text-white'
            }`}
            title="Nhạc & Audio"
          >
            <Music className="w-4 h-4" />
            {mediaType === 'audio' && <span>Nhạc & Audio</span>}
          </button>
        </div>

        <span className="text-[11px] text-ice-subtext font-semibold">
          {filteredList.length} mục
        </span>
      </div>

      {/* 2. MOBILE HERO BANNER (EXACT 16:9 CINEMATIC) */}
      <MobileHeroBanner
        items={currentList}
        type="media"
        bannerSettings={bannerSettings}
        onPlayMedia={(item) => {
          if (item.type === 'video') setActiveTheaterMedia(item);
          else onPlayAudio?.(item);
        }}
      />

      {/* 3. CATEGORY FILTER CHIPS ROW */}
      {categories.length > 0 && (
        <HorizontalScroller className="gap-1.5 shrink-0" showButtons={false}>
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1 rounded-full text-xs font-bold shrink-0 transition-all ${
              selectedCategory === 'all'
                ? 'bg-white text-black shadow-sm'
                : 'bg-white/5 text-ice-subtext hover:text-white border border-white/10'
            }`}
          >
            Tất cả
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-full text-xs font-semibold shrink-0 transition-all ${
                selectedCategory === cat
                  ? 'bg-white text-black shadow-sm'
                  : 'bg-white/5 text-ice-subtext hover:text-white border border-white/10'
              }`}
            >
              {cat}
            </button>
          ))}
        </HorizontalScroller>
      )}

      {/* 4. CONTINUE WATCHING (CAROUSEL WITH CHEVRONS, NO SCROLLBAR) */}
      {mediaType === 'video' && continueWatching.length > 0 && (
        <div className="space-y-2 shrink-0">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-white flex items-center gap-1.5 uppercase tracking-wide">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Tiếp tục xem dở</span>
            </span>
          </div>

          <HorizontalScroller className="gap-2.5" scrollStep={200}>
            {continueWatching.map((item) => (
              <div
                key={item.id}
                onClick={() => setActiveTheaterMedia(item)}
                className="w-44 aspect-video rounded-xl overflow-hidden bg-black border border-ice-border/70 relative shrink-0 cursor-pointer group shadow-md"
              >
                <img
                  src={item.coverPath || item.bannerPath || ''}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent flex flex-col justify-end p-2">
                  <p className="text-[11px] font-bold text-white line-clamp-1">{item.title}</p>
                </div>
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                  <div className="w-8 h-8 rounded-full bg-amber-500 text-black flex items-center justify-center shadow-lg">
                    <Play className="w-4 h-4 fill-black" />
                  </div>
                </div>
              </div>
            ))}
          </HorizontalScroller>
        </div>
      )}

      {/* 5. KHO PHIM / NHẠC TỔNG HỢP (LƯỚI 2 CỘT CHUẨN DI ĐỘNG) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black text-white flex items-center gap-1.5 uppercase tracking-wide">
            <Film className="w-3.5 h-3.5 text-ice-accent" />
            <span>Kho {mediaType === 'video' ? 'Phim' : 'Nhạc'} Tổng Hợp</span>
          </span>
          <span className="text-[10px] text-ice-subtext font-semibold">Lưới 2 cột</span>
        </div>

        {filteredList.length > 0 ? (
          <div className="grid grid-cols-2 gap-2.5">
            {filteredList.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  if (item.type === 'video') setActiveTheaterMedia(item);
                  else onPlayAudio?.(item);
                }}
                className="rounded-xl overflow-hidden bg-[#14171F] border border-ice-border/70 cursor-pointer group hover:border-amber-400/50 transition-all shadow-md flex flex-col"
              >
                {/* 16:9 Thumbnail Poster */}
                <div className="relative aspect-video w-full bg-black overflow-hidden">
                  <img
                    src={item.coverPath || item.bannerPath || ''}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-1.5 right-1.5 flex items-center gap-1">
                    {item.tags && item.tags.length > 0 && (
                      <span className="px-1.5 py-0.2 rounded text-[8px] font-black bg-black/75 text-amber-300 border border-amber-400/30">
                        {item.tags[0]}
                      </span>
                    )}
                  </div>
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-7 h-7 rounded-full bg-amber-500 text-black flex items-center justify-center shadow-lg">
                      <Play className="w-3.5 h-3.5 fill-black" />
                    </div>
                  </div>
                </div>

                {/* Card Info */}
                <div className="p-2 space-y-0.5 flex-1 flex flex-col justify-between">
                  <h4 className="text-xs font-bold text-white line-clamp-1 group-hover:text-amber-400 transition-colors">
                    {item.title}
                  </h4>
                  <div className="flex items-center justify-between text-[10px] text-ice-subtext">
                    <span className="line-clamp-1">{item.category || 'Giải trí'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-ice-subtext">
            Không tìm thấy phim hoặc bài hát phù hợp
          </div>
        )}
      </div>
    </div>
  );
};
