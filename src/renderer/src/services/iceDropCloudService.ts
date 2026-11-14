import type { IceDropShareItem } from '../types';
import { DEFAULT_SUPABASE_URL, DEFAULT_SUPABASE_ANON_KEY } from './platformAdapter';

const HUB_PROFILE_ID = 'icedrop_cloud_hub';

export class IceDropCloudService {
  private static baseUrl = DEFAULT_SUPABASE_URL.replace(/\/+$/, '');
  private static anonKey = DEFAULT_SUPABASE_ANON_KEY;

  /**
   * Fetch all active shares from Supabase Cloud (TTL 10 mins)
   */
  public static async getActiveShares(): Promise<IceDropShareItem[]> {
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

      // Filter only unexpired items (within 10 mins TTL)
      const validItems = allItems.filter((item) => item.expiresAt > now);

      // If any expired items were filtered out, clean them in the background
      if (validItems.length < allItems.length) {
        this.saveSharesToCloud(validItems).catch(() => {});
      }

      return validItems;
    } catch (e) {
      console.warn('IceDropCloudService getActiveShares error:', e);
      return [];
    }
  }

  /**
   * Create a new share with a truly random 4-digit PIN code
   */
  public static async createShare(data: {
    senderProfileId?: string;
    senderName?: string;
    type: 'text' | 'link';
    content: string;
  }): Promise<IceDropShareItem | null> {
    try {
      const currentShares = await this.getActiveShares();

      // Generate truly random 4-digit code (1000 - 9999) ensuring no collision
      let pinCode = Math.floor(1000 + Math.random() * 9000).toString();
      const existingPins = new Set(currentShares.map((s) => s.pinCode));
      while (existingPins.has(pinCode)) {
        pinCode = Math.floor(1000 + Math.random() * 9000).toString();
      }

      const now = new Date();
      const expiresAt = new Date(now.getTime() + 10 * 60 * 1000).toISOString(); // 10 mins TTL

      const newShare: IceDropShareItem = {
        id: 'drop_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        senderProfileId: data.senderProfileId,
        senderName: data.senderName || 'Người dùng Icelauch',
        type: data.type,
        content: data.content.trim(),
        pinCode,
        createdAt: now.toISOString(),
        expiresAt,
      };

      // Limit to 5 items max (remove oldest if full)
      const updatedList = [newShare, ...currentShares].slice(0, 5);

      const saved = await this.saveSharesToCloud(updatedList);
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
   * Delete a share by ID
   */
  public static async deleteShare(shareId: string): Promise<boolean> {
    try {
      const currentShares = await this.getActiveShares();
      const updatedList = currentShares.filter((s) => s.id !== shareId);
      return await this.saveSharesToCloud(updatedList);
    } catch (e) {
      console.error('IceDropCloudService deleteShare error:', e);
      return false;
    }
  }

  /**
   * Find a share by 4-digit PIN code
   */
  public static async findByPinCode(pinCode: string): Promise<IceDropShareItem | null> {
    const shares = await this.getActiveShares();
    const cleanPin = pinCode.trim();
    return shares.find((s) => s.pinCode === cleanPin) || null;
  }

  /**
   * Internal helper to upsert shares array to Supabase
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
