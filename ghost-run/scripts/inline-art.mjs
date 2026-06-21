// Post-build: inject the game art as base64 data URIs into the single-file
// HTML so it plays with no external files. Reads PNGs from public/assets and
// writes window.GR_EMBEDDED_ART into <head> before the game script runs.

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const htmlPath = resolve(root, "dist-single/index.html");

if (!existsSync(htmlPath)) {
  console.error("dist-single/index.html not found — run the single build first.");
  process.exit(1);
}

const art = {
  blip: "public/assets/blip.png",
  bg: "public/assets/bg.png",
};

const entries = {};
for (const [key, rel] of Object.entries(art)) {
  const p = resolve(root, rel);
  if (existsSync(p)) {
    const b64 = readFileSync(p).toString("base64");
    entries[key] = `data:image/png;base64,${b64}`;
  } else {
    console.warn(`art missing: ${rel} (game will use procedural fallback)`);
  }
}

let html = readFileSync(htmlPath, "utf8");
const script = `<script>window.GR_EMBEDDED_ART=${JSON.stringify(entries)};</script>`;
html = html.replace("</head>", `${script}\n</head>`);

const outPath = resolve(root, "dist-single/ghost-run-play.html");
writeFileSync(outPath, html);
console.log(`Wrote ${outPath} (${(html.length / 1024 / 1024).toFixed(2)} MB)`);
