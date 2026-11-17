import React, { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { sfx } from '../../utils/sfx';

interface GenreShelfScrollerProps {
  title: string;
  count?: number;
  iconAccentColor?: string;
  onViewAll?: () => void;
  children: React.ReactNode;
  className?: string;
}

export const GenreShelfScroller: React.FC<GenreShelfScrollerProps> = ({
  title,
  count,
  iconAccentColor = 'bg-amber-400',
  onViewAll,
  children,
  className = '',
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 15);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 15);
  };

  useEffect(() => {
    updateScrollState();
    const el = scrollRef.current;
    if (!el) return;

    el.addEventListener('scroll', updateScrollState, { passive: true });
    window.addEventListener('resize', updateScrollState);

    // Initial check after rendering children
    const timer = setTimeout(updateScrollState, 200);

    return () => {
      el.removeEventListener('scroll', updateScrollState);
      window.removeEventListener('resize', updateScrollState);
      clearTimeout(timer);
    };
  }, [children]);

  const handleScroll = (direction: 'left' | 'right') => {
    sfx.playClick();
    const el = scrollRef.current;
    if (!el) return;
    const distance = Math.max(300, Math.floor(el.clientWidth * 0.75));
    el.scrollBy({
      left: direction === 'left' ? -distance : distance,
      behavior: 'smooth',
    });
  };

  return (
    <section className={`space-y-3 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-white tracking-wide uppercase flex items-center gap-2">
          <span className={`w-1.5 h-3.5 ${iconAccentColor} rounded-sm`} />
          <span>{title}</span>
          {typeof count === 'number' && (
            <span className="text-xs text-ice-muted font-mono font-normal">({count})</span>
          )}
        </h3>

        <div className="flex items-center gap-2">
          {/* Header-based Scroll Arrows (Netflix / Steam style, 0 overlap with cards!) */}
          <div className="flex items-center gap-1 bg-white/5 p-0.5 rounded-lg border border-white/10">
            <button
              type="button"
              disabled={!canScrollLeft}
              onClick={() => handleScroll('left')}
              className={`p-1 rounded-md transition-all ${
                canScrollLeft
                  ? 'text-white hover:bg-white/10 hover:text-amber-400 active:scale-95 cursor-pointer'
                  : 'text-white/20 cursor-not-allowed'
              }`}
              title="Cuộn sang trái"
              aria-label="Cuộn sang trái"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              disabled={!canScrollRight}
              onClick={() => handleScroll('right')}
              className={`p-1 rounded-md transition-all ${
                canScrollRight
                  ? 'text-white hover:bg-white/10 hover:text-amber-400 active:scale-95 cursor-pointer'
                  : 'text-white/20 cursor-not-allowed'
              }`}
              title="Cuộn sang phải"
              aria-label="Cuộn sang phải"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {onViewAll && (
            <button
              onClick={() => {
                sfx.playClick();
                onViewAll();
              }}
              className="text-xs text-amber-400 hover:text-amber-300 font-semibold transition-colors flex items-center gap-1 active:scale-95 cursor-pointer"
            >
              <span>Xem tất cả</span>
              <span>&rarr;</span>
            </button>
          )}
        </div>
      </div>

      {/* Scroller Container */}
      <div className="relative group/shelf">
        {/* Soft Left Fader */}
        <div
          className={`pointer-events-none absolute left-0 top-0 bottom-2 w-8 bg-gradient-to-r from-[#0F1115] to-transparent z-10 transition-opacity duration-300 ${
            canScrollLeft ? 'opacity-80' : 'opacity-0'
          }`}
        />

        {/* Horizontal Track */}
        <div
          ref={scrollRef}
          className="flex items-center gap-4 overflow-x-auto pb-2 scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        >
          {children}
        </div>

        {/* Soft Right Fader */}
        <div
          className={`pointer-events-none absolute right-0 top-0 bottom-2 w-8 bg-gradient-to-l from-[#0F1115] to-transparent z-10 transition-opacity duration-300 ${
            canScrollRight ? 'opacity-80' : 'opacity-0'
          }`}
        />
      </div>
    </section>
  );
};

