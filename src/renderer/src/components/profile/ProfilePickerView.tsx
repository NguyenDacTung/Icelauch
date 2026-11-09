import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  User, 
  Settings2, 
  KeyRound, 
  X, 
  Check, 
  ShieldAlert, 
  ArrowRight,
  Sparkles,
  Lock,
  Delete
} from 'lucide-react';
import { AvatarBadge } from '../common/AvatarBadge';
import { ProfileModal } from './ProfileModal';
import type { UserProfile } from '../../types';

interface ProfilePickerViewProps {
  profiles: UserProfile[];
  onSelectProfile: (profile: UserProfile, remember: boolean) => Promise<{ success: boolean; error?: string }>;
  onSelectGuest: () => void;
  onSaveProfile: (data: {
    id?: string;
    nickname: string;
    avatar: string;
    pin: string;
    remember: boolean;
  }) => Promise<void>;
  onDeleteProfile: (id: string) => Promise<void>;
}

export const ProfilePickerView: React.FC<ProfilePickerViewProps> = ({
  profiles,
  onSelectProfile,
  onSelectGuest,
  onSaveProfile,
  onDeleteProfile,
}) => {
  const [isManaging, setIsManaging] = useState(false);
  const [editingProfile, setEditingProfile] = useState<UserProfile | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // PIN Prompt state for entering a selected profile
  const [promptProfile, setPromptProfile] = useState<UserProfile | null>(null);
  const [pinInput, setPinInput] = useState('');
  const [rememberLogin, setRememberLogin] = useState(true);
  const [pinError, setPinError] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle Physical Keyboard input when PIN prompt is active
  useEffect(() => {
    if (!promptProfile) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        if (pinInput.length < 10) {
          setPinInput((prev) => prev + e.key);
          setPinError(null);
        }
      } else if (e.key === 'Backspace') {
        setPinInput((prev) => prev.slice(0, -1));
        setPinError(null);
      } else if (e.key === 'Enter') {
        handleSubmitPin();
      } else if (e.key === 'Escape') {
        setPromptProfile(null);
        setPinInput('');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [promptProfile, pinInput]);

  const handleProfileClick = (profile: UserProfile) => {
    if (isManaging) {
      setEditingProfile(profile);
      setIsCreateModalOpen(true);
    } else {
      setPromptProfile(profile);
      setPinInput('');
      setPinError(null);
      setRememberLogin(true);
    }
  };

  const handleKeypadPress = (val: string) => {
    if (pinInput.length < 10) {
      setPinInput((prev) => prev + val);
      setPinError(null);
    }
  };

  const handleKeypadBackspace = () => {
    setPinInput((prev) => prev.slice(0, -1));
    setPinError(null);
  };

  const handleSubmitPin = async () => {
    if (!promptProfile) return;
    if (pinInput.length < 4) {
      setPinError('Vui lòng nhập tối thiểu 4 chữ số');
      triggerShake();
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await onSelectProfile(promptProfile, rememberLogin);
      if (!res.success) {
        setPinError(res.error || 'Mã PIN không chính xác');
        triggerShake();
        setPinInput('');
      } else {
        setPromptProfile(null);
      }
    } catch (err: any) {
      setPinError(err?.message || 'Lỗi đăng nhập');
      triggerShake();
    } finally {
      setIsSubmitting(false);
    }
  };

  const triggerShake = () => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0A0C10] flex flex-col items-center justify-center p-6 select-none overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-gradient-to-r from-ice-accent/15 via-blue-600/10 to-indigo-600/15 rounded-full blur-[120px] pointer-events-none" />

      {/* Main Content Container */}
      <div className="relative z-10 w-full max-w-5xl flex flex-col items-center text-center space-y-10 animate-fade-in">
        {/* Brand & Heading */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-ice-accent tracking-widest uppercase">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Icelauch Profiles</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight">
            {isManaging ? 'Quản Lý Hồ Sơ Người Dùng' : 'Ai Đang Trải Nghiệm?'}
          </h1>
          <p className="text-sm text-ice-subtext max-w-md mx-auto">
            {isManaging
              ? 'Nhấp vào hồ sơ để chỉnh sửa tên, ảnh đại diện hoặc thay đổi mã PIN'
              : 'Chọn hồ sơ của bạn để tiếp tục kho game, tiến độ xem phim và danh sách yêu thích'}
          </p>
        </div>

        {/* Netflix-Style Profile Cards Row */}
        <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-8 max-w-4xl py-4">
          {profiles.map((profile) => (
            <div
              key={profile.id}
              onClick={() => handleProfileClick(profile)}
              className="group flex flex-col items-center gap-3 cursor-pointer transition-all transform hover:-translate-y-2"
            >
              <div className="relative">
                <AvatarBadge
                  avatar={profile.avatar}
                  nickname={profile.nickname}
                  size="xl"
                  className={`ring-4 transition-all ${
                    isManaging
                      ? 'ring-amber-400 group-hover:ring-amber-300'
                      : 'ring-transparent group-hover:ring-ice-accent group-hover:shadow-[0_0_25px_rgba(79,140,255,0.6)]'
                  }`}
                />
                {isManaging && (
                  <div className="absolute inset-0 rounded-2xl bg-black/60 flex items-center justify-center text-amber-300 backdrop-blur-xs">
                    <Settings2 className="w-8 h-8 animate-spin-slow" />
                  </div>
                )}
              </div>
              <div className="space-y-0.5">
                <span className="font-bold text-base sm:text-lg text-white group-hover:text-ice-accent transition-colors block">
                  {profile.nickname}
                </span>
                <span className="text-[11px] text-ice-subtext block">
                  {profile.library?.length || 0} Game • {Object.keys(profile.watchProgress || {}).length} Phim
                </span>
              </div>
            </div>
          ))}

          {/* Add Profile Card */}
          <div
            onClick={() => {
              setEditingProfile(null);
              setIsCreateModalOpen(true);
            }}
            className="group flex flex-col items-center gap-3 cursor-pointer transition-all transform hover:-translate-y-2"
          >
            <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-white/20 hover:border-ice-accent bg-white/5 hover:bg-ice-accent/10 flex items-center justify-center text-white/50 group-hover:text-ice-accent transition-all group-hover:shadow-[0_0_20px_rgba(79,140,255,0.4)]">
              <Plus className="w-10 h-10 stroke-[2.5]" />
            </div>
            <span className="font-bold text-base sm:text-lg text-white/70 group-hover:text-ice-accent transition-colors">
              Thêm Hồ Sơ
            </span>
          </div>

          {/* Guest Mode Card */}
          {!isManaging && (
            <div
              onClick={onSelectGuest}
              className="group flex flex-col items-center gap-3 cursor-pointer transition-all transform hover:-translate-y-2 opacity-80 hover:opacity-100"
            >
              <div className="w-24 h-24 rounded-2xl border-2 border-white/10 hover:border-white/30 bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center text-white/60 group-hover:text-white transition-all shadow-md">
                <User className="w-10 h-10" />
              </div>
              <div className="space-y-0.5">
                <span className="font-bold text-base sm:text-lg text-white/80 group-hover:text-white transition-colors block">
                  Khách (Guest)
                </span>
                <span className="text-[11px] text-ice-subtext block">
                  Trải nghiệm nhanh
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Actions: Manage Profiles Button */}
        <div className="pt-4 flex items-center gap-4">
          <button
            onClick={() => setIsManaging(!isManaging)}
            className={`px-6 py-2.5 rounded-xl border text-xs font-bold tracking-wider uppercase transition-all flex items-center gap-2 ${
              isManaging
                ? 'bg-amber-500 text-black border-amber-400 shadow-lg shadow-amber-500/30'
                : 'bg-white/5 hover:bg-white/10 text-ice-subtext hover:text-white border-white/10'
            }`}
          >
            <Settings2 className="w-4 h-4" />
            <span>{isManaging ? 'Xong / Quay Lại' : 'Quản Lý Hồ Sơ'}</span>
          </button>
        </div>
      </div>

      {/* PIN Keypad Modal when selecting a profile */}
      {promptProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in select-none">
          <div className={`bg-[#14171F] border border-ice-border rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl p-6 flex flex-col items-center space-y-6 ${
            isShaking ? 'animate-shake' : ''
          }`}>
            {/* Header with Selected Profile Avatar */}
            <div className="flex flex-col items-center space-y-2">
              <AvatarBadge
                avatar={promptProfile.avatar}
                nickname={promptProfile.nickname}
                size="lg"
              />
              <div className="text-center">
                <h3 className="text-lg font-bold text-white tracking-wide">
                  {promptProfile.nickname}
                </h3>
                <p className="text-xs text-ice-subtext">Nhập mã PIN để mở khoá hồ sơ</p>
              </div>
            </div>

            {/* Dynamic PIN Dots Display (up to 10 dots!) */}
            <div className="flex items-center justify-center gap-2 min-h-[32px]">
              {Array.from({ length: Math.max(pinInput.length, 6) }).map((_, idx) => {
                const isFilled = idx < pinInput.length;
                return (
                  <div
                    key={idx}
                    className={`w-3.5 h-3.5 rounded-full transition-all duration-200 ${
                      isFilled
                        ? 'bg-amber-400 scale-125 shadow-[0_0_8px_rgba(251,191,36,0.8)]'
                        : 'border-2 border-white/20 bg-transparent'
                    }`}
                  />
                );
              })}
            </div>

            {pinError && (
              <span className="text-xs text-rose-400 font-semibold text-center">
                {pinError}
              </span>
            )}

            {/* Virtual Numeric Keypad (1 - 9, 0, Backspace) */}
            <div className="grid grid-cols-3 gap-3 w-full max-w-[260px]">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                <button
                  key={digit}
                  type="button"
                  onClick={() => handleKeypadPress(digit)}
                  className="h-12 rounded-xl bg-white/5 hover:bg-white/15 active:bg-white/25 border border-white/5 text-lg font-bold text-white transition-all transform active:scale-95 flex items-center justify-center font-mono"
                >
                  {digit}
                </button>
              ))}
              <button
                type="button"
                onClick={() => {
                  setPromptProfile(null);
                  setPinInput('');
                }}
                className="h-12 rounded-xl bg-white/5 hover:bg-rose-500/20 text-xs font-bold text-ice-subtext hover:text-rose-300 transition-colors flex items-center justify-center"
              >
                Huỷ
              </button>
              <button
                type="button"
                onClick={() => handleKeypadPress('0')}
                className="h-12 rounded-xl bg-white/5 hover:bg-white/15 active:bg-white/25 border border-white/5 text-lg font-bold text-white transition-all transform active:scale-95 flex items-center justify-center font-mono"
              >
                0
              </button>
              <button
                type="button"
                onClick={handleKeypadBackspace}
                className="h-12 rounded-xl bg-white/5 hover:bg-white/15 text-white/80 hover:text-white transition-colors flex items-center justify-center font-bold text-sm"
              >
                ⌫
              </button>
            </div>

            {/* Remember on this device checkbox */}
            <label className="flex items-center gap-2 text-xs text-ice-subtext hover:text-white cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={rememberLogin}
                onChange={(e) => setRememberLogin(e.target.checked)}
                className="w-4 h-4 rounded border-ice-border text-ice-accent focus:ring-0 focus:ring-offset-0 bg-black/40"
              />
              <span>Ghi nhớ (Tự động vào hồ sơ này lần sau)</span>
            </label>

            {/* Confirm Button */}
            <button
              onClick={handleSubmitPin}
              disabled={isSubmitting || pinInput.length < 4}
              className={`w-full h-11 rounded-xl text-xs font-bold tracking-wider uppercase flex items-center justify-center gap-2 transition-all ${
                pinInput.length >= 4
                  ? 'bg-gradient-to-r from-ice-accent to-blue-600 hover:from-ice-accentHover hover:to-blue-500 text-white shadow-lg shadow-blue-950/50 transform hover:-translate-y-0.5'
                  : 'bg-white/5 text-white/30 border border-white/5 cursor-not-allowed'
              }`}
            >
              <Check className="w-4 h-4" />
              <span>Đăng Nhập</span>
            </button>
          </div>
        </div>
      )}

      {/* Profile Create / Edit Modal */}
      <ProfileModal
        isOpen={isCreateModalOpen}
        profile={editingProfile}
        onClose={() => {
          setIsCreateModalOpen(false);
          setEditingProfile(null);
        }}
        onSave={onSaveProfile}
        onDelete={onDeleteProfile}
      />
    </div>
  );
};
