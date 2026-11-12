import React, { useState } from 'react';
import {
  Sparkles,
  Gamepad2,
  Share2,
  Tv,
  Users,
  Lock,
  ArrowRight
} from 'lucide-react';
import { IceControllerView } from './IceControllerView';
import { IceDropView } from './IceDropView';
import type { UserProfile } from '../../types';

interface ExtrasViewProps {
  activeProfile: UserProfile | null;
  isAdmin?: boolean;
}

export const ExtrasView: React.FC<ExtrasViewProps> = ({ activeProfile, isAdmin }) => {
  const [activeSubTab, setActiveSubTab] = useState<'controller' | 'icedrop' | 'icecast' | 'borrow'>('controller');

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-ice-bg text-white custom-scrollbar select-none pb-12">
      {/* Subtab Header Navigation */}
      <div className="sticky top-0 z-20 backdrop-blur-md bg-ice-bg/85 border-b border-white/10 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-indigo-500 flex items-center justify-center text-white shadow-md">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm font-black tracking-wide">Trung Tâm Tiện Ích Mở Rộng</h1>
            <p className="text-[10px] text-ice-muted">Các công cụ kết nối, điều khiển và chia sẻ đa nền tảng</p>
          </div>
        </div>

        {/* Subtabs Bar */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-black/40 border border-white/10">
          <button
            type="button"
            onClick={() => setActiveSubTab('controller')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeSubTab === 'controller'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow'
                : 'text-ice-muted hover:text-white'
            }`}
          >
            <Gamepad2 className="w-3.5 h-3.5" />
            <span>IceController</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('icedrop')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeSubTab === 'icedrop'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-black shadow'
                : 'text-ice-muted hover:text-white'
            }`}
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>IceDrop</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('icecast')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeSubTab === 'icecast'
                ? 'bg-white/20 text-white shadow'
                : 'text-ice-muted hover:text-white'
            }`}
          >
            <Tv className="w-3.5 h-3.5" />
            <span>IceCast</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('borrow')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeSubTab === 'borrow'
                ? 'bg-white/20 text-white shadow'
                : 'text-ice-muted hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Bạn Bè & Mượn Máy</span>
          </button>
        </div>
      </div>

      {/* Main Content Body */}
      <div className="flex-1 flex flex-col p-2 sm:p-6">
        {activeSubTab === 'controller' && <IceControllerView isAdmin={isAdmin} />}
        {activeSubTab === 'icedrop' && <IceDropView activeProfile={activeProfile} />}

        {/* Phase 2 Preview: IceCast */}
        {activeSubTab === 'icecast' && (
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
        )}

        {/* Phase 2 Preview: Bạn Bè & Mượn Máy */}
        {activeSubTab === 'borrow' && (
          <div className="max-w-2xl mx-auto my-auto p-8 rounded-3xl bg-black/40 border border-white/10 text-center flex flex-col items-center gap-4 shadow-2xl animate-fade-in">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
              <Users className="w-8 h-8" />
            </div>
            <div className="space-y-1.5">
              <span className="px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-amber-400/20 text-amber-300 border border-amber-400/30">
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
