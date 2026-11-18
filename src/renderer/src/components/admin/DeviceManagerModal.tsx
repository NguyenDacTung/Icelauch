import React, { useState, useEffect } from 'react';
import {
  Shield,
  Smartphone,
  Laptop,
  Tv,
  X,
  KeyRound,
  Trash2,
  Ban,
  CheckCircle2,
  Clock,
  RefreshCw,
  Copy,
  Check,
  AlertCircle,
  Timer
} from 'lucide-react';
import type { AuthorizedDevice } from '../../types';
import {
  listAuthorizedDevices,
  generateDeviceOtp,
  revokeDevice,
  deleteAuthorizedDevice,
  directApproveDevice
} from '../../services/deviceAuth';

interface DeviceManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DeviceManagerModal: React.FC<DeviceManagerModalProps> = ({ isOpen, onClose }) => {
  const [devices, setDevices] = useState<AuthorizedDevice[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Active OTP Popup state
  const [activeOtpInfo, setActiveOtpInfo] = useState<{
    deviceId: string;
    deviceName: string;
    otpCode: string;
    otpExpiresAt: string;
  } | null>(null);
  const [otpSecondsLeft, setOtpSecondsLeft] = useState<number | null>(null);
  const [copiedOtp, setCopiedOtp] = useState(false);

  const loadDevices = async () => {
    setIsLoading(true);
    try {
      const list = await listAuthorizedDevices();
      setDevices(list);
    } catch (e: any) {
      setActionError(e?.message || 'Lỗi tải danh sách thiết bị');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadDevices();
      const interval = setInterval(loadDevices, 5000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  // Handle OTP countdown timer for the popup
  useEffect(() => {
    if (!activeOtpInfo?.otpExpiresAt) {
      setOtpSecondsLeft(null);
      return;
    }

    const updateTimer = () => {
      const remaining = Math.max(0, Math.floor((new Date(activeOtpInfo.otpExpiresAt).getTime() - Date.now()) / 1000));
      setOtpSecondsLeft(remaining);
      if (remaining <= 0) {
        setActiveOtpInfo(null);
      }
    };

    updateTimer();
    const timer = setInterval(updateTimer, 1000);
    return () => clearInterval(timer);
  }, [activeOtpInfo?.otpExpiresAt]);

  if (!isOpen) return null;

  // Handle generating OTP for a pending device
  const handleGenerateOtp = async (device: AuthorizedDevice) => {
    setActionError(null);
    setActionSuccess(null);
    try {
      const res = await generateDeviceOtp(device.deviceId);
      if (res.success && res.otpCode && res.otpExpiresAt) {
        setActiveOtpInfo({
          deviceId: device.deviceId,
          deviceName: device.deviceName,
          otpCode: res.otpCode,
          otpExpiresAt: res.otpExpiresAt,
        });
        setActionSuccess(`Đã cấp mã OTP cho thiết bị "${device.deviceName}" thành công!`);
        loadDevices();
      } else {
        setActionError(res.error || 'Lỗi cấp mã OTP');
      }
    } catch (e: any) {
      setActionError(e?.message || 'Lỗi kết nối máy chủ');
    }
  };

  // Handle direct approval for a pending device
  const handleDirectApprove = async (device: AuthorizedDevice) => {
    setActionError(null);
    setActionSuccess(null);
    try {
      const res = await directApproveDevice(device.deviceId);
      if (res.success) {
        setActionSuccess(`✓ Đã phê duyệt ngay thiết bị "${device.deviceName}" thành công!`);
        loadDevices();
      } else {
        setActionError(res.error || 'Lỗi phê duyệt thiết bị');
      }
    } catch (e: any) {
      setActionError(e?.message || 'Lỗi phê duyệt');
    }
  };

  // Handle revoking device
  const handleRevoke = async (device: AuthorizedDevice) => {
    if (!window.confirm(`Bạn có chắc chắn muốn thu hồi quyền truy cập của "${device.deviceName}"? Thiết bị này sẽ bị đá ra ngoài màn hình khóa ngay lập tức.`)) {
      return;
    }

    setActionError(null);
    setActionSuccess(null);
    try {
      const res = await revokeDevice(device.deviceId);
      if (res.success) {
        setActionSuccess(`Đã thu hồi quyền thiết bị "${device.deviceName}"`);
        loadDevices();
      } else {
        setActionError(res.error || 'Lỗi thu hồi quyền thiết bị');
      }
    } catch (e: any) {
      setActionError(e?.message || 'Lỗi thu hồi');
    }
  };

  // Handle deleting device
  const handleDelete = async (device: AuthorizedDevice) => {
    if (!window.confirm(`Xóa hoàn toàn thiết bị "${device.deviceName}" khỏi danh sách?`)) {
      return;
    }

    setActionError(null);
    setActionSuccess(null);
    try {
      const res = await deleteAuthorizedDevice(device.deviceId);
      if (res.success) {
        setActionSuccess(`Đã xóa thiết bị "${device.deviceName}"`);
        loadDevices();
      } else {
        setActionError(res.error || 'Lỗi xóa thiết bị');
      }
    } catch (e: any) {
      setActionError(e?.message || 'Lỗi xóa');
    }
  };

  const handleCopyOtp = () => {
    if (!activeOtpInfo) return;
    navigator.clipboard.writeText(activeOtpInfo.otpCode);
    setCopiedOtp(true);
    setTimeout(() => setCopiedOtp(false), 2000);
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getPlatformIcon = (platform: string) => {
    if (platform === 'windows_pc') return <Laptop className="w-4 h-4 text-cyan-400" />;
    if (platform === 'android_tv') return <Tv className="w-4 h-4 text-amber-400" />;
    return <Smartphone className="w-4 h-4 text-emerald-400" />;
  };

  const pendingCount = devices.filter((d) => d.status === 'pending').length;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in select-none">
      <div className="relative w-full max-w-2xl max-h-[85vh] bg-ice-card border border-ice-border rounded-2xl shadow-2xl flex flex-col overflow-hidden text-ice-text">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-ice-border flex items-center justify-between bg-ice-card/90">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-ice-text">Quản Lý Thiết Bị Được Cấp Quyền</h2>
                {pendingCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse">
                    {pendingCount} chờ duyệt
                  </span>
                )}
              </div>
              <p className="text-xs text-ice-subtext">
                Chỉ những thiết bị được bạn phê duyệt tại đây mới có thể mở và sử dụng ứng dụng.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-ice-muted hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Messages */}
        {actionError && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{actionError}</span>
          </div>
        )}
        {actionSuccess && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{actionSuccess}</span>
          </div>
        )}

        {/* Active OTP Card (If generated) */}
        {activeOtpInfo && (
          <div className="mx-6 mt-4 p-4 rounded-xl bg-gradient-to-r from-cyan-950/60 to-blue-950/60 border border-cyan-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-cyan-300 flex items-center gap-1.5">
                <KeyRound className="w-4 h-4" />
                Mã OTP Cấp Cho: <span className="text-white font-bold">{activeOtpInfo.deviceName}</span>
              </span>
              {otpSecondsLeft !== null && (
                <span className="text-xs font-mono font-bold text-amber-400 flex items-center gap-1">
                  <Timer className="w-3.5 h-3.5" />
                  Còn {formatTimer(otpSecondsLeft)}
                </span>
              )}
            </div>

            <div className="flex items-center justify-between bg-ice-hover/60 rounded-xl px-5 py-3 border border-ice-border/60">
              <span className="text-3xl font-mono font-black text-cyan-300 tracking-[0.4em]">
                {activeOtpInfo.otpCode}
              </span>
              <button
                type="button"
                onClick={handleCopyOtp}
                className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-semibold text-xs transition-colors flex items-center gap-1.5"
              >
                {copiedOtp ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedOtp ? 'Đã Chép' : 'Chép Mã Gửi Bạn'}</span>
              </button>
            </div>
            <p className="text-[11px] text-ice-subtext">
              Bạn hãy gửi mã này cho người bạn đó. Khi họ nhập đúng mã vào máy trong vòng 2 phút, thiết bị sẽ tự động được phê duyệt ngay lập tức.
            </p>
          </div>
        )}

        {/* Devices List Body */}
        <div className="p-6 flex-1 overflow-y-auto space-y-3">
          {isLoading && devices.length === 0 ? (
            <div className="py-12 text-center text-ice-muted text-xs flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
              <span>Đang tải danh sách thiết bị...</span>
            </div>
          ) : devices.length === 0 ? (
            <div className="py-12 text-center text-ice-muted text-xs space-y-2">
              <Shield className="w-8 h-8 mx-auto text-ice-muted/40" />
              <p>Chưa có thiết bị nào trong danh sách cấp quyền.</p>
              <p className="text-[11px] text-ice-muted/70">
                Khi bạn bè mở ứng dụng trên máy mới và gửi yêu cầu, thiết bị sẽ xuất hiện ở đây để bạn phê duyệt.
              </p>
            </div>
          ) : (
            devices.map((device) => {
              const isApproved = device.status === 'approved';
              const isPending = device.status === 'pending';
              const isRevoked = device.status === 'revoked';

              return (
                <div
                  key={device.deviceId}
                  className={`p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isPending
                      ? 'bg-amber-500/5 border-amber-500/30'
                      : isApproved
                      ? 'bg-white/[0.03] border-white/10'
                      : 'bg-rose-500/5 border-rose-500/20 opacity-70'
                  }`}
                >
                  {/* Left Info */}
                  <div className="space-y-1 overflow-hidden">
                    <div className="flex items-center gap-2">
                      {getPlatformIcon(device.platform)}
                      <span className="text-sm font-bold text-white truncate">{device.deviceName}</span>
                      {isApproved && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          Đã Duyệt
                        </span>
                      )}
                      {isPending && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse">
                          Chờ Duyệt
                        </span>
                      )}
                      {isRevoked && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                          Đã Thu Hồi
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-ice-muted font-mono">
                      <span>ID: {device.deviceId}</span>
                      {device.approvedAt && (
                        <span className="flex items-center gap-1 font-sans">
                          <Clock className="w-3 h-3" />
                          Duyệt: {new Date(device.approvedAt).toLocaleDateString('vi-VN')}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    {/* If Pending: Direct Approve or Generate OTP */}
                    {isPending && (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleDirectApprove(device)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                          title="Phê duyệt ngay thiết bị này không cần mã OTP"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Phê Duyệt Ngay</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleGenerateOtp(device)}
                          className="px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-semibold text-xs transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                          title="Cấp mã OTP 2 phút gửi cho bạn bè"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                          <span>Cấp Mã OTP</span>
                        </button>
                      </div>
                    )}

                    {/* If Approved: Revoke Button */}
                    {isApproved && (
                      <button
                        type="button"
                        onClick={() => handleRevoke(device)}
                        className="px-2.5 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs transition-colors flex items-center gap-1 cursor-pointer"
                        title="Thu hồi quyền truy cập (khóa thiết bị ngay lập tức)"
                      >
                        <Ban className="w-3.5 h-3.5" />
                        <span>Thu Hồi</span>
                      </button>
                    )}

                    {/* Delete Permanently Button */}
                    <button
                      type="button"
                      onClick={() => handleDelete(device)}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-ice-muted hover:text-rose-400 transition-colors cursor-pointer"
                      title="Xóa thiết bị này"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-white/10 bg-black/20 flex items-center justify-between text-xs text-ice-muted">
          <span>Tổng số: {devices.length} thiết bị</span>
          <button
            type="button"
            onClick={loadDevices}
            disabled={isLoading}
            className="flex items-center gap-1.5 text-ice-subtext hover:text-cyan-400 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Làm mới</span>
          </button>
        </div>
      </div>
    </div>
  );
};
