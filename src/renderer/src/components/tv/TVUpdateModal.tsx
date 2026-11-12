import React, { useState, useEffect } from 'react';
import { Tv, Sparkles, Download, X, AlertCircle, CheckCircle2 } from 'lucide-react';
import type { TVUpdateInfo } from '../../utils/apkUpdater';
import { triggerApkDownloadAndInstall } from '../../utils/apkUpdater';
import { sfx } from '../../utils/sfx';

interface TVUpdateModalProps {
  isOpen: boolean;
  updateInfo: TVUpdateInfo | null;
  onClose: () => void;
}

export const TVUpdateModal: React.FC<TVUpdateModalProps> = ({
  isOpen,
  updateInfo,
  onClose,
}) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [focusedBtn, setFocusedBtn] = useState<'update' | 'close'>('update');

  useEffect(() => {
    if (!isOpen) {
      setIsDownloading(false);
      setDownloadProgress(0);
      setErrorMessage(null);
      setFocusedBtn('update');
      return;
    }

    // Remote D-Pad Navigation for TV Update Modal
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isDownloading) return;

      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        sfx.playClick();
        setFocusedBtn((prev) => (prev === 'update' ? 'close' : 'update'));
        return;
      }

      if (e.key === 'Enter') {
        e.preventDefault();
        if (focusedBtn === 'update') {
          handleStartUpdate();
        } else {
          sfx.playClick();
          onClose();
        }
        return;
      }

      if (e.key === 'Escape' || e.key === 'Backspace') {
        e.preventDefault();
        sfx.playClick();
        onClose();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isDownloading, focusedBtn, updateInfo]);

  if (!isOpen || !updateInfo) return null;

  const handleStartUpdate = async () => {
    sfx.playClick();
    setIsDownloading(true);
    setErrorMessage(null);
    setDownloadProgress(0);

    try {
      const res = await triggerApkDownloadAndInstall(updateInfo.apkUrl, (progress) => {
        setDownloadProgress(progress);
      });

      if (!res.success && res.message) {
        setErrorMessage(res.message);
        setIsDownloading(false);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Không thể tải gói cập nhật');
      setIsDownloading(false);
      sfx.playError();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-8 select-none animate-fade-in">
      <div className="w-full max-w-2xl bg-[#0F1420] border-2 border-amber-500/60 rounded-3xl p-7 shadow-2xl shadow-amber-500/20 flex flex-col gap-6 relative">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 p-0.5 shadow-lg shadow-amber-500/30 flex items-center justify-center shrink-0">
              <Tv className="w-7 h-7 text-black" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono font-black uppercase px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  ANDROID TV EDITION OTA
                </span>
                <span className="text-xs text-ice-subtext">10-Foot UI</span>
              </div>
              <h2 className="text-2xl font-black text-white uppercase tracking-wider mt-1">
                Phát Hiện Phiên Bản TV Mới
              </h2>
            </div>
          </div>

          {!isDownloading && (
            <button
              type="button"
              onClick={() => {
                sfx.playClick();
                onClose();
              }}
              className="p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/10"
              title="Đóng"
            >
              <X className="w-6 h-6" />
            </button>
          )}
        </div>

        {/* Version Badge comparison */}
        <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-black/40 border border-white/10 text-center">
          <div className="flex flex-col items-center">
            <span className="text-xs font-bold text-slate-400 uppercase">Phiên Bản Hiện Tại</span>
            <span className="text-xl font-mono font-black text-slate-300 mt-1">
              v{updateInfo.currentVersion}
            </span>
          </div>
          <div className="flex flex-col items-center border-l border-white/10">
            <span className="text-xs font-bold text-amber-400 uppercase flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              Phiên Bản Mới Nhất
            </span>
            <span className="text-xl font-mono font-black text-amber-300 mt-1">
              v{updateInfo.latestVersion}
            </span>
          </div>
        </div>

        {/* Release Notes */}
        {updateInfo.releaseNotes && (
          <div className="p-4 rounded-2xl bg-black/30 border border-white/5 max-h-36 overflow-y-auto no-scrollbar">
            <p className="text-xs font-bold text-slate-400 uppercase mb-2">Chi tiết cập nhật:</p>
            <p className="text-xs text-slate-200 whitespace-pre-wrap leading-relaxed">
              {updateInfo.releaseNotes}
            </p>
          </div>
        )}

        {/* Error Notification */}
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-semibold flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Download Progress Bar */}
        {isDownloading ? (
          <div className="flex flex-col gap-3 py-2">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-amber-300 flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                Đang tải gói cài đặt Android TV...
              </span>
              <span className="text-white font-mono text-base">{downloadProgress}%</span>
            </div>

            <div className="w-full h-3.5 bg-black/60 rounded-full overflow-hidden border border-white/10 p-0.5">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-amber-300 rounded-full transition-all duration-200 shadow-lg shadow-amber-500/50"
                style={{ width: `${downloadProgress}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-400 text-center">
              Vui lòng giữ nguồn TV. Trình cài đặt hệ thống Android sẽ tự động mở khi tải xong.
            </p>
          </div>
        ) : (
          /* TV Remote D-Pad Action Buttons */
          <div className="grid grid-cols-2 gap-4 pt-2">
            <button
              data-tv-focus="tv-modal-update"
              type="button"
              onClick={handleStartUpdate}
              className={`p-4 rounded-2xl text-base font-black uppercase tracking-wider flex items-center justify-center gap-2.5 transition-all shadow-lg ${
                focusedBtn === 'update'
                  ? 'bg-amber-400 text-black ring-4 ring-amber-300 scale-102 shadow-amber-400/50'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
              }`}
            >
              <Download className="w-5 h-5" />
              <span>Cập Nhật Ngay (OK)</span>
            </button>

            <button
              data-tv-focus="tv-modal-close"
              type="button"
              onClick={() => {
                sfx.playClick();
                onClose();
              }}
              className={`p-4 rounded-2xl text-base font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                focusedBtn === 'close'
                  ? 'bg-white/20 text-white ring-4 ring-white/40 scale-102'
                  : 'bg-white/5 text-slate-400 hover:text-white border border-white/10'
              }`}
            >
              <span>Để Sau</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

