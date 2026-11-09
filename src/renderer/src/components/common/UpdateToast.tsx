import React, { useState, useEffect } from 'react';
import { Sparkles, Download, RefreshCw, X, ArrowRight, CheckCircle2 } from 'lucide-react';
import { sfx } from '../../utils/sfx';

interface UpdateToastProps {
  onGoToSettings?: () => void;
}

export const UpdateToast: React.FC<UpdateToastProps> = ({ onGoToSettings }) => {
  const [status, setStatus] = useState<string>('idle');
  const [updateVersion, setUpdateVersion] = useState<string>('');
  const [downloadProgress, setDownloadProgress] = useState<number>(0);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!window.api?.onUpdateStatus) return;

    const unsubStatus = window.api.onUpdateStatus((data: any) => {
      setStatus(data.status);
      if (data.version) setUpdateVersion(data.version);
      if (data.status === 'available') {
        setDismissed(false);
        sfx.playSuccess();
      }
      if (data.status === 'downloaded') {
        setDismissed(false);
        sfx.playSuccess();
      }
    });

    const unsubProgress = window.api.onUpdateProgress?.((data: any) => {
      setDownloadProgress(data.percent);
      setStatus('downloading');
    });

    return () => {
      unsubStatus?.();
      unsubProgress?.();
    };
  }, []);

  const handleDownload = async () => {
    sfx.playClick();
    setStatus('downloading');
    await window.api?.downloadUpdate?.();
  };

  const handleInstall = () => {
    sfx.playClick();
    window.api?.installUpdate?.();
  };

  if (dismissed || status === 'idle' || status === 'checking' || status === 'not-available' || status === 'error') {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 duration-300 select-none">
      <div className="bg-[#12161F]/95 backdrop-blur-md border border-amber-500/40 rounded-2xl p-4 shadow-2xl max-w-sm w-full text-white space-y-3 shadow-amber-950/20">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0">
              {status === 'downloaded' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <Sparkles className="w-4 h-4 text-amber-400" />
              )}
            </div>
            <div>
              <p className="text-xs font-bold leading-tight flex items-center gap-1.5">
                <span>{status === 'downloaded' ? 'Cập Nhật Đã Sẵn Sàng!' : 'Bản Nâng Cấp Mới!'}</span>
                {updateVersion && (
                  <span className="px-1.5 py-0.5 rounded bg-amber-400 text-black text-[10px] font-black font-mono">
                    v{updateVersion}
                  </span>
                )}
              </p>
              <p className="text-[11px] text-ice-subtext mt-0.5">
                {status === 'downloading'
                  ? `Đang tải ngầm: ${downloadProgress}%`
                  : status === 'downloaded'
                  ? 'Khởi động lại app để áp dụng phiên bản mới'
                  : 'Đã có bản cập nhật mới trên GitHub'}
              </p>
            </div>
          </div>

          <button
            onClick={() => setDismissed(true)}
            className="text-ice-subtext hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
            title="Đóng thông báo"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Progress bar if downloading */}
        {status === 'downloading' && (
          <div className="space-y-1">
            <div className="w-full h-1.5 bg-black/50 rounded-full overflow-hidden border border-white/10">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-amber-300 transition-all duration-300 rounded-full"
                style={{ width: `${downloadProgress}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] font-mono text-ice-muted">
              <span>Đang tải dưới nền...</span>
              <span>{downloadProgress}%</span>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 pt-0.5">
          {status === 'available' && (
            <button
              onClick={handleDownload}
              className="flex-1 h-8 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md shadow-amber-950/20"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Tải & Cập nhật</span>
            </button>
          )}

          {status === 'downloaded' && (
            <button
              onClick={handleInstall}
              className="flex-1 h-8 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md shadow-emerald-950/30"
            >
              <RefreshCw className="w-3.5 h-3.5 animate-spin-reverse" />
              <span>Khởi động lại ngay</span>
            </button>
          )}

          {onGoToSettings && (
            <button
              onClick={() => {
                setDismissed(true);
                onGoToSettings();
              }}
              className="px-2.5 h-8 rounded-xl bg-white/10 hover:bg-white/15 text-ice-subtext hover:text-white text-[11px] font-medium flex items-center gap-1 transition-colors"
            >
              <span>Xem chi tiết</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
