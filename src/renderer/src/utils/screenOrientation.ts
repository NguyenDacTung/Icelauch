import { registerPlugin } from '@capacitor/core';

interface ScreenOrientationPlugin {
  lockLandscape(): Promise<void>;
  unlock(): Promise<void>;
  lockPortrait(): Promise<void>;
}

export const ScreenOrientation = registerPlugin<ScreenOrientationPlugin>('ScreenOrientation');

/**
 * Lock orientation to landscape (with sensor support for 180° rotation)
 */
export async function lockToLandscape(): Promise<void> {
  // 1. Try standard W3C Screen Orientation API (Modern Browsers / Chrome WebView)
  try {
    if (typeof screen !== 'undefined' && screen.orientation && typeof (screen.orientation as any).lock === 'function') {
      await (screen.orientation as any).lock('landscape').catch(() => {});
    }
  } catch {}

  // 2. Try Native Android Capacitor Plugin
  try {
    await ScreenOrientation.lockLandscape();
  } catch {}
}

/**
 * Unlock orientation back to user/sensor free rotation
 */
export async function unlockOrientation(): Promise<void> {
  // 1. Try standard W3C Screen Orientation API
  try {
    if (typeof screen !== 'undefined' && screen.orientation && typeof (screen.orientation as any).unlock === 'function') {
      (screen.orientation as any).unlock();
    }
  } catch {}

  // 2. Try Native Android Capacitor Plugin
  try {
    await ScreenOrientation.unlock();
  } catch {}
}

/**
 * Lock orientation to portrait
 */
export async function lockToPortrait(): Promise<void> {
  try {
    if (typeof screen !== 'undefined' && screen.orientation && typeof (screen.orientation as any).lock === 'function') {
      await (screen.orientation as any).lock('portrait').catch(() => {});
    }
  } catch {}

  try {
    await ScreenOrientation.lockPortrait();
  } catch {}
}
