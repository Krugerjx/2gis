# 👻 Ghost Run

A one-thumb 2D lane-runner with a twist: every run is recorded as a **ghost**,
and a rival ghost races alongside you. Beat it, then share an auto-generated
"you beat N% of players" card straight to TikTok/Reels/Shorts. Built to publish
on **Google Play** and the **App Store**.

## Why it's built to grow

- **Built-in viral loop** — each run produces a ready-to-share branded result
  card and a "challenge a friend" link carrying your exact ghost.
- **Async competition, zero servers** — ghosts are recorded locally, so there's
  no backend cost while you scale.
- **Hybrid monetization** — opt-in rewarded ads (revive, x2 coins) + IAP
  (remove ads, coin packs, cosmetics). No pay-to-win.

## Quick start

```bash
npm install
npm run dev      # play at http://localhost:5173
```

Controls: tap the left/right side of the screen (or swipe, or arrow keys) to
switch lanes. Dodge the red blocks, grab the coins, outrun the ghost.

## Build for stores

```bash
npm run build
npx cap add android   # once
npx cap add ios       # once (needs macOS + Xcode)
npm run cap:android   # build + open Android Studio
npm run cap:ios       # build + open Xcode
```

See `CLAUDE.md` for architecture and the pre-launch wiring checklist
(AppLovin ads, store billing, analytics).

## Status

Playable vertical slice: core loop, ghost record/replay, coins & skins, daily
streak, share card, and full ad/IAP scaffolding (simulated on web, ready to wire
to native SDKs). Art is procedural with optional Higgsfield-generated assets.
