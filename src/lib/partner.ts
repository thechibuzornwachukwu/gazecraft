// The player's partner in this browser (SPEC section 5, Partners). A guest's choice lives here. Signed in, the
// account is the truth: what it holds comes down, and a choice made here as a guest goes up once.

import { useSyncExternalStore } from 'react';
import { parseBonds, parsePartner, slotsFor, START, takePartner, type PartnerId, type PartnerState } from '../engine/partners';
import { chooseServerPartner, fetchMyPartner } from './api';
import { localPoints } from './scoreStore';
import { storage } from './storage';

export const PARTNER_KEY = 'gazecraft-partner';
const SERVER = { ...START, points: 0, bonds: {} };

/**
 * `points`: the account's checked points once it has synced here (`synced`); a guest's are the best scores kept in
 * this browser (src/lib/scoreStore.ts), so a guest opens pets and ranks too. `bonds`: cases closed with each
 * partner, as the account counts them. A guest has none.
 */
type Held = PartnerState & { points: number; bonds: Partial<Record<PartnerId, number>>; synced?: boolean };

let cache: Held | null = null;
const listeners = new Set<() => void>();
const read = (): Held => {
  if (!cache) {
    const raw = storage.getJSON<{ points?: unknown; bonds?: unknown; synced?: unknown }>(PARTNER_KEY);
    const synced = raw?.synced === true;
    const stored = typeof raw?.points === 'number' && Number.isFinite(raw.points) ? Math.max(0, raw.points) : 0;
    cache = { ...parsePartner(raw), points: synced ? stored : localPoints(), bonds: parseBonds(raw?.bonds), synced };
  }
  return cache;
};
function write(next: Held): void {
  cache = next;
  storage.setJSON(PARTNER_KEY, next);
  listeners.forEach((l) => l());
}

/** Whether a partner was ever chosen here. A player who never chose has the default and is not sent up. */
export const partnerChosen = (): boolean => storage.get(PARTNER_KEY) != null;

export const loadPartner = (): Held => read();

/** For tests, for a sign out that cleared storage under us, and after a guest's points went up. */
export function forgetPartner(): void {
  cache = null;
  listeners.forEach((l) => l());
}

/** The partner beside this player, their others, and the points they were last known to have. */
export function usePartner(): Held {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    read,
    () => SERVER,
  );
}

/**
 * Choose a partner. A guest's choice is kept here: the first is free, and with no points there is no second.
 * Signed in, the account decides and its answer is kept. Returns whether the partner is now beside the player.
 */
export async function choosePartner(id: PartnerId, signedIn: boolean): Promise<boolean> {
  const now = read();
  if (!signedIn) {
    // A guest with one slot swaps freely: nothing was earned yet. Past 3,000 points a guest gains slots as an account does.
    const points = localPoints();
    const next = slotsFor(points) <= 1 ? { current: id, owned: [id] } : takePartner(now, id, points);
    write({ ...next, points, bonds: {} });
    return next.current === id;
  }
  const answer = await chooseServerPartner(id).catch(() => null);
  if (!answer) {
    // Offline: only a switch among what is already held is safe to show.
    if (!now.owned.includes(id)) return false;
    write({ ...takePartner(now, id, now.points), points: now.points, bonds: now.bonds, synced: now.synced });
    return true;
  }
  write({ ...parsePartner(answer), points: now.points, bonds: now.bonds, synced: now.synced });
  return answer.current === id;
}

/**
 * Signed in: bring the account's partners here. An account with none takes the one chosen here as a guest.
 * Fails quietly: the next visit tries again.
 */
export async function syncPartner(): Promise<void> {
  const mine = await fetchMyPartner().catch(() => undefined);
  if (mine === undefined) return;
  if (mine) return write({ ...parsePartner(mine), points: mine.points, bonds: parseBonds(mine.bonds), synced: true });
  if (!partnerChosen()) return;
  const answer = await chooseServerPartner(read().current).catch(() => null);
  if (answer) write({ ...parsePartner(answer), points: 0, bonds: {}, synced: true });
}