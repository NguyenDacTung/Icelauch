import React, { useState } from 'react';
import {
  Sliders,
  Sparkles,
  HardDrive,
  ShieldCheck,
  Cloud,
  FolderOpen,
  KeyRound,
  RotateCcw,
  Check,
  Save,
  Palette,
  Bell,
  RefreshCw,
} from 'lucide-react';
import type { AppSettings, CloudSyncSettings, SeasonTheme } from '../../types';
import { HorizontalScroller } from '../common/HorizontalScroller';

interface MobileSettingsViewProps {
  settings: AppSettings;
  isAdmin: boolean;
  cloudSync?: CloudSyncSettings;
  onChangePin: () => void;
  onOpenAdminAuth: () => void;
  onSaveSettings: (settings: Partial<AppSettings>) => void;
  onSaveCloudSync?: (settings: CloudSyncSettings) => void;
}

export const MobileSettingsView: React.FC<MobileSettingsViewProps> = ({
  settings,
  isAdmin,
  cloudSync,
  onChangePin,
  onOpenAdminAuth,
  onSaveSettings,
  onSaveCloudSync,
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'theme' | 'storage' | 'admin' | 'cloud'>('general');

  // Local settings copy
  const [particleTheme, setParticleTheme] = useState<SeasonTheme>(settings.particleConfig?.theme || 'winter');
  const [isSaved, setIsSaved] = useState(false);

  const tabs: { id: 'general' | 'theme' | 'storage' | 'admin' | 'cloud'; label: string; icon: any }[] = [
    { id: 'general', label: 'Chung', icon: Sliders },
    { id: 'theme', label: 'Chủ Đề & Hiệu Ứng', icon: Palette },
    { id: 'storage', label: 'Ổ Đĩa & Game', icon: HardDrive },
    { id: 'admin', label: 'Bảo Mật Admin', icon: ShieldCheck },
    { id: 'cloud', label: 'Đồng Bộ Đám Mây', icon: Cloud },
  ];

  const handleSaveTheme = () => {
    onSaveSettings({
      particleConfig: {
        speed: settings.particleConfig?.speed || 1,
        density: settings.particleConfig?.density || 40,
        opacity: settings.particleConfig?.opacity || 0.6,
        theme: particleTheme,
      },
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="flex-1 w-full h-full flex flex-col bg-[#0A0C10] select-none overflow-y-auto no-scrollbar p-3 space-y-3.5">
      {/* 1. TOP TITLE */}
      <div className="flex items-center justify-between shrink-0">
        <h1 className="text-base font-black text-white flex items-center gap-1.5 uppercase tracking-wide">
          <Sliders className="w-4 h-4 text-ice-accent" />
          <span>Cài Đặt Ứng Dụng</span>
        </h1>
        {isSaved && (
          <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1 animate-fade-in">
            <Check className="w-3.5 h-3.5" />
            <span>Đã lưu!</span>
          </span>
        )}
      </div>

      {/* 2. HORIZONTAL CATEGORY CHIPS */}
      <HorizontalScroller className="gap-1.5 shrink-0" showButtons={false}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all ${
                isActive
                  ? 'bg-amber-500 text-black shadow-md'
                  : 'bg-[#14171F] text-ice-subtext hover:text-white border border-ice-border/70'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </HorizontalScroller>

      {/* 3. SETTINGS SECTIONS */}
      <div className="space-y-3 flex-1">
        {/* TAB 1: CHUNG */}
        {activeTab === 'general' && (
          <div className="space-y-3">
            <div className="p-3.5 rounded-2xl bg-[#14171F] border border-ice-border/70 space-y-3">
              <span className="text-xs font-bold text-white uppercase tracking-wider block">
                Thông tin phiên bản
              </span>
              <div className="flex items-center justify-between text-xs">
                <span className="text-ice-subtext">Phiên bản hiện tại:</span>
                <span className="text-white font-bold bg-white/10 px-2 py-0.5 rounded-md">v1.0.0</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-ice-subtext">Nền tảng:</span>
                <span className="text-emerald-400 font-semibold">Icelauch Di Động (Android)</span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#14171F] border border-ice-border/70 space-y-2.5">
              <span className="text-xs font-bold text-white uppercase tracking-wider block">
                Cập nhật tự động (OTA)
              </span>
              <p className="text-xs text-ice-subtext">
                Ứng dụng tự động kiểm tra phiên bản mới từ GitHub Release khi khởi động.
              </p>
            </div>
          </div>
        )}

        {/* TAB 2: CHỦ ĐỀ & HIỆU ỨNG */}
        {activeTab === 'theme' && (
          <div className="space-y-3">
            <div className="p-3.5 rounded-2xl bg-[#14171F] border border-ice-border/70 space-y-3">
              <span className="text-xs font-bold text-white uppercase tracking-wider block">
                Hiệu ứng mùa động (Particles)
              </span>

              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'none' as SeasonTheme, label: 'Tắt hiệu ứng' },
                  { id: 'winter' as SeasonTheme, label: '❄️ Bông tuyết' },
                  { id: 'autumn' as SeasonTheme, label: '🍂 Lá vàng rơi' },
                  { id: 'spring' as SeasonTheme, label: '🌸 Hoa anh đào' },
                  { id: 'summer' as SeasonTheme, label: '✨ Đom đóm đêm' },
                  { id: 'cyber' as SeasonTheme, label: '🌌 Bụi vũ trụ' },
                ].map((eff) => (
                  <button
                    key={eff.id}
                    type="button"
                    onClick={() => setParticleTheme(eff.id)}
                    className={`h-9 px-2 rounded-xl text-xs font-semibold border flex items-center justify-center transition-all ${
                      particleTheme === eff.id
                        ? 'bg-ice-accent text-white border-ice-accent shadow-md'
                        : 'bg-white/5 border-white/10 text-ice-subtext hover:text-white'
                    }`}
                  >
                    {eff.label}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={handleSaveTheme}
                className="w-full mt-2 h-10 rounded-xl bg-gradient-to-r from-ice-accent to-blue-600 text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md active:scale-98"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Lưu Hiệu Ứng</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 3: Ổ ĐĨA & GAME */}
        {activeTab === 'storage' && (
          <div className="space-y-3">
            <div className="p-3.5 rounded-2xl bg-[#14171F] border border-ice-border/70 space-y-3">
              <span className="text-xs font-bold text-white uppercase tracking-wider block">
                Thư mục cài đặt Game PC
              </span>

              <div className="p-2.5 rounded-xl bg-black/50 border border-ice-border text-xs text-ice-subtext font-mono break-all">
                {settings.defaultGamesInstallPath || settings.gamesPath || 'C:\\Icelauch\\Games'}
              </div>

              <p className="text-[11px] text-amber-300/80 leading-relaxed">
                ℹ️ Trên điện thoại Android, game máy tính Windows được lưu trữ trên bộ nhớ máy tính khi bạn kết nối đồng bộ.
              </p>
            </div>
          </div>
        )}

        {/* TAB 4: BẢO MẬT ADMIN */}
        {activeTab === 'admin' && (
          <div className="space-y-3">
            <div className="p-3.5 rounded-2xl bg-[#14171F] border border-ice-border/70 space-y-3">
              <span className="text-xs font-bold text-white uppercase tracking-wider block">
                Trạng thái Quản Trị Viên (Admin)
              </span>

              <div className="flex items-center justify-between">
                <span className="text-xs text-ice-subtext">Quyền Admin:</span>
                <span className={`text-xs font-black px-2.5 py-0.5 rounded-full ${
                  isAdmin
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-white/10 text-ice-subtext'
                }`}>
                  {isAdmin ? 'ĐANG BẬT' : 'ĐÃ KHÓA'}
                </span>
              </div>

              {isAdmin ? (
                <button
                  type="button"
                  onClick={onChangePin}
                  className="w-full h-10 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center justify-center gap-2 shadow-md"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>Đổi Mã PIN Admin Công Khai (PIN_PUB)</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onOpenAdminAuth}
                  className="w-full h-10 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-black text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-md active:scale-98"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Mở Khóa Chế Độ Admin</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* TAB 5: ĐỒNG BỘ ĐÁM MÂY */}
        {activeTab === 'cloud' && (
          <div className="space-y-3">
            <div className="p-3.5 rounded-2xl bg-[#14171F] border border-ice-border/70 space-y-3">
              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Cloud className="w-4 h-4 text-ice-accent" />
                <span>Trạng thái Supabase Cloud Sync</span>
              </span>

              <div className="flex items-center justify-between text-xs">
                <span className="text-ice-subtext">Tình trạng:</span>
                <span className={`font-bold ${
                  cloudSync?.enabled ? 'text-emerald-400' : 'text-ice-subtext'
                }`}>
                  {cloudSync?.enabled ? 'Đã kích hoạt' : 'Chưa bật'}
                </span>
              </div>

              {cloudSync?.lastSyncedAt && (
                <div className="text-[11px] text-ice-subtext">
                  Đồng bộ lần cuối: {new Date(cloudSync.lastSyncedAt).toLocaleString('vi-VN')}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
