// Cosmetic skins. Purely visual (no gameplay effect) so the game stays fair
// and store-compliant. Skins change the player's body + trail color and are the
// main flex shown off in shared clips, which drives both IAP and virality.

export interface Skin {
  id: string;
  name: string;
  /** Body color. */
  color: number;
  /** Trail / glow color. */
  trail: number;
  /** Cost in coins. 0 = free/default. */
  price: number;
  /** If true, this skin is sold for real money (IAP), not coins. */
  premium?: boolean;
}

export const SKINS: Skin[] = [
  { id: "blip", name: "Blip", color: 0x46e8d8, trail: 0x7a5cff, price: 0 },
  { id: "ember", name: "Ember", color: 0xff7a3d, trail: 0xffcf3d, price: 250 },
  { id: "mint", name: "Mint", color: 0x6bffb0, trail: 0x2affd5, price: 400 },
  { id: "rose", name: "Rose", color: 0xff5cc8, trail: 0xff9ecb, price: 600 },
  { id: "violet", name: "Violet", color: 0xb15cff, trail: 0x7a5cff, price: 800 },
  { id: "gold", name: "Gold Rush", color: 0xffd23f, trail: 0xfff3b0, price: 1500 },
  { id: "void", name: "Void", color: 0x2b2b4a, trail: 0x7a5cff, price: 2500 },
  { id: "aurora", name: "Aurora", color: 0x46e8d8, trail: 0xff5cc8, price: 0, premium: true },
];

export function findSkin(id: string): Skin {
  return SKINS.find((s) => s.id === id) ?? SKINS[0];
}
