import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Play, 
  Download, 
  Bookmark, 
  BookmarkCheck, 
  FolderOpen, 
  Edit3, 
  Eye, 
  EyeOff, 
  RotateCcw, 
  X, 
  Volume2, 
  VolumeX, 
  HardDrive, 
  Clock, 
  ShieldCheck, 
  Sparkles, 
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Film,
  Monitor,
  Puzzle,
  Settings2,
  Gamepad2,
  Tag,
} from 'lucide-react';
import { parseMediaUrl, getActiveProxyPort } from '../../utils/mediaUrl';
import type { Game, AppActionButton, GameExtension } from '../../types';
import { GameActionsWidget } from '../common/GameActionsWidget';
import { DeviceType, isMobileOrTV } from '../../utils/deviceDetector';
import { GameExtensionsModal } from './GameExtensionsModal';

interface GameDetailViewProps {
  game: Game;
  isAdmin: boolean;
  deviceType?: DeviceType;
  onIncompatibleClick?: (game: Game) => void;
  onBack: () => void;
  onLaunch: (id: string) => void;
  onDownload: (id: string) => void;
  onCancelDownload: (id: string) => void;
  onRetry: (id: string) => void;
  onToggleLibrary: (id: string) => void;
  onToggleHide?: (id: string) => void;
  onEditGame?: (game: Game) => void;
  onOpenFolder?: (id: string) => void;
  onOpenInstallSettings?: (game: Game) => void;
  onSaveExtensions?: (gameId: string, extensions: GameExtension[]) => Promise<void>;
  globalActionButtons?: AppActionButton[];
}

