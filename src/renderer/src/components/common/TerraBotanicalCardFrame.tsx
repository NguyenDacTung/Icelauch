import React from 'react';
import { useTheme } from '../../hooks/useTheme';

interface TerraBotanicalCardFrameProps {
  isHovered?: boolean;
  isFavorite?: boolean;
}

export const TerraBotanicalCardFrame: React.FC<TerraBotanicalCardFrameProps> = ({
  isHovered = false,
  isFavorite = false,
}) => {
  const { theme } = useTheme();

  if (theme !== 'terra') return null;

  const active = isFavorite;

  return (
    <div
      className="absolute inset-0 pointer-events-none z-20 overflow-visible select-none"
      aria-hidden="true"
    >
      {/* 
        1. TOP-LEFT CORNER VINE & EMBEDDED BUDS
        Hugs the 12px rounded corner and travels along Top edge (x: 12 -> 65, y: 1) and Left edge (y: 12 -> 65, x: 1).
        Outward reach is capped at 3px max, guaranteeing Zero Overlap between shelf cards.
      */}
      <svg
        className="absolute -top-1 -left-1 w-[72px] h-[72px] overflow-visible"
        viewBox="0 0 72 72"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Static Subtle Resting Buds (Visible when not favorited) */}
        {!active && (
          <g className={`transition-opacity duration-300 ${isHovered ? 'opacity-70' : 'opacity-40'}`}>
            <circle cx="12" cy="2" r="2" fill="#4D7C0F" />
            <circle cx="2" cy="12" r="2" fill="#4D7C0F" />
            <path d="M12 2C15 1.5 17 3 18 2" stroke="#4D7C0F" strokeWidth="1" strokeLinecap="round" />
            <path d="M2 12C1.5 15 3 17 2 18" stroke="#4D7C0F" strokeWidth="1" strokeLinecap="round" />
          </g>
        )}

        {/* Dynamic Growing Vines (Active when Favorited) */}
        <g className={`transition-opacity duration-300 ${active ? 'opacity-100' : 'opacity-0'}`}>
          {/* Top Edge Creeping Vine */}
          <path
            d="M 2 12 C 2 6 6 2 12 2 C 24 1.5 35 3.5 48 1.8 C 55 1.2 62 2.5 68 1.5"
            stroke="#65A30D"
            strokeWidth="1.8"
            strokeLinecap="round"
            style={{
              strokeDasharray: 90,
              strokeDashoffset: active ? 0 : 90,
              transition: 'stroke-dashoffset 0.65s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          />

          {/* Left Edge Creeping Vine */}
          <path
            d="M 12 2 C 6 2 2 6 2 12 C 1.5 24 3.5 35 1.8 48 C 1.2 55 2.5 62 1.5 68"
            stroke="#65A30D"
            strokeWidth="1.8"
            strokeLinecap="round"
            style={{
              strokeDasharray: 90,
              strokeDashoffset: active ? 0 : 90,
              transition: 'stroke-dashoffset 0.65s cubic-bezier(0.16, 1, 0.3, 1) 0.05s',
            }}
          />

          {/* Leaf 1 (Top edge - near corner) */}
          <g
            style={{
              transformOrigin: '22px 2px',
              transform: active ? 'scale(1)' : 'scale(0)',
              transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) 0.15s',
            }}
          >
            <path
              d="M 22 2 C 22 -3 27 -4 28 0 C 26 2 24 2.5 22 2 Z"
              fill="#84CC16"
              stroke="#4D7C0F"
              strokeWidth="0.8"
            />
          </g>

          {/* Leaf 2 (Top edge - mid branch) */}
          <g
            style={{
              transformOrigin: '42px 2px',
              transform: active ? 'scale(1)' : 'scale(0)',
              transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) 0.28s',
            }}
          >
            <path
              d="M 42 2 C 43 5 48 5 49 2 C 47 1 44 1 42 2 Z"
              fill="#65A30D"
              stroke="#365314"
              strokeWidth="0.8"
            />
            <circle cx="58" cy="2" r="1.5" fill="#A3E635" />
          </g>

          {/* Leaf 3 (Left edge - near corner) */}
          <g
            style={{
              transformOrigin: '2px 22px',
              transform: active ? 'scale(1)' : 'scale(0)',
              transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) 0.18s',
            }}
          >
            <path
              d="M 2 22 C -3 22 -4 27 0 28 C 2 26 2.5 24 2 22 Z"
              fill="#84CC16"
              stroke="#4D7C0F"
              strokeWidth="0.8"
            />
          </g>

          {/* Leaf 4 (Left edge - mid branch) */}
          <g
            style={{
              transformOrigin: '2px 42px',
              transform: active ? 'scale(1)' : 'scale(0)',
              transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) 0.32s',
            }}
          >
            <path
              d="M 2 42 C 5 43 5 48 2 49 C 1 47 1 44 2 42 Z"
              fill="#65A30D"
              stroke="#365314"
              strokeWidth="0.8"
            />
            <circle cx="2" cy="58" r="1.5" fill="#A3E635" />
          </g>
        </g>
      </svg>

      {/* 
        2. BOTTOM-RIGHT CORNER VINE & EMBEDDED BUDS
        Hugs the 12px rounded corner and travels along Bottom edge (x: 58 -> 8, y: 70) and Right edge (y: 58 -> 8, x: 70).
        Keeps Top-Right corner clean for the 3-dot menu and library badges.
      */}
      <svg
        className="absolute -bottom-1 -right-1 w-[72px] h-[72px] overflow-visible"
        viewBox="0 0 72 72"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Static Subtle Resting Buds (Visible when not favorited) */}
        {!active && (
          <g className={`transition-opacity duration-300 ${isHovered ? 'opacity-70' : 'opacity-40'}`}>
            <circle cx="60" cy="70" r="2" fill="#4D7C0F" />
            <circle cx="70" cy="60" r="2" fill="#4D7C0F" />
            <path d="M60 70C57 70.5 55 69 54 70" stroke="#4D7C0F" strokeWidth="1" strokeLinecap="round" />
            <path d="M70 60C70.5 57 69 55 70 54" stroke="#4D7C0F" strokeWidth="1" strokeLinecap="round" />
          </g>
        )}

        {/* Dynamic Growing Vines (Active when Favorited) */}
        <g className={`transition-opacity duration-300 ${active ? 'opacity-100' : 'opacity-0'}`}>
          {/* Bottom Edge Creeping Vine */}
          <path
            d="M 70 60 C 70 66 66 70 60 70 C 48 70.5 37 68.5 24 70.2 C 17 70.8 10 69.5 4 70.5"
            stroke="#65A30D"
            strokeWidth="1.8"
            strokeLinecap="round"
            style={{
              strokeDasharray: 90,
              strokeDashoffset: active ? 0 : 90,
              transition: 'stroke-dashoffset 0.65s cubic-bezier(0.16, 1, 0.3, 1) 0.1s',
            }}
          />

          {/* Right Edge Creeping Vine */}
          <path
            d="M 60 70 C 66 70 70 66 70 60 C 70.5 48 68.5 37 70.2 24 C 70.8 17 69.5 10 70.5 4"
            stroke="#65A30D"
            strokeWidth="1.8"
            strokeLinecap="round"
            style={{
              strokeDasharray: 90,
              strokeDashoffset: active ? 0 : 90,
              transition: 'stroke-dashoffset 0.65s cubic-bezier(0.16, 1, 0.3, 1) 0.15s',
            }}
          />

          {/* Leaf 1 (Bottom edge - near corner) */}
          <g
            style={{
              transformOrigin: '50px 70px',
              transform: active ? 'scale(1)' : 'scale(0)',
              transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) 0.22s',
            }}
          >
            <path
              d="M 50 70 C 50 75 45 76 44 72 C 46 70 48 69.5 50 70 Z"
              fill="#84CC16"
              stroke="#4D7C0F"
              strokeWidth="0.8"
            />
          </g>

          {/* Leaf 2 (Bottom edge - mid branch) */}
          <g
            style={{
              transformOrigin: '30px 70px',
              transform: active ? 'scale(1)' : 'scale(0)',
              transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) 0.35s',
            }}
          >
            <path
              d="M 30 70 C 29 67 24 67 23 70 C 25 71 28 71 30 70 Z"
              fill="#65A30D"
              stroke="#365314"
              strokeWidth="0.8"
            />
            <circle cx="14" cy="70" r="1.5" fill="#A3E635" />
          </g>

          {/* Leaf 3 (Right edge - near corner) */}
          <g
            style={{
              transformOrigin: '70px 50px',
              transform: active ? 'scale(1)' : 'scale(0)',
              transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) 0.25s',
            }}
          >
            <path
              d="M 70 50 C 75 50 76 45 72 44 C 70 46 69.5 48 70 50 Z"
              fill="#84CC16"
              stroke="#4D7C0F"
              strokeWidth="0.8"
            />
          </g>

          {/* Leaf 4 (Right edge - mid branch) */}
          <g
            style={{
              transformOrigin: '70px 30px',
              transform: active ? 'scale(1)' : 'scale(0)',
              transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) 0.38s',
            }}
          >
            <path
              d="M 70 30 C 67 29 67 24 70 23 C 71 25 71 28 70 30 Z"
              fill="#65A30D"
              stroke="#365314"
              strokeWidth="0.8"
            />
            <circle cx="70" cy="14" r="1.5" fill="#A3E635" />
          </g>
        </g>
      </svg>
    </div>
  );
};
