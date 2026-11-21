const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const adbPath = 'C:\\Users\\dactu\\AppData\\Local\\Android\\platform-tools\\adb.exe';
const artifactDir = 'C:\\Users\\dactu\\.gemini\\antigravity\\brain\\16fcba20-10c8-4607-84c2-0485428da52f\\screenshots';

if (!fs.existsSync(artifactDir)) {
  fs.mkdirSync(artifactDir, { recursive: true });
}

function runAdb(cmd, options = {}) {
  try {
    return execSync(`"${adbPath}" ${cmd}`, { encoding: 'utf8', ...options });
  } catch (err) {
    return `Error: ${err.message}`;
  }
}

const action = process.argv[2] || 'devices';

switch (action) {
  case 'devices': {
    const out = runAdb('devices -l');
    console.log(out);
    break;
  }
  case 'screenshot': {
    const filename = process.argv[3] || `mobile_${Date.now()}.png`;
    const targetPath = path.join(artifactDir, filename);
    try {
      execSync(`"${adbPath}" exec-out screencap -p > "${targetPath}"`, { stdio: 'inherit' });
      console.log(`SCREENSHOT_SAVED: ${targetPath}`);
    } catch (e) {
      console.error('Failed to capture screenshot:', e.message);
    }
    break;
  }
  case 'tap': {
    const x = process.argv[3];
    const y = process.argv[4];
    if (!x || !y) {
      console.log('Usage: tap <x> <y>');
      break;
    }
    const res = runAdb(`shell input tap ${x} ${y}`);
    console.log(`Tapped at (${x}, ${y}): ${res}`);
    break;
  }
  case 'swipe': {
    const [x1, y1, x2, y2, dur = 300] = process.argv.slice(3);
    const res = runAdb(`shell input swipe ${x1} ${y1} ${x2} ${y2} ${dur}`);
    console.log(`Swiped: ${res}`);
    break;
  }
  case 'install': {
    const apk = process.argv[3] || path.join(__dirname, '..', 'release', 'Icelauch-phone.apk');
    if (!fs.existsSync(apk)) {
      console.error(`APK not found at ${apk}`);
      break;
    }
    console.log(`Installing ${apk}...`);
    const res = runAdb(`install -r "${apk}"`);
    console.log(res);
    break;
  }
  case 'launch': {
    console.log('Launching Icelauch on device...');
    const res = runAdb('shell monkey -p com.icelauch.app -c android.intent.category.LAUNCHER 1');
    console.log(res);
    break;
  }
  case 'logcat': {
    const lines = process.argv[3] || 100;
    const res = runAdb(`logcat -d -t ${lines} *:E Chromium:V Console:V`);
    console.log(res);
    break;
  }
  default:
    console.log(`Unknown action: ${action}`);
}
