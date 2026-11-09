import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';
import { URL } from 'url';
import { GoogleDriveService } from './gdrive';
import { StorageService } from './storage';
import { checkDiskSpace } from '../utils/diskSpace';
import type { Game, DownloadProgress } from '../../renderer/src/types';

export class DownloadManager {
  private static instance: DownloadManager;
  private activeGameId: string | null = null;
  private currentRequest: http.ClientRequest | null = null;
  private isCancelled: boolean = false;
  private retryCounts: Map<string, number> = new Map();

  private onProgressCallback?: (gameId: string, progress: DownloadProgress) => void;
  private onCompletedCallback?: (gameId: string) => void;
  private onErrorCallback?: (gameId: string, error: string) => void;

  private constructor() {}

  public static getInstance(): DownloadManager {
    if (!DownloadManager.instance) {
      DownloadManager.instance = new DownloadManager();
    }
    return DownloadManager.instance;
  }

  public setCallbacks(callbacks: {
    onProgress: (gameId: string, progress: DownloadProgress) => void;
    onCompleted: (gameId: string) => void;
    onError: (gameId: string, error: string) => void;
  }) {
    this.onProgressCallback = callbacks.onProgress;
    this.onCompletedCallback = callbacks.onCompleted;
    this.onErrorCallback = callbacks.onError;
  }

  public getActiveGameId(): string | null {
    return this.activeGameId;
  }

  /**
   * Starts downloading a game
   */
  public async startDownload(game: Game): Promise<void> {
    if (this.activeGameId) {
      console.log(`DownloadManager: Queueing game ${game.name}, already downloading ${this.activeGameId}`);
      // In version 1.0, single download active at a time
      return;
    }

    if (!game.downloadLinks || game.downloadLinks.length === 0) {
      this.onErrorCallback?.(game.id, 'Game chưa có link tải nào');
      return;
    }

    this.activeGameId = game.id;
    this.isCancelled = false;
    this.retryCounts.set(game.id, 0);

    const storage = StorageService.getInstance();
    const { downloadsDir } = storage.getPaths();
    const gameDownloadDir = path.join(downloadsDir, game.id);

    if (!fs.existsSync(gameDownloadDir)) {
      fs.mkdirSync(gameDownloadDir, { recursive: true });
    }

    // 1. Check disk space: need at least archive size + extracted size (estimated 2x archive size)
    const neededBytes = (game.expectedSize || 10 * 1024 * 1024 * 1024) * 2;
    const spaceCheck = checkDiskSpace(downloadsDir, neededBytes);
    if (!spaceCheck.sufficient) {
      const errorMsg = `Không đủ dung lượng ổ đĩa. Cần thêm ít nhất ${spaceCheck.missingGb} GB trống.`;
      this.activeGameId = null;
      this.onErrorCallback?.(game.id, errorMsg);
      return;
    }

    try {
      await this.downloadAllParts(game, gameDownloadDir);
      this.activeGameId = null;
      this.onCompletedCallback?.(game.id);
    } catch (err: any) {
      this.activeGameId = null;
      if (!this.isCancelled) {
        console.error(`Download failed for game ${game.name}:`, err);
        this.onErrorCallback?.(game.id, err?.message || 'Tải file thất bại');
      }
    }
  }

  /**
   * Downloads all parts sequentially with HTTP Range resume support
   */
  private async downloadAllParts(game: Game, downloadDir: string): Promise<void> {
    const totalParts = game.downloadLinks.length;
    const gdrive = GoogleDriveService.getInstance();
    const storage = StorageService.getInstance();
    const settings = storage.getData().settings;

    for (let i = 0; i < totalParts; i++) {
      if (this.isCancelled) break;

      const partNum = i + 1;
      const link = game.downloadLinks[i];
      const partFileName = `part${partNum}.rar`;
      const partFilePath = path.join(downloadDir, partFileName);

      let success = false;
      let attempts = 0;
      const maxAttempts = 3;

      while (!success && attempts < maxAttempts && !this.isCancelled) {
        attempts++;
        try {
          // Resolve direct download URL (handles Google Drive confirmation tokens)
          const resolved = await gdrive.resolveDownloadUrl(link, settings);

          // Download single part with range resume
          await this.downloadFileWithResume({
            game,
            resolvedUrl: resolved.url,
            headers: resolved.headers,
            destPath: partFilePath,
            currentPart: partNum,
            totalParts,
          });

          success = true;
        } catch (err: any) {
          console.warn(`Part ${partNum} attempt ${attempts} failed:`, err.message);
          if (this.isCancelled) return;

          if (attempts < maxAttempts) {
            // Wait 3 seconds before retry
            await new Promise((r) => setTimeout(r, 3000));
          } else {
            throw new Error(`Mất kết nối mạng sau 3 lần thử lại ở Part ${partNum}/${totalParts}`);
          }
        }
      }
    }
  }

