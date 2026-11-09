import React from 'react';
import {
  Gamepad2,
  Sparkles,
  Monitor,
  Search,
  Shuffle,
  Bookmark,
  BookmarkCheck,
  CheckCircle2,
} from 'lucide-react';
import type { Game, MediaItem, AppSettings, SectionBannerSettings } from '../../types';
import { MobileHeroBanner } from './MobileHeroBanner';
import { HorizontalScroller } from '../common/HorizontalScroller';

interface MobileHomeViewProps {
  games: Game[];
  allMedia?: MediaItem[];
  settings?: AppSettings;
  isAdmin: boolean;
  searchQuery: string;
  onSelectGame: (game: Game) => void;
  onIncompatibleClick?: (game: Game) => void;
  onToggleLibrary: (id: string) => void;
  onOpenSurprise?: () => void;
}

export const MobileHomeView: React.FC<MobileHomeViewProps> = ({
  games,
  allMedia = [],
  settings,
  isAdmin,
  searchQuery,
  onSelectGame,
  onIncompatibleClick,
  onToggleLibrary,
  onOpenSurprise,
}) => {
  const visibleGames = games.filter((g) => !g.hidden);

  const filteredGames = visibleGames.filter((g) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return g.name.toLowerCase().includes(q) || (g.genre && g.genre.toLowerCase().includes(q));
  });

  const featuredGames = visibleGames.filter((g) => g.featured || g.status === 'ready');

  const formatBytes = (bytes?: number) => {
    if (!bytes || bytes === 0) return '';
    const mb = bytes / (1024 * 1024);
    if (mb > 1024) return `${(mb / 1024).toFixed(1)}GB`;
    return `${Math.round(mb)}MB`;
  };

  return (
    <div className="flex-1 w-full h-full flex flex-col bg-[#0A0C10] select-none overflow-y-auto no-scrollbar p-3 space-y-3.5">
      {/* 1. MOBILE HERO BANNER (EXACT 16:9 CINEMATIC) */}
      <MobileHeroBanner
        items={visibleGames}
        type="game"
        bannerSettings={settings?.bannerSettings?.games}
        onSelectGame={onSelectGame}
        onIncompatibleClick={onIncompatibleClick}
        onToggleLibrary={onToggleLibrary}
      />

      {/* 2. FEATURED GAMES (CAROUSEL WITH CHEVRONS, NO SCROLLBAR) */}
      {featuredGames.length > 0 && (
        <div className="space-y-2 shrink-0">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-white flex items-center gap-1.5 uppercase tracking-wide">
              <Sparkles className="w-3.5 h-3.5 text-ice-accent" />
              <span>Game Nổi Bật & Thịnh Hành</span>
            </span>
            <span className="text-[10px] text-ice-subtext font-semibold">{featuredGames.length} game</span>
          </div>

          <HorizontalScroller className="gap-2.5" scrollStep={200}>
            {featuredGames.map((game) => (
              <div
                key={game.id}
                onClick={() => onSelectGame(game)}
                className="w-44 aspect-video rounded-xl overflow-hidden bg-black border border-ice-border/70 relative shrink-0 cursor-pointer group shadow-md"
              >
                <img
                  src={game.bannerPath || game.coverPath || ''}
                  alt={game.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent flex flex-col justify-end p-2">
                  <p className="text-[11px] font-bold text-white line-clamp-1">{game.name}</p>
                </div>
              </div>
            ))}
          </HorizontalScroller>
        </div>
      )}

      {/* 3. KHO GAME TỔNG HỢP (LƯỚI 2 CỘT CHUẨN DI ĐỘNG) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black text-white flex items-center gap-1.5 uppercase tracking-wide">
            <Gamepad2 className="w-3.5 h-3.5 text-ice-accent" />
            <span>Kho Game PC Tổng Hợp</span>
          </span>
          <span className="text-[10px] text-ice-subtext font-semibold">Lưới 2 cột</span>
        </div>

        {filteredGames.length > 0 ? (
          <div className="grid grid-cols-2 gap-2.5">
            {filteredGames.map((game) => (
              <div
                key={game.id}
                onClick={() => onSelectGame(game)}
                className="rounded-xl overflow-hidden bg-[#14171F] border border-ice-border/70 cursor-pointer group hover:border-ice-accent/60 transition-all shadow-md flex flex-col"
              >
                {/* 16:9 Thumbnail Cover */}
                <div className="relative aspect-video w-full bg-black overflow-hidden">
                  <img
                    src={game.coverPath || game.bannerPath || ''}
                    alt={game.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-1.5 right-1.5 flex items-center gap-1">
                    {game.expectedSize && (
                      <span className="px-1.5 py-0.2 rounded text-[8px] font-black bg-black/75 text-emerald-400 border border-emerald-400/30">
                        {formatBytes(game.expectedSize)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Info & Mobile Incompatible CTA */}
                <div className="p-2 space-y-1.5 flex-1 flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-white line-clamp-1 group-hover:text-ice-accent transition-colors">
                      {game.name}
                    </h4>
                    <span className="text-[10px] text-ice-subtext line-clamp-1">
                      {game.genre || 'Game PC'}
                    </span>
                  </div>

                  {/* Mobile CTA */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onIncompatibleClick?.(game);
                    }}
                    className="w-full h-7 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 text-amber-300 text-[10px] font-bold flex items-center justify-center gap-1 shadow-sm active:scale-95"
                    title="Trò chơi dành cho máy tính Windows"
                  >
                    <Monitor className="w-3 h-3 text-amber-400" />
                    <span>🚫 Chỉ PC</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-ice-subtext">
            Không tìm thấy tựa game nào phù hợp
          </div>
        )}
      </div>
    </div>
  );
};
