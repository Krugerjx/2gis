// The opponent "ghost": a semi-transparent replay of a previous run. Visual
// only — it never collides, it's there for the race-against feeling and to
// produce the shareable "you vs them" moment.

import Phaser from "phaser";
import { GAME, COLORS } from "../config";
import { GhostPlayer } from "../systems/GhostRecorder";
import { findSkin } from "../data/skins";

export class Ghost {
  public sprite: Phaser.GameObjects.Image;
  private player: GhostPlayer;
  public finished = false;

  constructor(scene: Phaser.Scene, data: GhostPlayer) {
    this.player = data;
    const tex = scene.textures.exists("blip_art") ? "blip_art" : "orb";
    this.sprite = scene.add.image(GAME.WIDTH / 2, GAME.PLAYER_Y, tex);
    this.sprite.setDisplaySize(GAME.PLAYER_SIZE, GAME.PLAYER_SIZE);
    this.sprite.setAlpha(0.45);
    this.sprite.setTint(tex === "orb" ? findSkin(data.skin).color : COLORS.ghost);
    this.sprite.setDepth(8);
  }

  /** Update ghost x from the recording at the given run time (ms). */
  update(timeMs: number): void {
    const x = this.player.xAt(timeMs);
    if (x === null) {
      if (!this.finished) {
        this.finished = true;
        this.sprite.setVisible(false);
      }
      return;
    }
    this.sprite.x = x;
  }

  destroy(): void {
    this.sprite.destroy();
  }
}
