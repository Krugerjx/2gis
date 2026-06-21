# Publishing Ghost Run to App Store Connect / TestFlight

This guide covers getting the game onto your iPhone via **TestFlight** so you can
test it. iOS apps can only be built on **macOS**, so there are two routes:
**A) you have a Mac**, or **B) no Mac — build in the cloud (Codemagic)**.

> ⚠️ Important: in this prototype, **ads and in‑app purchases are simulated
> stubs**. That's fine for TestFlight gameplay testing. Before a **public**
> App Store release you must wire real AppLovin MAX (ads) and StoreKit (IAP),
> or Apple will reject non‑functional purchase buttons. See `CLAUDE.md` →
> "Before launch".

---

## What you must provide (both routes)

1. **Apple Developer Program membership** ($99/year) — https://developer.apple.com/programs/
2. A **unique bundle ID**. The project uses `com.ghostrun.game`. If that's taken,
   change `appId` in `capacitor.config.ts` and everywhere it appears.
3. An **app record** in App Store Connect (App Store Connect → Apps → +):
   - Platform: iOS, Name: "Ghost Run", Bundle ID: the one above, SKU: anything.
4. (Route B only) An **App Store Connect API key**
   (App Store Connect → Users and Access → Integrations → App Store Connect API):
   download the `.p8`, and note the **Issuer ID** and **Key ID**.

---

## Route A — You have a Mac

```bash
cd ghost-run
npm install
npm run build                 # web bundle
npx cap add ios               # creates ios/App.xcworkspace (first time only)
npx @capacitor/assets generate --ios \
  --iconBackgroundColor '#0a0a1a' --splashBackgroundColor '#0a0a1a'
npx cap sync ios
npx cap open ios              # opens Xcode
```

In Xcode:
1. Select the **App** target → **Signing & Capabilities** → check
   *Automatically manage signing* → pick your **Team**.
2. Set **Version** (e.g. 1.0.0) and **Build** (e.g. 1).
3. Choose **Any iOS Device (arm64)** as the run destination.
4. **Product → Archive**.
5. When the Organizer opens: **Distribute App → App Store Connect → Upload**.
6. Wait for processing (5–15 min), then in App Store Connect → your app →
   **TestFlight**, add yourself as an internal tester and install via the
   TestFlight app on your iPhone.

---

## Route B — No Mac (cloud build via Codemagic)

The repo includes `codemagic.yaml`. Codemagic gives you free macOS build minutes.

1. Sign up at https://codemagic.io and connect this GitHub repo.
2. **Add the App Store Connect API key**: Codemagic → Teams/App settings →
   *Integrations* → **App Store Connect** → upload your `.p8`, Issuer ID, Key ID.
   Name the integration **`GhostRunASC`** (matches `codemagic.yaml`).
3. In `codemagic.yaml`, replace `APP_STORE_APPLE_ID` with your app's numeric
   Apple ID (App Store Connect → your app → App Information → "Apple ID").
4. Start the **`ios-testflight`** workflow. It will: install deps, build the web
   bundle, scaffold the iOS project, generate icons, sign, build the `.ipa`, and
   upload it to **TestFlight** automatically.
5. Install on your iPhone via the **TestFlight** app once processing finishes.

Codemagic handles signing for you through the API key integration, so no Mac and
no manual certificates are required.

---

## App Store listing assets (for later, public release)

- **App icon**: `assets/icon.png` (1024×1024, no alpha) — already included.
- **Screenshots**: capture from a 6.7" iPhone simulator/device.
- **Privacy**: the game stores data only on‑device and (once wired) shows ads —
  fill the Privacy questionnaire accordingly (ad SDKs collect device identifiers).

## Troubleshooting

- *Bundle ID already in use* → change `appId` in `capacitor.config.ts`.
- *Missing compliance / encryption* → in App Store Connect set
  "Uses non‑exempt encryption" to **No** (the game uses none).
- *Build not appearing in TestFlight* → it's still processing; wait, then check
  the app's TestFlight tab.
