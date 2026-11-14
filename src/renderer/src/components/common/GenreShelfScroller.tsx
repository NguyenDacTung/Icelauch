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

        {onViewAll && (
          <button
            onClick={() => {
              sfx.playClick();
              onViewAll();
            }}
            className="text-xs text-amber-400 hover:text-amber-300 font-semibold transition-colors flex items-center gap-1 active:scale-95"
          >
            <span>Xem tất cả</span>
            <span>&rarr;</span>
          </button>
        )}
      </div>

      {/* Scroller Container */}
      <div className="relative group/shelf">
        {/* Left Arrow Button */}
        {canScrollLeft && (
          <button
            type="button"
            onClick={() => handleScroll('left')}
            className="absolute left-1.5 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-black/80 hover:bg-amber-400 hover:text-black text-white border border-white/20 shadow-2xl backdrop-blur-md flex items-center justify-center transition-all duration-200 active:scale-90"
            title="Cuộn sang trái"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}

        {/* Horizontal Track */}
        <div
          ref={scrollRef}
          className="flex items-center gap-4 overflow-x-auto pb-2 scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        >
          {children}
        </div>

        {/* Right Arrow Button */}
        {canScrollRight && (
          <button
            type="button"
            onClick={() => handleScroll('right')}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-black/80 hover:bg-amber-400 hover:text-black text-white border border-white/20 shadow-2xl backdrop-blur-md flex items-center justify-center transition-all duration-200 active:scale-90"
            title="Cuộn sang phải"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}
      </div>
    </section>
  );
};

