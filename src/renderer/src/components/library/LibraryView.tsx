import React, { useState } from 'react';
import { 
  Play, 
  Download, 
  Settings, 
  FolderOpen, 
  RotateCcw, 
  X, 
  Clock, 
  HardDrive, 
  FileCode, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2,
  Gamepad2,
  BookmarkCheck,
  Search,
  Sparkles,
  Settings2,
  Film,
  Music,
  Mic,
  Plus,
  Heart,
  ListPlus,
  ListMusic,
  Edit3,
  Trash2
} from 'lucide-react';
import { GameSettingsModal } from './GameSettingsModal';
import { UserPlaylistModal } from '../media/UserPlaylistModal';
import { AddToPlaylistModal } from '../media/AddToPlaylistModal';
import { SafeImage } from '../common/SafeImage';
import type { Game, AppActionButton, MediaItem, MediaPlaylist } from '../../types';
import { GameActionsWidget } from '../common/GameActionsWidget';
import { sfx } from '../../utils/sfx';

interface LibraryViewProps {
  games: Game[];
  selectedGameId: string | null;
  isAdmin?: boolean;
  userLibraryIds?: string[];
  onSelectGame: (game: Game) => void;
  onOpenDetail?: (game: Game) => void;
  onLaunch: (id: string) => void;
  onDownload: (id: string) => void;
  onCancelDownload: (id: string) => void;
  onRetry: (id: string) => void;
  onOpenFolder: (id: string) => void;
  onOpenInstallSettings?: (game: Game) => void;
  onUninstall: (id: string) => void;
  onSaveGameSettings: (gameId: string, updates: Partial<Game>) => void;
  onSelectCustomExe: (gameId: string) => void;
  onAutoPickExe: (gameId: string) => void;
  onToggleLibrary: (id: string) => void;
  globalActionButtons?: AppActionButton[];
  // Media library props
  allMedia?: MediaItem[];
  userPlaylists?: MediaPlaylist[];
  favoriteMediaIds?: string[];
  onToggleFavoriteMedia?: (id: string) => void;
  onPlayMedia?: (item: MediaItem) => void;
  onCreateUserPlaylist?: (name: string, type: 'video' | 'audio', initialMediaId?: string) => Promise<void>;
  onSaveUserPlaylist?: (playlist: MediaPlaylist) => Promise<void>;
  onDeleteUserPlaylist?: (id: string) => Promise<void>;
  onToggleItemInUserPlaylist?: (playlistId: string, mediaId: string) => Promise<void>;
}

