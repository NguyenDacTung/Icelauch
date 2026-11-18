/**
 * Dominant Color Extractor for Nebula Mode
 * Lightweight canvas-based color sampling for dynamic hero banner ambient glow.
 */

let cachedDominantColor: Record<string, string> = {};

export function updateNebulaDominantColor(imageUrl?: string | null): void {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  const currentTheme = root.getAttribute('data-theme');
  if (currentTheme !== 'nebula') return;

  if (!imageUrl) {
    root.style.setProperty('--nebula-glow-color', '#A855F7');
    root.style.setProperty('--nebula-ambient-tint', 'rgba(168, 85, 247, 0.25)');
    return;
  }

  // Format url for Electron file:// or web
  let resolvedUrl = imageUrl;
  if (!resolvedUrl.startsWith('http') && !resolvedUrl.startsWith('data:') && !resolvedUrl.startsWith('file:')) {
    resolvedUrl = `file:///${resolvedUrl.replace(/\\/g, '/')}`;
  }

  if (cachedDominantColor[resolvedUrl]) {
    const col = cachedDominantColor[resolvedUrl];
    root.style.setProperty('--nebula-glow-color', col);
    root.style.setProperty('--nebula-ambient-tint', `${col}40`);
    return;
  }

  const img = new Image();
  img.crossOrigin = 'Anonymous';
  img.onload = () => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 16;
      canvas.height = 16;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.drawImage(img, 0, 0, 16, 16);
      const data = ctx.getImageData(0, 0, 16, 16).data;

      let rSum = 0, gSum = 0, bSum = 0, count = 0;
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        // Exclude dull greys, pure blacks, pure whites to get vibrant colors
        if (max - min > 20 && max > 30 && min < 240) {
          rSum += r;
          gSum += g;
          bSum += b;
          count++;
        }
      }

      if (count > 0) {
        const rAvg = Math.round(rSum / count);
        const gAvg = Math.round(gSum / count);
        const bAvg = Math.round(bSum / count);
        const hex = `#${((1 << 24) + (rAvg << 16) + (gAvg << 8) + bAvg).toString(16).slice(1)}`;
        cachedDominantColor[resolvedUrl] = hex;
        root.style.setProperty('--nebula-glow-color', hex);
        root.style.setProperty('--nebula-ambient-tint', `rgba(${rAvg}, ${gAvg}, ${bAvg}, 0.35)`);
      } else {
        root.style.setProperty('--nebula-glow-color', '#A855F7');
        root.style.setProperty('--nebula-ambient-tint', 'rgba(168, 85, 247, 0.25)');
      }
    } catch {
      root.style.setProperty('--nebula-glow-color', '#A855F7');
      root.style.setProperty('--nebula-ambient-tint', 'rgba(168, 85, 247, 0.25)');
    }
  };
  img.onerror = () => {
    root.style.setProperty('--nebula-glow-color', '#A855F7');
    root.style.setProperty('--nebula-ambient-tint', 'rgba(168, 85, 247, 0.25)');
  };
  img.src = resolvedUrl;
}
