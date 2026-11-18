import React, { useState } from 'react';
import { Palette } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import { CelestialThemeHub } from './CelestialThemeHub';
import { sfx } from '../../utils/sfx';

interface ThemeToggleSwitchProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showLabel?: boolean;
  showPaletteButton?: boolean;
}

export const ThemeToggleSwitch: React.FC<ThemeToggleSwitchProps> = ({
  size = 'md',
  className = '',
  showLabel = false,
  showPaletteButton = true,
}) => {
  const { theme, isSolar, currentThemeMeta, toggleTheme } = useTheme();
  const [isHubOpen, setIsHubOpen] = useState(false);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      sfx.playClick();
    } catch {}
    toggleTheme();
  };

  const handleOpenHub = (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      sfx.playClick();
    } catch {}
    setIsHubOpen(true);
  };

  const isSmall = size === 'sm';
  const isSpecialized = currentThemeMeta?.category === 'specialized';

  return (
    <>
      <div className={`flex items-center gap-1.5 select-none ${className}`}>
        {showLabel && (
          <span className="text-xs font-semibold text-ice-subtext tracking-wide mr-1">
            {currentThemeMeta ? `${currentThemeMeta.symbol} ${currentThemeMeta.name}` : (isSolar ? 'Ban ngày' : 'Ban đêm')}
          </span>
        )}

        {/* --- Quick Sun / Moon Morphing Switch --- */}
        <button
          type="button"
          role="switch"
          aria-checked={isSolar}
          aria-label={isSolar ? 'Chế độ hiện tại: Solar. Gạt để chuyển sang Lunar' : 'Chế độ hiện tại: Lunar. Gạt để chuyển sang Solar'}
          onClick={handleToggle}
          className={`relative inline-flex items-center shrink-0 cursor-pointer rounded-full p-0.5 overflow-hidden transition-all duration-500 shadow-md border ${
            isSmall ? 'w-14 h-7' : 'w-16 h-8'
          } ${
            isSpecialized
              ? 'opacity-40 grayscale hover:opacity-75 ring-1 ring-ice-border'
              : 'opacity-100'
          } ${
            isSolar
              ? 'bg-gradient-to-r from-amber-200 via-sky-300 to-sky-400 border-sky-300/80 shadow-sky-500/20'
              : 'bg-gradient-to-r from-[#0B0F19] via-indigo-950 to-slate-900 border-indigo-500/30 shadow-indigo-900/40'
          }`}
          title={
            isSpecialized
              ? `Đang ở chế độ chuyên biệt [${currentThemeMeta.name}]. Nhấp để quay về ${isSolar ? 'Lunar' : 'Solar'}`
              : isSolar
              ? 'Đang bật Solar (Ngày). Gạt sang Trái để chuyển sang Lunar (Đêm)'
              : 'Đang bật Lunar (Đêm). Gạt sang Phải để chuyển sang Solar (Ngày)'
          }
        >
          {/* --- Track Background Details: Clouds for Solar vs Stars for Lunar --- */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden transition-opacity duration-500">
            {isSolar ? (
              /* Day Sky: Puffy Clouds on left side (when knob is on the right) */
              <div className="absolute inset-0 flex items-center justify-start pl-1.5 opacity-90 transition-opacity duration-500">
                <div className="relative w-5 h-2.5 bg-white/90 rounded-full shadow-sm animate-pulse" style={{ animationDuration: '4s' }}>
                  <div className="absolute -top-1 left-1 w-2.5 h-2.5 bg-white/90 rounded-full" />
                  <div className="absolute -top-0.5 left-2.5 w-2 h-2 bg-white/90 rounded-full" />
                </div>
              </div>
            ) : (
              /* Night Sky: Twinkling Stars on right side (when knob is on the left) */
              <div className="absolute inset-0 pr-1.5 flex items-center justify-end opacity-90 transition-opacity duration-500">
                <span className="w-1 h-1 rounded-full bg-white animate-ping mr-1" style={{ animationDuration: '2.5s' }} />
                <span className="w-0.5 h-0.5 rounded-full bg-indigo-200 mr-1.5 mt-1 animate-pulse" style={{ animationDuration: '1.8s' }} />
                <span className="w-1 h-1 rounded-full bg-amber-200/90 mr-1 -mt-1.5 animate-pulse" style={{ animationDuration: '3s' }} />
              </div>
            )}
          </div>

          {/* --- Morphing Knob: Left = Lunar (Moon) | Right = Solar (Sun) --- */}
          <div
            className={`relative z-10 rounded-full shadow-md transition-all duration-500 cubic-bezier(0.34, 1.56, 0.64, 1) flex items-center justify-center ${
              isSmall ? 'w-5 h-5' : 'w-6 h-6'
            } ${
              isSolar
                ? isSmall ? 'translate-x-7' : 'translate-x-8'
                : isSmall ? 'translate-x-0.5' : 'translate-x-1'
            } ${
              isSolar
                ? 'bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 shadow-[0_0_12px_rgba(245,158,11,0.85)] ring-2 ring-amber-300/60'
                : 'bg-gradient-to-tr from-slate-200 via-slate-100 to-indigo-100 shadow-[0_0_12px_rgba(129,140,248,0.7)] ring-2 ring-indigo-400/40'
            }`}
          >
            {isSolar ? (
              /* Sun Icon with radiating rays */
              <svg
                className={`text-amber-950/80 transition-transform duration-500 rotate-0 ${isSmall ? 'w-3.5 h-3.5' : 'w-4 h-4'}`}
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <circle cx="12" cy="12" r="5" />
                <path
                  d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
            ) : (
              /* Crescent Moon with crater accents */
              <div className="relative w-full h-full flex items-center justify-center">
                <svg
                  className={`text-indigo-950 transition-transform duration-500 -rotate-12 ${isSmall ? 'w-3.5 h-3.5' : 'w-4 h-4'}`}
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
                <span className="absolute top-1 right-1.5 w-1 h-1 rounded-full bg-slate-400/40" />
                <span className="absolute bottom-1.5 right-2 w-0.5 h-0.5 rounded-full bg-slate-400/40" />
              </div>
            )}
          </div>
        </button>

        {/* --- Celestial Theme Hub (Palette) Quick Trigger Button --- */}
        {showPaletteButton && (
          <button
            type="button"
            onClick={handleOpenHub}
            className={`relative flex items-center justify-center rounded-xl border transition-all duration-200 cursor-pointer ${
              isSmall ? 'w-7 h-7' : 'w-8 h-8'
            } ${
              isSpecialized
                ? 'bg-ice-accent/20 border-ice-accent text-ice-accent shadow-sm scale-105'
                : 'bg-ice-card/80 hover:bg-ice-hover text-ice-subtext hover:text-ice-text border-ice-border/70 hover:border-ice-accent/50 shadow-xs'
            }`}
            title="Mở Bảng Chọn 9 Chế Độ Không Gian (Celestial Theme Hub)"
            aria-label="Mở Bảng Chọn 9 Chế Độ Không Gian"
          >
            {isSpecialized ? (
              <span className="text-xs select-none">{currentThemeMeta.symbol}</span>
            ) : (
              <Palette className={isSmall ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
            )}
            {/* Subtle glow dot when in specialized mode */}
            {isSpecialized && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-ice-accent animate-pulse" />
            )}
          </button>
        )}
      </div>

      {/* --- Floating Celestial Theme Hub Modal --- */}
      <CelestialThemeHub isOpen={isHubOpen} onClose={() => setIsHubOpen(false)} />
    </>
  );
};
