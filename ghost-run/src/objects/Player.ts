// The player creature ("Blip"). Rendered from a procedurally generated glowing
// orb texture tinted by the equipped skin, with a particle trail. If a
// Higgsfield art texture named "blip_art" is present it is used instead.

import Phaser from "phaser";
import { GAME } from "../config";
import { findSkin } from "../data/skins";

export class Player {
  public sprite: Phaser.GameObjects.Image;
  private trail: Phaser.GameObjects.Particles.ParticleEmitter;
  private scene: Phaser.Scene;
  public lane: number;
  private squashTween?: Phaser.Tweens.Tween;

  constructor(scene: Phaser.Scene, laneX: (lane: number) => number, skinId: string) {
    this.scene = scene;
    this.lane = 1;
    const skin = findSkin(skinId);

    const tex = scene.textures.exists("blip_art") ? "blip_art" : "orb";
    this.sprite = scene.add.image(laneX(1), GAME.PLAYER_Y, tex);
    this.sprite.setDisplaySize(GAME.PLAYER_SIZE, GAME.PLAYER_SIZE);
    if (tex === "orb") this.sprite.setTint(skin.color);
    this.sprite.setDepth(10);

    this.trail = scene.add.particles(0, 0, "spark", {
      follow: this.sprite,
      followOffset: { x: 0, y: 14 },
      speed: { min: 10, max: 40 },
      angle: { min: 80, max: 100 },
      scale: { start: 0.7, end: 0 },
      alpha: { start: 0.7, end: 0 },
      lifespan: 420,
      frequency: 24,
      tint: skin.trail,
      blendMode: Phaser.BlendModes.ADD,
    });
    this.trail.setDepth(9);

    // Idle bob.
    scene.tweens.add({
      targets: this.sprite,
      y: GAME.PLAYER_Y - 8,
      duration: 700,
      yoyo: true,
      repeat: -1,
      ease: "Sine.inOut",
    });
  }

  get x(): number {
    return this.sprite.x;
  }

  moveToLaneX(targetX: number): void {
    this.scene.tweens.add({ targets: this.sprite, x: targetX, duration: GAME.LANE_SWITCH_MS, ease: "Quad.out" });
    // Lean into the move for juice.
    this.squashTween?.stop();
    const dir = Math.sign(targetX - this.sprite.x);
    this.sprite.setAngle(dir * 12);
    this.squashTween = this.scene.tweens.add({ targets: this.sprite, angle: 0, duration: 180, ease: "Sine.out" });
  }

  hitFlash(): void {
    this.scene.tweens.add({ targets: this.sprite, alpha: 0.2, duration: 80, yoyo: true, repeat: 4 });
  }

  setSkin(skinId: string): void {
    const skin = findSkin(skinId);
    if (!this.scene.textures.exists("blip_art")) this.sprite.setTint(skin.color);
  }

  destroy(): void {
    this.trail.destroy();
    this.sprite.destroy();
  }
}
