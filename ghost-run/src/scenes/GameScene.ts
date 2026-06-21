// Core gameplay: 3-lane dodge runner. The world scrolls past a fixed player,
// obstacles must be avoided by switching lanes, coins are collected, and a
// recorded "ghost" races alongside. On death the player may watch a rewarded
// ad to revive once.

import Phaser from "phaser";
import { GAME, COLORS } from "../config";
import { laneX, drawBackground } from "../systems/background";
import { Player } from "../objects/Player";
import { Ghost } from "../objects/Ghost";
import { Economy } from "../systems/Economy";
import { GhostRecorder, GhostPlayer, GhostStore, GhostData } from "../systems/GhostRecorder";
import { Ads } from "../systems/Ads";
import { Analytics } from "../systems/Analytics";
import { hex, makeButton } from "../systems/ui";

interface Entity {
  img: Phaser.GameObjects.Image;
  lane: number;
  kind: "obstacle" | "coin";
  collected?: boolean;
}

export class GameScene extends Phaser.Scene {
  private player!: Player;
  private ghost: Ghost | null = null;
  private bgTile: Phaser.GameObjects.TileSprite | null = null;

  private lane = 1;
  private speed = GAME.START_SPEED;
  private runTime = 0; // ms since run start
  private traveled = 0; // world px scrolled
  private runCoins = 0;
  private alive = false;
  private revived = false;
  private graceUntil = 0;

  private entities: Entity[] = [];
  private nextObstacleAt = 0; // traveled px threshold
  private nextCoinAt = 0;

  private recorder = new GhostRecorder();

  private hudDistance!: Phaser.GameObjects.Text;
  private hudCoins!: Phaser.GameObjects.Text;

  constructor() {
    super("Game");
  }

  create(): void {
    this.resetState();
    this.bgTile = drawBackground(this);

    this.player = new Player(this, laneX, Economy.getEquippedSkin());
    this.setupGhost();
    this.setupHud();
    this.setupInput();

    Analytics.runStart();

    // Short countdown so the player can orient before the world moves.
    this.startCountdown();
  }

  private resetState(): void {
    this.lane = 1;
    this.speed = GAME.START_SPEED;
    this.runTime = 0;
    this.traveled = 0;
    this.runCoins = 0;
    this.alive = false;
    this.revived = false;
    this.graceUntil = 0;
    this.entities = [];
    this.nextObstacleAt = GAME.OBSTACLE_GAP_START;
    this.nextCoinAt = GAME.COIN_GAP * 2;
    this.recorder.reset();
  }

  private setupGhost(): void {
    const stored = GhostStore.load();
    const data: GhostData = stored ?? this.makeBotGhost();
    this.ghost = new Ghost(this, new GhostPlayer(data));
  }

  /** A simple synthetic ghost so first-time players still have a rival. */
  private makeBotGhost(): GhostData {
    const samples = [];
    let x = laneX(1);
    for (let t = 0; t <= 9000; t += 200) {
      if (Math.random() < 0.18) x = laneX(Phaser.Math.Between(0, GAME.LANES - 1));
      samples.push({ t, x });
    }
    return { version: 1, distance: 480, skin: "rose", samples };
  }

  private setupHud(): void {
    this.hudDistance = this.add
      .text(GAME.WIDTH / 2, 70, "0", {
        fontFamily: "system-ui, sans-serif",
        fontSize: "64px",
        color: hex(COLORS.text),
        fontStyle: "900",
      })
      .setOrigin(0.5)
      .setDepth(50);
    this.add
      .text(GAME.WIDTH / 2, 118, "МЕТРОВ", {
        fontFamily: "system-ui, sans-serif",
        fontSize: "20px",
        color: hex(COLORS.textDim),
        fontStyle: "700",
      })
      .setOrigin(0.5)
      .setDepth(50);

    this.hudCoins = this.add
      .text(GAME.WIDTH - 24, 40, "★ 0", {
        fontFamily: "system-ui, sans-serif",
        fontSize: "30px",
        color: hex(COLORS.coin),
        fontStyle: "800",
      })
      .setOrigin(1, 0.5)
      .setDepth(50);
  }

