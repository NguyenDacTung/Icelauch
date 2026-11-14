import React, { useState, useMemo } from 'react';
import {
  X,
  Tag,
  Plus,
  Trash2,
  Edit2,
  Check,
  CheckSquare,
  Square,
  Search,
  Filter,
  Layers,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import type { Game, MediaItem } from '../../types';
import { sfx } from '../../utils/sfx';

interface TagManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'game' | 'media';
  tags: string[];
  games?: Game[];
  media?: MediaItem[];
  onSaveTags: (newTags: string[]) => Promise<void>;
  onRenameTag: (oldTag: string, newTag: string) => Promise<void>;
  onDeleteTag: (tagToDelete: string) => Promise<void>;
  onBatchAssignTags: (itemIds: string[], tagsToAdd: string[], tagsToRemove: string[]) => Promise<void>;
}

export const TagManagerModal: React.FC<TagManagerModalProps> = ({
  isOpen,
  onClose,
  mode,
  tags,
  games = [],
  media = [],
  onSaveTags,
  onRenameTag,
  onDeleteTag,
  onBatchAssignTags,
}) => {
  const [activeTab, setActiveTab] = useState<'manage' | 'batch'>('manage');
  const [newTagInput, setNewTagInput] = useState('');
  const [editingTag, setEditingTag] = useState<{ oldName: string; newName: string } | null>(null);
  const [searchTag, setSearchTag] = useState('');
  const [loading, setLoading] = useState(false);

  // Batch Assignment State
  const [searchItem, setSearchItem] = useState('');
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [batchTagsToAdd, setBatchTagsToAdd] = useState<string[]>([]);
  const [batchTagsToRemove, setBatchTagsToRemove] = useState<string[]>([]);
  const [batchSuccessMsg, setBatchSuccessMsg] = useState<string | null>(null);

  const items = useMemo(() => {
    return mode === 'game' ? games : media;
  }, [mode, games, media]);

  // Count usage of each tag
  const tagUsageCount = useMemo(() => {
    const map = new Map<string, number>();
    tags.forEach((t) => map.set(t, 0));
    items.forEach((item) => {
      (item.tags || []).forEach((t) => {
        if (map.has(t)) {
          map.set(t, (map.get(t) || 0) + 1);
        } else {
          map.set(t, 1);
        }
      });
    });
    return map;
  }, [tags, items]);

  if (!isOpen) return null;

  // Filtered tags for Tab 1
  const filteredTags = tags.filter((t) =>
    t.toLowerCase().includes(searchTag.toLowerCase())
  );

  // Filtered items for Tab 2
  const filteredItems = items.filter((item) => {
    const title = 'title' in item ? (item as MediaItem).title : (item as Game).name;
    return title.toLowerCase().includes(searchItem.toLowerCase());
  });

  const handleAddNewTag = async () => {
    const trimmed = newTagInput.trim();
    if (!trimmed) return;
    if (tags.includes(trimmed)) {
      alert('Thể loại này đã tồn tại!');
      return;
    }
    setLoading(true);
    try {
      await onSaveTags([...tags, trimmed]);
      setNewTagInput('');
      sfx.playSuccess();
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRename = async () => {
    if (!editingTag || !editingTag.newName.trim()) return;
    const { oldName, newName } = editingTag;
    if (oldName === newName.trim()) {
      setEditingTag(null);
      return;
    }
    setLoading(true);
    try {
      await onRenameTag(oldName, newName.trim());
      setEditingTag(null);
      sfx.playSuccess();
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTag = async (t: string) => {
    const count = tagUsageCount.get(t) || 0;
    if (
      confirm(
        `Xoá thể loại "${t}"? ${
          count > 0 ? `Hiện có ${count} mục đang mang thể loại này và sẽ bị gỡ bỏ.` : ''
        }`
      )
    ) {
      setLoading(true);
      try {
        await onDeleteTag(t);
        sfx.playSuccess();
      } finally {
        setLoading(false);
      }
    }
  };

  const handleToggleSelectItem = (id: string) => {
    setSelectedItemIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAllFiltered = () => {
    const filteredIds = filteredItems.map((i) => i.id);
    const allSelected = filteredIds.every((id) => selectedItemIds.includes(id));
    if (allSelected) {
      setSelectedItemIds((prev) => prev.filter((id) => !filteredIds.includes(id)));
    } else {
      setSelectedItemIds((prev) => Array.from(new Set([...prev, ...filteredIds])));
    }
  };

  const handleApplyBatch = async () => {
    if (selectedItemIds.length === 0) {
      alert('Vui lòng chọn ít nhất 1 mục để gán/gỡ thể loại!');
      return;
    }
    if (batchTagsToAdd.length === 0 && batchTagsToRemove.length === 0) {
      alert('Vui lòng chọn ít nhất 1 thể loại cần Thêm hoặc Gỡ!');
      return;
    }

    setLoading(true);
    try {
      await onBatchAssignTags(selectedItemIds, batchTagsToAdd, batchTagsToRemove);
      setBatchSuccessMsg(
        `Đã cập nhật thể loại thành công cho ${selectedItemIds.length} mục!`
      );
      setBatchTagsToAdd([]);
      setBatchTagsToRemove([]);
      sfx.playSuccess();
      setTimeout(() => setBatchSuccessMsg(null), 4000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#12151F] border border-ice-border rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-scale-up">
        {/* Header */}
        <div className="px-6 py-4 border-b border-ice-border/70 flex items-center justify-between bg-white/5">
          <div className="flex items-center gap-2.5">
            <Tag className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold text-white tracking-wide">
              Quản Lý Thể Loại {mode === 'game' ? 'Trò Chơi' : 'Giải Trí'}
            </h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 font-mono border border-amber-500/30">
              {tags.length} thể loại
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-ice-subtext hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-ice-border/60 bg-black/40 px-6 pt-2">
          <button
            onClick={() => setActiveTab('manage')}
            className={`pb-2.5 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
              activeTab === 'manage'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-ice-muted hover:text-white'
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            <span>Danh Mục Thể Loại</span>
          </button>
          <button
            onClick={() => setActiveTab('batch')}
            className={`pb-2.5 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
              activeTab === 'batch'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-ice-muted hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Gán Hàng Loạt ({selectedItemIds.length} mục đã chọn)</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs text-ice-text">
          {activeTab === 'manage' && (
            <div className="space-y-4">
              {/* Add New Tag Bar */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddNewTag()}
                  placeholder="Nhập tên thể loại mới..."
                  className="flex-1 h-9 rounded-xl bg-black/50 border border-ice-border px-3.5 text-white placeholder-ice-muted focus:outline-none focus:border-amber-400 text-xs"
                />
                <button
                  type="button"
                  onClick={handleAddNewTag}
                  disabled={loading || !newTagInput.trim()}
                  className="px-4 h-9 rounded-xl bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-black font-bold text-xs flex items-center gap-1.5 transition-all shadow-md active:scale-95"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span>Thêm Thể Loại</span>
                </button>
              </div>

              {/* Search Tags */}
              <div className="flex items-center gap-2 bg-black/40 border border-ice-border/60 rounded-xl px-3 py-1.5">
                <Search className="w-3.5 h-3.5 text-ice-muted" />
                <input
                  type="text"
                  value={searchTag}
                  onChange={(e) => setSearchTag(e.target.value)}
                  placeholder="Lọc tìm thể loại..."
                  className="bg-transparent text-xs text-white placeholder-ice-muted focus:outline-none flex-1"
                />
              </div>

              {/* Tags Grid / List */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-[50vh] overflow-y-auto pr-1">
                {filteredTags.map((t) => {
                  const count = tagUsageCount.get(t) || 0;
                  const isEditing = editingTag?.oldName === t;

                  if (isEditing) {
                    return (
                      <div
                        key={t}
                        className="flex items-center gap-1.5 p-2 rounded-xl bg-amber-500/20 border border-amber-400 shadow-sm"
                      >
                        <input
                          type="text"
                          value={editingTag.newName}
                          onChange={(e) =>
                            setEditingTag({ ...editingTag, newName: e.target.value })
                          }
                          onKeyDown={(e) => e.key === 'Enter' && handleSaveRename()}
                          autoFocus
                          className="flex-1 bg-black/80 px-2 py-1 rounded text-xs text-white focus:outline-none border border-amber-400"
                        />
                        <button
                          onClick={handleSaveRename}
                          disabled={loading}
                          className="p-1 rounded bg-amber-400 text-black hover:bg-amber-300"
                          title="Lưu tên mới"
                        >
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </button>
                        <button
                          onClick={() => setEditingTag(null)}
                          className="p-1 rounded bg-white/10 text-white hover:bg-white/20"
                          title="Hủy"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={t}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/5 hover:border-white/15 transition-all group"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Tag className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span className="font-bold text-white truncate text-xs">{t}</span>
                        <span className="text-[10px] text-ice-muted font-mono shrink-0">
                          ({count})
                        </span>
                      </div>

                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={() => setEditingTag({ oldName: t, newName: t })}
                          className="p-1 rounded text-ice-muted hover:text-amber-400 hover:bg-white/10 transition-colors"
                          title="Đổi tên thể loại này"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteTag(t)}
                          className="p-1 rounded text-ice-muted hover:text-rose-400 hover:bg-white/10 transition-colors"
                          title="Xóa thể loại này"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'batch' && (
            <div className="space-y-4">
              {batchSuccessMsg && (
                <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 flex items-center gap-2 animate-fade-in">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>{batchSuccessMsg}</span>
                </div>
              )}

              {/* Sub-section 1: Choose Tags to Add and Remove */}
              <div className="p-4 rounded-xl bg-black/40 border border-ice-border/60 space-y-3">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  1. Chọn thể loại cần Thêm hoặc Gỡ:
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Add Tag list */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] text-emerald-400 font-semibold block">
                      + Thể loại muốn GÁN THÊM:
                    </span>
                    <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-1.5 bg-black/60 rounded-lg border border-white/5">
                      {tags.map((t) => {
                        const isAdded = batchTagsToAdd.includes(t);
                        return (
                          <button
                            key={t}
                            type="button"
                            onClick={() => {
                              setBatchTagsToAdd((prev) =>
                                isAdded ? prev.filter((i) => i !== t) : [...prev, t]
                              );
                              setBatchTagsToRemove((prev) => prev.filter((i) => i !== t));
                            }}
                            className={`px-2 py-1 rounded text-[10px] font-semibold transition-all border ${
                              isAdded
                                ? 'bg-emerald-500 text-black font-bold border-emerald-400 shadow-sm'
                                : 'bg-white/5 text-ice-muted border-white/10 hover:text-white'
                            }`}
                          >
                            + {t}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Remove Tag list */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] text-rose-400 font-semibold block">
                      - Thể loại muốn GỠ BỎ:
                    </span>
                    <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-1.5 bg-black/60 rounded-lg border border-white/5">
                      {tags.map((t) => {
                        const isRemoved = batchTagsToRemove.includes(t);
                        return (
                          <button
                            key={t}
                            type="button"
                            onClick={() => {
                              setBatchTagsToRemove((prev) =>
                                isRemoved ? prev.filter((i) => i !== t) : [...prev, t]
                              );
                              setBatchTagsToAdd((prev) => prev.filter((i) => i !== t));
                            }}
                            className={`px-2 py-1 rounded text-[10px] font-semibold transition-all border ${
                              isRemoved
                                ? 'bg-rose-500 text-white font-bold border-rose-400 shadow-sm'
                                : 'bg-white/5 text-ice-muted border-white/10 hover:text-white'
                            }`}
                          >
                            - {t}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Sub-section 2: Item Checkboxes */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSelectAllFiltered}
                      className="flex items-center gap-1.5 text-xs font-semibold text-amber-400 hover:underline"
                    >
                      <CheckSquare className="w-3.5 h-3.5" />
                      <span>Chọn tất cả ({filteredItems.length})</span>
                    </button>
                    <span className="text-ice-muted">|</span>
                    <span className="text-white font-mono">
                      Đã chọn: {selectedItemIds.length} mục
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 bg-black/40 border border-ice-border/60 rounded-lg px-2.5 py-1">
                    <Search className="w-3 h-3 text-ice-muted" />
                    <input
                      type="text"
                      value={searchItem}
                      onChange={(e) => setSearchItem(e.target.value)}
                      placeholder="Tìm tên game / phim..."
                      className="bg-transparent text-xs text-white placeholder-ice-muted focus:outline-none w-36"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-56 overflow-y-auto pr-1">
                  {filteredItems.map((item) => {
                    const isSelected = selectedItemIds.includes(item.id);
                    const title = 'title' in item ? (item as MediaItem).title : (item as Game).name;
                    const itemTags = item.tags || [];

                    return (
                      <div
                        key={item.id}
                        onClick={() => handleToggleSelectItem(item.id)}
                        className={`p-2.5 rounded-xl border flex items-center gap-2.5 cursor-pointer transition-all select-none ${
                          isSelected
                            ? 'bg-amber-500/20 border-amber-400 text-white shadow-md'
                            : 'bg-white/5 border-white/5 text-ice-muted hover:border-white/15 hover:text-white'
                        }`}
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-amber-400 shrink-0" />
                        ) : (
                          <Square className="w-4 h-4 text-ice-muted shrink-0" />
                        )}
                        <div className="min-w-0 flex-1">
                          <h5 className="font-bold text-xs truncate text-white">{title}</h5>
                          <p className="text-[10px] text-ice-muted truncate mt-0.5">
                            {itemTags.length > 0 ? itemTags.join(', ') : 'Chưa gắn tag'}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Batch Action Submit Button */}
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleApplyBatch}
                  disabled={
                    loading ||
                    selectedItemIds.length === 0 ||
                    (batchTagsToAdd.length === 0 && batchTagsToRemove.length === 0)
                  }
                  className="px-6 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 disabled:opacity-40 text-black font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-amber-400/20 transition-all active:scale-95"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Áp Dụng Cho {selectedItemIds.length} Mục Đã Chọn</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
