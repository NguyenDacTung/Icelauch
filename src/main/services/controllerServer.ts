import { WebSocketServer, WebSocket } from 'ws';
import os from 'os';

export interface ControllerMessage {
  type: 'ping' | 'handshake' | 'gamepad_btn' | 'gamepad_axis' | 'mouse_move' | 'mouse_click' | 'mouse_scroll' | 'keyboard_text';
  clientName?: string;
  btn?: string;
  pressed?: boolean;
  axis?: 'left' | 'right';
  x?: number;
  y?: number;
  dx?: number;
  dy?: number;
  button?: 'left' | 'right';
  text?: string;
}

export class ControllerServer {
  private wss: WebSocketServer | null = null;
  private port: number = 18999;
  private clients: Set<WebSocket> = new Set();
  private onMessageCallback?: (msg: ControllerMessage) => void;

  constructor(port: number = 18999) {
    this.port = port;
  }

  public getLocalIps(): string[] {
    const interfaces = os.networkInterfaces();
    const ips: string[] = [];
    for (const name of Object.keys(interfaces)) {
      for (const net of interfaces[name] || []) {
        if (net.family === 'IPv4' && !net.internal) {
          ips.push(net.address);
        }
      }
    }
    return ips;
  }

  public start(onMessage?: (msg: ControllerMessage) => void): boolean {
    if (this.wss) return true;
    this.onMessageCallback = onMessage;

    try {
      this.wss = new WebSocketServer({ port: this.port });

      this.wss.on('connection', (ws: WebSocket) => {
        this.clients.add(ws);
        console.log(`[IceController] Client connected. Total clients: ${this.clients.size}`);

        ws.send(JSON.stringify({
          type: 'handshake_ack',
          serverName: 'Icelauch PC Host',
          version: '1.1.0'
        }));

        ws.on('message', (data: Buffer | string) => {
          try {
            const raw = data.toString();
            const parsed: ControllerMessage = JSON.parse(raw);
            if (parsed.type === 'ping') {
              ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
              return;
            }
            if (this.onMessageCallback) {
              this.onMessageCallback(parsed);
            }
          } catch (e) {
            console.warn('[IceController] Malformed packet:', e);
          }
        });

        ws.on('close', () => {
          this.clients.delete(ws);
          console.log(`[IceController] Client disconnected. Remaining: ${this.clients.size}`);
        });

        ws.on('error', (err) => {
          console.error('[IceController] Client error:', err);
          this.clients.delete(ws);
        });
      });

      this.wss.on('error', (err) => {
        console.error('[IceController] Server error:', err);
      });

      console.log(`[IceController] WebSocket server listening on port ${this.port}`);
      return true;
    } catch (e) {
      console.error('[IceController] Failed to start WebSocket server:', e);
      return false;
    }
  }

  public stop(): void {
    if (this.wss) {
      this.clients.forEach((c) => {
        try { c.close(); } catch {}
      });
      this.clients.clear();
      this.wss.close();
      this.wss = null;
    }
  }

  public getStatus() {
    return {
      isRunning: Boolean(this.wss),
      port: this.port,
      localIps: this.getLocalIps(),
      connectedClients: this.clients.size,
    };
  }
}

export const controllerServer = new ControllerServer(18999);
