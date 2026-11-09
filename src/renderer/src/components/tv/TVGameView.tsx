import React, { useState, useEffect } from 'react';
import {
  Gamepad2,
  Monitor,
  Sparkles,
  Info,
  Clock,
  HardDrive,
  CheckCircle2,
  X,
  Volume2,
  VolumeX,
  ChevronLeft,
  ChevronRight,
  Bookmark,
  Flame,
  Tag,
  Play
} from 'lucide-react';
import type { Game, SectionBannerSettings } from '../../types';
import { resolveBannerItems } from '../../utils/bannerResolver';
import { parseMediaUrl } from '../../utils/mediaUrl';
import { sfx } from '../../utils/sfx';

interface TVGameViewProps {
  games: Game[];
  bannerSettings?: SectionBannerSettings;
  onSelectGame: (game: Game) => void;
  onIncompatibleClick: (game: Game) => void;
  onToggleLibrary?: (id: string) => void;
}

export const TVGameView: React.FC<TVGameViewProps> = ({
  games,
  bannerSettings,
  onSelectGame,
  onIncompatibleClick,
  onToggleLibrary,
}) => {
  const [heroIndex, setHeroIndex] = useState(0);
  const [selectedGameModal, setSelectedGameModal] = useState<Game | null>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [showTrailerPreview, setShowTrailerPreview] = useState(false);

  const resolvedGames = resolveBannerItems(bannerSettings, games, 'game');
  const activeHero = resolvedGames[heroIndex]?.item || games[0];

  const parsedTrailer = activeHero?.trailerUrl ? parseMediaUrl(activeHero.trailerUrl) : null;
  const isYouTubeTrailer = parsedTrailer?.kind === 'youtube' && parsedTrailer.id;

  // Auto-preview trailer after 1.5s delay on active hero
  useEffect(() => {
    setShowTrailerPreview(false);
    if (!isYouTubeTrailer) return;
    const timer = setTimeout(() => {
      setShowTrailerPreview(true);
    }, 1500);
    return () => clearTimeout(timer);
  }, [activeHero?.id, isYouTubeTrailer]);

  const formatBytes = (bytes?: number) => {
    if (!bytes || bytes === 0) return 'Chưa rõ';
    const mb = bytes / (1024 * 1024);
    if (mb > 1024) return `${(mb / 1024).toFixed(1)} GB`;
    return `${Math.round(mb)} MB`;
  };

  // Extract unique tags for game shelves (similar to Windows)
  const availableTags = Array.from(
    new Set(
      games.flatMap((g) => g.tags || (g.genre ? g.genre.split(',').map((s) => s.trim()) : []))
    )
  ).filter(Boolean);

  const spotlightGames = games.filter((g) => g.featured || (g.viewCount && g.viewCount > 0));
  const primarySpotlight = spotlightGames.length > 0 ? spotlightGames : games.slice(0, 6);

  const handleHeroPrev = () => {
    if (resolvedGames.length <= 1) return;
    sfx.playClick();
    setHeroIndex((prev) => (prev - 1 + resolvedGames.length) % resolvedGames.length);
  };

  const handleHeroNext = () => {
    if (resolvedGames.length <= 1) return;
    sfx.playClick();
    setHeroIndex((prev) => (prev + 1) % resolvedGames.length);
  };

  if (games.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-ice-subtext">
        <Gamepad2 className="w-16 h-16 text-blue-400/40 mb-3" />
        <h2 className="text-xl font-bold text-white">Chưa có tựa game nào</h2>
        <p className="text-sm text-ice-muted mt-1">Vui lòng thêm game từ máy tính Windows để đồng bộ.</p>
      </div>
    );
  }

  const heroImage = activeHero?.bannerPath || activeHero?.coverPath || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1600&q=80';

  return (
    <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-7 select-none">
      {/* 1. TOP DISCLAIMER BANNER FOR ANDROID TV */}
      <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300">
        <Monitor className="w-5 h-5 text-amber-400 shrink-0" />
        <div className="text-xs leading-relaxed">
          <strong>Thông báo thiết bị Android TV:</strong> Kho game được lưu trữ và tối ưu hóa cho hệ điều hành <strong>Windows PC</strong>. Trên TV, bạn có thể xem trailer, ảnh chụp màn hình chất lượng cao và đánh dấu tựa game yêu thích.
        </div>
      </div>

      {/* 2. EXACT 16:9 PC GAME TV HERO BANNER (Height ~52% screen for peek-through) */}
      {activeHero && (
        <div className="relative w-full aspect-video max-h-[52vh] rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-[#0E1118] group/banner flex items-end p-8">
          {/* Background: Auto-preview Trailer (Muted) or 16:9 Artwork */}
          {showTrailerPreview && isYouTubeTrailer ? (
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${parsedTrailer.id}?autoplay=1&mute=${isMuted ? 1 : 0}&controls=0&loop=1&playlist=${parsedTrailer.id}&rel=0&playsinline=1`}
              title={activeHero.name}
              allow="autoplay; encrypted-media"
              className="absolute inset-0 w-full h-full object-cover scale-125 pointer-events-none transition-opacity duration-1000"
            />
          ) : (
            <img
              key={activeHero.id}
              src={heroImage}
              alt={activeHero.name}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover/banner:scale-105"
            />
          )}

          {/* Gradients */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A0D14] via-[#0A0D14]/70 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0A0D14]/95 via-[#0A0D14]/50 to-transparent w-3/4" />

          {/* Banner Meta */}
          <div className="relative z-10 max-w-2xl space-y-3">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-blue-600 text-white shadow-md flex items-center gap-1.5">
                <Gamepad2 className="w-3.5 h-3.5" />
                <span>GAME PC NỔI BẬT</span>
              </span>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-white/15 text-white backdrop-blur-md border border-white/15">
                {activeHero.genre || 'Game PC'}
              </span>
              {showTrailerPreview && (
                <span className="px-2 py-0.5 rounded text-[9px] font-extrabold uppercase bg-red-600/30 text-red-300 border border-red-500/40 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                  <span>Đang xem trailer</span>
                </span>
              )}
            </div>

            <h1 className="text-2xl lg:text-4xl font-black text-white leading-tight drop-shadow-lg line-clamp-2">
              {activeHero.name}
            </h1>

            {activeHero.description && (
              <p className="text-xs lg:text-sm text-white/85 line-clamp-2 leading-relaxed drop-shadow max-w-xl">
                {activeHero.description}
              </p>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                data-tv-focus="game-hero-view"
                type="button"
                onClick={() => {
                  sfx.playClick();
                  setSelectedGameModal(activeHero);
                }}
                className="h-12 px-7 rounded-2xl bg-gradient-to-r from-blue-600 to-ice-accent text-white font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-xl shadow-blue-900/40 outline-none transition-all active:scale-95"
              >
                <Info className="w-4 h-4" />
                <span>XEM CHI TIẾT & TRAILER</span>
              </button>

              <button
                data-tv-focus="game-hero-incompat"
                type="button"
                onClick={() => {
                  sfx.playClick();
                  onIncompatibleClick(activeHero);
                }}
                className="h-12 px-4 rounded-2xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-bold border border-amber-500/40 flex items-center gap-2 outline-none transition-all"
              >
                <Monitor className="w-4 h-4 text-amber-400" />
                <span>🚫 Chỉ Chạy Trên PC</span>
              </button>

              {isYouTubeTrailer && (
                <button
                  data-tv-focus="game-hero-mute"
                  type="button"
                  onClick={() => setIsMuted(!isMuted)}
                  className="h-12 w-12 rounded-2xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center backdrop-blur-md border border-white/15 outline-none transition-all"
                  title={isMuted ? 'Bật tiếng trailer' : 'Tắt tiếng'}
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-amber-400" />}
                </button>
              )}
            </div>
          </div>

          {/* Banner Chevrons */}
          {resolvedGames.length > 1 && (
            <div className="absolute bottom-6 right-6 z-20 flex items-center gap-2">
              <button
                data-tv-focus="game-hero-prev"
                type="button"
                onClick={handleHeroPrev}
                className="w-10 h-10 rounded-xl bg-black/60 hover:bg-amber-400 hover:text-black text-white flex items-center justify-center backdrop-blur-md border border-white/20 outline-none transition-all"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-xs font-mono font-bold text-white px-2">
                {heroIndex + 1} / {resolvedGames.length}
              </span>
              <button
                data-tv-focus="game-hero-next"
                type="button"
                onClick={handleHeroNext}
                className="w-10 h-10 rounded-xl bg-black/60 hover:bg-amber-400 hover:text-black text-white flex items-center justify-center backdrop-blur-md border border-white/20 outline-none transition-all"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* 3. ROW 1: GAME NỔI BẬT & ĐỀ XUẤT */}
      {primarySpotlight.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
              <Flame className="w-4 h-4 text-rose-500 fill-rose-500" />
              <span>Game Nổi Bật & Đề Xuất ({primarySpotlight.length})</span>
            </h2>
          </div>

          <div className="flex items-center gap-4 overflow-x-auto no-scrollbar py-2">
            {primarySpotlight.map((game, idx) => (
              <div
                key={game.id}
                data-tv-focus={`game-spotlight-${idx}`}
                tabIndex={0}
                onClick={() => {
                  sfx.playClick();
                  setSelectedGameModal(game);
                }}
                className="group/card relative w-52 lg:w-60 aspect-[16/10] rounded-2xl overflow-hidden bg-[#151924] border border-white/10 shrink-0 cursor-pointer shadow-lg outline-none transition-all hover:scale-102 hover:border-amber-400"
              >
                <img
                  src={game.bannerPath || game.coverPath || ''}
                  alt={game.name}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover/card:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent opacity-85 group-hover/card:opacity-95 transition-opacity" />

                <div className="absolute top-2.5 right-2.5">
                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber-500/30 text-amber-300 font-bold border border-amber-500/40">
                    PC
                  </span>
                </div>

                <div className="absolute bottom-3 left-3 right-3 z-10 space-y-1">
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-600/40 text-blue-300 font-bold uppercase">
                    {game.genre || 'Game'}
                  </span>
                  <h3 className="text-xs font-black text-white leading-tight line-clamp-1">
                    {game.name}
                  </h3>
                  <p className="text-[10px] text-ice-muted">
                    {formatBytes(game.expectedSize)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 4. DYNAMIC TAG SHELVES (HORIZONTALLY SCROLLABLE NETFLIX-STYLE ROWS FOR GAMES) */}
      {availableTags.map((tag, tagIdx) => {
        const tagGames = games.filter(
          (g) =>
            (g.tags && g.tags.includes(tag)) ||
            (g.genre && g.genre.toLowerCase().includes(tag.toLowerCase()))
        );

        if (tagGames.length === 0) return null;

        return (
          <section key={tag} className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Tag className="w-4 h-4 text-blue-400" />
                <span>Thể Loại: {tag} ({tagGames.length})</span>
              </h2>
            </div>

            <div className="flex items-center gap-4 overflow-x-auto no-scrollbar py-2">
              {tagGames.map((game, gameIdx) => (
                <div
                  key={game.id}
                  data-tv-focus={`game-tag-${tagIdx}-${gameIdx}`}
                  tabIndex={0}
                  onClick={() => {
                    sfx.playClick();
                    setSelectedGameModal(game);
                  }}
                  className="group/card relative w-44 lg:w-48 aspect-[3/4] rounded-2xl overflow-hidden bg-[#151924] border border-white/10 shrink-0 cursor-pointer shadow-lg outline-none transition-all hover:scale-102 hover:border-amber-400"
                >
                  <img
                    src={game.coverPath || game.bannerPath || ''}
                    alt={game.name}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover/card:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-85 group-hover/card:opacity-95 transition-opacity" />

                  <div className="absolute top-2 right-2">
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-black/60 text-amber-300 font-bold border border-white/10">
                      PC
                    </span>
                  </div>

                  <div className="absolute bottom-2.5 left-2.5 right-2.5 z-10 space-y-0.5">
                    <h3 className="text-xs font-black text-white leading-tight line-clamp-1">
                      {game.name}
                    </h3>
                    <p className="text-[10px] text-ice-muted">
                      {formatBytes(game.expectedSize)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        );
      })}

      {/* 5. MODAL: CHI TIẾT GAME TRÊN TV (TRAILER & SPECS) */}
      {selectedGameModal && (
        <div className="absolute inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-8 animate-fade-in">
          <div className="w-full max-w-4xl bg-[#131722] border-2 border-amber-500/50 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-white/10">
              <div className="flex items-center gap-3">
                <Gamepad2 className="w-5 h-5 text-amber-400" />
                <h2 className="text-lg font-black text-white">{selectedGameModal.name}</h2>
              </div>
              <button
                data-tv-focus="modal-game-close"
                type="button"
                onClick={() => setSelectedGameModal(null)}
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center outline-none transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-5">
              {/* Trailer 16:9 if available */}
              {selectedGameModal.trailerUrl && (
                <div className="w-full aspect-video rounded-2xl overflow-hidden bg-black border border-white/10 shadow-lg">
                  {(() => {
                    const parsed = parseMediaUrl(selectedGameModal.trailerUrl);
                    if (parsed.kind === 'youtube' && parsed.id) {
                      return (
                        <iframe
                          src={`https://www.youtube-nocookie.com/embed/${parsed.id}?autoplay=1&rel=0&playsinline=1`}
                          title={selectedGameModal.name}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          className="w-full h-full border-0"
                        />
                      );
                    }
                    return (
                      <img
                        src={selectedGameModal.bannerPath || selectedGameModal.coverPath || ''}
                        alt={selectedGameModal.name}
                        className="w-full h-full object-cover"
                      />
                    );
                  })()}
                </div>
              )}

              {/* Description & Technical Specs */}
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2 space-y-2">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">Mô tả trò chơi</h3>
                  <p className="text-xs text-ice-subtext leading-relaxed">
                    {selectedGameModal.description || 'Chưa có mô tả chi tiết cho tựa game này.'}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-ice-subtext">Dung lượng:</span>
                    <span className="text-white font-bold">{formatBytes(selectedGameModal.expectedSize)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ice-subtext">Nền tảng:</span>
                    <span className="text-amber-400 font-bold">Windows PC</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ice-subtext">Trạng thái:</span>
                    <span className="text-emerald-400 font-bold">
                      {selectedGameModal.status === 'ready' ? 'Đã cài trên PC' : 'Chưa tải'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer CTA */}
            <div className="p-4 bg-[#0F121B] border-t border-white/10 flex items-center justify-between">
              <span className="text-xs text-amber-300">
                ℹ️ Để tải và chơi game, vui lòng mở ứng dụng Icelauch trên máy tính Windows.
              </span>
              <button
                data-tv-focus="modal-game-ok"
                type="button"
                onClick={() => setSelectedGameModal(null)}
                className="px-6 h-10 rounded-xl bg-amber-500 text-black font-bold text-xs uppercase tracking-wider outline-none"
              >
                Đã Hiểu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
