// Ghost recording & playback — the core viral/competitive mechanic.
//
// A run is recorded as a compact series of samples (time + lane position).
// We only store the player's horizontal position over time, sampled at a fixed
// interval, which keeps a full run to a few KB. The recording is serialized to
// JSON so it can be saved locally today and traded between players later
// (challenge-a-friend) without any code change.

import { Storage } from "./Storage";
import { STORAGE_KEYS } from "../config";

export interface GhostSample {
  t: number; // ms since run start
  x: number; // world x position
}

export interface GhostData {
  version: 1;
  distance: number; // how far this ghost travelled (world px)
  skin: string;
  samples: GhostSample[];
}

const SAMPLE_INTERVAL_MS = 50; // 20 fps recording is plenty for a smooth ghost

export class GhostRecorder {
  private samples: GhostSample[] = [];
  private lastSampleAt = -SAMPLE_INTERVAL_MS;

  reset(): void {
    this.samples = [];
    this.lastSampleAt = -SAMPLE_INTERVAL_MS;
  }

  /** Record the player's x position at the given run time (ms). */
  sample(timeMs: number, x: number): void {
    if (timeMs - this.lastSampleAt >= SAMPLE_INTERVAL_MS) {
      this.samples.push({ t: Math.round(timeMs), x: Math.round(x) });
      this.lastSampleAt = timeMs;
    }
  }

  build(distance: number, skin: string): GhostData {
    return { version: 1, distance: Math.floor(distance), skin, samples: this.samples };
  }
}

/** Replays a recorded ghost, returning the interpolated x at a given time. */
export class GhostPlayer {
  private data: GhostData;
  private idx = 0;

  constructor(data: GhostData) {
    this.data = data;
  }

  get skin(): string {
    return this.data.skin;
  }

  get distance(): number {
    return this.data.distance;
  }

  /** Total duration of the recording in ms. */
  get durationMs(): number {
    const s = this.data.samples;
    return s.length ? s[s.length - 1].t : 0;
  }

  /** Interpolated x at run time (ms). Returns null once the ghost has finished. */
  xAt(timeMs: number): number | null {
    const s = this.data.samples;
    if (s.length === 0) return null;
    if (timeMs >= s[s.length - 1].t) return null;

    // Advance the cursor forward (runs are monotonic in time).
    while (this.idx < s.length - 1 && s[this.idx + 1].t <= timeMs) this.idx++;
    while (this.idx > 0 && s[this.idx].t > timeMs) this.idx--;

    const a = s[this.idx];
    const b = s[Math.min(this.idx + 1, s.length - 1)];
    if (b.t === a.t) return a.x;
    const f = (timeMs - a.t) / (b.t - a.t);
    return a.x + (b.x - a.x) * f;
  }
}

export const GhostStore = {
  save(data: GhostData): void {
    Storage.set(STORAGE_KEYS.ghost, data);
  },

  /** Load the locally stored ghost, or null if none exists yet. */
  load(): GhostData | null {
    const data = Storage.getJSON<GhostData | null>(STORAGE_KEYS.ghost, null);
    if (data && data.version === 1 && Array.isArray(data.samples)) return data;
    return null;
  },

  /** Encode a ghost into a shareable challenge string (base64 JSON). */
  encode(data: GhostData): string {
    return btoa(unescape(encodeURIComponent(JSON.stringify(data))));
  },

  decode(code: string): GhostData | null {
    try {
      const data = JSON.parse(decodeURIComponent(escape(atob(code)))) as GhostData;
      return data.version === 1 ? data : null;
    } catch {
      return null;
    }
  },
};
