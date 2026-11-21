const { spawn } = require('child_process');
const electronPath = require('electron');

delete process.env.ELECTRON_RUN_AS_NODE;

console.log('[DEBUG LAUNCHER] Starting Electron with --remote-debugging-port=9222 ...');
const child = spawn(electronPath, ['.', '--remote-debugging-port=9222'], {
  stdio: 'inherit',
  windowsHide: false,
  env: process.env,
});

child.on('exit', (code) => {
  process.exit(code || 0);
});
