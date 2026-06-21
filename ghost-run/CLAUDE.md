# GHOST RUN — developer guide (for Claude & humans)

A one-thumb 2D lane-runner with async "ghost" racing and built-in shareable
result cards. Built to ship on Google Play and the App Store.

## Stack

- **Phaser 3** (game engine) + **TypeScript** + **Vite** (web build)
- **Capacitor** wraps the web build into native iOS/Android apps
- Persistence: `localStorage` on web, `@capacitor/preferences` on native

## Commands

```bash
npm install        # install deps
npm run dev        # local dev server at http://localhost:5173
npm run build      # typecheck + production build to dist/
npm run preview    # serve the production build
npm run cap:sync   # build + sync into native projects
npm run cap:android / npm run cap:ios   # open native IDE
```

Always run `npm run build` before committing — it runs `tsc --noEmit` and will
catch type errors.

## Architecture

```
src/
  main.ts            Phaser game config + scene list
  config.ts          GAME constants, COLORS, STORAGE_KEYS
  data/skins.ts      Cosmetic skin catalog (visual only, fair)
  scenes/
    BootScene        Generates procedural neon textures, loads optional art, inits storage
    MainMenuScene    Title, best, coins, daily streak, Play/Shop
    GameScene        Core loop: lanes, obstacles, coins, ghost, revive
    ResultScene      Distance, % beaten, share/challenge, x2 coins, interstitial
    ShopScene        Skins (coins) + IAP store
  objects/
    Player           The "Blip" creature + trail
    Ghost            Semi-transparent replay rival
  systems/
    Storage          Sync cache over localStorage / Capacitor Preferences
    Economy          Coins, skins, best distance, daily streak
    GhostRecorder    Record/replay/serialize ghosts (challenge links)
    Ads              Rewarded + interstitial (web simulation; wire AppLovin on native)
    IAP              Store catalog + purchase flow (wire billing plugin on native)
    Share            Renders branded result card + native/web share
    Analytics        Event funnel stub (wire GameAnalytics/Firebase)
    background.ts     Shared neon backdrop + laneX()
    ui.ts            Pill buttons, color helpers
```

## Art

- Procedural neon textures are generated at boot, so the game runs with no art
  files. Optional Higgsfield art in `public/assets/` (`blip.png`, `bg.png`) is
  used automatically if present. The app icon source is `public/icons/icon.png`.
- The mascot "Blip" is an original design — do not substitute characters from
  other games.

## Monetization (where the money is)

- **Rewarded ads** (opt-in): revive once per run, x2 coins, free chests.
- **Interstitial**: at most once every 3 runs, never mid-gameplay.
- **IAP**: Remove Ads, coin packs, starter pack, premium skin.
- Skins never affect gameplay (store-compliant + fair).

### Before launch (native wiring TODOs)

1. `systems/Ads.ts` → integrate AppLovin MAX (rewarded + interstitial).
2. `systems/IAP.ts` → integrate Google Play Billing / StoreKit (or RevenueCat).
   Register identical product ids in both stores.
3. `systems/Analytics.ts` → forward events to GameAnalytics/Firebase.
4. Deep-link handling for challenge URLs (`?c=<ghost>`).
5. App icons / splash via `@capacitor/assets` using `public/icons/icon.png`.

## Conventions

- Keep gameplay fair: no pay-to-win.
- One concern per system module; scenes orchestrate, systems hold logic.
- Tune balance only in `config.ts`.
