import React, { useState, useRef } from 'react';
import {
  X,
  RotateCcw,
  Save,
  Check,
  Eye,
  EyeOff,
  Move,
  Sliders,
  Sparkles,
  Gamepad2,
  Keyboard,
  MousePointer
} from 'lucide-react';
import type { VirtualButtonBinding } from '../../types';
import { PRESET_MAP } from '../../utils/controllerPresets';

interface CustomLayoutEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameTitle: string;
  initialButtons: VirtualButtonBinding[];
  onSave: (buttons: VirtualButtonBinding[]) => void;
}

export const CustomLayoutEditorModal: React.FC<CustomLayoutEditorModalProps> = ({
  isOpen,
  onClose,
  gameTitle,
  initialButtons,
  onSave,
}) => {
  const [buttons, setButtons] = useState<VirtualButtonBinding[]>(() =>
    initialButtons && initialButtons.length > 0
      ? JSON.parse(JSON.stringify(initialButtons))
      : JSON.parse(JSON.stringify(PRESET_MAP['Xbox 360 Chuẩn']))
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [presetSelector, setPresetSelector] = useState('Xbox 360 Chuẩn');
  const containerRef = useRef<HTMLDivElement | null>(null);
  const draggingId = useRef<string | null>(null);

  if (!isOpen) return null;

  const handlePointerDown = (id: string, e: React.PointerEvent) => {
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    draggingId.current = id;
    setSelectedId(id);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!draggingId.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = e.clientX;
    const clientY = e.clientY;

    let pctX = Math.round(((clientX - rect.left) / rect.width) * 100);
    let pctY = Math.round(((clientY - rect.top) / rect.height) * 100);

    pctX = Math.max(5, Math.min(95, pctX));
    pctY = Math.max(5, Math.min(95, pctY));

    setButtons((prev) =>
      prev.map((btn) => (btn.id === draggingId.current ? { ...btn, x: pctX, y: pctY } : btn))
    );
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (draggingId.current) {
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {}
      draggingId.current = null;
    }
  };

  const handleToggleEnable = (id: string) => {
    setButtons((prev) =>
      prev.map((btn) => (btn.id === id ? { ...btn, enabled: !btn.enabled } : btn))
    );
  };

  const handleApplyPreset = (presetName: string) => {
    if (PRESET_MAP[presetName]) {
      setPresetSelector(presetName);
      setButtons(JSON.parse(JSON.stringify(PRESET_MAP[presetName])));
      setSelectedId(null);
    }
  };

  const selectedBtn = buttons.find((b) => b.id === selectedId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-md animate-fade-in select-none">
      <div className="bg-gradient-to-b from-ice-card to-[#0d1017] border border-white/15 rounded-3xl w-full max-w-5xl max-h-[95vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
              <Gamepad2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Tùy Chỉnh Bố Cục Nút Riêng</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-amber-300 font-normal">
                  {gameTitle}
                </span>
              </h2>
              <p className="text-[11px] text-ice-muted">
                Kéo thả nút trực tiếp trên màn hình ngang để xếp vị trí thuận tay nhất của bạn
              </p>
            </div>
          </div>

          {/* Preset Buttons & Close */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/10 text-xs">
              {Object.keys(PRESET_MAP).map((pName) => (
                <button
                  key={pName}
                  type="button"
                  onClick={() => handleApplyPreset(pName)}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                    presetSelector === pName
                      ? 'bg-amber-400 text-black shadow'
                      : 'text-ice-muted hover:text-white'
                  }`}
                >
                  {pName}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-ice-muted hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Workspace: 16:9 Landscape Interactive Screen */}
        <div className="flex-1 p-4 flex flex-col items-center justify-center overflow-hidden bg-black/50">
          <div
            ref={containerRef}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            className="w-full max-w-4xl aspect-[18/9] bg-[#07090e] rounded-2xl border-2 border-dashed border-white/20 relative overflow-hidden shadow-2xl flex items-center justify-center"
            style={{ touchAction: 'none' }}
          >
            {/* Guide Grid & Center Line */}
            <div className="absolute inset-0 grid grid-cols-6 grid-rows-4 pointer-events-none opacity-10">
              {Array.from({ length: 24 }).map((_, i) => (
                <div key={i} className="border border-white/20" />
              ))}
            </div>
            <div className="absolute top-0 bottom-0 left-1/2 w-[1px] bg-white/10 pointer-events-none" />

            {/* Hint overlay */}
            <div className="absolute top-2 left-3 text-[10px] text-white/40 pointer-events-none flex items-center gap-1.5 font-mono">
              <Move className="w-3 h-3" />
              <span>Chạm và kéo nút để định vị trí • Màn hình xoay ngang điện thoại</span>
            </div>

            {/* Draggable Virtual Buttons */}
            {buttons.map((btn) => {
              const isSelected = selectedId === btn.id;
              const isHidden = !btn.enabled;

              return (
                <div
                  key={btn.id}
                  onPointerDown={(e) => handlePointerDown(btn.id, e)}
                  style={{
                    left: `${btn.x}%`,
                    top: `${btn.y}%`,
                    transform: 'translate(-50%, -50%)',
                    width: btn.size ? `${btn.size}px` : btn.type === 'joystick' ? '110px' : '55px',
                    height: btn.size ? `${btn.size}px` : btn.type === 'joystick' ? '110px' : '55px',
                  }}
                  className={`absolute rounded-full flex flex-col items-center justify-center cursor-move transition-transform active:scale-110 shadow-lg border-2 ${
                    isHidden
                      ? 'opacity-25 bg-gray-800/60 border-gray-600 text-gray-400'
                      : isSelected
                      ? 'bg-amber-400 text-black border-white shadow-amber-500/50 scale-105 z-20'
                      : 'bg-white/15 hover:bg-white/25 border-white/40 text-white z-10'
                  }`}
                >
                  <span className="font-black text-xs tracking-wider">{btn.label}</span>
                  {btn.targetKey && (
                    <span className="text-[9px] opacity-75 font-mono">
                      {btn.targetKey.replace(/Key|Digit/, '')}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer: Selected Button Properties & Actions */}
        <div className="px-6 py-3.5 border-t border-white/10 bg-white/[0.02] flex items-center justify-between flex-wrap gap-3">
          {selectedBtn ? (
            <div className="flex items-center gap-4 text-xs">
              <span className="font-bold text-white flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-amber-400" />
                Đang chọn: <b className="text-amber-400">{selectedBtn.label}</b>
              </span>
              <button
                type="button"
                onClick={() => handleToggleEnable(selectedBtn.id)}
                className={`px-3 py-1.5 rounded-lg border font-bold flex items-center gap-1.5 transition-all ${
                  selectedBtn.enabled
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                    : 'bg-red-500/20 text-red-400 border-red-500/30'
                }`}
              >
                {selectedBtn.enabled ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                <span>{selectedBtn.enabled ? 'Đang bật' : 'Đang ẩn'}</span>
              </button>
              <div className="flex items-center gap-2">
                <span className="text-ice-muted">Phím gán PC:</span>
                <input
                  type="text"
                  value={selectedBtn.targetKey || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    setButtons((prev) =>
                      prev.map((b) => (b.id === selectedBtn.id ? { ...b, targetKey: val } : b))
                    );
                  }}
                  placeholder="KeyW, Space..."
                  className="px-2 py-1 rounded bg-black/50 border border-white/20 text-white text-xs w-28 font-mono focus:border-amber-400 focus:outline-none"
                />
              </div>
            </div>
          ) : (
            <span className="text-xs text-ice-muted italic">
              Bấm vào bất kỳ nút nào trên màn hình để bật/tắt hoặc đổi phím gán.
            </span>
          )}

          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={() => handleApplyPreset('Xbox 360 Chuẩn')}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition-all flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Khôi Phục Mặc Định</span>
            </button>
            <button
              type="button"
              onClick={() => {
                onSave(buttons);
                onClose();
              }}
              className="px-6 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-black text-xs tracking-wider shadow-lg transition-all flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>Lưu Cho Game Này</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
