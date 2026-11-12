import React, { useState } from 'react';
import {
  X,
  Maximize2,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Film
} from 'lucide-react';
import type { MediaItem } from '../../types';

interface FloatingMiniPlayerProps {
  media: MediaItem | null;
  proxyPort?: number;
  onClose: () => void;
  onMaximize: (media: MediaItem) => void;
}

export const FloatingMiniPlayer: React.FC<FloatingMiniPlayerProps> = ({
  media,
  proxyPort = 18989,
  onClose,
  onMaximize,
}) => {
  if (!media) return null;

  const [isMuted, setIsMuted] = useState(false);

  const getEmbedUrl = () => {
    if (!media.link) return '';
    // YouTube
    const ytMatch = media.link.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    if (ytMatch) {
      return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&mute=${isMuted ? 1 : 0}&playsinline=1`;
    }
    // Google Drive
    const driveMatch = media.link.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (driveMatch) {
      return `http://127.0.0.1:${proxyPort}/stream/gdrive/${driveMatch[1]}?type=mp4`;
    }
    return media.link;
  };

  const isYouTube = Boolean(media.link.match(/(?:youtu\.be\/|youtube\.com)/));

  return (
    <div className="fixed bottom-6 right-6 z-40 w-80 h-48 rounded-2xl bg-black border-2 border-ice-accent/50 shadow-[0_10px_35px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col animate-scale-up group">
      {/* Top Overlay Controls */}
      <div className="absolute top-0 inset-x-0 z-20 p-2 bg-gradient-to-b from-black/80 to-transparent flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
        <span className="text-[11px] font-bold text-white truncate max-w-[180px] drop-shadow">
          {media.title}
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onMaximize(media)}
            className="p-1 rounded bg-black/60 hover:bg-white/20 text-white transition-colors"
            title="Mở toàn màn hình"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded bg-black/60 hover:bg-red-500/50 text-white transition-colors"
            title="Đóng video thu nhỏ"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Video Content */}
      <div className="flex-1 w-full h-full bg-black">
        {isYouTube ? (
          <iframe
            src={getEmbedUrl()}
            className="w-full h-full border-0 pointer-events-auto"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <video
            src={getEmbedUrl()}
            autoPlay
            controls
            muted={isMuted}
            className="w-full h-full object-contain"
          />
        )}
      </div>
    </div>
  );
};
