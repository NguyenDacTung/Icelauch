import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import fs from 'fs';
import { StorageService } from './storage';
import type { Game, InstallProgress } from '../../renderer/src/types';

export class ExtractorService {
  private static instance: ExtractorService;
  private activeProcess: ChildProcess | null = null;
  private activeGameId: string | null = null;
  private passwordResolvers: Map<string, (pwd: string) => void> = new Map();

  private onProgressCallback?: (gameId: string, progress: InstallProgress) => void;
  private onPasswordPromptCallback?: (gameId: string, gameName: string, isRetry: boolean) => void;
  private onCompletedCallback?: (gameId: string, installDir: string) => void;
  private onErrorCallback?: (gameId: string, error: string) => void;

  private constructor() {}

  public static getInstance(): ExtractorService {
    if (!ExtractorService.instance) {
      ExtractorService.instance = new ExtractorService();
    }
    return ExtractorService.instance;
  }

  public setCallbacks(callbacks: {
    onProgress: (gameId: string, progress: InstallProgress) => void;
    onPasswordPrompt: (gameId: string, gameName: string, isRetry: boolean) => void;
    onCompleted: (gameId: string, installDir: string) => void;
    onError: (gameId: string, error: string) => void;
  }) {
    this.onProgressCallback = callbacks.onProgress;
    this.onPasswordPromptCallback = callbacks.onPasswordPrompt;
    this.onCompletedCallback = callbacks.onCompleted;
    this.onErrorCallback = callbacks.onError;
  }

  /**
   * Provides password submitted by user from UI modal
   */
  public providePassword(gameId: string, password: string): void {
    const resolver = this.passwordResolvers.get(gameId);
    if (resolver) {
      resolver(password);
      this.passwordResolvers.delete(gameId);
    }
  }

  /**
   * Finds the primary archive file (e.g. part1.rar or the single archive)
   */
  public findMainArchive(downloadDir: string): string | null {
    if (!fs.existsSync(downloadDir)) return null;
    const files = fs.readdirSync(downloadDir);

    // Look for part1 or part01
    const part1 = files.find((f) => /part0*1\.(rar|zip|7z)$/i.test(f));
    if (part1) return path.join(downloadDir, part1);

    // Otherwise, first archive file
    const anyArchive = files.find((f) => /\.(rar|zip|7z)$/i.test(f));
    if (anyArchive) return path.join(downloadDir, anyArchive);

    return null;
  }

  /**
   * Sanitize game folder name to prevent illegal Windows filesystem characters
   */
  public sanitizeFolderName(name: string): string {
    return name.replace(/[<>:"/\\|?*]/g, '').trim();
  }

  /**
   * Extracts game archive using bundled 7-Zip
   */
  public async extractGame(game: Game): Promise<void> {
    const storage = StorageService.getInstance();
    const { downloadsDir, gamesDir, sevenZipExe } = storage.getPaths();
    const gameDownloadDir = path.join(downloadsDir, game.id);

    const mainArchive = this.findMainArchive(gameDownloadDir);
    if (!mainArchive) {
      throw new Error('Không tìm thấy file nén trong thư mục Downloads');
    }

    const safeName = this.sanitizeFolderName(game.name);
    const settings = storage.getSettings();
    const effectiveGamesDir = settings.defaultGamesInstallPath && fs.existsSync(settings.defaultGamesInstallPath)
      ? settings.defaultGamesInstallPath
      : gamesDir;

    const targetDir = game.installPath && path.isAbsolute(game.installPath)
      ? game.installPath
      : path.join(effectiveGamesDir, safeName);

    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    this.activeGameId = game.id;
    let currentPassword = game.archivePassword || '';
    let isRetry = false;

    while (this.activeGameId === game.id) {
      try {
        await this.run7zExtraction({
          sevenZipExe,
          archivePath: mainArchive,
          targetDir,
          password: currentPassword,
          gameId: game.id,
        });

        // Extraction success!
        // Delete archive files if deleteArchiveAfterInstall is true
        if (game.deleteArchiveAfterInstall) {
          try {
            fs.rmSync(gameDownloadDir, { recursive: true, force: true });
          } catch (e) {
            console.error('Failed to cleanup download files after extraction:', e);
          }
        }

        this.activeGameId = null;
        this.onCompletedCallback?.(game.id, targetDir);
        return;
      } catch (err: any) {
        const errMsg = err?.message || '';

        // Check if error is due to password requirement or wrong password
        const isPasswordIssue =
          errMsg.includes('Wrong password') ||
          errMsg.includes('encrypted') ||
          errMsg.includes('Password') ||
          errMsg.includes('Data Error in encrypted');

        if (isPasswordIssue) {
          // Ask UI for password
          this.onPasswordPromptCallback?.(game.id, game.name, isRetry);

          // Wait for user to input password
          const userPassword = await new Promise<string>((resolve) => {
            this.passwordResolvers.set(game.id, resolve);
          });

          if (!userPassword) {
            this.activeGameId = null;
            this.onErrorCallback?.(game.id, 'Huỷ giải nén (Không có mật khẩu)');
            return;
          }

          currentPassword = userPassword;
          isRetry = true;
          // Loop will retry with new password
        } else {
          this.activeGameId = null;
          this.onErrorCallback?.(game.id, errMsg || 'Lỗi giải nén file nén');
          return;
        }
      }
    }
  }

  /**
   * Spawns 7z.exe with -bsp1 for real-time progress parsing
   */
  private run7zExtraction(params: {
    sevenZipExe: string;
    archivePath: string;
    targetDir: string;
    password?: string;
    gameId: string;
  }): Promise<void> {
    return new Promise((resolve, reject) => {
      const { sevenZipExe, archivePath, targetDir, password, gameId } = params;

      const args = [
        'x',
        '-y',
        '-bsp1',
        `-o${targetDir}`,
      ];

      if (password) {
        args.push(`-p${password}`);
      } else {
        args.push('-p-'); // do not prompt in terminal
      }

      args.push(archivePath);

      const child = spawn(sevenZipExe, args, {
        windowsHide: true,
      });

      this.activeProcess = child;
      let outputLogs = '';

      child.stdout.on('data', (data) => {
        const text = data.toString();
        outputLogs += text;

        // Parse percentage from -bsp1 output: e.g. "  45%"
        const matches = text.match(/(\d+)%/g);
        if (matches && matches.length > 0) {
          const lastMatch = matches[matches.length - 1];
          const pct = parseInt(lastMatch.replace('%', ''), 10);
          if (!isNaN(pct)) {
            this.onProgressCallback?.(gameId, {
              percentage: pct,
              statusText: `Đang cài game... ${pct}%`,
            });
          }
        }
      });

      child.stderr.on('data', (data) => {
        outputLogs += data.toString();
      });

      child.on('close', (code) => {
        this.activeProcess = null;
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`7-Zip error (code ${code}): ${outputLogs.slice(-300)}`));
        }
      });

      child.on('error', (err) => {
        this.activeProcess = null;
        reject(err);
      });
    });
  }

  /**
   * Aborts active extraction
   */
  public cancelExtraction(gameId: string): void {
    if (this.activeGameId === gameId && this.activeProcess) {
      this.activeProcess.kill();
      this.activeProcess = null;
      this.activeGameId = null;
      this.passwordResolvers.delete(gameId);
    }
  }
}

