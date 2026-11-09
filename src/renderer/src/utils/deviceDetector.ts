export type DeviceType = 'windows_pc' | 'android_mobile' | 'android_tv';

export function detectHardwareDevice(): DeviceType {
  if (typeof navigator === 'undefined') return 'windows_pc';

  const ua = navigator.userAgent || '';

  // 1. Android TV / Smart TV detection
  if (/Android.*(TV|SmartTV|GoogleTV|AFTT|BRAVIA|MiTV|AppleTV|Leanback)/i.test(ua)) {
    return 'android_tv';
  }

  // 2. Android Smartphone / Mobile detection
  if (/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)) {
    return 'android_mobile';
  }

  // 3. Desktop Windows/PC
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

