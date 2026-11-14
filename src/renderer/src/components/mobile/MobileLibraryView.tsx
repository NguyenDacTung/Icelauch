import React, { useState } from 'react';
import {
  Bookmark,
  Gamepad2,
  Film,
  Music,
  Radio,
  Search,
  Plus,
  Play,
  User,
  LogIn,
  ChevronRight,
  Heart,
  ListPlus,
  ListMusic,
  Edit3,
  Trash2,
  X
} from 'lucide-react';
import type { Game, MediaItem, AppActionButton, UserProfile, NavigationTab, MediaPlaylist } from '../../types';
import { SafeImage } from '../common/SafeImage';
import { UserPlaylistModal } from '../media/UserPlaylistModal';
import { AddToPlaylistModal } from '../media/AddToPlaylistModal';
import { sfx } from '../../utils/sfx';

interface MobileLibraryViewProps {
  games: Game[];
  allMedia?: MediaItem[];
  userPlaylists?: MediaPlaylist[];
  selectedGameId?: string | null;
  isAdmin: boolean;
  activeProfile?: UserProfile | null;
  userLibraryIds?: string[];
  favoriteMediaIds?: string[];
  globalActionButtons?: AppActionButton[];
  onSelectGame: (game: Game) => void;
  onIncompatibleClick?: (game: Game) => void;
  onOpenFolder?: (id: string) => void;
  onToggleLibrary?: (id: string) => void;
  onSelectMedia?: (media: MediaItem) => void;
  onPlayAudio?: (track: MediaItem) => void;
  onToggleFavoriteMedia?: (id: string) => void;
  onSwitchProfile?: () => void;
  onNavigateTab?: (tab: NavigationTab) => void;
  onCreateUserPlaylist?: (name: string, type: 'video' | 'audio', initialMediaId?: string) => Promise<void>;
  onSaveUserPlaylist?: (playlist: MediaPlaylist) => Promise<void>;
  onDeleteUserPlaylist?: (id: string) => Promise<void>;
  onToggleItemInUserPlaylist?: (playlistId: string, mediaId: string) => Promise<void>;
}

