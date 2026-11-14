import React, { useState } from 'react';
import { 
  Play, 
  Download, 
  RotateCcw, 
  X, 
  Bookmark, 
  BookmarkCheck, 
  MoreVertical, 
  FolderOpen, 
  Trash2, 
  Edit3, 
  Gamepad2,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff
} from 'lucide-react';
import type { Game } from '../../types';

interface GameCardProps {
  game: Game;
  isAdmin: boolean;
  onDownload: (id: string) => void;
  onCancelDownload: (id: string) => void;
  onRetry: (id: string) => void;
  onLaunch: (id: string) => void;
  onToggleLibrary: (id: string) => void;
  onToggleHide?: (id: string) => void;
  onSelectGame: (game: Game) => void;
  onOpenFolder: (id: string) => void;
  onUninstall: (id: string) => void;
  onEditGame: (game: Game) => void;
  onDeleteGame: (id: string) => void;
}

export const GameCard: React.FC<GameCardProps> = ({
  game,
  isAdmin,
  onDownload,
  onCancelDownload,
  onRetry,
  onLaunch,
  onToggleLibrary,
  onToggleHide,
  onSelectGame,
  onOpenFolder,
  onUninstall,
  onEditGame,
  onDeleteGame,
}) => {
  const [showMenu, setShowMenu] = useState(false);

  const isDownloading = game.status === 'downloading';
  const isInstalling = game.status === 'installing';
  const isReady = game.status === 'ready';
  const isRunning = game.status === 'running';
  const isError = game.status === 'error';
  const isUninstalled = game.status === 'uninstalled';

  const progressPercent = isInstalling
    ? game.installProgress?.percentage || 0
    : isDownloading
    ? game.downloadProgress?.percentage || 0
    : 0;

  return (
    <div 
      className="group relative flex flex-col bg-ice-card rounded-lg overflow-hidden border border-ice-border hover:border-ice-accent/60 hover:shadow-xl hover:-translate-y-1 transition-all duration-200 select-none"
    >
      {/* Cover Image Container (2:3 Aspect Ratio) */}
      <div 
        onClick={() => onSelectGame(game)}
        className="relative aspect-cover w-full overflow-hidden cursor-pointer bg-[#12141A]"
      >
        <img
          src={game.coverPath || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=600&q=80'}
          alt={game.name}
          style={{ 
            objectPosition: game.listCardPosition || game.coverPosition || '50% 50%',
            transform: (game.listCardZoom || game.coverZoom) ? `scale(${game.listCardZoom || game.coverZoom})` : undefined,
            transformOrigin: game.listCardPosition || game.coverPosition || '50% 50%',
            filter: game.coverSharpen ? `contrast(${1 + (game.coverSharpen / 100) * 0.25}) brightness(${1 + (game.coverSharpen / 100) * 0.04}) saturate(${1 + (game.coverSharpen / 100) * 0.08})` : undefined,
            imageRendering: game.coverSharpen ? '-webkit-optimize-contrast' : 'auto'
          }}
          className="w-full h-full object-cover transition-transform duration-300"
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-ice-card via-transparent to-transparent opacity-80" />

        {/* Top Badges: InLibrary & 3-Dot Menu */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleLibrary(game.id);
              }}
              className={`p-1.5 rounded-full backdrop-blur-md transition-colors ${
                game.inLibrary 
                  ? 'bg-ice-accent text-white shadow-md' 
                  : 'bg-black/60 text-white/70 hover:text-white hover:bg-black/80'
              }`}
              title={game.inLibrary ? 'Đã có trong thư viện' : 'Lưu vào thư viện'}
            >
              {game.inLibrary ? <BookmarkCheck className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
            </button>

            {game.controllerConfig?.mode && game.controllerConfig.mode !== 'disabled' && (
              <div
                title={`Điều khiển điện thoại: ${game.controllerConfig.presetName || 'Bật'}`}
                className="p-1.5 rounded-full backdrop-blur-md bg-amber-400 text-black shadow-md flex items-center justify-center"
              >
                <Gamepad2 className="w-3.5 h-3.5" />
              </div>
            )}

            {game.hidden && (
              <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-amber-500/90 text-black shadow">
                ĐÃ ẨN
              </span>
            )}
          </div>

          {/* 3-Dot Menu Button */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className="p-1.5 rounded-full bg-black/60 backdrop-blur-md text-white/70 hover:text-white hover:bg-black/80 transition-colors"
            >
              <MoreVertical className="w-3.5 h-3.5" />
            </button>

            {/* Dropdown Menu */}
            {showMenu && (
              <div 
                onClick={(e) => e.stopPropagation()}
                className="absolute right-0 top-8 w-44 bg-ice-card border border-ice-border rounded-lg shadow-2xl py-1 z-30 text-xs"
              >
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onSelectGame(game);
                  }}
                  className="w-full px-3 py-2 text-left hover:bg-ice-hover text-ice-text flex items-center gap-2"
                >
                  <Gamepad2 className="w-3.5 h-3.5 text-ice-accent" />
                  <span>Chi tiết game</span>
                </button>

                {(isReady || isRunning) && (
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onOpenFolder(game.id);
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-ice-hover text-ice-text flex items-center gap-2"
                  >
                    <FolderOpen className="w-3.5 h-3.5 text-amber-400" />
                    <span>Mở thư mục game</span>
                  </button>
                )}

                {isReady && (
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onUninstall(game.id);
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-ice-hover text-ice-error flex items-center gap-2"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Gỡ cài đặt</span>
                  </button>
                )}

                {isAdmin && (
                  <>
                    <div className="my-1 border-t border-ice-border" />
                    {onToggleHide && (
                      <button
                        onClick={() => {
                          setShowMenu(false);
                          onToggleHide(game.id);
                        }}
                        className={`w-full px-3 py-2 text-left hover:bg-ice-hover flex items-center gap-2 ${
                          game.hidden ? 'text-amber-400 font-bold' : 'text-ice-subtext hover:text-white'
                        }`}
                      >
                        {game.hidden ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                        <span>{game.hidden ? 'Bỏ ẩn (Hiện lại)' : 'Ẩn game này'}</span>
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        onEditGame(game);
                      }}
                      className="w-full px-3 py-2 text-left hover:bg-ice-hover text-amber-300 flex items-center gap-2"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Sửa thông tin</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        onDeleteGame(game.id);
                      }}
                      className="w-full px-3 py-2 text-left hover:bg-ice-hover text-ice-error flex items-center gap-2"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Xoá khỏi Icelauch</span>
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Status Indicator Pill */}
        <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between text-[11px] font-medium">
          {isReady && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-ice-success/20 text-ice-success border border-ice-success/40 backdrop-blur-md">
              <span className="w-1.5 h-1.5 rounded-full bg-ice-success animate-pulse" />
              Sẵn sàng
            </span>
          )}
          {isRunning && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-ice-accent/20 text-ice-accent border border-ice-accent/40 backdrop-blur-md">
              <span className="w-1.5 h-1.5 rounded-full bg-ice-accent animate-ping" />
              Đang chạy
            </span>
          )}
          {isDownloading && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-ice-accent/20 text-ice-accent border border-ice-accent/40 backdrop-blur-md">
              Đang tải · {progressPercent}%
            </span>
          )}
          {isInstalling && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 backdrop-blur-md">
              Đang cài · {progressPercent}%
            </span>
          )}
          {isError && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-ice-error/20 text-ice-error border border-ice-error/40 backdrop-blur-md">
              <AlertCircle className="w-3 h-3" />
              Lỗi
            </span>
          )}
          {(game.tags && game.tags.length > 0 ? game.tags[0] : game.genre) && (
            <span className="text-[10px] text-ice-subtext/90 ml-auto bg-black/50 px-2 py-0.5 rounded-full border border-white/10 backdrop-blur-sm truncate max-w-[100px]">
              {game.tags && game.tags.length > 0 ? game.tags[0] : game.genre}
            </span>
          )}
        </div>

        {/* Thin bottom progress bar for downloading / installing */}
        {(isDownloading || isInstalling) && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/40">
            <div 
              className={`h-full transition-all duration-300 ${isInstalling ? 'bg-amber-400' : 'bg-ice-accent'}`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        )}
      </div>

      {/* Card Info & Primary Action Button */}
      <div className="p-3 flex flex-col justify-between flex-1 gap-2">
        <h3 
          onClick={() => onSelectGame(game)}
          className="text-sm font-semibold text-white truncate cursor-pointer hover:text-ice-accent transition-colors" 
          title={game.name}
        >
          {game.name}
        </h3>

        {/* State-driven Primary Button */}
        {isReady && (
          <button
            onClick={() => onLaunch(game.id)}
            className="w-full h-8 rounded bg-ice-success hover:bg-[#34a544] text-white text-xs font-bold tracking-wide flex items-center justify-center gap-1.5 transition-all shadow-sm"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            <span>CHƠI</span>
          </button>
        )}

        {isRunning && (
          <button
            disabled
            className="w-full h-8 rounded bg-ice-hover text-ice-subtext text-xs font-semibold flex items-center justify-center gap-1.5 cursor-not-allowed opacity-80"
          >
            <span>Đang chạy...</span>
          </button>
        )}

        {isUninstalled && (
          <button
            onClick={() => onDownload(game.id)}
            className="w-full h-8 rounded bg-ice-accent hover:bg-ice-accentHover text-white text-xs font-bold tracking-wide flex items-center justify-center gap-1.5 transition-all shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>TẢI GAME</span>
          </button>
        )}

        {(isDownloading || isInstalling) && (
          <button
            onClick={() => onCancelDownload(game.id)}
            className="w-full h-8 rounded border border-ice-border hover:border-ice-error text-ice-subtext hover:text-ice-error text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            <span>Huỷ</span>
          </button>
        )}

        {isError && (
          <div className="flex items-center gap-1.5 w-full">
            <button
              onClick={() => onRetry(game.id)}
              className="flex-1 h-8 rounded bg-ice-error/15 border border-ice-error/40 hover:bg-ice-error/25 text-ice-error text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Thử lại</span>
            </button>
            <button
              onClick={() => onCancelDownload(game.id)}
              className="w-8 h-8 rounded border border-ice-border hover:border-ice-error text-ice-subtext hover:text-ice-error flex items-center justify-center transition-colors"
              title="Đóng / Xóa lỗi"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

