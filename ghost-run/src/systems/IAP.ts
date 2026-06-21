// In-App Purchases abstraction.
//
// Defines the store catalog and a platform-agnostic purchase flow. On the web
// it simulates a successful purchase so the unlock logic is testable. On native
// (Google Play Billing / StoreKit), wire a Capacitor IAP plugin (e.g.
// @capacitor-community/in-app-purchases or RevenueCat) in `purchase`.
//
// IMPORTANT for store review: every consumable/non-consumable below must be
// registered with the SAME product id in Google Play Console and App Store
// Connect before release.

import { Capacitor } from "@capacitor/core";
import { Ads } from "./Ads";
import { Economy } from "./Economy";

export type ProductId =
  | "remove_ads"
  | "coins_small"
  | "coins_large"
  | "starter_pack"
  | "skin_aurora";

export interface Product {
  id: ProductId;
  title: string;
  desc: string;
  priceLabel: string; // shown in UI; real price comes from the store at runtime
  kind: "consumable" | "nonConsumable";
}

export const PRODUCTS: Product[] = [
  { id: "remove_ads", title: "Без рекламы", desc: "Убрать межстраничную рекламу навсегда", priceLabel: "$2.99", kind: "nonConsumable" },
  { id: "starter_pack", title: "Набор новичка", desc: "1000 монет + скин Aurora", priceLabel: "$1.99", kind: "consumable" },
  { id: "coins_small", title: "Горсть монет", desc: "500 монет", priceLabel: "$0.99", kind: "consumable" },
  { id: "coins_large", title: "Сундук монет", desc: "3000 монет", priceLabel: "$4.99", kind: "consumable" },
  { id: "skin_aurora", title: "Скин Aurora", desc: "Эксклюзивный премиум-скин", priceLabel: "$1.99", kind: "nonConsumable" },
];

export const IAP = {
  /**
   * Attempt to purchase a product. Resolves true on success.
   * Grants entitlements locally on success.
   */
  async purchase(id: ProductId): Promise<boolean> {
    const ok = Capacitor.isNativePlatform() ? await this.purchaseNative(id) : await this.simulate(id);
    if (ok) this.grant(id);
    return ok;
  },

  grant(id: ProductId): void {
    switch (id) {
      case "remove_ads":
        Ads.setAdsRemoved(true);
        break;
      case "coins_small":
        Economy.addCoins(500);
        break;
      case "coins_large":
        Economy.addCoins(3000);
        break;
      case "starter_pack":
        Economy.addCoins(1000);
        Economy.unlockSkin("aurora");
        break;
      case "skin_aurora":
        Economy.unlockSkin("aurora");
        break;
    }
  },

  async purchaseNative(_id: ProductId): Promise<boolean> {
    // TODO(native): call the billing plugin, await the transaction, verify the
    // receipt, then resolve true. Return false on cancel/failure.
    return this.simulate(_id);
  },

  // --- web/dev simulation -------------------------------------------------
  simulate(id: ProductId): Promise<boolean> {
    const product = PRODUCTS.find((p) => p.id === id);
    return new Promise((resolve) => {
      const ok = confirm(`Симуляция покупки: ${product?.title ?? id} (${product?.priceLabel ?? ""})\n\nПодтвердить?`);
      resolve(ok);
    });
  },
};
