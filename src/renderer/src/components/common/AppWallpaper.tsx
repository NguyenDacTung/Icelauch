import React from 'react';
import type { WallpaperConfig } from '../../types';

interface AppWallpaperProps {
  config?: WallpaperConfig;
  lowSpecMode?: boolean;
}

export const AppWallpaper: React.FC<AppWallpaperProps> = ({ config, lowSpecMode = false }) => {
  if (!config || !config.enabled || !config.imagePath) {
    return null;
  }

  // Format image URL
  let bgUrl = config.imagePath;
  if (!bgUrl.startsWith('http://') && !bgUrl.startsWith('https://') && !bgUrl.startsWith('file://')) {
    bgUrl = `file:///${bgUrl.replace(/\\/g, '/')}`;
  }

  const zoom = Math.max(1, Math.min(3, config.zoom ?? 1));
  const blur = lowSpecMode ? 0 : Math.max(0, Math.min(20, config.blur ?? 0));
  const darkness = Math.max(0, Math.min(95, config.darkness ?? 30));

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none">
      {/* Background Image Container with Zoom & Position */}
      <div
        className="absolute inset-0 w-full h-full bg-no-repeat bg-cover transition-all duration-300"
        style={{
          backgroundImage: `url("${bgUrl}")`,
          backgroundPosition: config.position || '50% 50%',
          transform: `scale(${zoom}) translateZ(0)`,
          filter: blur > 0 ? `blur(${blur}px)` : undefined,
          willChange: 'transform, filter',
        }}
      />
      {/* Darkness Tint Overlay */}
      <div
        className="absolute inset-0 transition-opacity duration-300"
        style={{
          backgroundColor: '#07090e',
          opacity: darkness / 100,
        }}
      />
    </div>
  );
};

