import React from 'react';
import { useTheme } from '../../hooks/useTheme';
import { sfx } from '../../utils/sfx';

interface ThemeToggleSwitchProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showLabel?: boolean;
}

export const ThemeToggleSwitch: React.FC<ThemeToggleSwitchProps> = ({
  size = 'md',
  className = '',
  showLabel = false,
}) => {
  const { theme, isSolar, toggleTheme } = useTheme();

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      sfx.playClick();
    } catch {}
    toggleTheme();
  };

  const isSmall = size === 'sm';

  return (
    <div className={`flex items-center gap-2 select-none ${className}`}>
      {showLabel && (
        <span className="text-xs font-semibold text-ice-subtext tracking-wide">
          {isSolar ? 'Ban ngày (Solar)' : 'Ban đêm (Lunar)'}
        </span>
      )}
      <button
        type="button"
        role="switch"
        aria-checked={!isSolar}
        aria-label={isSolar ? 'Chuyển sang chế độ Ban đêm (Lunar)' : 'Chuyển sang chế độ Ban ngày (Solar)'}
        onClick={handleToggle}
        className={`relative inline-flex items-center shrink-0 cursor-pointer rounded-full p-0.5 overflow-hidden transition-all duration-500 shadow-md border ${
          isSmall ? 'w-14 h-7' : 'w-16 h-8'
        } ${
          isSolar
            ? 'bg-gradient-to-r from-sky-400 via-sky-300 to-amber-200 border-sky-300/80 shadow-sky-500/20'
            : 'bg-gradient-to-r from-slate-900 via-indigo-950 to-[#0B0F19] border-indigo-500/30 shadow-indigo-900/40'
        }`}
        title={isSolar ? 'Gạt để chuyển sang Ban đêm (Lunar Mode)' : 'Gạt để chuyển sang Ban ngày (Solar Mode)'}
      >
        {/* --- Track Background Details: Clouds for Solar vs Stars for Lunar --- */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden transition-opacity duration-500">
          {isSolar ? (
            /* Day Sky: Drifting Puffy Clouds */
            <div className="absolute inset-0 flex items-center justify-end pr-1.5 opacity-90 transition-opacity duration-500">
              {/* Cloud 1 */}
              <div className="relative w-6 h-3 bg-white/90 rounded-full shadow-sm animate-pulse" style={{ animationDuration: '4s' }}>
                <div className="absolute -top-1.5 left-1 w-3 h-3 bg-white/90 rounded-full" />
                <div className="absolute -top-1 left-3 w-2.5 h-2.5 bg-white/90 rounded-full" />
              </div>
              {/* Cloud 2 (smaller background) */}
              <div className="absolute right-7 top-1 w-3.5 h-1.5 bg-white/70 rounded-full opacity-70" />
            </div>
          ) : (
            /* Night Sky: Twinkling Stars */
            <div className="absolute inset-0 pl-1.5 flex items-center justify-start opacity-90 transition-opacity duration-500">
              <span className="w-1 h-1 rounded-full bg-white animate-ping ml-1" style={{ animationDuration: '2.5s' }} />
              <span className="w-0.5 h-0.5 rounded-full bg-indigo-200 ml-2 mt-2 animate-pulse" style={{ animationDuration: '1.8s' }} />
              <span className="w-1 h-1 rounded-full bg-amber-200/90 ml-1.5 -mt-2 animate-pulse" style={{ animationDuration: '3s' }} />
              <span className="w-0.5 h-0.5 rounded-full bg-cyan-200 ml-2 animate-ping" style={{ animationDuration: '4s' }} />
            </div>
          )}
        </div>

        {/* --- Morphing Knob: Sun <-> Moon --- */}
        <div
          className={`relative z-10 rounded-full shadow-md transition-all duration-500 cubic-bezier(0.34, 1.56, 0.64, 1) flex items-center justify-center ${
            isSmall ? 'w-5 h-5' : 'w-6 h-6'
          } ${
            isSolar
              ? isSmall ? 'translate-x-0.5' : 'translate-x-1'
              : isSmall ? 'translate-x-7' : 'translate-x-8'
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
              {/* Subtle Crater Dots */}
              <span className="absolute top-1 right-1.5 w-1 h-1 rounded-full bg-slate-400/40" />
              <span className="absolute bottom-1.5 right-2 w-0.5 h-0.5 rounded-full bg-slate-400/40" />
            </div>
          )}
        </div>
      </button>
    </div>
  );
};
