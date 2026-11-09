import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Play, Info, Monitor, Sparkles, Bookmark, BookmarkCheck } from 'lucide-react';
import type { Game, MediaItem, SectionBannerSettings } from '../../types';
import { resolveBannerItems } from '../../utils/bannerResolver';

interface MobileHeroBannerProps {
  items: (Game | MediaItem)[];
  type: 'game' | 'media';
  bannerSettings?: SectionBannerSettings;
  onSelectGame?: (game: Game) => void;
  onIncompatibleClick?: (game: Game) => void;
  onPlayMedia?: (media: MediaItem) => void;
  onToggleLibrary?: (gameId: string) => void;
}

export const MobileHeroBanner: React.FC<MobileHeroBannerProps> = ({
  items,
  type,
  bannerSettings,
  onSelectGame,
  onIncompatibleClick,
  onPlayMedia,
  onToggleLibrary,
}) => {
  const resolvedList = resolveBannerItems(bannerSettings, items as any[], type);
  const displayItems = resolvedList.map((r) => r.item);

  const [currentIndex, setCurrentIndex] = useState(0);

  const slideInterval = (bannerSettings?.autoSlideIntervalSeconds || 7) * 1000;

  useEffect(() => {
    if (displayItems.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % displayItems.length);
    }, slideInterval);
    return () => clearInterval(interval);
  }, [displayItems.length, slideInterval]);

  if (displayItems.length === 0) return null;

  const currentResolved = resolvedList[currentIndex] || resolvedList[0];
  const currentItem = (currentResolved?.item || displayItems[0]) as any;

  const title = currentItem.name || currentItem.title || '';
  const image = currentItem.bannerPath || currentItem.coverPath || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80';
  const tags: string[] = currentItem.tags && currentItem.tags.length > 0
    ? currentItem.tags
    : (currentItem.genre || currentItem.category ? (currentItem.genre || currentItem.category).split(',').map((s: string) => s.trim()) : []);

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + displayItems.length) % displayItems.length);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % displayItems.length);
  };

  return (
    <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-ice-border shadow-xl select-none group bg-black shrink-0 my-2">
      {/* Background Image - Strict 16:9 Aspect Ratio */}
      <img
        key={image}
        src={image}
        alt={title}
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-102"
        style={{
          objectPosition: currentItem.bannerPosition || currentItem.coverPosition || '50% 50%',
        }}
      />

      {/* Cinematic Dark Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0A0C10] via-black/45 to-transparent pointer-events-none" />

      {/* Top Bar inside Banner: Badge + Bookmark button (for game) */}
      <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between z-20 pointer-events-auto">
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-ice-accent/30 text-ice-accent border border-ice-accent/40 backdrop-blur-md flex items-center gap-1 shadow-sm">
          <Sparkles className="w-3 h-3 text-ice-accent" />
          <span>{currentResolved?.badgeText || 'NỔI BẬT'}</span>
        </span>

        {type === 'game' && onToggleLibrary && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleLibrary(currentItem.id);
            }}
            className="w-7 h-7 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-md border border-white/20 flex items-center justify-center transition-all shadow-md active:scale-95"
            title="Lưu vào thư viện"
          >
            {currentItem.inLibrary ? (
              <BookmarkCheck className="w-3.5 h-3.5 text-ice-accent" />
            ) : (
              <Bookmark className="w-3.5 h-3.5 text-white/80" />
            )}
          </button>
        )}
      </div>

      {/* Left / Right Chevron Slide Switch Buttons */}
      {displayItems.length > 1 && (
        <>
          <button
            type="button"
            onClick={handlePrev}
            className="absolute left-1.5 top-1/2 -translate-y-1/2 z-20 w-7 h-7 rounded-full bg-black/55 hover:bg-black/90 text-white backdrop-blur-md border border-white/25 flex items-center justify-center transition-all active:scale-90"
            title="Slide trước"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 z-20 w-7 h-7 rounded-full bg-black/55 hover:bg-black/90 text-white backdrop-blur-md border border-white/25 flex items-center justify-center transition-all active:scale-90"
            title="Slide kế tiếp"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </>
      )}

      {/* Bottom Content Area: Title, Tags, Action Buttons */}
      <div className="absolute bottom-2.5 left-3 right-3 z-20 flex flex-col gap-1.5 pointer-events-auto">
        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {tags.slice(0, 2).map((t) => (
              <span
                key={t}
                className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-white/20 text-white/95 backdrop-blur-xs border border-white/10"
              >
                {t}
              </span>
            ))}
          </div>
        )}

        {/* Title */}
        <h3
          onClick={() => {
            if (type === 'game') onSelectGame?.(currentItem);
            else onPlayMedia?.(currentItem);
          }}
          className="text-sm font-black text-white leading-tight line-clamp-1 cursor-pointer hover:text-ice-accent transition-colors"
        >
          {title}
        </h3>

        {/* Action Buttons Row */}
        <div className="flex items-center gap-1.5 pt-0.5">
          {type === 'game' ? (
            <>
              <button
                type="button"
                onClick={() => onIncompatibleClick?.(currentItem)}
                className="flex-1 h-8 rounded-lg bg-amber-500/25 hover:bg-amber-500/35 border border-amber-500/40 text-amber-300 text-[11px] font-bold flex items-center justify-center gap-1.5 shadow-md active:scale-98 transition-all"
              >
                <Monitor className="w-3 h-3 text-amber-400" />
                <span>🚫 Chỉ hỗ trợ PC</span>
              </button>
              <button
                type="button"
                onClick={() => onSelectGame?.(currentItem)}
                className="h-8 px-3 rounded-lg bg-white/15 hover:bg-white/25 text-white text-[11px] font-bold backdrop-blur-md border border-white/15 transition-all"
              >
                Chi tiết
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => onPlayMedia?.(currentItem)}
                className="flex-1 h-8 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black text-[11px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md active:scale-98 transition-all"
              >
                <Play className="w-3.5 h-3.5 fill-black" />
                <span>Xem Ngay</span>
              </button>
              <button
                type="button"
                onClick={() => onPlayMedia?.(currentItem)}
                className="h-8 px-3 rounded-lg bg-white/15 hover:bg-white/25 text-white text-[11px] font-bold backdrop-blur-md border border-white/15 transition-all"
              >
                Chi tiết
              </button>
            </>
          )}
        </div>
      </div>

      {/* Slide Dot Indicators at bottom-right */}
      {displayItems.length > 1 && (
        <div className="absolute bottom-1 right-3 z-30 flex items-center gap-1">
          {displayItems.slice(0, 5).map((_, idx) => (
            <div
              key={idx}
              className={`h-1 rounded-full transition-all duration-300 ${
                idx === currentIndex % 5 ? 'w-3 bg-ice-accent' : 'w-1 bg-white/40'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};
