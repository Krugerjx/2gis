import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

// Builds the whole game (JS + CSS) into a single self-contained HTML file in
// dist-single/. Art is injected afterwards as base64 by scripts/inline-art.mjs,
// producing one file that plays by double-click with no server or assets.
export default defineConfig({
  base: "./",
  plugins: [viteSingleFile()],
  build: {
    outDir: "dist-single",
    assetsInlineLimit: 100000000,
    cssCodeSplit: false,
    reportCompressedSize: false,
  },
});
