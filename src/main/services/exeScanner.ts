import fs from 'fs';
import path from 'path';

export interface ExeCandidate {
  relativePath: string;
  absolutePath: string;
  fileName: string;
  sizeBytes: number;
  score: number;
}

export class ExeScannerService {
  private static instance: ExeScannerService;

  // Patterns to exclude
  private excludedPrefixes = [
    'unins',
    'uninstall',
    'vcredist',
    'vc_redist',
    'dxsetup',
    'dxwebsetup',
    'dotnet',
    'oalinst',
    'crashreport',
    'unitycrashhandler',
    'ue4prereqsetup',
    'notification_helper',
    'easyanticheat',
    'battleye',
  ];

  private excludedFolders = ['_redist', 'redist', 'commonredist', '$recycle.bin'];

  private constructor() {}

  public static getInstance(): ExeScannerService {
    if (!ExeScannerService.instance) {
      ExeScannerService.instance = new ExeScannerService();
    }
    return ExeScannerService.instance;
  }

  /**
   * Scans game directory up to 4 levels deep and ranks executables
   */
  public scanAndRankExecutables(gameDir: string, gameName: string): ExeCandidate[] {
    const rawFiles: { absolutePath: string; relativePath: string; depth: number }[] = [];
    this.walkDirectory(gameDir, gameDir, 0, 4, rawFiles);

    // Filter out non-game files
    const validCandidates: ExeCandidate[] = [];

    for (const file of rawFiles) {
      const fileNameLower = path.basename(file.relativePath).toLowerCase();

      // Check excluded prefix
      const isExcludedPrefix = this.excludedPrefixes.some((p) => fileNameLower.startsWith(p));
      if (isExcludedPrefix) continue;

      // Check excluded folder
      const parts = file.relativePath.toLowerCase().split(/[\\/]/);
      const isExcludedFolder = parts.some((p) => this.excludedFolders.includes(p));
      if (isExcludedFolder) continue;

      try {
        const stats = fs.statSync(file.absolutePath);
        if (!stats.isFile()) continue;

        // Calculate score
        const score = this.calculateScore({
          fileName: path.basename(file.relativePath),
          relativePath: file.relativePath,
          depth: file.depth,
          sizeBytes: stats.size,
          gameName,
        });

        validCandidates.push({
          relativePath: file.relativePath.replace(/\\/g, '/'),
          absolutePath: file.absolutePath,
          fileName: path.basename(file.relativePath),
          sizeBytes: stats.size,
          score,
        });
      } catch {}
    }

    // Sort by score descending
    validCandidates.sort((a, b) => b.score - a.score);
    return validCandidates;
  }

  /**
   * Recursive directory traversal with max depth
   */
  private walkDirectory(
    currentDir: string,
    rootDir: string,
    currentDepth: number,
    maxDepth: number,
    results: { absolutePath: string; relativePath: string; depth: number }[]
  ): void {
    if (currentDepth > maxDepth || !fs.existsSync(currentDir)) return;

    try {
      const entries = fs.readdirSync(currentDir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);

        if (entry.isDirectory()) {
          const folderNameLower = entry.name.toLowerCase();
          if (!this.excludedFolders.includes(folderNameLower)) {
            this.walkDirectory(fullPath, rootDir, currentDepth + 1, maxDepth, results);
          }
        } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.exe')) {
          results.push({
            absolutePath: fullPath,
            relativePath: path.relative(rootDir, fullPath),
            depth: currentDepth,
          });
        }
      }
    } catch (e) {
      console.warn(`Cannot read dir ${currentDir}:`, e);
    }
  }

  /**
   * Scoring algorithm based on Section 6.4 of specification
   */
  private calculateScore(params: {
    fileName: string;
    relativePath: string;
    depth: number;
    sizeBytes: number;
    gameName: string;
  }): number {
    let score = 50;
    const nameWithoutExt = params.fileName.replace(/\.exe$/i, '').toLowerCase();
    const cleanGameName = params.gameName.toLowerCase().replace(/[^a-z0-9]/g, '');
    const cleanFileName = nameWithoutExt.replace(/[^a-z0-9]/g, '');

    // 1. Name resemblance: +60 to +100
    if (cleanFileName === cleanGameName) {
      score += 100;
    } else if (cleanGameName.includes(cleanFileName) || cleanFileName.includes(cleanGameName)) {
      score += 60;
    } else {
      // Check word matches
      const words = params.gameName.toLowerCase().split(/\s+/).filter(w => w.length > 2);
      for (const w of words) {
        if (nameWithoutExt.includes(w)) score += 20;
      }
    }

    // 2. Proximity to root: root = +30, depth 1 = +20, depth 2 = +10
    if (params.depth === 0) score += 30;
    else if (params.depth === 1) score += 20;
    else if (params.depth === 2) score += 10;

    // 3. File size: larger executables usually are the main game engine (+10 to +40)
    const mb = params.sizeBytes / (1024 * 1024);
    if (mb > 100) score += 40;
    else if (mb > 30) score += 30;
    else if (mb > 5) score += 15;

    // 4. Penalties: if contains 'setup', 'install', 'update', 'patch', 'config'
    if (/setup|install/i.test(nameWithoutExt)) score -= 60;
    if (/update|patch|launcher_helper/i.test(nameWithoutExt)) score -= 25;

    return score;
  }
}

