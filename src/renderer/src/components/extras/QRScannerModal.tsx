import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Camera,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Keyboard,
  RefreshCw
} from 'lucide-react';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (data: { ip: string; port?: number; token?: string; name?: string }) => void;
  title?: string;
  description?: string;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({
  isOpen,
  onClose,
  onScanSuccess,
  title = 'Quét Mã QR Máy Tính',
  description = 'Hướng camera về phía mã QR hiển thị trên màn hình máy tính của bạn',
}) => {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [manualIp, setManualIp] = useState('');
  const [showManual, setShowManual] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<any>(null);

  useEffect(() => {
    if (!isOpen) return;

    let isScanning = true;
    setErrorMsg(null);

    const startCamera = async () => {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          setErrorMsg('Trình duyệt không hỗ trợ truy cập camera. Vui lòng nhập IP thủ công.');
          setShowManual(true);
          return;
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        });

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        // Setup Barcode Detector if available
        if ('BarcodeDetector' in window) {
          const barcodeDetector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });

          scanIntervalRef.current = setInterval(async () => {
            if (!videoRef.current || !isScanning) return;
            try {
              const barcodes = await barcodeDetector.detect(videoRef.current);
              if (barcodes.length > 0) {
                const rawVal = barcodes[0].rawValue;
                handleCodeDetected(rawVal);
              }
            } catch {}
          }, 350);
        } else {
          // Fallback message for older WebViews without BarcodeDetector
          console.log('BarcodeDetector not natively supported, fallback available');
        }
      } catch (err: any) {
        console.warn('Camera error:', err);
        setErrorMsg('Không thể mở camera. Bạn có thể nhập địa chỉ IP của máy tính bên dưới.');
        setShowManual(true);
      }
    };

    startCamera();

    return () => {
      isScanning = false;
      if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCodeDetected = (rawValue: string) => {
    try {
      const parsed = JSON.parse(rawValue);
      if (parsed.ip) {
        onScanSuccess({
          ip: parsed.ip,
          port: parsed.port || 18999,
          token: parsed.token,
          name: parsed.name,
        });
        onClose();
      }
    } catch {
      // If it's a plain IP string: e.g. "192.168.1.15"
      if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(rawValue.trim())) {
        onScanSuccess({ ip: rawValue.trim() });
        onClose();
      }
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualIp.trim()) return;
    onScanSuccess({ ip: manualIp.trim() });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in select-none">
      <div className="relative w-full max-w-md bg-gradient-to-b from-[#131722] to-[#0a0d14] border border-white/15 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">{title}</h2>
              <p className="text-[10px] text-ice-muted truncate max-w-[240px]">{description}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-ice-muted hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Viewfinder Camera Area */}
        <div className="relative aspect-square w-full bg-black overflow-hidden flex items-center justify-center">
          <video
            ref={videoRef}
            playsInline
            muted
            className="w-full h-full object-cover"
          />

          {/* Target Scan Box Overlay */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="w-56 h-56 rounded-2xl border-2 border-amber-400/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.55)] relative animate-pulse">
              {/* Corner Accents */}
              <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-amber-400 rounded-tl-lg" />
              <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-amber-400 rounded-tr-lg" />
              <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-amber-400 rounded-bl-lg" />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-amber-400 rounded-br-lg" />
            </div>
          </div>

          {/* Scanner laser scan line */}
          <div className="absolute top-1/4 left-16 right-16 h-[2px] bg-gradient-to-r from-transparent via-amber-400 to-transparent animate-bounce pointer-events-none" />
        </div>

        {/* Footer: Manual IP Fallback */}
        <div className="p-4 space-y-3 bg-black/40 border-t border-white/10">
          {errorMsg && (
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="flex items-center justify-between">
            <span className="text-[11px] text-ice-muted">Không quét được mã?</span>
            <button
              type="button"
              onClick={() => setShowManual(!showManual)}
              className="text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors flex items-center gap-1"
            >
              <Keyboard className="w-3.5 h-3.5" />
              <span>{showManual ? 'Ẩn nhập IP' : 'Nhập IP thủ công'}</span>
            </button>
          </div>

          {showManual && (
            <form onSubmit={handleManualSubmit} className="flex gap-2 animate-fade-in">
              <input
                type="text"
                value={manualIp}
                onChange={(e) => setManualIp(e.target.value)}
                placeholder="Ví dụ: 192.168.1.15"
                className="flex-1 px-3 py-2 rounded-xl bg-black/60 border border-white/20 text-xs text-white font-mono focus:border-amber-400 focus:outline-none"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-black text-xs shadow transition-all"
              >
                Kết Nối
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

