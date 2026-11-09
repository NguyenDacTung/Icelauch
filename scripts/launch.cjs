const { spawn } = require('child_process');
const electronPath = require('electron');

// Ensure ELECTRON_RUN_AS_NODE is completely deleted
delete process.env.ELECTRON_RUN_AS_NODE;

const child = spawn(electronPath, ['.'], {
  stdio: 'inherit',
  windowsHide: false,
  env: process.env,
});

child.on('exit', (code) => {
  process.exit(code || 0);
});

