// The cases on the Puzzles screen (design/V3_STYLE.md): every pack as a case file, in the order a player meets them.
// The one in progress first, then the ones not started, then the closed ones. Each carries a sentence from its own
// text with one hidden word already showing, so the trick is plain before the first tap. Pure apart from the
// catalogue it reads.

import { buildPath, clueStates, type Path } from '../engine/journey';
import { sentences } from '../engine/text';
import { categoryName, titleOf } from '../i18n/gameNames';
import { games, getPuzzle, SPECIAL_SOURCES, sponsorFor, type GameDef } from './catalog';

/** A 3D topic picture per category (public/icons/fluent). A category without one gets the star. */
const ICON: Record<string, string> = {
  Bible: 'sun', Science: 'microscope', AI: 'brain', History: 'comet', General: 'rainbow', Names: 'star', Football: 'soccer-ball', Health: 'stethoscope', Naija: 'fire',
};
export const caseIcon = (category: string): string => `/icons/fluent/${ICON[category] ?? 'star'}.webp`;

/** A piece of the teaser sentence: plain text, or the hidden word that shows. */
export type Piece = { text: string; hit: boolean };

export type CaseFile = {
  id: string;
  title: string;
  category: string;
  /** The English category: what the pack colour and the icon are keyed by. */
  categoryKey: string;
  icon: string;
  /** Clues done, of how many. */
  done: number;
  total: number;
  /** Each clue's state, in play order: a clue played out of order shows done where it is. */
  stones: ('done' | 'now' | 'todo')[];
  /** Where the next clue is played; the whole puzzle when the pack is closed. */
  to: string;
  state: 'going' | 'new' | 'closed';
  /** One sentence of the pack's own text, with one hidden word marked. Empty when none fits. */
  teaser: Piece[];
  /** The marked word, as the answer list writes it. */
  word: string;
  /** Who the pack is with ("With NAME"), when it is. */
  sponsor: string;
};

/** The first sentence of a puzzle that holds a whole answer, split around it. */
export function teaserOf(def: Pick<GameDef, 'id'>): { pieces: Piece[]; word: string } {
  const p = getPuzzle(def.id);
  if (!p) return { pieces: [], word: '' };
  for (const s of sentences(p.text, p.chars)) {
    const a = p.answers
      .flatMap((x) => x.spans.map((span) => ({ label: x.label, span })))
      .filter(({ span }) => span[0] >= s.ls && span[1] <= s.le)
      .sort((x, y) => x.span[0] - y.span[0])[0];
    if (!a) continue;
    const from = p.chars.findIndex((c) => c.li === a.span[0]);
    const to = p.chars.findIndex((c) => c.li === a.span[1]) + 1;
    const text = (i: number, j: number) => p.chars.slice(i, j).map((c) => c.ch).join('');
    const pieces = [
      { text: text(s.cs, from).trimStart(), hit: false },
      { text: text(from, to), hit: true },
      { text: text(to, s.ce).trimEnd(), hit: false },
    ].filter((x) => x.text);
    return { pieces, word: a.label.toUpperCase() };
  }
  return { pieces: [], word: '' };
}

let path: Path | null = null;

/** Every case, in deck order, for a browser that has done `done` (clue ids, as src/games/path.ts reads them). */
export function caseFiles(done: Iterable<string>): CaseFile[] {
  path ??= buildPath(games, SPECIAL_SOURCES);
  const standing = clueStates(path, done, new Set(games.map((g) => g.id)));
  const out: CaseFile[] = [];
  path.cases.forEach((c, ci) => {
    const def = games.find((g) => g.id === c.id);
    const mine = standing.clues.filter((s) => s.case === ci);
    if (!def || mine.length === 0) return;
    const doneCount = mine.filter((s) => s.state === 'done').length;
    const next = mine.find((s) => s.state !== 'done');
    const state = !next ? 'closed' : doneCount > 0 ? 'going' : 'new';
    const at = next ?? mine[0]!;
    const { pieces, word } = teaserOf(def);
    out.push({
      id: def.id,
      title: titleOf(def.id, def.title),
      category: categoryName(def.category),
      categoryKey: def.category,
      icon: caseIcon(def.category),
      done: doneCount,
      total: mine.length,
      stones: mine.map((s) => (s.state === 'done' ? 'done' : s.state === 'next' ? 'now' : 'todo')),
      to: state === 'closed' || !at.n ? `/play/${at.puzzle}` : `/play/${at.puzzle}/${at.n}`,
      state,
      teaser: pieces,
      word,
      sponsor: sponsorFor(def)?.name ?? '',
    });
  });
  const rank = { going: 0, new: 1, closed: 2 } as const;
  // Stable: within each group the path's own order stays.
  return out.map((c, i) => ({ c, i })).sort((x, y) => rank[x.c.state] - rank[y.c.state] || x.i - y.i).map((x) => x.c);
}
