// What a guest is told under a result (SPEC section 6, Results). Play first stays: nothing here is a wall.
// A guest is asked at the moments something has been earned, with the fact that makes signing in worth it.

import type { PoolKey, Vars } from '../copy';
import { storage } from './storage';

/** A place is only said on a board with this many players, the guest included. Fewer, and it means nothing. */
export const PLACE_MIN_PLAYERS = 6;
/** The run is worth a word from here. */
export const RUN_ASK = 3;

const TOLD_KEY = 'gazecraft-run-told';

/** From this many days, the link under a guest's result asks to keep the run, not only the score (set 11a). */
export const KEEP_RUN = 2;

export type GuestFacts = {
  /** Today's daily, just finished or opened again. The place is only said then; the run is said after any win. */
  today: boolean;
  /** The guest's run of dailies. */
  streak: number;
  /** Whether the line about the run has been said in this browser. */
  runTold: boolean;
  /** Where the guest's score would stand today, when the server has answered. */
  place?: { place: number; players: number } | null;
};

/**
 * The one line for a guest at a win, or none for the plain ask. The run comes first, once, after any game: it is
 * the thing they would want to keep. After that, on today's daily, their place on today's board. Pure.
 */
export function guestAsk(f: GuestFacts): { pool: PoolKey; vars: Vars; run: boolean } | null {
  if (f.streak >= RUN_ASK && !f.runTold) return { pool: 'guestRun', vars: { n: f.streak }, run: true };
  if (!f.today) return null;
  const p = f.place;
  if (p && Number.isInteger(p.place) && Number.isInteger(p.players) && p.players >= PLACE_MIN_PLAYERS && p.place >= 1 && p.place <= p.players) {
    return { pool: 'guestPlace', vars: { n: p.place, m: p.players }, run: false };
  }
  return null;
}

/** What the sign in link under a guest's result says: the run once there is one to keep, otherwise the default. */
export const guestKeepLabel = (streak: number): string | undefined => (Number.isInteger(streak) && streak >= KEEP_RUN ? 'Keep your streak' : undefined);

export const runTold = (): boolean => storage.get(TOLD_KEY) === '1';
export const markRunTold = (): void => void storage.set(TOLD_KEY, '1');
