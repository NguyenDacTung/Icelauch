import React, { useState } from 'react';
import { 
  ExternalLink, 
  AppWindow, 
  Gamepad2, 
  BookOpen, 
  Info, 
  Check, 
  AlertCircle,
  Play
} from 'lucide-react';
import type { AppActionButton } from '../../types';
import { sfx } from '../../utils/sfx';

interface GameActionsWidgetProps {
  requirementsText?: string;
  buttons?: AppActionButton[];
  className?: string;
  variant?: 'default' | 'compact' | 'icon-only';
}

export const GameActionsWidget: React.FC<GameActionsWidgetProps> = ({
  requirementsText,
  buttons = [],
  className = '',
  variant = 'default',
}) => {
  const [activeFeedback, setActiveFeedback] = useState<{ id: string; msg: string; isError?: boolean } | null>(null);

  if (!requirementsText && buttons.length === 0) {
    return null;
  }

  const getShortName = (btn: AppActionButton) => {
    if (btn.icon === 'steam' || btn.label.toLowerCase().includes('steam')) return 'Steam';
    if (btn.icon === 'discord' || btn.label.toLowerCase().includes('discord')) return 'Discord';
    if (btn.type === 'link') return btn.label.replace(/^Mở (link|trang|web)?\s*/i, '') || 'Mở Web';
    return btn.label.replace(/^Mở (ứng dụng)?\s*/i, '') || btn.label;
  };

  const handleExecute = async (btn: AppActionButton) => {
    sfx.playClick();
    try {
      const res = await window.api.launchAction(btn.target, btn.type, btn.runAsAdmin);
      if (res && res.success) {
        sfx.playSuccess();
        setActiveFeedback({ id: btn.id, msg: 'Đã khởi chạy thành công!' });
      } else {
        sfx.playError();
        setActiveFeedback({ id: btn.id, msg: res?.error || 'Không thể mở liên kết/ứng dụng', isError: true });
      }
    } catch (err: any) {
      sfx.playError();
      setActiveFeedback({ id: btn.id, msg: err?.message || 'Lỗi khởi chạy', isError: true });
    }

    setTimeout(() => {
      setActiveFeedback((curr) => (curr?.id === btn.id ? null : curr));
    }, 3000);
  };

  const renderIcon = (btn: AppActionButton) => {
    switch (btn.icon) {
      case 'steam':
        return <Gamepad2 className="w-4 h-4 text-blue-400" />;
      case 'discord':
        return <span className="text-sm">💬</span>;
      case 'app':
        return <AppWindow className="w-4 h-4 text-cyan-400" />;
      case 'link':
        return <ExternalLink className="w-4 h-4 text-amber-400" />;
      case 'gamepad':
        return <Gamepad2 className="w-4 h-4 text-emerald-400" />;
      case 'book':
        return <BookOpen className="w-4 h-4 text-purple-400" />;
      default:
        return btn.type === 'app' ? <Play className="w-4 h-4 text-cyan-400" /> : <ExternalLink className="w-4 h-4 text-amber-400" />;
    }
  };

  return (
    <div className={`rounded-2xl bg-gradient-to-br from-[#121622] to-[#151926] border border-ice-border/80 p-3.5 sm:p-5 shadow-lg space-y-3.5 ${className}`}>
      {/* Title */}
      <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-amber-400" />
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">
            Yêu Cầu & Hướng Dẫn Chơi
          </h3>
        </div>
      </div>

      {/* Guidance Text Block */}
      {requirementsText && (
        <div className="bg-[#0A0D14]/70 border border-amber-500/20 rounded-xl p-3 text-xs text-ice-text leading-relaxed whitespace-pre-line flex items-start gap-2.5">
          <span className="text-amber-400 shrink-0 text-sm mt-0.5">📌</span>
          <div className="flex-1 text-xs leading-relaxed">{requirementsText}</div>
        </div>
      )}

      {/* Action Buttons List */}
      {buttons.length > 0 && (
        <div className="space-y-2">
          <div className="text-[11px] font-semibold text-ice-muted uppercase tracking-wider">
            Lối tắt ứng dụng & công cụ liên quan:
          </div>

          {variant === 'compact' ? (
            /* COMPACT MOBILE VIEW: Sleek horizontal pill chips - NO CLIPPING */
            <div className="flex flex-wrap items-center gap-2">
              {buttons.map((btn) => {
                const feedback = activeFeedback?.id === btn.id ? activeFeedback : null;
                const shortLabel = getShortName(btn);

                return (
                  <button
                    key={btn.id}
                    onClick={() => handleExecute(btn)}
                    title={`${btn.label}${btn.description ? `: ${btn.description}` : ''}`}
                    className={`group relative flex items-center gap-2 px-3.5 py-2 rounded-xl border text-left transition-all duration-200 active:scale-95 shadow-sm ${
                      feedback?.isError
                        ? 'bg-red-500/20 border-red-500/50 text-red-200'
                        : feedback
                        ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-200'
                        : 'bg-[#181C28] hover:bg-[#202538] border-white/10 hover:border-amber-400 text-white'
                    }`}
                  >
                    <div className="w-4 h-4 flex items-center justify-center shrink-0">
                      {feedback?.isError ? (
                        <AlertCircle className="w-4 h-4 text-red-400" />
                      ) : feedback ? (
                        <Check className="w-4 h-4 text-emerald-400" />
                      ) : (
                        renderIcon(btn)
                      )}
                    </div>

                    <span className="text-xs font-bold whitespace-nowrap text-white group-hover:text-amber-300 transition-colors">
                      {shortLabel}
                    </span>

                    {feedback && (
                      <span className="text-[10px] font-medium text-emerald-300 ml-1">
                        ✓
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ) : variant === 'icon-only' ? (
            /* ICON-ONLY MODE: Clean square icon buttons */
            <div className="flex items-center gap-2">
              {buttons.map((btn) => {
                const feedback = activeFeedback?.id === btn.id ? activeFeedback : null;

                return (
                  <button
                    key={btn.id}
                    onClick={() => handleExecute(btn)}
                    title={`${btn.label}${btn.description ? `: ${btn.description}` : ''}`}
                    className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-all active:scale-95 shadow-md ${
                      feedback?.isError
                        ? 'bg-red-500/20 border-red-500/50'
                        : feedback
                        ? 'bg-emerald-500/20 border-emerald-500/50'
                        : 'bg-[#181C28] hover:bg-[#202538] border-white/10 hover:border-amber-400'
                    }`}
                  >
                    {feedback?.isError ? (
                      <AlertCircle className="w-4 h-4 text-red-400" />
                    ) : feedback ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      renderIcon(btn)
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            /* DEFAULT DESKTOP VIEW: Full cards grid */
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {buttons.map((btn) => {
                const feedback = activeFeedback?.id === btn.id ? activeFeedback : null;

                return (
                  <button
                    key={btn.id}
                    onClick={() => handleExecute(btn)}
                    className={`group relative flex items-center gap-3 p-3 rounded-xl border text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
                      feedback?.isError
                        ? 'bg-red-500/15 border-red-500/50 text-red-200'
                        : feedback
                        ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-200'
                        : 'bg-[#181C28] hover:bg-[#1E2333] border-ice-border hover:border-amber-400/60 text-white'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-black/40 flex items-center justify-center shrink-0 border border-white/5 group-hover:scale-110 transition-transform">
                      {feedback?.isError ? (
                        <AlertCircle className="w-4 h-4 text-red-400" />
                      ) : feedback ? (
                        <Check className="w-4 h-4 text-emerald-400" />
                      ) : (
                        renderIcon(btn)
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold line-clamp-1 group-hover:text-amber-300 transition-colors break-words">
                        {btn.label}
                      </div>
                      {btn.description && (
                        <div className="text-[10px] text-ice-muted line-clamp-2 mt-0.5 leading-snug break-words">
                          {btn.description}
                        </div>
                      )}
                      {feedback && (
                        <div className={`text-[10px] font-semibold mt-1 ${feedback.isError ? 'text-red-400' : 'text-emerald-400'}`}>
                          {feedback.msg}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

