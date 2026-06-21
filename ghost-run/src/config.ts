// Central game configuration. Tweak balance here.

export const GAME = {
  // Virtual resolution. The game scales to fit any device while keeping a
  // fixed portrait play field, so layout math stays simple.
  WIDTH: 540,
  HEIGHT: 960,

  LANES: 3,
  LANE_MARGIN: 90, // horizontal padding from screen edges to outer lanes

  PLAYER_Y: 720, // fixed vertical position of the player (world scrolls past)
  PLAYER_SIZE: 84,

  // Vertical scroll speed (px/sec) and how it ramps up over a run.
  START_SPEED: 360,
  MAX_SPEED: 900,
  SPEED_RAMP: 14, // speed gained per second alive

  LANE_SWITCH_MS: 90, // tween time when changing lane (snappy, fair)

  // Spawning (distance-based, in world px between spawns).
  OBSTACLE_GAP_START: 520,
  OBSTACLE_GAP_MIN: 300,
  COIN_GAP: 240,

  COIN_VALUE: 1,
  REVIVE_GRACE_MS: 1200, // brief invulnerability after a revive
};

export const COLORS = {
  bg: 0x0a0a1a,
  bgAccent: 0x161636,
  laneRail: 0x2a2a55,
  player: 0x46e8d8,
  playerGlow: 0x7a5cff,
  ghost: 0xff5cc8,
  coin: 0xffd23f,
  obstacle: 0xff4d6d,
  obstacleEdge: 0xffa3b1,
  text: 0xffffff,
  textDim: 0x9aa0c0,
  accent: 0x7a5cff,
} as const;

export const STORAGE_KEYS = {
  bestDistance: "gr_best_distance",
  totalCoins: "gr_total_coins",
  ownedSkins: "gr_owned_skins",
  equippedSkin: "gr_equipped_skin",
  ghost: "gr_ghost",
  streakDay: "gr_streak_day",
  streakCount: "gr_streak_count",
  removeAds: "gr_remove_ads",
  runsPlayed: "gr_runs_played",
} as const;
