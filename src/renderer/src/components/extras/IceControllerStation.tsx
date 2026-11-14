import React, { useState, useEffect } from 'react';
import {
  Gamepad2,
  QrCode,
  Wifi,
  Bluetooth,
  Smartphone,
  Laptop,
  CheckCircle2,
  XCircle,
  Camera,
  Play,
  Sliders,
  Sparkles,
  RefreshCw,
  Trash2,
  HelpCircle
} from 'lucide-react';
import QRCode from 'qrcode';
import { isElectron } from '../../services/platformAdapter';
import type { PairedDevice, GameControllerConfig } from '../../types';
import { QRScannerModal } from './QRScannerModal';
import { MobileLandscapeGamepad } from './MobileLandscapeGamepad';
import { PRESET_MAP } from '../../utils/controllerPresets';

interface IceControllerStationProps {
  isAdmin?: boolean;
}

export const IceControllerStation: React.FC<IceControllerStationProps> = () => {
  const isDesktop = isElectron();
  const [connectionType, setConnectionType] = useState<'wifi' | 'bluetooth'>('wifi');

  // PC Host Status
  const [hostStatus, setHostStatus] = useState<{
    isRunning: boolean;
    port: number;
    localIps: string[];
    connectedClients: number;
  }>({
    isRunning: false,
    port: 18999,
    localIps: [],
    connectedClients: 0,
  });

  // Pairing State
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [pairedDevice, setPairedDevice] = useState<PairedDevice | null>(() => {
    try {
      const stored = localStorage.getItem('icelauch_paired_controller_device');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  // Mobile modals
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isGamepadTestOpen, setIsGamepadTestOpen] = useState(false);
  const [selectedPreviewPreset, setSelectedPreviewPreset] = useState<string>('Xbox 360 Chuẩn');

  // 1. Fetch PC Host Status and Generate Pairing QR on PC
  const refreshPcHost = async () => {
    if (isDesktop && window.api?.getControllerStatus) {
      const st = await window.api.getControllerStatus();
      setHostStatus(st);

      // Generate pairing QR code containing PC's main local IP
      if (st.localIps.length > 0) {
        const payload = JSON.stringify({
          type: 'icelauch_pairing',
          name: 'Icelauch PC Host',
          ip: st.localIps[0],
          port: st.port || 18999,
          token: 'ice_secure_pair_' + Math.floor(1000 + Math.random() * 9000),
        });

        try {
          const url = await QRCode.toDataURL(payload, {
            width: 256,
            margin: 1.5,
            color: { dark: '#000000', light: '#ffffff' },
          });
          setQrCodeDataUrl(url);
        } catch (e) {
          console.warn('QR code generation error:', e);
        }
      }
    }
  };

  useEffect(() => {
    refreshPcHost();
  }, [isDesktop]);

  // Handle Scan QR on Mobile
  const handleScanSuccess = (data: { ip: string; port?: number; token?: string; name?: string }) => {
    const newPaired: PairedDevice = {
      id: 'pc_' + Date.now(),
      name: data.name || 'Máy Tính Của Tôi',
      type: 'pc',
      ip: data.ip,
      lastConnectedAt: new Date().toISOString(),
      isOnline: true,
    };
    setPairedDevice(newPaired);
    localStorage.setItem('icelauch_paired_controller_device', JSON.stringify(newPaired));
  };

  const handleUnpair = () => {
    if (window.confirm('Bạn có chắc muốn huỷ ghép nối với thiết bị này không?')) {
      setPairedDevice(null);
      localStorage.removeItem('icelauch_paired_controller_device');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in select-none">
      {/* DESKTOP PC VIEW */}
      {isDesktop ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: QR Code & Connection (7 cols) */}
          <div className="lg:col-span-7 space-y-5">
            <div className="p-6 rounded-3xl bg-black/40 border border-white/10 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
                    <Laptop className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Trạm Máy Chủ Điều Khiển PC</h3>
                    <p className="text-[10px] text-ice-muted">Nhận tín hiệu tay cầm không dây từ điện thoại</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-mono font-bold text-emerald-400">
                    Cổng {hostStatus.port} (Đang mở)
                  </span>
                </div>
              </div>

              {/* Pairing QR Code Card */}
              <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-2xl bg-white/[0.02] border border-white/10">
                <div className="bg-white p-2.5 rounded-2xl shadow-xl flex-shrink-0">
                  {qrCodeDataUrl ? (
                    <img src={qrCodeDataUrl} alt="Mã QR Ghép Nối" className="w-40 h-40 object-contain rounded-lg" />
                  ) : (
                    <div className="w-40 h-40 flex items-center justify-center bg-gray-200 rounded-lg text-gray-500 text-xs">
                      Đang tạo mã QR...
                    </div>
                  )}
                </div>

                <div className="space-y-3 text-left">
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-400 text-black shadow">
                    Ghép Nối Nhanh 1 Lần
                  </span>
                  <h4 className="text-base font-bold text-white leading-snug">
                    Dùng điện thoại quét mã QR để kết nối
                  </h4>
                  <p className="text-xs text-ice-muted leading-relaxed">
                    Mở Icelauch trên điện thoại $\rightarrow$ vào mục <b>Tiện Ích</b> $\rightarrow$ bấm <b>Quét Mã QR</b>. Sau khi ghép một lần, hai thiết bị sẽ tự động ghi nhớ nhau.
                  </p>
                  <div className="flex items-center gap-2 text-xs font-mono text-amber-300">
                    <Wifi className="w-3.5 h-3.5" />
                    <span>IP Máy Tính: {hostStatus.localIps[0] || '127.0.0.1'}</span>
                  </div>
                </div>
              </div>

              {/* Connected Clients Counter */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-3.5 rounded-2xl bg-black/30 border border-white/10 flex items-center gap-3">
                  <Smartphone className="w-5 h-5 text-indigo-400" />
                  <div>
                    <span className="text-[10px] text-ice-muted uppercase font-bold tracking-wider">Tay Cầm Đang Kết Nối</span>
                    <h5 className="text-base font-black text-white">{hostStatus.connectedClients} thiết bị</h5>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-black/30 border border-white/10 flex items-center gap-3">
                  <Gamepad2 className="w-5 h-5 text-amber-400" />
                  <div>
                    <span className="text-[10px] text-ice-muted uppercase font-bold tracking-wider">Độ Trễ Tín Hiệu</span>
                    <h5 className="text-base font-black text-emerald-400">&lt; 5 ms (Cực thấp)</h5>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Presets & Tester (5 cols) */}
          <div className="lg:col-span-5 space-y-5">
            <div className="p-6 rounded-3xl bg-black/40 border border-white/10 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-amber-400" />
                  <span>Mẫu Bố Cục Nút Dùng Chung</span>
                </h3>
                <span className="text-[10px] text-ice-muted">Áp dụng cho game</span>
              </div>

              {/* Preset Selector */}
              <div className="grid grid-cols-3 gap-2">
                {Object.keys(PRESET_MAP).map((pName) => (
                  <button
                    key={pName}
                    type="button"
                    onClick={() => setSelectedPreviewPreset(pName)}
                    className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all text-center ${
                      selectedPreviewPreset === pName
                        ? 'bg-amber-400 text-black shadow-lg font-black'
                        : 'bg-white/10 text-ice-muted hover:text-white'
                    }`}
                  >
                    {pName}
                  </button>
                ))}
              </div>

              {/* Buttons Summary List */}
              <div className="p-4 rounded-2xl bg-black/30 border border-white/10 space-y-2">
                <span className="text-[11px] font-bold text-white uppercase tracking-wider block">
                  Danh sách phím trong mẫu ({PRESET_MAP[selectedPreviewPreset]?.length || 0} nút):
                </span>
                <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto custom-scrollbar">
                  {PRESET_MAP[selectedPreviewPreset]?.map((b) => (
                    <span
                      key={b.id}
                      className="px-2.5 py-1 rounded-lg bg-white/10 text-[11px] font-mono text-white/90 border border-white/15"
                    >
                      {b.label} {b.targetKey ? `(${b.targetKey.replace(/Key|Digit/, '')})` : ''}
                    </span>
                  ))}
                </div>
              </div>

              {/* Instructions */}
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-start gap-2.5 leading-relaxed">
                <Sparkles className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                <span>
                  Để tạo bố cục riêng cho từng game, bạn hãy mở <b>Thư Viện</b> $\rightarrow$ bấm nút bánh răng <b>⚙️</b> cạnh nút Tải/Chơi game $\rightarrow$ chọn tab <b>Điều khiển điện thoại</b>.
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* MOBILE VIEW */
        <div className="max-w-xl mx-auto space-y-5">
          {/* Mobile Pairing Status Card */}
          <div className="p-6 rounded-3xl bg-gradient-to-b from-ice-card to-[#0e121a] border border-white/15 shadow-2xl space-y-5 text-center">
            <div className="w-16 h-16 rounded-3xl bg-amber-500/20 text-amber-400 border border-amber-500/30 mx-auto flex items-center justify-center shadow-lg">
              <Gamepad2 className="w-8 h-8" />
            </div>

            <div>
              <h2 className="text-lg font-black text-white tracking-wide">Trạm Điều Khiển Tay Cầm</h2>
              <p className="text-xs text-ice-muted mt-1">
                Biến điện thoại thành tay cầm chơi game không dây cho máy tính
              </p>
            </div>

            {/* Paired Device Card */}
            {pairedDevice ? (
              <div className="p-4 rounded-2xl bg-white/[0.04] border border-emerald-500/30 text-left space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                      <Laptop className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">{pairedDevice.name}</h4>
                      <p className="text-[11px] font-mono text-emerald-400">IP: {pairedDevice.ip}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleUnpair}
                    className="p-2 rounded-xl text-ice-muted hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    title="Huỷ ghép nối"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center gap-2 text-[11px] text-ice-muted pt-2 border-t border-white/10">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Đã ghép nối thành công. Sẵn sàng nhận lệnh chơi game từ PC.</span>
                </div>
              </div>
            ) : (
              <div className="p-5 rounded-2xl bg-black/40 border border-dashed border-white/20 text-center space-y-3">
                <QrCode className="w-8 h-8 mx-auto text-ice-muted opacity-70" />
                <h4 className="text-sm font-bold text-white">Chưa Ghép Nối Với Máy Tính</h4>
                <p className="text-xs text-ice-muted max-w-xs mx-auto">
                  Trên máy tính, mở mục Tiện Ích để thấy mã QR, sau đó bấm nút bên dưới để quét kết nối.
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setIsScannerOpen(true)}
                className="py-3 px-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs tracking-wider uppercase shadow-xl transition-all flex items-center justify-center gap-2 active:scale-95"
              >
                <Camera className="w-4 h-4" />
                <span>{pairedDevice ? 'Quét Ghép Lại' : 'Quét Mã QR Máy Tính'}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsGamepadTestOpen(true)}
                className="py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-black text-xs tracking-wider uppercase shadow-xl transition-all flex items-center justify-center gap-2 active:scale-95"
              >
                <Play className="w-4 h-4 fill-black" />
                <span>Thử Tay Cầm</span>
              </button>
            </div>

            {/* Connection Type Switcher */}
            <div className="flex items-center justify-center gap-3 pt-2">
              <span className="text-xs text-ice-muted">Phương thức truyền:</span>
              <div className="flex items-center gap-1 p-1 rounded-xl bg-black/40 border border-white/10 text-xs">
                <button
                  type="button"
                  onClick={() => setConnectionType('wifi')}
                  className={`px-3 py-1 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
                    connectionType === 'wifi'
                      ? 'bg-amber-400 text-black shadow'
                      : 'text-ice-muted hover:text-white'
                  }`}
                >
                  <Wifi className="w-3.5 h-3.5" />
                  <span>Wi-Fi (Khuyên dùng)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setConnectionType('bluetooth')}
                  className={`px-3 py-1 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
                    connectionType === 'bluetooth'
                      ? 'bg-amber-400 text-black shadow'
                      : 'text-ice-muted hover:text-white'
                  }`}
                >
                  <Bluetooth className="w-3.5 h-3.5" />
                  <span>Bluetooth</span>
                </button>
              </div>
            </div>

            <p className="text-[11px] text-ice-muted/90 italic leading-relaxed pt-2 border-t border-white/10">
              💡 <b>Lưu ý:</b> Trong màn hình này không hiện sẵn tay cầm để tránh choán chỗ. Tay cầm ảo sẽ tự động mở và <b>xoay ngang điện thoại</b> khi bạn bấm <b>"Thử Tay Cầm"</b> hoặc khi PC khởi chạy game có thiết lập tay cầm.
            </p>
          </div>
        </div>
      )}

      {/* QR Scanner Modal for Phone */}
      <QRScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={handleScanSuccess}
        title="Quét Mã QR Máy Tính"
        description="Hướng camera về phía mã QR đang hiển thị trên màn hình PC"
      />

      {/* Mobile Landscape Gamepad Tester */}
      <MobileLandscapeGamepad
        isOpen={isGamepadTestOpen}
        onClose={() => setIsGamepadTestOpen(false)}
        hostIp={pairedDevice?.ip || '127.0.0.1'}
        port={18999}
        gameTitle="Thử Tay Cầm Ảo (Xbox 360 Chuẩn)"
      />
    </div>
  );
};