export const LibraryView: React.FC<LibraryViewProps> = ({
  games,
  selectedGameId,
  isAdmin = false,
  userLibraryIds,
  onSelectGame,
  onOpenDetail,
  onLaunch,
  onDownload,
  onCancelDownload,
  onRetry,
  onOpenFolder,
  onOpenInstallSettings,
  onUninstall,
  onSaveGameSettings,
  onSelectCustomExe,
  onAutoPickExe,
  onToggleLibrary,
  globalActionButtons = [],
  allMedia = [],
  userPlaylists = [],
  favoriteMediaIds = [],
  onToggleFavoriteMedia,
  onPlayMedia,
  onCreateUserPlaylist,
  onSaveUserPlaylist,
  onDeleteUserPlaylist,
  onToggleItemInUserPlaylist,
}) => {
  const [activeTab, setActiveTab] = useState<'game' | 'movie' | 'music' | 'podcast'>('game');
  const [filter, setFilter] = useState<'all' | 'installed' | 'downloading' | 'saved' | 'error'>('all');
  const [search, setSearch] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Media Library state
  const [mediaSearch, setMediaSearch] = useState('');
  const [isUserPlaylistModalOpen, setIsUserPlaylistModalOpen] = useState(false);
  const [editingUserPlaylist, setEditingUserPlaylist] = useState<MediaPlaylist | null>(null);
  const [targetMediaForPlaylist, setTargetMediaForPlaylist] = useState<MediaItem | null>(null);

  // Library contains games that are in personal library OR downloaded/installed
  const isPersonalInLibrary = (g: Game) => userLibraryIds ? userLibraryIds.includes(g.id) : g.inLibrary;

  const libraryGames = games.filter(
    (g) => (isAdmin || !g.hidden) && (isPersonalInLibrary(g) || g.status === 'ready' || g.status === 'downloading' || g.status === 'installing')
  );

  // Filter
  const filteredList = libraryGames.filter((g) => {
    const matchesSearch = g.name.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;

    if (filter === 'installed') return g.status === 'ready' || g.status === 'running';
    if (filter === 'downloading') return g.status === 'downloading' || g.status === 'installing';
    if (filter === 'saved') return g.status === 'uninstalled';
    if (filter === 'error') return g.status === 'error';
    return true;
  });

  const selectedGame = libraryGames.find((g) => g.id === selectedGameId) || filteredList[0];

  const formatBytes = (bytes?: number) => {
    if (!bytes) return 'Chưa xác định';
    const gb = bytes / (1024 * 1024 * 1024);
    return `${gb.toFixed(1)} GB`;
  };

  // Media calculations
  const currentTabMedia = allMedia.filter((m) => {
    if (activeTab === 'movie') return m.type === 'video';
    if (activeTab === 'music') return m.type === 'audio' && (m.subType === 'music' || !m.subType);
    if (activeTab === 'podcast') return m.type === 'audio' && m.subType === 'podcast';
    return false;
  });

  const favoriteTabMedia = currentTabMedia.filter(
    (m) =>
      favoriteMediaIds.includes(m.id) &&
      (!mediaSearch ||
        m.title.toLowerCase().includes(mediaSearch.toLowerCase()) ||
        (m.artist && m.artist.toLowerCase().includes(mediaSearch.toLowerCase())))
  );

  const tabUserPlaylists = userPlaylists.filter((p) => {
    const targetType = activeTab === 'movie' ? 'video' : 'audio';
    const matchesType = p.type === targetType;
    const matchesSearch = !mediaSearch || p.name.toLowerCase().includes(mediaSearch.toLowerCase());
    return matchesType && matchesSearch;
  });

  return (
    <div className="flex-1 flex flex-col overflow-hidden select-none">
      {/* 4-Tab Bar: Trò Chơi / Phim & Video / Âm Nhạc / Podcast & Audio */}
      <div className="flex items-center justify-between px-6 py-2.5 bg-ice-card/90 border-b border-ice-border/60 shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              sfx.playClick();
              setActiveTab('game');
            }}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'game'
                ? 'bg-amber-400 text-black shadow-md'
                : 'text-ice-subtext hover:text-white hover:bg-white/5'
            }`}
          >
            <Gamepad2 className="w-3.5 h-3.5" />
            <span>Trò Chơi ({libraryGames.length})</span>
          </button>

          <button
            onClick={() => {
              sfx.playClick();
              setActiveTab('movie');
            }}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'movie'
                ? 'bg-amber-400 text-black shadow-md'
                : 'text-ice-subtext hover:text-white hover:bg-white/5'
            }`}
          >
            <Film className="w-3.5 h-3.5" />
            <span>Phim & Video</span>
          </button>

          <button
            onClick={() => {
              sfx.playClick();
              setActiveTab('music');
            }}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'music'
                ? 'bg-amber-400 text-black shadow-md'
                : 'text-ice-subtext hover:text-white hover:bg-white/5'
            }`}
          >
            <Music className="w-3.5 h-3.5" />
            <span>Âm Nhạc</span>
          </button>

          <button
            onClick={() => {
              sfx.playClick();
              setActiveTab('podcast');
            }}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'podcast'
                ? 'bg-amber-400 text-black shadow-md'
                : 'text-ice-subtext hover:text-white hover:bg-white/5'
            }`}
          >
            <Mic className="w-3.5 h-3.5" />
            <span>Podcast & Audio</span>
          </button>
        </div>
      </div>

      {/* Main Tab Content */}
      {activeTab === 'game' ? (
        <div className="flex-1 flex overflow-hidden">
          {/* LEFT COLUMN: Game List (Width: 260px) */}
          <div className="w-64 bg-ice-card/95 border-r border-ice-border flex flex-col flex-shrink-0">
        {/* Search & Filter */}
        <div className="p-3 border-b border-ice-border space-y-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-ice-subtext absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm game..."
              className="w-full h-7 pl-8 pr-2 rounded bg-ice-bg border border-ice-border text-xs text-white placeholder-ice-subtext focus:outline-none focus:border-ice-accent"
            />
          </div>

          <div className="flex items-center gap-1 overflow-x-auto text-[11px] pb-1">
            <button
              onClick={() => setFilter('all')}
              className={`px-2 py-0.5 rounded transition-colors whitespace-nowrap ${
                filter === 'all' ? 'bg-ice-accent text-white font-semibold' : 'text-ice-subtext hover:text-white'
              }`}
            >
              Tất cả ({libraryGames.length})
            </button>
            <button
              onClick={() => setFilter('installed')}
              className={`px-2 py-0.5 rounded transition-colors whitespace-nowrap ${
                filter === 'installed' ? 'bg-ice-accent text-white font-semibold' : 'text-ice-subtext hover:text-white'
              }`}
            >
              Đã cài
            </button>
            <button
              onClick={() => setFilter('downloading')}
              className={`px-2 py-0.5 rounded transition-colors whitespace-nowrap ${
                filter === 'downloading' ? 'bg-ice-accent text-white font-semibold' : 'text-ice-subtext hover:text-white'
              }`}
            >
              Đang tải
            </button>
          </div>
        </div>

        {/* List of Games */}
        <div className="flex-1 overflow-y-auto divide-y divide-ice-border/40">
          {filteredList.length === 0 ? (
            <div className="p-6 text-center text-xs text-ice-subtext">
              Không có game nào trong mục này
            </div>
          ) : (
            filteredList.map((game) => {
              const isSelected = selectedGame?.id === game.id;
              const isReady = game.status === 'ready';
              const isRunning = game.status === 'running';
              const isDownloading = game.status === 'downloading';
              const isInstalling = game.status === 'installing';
              const isError = game.status === 'error';

              const percent = isInstalling
                ? game.installProgress?.percentage || 0
                : isDownloading
                ? game.downloadProgress?.percentage || 0
                : 0;

              return (
                <div
                  key={game.id}
                  onClick={() => onSelectGame(game)}
                  className={`flex items-center gap-2.5 px-3 py-2.5 cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-ice-accent/15 border-l-2 border-ice-accent text-white font-semibold'
                      : 'hover:bg-ice-hover text-ice-text/90'
                  }`}
                >
                  <img
                    src={game.coverPath || 'https://via.placeholder.com/40x55'}
                    alt={game.name}
                    style={{ objectPosition: game.coverPosition || '50% 50%' }}
                    className="w-7 h-10 object-cover rounded border border-ice-border flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs truncate">{game.name}</p>
                    <div className="flex items-center gap-1.5 mt-0.5 text-[10px]">
                      {isReady && (
                        <span className="flex items-center gap-1 text-ice-success">
                          <span className="w-1.5 h-1.5 rounded-full bg-ice-success" />
                          Sẵn sàng
                        </span>
                      )}
                      {isRunning && (
                        <span className="flex items-center gap-1 text-ice-accent font-semibold animate-pulse">
                          Đang chạy
                        </span>
                      )}
                      {(isDownloading || isInstalling) && (
                        <span className="text-ice-accent font-medium">
                          {isInstalling ? 'Cài' : 'Tải'} {percent}%
                        </span>
                      )}
                      {isError && (
                        <span className="text-ice-error font-medium">Lỗi</span>
                      )}
                      {game.status === 'uninstalled' && (
                        <span className="text-ice-subtext">Đã lưu</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: Detail View of Selected Game */}
      {selectedGame ? (
        <div className="flex-1 flex flex-col overflow-y-auto bg-ice-bg relative">
          {/* Hero Banner Header with crisp artwork */}
          <div className="relative h-80 lg:h-96 w-full overflow-hidden flex-shrink-0 bg-ice-card">
            <img
              src={selectedGame.bannerPath || selectedGame.coverPath || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1600&q=80'}
              alt={selectedGame.name}
              style={{ 
                objectPosition: selectedGame.bannerPosition || selectedGame.coverPosition || '50% 50%',
                transform: selectedGame.bannerZoom ? `scale(${selectedGame.bannerZoom})` : undefined,
                transformOrigin: selectedGame.bannerPosition || selectedGame.coverPosition || '50% 50%',
                filter: selectedGame.bannerBlur ? `blur(${selectedGame.bannerBlur}px) brightness(0.88) contrast(1.05)` : undefined
              }}
              className="w-full h-full object-cover filter brightness-[0.88] contrast-[1.05]"
            />

            {/* Optional custom banner darkness overlay */}
            {selectedGame.bannerDarkness !== undefined && selectedGame.bannerDarkness > 0 && (
              <div
                className="absolute inset-0 pointer-events-none"
                style={{ backgroundColor: `rgba(15, 17, 21, ${selectedGame.bannerDarkness / 100})` }}
              />
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-ice-bg via-ice-bg/60 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-ice-bg/80 via-transparent to-transparent w-2/3" />

            {/* Poster & Title Content */}
            <div className="absolute bottom-6 left-8 right-8 flex items-end gap-6 z-10">
              <img
                src={selectedGame.coverPath || 'https://via.placeholder.com/150x225'}
                alt={selectedGame.name}
                style={{ 
                  objectPosition: selectedGame.coverPosition || '50% 50%',
                  transform: selectedGame.coverZoom ? `scale(${selectedGame.coverZoom})` : undefined,
                  transformOrigin: selectedGame.coverPosition || '50% 50%',
                }}
                className="w-36 h-52 object-cover rounded-xl shadow-2xl border-2 border-white/20 flex-shrink-0"
              />

              <div className="flex-1 min-w-0 space-y-2.5">
                <div className="flex flex-wrap items-center gap-2">
                  {selectedGame.hidden && (
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      [ĐÃ ẨN]
                    </span>
                  )}
                  {(selectedGame.tags || (selectedGame.genre ? selectedGame.genre.split(',').map(s => s.trim()) : [])).map((t) => (
                    <span key={t} className="px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wider uppercase bg-ice-accent/30 text-ice-accent border border-ice-accent/40 backdrop-blur-md">
                      {t}
                    </span>
                  ))}
                  {selectedGame.status === 'ready' && (
                    <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs text-emerald-400 font-semibold bg-emerald-500/20 border border-emerald-500/30 backdrop-blur-md">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Đã cài đặt
                    </span>
                  )}
                </div>

                <h1 className="text-3xl font-extrabold text-white tracking-tight drop-shadow-md truncate">
                  {selectedGame.name}
                </h1>

                <div className="flex items-center gap-4 text-xs text-ice-subtext">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    Lần chơi cuối: {selectedGame.lastPlayed || 'Chưa chơi'}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1.5">
                    <HardDrive className="w-3.5 h-3.5" />
                    Dung lượng: {formatBytes(selectedGame.expectedSize)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="bg-ice-card border-y border-ice-border px-8 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Primary Action Button */}
              {selectedGame.status === 'ready' && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onLaunch(selectedGame.id)}
                    className="h-11 px-8 rounded-md bg-ice-success hover:bg-[#34a544] text-white text-sm font-bold tracking-wider uppercase flex items-center gap-2.5 shadow-lg hover:shadow-ice-success/20 transition-all transform active:scale-95"
                  >
                    <Play className="w-5 h-5 fill-white" />
                    <span>CHƠI NGAY</span>
                  </button>

                  {selectedGame.controllerConfig?.mode && selectedGame.controllerConfig.mode !== 'disabled' && (
                    <button
                      type="button"
                      onClick={() => {
                        if (window.api?.broadcastController) {
                          window.api.broadcastController({
                            type: 'launch_controller',
                            gameId: selectedGame.id,
                            gameTitle: selectedGame.name,
                            config: selectedGame.controllerConfig,
                          });
                        }
                        onLaunch(selectedGame.id);
                      }}
                      className="h-11 px-4 rounded-md bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center gap-2 transition-all shadow"
                      title="Khởi động game đồng thời mở tay cầm ảo trên điện thoại"
                    >
                      <Gamepad2 className="w-4 h-4 text-amber-400" />
                      <span>Tay Cầm ĐT</span>
                    </button>
                  )}

                  {onOpenInstallSettings && (
                    <button
                      type="button"
                      onClick={() => onOpenInstallSettings(selectedGame)}
                      className="w-11 h-11 rounded-md bg-white/10 hover:bg-white/20 border border-white/20 text-white flex items-center justify-center transition-all shadow-md active:scale-95 shrink-0"
                      title="Cài đặt game & bố cục điều khiển điện thoại"
                    >
                      <Settings2 className="w-5 h-5 text-amber-400" />
                    </button>
                  )}
                </div>
              )}

              {selectedGame.status === 'running' && (
                <button
                  disabled
                  className="h-11 px-8 rounded-md bg-ice-hover text-ice-subtext text-sm font-bold flex items-center gap-2.5 cursor-not-allowed opacity-80"
                >
                  <span>GAME ĐANG CHẠY...</span>
                </button>
              )}

              {selectedGame.status === 'uninstalled' && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onDownload(selectedGame.id)}
                    className="h-11 px-8 rounded-md bg-ice-accent hover:bg-ice-accentHover text-white text-sm font-bold tracking-wider uppercase flex items-center gap-2.5 shadow-lg hover:shadow-ice-accent/20 transition-all transform active:scale-95"
                  >
                    <Download className="w-5 h-5" />
                    <span>TẢI GAME VỀ MÁY</span>
                  </button>
                  {onOpenInstallSettings && (
                    <button
                      type="button"
                      onClick={() => onOpenInstallSettings(selectedGame)}
                      className="w-11 h-11 rounded-md bg-white/10 hover:bg-white/20 border border-white/20 text-white flex items-center justify-center transition-all shadow-md active:scale-95 shrink-0"
                      title="Cài đặt nơi lưu file game & xem dung lượng ổ đĩa"
                    >
                      <Settings2 className="w-5 h-5 text-amber-400" />
                    </button>
                  )}
                </div>
              )}

              {(selectedGame.status === 'downloading' || selectedGame.status === 'installing') && (
                <button
                  onClick={() => onCancelDownload(selectedGame.id)}
                  className="h-11 px-6 rounded-md border border-ice-border hover:border-ice-error text-ice-subtext hover:text-ice-error text-xs font-semibold flex items-center gap-2 transition-colors"
                >
                  <X className="w-4 h-4" />
                  <span>Huỷ tiến trình</span>
                </button>
              )}

              {selectedGame.status === 'error' && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onRetry(selectedGame.id)}
                    className="h-11 px-6 rounded-md bg-ice-error/20 border border-ice-error/40 hover:bg-ice-error/30 text-ice-error text-xs font-bold flex items-center gap-2 transition-colors"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Thử lại</span>
                  </button>
                  <button
                    onClick={() => onCancelDownload(selectedGame.id)}
                    className="h-11 px-4 rounded-md border border-ice-border hover:border-ice-error text-ice-subtext hover:text-ice-error text-xs font-semibold flex items-center gap-2 transition-colors"
                    title="Hủy / Đặt lại trạng thái game"
                  >
                    <X className="w-4 h-4" />
                    <span>Hủy</span>
                  </button>
                </div>
              )}

              {/* View Store / Detail Page Button */}
              {onOpenDetail && (
                <button
                  onClick={() => onOpenDetail(selectedGame)}
                  className="h-11 px-4 rounded-md bg-ice-bg hover:bg-ice-hover border border-ice-border text-amber-300 hover:text-white text-xs font-bold flex items-center gap-2 transition-colors"
                  title="Xem trang giới thiệu & Trailer"
                >
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Trang Chi Tiết Game</span>
                </button>
              )}

              {/* Game Settings Button (Gear icon) */}
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="h-11 px-4 rounded-md bg-ice-bg hover:bg-ice-hover border border-ice-border text-ice-text hover:text-white text-xs font-semibold flex items-center gap-2 transition-colors"
                title="Cài đặt game"
              >
                <Settings className="w-4 h-4 text-ice-subtext" />
                <span>Cài đặt game</span>
              </button>

              {/* Open Folder Button */}
              {selectedGame.status === 'ready' && (
                <button
                  onClick={() => onOpenFolder(selectedGame.id)}
                  className="h-11 px-4 rounded-md bg-ice-bg hover:bg-ice-hover border border-ice-border text-ice-text hover:text-white text-xs font-semibold flex items-center gap-2 transition-colors"
                  title="Mở thư mục game"
                >
                  <FolderOpen className="w-4 h-4 text-amber-400" />
                  <span>Mở thư mục</span>
                </button>
              )}
            </div>

            <button
              onClick={() => onToggleLibrary(selectedGame.id)}
              className="text-xs text-ice-subtext hover:text-white transition-colors flex items-center gap-1.5"
            >
              <BookmarkCheck className="w-4 h-4 text-ice-accent" />
              <span>Đang lưu trong Thư viện</span>
            </button>
          </div>

          {/* Progress Banner (when downloading/installing) */}
          {(selectedGame.status === 'downloading' || selectedGame.status === 'installing') && (
            <div className="mx-8 my-4 p-4 rounded-lg bg-ice-card border border-ice-accent/30 space-y-2">
              <div className="flex justify-between items-center text-xs font-semibold text-white">
                <span>
                  {selectedGame.status === 'installing' ? 'Đang cài đặt game' : 'Đang tải file game...'}
                </span>
                <span className="text-ice-accent">
                  {selectedGame.status === 'installing'
                    ? `${selectedGame.installProgress?.percentage || 0}%`
                    : `${selectedGame.downloadProgress?.percentage || 0}%`}
                </span>
              </div>
              <div className="h-2 w-full bg-ice-bg rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 rounded-full ${
                    selectedGame.status === 'installing' ? 'bg-amber-400' : 'bg-ice-accent'
                  }`}
                  style={{
                    width: `${
                      selectedGame.status === 'installing'
                        ? selectedGame.installProgress?.percentage || 0
                        : selectedGame.downloadProgress?.percentage || 0
                    }%`,
                  }}
                />
              </div>
              {selectedGame.downloadProgress && (
                <div className="flex justify-between items-center text-[11px] text-ice-subtext">
                  <span>Tốc độ: {selectedGame.downloadProgress.speedMBps.toFixed(1)} MB/s</span>
                  <span>
                    Đã tải: {(selectedGame.downloadProgress.bytesDownloaded / (1024 * 1024 * 1024)).toFixed(2)} GB /{' '}
                    {(selectedGame.downloadProgress.totalBytes / (1024 * 1024 * 1024)).toFixed(2)} GB
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Notification when multiple exe candidates found (Section 6.4) */}
          {selectedGame.exeCandidates && selectedGame.exeCandidates.length > 1 && (
            <div className="mx-8 my-3 px-4 py-2.5 rounded-lg bg-ice-accent/15 border border-ice-accent/30 flex items-center justify-between text-xs text-ice-accent">
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4" />
                <span>
                  Tìm thấy {selectedGame.exeCandidates.length} file chạy, đã tự động chọn:{' '}
                  <strong className="text-white">{selectedGame.mainExe || selectedGame.exeCandidates[0]}</strong>
                </span>
              </div>
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="px-2.5 py-1 rounded bg-ice-accent hover:bg-ice-accentHover text-white text-[11px] font-bold"
              >
                Đổi file chạy
              </button>
            </div>
          )}

          {/* Main Content Details */}
          <div className="p-8 space-y-6">
            {/* Game Requirements & Quick Actions Widget */}
            {(selectedGame.requirementsText || (selectedGame.actionButtonIds && selectedGame.actionButtonIds.length > 0)) && (
              <GameActionsWidget
                requirementsText={selectedGame.requirementsText}
                buttons={globalActionButtons.filter((b) => selectedGame.actionButtonIds?.includes(b.id))}
              />
            )}

            <div className="space-y-2">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Giới thiệu & Ghi chú
              </h3>
              <p className="text-xs text-ice-text/80 leading-relaxed max-w-3xl">
                {selectedGame.description || 'Chưa có mô tả cho game này.'}
              </p>
            </div>

            {/* Installation Details info table */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Thông tin cài đặt
              </h3>
              <div className="grid grid-cols-2 max-w-xl gap-2 text-xs bg-ice-card p-4 rounded-lg border border-ice-border">
                <div className="text-ice-subtext">Thư mục cài đặt:</div>
                <div className="text-white font-mono text-[11px] truncate" title={selectedGame.installPath}>
                  {selectedGame.installPath || `Games/${selectedGame.name}`}
                </div>
                <div className="text-ice-subtext">File chạy chính:</div>
                <div className="text-white font-mono text-[11px] truncate">
                  {selectedGame.mainExe || '(Chưa cấu hình)'}
                </div>
                <div className="text-ice-subtext">Quyền Quản trị (Admin UAC):</div>
                <div className="text-white">
                  {selectedGame.runAsAdmin ? 'Có (bật)' : 'Không'}
                </div>
                <div className="text-ice-subtext">Ngày thêm vào danh mục:</div>
                <div className="text-white">
                  {new Date(selectedGame.addedAt).toLocaleDateString('vi-VN')}
                </div>
              </div>
            </div>
          </div>

          {/* Settings Modal */}
          <GameSettingsModal
            game={selectedGame}
            isOpen={isSettingsOpen}
            onClose={() => setIsSettingsOpen(false)}
            onSaveSettings={onSaveGameSettings}
            onSelectCustomExe={onSelectCustomExe}
            onAutoPickExe={onAutoPickExe}
            onOpenFolder={onOpenFolder}
            onUninstall={onUninstall}
          />
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-ice-subtext">
          <Gamepad2 className="w-12 h-12 opacity-40 mb-3" />
          <h3 className="text-sm font-semibold text-white">Chưa chọn game nào</h3>
          <p className="text-xs max-w-sm mt-1">
            Chọn một game trong danh sách bên trái hoặc chuyển sang tab Trang chủ để khám phá.
          </p>
        </div>
      )}
    </div>
  ) : (
    /* MEDIA LIBRARY VIEW (Movie, Music, Podcast) */
    <div className="flex-1 overflow-y-auto px-8 py-6 space-y-8">
      {/* Sub-Header: Search & Create Playlist */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-ice-border/60 pb-4">
        <div className="relative w-72">
          <Search className="w-4 h-4 text-ice-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={mediaSearch}
            onChange={(e) => setMediaSearch(e.target.value)}
            placeholder={`Tìm kiếm trong ${activeTab === 'movie' ? 'phim' : activeTab === 'music' ? 'nhạc' : 'podcast'}...`}
            className="w-full bg-ice-card border border-ice-border rounded-xl pl-9.5 pr-4 py-2 text-xs text-white placeholder-ice-muted focus:outline-none focus:border-amber-400 shadow-inner"
          />
          {mediaSearch && (
            <button
              onClick={() => setMediaSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ice-muted hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {onCreateUserPlaylist && (
          <button
            onClick={() => {
              sfx.playClick();
              setEditingUserPlaylist(null);
              setIsUserPlaylistModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs transition-all shadow-md active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Tạo Playlist Mới</span>
          </button>
        )}
      </div>

      {/* Section 1: User Custom Playlists */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <ListMusic className="w-4 h-4 text-amber-400" />
            <span>Danh Sách Phát Của Bạn</span>
            <span className="text-xs text-ice-muted font-mono font-normal">({tabUserPlaylists.length})</span>
          </h3>
        </div>

        {tabUserPlaylists.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {tabUserPlaylists.map((pl) => {
              const count = pl.itemIds?.length || 0;
              const firstItem = pl.itemIds?.[0] ? allMedia.find((m) => m.id === pl.itemIds[0]) : null;

              return (
                <div
                  key={pl.id}
                  className="group bg-ice-card border border-ice-border hover:border-amber-400/70 rounded-2xl p-4 flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-xl bg-black/60 border border-white/10 flex items-center justify-center shrink-0 overflow-hidden relative">
                      {firstItem?.coverPath ? (
                        <img
                          src={firstItem.coverPath.startsWith('http') ? firstItem.coverPath : `file://${firstItem.coverPath}`}
                          alt={pl.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <ListMusic className="w-6 h-6 text-amber-400" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-bold text-white truncate group-hover:text-amber-300 transition-colors">
                        {pl.name}
                      </h4>
                      <p className="text-[11px] text-ice-muted mt-0.5">
                        {count} {pl.type === 'video' ? 'tập phim' : 'bài hát'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 mt-3 border-t border-white/5">
                    <button
                      onClick={() => {
                        sfx.playClick();
                        if (firstItem && onPlayMedia) {
                          onPlayMedia(firstItem);
                        }
                      }}
                      disabled={count === 0}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-400/10 hover:bg-amber-400/20 text-amber-300 text-xs font-bold disabled:opacity-40 transition-colors"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Phát</span>
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          sfx.playClick();
                          setEditingUserPlaylist(pl);
                          setIsUserPlaylistModalOpen(true);
                        }}
                        className="p-1.5 rounded-lg text-ice-subtext hover:text-amber-400 hover:bg-white/5 transition-colors"
                        title="Sắp xếp & Đổi tên"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      {onDeleteUserPlaylist && (
                        <button
                          onClick={() => {
                            sfx.playClick();
                            if (confirm(`Bạn có chắc muốn xoá danh sách "${pl.name}" không?`)) {
                              onDeleteUserPlaylist(pl.id);
                            }
                          }}
                          className="p-1.5 rounded-lg text-ice-subtext hover:text-rose-400 hover:bg-white/5 transition-colors"
                          title="Xoá playlist"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 rounded-2xl bg-ice-card/40 border border-dashed border-white/10 text-center space-y-2">
            <ListMusic className="w-8 h-8 text-ice-muted mx-auto opacity-50" />
            <p className="text-xs text-ice-muted">Bạn chưa tạo danh sách phát nào trong danh mục này</p>
            {onCreateUserPlaylist && (
              <button
                onClick={() => {
                  sfx.playClick();
                  setEditingUserPlaylist(null);
                  setIsUserPlaylistModalOpen(true);
                }}
                className="text-xs text-amber-400 font-bold hover:underline inline-block pt-1"
              >
                + Tạo danh sách phát đầu tiên
              </button>
            )}
          </div>
        )}
      </section>

      {/* Section 2: Favorited Items */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Heart className="w-4 h-4 text-rose-500 fill-current" />
            <span>Nội Dung Đã Lưu & Yêu Thích</span>
            <span className="text-xs text-ice-muted font-mono font-normal">({favoriteTabMedia.length})</span>
          </h3>
        </div>

        {favoriteTabMedia.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {favoriteTabMedia.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  sfx.playClick();
                  onPlayMedia?.(item);
                }}
                className="group relative bg-ice-card rounded-2xl overflow-hidden border border-ice-border hover:border-amber-400/80 hover:shadow-2xl cursor-pointer transition-all duration-300 hover:-translate-y-1.5 flex flex-col"
              >
                <div className="aspect-[2/3] w-full relative overflow-hidden bg-black flex items-center justify-center">
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

                  {/* Action buttons */}
                  <div className="absolute top-2 right-2 flex items-center gap-1 z-10">
                    {onToggleItemInUserPlaylist && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          sfx.playClick();
                          setTargetMediaForPlaylist(item);
                        }}
                        className="p-1.5 rounded-full bg-black/70 text-white/70 hover:text-amber-400 backdrop-blur-md"
                        title="Thêm vào playlist cá nhân"
                      >
                        <ListPlus className="w-3.5 h-3.5" />
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
                        className="p-1.5 rounded-full bg-rose-500 text-white backdrop-blur-md"
                        title="Bỏ thích"
                      >
                        <Heart className="w-3.5 h-3.5 fill-current" />
                      </button>
                    )}
                  </div>

                  <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 flex items-center justify-center transition-colors">
                    <div className="w-10 h-10 rounded-full bg-amber-400 text-black flex items-center justify-center shadow-lg transform scale-75 opacity-0 group-hover:opacity-100 group-hover:scale-100 transition-all">
                      <Play className="w-4 h-4 fill-black ml-0.5" />
                    </div>
                  </div>
                </div>

                <div className="p-3">
                  <h4 className="text-xs font-bold text-white truncate group-hover:text-amber-300 transition-colors">
                    {item.title}
                  </h4>
                  <p className="text-[10px] text-ice-muted truncate mt-0.5">
                    {item.artist || item.category || 'Nội dung'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center text-ice-muted space-y-2">
            <Heart className="w-8 h-8 mx-auto opacity-30 text-rose-500" />
            <p className="text-xs">Chưa có nội dung nào được thêm vào yêu thích trong mục này.</p>
          </div>
        )}
      </section>
    </div>
  )}

  {/* User Playlist Modal (Create or Edit) */}
  {isUserPlaylistModalOpen && (
    <UserPlaylistModal
      isOpen={isUserPlaylistModalOpen}
      playlist={editingUserPlaylist}
      defaultType={activeTab === 'movie' ? 'video' : 'audio'}
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

