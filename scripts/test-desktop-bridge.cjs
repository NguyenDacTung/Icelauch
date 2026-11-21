const fs = require('fs');
const path = require('path');

const DEBUG_PORT = process.env.REMOTE_DEBUG_PORT || 9222;
const artifactDir = 'C:\\Users\\dactu\\.gemini\\antigravity\\brain\\16fcba20-10c8-4607-84c2-0485428da52f\\screenshots';

if (!fs.existsSync(artifactDir)) {
  fs.mkdirSync(artifactDir, { recursive: true });
}

async function getTargets() {
  try {
    const res = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json`);
    return await res.json();
  } catch (e) {
    return null;
  }
}

function sendCdpCommand(wsUrl, method, params = {}) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl);
    const id = 1;
    let resolved = false;

    ws.onopen = () => {
      ws.send(JSON.stringify({ id, method, params }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.id === id) {
          resolved = true;
          ws.close();
          if (data.error) reject(new Error(data.error.message));
          else resolve(data.result);
        }
      } catch (err) {
        reject(err);
      }
    };

    ws.onerror = (err) => {
      if (!resolved) reject(err);
    };

    setTimeout(() => {
      if (!resolved) {
        ws.close();
        reject(new Error(`Timeout waiting for CDP command: ${method}`));
      }
    }, 10000);
  });
}

async function main() {
  const action = process.argv[2] || 'status';

  const targets = await getTargets();
  if (!targets) {
    console.log(`ERROR: Could not connect to Electron debug port ${DEBUG_PORT}. Make sure Electron is running with --remote-debugging-port=${DEBUG_PORT}`);
    process.exit(1);
  }

  // Find page target (usually Icelauch or localhost)
  const pageTarget = targets.find(t => t.type === 'page') || targets[0];
  if (!pageTarget || !pageTarget.webSocketDebuggerUrl) {
    console.log('ERROR: No debuggable page target found.');
    console.log('Targets:', targets);
    process.exit(1);
  }

  switch (action) {
    case 'status': {
      console.log('ELECTRON_CDP_CONNECTED');
      console.log(`Target: ${pageTarget.title} (${pageTarget.url})`);
      console.log(`All targets: ${targets.length}`);
      break;
    }
    case 'screenshot': {
      const filename = process.argv[3] || `desktop_${Date.now()}.png`;
      const targetPath = path.join(artifactDir, filename);
      console.log(`Taking screenshot of: ${pageTarget.title}...`);
      const res = await sendCdpCommand(pageTarget.webSocketDebuggerUrl, 'Page.captureScreenshot', { format: 'png' });
      if (res && res.data) {
        fs.writeFileSync(targetPath, Buffer.from(res.data, 'base64'));
        console.log(`DESKTOP_SCREENSHOT_SAVED: ${targetPath}`);
      } else {
        console.error('Failed to capture screenshot data');
      }
      break;
    }
    case 'eval': {
      const expression = process.argv.slice(3).join(' ');
      if (!expression) {
        console.log('Usage: eval <js_expression>');
        break;
      }
      const res = await sendCdpCommand(pageTarget.webSocketDebuggerUrl, 'Runtime.evaluate', {
        expression,
        returnByValue: true,
        awaitPromise: true
      });
      console.log('EVAL_RESULT:', JSON.stringify(res.result?.value, null, 2));
      break;
    }
    default:
      console.log(`Unknown action: ${action}`);
  }
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
