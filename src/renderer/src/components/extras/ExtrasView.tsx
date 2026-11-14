import React, { useState } from 'react';
import {
  Sparkles,
  Gamepad2,
  Share2,
  Tv,
  Users,
  ChevronRight,
  ArrowLeft,
  Wifi,
  Cloud,
  QrCode,
  ShieldCheck,
  CheckCircle2,
  Sliders
} from 'lucide-react';
import { IceControllerStation } from './IceControllerStation';
import { IceDropView } from './IceDropView';
import type { UserProfile } from '../../types';

interface ExtrasViewProps {
  activeProfile: UserProfile | null;
  isAdmin?: boolean;
}

export const ExtrasView: React.FC<ExtrasViewProps> = ({ activeProfile, isAdmin }) => {
  const [selectedTool, setSelectedTool] = useState<'controller' | 'icedrop' | 'icecast' | 'borrow' | null>(null);

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-ice-bg text-white custom-scrollbar select-none pb-12">
      {/* Top Header Navigation */}
      <div className="sticky top-0 z-20 backdrop-blur-md bg-ice-bg/85 border-b border-white/10 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {selectedTool ? (
            <button
              type="button"
              onClick={() => setSelectedTool(null)}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center gap-1.5 text-xs font-bold transition-all shadow"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Quay Lại Trung Tâm</span>
            </button>
          ) : (
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-indigo-500 flex items-center justify-center text-white shadow-md">
              <Sparkles className="w-4 h-4" />
            </div>
          )}
          <div>
            <h1 className="text-sm font-black tracking-wide">
              {selectedTool === 'controller'
                ? '🎮 Trạm Điều Khiển Tay Cầm Ảo'
                : selectedTool === 'icedrop'
                ? '⚡ IceDrop: Chia Sẻ Dữ Liệu Tức Thì'
                : selectedTool === 'icecast'
                ? '📺 IceCast: Chiếu Màn Hình Trong App'
                : selectedTool === 'borrow'
                ? '👥 Bạn Bè & Mượn Máy (Cloud Gaming)'
                : 'Trung Tâm Tiện Ích Mở Rộng'}
            </h1>
            <p className="text-[10px] text-ice-muted">
              {selectedTool
                ? 'Bấm nút quay lại để xem danh sách toàn bộ tiện ích'
                : 'Các công cụ kết nối, điều khiển và chia sẻ đa nền tảng'}
            </p>
          </div>
        </div>

        {/* Quick Switch Pills */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-black/40 border border-white/10">
          <button
            type="button"
            onClick={() => setSelectedTool(selectedTool === 'controller' ? null : 'controller')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              selectedTool === 'controller'
                ? 'bg-amber-400 text-black shadow font-black'
                : 'text-ice-muted hover:text-white'
            }`}
          >
            <Gamepad2 className="w-3.5 h-3.5" />
            <span>Điều Khiển</span>
          </button>
          <button
            type="button"
            onClick={() => setSelectedTool(selectedTool === 'icedrop' ? null : 'icedrop')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              selectedTool === 'icedrop'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow font-black'
                : 'text-ice-muted hover:text-white'
            }`}
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>IceDrop</span>
          </button>
        </div>
      </div>

      {/* Main Content Body */}
      <div className="flex-1 flex flex-col p-4 sm:p-8 max-w-6xl w-full mx-auto">
        {selectedTool === null ? (
          /* CARD-BASED DASHBOARD HUB */
          <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* CARD 1: IceController */}
              <div
                onClick={() => setSelectedTool('controller')}
                className="group relative p-6 rounded-3xl bg-gradient-to-b from-white/[0.05] to-black/40 border border-white/10 hover:border-amber-400/70 hover:shadow-2xl hover:shadow-amber-500/10 cursor-pointer transition-all duration-300 flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <Gamepad2 className="w-6 h-6" />
                    </div>
                    <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Hoạt Động</span>
                    </span>
                  </div>

                  <div>
                    <h3 className="text-lg font-black text-white group-hover:text-amber-300 transition-colors flex items-center gap-2">
                      <span>Trạm Điều Khiển Tay Cầm</span>
                      <ChevronRight className="w-4 h-4 opacity-50 group-hover:translate-x-1 transition-transform" />
                    </h3>
                    <p className="text-xs text-ice-muted leading-relaxed mt-1.5">
                      Dùng điện thoại làm tay cầm ảo (hoặc chuột & phím) chơi game trên PC qua Wi-Fi / Bluetooth. Tự động xoay ngang điện thoại khi vào trận.
                    </p>
                  </div>
                </div>

                <div className="pt-5 mt-5 border-t border-white/10 flex items-center justify-between text-xs font-bold text-amber-400">
                  <span className="flex items-center gap-1.5 text-ice-muted text-[11px]">
                    <QrCode className="w-3.5 h-3.5 text-amber-400" />
                    <span>Ghép nối 1 lần qua mã QR</span>
                  </span>
                  <span className="group-hover:underline">Cấu hình & Thử phím &rarr;</span>
                </div>
              </div>

              {/* CARD 2: IceDrop */}
              <div
                onClick={() => setSelectedTool('icedrop')}
                className="group relative p-6 rounded-3xl bg-gradient-to-b from-white/[0.05] to-black/40 border border-white/10 hover:border-blue-400/70 hover:shadow-2xl hover:shadow-blue-500/10 cursor-pointer transition-all duration-300 flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <Share2 className="w-6 h-6" />
                    </div>
                    <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-500/30">
                      Đám Mây & QR Direct
                    </span>
                  </div>

                  <div>
                    <h3 className="text-lg font-black text-white group-hover:text-blue-300 transition-colors flex items-center gap-2">
                      <span>IceDrop: Chia Sẻ Tức Thì</span>
                      <ChevronRight className="w-4 h-4 opacity-50 group-hover:translate-x-1 transition-transform" />
                    </h3>
                    <p className="text-xs text-ice-muted leading-relaxed mt-1.5">
                      Gửi văn bản, link nhanh qua Đám Mây với mã PIN 4 số (TTL 10 phút) hoặc quét mã QR truyền tệp tin hai chiều không cần Internet.
                    </p>
                  </div>
                </div>

                <div className="pt-5 mt-5 border-t border-white/10 flex items-center justify-between text-xs font-bold text-blue-400">
                  <span className="flex items-center gap-1.5 text-ice-muted text-[11px]">
                    <Cloud className="w-3.5 h-3.5 text-blue-400" />
                    <span>Hỗ trợ nhận chéo tài khoản</span>
                  </span>
                  <span className="group-hover:underline">Mở chia sẻ &rarr;</span>
                </div>
              </div>

              {/* CARD 3: IceCast (Phase 2 Preview) */}
              <div
                onClick={() => setSelectedTool('icecast')}
                className="group relative p-6 rounded-3xl bg-black/30 border border-white/10 hover:border-indigo-500/40 cursor-pointer transition-all duration-300 flex flex-col justify-between opacity-80 hover:opacity-100"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shadow-lg">
                      <Tv className="w-6 h-6" />
                    </div>
                    <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-white/10 text-ice-muted">
                      Giai Đoạn 2
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <span>IceCast: Chiếu Màn Hình Trong App</span>
                      <ChevronRight className="w-4 h-4 opacity-40" />
                    </h3>
                    <p className="text-xs text-ice-muted leading-relaxed mt-1.5">
                      Chiếu màn hình game hoặc phim giữa PC, Điện thoại và TV mà không rời khỏi app. Tự động ngắt kết nối an toàn ngay khi thoát app.
                    </p>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-white/5 text-[11px] text-ice-muted">
                  Đang phát triển cho bản cập nhật tiếp theo.
                </div>
              </div>

              {/* CARD 4: Mượn Máy & Bạn Bè (Phase 2 Preview) */}
              <div
                onClick={() => setSelectedTool('borrow')}
                className="group relative p-6 rounded-3xl bg-black/30 border border-white/10 hover:border-purple-500/40 cursor-pointer transition-all duration-300 flex flex-col justify-between opacity-80 hover:opacity-100"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center shadow-lg">
                      <Users className="w-6 h-6" />
                    </div>
                    <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-white/10 text-ice-muted">
                      Giai Đoạn 2
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <span>Bạn Bè & Mượn Máy (Cloud Gaming)</span>
                      <ChevronRight className="w-4 h-4 opacity-40" />
                    </h3>
                    <p className="text-xs text-ice-muted leading-relaxed mt-1.5">
                      Kết bạn theo mã bạn bè cá nhân. Mượn phần cứng máy tính của bạn bè để trải nghiệm game trong thư viện của bạn với cơ chế khóa bảo mật tuyệt đối khi thoát game.
                    </p>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-white/5 text-[11px] text-ice-muted">
                  Đang phát triển cho bản cập nhật tiếp theo.
                </div>
              </div>
            </div>
          </div>
        ) : selectedTool === 'controller' ? (
          <IceControllerStation isAdmin={isAdmin} />
        ) : selectedTool === 'icedrop' ? (
          <IceDropView activeProfile={activeProfile} />
        ) : selectedTool === 'icecast' ? (
          <div className="max-w-2xl mx-auto my-auto p-8 rounded-3xl bg-black/40 border border-white/10 text-center flex flex-col items-center gap-4 shadow-2xl animate-fade-in">
            <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
              <Tv className="w-8 h-8" />
            </div>
            <div className="space-y-1.5">
              <span className="px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Giai Đoạn 2 • Đang Phát Triển
              </span>
              <h2 className="text-lg font-black text-white">IceCast: Chiếu Màn Hình Trong App & Điều Khiển 2 Chiều</h2>
              <p className="text-xs text-ice-muted max-w-md">
                Chiếu màn hình game hoặc phim giữa PC, Điện thoại và TV mà không rời khỏi app. Tự động ngắt kết nối an toàn ngay khi thoát app.
              </p>
            </div>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto my-auto p-8 rounded-3xl bg-black/40 border border-white/10 text-center flex flex-col items-center gap-4 shadow-2xl animate-fade-in">
            <div className="w-16 h-16 rounded-2xl bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center">
              <Users className="w-8 h-8" />
            </div>
            <div className="space-y-1.5">
              <span className="px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30">
                Giai Đoạn 2 • Đang Phát Triển
              </span>
              <h2 className="text-lg font-black text-white">Cơ Chế Kết Bạn & Mượn Máy Chơi Game (P2P Cloud Gaming)</h2>
              <p className="text-xs text-ice-muted max-w-md">
                Kết bạn theo mã bạn bè cá nhân. Mượn phần cứng máy tính của bạn bè để trải nghiệm game trong thư viện của bạn với cơ chế khóa bảo mật tuyệt đối khi thoát game.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
