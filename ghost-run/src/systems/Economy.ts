// Game economy: coins, owned skins, equipped skin, best distance, streak.
// All values are mirrored to persistent Storage immediately.

import { Storage } from "./Storage";
import { STORAGE_KEYS } from "../config";
import { SKINS } from "../data/skins";

export const Economy = {
  getCoins(): number {
    return Storage.getNumber(STORAGE_KEYS.totalCoins, 0);
  },

  addCoins(amount: number): number {
    const next = Math.max(0, this.getCoins() + amount);
    Storage.set(STORAGE_KEYS.totalCoins, next);
    return next;
  },

  spendCoins(amount: number): boolean {
    if (this.getCoins() < amount) return false;
    Storage.set(STORAGE_KEYS.totalCoins, this.getCoins() - amount);
    return true;
  },

  getBest(): number {
    return Storage.getNumber(STORAGE_KEYS.bestDistance, 0);
  },

  /** Returns true if this run set a new best. */
  recordDistance(distance: number): boolean {
    if (distance > this.getBest()) {
      Storage.set(STORAGE_KEYS.bestDistance, Math.floor(distance));
      return true;
    }
    return false;
  },

  getOwnedSkins(): string[] {
    const owned = Storage.getJSON<string[]>(STORAGE_KEYS.ownedSkins, ["blip"]);
    return owned.includes("blip") ? owned : ["blip", ...owned];
  },

  ownsSkin(id: string): boolean {
    return this.getOwnedSkins().includes(id);
  },

  unlockSkin(id: string): void {
    const owned = this.getOwnedSkins();
    if (!owned.includes(id)) {
      owned.push(id);
      Storage.set(STORAGE_KEYS.ownedSkins, owned);
    }
  },

  getEquippedSkin(): string {
    return Storage.getString(STORAGE_KEYS.equippedSkin, "blip");
  },

  equipSkin(id: string): void {
    if (this.ownsSkin(id)) Storage.set(STORAGE_KEYS.equippedSkin, id);
  },

  incrementRuns(): number {
    const n = Storage.getNumber(STORAGE_KEYS.runsPlayed, 0) + 1;
    Storage.set(STORAGE_KEYS.runsPlayed, n);
    return n;
  },

  getRuns(): number {
    return Storage.getNumber(STORAGE_KEYS.runsPlayed, 0);
  },

  /**
   * Daily streak. Returns the reward (coins) if a new day was claimed, else 0.
   * Reward grows with the streak length, capped to keep the economy sane.
   */
  claimDailyStreak(): { reward: number; streak: number } {
    const today = new Date().toISOString().slice(0, 10);
    const lastDay = Storage.getString(STORAGE_KEYS.streakDay, "");
    if (lastDay === today) {
      return { reward: 0, streak: Storage.getNumber(STORAGE_KEYS.streakCount, 1) };
    }

    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    const prevStreak = Storage.getNumber(STORAGE_KEYS.streakCount, 0);
    const streak = lastDay === yesterday ? prevStreak + 1 : 1;

    const reward = Math.min(50 + (streak - 1) * 25, 300);
    Storage.set(STORAGE_KEYS.streakDay, today);
    Storage.set(STORAGE_KEYS.streakCount, streak);
    this.addCoins(reward);
    return { reward, streak };
  },

  totalSkins(): number {
    return SKINS.length;
  },
};
