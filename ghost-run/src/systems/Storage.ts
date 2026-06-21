// Cross-platform persistent storage.
//
// On the web it uses localStorage. On native (Capacitor) it transparently
// upgrades to @capacitor/preferences so saves survive app restarts. We keep a
// synchronous in-memory cache so the game code can read values without awaiting.

import { Preferences } from "@capacitor/preferences";
import { Capacitor } from "@capacitor/core";

const isNative = Capacitor.isNativePlatform();
const cache = new Map<string, string>();

export const Storage = {
  /** Load all known keys into the cache. Call once at boot. */
  async init(keys: string[]): Promise<void> {
    if (!isNative) {
      for (const k of keys) {
        const v = localStorage.getItem(k);
        if (v !== null) cache.set(k, v);
      }
      return;
    }
    for (const k of keys) {
      const { value } = await Preferences.get({ key: k });
      if (value !== null) cache.set(k, value);
    }
  },

  getString(key: string, fallback = ""): string {
    return cache.has(key) ? (cache.get(key) as string) : fallback;
  },

  getNumber(key: string, fallback = 0): number {
    const v = cache.get(key);
    const n = v === undefined ? NaN : Number(v);
    return Number.isFinite(n) ? n : fallback;
  },

  getJSON<T>(key: string, fallback: T): T {
    const v = cache.get(key);
    if (v === undefined) return fallback;
    try {
      return JSON.parse(v) as T;
    } catch {
      return fallback;
    }
  },

  set(key: string, value: string | number | object): void {
    const str =
      typeof value === "string" ? value : typeof value === "number" ? String(value) : JSON.stringify(value);
    cache.set(key, str);
    if (isNative) {
      // Fire and forget; the cache already reflects the new value.
      void Preferences.set({ key, value: str });
    } else {
      localStorage.setItem(key, str);
    }
  },
};
