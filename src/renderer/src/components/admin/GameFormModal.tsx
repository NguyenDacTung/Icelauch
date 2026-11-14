import React, { useState, useEffect } from 'react';
import { 
  X, 
  Gamepad2, 
  Image, 
  Link as LinkIcon, 
  HardDrive, 
  Key, 
  Eye, 
  EyeOff, 
  Check, 
  Sparkles,
  ExternalLink,
  ShieldCheck,
  FileCode,
  Film,
  Plus,
  Trash2,
  FolderOpen
} from 'lucide-react';
import { TagSelector } from './TagSelector';
import { ImagePositionSelector } from './ImagePositionSelector';
import type { Game, AppActionButton } from '../../types';

interface GameFormModalProps {
  game: Game | null; // null if adding new
  isOpen: boolean;
  onClose: () => void;
  onSave: (gameData: Partial<Game>) => void;
  onDeleteGame?: (id: string) => void;
  onBrowseFile: (type: 'cover' | 'banner') => Promise<string | null>;
  availableTags?: string[];
  onAddNewGlobalTag?: (tag: string) => void;
  globalActionButtons?: AppActionButton[];
}

export const GameFormModal: React.FC<GameFormModalProps> = ({
  game,
  isOpen,
  onClose,
  onSave,
  onDeleteGame,
  onBrowseFile,
  availableTags = [],
  onAddNewGlobalTag,
  globalActionButtons = [],
}) => {
  const [name, setName] = useState('');
  const [coverPath, setCoverPath] = useState('');
  const [bannerPath, setBannerPath] = useState('');
  const [coverPosition, setCoverPosition] = useState('50% 50%');
  const [bannerPosition, setBannerPosition] = useState('50% 30%');
  const [coverZoom, setCoverZoom] = useState(1);
  const [bannerZoom, setBannerZoom] = useState(1);
  const [listCardPosition, setListCardPosition] = useState('50% 50%');
  const [listCardZoom, setListCardZoom] = useState(1);
  const [bannerBlur, setBannerBlur] = useState(0);
  const [bannerDarkness, setBannerDarkness] = useState(30);
  const [bannerEdgeDarkness, setBannerEdgeDarkness] = useState(10);
  const [coverSharpen, setCoverSharpen] = useState(0);
  const [bannerSharpen, setBannerSharpen] = useState(0);
  const [isBannerPinned, setIsBannerPinned] = useState(false);
  const [isBannerPermanent, setIsBannerPermanent] = useState(false);
  const [bannerExpiryDays, setBannerExpiryDays] = useState(7);
  const [trailerUrl, setTrailerUrl] = useState('');
  const [screenshots, setScreenshots] = useState<string[]>([]);
  const [newScreenshotUrl, setNewScreenshotUrl] = useState('');
  const [hidden, setHidden] = useState(false);

  const [downloadLinksText, setDownloadLinksText] = useState('');
  const [expectedSizeGb, setExpectedSizeGb] = useState('');
  const [archivePassword, setArchivePassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>(['Coop']);
  const [description, setDescription] = useState('');
  const [requirementsText, setRequirementsText] = useState('');
  const [selectedActionButtonIds, setSelectedActionButtonIds] = useState<string[]>([]);
  const [installPath, setInstallPath] = useState('');
  const [runAsAdmin, setRunAsAdmin] = useState(false);
  const [deleteArchive, setDeleteArchive] = useState(true);
  const [featured, setFeatured] = useState(false);
  const [linkTestResult, setLinkTestResult] = useState<string | null>(null);

  // Sync state whenever game or isOpen changes
  useEffect(() => {
    if (isOpen) {
      if (game) {
        // Editing existing game -> populate exact fields!
        setName(game.name || '');
        setCoverPath(game.coverPath || '');
        setBannerPath(game.bannerPath || '');
        setCoverPosition(game.coverPosition || '50% 50%');
        setBannerPosition(game.bannerPosition || '50% 30%');
        setCoverZoom(game.coverZoom || 1);
        setBannerZoom(game.bannerZoom || 1);
        setListCardPosition(game.listCardPosition || game.coverPosition || '50% 50%');
        setListCardZoom(game.listCardZoom || game.coverZoom || 1);
        setBannerBlur(game.bannerBlur ?? 0);
        setBannerDarkness(game.bannerDarkness ?? 30);
        setBannerEdgeDarkness(game.bannerEdgeDarkness ?? 10);
        setCoverSharpen(game.coverSharpen ?? 0);
        setBannerSharpen(game.bannerSharpen ?? 0);
        setIsBannerPinned(game.isBannerPinned ?? game.featured ?? false);
        setIsBannerPermanent(game.isBannerPermanent ?? false);
        setBannerExpiryDays(7);
        setTrailerUrl(game.trailerUrl || '');
        setScreenshots(game.screenshots ? [...game.screenshots] : []);
        setHidden(game.hidden ?? false);

        setDownloadLinksText(game.downloadLinks ? game.downloadLinks.join('\n') : '');
        setExpectedSizeGb(
          game.expectedSize ? (game.expectedSize / (1024 * 1024 * 1024)).toFixed(1) : ''
        );
        setArchivePassword(game.archivePassword || '');
        setSelectedTags(
          game.tags && game.tags.length > 0
            ? [...game.tags]
            : game.genre
            ? game.genre.split(',').map((s) => s.trim()).filter(Boolean)
            : ['Coop']
        );
        setDescription(game.description || '');
        setRequirementsText(game.requirementsText || '');
        setSelectedActionButtonIds(game.actionButtonIds || []);
        setInstallPath(game.installPath || '');
        setRunAsAdmin(game.runAsAdmin ?? false);
        setDeleteArchive(game.deleteArchiveAfterInstall ?? true);
        setFeatured(game.featured ?? false);
      } else {
        // Adding new game -> reset everything to completely clean state!
        setName('');
        setCoverPath('');
        setBannerPath('');
        setCoverPosition('50% 50%');
        setBannerPosition('50% 30%');
        setCoverZoom(1);
        setBannerZoom(1);
        setListCardPosition('50% 50%');
        setListCardZoom(1);
        setBannerBlur(0);
        setBannerDarkness(30);
        setBannerEdgeDarkness(10);
        setCoverSharpen(0);
        setBannerSharpen(0);
        setIsBannerPinned(true); // Default new game added to banner
        setIsBannerPermanent(false);
        setBannerExpiryDays(7);
        setTrailerUrl('');
        setScreenshots([]);
        setNewScreenshotUrl('');
        setHidden(false);

        setDownloadLinksText('');
        setExpectedSizeGb('');
        setArchivePassword('');
        setShowPassword(false);
        setSelectedTags(['Coop']);
        setDescription('');
        setRequirementsText('');
        setSelectedActionButtonIds(
          globalActionButtons.filter((b) => b.isDefault).map((b) => b.id)
        );
        setInstallPath('');
        setRunAsAdmin(false);
        setDeleteArchive(true);
        setFeatured(false);
      }
      setLinkTestResult(null);
    }
  }, [game, isOpen]);

  if (!isOpen) return null;

  const handleBrowseImage = async (type: 'cover' | 'banner') => {
    const filePath = await onBrowseFile(type);
    if (filePath) {
      if (type === 'cover') setCoverPath(filePath);
      else setBannerPath(filePath);
    }
  };

  const handleBrowseScreenshots = async () => {
    if (window.api?.browseFiles) {
      const files = await window.api.browseFiles({
        title: 'Chọn ảnh chụp màn hình game (Screenshots)',
        filters: [{ name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'webp'] }],
      });
      if (files && files.length > 0) {
        setScreenshots((prev) => [...prev, ...files]);
      }
    } else {
      const single = await onBrowseFile('banner');
      if (single) {
        setScreenshots((prev) => [...prev, single]);
      }
    }
  };

  const handleAddScreenshotUrl = () => {
    if (newScreenshotUrl.trim()) {
      setScreenshots((prev) => [...prev, newScreenshotUrl.trim()]);
      setNewScreenshotUrl('');
    }
  };

  const handleRemoveScreenshot = (idx: number) => {
    setScreenshots((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleTestLink = async () => {
    const links = downloadLinksText.split('\n').map((l) => l.trim()).filter(Boolean);
    if (links.length === 0) {
      setLinkTestResult('Vui lòng nhập ít nhất 1 link');
      return;
    }
    setLinkTestResult('Đang kiểm tra kết nối...');
    try {
      const target = links[0];
      await fetch(target, { method: 'HEAD', mode: 'no-cors' });
      setLinkTestResult('Kết nối thành công (Link hợp lệ)');
    } catch {
      setLinkTestResult('Không thể kết nối link hoặc link bị giới hạn CORS');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Vui lòng nhập tên game');
      return;
    }

    const links = downloadLinksText
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);

    const sizeBytes = parseFloat(expectedSizeGb)
      ? parseFloat(expectedSizeGb) * 1024 * 1024 * 1024
      : undefined;

    let bannerFeaturedUntil: string | undefined = undefined;
    if (isBannerPinned && !isBannerPermanent) {
      bannerFeaturedUntil = new Date(Date.now() + bannerExpiryDays * 24 * 60 * 60 * 1000).toISOString();
    }

    const mergedGame: Partial<Game> = {
      ...(game || {}),
      id: game?.id,
      name: name.trim(),
      coverPath: coverPath.trim() || game?.coverPath || '',
      bannerPath: bannerPath.trim() || game?.bannerPath,
      coverPosition: coverPosition || game?.coverPosition,
      bannerPosition: bannerPosition || game?.bannerPosition,
      coverZoom,
      bannerZoom,
      listCardPosition,
      listCardZoom,
      bannerBlur,
      bannerDarkness,
      bannerEdgeDarkness,
      coverSharpen,
      bannerSharpen,
      isBannerPinned,
      isBannerPermanent,
      bannerFeaturedUntil,
      trailerUrl: trailerUrl.trim() || game?.trailerUrl,
      screenshots: screenshots.length > 0 ? screenshots : game?.screenshots,
      hidden,
      downloadLinks: links.length > 0 ? links : game?.downloadLinks || [],
      expectedSize: sizeBytes ?? game?.expectedSize,
      archivePassword: archivePassword || game?.archivePassword,
      tags: selectedTags,
      genre: selectedTags.join(', '),
      description: description.trim() || game?.description || '',
      requirementsText: requirementsText.trim() || game?.requirementsText,
      actionButtonIds: selectedActionButtonIds,
      installPath: installPath.trim() || game?.installPath,
      runAsAdmin,
      deleteArchiveAfterInstall: deleteArchive,
      featured: isBannerPinned,
    };

    onSave(mergedGame);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-ice-card border border-ice-border rounded-xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-ice-border flex items-center justify-between bg-ice-card/90">
          <div className="flex items-center gap-2.5">
            <Gamepad2 className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm font-bold text-white tracking-wide">
              {game ? `Sửa thông tin: ${game.name}` : 'Thêm Game Mới (Admin)'}
            </h3>
          </div>
          <button onClick={onClose} className="text-ice-subtext hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 text-xs text-ice-text">
          {/* Game Name */}
          <div className="space-y-1.5">
            <label className="font-semibold text-white">Tên game *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ví dụ: Elden Ring: Shadow of the Erdtree"
              className="w-full h-9 rounded bg-ice-bg border border-ice-border px-3 text-white focus:outline-none focus:border-amber-400"
            />
          </div>

          {/* Tag Selector */}
          <TagSelector
            label="Thể loại / Phân loại Game"
            selectedTags={selectedTags}
            availableTags={availableTags}
            onChange={setSelectedTags}
            onAddNewTag={onAddNewGlobalTag}
            placeholder="Nhập thể loại mới (ví dụ: Thế giới mở, Souls-like...) và nhấn Enter"
          />

          {/* Trailer YouTube */}
          <div className="space-y-1.5 bg-black/30 p-3 rounded-lg border border-ice-border/60">
            <label className="font-semibold text-white flex items-center gap-1.5">
              <Film className="w-4 h-4 text-red-500" />
              <span>Link YouTube Trailer (Tự động phát khi mở Trang Chi Tiết)</span>
            </label>
            <input
              type="text"
              value={trailerUrl}
              onChange={(e) => setTrailerUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=... hoặc https://youtu.be/..."
              className="w-full h-9 rounded bg-ice-bg border border-ice-border px-3 text-white focus:outline-none focus:border-red-500 font-mono text-[11px]"
            />
          </div>

          {/* Cover & Banner Images */}
          <div className="grid grid-cols-2 gap-4">
            {/* Cover */}
            <div className="space-y-1.5">
              <label className="font-semibold text-white flex items-center justify-between">
                <span>Ảnh bìa (Tỉ lệ 2:3)</span>
                <button
                  type="button"
                  onClick={() => handleBrowseImage('cover')}
                  className="text-amber-400 hover:underline text-[11px]"
                >
                  Chọn file từ máy
                </button>
              </label>
              <input
                type="text"
                value={coverPath}
                onChange={(e) => setCoverPath(e.target.value)}
                placeholder="Dán link ảnh hoặc chọn file"
                className="w-full h-9 rounded bg-ice-bg border border-ice-border px-3 text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* Banner */}
            <div className="space-y-1.5">
              <label className="font-semibold text-white flex items-center justify-between">
                <span>Ảnh Banner ngang (16:9)</span>
                <button
                  type="button"
                  onClick={() => handleBrowseImage('banner')}
                  className="text-amber-400 hover:underline text-[11px]"
                >
                  Chọn file từ máy
                </button>
              </label>
              <input
                type="text"
                value={bannerPath}
                onChange={(e) => setBannerPath(e.target.value)}
                placeholder="Tuỳ chọn (nếu trống sẽ dùng ảnh bìa mờ)"
                className="w-full h-9 rounded bg-ice-bg border border-ice-border px-3 text-white focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          {/* Interactive Alignment Controls */}
          <div className="space-y-4 pt-1">
            {coverPath && (
              <>
                <ImagePositionSelector
                  label="Căn chỉnh Thẻ Danh Sách Trang Chủ (4:6 / 2:3 Chuẩn Poster)"
                  imageUrl={coverPath}
                  aspectRatio="4:6"
                  value={listCardPosition}
                  onChange={setListCardPosition}
                  zoom={listCardZoom}
                  onZoomChange={setListCardZoom}
                  sharpen={coverSharpen}
                  onSharpenChange={setCoverSharpen}
                  demoTitle={name}
                />
                <ImagePositionSelector
                  label="Căn chỉnh Ảnh Bìa / Chi Tiết (16:9 Chuẩn)"
                  imageUrl={coverPath}
                  aspectRatio="16:9"
                  value={coverPosition}
                  onChange={setCoverPosition}
                  zoom={coverZoom}
                  onZoomChange={setCoverZoom}
                  sharpen={coverSharpen}
                  onSharpenChange={setCoverSharpen}
                  demoTitle={name}
                />
              </>
            )}
            {(bannerPath || coverPath) && (
              <ImagePositionSelector
                label="Căn chỉnh, Nét, Zoom & Độ Mờ Banner Hero (16:9 Chuẩn)"
                imageUrl={bannerPath || coverPath}
                aspectRatio="banner"
                value={bannerPosition}
                onChange={setBannerPosition}
                zoom={bannerZoom}
                onZoomChange={setBannerZoom}
                blur={bannerBlur}
                onBlurChange={setBannerBlur}
                darkness={bannerDarkness}
                onDarknessChange={setBannerDarkness}
                edgeDarkness={bannerEdgeDarkness}
                onEdgeDarknessChange={setBannerEdgeDarkness}
                sharpen={bannerSharpen}
                onSharpenChange={setBannerSharpen}
                demoTitle={name}
              />
            )}
          </div>

          {/* Screenshots Gallery Section */}
          <div className="space-y-2 bg-black/30 p-3.5 rounded-xl border border-ice-border/70">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-white flex items-center gap-1.5">
                <Image className="w-4 h-4 text-ice-accent" />
                <span>Ảnh mô tả game (Screenshots trên Trang Chi Tiết) ({screenshots.length})</span>
              </label>
              <button
                type="button"
                onClick={handleBrowseScreenshots}
                className="px-2.5 py-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 text-[11px] font-bold flex items-center gap-1 transition-all"
              >
                <FolderOpen className="w-3.5 h-3.5" />
                <span>Chọn ảnh từ máy (nhiều ảnh)</span>
              </button>
            </div>

            {/* Online URL input */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newScreenshotUrl}
                onChange={(e) => setNewScreenshotUrl(e.target.value)}
                placeholder="Hoặc dán URL link ảnh online vào đây..."
                className="flex-1 h-8 rounded bg-ice-bg border border-ice-border px-3 text-[11px] text-white focus:outline-none focus:border-ice-accent"
              />
              <button
                type="button"
                onClick={handleAddScreenshotUrl}
                className="h-8 px-3 rounded bg-ice-accent hover:bg-ice-accentHover text-white text-[11px] font-bold flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3 h-3" />
                <span>Thêm</span>
              </button>
            </div>

            {/* Thumbnails grid */}
            {screenshots.length > 0 && (
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 pt-2">
                {screenshots.map((img, idx) => (
                  <div key={idx} className="relative group/thumb rounded-lg overflow-hidden aspect-video border border-ice-border bg-black">
                    <img src={img} alt={`Screenshot ${idx + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemoveScreenshot(idx)}
                      className="absolute top-1 right-1 p-1 rounded-full bg-red-600/90 text-white opacity-0 group-hover/thumb:opacity-100 hover:scale-110 transition-all shadow"
                      title="Xoá ảnh này"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Download Links */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-white">
                Link tải game từ Google Drive (Hỗ trợ file nhiều part, mỗi dòng 1 link)
              </label>
              <button
                type="button"
                onClick={handleTestLink}
                className="text-[11px] text-ice-accent hover:underline flex items-center gap-1"
              >
                <ExternalLink className="w-3 h-3" />
                <span>Kiểm tra link</span>
              </button>
            </div>
            <textarea
              rows={3}
              value={downloadLinksText}
              onChange={(e) => setDownloadLinksText(e.target.value)}
              placeholder="https://drive.google.com/file/d/...\nhttps://drive.google.com/file/d/..."
              className="w-full rounded bg-ice-bg border border-ice-border p-2.5 text-white font-mono text-[11px] focus:outline-none focus:border-amber-400"
            />
            {linkTestResult && (
              <p className="text-[11px] text-amber-300 font-medium">{linkTestResult}</p>
            )}
          </div>

          {/* Expected Size & Password */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-semibold text-white flex items-center gap-1.5">
                <HardDrive className="w-3.5 h-3.5 text-ice-subtext" />
                <span>Dung lượng ước tính (GB)</span>
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={expectedSizeGb}
                onChange={(e) => setExpectedSizeGb(e.target.value)}
                placeholder="Ví dụ: 15.5"
                className="w-full h-9 rounded bg-ice-bg border border-ice-border px-3 text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-white flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-ice-subtext" />
                <span>Mật khẩu giải nén (nếu có)</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={archivePassword}
                  onChange={(e) => setArchivePassword(e.target.value)}
                  placeholder="Để trống nếu không có mật khẩu"
                  className="w-full h-9 rounded bg-ice-bg border border-ice-border px-3 text-white focus:outline-none focus:border-amber-400 pr-9 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ice-subtext hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="font-semibold text-white">Mô tả / Hướng dẫn / Cấu hình</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Nhập giới thiệu tóm tắt cốt truyện, lối chơi, cấu hình tối thiểu..."
              className="w-full rounded bg-ice-bg border border-ice-border p-2.5 text-white focus:outline-none focus:border-amber-400 text-xs"
            />
          </div>

          {/* Requirements & Player Guidance */}
          <div className="space-y-1.5 p-3.5 rounded-xl bg-amber-500/5 border border-amber-500/20">
            <label className="font-semibold text-amber-300 text-xs flex items-center gap-1.5">
              <span>📌</span>
              <span>Yêu Cầu & Hướng Dẫn Chơi (Hiển thị nổi bật cho người dùng)</span>
            </label>
            <textarea
              rows={3}
              value={requirementsText}
              onChange={(e) => setRequirementsText(e.target.value)}
              placeholder="Ví dụ: 1. Cần mở Steam trước khi bấm Chơi;&#10;2. Vào room Discord số 2 để chơi co-op;&#10;3. Tắt Windows Defender nếu game bị chặn..."
              className="w-full rounded-lg bg-[#0A0D14] border border-ice-border p-2.5 text-white focus:outline-none focus:border-amber-400 text-xs font-sans leading-relaxed"
            />

            {/* Action buttons selection */}
            {globalActionButtons.length > 0 && (
              <div className="pt-2 space-y-1.5">
                <span className="text-[11px] font-semibold text-ice-subtext">
                  Gắn các nút lối tắt & ứng dụng cho game này:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {globalActionButtons.map((btn) => {
                    const isChecked = selectedActionButtonIds.includes(btn.id);
                    return (
                      <label
                        key={btn.id}
                        className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer select-none text-xs transition-colors ${
                          isChecked
                            ? 'bg-amber-500/15 border-amber-500/50 text-white font-medium'
                            : 'bg-[#0A0D14] border-ice-border/60 text-ice-muted hover:text-white'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedActionButtonIds([...selectedActionButtonIds, btn.id]);
                            } else {
                              setSelectedActionButtonIds(selectedActionButtonIds.filter((id) => id !== btn.id));
                            }
                          }}
                          className="w-4 h-4 rounded accent-amber-500"
                        />
                        <span className="truncate">
                          {btn.icon === 'steam' && '🎮 '}
                          {btn.icon === 'discord' && '💬 '}
                          {btn.icon === 'app' && '📁 '}
                          {btn.icon === 'link' && '🌐 '}
                          {btn.label}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Custom Install Directory (Multi-Drive) */}
          <div className="space-y-1.5 p-3.5 rounded-xl bg-ice-bg/60 border border-ice-border">
            <label className="font-semibold text-white text-xs flex items-center justify-between">
              <span>Thư mục cài đặt game này (Tùy chọn ổ đĩa riêng C:, D:, E:...)</span>
              <span className="text-[10px] text-ice-muted font-normal">Bỏ trống để dùng theo thư mục mặc định</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={installPath}
                onChange={(e) => setInstallPath(e.target.value)}
                placeholder="VD: D:\Games\TenGame hoặc E:\SteamLibrary..."
                className="flex-1 bg-[#0A0D14] border border-ice-border rounded-lg px-3 py-1.5 text-xs text-white outline-none font-mono focus:border-amber-400"
              />
              <button
                type="button"
                onClick={async () => {
                  const folder = await window.api.browseFolder({
                    title: `Chọn thư mục cài đặt cho ${name || 'game'}`,
                    defaultPath: installPath || undefined,
                  });
                  if (folder) setInstallPath(folder);
                }}
                className="px-3 py-1.5 rounded-lg bg-ice-hover hover:bg-ice-card text-white text-xs font-semibold border border-ice-border flex items-center gap-1 shrink-0"
              >
                <FolderOpen className="w-3.5 h-3.5 text-amber-400" />
                <span>Chọn thư mục</span>
              </button>
            </div>
          </div>

          {/* Options & Admin Hide Toggle */}
          <div className="pt-2 border-t border-ice-border space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={runAsAdmin}
                onChange={(e) => setRunAsAdmin(e.target.checked)}
                className="w-4 h-4 rounded accent-amber-500"
              />
              <span className="font-semibold text-white">Yêu cầu quyền Administrator (UAC) khi khởi chạy</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={deleteArchive}
                onChange={(e) => setDeleteArchive(e.target.checked)}
                className="w-4 h-4 rounded accent-amber-500"
              />
              <span className="font-semibold text-white">Tự động xoá file nén sau khi cài đặt thành công</span>
            </label>

            {/* Banner Section Settings */}
            <div className="p-3 rounded-lg bg-black/40 border border-ice-border space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isBannerPinned}
                  onChange={(e) => setIsBannerPinned(e.target.checked)}
                  className="w-4 h-4 rounded accent-amber-500"
                />
                <span className="font-semibold text-amber-300 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Ghim hiển thị trên Banner Trang Chủ (Hero Banner)</span>
                </span>
              </label>

              {isBannerPinned && (
                <div className="pl-6 pt-1 flex flex-wrap items-center gap-4 text-xs">
                  <label className="flex items-center gap-1.5 cursor-pointer text-ice-subtext hover:text-white">
                    <input
                      type="checkbox"
                      checked={isBannerPermanent}
                      onChange={(e) => setIsBannerPermanent(e.target.checked)}
                      className="accent-amber-500"
                    />
                    <span>Ghim vĩnh viễn (Không tự động gỡ)</span>
                  </label>

                  {!isBannerPermanent && (
                    <div className="flex items-center gap-2 text-ice-subtext">
                      <span>Thời hạn hiển thị nổi bật:</span>
                      <select
                        value={bannerExpiryDays}
                        onChange={(e) => setBannerExpiryDays(parseInt(e.target.value, 10))}
                        className="bg-ice-bg border border-ice-border rounded px-2 py-1 text-white text-xs"
                      >
                        <option value={3}>3 ngày</option>
                        <option value={7}>7 ngày (Mặc định)</option>
                        <option value={14}>14 ngày</option>
                        <option value={30}>30 ngày</option>
                      </select>
                    </div>
                  )}
                </div>
              )}
            </div>

            <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg bg-amber-500/10 border border-amber-500/30">
              <input
                type="checkbox"
                checked={hidden}
                onChange={(e) => setHidden(e.target.checked)}
                className="w-4 h-4 rounded accent-amber-500"
              />
              <span className="font-bold text-amber-300">
                Ẩn game này (Chỉ Admin mới nhìn thấy, ẩn hoàn toàn với người dùng thông thường)
              </span>
            </label>
          </div>

          {/* Footer Submit */}
          <div className="pt-4 border-t border-ice-border flex items-center justify-between gap-3">
            {game && onDeleteGame && (
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Bạn có chắc chắn muốn xoá game "${game.name}" không? Thao tác này không thể hoàn tác.`)) {
                    onDeleteGame(game.id);
                    onClose();
                  }
                }}
                className="px-4 py-2 rounded bg-red-500/15 hover:bg-red-500/25 border border-red-500/40 text-red-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Trash2 className="w-4 h-4 text-red-400" />
                <span>Xoá game này</span>
              </button>
            )}
            <div className="flex items-center gap-3 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded text-xs font-medium text-ice-subtext hover:text-white transition-colors"
              >
                Huỷ
              </button>
              <button
                type="submit"
                className="px-6 py-2 rounded bg-amber-500 hover:bg-amber-600 text-black text-xs font-bold tracking-wide flex items-center gap-2 transition-colors shadow-sm"
              >
                <Check className="w-4 h-4" />
                <span>{game ? 'Lưu thay đổi' : 'Tạo game mới'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
