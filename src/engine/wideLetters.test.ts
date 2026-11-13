import { buildHiddenWords } from './hiddenWords';
import { foldLetter, foldWord, langOf, toChars } from './text';
import { allGames, getGameDef, getPassage, games } from '../games/catalog';
import { registry } from '../games/registry';

describe('letters in other languages', () => {
  it('folds accents and keeps letters that have no plain form', () => {
    expect(['á', 'É', 'ñ', 'ü', 'ç', 'ß', 'œ', 'ø', 'İ'].map(foldLetter)).toEqual(['a', 'e', 'n', 'u', 'c', 'ß', 'œ', 'ø', 'i']);
    expect(foldWord('Perú')).toBe('peru');
    expect(foldWord("Straße l'été")).toBe('straßelete');
  });

  it('every letter is one place in the stream, so spans line up with the text', () => {
    for (const text of ['Él está aquí.', 'Straße über Öl', 'Noël, œuvre, ça', 'İstanbul']) {
      const { chars, S } = toChars(text, true);
      expect(chars.filter((c) => c.li >= 0)).toHaveLength(S.length);
      chars.filter((c) => c.li >= 0).forEach((c, i) => expect(c.li).toBe(i));
    }
  });

  it('English stays a to z: an accented letter is a gap, as it always was', () => {
    expect(toChars('café au lait').S).toBe('cafaulait');
    expect(toChars('café au lait', true).S).toBe('cafeaulait');
  });

  it('a Spanish word hides across an accent, and is matched however its answer is written', () => {
    const p = buildHiddenWords({ text: 'Papá todavía duerme.', dict: ['pato', 'Pató'], lang: 'es' });
    expect(p.answers.map((a) => a.key)).toEqual(['pato']);
    expect(p.answers[0]!.spans).toEqual([[2, 5]]);
  });

  it('German and French words keep their own letters', () => {
    expect(buildHiddenWords({ text: 'Der Mann aß Brot.', dict: ['naß', 'nass'], lang: 'de' }).answers.map((a) => a.key)).toEqual(['naß']);
    expect(buildHiddenWords({ text: 'Elle a cœur ouvert.', dict: ['cœur'], lang: 'fr' }).answers.map((a) => a.key)).toEqual(['cœur']);
  });

  it('without a language, an accented answer is read the old way', () => {
    expect(buildHiddenWords({ text: 'Papá todavía', dict: ['pato'] }).answers).toEqual([]);
  });

  it('the language comes from the id, and only for the languages there are', () => {
    expect(['es-animales', 'fr-x', 'de-y', 'en-z', 'esx', 'bible', 'ES-a'].map(langOf)).toEqual(['es', 'fr', 'de', undefined, undefined, undefined, undefined]);
  });
});

describe('the puzzles in other languages', () => {
  const local = allGames.filter((g) => langOf(g.id));

  it('are all reachable by id and carry their language', () => {
    expect(local.length).toBeGreaterThanOrEqual(8);
    for (const g of local) expect(getGameDef(g.id)?.lang).toBe(langOf(g.id));
  });

  it.each(local.map((g) => [g.id, g] as const))('%s: hides exactly its expected words, each across a gap', (_id, g) => {
    const p = registry['hidden-words'].build(g);
    const fold = (w: string) => foldWord(w);
    expect(p.answers.map((a) => a.key).sort()).toEqual(g.expectedAnswers.map(fold).sort());
    const words = new Set(g.text.split(/[^\p{L}]+/u).map(fold));
    for (const a of p.answers) expect(words.has(a.key), `${a.key} sits in the text whole`).toBe(false);
  });

  it('get no special clues made from the English word lists', () => {
    for (const g of local) {
      for (let n = 1; n <= 40; n++) {
        const clue = getPassage(g.id, n);
        if (clue) expect(['hidden-words', 'buried-sums', 'series']).toContain(clue.def.type);
      }
    }
  });

  it('English players see only English puzzles on their path', () => {
    expect(games.every((g) => !langOf(g.id))).toBe(true);
  });
});
