/**
 * Upload Built Release Binaries to Google Drive via Service Account
 * Automatically runs in GitHub Actions CI/CD after build step
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const crypto = require('crypto');

const SERVICE_ACCOUNT_KEY_RAW = process.env.GDRIVE_SERVICE_ACCOUNT_KEY || '';
const FOLDER_ID = process.env.GDRIVE_RELEASE_FOLDER_ID || '';
const RELEASE_TAG = process.env.RELEASE_TAG || process.env.GITHUB_REF_NAME || 'v1.1.7';
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://wqmmagfrwwctvipopazx.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || 'sb_publishable_l1vNbLKXXhLNnfi1pI5UnQ_0EaqbXuJ';

if (!SERVICE_ACCOUNT_KEY_RAW || !FOLDER_ID) {
  console.log('[GDrive Uploader] GDRIVE_SERVICE_ACCOUNT_KEY or GDRIVE_RELEASE_FOLDER_ID not set. Skipping Google Drive auto-upload.');
  process.exit(0);
}

let serviceAccount;
try {
  serviceAccount = JSON.parse(SERVICE_ACCOUNT_KEY_RAW);
} catch (e) {
  console.error('[GDrive Uploader] Failed to parse GDRIVE_SERVICE_ACCOUNT_KEY JSON:', e.message);
  process.exit(0);
}

/**
 * Generate Google OAuth2 Access Token via JWT
 */
function getAccessToken(creds) {
  return new Promise((resolve, reject) => {
    const now = Math.floor(Date.now() / 1000);
    const header = { alg: 'RS256', typ: 'JWT' };
    const claim = {
      iss: creds.client_email,
      scope: 'https://www.googleapis.com/auth/drive',
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now,
    };

    const b64Header = Buffer.from(JSON.stringify(header)).toString('base64url');
    const b64Claim = Buffer.from(JSON.stringify(claim)).toString('base64url');
    const unsigned = `${b64Header}.${b64Claim}`;

    const sign = crypto.createSign('RSA-SHA256');
    sign.update(unsigned);
    sign.end();
    const signature = sign.sign(creds.private_key, 'base64url');
    const jwt = `${unsigned}.${signature}`;

    const postData = `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`;
    const req = https.request(
      'https://oauth2.googleapis.com/token',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(postData),
        },
      },
      (res) => {
        let body = '';
        res.on('data', (d) => (body += d));
        res.on('end', () => {
          try {
            const data = JSON.parse(body);
            if (data.access_token) {
              resolve(data.access_token);
            } else {
              reject(new Error(data.error_description || body));
            }
          } catch (err) {
            reject(err);
          }
        });
      }
    );
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

/**
 * Upload single file to Google Drive folder using multipart
 */
function uploadFile(accessToken, filePath, fileName, folderId) {
  return new Promise((resolve, reject) => {
    const boundary = '-------314159265358979323846';
    const metadata = JSON.stringify({
      name: fileName,
      parents: [folderId],
    });

    const fileBuffer = fs.readFileSync(filePath);

    let prefix = `--${boundary}\r\n`;
    prefix += 'Content-Type: application/json; charset=UTF-8\r\n\r\n';
    prefix += `${metadata}\r\n`;
    prefix += `--${boundary}\r\n`;
    prefix += 'Content-Type: application/octet-stream\r\n\r\n';

    const suffix = `\r\n--${boundary}--`;

    const prefixBuf = Buffer.from(prefix, 'utf8');
    const suffixBuf = Buffer.from(suffix, 'utf8');
    const totalLength = prefixBuf.length + fileBuffer.length + suffixBuf.length;

    const req = https.request(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': `multipart/related; boundary=${boundary}`,
          'Content-Length': totalLength,
        },
      },
      (res) => {
        let body = '';
        res.on('data', (d) => (body += d));
        res.on('end', () => {
          try {
            const result = JSON.parse(body);
            if (result.id) {
              resolve(result.id);
            } else {
              reject(new Error(body));
            }
          } catch (e) {
            reject(e);
          }
        });
      }
    );
    req.on('error', reject);

    req.write(prefixBuf);
    req.write(fileBuffer);
    req.write(suffixBuf);
    req.end();
  });
}

