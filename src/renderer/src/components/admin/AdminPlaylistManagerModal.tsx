import React, { useState } from 'react';
import {
  X,
  Plus,
  Edit3,
  Trash2,
  Film,
  Music,
  Radio,
  ListMusic,
  Eye,
  Sparkles,
  Cloud,
  CheckCircle2
} from 'lucide-react';
import type { MediaItem, MediaPlaylist, MediaSubType } from '../../types';
import { PlaylistFormModal } from '../media/PlaylistFormModal';
import { sfx } from '../../utils/sfx';

interface AdminPlaylistManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  playlists: MediaPlaylist[];
  allMedia: MediaItem[];
  defaultTab?: 'video' | 'music' | 'podcast';
  onSavePlaylist: (playlist: Partial<MediaPlaylist>) => Promise<void> | void;
  onDeletePlaylist: (id: string) => Promise<void> | void;
}

export const AdminPlaylistManagerModal: React.FC<AdminPlaylistManagerModalProps> = ({
  isOpen,
  onClose,
  playlists,
  allMedia,
  defaultTab = 'video',
  onSavePlaylist,
  onDeletePlaylist,
}) => {
  const [activeTab, setActiveTab] = useState<'video' | 'music' | 'podcast'>(defaultTab);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingPlaylist, setEditingPlaylist] = useState<MediaPlaylist | null>(null);
  const [previewPlaylist, setPreviewPlaylist] = useState<MediaPlaylist | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  // Filter playlists strictly for current category
  const filteredPlaylists = playlists.filter((p) => {
    if (activeTab === 'video') {
      return p.type === 'video' && (!p.subType || p.subType === 'movie');
    }
    if (activeTab === 'music') {
      return p.type === 'audio' && (!p.subType || p.subType === 'music');
    }
    if (activeTab === 'podcast') {
      return p.type === 'audio' && p.subType === 'podcast';
    }
    return false;
  });

  const showStatus = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleCreateNew = () => {
    sfx.playClick();
    setEditingPlaylist(null);
    setIsFormModalOpen(true);
  };

  const handleEdit = (playlist: MediaPlaylist) => {
    sfx.playClick();
    setEditingPlaylist(playlist);
    setIsFormModalOpen(true);
  };

  const handleDelete = async (target: MediaPlaylist | string) => {
    sfx.playClick();
    const playlist = typeof target === 'string' ? playlists.find((p) => p.id === target) : target;
    const playlistId = typeof target === 'string' ? target : target.id;
    const playlistName = playlist ? playlist.name : 'này';

    if (window.confirm(`Bạn có chắc chắn muốn xóa danh sách phát "${playlistName}" không? Thao tác này sẽ cập nhật trực tiếp lên Supabase Cloud.`)) {
      await onDeletePlaylist(playlistId);
      showStatus(`Đã xóa danh sách "${playlistName}" thành công!`);
      if (previewPlaylist?.id === playlistId) {
        setPreviewPlaylist(null);
      }
    }
  };

  const handleSave = async (playlistData: Partial<MediaPlaylist>) => {
    await onSavePlaylist({
      ...playlistData,
      type: activeTab === 'video' ? 'video' : 'audio',
      subType: activeTab === 'video' ? 'movie' : activeTab === 'music' ? 'music' : 'podcast',
    });
    setIsFormModalOpen(false);
    setEditingPlaylist(null);
    showStatus('Đã lưu danh sách phát và đồng bộ lên Cloud thành công!');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 select-none animate-fade-in">
      <div className="bg-[#10131B] border border-white/10 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400">
              <ListMusic className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-white tracking-wide">
                  Quản Lý Danh Sách Phát Admin
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-[10px] font-bold border border-amber-400/30 flex items-center gap-1">
                  <Cloud className="w-3 h-3" />
                  Cloud Sync
                </span>
              </div>
              <p className="text-xs text-ice-subtext mt-0.5">
                Quản lý các tuyển tập phát chung cho Phim, Nhạc và Audio (đồng bộ dữ liệu thực tế lên đám mây)
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Toast */}
        {statusMessage && (
          <div className="px-6 py-2.5 bg-emerald-500/20 border-b border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}

        {/* Category Sub-Tabs & Action Bar */}
        <div className="px-6 py-4 border-b border-white/5 flex flex-wrap items-center justify-between gap-3 bg-black/20">
          <div className="flex items-center gap-2 bg-[#161A26] p-1 rounded-2xl border border-white/10">
            <button
              type="button"
              onClick={() => {
                sfx.playClick();
                setActiveTab('video');
                setPreviewPlaylist(null);
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'video'
                  ? 'bg-amber-400 text-black shadow-lg shadow-amber-400/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Film className="w-3.5 h-3.5" />
              <span>Phim Tuyển Tập</span>
            </button>

            <button
              type="button"
              onClick={() => {
                sfx.playClick();
                setActiveTab('music');
                setPreviewPlaylist(null);
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'music'
                  ? 'bg-amber-400 text-black shadow-lg shadow-amber-400/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Music className="w-3.5 h-3.5" />
              <span>Album Âm Nhạc</span>
            </button>

            <button
              type="button"
              onClick={() => {
                sfx.playClick();
                setActiveTab('podcast');
                setPreviewPlaylist(null);
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'podcast'
                  ? 'bg-amber-400 text-black shadow-lg shadow-amber-400/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              <span>Podcast & Audio</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleCreateNew}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-bold text-xs shadow-lg shadow-amber-400/20 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo Playlist Mới</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
          {filteredPlaylists.length === 0 ? (
            <div className="py-16 text-center space-y-3 bg-white/[0.02] rounded-3xl border border-dashed border-white/10">
              <ListMusic className="w-12 h-12 text-slate-600 mx-auto" />
              <p className="text-sm font-semibold text-slate-400">
                Chưa có danh sách phát nào trong danh mục{' '}
                <span className="text-amber-400">
                  {activeTab === 'video' ? 'Phim & Video' : activeTab === 'music' ? 'Âm Nhạc' : 'Podcast & Audio'}
                </span>
              </p>
              <button
                type="button"
                onClick={handleCreateNew}
                className="text-xs text-amber-400 font-bold hover:underline"
              >
                + Bấm vào đây để tạo danh sách phát đầu tiên
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredPlaylists.map((pl) => {
                const cover = pl.coverPath
                  ? pl.coverPath.startsWith('http')
                    ? pl.coverPath
                    : `file://${pl.coverPath}`
                  : '';
                const is169 = pl.coverAspectRatio === '16:9';

                return (
                  <div
                    key={pl.id}
                    className="p-4 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 hover:border-amber-400/40 transition-all flex flex-col justify-between space-y-3"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`overflow-hidden bg-black/60 rounded-xl border border-white/10 shrink-0 flex items-center justify-center ${
                          is169 ? 'w-24 aspect-video' : 'w-16 h-16'
                        }`}
                      >
                        {cover ? (
                          <img src={cover} alt={pl.name} className="w-full h-full object-cover" />
                        ) : (
                          <ListMusic className="w-6 h-6 text-amber-400" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded bg-white/10 text-white/70 text-[10px] font-mono">
                            {pl.itemIds.length} mục
                          </span>
                        </div>
                        <h3 className="text-sm font-bold text-white truncate mt-1">
                          {pl.name}
                        </h3>
                        {pl.description && (
                          <p className="text-xs text-slate-400 line-clamp-2 mt-0.5">
                            {pl.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => {
                          sfx.playClick();
                          setPreviewPlaylist(previewPlaylist?.id === pl.id ? null : pl);
                        }}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                          previewPlaylist?.id === pl.id
                            ? 'bg-amber-400/20 text-amber-300'
                            : 'bg-white/5 hover:bg-white/10 text-slate-300'
                        }`}
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>{previewPlaylist?.id === pl.id ? 'Ẩn Mục' : 'Xem Các Mục'}</span>
                      </button>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleEdit(pl)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-400/10 hover:bg-amber-400/20 text-amber-400 text-xs font-semibold transition-colors"
                          title="Sửa tiêu đề, ảnh bìa và sắp xếp thứ tự"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Sửa & Sắp Xếp</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(pl)}
                          className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors"
                          title="Xóa danh sách phát này"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Preview Drawer */}
                    {previewPlaylist?.id === pl.id && (
                      <div className="pt-2 border-t border-white/5 space-y-1 animate-fade-in max-h-40 overflow-y-auto custom-scrollbar">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                          Thứ tự phát hiện tại:
                        </span>
                        {pl.itemIds.length === 0 ? (
                          <p className="text-xs text-slate-500 italic">Danh sách chưa có mục nào</p>
                        ) : (
                          pl.itemIds.map((itemId, idx) => {
                            const item = allMedia.find((m) => m.id === itemId);
                            return (
                              <div
                                key={itemId}
                                className="flex items-center gap-2 text-xs py-1 px-2 rounded bg-white/[0.02]"
                              >
                                <span className="font-mono text-slate-500 w-5">#{idx + 1}</span>
                                <span className="text-white truncate flex-1">
                                  {item?.title || 'Mục không xác định'}
                                </span>
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Playlist Edit / Create Modal with full reordering tools */}
      {isFormModalOpen && (
        <PlaylistFormModal
          isOpen={isFormModalOpen}
          playlist={editingPlaylist}
          allMedia={allMedia}
          defaultType={activeTab === 'video' ? 'video' : 'audio'}
          defaultSubType={activeTab === 'video' ? 'movie' : activeTab === 'music' ? 'music' : 'podcast'}
          onClose={() => {
            setIsFormModalOpen(false);
            setEditingPlaylist(null);
          }}
          onSave={handleSave}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
};
