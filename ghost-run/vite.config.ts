import { defineConfig } from "vite";

// Vite config for GHOST RUN.
// base: "./" makes asset paths relative, which is required when the build is
// packaged inside a Capacitor (Android/iOS) webview.
export default defineConfig({
  base: "./",
  server: {
    host: true,
    port: 5173,
  },
  build: {
    outDir: "dist",
    assetsInlineLimit: 0,
  },
});
