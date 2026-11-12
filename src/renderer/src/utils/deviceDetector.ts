export type DeviceType = 'windows_pc' | 'android_mobile' | 'android_tv';

export function isElectron(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean((window as any).api) || /Electron/i.test(navigator?.userAgent || '');
}

export function detectHardwareDevice(): DeviceType {
  // -1. Desktop Electron (Windows / macOS / Linux) - ALWAYS Native PC Desktop!
  if (isElectron()) {
    return 'windows_pc';
  }

  // 0. Dedicated TV Build Target (VITE_APP_TARGET=tv)
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_APP_TARGET === 'tv') {
    return 'android_tv';
  }

  if (typeof navigator === 'undefined') return 'windows_pc';

  const ua = navigator.userAgent || '';

  // 1. Android TV / Smart TV / Leanback / Projector / TV Box detection via User-Agent
  if (/Android.*(TV|SmartTV|GoogleTV|AFTT|BRAVIA|MiTV|AppleTV|Leanback|Projector|Box|STB|OTT)/i.test(ua)) {
    return 'android_tv';
  }

  // 2. Landscape Widescreen Android without touch points = Android TV / Projector
  // CRITICAL: MUST verify it is Android (/Android/i.test(ua)) so normal PC monitors are NEVER flagged as TV!
  if (/Android/i.test(ua) && typeof window !== 'undefined' && window.innerWidth >= 1280 && window.innerHeight >= 720 && window.innerWidth > window.innerHeight) {
    if (!('ontouchstart' in window) || navigator.maxTouchPoints === 0) {
      return 'android_tv';
    }
  }

  // 3. Android Smartphone / Mobile detection
  if (/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)) {
    return 'android_mobile';
  }

  // 4. Default: Desktop Windows/PC
  return 'windows_pc';
}

export function isMobileOrTV(device: DeviceType): boolean {
  return device === 'android_mobile' || device === 'android_tv';
}

export function isAndroidMobile(device: DeviceType): boolean {
  return device === 'android_mobile';
}

export function isAndroidTV(device: DeviceType): boolean {
  return device === 'android_tv';
}

