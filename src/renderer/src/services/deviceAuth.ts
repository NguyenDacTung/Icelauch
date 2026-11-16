import type { AuthorizedDevice, DeviceApprovalStatus } from '../types';
import { DEFAULT_SUPABASE_URL, DEFAULT_SUPABASE_ANON_KEY, isElectron, isAndroidPlatform, verifyAdminPin } from './platformAdapter';

export const STORAGE_KEY_DEVICE_ID = 'icelauch_device_id';
export const STORAGE_KEY_DEVICE_NAME = 'icelauch_device_name';
export const STORAGE_KEY_DEVICE_APPROVED_STATUS = 'icelauch_device_approved_status';
export const STORAGE_KEY_DEVICE_APPROVED_ID = 'icelauch_device_approved_id';
export const STORAGE_KEY_LAST_LOGIN_VERSION = 'icelauch_last_login_version';

const REGISTRY_PROFILE_ID = 'icelauch_device_registry';

/**
 * Get or generate persistent hardware-based device identity
 */
export async function getHardwareDeviceId(): Promise<string> {
  // 1. Electron Desktop Hardware GUID
  if (isElectron() && typeof window !== 'undefined' && (window as any).api?.getDeviceId) {
    try {
      const electronId = await (window as any).api.getDeviceId();
      if (electronId && typeof electronId === 'string' && electronId.startsWith('ICE-')) {
        try {
          localStorage.setItem(STORAGE_KEY_DEVICE_ID, electronId);
        } catch {}
        return electronId;
      }
    } catch (e) {
      console.warn('Error obtaining Electron device ID:', e);
    }
  }

  // 2. Mobile / Web LocalStorage persistence
  try {
    const existing = localStorage.getItem(STORAGE_KEY_DEVICE_ID);
    if (existing && existing.startsWith('ICE-')) {
      return existing;
    }

    const platformPrefix = isAndroidPlatform() ? 'MOB' : 'DEV';
    const randPart = Math.random().toString(36).substring(2, 10).toUpperCase();
    const newId = `ICE-${platformPrefix}-${randPart}`;
    localStorage.setItem(STORAGE_KEY_DEVICE_ID, newId);
    return newId;
  } catch (err) {
    return `ICE-FALLBACK-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  }
}

/**
 * Fetch the central device registry from Supabase
 */
async function fetchDeviceRegistry(): Promise<AuthorizedDevice[]> {
  try {
    const url = `${DEFAULT_SUPABASE_URL}/rest/v1/icelauch_user_data?profile_id=eq.${REGISTRY_PROFILE_ID}&select=game_stats`;
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        apikey: DEFAULT_SUPABASE_ANON_KEY,
        Authorization: `Bearer ${DEFAULT_SUPABASE_ANON_KEY}`,
        Accept: 'application/json',
      },
    });

    if (!res.ok) {
      console.warn('fetchDeviceRegistry status:', res.status);
      return [];
    }

    const rows = await res.json();
    if (!rows || rows.length === 0 || !rows[0].game_stats || !Array.isArray(rows[0].game_stats.devices)) {
      return [];
    }

    return rows[0].game_stats.devices as AuthorizedDevice[];
  } catch (err) {
    console.warn('fetchDeviceRegistry error:', err);
    throw err;
  }
}

/**
 * Save updated device registry to Supabase
 */
async function saveDeviceRegistry(devices: AuthorizedDevice[]): Promise<boolean> {
  try {
    const url = `${DEFAULT_SUPABASE_URL}/rest/v1/icelauch_user_data`;
    const payload = {
      profile_id: REGISTRY_PROFILE_ID,
      game_stats: { devices },
      updated_at: new Date().toISOString(),
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        apikey: DEFAULT_SUPABASE_ANON_KEY,
        Authorization: `Bearer ${DEFAULT_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates',
      },
      body: JSON.stringify(payload),
    });

    return res.ok;
  } catch (err) {
    console.error('saveDeviceRegistry error:', err);
    return false;
  }
}

/**
 * Check if the device is approved locally (offline guard)
 */
export function isDeviceLocallyApproved(deviceId: string): boolean {
  try {
    const status = localStorage.getItem(STORAGE_KEY_DEVICE_APPROVED_STATUS);
    const approvedId = localStorage.getItem(STORAGE_KEY_DEVICE_APPROVED_ID);
    return status === 'approved' && approvedId === deviceId;
  } catch {
    return false;
  }
}

/**
 * Clear local approval cache
 */
export function clearLocalDeviceApproval(): void {
  try {
    localStorage.removeItem(STORAGE_KEY_DEVICE_APPROVED_STATUS);
    localStorage.removeItem(STORAGE_KEY_DEVICE_APPROVED_ID);
  } catch {}
}

/**
 * Query current device status (online Supabase check with offline fallback)
 */
