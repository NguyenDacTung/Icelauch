import React, { useState } from 'react';
import { X, Plus, Check, ListMusic, ListPlus } from 'lucide-react';
import type { MediaItem, MediaPlaylist } from '../../types';
import { sfx } from '../../utils/sfx';

interface AddToPlaylistModalProps {
  media: MediaItem | null;
  isOpen: boolean;
  onClose: () => void;
  userPlaylists: MediaPlaylist[];
  onToggleItemInPlaylist: (playlistId: string, mediaId: string) => Promise<void>;
  onCreatePlaylist: (name: string, type: 'video' | 'audio', initialMediaId?: string) => Promise<void>;
}

export const AddToPlaylistModal: React.FC<AddToPlaylistModalProps> = ({
  media,
  isOpen,
  onClose,
  userPlaylists,
  onToggleItemInPlaylist,
  onCreatePlaylist,
}) => {
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  if (!isOpen || !media) return null;

  const compatiblePlaylists = userPlaylists.filter((pl) => pl.type === media.type);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) return;
    sfx.playClick();
    setIsCreating(true);
    try {
      await onCreatePlaylist(newPlaylistName.trim(), media.type, media.id);
      setNewPlaylistName('');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 select-none">
      <div className="bg-[#121620] border border-white/10 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl flex flex-col max-h-[85vh] animate-fade-in">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-white/10 flex items-center justify-between bg-white/[0.03]">
          <div className="flex items-center gap-2">
            <ListMusic className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-bold text-white tracking-wide uppercase">
              Thêm vào Danh Sách Phát
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Media Snippet */}
        <div className="p-3.5 border-b border-white/5 bg-black/20 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg overflow-hidden bg-white/5 shrink-0 border border-white/10 flex items-center justify-center">
            {media.coverPath ? (
              <img
                src={media.coverPath.startsWith('http') ? media.coverPath : `file://${media.coverPath}`}
                alt={media.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <ListMusic className="w-5 h-5 text-amber-400" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-bold text-white truncate">{media.title}</h4>
            <p className="text-[10px] text-slate-400 truncate mt-0.5">
              {media.artist || (media.type === 'video' ? 'Phim & Video' : 'Âm nhạc')}
            </p>
          </div>
        </div>

        {/* Playlists List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 max-h-60 scrollbar-thin">
          {compatiblePlaylists.length === 0 ? (
            <div className="py-6 text-center text-slate-500 text-xs">
              Bạn chưa có danh sách phát {media.type === 'video' ? 'video' : 'nhạc'} nào.
              <br />
              Hãy nhập tên bên dưới để tạo ngay!
            </div>
          ) : (
            compatiblePlaylists.map((pl) => {
              const isIncluded = pl.itemIds.includes(media.id);
              return (
                <div
                  key={pl.id}
                  onClick={() => {
                    sfx.playClick();
                    onToggleItemInPlaylist(pl.id, media.id);
                  }}
                  className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all ${
                    isIncluded
                      ? 'bg-amber-400/15 border-amber-400/40 text-amber-300'
                      : 'bg-white/[0.03] border-white/5 text-slate-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-xs font-semibold truncate">{pl.name}</span>
                    <span className="text-[10px] text-slate-500 font-mono">({pl.itemIds.length})</span>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors ${
                      isIncluded
                        ? 'bg-amber-400 border-amber-400 text-black'
                        : 'border-white/20 bg-black/40'
                    }`}
                  >
                    {isIncluded && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Inline Create New Playlist */}
        <form onSubmit={handleCreate} className="p-3.5 border-t border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              placeholder="Tạo danh sách mới..."
              className="flex-1 bg-black/50 border border-white/15 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
            />
            <button
              type="submit"
              disabled={!newPlaylistName.trim() || isCreating}
              className="px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 disabled:opacity-40 text-black text-xs font-bold flex items-center gap-1 shadow-sm transition-all shrink-0"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>Tạo</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
