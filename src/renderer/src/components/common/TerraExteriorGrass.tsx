import React from 'react';
import { useTheme } from '../../hooks/useTheme';

interface TerraExteriorGrassProps {
  progressPercent: number; // 0 to 100
}

export const TerraExteriorGrass: React.FC<TerraExteriorGrassProps> = ({ progressPercent }) => {
  const { theme } = useTheme();

  if (theme !== 'terra') return null;

  // Keep a minimal 2.5% sprout at left edge even when paused at 0:00
  const clamped = Math.max(2.5, Math.min(100, progressPercent));

  // Botanical vegetation patterns: 6 diverse organic meadow clusters
  const clusters = [
    // 1. Slender arching meadow grass pair (left and right curved blades)
    {
      sway: 'terra-sway-slow',
      nodes: (
        <g>
          {/* Left curve blade */}
          <path
            d="M 2 18 C 3 11 1 5 0 2 C 2 5 4 10 5 18 Z"
            fill="url(#terraGrassGrad)"
          />
          {/* Main tall center-right arching blade */}
          <path
            d="M 5 18 C 6 9 10 3 14 0.5 C 12 5 10 11 8 18 Z"
            fill="url(#terraGrassGrad)"
          />
          {/* Tiny accent blade */}
          <path
            d="M 9 18 C 11 13 14 8 16 6 C 14 10 13 14 12 18 Z"
            fill="url(#terraFernGrad)"
          />
        </g>
      ),
    },
    // 2. Fern leaflet frond
    {
      sway: 'terra-sway-mid',
      nodes: (
        <g>
          {/* Central curving stem */}
          <path
            d="M 3 18 C 5 12 8 6 12 3"
            stroke="url(#terraFernGrad)"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
          {/* Leaflets */}
          <ellipse cx="6" cy="13" rx="2.5" ry="1.2" transform="rotate(-25 6 13)" fill="#65A30D" />
          <ellipse cx="8" cy="9" rx="2.2" ry="1.1" transform="rotate(30 8 9)" fill="#84CC16" />
          <ellipse cx="10" cy="5.5" rx="1.8" ry="0.9" transform="rotate(-20 10 5.5)" fill="#A3E635" />
          <circle cx="12" cy="3" r="1.2" fill="#84CC16" />
        </g>
      ),
    },
    // 3. Tall wavy grass with tiny blooming wildflower
    {
      sway: 'terra-sway-fast',
      nodes: (
        <g>
          {/* Arching blade */}
          <path
            d="M 2 18 C 3 10 7 4 10 1 C 8 6 7 11 6 18 Z"
            fill="url(#terraGrassGrad)"
          />
          {/* Flower stem */}
          <path
            d="M 8 18 C 9 12 12 8 15 4"
            stroke="#65A30D"
            strokeWidth="1"
            strokeLinecap="round"
          />
          {/* Delicate wildflower bud */}
          <circle cx="15" cy="4" r="1.8" fill="url(#terraFlowerGrad)" />
          <circle cx="15" cy="4" r="0.8" fill="#FFFFFF" opacity="0.8" />
          {/* Side grass blade */}
          <path
            d="M 12 18 C 14 13 18 8 20 5 C 18 10 16 14 15 18 Z"
            fill="url(#terraGrassGrad)"
          />
        </g>
      ),
    },
    // 4. Low dense clover & double S-curve blades
    {
      sway: 'terra-sway-slow',
      nodes: (
        <g>
          {/* Low clover tri-leaf */}
          <circle cx="4" cy="14" r="2.2" fill="#65A30D" />
          <circle cx="7" cy="12.5" r="2.2" fill="#84CC16" />
          <circle cx="6" cy="15.5" r="1.8" fill="#4D7C0F" />
          {/* S-curve blade rising behind clover */}
          <path
            d="M 8 18 C 10 11 8 6 11 2 C 10 6 12 11 11 18 Z"
            fill="url(#terraGrassGrad)"
          />
          <path
            d="M 12 18 C 13 12 17 7 18 3 C 16 8 15 13 14 18 Z"
            fill="url(#terraFernGrad)"
          />
        </g>
      ),
    },
    // 5. Twin arching meadow stems
    {
      sway: 'terra-sway-mid',
      nodes: (
        <g>
          <path
            d="M 3 18 C 4 9 9 3 13 0.8 C 11 6 8 12 7 18 Z"
            fill="url(#terraGrassGrad)"
          />
          <path
            d="M 8 18 C 10 10 15 5 18 2 C 16 7 14 12 12 18 Z"
            fill="url(#terraFernGrad)"
          />
          <circle cx="13" cy="7" r="1.3" fill="url(#terraFlowerGrad)" />
        </g>
      ),
    },
    // 6. Feathered leaflet cluster & whisper grass
    {
      sway: 'terra-sway-slow',
      nodes: (
        <g>
          <path
            d="M 2 18 C 2 10 5 4 8 1.5 C 7 7 6 12 5 18 Z"
            fill="url(#terraGrassGrad)"
          />
          <ellipse cx="9" cy="11" rx="2.2" ry="1" transform="rotate(-30 9 11)" fill="#84CC16" />
          <ellipse cx="11" cy="7" rx="1.8" ry="0.9" transform="rotate(25 11 7)" fill="#A3E635" />
          <path
            d="M 10 18 C 11 12 15 7 19 4 C 17 9 15 13 14 18 Z"
            fill="url(#terraGrassGrad)"
          />
        </g>
      ),
    },
  ];

  return (
    <div
      className="absolute -top-[18px] left-4 right-4 h-5 pointer-events-none select-none overflow-visible z-20"
      aria-hidden="true"
    >
      {/* 
        Expanding Meadow Container:
        Uses a soft linear-gradient mask on the right edge so newly emerging blades fade & bloom smoothly
        as the ladybug progresses, rather than popping up in abrupt sliced chunks.
      */}
      <div
        className="h-full overflow-hidden transition-[width] duration-150 ease-out relative"
        style={{
          width: `${clamped}%`,
          maskImage: 'linear-gradient(to right, black calc(100% - 24px), transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to right, black calc(100% - 24px), transparent 100%)',
        }}
      >
        {/* Continuous organic meadow foliage strip */}
        <div className="w-[1200px] h-full flex items-end">
          <svg className="w-0 h-0 absolute">
            <defs>
              {/* Organic Gradient: Deep rich soil moss at root -> Fresh lime sprout at tip */}
              <linearGradient id="terraGrassGrad" x1="0" y1="1" x2="0" y2="0">
                <stop offset="0%" stopColor="#3F6212" />
                <stop offset="60%" stopColor="#65A30D" />
                <stop offset="100%" stopColor="#84CC16" />
              </linearGradient>

              {/* Fern Leaflet Gradient */}
              <linearGradient id="terraFernGrad" x1="0" y1="1" x2="0" y2="0">
                <stop offset="0%" stopColor="#365314" />
                <stop offset="70%" stopColor="#65A30D" />
                <stop offset="100%" stopColor="#A3E635" />
              </linearGradient>

              {/* Wildflower Petal Gradient */}
              <linearGradient id="terraFlowerGrad" x1="0" y1="1" x2="0" y2="0">
                <stop offset="0%" stopColor="#EAB308" />
                <stop offset="100%" stopColor="#FEF08A" />
              </linearGradient>
            </defs>
          </svg>

          {/* Render repeating varied clusters for realistic meadow appearance */}
          {Array.from({ length: 48 }).map((_, i) => {
            const cluster = clusters[i % clusters.length];
            return (
              <svg
                key={i}
                className={`w-6 h-5 shrink-0 ${cluster.sway}`}
                viewBox="0 0 24 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                {cluster.nodes}
              </svg>
            );
          })}
        </div>

        {/* Dynamic Sprout Head right at the Ladybug's position */}
        <div className="absolute right-0 top-0.5 w-4 h-4.5 -mr-0.5">
          <svg viewBox="0 0 16 18" fill="none" className="w-full h-full terra-sway-fast">
            <path d="M 2 18 C 3 10 8 3 13 0.5 C 10 6 8 12 7 18 Z" fill="url(#terraGrassGrad)" />
            <circle cx="12" cy="3" r="1.6" fill="url(#terraFlowerGrad)" />
          </svg>
        </div>
      </div>
    </div>
  );
};
