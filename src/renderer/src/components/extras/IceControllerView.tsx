import React, { useState, useEffect, useRef } from 'react';
import {
  Gamepad2,
  MousePointer,
  Wifi,
  Bluetooth,
  Radio,
  Sparkles,
  Smartphone,
  Laptop,
  CheckCircle2,
  XCircle,
  Keyboard,
  Vibrate,
  RefreshCw
} from 'lucide-react';
import { isElectron } from '../../services/platformAdapter';

interface IceControllerViewProps {
  isAdmin?: boolean;
}

export const IceControllerView: React.FC<IceControllerViewProps> = () => {
  const isDesktop = isElectron();
  const [activeMode, setActiveMode] = useState<'gamepad' | 'trackpad'>('gamepad');
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

  // Client (Mobile/Web) Connection
  const [targetHostIp, setTargetHostIp] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [pingMs, setPingMs] = useState<number | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Analog Joystick State
  const [joystickPos, setJoystickPos] = useState({ x: 0, y: 0 });
  const joystickBaseRef = useRef<HTMLDivElement | null>(null);
  const isTouchingJoystick = useRef(false);

  // Load Host Status on Desktop PC
  useEffect(() => {
    if (isDesktop && window.api?.getControllerStatus) {
      window.api.getControllerStatus().then((st: any) => {
        setHostStatus(st);
        if (st.localIps.length > 0) {
          setTargetHostIp(st.localIps[0]);
        }
      });
    }
  }, [isDesktop]);

  const triggerHaptic = (ms: number = 30) => {
    try {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(ms);
      }
    } catch {}
  };

  const sendPacket = (packet: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(packet));
    }
  };

  const connectToHost = () => {
    if (!targetHostIp.trim()) return;
    try {
      if (wsRef.current) wsRef.current.close();
      const wsUrl = `ws://${targetHostIp.trim()}:${hostStatus.port || 18999}`;
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        setIsConnected(true);
        wsRef.current = ws;
        triggerHaptic(50);
        // Handshake
        sendPacket({ type: 'handshake', clientName: 'Icelauch Mobile Controller' });
      };

      ws.onmessage = (e) => {
        try {
          const res = JSON.parse(e.data);
          if (res.type === 'pong') {
            setPingMs(Date.now() - res.timestamp);
          }
        } catch {}
      };

      ws.onclose = () => {
        setIsConnected(false);
        wsRef.current = null;
      };

      ws.onerror = () => {
        setIsConnected(false);
      };
    } catch (e) {
      console.warn('Controller connection error:', e);
    }
  };

  const handleButtonPress = (btnName: string, pressed: boolean) => {
    triggerHaptic(pressed ? 25 : 10);
    sendPacket({ type: 'gamepad_btn', btn: btnName, pressed });
  };

  // Joystick touch handlers
  const handleJoystickMove = (clientX: number, clientY: number) => {
    if (!joystickBaseRef.current || !isTouchingJoystick.current) return;
    const rect = joystickBaseRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const maxRadius = rect.width / 2;

    const dx = clientX - centerX;
    const dy = clientY - centerY;
    const distance = Math.min(Math.sqrt(dx * dx + dy * dy), maxRadius);
    const angle = Math.atan2(dy, dx);

    const normX = (distance * Math.cos(angle)) / maxRadius;
    const normY = (distance * Math.sin(angle)) / maxRadius;

    setJoystickPos({ x: normX * (maxRadius * 0.7), y: normY * (maxRadius * 0.7) });
    sendPacket({ type: 'gamepad_axis', axis: 'left', x: normX, y: normY });
  };

  // Trackpad Touch Move
  const lastTouchRef = useRef<{ x: number; y: number } | null>(null);
  const handleTrackpadMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      if (lastTouchRef.current) {
        const dx = touch.clientX - lastTouchRef.current.x;
        const dy = touch.clientY - lastTouchRef.current.y;
        sendPacket({ type: 'mouse_move', dx, dy });
      }
      lastTouchRef.current = { x: touch.clientX, y: touch.clientY };
    }
  };

  return (
    <div className="w-full flex flex-col gap-5 p-4 sm:p-6 max-w-5xl mx-auto animate-fade-in">
      {/* Top Banner & Mode Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-black/40 border border-ice-border shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white flex items-center justify-center shadow-md">
            <Gamepad2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-black text-white flex items-center gap-2">
              IceController: Tay Cầm & Chuột Ảo
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-ice-accent/20 text-ice-accent border border-ice-accent/30">
                {isDesktop ? 'Chế độ Máy Chủ (PC Host)' : 'Chế độ Thiết Bị Điều Khiển (Client)'}
              </span>
            </h2>
            <p className="text-xs text-ice-muted">
              Biến điện thoại thành Gamepad đầy đủ phím hoặc bàn di chuột để điều khiển máy tính qua WiFi LAN / Bluetooth.
            </p>
          </div>
        </div>

        {/* Mode Selector */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-black/60 border border-ice-border">
          <button
            type="button"
            onClick={() => setActiveMode('gamepad')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeMode === 'gamepad' ? 'bg-ice-accent text-white shadow' : 'text-ice-muted hover:text-white'
            }`}
          >
            <Gamepad2 className="w-4 h-4" />
            <span>Tay Cầm (Gamepad)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveMode('trackpad')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeMode === 'trackpad' ? 'bg-ice-accent text-white shadow' : 'text-ice-muted hover:text-white'
            }`}
          >
            <MousePointer className="w-4 h-4" />
            <span>Chuột & Bàn Phím</span>
          </button>
        </div>
      </div>

      {/* Connection Bar */}
      <div className="p-4 rounded-xl bg-ice-surface/60 border border-ice-border flex flex-wrap items-center justify-between gap-4">
        {/* Connection Type */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setConnectionType('wifi')}
            className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
              connectionType === 'wifi' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'text-ice-muted hover:text-white'
            }`}
          >
            <Wifi className="w-3.5 h-3.5" />
            <span>WiFi LAN (WebSocket &lt; 5ms)</span>
          </button>
          <button
            type="button"
            onClick={() => setConnectionType('bluetooth')}
            className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
              connectionType === 'bluetooth' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'text-ice-muted hover:text-white'
            }`}
          >
            <Bluetooth className="w-3.5 h-3.5" />
            <span>Bluetooth</span>
          </button>
        </div>

        {/* IP Connect Field or PC Status */}
        {isDesktop ? (
          <div className="flex items-center gap-3 text-xs text-ice-muted">
            <span className="flex items-center gap-1 text-emerald-400 font-bold">
              <Radio className="w-4 h-4 animate-pulse" />
              <span>Máy chủ PC đang mở (Cổng {hostStatus.port})</span>
            </span>
            <span>Địa chỉ IP nội bộ: <strong className="text-white font-mono">{hostStatus.localIps.join(', ') || '127.0.0.1'}</strong></span>
            <span className="px-2 py-0.5 rounded bg-white/10 text-white font-bold">
              {hostStatus.connectedClients} điện thoại đang kết nối
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={targetHostIp}
              onChange={(e) => setTargetHostIp(e.target.value)}
              placeholder="Nhập IP máy tính (VD: 192.168.1.15)"
              className="h-8 px-3 rounded-lg bg-black/50 border border-ice-border text-xs text-white font-mono placeholder-ice-muted focus:outline-none focus:border-ice-accent w-48"
            />
            <button
              type="button"
              onClick={connectToHost}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow flex items-center gap-1 ${
                isConnected
                  ? 'bg-emerald-500 text-black'
                  : 'bg-ice-accent hover:bg-blue-500 text-white'
              }`}
            >
              {isConnected ? <CheckCircle2 className="w-3.5 h-3.5" /> : <RefreshCw className="w-3.5 h-3.5" />}
              <span>{isConnected ? 'Đã Kết Nối' : 'Kết Nối'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Controller Surface */}
      {activeMode === 'gamepad' ? (
        /* VIRTUAL GAMEPAD LAYOUT */
        <div className="relative w-full min-h-[380px] p-6 rounded-3xl bg-gradient-to-b from-slate-900/90 to-black/90 border border-ice-border shadow-2xl flex flex-col justify-between select-none">
          {/* Top Shoulder Buttons (LB, LT, RB, RT) */}
          <div className="flex justify-between items-center gap-4">
            <div className="flex gap-2">
              <button
                type="button"
                onMouseDown={() => handleButtonPress('LT', true)}
                onMouseUp={() => handleButtonPress('LT', false)}
                onTouchStart={() => handleButtonPress('LT', true)}
                onTouchEnd={() => handleButtonPress('LT', false)}
                className="w-16 h-10 rounded-xl bg-white/10 active:bg-ice-accent text-white font-black text-xs border border-white/20 active:scale-95 transition-all shadow"
              >
                LT
              </button>
              <button
                type="button"
                onMouseDown={() => handleButtonPress('LB', true)}
                onMouseUp={() => handleButtonPress('LB', false)}
                onTouchStart={() => handleButtonPress('LB', true)}
                onTouchEnd={() => handleButtonPress('LB', false)}
                className="w-14 h-10 rounded-xl bg-white/10 active:bg-ice-accent text-white font-black text-xs border border-white/20 active:scale-95 transition-all shadow"
              >
                LB
              </button>
            </div>

            {/* Center Controls (Select, Home, Start) */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleButtonPress('SELECT', true)}
                className="px-3 py-1.5 rounded-lg bg-black/60 border border-white/10 active:bg-white/20 text-[10px] font-bold text-ice-muted active:text-white"
              >
                SELECT
              </button>
              <button
                type="button"
                onClick={() => handleButtonPress('START', true)}
                className="px-3 py-1.5 rounded-lg bg-black/60 border border-white/10 active:bg-white/20 text-[10px] font-bold text-ice-muted active:text-white"
              >
                START
              </button>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onMouseDown={() => handleButtonPress('RB', true)}
                onMouseUp={() => handleButtonPress('RB', false)}
                onTouchStart={() => handleButtonPress('RB', true)}
                onTouchEnd={() => handleButtonPress('RB', false)}
                className="w-14 h-10 rounded-xl bg-white/10 active:bg-ice-accent text-white font-black text-xs border border-white/20 active:scale-95 transition-all shadow"
              >
                RB
              </button>
              <button
                type="button"
                onMouseDown={() => handleButtonPress('RT', true)}
                onMouseUp={() => handleButtonPress('RT', false)}
                onTouchStart={() => handleButtonPress('RT', true)}
                onTouchEnd={() => handleButtonPress('RT', false)}
                className="w-16 h-10 rounded-xl bg-white/10 active:bg-ice-accent text-white font-black text-xs border border-white/20 active:scale-95 transition-all shadow"
              >
                RT
              </button>
            </div>
          </div>

          {/* Middle Body: Left Joystick + D-Pad & Right ABXY */}
          <div className="flex flex-wrap items-center justify-between gap-6 py-4">
            {/* Left Analog Joystick */}
            <div className="flex flex-col items-center gap-2">
              <div
                ref={joystickBaseRef}
                onTouchStart={(e) => {
                  isTouchingJoystick.current = true;
                  handleJoystickMove(e.touches[0].clientX, e.touches[0].clientY);
                }}
                onTouchMove={(e) => {
                  handleJoystickMove(e.touches[0].clientX, e.touches[0].clientY);
                }}
                onTouchEnd={() => {
                  isTouchingJoystick.current = false;
                  setJoystickPos({ x: 0, y: 0 });
                  sendPacket({ type: 'gamepad_axis', axis: 'left', x: 0, y: 0 });
                }}
                className="w-36 h-36 rounded-full bg-black/60 border-2 border-white/20 relative flex items-center justify-center shadow-inner cursor-pointer"
              >
                <div
                  style={{ transform: `translate(${joystickPos.x}px, ${joystickPos.y}px)` }}
                  className="w-16 h-16 rounded-full bg-gradient-to-tr from-slate-700 to-slate-500 border-2 border-white/40 shadow-xl flex items-center justify-center pointer-events-none transition-transform duration-75"
                >
                  <div className="w-5 h-5 rounded-full bg-black/40 border border-white/20" />
                </div>
              </div>
              <span className="text-[10px] font-bold text-ice-muted uppercase tracking-wider">Cần Analog Trái (L3)</span>
            </div>

            {/* D-PAD Cross */}
            <div className="relative w-36 h-36 flex items-center justify-center">
              {/* Up */}
              <button
                type="button"
                onMouseDown={() => handleButtonPress('UP', true)}
                onMouseUp={() => handleButtonPress('UP', false)}
                onTouchStart={() => handleButtonPress('UP', true)}
                onTouchEnd={() => handleButtonPress('UP', false)}
                className="absolute top-0 w-11 h-12 rounded-t-xl bg-white/10 active:bg-ice-accent border-t border-x border-white/20 active:scale-95 transition-all text-white font-bold"
              >
                ▲
              </button>
              {/* Down */}
              <button
                type="button"
                onMouseDown={() => handleButtonPress('DOWN', true)}
                onMouseUp={() => handleButtonPress('DOWN', false)}
                onTouchStart={() => handleButtonPress('DOWN', true)}
                onTouchEnd={() => handleButtonPress('DOWN', false)}
                className="absolute bottom-0 w-11 h-12 rounded-b-xl bg-white/10 active:bg-ice-accent border-b border-x border-white/20 active:scale-95 transition-all text-white font-bold"
              >
                ▼
              </button>
              {/* Left */}
              <button
                type="button"
                onMouseDown={() => handleButtonPress('LEFT', true)}
                onMouseUp={() => handleButtonPress('LEFT', false)}
                onTouchStart={() => handleButtonPress('LEFT', true)}
                onTouchEnd={() => handleButtonPress('LEFT', false)}
                className="absolute left-0 w-12 h-11 rounded-l-xl bg-white/10 active:bg-ice-accent border-l border-y border-white/20 active:scale-95 transition-all text-white font-bold"
              >
                ◀
              </button>
              {/* Right */}
              <button
                type="button"
                onMouseDown={() => handleButtonPress('RIGHT', true)}
                onMouseUp={() => handleButtonPress('RIGHT', false)}
                onTouchStart={() => handleButtonPress('RIGHT', true)}
                onTouchEnd={() => handleButtonPress('RIGHT', false)}
                className="absolute right-0 w-12 h-11 rounded-r-xl bg-white/10 active:bg-ice-accent border-r border-y border-white/20 active:scale-95 transition-all text-white font-bold"
              >
                ▶
              </button>
              {/* Center */}
              <div className="w-11 h-11 bg-white/5 border border-white/10 rounded-xs" />
            </div>

            {/* Right ABXY Buttons Diamond */}
            <div className="relative w-36 h-36 flex items-center justify-center">
              {/* Y Button (Top) */}
              <button
                type="button"
                onMouseDown={() => handleButtonPress('Y', true)}
                onMouseUp={() => handleButtonPress('Y', false)}
                onTouchStart={() => handleButtonPress('Y', true)}
                onTouchEnd={() => handleButtonPress('Y', false)}
                className="absolute top-0 w-11 h-11 rounded-full bg-amber-500/20 active:bg-amber-400 border border-amber-400/40 text-amber-300 active:text-black font-black text-sm shadow-lg active:scale-90 transition-all flex items-center justify-center"
              >
                Y
              </button>
              {/* A Button (Bottom) */}
              <button
                type="button"
                onMouseDown={() => handleButtonPress('A', true)}
                onMouseUp={() => handleButtonPress('A', false)}
                onTouchStart={() => handleButtonPress('A', true)}
                onTouchEnd={() => handleButtonPress('A', false)}
                className="absolute bottom-0 w-11 h-11 rounded-full bg-emerald-500/20 active:bg-emerald-400 border border-emerald-400/40 text-emerald-300 active:text-black font-black text-sm shadow-lg active:scale-90 transition-all flex items-center justify-center"
              >
                A
              </button>
              {/* X Button (Left) */}
              <button
                type="button"
                onMouseDown={() => handleButtonPress('X', true)}
                onMouseUp={() => handleButtonPress('X', false)}
                onTouchStart={() => handleButtonPress('X', true)}
                onTouchEnd={() => handleButtonPress('X', false)}
                className="absolute left-0 w-11 h-11 rounded-full bg-blue-500/20 active:bg-blue-400 border border-blue-400/40 text-blue-300 active:text-black font-black text-sm shadow-lg active:scale-90 transition-all flex items-center justify-center"
              >
                X
              </button>
              {/* B Button (Right) */}
              <button
                type="button"
                onMouseDown={() => handleButtonPress('B', true)}
                onMouseUp={() => handleButtonPress('B', false)}
                onTouchStart={() => handleButtonPress('B', true)}
                onTouchEnd={() => handleButtonPress('B', false)}
                className="absolute right-0 w-11 h-11 rounded-full bg-red-500/20 active:bg-red-400 border border-red-400/40 text-red-300 active:text-black font-black text-sm shadow-lg active:scale-90 transition-all flex items-center justify-center"
              >
                B
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* VIRTUAL TRACKPAD & MOUSE LAYOUT */
        <div className="w-full flex flex-col gap-4 select-none">
          {/* Touch Surface */}
          <div
            onTouchStart={(e) => {
              if (e.touches.length === 1) {
                lastTouchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
              }
            }}
            onTouchMove={handleTrackpadMove}
            onTouchEnd={() => {
              lastTouchRef.current = null;
            }}
            className="w-full h-72 rounded-3xl bg-black/60 border-2 border-dashed border-white/20 active:border-ice-accent flex flex-col items-center justify-center text-center p-6 cursor-crosshair shadow-inner"
          >
            <MousePointer className="w-10 h-10 text-white/30 mb-2" />
            <span className="font-bold text-sm text-white/70">Bàn Di Chuột Cảm Ứng (Trackpad)</span>
            <span className="text-xs text-ice-muted mt-1 max-w-sm">
              Di 1 ngón để điều khiển con trỏ chuột. Chạm 1 ngón để click chuột trái, chạm 2 ngón để click chuột phải.
            </span>
          </div>

          {/* Mouse Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onMouseDown={() => {
                triggerHaptic(20);
                sendPacket({ type: 'mouse_click', button: 'left', state: 'down' });
              }}
              onMouseUp={() => sendPacket({ type: 'mouse_click', button: 'left', state: 'up' })}
              onTouchStart={() => {
                triggerHaptic(20);
                sendPacket({ type: 'mouse_click', button: 'left', state: 'down' });
              }}
              onTouchEnd={() => sendPacket({ type: 'mouse_click', button: 'left', state: 'up' })}
              className="h-16 rounded-2xl bg-white/10 active:bg-ice-accent text-white font-bold text-sm border border-white/20 active:scale-98 transition-all flex items-center justify-center shadow"
            >
              Chuột Trái (Left Click)
            </button>
            <button
              type="button"
              onMouseDown={() => {
                triggerHaptic(20);
                sendPacket({ type: 'mouse_click', button: 'right', state: 'down' });
              }}
              onMouseUp={() => sendPacket({ type: 'mouse_click', button: 'right', state: 'up' })}
              onTouchStart={() => {
                triggerHaptic(20);
                sendPacket({ type: 'mouse_click', button: 'right', state: 'down' });
              }}
              onTouchEnd={() => sendPacket({ type: 'mouse_click', button: 'right', state: 'up' })}
              className="h-16 rounded-2xl bg-white/10 active:bg-ice-accent text-white font-bold text-sm border border-white/20 active:scale-98 transition-all flex items-center justify-center shadow"
            >
              Chuột Phải (Right Click)
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