export async function getDeviceApprovalStatus(deviceId: string): Promise<{
  status: DeviceApprovalStatus | 'unregistered';
  device?: AuthorizedDevice;
  isOffline?: boolean;
}> {
  try {
    const all = await fetchDeviceRegistry();
    const found = all.find((d) => d.deviceId === deviceId);

    if (!found) {
      // Check offline fallback if previously approved
      if (isDeviceLocallyApproved(deviceId)) {
        return { status: 'approved', isOffline: true };
      }
      return { status: 'unregistered' };
    }

    // If revoked, strictly revoke local approval too
    if (found.status === 'revoked') {
      clearLocalDeviceApproval();
      return { status: 'revoked', device: found };
    }

    // If approved, ensure local cache is updated
    if (found.status === 'approved') {
      try {
        localStorage.setItem(STORAGE_KEY_DEVICE_APPROVED_STATUS, 'approved');
        localStorage.setItem(STORAGE_KEY_DEVICE_APPROVED_ID, deviceId);
      } catch {}

      // Update last active in background
      saveDeviceRegistry(
        all.map((d) => (d.deviceId === deviceId ? { ...d, lastActiveAt: new Date().toISOString() } : d))
      ).catch(() => {});
    }

    return { status: found.status, device: found };
  } catch (networkErr) {
    // Network / offline error: check local approval
    if (isDeviceLocallyApproved(deviceId)) {
      return { status: 'approved', isOffline: true };
    }
    return { status: 'pending', isOffline: true };
  }
}

/**
 * Register a new device request for admin review
 */
export async function registerDeviceRequest(
  deviceId: string,
  deviceName: string,
  platform: 'windows_pc' | 'android_mobile' | 'android_tv'
): Promise<{ success: boolean; device?: AuthorizedDevice; error?: string }> {
  try {
    const all = await fetchDeviceRegistry();
    const existing = all.find((d) => d.deviceId === deviceId);
    const now = new Date().toISOString();

    let updatedList: AuthorizedDevice[];
    let targetDevice: AuthorizedDevice;

    if (existing) {
      targetDevice = {
        ...existing,
        deviceName: deviceName.trim() || existing.deviceName,
        platform,
        status: existing.status === 'revoked' ? 'pending' : existing.status,
        lastActiveAt: now,
      };
      updatedList = all.map((d) => (d.deviceId === deviceId ? targetDevice : d));
    } else {
      targetDevice = {
        deviceId,
        deviceName: deviceName.trim() || 'Thiết bị mới',
        platform,
        status: 'pending',
        createdAt: now,
        lastActiveAt: now,
      };
      updatedList = [targetDevice, ...all];
    }

    const saved = await saveDeviceRegistry(updatedList);
    if (!saved) {
      return { success: false, error: 'Không thể kết nối máy chủ Supabase để gửi yêu cầu' };
    }

    try {
      localStorage.setItem(STORAGE_KEY_DEVICE_NAME, targetDevice.deviceName);
    } catch {}

    return { success: true, device: targetDevice };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Lỗi gửi yêu cầu' };
  }
}

/**
 * Admin action: Generate 4-digit OTP with 2-minute (120s) expiration
 */
export async function generateDeviceOtp(deviceId: string): Promise<{
  success: boolean;
  otpCode?: string;
  otpExpiresAt?: string;
  error?: string;
}> {
  try {
    const all = await fetchDeviceRegistry();
    const device = all.find((d) => d.deviceId === deviceId);
    if (!device) {
      return { success: false, error: 'Không tìm thấy thiết bị này trong danh sách' };
    }

    // Generate random 4-digit code (1000 - 9999)
    const otpCode = Math.floor(1000 + Math.random() * 9000).toString();
    const otpExpiresAt = new Date(Date.now() + 120 * 1000).toISOString(); // 2 minutes

    const updated = all.map((d) =>
      d.deviceId === deviceId
        ? {
            ...d,
            otpCode,
            otpExpiresAt,
            lastActiveAt: new Date().toISOString(),
          }
        : d
    );

    const saved = await saveDeviceRegistry(updated);
    if (!saved) {
      return { success: false, error: 'Lỗi lưu mã OTP lên máy chủ' };
    }

    return { success: true, otpCode, otpExpiresAt };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Lỗi tạo mã OTP' };
  }
}

/**
 * Client action: Verify 4-digit OTP entered by friend
 */
