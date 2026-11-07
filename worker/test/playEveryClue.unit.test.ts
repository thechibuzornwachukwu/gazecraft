// Every clue of every pack, played as a player plays it and replayed as the server replays it. The board and the
// server build each clue on their own (src/games/catalog.ts, worker/src/app.ts), so this is where they must agree.

import { EVALUATE, TRIES } from '../../src/engine/evaluate';
import { buildGroups } from '../../src/engine/groups';
import { buildHiddenWords } from '../../src/engine/hiddenWords';
import { clueKind, SUMS_FROM } from '../../src/engine/journey';
import { buildLiar } from '../../src/engine/liar';
import { buildMirror } from '../../src/engine/mirror';
import { passages } from '../../src/engine/passages';
import { buildRelay } from '../../src/engine/relay';
import { buildSeries } from '../../src/engine/series';
import { specialClues } from '../../src/engine/specials';
import { starsFor } from '../../src/engine/stars';
import { buildSums, sumsClue } from '../../src/engine/sums';
import { caseClues, games, getGameDef, getPassage, getPuzzle, SPECIAL_SOURCES } from '../../src/games/catalog';
import { registry } from '../../src/games/registry';
import { applyPick, isLogged, newSession, type Copy } from '../../src/games/session';
import { replay, type PlayEvent } from '../src/replay';

const copy: Copy = { pick: (k) => k, onFound: () => 'found', resultTitle: () => 'done' };

/** The clue as the Worker builds it, from the whole puzzle and the clue number alone (worker/src/app.ts). */
function serverClue(id: string, n: number) {
  const puzzle = getPuzzle(id)!;
  const def = getGameDef(id)!;
  const cut = passages(puzzle);
  const sp = specialClues(puzzle, id, def.category, SPECIAL_SOURCES).get(n);
  const kind = clueKind(n);
  if (kind === 'sums') return { p: buildSums(sumsClue(`${id}~${n}`, n - SUMS_FROM)), ev: EVALUATE['buried-sums'] };
  if (kind === 'mirror') return { p: buildMirror(sp!), ev: EVALUATE.mirror };
  if (kind === 'relay') return { p: buildRelay(sp!), ev: EVALUATE.relay };
  if (kind === 'series') return { p: buildSeries(sp!), ev: EVALUATE.series };
  if (kind === 'liar') return { p: buildLiar(sp!), ev: EVALUATE.liar, tries: TRIES.liar };
  if (kind === 'groups') return { p: buildGroups(sp!), ev: EVALUATE.groups, tries: TRIES.groups };
  return { p: buildHiddenWords({ text: cut[n - 1]!.text, dict: def.dict }), ev: EVALUATE['hidden-words'] };
}

const clues = games.flatMap((g) => caseClues(g.id).map((n) => [g.id, n] as const));

describe('every clue of every pack', () => {
  it('there are clues to play', () => {
    expect(clues.length).toBeGreaterThan(50);
  });

  it.each(clues)('%s clue %i: a perfect play on the board is a perfect play on the server', (id, n) => {
    const { def } = getPassage(id, n)!;
    const mod = registry[def.type];
    const board = mod.build(def);
    const answers = mod.answers(board);
    const server = serverClue(id, n);
    // Both build the same answers, in the same places.
    expect(server.p.answers.map((a) => a.key)).toEqual(board.answers.map((a) => a.key));

    let s = newSession(0);
    const events: PlayEvent[] = [];
    const spans = board.answers.map((a) => a.spans[0]!);
    spans.forEach(([a, b], i) => {
      const found = new Set(s.found.map((f) => f.key));
      // Words can be picked from either end; a set of tiles and a statement only one way.
      const [x, y] = def.type === 'groups' || def.type === 'liar' || i % 2 === 0 ? [a, b] : [b, a];
      const ev = mod.check(board, x, y, found);
      expect(ev.kind, `${id}~${n} pick ${i}`).toBe('hit');
      const t = (i + 1) * 1000;
      s = applyPick(s, ev, { now: t, total: answers.length, daily: false, copy, tries: mod.tries });
      if (isLogged(ev)) events.push({ a: x, b: y, t });
    });
    expect(s.endAt).not.toBeNull();
    expect(s.found).toHaveLength(answers.length);

    const r = replay(server.p, { events, hints: [], finish: events.at(-1)!.t + 500 }, false, server.ev, server.tries);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.found).toBe(r.total);
    expect(starsFor({ finished: true, found: r.found, total: r.total, hints: r.hints, wrongs: r.wrongs })).toBe(3);
  });

  it.each(clues)('%s clue %i: every hint marks a letter of an unfound answer on the board', (id, n) => {
    const { def } = getPassage(id, n)!;
    const mod = registry[def.type];
    const board = mod.build(def);
    const found = new Set<string>();
    for (const kind of ['first', 'longest', 'shortest', 'near'] as const) {
      const h = mod.hint(board, found, kind, 0);
      expect(h, `${id}~${n} ${kind}`).not.toBeNull();
      expect(found.has(h!.key)).toBe(false);
      expect(h!.at).toBeGreaterThanOrEqual(0);
      expect(h!.at).toBeLessThan(def.type === 'groups' ? 16 : board.S.length);
    }
    // With everything found, a hint has nothing to mark.
    expect(mod.hint(board, new Set(board.answers.map((a) => a.key)), 'first', 0)).toBeNull();
  });
});
