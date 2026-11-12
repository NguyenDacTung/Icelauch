import React, { useState, useEffect } from 'react';
import { X, Film, Music, Check, ExternalLink, Sparkles, FolderOpen, Mic, Monitor, Smartphone } from 'lucide-react';
import { TagSelector } from './TagSelector';
import { ImagePositionSelector } from './ImagePositionSelector';
import { parseMediaUrl } from '../../utils/mediaUrl';
import type { MediaItem, MediaSubType } from '../../types';

interface MediaFormModalProps {
  media: MediaItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (mediaData: Partial<MediaItem>) => void;
  onBrowseFile?: (type: 'cover' | 'banner') => Promise<string | null>;
  availableTags?: string[];
  onAddNewGlobalTag?: (tag: string) => void;
}

export const MediaFormModal: React.FC<MediaFormModalProps> = ({
  media,
  isOpen,
  onClose,
  onSave,
  onBrowseFile,
  availableTags = [],
  onAddNewGlobalTag,
}) => {
  const [type, setType] = useState<'video' | 'audio'>('video');
  const [subType, setSubType] = useState<MediaSubType>('movie');
  const [artist, setArtist] = useState('');
  const [aspectRatioMode, setAspectRatioMode] = useState<'16:9' | '9:16' | 'auto'>('16:9');
  const [title, setTitle] = useState('');
  const [link, setLink] = useState('');
  const [backupLinksText, setBackupLinksText] = useState('');
  const [coverPath, setCoverPath] = useState('');
  const [bannerPath, setBannerPath] = useState('');
  const [coverPosition, setCoverPosition] = useState('50% 50%');
  const [bannerPosition, setBannerPosition] = useState('50% 50%');
  const [coverZoom, setCoverZoom] = useState(1);
  const [bannerZoom, setBannerZoom] = useState(1);
  const [bannerBlur, setBannerBlur] = useState(0);
  const [bannerDarkness, setBannerDarkness] = useState(30);
  const [bannerEdgeDarkness, setBannerEdgeDarkness] = useState(10);
  const [coverSharpen, setCoverSharpen] = useState(0);
  const [bannerSharpen, setBannerSharpen] = useState(0);
  const [isBannerPinned, setIsBannerPinned] = useState(false);
  const [isBannerPermanent, setIsBannerPermanent] = useState(false);
  const [bannerExpiryDays, setBannerExpiryDays] = useState(7);
  const [description, setDescription] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>(['Hoạt hình']);
  const [hidden, setHidden] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  // Sync state whenever media or isOpen changes
  useEffect(() => {
    if (isOpen) {
      if (media) {
        // Editing existing media -> populate all exact fields!
        setType(media.type || 'video');
        setSubType(media.subType || (media.type === 'video' ? 'movie' : 'music'));
        setArtist(media.artist || '');
        setAspectRatioMode(media.aspectRatioMode || '16:9');
        setTitle(media.title || '');
        setLink(media.link || '');
        setBackupLinksText(media.backupLinks ? media.backupLinks.join('\n') : '');
        setCoverPath(media.coverPath || '');
        setBannerPath(media.bannerPath || '');
        setCoverPosition(media.coverPosition || '50% 50%');
        setBannerPosition(media.bannerPosition || '50% 50%');
        setCoverZoom(media.coverZoom || 1);
        setBannerZoom(media.bannerZoom || 1);
        setBannerBlur(media.bannerBlur ?? 0);
        setBannerDarkness(media.bannerDarkness ?? 30);
        setBannerEdgeDarkness(media.bannerEdgeDarkness ?? 10);
        setCoverSharpen(media.coverSharpen ?? 0);
        setBannerSharpen(media.bannerSharpen ?? 0);
        setIsBannerPinned(media.isBannerPinned ?? false);
        setIsBannerPermanent(media.isBannerPermanent ?? false);
        setBannerExpiryDays(7);
        setDescription(media.description || '');
        setSelectedTags(
          media.tags && media.tags.length > 0
            ? [...media.tags]
            : media.category
            ? media.category.split(',').map((s) => s.trim()).filter(Boolean)
            : media.type === 'video'
            ? ['Hoạt hình']
            : ['Nhạc Chill']
        );
        setHidden(media.hidden ?? false);
      } else {
        // Adding new media -> reset everything to completely clean state!
        setType('video');
        setSubType('movie');
        setArtist('');
        setAspectRatioMode('16:9');
        setTitle('');
        setLink('');
        setBackupLinksText('');
        setCoverPath('');
        setBannerPath('');
        setCoverPosition('50% 50%');
        setBannerPosition('50% 50%');
        setCoverZoom(1);
        setBannerZoom(1);
        setBannerBlur(0);
        setBannerDarkness(30);
        setBannerEdgeDarkness(10);
        setCoverSharpen(0);
        setBannerSharpen(0);
        setIsBannerPinned(true);
        setIsBannerPermanent(false);
        setBannerExpiryDays(7);
        setDescription('');
        setSelectedTags(['Hoạt hình']);
        setHidden(false);
      }
      setTestResult(null);
    }
  }, [media, isOpen]);

  if (!isOpen) return null;

  const handleBrowseImage = async (imgType: 'cover' | 'banner') => {
    if (onBrowseFile) {
      const filePath = await onBrowseFile(imgType);
      if (filePath) {
        if (imgType === 'cover') setCoverPath(filePath);
        else setBannerPath(filePath);
      }
    } else if (window.api?.browseFile) {
      const filePath = await window.api.browseFile({
        title: imgType === 'cover' ? 'Chọn ảnh bìa / Poster' : 'Chọn ảnh Banner ngang',
        filters: [{ name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'webp'] }],
      });
      if (filePath) {
        if (imgType === 'cover') setCoverPath(filePath);
        else setBannerPath(filePath);
      }
    }
  };

  const handleLinkChange = (val: string) => {
    setLink(val);
    const parsed = parseMediaUrl(val);

    if (parsed.kind === 'youtube') {
      setTestResult('✓ Đã nhận diện: Link YouTube hợp lệ (phát trực tiếp)');
      if (!coverPath && parsed.thumbnailUrl) {
        setCoverPath(parsed.thumbnailUrl);
      }
    } else if (parsed.kind === 'facebook') {
      setTestResult(parsed.isReel ? '✓ Đã nhận diện: Link Facebook Reel (Video ngắn)' : '✓ Đã nhận diện: Link Facebook Video');
    } else if (parsed.kind === 'gdrive') {
      setTestResult('✓ Đã nhận diện: Link Google Drive hợp lệ (hỗ trợ phát trực tiếp chất lượng cao 1080p)');
      if (!coverPath && parsed.thumbnailUrl) {
        setCoverPath(parsed.thumbnailUrl);
      }
    } else if (val.endsWith('.mp4') || val.endsWith('.webm') || val.endsWith('.mp3')) {
      setTestResult('✓ Link video/audio trực tiếp');
    } else {
      setTestResult(null);
    }
  };

  const handleTestLink = async () => {
    if (!link.trim()) {
      setTestResult('Vui lòng nhập link');
      return;
    }
    const parsed = parseMediaUrl(link);
    if (parsed.kind === 'youtube') {
      setTestResult('✓ Link YouTube hoạt động tốt!');
      return;
    }
    if (parsed.kind === 'facebook') {
      setTestResult('✓ Link Facebook hợp lệ!');
      return;
    }
    if (parsed.kind === 'gdrive') {
      setTestResult('✓ Link Google Drive hợp lệ!');
      return;
    }
    setTestResult('Đang kiểm tra kết nối...');
    try {
      await fetch(link.trim(), { method: 'HEAD', mode: 'no-cors' });
      setTestResult('Kết nối thành công (Link hợp lệ)');
    } catch {
      setTestResult('Không thể kiểm tra trực tiếp (có thể do giới hạn CORS browser)');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !link.trim()) {
      alert('Vui lòng nhập đầy đủ tên và link');
      return;
    }

    const parsed = parseMediaUrl(link);
    const finalCover = coverPath.trim() || parsed.thumbnailUrl || undefined;

    let bannerFeaturedUntil: string | undefined = undefined;
    if (isBannerPinned && !isBannerPermanent) {
      bannerFeaturedUntil = new Date(Date.now() + bannerExpiryDays * 24 * 60 * 60 * 1000).toISOString();
    }

    const bLinks = backupLinksText
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);

    onSave({
      id: media?.id,
      type,
      subType,
      artist: artist.trim() || undefined,
      aspectRatioMode,
      title: title.trim(),
      link: link.trim(),
      backupLinks: bLinks.length > 0 ? bLinks : undefined,
      coverPath: finalCover,
      bannerPath: bannerPath.trim() || undefined,
      coverPosition: coverPosition || undefined,
      bannerPosition: bannerPosition || undefined,
      coverZoom,
      bannerZoom,
      bannerBlur,
      bannerDarkness,
      bannerEdgeDarkness,
      coverSharpen,
      bannerSharpen,
      isBannerPinned,
      isBannerPermanent,
      bannerFeaturedUntil,
      description: description.trim() || undefined,
      tags: selectedTags,
      hidden,
      category: selectedTags.join(', ') || (parsed.kind === 'youtube' ? 'YouTube' : parsed.kind === 'facebook' ? 'Facebook' : parsed.kind === 'gdrive' ? 'Google Drive' : undefined),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-ice-card border border-ice-border rounded-xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-ice-border flex items-center justify-between bg-ice-card/90">
          <div className="flex items-center gap-2">
            {type === 'video' ? <Film className="w-5 h-5 text-amber-400" /> : <Music className="w-5 h-5 text-amber-400" />}
            <h3 className="text-sm font-bold text-white tracking-wide">
              {media ? `Sửa thông tin: ${media.title}` : 'Thêm Phim / Nhạc Mới (Admin)'}
            </h3>
          </div>
          <button onClick={onClose} className="text-ice-subtext hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs text-ice-text">
          {/* Type Selector */}
          <div className="space-y-1.5">
            <label className="font-semibold text-white">Định dạng phát</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setType('video');
                  if (!media) setSelectedTags(['Hoạt hình']);
                }}
                className={`h-9 rounded border font-semibold flex items-center justify-center gap-2 transition-colors ${
                  type === 'video'
                    ? 'bg-ice-accent/20 border-ice-accent text-ice-accent'
                    : 'bg-ice-bg border-ice-border text-ice-subtext hover:text-white'
                }`}
              >
                <Film className="w-4 h-4" />
                <span>Phim & Video (Drive / YouTube / MP4)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setType('audio');
                  if (!media) setSelectedTags(['Nhạc Chill']);
                }}
                className={`h-9 rounded border font-semibold flex items-center justify-center gap-2 transition-colors ${
                  type === 'audio'
                    ? 'bg-ice-accent/20 border-ice-accent text-ice-accent'
                    : 'bg-ice-bg border-ice-border text-ice-subtext hover:text-white'
                }`}
              >
                <Music className="w-4 h-4" />
                <span>Nhạc & Audio (.mp3)</span>
              </button>
            </div>

            {/* Sub-Type Selector for Audio */}
            {type === 'audio' && (
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSubType('music')}
                  className={`h-8 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                    subType === 'music'
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                      : 'bg-ice-bg border-ice-border text-ice-subtext hover:text-white'
                  }`}
                >
                  <Music className="w-3.5 h-3.5" />
                  <span>Bài Hát & Chill (Nhạc)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSubType('podcast')}
                  className={`h-8 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                    subType === 'podcast'
                      ? 'bg-purple-500/20 border-purple-500 text-purple-300'
                      : 'bg-ice-bg border-ice-border text-ice-subtext hover:text-white'
                  }`}
                >
                  <Mic className="w-3.5 h-3.5" />
                  <span>Audiobook & Podcast (Sách nói)</span>
                </button>
              </div>
            )}

            {/* Aspect Ratio Selector for Video */}
            {type === 'video' && (
              <div className="flex items-center gap-3 pt-2">
                <span className="text-[11px] text-ice-muted font-medium">Tỉ lệ khung hình:</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setAspectRatioMode('16:9')}
                    className={`px-3 py-1 rounded-lg border text-xs font-semibold flex items-center gap-1 transition-colors ${
                      aspectRatioMode === '16:9'
                        ? 'bg-blue-600/30 border-blue-500 text-blue-300'
                        : 'bg-ice-bg border-ice-border text-ice-muted hover:text-white'
                    }`}
                  >
                    <Monitor className="w-3 h-3" />
                    <span>16:9 Điện ảnh</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAspectRatioMode('9:16')}
                    className={`px-3 py-1 rounded-lg border text-xs font-semibold flex items-center gap-1 transition-colors ${
                      aspectRatioMode === '9:16'
                        ? 'bg-blue-600/30 border-blue-500 text-blue-300'
                        : 'bg-ice-bg border-ice-border text-ice-muted hover:text-white'
                    }`}
                  >
                    <Smartphone className="w-3 h-3" />
                    <span>9:16 Reel Dọc</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Title and Artist */}
          <div className="space-y-1.5">
            <label className="font-semibold text-white">Tên hiển thị *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={type === 'video' ? 'Ví dụ: Thám Tử Lừng Danh Conan 15 - 15 Phút Tĩnh Lặng' : 'Ví dụ: Synthwave Chill Beats'}
              className="w-full h-9 rounded bg-ice-bg border border-ice-border px-3 text-white focus:outline-none focus:border-amber-400"
            />
          </div>

          {/* Artist / Author for Audio */}
          {type === 'audio' && (
            <div className="space-y-1.5">
              <label className="font-semibold text-white">Nghệ sĩ / Tác giả / Kênh</label>
              <input
                type="text"
                value={artist}
                onChange={(e) => setArtist(e.target.value)}
                placeholder="Ví dụ: Lofi Girl, Đan Trường, Radio Truyện Đêm Khuya..."
                className="w-full h-9 rounded bg-ice-bg border border-ice-border px-3 text-white focus:outline-none focus:border-amber-400"
              />
            </div>
          )}

          {/* Description */}
          <div className="space-y-1.5">
            <label className="font-semibold text-white">Mô tả / Tóm tắt nội dung</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Giới thiệu nội dung phim hoặc thông tin bài hát..."
              className="w-full rounded bg-ice-bg border border-ice-border p-2.5 text-white focus:outline-none focus:border-amber-400 resize-none text-xs"
            />
          </div>

          {/* Link */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-white flex items-center gap-2">
                <span>Link phát trực tiếp *</span>
                <span className="text-[10px] text-ice-subtext font-normal">
                  (Google Drive, YouTube hoặc link .mp4 trực tiếp)
                </span>
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
            <input
              type="text"
              required
              value={link}
              onChange={(e) => handleLinkChange(e.target.value)}
              placeholder="https://drive.google.com/file/d/... hoặc https://www.youtube.com/watch?v=... hoặc https://...mp4"
              className="w-full h-9 rounded bg-ice-bg border border-ice-border px-3 text-white font-mono text-[11px] focus:outline-none focus:border-amber-400"
            />
            {testResult && (
              <p className="text-[11px] text-amber-300 font-medium flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>{testResult}</span>
              </p>
            )}
          </div>

          {/* Backup Links */}
          <div className="space-y-1.5">
            <label className="font-semibold text-white flex items-center gap-2">
              <span>Link phát dự phòng (Tùy chọn)</span>
              <span className="text-[10px] text-ice-subtext font-normal">
                (Mỗi dòng 1 link - tự động chuyển khi link chính bị giới hạn hoặc lỗi)
              </span>
            </label>
            <textarea
              rows={2}
              value={backupLinksText}
              onChange={(e) => setBackupLinksText(e.target.value)}
              placeholder="https://drive.google.com/file/d/... (Link dự phòng 1)\nhttps://... (Link dự phòng 2)"
              className="w-full rounded bg-ice-bg border border-ice-border p-2.5 text-white font-mono text-[11px] focus:outline-none focus:border-amber-400 resize-none"
            />
          </div>

          {/* Tag Selector */}
          <TagSelector
            label="Thể loại / Phân loại (Tags)"
            selectedTags={selectedTags}
            availableTags={availableTags}
            onChange={setSelectedTags}
            onAddNewTag={onAddNewGlobalTag}
            placeholder={type === 'video' ? 'Ví dụ: Hoạt hình, Phim lẻ, Phim 1080p...' : 'Ví dụ: Nhạc Chill, EDM, Pop...'}
          />

          {/* Cover & Banner Images */}
          <div className="grid grid-cols-2 gap-3">
            {/* Cover Path */}
            <div className="space-y-1.5">
              <label className="font-semibold text-white flex items-center justify-between">
                <span>Ảnh bìa / Poster</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleBrowseImage('cover')}
                    className="text-amber-400 hover:underline text-[11px] flex items-center gap-0.5"
                  >
                    <FolderOpen className="w-3 h-3" />
                    <span>Chọn từ máy</span>
                  </button>
                  {parseMediaUrl(link).thumbnailUrl && (
                    <button
                      type="button"
                      onClick={() => setCoverPath(parseMediaUrl(link).thumbnailUrl || '')}
                      className="text-ice-accent hover:underline text-[11px]"
                    >
                      Lấy từ link
                    </button>
                  )}
                </div>
              </label>
              <input
                type="text"
                value={coverPath}
                onChange={(e) => setCoverPath(e.target.value)}
                placeholder="Dán link ảnh hoặc chọn file từ máy"
                className="w-full h-9 rounded bg-ice-bg border border-ice-border px-3 text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* Banner Path */}
            <div className="space-y-1.5">
              <label className="font-semibold text-white flex items-center justify-between">
                <span>Ảnh Banner ngang (16:9)</span>
                <button
                  type="button"
                  onClick={() => handleBrowseImage('banner')}
                  className="text-amber-400 hover:underline text-[11px] flex items-center gap-0.5"
                >
                  <FolderOpen className="w-3 h-3" />
                  <span>Chọn từ máy</span>
                </button>
              </label>
              <input
                type="text"
                value={bannerPath}
                onChange={(e) => setBannerPath(e.target.value)}
                placeholder="Tuỳ chọn (nếu trống sẽ dùng ảnh bìa)"
                className="w-full h-9 rounded bg-ice-bg border border-ice-border px-3 text-white focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          {/* Manual Image Alignment Controls */}
          <div className="space-y-4 pt-1">
            {coverPath && (
              <ImagePositionSelector
                label={type === 'video' ? 'Căn chỉnh & Nét Thẻ Video (16:9)' : 'Căn chỉnh & Nét Ảnh Bìa / Poster'}
                imageUrl={coverPath}
                aspectRatio={type === 'video' ? 'video' : 'cover'}
                value={coverPosition}
                onChange={setCoverPosition}
                zoom={coverZoom}
                onZoomChange={setCoverZoom}
                sharpen={coverSharpen}
                onSharpenChange={setCoverSharpen}
                demoTitle={title}
              />
            )}
            {(bannerPath || coverPath) && (
              <ImagePositionSelector
                label="Căn chỉnh, Nét, Zoom & Độ Mờ Banner Hero Giải Trí (16:9 Chuẩn)"
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
                demoTitle={title}
              />
            )}
          </div>

          {/* Banner Featured Pin Section */}
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
                <span>Ghim hiển thị trên Banner nổi bật ({type === 'video' ? 'Phim & Video' : 'Nhạc & Audio'})</span>
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

          {/* Admin Hide Toggle */}
          <div className="pt-2 border-t border-ice-border">
            <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg bg-amber-500/10 border border-amber-500/30">
              <input
                type="checkbox"
                checked={hidden}
                onChange={(e) => setHidden(e.target.checked)}
                className="w-4 h-4 rounded accent-amber-500"
              />
              <span className="font-bold text-amber-300">
                Ẩn mục này (Chỉ Admin mới nhìn thấy, ẩn hoàn toàn với người dùng thông thường)
              </span>
            </label>
          </div>

          {/* Footer Submit */}
          <div className="pt-4 border-t border-ice-border flex items-center justify-end gap-3">
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
              <span>{media ? 'Lưu thay đổi' : 'Thêm mục mới'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
