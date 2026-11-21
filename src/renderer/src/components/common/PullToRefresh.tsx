import React, { useState, useRef, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';

interface PullToRefreshProps {
  onRefresh?: () => Promise<void>;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({
  onRefresh,
  children,
  className = '',
  disabled = false,
}) => {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef<number | null>(null);
  const isPullingRef = useRef(false);

  const PULL_THRESHOLD = 55;
  const MAX_PULL = 80;

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (disabled || isRefreshing || !onRefresh) return;
      const el = containerRef.current;
      // Only initiate pull when scroll position is at the very top
      if (el && el.scrollTop <= 2) {
        startYRef.current = e.touches[0].clientY;
        isPullingRef.current = true;
      } else {
        startYRef.current = null;
        isPullingRef.current = false;
      }
    },
    [disabled, isRefreshing, onRefresh]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isPullingRef.current || startYRef.current === null || isRefreshing) return;
      const el = containerRef.current;
      if (el && el.scrollTop > 2) {
        // User scrolled down inside list, cancel pull gesture
        isPullingRef.current = false;
        setPullDistance(0);
        return;
      }

      const currentY = e.touches[0].clientY;
      const deltaY = currentY - startYRef.current;

      if (deltaY > 0) {
        // Apply smooth resistance damping
        const damped = Math.min(MAX_PULL, deltaY * 0.45);
        setPullDistance(damped);
      } else {
        setPullDistance(0);
      }
    },
    [isRefreshing]
  );

  const handleTouchEnd = useCallback(async () => {
    if (!isPullingRef.current || isRefreshing) return;
    isPullingRef.current = false;

    if (pullDistance >= PULL_THRESHOLD && onRefresh) {
      setIsRefreshing(true);
      setPullDistance(50); // Hold at spinner height
      try {
        await onRefresh();
      } catch (err) {
        console.warn('Pull-to-refresh failed:', err);
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
    startYRef.current = null;
  }, [pullDistance, isRefreshing, onRefresh]);

  const progress = Math.min(1, pullDistance / PULL_THRESHOLD);
  const isPastThreshold = pullDistance >= PULL_THRESHOLD;

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      className={`relative overflow-y-auto no-scrollbar ${className}`}
    >
      {/* Pull down indicator bar */}
      <div
        className="w-full flex items-center justify-center pointer-events-none transition-transform select-none overflow-hidden"
        style={{
          height: `${pullDistance}px`,
          opacity: pullDistance > 8 ? Math.min(1, pullDistance / 25) : 0,
          transition: isPullingRef.current ? 'none' : 'height 0.25s ease-out, opacity 0.25s ease-out',
        }}
      >
        <div className="flex items-center gap-2 py-1.5 px-3 rounded-full bg-ice-card/90 border border-ice-accent/30 shadow-lg backdrop-blur-md">
          <RefreshCw
            className={`w-3.5 h-3.5 text-ice-accent transition-transform ${
              isRefreshing ? 'animate-spin' : ''
            }`}
            style={{
              transform: isRefreshing ? undefined : `rotate(${progress * 360}deg)`,
            }}
          />
          <span className="text-[11px] font-bold text-ice-text tracking-wide">
            {isRefreshing
              ? 'Đang đồng bộ Cloud...'
              : isPastThreshold
              ? 'Thả để cập nhật'
              : 'Kéo để làm mới'}
          </span>
        </div>
      </div>

      {children}
    </div>
  );
};
