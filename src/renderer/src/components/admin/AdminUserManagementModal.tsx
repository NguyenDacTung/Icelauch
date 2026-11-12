import React, { useState } from 'react';
import {
  X,
  Users,
  Search,
  ShieldAlert,
  Ban,
  CheckCircle,
  KeyRound,
  Trash2,
  Edit2,
  Clock,
  AlertCircle
} from 'lucide-react';
import type { UserProfile } from '../../types';
import { AvatarBadge } from '../common/AvatarBadge';

interface AdminUserManagementModalProps {
  isOpen: boolean;
  profiles: UserProfile[];
  onClose: () => void;
  onEditProfile: (profile: UserProfile) => void;
  onDeleteProfile: (id: string) => Promise<void>;
  onBanProfile: (id: string, bannedUntil: string | null, reason?: string) => Promise<void>;
}

export const AdminUserManagementModal: React.FC<AdminUserManagementModalProps> = ({
  isOpen,
  profiles,
  onClose,
  onEditProfile,
  onDeleteProfile,
  onBanProfile,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'active' | 'banned'>('all');

  // Ban Dialog State
  const [targetBanProfile, setTargetBanProfile] = useState<UserProfile | null>(null);
  const [banDuration, setBanDuration] = useState<'1h' | '1d' | '7d' | '30d' | 'permanent'>('1d');
  const [banReason, setBanReason] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const filteredProfiles = profiles.filter((p) => {
    const isMasterAdmin = p.role === 'admin' || (p.pinHash && !p.passwordHash);
    const matchesSearch =
      (p.nickname || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.username || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.friendCode || '').toLowerCase().includes(searchTerm.toLowerCase());

    const isBanned = Boolean(p.bannedUntil && new Date(p.bannedUntil) > new Date());

    if (!matchesSearch) return false;
    if (filterMode === 'active') return !isBanned;
    if (filterMode === 'banned') return isBanned;
    return true;
  });

  const handleExecuteBan = async () => {
    if (!targetBanProfile) return;
    setLoading(true);
    try {
      let banDateStr: string | null = null;
      const now = new Date();
      if (banDuration === '1h') {
        banDateStr = new Date(now.getTime() + 60 * 60 * 1000).toISOString();
      } else if (banDuration === '1d') {
        banDateStr = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
      } else if (banDuration === '7d') {
        banDateStr = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
      } else if (banDuration === '30d') {
        banDateStr = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
      } else if (banDuration === 'permanent') {
        banDateStr = new Date(now.getTime() + 100 * 365 * 24 * 60 * 60 * 1000).toISOString();
      }

      await onBanProfile(targetBanProfile.id, banDateStr, banReason.trim() || 'Vi phạm điều khoản cộng đồng');
      setTargetBanProfile(null);
      setBanReason('');
    } catch (e) {
      console.error('Lỗi khi cấm tài khoản:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleUnban = async (p: UserProfile) => {
    setLoading(true);
    try {
      await onBanProfile(p.id, null, '');
    } catch (e) {
      console.error('Lỗi khi gỡ cấm:', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-ice-surface/95 border border-ice-border rounded-2xl flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-black/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                Quản Trị Người Dùng & Tài Khoản
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  {profiles.length} Tài khoản
                </span>
              </h2>
              <p className="text-xs text-ice-muted">
                Tìm kiếm, phân quyền, sửa thông tin, đặt lại mật khẩu và cấm tài khoản vi phạm.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-ice-muted hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar: Search & Filter */}
        <div className="p-4 border-b border-white/5 bg-black/20 flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-ice-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo tên hiển thị, username hoặc mã bạn bè..."
              className="w-full h-9 pl-9 pr-3 rounded-xl bg-black/40 border border-ice-border text-xs text-white placeholder-ice-muted focus:outline-none focus:border-amber-400 transition-colors"
            />
          </div>

          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-black/40 border border-ice-border">
            <button
              type="button"
              onClick={() => setFilterMode('all')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                filterMode === 'all' ? 'bg-amber-400 text-black shadow' : 'text-ice-muted hover:text-white'
              }`}
            >
              Tất Cả ({profiles.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('active')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                filterMode === 'active' ? 'bg-amber-400 text-black shadow' : 'text-ice-muted hover:text-white'
              }`}
            >
              Đang Hoạt Động
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('banned')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                filterMode === 'banned' ? 'bg-red-500 text-white shadow' : 'text-ice-muted hover:text-white'
              }`}
            >
              Bị Cấm
            </button>
          </div>
        </div>

        {/* Table Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 custom-scrollbar">
          {filteredProfiles.length === 0 ? (
            <div className="py-12 text-center text-ice-muted text-xs">
              Không tìm thấy tài khoản người dùng nào phù hợp.
            </div>
          ) : (
            filteredProfiles.map((p) => {
              const isMasterAdmin = p.role === 'admin' || (p.pinHash && !p.passwordHash);
              const isBanned = Boolean(p.bannedUntil && new Date(p.bannedUntil) > new Date());

              return (
                <div
                  key={p.id}
                  className={`p-3.5 rounded-xl border transition-all flex flex-wrap items-center justify-between gap-3 ${
                    isBanned
                      ? 'bg-red-950/20 border-red-500/30'
                      : isMasterAdmin
                      ? 'bg-amber-500/5 border-amber-500/30'
                      : 'bg-black/30 border-ice-border hover:border-white/20'
                  }`}
                >
                  {/* Left: Avatar & Info */}
                  <div className="flex items-center gap-3">
                    <AvatarBadge avatar={p.avatar} size="md" className="border border-white/20" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-white">{p.nickname}</span>
                        {isMasterAdmin ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-400 text-black shadow">
                            🛡️ MASTER ADMIN
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/10 text-ice-muted">
                            👤 Client User
                          </span>
                        )}
                        {isBanned && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                            🚫 Bị Cấm Đến {new Date(p.bannedUntil!).toLocaleDateString('vi-VN')}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-ice-muted mt-0.5">
                        {p.username && <span>Tài khoản: <strong className="text-white">@{p.username}</strong></span>}
                        {p.friendCode && <span>Mã bạn bè: <strong className="text-amber-400 font-mono">{p.friendCode}</strong></span>}
                        <span>• Thư viện: {p.library?.length || 0} Game, {Object.keys(p.watchProgress || {}).length} Phim</span>
                        {p.banReason && isBanned && (
                          <span className="text-red-300">Lý do: "{p.banReason}"</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onEditProfile(p)}
                      className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-bold text-white flex items-center gap-1 transition-all"
                      title="Sửa thông tin hoặc đổi mật khẩu"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-ice-accent" />
                      <span>Sửa</span>
                    </button>

                    {!isMasterAdmin && (
                      <>
                        {isBanned ? (
                          <button
                            type="button"
                            onClick={() => handleUnban(p)}
                            disabled={loading}
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 text-xs font-bold flex items-center gap-1 transition-all"
                            title="Gỡ cấm cho người dùng"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>Gỡ Cấm</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setTargetBanProfile(p);
                              setBanDuration('1d');
                              setBanReason('');
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-bold flex items-center gap-1 transition-all"
                            title="Cấm tài khoản trong khoảng thời gian"
                          >
                            <Ban className="w-3.5 h-3.5" />
                            <span>Cấm</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Bạn có chắc chắn muốn xóa vĩnh viễn tài khoản "${p.nickname}"?`)) {
                              onDeleteProfile(p.id);
                            }
                          }}
                          className="p-1.5 rounded-lg text-ice-muted hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          title="Xóa tài khoản vĩnh viễn"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-black/40 flex items-center justify-between text-xs text-ice-muted">
          <span>💡 Tài khoản Master Admin được bảo vệ an toàn, không thể bị xóa hoặc cấm.</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold transition-all"
          >
            Đóng
          </button>
        </div>

        {/* Ban Duration Popup Submodal */}
        {targetBanProfile && (
          <div className="absolute inset-0 z-20 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-ice-bg border border-red-500/40 rounded-2xl p-5 shadow-2xl space-y-4 animate-scale-up">
              <div className="flex items-center gap-2 text-red-400">
                <ShieldAlert className="w-5 h-5" />
                <h3 className="font-bold text-sm text-white">
                  Cấm Tài Khoản: {targetBanProfile.nickname}
                </h3>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-ice-muted">Thời hạn cấm:</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['1h', '1d', '7d', '30d', 'permanent'] as const).map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setBanDuration(d)}
                      className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition-all ${
                        banDuration === d
                          ? 'bg-red-500 text-white border-red-500 shadow-md'
                          : 'bg-black/30 text-ice-muted border-ice-border hover:text-white'
                      }`}
                    >
                      {d === '1h' && '1 Giờ'}
                      {d === '1d' && '1 Ngày'}
                      {d === '7d' && '7 Ngày'}
                      {d === '30d' && '30 Ngày'}
                      {d === 'permanent' && 'Vĩnh Viễn'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-ice-muted">Lý do cấm (hiển thị khi đăng nhập):</label>
                <textarea
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  placeholder="Ví dụ: Vi phạm quy định sử dụng, chia sẻ liên kết độc hại..."
                  rows={3}
                  className="w-full p-2.5 rounded-xl bg-black/40 border border-ice-border text-xs text-white placeholder-ice-muted focus:outline-none focus:border-red-400 resize-none font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setTargetBanProfile(null)}
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition-all"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="button"
                  onClick={handleExecuteBan}
                  disabled={loading}
                  className="px-4 py-1.5 rounded-xl bg-red-500 hover:bg-red-600 text-xs font-bold text-white shadow-lg transition-all"
                >
                  {loading ? 'Đang Xử Lý...' : 'Xác Nhận Cấm'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
