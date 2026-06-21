// Shared neon background: a vertical gradient with three lane rails and drifting
// particles. Uses the Higgsfield "bg_art" texture as a tiling backdrop if it was
// loaded, otherwise draws a procedural gradient.

import Phaser from "phaser";
import { GAME, COLORS } from "../config";

export function laneX(lane: number): number {
  const usable = GAME.WIDTH - GAME.LANE_MARGIN * 2;
  const step = usable / (GAME.LANES - 1);
  return GAME.LANE_MARGIN + step * lane;
}

export function drawBackground(scene: Phaser.Scene): Phaser.GameObjects.TileSprite | null {
  let tile: Phaser.GameObjects.TileSprite | null = null;

  if (scene.textures.exists("bg_art")) {
    tile = scene.add.tileSprite(GAME.WIDTH / 2, GAME.HEIGHT / 2, GAME.WIDTH, GAME.HEIGHT, "bg_art");
    const src = scene.textures.get("bg_art").getSourceImage();
    tile.tileScaleX = GAME.WIDTH / src.width;
    tile.tileScaleY = tile.tileScaleX;
    tile.setDepth(-10);
  } else {
    const g = scene.add.graphics();
    g.setDepth(-10);
    // Vertical gradient via stacked rects.
    const steps = 32;
    for (let i = 0; i < steps; i++) {
      const f = i / (steps - 1);
      const c = Phaser.Display.Color.Interpolate.ColorWithColor(
        Phaser.Display.Color.ValueToColor(COLORS.bgAccent),
        Phaser.Display.Color.ValueToColor(COLORS.bg),
        steps - 1,
        i
      );
      g.fillStyle(Phaser.Display.Color.GetColor(c.r, c.g, c.b), 1);
      g.fillRect(0, (GAME.HEIGHT / steps) * i, GAME.WIDTH, GAME.HEIGHT / steps + 1);
      void f;
    }
  }

  // Lane rails (always drawn on top of the backdrop).
  const rails = scene.add.graphics();
  rails.setDepth(-9);
  rails.lineStyle(3, COLORS.laneRail, 0.6);
  for (let lane = 0; lane < GAME.LANES; lane++) {
    const x = laneX(lane);
    rails.lineBetween(x, 0, x, GAME.HEIGHT);
  }

  return tile;
}
