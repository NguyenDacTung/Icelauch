import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';
import { URL } from 'url';
import { GoogleDriveService } from './gdrive';
import { StorageService } from './storage';
import type { MediaItem } from '../../renderer/src/types';

export class MediaDownloadManager {
  private static instance: MediaDownloadManager;
  private activeMediaId: string | null = null;
  private currentRequest: http.ClientRequest | null = null;
  private isCancelled: boolean = false;

  private onProgressCallback?: (mediaId: string, progress: number) => void;
  private onCompletedCallback?: (media: MediaItem) => void;
  private onErrorCallback?: (mediaId: string, error: string) => void;

  private constructor() {}

  public static getInstance(): MediaDownloadManager {
    if (!MediaDownloadManager.instance) {
      MediaDownloadManager.instance = new MediaDownloadManager();
    }
    return MediaDownloadManager.instance;
  }

  public setCallbacks(callbacks: {
    onProgress: (mediaId: string, progress: number) => void;
    onCompleted: (media: MediaItem) => void;
    onError: (mediaId: string, error: string) => void;
  }) {
    this.onProgressCallback = callbacks.onProgress;
    this.onCompletedCallback = callbacks.onCompleted;
    this.onErrorCallback = callbacks.onError;
  }

  public getActiveMediaId(): string | null {
    return this.activeMediaId;
  }

  public async startDownload(media: MediaItem): Promise<void> {
    if (this.activeMediaId) {
      this.onErrorCallback?.(media.id, 'Đang có một tiến trình tải media khác đang chạy');
      return;
    }

    if (!media.link) {
      this.onErrorCallback?.(media.id, 'Media chưa có link tải');
      return;
    }

    this.activeMediaId = media.id;
    this.isCancelled = false;

    const storage = StorageService.getInstance();
    const gdrive = GoogleDriveService.getInstance();
    const paths = storage.getPaths();
    const mediaDownloadsDir = paths.mediaDownloadsDir;

    if (!fs.existsSync(mediaDownloadsDir)) {
      fs.mkdirSync(mediaDownloadsDir, { recursive: true });
    }

    // Determine extension: .mp4 for video, .mp3 for audio by default
    const isAudio = media.type === 'audio';
    const ext = isAudio ? '.mp3' : '.mp4';
    const safeTitle = media.title.replace(/[/\\?%*:|"<>]/g, '_').slice(0, 50);
    const fileName = `${media.id}_${safeTitle}${ext}`;
    const destinationPath = path.join(mediaDownloadsDir, fileName);

    media.downloadStatus = 'downloading';
    media.downloadProgress = 0;
    storage.saveMedia(media);

    try {
      // 1. Resolve direct download link
      const resolved = await gdrive.resolveDownloadUrl(media.link, storage.getData().settings);
      const targetUrl = resolved.url;
      const headers = { ...resolved.headers };

      await this.downloadStreamToFile(targetUrl, destinationPath, headers, (pct) => {
        media.downloadProgress = pct;
        this.onProgressCallback?.(media.id, pct);
      });

      if (this.isCancelled) {
        if (fs.existsSync(destinationPath)) {
          fs.unlinkSync(destinationPath);
        }
        media.downloadStatus = 'idle';
        media.downloadProgress = undefined;
        storage.saveMedia(media);
        this.activeMediaId = null;
        return;
      }

      // Download completed successfully
      media.downloadStatus = 'downloaded';
      media.downloadProgress = 100;
      media.localFilePath = destinationPath;
      const saved = storage.saveMedia(media);

      this.activeMediaId = null;
      this.onCompletedCallback?.(saved);
    } catch (err: any) {
      if (this.isCancelled) {
        this.activeMediaId = null;
        return;
      }
      console.error(`Media download failed for ${media.title}:`, err);
      media.downloadStatus = 'error';
      storage.saveMedia(media);
      this.activeMediaId = null;
      this.onErrorCallback?.(media.id, err?.message || 'Lỗi tải media');
    }
  }

  private downloadStreamToFile(
    targetUrl: string,
    destPath: string,
    customHeaders: Record<string, string>,
    onProgress: (pct: number) => void
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const parsed = new URL(targetUrl);
      const client = parsed.protocol === 'https:' ? https : http;

      const req = client.get(
        targetUrl,
        {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            ...customHeaders,
          },
        },
        (res) => {
          // Handle redirects
          if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
            const redirectUrl = new URL(res.headers.location, targetUrl).href;
            res.resume();
            this.downloadStreamToFile(redirectUrl, destPath, customHeaders, onProgress)
              .then(resolve)
              .catch(reject);
            return;
          }

          if (res.statusCode && res.statusCode >= 400) {
            reject(new Error(`Máy chủ trả về mã lỗi: ${res.statusCode} ${res.statusMessage || ''}`));
            return;
          }

          const totalBytes = parseInt(res.headers['content-length'] || '0', 10);
          let receivedBytes = 0;
          const fileStream = fs.createWriteStream(destPath);

          res.on('data', (chunk) => {
            if (this.isCancelled) {
              req.destroy();
              fileStream.close();
              return;
            }
            receivedBytes += chunk.length;
            if (totalBytes > 0) {
              const pct = Math.min(100, Math.round((receivedBytes / totalBytes) * 100));
              onProgress(pct);
            }
          });

          res.pipe(fileStream);

          fileStream.on('finish', () => {
            fileStream.close();
            resolve();
          });

          fileStream.on('error', (err) => {
            fs.unlink(destPath, () => {});
            reject(err);
          });
        }
      );

      this.currentRequest = req;
      req.on('error', (err) => reject(err));
    });
  }

  public cancelDownload(mediaId: string): void {
    if (this.activeMediaId === mediaId) {
      this.isCancelled = true;
      if (this.currentRequest) {
        this.currentRequest.destroy();
        this.currentRequest = null;
      }
      this.activeMediaId = null;
    }
  }

  public deleteDownloadedFile(media: MediaItem): boolean {
    if (media.localFilePath && fs.existsSync(media.localFilePath)) {
      try {
        fs.unlinkSync(media.localFilePath);
      } catch (err) {
        console.warn('Could not delete local media file:', err);
      }
    }
    media.localFilePath = undefined;
    media.downloadStatus = 'idle';
    media.downloadProgress = undefined;
    StorageService.getInstance().saveMedia(media);
    return true;
  }
}

