import React, { useState } from 'react';
import { X, ListPlus, Film, Music, Mic, ArrowUp, ArrowDown, Trash2, Check, Sparkles, FolderPlus } from 'lucide-react';
import type { MediaItem, MediaPlaylist, MediaSubType } from '../../types';
import { sfx } from '../../utils/sfx';

interface PlaylistFormModalProps {
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
  const [selectedIds, setSelectedIds] = useState<string[]>(playlist?.itemIds || []);

  if (!isOpen) return null;

  // Filter media items eligible for this playlist type
  const eligibleMedia = allMedia.filter((m) => m.type === type);

  const toggleItem = (id: string) => {
    sfx.playClick();
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((x) => x !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

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

  const handleBrowseCover = async () => {
    sfx.playClick();
    const path = await window.api.browseFile({
      title: 'Chọn ảnh bìa Danh Sách Phát',
      filters: [{ name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'webp'] }],
    });
    if (path) {
      setCoverPath(path);
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
      itemIds: selectedIds,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in select-none">
      <div className="relative w-full max-w-2xl bg-ice-card border border-ice-border rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-ice-border/60 bg-ice-bg/60">
          <div className="flex items-center gap-2 text-white">
            <ListPlus className="w-5 h-5 text-ice-accent" />
            <h2 className="text-base font-bold">
              {isEditing ? 'Chỉnh Sửa Danh Sách Phát' : 'Tạo Danh Sách Phát Mới'}
            </h2>
          </div>
          <button
            onClick={() => {
              sfx.playClick();
              onClose();
            }}
            className="p-1 rounded-lg text-ice-muted hover:text-white hover:bg-white/10 transition-colors"
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
                    setType('video');
                    setSubType('movie');
                  }}
                  className={`py-2 px-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                    type === 'video'
                      ? 'bg-blue-600/30 text-blue-400 border-blue-500/60'
                      : 'bg-ice-bg text-ice-muted border-ice-border hover:text-white'
                  }`}
                >
                  <Film className="w-3.5 h-3.5" />
                  <span>Video</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setType('audio');
                    setSubType('music');
                  }}
                  className={`py-2 px-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                    type === 'audio'
                      ? 'bg-amber-600/30 text-amber-400 border-amber-500/60'
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

          {/* Cover Image */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-ice-text">Ảnh Bìa Danh Sách (Tuỳ chọn)</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={coverPath}
                onChange={(e) => setCoverPath(e.target.value)}
                placeholder="Đường dẫn file ảnh hoặc URL ảnh bìa"
                className="flex-1 px-3.5 py-2 rounded-xl bg-ice-bg border border-ice-border focus:border-ice-accent focus:outline-none text-white text-xs"
              />
              <button
                type="button"
                onClick={handleBrowseCover}
                className="px-3 py-2 rounded-xl bg-ice-bg hover:bg-ice-hover text-ice-text hover:text-white border border-ice-border text-xs font-medium"
              >
                Chọn từ máy
              </button>
            </div>
          </div>

          {/* Media Items Selector and Sorter */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-ice-text">
                Chọn Video / Bài Hát Cho Danh Sách ({selectedIds.length} mục đã chọn)
              </label>
              <span className="text-[11px] text-ice-muted">Dùng mũi tên ▲ ▼ để đổi thứ tự tập/bài</span>
            </div>

            {/* Currently selected items with up/down controls */}
            {selectedIds.length > 0 && (
              <div className="p-2.5 rounded-xl bg-black/40 border border-ice-border/60 space-y-1.5 max-h-40 overflow-y-auto">
                {selectedIds.map((id, index) => {
                  const item = allMedia.find((m) => m.id === id);
                  if (!item) return null;
                  return (
                    <div
                      key={id}
                      className="flex items-center justify-between p-2 rounded-lg bg-ice-card/80 border border-ice-border/50 text-xs"
                    >
                      <div className="flex items-center gap-2 truncate pr-2">
                        <span className="w-5 h-5 rounded-full bg-ice-bg text-ice-muted flex items-center justify-center text-[10px] font-bold">
                          {index + 1}
                        </span>
                        <span className="text-white font-medium truncate">{item.title}</span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => moveItem(index, 'up')}
                          disabled={index === 0}
                          className="p-1 rounded hover:bg-white/10 text-ice-muted hover:text-white disabled:opacity-30"
                          title="Di chuyển lên"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveItem(index, 'down')}
                          disabled={index === selectedIds.length - 1}
                          className="p-1 rounded hover:bg-white/10 text-ice-muted hover:text-white disabled:opacity-30"
                          title="Di chuyển xuống"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleItem(id)}
                          className="p-1 rounded hover:bg-red-500/20 text-red-400"
                          title="Loại khỏi danh sách"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Available items to pick from */}
            <div className="border border-ice-border/60 rounded-xl bg-ice-bg/50 p-2 max-h-48 overflow-y-auto space-y-1">
              {eligibleMedia.length === 0 ? (
                <p className="text-xs text-ice-muted text-center py-4">Chưa có nội dung nào phù hợp</p>
              ) : (
                eligibleMedia.map((m) => {
                  const isChecked = selectedIds.includes(m.id);
                  return (
                    <div
                      key={m.id}
                      onClick={() => toggleItem(m.id)}
                      className={`flex items-center justify-between p-2 rounded-lg cursor-pointer text-xs transition-colors ${
                        isChecked
                          ? 'bg-ice-accent/15 border border-ice-accent/30 text-white'
                          : 'hover:bg-ice-hover text-ice-text border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate pr-2">
                        <div
                          className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                            isChecked ? 'bg-ice-accent border-ice-accent text-white' : 'border-ice-border'
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
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-ice-accent hover:from-blue-500 hover:to-blue-400 text-white text-xs font-bold shadow-lg shadow-ice-accent/20 transition-all"
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
