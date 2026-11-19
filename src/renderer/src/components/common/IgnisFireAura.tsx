import React from 'react';
import { useTheme } from '../../hooks/useTheme';

interface IgnisFireAuraProps {
  isHovered: boolean;
}

export const IgnisFireAura: React.FC<IgnisFireAuraProps> = ({ isHovered }) => {
  const { theme } = useTheme();

  if (theme !== 'ignis') return null;

  return (
    <div
      className={`absolute inset-0 pointer-events-none z-0 overflow-visible select-none transition-all ${
        isHovered
          ? 'opacity-100 scale-100 duration-350 ease-out'
          : 'opacity-0 scale-95 duration-450 ease-in'
      }`}
      aria-hidden="true"
    >
      {/* Shared SVG GPU Turbulence Filter for smooth flame movement */}
      <svg className="w-0 h-0 absolute pointer-events-none" aria-hidden="true">
        <defs>
          <filter id="ignis-flame-displacement" x="-30%" y="-40%" width="160%" height="180%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.035 0.075"
              numOctaves="3"
              seed="11"
              result="noise"
            >
              <animate
                attributeName="baseFrequency"
                dur="2.8s"
                values="0.035 0.075; 0.045 0.11; 0.035 0.075"
                repeatCount="indefinite"
              />
            </feTurbulence>
            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              scale="8"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>
      </svg>

      {/* 
        1. Continuous Outer Rim Halo (Surrounding all 4 card edges, ZERO content overlay)
        Provides an incandescent white-hot edge with radiant fiery amber drop-shadow
      */}
      <div
        className="absolute -inset-1.5 rounded-xl pointer-events-none"
        style={{
          border: '1.5px solid rgba(251, 191, 36, 0.85)',
          boxShadow: isHovered
            ? '0 0 10px 1px rgba(251, 191, 36, 0.8), 0 0 20px 4px rgba(249, 115, 22, 0.65), 0 0 32px 8px rgba(220, 38, 38, 0.35)'
            : 'none',
          filter: 'drop-shadow(0 0 6px #F97316)',
        }}
      />

      {/* 
        2. Top Buoyant Flame Crest (Rising naturally into soft dissipating smoke)
      */}
      <div
        className="absolute -top-7 -left-1 -right-1 h-8 pointer-events-none overflow-visible"
        style={{
          filter: 'url(#ignis-flame-displacement) drop-shadow(0 -3px 8px rgba(249, 115, 22, 0.9))',
        }}
      >
        <div
          className="w-full h-full"
          style={{
            background: 'linear-gradient(to top, rgba(255, 251, 235, 0.95) 0%, rgba(251, 191, 36, 0.85) 30%, rgba(249, 115, 22, 0.65) 60%, rgba(220, 38, 38, 0.25) 85%, transparent 100%)',
            maskImage: 'linear-gradient(to top, black 25%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to top, black 25%, transparent 100%)',
            borderRadius: '12px 12px 0 0',
            animation: isHovered ? 'ignisFlameTurbulence 2.2s ease-in-out infinite' : 'none',
          }}
        />
      </div>

      {/* 
        3. Bottom Rim Molten Radiance
      */}
      <div
        className="absolute -bottom-2 -left-1 -right-1 h-4 pointer-events-none"
        style={{
          background: 'linear-gradient(to bottom, rgba(251, 191, 36, 0.75) 0%, rgba(249, 115, 22, 0.5) 50%, transparent 100%)',
          filter: 'blur(2px)',
          borderRadius: '0 0 12px 12px',
        }}
      />

      {/* 
        4. Left & Right Flank Soft Flame Ribbons
      */}
      <div
        className="absolute -left-2 top-2 bottom-2 w-2.5 pointer-events-none"
        style={{
          background: 'linear-gradient(to top, rgba(251, 191, 36, 0.7) 0%, rgba(249, 115, 22, 0.6) 60%, rgba(220, 38, 38, 0.2) 90%, transparent 100%)',
          filter: 'blur(1.5px)',
        }}
      />
      <div
        className="absolute -right-2 top-2 bottom-2 w-2.5 pointer-events-none"
        style={{
          background: 'linear-gradient(to top, rgba(251, 191, 36, 0.7) 0%, rgba(249, 115, 22, 0.6) 60%, rgba(220, 38, 38, 0.2) 90%, transparent 100%)',
          filter: 'blur(1.5px)',
        }}
      />

      {/* 
        5. Floating Ember Sparks (Tàn tro nóng bay nhẹ lên trên)
      */}
      {isHovered && (
        <div className="absolute -top-7 left-0 right-0 h-6 overflow-visible pointer-events-none">
          <span className="absolute left-[25%] top-2 w-1 h-1 rounded-full bg-[#FEF08A] shadow-[0_0_6px_#F97316] animate-ping" style={{ animationDuration: '1.4s' }} />
          <span className="absolute left-[52%] top-0.5 w-1.5 h-1.5 rounded-full bg-[#FBBF24] shadow-[0_0_8px_#F97316] animate-ping" style={{ animationDuration: '1.8s', animationDelay: '0.4s' }} />
          <span className="absolute left-[78%] top-3 w-1 h-1 rounded-full bg-[#F97316] shadow-[0_0_6px_#EA580C] animate-ping" style={{ animationDuration: '1.6s', animationDelay: '0.8s' }} />
        </div>
      )}
    </div>
  );
};
