import React, { useEffect, useState } from 'react';
import { useTheme } from '../../hooks/useTheme';

export const WaterRippleEffect: React.FC = () => {
  const { theme } = useTheme();
  const [isEnabled, setIsEnabled] = useState<boolean>(() => {
    try {
      return localStorage.getItem('icelauch_aqua_ripple_enabled') !== 'false';
    } catch {
      return true;
    }
  });

  useEffect(() => {
    const handleToggle = (e: any) => {
      if (typeof e.detail?.enabled === 'boolean') {
        setIsEnabled(e.detail.enabled);
      }
    };
    window.addEventListener('icelauch:aqua-ripple-toggle', handleToggle);
    return () => window.removeEventListener('icelauch:aqua-ripple-toggle', handleToggle);
  }, []);

  useEffect(() => {
    if (theme !== 'aqua' || !isEnabled) return;

    const handleClick = (e: MouseEvent) => {
      // Create single subtle water droplet ripple
      const ripple = document.createElement('div');
      ripple.className = 'water-ripple-circle';
      ripple.style.left = `${e.clientX}px`;
      ripple.style.top = `${e.clientY}px`;
      document.body.appendChild(ripple);

      setTimeout(() => {
        if (ripple.parentNode) {
          ripple.parentNode.removeChild(ripple);
        }
      }, 650);
    };

    window.addEventListener('click', handleClick, { passive: true });
    return () => window.removeEventListener('click', handleClick);
  }, [theme, isEnabled]);

  return null;
};
