import React, { useState, useEffect } from 'react';
import {
  X,
  Play,
  RotateCcw,
  Sparkles,
  Film,
  Music,
  Disc,
  Radio,
  Clock,
  Tag,
  Dices
} from 'lucide-react';
import type { MediaItem } from '../../types';
import { sfx } from '../../utils/sfx';

interface SurpriseMediaModalProps {
  isOpen: boolean;
  onClose: () => void;
  mediaList: MediaItem[];
  type: 'movie' | 'music' | 'podcast';
  onPlay: (item: MediaItem) => void;
}

export const SurpriseMediaModal: React.FC<SurpriseMediaModalProps> = ({
  isOpen,
  onClose,
  mediaList,
  type,
  onPlay,
}) => {
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);
  const [isRolling, setIsRolling] = useState(false);

  // Eligible pool of media (not hidden)
  const eligibleItems = mediaList.filter((m) => !m.hidden);

  const rollRandom = () => {
    if (eligibleItems.length === 0) return;
    setIsRolling(true);
    sfx.playClick();

    let count = 0;
    const interval = setInterval(() => {
      const randIdx = Math.floor(Math.random() * eligibleItems.length);
      setSelectedItem(eligibleItems[randIdx]);
      count++;
      if (count >= 12) {
        clearInterval(interval);
        setIsRolling(false);
        sfx.playSuccess();
      }
    }, 70);
  };

  useEffect(() => {
    if (isOpen) {
      rollRandom();
    } else {
      setSelectedItem(null);
    }
  }, [isOpen, type]);

  if (!isOpen) return null;

  const titleText =
    type === 'movie'
      ? 'Hôm Nay Xem Gì?'
      : type === 'music'
      ? 'Hôm Nay Nghe Gì? (Nhạc)'
      : 'Hôm Nay Nghe Gì? (Audio)';

  const subText =
    type === 'movie'
      ? 'Vòng quay ngẫu nhiên chọn một bộ phim hay cho bạn'
      : type === 'music'
      ? 'Gợi ý ngẫu nhiên một giai điệu thư giãn tuyệt vời'
      : 'Gợi ý ngẫu nhiên một tập podcast / audio truyền cảm hứng';

  const defaultIcon =
    type === 'movie' ? (
      <Film className="w-16 h-16 text-amber-400" />
    ) : type === 'music' ? (
      <Music className="w-16 h-16 text-cyan-400" />
    ) : (
      <Radio className="w-16 h-16 text-purple-400" />
    );

  const coverUrl = selectedItem?.coverPath
    ? selectedItem.coverPath.startsWith('http')
      ? selectedItem.coverPath
      : `file://${selectedItem.coverPath}`
    : '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in select-none">
      <div className="relative w-full max-w-lg bg-gradient-to-b from-[#181B24] to-[#0F1117] border border-white/15 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-center overflow-hidden">
        {/* Glow ambient background */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Title */}
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase tracking-wider">
            <Dices className="w-4 h-4 animate-bounce" />
            <span>{titleText}</span>
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <p className="text-xs text-ice-muted">{subText}</p>
        </div>

        {/* Result Card */}
        {selectedItem ? (
          <div
            className={`flex flex-col items-center gap-4 transition-all duration-300 ${
              isRolling ? 'scale-95 opacity-80 blur-[1px]' : 'scale-100 opacity-100'
            }`}
          >
            {/* Poster / Thumbnail */}
            <div className="relative w-44 aspect-[2/3] rounded-2xl overflow-hidden bg-black/70 border-2 border-amber-400/80 shadow-2xl shadow-amber-500/20 flex items-center justify-center">
              {coverUrl ? (
                <img
                  src={coverUrl}
                  alt={selectedItem.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-4">
                  {defaultIcon}
                </div>
              )}
              {selectedItem.duration && (
                <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/80 text-[10px] text-white font-mono border border-white/10">
                  {Math.floor(selectedItem.duration / 60)} phút
                </div>
              )}
            </div>

            {/* Metadata */}
            <div className="w-full space-y-1.5 px-2">
              <h3 className="text-lg font-black text-white truncate">
                {selectedItem.title}
              </h3>
              <p className="text-xs text-amber-300/80 font-medium truncate">
                {selectedItem.artist || selectedItem.category || 'Nhiều nghệ sĩ'}
              </p>
              {selectedItem.tags && selectedItem.tags.length > 0 && (
                <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
                  {selectedItem.tags.slice(0, 3).map((t) => (
                    <span
                      key={t}
                      className="px-2 py-0.5 rounded-md bg-white/5 text-[10px] font-semibold text-white/70 border border-white/10"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="py-12 text-center text-ice-muted text-sm">
            Chưa có nội dung nào trong kho thể loại này
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            type="button"
            disabled={isRolling || !selectedItem}
            onClick={rollRandom}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold border border-white/15 transition-all active:scale-95 disabled:opacity-50"
          >
            <RotateCcw className={`w-4 h-4 ${isRolling ? 'animate-spin' : ''}`} />
            <span>Đổi Mục Khác</span>
          </button>

          <button
            type="button"
            disabled={isRolling || !selectedItem}
            onClick={() => {
              if (selectedItem) {
                sfx.playLaunch();
                onClose();
                onPlay(selectedItem);
              }
            }}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black text-xs font-black shadow-lg shadow-amber-500/25 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
          >
            <Play className="w-4 h-4 fill-black ml-0.5" />
            <span>PHÁT NGAY</span>
          </button>
        </div>
      </div>
    </div>
  );
};
