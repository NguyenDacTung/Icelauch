import React from 'react';

interface TerraLadybugThumbProps {
  className?: string;
  size?: number;
}

export const TerraLadybugThumb: React.FC<TerraLadybugThumbProps> = ({
  className = '',
  size = 18,
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)] select-none pointer-events-none transition-transform duration-100 ${className}`}
      aria-hidden="true"
    >
      {/* 1. Black Head facing RIGHT (towards progress direction) */}
      <path
        d="M17 8C19.5 9.5 21 11 21 12C21 13 19.5 14.5 17 16Z"
        fill="#161310"
      />
      {/* Tiny White Eye dots */}
      <circle cx="18.5" cy="10" r="0.75" fill="#FFFFFF" />
      <circle cx="18.5" cy="14" r="0.75" fill="#FFFFFF" />

      {/* 2. Round Red Shell Body */}
      <ellipse
        cx="11"
        cy="12"
        rx="7.5"
        ry="7"
        fill="#DC2626"
        stroke="#991B1B"
        strokeWidth="0.8"
      />

      {/* 3. Wing Seam Line down middle (Horizontal from back to head) */}
      <line
        x1="3.5"
        y1="12"
        x2="17.5"
        y2="12"
        stroke="#161310"
        strokeWidth="1.2"
        strokeLinecap="round"
      />

      {/* 4. Minimal Geometric Black Spots (6 spots distributed on upper and lower wings) */}
      {/* Upper wing spots */}
      <circle cx="8" cy="8" r="1.3" fill="#161310" />
      <circle cx="13" cy="8" r="1.3" fill="#161310" />
      <circle cx="10.5" cy="5.8" r="1.1" fill="#161310" />

      {/* Lower wing spots */}
      <circle cx="8" cy="16" r="1.3" fill="#161310" />
      <circle cx="13" cy="16" r="1.3" fill="#161310" />
      <circle cx="10.5" cy="18.2" r="1.1" fill="#161310" />

      {/* 5. Clean Specular Highlight on Shell */}
      <path
        d="M7 6.5C9 5.8 12 6 13.5 6.5"
        stroke="rgba(255, 255, 255, 0.55)"
        strokeWidth="0.9"
        strokeLinecap="round"
      />
    </svg>
  );
};
