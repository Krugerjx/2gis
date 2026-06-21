// Result screen: distance, % beaten, coins, and the viral/monetization hooks —
// double coins (rewarded ad), share card, challenge-a-friend, replay.

import Phaser from "phaser";
import { GAME, COLORS } from "../config";
import { drawBackground } from "../systems/background";
import { Economy } from "../systems/Economy";
import { Ads } from "../systems/Ads";
import { Analytics } from "../systems/Analytics";
import { makeButton, hex } from "../systems/ui";
import { shareResult } from "../systems/Share";
import { GhostStore } from "../systems/GhostRecorder";

interface ResultData {
  distance: number;
  coins: number;
  isBest: boolean;
  runCount: number;
}

/** Deterministic, motivating "you beat N%" stat (no server needed yet). */
function percentBeaten(distance: number): number {
  return Phaser.Math.Clamp(Math.round((100 * distance) / (distance + 300)), 1, 99);
}

export class ResultScene extends Phaser.Scene {
  private result!: ResultData;
  private coinsDoubled = false;
  private coinsText!: Phaser.GameObjects.Text;

  constructor() {
    super("Result");
  }

  init(data: ResultData): void {
    this.result = data;
    this.coinsDoubled = false;
  }

  create(): void {
    drawBackground(this);
    const cx = GAME.WIDTH / 2;
    const pct = percentBeaten(this.result.distance);

    if (this.result.isBest) {
      this.add
        .text(cx, 130, "🏆 НОВЫЙ РЕКОРД!", {
          fontFamily: "system-ui, sans-serif",
          fontSize: "34px",
          color: hex(COLORS.coin),
          fontStyle: "900",
        })
        .setOrigin(0.5);
    }

    this.add
      .text(cx, 250, String(this.result.distance), {
        fontFamily: "system-ui, sans-serif",
        fontSize: "120px",
        color: hex(COLORS.text),
        fontStyle: "900",
      })
      .setOrigin(0.5)
      .setShadow(0, 0, hex(COLORS.accent), 24, true, true);
    this.add
      .text(cx, 330, "МЕТРОВ", {
        fontFamily: "system-ui, sans-serif",
        fontSize: "24px",
        color: hex(COLORS.textDim),
        fontStyle: "700",
      })
      .setOrigin(0.5);

    this.add
      .text(cx, 400, `Ты обогнал ${pct}% игроков`, {
        fontFamily: "system-ui, sans-serif",
        fontSize: "30px",
        color: hex(COLORS.player),
        fontStyle: "800",
      })
      .setOrigin(0.5);

    this.coinsText = this.add
      .text(cx, 460, `★ +${this.result.coins} монет`, {
        fontFamily: "system-ui, sans-serif",
        fontSize: "28px",
        color: hex(COLORS.coin),
        fontStyle: "700",
      })
      .setOrigin(0.5);

    // Double coins (rewarded). Only useful when coins were earned.
    if (this.result.coins > 0) {
      this.doubleBtn = makeButton(
        this,
        cx,
        545,
        "▶ x2 монеты",
        () => this.doubleCoins(),
        { width: 260, height: 72, fill: 0x2a8c5a }
      );
    }

    // Primary actions.
    makeButton(this, cx, GAME.HEIGHT - 320, "ЕЩЁ РАЗ", () => this.scene.start("Game"), {
      width: 320,
      height: 96,
      fontSize: 38,
    });

    makeButton(this, cx - 95, GAME.HEIGHT - 210, "Поделиться", () => this.share(pct), {
      width: 170,
      height: 78,
      fill: COLORS.accent,
      fontSize: 24,
    });
    makeButton(this, cx + 95, GAME.HEIGHT - 210, "Вызов другу", () => this.challenge(pct), {
      width: 170,
      height: 78,
      fill: 0xff5cc8,
      fontSize: 24,
    });

    makeButton(this, cx, GAME.HEIGHT - 110, "В меню", () => this.scene.start("MainMenu"), {
      width: 200,
      height: 70,
      fill: 0x2a2a55,
      fontSize: 26,
    });

    // Interstitial between runs (rate-limited; skipped if ads removed).
    void Ads.maybeShowInterstitial(this.result.runCount);
  }

  private doubleBtn?: Phaser.GameObjects.Container;

  private async doubleCoins(): Promise<void> {
    if (this.coinsDoubled) return;
    const ok = await Ads.showRewarded();
    if (!ok) return;
    Analytics.rewardedWatched("double_coins");
    Economy.addCoins(this.result.coins); // grant the same amount again
    this.coinsDoubled = true;
    this.coinsText.setText(`★ +${this.result.coins * 2} монет`);
    this.doubleBtn?.destroy();
  }

  private async share(pct: number): Promise<void> {
    Analytics.shared(this.result.distance);
    await shareResult(
      { distance: this.result.distance, best: Economy.getBest(), percentBeaten: pct, coins: this.result.coins },
      this.challengeUrl()
    );
  }

  private async challenge(pct: number): Promise<void> {
    // Same share card; the link carries the player's ghost so a friend can race
    // the exact run. Deep-link handling on launch is wired in a later phase.
    Analytics.track("challenge_created", { distance: this.result.distance });
    await shareResult(
      { distance: this.result.distance, best: Economy.getBest(), percentBeaten: pct, coins: this.result.coins },
      this.challengeUrl()
    );
  }

  private challengeUrl(): string {
    const ghost = GhostStore.load();
    if (!ghost) return "https://ghostrun.game";
    return `https://ghostrun.game/?c=${GhostStore.encode(ghost)}`;
  }
}
