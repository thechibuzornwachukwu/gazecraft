// Notifications and badges: what each one says and where it leads. The rows come from the database
// (written by triggers, never by a client); this file only turns them into words.


import { locale, t, plural, num } from '../i18n';

export type NoteKind = 'follow' | 'streak_ask' | 'streak_start' | 'room_invite' | 'nudge' | 'badge' | 'cheer';

export type Note = {
  id: number;
  kind: NoteKind;
  /** The other player, when there is one. */
  handle: string | null;
  name: string | null;
  data: { code?: string; game?: string; room?: string; title?: string; day?: number };
  created_at: string;
  unread: boolean;
};

const POINTS = [1000, 5000, 10000, 25000, 50000, 100000];
const STREAKS = [7, 30, 50, 100, 365];
const CASES = [1, 5, 10, 25];

/** Every badge, in the order a profile shows them. Codes are stored; never rename one. */
export const BADGES: ReadonlyArray<{ code: string; label: string; how: string }> = [
  // Skill badges first (BUILD_PLAN set 3b).
  { code: 'clean_read', label: t('Clean read'), how: t('Find every word, with no tip-off and no wrong pick.') },
  { code: 'no_hint_perfect', label: t('No-hint perfect'), how: t('Find every word with no tip-off.') },
  { code: 'long_word', label: t('Long word'), how: t('Find a word of 9 letters or more.') },
  { code: 'deep_find', label: t('Deep find'), how: t('Find a word that runs across 3 or more gaps.') },
  { code: 'rare_eye', label: t('Rare eye'), how: t('Find a word fewer than 1 in 10 players found.') },
  { code: 'first_game', label: t('First puzzle'), how: t('Finish a puzzle signed in.') },
  ...STREAKS.map((n) => ({ code: `streak_${n}`, label: t('{n} day run', { n }), how: t('Finish a puzzle {n} days in a row.', { n }) })),
  ...CASES.map((n) => ({ code: `cases_${n}`, label: plural(n, 'First pack done', '{n} packs done'), how: plural(n, 'Finish a pack signed in.', 'Finish {n} packs.') })),
  ...POINTS.map((n) => ({ code: `points_${n}`, label: t('{n} points', { n: num(n) }), how: t('Reach {n} points.', { n: num(n) }) })),
];

export const badgeLabel = (code: string | undefined): string => BADGES.find((b) => b.code === code)?.label ?? t('New badge');

/** Where a game lives: curated puzzles by id, custom ones by their share code. */
const gamePath = (id: string) => (id.startsWith('c-') ? `/p/${id.slice(2).toUpperCase()}` : `/play/${id}`);

/** A room is only worth joining while it is fresh. */
const ROOM_MINUTES = 60;

/** The sentence and the link for one notification. */
export function describe(n: Note, now = Date.now()): { text: string; to: string } {
  const who = n.name ?? t('A player');
  switch (n.kind) {
    case 'follow':
      return { text: t('{who} followed you.', { who }), to: n.handle ? `/u/${n.handle}` : '/players' };
    case 'streak_ask':
      return { text: t('{who} wants a streak with you.', { who }), to: '/players#friend-streaks' };
    case 'streak_start':
      return { text: t('Your streak with {who} has started.', { who }), to: '/players#friend-streaks' };
    case 'nudge':
      return { text: t('{who} has played today and nudged you.', { who }), to: '/play' };
    case 'room_invite': {
      const fresh = now - new Date(n.created_at).getTime() < ROOM_MINUTES * 60_000;
      const base = n.data.game ? gamePath(n.data.game) : '/play';
      return {
        text: t('{who} invited you to play {title} together.', { who, title: n.data.title ?? t('a puzzle') }),
        to: fresh && n.data.room ? `${base}?room=${n.data.room}` : base,
      };
    }
    case 'badge':
      return { text: t('New badge: {label}.', { label: badgeLabel(n.data.code) }), to: '/me#badges' };
    case 'cheer':
      return { text: t('{who} cheered your {label}.', { who, label: badgeLabel(n.data.code) }), to: '/me#badges' };
  }
}

/** "now", "5 min", "3 h", "2 d", then the date. */
export function ago(iso: string, now = Date.now()): string {
  const mins = Math.max(0, Math.floor((now - new Date(iso).getTime()) / 60_000));
  if (mins < 1) return t('now');
  if (mins < 60) return t('{n} min', { n: mins });
  if (mins < 24 * 60) return t('{n} h', { n: Math.floor(mins / 60) });
  if (mins < 7 * 24 * 60) return t('{n} d', { n: Math.floor(mins / (24 * 60)) });
  return new Date(iso).toLocaleDateString(locale, { day: 'numeric', month: 'short' });
}
