import React from 'react';

interface TerraAppleFavoriteIconProps {
  isFavorite: boolean;
  className?: string;
  size?: number;
}

export const TerraAppleFavoriteIcon: React.FC<TerraAppleFavoriteIconProps> = ({
  isFavorite,
  className = '',
  size = 16,
}) => {
  // Shared geometry path coordinates ensure 100% pixel-perfect match between outlined and filled states
  const appleBodyPath =
    'M12 5.8C10.5 4.2 7.8 4.2 5.8 5.8C3.5 7.7 3.2 11.2 4.6 14.6C5.9 17.6 8.5 21 11.2 21C11.5 21 11.8 20.8 12 20.8C12.2 20.8 12.5 21 12.8 21C15.5 21 18.1 17.6 19.4 14.6C20.8 11.2 20.5 7.7 18.2 5.8C16.2 4.2 13.5 4.2 12 5.8Z';
  const stemPath = 'M12 2C12.2 3.6 13.5 4.8 14.8 5.2';
  const leafPath = 'M12.2 3.2C10.8 1.8 8.6 2.2 8 3.2C9 4.6 11.2 4.2 12.2 3.2Z';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 transition-transform duration-200 active:scale-90 ${className}`}
      aria-hidden="true"
    >
      {/* 1. Leaf */}
      <path
        d={leafPath}
        fill={isFavorite ? '#65A30D' : 'none'}
        stroke={isFavorite ? '#4D7C0F' : '#7C5332'}
        strokeWidth={isFavorite ? '1.2' : '1.8'}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* 2. Stem */}
      <path
        d={stemPath}
        fill="none"
        stroke={isFavorite ? '#5C4033' : '#7C5332'}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* 3. Apple Body */}
      <path
        d={appleBodyPath}
        fill={isFavorite ? '#DC2626' : 'none'}
        stroke={isFavorite ? '#B91C1C' : '#7C5332'}
        strokeWidth={isFavorite ? '1.2' : '1.8'}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* 4. Subtle Glossy Specular Highlight (Only when ripe red) */}
      {isFavorite && (
        <path
          d="M7 8C6 9.5 6 12 7 14"
          stroke="rgba(255, 255, 255, 0.45)"
          strokeWidth="1.2"
          strokeLinecap="round"
        />
      )}
    </svg>
  );
};
