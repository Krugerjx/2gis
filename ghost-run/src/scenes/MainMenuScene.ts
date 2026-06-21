// Main menu: title, best distance, coins, daily streak, Play and Shop.

import Phaser from "phaser";
import { GAME, COLORS } from "../config";
import { Economy } from "../systems/Economy";
import { makeButton, hex } from "../systems/ui";
import { drawBackground } from "../systems/background";
import { Player } from "../objects/Player";

export class MainMenuScene extends Phaser.Scene {
  constructor() {
    super("MainMenu");
  }

  create(): void {
    drawBackground(this);

    const cx = GAME.WIDTH / 2;

    // Decorative mascot preview using the equipped skin.
    new Player(this, () => cx, Economy.getEquippedSkin());

    this.add
      .text(cx, 150, "GHOST RUN", {
        fontFamily: "system-ui, sans-serif",
        fontSize: "72px",
        color: hex(COLORS.text),
        fontStyle: "900",
      })
      .setOrigin(0.5)
      .setShadow(0, 0, hex(COLORS.accent), 24, true, true);

    this.add
      .text(cx, 210, "обгони свой призрак", {
        fontFamily: "system-ui, sans-serif",
        fontSize: "26px",
        color: hex(COLORS.textDim),
        fontStyle: "600",
      })
      .setOrigin(0.5);

    // Stats row.
    this.add
      .text(cx, 300, `Рекорд: ${Economy.getBest()} м`, {
        fontFamily: "system-ui, sans-serif",
        fontSize: "30px",
        color: hex(COLORS.player),
        fontStyle: "700",
      })
      .setOrigin(0.5);

    this.refreshCoins(cx);

    // Buttons.
    makeButton(this, cx, GAME.HEIGHT - 320, "ИГРАТЬ", () => this.scene.start("Game"), {
      width: 320,
      height: 100,
      fontSize: 40,
    });
    makeButton(this, cx, GAME.HEIGHT - 200, "МАГАЗИН", () => this.scene.start("Shop"), {
      width: 320,
      height: 86,
      fill: 0x2a2a55,
    });

    this.showDailyStreak(cx);
  }

  private refreshCoins(cx: number): void {
    this.add
      .text(cx, 340, `★ ${Economy.getCoins()} монет`, {
        fontFamily: "system-ui, sans-serif",
        fontSize: "26px",
        color: hex(COLORS.coin),
        fontStyle: "700",
      })
      .setOrigin(0.5);
  }

  private showDailyStreak(cx: number): void {
    const { reward, streak } = Economy.claimDailyStreak();
    if (reward <= 0) return;

    // Lightweight reward toast.
    const toast = this.add.container(cx, -120);
    const g = this.add.graphics();
    g.fillStyle(0x161636, 0.96);
    g.fillRoundedRect(-200, -50, 400, 100, 24);
    g.lineStyle(3, COLORS.coin, 1);
    g.strokeRoundedRect(-200, -50, 400, 100, 24);
    const t1 = this.add
      .text(0, -16, `🔥 Серия ${streak} ${streak === 1 ? "день" : "дней"}!`, {
        fontFamily: "system-ui, sans-serif",
        fontSize: "26px",
        color: hex(COLORS.text),
        fontStyle: "800",
      })
      .setOrigin(0.5);
    const t2 = this.add
      .text(0, 18, `+${reward} монет`, {
        fontFamily: "system-ui, sans-serif",
        fontSize: "24px",
        color: hex(COLORS.coin),
        fontStyle: "700",
      })
      .setOrigin(0.5);
    toast.add([g, t1, t2]);

    this.tweens.add({ targets: toast, y: 120, duration: 600, ease: "Back.out" });
    this.tweens.add({ targets: toast, y: -120, delay: 2600, duration: 400, ease: "Back.in" });
  }
}
