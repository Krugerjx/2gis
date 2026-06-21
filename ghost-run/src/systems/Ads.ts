// Ads abstraction (rewarded + interstitial).
//
// MONETIZATION DESIGN:
//  - Rewarded video is OPT-IN only: double coins, revive once, free chest.
//  - Interstitial shows at most once every N runs, never during gameplay.
//  - No banner ads on the play field (they hurt retention).
//
// On the web this provides a simulated ad (a short delay) so the full reward
// flow is testable in the browser. On native, wire a real mediation SDK
// (AppLovin MAX recommended) by replacing the bodies of `showRewarded` and
// `showInterstitial`. Suggested plugin: a Capacitor wrapper around AppLovin MAX.

import { Capacitor } from "@capacitor/core";
import { Storage } from "./Storage";
import { STORAGE_KEYS } from "./../config";

const INTERSTITIAL_EVERY_N_RUNS = 3;

let lastInterstitialRun = 0;

export const Ads = {
  adsRemoved(): boolean {
    return Storage.getNumber(STORAGE_KEYS.removeAds, 0) === 1;
  },

  setAdsRemoved(removed: boolean): void {
    Storage.set(STORAGE_KEYS.removeAds, removed ? 1 : 0);
  },

  /**
   * Show a rewarded video. Resolves true if the user watched to completion and
   * earned the reward, false if they skipped/cancelled or no ad was available.
   */
  async showRewarded(): Promise<boolean> {
    if (Capacitor.isNativePlatform()) {
      // TODO(native): call AppLovin MAX rewarded ad here and resolve based on
      // the onUserRewarded / onAdHidden callbacks.
      return this.simulate("Rewarded Ad");
    }
    return this.simulate("Rewarded Ad");
  },

  /**
   * Show an interstitial between runs, rate-limited and skipped when ads are
   * removed via IAP. Resolves when the ad (if any) is dismissed.
   */
  async maybeShowInterstitial(runCount: number): Promise<void> {
    if (this.adsRemoved()) return;
    if (runCount - lastInterstitialRun < INTERSTITIAL_EVERY_N_RUNS) return;
    lastInterstitialRun = runCount;

    if (Capacitor.isNativePlatform()) {
      // TODO(native): call AppLovin MAX interstitial here.
      await this.simulate("Interstitial");
      return;
    }
    await this.simulate("Interstitial");
  },

  // --- web/dev simulation -------------------------------------------------
  // A lightweight overlay that mimics an ad so reward flows can be tested.
  simulate(label: string): Promise<boolean> {
    return new Promise((resolve) => {
      const overlay = document.createElement("div");
      overlay.style.cssText =
        "position:fixed;inset:0;z-index:9999;background:rgba(5,5,15,.92);" +
        "display:flex;flex-direction:column;align-items:center;justify-content:center;" +
        "color:#fff;font-family:system-ui,sans-serif;gap:18px;text-align:center;";
      overlay.innerHTML =
        `<div style="font-size:13px;letter-spacing:2px;color:#7a5cff;">SIMULATED ${label.toUpperCase()}</div>` +
        `<div style="font-size:20px;opacity:.85;">Реклама (заглушка)</div>` +
        `<div id="ad-count" style="font-size:48px;font-weight:800;">3</div>` +
        `<div style="font-size:13px;color:#9aa0c0;">Здесь будет реальная реклама AppLovin на сборке под стор</div>`;
      document.body.appendChild(overlay);
      let n = 3;
      const counter = overlay.querySelector("#ad-count") as HTMLDivElement;
      const timer = setInterval(() => {
        n -= 1;
        if (n <= 0) {
          clearInterval(timer);
          overlay.remove();
          resolve(true);
        } else {
          counter.textContent = String(n);
        }
      }, 700);
    });
  },
};
