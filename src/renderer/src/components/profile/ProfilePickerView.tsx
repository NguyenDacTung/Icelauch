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
  Eye,
  EyeOff,
  HelpCircle,
  Send,
  ShieldCheck,
  LogIn,
  UserPlus
} from 'lucide-react';
import { AvatarBadge } from '../common/AvatarBadge';
import { ProfileModal } from './ProfileModal';
import type { UserProfile } from '../../types';

interface SavedAccountRecord {
  id: string;
  username?: string;
  nickname: string;
  avatar: string;
  role?: 'admin' | 'user';
}

const STORAGE_KEY_KNOWN_ACCOUNTS = 'icelauch_saved_known_accounts';

interface ProfilePickerViewProps {
  profiles: UserProfile[];
  onSelectProfile: (
    profile: UserProfile,
    credentials: { pin?: string; password?: string },
    remember: boolean
  ) => Promise<{ success: boolean; error?: string }>;
  onSelectGuest: () => void;
  onSaveProfile: (data: {
    id?: string;
    username?: string;
    nickname: string;
    role?: 'admin' | 'user';
    avatar: string;
    pin?: string;
    password?: string;
    remember: boolean;
  }) => Promise<void>;
  onDeleteProfile: (id: string) => Promise<void>;
  onRequestPasswordReset?: (profile: UserProfile) => Promise<{ success: boolean; message: string }>;
}

