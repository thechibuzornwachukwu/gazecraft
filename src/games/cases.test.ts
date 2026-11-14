import { buildPath } from '../engine/journey';
import { allGames, caseClues, getPassage, SPECIAL_SOURCES } from './catalog';
import { caseFiles } from './cases';

// Every language's puzzles: a Spanish player's path holds the Spanish ones, and they must agree too.
const path = buildPath(allGames, SPECIAL_SOURCES);

describe('the path and the game agree on every pack', () => {
  it.each(path.cases.map((c) => [c.id, c] as const))('%s: the same puzzles, in the same order', (id, c) => {
    const cut = caseClues(id);
    // A pack that is not cut is one clue: the whole puzzle.
    expect(c.clues.map((x) => x.n)).toEqual(cut.length ? cut : [0]);
  });
});

describe('a case card shows what Play opens', () => {
  it('its link is the next puzzle of its own pack, and that puzzle exists', () => {
    for (const c of caseFiles([])) {
      const m = c.to.match(/^\/play\/([^/]+)(?:\/(\d+))?$/)!;
      expect(m[1]).toBe(c.id);
      if (m[2]) expect(getPassage(c.id, Number(m[2]))).toBeDefined();
    }
  });

  it('its sentence comes from the text of that puzzle', () => {
    for (const c of caseFiles([])) {
      const m = c.to.match(/^\/play\/[^/]+\/(\d+)$/);
      if (!m || !c.teaser.length) continue;
      const text = getPassage(c.id, Number(m[1]))!.def.text.replace(/\s+/g, ' ');
      expect(text).toContain(c.teaser.map((p) => p.text).join('').replace(/\s+/g, ' ').trim().slice(0, 12));
    }
  });
});
