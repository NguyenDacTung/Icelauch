import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Wifi,
  Radio,
  Gamepad2,
  Sliders,
  Sparkles,
  RotateCw,
  Vibrate,
  Volume2
} from 'lucide-react';
import type { GameControllerConfig, VirtualButtonBinding } from '../../types';
import { XBOX_STANDARD_BUTTONS } from '../../utils/controllerPresets';

interface MobileLandscapeGamepadProps {
  isOpen: boolean;
  onClose: () => void;
  hostIp: string;
  port?: number;
  gameTitle?: string;
  config?: GameControllerConfig;
}

export const MobileLandscapeGamepad: React.FC<MobileLandscapeGamepadProps> = ({
  isOpen,
  onClose,
  hostIp,
  port = 18999,
  gameTitle = 'Tay Cầm Ảo',
  config,
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [pingMs, setPingMs] = useState<number | null>(null);
  const [isPortrait, setIsPortrait] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  // Joystick touch state
  const joystickBaseRef = useRef<HTMLDivElement | null>(null);
  const [joystickThumb, setJoystickThumb] = useState({ x: 0, y: 0 });
  const isDraggingJoystick = useRef(false);

  // Active buttons from config or default Xbox
  const activeButtons: VirtualButtonBinding[] =
    config?.customButtons && config.customButtons.length > 0
      ? config.customButtons.filter((b) => b.enabled)
      : XBOX_STANDARD_BUTTONS;

  // 1. Orientation Handling
  useEffect(() => {
    if (!isOpen) return;

    const checkOrientation = () => {
      if (typeof window !== 'undefined') {
        const portrait = window.innerHeight > window.innerWidth;
        setIsPortrait(portrait);
      }
    };

    checkOrientation();
    window.addEventListener('resize', checkOrientation);

    // Try locking orientation to landscape
    try {
      if (screen?.orientation && (screen.orientation as any).lock) {
        (screen.orientation as any).lock('landscape').catch(() => {});
      }
    } catch {}

    return () => {
      window.removeEventListener('resize', checkOrientation);
      try {
        if (screen?.orientation && (screen.orientation as any).unlock) {
          (screen.orientation as any).unlock();
        }
      } catch {}
    };
  }, [isOpen]);

  // 2. WebSocket Connection to PC Host
  useEffect(() => {
    if (!isOpen || !hostIp) return;

    let pingInterval: any = null;
    const wsUrl = `ws://${hostIp.trim()}:${port}`;

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        triggerHaptic(40);
        ws.send(JSON.stringify({ type: 'handshake', clientName: 'Icelauch Mobile Gamepad' }));

        pingInterval = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }));
          }
        }, 2000);
      };

      ws.onmessage = (e) => {
        try {
          const res = JSON.parse(e.data);
          if (res.type === 'pong' && res.timestamp) {
            setPingMs(Date.now() - res.timestamp);
          }
        } catch {}
      };

      ws.onclose = () => {
        setIsConnected(false);
        setPingMs(null);
      };

      ws.onerror = () => {
        setIsConnected(false);
      };
    } catch (e) {
      console.warn('Gamepad WebSocket connect error:', e);
    }

    return () => {
      if (pingInterval) clearInterval(pingInterval);
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      setIsConnected(false);
    };
  }, [isOpen, hostIp, port]);

  if (!isOpen) return null;

  const triggerHaptic = (ms: number = 25) => {
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

  const handleBtnDown = (btn: VirtualButtonBinding) => {
    triggerHaptic(30);
    sendPacket({
      type: btn.type === 'key' ? 'key_press' : 'gamepad_btn',
      btn: btn.label,
      targetKey: btn.targetKey,
      pressed: true,
    });
  };

  const handleBtnUp = (btn: VirtualButtonBinding) => {
    sendPacket({
      type: btn.type === 'key' ? 'key_press' : 'gamepad_btn',
      btn: btn.label,
      targetKey: btn.targetKey,
      pressed: false,
    });
  };

  // Joystick touch handlers
  const handleJoystickMove = (clientX: number, clientY: number) => {
    if (!joystickBaseRef.current) return;
    const rect = joystickBaseRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const dx = clientX - centerX;
    const dy = clientY - centerY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const maxRadius = rect.width / 2;

    const angle = Math.atan2(dy, dx);
    const clampedDist = Math.min(dist, maxRadius);

    const thumbX = Math.cos(angle) * clampedDist;
    const thumbY = Math.sin(angle) * clampedDist;

    setJoystickThumb({ x: thumbX, y: thumbY });

    // Normalized axis: -1.0 to 1.0
    const normX = Math.round((thumbX / maxRadius) * 100) / 100;
    const normY = Math.round((thumbY / maxRadius) * 100) / 100;

    sendPacket({ type: 'gamepad_axis', axis: 'left', x: normX, y: normY });
  };

  const handleJoystickTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    isDraggingJoystick.current = true;
    triggerHaptic(20);
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    handleJoystickMove(clientX, clientY);
  };

  const handleJoystickTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDraggingJoystick.current) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    handleJoystickMove(clientX, clientY);
  };

  const handleJoystickTouchEnd = () => {
    isDraggingJoystick.current = false;
    setJoystickThumb({ x: 0, y: 0 });
    sendPacket({ type: 'gamepad_axis', axis: 'left', x: 0, y: 0 });
  };

  return (
    <div
      className="fixed inset-0 z-[100] bg-[#050608] text-white flex flex-col overflow-hidden select-none"
      style={{ touchAction: 'none' }}
    >
      {/* Rotation Notice if held vertically */}
      {isPortrait && (
        <div className="absolute inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center space-y-4 animate-fade-in">
          <div className="w-16 h-16 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center animate-bounce">
            <RotateCw className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-black text-white">Vui Lòng Xoay Ngang Điện Thoại</h2>
          <p className="text-xs text-ice-muted max-w-xs">
            Tay cầm ảo được thiết kế chuyên biệt cho màn hình ngang để đảm bảo khoảng cách hai tay bấm thoải mái nhất.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 rounded-xl bg-white/10 text-white text-xs font-bold"
          >
            Đóng Lại
          </button>
        </div>
      )}

      {/* Top Floating Minimal Bar */}
      <div className="absolute top-2 left-4 right-4 z-40 flex items-center justify-between pointer-events-none">
        {/* Connection & Game Info */}
        <div className="flex items-center gap-3 bg-black/60 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/10 pointer-events-auto">
          <Gamepad2 className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-bold text-white max-w-[150px] truncate">{gameTitle}</span>
          <div className="w-[1px] h-3 bg-white/20" />
          <div className="flex items-center gap-1.5 text-[10px] font-mono">
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
            <span className={isConnected ? 'text-emerald-400' : 'text-red-400'}>
              {isConnected ? (pingMs !== null ? `${pingMs}ms` : 'Đã kết nối') : 'Mất kết nối'}
            </span>
          </div>
        </div>

        {/* Exit Gamepad Button */}
        <button
          type="button"
          onClick={onClose}
          className="p-2 rounded-full bg-red-600/80 hover:bg-red-500 text-white shadow-lg pointer-events-auto transition-transform active:scale-90"
          title="Thoát tay cầm"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Main Full-Screen Landscape Gamepad Canvas */}
      <div className="flex-1 relative w-full h-full overflow-hidden">
        {/* Render Virtual Buttons based on Coordinates */}
        {activeButtons.map((btn) => {
          if (btn.type === 'joystick') {
            return (
              <div
                key={btn.id}
                ref={joystickBaseRef}
                onTouchStart={handleJoystickTouchStart}
                onTouchMove={handleJoystickTouchMove}
                onTouchEnd={handleJoystickTouchEnd}
                onMouseDown={handleJoystickTouchStart}
                onMouseMove={handleJoystickTouchMove}
                onMouseUp={handleJoystickTouchEnd}
                style={{
                  left: `${btn.x}%`,
                  top: `${btn.y}%`,
                  transform: 'translate(-50%, -50%)',
                  width: `${btn.size || 120}px`,
                  height: `${btn.size || 120}px`,
                }}
                className="absolute rounded-full border-2 border-white/20 bg-black/40 backdrop-blur-sm flex items-center justify-center shadow-2xl active:border-amber-400/60"
              >
                {/* Thumb Stick */}
                <div
                  style={{
                    transform: `translate(${joystickThumb.x}px, ${joystickThumb.y}px)`,
                  }}
                  className="w-14 h-14 rounded-full bg-gradient-to-tr from-gray-700 to-gray-500 border border-white/40 shadow-xl flex items-center justify-center text-[10px] font-black text-white/80 transition-transform duration-75"
                >
                  LS
                </div>
              </div>
            );
          }

          if (btn.type === 'dpad') {
            return (
              <div
                key={btn.id}
                style={{
                  left: `${btn.x}%`,
                  top: `${btn.y}%`,
                  transform: 'translate(-50%, -50%)',
                  width: `${btn.size || 110}px`,
                  height: `${btn.size || 110}px`,
                }}
                className="absolute grid grid-cols-3 grid-rows-3 gap-1 p-1 bg-black/40 backdrop-blur-sm rounded-2xl border border-white/15 shadow-xl"
              >
                <div />
                <button
                  type="button"
                  onTouchStart={() => handleBtnDown({ ...btn, label: 'UP', targetKey: 'ArrowUp' })}
                  onTouchEnd={() => handleBtnUp({ ...btn, label: 'UP', targetKey: 'ArrowUp' })}
                  className="bg-white/10 active:bg-amber-400 active:text-black rounded-lg flex items-center justify-center text-xs font-black"
                >
                  ▲
                </button>
                <div />
                <button
                  type="button"
                  onTouchStart={() => handleBtnDown({ ...btn, label: 'LEFT', targetKey: 'ArrowLeft' })}
                  onTouchEnd={() => handleBtnUp({ ...btn, label: 'LEFT', targetKey: 'ArrowLeft' })}
                  className="bg-white/10 active:bg-amber-400 active:text-black rounded-lg flex items-center justify-center text-xs font-black"
                >
                  ◀
                </button>
                <div className="bg-white/5 rounded-lg" />
                <button
                  type="button"
                  onTouchStart={() => handleBtnDown({ ...btn, label: 'RIGHT', targetKey: 'ArrowRight' })}
                  onTouchEnd={() => handleBtnUp({ ...btn, label: 'RIGHT', targetKey: 'ArrowRight' })}
                  className="bg-white/10 active:bg-amber-400 active:text-black rounded-lg flex items-center justify-center text-xs font-black"
                >
                  ▶
                </button>
                <div />
                <button
                  type="button"
                  onTouchStart={() => handleBtnDown({ ...btn, label: 'DOWN', targetKey: 'ArrowDown' })}
                  onTouchEnd={() => handleBtnUp({ ...btn, label: 'DOWN', targetKey: 'ArrowDown' })}
                  className="bg-white/10 active:bg-amber-400 active:text-black rounded-lg flex items-center justify-center text-xs font-black"
                >
                  ▼
                </button>
                <div />
              </div>
            );
          }

          // Individual Action Button (A, B, X, Y, LB, RB, LT, RT, Space, etc.)
          const btnColors = {
            A: 'active:bg-emerald-500 border-emerald-500/50 text-emerald-300',
            B: 'active:bg-red-500 border-red-500/50 text-red-300',
            X: 'active:bg-blue-500 border-blue-500/50 text-blue-300',
            Y: 'active:bg-amber-500 border-amber-500/50 text-amber-300',
          }[btn.label] || 'active:bg-amber-400 active:text-black border-white/20 text-white';

          return (
            <button
              key={btn.id}
              type="button"
              onTouchStart={() => handleBtnDown(btn)}
              onTouchEnd={() => handleBtnUp(btn)}
              onMouseDown={() => handleBtnDown(btn)}
              onMouseUp={() => handleBtnUp(btn)}
              style={{
                left: `${btn.x}%`,
                top: `${btn.y}%`,
                transform: 'translate(-50%, -50%)',
                width: `${btn.size || 55}px`,
                height: `${btn.size || 55}px`,
              }}
              className={`absolute rounded-full bg-white/10 backdrop-blur-md border-2 ${btnColors} shadow-xl flex flex-col items-center justify-center transition-transform active:scale-95`}
            >
              <span className="font-black text-sm tracking-wide">{btn.label}</span>
              {btn.targetKey && (
                <span className="text-[9px] opacity-60 font-mono">
                  {btn.targetKey.replace(/Key|Digit/, '')}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

