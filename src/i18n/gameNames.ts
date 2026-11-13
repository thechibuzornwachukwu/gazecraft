// What a puzzle is called in the player's language. An English puzzle keeps its words; its name, category and
// the noun for its answers are said in the player's language (data/gameNames.json). A puzzle written in a
// language, or one a player made, is called what it is called.

import names from '../../data/gameNames.json';
import games from '../../data/games.json';
import { lang, t, type Key } from './index';

type Names = { categories: Record<string, Record<string, string>>; games: Record<string, Record<string, readonly [string, string]>> };
const N = names as unknown as Names;
const NOUNS = new Map((games as { games: { id: string; noun: string }[] }).games.map((g) => [g.id, g.noun]));

/** A category ("Science") in the player's language. */
export const categoryName = (category: string): string => N.categories[lang]?.[category] ?? category;

/** A puzzle's title, noun and category, as the player reads them. */
export function nameOf<D extends { id: string; title: string; noun: string; category: string }>(def: D): { title: string; noun: string; category: string } {
  const own = N.games[lang]?.[def.id];
  // A clue of a pack (a sums row, Liar, Mirror...) has its own noun, already in the player's language.
  const packNoun = NOUNS.get(def.id);
  return { title: own?.[0] ?? def.title, noun: own && def.noun === packNoun ? own[1] : def.noun, category: categoryName(def.category) };
}

/** A puzzle's title by id, in the player's language; `fallback` for one that is not in the name table. */
export const titleOf = (id: string, fallback: string): string => N.games[lang]?.[id]?.[0] ?? fallback;

/** Values the engine names in English, said in the player's language. Each is a key in the es files. */
export const difficultyName = (d: string): string => t(d as Key);
export const rankName = (r: string): string => t(r as Key);
export const tierLabel = (tier: string): string => t(tier as Key);
/** The daily goal's names ("Light" is a theme too, so they have their own words). */
const GOALS: Record<string, Record<string, string>> = {
  es: { Light: 'Ligero', Regular: 'Normal', Serious: 'En serio' },
  fr: { Light: 'Léger', Regular: 'Normal', Serious: 'Sérieux' },
  de: { Light: 'Leicht', Regular: 'Normal', Serious: 'Ernsthaft' },
};
export const goalName = (g: string): string => GOALS[lang]?.[g] ?? g;
