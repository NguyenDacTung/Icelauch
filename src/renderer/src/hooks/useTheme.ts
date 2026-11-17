import { useState, useEffect, useCallback } from 'react';

export type ThemeMode = 'solar' | 'lunar';

const STORAGE_KEY = 'icelauch_theme_mode';
const DEFAULT_THEME: ThemeMode = 'lunar';

export function getStoredTheme(): ThemeMode {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'solar' || saved === 'lunar') {
      return saved;
    }
  } catch (e) {
    console.warn('[useTheme] Error reading theme from storage:', e);
  }
  return DEFAULT_THEME;
}

export function applyThemeToDOM(theme: ThemeMode): void {
  try {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
    if (theme === 'solar') {
      root.classList.add('theme-solar');
      root.classList.remove('theme-lunar');
      root.classList.remove('dark');
    } else {
      root.classList.add('theme-lunar');
      root.classList.remove('theme-solar');
      root.classList.add('dark');
    }
  } catch (e) {
    console.warn('[useTheme] Error applying theme to DOM:', e);
  }
}

export function useTheme() {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    const initial = getStoredTheme();
    applyThemeToDOM(initial);
    return initial;
  });

  const setTheme = useCallback((newTheme: ThemeMode) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem(STORAGE_KEY, newTheme);
    } catch (e) {
      console.warn('[useTheme] Error saving theme to storage:', e);
    }
    applyThemeToDOM(newTheme);
    window.dispatchEvent(new CustomEvent('icelauch:theme-change', { detail: { theme: newTheme } }));
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      const next: ThemeMode = prev === 'solar' ? 'lunar' : 'solar';
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch (e) {
        console.warn('[useTheme] Error saving theme to storage:', e);
      }
      applyThemeToDOM(next);
      window.dispatchEvent(new CustomEvent('icelauch:theme-change', { detail: { theme: next } }));
      return next;
    });
  }, []);

  useEffect(() => {
    // Listen for theme changes across windows or components
    const handleThemeChange = (e: any) => {
      if (e.detail?.theme && e.detail.theme !== theme) {
        setThemeState(e.detail.theme);
      }
    };
    window.addEventListener('icelauch:theme-change', handleThemeChange);
    return () => window.removeEventListener('icelauch:theme-change', handleThemeChange);
  }, [theme]);

  return { theme, isSolar: theme === 'solar', isLunar: theme === 'lunar', setTheme, toggleTheme };
}
