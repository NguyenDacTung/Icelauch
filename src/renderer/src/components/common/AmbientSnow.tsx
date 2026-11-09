import React, { useEffect, useRef } from 'react';

interface AmbientSnowProps {
  enabled?: boolean;
}

interface Snowflake {
  x: number;
  y: number;
  radius: number;
  speed: number;
  wind: number;
  opacity: number;
  swing: number;
  swingStep: number;
}

export const AmbientSnow: React.FC<AmbientSnowProps> = ({ enabled = true }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!enabled) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const flakeCount = Math.min(45, Math.floor(width / 35));
    const flakes: Snowflake[] = Array.from({ length: flakeCount }).map(() => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 1.8 + 0.8,
      speed: Math.random() * 0.5 + 0.3,
      wind: Math.random() * 0.4 - 0.2,
      opacity: Math.random() * 0.35 + 0.15,
      swing: Math.random() * 2,
      swingStep: Math.random() * 0.02 + 0.01,
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      flakes.forEach((f) => {
        f.y += f.speed;
        f.swing += f.swingStep;
        f.x += Math.sin(f.swing) * 0.5 + f.wind;

        if (f.y > height) {
          f.y = -5;
          f.x = Math.random() * width;
        }
        if (f.x > width) f.x = 0;
        if (f.x < 0) f.x = width;

        ctx.beginPath();
        ctx.arc(f.x, f.y, f.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(215, 235, 255, ${f.opacity})`;
        ctx.shadowColor = 'rgba(79, 140, 255, 0.4)';
        ctx.shadowBlur = 4;
        ctx.fill();
      });

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-10 opacity-70"
      style={{ mixBlendMode: 'screen' }}
    />
  );
};

