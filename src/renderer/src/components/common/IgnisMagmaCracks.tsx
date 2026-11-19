import React from 'react';
import { useTheme } from '../../hooks/useTheme';

interface IgnisMagmaCracksProps {
  isPlaying: boolean;
  className?: string;
}

export const IgnisMagmaCracks: React.FC<IgnisMagmaCracksProps> = ({
  isPlaying,
  className = '',
}) => {
  const { theme } = useTheme();

  if (theme !== 'ignis') return null;

  return (
    <div
      className={`absolute inset-0 pointer-events-none overflow-visible z-10 select-none ${className}`}
      aria-hidden="true"
    >
      <svg
        className="w-full h-full absolute inset-0 overflow-visible"
        preserveAspectRatio="none"
        viewBox="0 0 800 60"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Intense Liquid Molten Magma Gradient */}
          <linearGradient id="ignisMagmaGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#EF4444" />
            <stop offset="18%" stopColor="#F97316" />
            <stop offset="35%" stopColor="#FBBF24" />
            <stop offset="50%" stopColor="#FFFBEB" />
            <stop offset="65%" stopColor="#FBBF24" />
            <stop offset="82%" stopColor="#F97316" />
            <stop offset="100%" stopColor="#EF4444" />
          </linearGradient>

          {/* Deep Magma Core Glow Filter */}
          <filter id="ignisMagmaGlow" x="-20%" y="-40%" width="140%" height="180%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* 
          1. Top Rim Organic Volcanic Fissure (Smooth Bézier Curves with varied bed thickness)
        */}
        <path
          d="M 18 2.5 C 42 1.2, 70 3.8, 98 1.8 C 135 3.2, 168 1.4, 210 2.8 C 248 1.1, 285 3.5, 330 1.9 C 375 3.6, 420 1.2, 470 2.7 C 520 1.5, 575 3.8, 625 2.1 C 670 3.5, 715 1.4, 755 2.8 T 782 2.2"
          stroke={isPlaying ? 'url(#ignisMagmaGrad)' : '#26140D'}
          strokeWidth={isPlaying ? 2.8 : 0.8}
          strokeLinecap="round"
          strokeLinejoin="round"
          filter={isPlaying ? 'url(#ignisMagmaGlow)' : undefined}
          style={{
            transition: 'stroke 0.6s ease, stroke-width 0.6s ease, filter 0.6s ease, opacity 0.6s ease',
            opacity: isPlaying ? 1 : 0.45,
            animation: isPlaying ? 'magmaPulse 2.4s ease-in-out infinite' : 'none',
          }}
        />

        {/* 
          2. Top Secondary Micro-Branching Fissures (Splitting organically into the stone)
        */}
        <path
          d="M 98 1.8 C 102 5.5, 108 7.5, 116 8.5 M 210 2.8 C 215 6.5, 222 8, 232 9.2 M 330 1.9 C 335 5.5, 342 7.8, 350 8.5 M 470 2.7 C 476 6.2, 482 8.5, 492 9 M 625 2.1 C 630 5.8, 638 8, 648 8.8 M 715 1.4 C 720 5.5, 726 7.5, 735 8.2"
          stroke={isPlaying ? '#F97316' : '#1C0D08'}
          strokeWidth={isPlaying ? 1.5 : 0.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            transition: 'stroke 0.6s ease, stroke-width 0.6s ease, opacity 0.6s ease',
            opacity: isPlaying ? 0.95 : 0.25,
          }}
        />

        {/* 
          3. Bottom Rim Organic Volcanic Fissure
        */}
        <path
          d="M 24 57.5 C 56 58.8, 95 56.5, 140 58.2 C 185 56.8, 230 58.6, 280 57.2 C 335 58.8, 385 56.4, 440 57.9 C 495 56.6, 550 58.5, 605 57.1 C 660 58.7, 710 56.8, 750 58.1 T 778 57.4"
          stroke={isPlaying ? 'url(#ignisMagmaGrad)' : '#26140D'}
          strokeWidth={isPlaying ? 2.6 : 0.8}
          strokeLinecap="round"
          strokeLinejoin="round"
          filter={isPlaying ? 'url(#ignisMagmaGlow)' : undefined}
          style={{
            transition: 'stroke 0.6s ease, stroke-width 0.6s ease, filter 0.6s ease, opacity 0.6s ease',
            opacity: isPlaying ? 1 : 0.45,
            animation: isPlaying ? 'magmaPulse 2.4s ease-in-out infinite 0.6s' : 'none',
          }}
        />

        {/* 
          4. Bottom Secondary Micro-Branching Fissures
        */}
        <path
          d="M 140 58.2 C 145 54.5, 152 52.8, 162 51.5 M 280 57.2 C 285 53.5, 292 52, 302 51 M 440 57.9 C 445 54.2, 452 52.2, 462 51.5 M 605 57.1 C 610 53.8, 618 52, 628 51.2 M 710 56.8 C 715 53.5, 722 52, 730 51.5"
          stroke={isPlaying ? '#F97316' : '#1C0D08'}
          strokeWidth={isPlaying ? 1.4 : 0.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            transition: 'stroke 0.6s ease, stroke-width 0.6s ease, opacity 0.6s ease',
            opacity: isPlaying ? 0.9 : 0.25,
          }}
        />

        {/* 
          5. Left & Right Basalt Corner Fractures
        */}
        <path
          d="M 6 16 C 8 26, 7 34, 5 44 M 794 16 C 792 26, 793 34, 795 44"
          stroke={isPlaying ? '#FBBF24' : '#26140D'}
          strokeWidth={isPlaying ? 1.8 : 0.6}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            transition: 'stroke 0.6s ease, stroke-width 0.6s ease, opacity 0.6s ease',
            opacity: isPlaying ? 0.9 : 0.3,
          }}
        />
      </svg>
    </div>
  );
};
