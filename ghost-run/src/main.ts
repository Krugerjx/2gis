import Phaser from "phaser";
import { GAME, COLORS } from "./config";
import { BootScene } from "./scenes/BootScene";
import { MainMenuScene } from "./scenes/MainMenuScene";
import { GameScene } from "./scenes/GameScene";
import { ResultScene } from "./scenes/ResultScene";
import { ShopScene } from "./scenes/ShopScene";

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: "game",
  backgroundColor: COLORS.bg,
  // Fixed portrait play field, scaled to fit any device while preserving aspect.
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: GAME.WIDTH,
    height: GAME.HEIGHT,
  },
  render: {
    antialias: true,
    roundPixels: false,
  },
  scene: [BootScene, MainMenuScene, GameScene, ResultScene, ShopScene],
};

new Phaser.Game(config);
