import { spawn, exec } from 'child_process';
import path from 'path';
import fs from 'fs';
import type { Game } from '../../renderer/src/types';

export class GameRunnerService {
  private static instance: GameRunnerService;
  private runningGames: Map<string, { processName: string; pid?: number; timer?: any }> = new Map();

  private onGameStatusChange?: (gameId: string, status: 'ready' | 'running') => void;

  private constructor() {}

  public static getInstance(): GameRunnerService {
    if (!GameRunnerService.instance) {
      GameRunnerService.instance = new GameRunnerService();
    }
    return GameRunnerService.instance;
  }

  public setCallback(callback: (gameId: string, status: 'ready' | 'running') => void) {
    this.onGameStatusChange = callback;
  }

  public isGameRunning(gameId: string): boolean {
    return this.runningGames.has(gameId);
  }

  /**
   * Launches a game executable (supports runAsAdmin UAC elevation and process tracking)
   */
  public async launchGame(game: Game): Promise<boolean> {
    if (!game.installPath || !game.mainExe) {
      throw new Error('Game chưa có đường dẫn cài đặt hoặc chưa chọn file chạy (.exe)');
    }

    const exeFullPath = path.isAbsolute(game.mainExe)
      ? game.mainExe
      : path.join(game.installPath, game.mainExe);

    if (!fs.existsSync(exeFullPath)) {
      throw new Error(`Không tìm thấy file thực thi tại: ${exeFullPath}`);
    }

    const workingDir = path.dirname(exeFullPath);
    const exeName = path.basename(exeFullPath);

    if (game.runAsAdmin) {
      // Launch via PowerShell with Administrator UAC prompt
      const psCommand = `Start-Process -FilePath "${exeFullPath}" -WorkingDirectory "${workingDir}" -Verb runAs -PassThru | Select-Object -ExpandProperty Id`;
      
      return new Promise((resolve, reject) => {
        exec(`powershell -NoProfile -Command "${psCommand}"`, (error, stdout, stderr) => {
          if (error) {
            console.error('UAC launch error:', error);
            // User likely clicked "No" on UAC prompt
            return reject(new Error('Người dùng đã từ chối cấp quyền Administrator (UAC)'));
          }

          const pid = parseInt(stdout.trim(), 10);
          this.trackProcess(game.id, exeName, isNaN(pid) ? undefined : pid);
          resolve(true);
        });
      });
    } else {
      // Launch standard process with working dir
      const child = spawn(exeFullPath, [], {
        cwd: workingDir,
        detached: true,
        stdio: 'ignore',
        windowsHide: false,
      });

      child.unref();
      this.trackProcess(game.id, exeName, child.pid);
      return true;
    }
  }

  /**
   * Tracks game process using Windows tasklist polling to reliably detect exit
   */
  private trackProcess(gameId: string, exeName: string, pid?: number): void {
    this.onGameStatusChange?.(gameId, 'running');

    const checkInterval = setInterval(() => {
      // Query Windows tasklist
      const cmd = pid
        ? `tasklist /FI "PID eq ${pid}" /NH`
        : `tasklist /FI "IMAGENAME eq ${exeName}" /NH`;

      exec(cmd, (err, stdout) => {
        const isStillRunning = stdout && stdout.toLowerCase().includes(exeName.toLowerCase());

        if (!isStillRunning) {
          clearInterval(checkInterval);
          this.runningGames.delete(gameId);
          this.onGameStatusChange?.(gameId, 'ready');
        }
      });
    }, 2500);

    this.runningGames.set(gameId, {
      processName: exeName,
      pid,
      timer: checkInterval,
    });
  }
}

