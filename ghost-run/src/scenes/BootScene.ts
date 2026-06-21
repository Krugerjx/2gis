// Boot: generate procedural neon textures, optionally load Higgsfield art if
// present, initialize persistent storage, then go to the menu.

import Phaser from "phaser";
import { Storage } from "../systems/Storage";
import { STORAGE_KEYS } from "../config";

export class BootScene extends Phaser.Scene {
  constructor() {
    super("Boot");
  }

  preload(): void {
    // Optional generated art. Missing files are tolerated (we fall back to the
    // procedural textures created below), so ignore load errors here.
    this.load.image("blip_art", "assets/blip.png");
    this.load.image("bg_art", "assets/bg.png");
    this.load.on("loaderror", () => {
      /* optional art not present — procedural fallback is used */
    });
  }

  create(): void {
    this.makeOrb("orb", 0xffffff);
    this.makeSoft("spark", 24);
    this.makeCoin();
    this.makeBlock();

    void Storage.init(Object.values(STORAGE_KEYS)).then(() => {
      this.scene.start("MainMenu");
    });
  }

  /** Glowing orb: bright core fading to transparent edge. Tinted at use. */
  private makeOrb(key: string, _color: number): void {
    const size = 128;
    const tex = this.textures.createCanvas(key, size, size);
    if (!tex) return;
    const ctx = tex.getContext();
    const r = size / 2;
    const grad = ctx.createRadialGradient(r, r, r * 0.1, r, r, r);
    grad.addColorStop(0, "rgba(255,255,255,1)");
    grad.addColorStop(0.55, "rgba(255,255,255,0.95)");
    grad.addColorStop(0.8, "rgba(255,255,255,0.35)");
    grad.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
    tex.refresh();
  }

  /** Soft round particle. */
  private makeSoft(key: string, size: number): void {
    const tex = this.textures.createCanvas(key, size, size);
    if (!tex) return;
    const ctx = tex.getContext();
    const r = size / 2;
    const grad = ctx.createRadialGradient(r, r, 0, r, r, r);
    grad.addColorStop(0, "rgba(255,255,255,1)");
    grad.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
    tex.refresh();
  }

  /** Gold coin disc with a highlight. */
  private makeCoin(): void {
    const size = 64;
    const tex = this.textures.createCanvas("coin", size, size);
    if (!tex) return;
    const ctx = tex.getContext();
    const r = size / 2;
    const grad = ctx.createRadialGradient(r * 0.7, r * 0.7, r * 0.2, r, r, r);
    grad.addColorStop(0, "#fff3b0");
    grad.addColorStop(0.5, "#ffd23f");
    grad.addColorStop(1, "#e0a615");
    ctx.beginPath();
    ctx.arc(r, r, r - 3, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = "rgba(255,255,255,0.6)";
    ctx.stroke();
    tex.refresh();
  }

  /** White rounded block, tinted to obstacle color at use. */
  private makeBlock(): void {
    const w = 120;
    const h = 120;
    const g = this.add.graphics();
    g.fillStyle(0xffffff, 1);
    g.fillRoundedRect(0, 0, w, h, 22);
    g.lineStyle(6, 0xffffff, 1);
    g.strokeRoundedRect(3, 3, w - 6, h - 6, 20);
    g.generateTexture("block", w, h);
    g.destroy();
  }
}
