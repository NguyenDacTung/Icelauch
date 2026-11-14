import { registerPlugin } from '@capacitor/core';

export const CURRENT_MOBILE_VERSION = '1.1.4';
export const CURRENT_TV_VERSION = '1.0.0';
const GITHUB_REPO = 'NguyenDacTung/Icelauch';

interface ApkInstallerPluginInterface {
  downloadAndInstall(options: { url: string }): Promise<{ success: boolean; filePath?: string }>;
  addListener(
    eventName: 'downloadProgress',
    listenerFunc: (info: { progress: number }) => void
  ): Promise<{ remove: () => void }>;
  addListener(
    eventName: 'downloadError',
    listenerFunc: (info: { error: string }) => void
  ): Promise<{ remove: () => void }>;
}

export const ApkInstaller = registerPlugin<ApkInstallerPluginInterface>('ApkInstaller');

export interface MobileUpdateInfo {
  updateAvailable: boolean;
  currentVersion: string;
  latestVersion: string;
  releaseName: string;
  releaseNotes: string;
  apkUrl: string;
}

export interface TVUpdateInfo {
  updateAvailable: boolean;
  currentVersion: string;
  latestVersion: string;
  releaseName: string;
  releaseNotes: string;
  apkUrl: string;
}

// Compare semantic version strings (e.g. "1.0.3" vs "1.0.2")
function isNewerVersion(remote: string, current: string): boolean {
  const cleanRemote = remote.replace(/^(v|phone-v|tv-v)/i, '').trim();
  const cleanCurrent = current.replace(/^(v|phone-v|tv-v)/i, '').trim();

  const rParts = cleanRemote.split('.').map((n) => parseInt(n, 10) || 0);
  const cParts = cleanCurrent.split('.').map((n) => parseInt(n, 10) || 0);

  for (let i = 0; i < Math.max(rParts.length, cParts.length); i++) {
    const r = rParts[i] || 0;
    const c = cParts[i] || 0;
    if (r > c) return true;
    if (r < c) return false;
  }
  return false;
}

export async function checkMobileUpdate(): Promise<MobileUpdateInfo> {
  try {
    const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases?per_page=5`, {
      headers: {
        Accept: 'application/vnd.github.v3+json',
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      throw new Error(`GitHub API HTTP ${res.status}`);
    }

    const releases = await res.json();
    if (!Array.isArray(releases) || releases.length === 0) {
      throw new Error('No releases found');
    }

    // Find the latest release that contains an Android phone APK asset
    const phoneRelease = releases.find((r: any) =>
      r.assets?.some((a: any) => a.name === 'Icelauch-phone.apk' || a.name.includes('phone') || a.name.endsWith('.apk'))
    ) || releases[0];

    const tag = (phoneRelease.tag_name || '')
      .replace(/^(v|phone-v|tv-v)/i, '')
      .trim();

    const updateAvailable = isNewerVersion(tag, CURRENT_MOBILE_VERSION);

    // Look for dedicated Icelauch-phone.apk first, fallback to universal
    const phoneAsset = phoneRelease.assets?.find(
      (a: any) => a.name === 'Icelauch-phone.apk' || a.name.includes('-phone.apk')
    );
    const universalAsset = phoneRelease.assets?.find(
      (a: any) => a.name === 'Icelauch-universal.apk' || a.name.endsWith('.apk')
    );

    const apkUrl =
      phoneAsset?.browser_download_url ||
      universalAsset?.browser_download_url ||
      `https://github.com/${GITHUB_REPO}/releases/download/${phoneRelease.tag_name}/Icelauch-phone.apk`;

    return {
      updateAvailable,
      currentVersion: CURRENT_MOBILE_VERSION,
      latestVersion: tag || CURRENT_MOBILE_VERSION,
      releaseName: phoneRelease.name || `Bản Cập Nhật Điện Thoại v${tag}`,
      releaseNotes: phoneRelease.body || '',
      apkUrl,
    };
  } catch (err: any) {
    console.warn('[ApkUpdater] Check update error:', err);
    return {
      updateAvailable: false,
      currentVersion: CURRENT_MOBILE_VERSION,
      latestVersion: CURRENT_MOBILE_VERSION,
      releaseName: '',
      releaseNotes: '',
      apkUrl: '',
    };
  }
}

