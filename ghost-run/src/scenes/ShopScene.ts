// Shop: cosmetic skins (bought with coins) and the real-money store (IAP).
// Skins are purely visual to keep the game fair and store-compliant.

import Phaser from "phaser";
import { GAME, COLORS } from "../config";
import { drawBackground } from "../systems/background";
import { Economy } from "../systems/Economy";
import { SKINS, Skin } from "../data/skins";
import { IAP, PRODUCTS } from "../systems/IAP";
import { makeButton, hex } from "../systems/ui";

export class ShopScene extends Phaser.Scene {
  private coinsLabel!: Phaser.GameObjects.Text;

  constructor() {
    super("Shop");
  }

  create(): void {
    drawBackground(this);
    const cx = GAME.WIDTH / 2;

    this.add
      .text(cx, 70, "МАГАЗИН", {
        fontFamily: "system-ui, sans-serif",
        fontSize: "48px",
        color: hex(COLORS.text),
        fontStyle: "900",
      })
      .setOrigin(0.5);

    this.coinsLabel = this.add
      .text(cx, 120, "", {
        fontFamily: "system-ui, sans-serif",
        fontSize: "28px",
        color: hex(COLORS.coin),
        fontStyle: "700",
      })
      .setOrigin(0.5);
    this.refreshCoins();

    // Skins grid (3 columns).
    const cols = 3;
    const cellW = 150;
    const cellH = 150;
    const startX = cx - cellW;
    const startY = 230;
    SKINS.forEach((skin, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      this.drawSkinCell(skin, startX + col * cellW, startY + row * cellH);
    });

    // Real-money store entry.
    makeButton(this, cx, GAME.HEIGHT - 200, "💎 Магазин монет / без рекламы", () => this.openIapMenu(), {
      width: 420,
      height: 78,
      fill: 0x2a8c5a,
      fontSize: 22,
    });

    makeButton(this, cx, GAME.HEIGHT - 100, "Назад", () => this.scene.start("MainMenu"), {
      width: 200,
      height: 70,
      fill: 0x2a2a55,
      fontSize: 26,
    });
  }

  private refreshCoins(): void {
    this.coinsLabel.setText(`★ ${Economy.getCoins()} монет`);
  }

  private drawSkinCell(skin: Skin, x: number, y: number): void {
    const owned = Economy.ownsSkin(skin.id);
    const equipped = Economy.getEquippedSkin() === skin.id;

    const card = this.add.graphics();
    card.fillStyle(0x161636, 0.9);
    card.fillRoundedRect(x - 64, y - 64, 128, 128, 18);
    if (equipped) {
      card.lineStyle(4, COLORS.player, 1);
      card.strokeRoundedRect(x - 64, y - 64, 128, 128, 18);
    }

    // Skin preview orb.
    const orb = this.add.image(x, y - 14, "orb").setDisplaySize(64, 64).setTint(skin.color);
    void orb;

    this.add
      .text(x, y + 30, skin.name, {
        fontFamily: "system-ui, sans-serif",
        fontSize: "16px",
        color: hex(COLORS.text),
        fontStyle: "700",
      })
      .setOrigin(0.5);

    const label = equipped
      ? "ВЫБРАН"
      : owned
        ? "Надеть"
        : skin.premium
          ? "💎 IAP"
          : `★ ${skin.price}`;

    const status = this.add
      .text(x, y + 52, label, {
        fontFamily: "system-ui, sans-serif",
        fontSize: "15px",
        color: equipped ? hex(COLORS.player) : owned ? hex(COLORS.textDim) : hex(COLORS.coin),
        fontStyle: "700",
      })
      .setOrigin(0.5);

    // Make the whole card tappable.
    const zone = this.add
      .zone(x, y, 128, 128)
      .setInteractive({ useHandCursor: true });
    zone.on("pointerup", () => this.onSkinTap(skin));
    void status;
  }

  private async onSkinTap(skin: Skin): Promise<void> {
    if (Economy.ownsSkin(skin.id)) {
      Economy.equipSkin(skin.id);
      this.scene.restart();
      return;
    }
    if (skin.premium) {
      const ok = await IAP.purchase("skin_aurora");
      if (ok) {
        Economy.equipSkin(skin.id);
        this.scene.restart();
      }
      return;
    }
    if (Economy.spendCoins(skin.price)) {
      Economy.unlockSkin(skin.id);
      Economy.equipSkin(skin.id);
      this.scene.restart();
    } else {
      this.flash("Недостаточно монет");
    }
  }

  private openIapMenu(): void {
    const overlay = this.add.container(0, 0).setDepth(80);
    const dim = this.add.graphics();
    dim.fillStyle(0x05050f, 0.85);
    dim.fillRect(0, 0, GAME.WIDTH, GAME.HEIGHT);
    dim.setInteractive(new Phaser.Geom.Rectangle(0, 0, GAME.WIDTH, GAME.HEIGHT), Phaser.Geom.Rectangle.Contains);
    overlay.add(dim);

    overlay.add(
      this.add
        .text(GAME.WIDTH / 2, 120, "Покупки", {
          fontFamily: "system-ui, sans-serif",
          fontSize: "40px",
          color: hex(COLORS.text),
          fontStyle: "900",
        })
        .setOrigin(0.5)
    );

    PRODUCTS.forEach((p, i) => {
      const y = 220 + i * 110;
      const card = this.add.graphics();
      card.fillStyle(0x161636, 1);
      card.fillRoundedRect(40, y - 44, GAME.WIDTH - 80, 92, 16);
      overlay.add(card);
      overlay.add(
        this.add.text(64, y - 26, p.title, {
          fontFamily: "system-ui, sans-serif",
          fontSize: "24px",
          color: hex(COLORS.text),
          fontStyle: "800",
        })
      );
      overlay.add(
        this.add.text(64, y + 8, p.desc, {
          fontFamily: "system-ui, sans-serif",
          fontSize: "17px",
          color: hex(COLORS.textDim),
        })
      );
      const buy = makeButton(this, GAME.WIDTH - 110, y, p.priceLabel, async () => {
        const ok = await IAP.purchase(p.id);
        if (ok) {
          overlay.destroy();
          this.scene.restart();
        }
      }, { width: 120, height: 60, fill: 0x2a8c5a, fontSize: 20 });
      overlay.add(buy);
    });

    overlay.add(
      makeButton(this, GAME.WIDTH / 2, GAME.HEIGHT - 90, "Закрыть", () => overlay.destroy(), {
        width: 200,
        height: 64,
        fill: 0x2a2a55,
        fontSize: 24,
      })
    );
  }

  private flash(msg: string): void {
    const t = this.add
      .text(GAME.WIDTH / 2, GAME.HEIGHT - 280, msg, {
        fontFamily: "system-ui, sans-serif",
        fontSize: "24px",
        color: hex(COLORS.obstacle),
        fontStyle: "800",
      })
      .setOrigin(0.5)
      .setDepth(90);
    this.tweens.add({ targets: t, alpha: 0, y: t.y - 40, duration: 1200, onComplete: () => t.destroy() });
  }
}