/**
 * Make uploaded Google Drive file publicly viewable
 */
function makePublic(accessToken, fileId) {
  return new Promise((resolve) => {
    const payload = JSON.stringify({ role: 'reader', type: 'anyone' });
    const req = https.request(
      `https://www.googleapis.com/drive/v3/files/${fileId}/permissions`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
        },
      },
      (res) => {
        res.on('data', () => {});
        res.on('end', () => resolve(true));
      }
    );
    req.on('error', () => resolve(false));
    req.write(payload);
    req.end();
  });
}

/**
 * Main Execution
 */
async function run() {
  console.log(`[GDrive Uploader] Starting Google Drive Release Upload for ${RELEASE_TAG}...`);
  const distDir = path.resolve(__dirname, '../dist-release');
  if (!fs.existsSync(distDir)) {
    console.error('[GDrive Uploader] dist-release directory does not exist. Skipping.');
    process.exit(0);
  }

  const files = fs.readdirSync(distDir);
  console.log('[GDrive Uploader] Release binaries available:', files);

  let token;
  try {
    token = await getAccessToken(serviceAccount);
    console.log('[GDrive Uploader] Google Cloud Access Token obtained successfully.');
  } catch (err) {
    console.error('[GDrive Uploader] Failed to authenticate with Google Cloud:', err.message);
    process.exit(0);
  }

  const uploadedUrls = {};

  for (const file of files) {
    if (file.endsWith('.apk') || (file.endsWith('.exe') && file.includes('Setup'))) {
      const fullPath = path.join(distDir, file);
      console.log(`[GDrive Uploader] Uploading ${file} (${(fs.statSync(fullPath).size / 1024 / 1024).toFixed(1)} MB)...`);
      try {
        const fileId = await uploadFile(token, fullPath, file, FOLDER_ID);
        await makePublic(token, fileId);
        const directUrl = `https://drive.usercontent.google.com/download?id=${fileId}&export=download`;
        console.log(`[GDrive Uploader] Uploaded ${file} -> File ID: ${fileId}`);

        if (file.includes('phone')) uploadedUrls.phoneApkUrl = directUrl;
        else if (file.includes('tv')) uploadedUrls.tvApkUrl = directUrl;
        else if (file.includes('universal')) uploadedUrls.universalApkUrl = directUrl;
        else if (file.endsWith('.exe')) uploadedUrls.pcSetupUrl = directUrl;
      } catch (uploadErr) {
        console.warn(`[GDrive Uploader] Error uploading ${file}:`, uploadErr.message);
      }
    }
  }

  // Update Supabase with Google Drive download links
  const cleanVersion = RELEASE_TAG.replace(/^(v|phone-v|tv-v)/i, '');
  const supabasePayload = {
    profile_id: 'icelauch_device_registry',
    game_stats: {
      latest_release: {
        version: cleanVersion,
        name: `Icelauch v${cleanVersion}`,
        releaseNotes: `Bản phát hành chính thức v${cleanVersion}`,
        phoneApkUrl: uploadedUrls.phoneApkUrl || '',
        tvApkUrl: uploadedUrls.tvApkUrl || '',
        universalApkUrl: uploadedUrls.universalApkUrl || '',
        pcSetupUrl: uploadedUrls.pcSetupUrl || '',
        updatedAt: new Date().toISOString(),
      },
    },
    updated_at: new Date().toISOString(),
  };

  try {
    const postData = JSON.stringify(supabasePayload);
    const sReq = https.request(
      `${SUPABASE_URL}/rest/v1/icelauch_user_data`,
      {
        method: 'POST',
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          Prefer: 'resolution=merge-duplicates',
          'Content-Length': Buffer.byteLength(postData),
        },
      },
      (res) => {
        console.log(`[GDrive Uploader] Supabase Release Registry updated: HTTP ${res.statusCode}`);
      }
    );
    sReq.on('error', (e) => console.warn('[GDrive Uploader] Supabase sync error:', e.message));
    sReq.write(postData);
    sReq.end();
  } catch (supaErr) {
    console.warn('[GDrive Uploader] Supabase update call error:', supaErr);
  }
}

run().catch((err) => {
  console.error('[GDrive Uploader] Fatal error:', err);
  process.exit(0);
});
