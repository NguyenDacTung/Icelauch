import React, { useState } from 'react';
import {
  ArrowLeft,
  Monitor,
  Bookmark,
  BookmarkCheck,
  FolderOpen,
  HardDrive,
  Clock,
  Sparkles,
  ExternalLink,
  Volume2,
  VolumeX,
  CheckCircle2,
  Image as ImageIcon,
} from 'lucide-react';
import type { Game, AppActionButton } from '../../types';
import { parseMediaUrl } from '../../utils/mediaUrl';
import { GameActionsWidget } from '../common/GameActionsWidget';
import { HorizontalScroller } from '../common/HorizontalScroller';

interface MobileGameDetailViewProps {
  game: Game;
  isAdmin: boolean;
  onBack: () => void;
  onToggleLibrary: (id: string) => void;
  onIncompatibleClick: (game: Game) => void;
  onOpenFolder?: (id: string) => void;
  globalActionButtons?: AppActionButton[];
}

export const MobileGameDetailView: React.FC<MobileGameDetailViewProps> = ({
  game,
  isAdmin,
  onBack,
  onToggleLibrary,
  onIncompatibleClick,
  onOpenFolder,
  globalActionButtons = [],
}) => {
  const [isMuted, setIsMuted] = useState(true);
  const [showFullDesc, setShowFullDesc] = useState(false);
  const [selectedScreenshot, setSelectedScreenshot] = useState<string | null>(null);

  // Extract YouTube ID if trailer exists
  const parsedTrailer = game.trailerUrl ? parseMediaUrl(game.trailerUrl) : null;
  const youtubeVideoId = parsedTrailer?.kind === 'youtube' ? parsedTrailer.id : null;

  const formatBytes = (bytes?: number) => {
    if (!bytes || bytes === 0) return 'Chưa rõ';
    const mb = bytes / (1024 * 1024);
    if (mb > 1024) return `${(mb / 1024).toFixed(1)} GB`;
    return `${Math.round(mb)} MB`;
  };

  const screenshots = game.screenshots && game.screenshots.length > 0
    ? game.screenshots
    : [game.bannerPath, game.coverPath].filter(Boolean) as string[];

  return (
    <div className="flex-1 w-full h-full flex flex-col bg-[#0A0C10] select-none overflow-y-auto no-scrollbar">
      {/* 1. TOP STICKY HERO 16:9 (TRAILER HOẶC BANNER) */}
      <div className="sticky top-0 z-30 w-full aspect-video min-h-[210px] shrink-0 bg-black shadow-2xl overflow-hidden relative">
        {/* Floating Back Button */}
        <button
          type="button"
          onClick={onBack}
          className="absolute top-2.5 left-2.5 z-40 w-8 h-8 rounded-full bg-black/75 hover:bg-black text-white backdrop-blur-md border border-white/20 flex items-center justify-center shadow-lg active:scale-95 transition-all"
          title="Quay lại danh sách"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        {/* Video Trailer hoặc Banner Image */}
        {youtubeVideoId ? (
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${youtubeVideoId}?autoplay=1&mute=${isMuted ? 1 : 0}&rel=0&playsinline=1&enablejsapi=1`}
            title={game.name}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="w-full h-full border-0 absolute inset-0"
          />
        ) : (
          <img
            src={selectedScreenshot || game.bannerPath || game.coverPath || ''}
            alt={game.name}
            className="w-full h-full object-cover absolute inset-0"
          />
        )}

        {/* Floating Sound Toggle (for trailer) */}
        {youtubeVideoId && (
          <div className="absolute top-2.5 right-2.5 z-40 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsMuted(!isMuted)}
              className="p-1.5 rounded-full bg-black/75 hover:bg-black text-white backdrop-blur-md border border-white/20 shadow-md"
              title={isMuted ? 'Bật âm thanh' : 'Tắt tiếng'}
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5 text-white/80" /> : <Volume2 className="w-3.5 h-3.5 text-ice-accent" />}
            </button>
            <button
              type="button"
              onClick={() => window.open(game.trailerUrl, '_blank')}
              className="p-1.5 rounded-full bg-black/75 hover:bg-black text-white backdrop-blur-md border border-white/20 shadow-md"
              title="Mở xem trên YouTube"
            >
              <ExternalLink className="w-3.5 h-3.5 text-red-400" />
            </button>
          </div>
        )}
      </div>

      {/* 2. BODY CONTENT (TỐI ƯU DỌC 1 CỘT KHÔNG CHỒNG CHÉO) */}
      <div className="p-3.5 space-y-3.5 flex-1">
        {/* Title & Tags */}
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-ice-accent/20 text-ice-accent border border-ice-accent/30">
              {game.genre || 'Game PC'}
            </span>
            {game.status === 'ready' && (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>Sẵn sàng chơi</span>
              </span>
            )}
          </div>

          <h1 className="text-lg font-black text-white leading-tight">
            {game.name}
          </h1>
        </div>

        {/* Action CTAs: Incompatible PC Notice + Bookmark Button */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onIncompatibleClick(game)}
            className="flex-1 h-11 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold tracking-wider uppercase flex items-center justify-center gap-2 shadow-lg transition-all active:scale-98"
          >
            <Monitor className="w-4 h-4 text-amber-400" />
            <span>🚫 Chỉ hỗ trợ Windows PC</span>
          </button>

          <button
            type="button"
            onClick={() => onToggleLibrary(game.id)}
            className={`w-11 h-11 rounded-xl border flex items-center justify-center transition-all shrink-0 active:scale-95 ${
              game.inLibrary
                ? 'bg-ice-accent/25 border-ice-accent text-ice-accent shadow-md shadow-blue-500/20'
                : 'bg-white/5 border-white/10 text-white/80 hover:text-white hover:bg-white/10'
            }`}
            title={game.inLibrary ? 'Đã lưu trong thư viện' : 'Lưu vào thư viện'}
          >
            {game.inLibrary ? <BookmarkCheck className="w-5 h-5 text-ice-accent" /> : <Bookmark className="w-5 h-5" />}
          </button>
        </div>

        {/* Description */}
        {game.description && (
          <div className="p-3 rounded-xl bg-[#14171F] border border-ice-border/70 text-xs text-ice-subtext leading-relaxed space-y-1">
            <span className="text-[11px] font-bold text-white uppercase tracking-wider block">
              Mô tả trò chơi
            </span>
            <p className={showFullDesc ? '' : 'line-clamp-3'}>
              {game.description}
            </p>
            {game.description.length > 120 && (
              <button
                type="button"
                onClick={() => setShowFullDesc(!showFullDesc)}
                className="text-[11px] text-ice-accent font-semibold"
              >
                {showFullDesc ? 'Thu gọn' : 'Xem thêm...'}
              </button>
            )}
          </div>
        )}

        {/* Action Buttons / Requirements (Steam, Discord, Hướng dẫn chơi) */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-bold text-white uppercase tracking-wider block">
            Yêu cầu & Nút khởi chạy nhanh
          </span>
          <GameActionsWidget
            requirementsText={game.requirementsText}
            buttons={game.actionButtonIds && game.actionButtonIds.length > 0
              ? globalActionButtons.filter((b) => game.actionButtonIds?.includes(b.id))
              : globalActionButtons}
          />
        </div>

        {/* Technical Specs Card */}
        <div className="p-3 rounded-xl bg-[#14171F] border border-ice-border/70 text-xs text-ice-subtext space-y-2">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5 text-ice-accent" />
              <span>Dung lượng cài đặt:</span>
            </span>
            <span className="text-white font-bold">{formatBytes(game.expectedSize)}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Chơi lần cuối:</span>
            </span>
            <span className="text-white font-medium">{game.lastPlayed || 'Chưa mở'}</span>
          </div>

          {game.status === 'ready' && onOpenFolder && (
            <button
              type="button"
              onClick={() => onOpenFolder(game.id)}
              className="w-full mt-1 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-white text-xs font-semibold flex items-center justify-center gap-1.5 border border-white/10"
            >
              <FolderOpen className="w-3.5 h-3.5" />
              <span>Mở thư mục cài đặt</span>
            </button>
          )}
        </div>

        {/* Screenshots Filmstrip Carousel */}
        {screenshots.length > 0 && (
          <div className="space-y-2 pt-1">
            <span className="text-[11px] font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-ice-accent" />
              <span>Ảnh chụp màn hình</span>
            </span>

            <HorizontalScroller className="gap-2" scrollStep={180}>
              {screenshots.map((img, idx) => (
                <div
                  key={idx}
                  onClick={() => setSelectedScreenshot(img)}
                  className="w-36 aspect-video rounded-xl overflow-hidden bg-black border border-ice-border/80 shrink-0 cursor-pointer shadow-md hover:border-ice-accent transition-all"
                >
                  <img src={img} alt={`Screenshot ${idx + 1}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </HorizontalScroller>
          </div>
        )}
      </div>
    </div>
  );
};
