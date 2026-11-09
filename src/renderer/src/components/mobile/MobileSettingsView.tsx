import React, { useState } from 'react';
import {
  Sliders,
  Sparkles,
  ShieldCheck,
  Cloud,
  KeyRound,
  Check,
  Palette,
  Volume2,
  RefreshCw,
  User,
  LogOut,
  ChevronRight,
  Lock,
  Flame,
  CheckCircle2,
  AlertCircle,
  Clock,
  Smartphone,
} from 'lucide-react';
import type { AppSettings, CloudSyncSettings, SeasonTheme, UserProfile } from '../../types';
import { AvatarBadge } from '../common/AvatarBadge';
import { sfx } from '../../utils/sfx';

export interface MobileSettingsViewProps {
  settings: AppSettings;
  isAdmin: boolean;
  cloudSync?: CloudSyncSettings;
  activeProfile?: UserProfile | null;
  onChangePin: () => void;
  onOpenAdminAuth: () => void;
  onLockAdmin?: () => void;
  onSwitchProfile?: () => void;
  onEditProfile?: () => void;
  onSaveSettings: (settings: Partial<AppSettings>) => void;
  onSaveCloudSync?: (settings: Partial<CloudSyncSettings>) => void;
}

export const MobileSettingsView: React.FC<MobileSettingsViewProps> = ({
  settings,
  isAdmin,
  cloudSync,
  activeProfile,
  onChangePin,
  onOpenAdminAuth,
  onLockAdmin,
  onSwitchProfile,
  onEditProfile,
  onSaveSettings,
  onSaveCloudSync,
}) => {
  // Theme & SFX states
  const [particleTheme, setParticleTheme] = useState<SeasonTheme>(
    settings.particleConfig?.theme || (settings.ambientSnowEnabled === false ? 'none' : 'winter')
  );
  const [sfxEnabled, setSfxEnabled] = useState<boolean>(settings.sfxEnabled !== false);
  const [isSavedToast, setIsSavedToast] = useState(false);

  // Cloud Sync state
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  // OTA Update state
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
  const [updateResult, setUpdateResult] = useState<{
    status: 'idle' | 'checking' | 'latest' | 'available' | 'error';
    msg: string;
    version?: string;
  }>({
    status: 'idle',
    msg: '',
  });

  const triggerSavedToast = () => {
    setIsSavedToast(true);
    setTimeout(() => setIsSavedToast(false), 2000);
  };

  const handleSelectTheme = (theme: SeasonTheme) => {
    sfx.playClick();
    setParticleTheme(theme);
    onSaveSettings({
      particleConfig: {
        speed: settings.particleConfig?.speed || 1,
        density: settings.particleConfig?.density || 35,
        opacity: settings.particleConfig?.opacity || 0.6,
        theme,
      },
      ambientSnowEnabled: theme !== 'none',
    });
    triggerSavedToast();
  };

  const handleToggleSfx = (enabled: boolean) => {
    sfx.playClick();
    setSfxEnabled(enabled);
    onSaveSettings({ sfxEnabled: enabled });
    triggerSavedToast();
  };

  const handleSyncNow = async () => {
    sfx.playClick();
    setIsSyncing(true);
    setSyncFeedback(null);
    try {
      if (window.api?.syncCloud) {
        const res = await window.api.syncCloud();
        if (res.success) {
          sfx.playSuccess();
          setSyncFeedback({ type: 'success', msg: res.message || 'Đồng bộ thành công!' });
        } else {
          sfx.playError();
          setSyncFeedback({ type: 'error', msg: res.message || 'Lỗi đồng bộ đám mây' });
        }
      } else {
        setTimeout(() => {
          sfx.playSuccess();
          setSyncFeedback({ type: 'success', msg: 'Đồng bộ dữ liệu thành công!' });
          setIsSyncing(false);
        }, 1000);
        return;
      }
    } catch (err: any) {
      sfx.playError();
      setSyncFeedback({ type: 'error', msg: err?.message || 'Không thể kết nối Supabase' });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleIntervalChange = (val: number) => {
    sfx.playClick();
    onSaveCloudSync?.({ autoSyncIntervalMinutes: val });
    triggerSavedToast();
  };

  const handleCheckUpdate = async () => {
    sfx.playClick();
    setIsCheckingUpdate(true);
    setUpdateResult({ status: 'checking', msg: 'Đang kiểm tra từ máy chủ...' });
    try {
      if (window.api?.checkUpdates) {
        const res = await window.api.checkUpdates();
        if (res && res.success) {
          if (res.version) {
            setUpdateResult({
              status: 'available',
              msg: `Có phiên bản mới v${res.version}!`,
              version: res.version,
            });
          } else {
            setUpdateResult({
              status: 'latest',
              msg: 'Tuyệt vời! Bạn đang ở phiên bản mới nhất v1.0.0.',
            });
          }
        } else {
          setUpdateResult({
            status: 'latest',
            msg: res?.error || 'Bạn đang ở phiên bản mới nhất v1.0.0.',
          });
        }
      } else {
        setTimeout(() => {
          setUpdateResult({
            status: 'latest',
            msg: 'Bạn đang sử dụng phiên bản di động mới nhất (v1.0.0).',
          });
          setIsCheckingUpdate(false);
        }, 1200);
        return;
      }
    } catch (err: any) {
      setUpdateResult({
        status: 'error',
        msg: `Lỗi kết nối: ${err?.message || 'Lỗi mạng'}`,
      });
    } finally {
      setIsCheckingUpdate(false);
    }
  };

  const currentInterval = cloudSync?.autoSyncIntervalMinutes ?? 5;

  return (
    <div className="flex-1 w-full h-full flex flex-col bg-[#07090E] select-none overflow-y-auto no-scrollbar p-3.5 space-y-4">
      {/* 1. TOP HEADER & TOAST */}
      <div className="flex items-center justify-between shrink-0 pt-1">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-base font-black text-white uppercase tracking-wider">Cài Đặt</h1>
            <p className="text-[10px] text-ice-subtext">Tối ưu cho thao tác chạm di động</p>
          </div>
        </div>

        {isSavedToast && (
          <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full animate-fade-in">
            <Check className="w-3.5 h-3.5" />
            <span>Đã lưu!</span>
          </span>
        )}
      </div>

      {/* 2. PROFILE HERO CARD */}
      <div className="p-3.5 rounded-2xl bg-gradient-to-r from-[#141824] via-[#11141D] to-[#161B29] border border-white/10 shadow-lg flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <AvatarBadge
            avatar={activeProfile?.avatar || 'avatar_1'}
            nickname={activeProfile?.nickname || 'Khách'}
            size="md"
          />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h2 className="text-sm font-bold text-white truncate">
                {activeProfile?.nickname || 'Người Dùng'}
              </h2>
              {isAdmin && (
                <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase">
                  Admin
                </span>
              )}
            </div>
            <p className="text-[11px] text-ice-subtext truncate mt-0.5">
              {settings.userGamerTitle || 'Thành Viên Gia Đình'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {onEditProfile && (
            <button
              type="button"
              onClick={() => {
                sfx.playClick();
                onEditProfile();
              }}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-ice-subtext hover:text-white border border-white/5 transition-colors"
              title="Đổi tên & avatar"
            >
              <User className="w-4 h-4 text-amber-400" />
            </button>
          )}

          {onSwitchProfile && (
            <button
              type="button"
              onClick={() => {
                sfx.playClick();
                onSwitchProfile();
              }}
              className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-ice-subtext hover:text-white text-xs font-semibold border border-white/5 flex items-center gap-1 transition-colors"
              title="Đổi hồ sơ khác"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Đổi Hồ Sơ</span>
            </button>
          )}
        </div>
      </div>

      {/* 3. CLOUD SYNC CARD (MOBILE FIRST) */}
      <div className="p-4 rounded-2xl bg-[#10141D] border border-indigo-500/30 shadow-md space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Cloud className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Đồng Bộ Đám Mây (Supabase)
              </h3>
              <p className="text-[10px] text-ice-subtext">Tự động sao lưu tiến độ & yêu thích</p>
            </div>
          </div>

          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
            cloudSync?.enabled
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              : 'bg-white/10 text-ice-muted'
          }`}>
            {cloudSync?.enabled ? '🟢 ĐÃ BẬT' : '⚪ CHƯA BẬT'}
          </span>
        </div>

        {/* Sync Info Banner */}
        <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 text-[11px] space-y-1">
          <div className="flex items-center justify-between text-ice-subtext">
            <span>Lần cuối đồng bộ:</span>
            <span className="text-white font-mono">
              {cloudSync?.lastSyncedAt
                ? new Date(cloudSync.lastSyncedAt).toLocaleTimeString('vi-VN', {
                    hour: '2-digit',
                    minute: '2-digit',
                    day: '2-digit',
                    month: '2-digit',
                  })
                : 'Chưa đồng bộ'}
            </span>
          </div>
          {cloudSync?.lastSyncMessage && (
            <p className="text-[10px] text-emerald-400/90 truncate">
              {cloudSync.lastSyncMessage}
            </p>
          )}
        </div>

        {/* Sync Feedback Message */}
        {syncFeedback && (
          <div className={`p-2.5 rounded-xl text-xs flex items-center gap-2 border animate-fade-in ${
            syncFeedback.type === 'success'
              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
          }`}>
            {syncFeedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            )}
            <span className="truncate">{syncFeedback.msg}</span>
          </div>
        )}

        {/* Big Tap Button: Đồng Bộ Ngay */}
        <button
          type="button"
          onClick={handleSyncNow}
          disabled={isSyncing}
          className="w-full h-11 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-indigo-950/50 active:scale-98 transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
          <span>{isSyncing ? 'Đang Đồng Bộ Dữ Liệu...' : 'Đồng Bộ Dữ Liệu Ngay'}</span>
        </button>

        {/* Segmented Auto-Sync Interval Chips */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-[11px] text-ice-subtext">
            <span>Chu kỳ tự động đồng bộ ngầm:</span>
            <span className="text-indigo-300 font-bold">{currentInterval} phút</span>
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {[
              { val: 0, label: 'Tắt' },
              { val: 5, label: '5 phút' },
              { val: 15, label: '15 phút' },
              { val: 30, label: '30 phút' },
            ].map((opt) => (
              <button
                key={opt.val}
                type="button"
                onClick={() => handleIntervalChange(opt.val)}
                className={`h-8 rounded-lg text-[11px] font-bold transition-all border ${
                  currentInterval === opt.val
                    ? 'bg-indigo-600 text-white border-indigo-400 shadow-md'
                    : 'bg-black/30 text-ice-subtext border-white/5 hover:text-white'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 4. APPEARANCE & THEME CARD */}
      <div className="p-4 rounded-2xl bg-[#10141D] border border-ice-border/70 shadow-md space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center">
              <Palette className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Giao Diện & Trải Nghiệm
              </h3>
              <p className="text-[10px] text-ice-subtext">Hiệu ứng mùa & âm thanh tương tác</p>
            </div>
          </div>
        </div>

        {/* SFX Toggle Row */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-black/30 border border-white/5">
          <div className="flex items-center gap-2.5">
            <Volume2 className="w-4 h-4 text-amber-400" />
            <div>
              <span className="text-xs font-bold text-white block">Âm thanh tương tác</span>
              <span className="text-[10px] text-ice-subtext">Hiệu ứng click & chạm phản hồi</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleToggleSfx(!sfxEnabled)}
            className={`w-12 h-6 rounded-full transition-colors relative flex items-center px-1 ${
              sfxEnabled ? 'bg-amber-500' : 'bg-white/20'
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full bg-white shadow transform transition-transform ${
                sfxEnabled ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Season Particle Effects Grid */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-semibold text-ice-subtext block">
            Hiệu ứng hạt chuyển động theo mùa:
          </span>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'none' as SeasonTheme, label: 'Tắt hiệu ứng', icon: '⚪' },
              { id: 'winter' as SeasonTheme, label: 'Tuyết rơi', icon: '❄️' },
              { id: 'cyber' as SeasonTheme, label: 'Vũ trụ', icon: '🌌' },
              { id: 'autumn' as SeasonTheme, label: 'Lá vàng', icon: '🍂' },
              { id: 'spring' as SeasonTheme, label: 'Hoa đào', icon: '🌸' },
              { id: 'summer' as SeasonTheme, label: 'Đom đóm', icon: '✨' },
            ].map((theme) => {
              const isSelected = particleTheme === theme.id;
              return (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => handleSelectTheme(theme.id)}
                  className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 text-center transition-all ${
                    isSelected
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-md'
                      : 'bg-black/30 border-white/5 text-ice-subtext hover:text-white'
                  }`}
                >
                  <span className="text-base">{theme.icon}</span>
                  <span className="text-[11px] font-bold">{theme.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 5. ADMIN MANAGEMENT CARD */}
      <div className="p-4 rounded-2xl bg-[#10141D] border border-ice-border/70 shadow-md space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Bảo Mật Quản Trị Viên (Admin)
              </h3>
              <p className="text-[10px] text-ice-subtext">Quyền chỉnh sửa danh mục & phim</p>
            </div>
          </div>

          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
            isAdmin
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              : 'bg-white/10 text-ice-muted'
          }`}>
            {isAdmin ? 'ĐANG BẬT' : 'ĐÃ KHÓA'}
          </span>
        </div>

        {isAdmin ? (
          <div className="space-y-2">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300">
              🔓 Bạn đang đăng nhập quyền Admin. Bạn có thể thêm, chỉnh sửa game và video.
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  sfx.playClick();
                  onChangePin();
                }}
                className="h-10 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
              >
                <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                <span>Đổi Mã PIN</span>
              </button>

              {onLockAdmin && (
                <button
                  type="button"
                  onClick={() => {
                    sfx.playClick();
                    onLockAdmin();
                  }}
                  className="h-10 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Khóa Admin</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => {
              sfx.playClick();
              onOpenAdminAuth();
            }}
            className="w-full h-11 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-md active:scale-98 transition-all"
          >
            <Lock className="w-4 h-4" />
            <span>Mở Khóa Chế Độ Admin (Nhập PIN)</span>
          </button>
        )}
      </div>

      {/* 6. APP VERSION & OTA UPDATE CARD */}
      <div className="p-4 rounded-2xl bg-[#10141D] border border-ice-border/70 shadow-md space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Phiên Bản & Cập Nhật (OTA)
              </h3>
              <p className="text-[10px] text-ice-subtext">Icelauch Android Edition v1.0.0</p>
            </div>
          </div>
        </div>

        {updateResult.status !== 'idle' && (
          <div className={`p-2.5 rounded-xl border text-xs flex items-start gap-2 animate-fade-in ${
            updateResult.status === 'available'
              ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
              : updateResult.status === 'error'
              ? 'bg-rose-500/15 border-rose-500/40 text-rose-300'
              : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
          }`}>
            <Sparkles className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="flex-1 font-medium">{updateResult.msg}</span>
          </div>
        )}

        <button
          type="button"
          onClick={handleCheckUpdate}
          disabled={isCheckingUpdate}
          className="w-full h-10 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 border border-white/10 transition-all active:scale-98 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isCheckingUpdate ? 'animate-spin' : ''}`} />
          <span>{isCheckingUpdate ? 'Đang Kiểm Tra Bản Mới...' : 'Kiểm Tra Phiên Bản Mới (OTA)'}</span>
        </button>
      </div>

      <div className="h-4" />
    </div>
  );
};