export async function checkTVUpdate(): Promise<TVUpdateInfo> {
  try {
    const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases?per_page=10`, {
      headers: {
        Accept: 'application/vnd.github.v3+json',
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      throw new Error(`GitHub API HTTP ${res.status}`);
    }

    const releases = await res.json();
    if (!Array.isArray(releases) || releases.length === 0) {
      throw new Error('No releases found');
    }

    // 1. Look for releases with dedicated TV tag first (e.g. tv-v1.0.1)
    let tvRelease = releases.find((r: any) =>
      (r.tag_name || '').toLowerCase().includes('tv')
    );

    // 2. If no dedicated tv tag, look for any release containing Icelauch-tv.apk
    if (!tvRelease) {
      tvRelease = releases.find((r: any) =>
        r.assets?.some((a: any) => a.name === 'Icelauch-tv.apk' || a.name.includes('-tv.apk'))
      );
    }

    // 3. Fallback to latest release if it contains any apk
    if (!tvRelease) {
      tvRelease = releases.find((r: any) =>
        r.assets?.some((a: any) => a.name.endsWith('.apk'))
      ) || releases[0];
    }

    const tag = (tvRelease.tag_name || '')
      .replace(/^(v|phone-v|tv-v)/i, '')
      .trim();

    const updateAvailable = isNewerVersion(tag, CURRENT_TV_VERSION);

    // Look for dedicated Icelauch-tv.apk first, fallback to universal
    const tvAsset = tvRelease.assets?.find(
      (a: any) => a.name === 'Icelauch-tv.apk' || a.name.includes('-tv.apk')
    );
    const universalAsset = tvRelease.assets?.find(
      (a: any) => a.name === 'Icelauch-universal.apk' || a.name.endsWith('.apk')
    );

    const apkUrl =
      tvAsset?.browser_download_url ||
      universalAsset?.browser_download_url ||
      `https://github.com/${GITHUB_REPO}/releases/download/${tvRelease.tag_name}/Icelauch-tv.apk`;

    return {
      updateAvailable,
      currentVersion: CURRENT_TV_VERSION,
      latestVersion: tag || CURRENT_TV_VERSION,
      releaseName: tvRelease.name || `Bản Cập Nhật Android TV v${tag}`,
      releaseNotes: tvRelease.body || '',
      apkUrl,
    };
  } catch (err: any) {
    console.warn('[ApkUpdater] Check TV update error:', err);
    return {
      updateAvailable: false,
      currentVersion: CURRENT_TV_VERSION,
      latestVersion: CURRENT_TV_VERSION,
      releaseName: '',
      releaseNotes: '',
      apkUrl: '',
    };
  }
}

export async function triggerApkDownloadAndInstall(
  apkUrl: string,
  onProgress?: (progress: number) => void
): Promise<{ success: boolean; message?: string }> {
  const isCapacitor = typeof (window as any).Capacitor !== 'undefined';

  if (isCapacitor) {
    try {
      let progressListener: any = null;
      if (onProgress) {
        progressListener = await ApkInstaller.addListener('downloadProgress', (info) => {
          onProgress(info.progress);
        });
      }

      const result = await ApkInstaller.downloadAndInstall({ url: apkUrl });
      if (progressListener && progressListener.remove) {
        progressListener.remove();
      }
      return { success: result.success };
    } catch (e: any) {
      console.warn('[ApkUpdater] Native install error, falling back to browser download:', e);
      window.open(apkUrl, '_blank');
      return { success: true, message: 'Đang mở liên kết tải trực tiếp...' };
    }
  } else {
    // Fallback on web/browser
    window.open(apkUrl, '_blank');
    return { success: true, message: 'Đang tải file APK qua trình duyệt...' };
  }
}

