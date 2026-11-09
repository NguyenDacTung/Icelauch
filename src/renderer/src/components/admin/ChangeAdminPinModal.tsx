import React, { useState } from 'react';
import { 
  KeyRound, 
  X, 
  Check, 
  ShieldCheck, 
  AlertCircle, 
  Eye, 
  EyeOff,
  Lock
} from 'lucide-react';
import { sfx } from '../../utils/sfx';

interface ChangeAdminPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ChangeAdminPinModal: React.FC<ChangeAdminPinModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmNewPin, setConfirmNewPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPins, setShowPins] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!currentPin) {
      setError('Vui lòng nhập mã PIN Admin hiện tại');
      return;
    }

    if (newPin.length < 4 || newPin.length > 10) {
      setError('Mã PIN mới phải từ 4 đến 10 chữ số');
      return;
    }

    if (!/^\d+$/.test(newPin)) {
      setError('Mã PIN chỉ được chứa các chữ số (0-9)');
      return;
    }

    if (newPin !== confirmNewPin) {
      setError('Xác nhận mã PIN mới không trùng khớp');
      return;
    }

    try {
      setLoading(true);
      if (window.api?.changeAdminPin) {
        const res = await window.api.changeAdminPin(currentPin, newPin);
        if (res.success) {
          sfx.playSuccess();
          alert('✓ Đã cập nhật mã PIN Admin (PIN_PUB) thành công!');
          onSuccess();
          onClose();
        } else {
          sfx.playError();
          setError(res.error || 'Mã PIN hiện tại không chính xác');
        }
      }
    } catch (err: any) {
      sfx.playError();
      setError(err?.message || 'Có lỗi xảy ra khi đổi mã PIN');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in select-none">
      <div className="bg-[#14171F] border border-ice-border rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-ice-border/60 flex items-center justify-between bg-[#181B24]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-wide">
                Đổi Mã PIN Quản Trị (Admin)
              </h3>
              <p className="text-[11px] text-ice-subtext">Cập nhật mã PIN_PUB của hệ thống</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-ice-subtext hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Current PIN */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-amber-400 uppercase tracking-wider block">
              Mã PIN Admin hiện tại *
            </label>
            <input
              type={showPins ? 'text' : 'password'}
              inputMode="numeric"
              value={currentPin}
              onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, '').slice(0, 10))}
              placeholder="Nhập PIN_PUB hoặc PIN_PRI"
              maxLength={10}
              required
              autoFocus
              className="w-full h-10 px-3.5 rounded-xl bg-black/40 border border-ice-border text-sm text-white tracking-widest focus:outline-none focus:border-amber-400 font-mono transition-colors"
            />
            <span className="text-[10px] text-ice-subtext block">
              Bắt buộc phải biết mã PIN hiện tại (PIN_PUB hoặc PIN_PRI gốc) mới được đổi.
            </span>
          </div>

          <div className="h-px bg-ice-border/40 my-2" />

          {/* New PIN */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-ice-subtext uppercase tracking-wider block">
              Mã PIN Admin mới (4 - 10 chữ số) *
            </label>
            <input
              type={showPins ? 'text' : 'password'}
              inputMode="numeric"
              value={newPin}
              onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 10))}
              placeholder="Nhập 4 đến 10 số mới"
              maxLength={10}
              required
              className="w-full h-10 px-3.5 rounded-xl bg-black/40 border border-ice-border text-sm text-white tracking-widest focus:outline-none focus:border-ice-accent font-mono transition-colors"
            />
          </div>

          {/* Confirm New PIN */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-ice-subtext uppercase tracking-wider block">
              Xác nhận mã PIN Admin mới *
            </label>
            <input
              type={showPins ? 'text' : 'password'}
              inputMode="numeric"
              value={confirmNewPin}
              onChange={(e) => setConfirmNewPin(e.target.value.replace(/\D/g, '').slice(0, 10))}
              placeholder="Nhập lại mã PIN mới"
              maxLength={10}
              required
              className="w-full h-10 px-3.5 rounded-xl bg-black/40 border border-ice-border text-sm text-white tracking-widest focus:outline-none focus:border-ice-accent font-mono transition-colors"
            />
          </div>

          {/* Show / Hide PIN Toggle */}
          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={() => setShowPins(!showPins)}
              className="text-xs text-ice-subtext hover:text-white flex items-center gap-1.5 transition-colors"
            >
              {showPins ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              <span>{showPins ? 'Ẩn ký tự PIN' : 'Hiện số PIN đang nhập'}</span>
            </button>
          </div>

          {/* Security Notice */}
          <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-[11px] text-blue-300 leading-relaxed space-y-1">
            <span className="font-bold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
              Cơ chế an toàn 2 lớp:
            </span>
            <p>
              Thao tác này chỉ thay đổi mã <strong>PIN_PUB</strong>. Mã PIN Gốc dự phòng (<strong>PIN_PRI</strong>) trong mã nguồn luôn bất biến và luôn có thể dùng để mở quyền Admin.
            </p>
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors"
            >
              Huỷ
            </button>
            <button
              type="submit"
              disabled={loading || !currentPin || newPin.length < 4}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black text-xs font-black tracking-wider uppercase flex items-center gap-1.5 shadow-lg shadow-amber-950/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>{loading ? 'Đang lưu...' : 'Lưu Mã PIN Mới'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

