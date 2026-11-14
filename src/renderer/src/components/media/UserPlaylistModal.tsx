import React, { useState, useEffect } from 'react';
import { X, ListMusic, Plus, Trash2, ArrowUp, ArrowDown, Check, Film, Music } from 'lucide-react';
import type { MediaItem, MediaPlaylist } from '../../types';
import { sfx } from '../../utils/sfx';

interface UserPlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  playlist: MediaPlaylist | null;
  defaultType?: 'video' | 'audio';
  allItems?: MediaItem[];
  onSave: (name: string, type: 'video' | 'audio', itemIds?: string[]) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

export const UserPlaylistModal: React.FC<UserPlaylistModalProps> = ({
  isOpen,
  onClose,
  playlist,
  defaultType = 'video',
  allItems = [],
  onSave,
  onDelete,
}) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<'video' | 'audio'>(defaultType);
  const [itemIds, setItemIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (playlist) {
        setName(playlist.name || '');
        setType(playlist.type || defaultType);
        setItemIds(playlist.itemIds ? [...playlist.itemIds] : []);
      } else {
        setName('');
        setType(defaultType);
        setItemIds([]);
      }
    }
  }, [isOpen, playlist, defaultType]);

  if (!isOpen) return null;

  const handleMoveUp = (index: number) => {
    if (index <= 0) return;
    sfx.playClick();
    const updated = [...itemIds];
    const temp = updated[index - 1];
    updated[index - 1] = updated[index];
    updated[index] = temp;
    setItemIds(updated);
  };

  const handleMoveDown = (index: number) => {
    if (index >= itemIds.length - 1) return;
    sfx.playClick();
    const updated = [...itemIds];
    const temp = updated[index + 1];
    updated[index + 1] = updated[index];
    updated[index] = temp;
    setItemIds(updated);
  };

  const handleRemoveItem = (idToRemove: string) => {
    sfx.playClick();
    setItemIds((prev) => prev.filter((id) => id !== idToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      await onSave(name.trim(), type, itemIds);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 select-none">
      <div className="bg-[#121620] border border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[88vh] animate-fade-in">
        {/* Header */}
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-white/[0.03]">
          <div className="flex items-center gap-2.5">
            <ListMusic className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-bold text-white tracking-wide uppercase">
              {playlist ? 'Chỉnh Sửa Danh Sách Phát' : 'Tạo Danh Sách Phát Mới'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {/* Name input */}
          <div className="space-y-1.5">
            <label className="font-semibold text-white">Tên danh sách phát *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ví dụ: Nhạc chill đêm khuya, Tuyển tập phim Anime..."
              className="w-full bg-black/50 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
            />
          </div>

          {/* Type Selector (Only when creating new) */}
          {!playlist && (
            <div className="space-y-1.5">
              <label className="font-semibold text-white">Loại danh sách</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setType('video')}
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border font-bold text-xs transition-all ${
                    type === 'video'
                      ? 'bg-blue-500/20 border-blue-400 text-blue-300'
                      : 'bg-white/[0.03] border-white/10 text-slate-400 hover:text-white'
                  }`}
                >
                  <Film className="w-3.5 h-3.5" />
                  <span>Phim & Video</span>
                </button>
                <button
                  type="button"
                  onClick={() => setType('audio')}
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border font-bold text-xs transition-all ${
                    type === 'audio'
                      ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                      : 'bg-white/[0.03] border-white/10 text-slate-400 hover:text-white'
                  }`}
                >
                  <Music className="w-3.5 h-3.5" />
                  <span>Nhạc & Audio</span>
                </button>
              </div>
            </div>
          )}

          {/* Item Reordering list (When editing) */}
          {playlist && (
            <div className="space-y-2 pt-2 border-t border-white/10">
              <div className="flex items-center justify-between text-slate-400 text-[11px]">
                <span className="font-semibold text-white">Sắp xếp các mục ({itemIds.length})</span>
                <span>Dùng nút 🔼 🔽 để đổi thứ tự</span>
              </div>

              {itemIds.length === 0 ? (
                <div className="py-6 text-center text-slate-500 bg-black/20 rounded-xl border border-white/5">
                  Danh sách này đang trống.
                </div>
              ) : (
                <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1 scrollbar-thin">
                  {itemIds.map((itemId, idx) => {
                    const item = allItems.find((m) => m.id === itemId);
                    return (
                      <div
                        key={itemId}
                        className="flex items-center justify-between gap-2 p-2 rounded-xl bg-white/[0.03] border border-white/5"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-5 text-[10px] font-mono text-slate-500 text-center">
                            #{idx + 1}
                          </span>
                          <span className="text-xs text-white truncate max-w-[200px]">
                            {item?.title || 'Mục đã xoá hoặc không tồn tại'}
                          </span>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => handleMoveUp(idx)}
                            className="p-1 rounded bg-white/5 hover:bg-white/10 disabled:opacity-20 text-slate-300 hover:text-white transition-colors"
                            title="Di chuyển lên"
                          >
                            <ArrowUp className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === itemIds.length - 1}
                            onClick={() => handleMoveDown(idx)}
                            className="p-1 rounded bg-white/5 hover:bg-white/10 disabled:opacity-20 text-slate-300 hover:text-white transition-colors"
                            title="Di chuyển xuống"
                          >
                            <ArrowDown className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(itemId)}
                            className="p-1 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors ml-1"
                            title="Xoá khỏi danh sách này"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-3">
            {playlist && onDelete && (
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Bạn có chắc muốn xoá danh sách phát "${playlist.name}" không?`)) {
                    onDelete(playlist.id);
                    onClose();
                  }
                }}
                className="px-3.5 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 font-semibold text-xs flex items-center gap-1.5 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Xoá</span>
              </button>
            )}

            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 rounded-xl text-slate-400 hover:text-white transition-colors"
              >
                Huỷ
              </button>
              <button
                type="submit"
                disabled={!name.trim() || loading}
                className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 disabled:opacity-40 text-black font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
              >
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                <span>{playlist ? 'Lưu thay đổi' : 'Tạo danh sách'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
