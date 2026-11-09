import React, { useState } from 'react';
import { 
  Gamepad2, 
  KeyRound, 
  HardDrive, 
  Cloud, 
  Sparkles, 
  Check, 
  Copy, 
  ArrowRight,
  ShieldCheck,
  FolderOpen
} from 'lucide-react';

interface FirstRunModalProps {
  isOpen: boolean;
  appRootPath: string;
  onComplete: (loadDemo: boolean) => void;
  onSetPin: (pin: string) => Promise<{ success: boolean; recoveryKey: string }>;
  onOpenFolder: (target: 'app') => void;
}

export const FirstRunModal: React.FC<FirstRunModalProps> = ({
  isOpen,
  appRootPath,
  onComplete,
  onSetPin,
  onOpenFolder,
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1: PIN
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [recoveryKey, setRecoveryKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customGamesFolder, setCustomGamesFolder] = useState<string>('');

  if (!isOpen) return null;

  const handleCreatePin = async () => {
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
      setRecoveryKey(res.recoveryKey);
    } else {
      setError('Không thể lưu mã PIN');
    }
  };

  const handleCopyKey = () => {
    if (recoveryKey) {
      navigator.clipboard.writeText(recoveryKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 select-none">
      <div className="bg-ice-card border border-ice-border rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col">
        {/* Top Header with Stepper */}
        <div className="p-6 border-b border-ice-border bg-gradient-to-r from-ice-accent/15 via-transparent to-transparent">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-ice-accent/20 border border-ice-accent/40 flex items-center justify-center text-ice-accent font-bold">
                <Gamepad2 className="w-5 h-5" />
              </div>
              <h2 className="text-base font-bold text-white tracking-wide">
                Chào mừng đến với Icelauch
              </h2>
            </div>
            <span className="text-xs font-semibold text-ice-accent bg-ice-accent/15 px-2.5 py-1 rounded-full border border-ice-accent/30">
              Bước {step} / 3
            </span>
          </div>

          {/* Stepper Dots */}
          <div className="grid grid-cols-3 gap-2">
            <div className={`h-1.5 rounded-full transition-all ${step >= 1 ? 'bg-ice-accent' : 'bg-ice-border'}`} />
            <div className={`h-1.5 rounded-full transition-all ${step >= 2 ? 'bg-ice-accent' : 'bg-ice-border'}`} />
            <div className={`h-1.5 rounded-full transition-all ${step >= 3 ? 'bg-ice-accent' : 'bg-ice-border'}`} />
          </div>
        </div>

        {/* Step Body */}
        <div className="p-6 text-xs text-ice-text space-y-5">
          {/* STEP 1: Set Admin PIN */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-amber-400" />
                  Bước 1: Thiết lập mã PIN Quản trị (Admin)
                </h3>
                <p className="text-ice-subtext mt-1 leading-relaxed">
                  Icelauch phân quyền người dùng và Admin bằng mã PIN. Chỉ Admin mới có quyền thêm/sửa game, link và mật khẩu.
                </p>
              </div>

              {error && (
                <div className="p-2.5 rounded bg-ice-error/15 border border-ice-error/30 text-xs text-ice-error">
                  {error}
                </div>
              )}

              {recoveryKey ? (
                <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-3">
                  <div className="flex items-center gap-2 text-amber-300 font-bold">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Mã khôi phục dự phòng của bạn</span>
                  </div>
                  <p className="text-[11px] text-ice-subtext leading-relaxed">
                    Hãy lưu mã này vào nơi an toàn. Bạn sẽ cần mã này nếu quên PIN Admin:
                  </p>
                  <div className="flex items-center justify-between bg-black/60 p-2.5 rounded-lg border border-ice-border font-mono text-sm text-white font-bold tracking-widest">
                    <span>{recoveryKey}</span>
                    <button
                      onClick={handleCopyKey}
                      className="px-2 py-1 rounded bg-ice-card hover:bg-ice-hover text-ice-subtext hover:text-white transition-colors flex items-center gap-1 text-xs"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-ice-success" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? 'Đã chép' : 'Chép'}</span>
                    </button>
                  </div>
                  <button
                    onClick={() => setStep(2)}
                    className="w-full h-9 rounded bg-ice-accent hover:bg-ice-accentHover text-white text-xs font-bold tracking-wide flex items-center justify-center gap-2 mt-2"
                  >
                    <span>Tiếp tục bước 2</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-white">Mã PIN (4-10 số)</label>
                    <input
                      type="password"
                      maxLength={10}
                      autoFocus
                      value={pin}
                      onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder="••••••••"
                      className="w-full h-10 rounded bg-ice-bg border border-ice-border px-3 text-center text-lg tracking-widest text-white font-mono focus:outline-none focus:border-ice-accent"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-white">Xác nhận mã PIN</label>
                    <input
                      type="password"
                      maxLength={10}
                      value={confirmPin}
                      onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder="••••••••"
                      className="w-full h-10 rounded bg-ice-bg border border-ice-border px-3 text-center text-lg tracking-widest text-white font-mono focus:outline-none focus:border-ice-accent"
                    />
                  </div>

                  {/* PIN dots status indicator (10 digits) */}
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
                  <div className="text-center text-[10px] text-ice-muted font-mono">
                    {pin.length > 0 ? `Đã nhập: ${pin.length}/10 số (Tối thiểu 4 số)` : 'Nhập mã PIN từ 4 đến 10 chữ số'}
                  </div>

                  <button
                    onClick={handleCreatePin}
                    className="w-full h-10 rounded bg-ice-accent hover:bg-ice-accentHover text-white text-xs font-bold tracking-wider uppercase flex items-center justify-center gap-2 transition-colors mt-2"
                  >
                    <span>Lưu PIN & Tạo mã khôi phục</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: Storage Directory */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-ice-accent" />
                  Bước 2: Vị trí lưu trữ Game & Dữ liệu
                </h3>
                <p className="text-ice-subtext mt-1 leading-relaxed">
                  Icelauch được thiết kế dạng <strong>Portable độc lập</strong>. Mọi game, file tải về và cài đặt nằm trọn trong thư mục này:
                </p>
              </div>

              <div className="p-3 bg-ice-bg border border-ice-border rounded-xl space-y-2">
                <p className="text-xs font-semibold text-white">Thư mục app của bạn:</p>
                <p className="font-mono text-[11px] text-amber-300 bg-black/40 p-2 rounded border border-ice-border truncate">
                  {appRootPath}
                </p>
                <p className="text-[11px] text-ice-subtext leading-relaxed">
                  Bạn có thể di chuyển cả thư mục Icelauch sang ổ cứng khác bất kỳ lúc nào mà không làm mất game hay dữ liệu lưu.
                </p>
              </div>

              {/* Optional Custom Games Install Folder */}
              <div className="p-3 bg-ice-bg border border-ice-border rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-white">Thư mục cài đặt game mặc định:</p>
                  <button
                    type="button"
                    onClick={async () => {
                      const folder = await window.api?.browseFolder({
                        title: 'Chọn thư mục cài game (trên bất kỳ ổ đĩa C:, D:, E:...)',
                        defaultPath: customGamesFolder || `${appRootPath}\\Games`,
                      });
                      if (folder) {
                        setCustomGamesFolder(folder);
                        window.api?.saveSettings({ defaultGamesInstallPath: folder });
                      }
                    }}
                    className="text-[11px] text-amber-400 hover:underline font-semibold"
                  >
                    Đổi ổ khác (D:, E:...)
                  </button>
                </div>
                <p className="font-mono text-[11px] text-emerald-400 bg-black/40 p-2 rounded border border-ice-border truncate">
                  {customGamesFolder || `${appRootPath}\\Games`}
                </p>
                <p className="text-[10px] text-ice-muted leading-relaxed">
                  Nếu ổ cài app sắp đầy, bạn có thể chọn một thư mục trên ổ đĩa khác. Game lưu ở các ổ khác nhau vẫn hoạt động hoàn toàn giống nhau và bạn có thể thay đổi lại trong Cài Đặt.
                </p>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => onOpenFolder('app')}
                  className="flex-1 h-9 rounded bg-ice-card hover:bg-ice-hover border border-ice-border text-white text-xs font-medium flex items-center justify-center gap-2"
                >
                  <FolderOpen className="w-4 h-4 text-amber-400" />
                  <span>Mở xem thư mục</span>
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="flex-1 h-9 rounded bg-ice-accent hover:bg-ice-accentHover text-white text-xs font-bold flex items-center justify-center gap-2"
                >
                  <span>Tiếp tục bước 3</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Google Drive & Ready */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Cloud className="w-4 h-4 text-ice-accent" />
                  Bước 3: Google Drive & Trải nghiệm Ban đầu
                </h3>
                <p className="text-ice-subtext mt-1 leading-relaxed">
                  Ứng dụng hỗ trợ tải trực tiếp qua Link Google Drive công khai. Bạn cũng có thể liên kết tài khoản Google trong mục Cài đặt bất kỳ lúc nào.
                </p>
              </div>

              <div className="p-4 bg-ice-accent/10 border border-ice-accent/30 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-ice-accent font-bold">
                  <Sparkles className="w-4 h-4" />
                  <span>Dữ liệu mẫu trải nghiệm (Khuyên dùng)</span>
                </div>
                <p className="text-[11px] text-ice-text/90 leading-relaxed">
                  Bạn có muốn nạp sẵn vài game mẫu và bài hát/video để trải nghiệm ngay giao diện, trình phát phim/nhạc và tính năng của Icelauch không?
                </p>
              </div>

              <div className="space-y-2 pt-2">
                <button
                  onClick={() => onComplete(true)}
                  className="w-full h-10 rounded bg-ice-accent hover:bg-ice-accentHover text-white text-xs font-bold tracking-wider uppercase flex items-center justify-center gap-2 shadow-lg transition-colors"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Nạp dữ liệu mẫu & Khám phá ngay</span>
                </button>

                <button
                  onClick={() => onComplete(false)}
                  className="w-full h-9 rounded bg-ice-bg hover:bg-ice-hover border border-ice-border text-ice-subtext hover:text-white text-xs font-medium flex items-center justify-center transition-colors"
                >
                  Bắt đầu với thư viện trống
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

