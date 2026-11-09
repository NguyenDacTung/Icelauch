import React, { useState } from 'react';
import { HeroBanner } from './HeroBanner';
import { GameCard } from './GameCard';
import { SurpriseGameModal } from './SurpriseGameModal';
import { 
  Plus, 
  Filter, 
  ArrowUpDown, 
  Sparkles, 
  Gamepad2, 
  Dices, 
  Trophy, 
  Play, 
  Clock, 
  Flame, 
  Film, 
  Music,
  ChevronRight,
  Smile,
  Zap,
  BookOpen,
  Users
} from 'lucide-react';
import type { Game, MediaItem, AppSettings } from '../../types';
import { sfx } from '../../utils/sfx';

interface HomeViewProps {
  games: Game[];
  allMedia?: MediaItem[];
  settings?: AppSettings;
  isAdmin: boolean;
  searchQuery: string;
  onSelectGame: (game: Game) => void;
  onSelectMedia?: (media: MediaItem) => void;
  onLaunch: (id: string) => void;
  onDownload: (id: string) => void;
  onCancelDownload: (id: string) => void;
  onRetry: (id: string) => void;
  onToggleLibrary: (id: string) => void;
  onToggleHide?: (id: string) => void;
  onOpenFolder: (id: string) => void;
  onUninstall: (id: string) => void;
  onEditGame: (game: Game) => void;
  onDeleteGame: (id: string) => void;
  onOpenAddGame: () => void;
  onLoadDemoData: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  games,
  allMedia = [],
  settings,
  isAdmin,
  searchQuery,
  onSelectGame,
  onSelectMedia,
  onLaunch,
  onDownload,
  onCancelDownload,
  onRetry,
  onToggleLibrary,
  onToggleHide,
  onOpenFolder,
  onUninstall,
  onEditGame,
  onDeleteGame,
  onOpenAddGame,
  onLoadDemoData,
}) => {
  const [selectedGenre, setSelectedGenre] = useState<string>('Tất cả');
  const [selectedMood, setSelectedMood] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'name'>('newest');
  const [showHiddenOnly, setShowHiddenOnly] = useState(false);
  const [isSurpriseOpen, setIsSurpriseOpen] = useState(false);

  // Filter out hidden games for normal users; apply admin hidden filter if active
  const baseGames = games.filter((g) => {
    if (!isAdmin && g.hidden) return false;
    if (isAdmin && showHiddenOnly) return g.hidden;
    return true;
  });

  const hiddenCount = games.filter((g) => g.hidden).length;

  // Extract unique genres / tags
  const genres = [
    'Tất cả',
    ...Array.from(new Set(baseGames.flatMap((g) => g.tags || (g.genre ? g.genre.split(',').map((s) => s.trim()) : [])))).filter(Boolean),
  ];

  // Mood filter definitions
  const moods = [
    { id: 'all', label: 'Tất cả tâm trạng', icon: Sparkles },
    { id: 'coop', label: 'Co-op cùng bạn bè', icon: Users, keywords: ['coop', 'co-op', 'multiplayer', 'đồng đội'] },
    { id: 'chill', label: 'Thư giãn xả stress', icon: Smile, keywords: ['chill', 'thư giãn', 'casual', 'mô phỏng', 'giải đố'] },
    { id: 'action', label: 'Chiến đấu bùng nổ', icon: Zap, keywords: ['hành động', 'bắn súng', 'fps', 'chiến thuật'] },
    { id: 'story', label: 'Cốt truyện đỉnh cao', icon: BookOpen, keywords: ['nhập vai', 'rpg', 'phiêu lưu', 'story'] },
  ];

  // Filter & Search
  let filteredGames = baseGames.filter((g) => {
    const matchesSearch =
      searchQuery === '' ||
      g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.genre?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesGenre =
      selectedGenre === 'Tất cả' ||
      (g.tags && g.tags.includes(selectedGenre)) ||
      (g.genre && g.genre.toLowerCase().includes(selectedGenre.toLowerCase()));

    let matchesMood = true;
    if (selectedMood !== 'all') {
      const activeMood = moods.find((m) => m.id === selectedMood);
      if (activeMood?.keywords) {
        const gameText = `${g.name} ${g.genre || ''} ${g.tags?.join(' ') || ''}`.toLowerCase();
        matchesMood = activeMood.keywords.some((kw) => gameText.includes(kw));
      }
    }

    return matchesSearch && matchesGenre && matchesMood;
  });

  // Sort
  filteredGames.sort((a, b) => {
    if (sortBy === 'newest') {
      return new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime();
    }
    return a.name.localeCompare(b.name);
  });

  // Continue playing games (ready games with lastPlayed)
  const recentGames = games.filter((g) => g.status === 'ready' && g.lastPlayed);

  // Continue watching & listening media (media items with lastPosition > 10 and not watched)
  const continueMedia = allMedia.filter(
    (m) => (!m.hidden || isAdmin) && m.lastPosition > 10 && !m.watched
  );

  // Spotlight featured games
  const spotlightGames = baseGames.filter((g) => g.featured);

  // Format time remaining for continue media
  const formatTimeRemaining = (item: MediaItem) => {
    if (!item.duration) return 'Đang xem dở';
    const remaining = Math.max(0, item.duration - item.lastPosition);
    const m = Math.floor(remaining / 60);
    return `Còn lại ${m} phút`;
  };

  return (
    <div className="flex-1 overflow-y-auto px-8 py-6 space-y-8 select-none">
      {/* 1. Header Bar: Gamer Profile Badge & "Hôm Nay Chơi Gì?" Button */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-ice-card/60 border border-ice-border/60 shadow-lg backdrop-blur-md">
        {/* Gamer Profile Card */}
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-blue-600 via-ice-accent to-purple-600 p-0.5 shadow-md flex items-center justify-center">
            <div className="w-full h-full bg-[#0F1115] rounded-[10px] flex items-center justify-center">
              <Trophy className="w-5 h-5 text-amber-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white tracking-wide">
                {settings?.userGamerTitle || 'Tân Binh Băng Giá'}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-ice-accent/20 text-ice-accent border border-ice-accent/40">
                Gamer Cấp 1
              </span>
            </div>
            <p className="text-[11px] text-ice-muted mt-0.5 flex items-center gap-2">
              <span>{games.filter((g) => g.status === 'ready').length} game đã cài sẵn</span>
              <span>•</span>
              <span>{recentGames.length} game vừa chơi gần đây</span>
            </p>
          </div>
        </div>

        {/* Quick Action: "Hôm Nay Chơi Gì? / Surprise Me" Button */}
        <button
          onClick={() => {
            sfx.playClick();
            setIsSurpriseOpen(true);
          }}
          className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-black font-extrabold text-xs shadow-xl shadow-amber-500/20 transition-all hover:scale-105 active:scale-95"
          title="Mở vòng quay ngẫu nhiên chọn game cực vui"
        >
          <Dices className="w-4 h-4 animate-bounce" />
          <span>HÔM NAY CHƠI GÌ?</span>
          <Sparkles className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 2. Hero Featured Banner (Exact 16:9 Aspect-Video) */}
      {baseGames.length > 0 && !searchQuery && (
        <HeroBanner
          games={baseGames}
          bannerSettings={settings?.bannerSettings?.games}
          onSelectGame={onSelectGame}
          onLaunch={onLaunch}
          onDownload={onDownload}
          onToggleLibrary={onToggleLibrary}
        />
      )}

      {/* 3. Continue Playing Row (Vừa Chơi Gần Đây) */}
      {recentGames.length > 0 && !searchQuery && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white tracking-wider uppercase flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-ice-success animate-pulse" />
              <span>Vừa Chơi Gần Đây (Quick Resume)</span>
            </h2>
          </div>

          <div className="flex items-center gap-4 overflow-x-auto pb-2 scrollbar-thin">
            {recentGames.map((game) => (
              <div
                key={game.id}
                onClick={() => {
                  sfx.playClick();
                  onSelectGame(game);
                }}
                className="flex items-center gap-3 bg-ice-card hover:bg-ice-hover border border-ice-border rounded-xl p-3 min-w-[280px] max-w-[320px] cursor-pointer transition-all hover:-translate-y-1 hover:shadow-xl hover:border-ice-accent/60 group shrink-0"
              >
                <div className="w-12 h-16 rounded-lg overflow-hidden bg-black/60 shrink-0 border border-ice-border">
                  {game.coverPath ? (
                    <img
                      src={game.coverPath.startsWith('http') ? game.coverPath : `file://${game.coverPath}`}
                      alt={game.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-ice-muted">
                      <Gamepad2 className="w-5 h-5" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-white truncate group-hover:text-ice-accent transition-colors">
                    {game.name}
                  </h4>
                  <p className="text-[10px] text-ice-muted truncate mt-0.5 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-ice-subtext" />
                    <span>{game.lastPlayed ? new Date(game.lastPlayed).toLocaleDateString('vi-VN') : 'Đã chơi'}</span>
                  </p>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    sfx.playLaunch();
                    onLaunch(game.id);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-ice-success hover:bg-emerald-400 text-black text-xs font-bold shadow-md transition-all active:scale-95 shrink-0"
                  title="Khởi chạy game ngay"
                >
                  <Play className="w-3.5 h-3.5 fill-black" />
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 4. Continue Watching & Listening Shelf (Tiếp Tục Xem & Nghe Dở) */}
      {continueMedia.length > 0 && !searchQuery && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white tracking-wider uppercase flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
              <span>Tiếp Tục Xem & Nghe Dở</span>
            </h2>
          </div>

          <div className="flex items-center gap-4 overflow-x-auto pb-2 scrollbar-thin">
            {continueMedia.map((item) => {
              const percent = item.duration ? Math.min(100, Math.round((item.lastPosition / item.duration) * 100)) : 0;
              const isAudio = item.type === 'audio';

              return (
                <div
                  key={item.id}
                  onClick={() => {
                    sfx.playClick();
                    onSelectMedia?.(item);
                  }}
                  className="flex items-center gap-3 bg-ice-card hover:bg-ice-hover border border-ice-border rounded-xl p-3 min-w-[300px] max-w-[340px] cursor-pointer transition-all hover:-translate-y-1 hover:shadow-xl hover:border-amber-400/60 group shrink-0"
                >
                  <div className="w-20 aspect-video rounded-lg overflow-hidden bg-black/70 shrink-0 border border-ice-border relative">
                    {item.coverPath ? (
                      <img
                        src={item.coverPath.startsWith('http') ? item.coverPath : `file://${item.coverPath}`}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-ice-muted">
                        {isAudio ? <Music className="w-5 h-5 text-amber-400" /> : <Film className="w-5 h-5 text-blue-400" />}
                      </div>
                    )}
                    {/* Mini progress bar on thumbnail */}
                    <div className="absolute bottom-0 inset-x-0 h-1 bg-white/20">
                      <div className="h-full bg-red-500" style={{ width: `${percent}%` }} />
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wide">
                      {isAudio ? 'Nhạc • Đang nghe dở' : 'Video • Đang xem dở'}
                    </span>
                    <h4 className="text-xs font-bold text-white truncate group-hover:text-amber-300 transition-colors">
                      {item.title}
                    </h4>
                    <p className="text-[10px] text-ice-muted truncate mt-0.5">
                      {formatTimeRemaining(item)} ({percent}%)
                    </p>
                  </div>

                  <div className="p-2 rounded-full bg-amber-500/20 text-amber-400 group-hover:bg-amber-500 group-hover:text-black transition-all shrink-0">
                    <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 5. Mood Filter Pills Bar */}
      {!searchQuery && (
        <section className="space-y-2">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
            {moods.map((m) => {
              const Icon = m.icon;
              const isActive = selectedMood === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => {
                    sfx.playClick();
                    setSelectedMood(m.id);
                  }}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-600/40 to-ice-accent/40 text-white border-ice-accent shadow-md shadow-ice-accent/15'
                      : 'bg-ice-card text-ice-text border-ice-border hover:bg-ice-hover hover:text-white'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-ice-accent' : 'text-ice-muted'}`} />
                  <span>{m.label}</span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* 6. Spotlight Games Row (Game Nổi Bật) */}
      {spotlightGames.length > 0 && selectedMood === 'all' && !searchQuery && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white tracking-wider uppercase flex items-center gap-2">
              <Flame className="w-4 h-4 text-orange-400" />
              <span>Game Nổi Bật Trong Tuần</span>
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {spotlightGames.slice(0, 6).map((game) => (
              <GameCard
                key={game.id}
                game={game}
                isAdmin={isAdmin}
                onSelectGame={() => {
                  sfx.playClick();
                  onSelectGame(game);
                }}
                onLaunch={() => {
                  sfx.playLaunch();
                  onLaunch(game.id);
                }}
                onDownload={() => onDownload(game.id)}
                onCancelDownload={() => onCancelDownload(game.id)}
                onRetry={() => onRetry(game.id)}
                onToggleLibrary={() => onToggleLibrary(game.id)}
                onToggleHide={onToggleHide ? () => onToggleHide(game.id) : undefined}
                onOpenFolder={() => onOpenFolder(game.id)}
                onUninstall={() => onUninstall(game.id)}
                onEditGame={() => onEditGame(game)}
                onDeleteGame={() => onDeleteGame(game.id)}
              />
            ))}
          </div>
        </section>
      )}

      {/* 7. All Games Grid Section */}
      <section className="space-y-4">
        {/* Controls: Title, Filter, Sort & Add Button */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-ice-border pb-3">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-bold text-white tracking-wide">
              {searchQuery ? `Kết quả tìm kiếm cho "${searchQuery}"` : 'Kho Trò Chơi'}
            </h2>
            <span className="text-xs text-ice-subtext">({filteredGames.length})</span>
          </div>

          <div className="flex items-center gap-3">
            {/* Genre Filter */}
            {genres.length > 2 && (
              <div className="flex items-center gap-1.5 text-xs bg-ice-card border border-ice-border rounded-xl px-3 py-1.5 text-ice-text">
                <Filter className="w-3.5 h-3.5 text-ice-subtext" />
                <select
                  value={selectedGenre}
                  onChange={(e) => {
                    sfx.playClick();
                    setSelectedGenre(e.target.value);
                  }}
                  className="bg-transparent text-xs text-ice-text focus:outline-none cursor-pointer"
                >
                  {genres.map((g) => (
                    <option key={g} value={g} className="bg-ice-card text-white">
                      {g}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Sort Order */}
            <div className="flex items-center gap-1.5 text-xs bg-ice-card border border-ice-border rounded-xl px-3 py-1.5 text-ice-text">
              <ArrowUpDown className="w-3.5 h-3.5 text-ice-subtext" />
              <select
                value={sortBy}
                onChange={(e) => {
                  sfx.playClick();
                  setSortBy(e.target.value as any);
                }}
                className="bg-transparent text-xs text-ice-text focus:outline-none cursor-pointer"
              >
                <option value="newest" className="bg-ice-card text-white">Mới nhất</option>
                <option value="name" className="bg-ice-card text-white">Tên A-Z</option>
              </select>
            </div>

            {/* Admin Add Game */}
            {isAdmin && (
              <button
                onClick={() => {
                  sfx.playClick();
                  onOpenAddGame();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition-colors shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Thêm Game</span>
              </button>
            )}
          </div>
        </div>

        {/* Game Cards Grid */}
        {filteredGames.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {filteredGames.map((game) => (
              <GameCard
                key={game.id}
                game={game}
                isAdmin={isAdmin}
                onSelectGame={() => {
                  sfx.playClick();
                  onSelectGame(game);
                }}
                onLaunch={() => {
                  sfx.playLaunch();
                  onLaunch(game.id);
                }}
                onDownload={() => onDownload(game.id)}
                onCancelDownload={() => onCancelDownload(game.id)}
                onRetry={() => onRetry(game.id)}
                onToggleLibrary={() => onToggleLibrary(game.id)}
                onToggleHide={onToggleHide ? () => onToggleHide(game.id) : undefined}
                onOpenFolder={() => onOpenFolder(game.id)}
                onUninstall={() => onUninstall(game.id)}
                onEditGame={() => onEditGame(game)}
                onDeleteGame={() => onDeleteGame(game.id)}
              />
            ))}
          </div>
        ) : (
          <div className="py-16 flex flex-col items-center justify-center text-center space-y-3 rounded-2xl border border-dashed border-ice-border bg-ice-card/40">
            <Gamepad2 className="w-10 h-10 text-ice-subtext opacity-50" />
            <h3 className="text-sm font-semibold text-white">Không tìm thấy trò chơi nào</h3>
            <p className="text-xs text-ice-subtext max-w-sm">
              {searchQuery
                ? 'Không có kết quả nào khớp với tìm kiếm.'
                : 'Thư viện game hiện đang trống. Hãy thêm game đầu tiên để bắt đầu trải nghiệm.'}
            </p>
          </div>
        )}
      </section>

      {/* Surprise Game Modal */}
      <SurpriseGameModal
        isOpen={isSurpriseOpen}
        onClose={() => setIsSurpriseOpen(false)}
        games={games}
        onSelectGame={onSelectGame}
        onLaunch={onLaunch}
      />
    </div>
  );
};
