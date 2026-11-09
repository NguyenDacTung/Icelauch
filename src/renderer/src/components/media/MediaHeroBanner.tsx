import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Film, 
  Music, 
  ChevronLeft, 
  ChevronRight, 
  Sparkles, 
  Clock,
  Flame,
  Shuffle 
} from 'lucide-react';
import { parseMediaUrl } from '../../utils/mediaUrl';
import type { MediaItem, SectionBannerSettings } from '../../types';
import { resolveBannerItems } from '../../utils/bannerResolver';

interface MediaHeroBannerProps {
  mediaList: MediaItem[];
  type: 'video' | 'audio';
  bannerSettings?: SectionBannerSettings;
  onPlayMedia: (item: MediaItem) => void;
}

export const MediaHeroBanner: React.FC<MediaHeroBannerProps> = ({
  mediaList,
  type,
  bannerSettings,
  onPlayMedia,
}) => {
  const resolvedList = resolveBannerItems(bannerSettings, mediaList, 'media');
  const displayItems = resolvedList.map((r) => r.item);

  const [currentIndex, setCurrentIndex] = useState(0);

  const slideInterval = (bannerSettings?.autoSlideIntervalSeconds || 7) * 1000;

  useEffect(() => {
    setCurrentIndex(0);
  }, [type]);

  useEffect(() => {
    if (displayItems.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % displayItems.length);
    }, slideInterval);
    return () => clearInterval(interval);
  }, [displayItems.length, slideInterval]);

  if (displayItems.length === 0) return null;

  const currentResolved = resolvedList[currentIndex] || resolvedList[0];
  const currentItem = currentResolved?.item || displayItems[0];
  const parsed = parseMediaUrl(currentItem.link);

  const fallbackArtwork = type === 'video' 
    ? 'https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?auto=format&fit=crop&w=1600&q=80' 
    : 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1600&q=80';

  const bannerImg = currentItem.bannerPath || currentItem.coverPath || parsed.thumbnailUrl || fallbackArtwork;

  const tags = currentItem.tags && currentItem.tags.length > 0 
    ? currentItem.tags 
    : (currentItem.category ? currentItem.category.split(',').map((s) => s.trim()) : [type === 'video' ? 'Phim & Video' : 'Nhạc & Audio']);

  const objectPos = currentItem.bannerPosition || currentItem.coverPosition || '50% 50%';
  const sharpenVal = currentItem.bannerSharpen || currentItem.coverSharpen || 0;
  const edgeDarknessVal = (currentItem.bannerEdgeDarkness ?? 0) / 100;

  return (
    <div className="relative w-full max-w-[1360px] mx-auto rounded-2xl overflow-hidden border border-ice-border/80 shadow-2xl select-none group bg-ice-card flex flex-col md:flex-row items-stretch md:h-[440px]">
      {/* SVG Convolution Filter for true pixel unsharp masking */}
      <svg className="absolute w-0 h-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <defs>
          <filter id={`svg-sharpen-media-${type}`}>
            <feConvolveMatrix
              order="3"
              preserveAlpha="true"
              kernelMatrix={`0 -${((sharpenVal / 100) * 0.6).toFixed(2)} 0 -${((sharpenVal / 100) * 0.6).toFixed(2)} ${(1 + 4 * (sharpenVal / 100) * 0.6).toFixed(2)} -${((sharpenVal / 100) * 0.6).toFixed(2)} 0 -${((sharpenVal / 100) * 0.6).toFixed(2)} 0`}
            />
          </filter>
        </defs>
      </svg>

      {/* 1. LEFT COLUMN: Exact 16:9 Aspect Ratio (aspect-video) - NEVER stretched horizontally! */}
      <div
        onClick={() => onPlayMedia(currentItem)}
        className="relative aspect-video h-[260px] md:h-full overflow-hidden bg-black flex-shrink-0 cursor-pointer group/art"
      >
        <img
          key={currentItem.id}
          src={bannerImg}
          alt={currentItem.title}
          style={{ 
            objectPosition: objectPos,
            transform: currentItem.bannerZoom ? `scale(${currentItem.bannerZoom})` : undefined,
            transformOrigin: objectPos,
            filter: [
              currentItem.bannerBlur ? `blur(${currentItem.bannerBlur}px)` : '',
              sharpenVal > 10 ? `url(#svg-sharpen-media-${type})` : '',
              sharpenVal > 0 ? `contrast(${1 + (sharpenVal / 100) * 0.25}) brightness(${1 + (sharpenVal / 100) * 0.04}) saturate(${1 + (sharpenVal / 100) * 0.08})` : 'brightness(0.95)'
            ].filter(Boolean).join(' ') || undefined,
            imageRendering: sharpenVal > 0 ? '-webkit-optimize-contrast' : 'auto'
          }}
          className="w-full h-full object-cover transition-all duration-300 transform group-hover/art:scale-[1.02]"
        />

        {/* Optional custom banner darkness overlay */}
        {currentItem.bannerDarkness !== undefined && currentItem.bannerDarkness > 0 && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ backgroundColor: `rgba(15, 17, 21, ${currentItem.bannerDarkness / 100})` }}
          />
        )}

        {/* Optional Edge fade (defaults to 0% so anime/character art is crystal clear with zero side fog) */}
        {edgeDarknessVal > 0 && (
          <>
            <div 
              className="absolute inset-0 hidden md:block pointer-events-none" 
              style={{
                background: `linear-gradient(to right, rgba(0,0,0,${edgeDarknessVal * 0.4}) 0%, transparent 20%, transparent 80%, rgba(18,20,26,${edgeDarknessVal}) 100%)`
              }}
            />
            <div 
              className="absolute inset-0 md:hidden pointer-events-none" 
              style={{
                background: `linear-gradient(to top, rgba(18,20,26,${edgeDarknessVal}) 0%, transparent 40%)`
              }}
            />
          </>
        )}

        {/* Hover Center Play Button */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/art:opacity-100 transition-opacity">
          <div className="w-16 h-16 rounded-full bg-amber-400 text-black flex items-center justify-center shadow-2xl transform scale-90 group-hover/art:scale-100 transition-transform">
            <Play className="w-7 h-7 fill-black ml-1" />
          </div>
        </div>

        {/* Top-Left Badges */}
        <div className="absolute top-4 left-4 flex flex-wrap items-center gap-2 z-20">
          <span className={`px-3 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase shadow-md flex items-center gap-1.5 backdrop-blur-md border ${
            currentResolved?.badgeType === 'new'
              ? 'bg-amber-500/30 text-amber-300 border-amber-500/50'
              : currentResolved?.badgeType === 'popular'
              ? 'bg-rose-500/30 text-rose-300 border-rose-500/50'
              : currentResolved?.badgeType === 'random'
              ? 'bg-purple-500/30 text-purple-300 border-purple-500/50'
              : 'bg-amber-500/25 text-amber-300 border-amber-500/40'
          }`}>
            {currentResolved?.badgeType === 'new' && <Clock className="w-3.5 h-3.5 text-amber-400" />}
            {currentResolved?.badgeType === 'popular' && <Flame className="w-3.5 h-3.5 text-rose-400" />}
            {currentResolved?.badgeType === 'random' && <Shuffle className="w-3.5 h-3.5 text-purple-400" />}
            {currentResolved?.badgeType === 'pinned' && <Sparkles className="w-3.5 h-3.5 text-amber-400" />}
            <span>{currentResolved?.badgeText || (type === 'video' ? 'PHIM NỔI BẬT' : 'ALBUM HOT')}</span>
          </span>

          {parsed.kind === 'youtube' && (
            <span className="px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-red-600 text-white shadow">
              YouTube 4K
            </span>
          )}
          {parsed.kind === 'gdrive' && (
            <span className="px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-ice-accent/30 text-ice-accent border border-ice-accent/50 shadow">
              Drive 1080p
            </span>
          )}
        </div>
      </div>

      {/* 2. RIGHT COLUMN: Flexible Space (flex-1) - Information & Action Sidebar */}
      <div className="relative flex-1 min-w-[320px] p-5 lg:p-6 flex flex-col justify-between bg-gradient-to-b from-[#171A21] via-[#12141A] to-[#0F1115] border-t md:border-t-0 md:border-l border-ice-border/70 z-20">
        {/* Top Header & Title */}
        <div className="space-y-2">
          {/* Tags */}
          <div className="flex flex-wrap items-center gap-1.5">
            {tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-white/10 text-white/90 border border-white/10"
              >
                {tag}
              </span>
            ))}
          </div>

          {/* Title */}
          <h2
            onClick={() => onPlayMedia(currentItem)}
            className="text-xl lg:text-2xl font-black text-white tracking-tight leading-snug line-clamp-2 cursor-pointer hover:text-amber-400 transition-colors"
          >
            {currentItem.title}
          </h2>

          {/* Artist if Audio */}
          {currentItem.artist && (
            <p className="text-xs font-semibold text-amber-300">
              Nghệ sĩ: {currentItem.artist}
            </p>
          )}

          {/* Description */}
          {currentItem.description && (
            <p className="text-xs text-ice-subtext line-clamp-3 leading-relaxed">
              {currentItem.description}
            </p>
          )}
        </div>

        {/* Bottom Action Bar (shrink-0 guarantees buttons and pagination are never clipped) */}
        <div className="space-y-3 pt-3 border-t border-ice-border/50 shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => onPlayMedia(currentItem)}
              className="flex-1 h-11 min-h-[44px] rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black text-xs font-black tracking-wider uppercase flex items-center justify-center gap-2 shadow-lg shadow-amber-950/40 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <Play className="w-4 h-4 fill-black" />
              <span>{type === 'video' ? 'XEM PHIM NGAY' : 'NGHE NHẠC NGAY'}</span>
            </button>
          </div>

          {/* Carousel Pagination */}
          {displayItems.length > 1 && (
            <div className="flex items-center justify-between text-xs text-ice-subtext pt-1">
              <span className="text-[11px] font-mono">
                Mục <strong className="text-white">{currentIndex + 1}</strong> / {displayItems.length}
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setCurrentIndex((prev) => (prev - 1 + displayItems.length) % displayItems.length)}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-amber-400 hover:text-black text-white/80 transition-colors"
                  title="Mục trước"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentIndex((prev) => (prev + 1) % displayItems.length)}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-amber-400 hover:text-black text-white/80 transition-colors"
                  title="Mục tiếp theo"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
