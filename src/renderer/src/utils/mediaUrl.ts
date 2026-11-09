let activeProxyPort: number = 64960;

export function setActiveProxyPort(port: number) {
  if (port > 0) activeProxyPort = port;
}

export function getActiveProxyPort(): number {
  return activeProxyPort;
}

export interface ParsedMediaUrl {
  kind: 'youtube' | 'gdrive' | 'facebook' | 'direct';
  id?: string;
  embedUrl?: string;
  thumbnailUrl?: string;
  directUrl: string;
  isReel?: boolean;
}

export function parseMediaUrl(url: string, customPort?: number): ParsedMediaUrl {
  const trimmed = (url || '').trim();
  const port = customPort || activeProxyPort;

  // 1. Check YouTube
  const ytMatch = trimmed.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/i
  );
  if (ytMatch && ytMatch[1]) {
    const id = ytMatch[1];
    let startParam = '';
    const timeMatch = trimmed.match(/[?&]t=(\d+)s?/i);
    if (timeMatch && timeMatch[1]) {
      startParam = `&start=${timeMatch[1]}`;
    }

    // Local HTTP proxy bridge: loads via http://127.0.0.1 which has a valid HTTP origin, completely bypassing Electron's file:// Error 152-4 and 153!
    const bridgeUrl = `http://127.0.0.1:${port}/youtube/${id}?autoplay=1${startParam}`;

    return {
      kind: 'youtube',
      id,
      embedUrl: bridgeUrl,
      thumbnailUrl: `https://img.youtube.com/vi/${id}/hqdefault.jpg`,
      directUrl: trimmed,
    };
  }

  // 2. Check Facebook
  const isFacebook = trimmed.includes('facebook.com') || trimmed.includes('fb.watch');
  if (isFacebook) {
    const isReel = trimmed.includes('/reel/') || trimmed.includes('/share/r/');
    const fbEmbed = `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(trimmed)}&show_text=false&autoplay=true&t=0`;
    return {
      kind: 'facebook',
      embedUrl: fbEmbed,
      isReel,
      directUrl: trimmed,
    };
  }

  // 3. Check Google Drive
  const driveMatchD = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/i);
  let driveId = driveMatchD ? driveMatchD[1] : null;

  if (!driveId) {
    const driveMatchId = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/i);
    if (driveMatchId && trimmed.includes('drive.google.com')) {
      driveId = driveMatchId[1];
    }
  }

  if (driveId) {
    return {
      kind: 'gdrive',
      id: driveId,
      embedUrl: `https://drive.google.com/file/d/${driveId}/preview`,
      thumbnailUrl: `https://drive.google.com/thumbnail?id=${driveId}&sz=w1280`,
      directUrl: trimmed,
    };
  }

  // 3. Direct URL (.mp4, .mp3, etc.)
  return {
    kind: 'direct',
    directUrl: trimmed,
  };
}