  private setupInput(): void {
    this.input.on("pointerdown", (p: Phaser.Input.Pointer) => {
      if (!this.alive) return;
      if (p.x < this.scale.width / 2) this.move(-1);
      else this.move(1);
    });

    // Swipe support.
    let startX = 0;
    this.input.on("pointerup", (p: Phaser.Input.Pointer) => {
      const dx = p.x - startX;
      if (Math.abs(dx) > 40) this.move(dx > 0 ? 1 : -1);
    });
    this.input.on("pointermove", (p: Phaser.Input.Pointer) => {
      if (p.isDown && p.getDuration() < 30) startX = p.x;
    });

    // Keyboard for desktop debugging.
    this.input.keyboard?.on("keydown-LEFT", () => this.move(-1));
    this.input.keyboard?.on("keydown-RIGHT", () => this.move(1));
  }

  private move(dir: number): void {
    if (!this.alive) return;
    const next = Phaser.Math.Clamp(this.lane + dir, 0, GAME.LANES - 1);
    if (next === this.lane) return;
    this.lane = next;
    this.player.moveToLaneX(laneX(this.lane));
  }

  private startCountdown(): void {
    const cd = this.add
      .text(GAME.WIDTH / 2, GAME.HEIGHT / 2, "3", {
        fontFamily: "system-ui, sans-serif",
        fontSize: "160px",
        color: hex(COLORS.text),
        fontStyle: "900",
      })
      .setOrigin(0.5)
      .setDepth(60);
    let n = 3;
    this.time.addEvent({
      delay: 600,
      repeat: 3,
      callback: () => {
        n -= 1;
        if (n <= 0) {
          cd.destroy();
          this.alive = true;
          this.graceUntil = this.runTime + 300;
        } else {
          cd.setText(String(n));
          this.tweens.add({ targets: cd, scale: { from: 1.4, to: 1 }, duration: 300 });
        }
      },
    });
  }

  update(_time: number, deltaMs: number): void {
    if (!this.alive) return;
    const dt = deltaMs / 1000;
    this.runTime += deltaMs;

    // Ramp speed.
    this.speed = Math.min(GAME.MAX_SPEED, this.speed + GAME.SPEED_RAMP * dt);
    const move = this.speed * dt;
    this.traveled += move;

    // Scroll backdrop.
    if (this.bgTile) this.bgTile.tilePositionY -= move;

    this.spawn();
    this.updateEntities(move);
    this.updateGhost();
    this.recorder.sample(this.runTime, this.player.x);

    const meters = Math.floor(this.traveled / 12);
    this.hudDistance.setText(String(meters));
  }

  private spawn(): void {
    if (this.traveled >= this.nextObstacleAt) {
      // Leave at least one lane open. Block 1 or 2 lanes.
      const lanes = [0, 1, 2];
      Phaser.Utils.Array.Shuffle(lanes);
      const blockCount = Math.random() < 0.35 ? 2 : 1;
      for (let i = 0; i < blockCount; i++) this.spawnObstacle(lanes[i]);

      const gap = Math.max(
        GAME.OBSTACLE_GAP_MIN,
        GAME.OBSTACLE_GAP_START - this.traveled / 60
      );
      this.nextObstacleAt = this.traveled + gap;
    }

    if (this.traveled >= this.nextCoinAt) {
      const lane = Phaser.Math.Between(0, GAME.LANES - 1);
      const count = Phaser.Math.Between(3, 5);
      for (let i = 0; i < count; i++) this.spawnCoin(lane, -i * 70);
      this.nextCoinAt = this.traveled + GAME.COIN_GAP;
    }
  }

  private spawnObstacle(lane: number): void {
    const img = this.add.image(laneX(lane), -80, "block");
    img.setDisplaySize(GAME.PLAYER_SIZE + 24, GAME.PLAYER_SIZE + 24);
    img.setTint(COLORS.obstacle);
    img.setDepth(5);
    this.entities.push({ img, lane, kind: "obstacle" });
  }

  private spawnCoin(lane: number, offsetY: number): void {
    const img = this.add.image(laneX(lane), -40 + offsetY, "coin");
    img.setDisplaySize(46, 46);
    img.setDepth(5);
    this.tweens.add({ targets: img, scale: { from: img.scale * 0.85, to: img.scale }, yoyo: true, repeat: -1, duration: 400 });
    this.entities.push({ img, lane, kind: "coin" });
  }

  private updateEntities(move: number): void {
    const grace = this.runTime < this.graceUntil;
    for (let i = this.entities.length - 1; i >= 0; i--) {
      const e = this.entities[i];
      e.img.y += move;

      // Off screen -> recycle.
      if (e.img.y > GAME.HEIGHT + 80) {
        e.img.destroy();
        this.entities.splice(i, 1);
        continue;
      }

      const dy = Math.abs(e.img.y - GAME.PLAYER_Y);
      if (e.lane === this.lane && dy < GAME.PLAYER_SIZE * 0.7) {
        if (e.kind === "coin" && !e.collected) {
          e.collected = true;
          this.collectCoin(e);
          this.entities.splice(i, 1);
        } else if (e.kind === "obstacle" && !grace) {
          this.die();
          return;
        }
      }
    }
  }

