// What a guest is told under a result (SPEC section 6, Results). Play first stays: nothing here is a wall.
// A guest is asked at the moments something has been earned, with the fact that makes signing in worth it.

import type { PoolKey, Vars } from '../copy';
import { t } from '../i18n';
import { storage } from './storage';

/** The run is worth a word from here. */
export const RUN_ASK = 3;

const TOLD_KEY = 'gazecraft-run-told';

/** From this many days, the link under a guest's result asks to keep the run, not only the score (set 11a). */
export const KEEP_RUN = 2;

export type GuestFacts = {
  /** The guest's run of days played. */
  streak: number;
  /** Whether the line about the run has been said in this browser. */
  runTold: boolean;
};

/** The one line for a guest at a win, or none for the plain ask: the run, once, when there is one worth keeping. Pure. */
export function guestAsk(f: GuestFacts): { pool: PoolKey; vars: Vars; run: boolean } | null {
  return f.streak >= RUN_ASK && !f.runTold ? { pool: 'guestRun', vars: { n: f.streak }, run: true } : null;
}

/** What the sign in link under a guest's result says: the run once there is one to keep, otherwise the default. */
export const guestKeepLabel = (streak: number): string | undefined => (Number.isInteger(streak) && streak >= KEEP_RUN ? t('Keep your streak') : undefined);

export const runTold = (): boolean => storage.get(TOLD_KEY) === '1';
export const markRunTold = (): void => void storage.set(TOLD_KEY, '1');
