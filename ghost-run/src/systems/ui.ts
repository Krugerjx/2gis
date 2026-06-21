// Small UI helpers shared across scenes: pill buttons and color utilities.

import Phaser from "phaser";

export function hex(color: number): string {
  return "#" + color.toString(16).padStart(6, "0");
}

export interface ButtonOpts {
  width?: number;
  height?: number;
  fill?: number;
  textColor?: string;
  fontSize?: number;
  fontStyle?: string;
}

/**
 * Create a rounded "pill" button with a press animation. Returns the container
 * so callers can position/disable it.
 */
export function makeButton(
  scene: Phaser.Scene,
  x: number,
  y: number,
  label: string,
  onClick: () => void,
  opts: ButtonOpts = {}
): Phaser.GameObjects.Container {
  const w = opts.width ?? 280;
  const h = opts.height ?? 86;
  const fill = opts.fill ?? 0x7a5cff;

  const g = scene.add.graphics();
  g.fillStyle(fill, 1);
  g.fillRoundedRect(-w / 2, -h / 2, w, h, h / 2);
  g.fillStyle(0xffffff, 0.12);
  g.fillRoundedRect(-w / 2, -h / 2, w, h / 2, h / 2);

  const txt = scene.add
    .text(0, 0, label, {
      fontFamily: "system-ui, sans-serif",
      fontSize: `${opts.fontSize ?? 32}px`,
      color: opts.textColor ?? "#ffffff",
      fontStyle: opts.fontStyle ?? "800",
    })
    .setOrigin(0.5);

  const container = scene.add.container(x, y, [g, txt]);
  container.setSize(w, h);
  container.setInteractive(new Phaser.Geom.Rectangle(-w / 2, -h / 2, w, h), Phaser.Geom.Rectangle.Contains);

  container.on("pointerdown", () => scene.tweens.add({ targets: container, scale: 0.94, duration: 70 }));
  const release = () => scene.tweens.add({ targets: container, scale: 1, duration: 90, ease: "Back.out" });
  container.on("pointerup", () => {
    release();
    onClick();
  });
  container.on("pointerout", release);

  return container;
}
