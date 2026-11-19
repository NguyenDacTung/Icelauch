import { useState, useEffect, useCallback } from 'react';

export type ThemeMode =
  | 'lunar'
  | 'solar'
  | 'aqua'
  | 'ignis'
  | 'aer'
  | 'terra'
  | 'eclipse'
  | 'aurora'
  | 'nebula';

export interface ThemeMeta {
  id: ThemeMode;
  name: string;
  subtitle: string;
  symbol: string;
  category: 'base' | 'specialized';
  description: string;
  isLight: boolean;
  radius: string;
  previewColors: {
    bg: string;
    card: string;
    accent: string;
    border: string;
  };
}

export const THEME_REGISTRY: ThemeMeta[] = [
  // --- 2 Base Modes ---
  {
    id: 'lunar',
    name: 'Lunar',
    subtitle: 'Lunar',
    symbol: '🌙',
    category: 'base',
    description: 'Chế độ ban đêm kính mờ sang trọng, dịu mắt chuẩn công thái học.',
    isLight: false,
    radius: '16px',
    previewColors: {
      bg: '#0B0F19',
      card: '#151C2C',
      accent: '#818CF8',
      border: '#1E293B',
    },
  },
  {
    id: 'solar',
    name: 'Solar',
    subtitle: 'Solar',
    symbol: '☀️',
    category: 'base',
    description: 'Chế độ ban ngày rực rỡ, sắc ngà ấm, tương phản siêu cao WCAG AAA/AA.',
    isLight: true,
    radius: '16px',
    previewColors: {
      bg: '#F8F6F1',
      card: '#FFFFFF',
      accent: '#D97706',
      border: '#E5E1D8',
    },
  },

  // --- 7 Specialized Modes ---
  {
    id: 'aqua',
    name: 'Aqua',
    subtitle: 'Aqua',
    symbol: '💧',
    category: 'specialized',
    description: 'Xanh nước nhạt tươi mát, sóng biển trôi êm ả, giọt nước trượt Navbar và màng nước hữu cơ.',
    isLight: true,
    radius: '24px',
    previewColors: {
      bg: '#CEEBF8',
      card: '#FFFFFF',
      accent: '#0284C7',
      border: '#7DD3FC',
    },
  },
  {
    id: 'ignis',
    name: 'Ignis',
    subtitle: 'Ignis',
    symbol: '🔥',
    category: 'specialized',
    description: 'Đá Obsidian vát chéo, nham thạch nóng chảy và lửa bốc nhiệt lượng chân thực.',
    isLight: false,
    radius: '8px',
    previewColors: {
      bg: '#110B09',
      card: '#1C120E',
      accent: '#F97316',
      border: '#4A2518',
    },
  },
  {
    id: 'aer',
    name: 'Aer',
    subtitle: 'Aer',
    symbol: '🍃',
    category: 'specialized',
    description: 'Lưới kiến trúc Swiss Wireframe, 0ms delay, tắt 100% blur và bóng đổ, siêu tối ưu pin 60/120 FPS.',
    isLight: true,
    radius: '10px',
    previewColors: {
      bg: '#EEF2F6',
      card: '#FFFFFF',
      accent: '#0284C7',
      border: '#CBD5E1',
    },
  },
  {
    id: 'terra',
    name: 'Terra',
    subtitle: 'Terra',
    symbol: '📜',
    category: 'specialized',
    description: 'Rừng đêm & đất nung đậm, viền đất nung, bọ rùa bò thanh nhạc và quả táo yêu thích.',
    isLight: false,
    radius: '12px',
    previewColors: {
      bg: '#161310',
      card: '#211C17',
      accent: '#65A30D',
      border: '#7C5332',
    },
  },
  {
    id: 'eclipse',
    name: 'Eclipse',
    subtitle: 'Eclipse',
    symbol: '🌑',
    category: 'specialized',
    description: 'Đen tuyệt đối #000000 tắt hoàn toàn điểm ảnh OLED, vành hào quang vàng tỏa nhẹ.',
    isLight: false,
    radius: '14px',
    previewColors: {
      bg: '#000000',
      card: '#0A0A0A',
      accent: '#F97316',
      border: '#222222',
    },
  },
  {
    id: 'aurora',
    name: 'Aurora',
    subtitle: 'Aurora',
    symbol: '✨',
    category: 'specialized',
    description: 'Dải ánh sáng Bắc Cực huyền ảo ngọc bích và tím uốn lượn liên tục trên toolbar, player, nền.',
    isLight: false,
    radius: '18px',
    previewColors: {
      bg: '#090D16',
      card: '#111827',
      accent: '#10B981',
      border: '#1E293B',
    },
  },
  {
    id: 'nebula',
    name: 'Nebula',
    subtitle: 'Nebula',
    symbol: '🌌',
    category: 'specialized',
    description: 'Trích xuất màu banner lan tỏa toàn màn hình, không gian vũ trụ sâu thẳm cùng bầu trời sao li ti lấp lánh.',
    isLight: false,
    radius: '12px',
    previewColors: {
      bg: '#0C081A',
      card: '#18102E',
      accent: '#A855F7',
      border: '#2D1E50',
    },
  },
];

