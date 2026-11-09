import React, { useState, useEffect } from 'react';
import { 
  X, 
  Check, 
  Upload, 
  Link as LinkIcon, 
  Trash2, 
  ShieldCheck, 
  User, 
  KeyRound,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { AVATAR_PRESETS } from '../../utils/avatars';
import { AvatarBadge } from '../common/AvatarBadge';
import type { UserProfile } from '../../types';

interface ProfileModalProps {
  isOpen: boolean;
  profile?: UserProfile | null;
  onClose: () => void;
  onSave: (profileData: {
    id?: string;
    nickname: string;
    avatar: string;
    pin: string;
    remember: boolean;
  }) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  profile,
  onClose,
  onSave,
  onDelete,
}) => {
  const isEditing = Boolean(profile?.id);

  const [nickname, setNickname] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('avatar_cyber_ninja');
  const [customAvatarUrl, setCustomAvatarUrl] = useState('');
  const [avatarTab, setAvatarTab] = useState<'presets' | 'custom'>('presets');

  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [remember, setRemember] = useState(true);

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (profile) {
      setNickname(profile.nickname || '');
      setSelectedAvatar(profile.avatar || 'avatar_cyber_ninja');
      if (
        profile.avatar?.startsWith('http') ||
        profile.avatar?.startsWith('data:') ||
        profile.avatar?.includes('\\') ||
        profile.avatar?.includes('/')
      ) {
        setAvatarTab('custom');
        setCustomAvatarUrl(profile.avatar);
      } else {
        setAvatarTab('presets');
      }
      setPin('');
      setConfirmPin('');
    } else {
      setNickname('');
      setSelectedAvatar('avatar_cyber_ninja');
      setCustomAvatarUrl('');
      setAvatarTab('presets');
      setPin('');
      setConfirmPin('');
      setRemember(true);
    }
    setError(null);
  }, [profile, isOpen]);

  if (!isOpen) return null;

  const handleBrowseCustomAvatar = async () => {
    if (window.api?.browseFile) {
      const file = await window.api.browseFile({
        title: 'Chọn ảnh đại diện',
        filters: [{ name: 'Hình ảnh', extensions: ['png', 'jpg', 'jpeg', 'webp'] }],
      });
      if (file) {
        setCustomAvatarUrl(file);
        setSelectedAvatar(file);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedName = nickname.trim();
    if (!trimmedName || trimmedName.length < 2 || trimmedName.length > 20) {
      setError('Tên hiển thị phải có từ 2 đến 20 ký tự');
      return;
    }

    // PIN validation
    if (!isEditing || pin.length > 0) {
      if (pin.length < 4 || pin.length > 10) {
        setError('Mã PIN phải từ 4 đến 10 chữ số');
        return;
      }
      if (!/^\d+$/.test(pin)) {
        setError('Mã PIN chỉ được chứa các chữ số (0-9)');
        return;
      }
      if (pin !== confirmPin) {
        setError('Mã PIN xác nhận không trùng khớp');
        return;
      }
    }

    const effectiveAvatar = avatarTab === 'custom' && customAvatarUrl.trim()
      ? customAvatarUrl.trim()
      : selectedAvatar;

    try {
      setLoading(true);
      await onSave({
        id: profile?.id,
        nickname: trimmedName,
        avatar: effectiveAvatar,
        pin,
        remember,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Có lỗi xảy ra khi lưu hồ sơ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in select-none">
      <div className="bg-[#12141A] border border-ice-border rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-ice-border/60 flex items-center justify-between bg-[#161922]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-ice-accent/20 border border-ice-accent/40 flex items-center justify-center text-ice-accent">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-wide">
                {isEditing ? 'Chỉnh Sửa Hồ Sơ' : 'Tạo Hồ Sơ Người Dùng Mới'}
              </h3>
              <p className="text-xs text-ice-subtext">
                {isEditing ? 'Cập nhật tên, ảnh đại diện và mã PIN cá nhân' : 'Hồ sơ lưu trữ riêng kho game yêu thích và tiến độ xem phim'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-ice-subtext hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto scrollbar-thin flex-1">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Current Avatar Preview & Name Input */}
          <div className="flex items-center gap-5 p-4 rounded-xl bg-white/5 border border-white/5">
            <AvatarBadge
              avatar={avatarTab === 'custom' && customAvatarUrl ? customAvatarUrl : selectedAvatar}
              nickname={nickname || 'User'}
              size="lg"
            />
            <div className="flex-1 space-y-1.5">
              <label className="text-xs font-semibold text-ice-subtext uppercase tracking-wider">
                Tên hiển thị (Nickname) *
              </label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="VD: GamerPro, Ba Mẹ, Anh Hai..."
                maxLength={20}
                required
                className="w-full h-10 px-3 rounded-lg bg-black/40 border border-ice-border text-sm text-white placeholder-ice-subtext/60 focus:outline-none focus:border-ice-accent transition-colors font-medium"
              />
            </div>
          </div>

          {/* Avatar Chooser */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-ice-subtext uppercase tracking-wider">
                Chọn Ảnh Đại Diện (Avatar)
              </span>
              <div className="flex items-center gap-1 p-0.5 rounded-lg bg-black/40 border border-ice-border">
                <button
                  type="button"
                  onClick={() => setAvatarTab('presets')}
                  className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                    avatarTab === 'presets'
                      ? 'bg-ice-accent text-white shadow'
                      : 'text-ice-subtext hover:text-white'
                  }`}
                >
                  Kho 20 Mẫu Có Sẵn
                </button>
                <button
                  type="button"
                  onClick={() => setAvatarTab('custom')}
                  className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                    avatarTab === 'custom'
                      ? 'bg-ice-accent text-white shadow'
                      : 'text-ice-subtext hover:text-white'
                  }`}
                >
                  Ảnh Tùy Chỉnh
                </button>
              </div>
            </div>

            {avatarTab === 'presets' ? (
              <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 p-3 rounded-xl bg-black/30 border border-ice-border max-h-44 overflow-y-auto scrollbar-thin">
                {AVATAR_PRESETS.map((preset) => {
                  const isSelected = selectedAvatar === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setSelectedAvatar(preset.id)}
                      className={`relative aspect-square rounded-xl flex items-center justify-center p-1 border-2 transition-all group ${
                        isSelected
                          ? 'border-amber-400 scale-110 shadow-lg shadow-amber-500/20 z-10'
                          : 'border-transparent hover:border-white/30'
                      }`}
                      title={preset.name}
                    >
                      <AvatarBadge avatar={preset.id} size="sm" showBorder={false} />
                      {isSelected && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-400 text-black flex items-center justify-center">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-3 p-4 rounded-xl bg-black/30 border border-ice-border">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <LinkIcon className="w-3.5 h-3.5 text-ice-subtext absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={customAvatarUrl}
                      onChange={(e) => {
                        setCustomAvatarUrl(e.target.value);
                        setSelectedAvatar(e.target.value);
                      }}
                      placeholder="Dán đường dẫn ảnh URL (https://...)"
                      className="w-full h-9 pl-9 pr-3 rounded-lg bg-black/50 border border-ice-border text-xs text-white placeholder-ice-subtext focus:outline-none focus:border-ice-accent"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleBrowseCustomAvatar}
                    className="h-9 px-3.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors border border-white/10"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Duyệt Ảnh Máy Tính</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* PIN Setup (4-10 digits) */}
          <div className="space-y-3 p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
            <div className="flex items-center gap-2 text-amber-300 text-xs font-bold uppercase tracking-wider">
              <KeyRound className="w-4 h-4 text-amber-400" />
              <span>{isEditing ? 'Mã PIN Bảo Vệ (Để trống nếu không muốn đổi)' : 'Cài Đặt Mã PIN Bảo Vệ (4 - 10 Chữ Số) *'}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] text-ice-subtext font-medium">
                  {isEditing ? 'Mã PIN Mới' : 'Nhập mã PIN'}
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="Từ 4 đến 10 số"
                  required={!isEditing}
                  className="w-full h-10 px-3 rounded-lg bg-black/50 border border-ice-border text-sm text-white tracking-widest focus:outline-none focus:border-amber-400 font-mono transition-colors"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-ice-subtext font-medium">
                  Xác nhận mã PIN
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="Nhập lại mã PIN"
                  required={!isEditing || pin.length > 0}
                  className="w-full h-10 px-3 rounded-lg bg-black/50 border border-ice-border text-sm text-white tracking-widest focus:outline-none focus:border-amber-400 font-mono transition-colors"
                />
              </div>
            </div>

            <p className="text-[11px] text-ice-subtext">
              🔒 Mã PIN bảo vệ tính riêng tư của kho game và lịch sử xem video của bạn.
            </p>
          </div>

          {/* Remember / Auto-Login Checkbox */}
          <label className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 cursor-pointer hover:bg-white/10 transition-colors">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="w-4 h-4 rounded border-ice-border text-ice-accent focus:ring-0 focus:ring-offset-0 bg-black/40"
            />
            <div className="text-xs">
              <span className="font-bold text-white block">Ghi nhớ hồ sơ này trên thiết bị (Tự động đăng nhập)</span>
              <span className="text-ice-subtext text-[11px]">Lần mở app sau sẽ vào thẳng hồ sơ này mà không cần nhập lại mã PIN</span>
            </div>
          </label>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-ice-border/60 flex items-center justify-between bg-[#161922]">
          {isEditing && onDelete ? (
            <button
              type="button"
              onClick={async () => {
                if (window.confirm(`Bạn có chắc chắn muốn xoá hồ sơ "${profile?.nickname}" không?`)) {
                  await onDelete(profile!.id);
                  onClose();
                }
              }}
              className="px-3 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 text-xs font-bold border border-rose-500/30 flex items-center gap-1.5 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Xoá Hồ Sơ</span>
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors"
            >
              Huỷ
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-ice-accent to-blue-600 hover:from-ice-accentHover hover:to-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-950/40 flex items-center gap-1.5 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{isEditing ? 'Cập Nhật Hồ Sơ' : 'Hoàn Tất & Đăng Nhập'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

