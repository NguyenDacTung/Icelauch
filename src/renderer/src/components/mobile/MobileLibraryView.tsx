import React, { useState } from 'react';
import {
  List,
  Search,
  X,
  Bookmark,
  BookmarkCheck,
  FolderOpen,
  Monitor,
  ExternalLink,
  HardDrive,
  Clock,
  Sparkles,
  Gamepad2,
  ChevronRight,
} from 'lucide-react';
import type { Game, AppActionButton } from '../../types';
import { GameActionsWidget } from '../common/GameActionsWidget';

interface MobileLibraryViewProps {
  games: Game[];
  selectedGameId: string | null;
  isAdmin: boolean;
  userLibraryIds?: string[];
  globalActionButtons?: AppActionButton[];
  onSelectGame: (game: Game) => void;
  onIncompatibleClick?: (game: Game) => void;
  onOpenFolder?: (id: string) => void;
  onToggleLibrary?: (id: string) => void;
}

export const MobileLibraryView: React.FC<MobileLibraryViewProps> = ({
  games,
  selectedGameId,
  isAdmin,
  userLibraryIds = [],
  globalActionButtons = [],
  onSelectGame,
  onIncompatibleClick,
  onOpenFolder,
  onToggleLibrary,
}) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerSearch, setDrawerSearch] = useState('');

  // Filter games in user library unless empty or admin
  const userGames = games.filter((g) => (userLibraryIds.length > 0 ? userLibraryIds.includes(g.id) : g.inLibrary));
  const displayGames = userGames.length > 0 ? userGames : games;

  const activeGame = games.find((g) => g.id === selectedGameId) || displayGames[0] || games[0];

  const drawerFilteredGames = displayGames.filter((g) =>
    g.name.toLowerCase().includes(drawerSearch.toLowerCase().trim())
  );

  const formatBytes = (bytes?: number) => {
    if (!bytes || bytes === 0) return 'Chưa rõ';
    const mb = bytes / (1024 * 1024);
    if (mb > 1024) return `${(mb / 1024).toFixed(1)} GB`;
    return `${Math.round(mb)} MB`;
  };

  return (
    <div className="flex-1 w-full h-full flex bg-[#0A0C10] select-none overflow-hidden relative">
      {/* 1. LEFT ICON-RAIL (SLIM 56px BAR) */}
      <div className="w-14 bg-[#12141A] border-r border-ice-border flex flex-col items-center py-2 shrink-0 z-20">
        {/* Top Drawer Menu Toggle Button */}
        <button
          type="button"
          onClick={() => setIsDrawerOpen(true)}
          className="relative w-10 h-10 rounded-xl bg-ice-accent/20 hover:bg-ice-accent/30 text-ice-accent border border-ice-accent/40 flex items-center justify-center transition-all shadow-md active:scale-95 mb-2"
          title="Mở toàn bộ danh sách game"
        >
          <List className="w-5 h-5" />
          {displayGames.length > 0 && (
            <span className="absolute -bottom-1 -right-1 px-1 min-w-[16px] h-4 rounded-full bg-ice-accent text-white text-[9px] font-black flex items-center justify-center">
              {displayGames.length}
            </span>
          )}
        </button>

        <div className="w-8 h-px bg-ice-border/60 mb-2" />

        {/* Vertical Game Icon Rail */}
        <div className="flex-1 w-full overflow-y-auto no-scrollbar flex flex-col items-center gap-2 px-1">
          {displayGames.map((game) => {
            const isActive = activeGame && activeGame.id === game.id;
            return (
              <button
                key={game.id}
                type="button"
                onClick={() => onSelectGame(game)}
                className={`relative w-10 h-10 rounded-xl overflow-hidden border transition-all shrink-0 ${
                  isActive
                    ? 'border-ice-accent ring-2 ring-ice-accent/50 scale-105 shadow-lg shadow-blue-500/20'
                    : 'border-white/10 opacity-70 hover:opacity-100'
                }`}
                title={game.name}
              >
                {game.coverPath ? (
                  <img src={game.coverPath} alt={game.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-slate-800 flex items-center justify-center text-[10px] font-bold text-white">
                    {game.name.substring(0, 2).toUpperCase()}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. MAIN ACTIVE GAME DETAIL PANEL (~320px) */}
      <div className="flex-1 h-full overflow-y-auto no-scrollbar flex flex-col p-3.5 space-y-3.5 bg-gradient-to-b from-[#12141A] to-[#0A0C10]">
        {activeGame ? (
          <>
            {/* Poster / Artwork (Aspect 16:9 for compact mobile fit) */}
            <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-ice-border shadow-xl bg-black">
              <img
                src={activeGame.bannerPath || activeGame.coverPath || ''}
                alt={activeGame.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
              <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/20 text-white backdrop-blur-xs">
                  {activeGame.genre || 'Game PC'}
                </span>
                <span className="text-[10px] font-bold text-emerald-400 bg-black/60 px-2 py-0.5 rounded-full border border-emerald-500/30">
                  {formatBytes(activeGame.expectedSize)}
                </span>
              </div>
            </div>

            {/* Title & Description */}
            <div className="space-y-1">
              <h2 className="text-base font-black text-white leading-snug">
                {activeGame.name}
              </h2>
              {activeGame.description && (
                <p className="text-xs text-ice-subtext leading-relaxed line-clamp-3">
                  {activeGame.description}
                </p>
              )}
            </div>

            {/* Incompatible Mobile CTA */}
            <button
              type="button"
              onClick={() => onIncompatibleClick?.(activeGame)}
              className="w-full h-11 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold tracking-wider uppercase flex items-center justify-center gap-2 shadow-lg transition-all"
            >
              <Monitor className="w-4 h-4 text-amber-400" />
              <span>🚫 Chỉ hỗ trợ Windows PC</span>
            </button>

            {/* Action Buttons / Requirements (Steam, Discord, etc.) */}
            <div className="pt-2 border-t border-ice-border/60">
              <GameActionsWidget
                variant="compact"
                requirementsText={activeGame.requirementsText}
                buttons={activeGame.actionButtonIds && activeGame.actionButtonIds.length > 0
                  ? globalActionButtons.filter((b) => activeGame.actionButtonIds?.includes(b.id))
                  : globalActionButtons}
              />
            </div>

            {/* Additional Game Info */}
            <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-xs text-ice-subtext space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <HardDrive className="w-3 h-3 text-ice-accent" />
                  <span>Dung lượng cài đặt:</span>
                </span>
                <span className="text-white font-semibold">{formatBytes(activeGame.expectedSize)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-amber-400" />
                  <span>Chơi lần cuối:</span>
                </span>
                <span className="text-white font-semibold">{activeGame.lastPlayed || 'Chưa chơi'}</span>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-ice-subtext">
            <Gamepad2 className="w-10 h-10 mb-2 opacity-40" />
            <p className="text-xs">Chưa có game nào trong thư viện</p>
          </div>
        )}
      </div>

      {/* 3. SLIDE DRAWER / BOTTOM SHEET FOR FULL GAME LIST */}
      {isDrawerOpen && (
        <div className="absolute inset-0 z-40 bg-black/80 backdrop-blur-sm flex">
          <div className="w-[300px] h-full bg-[#14171F] border-r border-ice-border p-3 flex flex-col space-y-3 animate-fade-in shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                <List className="w-4 h-4 text-ice-accent" />
                <span>Toàn bộ thư viện ({displayGames.length})</span>
              </span>
              <button
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search */}
            <div className="relative w-full">
              <Search className="w-3.5 h-3.5 text-ice-subtext absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={drawerSearch}
                onChange={(e) => setDrawerSearch(e.target.value)}
                placeholder="Tìm game trong thư viện..."
                className="w-full h-8 pl-8 pr-3 rounded-lg bg-black/50 border border-ice-border text-xs text-white placeholder-ice-subtext focus:outline-none focus:border-ice-accent"
              />
            </div>

            {/* Game List Items */}
            <div className="flex-1 overflow-y-auto no-scrollbar space-y-1.5">
              {drawerFilteredGames.map((game) => {
                const isSelected = activeGame && activeGame.id === game.id;
                return (
                  <div
                    key={game.id}
                    onClick={() => {
                      onSelectGame(game);
                      setIsDrawerOpen(false);
                    }}
                    className={`flex items-center gap-2.5 p-2 rounded-xl cursor-pointer transition-all border ${
                      isSelected
                        ? 'bg-ice-accent/20 border-ice-accent text-white'
                        : 'bg-white/5 hover:bg-white/10 border-white/5 text-ice-text'
                    }`}
                  >
                    <div className="w-9 h-9 rounded-lg overflow-hidden bg-black shrink-0">
                      {game.coverPath ? (
                        <img src={game.coverPath} alt={game.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[9px] font-bold">
                          {game.name.substring(0, 2)}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold line-clamp-1">{game.name}</p>
                      <span className="text-[10px] text-ice-subtext">{formatBytes(game.expectedSize)}</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-ice-subtext shrink-0" />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Click outside to close */}
          <div className="flex-1 h-full" onClick={() => setIsDrawerOpen(false)} />
        </div>
      )}
    </div>
  );
};