export async function verifyDeviceOtp(
  deviceId: string,
  enteredOtp: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const cleanOtp = enteredOtp.trim();
    if (cleanOtp.length !== 4) {
      return { success: false, error: 'Mã OTP phải có đúng 4 chữ số' };
    }

    const all = await fetchDeviceRegistry();
    const device = all.find((d) => d.deviceId === deviceId);
    if (!device) {
      return { success: false, error: 'Không tìm thấy thiết bị này trên máy chủ' };
    }

    if (!device.otpCode || !device.otpExpiresAt) {
      return { success: false, error: 'Chưa có mã OTP nào được Admin cấp cho thiết bị này' };
    }

    const expiresTime = new Date(device.otpExpiresAt).getTime();
    if (Date.now() > expiresTime) {
      return { success: false, error: 'Mã OTP đã hết hạn (chỉ có hiệu lực trong 2 phút). Vui lòng yêu cầu Admin cấp lại mã mới.' };
    }

    if (device.otpCode !== cleanOtp) {
      return { success: false, error: 'Mã OTP không chính xác. Vui lòng kiểm tra lại.' };
    }

    // Match confirmed: approve device
    const now = new Date().toISOString();
    const updated = all.map((d) =>
      d.deviceId === deviceId
        ? {
            ...d,
            status: 'approved' as DeviceApprovalStatus,
            approvedAt: now,
            otpCode: null,
            otpExpiresAt: null,
            lastActiveAt: now,
          }
        : d
    );

    const saved = await saveDeviceRegistry(updated);
    if (!saved) {
      return { success: false, error: 'Lỗi kích hoạt trên máy chủ' };
    }

    try {
      localStorage.setItem(STORAGE_KEY_DEVICE_APPROVED_STATUS, 'approved');
      localStorage.setItem(STORAGE_KEY_DEVICE_APPROVED_ID, deviceId);
    } catch {}

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Lỗi xác minh OTP' };
  }
}

/**
 * Emergency Admin Bypass: Enter Admin PIN directly to auto-approve device & enter Admin mode
 */
export async function bypassApproveDeviceWithAdminPin(
  deviceId: string,
  deviceName: string,
  platform: 'windows_pc' | 'android_mobile' | 'android_tv',
  pin: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const isValidPin = await verifyAdminPin(pin);
    if (!isValidPin) {
      return { success: false, error: 'Mã PIN Admin không chính xác' };
    }

    const all = await fetchDeviceRegistry().catch(() => []);
    const now = new Date().toISOString();
    const existing = all.find((d) => d.deviceId === deviceId);

    let updatedList: AuthorizedDevice[];
    if (existing) {
      updatedList = all.map((d) =>
        d.deviceId === deviceId
          ? {
              ...d,
              deviceName: d.deviceName || deviceName || 'Master Admin Device',
              platform,
              status: 'approved' as DeviceApprovalStatus,
              approvedAt: now,
              otpCode: null,
              otpExpiresAt: null,
              lastActiveAt: now,
            }
          : d
      );
    } else {
      updatedList = [
        {
          deviceId,
          deviceName: deviceName || 'Master Admin Device',
          platform,
          status: 'approved',
          approvedAt: now,
          createdAt: now,
          lastActiveAt: now,
        },
        ...all,
      ];
    }

    // Save to Supabase (best effort)
    saveDeviceRegistry(updatedList).catch(() => {});

    // Save local approval
    try {
      localStorage.setItem(STORAGE_KEY_DEVICE_APPROVED_STATUS, 'approved');
      localStorage.setItem(STORAGE_KEY_DEVICE_APPROVED_ID, deviceId);
    } catch {}

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Lỗi xác thực Master PIN' };
  }
}

/**
 * Admin action: Revoke access for a device
 */
export async function revokeDevice(deviceId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const all = await fetchDeviceRegistry();
    const updated = all.map((d) =>
      d.deviceId === deviceId
        ? {
            ...d,
            status: 'revoked' as DeviceApprovalStatus,
            otpCode: null,
            otpExpiresAt: null,
            lastActiveAt: new Date().toISOString(),
          }
        : d
    );

    const saved = await saveDeviceRegistry(updated);
    if (!saved) {
      return { success: false, error: 'Lỗi cập nhật trạng thái thu hồi trên máy chủ' };
    }

    // If current machine was revoked, clear local approval
    const currentId = await getHardwareDeviceId();
    if (currentId === deviceId) {
      clearLocalDeviceApproval();
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Lỗi thu hồi thiết bị' };
  }
}

/**
 * Admin action: Delete a device permanently
 */
export async function deleteAuthorizedDevice(deviceId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const all = await fetchDeviceRegistry();
    const updated = all.filter((d) => d.deviceId !== deviceId);
    const saved = await saveDeviceRegistry(updated);

    if (!saved) {
      return { success: false, error: 'Lỗi xóa thiết bị trên máy chủ' };
    }

    const currentId = await getHardwareDeviceId();
    if (currentId === deviceId) {
      clearLocalDeviceApproval();
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Lỗi xóa thiết bị' };
  }
}

/**
 * List all devices for admin management
 */
export async function listAuthorizedDevices(): Promise<AuthorizedDevice[]> {
  try {
    return await fetchDeviceRegistry();
  } catch {
    return [];
  }
}

/**
 * Session version check: Requires re-login when app version changes
 */
export function shouldRequireReLoginForNewVersion(currentVersion: string): boolean {
  try {
    const lastVersion = localStorage.getItem(STORAGE_KEY_LAST_LOGIN_VERSION);
    if (!lastVersion) return false; // First time or legacy, allow normal session
    return lastVersion !== currentVersion;
  } catch {
    return false;
  }
}

export function markCurrentVersionLoggedIn(currentVersion: string): void {
  try {
    localStorage.setItem(STORAGE_KEY_LAST_LOGIN_VERSION, currentVersion);
  } catch {}
}
