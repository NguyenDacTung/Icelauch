import React, { useState, useEffect } from 'react';
import {
  X,
  ListPlus,
  Film,
  Music,
  ArrowUp,
  ArrowDown,
  ChevronsUp,
  ChevronsDown,
  Trash2,
  Check,
  Search,
  Sparkles,
  ImageIcon,
  Maximize2,
  Square
} from 'lucide-react';
import type { MediaItem, MediaPlaylist, MediaSubType } from '../../types';
import { sfx } from '../../utils/sfx';

export interface PlaylistFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  playlist: MediaPlaylist | null;
  allMedia: MediaItem[];
  defaultType?: 'video' | 'audio';
  defaultSubType?: MediaSubType;
  onSave: (playlist: Partial<MediaPlaylist>) => void;
  onDelete?: (id: string) => void;
}

export const PlaylistFormModal: React.FC<PlaylistFormModalProps> = ({
  isOpen,
  onClose,
  playlist,
  allMedia,
  defaultType = 'video',
  defaultSubType = 'movie',
  onSave,
  onDelete,
}) => {
  const isEditing = Boolean(playlist && playlist.id);

  const [name, setName] = useState(playlist?.name || '');
  const [description, setDescription] = useState(playlist?.description || '');
  const [type, setType] = useState<'video' | 'audio'>(playlist?.type || defaultType);
  const [subType, setSubType] = useState<MediaSubType>(playlist?.subType || defaultSubType);
  const [coverPath, setCoverPath] = useState(playlist?.coverPath || '');
  const [coverAspectRatio, setCoverAspectRatio] = useState<'1:1' | '16:9'>(playlist?.coverAspectRatio || '1:1');
  const [selectedIds, setSelectedIds] = useState<string[]>(playlist?.itemIds ? [...playlist.itemIds] : []);
  const [searchFilter, setSearchFilter] = useState('');

  // Synchronize state when modal opens or target playlist changes, ensuring existing data is never lost or cleared
  useEffect(() => {
    if (isOpen) {
      if (playlist) {
        setName(playlist.name || '');
        setDescription(playlist.description || '');
        setType(playlist.type || defaultType);
        setSubType(playlist.subType || defaultSubType);
        setCoverPath(playlist.coverPath || '');
        setCoverAspectRatio(playlist.coverAspectRatio || (playlist.type === 'video' ? '16:9' : '1:1'));
        setSelectedIds(Array.isArray(playlist.itemIds) ? [...playlist.itemIds] : []);
      } else {
        setName('');
        setDescription('');
        setType(defaultType);
        setSubType(defaultSubType);
        setCoverPath('');
        setCoverAspectRatio(defaultType === 'video' ? '16:9' : '1:1');
        setSelectedIds([]);
      }
      setSearchFilter('');
    }
  }, [isOpen, playlist, defaultType, defaultSubType]);

  if (!isOpen) return null;

  // Filter media items eligible for this playlist type
  const eligibleMedia = allMedia.filter((m) => {
    const matchesType = m.type === type;
    if (!matchesType) return false;
    if (!searchFilter.trim()) return true;
    const query = searchFilter.toLowerCase();
    return (
      m.title.toLowerCase().includes(query) ||
      (m.category && m.category.toLowerCase().includes(query)) ||
      (m.tags && m.tags.some((t) => t.toLowerCase().includes(query)))
    );
  });

  const toggleItem = (id: string) => {
    sfx.playClick();
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((x) => x !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  // Reordering helpers
  const moveItem = (index: number, direction: 'up' | 'down') => {
    sfx.playClick();
    const newArr = [...selectedIds];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= newArr.length) return;
    const temp = newArr[index];
    newArr[index] = newArr[targetIdx];
    newArr[targetIdx] = temp;
    setSelectedIds(newArr);
  };

  const moveToTop = (index: number) => {
    if (index <= 0 || index >= selectedIds.length) return;
    sfx.playClick();
    const newArr = [...selectedIds];
    const [item] = newArr.splice(index, 1);
    newArr.unshift(item);
    setSelectedIds(newArr);
  };

  const moveToBottom = (index: number) => {
    if (index < 0 || index >= selectedIds.length - 1) return;
    sfx.playClick();
    const newArr = [...selectedIds];
    const [item] = newArr.splice(index, 1);
    newArr.push(item);
    setSelectedIds(newArr);
  };

  const handleBrowseCover = async () => {
    sfx.playClick();
    if (window.api?.browseFile) {
      const path = await window.api.browseFile({
        title: 'Chọn ảnh bìa Danh Sách Phát',
        filters: [{ name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'webp'] }],
      });
      if (path) {
        setCoverPath(path);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    sfx.playLaunch();
    onSave({
      id: playlist?.id,
      name: name.trim(),
      description: description.trim(),
      type,
      subType,
      coverPath: coverPath.trim(),
      coverAspectRatio,
      itemIds: selectedIds,
      createdAt: playlist?.createdAt || new Date().toISOString(),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in select-none">
      <div className="relative w-full max-w-2xl bg-ice-card border border-ice-border rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-ice-border/60 bg-ice-bg/60">
          <div className="flex items-center gap-2.5 text-white">
            <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
              <ListPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                {isEditing ? 'Chỉnh Sửa Danh Sách Phát' : 'Tạo Danh Sách Phát Mới'}
              </h2>
              <p className="text-[11px] text-ice-muted">
                {isEditing ? 'Cập nhật danh sách tập, thứ tự và ảnh bìa đại diện' : 'Tập hợp các video hoặc bài hát theo album/series'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              sfx.playClick();
              onClose();
            }}
            className="p-1.5 rounded-xl text-ice-muted hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Name & Type */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-xs font-semibold text-ice-text flex items-center gap-1.5">
                <span>Tên Danh Sách Phát / Series / Album</span>
                <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="VD: Tuyển tập Conan, Nhạc Chill Lofi, Podcast Công Nghệ..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-ice-bg border border-ice-border focus:border-ice-accent focus:outline-none text-white text-sm"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-ice-text">Phân Loại</label>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    sfx.playClick();
                    setType('video');
                    setSubType('movie');
                  }}
                  className={`py-2 px-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                    type === 'video'
                      ? 'bg-blue-600/30 text-blue-400 border-blue-500/60 shadow-sm'
                      : 'bg-ice-bg text-ice-muted border-ice-border hover:text-white'
                  }`}
                >
                  <Film className="w-3.5 h-3.5" />
                  <span>Video</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    sfx.playClick();
                    setType('audio');
                    setSubType('music');
                  }}
                  className={`py-2 px-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                    type === 'audio'
                      ? 'bg-amber-600/30 text-amber-400 border-amber-500/60 shadow-sm'
                      : 'bg-ice-bg text-ice-muted border-ice-border hover:text-white'
                  }`}
                >
                  <Music className="w-3.5 h-3.5" />
                  <span>Audio</span>
                </button>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-ice-text">Mô Tả Danh Sách Phát</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Giới thiệu nội dung, mùa phim, tập đặc biệt..."
              rows={2}
              className="w-full px-3.5 py-2 rounded-xl bg-ice-bg border border-ice-border focus:border-ice-accent focus:outline-none text-white text-xs resize-none"
            />
          </div>

          {/* Cover Art & Aspect Ratio Alignment */}
          <div className="space-y-3 p-4 rounded-xl bg-black/30 border border-ice-border/60">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-ice-text flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-amber-400" />
                <span>Ảnh Bìa Danh Sách (Cover Art)</span>
              </label>
              <span className="text-[11px] text-ice-muted">Tuỳ chọn định dạng & tỉ lệ</span>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={coverPath}
                onChange={(e) => setCoverPath(e.target.value)}
                placeholder="Đường dẫn file ảnh cục bộ hoặc URL ảnh bìa (https://...)"
                className="flex-1 px-3.5 py-2 rounded-xl bg-ice-bg border border-ice-border focus:border-ice-accent focus:outline-none text-white text-xs"
              />
              <button
                type="button"
                onClick={handleBrowseCover}
                className="px-3 py-2 rounded-xl bg-ice-bg hover:bg-ice-hover text-ice-text hover:text-white border border-ice-border text-xs font-medium transition-colors"
              >
                Chọn từ máy
              </button>
            </div>

            {/* Aspect Ratio Options */}
            <div className="space-y-1.5 pt-1">
              <div className="text-[11px] font-semibold text-ice-muted uppercase tracking-wider">
                Tỉ lệ hiển thị ảnh bìa (Cover Aspect Ratio)
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    sfx.playClick();
                    setCoverAspectRatio('1:1');
                  }}
                  className={`flex items-center gap-3 p-2.5 rounded-xl border text-left transition-all ${
                    coverAspectRatio === '1:1'
                      ? 'bg-amber-500/15 border-amber-500/60 text-white shadow-sm'
                      : 'bg-ice-bg/80 border-ice-border text-ice-muted hover:text-white hover:border-white/20'
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 ${
                      coverAspectRatio === '1:1'
                        ? 'border-amber-400 bg-amber-500/20 text-amber-400'
                        : 'border-white/20 bg-white/5 text-ice-muted'
                    }`}
                  >
                    <Square className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span>Vuông 1:1</span>
                      {coverAspectRatio === '1:1' && <Check className="w-3.5 h-3.5 text-amber-400" />}
                    </div>
                    <div className="text-[10px] text-ice-muted">Phù hợp Nhạc, Podcast, Album</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    sfx.playClick();
                    setCoverAspectRatio('16:9');
                  }}
                  className={`flex items-center gap-3 p-2.5 rounded-xl border text-left transition-all ${
                    coverAspectRatio === '16:9'
                      ? 'bg-amber-500/15 border-amber-500/60 text-white shadow-sm'
                      : 'bg-ice-bg/80 border-ice-border text-ice-muted hover:text-white hover:border-white/20'
                  }`}
                >
                  <div
                    className={`w-9 h-6 rounded border flex items-center justify-center shrink-0 ${
                      coverAspectRatio === '16:9'
                        ? 'border-amber-400 bg-amber-500/20 text-amber-400'
                        : 'border-white/20 bg-white/5 text-ice-muted'
                    }`}
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span>Widescreen 16:9</span>
                      {coverAspectRatio === '16:9' && <Check className="w-3.5 h-3.5 text-amber-400" />}
                    </div>
                    <div className="text-[10px] text-ice-muted">Phù hợp Phim, Series, Tuyển tập</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Live Cover Preview */}
            {coverPath && (
              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-black/50 border border-white/10 mt-2">
                <div
                  className={`overflow-hidden rounded-lg bg-black/80 border border-white/10 shrink-0 flex items-center justify-center ${
                    coverAspectRatio === '16:9' ? 'w-24 aspect-video' : 'w-14 h-14'
                  }`}
                >
                  <img
                    src={coverPath.startsWith('http') ? coverPath : `file://${coverPath}`}
                    alt="Cover preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
                <div className="text-xs min-w-0 flex-1">
                  <div className="text-white font-medium truncate">{coverPath.split(/[/\\]/).pop() || coverPath}</div>
                  <div className="text-[11px] text-ice-muted mt-0.5">
                    Hiển thị tỉ lệ {coverAspectRatio === '16:9' ? '16:9 (Màn ảnh rộng)' : '1:1 (Vuông chuẩn)'}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Media Items Selector and Sorter */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-ice-text flex items-center gap-1.5">
                <span>Quản Lý Mục Trong Danh Sách</span>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-bold">
                  {selectedIds.length} mục đã chọn
                </span>
              </label>
              <span className="text-[11px] text-ice-muted">
                Điều hướng: ⏫ Đầu | 🔼 Lên | 🔽 Xuống | ⏬ Cuối
              </span>
            </div>

            {/* Currently selected items with intuitive reorder buttons */}
            {selectedIds.length > 0 ? (
              <div className="p-2 rounded-xl bg-black/40 border border-ice-border/60 space-y-1.5 max-h-52 overflow-y-auto">
                {selectedIds.map((id, index) => {
                  const item = allMedia.find((m) => m.id === id);
                  const title = item ? item.title : `Mục #${id.slice(0, 8)}`;
                  const isFirst = index === 0;
                  const isLast = index === selectedIds.length - 1;

                  return (
                    <div
                      key={id}
                      className="flex items-center justify-between p-2 rounded-lg bg-ice-card/80 border border-ice-border/50 text-xs hover:border-white/20 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 truncate pr-2">
                        <span className="w-5 h-5 rounded-full bg-ice-bg text-ice-muted flex items-center justify-center text-[10px] font-bold shrink-0 border border-white/5">
                          {index + 1}
                        </span>
                        <span className="text-white font-medium truncate" title={title}>
                          {title}
                        </span>
                      </div>

                      {/* Intuitive reorder control button group */}
                      <div className="flex items-center gap-1 shrink-0 bg-black/30 p-1 rounded-lg border border-white/5">
                        {/* Move to Top ⏫ */}
                        <button
                          type="button"
                          onClick={() => moveToTop(index)}
                          disabled={isFirst}
                          className="p-1 rounded-md text-ice-muted hover:text-amber-400 hover:bg-white/10 disabled:opacity-20 disabled:cursor-not-allowed transition-all"
                          title="Đưa lên đầu danh sách ⏫ (Move to Top)"
                        >
                          <ChevronsUp className="w-3.5 h-3.5" />
                        </button>

                        {/* Move Up 🔼 */}
                        <button
                          type="button"
                          onClick={() => moveItem(index, 'up')}
                          disabled={isFirst}
                          className="p-1 rounded-md text-ice-muted hover:text-white hover:bg-white/10 disabled:opacity-20 disabled:cursor-not-allowed transition-all"
                          title="Di chuyển lên 🔼 (Move Up)"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>

                        {/* Move Down 🔽 */}
                        <button
                          type="button"
                          onClick={() => moveItem(index, 'down')}
                          disabled={isLast}
                          className="p-1 rounded-md text-ice-muted hover:text-white hover:bg-white/10 disabled:opacity-20 disabled:cursor-not-allowed transition-all"
                          title="Di chuyển xuống 🔽 (Move Down)"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>

                        {/* Move to Bottom ⏬ */}
                        <button
                          type="button"
                          onClick={() => moveToBottom(index)}
                          disabled={isLast}
                          className="p-1 rounded-md text-ice-muted hover:text-amber-400 hover:bg-white/10 disabled:opacity-20 disabled:cursor-not-allowed transition-all"
                          title="Đưa xuống cuối danh sách ⏬ (Move to Bottom)"
                        >
                          <ChevronsDown className="w-3.5 h-3.5" />
                        </button>

                        <div className="w-[1px] h-3 bg-white/10 mx-0.5" />

                        {/* Remove */}
                        <button
                          type="button"
                          onClick={() => toggleItem(id)}
                          className="p-1 rounded-md hover:bg-red-500/20 text-red-400/80 hover:text-red-300 transition-colors"
                          title="Loại khỏi danh sách"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-black/20 border border-dashed border-ice-border/60 text-center text-xs text-ice-muted">
                Chưa có mục nào được chọn. Hãy tick chọn từ danh sách bên dưới!
              </div>
            )}

            {/* Filter and Available items to pick from */}
            <div className="space-y-2 pt-1">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-ice-muted" />
                <input
                  type="text"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder={`Tìm kiếm trong ${allMedia.filter((m) => m.type === type).length} ${type === 'video' ? 'video' : 'bài hát/podcast'} có sẵn...`}
                  className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-ice-bg border border-ice-border focus:border-ice-accent focus:outline-none text-white text-xs placeholder:text-ice-muted"
                />
              </div>

              <div className="border border-ice-border/60 rounded-xl bg-ice-bg/50 p-2 max-h-44 overflow-y-auto space-y-1">
                {eligibleMedia.length === 0 ? (
                  <p className="text-xs text-ice-muted text-center py-4">Không tìm thấy nội dung phù hợp</p>
                ) : (
                  eligibleMedia.map((m) => {
                    const isChecked = selectedIds.includes(m.id);
                    return (
                      <div
                        key={m.id}
                        onClick={() => toggleItem(m.id)}
                        className={`flex items-center justify-between p-2 rounded-lg cursor-pointer text-xs transition-colors ${
                          isChecked
                            ? 'bg-amber-500/15 border border-amber-500/30 text-white'
                            : 'hover:bg-ice-hover text-ice-text border border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate pr-2">
                          <div
                            className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                              isChecked ? 'bg-amber-500 border-amber-500 text-black' : 'border-ice-border'
                            }`}
                          >
                            {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                          <span className="truncate">{m.title}</span>
                        </div>
                        <span className="text-[10px] text-ice-muted shrink-0">
                          {m.tags?.[0] || m.category || (m.type === 'video' ? 'Video' : 'Audio')}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-ice-border/60">
            {isEditing && onDelete && playlist ? (
              <button
                type="button"
                onClick={() => {
                  sfx.playClick();
                  if (confirm('Bạn có chắc muốn xoá Danh Sách Phát này không? (Các video/audio bên trong vẫn được giữ nguyên)')) {
                    onDelete(playlist.id);
                    onClose();
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-semibold transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Xoá danh sách</span>
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  sfx.playClick();
                  onClose();
                }}
                className="px-4 py-2 rounded-xl bg-ice-bg hover:bg-ice-hover text-ice-text hover:text-white border border-ice-border text-xs font-semibold transition-colors"
              >
                Huỷ
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-black text-xs font-bold shadow-lg shadow-amber-500/20 transition-all"
              >
                Lưu Danh Sách
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
