// Share system — the built-in viral engine.
//
// After a run we render a vertical "result card" to an offscreen canvas
// (player distance, % beaten, branding) and let the user share it natively.
// This turns every run into ready-made TikTok/Reels/Shorts content without the
// player needing to edit anything.
//
// Phase 1 ships a static share image (works everywhere, including web). A
// side-by-side "you vs ghost" video can replace the image later by recording
// the canvas with MediaRecorder.

import { Share as CapShare } from "@capacitor/share";
import { Capacitor } from "@capacitor/core";
import { Filesystem, Directory } from "@capacitor/filesystem";

export interface ShareCardData {
  distance: number;
  best: number;
  percentBeaten: number;
  coins: number;
}

/** Draw a branded vertical result card and return it as a data URL (PNG). */
export function renderShareCard(d: ShareCardData): string {
  const w = 540;
  const h = 960;
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d")!;

  // Background gradient.
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, "#12123a");
  g.addColorStop(1, "#05050f");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  // Glow blobs.
  drawGlow(ctx, w * 0.25, h * 0.2, 220, "rgba(122,92,255,0.35)");
  drawGlow(ctx, w * 0.8, h * 0.55, 260, "rgba(255,92,200,0.25)");

  ctx.textAlign = "center";

  ctx.fillStyle = "#7a5cff";
  ctx.font = "700 26px system-ui, sans-serif";
  ctx.fillText("GHOST RUN", w / 2, 120);

  ctx.fillStyle = "#ffffff";
  ctx.font = "800 150px system-ui, sans-serif";
  ctx.fillText(String(d.distance), w / 2, h / 2 - 40);

  ctx.fillStyle = "#9aa0c0";
  ctx.font = "600 30px system-ui, sans-serif";
  ctx.fillText("МЕТРОВ", w / 2, h / 2 + 10);

  // Highlight badge.
  ctx.fillStyle = "#46e8d8";
  ctx.font = "800 40px system-ui, sans-serif";
  ctx.fillText(`Обогнал ${d.percentBeaten}% игроков`, w / 2, h / 2 + 140);

  ctx.fillStyle = "#ffd23f";
  ctx.font = "700 30px system-ui, sans-serif";
  ctx.fillText(`★ ${d.coins} монет за забег`, w / 2, h / 2 + 200);

  ctx.fillStyle = "#9aa0c0";
  ctx.font = "600 26px system-ui, sans-serif";
  ctx.fillText("Сможешь обогнать мой призрак?", w / 2, h - 120);

  return c.toDataURL("image/png");
}

function drawGlow(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string): void {
  const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
  grad.addColorStop(0, color);
  grad.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = grad;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
}

/** Share the result card. Uses native share sheet on device, Web Share / download fallback on web. */
export async function shareResult(d: ShareCardData, challengeUrl: string): Promise<void> {
  const dataUrl = renderShareCard(d);
  const text = `Я пробежал ${d.distance}м в Ghost Run и обогнал ${d.percentBeaten}% игроков! Сможешь больше?`;

  if (Capacitor.isNativePlatform()) {
    try {
      const base64 = dataUrl.split(",")[1];
      const fileName = `ghostrun_${Date.now()}.png`;
      const saved = await Filesystem.writeFile({ path: fileName, data: base64, directory: Directory.Cache });
      await CapShare.share({ title: "Ghost Run", text: `${text}\n${challengeUrl}`, url: saved.uri, dialogTitle: "Поделиться результатом" });
      return;
    } catch (e) {
      // fall through to web path
      console.warn("native share failed", e);
    }
  }

  // Web: try the Web Share API with the image file, else download it.
  try {
    const blob = await (await fetch(dataUrl)).blob();
    const file = new File([blob], "ghostrun.png", { type: "image/png" });
    const navAny = navigator as Navigator & { canShare?: (data?: ShareData) => boolean };
    if (navAny.canShare && navAny.canShare({ files: [file] })) {
      await navigator.share({ files: [file], text: `${text} ${challengeUrl}` });
      return;
    }
  } catch {
    /* fall through */
  }

  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = "ghostrun.png";
  a.click();
}
