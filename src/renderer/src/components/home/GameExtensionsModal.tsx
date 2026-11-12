import React, { useState } from 'react';
import {
  X,
  Plus,
  Trash2,
  Edit2,
  ExternalLink,
  Download,
  Sparkles,
  Puzzle,
  CheckCircle2,
  AlertCircle,
  FileCode,
  ShieldCheck,
  Globe,
} from 'lucide-react';
import type { Game, GameExtension } from '../../types';
import { sfx } from '../../utils/sfx';

interface GameExtensionsModalProps {
  isOpen: boolean;
  game: Game;
  isAdmin: boolean;
  onClose: () => void;
  onSaveExtensions?: (gameId: string, extensions: GameExtension[]) => Promise<void>;
}

export const GameExtensionsModal: React.FC<GameExtensionsModalProps> = ({
  isOpen,
  game,
  isAdmin,
  onClose,
  onSaveExtensions,
}) => {
  const [extensions, setExtensions] = useState<GameExtension[]>(game.extensions || []);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form states
  const [extName, setExtName] = useState('');
  const [extCategory, setExtCategory] = useState<'viethoa' | 'dlc' | 'update' | 'mod' | 'other'>('viethoa');
  const [extDesc, setExtDesc] = useState('');
  const [extLinks, setExtLinks] = useState('');
  const [extVersion, setExtVersion] = useState('');

  if (!isOpen) return null;

  const handleOpenAdd = () => {
    sfx.playClick();
    setExtName('');
    setExtCategory('viethoa');
    setExtDesc('');
    setExtLinks('');
    setExtVersion('');
    setEditingId(null);
    setIsAdding(true);
  };

  const handleOpenEdit = (ext: GameExtension) => {
    sfx.playClick();
    setExtName(ext.name);
    setExtCategory(ext.category);
    setExtDesc(ext.description || '');
    setExtLinks(ext.links.join('\n'));
    setExtVersion(ext.version || '');
    setEditingId(ext.id);
    setIsAdding(true);
  };

  const handleDelete = async (extId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa gói mở rộng này?')) return;
    sfx.playClick();
    const updated = extensions.filter((e) => e.id !== extId);
    setExtensions(updated);
    if (onSaveExtensions) {
      await onSaveExtensions(game.id, updated);
    }
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!extName.trim()) return;

    sfx.playSuccess();
    const linksArray = extLinks
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);

    let updated: GameExtension[];
    if (editingId) {
      updated = extensions.map((e) =>
        e.id === editingId
          ? {
              ...e,
              name: extName.trim(),
              category: extCategory,
              description: extDesc.trim() || undefined,
              links: linksArray.length > 0 ? linksArray : ['#'],
              version: extVersion.trim() || undefined,
            }
          : e
      );
    } else {
      const newExt: GameExtension = {
        id: `ext-${Date.now()}`,
        name: extName.trim(),
        category: extCategory,
        description: extDesc.trim() || undefined,
        links: linksArray.length > 0 ? linksArray : ['#'],
        version: extVersion.trim() || undefined,
        createdAt: new Date().toISOString(),
      };
      updated = [newExt, ...extensions];
    }

    setExtensions(updated);
    setIsAdding(false);
    if (onSaveExtensions) {
      await onSaveExtensions(game.id, updated);
    }
  };

  const getBadgeStyle = (category: string) => {
    switch (category) {
      case 'viethoa':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'dlc':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
      case 'update':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'mod':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
      default:
        return 'bg-slate-500/20 text-slate-300 border-slate-500/40';
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'viethoa':
        return '🇻🇳 Việt Hóa';
      case 'dlc':
        return '📦 Bản Mở Rộng (DLC)';
      case 'update':
        return '⚡ Bản Cập Nhật Patch';
      case 'mod':
        return '🛠️ Mod Tùy Biến';
      default:
        return '🧩 Gói Khác';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 select-none animate-fade-in">
      <div className="w-full max-w-2xl bg-[#0F1420] border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-[#151B2B]/60">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
              <Puzzle className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white truncate">Gói Mở Rộng & Việt Hóa</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shrink-0">
                  {extensions.length} gói
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate">{game.name}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAdmin && !isAdding && (
              <button
                type="button"
                onClick={handleOpenAdd}
                className="px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 font-bold text-xs border border-cyan-500/40 flex items-center gap-1.5 transition-all active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Thêm Mới</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-5 overflow-y-auto no-scrollbar space-y-4">
          {/* Admin Add/Edit Form */}
          {isAdding && (
            <form onSubmit={handleSaveForm} className="p-4 rounded-2xl bg-black/40 border border-cyan-500/30 space-y-3 animate-fade-in">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-cyan-300 uppercase tracking-wide flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  {editingId ? 'Chỉnh Sửa Gói Mở Rộng' : 'Thêm Gói Mở Rộng Mới'}
                </span>
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Hủy
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-[11px] font-semibold text-slate-300">Tên gói mở rộng *</label>
                  <input
                    type="text"
                    required
                    value={extName}
                    onChange={(e) => setExtName(e.target.value)}
                    placeholder="Ví dụ: Bản Việt Hóa Full (The Red Team)"
                    className="w-full px-3 py-2 rounded-xl bg-[#171D2A] border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-300">Loại mở rộng</label>
                  <select
                    value={extCategory}
                    onChange={(e) => setExtCategory(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-[#171D2A] border border-white/10 text-xs text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="viethoa">Việt Hóa</option>
                    <option value="dlc">Bản Mở Rộng DLC</option>
                    <option value="update">Bản Cập Nhật Patch</option>
                    <option value="mod">Mod Tùy Biến</option>
                    <option value="other">Khác</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-[11px] font-semibold text-slate-300">
                    Danh sách link tải (Mỗi dòng 1 link: dòng 1 là link chính, các dòng sau là dự phòng)
                  </label>
                  <textarea
                    rows={3}
                    value={extLinks}
                    onChange={(e) => setExtLinks(e.target.value)}
                    placeholder="https://drive.google.com/...\nhttps://mega.nz/..."
                    className="w-full px-3 py-2 rounded-xl bg-[#171D2A] border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-300">Phiên bản / Ghi chú</label>
                  <input
                    type="text"
                    value={extVersion}
                    onChange={(e) => setExtVersion(e.target.value)}
                    placeholder="v1.2 hoặc Build 2026"
                    className="w-full px-3 py-2 rounded-xl bg-[#171D2A] border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-300">Mô tả / Hướng dẫn cài đặt</label>
                <textarea
                  rows={2}
                  value={extDesc}
                  onChange={(e) => setExtDesc(e.target.value)}
                  placeholder="Ví dụ: Tải về giải nén và chép đè thư mục vào đường dẫn cài đặt game..."
                  className="w-full px-3 py-2 rounded-xl bg-[#171D2A] border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs shadow-md shadow-cyan-500/25"
                >
                  {editingId ? 'Lưu Thay Đổi' : 'Thêm Gói Mở Rộng'}
                </button>
              </div>
            </form>
          )}

          {/* List of Extensions */}
          {extensions.length === 0 && !isAdding ? (
            <div className="py-12 flex flex-col items-center justify-center text-center text-slate-400 space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-500">
                <Puzzle className="w-7 h-7" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">Chưa Có Gói Mở Rộng Nào</p>
                <p className="text-xs text-slate-500 mt-1">
                  {isAdmin
                    ? 'Bấm nút "Thêm Mới" ở góc trên để thêm bản Việt Hóa, DLC hoặc Patch Update.'
                    : 'Game hiện chưa có bản mở rộng nào từ người quản trị.'}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {extensions.map((ext, idx) => (
                <div
                  key={ext.id || idx}
                  className="p-4 rounded-2xl bg-[#141926] border border-white/10 hover:border-white/20 transition-all flex flex-col gap-3 shadow-lg"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${getBadgeStyle(ext.category)}`}>
                          {getCategoryLabel(ext.category)}
                        </span>
                        {ext.version && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/5 text-slate-300 border border-white/10">
                            {ext.version}
                          </span>
                        )}
                        <h4 className="text-sm font-bold text-white truncate">{ext.name}</h4>
                      </div>

                      {ext.description && (
                        <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line pt-0.5">
                          {ext.description}
                        </p>
                      )}
                    </div>

                    {isAdmin && (
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(ext)}
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white"
                          title="Sửa gói"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(ext.id)}
                          className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400"
                          title="Xóa gói"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Links / Download Mirrors */}
                  <div className="pt-2 border-t border-white/5 flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                      <Globe className="w-3 h-3 text-cyan-400" />
                      Nguồn tải ({ext.links?.length || 1} link):
                    </span>

                    <div className="flex items-center gap-2 flex-wrap">
                      {ext.links && ext.links.length > 0 ? (
                        ext.links.map((link, lIdx) => (
                          <button
                            key={lIdx}
                            type="button"
                            onClick={() => {
                              sfx.playClick();
                              window.open(link, '_blank');
                            }}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 ${
                              lIdx === 0
                                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-black shadow-md shadow-cyan-500/20'
                                : 'bg-white/10 hover:bg-white/20 text-white border border-white/10'
                            }`}
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>{lIdx === 0 ? 'Nguồn Chính' : `Dự Phòng ${lIdx}`}</span>
                            <ExternalLink className="w-3 h-3 opacity-60 ml-0.5" />
                          </button>
                        ))
                      ) : (
                        <span className="text-xs text-slate-500">Chưa có link tải</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

