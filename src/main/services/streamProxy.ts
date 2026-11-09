import http from 'http';
import https from 'https';
import { URL } from 'url';
import { GoogleDriveService } from './gdrive';
import { StorageService } from './storage';

export class StreamProxyService {
  private static instance: StreamProxyService;
  private server: http.Server | null = null;
  private port: number = 0;
  private resolvedUrlCache = new Map<string, { url: string; headers: Record<string, string>; expiresAt: number }>();

  private constructor() {}

  public static getInstance(): StreamProxyService {
    if (!StreamProxyService.instance) {
      StreamProxyService.instance = new StreamProxyService();
    }
    return StreamProxyService.instance;
  }

  public async start(): Promise<number> {
    if (this.server && this.port > 0) {
      return this.port;
    }

    return new Promise((resolve, reject) => {
      this.server = http.createServer(async (req, res) => {
        try {
          const reqUrl = new URL(req.url || '', `http://127.0.0.1:${this.port}`);

          // 1. YouTube Player Bridge endpoint to bypass Electron file:// error 152-4
          if (reqUrl.pathname.startsWith('/youtube/')) {
            const rawId = reqUrl.pathname.replace('/youtube/', '').split('/')[0].split('?')[0];
            const videoId = encodeURIComponent(rawId);
            const autoplay = reqUrl.searchParams.get('autoplay') ?? '1';
            const mute = reqUrl.searchParams.get('mute') ?? '0';
            const start = reqUrl.searchParams.get('start') || '';
            const startParam = start ? `&start=${encodeURIComponent(start)}` : '';

            const html = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="referrer" content="strict-origin-when-cross-origin">
  <title>YouTube Player Bridge</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; overflow: hidden; background: #000; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    iframe { width: 100%; height: 100%; border: none; display: block; }
    #fallback {
      display: none;
      position: absolute;
      inset: 0;
      background: #0F1115;
      color: #fff;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 12px;
      text-align: center;
      padding: 24px;
      z-index: 10;
    }
    #fallback a {
      color: #fff;
      background: #dc2626;
      padding: 10px 18px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: bold;
      font-size: 13px;
      transition: background 0.2s;
    }
    #fallback a:hover {
      background: #b91c1c;
    }
  </style>
</head>
<body>
  <iframe
    id="yt-player"
    src="https://www.youtube-nocookie.com/embed/${videoId}?autoplay=${autoplay}&mute=${mute}&rel=0&modestbranding=1&playsinline=1&enablejsapi=1${startParam}"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
    referrerpolicy="strict-origin-when-cross-origin"
    allowfullscreen>
  </iframe>
  <div id="fallback">
    <p style="font-size: 14px; color: #E6EAF0; font-weight: bold;">Không thể phát trực tiếp Trailer này</p>
    <p style="font-size: 12px; color: #8B94A3; max-width: 340px;">Chủ sở hữu hoặc nhà phát hành có thể đã giới hạn quyền nhúng ngoài YouTube đối với video này.</p>
    <a href="https://www.youtube.com/watch?v=${videoId}" target="_blank">Mở xem trực tiếp trên YouTube ↗</a>
  </div>
  <script>
    // Detect errors from iframe if postMessage is received
    window.addEventListener('message', function(e) {
      if (e.data && (e.data.event === 'onError' || e.data.info === 150 || e.data.info === 152 || e.data.info === 153)) {
        document.getElementById('fallback').style.display = 'flex';
      }
    });
  </script>
</body>
</html>`;

            res.writeHead(200, {
              'Content-Type': 'text/html; charset=utf-8',
              'Referrer-Policy': 'strict-origin-when-cross-origin',
              'Access-Control-Allow-Origin': '*',
            });
            res.end(html);
            return;
          }

          let targetUrl = reqUrl.searchParams.get('url');

          // Handle /drive/:id endpoint
          if (reqUrl.pathname.startsWith('/drive/')) {
            const rawId = reqUrl.pathname.replace('/drive/', '').split('/')[0].split('?')[0];
            if (rawId) {
              targetUrl = `https://drive.google.com/file/d/${encodeURIComponent(rawId)}/view`;
            }
          }

          if (!targetUrl) {
            res.writeHead(400, { 'Content-Type': 'text/plain' });
            res.end('Missing target url query parameter');
            return;
          }

          // If it's a Google Drive link, resolve download URL with cookies/confirm token
          const gdrive = GoogleDriveService.getInstance();
          const storage = StorageService.getInstance();
          const settings = storage.getData().settings;

          let resolvedUrl = targetUrl;
          let customHeaders: Record<string, string> = {};

          const cached = this.resolvedUrlCache.get(targetUrl);
          if (cached && cached.expiresAt > Date.now()) {
            resolvedUrl = cached.url;
            customHeaders = cached.headers;
          } else {
            try {
              const resolved = await gdrive.resolveDownloadUrl(targetUrl, settings);
              resolvedUrl = resolved.url;
              customHeaders = resolved.headers;
              // Cache for 15 minutes to eliminate latency on range / seek requests
              this.resolvedUrlCache.set(targetUrl, {
                url: resolvedUrl,
                headers: customHeaders,
                expiresAt: Date.now() + 15 * 60 * 1000,
              });
            } catch (resolveErr) {
              console.warn('Failed to resolve target url via gdrive service, using raw url:', resolveErr);
            }
          }

          // Parse resolved URL
          const parsedTarget = new URL(resolvedUrl);
          const isHttps = parsedTarget.protocol === 'https:';
          const client = isHttps ? https : http;

          const headers: Record<string, any> = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            ...customHeaders,
          };

          // Forward Range header if client requested range
          if (req.headers.range) {
            headers['Range'] = req.headers.range;
          }

          const proxyReq = client.request(
            resolvedUrl,
            {
              method: req.method,
              headers,
            },
            (proxyRes) => {
              // Handle redirects (up to 1 level)
              if (proxyRes.statusCode && proxyRes.statusCode >= 300 && proxyRes.statusCode < 400 && proxyRes.headers.location) {
                const redirectUrl = proxyRes.headers.location;
                const redirectClient = redirectUrl.startsWith('https:') ? https : http;
                const subReq = redirectClient.request(redirectUrl, { method: req.method, headers }, (subRes) => {
                  this.pipeProxyResponse(subRes, res);
                });
                subReq.on('error', (err) => {
                  if (!res.headersSent) {
                    res.writeHead(502, { 'Content-Type': 'text/plain' });
                    res.end(`Redirect stream error: ${err.message}`);
                  }
                });
                req.pipe(subReq);
                return;
              }

              this.pipeProxyResponse(proxyRes, res);
            }
          );

          proxyReq.on('error', (err) => {
            console.error('Stream proxy request error:', err);
            if (!res.headersSent) {
              res.writeHead(502, { 'Content-Type': 'text/plain' });
              res.end(`Proxy stream error: ${err.message}`);
            }
          });

          req.pipe(proxyReq);
        } catch (err: any) {
          console.error('Stream proxy exception:', err);
          if (!res.headersSent) {
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end(`Proxy exception: ${err?.message}`);
          }
        }
      });

      // Try preferred port 64960, if busy fallback to dynamic port (0)
      const listenPort = 64960;
      this.server.listen(listenPort, '127.0.0.1', () => {
        const address = this.server?.address();
        if (address && typeof address === 'object') {
          this.port = address.port;
          console.log(`Local streaming proxy active at http://127.0.0.1:${this.port}`);
          resolve(this.port);
        } else {
          reject(new Error('Failed to obtain server address port'));
        }
      });

      this.server.on('error', (err: any) => {
        if (err.code === 'EADDRINUSE') {
          console.log('Port 64960 in use, falling back to random port');
          this.server?.listen(0, '127.0.0.1', () => {
            const address = this.server?.address();
            if (address && typeof address === 'object') {
              this.port = address.port;
              console.log(`Local streaming proxy active at http://127.0.0.1:${this.port}`);
              resolve(this.port);
            }
          });
        } else {
          reject(err);
        }
      });
    });
  }

  private pipeProxyResponse(sourceRes: http.IncomingMessage, targetRes: http.ServerResponse): void {
    const resHeaders: Record<string, any> = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
    };

    if (sourceRes.headers['content-range']) {
      resHeaders['Content-Range'] = sourceRes.headers['content-range'];
    }
    if (sourceRes.headers['content-length']) {
      resHeaders['Content-Length'] = sourceRes.headers['content-length'];
    }
    if (sourceRes.headers['content-type']) {
      resHeaders['Content-Type'] = sourceRes.headers['content-type'];
    }
    if (sourceRes.headers['accept-ranges']) {
      resHeaders['Accept-Ranges'] = sourceRes.headers['accept-ranges'];
    } else {
      resHeaders['Accept-Ranges'] = 'bytes';
    }

    targetRes.writeHead(sourceRes.statusCode || 200, resHeaders);
    sourceRes.pipe(targetRes);
  }

  public getPort(): number {
    return this.port || 64960;
  }

  public getStreamUrl(targetUrl: string): string {
    if (!targetUrl) return '';
    return `http://127.0.0.1:${this.port}/stream?url=${encodeURIComponent(targetUrl)}`;
  }
}
