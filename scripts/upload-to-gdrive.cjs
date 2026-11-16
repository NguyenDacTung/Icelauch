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
 * Upload single file to Google Drive folder using Resumable Upload
 * Supports files of any size (APKs, EXEs) without 5MB multipart limitation
 */
function uploadFile(accessToken, filePath, fileName, folderId) {
  return new Promise((resolve, reject) => {
    const fileSize = fs.statSync(filePath).size;
    const metadata = JSON.stringify({
      name: fileName,
      parents: [folderId],
    });

    console.log(`[GDrive Uploader] Initiating Resumable Session for ${fileName} (${(fileSize / 1024 / 1024).toFixed(1)} MB)...`);

    // Step 1: Initiate Resumable Session
    const initReq = https.request(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json; charset=UTF-8',
          'X-Upload-Content-Type': 'application/octet-stream',
          'X-Upload-Content-Length': fileSize,
        },
      },
      (initRes) => {
        if (initRes.statusCode !== 200) {
          let errBody = '';
          initRes.on('data', (d) => (errBody += d));
          initRes.on('end', () => reject(new Error(`Failed to initiate resumable upload: HTTP ${initRes.statusCode} - ${errBody}`)));
          return;
        }

        const sessionUri = initRes.headers.location;
        if (!sessionUri) {
          reject(new Error('No resumable session location header returned by Google Drive'));
          return;
        }

        console.log(`[GDrive Uploader] Resumable session created. Streaming file content...`);

        // Step 2: Upload file stream to session URL
        const uploadReq = https.request(
          sessionUri,
          {
            method: 'PUT',
            headers: {
              'Content-Length': fileSize,
              'Content-Type': 'application/octet-stream',
            },
          },
          (uploadRes) => {
            let resBody = '';
            uploadRes.on('data', (d) => (resBody += d));
            uploadRes.on('end', () => {
              try {
                const data = JSON.parse(resBody);
                if (data.id) {
                  resolve(data.id);
                } else {
                  reject(new Error(`Upload failed: HTTP ${uploadRes.statusCode} - ${resBody}`));
                }
              } catch (e) {
                reject(new Error(`Failed to parse upload response: HTTP ${uploadRes.statusCode} - ${resBody}`));
              }
            });
          }
        );

        uploadReq.on('error', reject);
        const fileStream = fs.createReadStream(filePath);
        fileStream.on('error', reject);
        fileStream.pipe(uploadReq);
      }
    );

    initReq.on('error', reject);
    initReq.write(metadata);
    initReq.end();
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
        let b = '';
        res.on('data', (d) => (b += d));
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(true);
          } else {
            console.warn(`[GDrive Uploader] makePublic warning: HTTP ${res.statusCode} - ${b}`);
            resolve(false);
          }
        });
      }
    );
    req.on('error', (e) => {
      console.warn('[GDrive Uploader] makePublic error:', e.message);
      resolve(false);
    });
    req.write(payload);
    req.end();
  });
}

function getAllFilesRecursively(dir) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir, { withFileTypes: true });
  for (const dirent of list) {
    const full = path.join(dir, dirent.name);
    if (dirent.isDirectory()) {
      results = results.concat(getAllFilesRecursively(full));
    } else {
      results.push(full);
    }
  }
  return results;
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

  const allFiles = getAllFilesRecursively(distDir);
  console.log('[GDrive Uploader] Release binaries available (recursive):', allFiles);

  let token;
  try {
    token = await getAccessToken(serviceAccount);
    console.log('[GDrive Uploader] Google Cloud Access Token obtained successfully.');
  } catch (err) {
    console.error('[GDrive Uploader] Failed to authenticate with Google Cloud:', err.message);
    process.exit(0);
  }

  const uploadedUrls = {};

  for (const fullPath of allFiles) {
    const file = path.basename(fullPath);
    if (file.endsWith('.apk') || (file.endsWith('.exe') && file.includes('Setup'))) {
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
