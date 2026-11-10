import React, { useState } from 'react';
import { Sparkles, Download, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { triggerApkDownloadAndInstall, type MobileUpdateInfo } from '../../utils/apkUpdater';
import { sfx } from '../../utils/sfx';

interface MobileUpdateModalProps {
  isOpen: boolean;
  updateInfo: MobileUpdateInfo | null;
  onClose: () => void;
}

export const MobileUpdateModal: React.FC<MobileUpdateModalProps> = ({
  isOpen,
  updateInfo,
  onClose,
}) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [isError, setIsError] = useState(false);

  if (!isOpen || !updateInfo) return null;

  const handleStartUpdate = async () => {
    sfx.playClick();
    setIsDownloading(true);
    setIsError(false);
    setStatusMessage('Đang kết nối máy chủ GitHub...');
    setDownloadProgress(5);

    try {
      const res = await triggerApkDownloadAndInstall(updateInfo.apkUrl, (progress) => {
        setDownloadProgress(progress);
        setStatusMessage(`Đang tải file cài đặt APK (${progress}%)...`);
      });

      if (res.success) {
        setStatusMessage('Đã tải xong! Đang mở trình cài đặt Android...');
        setTimeout(() => {
          setIsDownloading(false);
          onClose();
        }, 1500);
      } else {
        setIsError(true);
        setStatusMessage(res.message || 'Không thể cài đặt tự động.');
        setIsDownloading(false);
      }
    } catch (err: any) {
      setIsError(true);
      setStatusMessage(`Lỗi: ${err?.message || 'Không thể tải bản cập nhật'}`);
      setIsDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="w-full max-w-sm rounded-3xl bg-gradient-to-b from-[#161B26] to-[#0D1017] border border-cyan-500/40 p-5 space-y-4 shadow-2xl relative select-none animate-scale-up">
        {/* Close Button */}
        {!isDownloading && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3.5 right-3.5 w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Header with Glowing Icon */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20">
              Có Bản Cập Nhật Mới
            </span>
            <h2 className="text-base font-black text-white mt-1">
              Icelauch v{updateInfo.latestVersion}
            </h2>
          </div>
        </div>

        {/* Change Notes Box */}
        <div className="p-3 rounded-2xl bg-black/40 border border-white/5 space-y-1.5 max-h-36 overflow-y-auto no-scrollbar">
          <span className="text-[11px] font-bold text-slate-300">Tính năng & Sửa lỗi mới:</span>
          <p className="text-xs text-slate-400 leading-relaxed whitespace-pre-line">
            {updateInfo.releaseNotes || 'Bản cập nhật tối ưu hóa hiệu năng và giao diện di động.'}
          </p>
        </div>

        {/* Download Progress Bar */}
        {isDownloading && (
          <div className="space-y-1.5 animate-fade-in">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-semibold">{statusMessage}</span>
              <span className="text-cyan-400 font-mono font-bold">{downloadProgress}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-200 rounded-full shadow-[0_0_8px_#22d3ee]"
                style={{ width: `${downloadProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Error Feedback */}
        {isError && (
          <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="line-clamp-2">{statusMessage}</span>
          </div>
        )}

        {/* Action Buttons */}
        {!isDownloading ? (
          <div className="space-y-2 pt-1">
            <button
              type="button"
              onClick={handleStartUpdate}
              className="w-full h-11 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25 active:scale-98 transition-all"
            >
              <Download className="w-4 h-4 text-black fill-black" />
              <span>Cập Nhật Ngay Bây Giờ</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-full h-9 rounded-xl text-slate-400 hover:text-white text-xs font-semibold"
            >
              Để Sau
            </button>
          </div>
        ) : (
          <div className="text-center py-2">
            <span className="text-[11px] text-slate-400 animate-pulse">
              Vui lòng giữ ứng dụng mở trong khi tải...
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

