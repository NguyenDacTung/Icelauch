import fs from 'fs';

export interface DiskSpaceCheck {
  sufficient: boolean;
  freeBytes: number;
  neededBytes: number;
  missingGb: number;
}

export function getFreeDiskSpace(targetPath: string): number {
  try {
    const stat = fs.statfsSync(targetPath);
    const freeBytes = Number(BigInt(stat.bavail) * BigInt(stat.bsize));
    return freeBytes;
  } catch (err) {
    console.error(`Failed to get disk space for ${targetPath}:`, err);
    // Fallback: return generous default if unreadable
    return 100 * 1024 * 1024 * 1024;
  }
}

export function checkDiskSpace(targetPath: string, neededBytes: number): DiskSpaceCheck {
  const freeBytes = getFreeDiskSpace(targetPath);
  const sufficient = freeBytes >= neededBytes;
  const missingBytes = neededBytes > freeBytes ? neededBytes - freeBytes : 0;
  const missingGb = parseFloat((missingBytes / (1024 * 1024 * 1024)).toFixed(2));

  return {
    sufficient,
    freeBytes,
    neededBytes,
    missingGb,
  };
}

