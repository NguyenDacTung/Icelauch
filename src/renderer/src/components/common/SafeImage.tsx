import React, { useState } from 'react';
import { Gamepad2, Film, Music, Mic, Image as ImageIcon } from 'lucide-react';

interface SafeImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackType?: 'game' | 'video' | 'audio' | 'podcast' | 'general';
  title?: string;
}

export const SafeImage: React.FC<SafeImageProps> = ({
  src,
  alt = '',
  className = '',
  fallbackType = 'general',
  title,
  ...rest
}) => {
  const [hasError, setHasError] = useState(false);

  // Filter out invalid Windows local paths on mobile/web
  const isWindowsLocalPath = typeof src === 'string' && /^(?:[a-zA-Z]:[\\/]|atom:\/\/)/i.test(src);
  const isCapacitorOrWeb = typeof window !== 'undefined' && !(window as any).electron;

  const isInvalid = !src || hasError || (isCapacitorOrWeb && isWindowsLocalPath);

  if (isInvalid) {
    const IconComponent =
      fallbackType === 'game'
        ? Gamepad2
        : fallbackType === 'video'
        ? Film
        : fallbackType === 'audio'
        ? Music
        : fallbackType === 'podcast'
        ? Mic
        : ImageIcon;

    return (
      <div
        className={`w-full h-full flex flex-col items-center justify-center p-3 text-center bg-gradient-to-br from-[#192233] via-[#0E131E] to-[#080B10] border border-white/5 select-none relative overflow-hidden ${className}`}
      >
        <div className="absolute inset-0 bg-blue-500/5 backdrop-blur-[1px]" />
        <div className="relative z-10 flex flex-col items-center gap-1.5 max-w-[90%]">
          <div className="w-9 h-9 rounded-xl bg-ice-accent/15 border border-ice-accent/30 flex items-center justify-center text-ice-accent shadow-sm">
            <IconComponent className="w-5 h-5" />
          </div>
          {title ? (
            <span className="text-[11px] font-bold text-white/90 line-clamp-2 leading-tight">
              {title}
            </span>
          ) : alt ? (
            <span className="text-[11px] font-bold text-white/90 line-clamp-2 leading-tight">
              {alt}
            </span>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setHasError(true)}
      {...rest}
    />
  );
};

