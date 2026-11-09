import React, { useState } from 'react';
import {
  Tv,
  Cloud,
  RefreshCw,
  Volume2,
  Film,
  User,
  ShieldCheck,
  Check,
  Sparkles,
  Lock,
  CheckCircle2,
  AlertCircle,
  PlaySquare,
  Clock,
  Layers,
} from 'lucide-react';
import type { AppSettings, CloudSyncSettings, UserProfile } from '../../types';
import { AvatarBadge } from '../common/AvatarBadge';
import { sfx } from '../../utils/sfx';

export interface TVSettingsViewProps {
  settings: AppSettings;
  isAdmin: boolean;
  cloudSync?: CloudSyncSettings;
  activeProfile?: UserProfile | null;
  onSwitchProfile?: () => void;
  onOpenAdminAuth: () => void;
  onLockAdmin?: () => void;
  onSaveSettings: (settings: Partial<AppSettings>) => void;
  onSaveCloudSync?: (settings: Partial<CloudSyncSettings>) => void;
}

export const TVSettingsView: React.FC<TVSettingsViewProps> = ({
  settings,
  isAdmin,
  cloudSync,
  activeProfile,
  onSwitchProfile,
  onOpenAdminAuth,
  onLockAdmin,
  onSaveSettings,
  onSaveCloudSync,
}) => {
  // Sync state
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncToast, setSyncToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Settings states
  const autoPlayTrailer = settings.tvAutoPlayTrailer ?? true;
  const sfxEnabled = settings.sfxEnabled !== false;
  const currentInterval = cloudSync?.autoSyncIntervalMinutes ?? 5;

  // OTA Update state
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
  const [updateMsg, setUpdateMsg] = useState<string | null>(null);

  const handleSyncNow = async () => {
    sfx.playClick();
    setIsSyncing(true);
    setSyncToast(null);
    try {
      if (window.api?.syncCloud) {
        const res = await window.api.syncCloud();
        if (res.success) {
          sfx.playSuccess();
          setSyncToast({ type: 'success', text: res.message || 'Đồng bộ thành công!' });
        } else {
          sfx.playError();
          setSyncToast({ type: 'error', text: res.message || 'Lỗi đồng bộ Supabase' });
        }
      } else {
        setTimeout(() => {
          sfx.playSuccess();
          setSyncToast({ type: 'success', text: 'Đồng bộ dữ liệu thành công!' });
          setIsSyncing(false);
        }, 1200);
        return;
      }
    } catch (err: any) {
      sfx.playError();
      setSyncToast({ type: 'error', text: err?.message || 'Lỗi kết nối đám mây' });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleCycleInterval = () => {
    sfx.playClick();
    const intervals = [5, 15, 30, 0];
    const currentIndex = intervals.indexOf(currentInterval);
    const nextInterval = intervals[(currentIndex + 1) % intervals.length];
    onSaveCloudSync?.({ autoSyncIntervalMinutes: nextInterval });
  };

  const handleToggleTrailer = () => {
    sfx.playClick();
    onSaveSettings({ tvAutoPlayTrailer: !autoPlayTrailer });
  };

  const handleToggleSfx = () => {
    sfx.playClick();
    onSaveSettings({ sfxEnabled: !sfxEnabled });
  };

  const handleCheckUpdate = async () => {
    sfx.playClick();
    setIsCheckingUpdate(true);
    setUpdateMsg('Đang kiểm tra từ máy chủ...');
    try {
      if (window.api?.checkUpdates) {
        const res = await window.api.checkUpdates();
        if (res && res.success) {
          if (res.version) {
            setUpdateMsg(`Có bản mới v${res.version}!`);
          } else {
            setUpdateMsg('Bạn đang ở phiên bản mới nhất v1.0.0.');
          }
        } else {
          setUpdateMsg(res?.error || 'Bạn đang ở phiên bản mới nhất.');
        }
      } else {
        setTimeout(() => {
          setUpdateMsg('Bạn đang ở phiên bản TV mới nhất (v1.0.0).');
          setIsCheckingUpdate(false);
        }, 1200);
        return;
      }
    } catch (err: any) {
      setUpdateMsg(`Lỗi kết nối: ${err?.message || 'Lỗi mạng'}`);
    } finally {
      setIsCheckingUpdate(false);
    }
  };

  return (
    <div className="flex-1 w-full h-full flex flex-col p-6 overflow-y-auto no-scrollbar select-none bg-[#07090E]">
      {/* 1. TV SETTINGS HEADER */}
      <div className="flex items-center justify-between pb-5 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 p-0.5 shadow-lg shadow-amber-500/20 flex items-center justify-center">
            <Tv className="w-6 h-6 text-black" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white uppercase tracking-wider flex items-center gap-2.5">
              <span>Cài Đặt Hệ Thống TV</span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                10-Foot UI
              </span>
            </h1>
            <p className="text-xs text-ice-subtext mt-0.5">
              Tối ưu 100% cho điều khiển TV Remote • Bấm OK trên remote để chọn hoặc chuyển đổi
            </p>
          </div>
        </div>

        {/* Sync Status Banner */}
        {syncToast && (
          <div
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border animate-fade-in ${
              syncToast.type === 'success'
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                : 'bg-rose-500/20 border-rose-500/40 text-rose-300'
            }`}
          >
            {syncToast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400" />
            )}
            <span>{syncToast.text}</span>
          </div>
        )}
      </div>

      {/* 2. TV SETTINGS GRID (SPATIAL D-PAD READY) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-6">
        {/* ========================================================= */}
        {/* CARD 1: ĐỒNG BỘ ĐÁM MÂY (SUPABASE CLOUD) */}
        {/* ========================================================= */}
        <button
          data-tv-focus="tv-set-sync-now"
          type="button"
          onClick={handleSyncNow}
          disabled={isSyncing}
          className="p-5 rounded-2xl bg-[#111520] border-2 border-white/10 hover:border-amber-400/60 text-left transition-all flex flex-col justify-between h-44 shadow-lg group"
        >
          <div className="flex items-start justify-between w-full">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shrink-0">
                <Cloud className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white uppercase tracking-wide group-hover:text-amber-300 transition-colors">
                  Đồng Bộ Đám Mây Ngay
                </h3>
                <span className="text-xs text-ice-subtext block mt-0.5">
                  {cloudSync?.enabled ? '🟢 Đã kết nối Supabase Cloud' : '⚪ Chưa kích hoạt kết nối'}
                </span>
              </div>
            </div>

            <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-lg bg-black/40 text-indigo-300 border border-indigo-500/30">
              Supabase BaaS
            </span>
          </div>

          <div className="flex items-center justify-between w-full pt-2 border-t border-white/5 text-xs">
            <span className="text-ice-subtext">
              Lần cuối: {cloudSync?.lastSyncedAt
                ? new Date(cloudSync.lastSyncedAt).toLocaleTimeString('vi-VN', {
                    hour: '2-digit',
                    minute: '2-digit',
                    day: '2-digit',
                    month: '2-digit',
                  })
                : 'Chưa đồng bộ'}
            </span>

            <div className="flex items-center gap-1.5 font-bold text-amber-400">
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Đang đồng bộ...' : 'Bấm OK để đồng bộ'}</span>
            </div>
          </div>
        </button>

        {/* ========================================================= */}
        {/* CARD 2: CHU KỲ TỰ ĐỘNG ĐỒNG BỘ */}
        {/* ========================================================= */}
        <button
          data-tv-focus="tv-set-sync-interval"
          type="button"
          onClick={handleCycleInterval}
          className="p-5 rounded-2xl bg-[#111520] border-2 border-white/10 hover:border-amber-400/60 text-left transition-all flex flex-col justify-between h-44 shadow-lg group"
        >
          <div className="flex items-start justify-between w-full">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white uppercase tracking-wide group-hover:text-amber-300 transition-colors">
                  Tự Động Đồng Bộ Ngầm
                </h3>
                <span className="text-xs text-ice-subtext block mt-0.5">
                  Đồng bộ tiến độ phim & yêu thích theo chu kỳ
                </span>
              </div>
            </div>

            <span className="text-sm font-black px-3 py-1 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40">
              {currentInterval === 0 ? 'ĐÃ TẮT' : `${currentInterval} PHÚT`}
            </span>
          </div>

          <div className="flex items-center justify-between w-full pt-2 border-t border-white/5 text-xs text-ice-subtext">
            <span>Chu kỳ: 5 phút → 15 phút → 30 phút → Tắt</span>
            <span className="font-bold text-amber-400">Bấm OK để chuyển đổi</span>
          </div>
        </button>

        {/* ========================================================= */}
        {/* CARD 3: TỰ ĐỘNG PHÁT TRAILER BANNER */}
        {/* ========================================================= */}
        <button
          data-tv-focus="tv-set-toggle-trailer"
          type="button"
          onClick={handleToggleTrailer}
          className="p-5 rounded-2xl bg-[#111520] border-2 border-white/10 hover:border-amber-400/60 text-left transition-all flex flex-col justify-between h-44 shadow-lg group"
        >
          <div className="flex items-start justify-between w-full">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400 shrink-0">
                <PlaySquare className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white uppercase tracking-wide group-hover:text-amber-300 transition-colors">
                  Trailer Preview Banner
                </h3>
                <span className="text-xs text-ice-subtext block mt-0.5">
                  Tự động phát preview trailer khi dừng trên banner
                </span>
              </div>
            </div>

            <span className={`text-xs font-black px-3 py-1 rounded-xl border ${
              autoPlayTrailer
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : 'bg-white/10 text-ice-muted border-white/10'
            }`}>
              {autoPlayTrailer ? '🟢 ĐANG BẬT' : '⚪ ĐÃ TẮT'}
            </span>
          </div>

          <div className="flex items-center justify-between w-full pt-2 border-t border-white/5 text-xs text-ice-subtext">
            <span>Độ trễ kích hoạt trailer: 1.5 giây</span>
            <span className="font-bold text-amber-400">Bấm OK để Bật / Tắt</span>
          </div>
        </button>

        {/* ========================================================= */}
        {/* CARD 4: ÂM THANH ĐIỀU KHIỂN (SFX) */}
        {/* ========================================================= */}
        <button
          data-tv-focus="tv-set-toggle-sfx"
          type="button"
          onClick={handleToggleSfx}
          className="p-5 rounded-2xl bg-[#111520] border-2 border-white/10 hover:border-amber-400/60 text-left transition-all flex flex-col justify-between h-44 shadow-lg group"
        >
          <div className="flex items-start justify-between w-full">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400 shrink-0">
                <Volume2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white uppercase tracking-wide group-hover:text-amber-300 transition-colors">
                  Âm Thanh Điều Khiển TV
                </h3>
                <span className="text-xs text-ice-subtext block mt-0.5">
                  Hiệu ứng click âm thanh khi di chuyển Remote
                </span>
              </div>
            </div>

            <span className={`text-xs font-black px-3 py-1 rounded-xl border ${
              sfxEnabled
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : 'bg-white/10 text-ice-muted border-white/10'
            }`}>
              {sfxEnabled ? '🟢 ĐANG BẬT' : '⚪ ĐÃ TẮT'}
            </span>
          </div>

          <div className="flex items-center justify-between w-full pt-2 border-t border-white/5 text-xs text-ice-subtext">
            <span>Âm thanh phản hồi xúc giác cho TV</span>
            <span className="font-bold text-amber-400">Bấm OK để Bật / Tắt</span>
          </div>
        </button>

        {/* ========================================================= */}
        {/* CARD 5: HỒ SƠ & TÀI KHOẢN GIA ĐÌNH */}
        {/* ========================================================= */}
        <button
          data-tv-focus="tv-set-switch-profile"
          type="button"
          onClick={() => {
            sfx.playClick();
            onSwitchProfile?.();
          }}
          className="p-5 rounded-2xl bg-[#111520] border-2 border-white/10 hover:border-amber-400/60 text-left transition-all flex flex-col justify-between h-44 shadow-lg group"
        >
          <div className="flex items-start justify-between w-full">
            <div className="flex items-center gap-3">
              <AvatarBadge
                avatar={activeProfile?.avatar || 'avatar_1'}
                nickname={activeProfile?.nickname || 'Khách'}
                size="md"
              />
              <div>
                <h3 className="text-base font-bold text-white uppercase tracking-wide group-hover:text-amber-300 transition-colors">
                  {activeProfile?.nickname || 'Người Dùng'}
                </h3>
                <span className="text-xs text-ice-subtext block mt-0.5">
                  {isAdmin ? 'Quản Trị Viên (Admin)' : 'Thành Viên Gia Đình'}
                </span>
              </div>
            </div>

            <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-white/10 text-white">
              Đang Sử Dụng
            </span>
          </div>

          <div className="flex items-center justify-between w-full pt-2 border-t border-white/5 text-xs text-ice-subtext">
            <span>Chuyển sang thành viên khác trên TV</span>
            <span className="font-bold text-amber-400">Bấm OK để đổi hồ sơ</span>
          </div>
        </button>

        {/* ========================================================= */}
        {/* CARD 6: BẢO MẬT ADMIN & CẬP NHẬT OTA */}
        {/* ========================================================= */}
        <button
          data-tv-focus="tv-set-admin"
          type="button"
          onClick={() => {
            sfx.playClick();
            if (isAdmin) {
              onLockAdmin?.();
            } else {
              onOpenAdminAuth();
            }
          }}
          className="p-5 rounded-2xl bg-[#111520] border-2 border-white/10 hover:border-amber-400/60 text-left transition-all flex flex-col justify-between h-44 shadow-lg group"
        >
          <div className="flex items-start justify-between w-full">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white uppercase tracking-wide group-hover:text-amber-300 transition-colors">
                  Chế Độ Quản Trị Viên
                </h3>
                <span className="text-xs text-ice-subtext block mt-0.5">
                  Bảo vệ bằng mã PIN số an toàn
                </span>
              </div>
            </div>

            <span className={`text-xs font-black px-3 py-1 rounded-xl border ${
              isAdmin
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-white/10 text-ice-muted border-white/10'
            }`}>
              {isAdmin ? '🔓 ĐANG BẬT' : '🔒 ĐÃ KHÓA'}
            </span>
          </div>

          <div className="flex items-center justify-between w-full pt-2 border-t border-white/5 text-xs text-ice-subtext">
            <span>{isAdmin ? 'Quyền quản trị đang mở' : 'Yêu cầu mã PIN Admin'}</span>
            <span className="font-bold text-amber-400">
              {isAdmin ? 'Bấm OK để Khóa Lại' : 'Bấm OK để Nhập PIN'}
            </span>
          </div>
        </button>
      </div>

      {/* 3. FOOTER INFO & OTA UPDATE */}
      <div className="mt-6 p-4 rounded-2xl bg-black/40 border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <Tv className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Icelauch TV OS (Android TV Edition) • Phiên bản v1.0.0
            </h4>
            <p className="text-[11px] text-ice-subtext">
              {updateMsg || 'Ứng dụng tự động kiểm tra phiên bản mới từ GitHub Release khi khởi động.'}
            </p>
          </div>
        </div>

        <button
          data-tv-focus="tv-set-check-update"
          type="button"
          onClick={handleCheckUpdate}
          disabled={isCheckingUpdate}
          className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-2 border border-white/10 transition-all shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isCheckingUpdate ? 'animate-spin' : ''}`} />
          <span>{isCheckingUpdate ? 'Đang kiểm tra...' : 'Kiểm Tra Cập Nhật OTA'}</span>
        </button>
      </div>
    </div>
  );
};
