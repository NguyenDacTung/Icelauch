import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  Plus, 
  Trash2, 
  Clock, 
  Flame, 
  Shuffle, 
  Check, 
  Gamepad2, 
  Film, 
  Music, 
  Mic, 
  Sliders, 
  ArrowUp, 
  ArrowDown, 
  Pin, 
  RotateCcw,
  ExternalLink
} from 'lucide-react';
import type { 
  Game, 
  MediaItem, 
  AppBannerSettings, 
  SectionBannerSettings, 
  BannerItemConfig 
} from '../../types';
import { 
  DEFAULT_APP_BANNER_SETTINGS, 
  resolveBannerItems, 
  registerItemToBanner, 
  unpinItemFromBanner 
} from '../../utils/bannerResolver';
import { sfx } from '../../utils/sfx';

interface BannerManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  games: Game[];
  mediaList: MediaItem[];
  bannerSettings?: AppBannerSettings;
  onSaveBannerSettings: (settings: AppBannerSettings) => void;
}

type SectionTab = 'games' | 'videos' | 'music' | 'podcasts';

export const BannerManagerModal: React.FC<BannerManagerModalProps> = ({
  isOpen,
  onClose,
  games,
  mediaList,
  bannerSettings,
  onSaveBannerSettings,
}) => {
  const [activeTab, setActiveTab] = useState<SectionTab>('games');

  // Local state clone of bannerSettings
  const [settings, setSettings] = useState<AppBannerSettings>(() => ({
    games: { ...DEFAULT_APP_BANNER_SETTINGS.games, ...(bannerSettings?.games || {}) },
    videos: { ...DEFAULT_APP_BANNER_SETTINGS.videos, ...(bannerSettings?.videos || {}) },
    music: { ...DEFAULT_APP_BANNER_SETTINGS.music, ...(bannerSettings?.music || {}) },
    podcasts: { ...DEFAULT_APP_BANNER_SETTINGS.podcasts, ...(bannerSettings?.podcasts || {}) },
  }));

  const [isAddingNew, setIsAddingNew] = useState(false);
  const [selectedItemIdToAdd, setSelectedItemIdToAdd] = useState('');
  const [addDurationDays, setAddDurationDays] = useState(7);
  const [addIsPermanent, setAddIsPermanent] = useState(false);

  if (!isOpen) return null;

  const currentSectionSettings: SectionBannerSettings = settings[activeTab];

  // Filter items corresponding to activeTab
  let availableCandidates: Array<{ id: string; title: string; image?: string; isAlreadyPinned: boolean }> = [];
  const currentPinnedIds = new Set((currentSectionSettings.pinnedItems || []).map((p) => p.id));

  if (activeTab === 'games') {
    availableCandidates = games.map((g) => ({
      id: g.id,
      title: g.name,
      image: g.coverPath || g.bannerPath,
      isAlreadyPinned: currentPinnedIds.has(g.id),
    }));
  } else if (activeTab === 'videos') {
    availableCandidates = mediaList
      .filter((m) => m.type === 'video')
      .map((m) => ({
        id: m.id,
        title: m.title,
        image: m.coverPath || m.bannerPath,
        isAlreadyPinned: currentPinnedIds.has(m.id),
      }));
  } else if (activeTab === 'music') {
    availableCandidates = mediaList
      .filter((m) => m.type === 'audio' && m.subType !== 'podcast')
      .map((m) => ({
        id: m.id,
        title: m.title,
        image: m.coverPath || m.bannerPath,
        isAlreadyPinned: currentPinnedIds.has(m.id),
      }));
  } else {
    // podcasts
    availableCandidates = mediaList
      .filter((m) => m.type === 'audio' && m.subType === 'podcast')
      .map((m) => ({
        id: m.id,
        title: m.title,
        image: m.coverPath || m.bannerPath,
        isAlreadyPinned: currentPinnedIds.has(m.id),
      }));
  }

  // Calculate live preview of resolved banners
  const liveResolvedList = activeTab === 'games'
    ? resolveBannerItems(currentSectionSettings, games, 'game')
    : resolveBannerItems(
        currentSectionSettings, 
        mediaList.filter((m) => activeTab === 'videos' ? m.type === 'video' : activeTab === 'music' ? m.type === 'audio' && m.subType !== 'podcast' : m.type === 'audio' && m.subType === 'podcast'), 
        'media'
      );

  const handleUpdateSection = (updater: (prev: SectionBannerSettings) => SectionBannerSettings) => {
    setSettings((prev) => ({
      ...prev,
      [activeTab]: updater(prev[activeTab]),
    }));
  };

  const handleSave = () => {
    sfx.playSuccess();
    onSaveBannerSettings(settings);
    onClose();
  };

  const handleAddItem = () => {
    if (!selectedItemIdToAdd) return;
    sfx.playClick();
    const targetType = activeTab === 'games' ? 'game' : 'media';
    const updated = registerItemToBanner(
      settings,
      activeTab,
      selectedItemIdToAdd,
      targetType,
      addIsPermanent ? null : addDurationDays,
      addIsPermanent
    );
    setSettings(updated);
    setIsAddingNew(false);
    setSelectedItemIdToAdd('');
  };

  const handleUnpin = (id: string) => {
    sfx.playClick();
    const updated = unpinItemFromBanner(settings, activeTab, id);
    setSettings(updated);
  };

  const handleTogglePermanent = (id: string) => {
    sfx.playClick();
    handleUpdateSection((prev) => ({
      ...prev,
      pinnedItems: (prev.pinnedItems || []).map((p) => {
        if (p.id === id) {
          const newPerm = !p.isPermanent;
          return {
            ...p,
            isPermanent: newPerm,
            expiresAt: newPerm ? null : new Date(Date.now() + (prev.defaultExpiryDays || 7) * 24 * 60 * 60 * 1000).toISOString(),
          };
        }
        return p;
      }),
    }));
  };

  const handleMoveOrder = (index: number, direction: 'up' | 'down') => {
    sfx.playClick();
    handleUpdateSection((prev) => {
      const items = [...(prev.pinnedItems || [])];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= items.length) return prev;
      const temp = items[index];
      items[index] = items[targetIndex];
      items[targetIndex] = temp;
      return { ...prev, pinnedItems: items };
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#12141A] border border-ice-border rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-ice-border flex items-center justify-between bg-[#171A21]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-wide">
                Trung Tâm Quản Lý Banner Nổi Bật (Admin)
              </h3>
              <p className="text-xs text-ice-subtext">
                Thiết lập số lượng slot, thời hạn chạy banner và cơ chế tự động bù slot trống
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-ice-subtext hover:text-white hover:bg-white/10 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 4 Section Tabs */}
        <div className="flex border-b border-ice-border bg-[#0E1015] px-6 gap-2 pt-2">
          <button
            onClick={() => { setActiveTab('games'); sfx.playClick(); }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all border-t border-x ${
              activeTab === 'games'
                ? 'bg-[#12141A] text-amber-400 border-ice-border border-b-transparent shadow-md'
                : 'text-ice-subtext hover:text-white border-transparent'
            }`}
          >
            <Gamepad2 className="w-4 h-4" />
            <span>Trang Chủ Game</span>
          </button>

          <button
            onClick={() => { setActiveTab('videos'); sfx.playClick(); }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all border-t border-x ${
              activeTab === 'videos'
                ? 'bg-[#12141A] text-amber-400 border-ice-border border-b-transparent shadow-md'
                : 'text-ice-subtext hover:text-white border-transparent'
            }`}
          >
            <Film className="w-4 h-4" />
            <span>Phim & Video</span>
          </button>

          <button
            onClick={() => { setActiveTab('music'); sfx.playClick(); }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all border-t border-x ${
              activeTab === 'music'
                ? 'bg-[#12141A] text-amber-400 border-ice-border border-b-transparent shadow-md'
                : 'text-ice-subtext hover:text-white border-transparent'
            }`}
          >
            <Music className="w-4 h-4" />
            <span>Âm Nhạc</span>
          </button>

          <button
            onClick={() => { setActiveTab('podcasts'); sfx.playClick(); }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all border-t border-x ${
              activeTab === 'podcasts'
                ? 'bg-[#12141A] text-amber-400 border-ice-border border-b-transparent shadow-md'
                : 'text-ice-subtext hover:text-white border-transparent'
            }`}
          >
            <Mic className="w-4 h-4" />
            <span>Audio & Podcast</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Section Rules & Configuration Controls */}
          <div className="p-4 rounded-xl bg-black/40 border border-ice-border space-y-4">
            <div className="flex items-center justify-between border-b border-ice-border/60 pb-2.5">
              <span className="text-xs font-bold text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-amber-400" />
                <span>Quy Tắc Banner ({activeTab === 'games' ? 'Game' : activeTab === 'videos' ? 'Phim & Video' : activeTab === 'music' ? 'Nhạc' : 'Podcast'})</span>
              </span>
              <span className="text-[11px] text-amber-400/90 font-mono">
                Tối đa: {currentSectionSettings.maxBanners} Slots
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              {/* Max Banners Slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-ice-subtext">
                  <span>Số lượng Banner tối đa:</span>
                  <span className="text-white font-bold">{currentSectionSettings.maxBanners} banner</span>
                </div>
                <input
                  type="range"
                  min="3"
                  max="10"
                  value={currentSectionSettings.maxBanners}
                  onChange={(e) => handleUpdateSection((prev) => ({ ...prev, maxBanners: parseInt(e.target.value, 10) }))}
                  className="w-full accent-amber-400 h-1.5 bg-black/60 rounded-lg cursor-pointer"
                />
              </div>

              {/* Default Expiry Days */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-ice-subtext">
                  <span>Thời hạn nổi bật mặc định:</span>
                  <span className="text-white font-bold">{currentSectionSettings.defaultExpiryDays} ngày</span>
                </div>
                <input
                  type="range"
                  min="3"
                  max="30"
                  step="1"
                  value={currentSectionSettings.defaultExpiryDays}
                  onChange={(e) => handleUpdateSection((prev) => ({ ...prev, defaultExpiryDays: parseInt(e.target.value, 10) }))}
                  className="w-full accent-amber-400 h-1.5 bg-black/60 rounded-lg cursor-pointer"
                />
              </div>

              {/* Auto Slide Seconds */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-ice-subtext">
                  <span>Tự động chuyển slide:</span>
                  <span className="text-white font-bold">{currentSectionSettings.autoSlideIntervalSeconds} giây</span>
                </div>
                <input
                  type="range"
                  min="4"
                  max="15"
                  step="1"
                  value={currentSectionSettings.autoSlideIntervalSeconds}
                  onChange={(e) => handleUpdateSection((prev) => ({ ...prev, autoSlideIntervalSeconds: parseInt(e.target.value, 10) }))}
                  className="w-full accent-amber-400 h-1.5 bg-black/60 rounded-lg cursor-pointer"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-ice-border/40 text-xs">
              {/* Fallback Mode Selector */}
              <div className="space-y-1">
                <label className="text-ice-subtext font-semibold">Khi thiếu hoặc hết hạn, slot còn lại tự động bù theo:</label>
                <select
                  value={currentSectionSettings.fallbackMode}
                  onChange={(e) => handleUpdateSection((prev) => ({ ...prev, fallbackMode: e.target.value as any }))}
                  className="w-full bg-[#0A0D14] border border-ice-border rounded-lg px-3 py-1.5 text-white text-xs outline-none focus:border-amber-400"
                >
                  <option value="views_then_random">Ưu tiên lượt xem/chơi nhiều nhất ➔ Bù ngẫu nhiên (Khuyên dùng)</option>
                  <option value="views_only">Chỉ lấy theo lượt xem/chơi cao nhất</option>
                  <option value="random_only">Bù ngẫu nhiên toàn bộ</option>
                </select>
              </div>

              {/* Auto Add New Toggle */}
              <div className="flex items-center gap-3 pt-4">
                <label className="flex items-center gap-2 cursor-pointer text-white">
                  <input
                    type="checkbox"
                    checked={currentSectionSettings.autoAddNew}
                    onChange={(e) => handleUpdateSection((prev) => ({ ...prev, autoAddNew: e.target.checked }))}
                    className="w-4 h-4 rounded accent-amber-500"
                  />
                  <span>Tự động đưa nội dung mới thêm vào Banner ({currentSectionSettings.defaultExpiryDays} ngày)</span>
                </label>
              </div>
            </div>
          </div>

          {/* Action Bar & Add Banner Button */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white">
                Các Slot Banner Đang Chạy Thực Tế ({liveResolvedList.length} / {currentSectionSettings.maxBanners})
              </span>
              <span className="text-[10px] text-ice-muted">
                (Được giải quyết tự động theo thứ tự ưu tiên)
              </span>
            </div>

            <button
              onClick={() => setIsAddingNew(true)}
              className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-amber-500/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Ghim Thêm Mục Vào Banner</span>
            </button>
          </div>

          {/* Add New Item Sub-Modal / Form */}
          {isAddingNew && (
            <div className="p-4 rounded-xl bg-[#171A21] border-2 border-amber-500/50 space-y-3 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <Plus className="w-4 h-4" />
                  <span>Chọn mục cần ghim lên Banner:</span>
                </h4>
                <button onClick={() => setIsAddingNew(false)} className="text-ice-subtext hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                {/* Select item */}
                <div className="space-y-1 md:col-span-2">
                  <label className="text-ice-subtext">Chọn Game / Phim / Nhạc:</label>
                  <select
                    value={selectedItemIdToAdd}
                    onChange={(e) => setSelectedItemIdToAdd(e.target.value)}
                    className="w-full bg-[#0A0D14] border border-ice-border rounded-lg px-3 py-2 text-white outline-none focus:border-amber-400"
                  >
                    <option value="">-- Chọn một mục từ danh sách ({availableCandidates.length}) --</option>
                    {availableCandidates.map((c) => (
                      <option key={c.id} value={c.id} disabled={c.isAlreadyPinned}>
                        {c.title} {c.isAlreadyPinned ? '(Đã có trên banner)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Expiration or Permanent */}
                <div className="space-y-1">
                  <label className="text-ice-subtext">Hạn hiển thị:</label>
                  <div className="flex items-center gap-2">
                    <select
                      disabled={addIsPermanent}
                      value={addDurationDays}
                      onChange={(e) => setAddDurationDays(parseInt(e.target.value, 10))}
                      className="bg-[#0A0D14] border border-ice-border rounded-lg px-2.5 py-2 text-white flex-1 disabled:opacity-50"
                    >
                      <option value={3}>3 ngày</option>
                      <option value={7}>7 ngày</option>
                      <option value={14}>14 ngày</option>
                      <option value={30}>30 ngày</option>
                    </select>
                    <label className="flex items-center gap-1 text-[11px] text-ice-subtext cursor-pointer shrink-0">
                      <input
                        type="checkbox"
                        checked={addIsPermanent}
                        onChange={(e) => setAddIsPermanent(e.target.checked)}
                        className="accent-amber-500"
                      />
                      <span>Vĩnh viễn</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-ice-border/60">
                <button
                  type="button"
                  onClick={() => setIsAddingNew(false)}
                  className="px-3 py-1.5 rounded-lg text-ice-subtext hover:text-white text-xs"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  disabled={!selectedItemIdToAdd}
                  onClick={handleAddItem}
                  className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black text-xs font-bold transition-all shadow-md"
                >
                  Xác nhận Ghim
                </button>
              </div>
            </div>
          )}

          {/* Slot Cards List */}
          <div className="space-y-2.5">
            {liveResolvedList.map((resolved, index) => {
              const item = resolved.item as any;
              const title = item.name || item.title || 'Mục không có tên';
              const image = item.bannerPath || item.coverPath;
              const isPinned = resolved.isPinned;

              return (
                <div
                  key={item.id}
                  className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 rounded-xl border transition-all ${
                    isPinned
                      ? 'bg-[#151922] border-amber-500/30 shadow-md'
                      : 'bg-[#0E1015] border-ice-border/60 opacity-90'
                  }`}
                >
                  {/* Left: Slot Number + 16:9 Thumbnail + Title */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className="w-6 h-6 rounded-lg bg-black/60 border border-white/10 text-white font-mono text-xs font-bold flex items-center justify-center shrink-0">
                      {index + 1}
                    </span>

                    <div className="w-20 aspect-video rounded-lg overflow-hidden bg-black/80 border border-white/15 shrink-0">
                      {image ? (
                        <img src={image} alt={title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] text-ice-muted">16:9</div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-white truncate">{title}</p>
                      <div className="flex flex-wrap items-center gap-2 pt-0.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                          resolved.badgeType === 'new'
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            : resolved.badgeType === 'popular'
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                            : resolved.badgeType === 'random'
                            ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                            : 'bg-ice-accent/20 text-ice-accent border-ice-accent/40'
                        }`}>
                          {resolved.badgeText}
                        </span>

                        {isPinned && resolved.isPermanent && (
                          <span className="text-[10px] text-amber-400 font-semibold flex items-center gap-0.5">
                            <Pin className="w-3 h-3" />
                            <span>Ghim vĩnh viễn (Không bị loại bởi FIFO)</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    {/* Move up / down for pinned items */}
                    {isPinned && (
                      <div className="flex items-center gap-1 border-r border-ice-border/60 pr-2">
                        <button
                          type="button"
                          disabled={index === 0}
                          onClick={() => handleMoveOrder(index, 'up')}
                          className="p-1 rounded bg-black/40 hover:bg-white/10 text-ice-subtext hover:text-white disabled:opacity-30 transition-colors"
                          title="Đẩy lên trước"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={index >= (currentSectionSettings.pinnedItems || []).length - 1}
                          onClick={() => handleMoveOrder(index, 'down')}
                          className="p-1 rounded bg-black/40 hover:bg-white/10 text-ice-subtext hover:text-white disabled:opacity-30 transition-colors"
                          title="Đẩy xuống sau"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    {isPinned ? (
                      <>
                        <button
                          type="button"
                          onClick={() => handleTogglePermanent(item.id)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all ${
                            resolved.isPermanent
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                              : 'bg-white/5 text-ice-subtext border-white/10 hover:text-white'
                          }`}
                          title="Chuyển đổi giữa Ghim vĩnh viễn và Có thời hạn"
                        >
                          {resolved.isPermanent ? 'Hủy vĩnh viễn' : 'Đặt vĩnh viễn'}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleUnpin(item.id)}
                          className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 transition-colors"
                          title="Gỡ khỏi danh sách ghim Banner"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          const targetType = activeTab === 'games' ? 'game' : 'media';
                          const updated = registerItemToBanner(
                            settings,
                            activeTab,
                            item.id,
                            targetType,
                            currentSectionSettings.defaultExpiryDays || 7,
                            false
                          );
                          setSettings(updated);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-ice-hover hover:bg-amber-500 hover:text-black text-white text-[11px] font-semibold border border-ice-border transition-all flex items-center gap-1"
                        title="Chuyển mục tự động bù này thành mục Ghim chính thức"
                      >
                        <Pin className="w-3 h-3" />
                        <span>Ghim mục này</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {liveResolvedList.length === 0 && (
              <div className="p-8 text-center border border-dashed border-ice-border rounded-xl text-ice-muted text-xs">
                Chưa có nội dung nào để hiển thị trên Banner phân hệ này. Bấm nút &quot;Ghim Thêm Mục Vào Banner&quot; ở trên để bắt đầu!
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-ice-border bg-[#171A21] flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              sfx.playClick();
              setSettings({
                games: { ...DEFAULT_APP_BANNER_SETTINGS.games },
                videos: { ...DEFAULT_APP_BANNER_SETTINGS.videos },
                music: { ...DEFAULT_APP_BANNER_SETTINGS.music },
                podcasts: { ...DEFAULT_APP_BANNER_SETTINGS.podcasts },
              });
            }}
            className="text-xs text-ice-muted hover:text-amber-400 flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Khôi phục mặc định toàn bộ</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-ice-subtext hover:text-white hover:bg-white/5 transition-colors"
            >
              Hủy bỏ
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black text-xs font-bold shadow-lg shadow-amber-500/25 transition-all flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Lưu Cấu Hình Banner</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
