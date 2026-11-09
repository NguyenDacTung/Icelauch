import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Download, 
  Bookmark, 
  BookmarkCheck, 
  ChevronLeft, 
  ChevronRight, 
  Info, 
  Sparkles, 
  CheckCircle2,
  Clock,
  Flame,
  Shuffle,
  Monitor
} from 'lucide-react';
import type { Game, SectionBannerSettings } from '../../types';
import { resolveBannerItems } from '../../utils/bannerResolver';
import { DeviceType, isMobileOrTV, isAndroidMobile } from '../../utils/deviceDetector';

interface HeroBannerProps {
  games: Game[];
  bannerSettings?: SectionBannerSettings;
  deviceType?: DeviceType;
  onSelectGame: (game: Game) => void;
  onLaunch: (id: string) => void;
  onDownload: (id: string) => void;
  onToggleLibrary: (id: string) => void;
  onIncompatibleClick?: (game: Game) => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  games,
  bannerSettings,
  deviceType = 'windows_pc',
  onSelectGame,
  onLaunch,
  onDownload,
  onToggleLibrary,
  onIncompatibleClick,
}) => {
  const resolvedList = resolveBannerItems(bannerSettings, games, 'game');
  const displayGames = resolvedList.map((r) => r.item);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [hoveredScreenshot, setHoveredScreenshot] = useState<string | null>(null);

  const slideInterval = (bannerSettings?.autoSlideIntervalSeconds || 7) * 1000;

  useEffect(() => {
    if (displayGames.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % displayGames.length);
      setHoveredScreenshot(null);
    }, slideInterval);
    return () => clearInterval(interval);
  }, [displayGames.length, slideInterval]);

  if (displayGames.length === 0) return null;

  const currentResolved = resolvedList[currentIndex] || resolvedList[0];
  const currentGame = currentResolved?.item || displayGames[0];
  const isReady = currentGame.status === 'ready';

  // Get primary tags / genres
  const tagsList = currentGame.tags && currentGame.tags.length > 0 
    ? currentGame.tags 
    : (currentGame.genre ? currentGame.genre.split(',').map(s => s.trim()) : ['Game']);

  // Screenshots filmstrip for right column (up to 4)
  const screenshots = currentGame.screenshots && currentGame.screenshots.length > 0
    ? currentGame.screenshots.slice(0, 4)
    : [currentGame.coverPath || '', currentGame.bannerPath || ''].filter(Boolean);

  const mainImage = hoveredScreenshot || currentGame.bannerPath || currentGame.coverPath || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1600&q=80';
  const sharpenVal = !hoveredScreenshot ? (currentGame.bannerSharpen || currentGame.coverSharpen || 0) : 0;
  const edgeDarknessVal = !hoveredScreenshot ? (currentGame.bannerEdgeDarkness ?? 0) : 0;

  // Mobile Android Layout: Full-Art Visual Banner (no side text column to maximize vertical screen fit)
  if (isAndroidMobile(deviceType)) {
    return (
      <div className="relative w-full rounded-2xl overflow-hidden border border-ice-border shadow-xl select-none group bg-ice-card aspect-[16/10] flex flex-col justify-between p-4 my-2">
        <img
          key={mainImage}
          src={mainImage}
          alt={currentGame.name}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0C10] via-black/40 to-transparent" />

        <div className="relative z-10 flex items-center justify-between">
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-ice-accent/30 text-ice-accent border border-ice-accent/40 backdrop-blur-md">
            {currentResolved?.badgeText || 'NỔI BẬT'}
          </span>
          <button
            onClick={() => onToggleLibrary(currentGame.id)}
            className="p-1.5 rounded-lg bg-black/60 text-white backdrop-blur-md border border-white/20"
          >
            {currentGame.inLibrary ? <BookmarkCheck className="w-3.5 h-3.5 text-ice-accent" /> : <Bookmark className="w-3.5 h-3.5" />}
          </button>
        </div>

        <div className="relative z-10 space-y-2">
          <div className="flex flex-wrap gap-1">
            {tagsList.slice(0, 2).map((t) => (
              <span key={t} className="px-2 py-0.5 rounded text-[9px] font-semibold bg-white/20 text-white backdrop-blur-xs">
                {t}
              </span>
            ))}
          </div>

          <h3 
            onClick={() => onSelectGame(currentGame)}
            className="text-lg font-black text-white leading-tight line-clamp-1 cursor-pointer"
          >
            {currentGame.name}
          </h3>

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={() => onIncompatibleClick ? onIncompatibleClick(currentGame) : onSelectGame(currentGame)}
              className="flex-1 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[11px] font-bold flex items-center justify-center gap-1.5 shadow-md"
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>🚫 Chỉ hỗ trợ PC</span>
            </button>
            <button
              onClick={() => onSelectGame(currentGame)}
              className="h-9 px-3.5 rounded-xl bg-white/15 text-white text-[11px] font-bold backdrop-blur-md"
            >
              Chi tiết
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full max-w-[1240px] mx-auto rounded-2xl overflow-hidden border border-ice-border/80 shadow-2xl select-none group bg-[#111318] flex flex-col md:flex-row items-stretch md:h-[460px] lg:h-[480px]">
      {/* SVG Convolution Filter for true pixel unsharp masking */}
      <svg className="absolute w-0 h-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <defs>
          <filter id="svg-sharpen-game-banner">
            <feConvolveMatrix
              order="3"
              preserveAlpha="true"
              kernelMatrix={`0 -${((sharpenVal / 100) * 0.6).toFixed(2)} 0 -${((sharpenVal / 100) * 0.6).toFixed(2)} ${(1 + 4 * (sharpenVal / 100) * 0.6).toFixed(2)} -${((sharpenVal / 100) * 0.6).toFixed(2)} 0 -${((sharpenVal / 100) * 0.6).toFixed(2)} 0`}
            />
          </filter>
        </defs>
      </svg>

      {/* 1. LEFT COLUMN: Fixed Exact 16:9 Aspect Ratio - Large, Cinematic & Crystal Clear */}
      <div 
        onClick={() => onSelectGame(currentGame)}
        className="relative aspect-video h-[260px] md:h-full overflow-hidden bg-black flex-shrink-0 cursor-pointer"
      >
        <img
          key={mainImage}
          src={mainImage}
          alt={currentGame.name}
          style={{ 
            objectPosition: hoveredScreenshot ? '50% 50%' : (currentGame.bannerPosition || currentGame.coverPosition || '50% 50%'),
            transform: !hoveredScreenshot && currentGame.bannerZoom ? `scale(${currentGame.bannerZoom})` : undefined,
            transformOrigin: currentGame.bannerPosition || currentGame.coverPosition || '50% 50%',
            filter: [
              !hoveredScreenshot && currentGame.bannerBlur ? `blur(${currentGame.bannerBlur}px)` : '',
              !hoveredScreenshot && sharpenVal > 10 ? 'url(#svg-sharpen-game-banner)' : '',
              !hoveredScreenshot && sharpenVal > 0 ? `contrast(${1 + (sharpenVal / 100) * 0.25}) brightness(${1 + (sharpenVal / 100) * 0.04}) saturate(${1 + (sharpenVal / 100) * 0.08})` : undefined
            ].filter(Boolean).join(' ') || undefined,
            imageRendering: sharpenVal > 0 ? '-webkit-optimize-contrast' : 'auto'
          }}
          className="w-full h-full object-cover transition-all duration-300 transform group-hover:scale-[1.02]"
        />

        {/* Optional custom banner darkness overlay */}
        {!hoveredScreenshot && currentGame.bannerDarkness !== undefined && currentGame.bannerDarkness > 0 && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ backgroundColor: `rgba(15, 17, 21, ${currentGame.bannerDarkness / 100})` }}
          />
        )}

        {/* Subtle, gentle side edge shading on left & right borders only (keeps artwork clear & bright without heavy fade) */}
        <div 
          className="absolute inset-0 pointer-events-none hidden md:block" 
          style={{
            background: `linear-gradient(to right, rgba(0,0,0,${Math.min(0.35, ((edgeDarknessVal || 25) / 100) * 0.4)}) 0%, transparent 8%, transparent 92%, rgba(0,0,0,${Math.min(0.35, ((edgeDarknessVal || 25) / 100) * 0.4)}) 100%)`
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#12141A]/60 via-transparent to-transparent md:hidden pointer-events-none" />

        {/* Top-Left Featured Badge with Expiration / Reason */}
        <div className="absolute top-4 left-4 flex flex-wrap items-center gap-2 z-20">
          <span className={`px-3 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase shadow-md flex items-center gap-1.5 backdrop-blur-md border ${
            currentResolved?.badgeType === 'new'
              ? 'bg-amber-500/30 text-amber-300 border-amber-500/50'
              : currentResolved?.badgeType === 'popular'
              ? 'bg-rose-500/30 text-rose-300 border-rose-500/50'
              : currentResolved?.badgeType === 'random'
              ? 'bg-purple-500/30 text-purple-300 border-purple-500/50'
              : 'bg-ice-accent/30 text-ice-accent border-ice-accent/50'
          }`}>
            {currentResolved?.badgeType === 'new' && <Clock className="w-3.5 h-3.5 text-amber-400" />}
            {currentResolved?.badgeType === 'popular' && <Flame className="w-3.5 h-3.5 text-rose-400" />}
            {currentResolved?.badgeType === 'random' && <Shuffle className="w-3.5 h-3.5 text-purple-400" />}
            {currentResolved?.badgeType === 'pinned' && <Sparkles className="w-3.5 h-3.5 text-ice-accent" />}
            <span>{currentResolved?.badgeText || 'NỔI BẬT & ĐỀ XUẤT'}</span>
          </span>

          {isReady && (
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center gap-1 backdrop-blur-md">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span>Sẵn sàng chơi</span>
            </span>
          )}
        </div>
      </div>

      {/* 2. RIGHT COLUMN: Information, Description & Actions (Generous vertical space, zero button clipping) */}
      <div className="relative flex-1 min-w-[320px] p-5 lg:p-6 flex flex-col justify-between bg-gradient-to-b from-[#171A21] via-[#12141A] to-[#0F1115] border-t md:border-t-0 md:border-l border-ice-border/70 z-20 min-h-0 overflow-hidden">
        {/* Top Header & Title */}
        <div className="space-y-2 min-h-0">
          {/* Tags */}
          <div className="flex flex-wrap items-center gap-1.5">
            {tagsList.slice(0, 4).map((tag) => (
              <span
                key={tag}
                className="px-2.5 py-0.5 rounded-md text-[10px] font-semibold bg-white/10 text-white/90 border border-white/10"
              >
                {tag}
              </span>
            ))}
          </div>

          {/* Title */}
          <h2
            onClick={() => onSelectGame(currentGame)}
            className="text-xl lg:text-2xl font-black text-white tracking-tight leading-snug line-clamp-2 cursor-pointer hover:text-ice-accent transition-colors"
          >
            {currentGame.name}
          </h2>

          {/* Description */}
          {currentGame.description && (
            <p className="text-xs text-ice-subtext line-clamp-3 leading-relaxed">
              {currentGame.description}
            </p>
          )}
        </div>

        {/* Middle: Steam-Style 4 Screenshot Thumbnails (Hover to preview on the left!) */}
        {screenshots.length > 0 && (
          <div className="space-y-1.5 py-2 min-h-0">
            <span className="text-[10px] text-ice-subtext font-medium uppercase tracking-wider">
              Ảnh chụp màn hình (Rê chuột để xem trước):
            </span>
            <div className="grid grid-cols-4 gap-2">
              {screenshots.map((img, idx) => {
                const isHovered = hoveredScreenshot === img;
                return (
                  <div
                    key={idx}
                    onMouseEnter={() => setHoveredScreenshot(img)}
                    onMouseLeave={() => setHoveredScreenshot(null)}
                    onClick={() => onSelectGame(currentGame)}
                    className={`aspect-video rounded-lg overflow-hidden border cursor-pointer transition-all ${
                      isHovered
                        ? 'border-amber-400 ring-2 ring-amber-400/50 scale-105 shadow-md'
                        : 'border-white/15 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt="Thumbnail" className="w-full h-full object-cover" />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Bottom Action Bar: Play/Download button + Details + Carousel controls (shrink-0 guarantees buttons are never clipped) */}
        <div className="space-y-3 pt-3 border-t border-ice-border/60 shrink-0">
          <div className="flex items-center gap-2">
            {isMobileOrTV(deviceType) ? (
              <button
                type="button"
                onClick={() => onIncompatibleClick?.(currentGame)}
                className="flex-1 h-11 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/35 text-amber-300 text-xs font-bold tracking-wider uppercase flex items-center justify-center gap-2 shadow-md transition-all"
                title="Tựa game này chỉ chạy trên Windows PC"
              >
                <Monitor className="w-4 h-4 text-amber-400" />
                <span>🚫 Chỉ hỗ trợ PC</span>
              </button>
            ) : isReady ? (
              <button
                onClick={() => onLaunch(currentGame.id)}
                className="flex-1 h-11 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white text-xs font-black tracking-wider uppercase flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>CHƠI NGAY</span>
              </button>
            ) : (
              <button
                onClick={() => onDownload(currentGame.id)}
                className="flex-1 h-11 rounded-xl bg-gradient-to-r from-ice-accent to-blue-600 hover:from-ice-accentHover hover:to-blue-500 text-white text-xs font-black tracking-wider uppercase flex items-center justify-center gap-2 shadow-lg shadow-blue-950/40 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
              >
                <Download className="w-4 h-4" />
                <span>TẢI GAME</span>
              </button>
            )}

            <button
              onClick={() => onSelectGame(currentGame)}
              className="h-11 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shrink-0"
              title="Xem trang chi tiết game"
            >
              <Info className="w-3.5 h-3.5" />
              <span>Chi tiết</span>
            </button>

            <button
              onClick={() => onToggleLibrary(currentGame.id)}
              className={`h-11 px-3.5 rounded-xl border text-xs font-semibold flex items-center justify-center transition-all shrink-0 ${
                currentGame.inLibrary
                  ? 'bg-ice-accent/20 border-ice-accent text-ice-accent'
                  : 'bg-white/5 border-white/10 text-ice-subtext hover:text-white hover:bg-white/10'
              }`}
              title={currentGame.inLibrary ? 'Đã lưu trong thư viện' : 'Lưu vào thư viện'}
            >
              {currentGame.inLibrary ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
            </button>
          </div>

          {/* Carousel Pagination (< 1 / 5 >) */}
          {displayGames.length > 1 && (
            <div className="flex items-center justify-between text-xs text-ice-subtext pt-1">
              <span className="text-[11px] font-mono">
                Mục <strong className="text-white">{currentIndex + 1}</strong> / {displayGames.length}
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setCurrentIndex((prev) => (prev - 1 + displayGames.length) % displayGames.length);
                    setHoveredScreenshot(null);
                  }}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-ice-accent hover:text-white text-white/80 transition-colors"
                  title="Game trước"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCurrentIndex((prev) => (prev + 1) % displayGames.length);
                    setHoveredScreenshot(null);
                  }}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-ice-accent hover:text-white text-white/80 transition-colors"
                  title="Game tiếp theo"
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