const VALID_THEMES: Set<ThemeMode> = new Set([
  'lunar',
  'solar',
  'aqua',
  'ignis',
  'aer',
  'terra',
  'eclipse',
  'aurora',
  'nebula',
]);

const STORAGE_KEY = 'icelauch_theme_mode';
const DEFAULT_THEME: ThemeMode = 'lunar';

export function isLightMode(theme: ThemeMode): boolean {
  return theme === 'solar' || theme === 'aer' || theme === 'aqua';
}

export function getStoredTheme(): ThemeMode {
  try {
    const saved = localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
    if (saved && VALID_THEMES.has(saved)) {
      return saved;
    }
  } catch (e) {
    console.warn('[useTheme] Error reading theme from storage:', e);
  }
  return DEFAULT_THEME;
}

const ALL_THEME_CLASSES = [
  'theme-lunar',
  'theme-solar',
  'theme-aqua',
  'theme-ignis',
  'theme-aer',
  'theme-terra',
  'theme-eclipse',
  'theme-aurora',
  'theme-nebula',
];

export function applyThemeToDOM(theme: ThemeMode): void {
  try {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);

    // Clean up older theme classes and add active one
    ALL_THEME_CLASSES.forEach((cls) => root.classList.remove(cls));
    root.classList.add(`theme-${theme}`);

    // Manage standard Tailwind `.dark` flag
    if (isLightMode(theme)) {
      root.classList.remove('dark');
    } else {
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
      let next: ThemeMode;
      // If currently Solar, switch to Lunar
      if (prev === 'solar') {
        next = 'lunar';
      }
      // If currently Lunar, switch to Solar
      else if (prev === 'lunar') {
        next = 'solar';
      }
      // If in specialized mode, exit cleanly to base Solar or Lunar depending on lightness
      else {
        next = isLightMode(prev) ? 'lunar' : 'solar';
      }

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
      if (e.detail?.theme && e.detail.theme !== theme && VALID_THEMES.has(e.detail.theme)) {
        setThemeState(e.detail.theme);
      }
    };
    window.addEventListener('icelauch:theme-change', handleThemeChange);
    return () => window.removeEventListener('icelauch:theme-change', handleThemeChange);
  }, [theme]);

  const currentThemeMeta = THEME_REGISTRY.find((t) => t.id === theme) || THEME_REGISTRY[0];
  const isLight = isLightMode(theme);
  const isDark = !isLight;

  return {
    theme,
    isSolar: theme === 'solar',
    isLunar: theme === 'lunar',
    isLight,
    isDark,
    currentThemeMeta,
    themes: THEME_REGISTRY,
    setTheme,
    toggleTheme,
  };
}
