import React, { useState, useEffect } from 'react';
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
  Laptop
} from 'lucide-react';
import type { IceDropShareItem, UserProfile } from '../../types';

interface IceDropViewProps {
  activeProfile: UserProfile | null;
}

export const IceDropView: React.FC<IceDropViewProps> = ({ activeProfile }) => {
  const [channel, setChannel] = useState<'cloud' | 'bluetooth'>('cloud');

  // Cloud Shares State
  const [shares, setShares] = useState<IceDropShareItem[]>([]);
  const [inputContent, setInputContent] = useState('');
  const [shareType, setShareType] = useState<'text' | 'link'>('text');
  const [receiveCode, setReceiveCode] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Bluetooth P2P State
  const [p2pCode, setP2pCode] = useState('');
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [transferProgress, setTransferProgress] = useState<number | null>(null);

  // Load Cloud Shares from Electron or LocalStorage
  const loadShares = async () => {
    if (window.api?.getIceDropShares) {
      try {
        const loaded = await window.api.getIceDropShares();
        setShares(loaded || []);
      } catch (e) {
        console.warn('Error loading ice drop shares:', e);
      }
    } else {
      // LocalStorage fallback for mobile
      try {
        const stored = localStorage.getItem('icelauch_icedrop_shares');
        if (stored) {
          const list: IceDropShareItem[] = JSON.parse(stored);
          const now = new Date().toISOString();
          const valid = list.filter((s) => s.expiresAt > now);
          setShares(valid);
        }
      } catch {}
    }
  };

  useEffect(() => {
    loadShares();
    const interval = setInterval(loadShares, 10000); // 10s auto refresh
    return () => clearInterval(interval);
  }, []);

  const handleCreateShare = async () => {
    if (!inputContent.trim()) return;

    // Check max 5 shares limit
    if (shares.length >= 5) {
      const confirmDelete = window.confirm(
        'Đã đạt giới hạn tối đa 5 phần chia sẻ. Bạn có muốn tự động xóa phần chia sẻ cũ nhất để tiếp tục không?'
      );
      if (!confirmDelete) return;

      // Delete oldest
      const oldest = shares[shares.length - 1];
      if (oldest) {
        await handleDeleteShare(oldest.id);
      }
    }

    const pinCode = Math.floor(1000 + Math.random() * 9000).toString();
    const newShareData: Omit<IceDropShareItem, 'id' | 'createdAt' | 'expiresAt'> = {
      senderProfileId: activeProfile?.id,
      senderName: activeProfile?.nickname || 'Khách',
      type: shareType,
      content: inputContent.trim(),
      pinCode,
    };

    if (window.api?.addIceDropShare) {
      const created = await window.api.addIceDropShare(newShareData);
      setShares((prev) => [created, ...prev.slice(0, 4)]);
    } else {
      const now = new Date();
      const expires = new Date(now.getTime() + 10 * 60 * 1000);
      const created: IceDropShareItem = {
        ...newShareData,
        id: `share-${Date.now()}`,
        createdAt: now.toISOString(),
        expiresAt: expires.toISOString(),
      };
      const updated = [created, ...shares.slice(0, 4)];
      setShares(updated);
      localStorage.setItem('icelauch_icedrop_shares', JSON.stringify(updated));
    }

    setInputContent('');
  };

  const handleDeleteShare = async (id: string) => {
    if (window.api?.deleteIceDropShare) {
      await window.api.deleteIceDropShare(id);
    }
    const updated = shares.filter((s) => s.id !== id);
    setShares(updated);
    localStorage.setItem('icelauch_icedrop_shares', JSON.stringify(updated));
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleReceiveByCode = () => {
    if (!receiveCode.trim()) return;
    const found = shares.find((s) => s.pinCode === receiveCode.trim());
    if (found) {
      alert(`Đã tìm thấy nội dung chia sẻ:\n\n${found.content}`);
      handleCopy(found.content, found.id);
    } else {
      alert(`Không tìm thấy phần chia sẻ nào khớp với mã "${receiveCode}" hoặc nội dung đã quá 10 phút tự hủy.`);
    }
    setReceiveCode('');
  };

  return (
    <div className="w-full flex flex-col gap-5 p-4 sm:p-6 max-w-4xl mx-auto animate-fade-in">
      {/* Top Banner & Mode Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-black/40 border border-ice-border shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 text-black flex items-center justify-center shadow-md">
            <Share2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-black text-white flex items-center gap-2">
              IceDrop: Chia Sẻ Dữ Liệu Nhanh
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                Tự hủy 10 Phút
              </span>
            </h2>
            <p className="text-xs text-ice-muted">
              Gửi nhanh liên kết, văn bản và tệp đa phương tiện giữa các thiết bị tức thì.
            </p>
          </div>
        </div>

        {/* Channel Selector */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-black/60 border border-ice-border">
          <button
            type="button"
            onClick={() => setChannel('cloud')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              channel === 'cloud' ? 'bg-amber-400 text-black shadow' : 'text-ice-muted hover:text-white'
            }`}
          >
            <Cloud className="w-4 h-4" />
            <span>Đám Mây (Text / Link)</span>
          </button>
          <button
            type="button"
            onClick={() => setChannel('bluetooth')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              channel === 'bluetooth' ? 'bg-blue-500 text-white shadow' : 'text-ice-muted hover:text-white'
            }`}
          >
            <Bluetooth className="w-4 h-4" />
            <span>Bluetooth / P2P File</span>
          </button>
        </div>
      </div>

      {channel === 'cloud' ? (
        /* CLOUD CHANNEL */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Left Form: Send New Item */}
          <div className="md:col-span-1 p-4 rounded-2xl bg-ice-surface/60 border border-ice-border flex flex-col gap-3 shadow-md">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Send className="w-4 h-4 text-amber-400" />
              <span>Gửi Dữ Liệu Lên Đám Mây</span>
            </h3>

            {/* Type Toggle */}
            <div className="grid grid-cols-2 gap-1 p-0.5 rounded-lg bg-black/40 border border-ice-border">
              <button
                type="button"
                onClick={() => setShareType('text')}
                className={`py-1 text-xs font-bold rounded ${
                  shareType === 'text' ? 'bg-white/20 text-white' : 'text-ice-muted hover:text-white'
                }`}
              >
                Văn Bản (Text)
              </button>
              <button
                type="button"
                onClick={() => setShareType('link')}
                className={`py-1 text-xs font-bold rounded ${
                  shareType === 'link' ? 'bg-white/20 text-white' : 'text-ice-muted hover:text-white'
                }`}
              >
                Đường Dẫn (Link)
              </button>
            </div>

            <textarea
              value={inputContent}
              onChange={(e) => setInputContent(e.target.value)}
              placeholder={shareType === 'link' ? 'Dán link web / video tại đây...' : 'Nhập văn bản cần gửi sang máy khác...'}
              rows={4}
              className="w-full p-2.5 rounded-xl bg-black/40 border border-ice-border text-xs text-white placeholder-ice-muted focus:outline-none focus:border-amber-400 resize-none font-medium"
            />

            <button
              type="button"
              onClick={handleCreateShare}
              disabled={!inputContent.trim()}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 disabled:opacity-50 text-xs font-black text-black shadow-lg transition-all flex items-center justify-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Chia Sẻ Ngay</span>
            </button>

            {/* Code Box for Cross-Account Receiver */}
            <div className="pt-3 border-t border-white/5 space-y-2">
              <label className="text-[11px] font-bold text-ice-muted flex items-center gap-1">
                <KeyRound className="w-3.5 h-3.5 text-ice-accent" />
                <span>Nhận từ tài khoản khác (Nhập mã 4 số):</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  maxLength={4}
                  value={receiveCode}
                  onChange={(e) => setReceiveCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="VD: 7421"
                  className="w-24 h-8 px-2 rounded-lg bg-black/40 border border-ice-border text-xs text-white text-center font-mono font-bold tracking-widest focus:outline-none focus:border-ice-accent"
                />
                <button
                  type="button"
                  onClick={handleReceiveByCode}
                  disabled={receiveCode.length !== 4}
                  className="flex-1 h-8 rounded-lg bg-ice-accent hover:bg-blue-500 disabled:opacity-50 text-xs font-bold text-white shadow transition-all"
                >
                  Lấy Dữ Liệu
                </button>
              </div>
            </div>

            <p className="text-[10px] text-ice-muted leading-tight">
              ⏳ Tối đa 5 phần chia sẻ. Tự động xóa sạch sau 10 phút để bảo vệ quyền riêng tư.
            </p>
          </div>

          {/* Right List: Active Shares */}
          <div className="md:col-span-2 p-4 rounded-2xl bg-ice-surface/60 border border-ice-border flex flex-col gap-3 shadow-md">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-emerald-400" />
                <span>Dữ Liệu Đang Khả Dụng ({shares.length} / 5)</span>
              </h3>
              <button
                type="button"
                onClick={loadShares}
                className="text-[11px] font-bold text-ice-accent hover:underline"
              >
                Làm mới
              </button>
            </div>

            {shares.length === 0 ? (
              <div className="py-16 text-center text-ice-muted text-xs space-y-2">
                <FileText className="w-8 h-8 text-white/20 mx-auto" />
                <p>Chưa có dữ liệu nào được chia sẻ trong 10 phút qua.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {shares.map((s) => (
                  <div
                    key={s.id}
                    className="p-3.5 rounded-xl bg-black/40 border border-ice-border hover:border-white/20 transition-all flex flex-col gap-2"
                  >
                    <div className="flex items-center justify-between text-[11px] text-ice-muted">
                      <div className="flex items-center gap-1.5">
                        {s.type === 'link' ? (
                          <LinkIcon className="w-3.5 h-3.5 text-blue-400" />
                        ) : (
                          <FileText className="w-3.5 h-3.5 text-amber-400" />
                        )}
                        <span className="font-bold text-white">{s.senderName}</span>
                        <span>• Mã PIN 4 số:</span>
                        <strong className="px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 font-mono text-xs border border-amber-400/30">
                          {s.pinCode}
                        </strong>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleCopy(s.content, s.id)}
                          className="p-1 rounded hover:bg-white/10 text-ice-muted hover:text-white transition-colors"
                          title="Sao chép nội dung"
                        >
                          {copiedId === s.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteShare(s.id)}
                          className="p-1 rounded hover:bg-red-500/10 text-ice-muted hover:text-red-400 transition-colors"
                          title="Xóa chia sẻ"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <p className="text-xs text-white break-all font-mono bg-black/30 p-2 rounded-lg border border-white/5 select-all">
                      {s.content}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* BLUETOOTH / P2P DIRECT FILE DROP */
        <div className="p-6 rounded-2xl bg-ice-surface/60 border border-ice-border flex flex-col items-center text-center gap-4 shadow-md">
          <div className="w-16 h-16 rounded-2xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-inner">
            <Bluetooth className="w-8 h-8 animate-pulse" />
          </div>

          <div className="space-y-1">
            <h3 className="text-sm font-black text-white">Truyền Tệp Trực Tiếp (Bluetooth / WiFi Direct P2P)</h3>
            <p className="text-xs text-ice-muted max-w-md">
              Gửi ảnh, video và tệp tài liệu trực tiếp giữa 2 máy mà không tải lên Cloud, không tốn dung lượng máy chủ.
            </p>
          </div>

          {/* Quick 4-Digit Pairing */}
          <div className="p-4 rounded-xl bg-black/40 border border-ice-border flex flex-col items-center gap-2 max-w-sm w-full">
            <span className="text-[11px] font-bold text-ice-muted uppercase">Mã Ghép Nối Thiết Bị:</span>
            <span className="text-2xl font-black font-mono tracking-widest text-amber-400">
              {p2pCode || '5824'}
            </span>
            <span className="text-[10px] text-ice-muted">
              Cùng tài khoản tự động nhận diện; khác tài khoản chỉ cần nhập mã trên để đồng ý ghép nối.
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              if (window.api?.browseFile) {
                window.api.browseFile({ title: 'Chọn tệp gửi qua IceDrop' }).then((f: any) => {
                  if (f) setSelectedFile(f);
                });
              } else {
                alert('Tính năng chọn file trực tiếp khả dụng trên PC và thiết bị Android đã kết nối.');
              }
            }}
            className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white shadow-lg transition-all flex items-center gap-2"
          >
            <FileUp className="w-4 h-4" />
            <span>Chọn Tệp Để Gửi</span>
          </button>

          {selectedFile && (
            <div className="p-3 rounded-xl bg-black/30 border border-emerald-500/30 text-emerald-400 text-xs font-mono flex items-center gap-2">
              <Check className="w-4 h-4" />
              <span>Đã sẵn sàng truyền tệp: {selectedFile}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
