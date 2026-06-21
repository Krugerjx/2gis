// Analytics abstraction. No-op stub for now; wire GameAnalytics or Firebase
// here before launch. Centralizing events means the rest of the game only ever
// calls Analytics.track(...).

const DEBUG = true;

export const Analytics = {
  track(event: string, params: Record<string, unknown> = {}): void {
    if (DEBUG) console.log(`[analytics] ${event}`, params);
    // TODO(launch): forward to GameAnalytics / Firebase Analytics.
  },

  // Key funnel events to instrument before UA spend:
  runStart(): void {
    this.track("run_start");
  },
  runEnd(distance: number, coins: number): void {
    this.track("run_end", { distance, coins });
  },
  rewardedWatched(placement: string): void {
    this.track("rewarded_watched", { placement });
  },
  purchase(productId: string): void {
    this.track("iap_purchase", { productId });
  },
  shared(distance: number): void {
    this.track("share", { distance });
  },
};
