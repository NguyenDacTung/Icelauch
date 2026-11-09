import React, { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface HorizontalScrollerProps {
  children: React.ReactNode;
  className?: string;
  scrollStep?: number;
  showButtons?: boolean;
}

export const HorizontalScroller: React.FC<HorizontalScrollerProps> = ({
  children,
  className = '',
  scrollStep = 240,
  showButtons = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = () => {
    if (!containerRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = containerRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10);
  };

  useEffect(() => {
    checkScroll();
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener('scroll', checkScroll, { passive: true });
    window.addEventListener('resize', checkScroll);
    return () => {
      el.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, [children]);

  const handleScroll = (direction: 'left' | 'right') => {
    if (!containerRef.current) return;
    const offset = direction === 'left' ? -scrollStep : scrollStep;
    containerRef.current.scrollBy({ left: offset, behavior: 'smooth' });
  };

  return (
    <div className="relative group/scroller w-full">
      {/* Scrollable Container with hidden scrollbars */}
      <div
        ref={containerRef}
        className={`flex overflow-x-auto no-scrollbar scroll-smooth py-1 ${className}`}
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {children}
      </div>

      {/* Left Chevron Button */}
      {showButtons && canScrollLeft && (
        <button
          type="button"
          onClick={() => handleScroll('left')}
          className="absolute left-1 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/75 hover:bg-black/95 text-white backdrop-blur-md border border-white/25 flex items-center justify-center shadow-lg transition-transform active:scale-95"
          title="Chuyển sang trái"
          aria-label="Cuộn sang trái"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      )}

      {/* Right Chevron Button */}
      {showButtons && canScrollRight && (
        <button
          type="button"
          onClick={() => handleScroll('right')}
          className="absolute right-1 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/75 hover:bg-black/95 text-white backdrop-blur-md border border-white/25 flex items-center justify-center shadow-lg transition-transform active:scale-95"
          title="Chuyển sang phải"
          aria-label="Cuộn sang phải"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

