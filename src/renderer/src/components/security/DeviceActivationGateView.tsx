import React, { useState, useEffect } from 'react';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  Lock,
  Smartphone,
  Laptop,
  Tv,
  KeyRound,
  Copy,
  Check,
  RefreshCw,
  AlertCircle,
  Timer,
  CheckCircle2,
  Send,
  X
} from 'lucide-react';
import type { AuthorizedDevice, DeviceApprovalStatus } from '../../types';
import type { DeviceType } from '../../utils/deviceDetector';
import {
  getDeviceApprovalStatus,
  registerDeviceRequest,
  verifyDeviceOtp,
  bypassApproveDeviceWithAdminPin,
  STORAGE_KEY_DEVICE_NAME
} from '../../services/deviceAuth';

interface DeviceActivationGateViewProps {
  deviceId: string;
  deviceType: DeviceType;
  onActivated: () => void;
  onAdminBypass: () => void;
}

export const DeviceActivationGateView: React.FC<DeviceActivationGateViewProps> = ({
  deviceId,
  deviceType,
  onActivated,
  onAdminBypass,
}) => {
  const [deviceInfo, setDeviceInfo] = useState<AuthorizedDevice | null>(null);
  const [status, setStatus] = useState<DeviceApprovalStatus | 'unregistered' | 'loading'>('loading');
  const [isOffline, setIsOffline] = useState(false);

  // Form states
  const [deviceName, setDeviceName] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY_DEVICE_NAME) || '';
    } catch {
      return '';
    }
  });
  const [isSubmittingName, setIsSubmittingName] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpSecondsLeft, setOtpSecondsLeft] = useState<number | null>(null);
  const [copiedId, setCopiedId] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Admin Emergency Bypass Modal
  const [showAdminBypass, setShowAdminBypass] = useState(false);
  const [adminPinInput, setAdminPinInput] = useState('');
  const [isBypassing, setIsBypassing] = useState(false);
  const [bypassError, setBypassError] = useState<string | null>(null);

  // Load device status on mount
  const checkStatus = async () => {
    try {
      const res = await getDeviceApprovalStatus(deviceId);
      setStatus(res.status);
      setIsOffline(Boolean(res.isOffline));
      if (res.device) {
        setDeviceInfo(res.device);
        if (res.device.deviceName && !deviceName) {
          setDeviceName(res.device.deviceName);
        }
      }
      if (res.status === 'approved') {
        onActivated();
      }
    } catch (e) {
      console.warn('Error checking device status:', e);
    }
  };

  useEffect(() => {
    checkStatus();
    // Poll status periodically (every 4 seconds) to auto-unlock when Admin approves or generates OTP
    const interval = setInterval(() => {
      checkStatus();
    }, 4000);
    return () => clearInterval(interval);
  }, [deviceId]);

  // Handle OTP Countdown Timer
  useEffect(() => {
    if (!deviceInfo?.otpExpiresAt) {
      setOtpSecondsLeft(null);
      return;
    }

    const updateTimer = () => {
      const remaining = Math.max(0, Math.floor((new Date(deviceInfo.otpExpiresAt!).getTime() - Date.now()) / 1000));
      setOtpSecondsLeft(remaining);
    };

    updateTimer();
    const timer = setInterval(updateTimer, 1000);
    return () => clearInterval(timer);
  }, [deviceInfo?.otpExpiresAt]);

  const handleCopyId = () => {
    navigator.clipboard.writeText(deviceId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  // Submit device name & send request
  const handleRegisterRequest = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!deviceName.trim()) {
      setErrorMessage('Vui lòng nhập tên thiết bị gợi nhớ (Ví dụ: Laptop Tuấn, Điện thoại Nam)');
      return;
    }

    setIsSubmittingName(true);
    setErrorMessage(null);
    try {
      const res = await registerDeviceRequest(deviceId, deviceName.trim(), deviceType);
      if (res.success && res.device) {
        setDeviceInfo(res.device);
        setStatus('pending');
        setSuccessMessage('Đã gửi yêu cầu phê duyệt thành công! Vui lòng liên hệ Admin để nhận mã OTP 4 số.');
      } else {
        setErrorMessage(res.error || 'Lỗi gửi yêu cầu phê duyệt');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Không thể kết nối máy chủ Supabase');
    } finally {
      setIsSubmittingName(false);
    }
  };

  // Verify 4-digit OTP
  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (otpInput.trim().length !== 4) {
      setErrorMessage('Vui lòng nhập đủ 4 chữ số OTP');
      return;
    }

    setIsVerifyingOtp(true);
    setErrorMessage(null);
    try {
      const res = await verifyDeviceOtp(deviceId, otpInput.trim());
      if (res.success) {
        setStatus('approved');
        setSuccessMessage('Kích hoạt thiết bị thành công! Đang chuyển vào ứng dụng...');
        setTimeout(() => {
          onActivated();
        }, 800);
      } else {
        setErrorMessage(res.error || 'Mã OTP không hợp lệ hoặc đã hết hạn');
        setOtpInput('');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Lỗi xác minh mã OTP');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  // Emergency Admin Bypass
  const handleAdminBypassSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminPinInput.trim()) {
      setBypassError('Vui lòng nhập mã PIN Admin');
      return;
    }

    setIsBypassing(true);
    setBypassError(null);
    try {
      const res = await bypassApproveDeviceWithAdminPin(
        deviceId,
        deviceName || 'Master Admin Device',
        deviceType,
        adminPinInput.trim()
      );

      if (res.success) {
        setShowAdminBypass(false);
        onAdminBypass();
      } else {
        setBypassError(res.error || 'Mã PIN Admin không chính xác');
        setAdminPinInput('');
      }
    } catch (err: any) {
      setBypassError(err?.message || 'Lỗi xác minh Master PIN');
    } finally {
      setIsBypassing(false);
    }
  };

  const getPlatformIcon = () => {
    if (deviceType === 'windows_pc') return <Laptop className="w-5 h-5 text-cyan-400" />;
    if (deviceType === 'android_tv') return <Tv className="w-5 h-5 text-amber-400" />;
    return <Smartphone className="w-5 h-5 text-emerald-400" />;
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#0B0D11] text-white p-4 select-none overflow-y-auto">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Main Container Card */}
      <div className="relative w-full max-w-md bg-[#131720]/90 border border-white/10 rounded-2xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl space-y-6">
        {/* Top Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 text-cyan-400 mb-2">
            {status === 'approved' ? (
              <ShieldCheck className="w-7 h-7 text-emerald-400" />
            ) : status === 'revoked' ? (
              <ShieldAlert className="w-7 h-7 text-rose-500" />
            ) : (
              <Shield className="w-7 h-7" />
            )}
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Xác Thực Thiết Bị Phần Cứng
          </h1>
          <p className="text-xs sm:text-sm text-ice-subtext leading-relaxed">
            Ứng dụng cá nhân nghiên cứu & thử nghiệm. Bạn cần sự cho phép của Quản Trị Viên để sử dụng trên thiết bị này.
          </p>
        </div>

        {/* Device ID Badge */}
        <div className="bg-black/40 border border-white/10 rounded-xl p-3 flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2 overflow-hidden mr-2">
            {getPlatformIcon()}
            <div className="truncate">
              <span className="text-ice-muted text-[10px] block uppercase font-sans">Mã Phần Cứng (Device ID):</span>
              <span className="text-white font-bold tracking-wider">{deviceId}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={handleCopyId}
            className="flex-shrink-0 px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-ice-subtext hover:text-white transition-colors flex items-center gap-1"
            title="Sao chép Device ID"
          >
            {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="text-[11px] font-sans">{copiedId ? 'Đã chép' : 'Chép'}</span>
          </button>
        </div>

        {/* Messages */}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2 animate-fade-in">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}
        {successMessage && (
          <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* STEP 1: If Unregistered or Revoked, Name Form */}
        {(status === 'unregistered' || status === 'revoked' || (!deviceInfo?.otpCode && status === 'pending')) && (
          <form onSubmit={handleRegisterRequest} className="space-y-4">
            {status === 'revoked' && (
              <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-200 text-xs">
                ⚠️ Quyền truy cập của thiết bị này trước đây đã bị thu hồi. Bạn có thể gửi lại yêu cầu để Admin xem xét.
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-ice-subtext uppercase tracking-wider block">
                Tên Thiết Bị Gợi Nhớ Của Bạn:
              </label>
              <input
                type="text"
                value={deviceName}
                onChange={(e) => setDeviceName(e.target.value)}
                placeholder="Ví dụ: Laptop Tuấn, Điện thoại Nam..."
                className="w-full h-11 px-3.5 rounded-xl bg-black/50 border border-white/15 text-sm text-white placeholder-ice-muted focus:border-cyan-400 focus:outline-none transition-colors"
                disabled={isSubmittingName}
              />
            </div>

            <button
              type="submit"
              disabled={isSubmittingName || !deviceName.trim()}
              className="w-full h-11 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-medium text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 disabled:opacity-50 transition-all cursor-pointer"
            >
              {isSubmittingName ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Đang gửi yêu cầu...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>{status === 'pending' ? 'Cập Nhật Tên Thiết Bị' : 'Gửi Yêu Cầu Phê Duyệt'}</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* STEP 2: Pending & Admin generated OTP (or user input box) */}
        {status === 'pending' && (
          <div className="space-y-4 pt-2 border-t border-white/10">
            <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-cyan-300 flex items-center gap-1.5">
                  <KeyRound className="w-4 h-4" />
                  Nhập Mã OTP Từ Admin
                </span>
                {otpSecondsLeft !== null && (
                  <span className={`text-xs font-mono font-bold flex items-center gap-1 ${otpSecondsLeft > 30 ? 'text-cyan-400' : 'text-rose-400 animate-pulse'}`}>
                    <Timer className="w-3.5 h-3.5" />
                    {formatTimer(otpSecondsLeft)}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-ice-subtext">
                Admin sẽ nhận được thông báo yêu cầu của bạn và gửi cho bạn mã <strong>OTP gồm 4 chữ số</strong> (tồn tại trong 2 phút).
              </p>
            </div>

            <form onSubmit={handleVerifyOtp} className="space-y-3">
              <div className="flex justify-center">
                <input
                  type="text"
                  maxLength={4}
                  value={otpInput}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                    setOtpInput(val);
                    setErrorMessage(null);
                    if (val.length === 4) {
                      // Auto submit when 4 digits typed
                      setTimeout(() => {
                        handleVerifyOtp();
                      }, 100);
                    }
                  }}
                  placeholder="----"
                  className="w-48 h-14 text-center text-3xl font-mono tracking-[0.5em] rounded-xl bg-black/60 border border-cyan-500/50 text-cyan-300 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all font-bold"
                  autoFocus
                />
              </div>

              <button
                type="submit"
                disabled={isVerifyingOtp || otpInput.trim().length !== 4}
                className="w-full h-11 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-medium text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 disabled:opacity-50 transition-all cursor-pointer"
              >
                {isVerifyingOtp ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Đang xác minh...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Kích Hoạt Thiết Bị Ngay</span>
                  </>
                )}
              </button>
            </form>

            <div className="text-center">
              <button
                type="button"
                onClick={checkStatus}
                className="text-[11px] text-ice-subtext hover:text-cyan-400 transition-colors inline-flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                Kiểm tra lại trạng thái
              </button>
            </div>
          </div>
        )}

        {/* Footer info & Discreet Emergency Admin Bypass */}
        <div className="pt-4 border-t border-white/5 flex items-center justify-between text-[11px] text-ice-muted">
          <span>{isOffline ? '⚡ Chế độ ngoại tuyến' : '🟢 Supabase Cloud Active'}</span>
          
          {/* Subtle Emergency Lock button for Owner */}
          <button
            type="button"
            onClick={() => setShowAdminBypass(true)}
            className="p-1.5 rounded-lg text-white/30 hover:text-amber-400 hover:bg-white/5 transition-colors"
            title="Dành riêng cho Chủ sở hữu (Admin Master PIN)"
          >
            <Lock className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Emergency Admin Master PIN Modal */}
      {showAdminBypass && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="w-full max-w-sm bg-[#181D28] border border-amber-500/30 rounded-2xl p-6 shadow-2xl space-y-4 animate-scale-up">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                <Lock className="w-4 h-4" />
                <span>Xác Thực Chủ Sở Hữu (Admin)</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowAdminBypass(false);
                  setBypassError(null);
                  setAdminPinInput('');
                }}
                className="text-ice-muted hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-ice-subtext leading-relaxed">
              Nếu đây là máy của bạn, hãy nhập <strong>Master PIN Admin</strong> để tự động cấp quyền mở khóa thiết bị này và vào thẳng giao diện Quản Trị.
            </p>

            {bypassError && (
              <div className="p-2.5 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs">
                {bypassError}
              </div>
            )}

            <form onSubmit={handleAdminBypassSubmit} className="space-y-3.5">
              <input
                type="password"
                value={adminPinInput}
                onChange={(e) => setAdminPinInput(e.target.value)}
                placeholder="Nhập mã PIN Admin..."
                className="w-full h-11 px-3.5 rounded-xl bg-black/60 border border-amber-500/40 text-sm text-white focus:border-amber-400 focus:outline-none font-mono tracking-widest text-center"
                autoFocus
              />

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAdminBypass(false)}
                  className="flex-1 h-10 rounded-xl bg-white/10 hover:bg-white/15 text-xs text-ice-subtext font-medium transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isBypassing || !adminPinInput.trim()}
                  className="flex-1 h-10 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white text-xs font-semibold shadow-lg shadow-amber-500/20 disabled:opacity-50 transition-all flex items-center justify-center gap-1.5"
                >
                  {isBypassing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Kích Hoạt Admin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
