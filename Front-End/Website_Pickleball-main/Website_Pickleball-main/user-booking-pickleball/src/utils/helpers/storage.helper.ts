import CryptoJS from 'crypto-js';

import { CURRENT_ENV } from '@/core/configs/env';

class StorageHelper {
  private static secretKey = CURRENT_ENV.SECRET_KEY ?? 'SECRET_KEY';

  public static set(key: string, value: any) {
    localStorage.setItem(key, JSON.stringify(value));
  }
  public static get<T>(key: string, defaultValue?: T): T {
    const value = localStorage.getItem(key);
    return (value ? JSON.parse(value) : defaultValue) as T;
  }
  public static remove(key: string): void {
    localStorage.removeItem(key);
  }

  public static setItem(key: string, data: any) {
    if (!data) return;
    try {
      const encript = CryptoJS.AES.encrypt(JSON.stringify(data), this.secretKey).toString();
      localStorage.setItem(key, encript);
    } catch (error) {
      console.error('Error encoding and storing data:', error);
    }
  }

  public static getItem(key: string) {
    try {
      const data = localStorage.getItem(key);
      if (data) {
        const bytes = CryptoJS.AES.decrypt(data, this.secretKey);
        const originalText = bytes.toString(CryptoJS.enc.Utf8);
        return JSON.parse(originalText);
      }
    } catch (error) {
      console.error('Error decoding data:', error);
      return null;
    }
  }
}

export default StorageHelper;
