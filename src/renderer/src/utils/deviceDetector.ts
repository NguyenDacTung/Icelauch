export type DeviceType = 'windows_pc' | 'android_mobile' | 'android_tv';

export function detectHardwareDevice(): DeviceType {
  // 0. Dedicated TV Build Target
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_APP_TARGET === 'tv') {
    return 'android_tv';
  }

  if (typeof navigator === 'undefined') return 'windows_pc';

  const ua = navigator.userAgent || '';

  // 1. Android TV / Smart TV / Leanback / Projector / TV Box detection
  if (/Android.*(TV|SmartTV|GoogleTV|AFTT|BRAVIA|MiTV|AppleTV|Leanback|Projector|Box|STB|OTT)/i.test(ua)) {
    return 'android_tv';
  }

  // 2. Landscape Widescreen Android without touch points = Android TV / Projector
  if (typeof window !== 'undefined' && window.innerWidth >= 1280 && window.innerHeight >= 720 && window.innerWidth > window.innerHeight) {
    if (!('ontouchstart' in window) || navigator.maxTouchPoints === 0) {
      return 'android_tv';
    }
  }

  // 3. Android Smartphone / Mobile detection
  if (/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)) {
    return 'android_mobile';
  }

  // 4. Desktop Windows/PC
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