export const GameDetailView: React.FC<GameDetailViewProps> = ({
  game,
  isAdmin,
  deviceType = 'windows_pc',
  onIncompatibleClick,
  onBack,
  onLaunch,
  onDownload,
  onCancelDownload,
  onRetry,
  onToggleLibrary,
  onToggleHide,
  onEditGame,
  onOpenFolder,
  onOpenInstallSettings,
  onSaveExtensions,
  globalActionButtons = [],
}) => {
  const [isExtensionsModalOpen, setIsExtensionsModalOpen] = useState(false);
  // Media showcase state
  const hasTrailer = Boolean(game.trailerUrl && game.trailerUrl.trim());
  const [activeMediaIndex, setActiveMediaIndex] = useState<number>(0); // 0 = trailer (if hasTrailer) or first screenshot
  const [isMuted, setIsMuted] = useState(true);
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);

  // Compile list of media items: [trailer (if exists), ...screenshots, bannerPath, coverPath]
  const screenshots = game.screenshots && game.screenshots.length > 0 ? game.screenshots : [];
  const allImages = [
    ...screenshots,
    ...(game.bannerPath && !screenshots.includes(game.bannerPath) ? [game.bannerPath] : []),
    ...(game.coverPath && !screenshots.includes(game.coverPath) ? [game.coverPath] : []),
  ];

  // If no images at all, fallback
  if (allImages.length === 0) {
    allImages.push('https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1600&q=80');
  }

  // Parse trailer url for YouTube embed
  const parsedTrailer = hasTrailer ? parseMediaUrl(game.trailerUrl!) : null;
  const youtubeVideoId = parsedTrailer?.kind === 'youtube' ? parsedTrailer.id : null;

  const isTrailerActive = hasTrailer && activeMediaIndex === 0;
  const activeImage = hasTrailer 
    ? allImages[activeMediaIndex - 1] || allImages[0]
    : allImages[activeMediaIndex] || allImages[0];

  const isDownloading = game.status === 'downloading';
  const isInstalling = game.status === 'installing';
  const isReady = game.status === 'ready';
  const isRunning = game.status === 'running';
  const isError = game.status === 'error';

  const percent = isInstalling
    ? game.installProgress?.percentage || 0
    : isDownloading
    ? game.downloadProgress?.percentage || 0
    : 0;

  const formatBytes = (bytes?: number) => {
    if (!bytes) return 'Chưa rõ';
    const gb = bytes / (1024 * 1024 * 1024);
    if (gb >= 1) return `${gb.toFixed(1)} GB`;
    return `${(bytes / (1024 * 1024)).toFixed(0)} MB`;
  };

  const tagsList = game.tags && game.tags.length > 0 
    ? game.tags 
    : (game.genre ? game.genre.split(',').map((s) => s.trim()).filter(Boolean) : ['Game']);

  return (
    <div className="flex-1 overflow-y-auto bg-ice-bg flex flex-col select-none">
      {/* Top Breadcrumb & Navigation Bar */}
      <div className="h-14 border-b border-ice-border/70 px-8 flex items-center justify-between bg-ice-card/80 backdrop-blur-md sticky top-0 z-30">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-ice-bg hover:bg-ice-hover text-white text-xs font-semibold border border-ice-border transition-all hover:-translate-x-0.5"
          >
            <ArrowLeft className="w-4 h-4 text-amber-400" />
            <span>Quay lại</span>
          </button>

          <div className="flex items-center gap-2 text-xs text-ice-subtext">
            <span>Trang Chủ</span>
            <span>/</span>
            <span>Chi tiết Game</span>
            <span>/</span>
            <span className="text-white font-bold truncate max-w-xs">{game.name}</span>
          </div>
        </div>

        {/* Right Admin controls */}
        <div className="flex items-center gap-3">
          {game.hidden && (
            <span className="px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
              [ĐÃ ẨN KHỎI KHÁCH]
            </span>
          )}

          {isAdmin && (
            <div className="flex items-center gap-2">
              {onToggleHide && (
                <button
                  onClick={() => onToggleHide(game.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                    game.hidden
                      ? 'bg-amber-500 text-black border-amber-400'
                      : 'bg-ice-card text-ice-subtext hover:text-white border-ice-border hover:bg-ice-hover'
                  }`}
                  title={game.hidden ? 'Bỏ ẩn (Hiện lại cho mọi người)' : 'Ẩn game này'}
                >
                  {game.hidden ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  <span>{game.hidden ? 'Bỏ ẩn' : 'Ẩn game'}</span>
                </button>
              )}

              {onEditGame && (
                <button
                  onClick={() => onEditGame(game)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-ice-card text-amber-400 hover:text-white border border-ice-border hover:bg-ice-hover text-xs font-bold transition-all"
                  title="Sửa thông tin / Căn chỉnh ảnh"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Sửa Game</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl w-full mx-auto p-6 md:p-8 space-y-8 flex-1">
        {/* Steam-Style Spotlight Showcase (Two Columns) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT: 16:9 Media Spotlight Player & Thumbnails (8 Cols) */}
          <div className="lg:col-span-8 space-y-3">
            {/* Spotlight Screen (16:9) */}
            <div className="aspect-video w-full rounded-2xl overflow-hidden border border-ice-border shadow-2xl relative bg-black">
              {isTrailerActive && youtubeVideoId ? (
                <div className="relative w-full h-full">
                  <iframe
                    src={`https://www.youtube-nocookie.com/embed/${youtubeVideoId}?autoplay=1&mute=${isMuted ? 1 : 0}&rel=0&playsinline=1&enablejsapi=1`}
                    title="Game Trailer"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                    className="w-full h-full border-0"
                  />
                  {/* Floating Sound Toggle & Open in YouTube Buttons */}
                  <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
                    <button
                      onClick={() => window.open(game.trailerUrl || `https://www.youtube.com/watch?v=${youtubeVideoId}`, '_blank')}
                      className="px-3 py-1.5 rounded-full bg-black/75 hover:bg-black text-white backdrop-blur-md border border-white/20 transition-all shadow-xl hover:scale-105 flex items-center gap-1.5 text-xs font-bold"
                      title="Mở xem trên YouTube"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-red-400" />
                      <span className="hidden sm:inline">YouTube</span>
                    </button>

                    <button
                      onClick={() => setIsMuted(!isMuted)}
                      className="p-2.5 rounded-full bg-black/75 hover:bg-black text-white backdrop-blur-md border border-white/20 transition-all shadow-xl hover:scale-110 flex items-center gap-1.5 text-xs font-bold"
                      title={isMuted ? 'Bật âm thanh Trailer' : 'Tắt tiếng'}
                    >
                      {isMuted ? (
                        <>
                          <VolumeX className="w-4 h-4 text-amber-400" />
                          <span className="hidden sm:inline">Bật tiếng</span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-4 h-4 text-emerald-400" />
                          <span className="hidden sm:inline">Tắt tiếng</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                /* Screenshot Display */
                <div 
                  onClick={() => setLightboxImg(activeImage)}
                  className="relative w-full h-full cursor-zoom-in group"
                >
                  <img
                    src={activeImage}
                    alt={game.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                  />
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <span className="px-3 py-1.5 rounded-lg bg-black/70 backdrop-blur-md text-white text-xs font-bold border border-white/20">
                      🔍 Bấm để phóng to ảnh
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Filmstrip Thumbnail Carousel */}
            <div className="flex items-center gap-2.5 overflow-x-auto pb-2 pt-1 scrollbar-thin">
              {/* Trailer Thumbnail Button */}
              {hasTrailer && (
                <button
                  type="button"
                  onClick={() => setActiveMediaIndex(0)}
                  className={`relative flex-shrink-0 w-28 h-16 rounded-xl overflow-hidden border-2 transition-all ${
                    isTrailerActive
                      ? 'border-red-500 shadow-lg shadow-red-500/20 scale-105'
                      : 'border-ice-border/80 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img
                    src={game.bannerPath || game.coverPath || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=400&q=80'}
                    alt="Trailer Thumbnail"
                    className="w-full h-full object-cover filter brightness-75"
                  />
                  <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center gap-1">
                    <div className="w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center shadow">
                      <Play className="w-3 h-3 fill-white ml-0.5" />
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-wider text-white">
                      TRAILER
                    </span>
                  </div>
                </button>
              )}

              {/* Screenshots Thumbnails */}
              {allImages.map((img, idx) => {
                const itemIndex = hasTrailer ? idx + 1 : idx;
                const isActive = activeMediaIndex === itemIndex;

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveMediaIndex(itemIndex)}
                    className={`relative flex-shrink-0 w-28 h-16 rounded-xl overflow-hidden border-2 transition-all ${
                      isActive
                        ? 'border-amber-400 shadow-lg shadow-amber-400/20 scale-105'
                        : 'border-ice-border/80 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* RIGHT: Steam Summary Sidebar (4 Cols) */}
          <div className="lg:col-span-4 bg-ice-card border border-ice-border rounded-2xl p-6 space-y-5 shadow-2xl">
            {/* Game Cover (2:3 aspect ratio) */}
            <div className="w-full aspect-[2/3] max-h-56 rounded-xl overflow-hidden border border-ice-border bg-black shadow-md relative">
              <img
                src={game.coverPath || 'https://via.placeholder.com/300x450'}
                alt={game.name}
                style={{
                  objectPosition: game.coverPosition || '50% 50%',
                  transform: game.coverZoom ? `scale(${game.coverZoom})` : undefined,
                  filter: game.coverSharpen ? `contrast(${1 + (game.coverSharpen / 100) * 0.25}) brightness(${1 + (game.coverSharpen / 100) * 0.04})` : undefined,
                  imageRendering: game.coverSharpen ? '-webkit-optimize-contrast' : 'auto'
                }}
                className="w-full h-full object-cover"
              />
              {game.featured && (
                <div className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-ice-accent/30 text-ice-accent border border-ice-accent/40 backdrop-blur-md flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-ice-accent" />
                  <span>Nổi bật</span>
                </div>
              )}
            </div>

            {/* Title & Tags */}
            <div className="space-y-2">
              <h1 className="text-2xl font-black text-white tracking-tight leading-snug">
                {game.name}
              </h1>

              <div className="flex flex-wrap gap-1.5">
                {tagsList.map((tag) => (
                  <span
                    key={tag}
                    className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-black/50 text-white/90 border border-white/20"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Short description */}
            {game.description && (
              <p className="text-xs text-ice-text/90 line-clamp-3 leading-relaxed">
                {game.description}
              </p>
            )}

            {/* Quick Metadata */}
            <div className="space-y-2 text-xs border-y border-ice-border/60 py-3 text-ice-subtext">
              <div className="flex justify-between items-center">
                <span>Dung lượng game:</span>
                <span className="text-white font-mono font-semibold">{formatBytes(game.expectedSize)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Trạng thái:</span>
                <span className="font-semibold">
                  {isReady && <span className="text-emerald-400 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Sẵn sàng chơi</span>}
                  {isDownloading && <span className="text-ice-accent animate-pulse">Đang tải xuống ({percent}%)</span>}
                  {isInstalling && <span className="text-amber-400 animate-pulse">Đang cài đặt ({percent}%)</span>}
                  {game.status === 'uninstalled' && <span className="text-ice-subtext">Chưa cài đặt</span>}
                  {isError && <span className="text-red-400">Có lỗi xảy ra</span>}
                </span>
              </div>
              {game.lastPlayed && (
                <div className="flex justify-between items-center">
                  <span>Lần chơi cuối:</span>
                  <span className="text-white">{game.lastPlayed}</span>
                </div>
              )}
            </div>

            {/* Primary Action Button Box */}
            <div className="space-y-2.5 pt-1">
              {/* Dynamic Live Progress Bar if downloading or installing */}
              {(isDownloading || isInstalling) && (
                <div className="space-y-1.5 p-3 rounded-xl bg-black/60 border border-ice-border">
                  <div className="flex justify-between text-xs text-white">
                    <span className="font-semibold text-ice-accent">
                      {isInstalling ? 'Đang giải nén & cài đặt...' : 'Đang tải file từ Google Drive...'}
                    </span>
                    <span className="font-mono font-bold text-ice-accent">{percent}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-ice-border overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-ice-accent to-blue-500 transition-all duration-300"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  {isDownloading && game.downloadProgress && (
                    <div className="flex justify-between text-[10px] text-ice-subtext font-mono">
                      <span>Tốc độ: {game.downloadProgress.speedMBps.toFixed(1)} MB/s</span>
                      <span>Còn lại: {Math.round(game.downloadProgress.etaSeconds)}s</span>
                    </div>
                  )}
                  <button
                    onClick={() => onCancelDownload(game.id)}
                    className="w-full mt-2 h-8 rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 text-xs font-bold transition-colors"
                  >
                    Huỷ tiến trình tải
                  </button>
                </div>
              )}

              {/* Mobile / Android TV Incompatibility Notice */}
              {isMobileOrTV(deviceType) ? (
                <button
                  onClick={() => onIncompatibleClick?.(game)}
                  className="w-full h-12 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 text-amber-300 border border-amber-500/40 text-xs font-black tracking-wider uppercase flex items-center justify-center gap-2.5 shadow-xl transition-all cursor-pointer hover:border-amber-400"
                >
                  <Monitor className="w-4 h-4 text-amber-400" />
                  <span>🚫 Chỉ hỗ trợ Windows PC</span>
                </button>
              ) : (
                <>
                  {/* Ready to Play CTA */}
                  {isReady && (
                    <div className="space-y-2 w-full">
                      <div className="flex items-center gap-2 w-full">
                        <button
                          onClick={() => onLaunch(game.id)}
                          disabled={isRunning}
                          className="flex-1 h-12 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white text-sm font-black tracking-wider uppercase flex items-center justify-center gap-2.5 shadow-xl shadow-emerald-950/40 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
                        >
                          <Play className="w-5 h-5 fill-white" />
                          <span>{isRunning ? 'GAME ĐANG CHẠY...' : 'CHƠI NGAY'}</span>
                        </button>
                        {onOpenInstallSettings && (
                          <button
                            type="button"
                            onClick={() => onOpenInstallSettings(game)}
                            className="w-12 h-12 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white flex items-center justify-center transition-all shadow-md active:scale-95 shrink-0"
                            title="Cài đặt game & bố cục điều khiển điện thoại"
                          >
                            <Settings2 className="w-5 h-5 text-amber-400" />
                          </button>
                        )}
                      </div>

                      {/* Play with Mobile Controller Option */}
                      {game.controllerConfig?.mode && game.controllerConfig.mode !== 'disabled' && (
                        <button
                          type="button"
                          onClick={() => {
                            if (window.api?.broadcastController) {
                              window.api.broadcastController({
                                type: 'launch_controller',
                                gameId: game.id,
                                gameTitle: game.name,
                                config: game.controllerConfig,
                              });
                            }
                            onLaunch(game.id);
                          }}
                          disabled={isRunning}
                          className="w-full h-10 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 border border-amber-500/40 text-amber-300 text-xs font-black tracking-wider uppercase flex items-center justify-center gap-2 shadow-lg transition-all active:scale-98"
                        >
                          <Gamepad2 className="w-4 h-4 text-amber-400" />
                          <span>🎮 Chơi Bằng Tay Cầm Điện Thoại</span>
                        </button>
                      )}
                    </div>
                  )}

                  {/* Uninstalled CTA */}
                  {game.status === 'uninstalled' && (
                    <div className="flex items-center gap-2 w-full">
                      <button
                        onClick={() => onDownload(game.id)}
                        className="flex-1 h-12 rounded-xl bg-gradient-to-r from-ice-accent to-blue-600 hover:from-ice-accentHover hover:to-blue-500 text-white text-sm font-black tracking-wider uppercase flex items-center justify-center gap-2.5 shadow-xl shadow-blue-950/40 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
                      >
                        <Download className="w-5 h-5" />
                        <span>TẢI GAME VỀ MÁY</span>
                      </button>
                      {onOpenInstallSettings && (
                        <button
                          type="button"
                          onClick={() => onOpenInstallSettings(game)}
                          className="w-12 h-12 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white flex items-center justify-center transition-all shadow-md active:scale-95 shrink-0"
                          title="Cài đặt nơi lưu file game & xem dung lượng ổ đĩa"
                        >
                          <Settings2 className="w-5 h-5 text-amber-400" />
                        </button>
                      )}
                    </div>
                  )}
                </>
              )}

              {/* Error Retry CTA */}
              {isError && (
                <button
                  onClick={() => onRetry(game.id)}
                  className="w-full h-11 rounded-xl bg-amber-500 hover:bg-amber-600 text-black text-xs font-black tracking-wider uppercase flex items-center justify-center gap-2 shadow-lg transition-all"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>THỬ LẠI TIẾN TRÌNH</span>
                </button>
              )}

              {/* Nút Gói Mở Rộng (DLC, Việt Hóa, Update) */}
              <button
                type="button"
                onClick={() => setIsExtensionsModalOpen(true)}
                className="w-full h-10 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/40 text-purple-300 text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-98 shadow-md"
              >
                <Puzzle className="w-4 h-4 text-purple-400" />
                <span>🧩 Gói Mở Rộng & Việt Hóa ({game.extensions?.length || 0})</span>
              </button>

              {/* Bookmark In Library Button */}
              <button
                onClick={() => onToggleLibrary(game.id)}
                className={`w-full h-10 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all ${
                  game.inLibrary
                    ? 'bg-ice-accent/20 border-ice-accent text-ice-accent'
                    : 'bg-ice-card hover:bg-ice-hover text-white border-ice-border'
                }`}
              >
                {game.inLibrary ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                <span>{game.inLibrary ? 'Đã có trong Thư Viện' : 'Lưu vào Thư Viện'}</span>
              </button>

              {/* Open game folder (if installed) */}
              {isReady && onOpenFolder && (
                <button
                  onClick={() => onOpenFolder(game.id)}
                  className="w-full h-9 rounded-xl border border-ice-border hover:bg-ice-hover text-ice-subtext hover:text-white text-xs font-medium flex items-center justify-center gap-2 transition-colors"
                >
                  <FolderOpen className="w-3.5 h-3.5" />
                  <span>Mở thư mục cài đặt game</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Game Requirements & Quick Actions Widget */}
        {(game.requirementsText || (game.actionButtonIds && game.actionButtonIds.length > 0)) && (
          <GameActionsWidget
            requirementsText={game.requirementsText}
            buttons={globalActionButtons.filter((b) => game.actionButtonIds?.includes(b.id))}
          />
        )}

        {/* Detailed Game Description & Notes (Bottom Full Width) */}
        <div className="bg-ice-card border border-ice-border rounded-2xl p-8 space-y-6 shadow-xl">
          <div className="border-b border-ice-border/60 pb-3">
            <h2 className="text-lg font-bold text-white tracking-wide flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Giới thiệu chi tiết & Hướng dẫn</span>
            </h2>
          </div>

          <div className="text-sm text-ice-text/90 leading-relaxed whitespace-pre-line font-normal space-y-4">
            {game.description || 'Chưa có thông tin giới thiệu chi tiết cho trò chơi này.'}
          </div>

          {/* Screenshots Grid View */}
          {screenshots.length > 0 && (
            <div className="space-y-3 pt-4 border-t border-ice-border/60">
              <h3 className="text-sm font-bold text-white">Ảnh chụp màn hình (Screenshots Gallery)</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {screenshots.map((s, i) => (
                  <div
                    key={i}
                    onClick={() => setLightboxImg(s)}
                    className="aspect-video rounded-xl overflow-hidden border border-ice-border cursor-zoom-in group relative"
                  >
                    <img src={s} alt={`Screenshot ${i + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* System & Installation Info */}
          <div className="pt-4 border-t border-ice-border/60 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-ice-subtext">
            <div className="p-3 bg-black/30 rounded-xl border border-ice-border/50">
              <p className="font-semibold text-white mb-1">Thư mục cài đặt:</p>
              <p className="font-mono text-[11px] truncate text-ice-accent">
                {game.installPath || `C:\\Icelauch\\Games\\${game.name}`}
              </p>
            </div>
            <div className="p-3 bg-black/30 rounded-xl border border-ice-border/50">
              <p className="font-semibold text-white mb-1">File chạy chính:</p>
              <p className="font-mono text-[11px] truncate text-emerald-400">
                {game.mainExe || '(Tự động phát hiện)'}
              </p>
            </div>
            <div className="p-3 bg-black/30 rounded-xl border border-ice-border/50">
              <p className="font-semibold text-white mb-1">Quyền Quản Trị:</p>
              <p className="text-white">
                {game.runAsAdmin ? 'Yêu cầu Administrator (UAC)' : 'Khởi chạy tiêu chuẩn'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox Modal for Fullscreen Screenshot Inspection */}
      {lightboxImg && (
        <div 
          onClick={() => setLightboxImg(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out animate-in fade-in duration-200"
        >
          <button
            onClick={() => setLightboxImg(null)}
            className="absolute top-5 right-5 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={lightboxImg}
            alt="Fullscreen view"
            className="max-w-[90vw] max-h-[90vh] object-contain rounded-xl shadow-2xl border border-white/20"
          />
        </div>
      )}

      {/* Game Extensions Modal */}
      <GameExtensionsModal
        isOpen={isExtensionsModalOpen}
        game={game}
        isAdmin={isAdmin}
        onClose={() => setIsExtensionsModalOpen(false)}
        onSaveExtensions={onSaveExtensions}
      />
    </div>
  );
};
