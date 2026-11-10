import React, { useState } from 'react';
import {
  Bookmark,
  Gamepad2,
  Film,
  Search,
  Plus,
  Trash2,
  ExternalLink,
  Sparkles,
  User,
  LogIn,
  ChevronRight,
} from 'lucide-react';
import type { Game, MediaItem, AppActionButton, UserProfile, NavigationTab } from '../../types';
import { SafeImage } from '../common/SafeImage';
import { sfx } from '../../utils/sfx';

interface MobileLibraryViewProps {
  games: Game[];
  allMedia?: MediaItem[];
  selectedGameId?: string | null;
  isAdmin: boolean;
  activeProfile?: UserProfile | null;
  userLibraryIds?: string[];
  globalActionButtons?: AppActionButton[];
  onSelectGame: (game: Game) => void;
  onIncompatibleClick?: (game: Game) => void;
  onOpenFolder?: (id: string) => void;
  onToggleLibrary?: (id: string) => void;
  onSelectMedia?: (media: MediaItem) => void;
  onSwitchProfile?: () => void;
  onNavigateTab?: (tab: NavigationTab) => void;
}

export const MobileLibraryView: React.FC<MobileLibraryViewProps> = ({
  games,
  allMedia = [],
  isAdmin,
  activeProfile,
  userLibraryIds = [],
  onSelectGame,
  onIncompatibleClick,
  onToggleLibrary,
  onSelectMedia,
  onSwitchProfile,
  onNavigateTab,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'games' | 'media'>('games');
  const [searchQuery, setSearchQuery] = useState('');

  // 1. Resolve Personal User Library (Strict: DO NOT fallback to all games!)
  const profileLibraryIds = activeProfile?.library || userLibraryIds;
  const profileMediaIds = activeProfile?.favoriteMedia || [];

  const libraryGames = games.filter((g) => profileLibraryIds.includes(g.id));
  const libraryMedia = allMedia.filter((m) => profileMediaIds.includes(m.id));

  // Filtered by search
  const filteredGames = libraryGames.filter((g) =>
    g.name.toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  const filteredMedia = libraryMedia.filter((m) =>
    m.title.toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  return (
    <div className="flex-1 w-full h-full flex flex-col bg-[#0A0C10] select-none overflow-hidden relative">
      {/* 1. TOP MOBILE HEADER */}
      <header className="px-4 pt-3 pb-2.5 bg-[#10131B]/80 backdrop-blur-md border-b border-white/5 flex flex-col gap-2 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Bookmark className="w-4 h-4 fill-cyan-400/20" />
            </div>
            <div>
              <h1 className="text-base font-black text-white tracking-wide">Thư Viện</h1>
              <p className="text-[10px] text-slate-400">
                {activeProfile ? `Hồ sơ: ${activeProfile.nickname}` : 'Chế độ Khách'}
              </p>
            </div>
          </div>

          {/* Sub-tab pills */}
          <div className="flex items-center bg-black/40 p-1 rounded-xl border border-white/5">
            <button
              type="button"
              onClick={() => {
                sfx.playClick();
                setActiveSubTab('games');
              }}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${activeSubTab === 'games'
                  ? 'bg-cyan-500 text-black shadow-md'
                  : 'text-slate-400 hover:text-white'
                }`}
            >
              <Gamepad2 className="w-3.5 h-3.5" />
              <span>Game ({libraryGames.length})</span>
            </button>
            <button
              type="button"
              onClick={() => {
                sfx.playClick();
                setActiveSubTab('media');
              }}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${activeSubTab === 'media'
                  ? 'bg-cyan-500 text-black shadow-md'
                  : 'text-slate-400 hover:text-white'
                }`}
            >
              <Film className="w-3.5 h-3.5" />
              <span>Phim ({libraryMedia.length})</span>
            </button>
          </div>
        </div>

        {/* Search input (only when there are items) */}
        {(libraryGames.length > 0 || libraryMedia.length > 0) && (
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm trong thư viện của bạn..."
              className="w-full h-8 pl-8 pr-3 rounded-lg bg-black/30 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
            />
          </div>
        )}
      </header>

      {/* 2. BODY CONTENT */}
      <div className="flex-1 w-full overflow-y-auto p-4 space-y-4">
        {/* CASE A: Guest Mode Prompt */}
        {!activeProfile && (
          <div className="p-4 rounded-2xl bg-gradient-to-br from-cyan-950/30 via-[#10141E] to-[#0D1017] border border-cyan-500/30 shadow-lg flex flex-col items-center text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
              <User className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h2 className="text-sm font-black text-white">Bạn Đang Ở Chế Độ Khách</h2>
              <p className="text-xs text-slate-300 max-w-[280px]">
                Hãy đăng nhập hoặc chọn hồ sơ để lưu trữ và đồng bộ Thư viện Game & Phim yêu thích của riêng bạn.
              </p>
            </div>
            {onSwitchProfile && (
              <button
                type="button"
                onClick={() => {
                  sfx.playClick();
                  onSwitchProfile();
                }}
                className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-lg shadow-cyan-500/20 active:scale-95 transition-all"
              >
                <LogIn className="w-4 h-4" />
                <span>Chọn Hoặc Tạo Hồ Sơ</span>
              </button>
            )}
          </div>
        )}

        {/* CASE B: GAMES TAB */}
        {activeSubTab === 'games' && (
          <>
            {filteredGames.length > 0 ? (
              <div className="grid grid-cols-2 gap-3 pb-6">
                {filteredGames.map((game) => (
                  <div
                    key={game.id}
                    className="group relative rounded-2xl bg-[#12151D] border border-white/10 overflow-hidden flex flex-col shadow-md active:scale-98 transition-all"
                  >
                    {/* Game Cover Aspect 3:4 */}
                    <div
                      onClick={() => {
                        sfx.playClick();
                        onSelectGame(game);
                      }}
                      className="relative w-full aspect-[3/4] bg-black/60 overflow-hidden cursor-pointer"
                    >
                      <SafeImage
                        src={game.coverPath || game.bannerPath}
                        alt={game.name}
                        title={game.name}
                        fallbackType="game"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                      <div className="absolute top-2 right-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            sfx.playClick();
                            onToggleLibrary?.(game.id);
                          }}
                          className="w-7 h-7 rounded-full bg-black/70 hover:bg-rose-600/80 text-cyan-400 hover:text-white backdrop-blur-md flex items-center justify-center transition-all border border-white/10"
                          title="Bỏ khỏi thư viện"
                        >
                          <Bookmark className="w-3.5 h-3.5 fill-current" />
                        </button>
                      </div>
                    </div>

                    {/* Game Info & Details */}
                    <div
                      onClick={() => {
                        sfx.playClick();
                        onSelectGame(game);
                      }}
                      className="p-2.5 flex flex-col justify-between flex-1 cursor-pointer"
                    >
                      <div>
                        <h3 className="text-xs font-bold text-white line-clamp-1 group-hover:text-cyan-400 transition-colors">
                          {game.name}
                        </h3>
                        <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                          {game.genre || 'Game PC'}
                        </p>
                      </div>
                      <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between text-[10px]">
                        <span className="text-cyan-400 font-bold flex items-center gap-0.5">
                          Chi tiết <ChevronRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-500">
                  <Gamepad2 className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-white">Thư Viện Game Đang Trống</h3>
                  <p className="text-xs text-slate-400 max-w-[260px]">
                    Bạn chưa lưu game nào vào thư viện cá nhân. Hãy khám phá và thêm game bạn thích!
                  </p>
                </div>
                {onNavigateTab && (
                  <button
                    type="button"
                    onClick={() => {
                      sfx.playClick();
                      onNavigateTab('home');
                    }}
                    className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1.5 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Khám Phá Danh Mục Game</span>
                  </button>
                )}
              </div>
            )}
          </>
        )}

        {/* CASE C: MEDIA TAB */}
        {activeSubTab === 'media' && (
          <>
            {filteredMedia.length > 0 ? (
              <div className="grid grid-cols-2 gap-3 pb-6">
                {filteredMedia.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      sfx.playClick();
                      onSelectMedia?.(item);
                    }}
                    className="group relative rounded-2xl bg-[#12151D] border border-white/10 overflow-hidden flex flex-col shadow-md active:scale-98 transition-all cursor-pointer"
                  >
                    <div className="relative w-full aspect-video bg-black/60 overflow-hidden">
                      <SafeImage
                        src={item.coverPath || item.bannerPath}
                        alt={item.title}
                        title={item.title}
                        fallbackType="video"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    </div>
                    <div className="p-2.5 flex flex-col justify-between flex-1">
                      <h3 className="text-xs font-bold text-white line-clamp-1 group-hover:text-cyan-400 transition-colors">
                        {item.title}
                      </h3>
                      <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                        {item.category || 'Video'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-500">
                  <Film className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-white">Chưa Có Phim Yêu Thích</h3>
                  <p className="text-xs text-slate-400 max-w-[260px]">
                    Hãy vào mục Giải Trí và chọn xem các bộ phim, trailer hấp dẫn!
                  </p>
                </div>
                {onNavigateTab && (
                  <button
                    type="button"
                    onClick={() => {
                      sfx.playClick();
                      onNavigateTab('media');
                    }}
                    className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1.5 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Duyệt Mục Giải Trí</span>
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
