import React, { useEffect } from 'react';
import { useTheme } from '../../hooks/useTheme';

export const WaterRippleEffect: React.FC = () => {
  const { theme } = useTheme();

  useEffect(() => {
    if (theme !== 'aqua') return;

    const handleClick = (e: MouseEvent) => {
      // Don't trigger if clicked on slider or scrollbar
      const ripple = document.createElement('div');
      ripple.className = 'water-ripple-circle';
      ripple.style.left = `${e.clientX}px`;
      ripple.style.top = `${e.clientY}px`;
      document.body.appendChild(ripple);

      setTimeout(() => {
        if (ripple.parentNode) {
          ripple.parentNode.removeChild(ripple);
        }
      }, 900);
    };

    window.addEventListener('click', handleClick, { passive: true });
    return () => window.removeEventListener('click', handleClick);
  }, [theme]);

  return null;
};