export const MobileLibraryView: React.FC<MobileLibraryViewProps> = ({
  games,
  allMedia = [],
  userPlaylists = [],
  activeProfile,
  userLibraryIds = [],
  favoriteMediaIds = [],
  onSelectGame,
  onToggleLibrary,
  onSelectMedia,
  onPlayAudio,
  onToggleFavoriteMedia,
  onSwitchProfile,
  onNavigateTab,
  onCreateUserPlaylist,
  onSaveUserPlaylist,
  onDeleteUserPlaylist,
  onToggleItemInUserPlaylist,
}) => {
  // Mobile Library defaults to Phim ('videos') per user instruction!
  const [activeSubTab, setActiveSubTab] = useState<'videos' | 'music' | 'podcast' | 'games'>('videos');
  const [searchQuery, setSearchQuery] = useState('');
  const [isUserPlaylistModalOpen, setIsUserPlaylistModalOpen] = useState(false);
  const [editingUserPlaylist, setEditingUserPlaylist] = useState<MediaPlaylist | null>(null);
  const [targetMediaForPlaylist, setTargetMediaForPlaylist] = useState<MediaItem | null>(null);

  // 1. Resolve Personal User Library
  const profileLibraryIds = activeProfile?.library || userLibraryIds;
  const effectiveFavIds = activeProfile?.favoriteMedia || favoriteMediaIds;

  const libraryGames = games.filter((g) => profileLibraryIds.includes(g.id));
  const libraryVideos = allMedia.filter(
    (m) => m.type === 'video' && effectiveFavIds.includes(m.id)
  );
  const libraryMusic = allMedia.filter(
    (m) => m.type === 'audio' && (m.subType === 'music' || !m.subType) && effectiveFavIds.includes(m.id)
  );
  const libraryPodcasts = allMedia.filter(
    (m) => m.type === 'audio' && m.subType === 'podcast' && effectiveFavIds.includes(m.id)
  );

  const q = searchQuery.toLowerCase().trim();

  const filteredGames = libraryGames.filter((g) => g.name.toLowerCase().includes(q));
  const filteredVideos = libraryVideos.filter((m) => m.title.toLowerCase().includes(q));
  const filteredMusic = libraryMusic.filter((m) => m.title.toLowerCase().includes(q));
  const filteredPodcasts = libraryPodcasts.filter((m) => m.title.toLowerCase().includes(q));

  // User Playlists filtered by active media tab
  const currentTabPlaylists = userPlaylists.filter((p) => {
    const targetType = activeSubTab === 'videos' ? 'video' : 'audio';
    const matchesType = p.type === targetType;
    const matchesSearch = !q || p.name.toLowerCase().includes(q);
    return matchesType && matchesSearch;
  });

  return (
    <div className="flex-1 w-full h-full flex flex-col bg-[#07090E] select-none overflow-hidden relative">
      {/* 1. TOP MOBILE HEADER */}
      <header className="px-3.5 pt-3 pb-2.5 bg-[#12151F] border-b border-white/5 flex flex-col gap-2.5 shrink-0">
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

          {activeSubTab !== 'games' && onCreateUserPlaylist && (
            <button
              type="button"
              onClick={() => {
                sfx.playClick();
                setEditingUserPlaylist(null);
                setIsUserPlaylistModalOpen(true);
              }}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-cyan-500 text-black font-black text-[11px] shadow-md shadow-cyan-500/20 active:scale-95"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>Tạo Playlist</span>
            </button>
          )}
        </div>

        {/* 4 Sub-tab pills: Phim, Nhạc, Audio, Game (Default: Phim) */}
        <div className="flex items-center bg-black/40 p-1 rounded-xl border border-white/5 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => {
              sfx.playClick();
              setActiveSubTab('videos');
            }}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all ${
              activeSubTab === 'videos'
                ? 'bg-cyan-500 text-black shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Film className="w-3.5 h-3.5" />
            <span>Phim ({libraryVideos.length})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              sfx.playClick();
              setActiveSubTab('music');
            }}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all ${
              activeSubTab === 'music'
                ? 'bg-cyan-500 text-black shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Music className="w-3.5 h-3.5" />
            <span>Nhạc ({libraryMusic.length})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              sfx.playClick();
              setActiveSubTab('podcast');
            }}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all ${
              activeSubTab === 'podcast'
                ? 'bg-cyan-500 text-black shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Audio ({libraryPodcasts.length})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              sfx.playClick();
              setActiveSubTab('games');
            }}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all ${
              activeSubTab === 'games'
                ? 'bg-cyan-500 text-black shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Gamepad2 className="w-3.5 h-3.5" />
            <span>Game ({libraryGames.length})</span>
          </button>
        </div>

        {/* Search input */}
        <div className="relative w-full">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm trong thư viện của bạn..."
            className="w-full h-8 pl-8 pr-3 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
          />
        </div>
      </header>

      {/* 2. BODY CONTENT */}
      <div className="flex-1 w-full overflow-y-auto p-3.5 space-y-4 no-scrollbar">
        {/* CASE A: Guest Mode Prompt */}
        {!activeProfile && (
          <div className="p-4 rounded-2xl bg-gradient-to-br from-cyan-950/30 via-[#10141E] to-[#0D1017] border border-cyan-500/30 shadow-lg flex flex-col items-center text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
              <User className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h2 className="text-sm font-black text-white">Bạn Đang Ở Chế Độ Khách</h2>
              <p className="text-xs text-slate-300 max-w-[280px]">
                Hãy đăng nhập hoặc chọn hồ sơ để lưu trữ và đồng bộ Thư viện Game, Phim & Nhạc yêu thích của riêng bạn.
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

                    {/* Game Info */}
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

        {/* CASE C: MEDIA TABS (Videos, Music, Podcast) */}
        {activeSubTab !== 'games' && (
          <div className="space-y-4 pb-6">
            {/* Section 1: User Playlists */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-white flex items-center gap-1.5 uppercase tracking-wide">
                  <ListMusic className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Playlist Của Bạn</span>
                </span>
                <span className="text-[10px] text-cyan-400 font-semibold">
                  {currentTabPlaylists.length} danh sách
                </span>
              </div>

              {currentTabPlaylists.length > 0 ? (
                <div className="grid grid-cols-1 gap-2">
                  {currentTabPlaylists.map((pl) => {
                    const count = pl.itemIds?.length || 0;
                    const firstItem = pl.itemIds?.[0] ? allMedia.find((m) => m.id === pl.itemIds[0]) : null;

                    return (
                      <div
                        key={pl.id}
                        className="flex items-center justify-between p-3 rounded-2xl bg-[#12151F] border border-white/10 hover:border-cyan-500/40 transition-all shadow-md"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="w-12 h-12 rounded-xl bg-black/60 border border-white/10 flex items-center justify-center shrink-0 overflow-hidden relative">
                            {firstItem?.coverPath ? (
                              <SafeImage
                                src={firstItem.coverPath}
                                alt={pl.name}
                                title={pl.name}
                                fallbackType={pl.type === 'video' ? 'video' : 'audio'}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <ListMusic className="w-5 h-5 text-cyan-400" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="text-xs font-bold text-white truncate">{pl.name}</h4>
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              {count} {pl.type === 'video' ? 'video/tập phim' : 'bài hát/audio'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 pl-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              sfx.playClick();
                              if (firstItem) {
                                if (pl.type === 'video') onSelectMedia?.(firstItem);
                                else onPlayAudio?.(firstItem);
                              }
                            }}
                            disabled={count === 0}
                            className="p-2 rounded-xl bg-cyan-500/20 text-cyan-300 disabled:opacity-30 active:scale-95"
                            title="Phát playlist"
                          >
                            <Play className="w-3.5 h-3.5 fill-current" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              sfx.playClick();
                              setEditingUserPlaylist(pl);
                              setIsUserPlaylistModalOpen(true);
                            }}
                            className="p-2 rounded-xl text-slate-400 hover:text-cyan-300 hover:bg-white/5 transition-colors"
                            title="Sửa playlist"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          {onDeleteUserPlaylist && (
                            <button
                              type="button"
                              onClick={() => {
                                sfx.playClick();
                                if (confirm(`Bạn có chắc muốn xoá playlist "${pl.name}" không?`)) {
                                  onDeleteUserPlaylist(pl.id);
                                }
                              }}
                              className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-white/5 transition-colors"
                              title="Xoá playlist"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-[#12151F]/40 border border-dashed border-white/10 text-center space-y-1">
                  <p className="text-[11px] text-slate-400">Bạn chưa có danh sách phát nào</p>
                  {onCreateUserPlaylist && (
                    <button
                      type="button"
                      onClick={() => {
                        sfx.playClick();
                        setEditingUserPlaylist(null);
                        setIsUserPlaylistModalOpen(true);
                      }}
                      className="text-xs text-cyan-400 font-bold hover:underline"
                    >
                      + Tạo playlist mới ngay
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Section 2: Favorited Media (2-Column Grid 4:6 aspect ratio) */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-white flex items-center gap-1.5 uppercase tracking-wide">
                  <Heart className="w-3.5 h-3.5 text-rose-500 fill-current" />
                  <span>Đã Lưu & Yêu Thích</span>
                </span>
                <span className="text-[10px] text-slate-400 font-semibold">
                  {(activeSubTab === 'videos' ? filteredVideos : activeSubTab === 'music' ? filteredMusic : filteredPodcasts).length} mục
                </span>
              </div>

              {((activeSubTab === 'videos' ? filteredVideos : activeSubTab === 'music' ? filteredMusic : filteredPodcasts).length > 0) ? (
                <div className="grid grid-cols-2 gap-2.5">
                  {(activeSubTab === 'videos' ? filteredVideos : activeSubTab === 'music' ? filteredMusic : filteredPodcasts).map((item) => (
                    <div
                      key={item.id}
                      onClick={() => {
                        sfx.playClick();
                        if (item.type === 'video') onSelectMedia?.(item);
                        else onPlayAudio?.(item);
                      }}
                      className="rounded-2xl overflow-hidden bg-[#12151F] border border-white/10 cursor-pointer group hover:border-cyan-500/50 transition-all shadow-md flex flex-col active:scale-98"
                    >
                      <div className="relative aspect-[2/3] w-full bg-black overflow-hidden">
                        <SafeImage
                          src={item.coverPath || item.bannerPath}
                          alt={item.title}
                          title={item.title}
                          fallbackType={item.type === 'video' ? 'video' : item.subType === 'podcast' ? 'podcast' : 'audio'}
                          style={{
                            objectPosition: item.listCardPosition || item.coverPosition || '50% 50%',
                            transform: (item.listCardZoom || item.coverZoom) ? `scale(${item.listCardZoom || item.coverZoom})` : undefined,
                            transformOrigin: item.listCardPosition || item.coverPosition || '50% 50%',
                          }}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />

                        {/* Card action buttons */}
                        <div className="absolute top-1.5 right-1.5 flex items-center gap-1 z-10">
                          {onToggleItemInUserPlaylist && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                sfx.playClick();
                                setTargetMediaForPlaylist(item);
                              }}
                              className="p-1 rounded-full bg-black/70 text-white/80 hover:text-cyan-300 backdrop-blur-sm"
                              title="Thêm vào playlist"
                            >
                              <ListPlus className="w-3 h-3" />
                            </button>
                          )}
                          {onToggleFavoriteMedia && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                sfx.playClick();
                                onToggleFavoriteMedia(item.id);
                              }}
                              className="p-1 rounded-full bg-rose-500 text-white backdrop-blur-sm"
                              title="Bỏ thích"
                            >
                              <Heart className="w-3 h-3 fill-current" />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="p-2.5 flex-1 flex flex-col justify-between space-y-1">
                        <div>
                          <h4 className="text-xs font-bold text-white line-clamp-1 group-hover:text-cyan-400 transition-colors">
                            {item.title}
                          </h4>
                          <span className="text-[10px] text-slate-400 line-clamp-1">
                            {item.artist || item.category || (item.type === 'video' ? 'Phim' : 'Nhạc')}
                          </span>
                        </div>
                        <div className="pt-1 flex items-center justify-between text-[10px] text-cyan-400 font-semibold">
                          <span>{item.type === 'video' ? 'Xem ngay' : 'Phát'}</span>
                          <Play className="w-3 h-3 fill-current" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-500">
                    <Heart className="w-7 h-7 text-rose-500/50" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-white">Chưa Có Mục Yêu Thích</h3>
                    <p className="text-xs text-slate-400 max-w-[260px]">
                      Vào mục Giải Trí để bấm lưu và thưởng thức nội dung bạn yêu thích bất cứ lúc nào!
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
            </div>
          </div>
        )}
      </div>

      {/* User Playlist Modal */}
      {isUserPlaylistModalOpen && (
        <UserPlaylistModal
          isOpen={isUserPlaylistModalOpen}
          playlist={editingUserPlaylist}
          defaultType={activeSubTab === 'videos' ? 'video' : 'audio'}
          allItems={allMedia}
          onClose={() => {
            setIsUserPlaylistModalOpen(false);
            setEditingUserPlaylist(null);
          }}
          onSave={async (name, type, itemIds) => {
            if (editingUserPlaylist && onSaveUserPlaylist) {
              await onSaveUserPlaylist({
                ...editingUserPlaylist,
                name,
                type,
                itemIds: itemIds || [],
              });
            } else if (onCreateUserPlaylist) {
              await onCreateUserPlaylist(name, type);
            }
          }}
          onDelete={onDeleteUserPlaylist}
        />
      )}

      {/* Add To User Playlist Modal */}
      {targetMediaForPlaylist && onToggleItemInUserPlaylist && onCreateUserPlaylist && (
        <AddToPlaylistModal
          isOpen={Boolean(targetMediaForPlaylist)}
          onClose={() => setTargetMediaForPlaylist(null)}
          media={targetMediaForPlaylist}
          userPlaylists={userPlaylists}
          onToggleItemInPlaylist={onToggleItemInUserPlaylist}
          onCreatePlaylist={onCreateUserPlaylist}
        />
      )}
    </div>
  );
};
