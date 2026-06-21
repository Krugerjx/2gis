import type { CapacitorConfig } from "@capacitor/cli";

// Store identifiers. Change appId before publishing to your own domain.
const config: CapacitorConfig = {
  appId: "com.ghostrun.game",
  appName: "Ghost Run",
  webDir: "dist",
  backgroundColor: "#0a0a1a",
  android: {
    allowMixedContent: false,
  },
  ios: {
    contentInset: "always",
  },
};

export default config;
