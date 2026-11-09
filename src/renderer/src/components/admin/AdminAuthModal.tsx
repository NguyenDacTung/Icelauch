import React, { useState, useEffect, useRef } from 'react';
import { 
  Lock, 
  Unlock, 
  KeyRound, 
  X, 
  AlertCircle, 
  Copy, 
  Check, 
  Eye, 
  EyeOff,
  Delete
} from 'lucide-react';

interface AdminAuthModalProps {
  isOpen: boolean;
  hasPinSet: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onSetPin: (pin: string) => Promise<{ success: boolean; recoveryKey: string }>;
  onVerifyPin: (pin: string) => Promise<boolean>;
  onResetPin: (recoveryKey: string, newPin: string) => Promise<boolean>;
}

export const AdminAuthModal: React.FC<AdminAuthModalProps> = ({
  isOpen,
  hasPinSet,
  onClose,
  onSuccess,
  onSetPin,
  onVerifyPin,
  onResetPin,
}) => {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [recoveryKeyInput, setRecoveryKeyInput] = useState('');
  const [newPinInput, setNewPinInput] = useState('');
  const [isResetMode, setIsResetMode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showPin, setShowPin] = useState(false);

  const verifyInputRef = useRef<HTMLInputElement>(null);
  const setPinInputRef = useRef<HTMLInputElement>(null);

  // Reset state and focus on open
  useEffect(() => {
    if (isOpen) {
      setPin('');
      setConfirmPin('');
      setRecoveryKeyInput('');
      setNewPinInput('');
      setError(null);
      setGeneratedKey(null);
      setShowPin(false);
      setTimeout(() => {
        if (!hasPinSet) {
          setPinInputRef.current?.focus();
        } else {
          verifyInputRef.current?.focus();
        }
      }, 100);
    }
  }, [isOpen, hasPinSet, isResetMode]);

  if (!isOpen) return null;

  const handleVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    if (!pin) {
      setError('Vui lòng nhập mã PIN');
      return;
    }
    const valid = await onVerifyPin(pin);
    if (valid) {
      setPin('');
      onSuccess();
      onClose();
    } else {
      setError('Mã PIN không chính xác. Vui lòng thử lại!');
    }
  };

  const handleSetInitialPin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (pin.length < 4 || pin.length > 10) {
      setError('Mã PIN phải từ 4 đến 10 chữ số');
      return;
    }
    if (pin !== confirmPin) {
      setError('Mã xác nhận PIN không khớp');
      return;
    }

    const res = await onSetPin(pin);
    if (res.success) {
      setGeneratedKey(res.recoveryKey);
    } else {
      setError('Không thể lưu mã PIN');
    }
  };

  const handleResetWithKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!recoveryKeyInput.trim()) {
      setError('Vui lòng nhập mã khôi phục');
      return;
    }
    if (newPinInput.length < 4 || newPinInput.length > 10) {
      setError('Mã PIN mới phải từ 4 đến 10 số');
      return;
    }

    const ok = await onResetPin(recoveryKeyInput.trim(), newPinInput);
    if (ok) {
      alert('Đã đổi mã PIN thành công!');
      setIsResetMode(false);
      setPin('');
      onSuccess();
      onClose();
    } else {
      setError('Mã khôi phục không đúng');
    }
  };

  const copyKey = () => {
    if (generatedKey) {
      navigator.clipboard.writeText(generatedKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // On-screen Keypad actions
  const handleKeypadPress = (val: string) => {
    if (isResetMode) {
      if (newPinInput.length < 10) setNewPinInput((prev) => prev + val);
    } else {
      if (pin.length < 10) setPin((prev) => prev + val);
    }
    setError(null);
  };

  const handleKeypadBackspace = () => {
    if (isResetMode) {
      setNewPinInput((prev) => prev.slice(0, -1));
    } else {
      setPin((prev) => prev.slice(0, -1));
    }
  };

  const handleKeypadClear = () => {
    if (isResetMode) {
      setNewPinInput('');
    } else {
      setPin('');
    }
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-ice-card border border-ice-border rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-ice-border flex items-center justify-between bg-ice-card/90">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-white tracking-wide">
              {!hasPinSet 
                ? 'Thiết lập mã PIN Admin' 
                : isResetMode 
                ? 'Khôi phục mã PIN' 
                : 'Xác thực Quyền Admin'}
            </h3>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="text-ice-subtext hover:text-white transition-colors p-1 rounded-lg hover:bg-white/5"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-ice-error/15 border border-ice-error/30 text-xs text-ice-error flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* If generatedKey is displayed after setting initial PIN */}
          {generatedKey ? (
            <div className="space-y-4">
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-xs space-y-2">
                <p className="font-semibold text-amber-300">
                  LƯU Ý QUAN TRỌNG: Mã Khôi Phục Dự Phòng
                </p>
                <p className="text-ice-subtext leading-relaxed">
                  Hãy sao chép và lưu lại mã này ở nơi an toàn. Bạn sẽ cần mã này nếu quên PIN Admin:
                </p>
                <div className="flex items-center justify-between bg-black/50 p-2 rounded border border-ice-border font-mono text-sm text-white font-bold tracking-widest">
                  <span>{generatedKey}</span>
                  <button
                    onClick={copyKey}
                    className="p-1 rounded hover:bg-ice-card text-ice-subtext hover:text-white transition-colors"
                    title="Sao chép"
                  >
                    {copied ? <Check className="w-4 h-4 text-ice-success" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setGeneratedKey(null);
                  onSuccess();
                  onClose();
                }}
                className="w-full h-10 rounded-xl bg-ice-accent hover:bg-ice-accentHover text-white text-xs font-bold tracking-wide transition-colors"
              >
                Tôi đã lưu, tiếp tục vào Admin
              </button>
            </div>
          ) : !hasPinSet ? (
            /* First time set PIN form */
            <form onSubmit={handleSetInitialPin} className="space-y-4">
              <p className="text-xs text-ice-subtext">
                Khởi tạo mã PIN (4-10 chữ số) để bảo vệ quyền thêm, sửa, xoá game và nội dung giải trí.
              </p>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-white">Mã PIN mới (4-10 số)</label>
                <div className="relative">
                  <input
                    ref={setPinInputRef}
                    type={showPin ? 'text' : 'password'}
                    inputMode="numeric"
                    maxLength={10}
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="••••••••"
                    style={{ userSelect: 'text' }}
                    className="select-text w-full h-11 rounded-xl bg-ice-bg border border-ice-border px-4 text-center text-xl tracking-widest text-white focus:outline-none focus:border-amber-400 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-ice-subtext hover:text-white p-1"
                    tabIndex={-1}
                  >
                    {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-white">Xác nhận mã PIN</label>
                <input
                  type={showPin ? 'text' : 'password'}
                  inputMode="numeric"
                  maxLength={10}
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="••••••••"
                  style={{ userSelect: 'text' }}
                  className="select-text w-full h-11 rounded-xl bg-ice-bg border border-ice-border px-4 text-center text-xl tracking-widest text-white focus:outline-none focus:border-amber-400 font-mono"
                />
              </div>

              {/* On-screen Keypad */}
              <div className="grid grid-cols-3 gap-1.5 pt-1">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => {
                      if (pin.length < 10) setPin((prev) => prev + num.toString());
                    }}
                    className="h-10 rounded-lg bg-ice-bg/80 border border-ice-border hover:bg-ice-hover text-white font-bold text-sm transition-all active:scale-95 flex items-center justify-center"
                  >
                    {num}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setPin('')}
                  className="h-10 rounded-lg bg-ice-bg/80 border border-ice-border hover:bg-ice-hover text-ice-subtext hover:text-white text-xs font-medium transition-all flex items-center justify-center"
                >
                  Xóa
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (pin.length < 10) setPin((prev) => prev + '0');
                  }}
                  className="h-10 rounded-lg bg-ice-bg/80 border border-ice-border hover:bg-ice-hover text-white font-bold text-sm transition-all active:scale-95 flex items-center justify-center"
                >
                  0
                </button>
                <button
                  type="button"
                  onClick={() => setPin((prev) => prev.slice(0, -1))}
                  className="h-10 rounded-lg bg-ice-bg/80 border border-ice-border hover:bg-ice-hover text-ice-subtext hover:text-white text-xs font-medium transition-all flex items-center justify-center"
                >
                  ⌫
                </button>
              </div>

              <button
                type="submit"
                className="w-full h-11 rounded-xl bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs tracking-wide transition-colors uppercase shadow-lg shadow-amber-950/20"
              >
                KÍCH HOẠT MÃ PIN
              </button>
            </form>
          ) : isResetMode ? (
            /* Reset PIN with Recovery Key form */
            <form onSubmit={handleResetWithKey} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-white">Mã khôi phục (Recovery Key)</label>
                <input
                  type="text"
                  value={recoveryKeyInput}
                  onChange={(e) => setRecoveryKeyInput(e.target.value)}
                  placeholder="ICE-XXXX-XXXX-XXXX"
                  style={{ userSelect: 'text' }}
                  className="select-text w-full h-10 rounded-xl bg-ice-bg border border-ice-border px-3 text-xs text-white focus:outline-none focus:border-amber-400 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-white">Mã PIN mới (4-10 số)</label>
                <div className="relative">
                  <input
                    type={showPin ? 'text' : 'password'}
                    inputMode="numeric"
                    maxLength={10}
                    value={newPinInput}
                    onChange={(e) => setNewPinInput(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="••••••••"
                    style={{ userSelect: 'text' }}
                    className="select-text w-full h-11 rounded-xl bg-ice-bg border border-ice-border px-4 text-center text-xl tracking-widest text-white focus:outline-none focus:border-amber-400 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-ice-subtext hover:text-white p-1"
                    tabIndex={-1}
                  >
                    {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* On-screen Keypad */}
              <div className="grid grid-cols-3 gap-1.5 pt-1">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => handleKeypadPress(num.toString())}
                    className="h-10 rounded-lg bg-ice-bg/80 border border-ice-border hover:bg-ice-hover text-white font-bold text-sm transition-all active:scale-95 flex items-center justify-center"
                  >
                    {num}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={handleKeypadClear}
                  className="h-10 rounded-lg bg-ice-bg/80 border border-ice-border hover:bg-ice-hover text-ice-subtext hover:text-white text-xs font-medium transition-all flex items-center justify-center"
                >
                  Xóa
                </button>
                <button
                  type="button"
                  onClick={() => handleKeypadPress('0')}
                  className="h-10 rounded-lg bg-ice-bg/80 border border-ice-border hover:bg-ice-hover text-white font-bold text-sm transition-all active:scale-95 flex items-center justify-center"
                >
                  0
                </button>
                <button
                  type="button"
                  onClick={handleKeypadBackspace}
                  className="h-10 rounded-lg bg-ice-bg/80 border border-ice-border hover:bg-ice-hover text-ice-subtext hover:text-white text-xs font-medium transition-all flex items-center justify-center"
                >
                  ⌫
                </button>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsResetMode(false)}
                  className="flex-1 h-10 rounded-xl bg-ice-bg border border-ice-border text-ice-subtext hover:text-white text-xs font-medium"
                >
                  Quay lại
                </button>
                <button
                  type="submit"
                  className="flex-1 h-10 rounded-xl bg-amber-500 hover:bg-amber-600 text-black text-xs font-bold uppercase"
                >
                  Đổi mã PIN
                </button>
              </div>
            </form>
          ) : (
            /* Normal PIN Verification form */
            <form onSubmit={handleVerify} className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-white">Nhập mã PIN Admin</label>
                  <span className="text-[11px] text-ice-subtext">4-10 số</span>
                </div>

                {/* Input box with eye toggle */}
                <div className="relative">
                  <input
                    ref={verifyInputRef}
                    type={showPin ? 'text' : 'password'}
                    inputMode="numeric"
                    maxLength={10}
                    value={pin}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                      setPin(val);
                      setError(null);
                    }}
                    placeholder="••••••••"
                    style={{ userSelect: 'text' }}
                    className="select-text w-full h-12 rounded-xl bg-ice-bg border border-ice-border px-4 text-center text-2xl tracking-[0.3em] text-white focus:outline-none focus:border-amber-400 font-mono shadow-inner"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-ice-subtext hover:text-white p-1.5 transition-colors"
                    title={showPin ? 'Ẩn mã PIN' : 'Hiện mã PIN'}
                    tabIndex={-1}
                  >
                    {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* PIN dots status indicator (up to 10 digits) */}
                <div className="flex items-center justify-center gap-1.5 pt-1.5 pb-0.5">
                  {Array.from({ length: 10 }).map((_, idx) => (
                    <div
                      key={idx}
                      className={`w-2 h-2 rounded-full transition-all duration-200 ${
                        idx < pin.length
                          ? 'bg-amber-400 scale-125 shadow-[0_0_6px_rgba(251,191,36,0.8)]'
                          : 'bg-white/15'
                      }`}
                    />
                  ))}
                </div>
                <div className="text-center text-[11px] text-ice-muted font-mono pt-0.5">
                  {pin.length > 0 ? `Đã nhập: ${pin.length}/10 số (Tối thiểu 4 số)` : 'Nhập mã PIN từ 4 đến 10 chữ số'}
                </div>
              </div>

              {/* On-screen Keypad */}
              <div className="grid grid-cols-3 gap-1.5 pt-1">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => handleKeypadPress(num.toString())}
                    className="h-11 rounded-xl bg-ice-bg/90 border border-ice-border/80 hover:bg-ice-hover hover:border-amber-400/50 text-white font-bold text-base transition-all active:scale-95 flex items-center justify-center shadow-sm"
                  >
                    {num}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={handleKeypadClear}
                  className="h-11 rounded-xl bg-ice-bg/90 border border-ice-border/80 hover:bg-ice-hover text-ice-subtext hover:text-white text-xs font-semibold transition-all flex items-center justify-center"
                >
                  Xóa
                </button>
                <button
                  type="button"
                  onClick={() => handleKeypadPress('0')}
                  className="h-11 rounded-xl bg-ice-bg/90 border border-ice-border/80 hover:bg-ice-hover hover:border-amber-400/50 text-white font-bold text-base transition-all active:scale-95 flex items-center justify-center shadow-sm"
                >
                  0
                </button>
                <button
                  type="button"
                  onClick={handleKeypadBackspace}
                  className="h-11 rounded-xl bg-ice-bg/90 border border-ice-border/80 hover:bg-ice-hover text-ice-subtext hover:text-white text-xs font-semibold transition-all flex items-center justify-center"
                >
                  ⌫
                </button>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={pin.length < 4}
                className="w-full h-11 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-40 disabled:pointer-events-none text-black font-extrabold text-xs tracking-wider uppercase transition-all shadow-lg shadow-amber-950/30 flex items-center justify-center gap-2"
              >
                <Unlock className="w-4 h-4" />
                <span>MỞ KHOÁ ADMIN</span>
              </button>

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setIsResetMode(true);
                  }}
                  className="text-[11px] text-ice-subtext hover:text-amber-400 transition-colors underline"
                >
                  Quên mã PIN? Khôi phục bằng Recovery Key
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