  /**
   * Downloads a single file with HTTP Range resume and speed tracking
   */
  private downloadFileWithResume(params: {
    game: Game;
    resolvedUrl: string;
    headers: Record<string, string>;
    destPath: string;
    currentPart: number;
    totalParts: number;
  }): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.isCancelled) {
        return reject(new Error('Cancelled'));
      }

      const { game, resolvedUrl, headers, destPath, currentPart, totalParts } = params;

      // Check existing partial file size
      let existingBytes = 0;
      if (fs.existsSync(destPath)) {
        existingBytes = fs.statSync(destPath).size;
      }

      const requestHeaders: Record<string, string> = { ...headers };
      if (existingBytes > 0) {
        requestHeaders['Range'] = `bytes=${existingBytes}-`;
      }

      const parsedUrl = new URL(resolvedUrl);
      const isHttps = parsedUrl.protocol === 'https:';
      const client = isHttps ? https : http;

      let lastReportTime = Date.now();
      let lastReportBytes = existingBytes;
      let downloadedSoFar = existingBytes;

      const req = client.get(resolvedUrl, { headers: requestHeaders }, (res) => {
        // Handle redirects
        if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return this.downloadFileWithResume({
            ...params,
            resolvedUrl: res.headers.location,
          })
            .then(resolve)
            .catch(reject);
        }

        // Check response status
        const isPartial = res.statusCode === 206;
        const isOk = res.statusCode === 200;

        if (!isPartial && !isOk) {
          return reject(new Error(`Server trả về mã lỗi HTTP ${res.statusCode}`));
        }

        // Check if response is HTML by mistake (e.g. Google Drive virus warning or blocked page)
        const contentType = res.headers['content-type'] || '';
        if (contentType.includes('text/html')) {
          req.destroy();
          return reject(new Error('Link Google Drive trả về trang HTML thay vì file dữ liệu'));
        }

        // Determine total size of this part
        let partTotalBytes = 0;
        if (isPartial && res.headers['content-range']) {
          // Content-Range: bytes 100-1000/1001
          const match = res.headers['content-range'].match(/\/(\d+)/);
          if (match) partTotalBytes = parseInt(match[1], 10);
        } else if (res.headers['content-length']) {
          partTotalBytes = parseInt(res.headers['content-length'], 10) + (isPartial ? existingBytes : 0);
        } else {
          partTotalBytes = (game.expectedSize || 10737418240) / totalParts;
        }

        // Emit initial progress immediately so UI updates instantly
        this.onProgressCallback?.(game.id, {
          bytesDownloaded: downloadedSoFar,
          totalBytes: partTotalBytes,
          percentage: partTotalBytes > 0 ? Math.min(100, Math.round((downloadedSoFar / partTotalBytes) * 100)) : 0,
          speedMBps: 0,
          etaSeconds: 0,
          currentPart,
          totalParts,
          statusText: `Đang tải game (Part ${currentPart}/${totalParts})...`,
        });

        // File write stream: append if partial 206, write from start if 200
        const fileStream = fs.createWriteStream(destPath, {
          flags: isPartial ? 'a' : 'w',
        });

        if (!isPartial && existingBytes > 0) {
          downloadedSoFar = 0;
        }

        res.on('data', (chunk) => {
          if (this.isCancelled) {
            req.destroy();
            fileStream.close();
            return;
          }

          downloadedSoFar += chunk.length;

          // Emit progress every 500ms
          const now = Date.now();
          const elapsed = (now - lastReportTime) / 1000;
          if (elapsed >= 0.5) {
            const bytesSinceLast = downloadedSoFar - lastReportBytes;
            const speedMBps = parseFloat(((bytesSinceLast / (1024 * 1024)) / elapsed).toFixed(1));
            const remainingBytes = Math.max(0, partTotalBytes - downloadedSoFar);
            const etaSeconds = speedMBps > 0 ? Math.round(remainingBytes / (speedMBps * 1024 * 1024)) : 0;
            const percentage = partTotalBytes > 0 ? Math.min(100, Math.round((downloadedSoFar / partTotalBytes) * 100)) : 0;

            const progress: DownloadProgress = {
              bytesDownloaded: downloadedSoFar,
              totalBytes: partTotalBytes,
              percentage,
              speedMBps,
              etaSeconds,
              currentPart,
              totalParts,
              statusText: `Đang tải game (Part ${currentPart}/${totalParts}) · ${percentage}%`,
            };

            this.onProgressCallback?.(game.id, progress);
            lastReportTime = now;
            lastReportBytes = downloadedSoFar;
          }
        });

        res.pipe(fileStream);

        fileStream.on('finish', () => {
          fileStream.close();
          resolve();
        });

        fileStream.on('error', (err) => {
          reject(err);
        });

        res.on('error', (err) => {
          reject(err);
        });
      });

      this.currentRequest = req;

      req.on('error', (err) => {
        reject(err);
      });
    });
  }

  /**
   * Cancels the current download
   */
  public cancelDownload(gameId: string, deleteDownloadedFiles: boolean): void {
    if (this.activeGameId === gameId) {
      this.isCancelled = true;
      if (this.currentRequest) {
        this.currentRequest.destroy();
        this.currentRequest = null;
      }
      this.activeGameId = null;

      if (deleteDownloadedFiles) {
        const storage = StorageService.getInstance();
        const { downloadsDir } = storage.getPaths();
        const gameDownloadDir = path.join(downloadsDir, gameId);
        if (fs.existsSync(gameDownloadDir)) {
          try {
            fs.rmSync(gameDownloadDir, { recursive: true, force: true });
          } catch (e) {
            console.error('Failed to delete download dir:', e);
          }
        }
      }
    }
  }
}

