import https from 'https';
import http from 'http';
import { URL } from 'url';
import crypto from 'crypto';
import type { AppSettings } from '../../renderer/src/types';

export interface ResolvedDownloadInfo {
  url: string;
  headers: Record<string, string>;
  fileName?: string;
  fileSize?: number;
}

export class GoogleDriveService {
  private static instance: GoogleDriveService;

  private constructor() {}

  public static getInstance(): GoogleDriveService {
    if (!GoogleDriveService.instance) {
      GoogleDriveService.instance = new GoogleDriveService();
    }
    return GoogleDriveService.instance;
  }

  /**
   * Extract Google Drive File ID from various URL formats
   */
  public extractFileId(urlStr: string): string | null {
    if (!urlStr) return null;

    // Pattern 1: /file/d/{FILE_ID}/view
    const matchD = urlStr.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (matchD && matchD[1]) return matchD[1];

    // Pattern 2: id={FILE_ID}
    try {
      const parsed = new URL(urlStr);
      const idParam = parsed.searchParams.get('id');
      if (idParam) return idParam;
    } catch {}

    // Pattern 3: /uc?id={FILE_ID}
    const matchUc = urlStr.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (matchUc && matchUc[1]) return matchUc[1];

    return null;
  }

  /**
   * Resolves a download link (either Google Drive link or generic HTTP link)
   * Handles Google Drive's "File is too large for Google to scan for viruses" confirmation page.
   */
  public async resolveDownloadUrl(
    targetUrl: string,
    settings?: AppSettings
  ): Promise<ResolvedDownloadInfo> {
    const fileId = this.extractFileId(targetUrl);

    // If OAuth token exists and it's a Google Drive file, use official API
    if (fileId && settings?.googleToken?.accessToken) {
      return {
        url: `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
        headers: {
          'Authorization': `Bearer ${settings.googleToken.accessToken}`,
          'User-Agent': 'Icelauch/1.0',
        },
      };
    }

    // If not a Google Drive link, return direct link
    if (!fileId) {
      return {
        url: targetUrl,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      };
    }

    // Otherwise, resolve public Google Drive download with large file bypass
    return this.resolvePublicDriveUrl(fileId);
  }

  /**
   * Follows Google Drive redirect and parses virus scan confirmation token / download form
   */
  private async resolvePublicDriveUrl(fileId: string): Promise<ResolvedDownloadInfo> {
    const initialUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
    let currentUrl = initialUrl;
    let cookies: string[] = [];
    const maxRedirects = 6;

    for (let i = 0; i < maxRedirects; i++) {
      const res = await new Promise<http.IncomingMessage>((resolve, reject) => {
        const parsed = new URL(currentUrl);
        const client = parsed.protocol === 'https:' ? https : http;
        const cookieHeader = cookies.map((c) => c.split(';')[0]).join('; ');

        const req = client.get(
          currentUrl,
          {
            headers: {
              'User-Agent':
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              ...(cookieHeader ? { Cookie: cookieHeader } : {}),
            },
          },
          resolve
        );
        req.on('error', (err) => reject(new Error(`Lỗi kết nối Google Drive: ${err.message}`)));
      });

      if (res.headers['set-cookie']) {
        cookies = [...cookies, ...res.headers['set-cookie']];
      }

      const statusCode = res.statusCode || 200;
      const location = res.headers.location;

      // 1. Follow 3xx redirects
      if (statusCode >= 300 && statusCode < 400 && location) {
        currentUrl = new URL(location, currentUrl).href;
        res.resume(); // discard response body
        continue;
      }

      // 2. Check if returned HTML (Google Drive virus scan / large file confirmation page)
      const contentType = res.headers['content-type'] || '';
      if (contentType.includes('text/html')) {
        const body = await new Promise<string>((resolve) => {
          let text = '';
          res.setEncoding('utf-8');
          res.on('data', (chunk) => (text += chunk));
          res.on('end', () => resolve(text));
        });

        // Form confirmation (e.g. <form id="download-form" action="https://drive.usercontent.google.com/download" ...>)
        const formMatch = body.match(/<form[^>]+action="([^"]+)"[^>]*>([\s\S]*?)<\/form>/i);
        if (formMatch) {
          const action = new URL(formMatch[1], currentUrl).href;
          const inputs = [...formMatch[2].matchAll(/name="([^"]+)"\s+value="([^"]*)"/gi)]
            .map((m) => `${encodeURIComponent(m[1])}=${encodeURIComponent(m[2])}`)
            .join('&');
          currentUrl = action.includes('?') ? `${action}&${inputs}` : `${action}?${inputs}`;
          continue;
        }

        // Token confirmation in URL
        const confirmMatch = body.match(/confirm=([0-9A-Za-z_-]+)/);
        const uuidMatch = body.match(/uuid=([0-9A-Za-z_-]+)/);
        if (confirmMatch || uuidMatch) {
          const parsed = new URL(currentUrl);
          if (confirmMatch) parsed.searchParams.set('confirm', confirmMatch[1]);
          if (uuidMatch) parsed.searchParams.set('uuid', uuidMatch[1]);
          currentUrl = parsed.href;
          continue;
        }
      }

      // 3. We reached the binary stream
      const cookieHeader = cookies.map((c) => c.split(';')[0]).join('; ');
      const filenameMatch = res.headers['content-disposition']?.match(/filename="?([^";]+)"?/i);
      const fileName = filenameMatch ? filenameMatch[1] : undefined;
      const fileSize = res.headers['content-length'] ? parseInt(res.headers['content-length'], 10) : undefined;
      res.destroy();

      return {
        url: currentUrl,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          ...(cookieHeader ? { Cookie: cookieHeader } : {}),
        },
        fileName,
        fileSize,
      };
    }

    throw new Error('Không thể lấy link tải trực tiếp từ Google Drive (quá nhiều lần chuyển hướng)');
  }

  /**
   * Starts a local loopback server to handle Google OAuth callback
   */
  public startOAuthLoopback(
    clientId: string,
    onCodeReceived: (code: string) => void
  ): Promise<{ authUrl: string; port: number; stop: () => void }> {
    return new Promise((resolve, reject) => {
      const server = http.createServer((req, res) => {
        const reqUrl = new URL(req.url || '', 'http://127.0.0.1');
        if (reqUrl.pathname === '/oauth/callback') {
          const code = reqUrl.searchParams.get('code');
          const error = reqUrl.searchParams.get('error');

          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          if (code) {
            res.end(`
              <html>
                <body style="background:#0F1115;color:#E6EAF0;font-family:sans-serif;text-align:center;padding:50px;">
                  <h2 style="color:#3FB950;">✓ Đăng nhập Google thành công!</h2>
                  <p>Bạn có thể đóng tab này và quay lại ứng dụng Icelauch.</p>
                </body>
              </html>
            `);
            onCodeReceived(code);
          } else {
            res.end(`
              <html>
                <body style="background:#0F1115;color:#F85149;font-family:sans-serif;text-align:center;padding:50px;">
                  <h2>Đăng nhập thất bại: ${error || 'Huỷ bởi người dùng'}</h2>
                </body>
              </html>
            `);
          }
        }
      });

      server.listen(0, '127.0.0.1', () => {
        const addr = server.address();
        if (addr && typeof addr === 'object') {
          const port = addr.port;
          const redirectUri = `http://127.0.0.1:${port}/oauth/callback`;
          const scope = encodeURIComponent('https://www.googleapis.com/auth/drive.readonly');
          const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(
            redirectUri
          )}&response_type=code&scope=${scope}&access_type=offline&prompt=consent`;

          resolve({
            authUrl,
            port,
            stop: () => server.close(),
          });
        } else {
          reject(new Error('Failed to start OAuth server'));
        }
      });

      server.on('error', reject);
    });
  }
}

