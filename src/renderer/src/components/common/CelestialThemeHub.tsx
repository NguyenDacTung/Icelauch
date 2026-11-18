import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Check, Compass, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { useTheme, type ThemeMode, type ThemeMeta } from '../../hooks/useTheme';
import { sfx } from '../../utils/sfx';

interface CelestialThemeHubProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CelestialThemeHub: React.FC<CelestialThemeHubProps> = ({ isOpen, onClose }) => {
  const { theme, setTheme, themes } = useTheme();
  const [focusedIndex, setFocusedIndex] = useState<number>(0);
  const touchStartX = useRef<number | null>(null);

  // Sync focused index with active theme on open
  useEffect(() => {
    if (isOpen) {
      const activeIdx = themes.findIndex((t) => t.id === theme);
      setFocusedIndex(activeIdx >= 0 ? activeIdx : 0);
    }
  }, [isOpen, theme, themes]);

  // Keyboard navigation: ArrowLeft, ArrowRight, Enter (apply), Escape (close)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'Enter') {
        handleApply();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, focusedIndex, onClose, themes]);

  if (!isOpen) return null;

  const currentItem: ThemeMeta = themes[focusedIndex] || themes[0];
  const isCurrentlyActive = theme === currentItem.id;

  const handlePrev = () => {
    try {
      sfx.playClick();
    } catch {}
    setFocusedIndex((prev) => (prev > 0 ? prev - 1 : themes.length - 1));
  };

  const handleNext = () => {
    try {
      sfx.playClick();
    } catch {}
    setFocusedIndex((prev) => (prev < themes.length - 1 ? prev + 1 : 0));
  };

  const handleApply = () => {
    try {
      sfx.playClick();
    } catch {}
    setTheme(currentItem.id);
  };

  // Touch Swipe Handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(diff) > 40) {
      if (diff > 0) handlePrev();
      else handleNext();
    }
    touchStartX.current = null;
  };

  if (!isOpen) return null;

  return createPortal(
    <div 
      onClick={onClose}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-xl glass-header-elevated rounded-3xl border border-ice-border shadow-[0_20px_60px_rgba(0,0,0,0.65)] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 bg-ice-card"
      >
        {/* Header Bar */}
        <div className="p-4 sm:p-5 border-b border-ice-border/60 flex items-center justify-between gap-3 shrink-0 bg-ice-card/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-ice-accent/30 to-amber-500/20 border border-ice-accent/40 flex items-center justify-center text-ice-accent shadow-sm">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-ice-text flex items-center gap-2">
                <span>Hệ Thống 9 Chế Độ Thời Không</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-ice-accent/20 text-ice-accent border border-ice-accent/30">
                  Center-Focus
                </span>
              </h3>
              <p className="text-xs text-ice-subtext">
                Trượt để chọn biểu tượng vào tâm điểm • Bấm Áp Dụng để đổi giao diện
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-ice-subtext hover:text-ice-text hover:bg-ice-hover transition-colors shrink-0 cursor-pointer"
            title="Đóng (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ========================================================= */}
        {/* CENTER-FOCUS CAROUSEL STAGE */}
        {/* ========================================================= */}
        <div
          className="relative py-6 px-4 flex flex-col items-center justify-center bg-gradient-to-b from-ice-hover/40 via-ice-card to-ice-card select-none"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Navigation Arrows & Icon Row */}
          <div className="w-full flex items-center justify-between gap-2 max-w-md">
            {/* Left Button */}
            <button
              type="button"
              onClick={handlePrev}
              className="w-10 h-10 rounded-2xl bg-ice-card/90 hover:bg-ice-hover text-ice-text border border-ice-border/80 flex items-center justify-center shadow-md active:scale-95 transition-all cursor-pointer shrink-0 z-10"
              title="Chế độ trước (Mũi tên Trái)"
              aria-label="Chế độ trước"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            {/* Central Stage Reel: 5 visible slots centered on focusedIndex */}
            <div className="flex-1 flex items-center justify-center gap-2 sm:gap-3 overflow-hidden py-3">
              {themes.map((item, idx) => {
                const offset = idx - focusedIndex;
                // Only render items within -2 to +2 distance from center for clean focus
                if (Math.abs(offset) > 2) return null;

                const isCenter = offset === 0;
                const isNear = Math.abs(offset) === 1;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      try {
                        sfx.playClick();
                      } catch {}
                      setFocusedIndex(idx);
                    }}
                    className={`relative flex items-center justify-center transition-all duration-300 cursor-pointer border ${
                      isCenter
                        ? 'w-18 h-18 sm:w-20 sm:h-20 scale-115 ring-4 ring-ice-accent/60 border-ice-accent shadow-xl bg-ice-hover z-20'
                        : isNear
                        ? 'w-12 h-12 sm:w-14 sm:h-14 scale-90 opacity-60 hover:opacity-90 border-ice-border/70 bg-ice-card/80 z-10'
                        : 'w-10 h-10 sm:w-11 sm:h-11 scale-75 opacity-30 hover:opacity-60 border-ice-border/50 bg-ice-card/60 z-0'
                    }`}
                    style={{
                      borderRadius: item.radius,
                    }}
                    title={item.name}
                  >
                    <span className={`select-none ${isCenter ? 'text-3xl sm:text-4xl' : 'text-xl sm:text-2xl'}`}>
                      {item.symbol}
                    </span>

                    {/* Active Check Dot on center stage */}
                    {isCenter && theme === item.id && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-bold shadow-sm">
                        ✓
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Right Button */}
            <button
              type="button"
              onClick={handleNext}
              className="w-10 h-10 rounded-2xl bg-ice-card/90 hover:bg-ice-hover text-ice-text border border-ice-border/80 flex items-center justify-center shadow-md active:scale-95 transition-all cursor-pointer shrink-0 z-10"
              title="Chế độ tiếp theo (Mũi tên Phải)"
              aria-label="Chế độ tiếp theo"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Pagination Indicators (9 Dots) */}
          <div className="flex items-center gap-1.5 mt-3">
            {themes.map((t, idx) => (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  try {
                    sfx.playClick();
                  } catch {}
                  setFocusedIndex(idx);
                }}
                className={`transition-all duration-300 rounded-full cursor-pointer ${
                  idx === focusedIndex
                    ? 'w-6 h-2 bg-ice-accent'
                    : 'w-2 h-2 bg-ice-subtext/30 hover:bg-ice-subtext/60'
                }`}
                title={`Chuyển đến ${t.name}`}
              />
            ))}
          </div>
        </div>

        {/* ========================================================= */}
        {/* DYNAMIC INFO DISPLAY PANEL */}
        {/* ========================================================= */}
        <div className="px-5 pb-5 pt-1 space-y-4">
          <div
            className="p-4 border border-ice-border/70 bg-ice-hover/40 shadow-inner flex flex-col justify-between transition-all duration-300"
            style={{ borderRadius: currentItem.radius }}
          >
            {/* Title & Category Badge */}
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl select-none">{currentItem.symbol}</span>
                <div>
                  <h4 className="text-base font-extrabold text-ice-text flex items-center gap-2">
                    <span>{currentItem.name}</span>
                  </h4>
                  <span className="text-[11px] font-medium text-ice-subtext">
                    Hình khối {currentItem.radius} • {currentItem.isLight ? 'Chế độ Sáng' : 'Chế độ Tối'}
                  </span>
                </div>
              </div>

              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border shrink-0 ${
                  currentItem.category === 'base'
                    ? 'bg-amber-500/15 text-amber-500 border-amber-500/30'
                    : 'bg-ice-accent/15 text-ice-accent border-ice-accent/30'
                }`}
              >
                {currentItem.category === 'base' ? 'Chuẩn Công Thái Học' : 'Chuyên Biệt Độc Bản'}
              </span>
            </div>

            {/* Description */}
            <p className="text-xs text-ice-subtext leading-relaxed mb-3">
              {currentItem.description}
            </p>

            {/* Palette Swatches Bar */}
            <div className="flex items-center justify-between pt-2.5 border-t border-ice-border/50 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold text-ice-subtext">Bảng màu:</span>
                <span
                  className="w-4 h-4 rounded-full border border-black/20 shadow-xs"
                  style={{ backgroundColor: currentItem.previewColors.bg }}
                  title={`Màu nền: ${currentItem.previewColors.bg}`}
                />
                <span
                  className="w-4 h-4 rounded-full border border-black/20 shadow-xs"
                  style={{ backgroundColor: currentItem.previewColors.card }}
                  title={`Màu thẻ: ${currentItem.previewColors.card}`}
                />
                <span
                  className="w-4 h-4 rounded-full border border-black/20 shadow-xs"
                  style={{ backgroundColor: currentItem.previewColors.accent }}
                  title={`Màu nhấn: ${currentItem.previewColors.accent}`}
                />
              </div>

              <span className="text-[11px] font-mono font-bold text-ice-subtext">
                ID: {currentItem.id}
              </span>
            </div>
          </div>

          {/* Action Button: Apply Mode */}
          <div className="flex items-center justify-between gap-3 pt-1">
            <span className="text-xs text-ice-subtext truncate">
              {isCurrentlyActive ? '✓ Đang áp dụng trên thiết bị này' : 'Bấm để kích hoạt chế độ này'}
            </span>

            <button
              type="button"
              onClick={handleApply}
              disabled={isCurrentlyActive}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shrink-0 cursor-pointer ${
                isCurrentlyActive
                  ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/40 opacity-90 cursor-default'
                  : 'bg-ice-accent hover:opacity-90 active:scale-95 text-white shadow-ice-accent/30 cursor-pointer'
              }`}
            >
              {isCurrentlyActive ? (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Đang Kích Hoạt</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Áp Dụng Chế Độ {currentItem.name}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