  private collectCoin(e: Entity): void {
    this.runCoins += GAME.COIN_VALUE;
    this.hudCoins.setText(`★ ${this.runCoins}`);
    // Pop effect.
    this.tweens.add({ targets: e.img, y: e.img.y - 30, alpha: 0, scale: 0, duration: 220, onComplete: () => e.img.destroy() });
  }

  private updateGhost(): void {
    this.ghost?.update(this.runTime);
  }

  private die(): void {
    this.alive = false;
    this.player.hitFlash();
    this.cameras.main.shake(220, 0.012);

    if (!this.revived) {
      this.showRevivePrompt();
    } else {
      this.finishRun();
    }
  }

  private showRevivePrompt(): void {
    if (Ads.adsRemoved()) {
      // Without ads, just offer a plain continue-or-end choice for parity.
    }
    const overlay = this.add.container(0, 0).setDepth(80);
    const dim = this.add.graphics();
    dim.fillStyle(0x05050f, 0.78);
    dim.fillRect(0, 0, GAME.WIDTH, GAME.HEIGHT);
    overlay.add(dim);

    overlay.add(
      this.add
        .text(GAME.WIDTH / 2, GAME.HEIGHT / 2 - 160, "Продолжить забег?", {
          fontFamily: "system-ui, sans-serif",
          fontSize: "40px",
          color: hex(COLORS.text),
          fontStyle: "800",
        })
        .setOrigin(0.5)
    );

    let timeLeft = 5;
    const timerTxt = this.add
      .text(GAME.WIDTH / 2, GAME.HEIGHT / 2 - 90, `${timeLeft}`, {
        fontFamily: "system-ui, sans-serif",
        fontSize: "30px",
        color: hex(COLORS.textDim),
        fontStyle: "700",
      })
      .setOrigin(0.5);
    overlay.add(timerTxt);

    const watch = makeButton(
      this,
      GAME.WIDTH / 2,
      GAME.HEIGHT / 2,
      "▶ Смотреть рекламу",
      async () => {
        countdown.remove();
        overlay.destroy();
        const ok = await Ads.showRewarded();
        if (ok) {
          Analytics.rewardedWatched("revive");
          this.revive();
        } else {
          this.finishRun();
        }
      },
      { width: 360, height: 92, fill: COLORS.accent }
    );
    overlay.add(watch);

    const giveUp = makeButton(
      this,
      GAME.WIDTH / 2,
      GAME.HEIGHT / 2 + 120,
      "Завершить",
      () => {
        countdown.remove();
        overlay.destroy();
        this.finishRun();
      },
      { width: 240, height: 72, fill: 0x2a2a55 }
    );
    overlay.add(giveUp);

    const countdown = this.time.addEvent({
      delay: 1000,
      repeat: 4,
      callback: () => {
        timeLeft -= 1;
        timerTxt.setText(String(timeLeft));
        if (timeLeft <= 0) {
          overlay.destroy();
          this.finishRun();
        }
      },
    });
  }

  private revive(): void {
    this.revived = true;
    // Clear nearby obstacles so the player doesn't instantly die again.
    for (let i = this.entities.length - 1; i >= 0; i--) {
      const e = this.entities[i];
      if (e.kind === "obstacle" && e.img.y > GAME.PLAYER_Y - 400) {
        e.img.destroy();
        this.entities.splice(i, 1);
      }
    }
    this.lane = 1;
    this.player.moveToLaneX(laneX(1));
    this.graceUntil = this.runTime + GAME.REVIVE_GRACE_MS;
    this.alive = true;
  }

  private finishRun(): void {
    const distance = Math.floor(this.traveled / 12);

    Economy.addCoins(this.runCoins);
    const isBest = Economy.recordDistance(distance);
    const runCount = Economy.incrementRuns();
    Analytics.runEnd(distance, this.runCoins);

    // Save this run as the ghost if it beats the stored one (race your best).
    const stored = GhostStore.load();
    if (!stored || distance > stored.distance) {
      GhostStore.save(this.recorder.build(distance, Economy.getEquippedSkin()));
    }

    this.player.destroy();
    this.ghost?.destroy();

    this.scene.start("Result", {
      distance,
      coins: this.runCoins,
      isBest,
      runCount,
    });
  }
}
