import React, { useEffect, useRef } from 'react';
import type { SeasonTheme, ParticleConfig } from '../../types';

interface SeasonalParticleEngineProps {
  config?: ParticleConfig;
  enabled?: boolean;
  lowSpecMode?: boolean;
}

interface Particle {
  x: number;
  y: number;
  size: number;
  speedY: number;
  speedX: number;
  angle: number;
  angleSpeed: number;
  opacity: number;
  color: string;
  glowColor: string;
  glowBlur: number;
  customPhase?: number;
}

export const SeasonalParticleEngine: React.FC<SeasonalParticleEngineProps> = ({
  config,
  enabled = true,
  lowSpecMode = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const theme: SeasonTheme = config?.theme || 'winter';
  const speed = config?.speed ?? 1.0;
  const density = config?.density ?? 35;
  const globalOpacity = config?.opacity ?? 0.7;

  useEffect(() => {
    // If lowSpecMode is active or disabled or theme is none, do not run canvas loop
    if (!enabled || lowSpecMode || theme === 'none') {
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let isPaused = false;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Pause rendering when window is minimized or hidden to save energy
    const handleVisibilityChange = () => {
      if (document.hidden) {
        isPaused = true;
        cancelAnimationFrame(animId);
      } else {
        isPaused = false;
        animId = requestAnimationFrame(render);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Color palettes per theme
    const getParticleParams = () => {
      switch (theme) {
        case 'autumn':
          return {
            colors: ['rgba(234, 88, 12, ', 'rgba(217, 119, 6, ', 'rgba(245, 158, 11, ', 'rgba(180, 83, 9, '],
            glow: 'rgba(245, 158, 11, 0.4)',
            size: Math.random() * 4 + 3,
            speedY: (Math.random() * 0.7 + 0.4) * speed,
            speedX: (Math.random() * 0.8 - 0.2) * speed,
          };
        case 'spring':
          return {
            colors: ['rgba(244, 114, 182, ', 'rgba(251, 146, 60, ', 'rgba(253, 164, 175, ', 'rgba(249, 168, 212, '],
            glow: 'rgba(244, 114, 182, 0.4)',
            size: Math.random() * 3.5 + 2.5,
            speedY: (Math.random() * 0.6 + 0.3) * speed,
            speedX: (Math.random() * 0.7 - 0.2) * speed,
          };
        case 'summer': // Fireflies
          return {
            colors: ['rgba(163, 230, 53, ', 'rgba(250, 204, 21, ', 'rgba(74, 222, 128, '],
            glow: 'rgba(163, 230, 53, 0.8)',
            size: Math.random() * 2.2 + 1.2,
            speedY: (Math.random() * 0.4 - 0.2) * speed,
            speedX: (Math.random() * 0.4 - 0.2) * speed,
          };
        case 'cyber': // Stardust neon
          return {
            colors: ['rgba(56, 189, 248, ', 'rgba(168, 85, 247, ', 'rgba(99, 102, 241, ', 'rgba(45, 212, 191, '],
            glow: 'rgba(56, 189, 248, 0.6)',
            size: Math.random() * 2.2 + 1.0,
            speedY: (-(Math.random() * 0.5 + 0.2)) * speed, // drift upwards
            speedX: (Math.random() * 0.4 - 0.2) * speed,
          };
        case 'winter':
        default:
          return {
            colors: ['rgba(224, 242, 254, ', 'rgba(186, 230, 253, ', 'rgba(240, 249, 255, '],
            glow: 'rgba(79, 140, 255, 0.4)',
            size: Math.random() * 2.2 + 0.8,
            speedY: (Math.random() * 0.6 + 0.3) * speed,
            speedX: (Math.random() * 0.3 - 0.15) * speed,
          };
      }
    };

    const count = Math.min(80, Math.max(15, density));
    const particles: Particle[] = Array.from({ length: count }).map(() => {
      const p = getParticleParams();
      const baseColor = p.colors[Math.floor(Math.random() * p.colors.length)];
      return {
        x: Math.random() * width,
        y: Math.random() * height,
        size: p.size,
        speedY: p.speedY,
        speedX: p.speedX,
        angle: Math.random() * Math.PI * 2,
        angleSpeed: (Math.random() * 0.03 - 0.015) * speed,
        opacity: Math.random() * 0.4 + 0.3,
        color: baseColor,
        glowColor: p.glow,
        glowBlur: theme === 'summer' ? 8 : 4,
        customPhase: Math.random() * Math.PI * 2,
      };
    });

    const render = () => {
      if (isPaused) return;
      ctx.clearRect(0, 0, width, height);

      particles.forEach((p) => {
        p.angle += p.angleSpeed;
        p.customPhase = (p.customPhase ?? 0) + 0.03 * speed;

        if (theme === 'summer') {
          // Floating pulsating fireflies
          p.x += Math.sin(p.angle) * 0.6 * speed + p.speedX;
          p.y += Math.cos(p.angle * 0.7) * 0.5 * speed + p.speedY;
          // Pulse opacity
          const pulse = (Math.sin(p.customPhase) + 1) / 2;
          const currentAlpha = Math.max(0.1, pulse * p.opacity * globalOpacity);

          ctx.save();
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = `${p.color}${currentAlpha})`;
          ctx.shadowColor = p.glowColor;
          ctx.shadowBlur = p.glowBlur * pulse;
          ctx.fill();
          ctx.restore();
        } else if (theme === 'autumn') {
          // Fluttering falling leaves
          p.y += p.speedY;
          p.x += Math.sin(p.angle) * 1.2 * speed + p.speedX;

          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.angle);
          ctx.beginPath();
          // Draw leaf shape
          ctx.ellipse(0, 0, p.size * 1.6, p.size * 0.8, 0, 0, Math.PI * 2);
          ctx.fillStyle = `${p.color}${p.opacity * globalOpacity})`;
          ctx.shadowColor = p.glowColor;
          ctx.shadowBlur = p.glowBlur;
          ctx.fill();
          ctx.restore();
        } else if (theme === 'spring') {
          // Sakura petals
          p.y += p.speedY;
          p.x += Math.sin(p.angle) * 0.9 * speed + p.speedX;

          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.angle);
          ctx.beginPath();
          // Petal shape
          ctx.ellipse(0, 0, p.size * 1.3, p.size * 0.7, Math.PI / 4, 0, Math.PI * 2);
          ctx.fillStyle = `${p.color}${p.opacity * globalOpacity})`;
          ctx.shadowColor = p.glowColor;
          ctx.shadowBlur = p.glowBlur;
          ctx.fill();
          ctx.restore();
        } else if (theme === 'cyber') {
          // Cyber stardust upward drift
          p.y += p.speedY;
          p.x += Math.sin(p.angle) * 0.4 * speed + p.speedX;

          ctx.save();
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = `${p.color}${p.opacity * globalOpacity})`;
          ctx.shadowColor = p.glowColor;
          ctx.shadowBlur = p.glowBlur;
          ctx.fill();
          ctx.restore();
        } else {
          // Winter snowflakes
          p.y += p.speedY;
          p.x += Math.sin(p.angle) * 0.6 * speed + p.speedX;

          ctx.save();
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = `${p.color}${p.opacity * globalOpacity})`;
          ctx.shadowColor = p.glowColor;
          ctx.shadowBlur = p.glowBlur;
          ctx.fill();
          ctx.restore();
        }

        // Boundary wrap
        if (theme === 'cyber') {
          if (p.y < -10) {
            p.y = height + 10;
            p.x = Math.random() * width;
          }
        } else {
          if (p.y > height + 10) {
            p.y = -10;
            p.x = Math.random() * width;
          }
        }
        if (p.x > width + 10) p.x = -10;
        if (p.x < -10) p.x = width + 10;
      });

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [theme, speed, density, globalOpacity, enabled, lowSpecMode]);

  if (!enabled || lowSpecMode || theme === 'none') {
    return null;
  }

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-10"
      style={{
        mixBlendMode: 'screen',
        transform: 'translateZ(0)',
        willChange: 'transform',
      }}
    />
  );
};