export const ProfilePickerView: React.FC<ProfilePickerViewProps> = ({
  profiles,
  onSelectProfile,
  onSelectGuest,
  onSaveProfile,
  onDeleteProfile,
  onRequestPasswordReset,
}) => {
  const [isManaging, setIsManaging] = useState(false);
  const [editingProfile, setEditingProfile] = useState<UserProfile | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Saved/known accounts on this device
  const [savedRecords, setSavedRecords] = useState<SavedAccountRecord[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_KNOWN_ACCOUNTS);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Direct login form state
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginPin, setLoginPin] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginRemember, setLoginRemember] = useState(true);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isSubmittingDirect, setIsSubmittingDirect] = useState(false);

  // Authentication prompt modal for entering a selected saved profile
  const [promptProfile, setPromptProfile] = useState<UserProfile | null>(null);
  const [pinInput, setPinInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberLogin, setRememberLogin] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [resetFeedback, setResetFeedback] = useState<string | null>(null);

  // Filter profiles that have been previously logged in on THIS device
  const visibleSavedProfiles = profiles.filter((p) =>
    savedRecords.some(
      (r) =>
        r.id === p.id ||
        (p.username && r.username && p.username.toLowerCase() === r.username.toLowerCase())
    )
  );

  const isDirectLoginAdmin = loginUsername.trim().toLowerCase() === 'admin' || loginUsername.trim().toLowerCase() === 'quantri';
  const isAdminProfile = promptProfile?.role === 'admin' || (promptProfile?.pinHash && !promptProfile?.passwordHash);

  const saveToKnownAccounts = (profile: UserProfile) => {
    const record: SavedAccountRecord = {
      id: profile.id,
      username: profile.username,
      nickname: profile.nickname,
      avatar: profile.avatar,
      role: profile.role,
    };
    setSavedRecords((prev) => {
      const filtered = prev.filter((r) => r.id !== profile.id);
      const updated = [record, ...filtered];
      try {
        localStorage.setItem(STORAGE_KEY_KNOWN_ACCOUNTS, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const handleForgetAccount = (profileId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Xóa tài khoản này khỏi danh sách đã nhớ trên thiết bị này?')) {
      setSavedRecords((prev) => {
        const updated = prev.filter((r) => r.id !== profileId);
        try {
          localStorage.setItem(STORAGE_KEY_KNOWN_ACCOUNTS, JSON.stringify(updated));
        } catch {}
        return updated;
      });
    }
  };

  // Direct Login Submit Handler
  const handleDirectLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    const cleanUser = loginUsername.trim().toLowerCase();
    if (!cleanUser) {
      setLoginError('Vui lòng nhập Tên đăng nhập');
      return;
    }

    // Find profile in profiles list
    let matchedProfile = profiles.find(
      (p) =>
        (p.username && p.username.toLowerCase() === cleanUser) ||
        p.id.toLowerCase() === cleanUser ||
        p.nickname.toLowerCase() === cleanUser
    );

    // If typing 'admin', match the admin profile
    if (!matchedProfile && (cleanUser === 'admin' || cleanUser === 'quantri')) {
      matchedProfile = profiles.find((p) => p.role === 'admin' || (p.pinHash && !p.passwordHash));
    }

    if (!matchedProfile) {
      setLoginError('Không tìm thấy tài khoản với Tên đăng nhập này. Vui lòng kiểm tra lại hoặc bấm Đăng Ký.');
      return;
    }

    // Check ban
    if (matchedProfile.bannedUntil) {
      const banEnd = new Date(matchedProfile.bannedUntil);
      if (banEnd > new Date()) {
        const timeStr = banEnd.toLocaleString('vi-VN');
        const reasonMsg = matchedProfile.banReason ? ` vì lý do: "${matchedProfile.banReason}"` : '';
        setLoginError(`Tài khoản này đã bị tạm khóa đến ${timeStr}${reasonMsg}. Vui lòng liên hệ Admin.`);
        return;
      }
    }

    const isAdmin = matchedProfile.role === 'admin' || (matchedProfile.pinHash && !matchedProfile.passwordHash);

    if (isAdmin && !loginPin.trim()) {
      setLoginError('Vui lòng nhập mã PIN Quản Trị Viên');
      return;
    }
    if (!isAdmin && !loginPassword.trim()) {
      setLoginError('Vui lòng nhập mật khẩu tài khoản');
      return;
    }

    setIsSubmittingDirect(true);
    try {
      const res = await onSelectProfile(
        matchedProfile,
        { pin: loginPin.trim(), password: loginPassword },
        loginRemember
      );

      if (res.success) {
        if (loginRemember) {
          saveToKnownAccounts(matchedProfile);
        }
      } else {
        setLoginError(res.error || (isAdmin ? 'Mã PIN Admin không chính xác' : 'Mật khẩu không chính xác'));
      }
    } catch (err: any) {
      setLoginError(err?.message || 'Lỗi đăng nhập');
    } finally {
      setIsSubmittingDirect(false);
    }
  };

  // Handle Physical Keyboard input when PIN prompt is active (for Admin)
  useEffect(() => {
    if (!promptProfile || !isAdminProfile) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        if (pinInput.length < 10) {
          setPinInput((prev) => prev + e.key);
          setAuthError(null);
        }
      } else if (e.key === 'Backspace') {
        setPinInput((prev) => prev.slice(0, -1));
        setAuthError(null);
      } else if (e.key === 'Enter') {
        handleSubmitAuth();
      } else if (e.key === 'Escape') {
        setPromptProfile(null);
        setPinInput('');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [promptProfile, pinInput, isAdminProfile]);

  const handleProfileClick = (profile: UserProfile) => {
    if (isManaging) {
      setEditingProfile(profile);
      setIsCreateModalOpen(true);
    } else {
      setPromptProfile(profile);
      setPinInput('');
      setPasswordInput('');
      setShowPassword(false);
      setAuthError(null);
      setRememberLogin(true);
      setShowForgotModal(false);
      setResetFeedback(null);
    }
  };

  const handleKeypadPress = (val: string) => {
    if (pinInput.length < 10) {
      setPinInput((prev) => prev + val);
      setAuthError(null);
    }
  };

  const handleKeypadBackspace = () => {
    setPinInput((prev) => prev.slice(0, -1));
    setAuthError(null);
  };

  const handleSubmitAuth = async () => {
    if (!promptProfile) return;

    if (promptProfile.bannedUntil) {
      const banEnd = new Date(promptProfile.bannedUntil);
      if (banEnd > new Date()) {
        const timeStr = banEnd.toLocaleString('vi-VN');
        const reasonMsg = promptProfile.banReason ? ` vì lý do: "${promptProfile.banReason}"` : '';
        setAuthError(`Tài khoản này đã bị tạm khóa đến ${timeStr}${reasonMsg}. Vui lòng liên hệ Admin.`);
        triggerShake();
        return;
      }
    }

    if (isAdminProfile) {
      if (pinInput.length < 4) {
        setAuthError('Vui lòng nhập tối thiểu 4 chữ số PIN Admin');
        triggerShake();
        return;
      }
    } else {
      if (!passwordInput.trim()) {
        setAuthError('Vui lòng nhập mật khẩu tài khoản');
        triggerShake();
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const res = await onSelectProfile(
        promptProfile,
        { pin: pinInput, password: passwordInput },
        rememberLogin
      );
      if (!res.success) {
        setAuthError(res.error || (isAdminProfile ? 'Mã PIN không chính xác' : 'Mật khẩu không chính xác'));
        triggerShake();
        if (isAdminProfile) setPinInput('');
      } else {
        if (rememberLogin) {
          saveToKnownAccounts(promptProfile);
        }
        setPromptProfile(null);
      }
    } catch (err: any) {
      setAuthError(err?.message || 'Lỗi đăng nhập');
      triggerShake();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendResetRequest = async () => {
    if (!promptProfile) return;
    try {
      if (onRequestPasswordReset) {
        const res = await onRequestPasswordReset(promptProfile);
        setResetFeedback(res.message);
      } else {
        setResetFeedback('Đã gửi yêu cầu đặt lại mật khẩu tới Quản trị viên!');
      }
    } catch (err: any) {
      setResetFeedback(`Lỗi: ${err?.message || 'Không thể gửi yêu cầu'}`);
    }
  };

  const triggerShake = () => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0A0C10] flex flex-col items-center justify-center p-4 sm:p-6 select-none overflow-y-auto custom-scrollbar">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-gradient-to-r from-ice-accent/15 via-blue-600/10 to-indigo-600/15 rounded-full blur-[120px] pointer-events-none" />

      {/* Main Content Container */}
      <div className="relative z-10 w-full max-w-4xl flex flex-col items-center text-center space-y-8 animate-fade-in my-auto py-8">
        {/* Brand & Heading */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-ice-accent tracking-widest uppercase">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Icelauch Profiles</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            Đăng Nhập Icelauch
          </h1>
          <p className="text-xs sm:text-sm text-ice-subtext max-w-md mx-auto">
            Hệ thống bảo mật: Chỉ hiển thị các tài khoản đã từng đăng nhập trên thiết bị này
          </p>
        </div>

        {/* SECTION 1: SAVED ACCOUNTS ON THIS DEVICE (IF ANY) */}
        {visibleSavedProfiles.length > 0 && (
          <div className="w-full space-y-3">
            <span className="text-xs font-bold text-ice-muted uppercase tracking-wider block">
              Tài khoản đã nhớ trên máy này ({visibleSavedProfiles.length}):
            </span>
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 py-2">
              {visibleSavedProfiles.map((profile) => (
                <div
                  key={profile.id}
                  onClick={() => handleProfileClick(profile)}
                  className="group relative flex flex-col items-center gap-2.5 p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 hover:border-ice-accent transition-all transform hover:-translate-y-1 cursor-pointer w-28 sm:w-32"
                >
                  {/* Remove Account from this Device Button */}
                  <button
                    type="button"
                    onClick={(e) => handleForgetAccount(profile.id, e)}
                    className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-black/80 hover:bg-red-600 border border-white/20 text-white/70 hover:text-white flex items-center justify-center text-xs transition-colors shadow-lg z-10"
                    title="Xóa tài khoản khỏi thiết bị này"
                  >
                    <X className="w-3 h-3" />
                  </button>

                  <AvatarBadge
                    avatar={profile.avatar}
                    nickname={profile.nickname}
                    size="md"
                    className="group-hover:ring-2 group-hover:ring-ice-accent transition-all"
                  />
                  <div className="w-full text-center">
                    <span className="font-bold text-xs sm:text-sm text-white truncate block">
                      {profile.nickname}
                    </span>
                    <span className="text-[10px] text-ice-muted block truncate font-mono">
                      {profile.role === 'admin' ? '🛡️ Admin' : profile.username ? `@${profile.username}` : 'Thành viên'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SECTION 2: DIRECT LOGIN FORM */}
        <div className="w-full max-w-md p-6 rounded-3xl bg-black/40 border border-white/10 shadow-2xl space-y-4 text-left">
          <div className="flex items-center gap-2 border-b border-white/10 pb-3">
            <LogIn className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              Đăng Nhập Tài Khoản
            </span>
          </div>

          <form onSubmit={handleDirectLogin} className="space-y-3.5">
            {/* Username Input */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-ice-subtext uppercase tracking-wider">
                Tên đăng nhập (Username):
              </label>
              <input
                type="text"
                value={loginUsername}
                onChange={(e) => {
                  setLoginUsername(e.target.value);
                  setLoginError(null);
                }}
                placeholder="Ví dụ: dactung hoặc admin"
                className="w-full h-10 px-3.5 rounded-xl bg-black/50 border border-white/15 text-xs text-white placeholder-ice-muted focus:border-amber-400 focus:outline-none transition-colors font-medium"
              />
            </div>

            {/* Password or Admin PIN Input */}
            {isDirectLoginAdmin ? (
              <div className="space-y-1 animate-fade-in">
                <label className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Mã PIN Quản Trị Viên (Admin):</span>
                </label>
                <input
                  type="password"
                  value={loginPin}
                  onChange={(e) => {
                    setLoginPin(e.target.value);
                    setLoginError(null);
                  }}
                  placeholder="Nhập mã PIN Admin..."
                  className="w-full h-10 px-3.5 rounded-xl bg-black/50 border border-amber-400/40 text-xs text-white placeholder-ice-muted focus:border-amber-400 focus:outline-none transition-colors font-mono tracking-widest"
                />
              </div>
            ) : (
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-ice-subtext uppercase tracking-wider">
                  Mật khẩu:
                </label>
                <div className="relative">
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    value={loginPassword}
                    onChange={(e) => {
                      setLoginPassword(e.target.value);
                      setLoginError(null);
                    }}
                    placeholder="Nhập mật khẩu tài khoản..."
                    className="w-full h-10 pl-3.5 pr-10 rounded-xl bg-black/50 border border-white/15 text-xs text-white placeholder-ice-muted focus:border-amber-400 focus:outline-none transition-colors font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-ice-muted hover:text-white transition-colors"
                  >
                    {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {/* Remember on this device checkbox */}
            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-ice-subtext hover:text-white transition-colors">
                <input
                  type="checkbox"
                  checked={loginRemember}
                  onChange={(e) => setLoginRemember(e.target.checked)}
                  className="w-4 h-4 rounded border-ice-border bg-black/40 text-ice-accent focus:ring-0"
                />
                <span>Ghi nhớ tài khoản trên thiết bị này</span>
              </label>
            </div>

            {/* Error Message */}
            {loginError && (
              <p className="text-[11px] text-red-400 flex items-center gap-1.5 pt-1">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{loginError}</span>
              </p>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmittingDirect}
              className="w-full h-11 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-black text-xs tracking-wider uppercase shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <LogIn className="w-4 h-4" />
              <span>{isSubmittingDirect ? 'Đang xác thực...' : 'Đăng Nhập'}</span>
            </button>
          </form>
        </div>

        {/* SECTION 3: REGISTER NEW & GUEST ACTIONS */}
        <div className="flex flex-wrap items-center justify-center gap-4 text-xs">
          <button
            type="button"
            onClick={() => {
              setEditingProfile(null);
              setIsCreateModalOpen(true);
            }}
            className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold transition-all flex items-center gap-2 border border-white/10 shadow"
          >
            <UserPlus className="w-4 h-4 text-amber-400" />
            <span>Đăng Ký Tài Khoản Mới</span>
          </button>

          <button
            type="button"
            onClick={onSelectGuest}
            className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-ice-muted hover:text-white font-bold transition-all flex items-center gap-2 border border-white/5"
          >
            <User className="w-4 h-4" />
            <span>Trải Nghiệm Dưới Dạng Khách (Guest)</span>
          </button>
        </div>
      </div>

      {/* Dual Login Modal for Selected Saved Profile Card */}
      {promptProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in select-none">
          <div className={`bg-[#14171F] border border-ice-border rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl p-6 flex flex-col items-center space-y-5 ${
            isShaking ? 'animate-shake' : ''
          }`}>
            <div className="flex flex-col items-center space-y-2">
              <AvatarBadge
                avatar={promptProfile.avatar}
                nickname={promptProfile.nickname}
                size="lg"
              />
              <div className="text-center">
                <div className="flex items-center justify-center gap-1.5">
                  <h3 className="text-lg font-bold text-white tracking-wide">
                    {promptProfile.nickname}
                  </h3>
                  {isAdminProfile && (
                    <span className="px-1.5 py-0.5 rounded bg-amber-400 text-black text-[9px] font-black uppercase tracking-wider">
                      ADMIN
                    </span>
                  )}
                </div>
                {promptProfile.username && (
                  <p className="text-[11px] text-ice-subtext font-mono">@{promptProfile.username}</p>
                )}
                <p className="text-xs text-ice-subtext mt-0.5">
                  {isAdminProfile ? 'Nhập mã PIN Quản Trị Viên' : 'Nhập mật khẩu để tiếp tục'}
                </p>
              </div>
            </div>

            {authError && (
              <span className="text-xs text-rose-400 font-semibold text-center w-full">
                {authError}
              </span>
            )}

            {isAdminProfile ? (
              <>
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
              </>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSubmitAuth();
                }}
                className="w-full space-y-4"
              >
                <div className="space-y-1.5">
                  <div className="relative w-full">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={passwordInput}
                      onChange={(e) => {
                        setPasswordInput(e.target.value);
                        setAuthError(null);
                      }}
                      autoFocus
                      placeholder="Nhập mật khẩu..."
                      className="w-full h-11 pl-4 pr-11 rounded-xl bg-black/40 border border-ice-border text-white text-sm focus:outline-none focus:border-ice-accent transition-colors font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ice-muted hover:text-white transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPromptProfile(null)}
                    className="flex-1 h-11 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-bold transition-colors"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !passwordInput.trim()}
                    className="flex-1 h-11 rounded-xl bg-ice-accent hover:bg-ice-accentHover text-white text-xs font-bold transition-all shadow-lg shadow-ice-accent/30 disabled:opacity-50"
                  >
                    {isSubmitting ? 'Đang vào...' : 'Xác Nhận'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Profile Registration Modal */}
      <ProfileModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        profile={editingProfile}
        onSave={async (data) => {
          await onSaveProfile(data);
          setIsCreateModalOpen(false);
          // If registered with remember, save to known accounts
          const saved: SavedAccountRecord = {
            id: data.id || `user-${Date.now()}`,
            username: data.username,
            nickname: data.nickname,
            avatar: data.avatar,
            role: data.role || 'user',
          };
          setSavedRecords((prev) => [saved, ...prev.filter((r) => r.id !== saved.id)]);
          try {
            const current = JSON.parse(localStorage.getItem(STORAGE_KEY_KNOWN_ACCOUNTS) || '[]');
            localStorage.setItem(STORAGE_KEY_KNOWN_ACCOUNTS, JSON.stringify([saved, ...current.filter((r: any) => r.id !== saved.id)]));
          } catch {}
        }}
      />
    </div>
  );
};
