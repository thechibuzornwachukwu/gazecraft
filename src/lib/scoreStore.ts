// A guest's points, kept in this browser by the account's own rule (supabase player_points): the best score on each
// puzzle or clue, added up. Most players are under 13 and play as guests, so this is what opens their pets and rank.
// Signed in, the account's checked points are the truth and this is not read.

import { storage } from './storage';

const KEY = 'gazecraft-scores';

/** Best score per play key (a clue id, or a whole puzzle's id). */
export function loadScores(): Record<string, number> {
  const v = storage.getJSON<unknown>(KEY);
  if (!v || typeof v !== 'object' || Array.isArray(v)) return {};
  const out: Record<string, number> = {};
  for (const [id, n] of Object.entries(v)) {
    if (typeof n === 'number' && Number.isFinite(n) && n > 0) out[id] = Math.floor(n);
  }
  return out;
}

/** Keep the better of the old and the new score. Returns true when it went up. */
export function recordScore(id: string, score: number): boolean {
  if (!Number.isFinite(score) || score <= 0) return false;
  const cur = loadScores();
  if ((cur[id] ?? 0) >= score) return false;
  storage.setJSON(KEY, { ...cur, [id]: Math.floor(score) });
  return true;
}

/** Every best score added up: the guest's points. */
export const localPoints = (): number => Object.values(loadScores()).reduce((a, b) => a + b, 0);
