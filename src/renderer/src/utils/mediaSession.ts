import type { MediaItem } from '../types';

export interface MediaSessionHandlers {
  onPlay?: () => void;
  onPause?: () => void;
  onNext?: () => void;
  onPrev?: () => void;
  onSeekTo?: (seekTime: number) => void;
}

/**
 * Normalizes artwork image path into a format suitable for navigator.mediaSession.
 */
function resolveArtworkUrl(track: MediaItem): string {
  const path = track.coverPath || track.bannerPath || '';
  if (!path) return '';

  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
    return path;
  }

  if (path.startsWith('file://')) {
    return path;
  }

  // Fallback to file:// protocol for local file paths if on Electron
  return `file://${path}`;
}

/**
 * Updates navigator.mediaSession metadata and action handlers for background audio playback,
 * Android notification shade, lock screen controls, and Bluetooth earbud interaction.
 */
export function updateMediaSession(
  track: MediaItem | null,
  isPlaying: boolean,
  handlers?: MediaSessionHandlers
): void {
  if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) {
    return;
  }

  if (!track) {
    try {
      navigator.mediaSession.playbackState = 'none';
      navigator.mediaSession.metadata = null;
    } catch {
      // Ignored
    }
    return;
  }

  try {
    // 1. Update Playback State
    navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';

    // 2. Update Metadata
    const artworkUrl = resolveArtworkUrl(track);
    const artworkList: MediaImage[] = [];

    if (artworkUrl) {
      artworkList.push(
        { src: artworkUrl, sizes: '96x96', type: 'image/jpeg' },
        { src: artworkUrl, sizes: '128x128', type: 'image/jpeg' },
        { src: artworkUrl, sizes: '192x192', type: 'image/jpeg' },
        { src: artworkUrl, sizes: '256x256', type: 'image/jpeg' },
        { src: artworkUrl, sizes: '512x512', type: 'image/jpeg' }
      );
    }

    navigator.mediaSession.metadata = new MediaMetadata({
      title: track.title || 'Đang phát nhạc',
      artist: track.artist || track.category || 'Icelauch',
      album: track.category || 'Icelauch Audio',
      artwork: artworkList,
    });

    // 3. Register Action Handlers (wrapped in try-catch to avoid unsupported action exceptions)
    if (handlers) {
      const actions: [MediaSessionAction, MediaSessionActionHandler | null][] = [
        ['play', handlers.onPlay ? () => handlers.onPlay!() : null],
        ['pause', handlers.onPause ? () => handlers.onPause!() : null],
        ['previoustrack', handlers.onPrev ? () => handlers.onPrev!() : null],
        ['nexttrack', handlers.onNext ? () => handlers.onNext!() : null],
        [
          'seekto',
          handlers.onSeekTo
            ? (details) => {
                if (details.seekTime !== undefined && details.seekTime !== null) {
                  handlers.onSeekTo!(details.seekTime);
                }
              }
            : null,
        ],
      ];

      for (const [action, handler] of actions) {
        try {
          navigator.mediaSession.setActionHandler(action, handler);
        } catch {
          // Some browsers throw TypeError for unsupported actions
        }
      }
    }
  } catch (err) {
    console.warn('Failed to update MediaSession:', err);
  }
}

/**
 * Updates the current playback position state in navigator.mediaSession.
 */
export function updateMediaSessionPositionState(
  currentTime: number,
  duration: number,
  playbackRate: number = 1
): void {
  if (
    typeof navigator === 'undefined' ||
    !('mediaSession' in navigator) ||
    !('setPositionState' in navigator.mediaSession)
  ) {
    return;
  }

  if (!duration || isNaN(duration) || duration <= 0 || isNaN(currentTime) || currentTime < 0) {
    return;
  }

  try {
    navigator.mediaSession.setPositionState({
      duration: Math.max(0, duration),
      playbackRate: Math.max(0.1, playbackRate),
      position: Math.min(Math.max(0, currentTime), duration),
    });
  } catch {
    // Ignored if position exceeds duration during transition
  }
}

/**
 * Clears the MediaSession metadata and resets playback state to 'none'.
 */
export function clearMediaSession(): void {
  if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) {
    return;
  }

  try {
    navigator.mediaSession.playbackState = 'none';
    navigator.mediaSession.metadata = null;
  } catch {
    // Ignored
  }
}
