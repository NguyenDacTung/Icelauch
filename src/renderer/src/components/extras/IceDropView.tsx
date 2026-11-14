import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Download,
  Clock,
  KeyRound,
  FileText,
  Link as LinkIcon,
  Copy,
  Check,
  Trash2,
  AlertCircle,
  Bluetooth,
  Cloud,
  Share2,
  FileUp,
  File,
  Smartphone,
  Laptop,
  QrCode,
  Camera,
  Sparkles,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import QRCode from 'qrcode';
import type { IceDropShareItem, UserProfile } from '../../types';
import { IceDropCloudService } from '../../services/iceDropCloudService';
import { isElectron } from '../../services/platformAdapter';
import { QRScannerModal } from './QRScannerModal';

interface IceDropViewProps {
  activeProfile: UserProfile | null;
}

export const IceDropView: React.FC<IceDropViewProps> = ({ activeProfile }) => {
  const isDesktop = isElectron();
  const [channel, setChannel] = useState<'cloud' | 'direct'>('cloud');

  // Cloud Shares State
  const [shares, setShares] = useState<IceDropShareItem[]>([]);
  const [inputContent, setInputContent] = useState('');
  const [shareType, setShareType] = useState<'text' | 'link'>('text');
  const [receivePin, setReceivePin] = useState('');
  const [foundItem, setFoundItem] = useState<IceDropShareItem | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isSubmittingCloud, setIsSubmittingCloud] = useState(false);
  const [cloudError, setCloudError] = useState<string | null>(null);

  // Direct QR Transfer State
  const [directQrUrl, setDirectQrUrl] = useState<string>('');
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [directConnectedHost, setDirectConnectedHost] = useState<string | null>(null);
  const [directStatus, setDirectStatus] = useState<string>('Chưa kết nối');
  const [directText, setDirectText] = useState('');
  const [receivedDirectItems, setReceivedDirectItems] = useState<{ id: string; type: string; content: string; time: string }[]>([]);
  const directWsRef = useRef<WebSocket | null>(null);

  // 1. Load Cloud Shares from Supabase
  const loadCloudShares = async () => {
    const list = await IceDropCloudService.getActiveShares();
    setShares(list);
  };

  useEffect(() => {
    if (channel === 'cloud') {
      loadCloudShares();
      const interval = setInterval(loadCloudShares, 8000); // 8s auto refresh
      return () => clearInterval(interval);
    }
  }, [channel]);

  // 2. Generate Direct Transfer QR Code on PC
  useEffect(() => {
    if (isDesktop && channel === 'direct') {
      if (window.api?.getControllerStatus) {
        window.api.getControllerStatus().then(async (st: any) => {
          if (st.localIps.length > 0) {
            const payload = JSON.stringify({
              type: 'icedrop_direct',
              ip: st.localIps[0],
              port: st.port || 18999,
              token: 'drop_token_' + Date.now(),
              name: 'Icelauch PC Host',
            });
            try {
              const url = await QRCode.toDataURL(payload, {
                width: 240,
                margin: 1.5,
                color: { dark: '#000000', light: '#ffffff' },
              });
              setDirectQrUrl(url);
              setDirectStatus('Máy tính đang chờ kết nối...');
            } catch (e) {
              console.warn('QR generation error:', e);
            }
          }
        });
      }
    }
  }, [isDesktop, channel]);

  // Handle Create Cloud Share
  const handleCreateCloudShare = async () => {
    if (!inputContent.trim()) return;
    setIsSubmittingCloud(true);
    setCloudError(null);

    // Limit 5 shares max warning
    if (shares.length >= 5) {
      const confirmDelete = window.confirm(
        'Đã đạt tối đa 5 phần chia sẻ. Hệ thống sẽ tự động xóa phần chia sẻ cũ nhất để tiếp tục. Bạn có đồng ý không?'
      );
      if (!confirmDelete) {
        setIsSubmittingCloud(false);
        return;
      }
    }

    try {
      const created = await IceDropCloudService.createShare({
        senderProfileId: activeProfile?.id,
        senderName: activeProfile?.nickname || 'Người dùng Icelauch',
        type: shareType,
        content: inputContent.trim(),
      });

      if (created) {
        setInputContent('');
        await loadCloudShares();
      } else {
        setCloudError('Không thể tải lên Supabase. Vui lòng kiểm tra kết nối mạng.');
      }
    } catch (e: any) {
      setCloudError(e?.message || 'Lỗi gửi chia sẻ');
    } finally {
      setIsSubmittingCloud(false);
    }
  };

  // Handle Find by 4-digit PIN
  const handleLookupPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receivePin.trim()) return;
    setFoundItem(null);
    const item = await IceDropCloudService.findByPinCode(receivePin.trim());
    if (item) {
      setFoundItem(item);
    } else {
      alert('Không tìm thấy nội dung chia sẻ với mã 4 số này hoặc mã đã hết hạn 10 phút.');
    }
  };

  // Handle Copy text
  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Direct QR Mobile Scan Success
  const handleDirectScanSuccess = (data: { ip: string; port?: number }) => {
    setDirectConnectedHost(data.ip);
    setDirectStatus(`Đã kết nối với máy tính (${data.ip})`);

    // Connect WebSocket
    try {
      if (directWsRef.current) directWsRef.current.close();
      const ws = new WebSocket(`ws://${data.ip}:${data.port || 18999}`);
      directWsRef.current = ws;

      ws.onopen = () => {
        setDirectStatus(`Đã kết nối trực tiếp với PC (${data.ip})`);
        ws.send(JSON.stringify({ type: 'icedrop_pair', clientName: 'Icelauch Mobile Direct' }));
      };

      ws.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data);
          if (msg.type === 'icedrop_text') {
            setReceivedDirectItems((prev) => [
              { id: 'dir_' + Date.now(), type: 'text', content: msg.content, time: new Date().toLocaleTimeString() },
              ...prev,
            ]);
          }
        } catch {}
      };
    } catch (e) {
      console.warn('Direct WebSocket error:', e);
    }
  };

  const handleSendDirectText = () => {
    if (!directText.trim()) return;
    if (directWsRef.current && directWsRef.current.readyState === WebSocket.OPEN) {
      directWsRef.current.send(JSON.stringify({ type: 'icedrop_text', content: directText.trim() }));
      setReceivedDirectItems((prev) => [
        { id: 'sent_' + Date.now(), type: 'text', content: `(Bạn gửi): ${directText.trim()}`, time: new Date().toLocaleTimeString() },
        ...prev,
      ]);
      setDirectText('');
    } else {
      alert('Chưa kết nối trực tiếp với thiết bị nào. Vui lòng quét mã QR trước.');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in select-none">
      {/* Top Channel Toggle Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-3xl bg-black/40 border border-white/10 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-black font-black shadow-lg">
            <Share2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span>IceDrop - Chia Sẻ Dữ Liệu Tức Thì</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 font-bold">
                Mới v1.1.0
              </span>
            </h2>
            <p className="text-xs text-ice-muted">
              Gửi văn bản, liên kết và tệp tin siêu tốc giữa các thiết bị
            </p>
          </div>
        </div>

        {/* Channel Selector */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-black/50 border border-white/10">
          <button
            type="button"
            onClick={() => setChannel('cloud')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              channel === 'cloud'
                ? 'bg-amber-400 text-black shadow-lg font-black'
                : 'text-ice-muted hover:text-white'
            }`}
          >
            <Cloud className="w-4 h-4" />
            <span>Đám Mây (Cloud PIN)</span>
          </button>
          <button
            type="button"
            onClick={() => setChannel('direct')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              channel === 'direct'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg font-black'
                : 'text-ice-muted hover:text-white'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>Quét Mã QR (Không Cần Mạng)</span>
          </button>
        </div>
      </div>

      {/* TAB 1: CLOUD SHARING */}
      {channel === 'cloud' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Create Share & PIN Code Box (5 cols) */}
          <div className="lg:col-span-5 space-y-5">
            {/* Create Share Card */}
            <div className="p-6 rounded-3xl bg-black/40 border border-white/10 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <span className="text-xs font-bold text-white flex items-center gap-1.5 uppercase tracking-wider">
                  <Send className="w-3.5 h-3.5 text-amber-400" />
                  <span>Tạo Chia Sẻ Lên Đám Mây</span>
                </span>
                <span className="text-[10px] text-amber-300 font-mono">Tối đa 5 mục • TTL 10 phút</span>
              </div>

              {/* Type Switcher */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setShareType('text')}
                  className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all ${
                    shareType === 'text'
                      ? 'bg-amber-400/20 text-amber-300 border-amber-400/40 shadow'
                      : 'bg-black/30 text-ice-muted border-white/10 hover:text-white'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Văn Bản Ghi Chú</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShareType('link')}
                  className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all ${
                    shareType === 'link'
                      ? 'bg-amber-400/20 text-amber-300 border-amber-400/40 shadow'
                      : 'bg-black/30 text-ice-muted border-white/10 hover:text-white'
                  }`}
                >
                  <LinkIcon className="w-3.5 h-3.5" />
                  <span>Đường Dẫn Link</span>
                </button>
              </div>

              {/* Input Area */}
              <div className="space-y-2">
                <textarea
                  value={inputContent}
                  onChange={(e) => setInputContent(e.target.value)}
                  placeholder={shareType === 'text' ? 'Nhập nội dung văn bản muốn gửi qua thiết bị khác...' : 'Dán đường dẫn link (https://...)'}
                  rows={4}
                  className="w-full p-3.5 rounded-2xl bg-black/50 border border-white/15 text-xs text-white placeholder-ice-muted focus:border-amber-400 focus:outline-none transition-colors resize-none"
                />

                {cloudError && (
                  <p className="text-[11px] text-red-400 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{cloudError}</span>
                  </p>
                )}

                <button
                  type="button"
                  disabled={isSubmittingCloud || !inputContent.trim()}
                  onClick={handleCreateCloudShare}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-black text-xs tracking-wider uppercase shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-98"
                >
                  {isSubmittingCloud ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  <span>{isSubmittingCloud ? 'Đang tải lên...' : 'Chia Sẻ Ngay (Sinh Mã 4 Số)'}</span>
                </button>
              </div>
            </div>

            {/* Quick Receive by 4-digit PIN Code */}
            <div className="p-6 rounded-3xl bg-black/40 border border-white/10 shadow-xl space-y-4">
              <div className="flex items-center gap-2 border-b border-white/10 pb-3">
                <KeyRound className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Nhận Bằng Mã PIN 4 Số (Khác Tài Khoản)
                </span>
              </div>

              <form onSubmit={handleLookupPin} className="flex gap-2">
                <input
                  type="text"
                  maxLength={4}
                  value={receivePin}
                  onChange={(e) => setReceivePin(e.target.value.replace(/\D/g, ''))}
                  placeholder="Nhập 4 số (vd: 7291)"
                  className="w-40 h-10 px-3.5 rounded-2xl bg-black/50 border border-white/20 text-center text-sm font-black text-amber-300 tracking-widest placeholder-ice-muted focus:border-emerald-400 focus:outline-none font-mono"
                />
                <button
                  type="submit"
                  disabled={receivePin.length !== 4}
                  className="flex-1 h-10 rounded-2xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-black font-black text-xs shadow-lg transition-all"
                >
                  Tra Cứu
                </button>
              </form>

              {/* Found Item Display */}
              {foundItem && (
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-2.5 animate-scale-up">
                  <div className="flex items-center justify-between text-xs font-bold text-emerald-400">
                    <span>Tìm thấy chia sẻ từ: {foundItem.senderName}</span>
                    <span className="text-[10px] text-ice-muted">Mã: {foundItem.pinCode}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-black/50 border border-white/10 text-xs text-white break-all select-text font-mono">
                    {foundItem.content}
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => handleCopy('found_' + foundItem.id, foundItem.content)}
                      className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs text-white font-bold flex items-center gap-1.5 transition-all"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>{copiedId === 'found_' + foundItem.id ? 'Đã sao chép!' : 'Sao Chép'}</span>
                    </button>
                    {foundItem.type === 'link' && (
                      <a
                        href={foundItem.content}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 rounded-xl bg-emerald-500 text-black text-xs font-black flex items-center gap-1.5 shadow"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Mở Link</span>
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Active Shares Stream (7 cols) */}
          <div className="lg:col-span-7 space-y-5">
            <div className="p-6 rounded-3xl bg-black/40 border border-white/10 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <Cloud className="w-4 h-4 text-amber-400" />
                  <h3 className="text-sm font-bold text-white">Danh Sách Chia Sẻ Đang Hoạt Động ({shares.length}/5)</h3>
                </div>
                <button
                  type="button"
                  onClick={loadCloudShares}
                  className="p-1.5 rounded-lg text-ice-muted hover:text-white hover:bg-white/10 transition-colors"
                  title="Làm mới danh sách"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>

              {shares.length === 0 ? (
                <div className="py-14 text-center space-y-3">
                  <Clock className="w-10 h-10 text-ice-muted/50 mx-auto" />
                  <p className="text-xs text-ice-muted">Chưa có chia sẻ nào trên Đám Mây.</p>
                  <p className="text-[11px] text-ice-muted/70">
                    Hãy tạo chia sẻ ở khung bên trái; chia sẻ sẽ tồn tại trong 10 phút rồi tự động biến mất.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {shares.map((item) => {
                    const isCopied = copiedId === item.id;
                    const timeLeftMin = Math.max(
                      0,
                      Math.round((new Date(item.expiresAt).getTime() - Date.now()) / 60000)
                    );

                    return (
                      <div
                        key={item.id}
                        className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-amber-400/50 transition-all space-y-3 group"
                      >
                        {/* Header: Sender & PIN Code */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-7 h-7 rounded-lg bg-amber-400/20 text-amber-300 border border-amber-400/30 flex items-center justify-center text-xs font-black">
                              {item.type === 'link' ? <LinkIcon className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />}
                            </span>
                            <div>
                              <span className="text-xs font-bold text-white">{item.senderName}</span>
                              <span className="text-[10px] text-ice-muted block">
                                {new Date(item.createdAt).toLocaleTimeString()}
                              </span>
                            </div>
                          </div>

                          {/* 4-digit PIN Badge */}
                          <div className="flex items-center gap-2">
                            <div className="px-2.5 py-1 rounded-xl bg-black/60 border border-amber-400/50 flex items-center gap-1.5 shadow">
                              <KeyRound className="w-3 h-3 text-amber-400" />
                              <span className="text-xs font-mono font-black text-amber-300 tracking-wider">
                                {item.pinCode}
                              </span>
                            </div>
                            <span className="text-[10px] text-ice-muted flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>Còn ~{timeLeftMin}p</span>
                            </span>
                          </div>
                        </div>

                        {/* Content text */}
                        <div className="p-3 rounded-xl bg-black/40 border border-white/5 text-xs text-ice-text break-all select-text font-mono">
                          {item.content}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-end gap-2 pt-1">
                          {item.type === 'link' && (
                            <a
                              href={item.content}
                              target="_blank"
                              rel="noreferrer"
                              className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-xs text-white font-bold flex items-center gap-1.5 transition-colors"
                            >
                              <ExternalLink className="w-3 h-3" />
                              <span>Mở</span>
                            </a>
                          )}

                          <button
                            type="button"
                            onClick={() => handleCopy(item.id, item.content)}
                            className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-xs text-white font-bold flex items-center gap-1.5 transition-colors"
                          >
                            <Copy className="w-3 h-3" />
                            <span>{isCopied ? 'Đã chép!' : 'Sao chép'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => IceDropCloudService.deleteShare(item.id).then(loadCloudShares)}
                            className="p-1 rounded-lg text-ice-muted hover:text-red-400 transition-colors"
                            title="Xóa chia sẻ này"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DIRECT QR SCANNING TRANSFER (NO INTERNET NEEDED) */}
      {channel === 'direct' && (
        <div className="max-w-4xl mx-auto space-y-6">
          {isDesktop ? (
            /* PC View: Display QR code and direct message box */
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 p-6 rounded-3xl bg-black/40 border border-white/10 shadow-2xl">
              {/* QR Code Container (5 cols) */}
              <div className="md:col-span-5 flex flex-col items-center justify-center p-6 bg-white/[0.02] border border-white/10 rounded-2xl text-center space-y-4">
                <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-500 text-white shadow">
                  Mã QR Chia Sẻ Trực Tiếp
                </span>

                <div className="bg-white p-2.5 rounded-2xl shadow-2xl">
                  {directQrUrl ? (
                    <img src={directQrUrl} alt="Mã QR Direct" className="w-48 h-48 object-contain rounded-lg" />
                  ) : (
                    <div className="w-48 h-48 flex items-center justify-center bg-gray-200 rounded-lg text-gray-500 text-xs">
                      Đang tạo mã QR...
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-white">Quét bằng camera điện thoại</h4>
                  <p className="text-[11px] text-ice-muted max-w-xs">
                    Không cần có kết nối Internet. Điện thoại quét QR xong là 2 máy truyền dữ liệu trực tiếp 2 chiều.
                  </p>
                </div>
              </div>

              {/* Chat & File Send Area (7 cols) */}
              <div className="md:col-span-7 flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                      <Smartphone className="w-4 h-4 text-blue-400" />
                      <span>{directStatus}</span>
                    </span>
                  </div>

                  {/* Received Stream */}
                  <div className="h-48 overflow-y-auto custom-scrollbar p-3 rounded-2xl bg-black/50 border border-white/10 space-y-2">
                    {receivedDirectItems.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-xs text-ice-muted italic">
                        Chưa có dữ liệu nào được truyền.
                      </div>
                    ) : (
                      receivedDirectItems.map((item) => (
                        <div key={item.id} className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white flex items-center justify-between">
                          <span className="break-all font-mono">{item.content}</span>
                          <span className="text-[10px] text-ice-muted ml-2 shrink-0">{item.time}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Input box to send from PC to Phone */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={directText}
                    onChange={(e) => setDirectText(e.target.value)}
                    placeholder="Nhập text hoặc link gửi sang điện thoại..."
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/15 text-xs text-white focus:border-blue-400 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleSendDirectText}
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs tracking-wider uppercase shadow transition-all flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Gửi</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Mobile View: Button to open QR Scanner */
            <div className="p-8 rounded-3xl bg-black/40 border border-white/10 shadow-2xl text-center space-y-5">
              <div className="w-16 h-16 rounded-3xl bg-blue-500/20 text-blue-400 border border-blue-500/30 mx-auto flex items-center justify-center shadow-lg">
                <Camera className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-lg font-black text-white">Quét Mã QR Máy Tính</h3>
                <p className="text-xs text-ice-muted mt-1 max-w-sm mx-auto">
                  Hướng camera về mã QR trên máy tính để thiết lập đường truyền nội bộ trực tiếp hai chiều.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 text-xs text-left space-y-2">
                <span className="font-bold text-white block">Trạng thái hiện tại:</span>
                <span className="text-amber-300 font-mono block">{directStatus}</span>
              </div>

              <button
                type="button"
                onClick={() => setIsScannerOpen(true)}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs tracking-wider uppercase shadow-xl transition-all flex items-center justify-center gap-2"
              >
                <Camera className="w-4 h-4" />
                <span>Bật Camera Quét Mã QR Máy Tính</span>
              </button>

              {/* Direct chat/file send if connected */}
              {directConnectedHost && (
                <div className="pt-4 border-t border-white/10 space-y-3">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={directText}
                      onChange={(e) => setDirectText(e.target.value)}
                      placeholder="Nhập tin nhắn gửi thẳng tới PC..."
                      className="flex-1 px-3 py-2 rounded-xl bg-black/60 border border-white/20 text-xs text-white"
                    />
                    <button
                      type="button"
                      onClick={handleSendDirectText}
                      className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs"
                    >
                      Gửi
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* QR Scanner Modal for Phone */}
      <QRScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={handleDirectScanSuccess}
        title="Quét Mã QR Chia Sẻ Trực Tiếp"
        description="Quét mã QR hiển thị ở mục IceDrop trên máy tính"
      />
    </div>
  );
};
