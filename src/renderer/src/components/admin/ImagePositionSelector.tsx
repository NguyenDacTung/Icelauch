import React, { useState, useEffect, useRef } from 'react';
import { Move, Sliders, RotateCcw, ZoomIn, ZoomOut, Eye, Sparkles } from 'lucide-react';

interface ImagePositionSelectorProps {
  label: string;
  imageUrl?: string;
  aspectRatio?: 'banner' | 'cover' | 'listCard' | '16:9' | '4:6' | '1:1' | 'video' | 'audio';
  value?: string; // e.g. "50% 50%" or "center" or "50% 20%"
  onChange: (val: string) => void;
  zoom?: number;
  onZoomChange?: (zoom: number) => void;
  blur?: number;
  onBlurChange?: (blur: number) => void;
  darkness?: number;
  onDarknessChange?: (darkness: number) => void;
  edgeDarkness?: number;
  onEdgeDarknessChange?: (edgeDarkness: number) => void;
  sharpen?: number;
  onSharpenChange?: (sharpen: number) => void;
  demoTitle?: string;
}

export const ImagePositionSelector: React.FC<ImagePositionSelectorProps> = ({
  label,
  imageUrl,
  aspectRatio = 'banner',
  value = '50% 50%',
  onChange,
  zoom = 1,
  onZoomChange,
  blur = 0,
  onBlurChange,
  darkness = 30,
  onDarknessChange,
  edgeDarkness = 10,
  onEdgeDarknessChange,
  sharpen = 0,
  onSharpenChange,
  demoTitle,
}) => {
  // Parse initial X and Y percentages
  const parsePos = (posStr: string): [number, number] => {
    if (!posStr || posStr === 'center') return [50, 50];
    if (posStr === 'top' || posStr === 'center top') return [50, 0];
    if (posStr === 'bottom' || posStr === 'center bottom') return [50, 100];
    if (posStr === 'left' || posStr === 'left center') return [0, 50];
    if (posStr === 'right' || posStr === 'right center') return [100, 50];

    const parts = posStr.trim().split(/\s+/);
    let x = 50;
    let y = 50;

    if (parts.length >= 2) {
      const parsedX = parseFloat(parts[0].replace('%', ''));
      const parsedY = parseFloat(parts[1].replace('%', ''));
      if (!isNaN(parsedX)) x = Math.max(0, Math.min(100, parsedX));
      if (!isNaN(parsedY)) y = Math.max(0, Math.min(100, parsedY));
    } else if (parts.length === 1) {
      const parsed = parseFloat(parts[0].replace('%', ''));
      if (!isNaN(parsed)) y = Math.max(0, Math.min(100, parsed));
    }

    return [x, y];
  };

  const [posX, posY] = parsePos(value);
  const [xVal, setXVal] = useState(posX);
  const [yVal, setYVal] = useState(posY);
  const [currentZoom, setCurrentZoom] = useState(zoom || 1);
  const [currentBlur, setCurrentBlur] = useState(blur || 0);
  const [currentDarkness, setCurrentDarkness] = useState(darkness ?? 30);
  const [currentEdgeDarkness, setCurrentEdgeDarkness] = useState(edgeDarkness ?? 10);
  const [currentSharpen, setCurrentSharpen] = useState(sharpen || 0);
  const [isAdvanced, setIsAdvanced] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number; posX: number; posY: number } | null>(null);
  const previewBoxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const [nx, ny] = parsePos(value);
    setXVal(nx);
    setYVal(ny);
  }, [value]);

  useEffect(() => {
    if (zoom !== undefined) setCurrentZoom(zoom);
  }, [zoom]);

  useEffect(() => {
    if (blur !== undefined) setCurrentBlur(blur);
  }, [blur]);

  useEffect(() => {
    if (darkness !== undefined) setCurrentDarkness(darkness);
  }, [darkness]);

  useEffect(() => {
    if (edgeDarkness !== undefined) setCurrentEdgeDarkness(edgeDarkness);
  }, [edgeDarkness]);

  useEffect(() => {
    if (sharpen !== undefined) setCurrentSharpen(sharpen);
  }, [sharpen]);

  const updatePosition = (newX: number, newY: number) => {
    const clampedX = Math.round(Math.max(0, Math.min(100, newX)));
    const clampedY = Math.round(Math.max(0, Math.min(100, newY)));
    setXVal(clampedX);
    setYVal(clampedY);
    onChange(`${clampedX}% ${clampedY}%`);
  };

  const updateZoom = (newZ: number) => {
    const z = Math.round(Math.max(1, Math.min(3, newZ)) * 10) / 10;
    setCurrentZoom(z);
    if (onZoomChange) onZoomChange(z);
  };

  const updateBlur = (newB: number) => {
    setCurrentBlur(newB);
    if (onBlurChange) onBlurChange(newB);
  };

  const updateDarkness = (newD: number) => {
    setCurrentDarkness(newD);
    if (onDarknessChange) onDarknessChange(newD);
  };

  const updateEdgeDarkness = (newE: number) => {
    const clamped = Math.max(0, Math.min(100, newE));
    setCurrentEdgeDarkness(clamped);
    if (onEdgeDarknessChange) onEdgeDarknessChange(clamped);
  };

  const updateSharpen = (newS: number) => {
    const clamped = Math.max(0, Math.min(100, newS));
    setCurrentSharpen(clamped);
    if (onSharpenChange) onSharpenChange(clamped);
  };

  const handleReset = () => {
    updatePosition(50, 50);
    updateZoom(1);
    updateSharpen(0);
    if (aspectRatio === 'banner') {
      updateBlur(0);
      updateDarkness(30);
      updateEdgeDarkness(10);
    }
  };

  // Interactive Drag & Pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!previewBoxRef.current) return;
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      posX: xVal,
      posY: yVal,
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !dragStartRef.current || !previewBoxRef.current) return;
    const rect = previewBoxRef.current.getBoundingClientRect();
    const deltaX = ((e.clientX - dragStartRef.current.x) / rect.width) * 100;
    const deltaY = ((e.clientY - dragStartRef.current.y) / rect.height) * 100;

    // Moving mouse right should shift focus left (and vice versa)
    updatePosition(dragStartRef.current.posX - deltaX, dragStartRef.current.posY - deltaY);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    dragStartRef.current = null;
  };

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.1 : -0.1;
    updateZoom(currentZoom + delta);
  };

  const presets = [
    { label: 'Trên cùng', x: 50, y: 0 },
    { label: 'Chính giữa', x: 50, y: 50 },
    { label: 'Dưới cùng', x: 50, y: 100 },
    { label: 'Trái', x: 0, y: 50 },
    { label: 'Phải', x: 100, y: 50 },
  ];

  const gridPoints = [
    { name: '↖', x: 0, y: 0, tip: 'Góc trên trái' },
    { name: '↑', x: 50, y: 0, tip: 'Trên cùng' },
    { name: '↗', x: 100, y: 0, tip: 'Góc trên phải' },
    { name: '←', x: 0, y: 50, tip: 'Căn trái' },
    { name: '•', x: 50, y: 50, tip: 'Chính giữa' },
    { name: '→', x: 100, y: 50, tip: 'Căn phải' },
    { name: '↙', x: 0, y: 100, tip: 'Góc dưới trái' },
    { name: '↓', x: 50, y: 100, tip: 'Dưới cùng' },
    { name: '↘', x: 100, y: 100, tip: 'Góc dưới phải' },
  ];

  const currentObjPos = `${xVal}% ${yVal}%`;

  return (
    <div className="p-3.5 bg-black/50 border border-ice-border/80 rounded-xl space-y-3.5 shadow-lg select-none">
      {/* Header */}
      <div className="flex items-center justify-between text-xs border-b border-ice-border/60 pb-2">
        <label className="font-bold text-white flex items-center gap-2">
          <Move className="w-4 h-4 text-amber-400" />
          <span>{label}</span>
          <span className="text-[11px] text-amber-300 font-mono bg-black/60 px-2 py-0.5 rounded border border-amber-500/30">
            {currentObjPos} • {currentZoom.toFixed(1)}x
          </span>
        </label>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleReset}
            className="text-[11px] text-ice-subtext hover:text-white px-2 py-1 rounded bg-white/5 hover:bg-white/10 flex items-center gap-1 transition-colors"
            title="Khôi phục mặc định"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Tự động khớp</span>
          </button>
          <button
            type="button"
            onClick={() => setIsAdvanced(!isAdvanced)}
            className="text-[11px] text-ice-accent hover:underline flex items-center gap-1 px-2 py-1 rounded bg-ice-accent/10"
          >
            <Sliders className="w-3 h-3" />
            <span>{isAdvanced ? 'Gọn gàng' : 'Tuỳ chỉnh sâu'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
        {/* Left Side: Controls (Presets, Zoom, 9-point grid) */}
        <div className="space-y-3">
          {/* Quick presets */}
          <div className="space-y-1">
            <span className="text-[10px] text-ice-subtext font-medium">Căn nhanh:</span>
            <div className="flex flex-wrap gap-1.5">
              {presets.map((p) => {
                const active = xVal === p.x && yVal === p.y;
                return (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => updatePosition(p.x, p.y)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                      active
                        ? 'bg-amber-500 text-black shadow-md'
                        : 'bg-ice-card hover:bg-ice-hover text-ice-text border border-ice-border'
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 9-Point Alignment Grid & Instruction */}
          <div className="flex items-center gap-3">
            <div className="grid grid-cols-3 gap-1 w-24 p-1.5 bg-black/60 rounded-lg border border-ice-border flex-shrink-0">
              {gridPoints.map((pt) => {
                const active = Math.abs(xVal - pt.x) <= 15 && Math.abs(yVal - pt.y) <= 15;
                return (
                  <button
                    key={`${pt.x}-${pt.y}`}
                    type="button"
                    title={pt.tip}
                    onClick={() => updatePosition(pt.x, pt.y)}
                    className={`h-6 rounded text-xs flex items-center justify-center transition-colors ${
                      active
                        ? 'bg-amber-400 text-black font-bold shadow-sm'
                        : 'text-ice-subtext hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {pt.name}
                  </button>
                );
              })}
            </div>
            <div className="text-[11px] text-ice-subtext leading-relaxed">
              👉 <strong className="text-white">Kéo chuột trực tiếp</strong> trên khung ảnh bên phải để di chuyển ảnh tự do.
            </div>
          </div>

          {/* Zoom Slider */}
          <div className="space-y-1 bg-black/30 p-2 rounded-lg border border-ice-border/50">
            <div className="flex justify-between text-[11px] text-ice-subtext">
              <span className="flex items-center gap-1 font-medium text-white">
                <ZoomIn className="w-3.5 h-3.5 text-amber-400" />
                <span>Phóng to (Zoom ảnh):</span>
              </span>
              <span className="text-amber-300 font-mono font-bold">{currentZoom.toFixed(1)}x</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => updateZoom(currentZoom - 0.2)}
                className="p-1 rounded bg-ice-card hover:bg-ice-hover text-white text-xs"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <input
                type="range"
                min="1"
                max="3"
                step="0.05"
                value={currentZoom}
                onChange={(e) => updateZoom(parseFloat(e.target.value))}
                className="flex-1 accent-amber-400 h-1.5 bg-black/60 rounded-lg cursor-pointer"
              />
              <button
                type="button"
                onClick={() => updateZoom(currentZoom + 0.2)}
                className="p-1 rounded bg-ice-card hover:bg-ice-hover text-white text-xs"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Banner Effects: Blur & Darkness (if banner) */}
          {aspectRatio === 'banner' && isAdvanced && (
            <div className="space-y-2.5 pt-2 border-t border-ice-border/60 text-[11px]">
              {/* Blur Slider */}
              <div className="space-y-1">
                <div className="flex justify-between text-ice-subtext">
                  <span>Độ làm mờ banner (Blur):</span>
                  <span className="text-white font-mono">{currentBlur}px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="12"
                  step="1"
                  value={currentBlur}
                  onChange={(e) => updateBlur(parseInt(e.target.value, 10))}
                  className="w-full accent-amber-400 h-1.5 bg-black/60 rounded-lg cursor-pointer"
                />
              </div>

              {/* Darkness Slider */}
              <div className="space-y-1">
                <div className="flex justify-between text-ice-subtext">
                  <span>Độ tối lớp phủ (Darkness overlay):</span>
                  <span className="text-white font-mono">{currentDarkness}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="80"
                  step="5"
                  value={currentDarkness}
                  onChange={(e) => updateDarkness(parseInt(e.target.value, 10))}
                  className="w-full accent-amber-400 h-1.5 bg-black/60 rounded-lg cursor-pointer"
                />
              </div>

              {/* Edge Darkness Fade Slider */}
              <div className="space-y-1">
                <div className="flex justify-between text-ice-subtext">
                  <span>Độ mờ đen 2 bên viền (Edge Fade):</span>
                  <span className="text-white font-mono">{currentEdgeDarkness}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={currentEdgeDarkness}
                  onChange={(e) => updateEdgeDarkness(parseInt(e.target.value, 10))}
                  className="w-full accent-amber-400 h-1.5 bg-black/60 rounded-lg cursor-pointer"
                />
              </div>

              {/* Sharpen Slider */}
              <div className="space-y-1">
                <div className="flex justify-between text-ice-subtext">
                  <span className="flex items-center gap-1 text-amber-300 font-semibold">
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    <span>Làm nét ảnh (Sharpen):</span>
                  </span>
                  <span className="text-amber-300 font-mono font-bold">{currentSharpen}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={currentSharpen}
                  onChange={(e) => updateSharpen(parseInt(e.target.value, 10))}
                  className="w-full accent-amber-400 h-1.5 bg-black/60 rounded-lg cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* Sharpen Slider for Cover / Video when Advanced is on */}
          {aspectRatio !== 'banner' && isAdvanced && (
            <div className="space-y-2.5 pt-2 border-t border-ice-border/60 text-[11px]">
              <div className="space-y-1">
                <div className="flex justify-between text-ice-subtext">
                  <span className="flex items-center gap-1 text-amber-300 font-semibold">
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    <span>Làm nét ảnh (Sharpen):</span>
                  </span>
                  <span className="text-amber-300 font-mono font-bold">{currentSharpen}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={currentSharpen}
                  onChange={(e) => updateSharpen(parseInt(e.target.value, 10))}
                  className="w-full accent-amber-400 h-1.5 bg-black/60 rounded-lg cursor-pointer"
                />
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Interactive Live Canvas Preview */}
        <div className="flex flex-col items-center">
          <div className="flex items-center justify-between w-full text-[10px] text-ice-subtext mb-1.5 font-medium px-1">
            <span>
              {aspectRatio === 'banner' || aspectRatio === '16:9'
                ? 'Khung Banner 16:9 (Chuẩn Trang chủ & Thư viện):'
                : aspectRatio === 'cover'
                ? 'Khung Ảnh Bìa 16:9 (Chi tiết & Trình phát):'
                : aspectRatio === 'listCard' || aspectRatio === '4:6'
                ? 'Khung Thẻ Danh Sách 4:6 (2:3 chuẩn Poster rạp & Hộp game):'
                : aspectRatio === '1:1' || aspectRatio === 'audio'
                ? 'Khung Vuông 1:1 (Chuẩn Album nhạc):'
                : 'Khung Video 16:9:'}
            </span>
            <span className="text-amber-400 italic">Bấm & rê chuột để kéo ảnh</span>
          </div>

          <div
            ref={previewBoxRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
            className={`overflow-hidden rounded-xl border-2 border-amber-400/80 bg-black/95 relative shadow-2xl cursor-grab active:cursor-grabbing select-none transition-all ${
              aspectRatio === 'banner' || aspectRatio === '16:9'
                ? 'w-full aspect-video max-h-52'
                : aspectRatio === 'cover' || aspectRatio === 'video'
                ? 'w-64 aspect-video'
                : aspectRatio === '1:1' || aspectRatio === 'audio'
                ? 'w-40 aspect-square'
                : 'w-36 aspect-[2/3]'
            }`}
          >
            {imageUrl ? (
              <>
                {/* Embedded SVG Sharpen Matrix Filter */}
                <svg className="absolute w-0 h-0 overflow-hidden pointer-events-none" aria-hidden="true">
                  <defs>
                    <filter id={`svg-sharpen-${aspectRatio}`}>
                      <feConvolveMatrix
                        order="3"
                        preserveAlpha="true"
                        kernelMatrix={`0 -${((currentSharpen / 100) * 0.6).toFixed(2)} 0 -${((currentSharpen / 100) * 0.6).toFixed(2)} ${(1 + 4 * (currentSharpen / 100) * 0.6).toFixed(2)} -${((currentSharpen / 100) * 0.6).toFixed(2)} 0 -${((currentSharpen / 100) * 0.6).toFixed(2)} 0`}
                      />
                    </filter>
                  </defs>
                </svg>

                <img
                  src={imageUrl}
                  alt="Preview"
                  draggable={false}
                  style={{
                    objectPosition: currentObjPos,
                    transform: `scale(${currentZoom})`,
                    transformOrigin: currentObjPos,
                    filter: [
                      currentBlur > 0 ? `blur(${currentBlur}px)` : '',
                      currentSharpen > 10 ? `url(#svg-sharpen-${aspectRatio})` : '',
                      currentSharpen > 0 ? `contrast(${1 + (currentSharpen / 100) * 0.25}) brightness(${1 + (currentSharpen / 100) * 0.04})` : ''
                    ].filter(Boolean).join(' ') || undefined,
                    imageRendering: currentSharpen > 0 ? '-webkit-optimize-contrast' : 'auto'
                  }}
                  className="w-full h-full object-cover pointer-events-none transition-transform duration-75"
                />

                {/* Banner Darkness & Gradient Simulation overlay if applicable */}
                {aspectRatio === 'banner' && (
                  <>
                    {currentDarkness > 0 && (
                      <div
                        className="absolute inset-0 pointer-events-none"
                        style={{ backgroundColor: `rgba(15, 17, 21, ${currentDarkness / 100})` }}
                      />
                    )}
                    {/* Directional shadow controlled by currentEdgeDarkness */}
                    {currentEdgeDarkness > 0 && (
                      <div 
                        className="absolute inset-0 pointer-events-none" 
                        style={{
                          background: `linear-gradient(to right, rgba(0,0,0,${((currentEdgeDarkness) / 100) * 0.3}) 0%, transparent 20%, transparent 80%, rgba(18,20,26,${((currentEdgeDarkness) / 100) * 0.7}) 100%)`
                        }}
                      />
                    )}
                    <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-[#0F1115]/50 to-transparent pointer-events-none" />

                    {/* Simulated banner content to see real overlay */}
                    <div className="absolute bottom-2.5 left-3 pointer-events-none space-y-0.5 max-w-[180px]">
                      <span className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase bg-amber-400 text-black">
                        NỔI BẬT
                      </span>
                      <p className="text-xs font-black text-white truncate drop-shadow">
                        {demoTitle || 'Tiêu đề hiển thị Banner'}
                      </p>
                    </div>

                    {/* Simulated bottom right controls */}
                    <div className="absolute bottom-2 right-2 hidden sm:flex items-center gap-1 bg-black/70 px-1.5 py-0.5 rounded text-[8px] text-white/70 border border-white/10 pointer-events-none font-mono">
                      <span>‹ 1 / 5 ›</span>
                    </div>
                  </>
                )}

                {/* Cover (2:3) simulation overlay matching GameCard */}
                {aspectRatio === 'cover' && (
                  <>
                    <div className="absolute inset-0 bg-gradient-to-t from-[#171A21] via-transparent to-transparent opacity-90 pointer-events-none" />
                    <div className="absolute top-2 left-2 pointer-events-none">
                      <span className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase bg-ice-accent text-white shadow">
                        POSTER 2:3
                      </span>
                    </div>
                    <div className="absolute bottom-2 inset-x-2 pointer-events-none text-left">
                      <p className="text-[11px] font-bold text-white truncate drop-shadow">
                        {demoTitle || 'Tên Game Thẻ Dọc'}
                      </p>
                      <p className="text-[9px] text-amber-300 font-medium">Mô phỏng Trang Chủ</p>
                    </div>
                  </>
                )}

                {/* Video (16:9) simulation overlay */}
                {aspectRatio === 'video' && (
                  <>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                    <div className="absolute top-2 left-2 pointer-events-none">
                      <span className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase bg-red-600 text-white shadow">
                        16:9 VIDEO
                      </span>
                    </div>
                    <div className="absolute bottom-2 inset-x-2 pointer-events-none text-left">
                      <p className="text-[10px] font-bold text-white truncate drop-shadow">
                        {demoTitle || 'Tên Video'}
                      </p>
                    </div>
                  </>
                )}

                {/* Focal Point Indicator Crosshair while dragging */}
                {isDragging && (
                  <div
                    className="absolute w-6 h-6 border-2 border-amber-400 rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none shadow-[0_0_10px_rgba(251,191,36,0.9)] animate-pulse"
                    style={{ left: `${xVal}%`, top: `${yVal}%` }}
                  >
                    <div className="w-1.5 h-1.5 bg-amber-400 rounded-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                  </div>
                )}
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs text-ice-subtext italic">
                Chưa có ảnh để hiển thị
              </div>
            )}

            {/* Bottom info badge */}
            <div className="absolute bottom-0 inset-x-0 bg-black/80 text-center py-0.5 text-[9px] text-amber-300 font-mono backdrop-blur-sm border-t border-white/10 pointer-events-none">
              Tâm: {currentObjPos} • Zoom: {currentZoom.toFixed(1)}x
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
