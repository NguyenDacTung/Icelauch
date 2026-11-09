import React, { useState } from 'react';
import {
  Play,
  Film,
  Music,
  Clock,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Bookmark,
  BookmarkCheck,
  CheckCircle2,
  Tv
} from 'lucide-react';
import type { MediaItem, SectionBannerSettings } from '../../types';
import { resolveBannerItems } from '../../utils/bannerResolver';
import { parseMediaUrl } from '../../utils/mediaUrl';
import { sfx } from '../../utils/sfx';

interface TVHomeMediaViewProps {
  media: MediaItem[];
  bannerSettings?: SectionBannerSettings;
  onPlayMedia: (item: MediaItem) => void;
  onToggleLibrary?: (id: string) => void;
}

export const TVHomeMediaView: React.FC<TVHomeMediaViewProps> = ({
  media,
  bannerSettings,
  onPlayMedia,
  onToggleLibrary,
}) => {
  const [heroIndex, setHeroIndex] = useState(0);

  const videoItems = media.filter((m) => m.type === 'video');
  const audioItems = media.filter((m) => m.type === 'audio');
  const continueItems = media.filter((m) => (m.lastPosition || 0) > 10 && !m.watched);

  // Resolved Banner Items
  const bannerList = resolveBannerItems(bannerSettings, media, 'media');
  const activeHero = bannerList[heroIndex]?.item || videoItems[0] || media[0];

  const handleHeroPrev = () => {
    if (bannerList.length <= 1) return;
    sfx.playClick();
    setHeroIndex((prev) => (prev - 1 + bannerList.length) % bannerList.length);
  };

  const handleHeroNext = () => {
    if (bannerList.length <= 1) return;
    sfx.playClick();
    setHeroIndex((prev) => (prev + 1) % bannerList.length);
  };

  if (media.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-ice-subtext">
        <Tv className="w-16 h-16 text-amber-400/40 mb-3" />
        <h2 className="text-xl font-bold text-white">Chưa có nội dung giải trí</h2>
        <p className="text-sm text-ice-muted mt-1">Vui lòng thêm phim hoặc nhạc từ ứng dụng máy tính.</p>
      </div>
    );
  }

  const parsedHero = activeHero ? parseMediaUrl(activeHero.link) : null;
  const heroImage = activeHero?.bannerPath || activeHero?.coverPath || parsedHero?.thumbnailUrl || 'https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?auto=format&fit=crop&w=1600&q=80';

  return (
    <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-8 select-none">
      {/* 1. GRAND 16:9 CINEMATIC TV HERO BANNER */}
      {activeHero && (
        <div className="relative w-full aspect-[21/9] min-h-[340px] max-h-[440px] rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-[#11141D] group/banner flex items-end p-8">
          {/* Background Artwork */}
          <img
            key={activeHero.id}
            src={heroImage}
            alt={activeHero.title}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover/banner:scale-105"
          />
          {/* Gradients */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A0D14] via-[#0A0D14]/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0A0D14]/90 via-[#0A0D14]/40 to-transparent w-2/3" />

          {/* Banner Meta & Action Buttons */}
          <div className="relative z-10 max-w-2xl space-y-3">
            {/* Top Badges */}
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-amber-500 text-black shadow-md flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>NỔI BẬT TRÊN TV</span>
              </span>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-white/15 text-white backdrop-blur-md border border-white/15">
                {activeHero.category || (activeHero.type === 'video' ? 'Phim & Video' : 'Nhạc')}
              </span>
            </div>

            {/* Title */}
            <h1 className="text-2xl lg:text-3xl font-black text-white leading-tight drop-shadow-md line-clamp-2">
              {activeHero.title}
            </h1>

            {/* Description */}
            {activeHero.description && (
              <p className="text-xs text-white/80 line-clamp-2 leading-relaxed drop-shadow">
                {activeHero.description}
              </p>
            )}

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                data-tv-focus="hero-play"
                type="button"
                onClick={() => {
                  sfx.playClick();
                  onPlayMedia(activeHero);
                }}
                className="h-12 px-6 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-black font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-xl shadow-amber-500/30 outline-none focus:ring-4 focus:ring-amber-400 focus:scale-105 transition-all"
              >
                <Play className="w-4 h-4 fill-black" />
                <span>{activeHero.type === 'video' ? 'XEM PHIM NGAY' : 'PHÁT NHẠC NGAY'}</span>
              </button>

              {onToggleLibrary && (
                <button
                  data-tv-focus="hero-bookmark"
                  type="button"
                  onClick={() => {
                    sfx.playClick();
                    onToggleLibrary(activeHero.id);
                  }}
                  className="h-12 px-4 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold backdrop-blur-md border border-white/15 flex items-center gap-2 outline-none focus:ring-4 focus:ring-amber-400 focus:scale-105 transition-all"
                >
                  <Bookmark className="w-4 h-4 text-amber-400" />
                  <span>Lưu Danh Sách</span>
                </button>
              )}
            </div>
          </div>

          {/* Banner Navigation Chevrons */}
          {bannerList.length > 1 && (
            <div className="absolute bottom-6 right-6 z-20 flex items-center gap-2">
              <button
                data-tv-focus="hero-prev"
                type="button"
                onClick={handleHeroPrev}
                className="w-10 h-10 rounded-xl bg-black/60 hover:bg-amber-400 hover:text-black text-white flex items-center justify-center backdrop-blur-md border border-white/20 outline-none focus:ring-4 focus:ring-amber-400 focus:scale-110 transition-all"
                title="Mục trước"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-xs font-mono font-bold text-white px-2">
                {heroIndex + 1} / {bannerList.length}
              </span>
              <button
                data-tv-focus="hero-next"
                type="button"
                onClick={handleHeroNext}
                className="w-10 h-10 rounded-xl bg-black/60 hover:bg-amber-400 hover:text-black text-white flex items-center justify-center backdrop-blur-md border border-white/20 outline-none focus:ring-4 focus:ring-amber-400 focus:scale-110 transition-all"
                title="Mục tiếp theo"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* 2. ROW: PHIM & VIDEO ĐỀ XUẤT */}
      {videoItems.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
              <Film className="w-4 h-4 text-amber-400" />
              <span>Phim & Video Đề Xuất ({videoItems.length})</span>
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {videoItems.map((item, idx) => {
              const p = parseMediaUrl(item.link);
              const thumb = item.coverPath || item.bannerPath || p.thumbnailUrl || '';
              return (
                <div
                  key={item.id}
                  data-tv-focus={`video-card-${idx}`}
                  tabIndex={0}
                  onClick={() => {
                    sfx.playClick();
                    onPlayMedia(item);
                  }}
                  className="group/card relative aspect-video rounded-2xl overflow-hidden bg-[#151924] border border-white/10 cursor-pointer shadow-lg outline-none focus:ring-4 focus:ring-amber-400 focus:scale-105 focus:z-20 transition-all hover:scale-102 hover:border-amber-400/80"
                >
                  <img
                    src={thumb}
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover/card:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent opacity-80 group-hover/card:opacity-90 transition-opacity" />

                  {/* Play Icon on hover/focus */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/card:opacity-100 group-focus/card:opacity-100 transition-opacity">
                    <div className="w-12 h-12 rounded-full bg-amber-400 text-black flex items-center justify-center shadow-xl">
                      <Play className="w-5 h-5 fill-black ml-0.5" />
                    </div>
                  </div>

                  {/* Title & Category Badge */}
                  <div className="absolute bottom-2.5 left-2.5 right-2.5 z-10 space-y-1">
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/30 text-amber-300 font-bold uppercase">
                      {item.category || 'Phim'}
                    </span>
                    <h3 className="text-xs font-black text-white leading-tight line-clamp-1">
                      {item.title}
                    </h3>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 3. ROW: NHẠC & PODCAST THƯ GIÃN */}
      {audioItems.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
              <Music className="w-4 h-4 text-emerald-400" />
              <span>Nhạc & Podcast Thư Giãn ({audioItems.length})</span>
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {audioItems.map((item, idx) => {
              const thumb = item.coverPath || item.bannerPath || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80';
              return (
                <div
                  key={item.id}
                  data-tv-focus={`audio-card-${idx}`}
                  tabIndex={0}
                  onClick={() => {
                    sfx.playClick();
                    onPlayMedia(item);
                  }}
                  className="group/card relative aspect-square rounded-2xl overflow-hidden bg-[#151924] border border-white/10 cursor-pointer shadow-lg outline-none focus:ring-4 focus:ring-amber-400 focus:scale-105 focus:z-20 transition-all hover:scale-102"
                >
                  <img
                    src={thumb}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover/card:scale-105 transition-transform"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

                  <div className="absolute bottom-2.5 left-2.5 right-2.5 z-10">
                    <h3 className="text-xs font-bold text-white line-clamp-1">
                      {item.title}
                    </h3>
                    {item.artist && (
                      <p className="text-[10px] text-amber-300 line-clamp-1 mt-0.5">
                        {item.artist}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
};

