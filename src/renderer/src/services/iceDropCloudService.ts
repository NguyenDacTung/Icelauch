import type { IceDropShareItem } from '../types';
import { DEFAULT_SUPABASE_URL, DEFAULT_SUPABASE_ANON_KEY } from './platformAdapter';

const HUB_PROFILE_ID = 'icedrop_cloud_hub';

export class IceDropCloudService {
  private static baseUrl = DEFAULT_SUPABASE_URL.replace(/\/+$/, '');
  private static anonKey = DEFAULT_SUPABASE_ANON_KEY;

  /**
   * Fetch all unexpired shares across the cloud system (Internal helper).
   * Automatically cleans items that have reached their own individual 10-minute expiration.
   */
  public static async getAllUnexpiredShares(): Promise<IceDropShareItem[]> {
    try {
      const url = `${this.baseUrl}/rest/v1/icelauch_user_data?profile_id=eq.${HUB_PROFILE_ID}&select=library`;
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          apikey: this.anonKey,
          Authorization: `Bearer ${this.anonKey}`,
          Accept: 'application/json',
        },
      });

      if (!res.ok) {
        console.warn('IceDropCloudService fetch status:', res.status);
        return [];
      }

      const rows = await res.json();
      if (!rows || rows.length === 0 || !Array.isArray(rows[0].library)) {
        return [];
      }

      const allItems: IceDropShareItem[] = rows[0].library;
      const now = new Date().toISOString();

      // Independent TTL: only remove items where expiresAt <= now
      const validItems = allItems.filter((item) => item.expiresAt > now);

      // Clean expired items in background if any expired
      if (validItems.length < allItems.length) {
        this.saveSharesToCloud(validItems).catch(() => {});
      }

      return validItems;
    } catch (e) {
      console.warn('IceDropCloudService getAllUnexpiredShares error:', e);
      return [];
    }
  }

  /**
   * Fetch ONLY shares created by the logged-in profile.
   * Other users or guests NEVER see these in their list.
   */
  public static async getMyActiveShares(profileId: string): Promise<IceDropShareItem[]> {
    if (!profileId) return [];
    const all = await this.getAllUnexpiredShares();
    return all.filter((s) => s.senderProfileId === profileId);
  }

  /**
   * Create a new share for a logged-in user.
   * Max 5 shares limit is strictly per account.
   */
  public static async createShare(data: {
    senderProfileId: string;
    senderName: string;
    type: 'text' | 'link';
    content: string;
  }): Promise<IceDropShareItem | null> {
    if (!data.senderProfileId) {
      throw new Error('Chỉ tài khoản đã đăng nhập mới có thể tạo chia sẻ đám mây');
    }

    try {
      const allShares = await this.getAllUnexpiredShares();

      // Check personal shares limit for this specific user (Max 5)
      const myShares = allShares.filter((s) => s.senderProfileId === data.senderProfileId);
      let updatedShares = [...allShares];

      if (myShares.length >= 5) {
        // Find the oldest share belonging to THIS user and remove it
        const oldestOfMe = myShares[myShares.length - 1];
        if (oldestOfMe) {
          updatedShares = updatedShares.filter((s) => s.id !== oldestOfMe.id);
        }
      }

      // Generate truly random 4-digit code (1000 - 9999) ensuring no collision
      let pinCode = Math.floor(1000 + Math.random() * 9000).toString();
      const existingPins = new Set(updatedShares.map((s) => s.pinCode));
      while (existingPins.has(pinCode)) {
        pinCode = Math.floor(1000 + Math.random() * 9000).toString();
      }

      const now = new Date();
      // Independent 10 mins TTL per share item
      const expiresAt = new Date(now.getTime() + 10 * 60 * 1000).toISOString();

      const newShare: IceDropShareItem = {
        id: 'drop_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        senderProfileId: data.senderProfileId,
        senderName: data.senderName,
        type: data.type,
        content: data.content.trim(),
        pinCode,
        createdAt: now.toISOString(),
        expiresAt,
      };

      updatedShares = [newShare, ...updatedShares];

      const saved = await this.saveSharesToCloud(updatedShares);
      if (saved) {
        return newShare;
      }
      return null;
    } catch (e) {
      console.error('IceDropCloudService createShare error:', e);
      return null;
    }
  }

  /**
   * Delete a share created by the logged-in user
   */
  public static async deleteShare(shareId: string): Promise<boolean> {
    try {
      const allShares = await this.getAllUnexpiredShares();
      const updatedList = allShares.filter((s) => s.id !== shareId);
      return await this.saveSharesToCloud(updatedList);
    } catch (e) {
      console.error('IceDropCloudService deleteShare error:', e);
      return false;
    }
  }

  /**
   * Lookup a share by 4-digit PIN code across all active shares
   */
  public static async findByPinCode(pinCode: string): Promise<IceDropShareItem | null> {
    const cleanPin = pinCode.trim();
    if (cleanPin.length !== 4) return null;
    const all = await this.getAllUnexpiredShares();
    return all.find((s) => s.pinCode === cleanPin) || null;
  }

  /**
   * Upsert shares array to Supabase
   */
  private static async saveSharesToCloud(shares: IceDropShareItem[]): Promise<boolean> {
    try {
      const url = `${this.baseUrl}/rest/v1/icelauch_user_data`;
      const payload = {
        profile_id: HUB_PROFILE_ID,
        library: shares,
        updated_at: new Date().toISOString(),
      };

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          apikey: this.anonKey,
          Authorization: `Bearer ${this.anonKey}`,
          'Content-Type': 'application/json',
          Prefer: 'resolution=merge-duplicates',
        },
        body: JSON.stringify(payload),
      });

      return res.ok;
    } catch (e) {
      console.error('IceDropCloudService saveSharesToCloud error:', e);
      return false;
    }
  }
}
