// The cases on the Puzzles screen (design/V3_STYLE.md): every pack as a case file, in the order a player meets them.
// The one in progress first, then the ones not started, then the closed ones. Each carries a sentence from its own
// text with one hidden word already showing, so the trick is plain before the first tap. Pure apart from the
// catalogue it reads.

import { buildPath, clueStates, type Path } from '../engine/journey';
import { buildHiddenWords, type HiddenWordsPuzzle } from '../engine/hiddenWords';
import { sentences } from '../engine/text';
import { t } from '../i18n';
import { categoryName, titleOf } from '../i18n/gameNames';
import { games, getPassage, getPuzzle, SPECIAL_SOURCES, sponsorFor, type GameType } from './catalog';

/** A 3D topic picture per category (public/icons/fluent). A category without one gets the star. */
const ICON: Record<string, string> = {
  Bible: 'sun', Science: 'microscope', AI: 'brain', History: 'comet', General: 'rainbow', Names: 'star', Football: 'soccer-ball', Health: 'stethoscope', Naija: 'fire',
};
/**
 * A puzzle written in Spanish, French or German names its category in that language. Each maps to the English
 * category nearest it, for the pack's colour, and to an icon of its own, so a shelf of them is not one blue star.
 */
const LOCAL: Record<string, readonly [base: string, icon: string]> = {
  Animales: ['General', 'zebra'], Animaux: ['General', 'zebra'], Tiere: ['General', 'zebra'],
  Colores: ['General', 'rainbow'], Couleurs: ['General', 'rainbow'],
  Frutas: ['Health', 'red-apple'], Comida: ['Health', 'watermelon'], Cuisine: ['Health', 'watermelon'],
  Cuerpo: ['Health', 'anatomical-heart'], Corps: ['Health', 'anatomical-heart'], Körper: ['Health', 'anatomical-heart'],
  Países: ['History', 'airplane'], Pays: ['History', 'airplane'],
  Ciudades: ['History', 'bus'], Villes: ['History', 'bus'],
  Nombres: ['Names', 'star'], Prénoms: ['Names', 'star'], Namen: ['Names', 'star'],
};
/** The English category a pack is coloured by. */
export const baseCategory = (category: string): string => LOCAL[category]?.[0] ?? category;
export const caseIcon = (category: string): string => `/icons/fluent/${LOCAL[category]?.[1] ?? ICON[category] ?? 'star'}.webp`;

/**
 * What each kind of round is called. A pack mixes them (words, then Liar, then a number round...), so the card,
 * the shelf and the puzzle all name the round Play opens: a pack called French names can open a number puzzle.
 */
export function kindName(type: GameType): string {
  switch (type) {
    case 'hidden-words':
      return t('Hidden words');
    case 'liar':
      return t('Liar');
    case 'buried-sums':
      return t('Hidden sums');
    case 'series':
      return t('Series');
    case 'mirror':
      return t('Mirror');
    case 'relay':
      return t('Relay');
    case 'groups':
      return t('Groups');
  }
}

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
  /** The kind of round Play opens: Hidden words, Liar, Hidden sums... */
  kind: string;
  /** What the puzzle Play opens asks for, when it has no sentence to show: a Liar, sums or groups puzzle. */
  find: string;
  /** Who the pack is with ("With NAME"), when it is. */
  sponsor: string;
  /** The language the puzzle is written in, when it is not English. */
  lang?: string;
};

/** The first sentence of a puzzle that holds a whole answer, split around it. */
export function teaserOf(p: HiddenWordsPuzzle | undefined): { pieces: Piece[]; word: string } {
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
    // The card shows what Play opens: the next puzzle of the pack, or the whole puzzle once the pack is closed.
    const opens = state !== 'closed' && at.n ? getPassage(def.id, at.n)?.def : undefined;
    const words = !opens ? getPuzzle(def.id) : opens.type === 'hidden-words' ? buildHiddenWords(opens) : undefined;
    const { pieces, word } = teaserOf(words);
    out.push({
      id: def.id,
      title: titleOf(def.id, def.title),
      category: categoryName(def.category),
      categoryKey: baseCategory(def.category),
      icon: caseIcon(def.category),
      done: doneCount,
      total: mine.length,
      stones: mine.map((s) => (s.state === 'done' ? 'done' : s.state === 'next' ? 'now' : 'todo')),
      to: state === 'closed' || !at.n ? `/play/${at.puzzle}` : `/play/${at.puzzle}/${at.n}`,
      state,
      teaser: pieces,
      word,
      kind: kindName(opens?.type ?? 'hidden-words'),
      find: words ? '' : t('Next up: {kind}', { kind: kindName(opens!.type) }),
      sponsor: sponsorFor(def)?.name ?? '',
      lang: def.lang,
    });
  });
  const rank = { going: 0, new: 1, closed: 2 } as const;
  // Stable: within each group the path's own order stays.
  return out.map((c, i) => ({ c, i })).sort((x, y) => rank[x.c.state] - rank[y.c.state] || x.i - y.i).map((x) => x.c);
}
