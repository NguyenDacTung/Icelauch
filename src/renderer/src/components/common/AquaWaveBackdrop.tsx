import React from 'react';
import { useTheme } from '../../hooks/useTheme';

interface AquaWaveBackdropProps {
  lowSpecMode?: boolean;
}

export const AquaWaveBackdrop: React.FC<AquaWaveBackdropProps> = ({ lowSpecMode = false }) => {
  const { theme } = useTheme();

  if (theme !== 'aqua') return null;

  return (
    <div
      className="fixed inset-0 pointer-events-none select-none overflow-hidden z-0"
      aria-hidden="true"
    >
      {/* 1. Base Gradient Canvas */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#E0F7FA] via-[#E0F2FE] to-[#BAE6FD]" />

      {/* 2. Ambient Sunlight Caustic Glimmer (Subtle Refraction) */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,rgba(255,255,255,0.7)_0%,rgba(186,230,253,0.2)_60%,transparent_100%)] opacity-80" />

      {/* 3. Flowing Wave Layers (GPU Compositor Animated) */}
      {!lowSpecMode && (
        <>
          {/* Deep Slow Wave Layer */}
          <div
            className="absolute -bottom-10 -left-1/2 w-[200%] h-72 opacity-35"
            style={{
              animation: 'aqua-wave-drift-slow 22s ease-in-out infinite',
              willChange: 'transform',
            }}
          >
            <svg
              className="w-full h-full fill-sky-300"
              viewBox="0 0 1440 320"
              preserveAspectRatio="none"
            >
              <path d="M0,160L48,176C96,192,192,224,288,218.7C384,213,480,171,576,165.3C672,160,768,192,864,208C960,224,1056,224,1152,197.3C1248,171,1344,117,1392,90.7L1440,64L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z" />
            </svg>
          </div>

          {/* Middle Translucent Cyan Wave Layer */}
          <div
            className="absolute -bottom-6 -left-1/3 w-[200%] h-60 opacity-40"
            style={{
              animation: 'aqua-wave-drift-fast 16s ease-in-out infinite reverse',
              willChange: 'transform',
            }}
          >
            <svg
              className="w-full h-full fill-cyan-200"
              viewBox="0 0 1440 320"
              preserveAspectRatio="none"
            >
              <path d="M0,192L48,181.3C96,171,192,149,288,160C384,171,480,213,576,224C672,235,768,213,864,186.7C960,160,1056,128,1152,122.7C1248,117,1344,139,1392,149.3L1440,160L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z" />
            </svg>
          </div>

          {/* Foreground Crisp Water Crest (Frosted White-Sky Highlight) */}
          <div
            className="absolute -bottom-2 -left-1/4 w-[180%] h-44 opacity-50"
            style={{
              animation: 'aqua-wave-drift-slow 12s ease-in-out infinite',
              willChange: 'transform',
            }}
          >
            <svg
              className="w-full h-full fill-white"
              viewBox="0 0 1440 320"
              preserveAspectRatio="none"
            >
              <path d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,128C672,128,768,160,864,181.3C960,203,1056,213,1152,197.3C1248,181,1344,139,1392,117.3L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z" />
            </svg>
          </div>
        </>
      )}
    </div>
  );
};
