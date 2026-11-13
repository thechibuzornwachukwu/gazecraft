import { buildHiddenWords } from '../engine/hiddenWords';
import { foldWord } from '../engine/text';
import { getPuzzle } from '../games/catalog';
import { DEMOS } from './landingDemos';

describe.each(Object.entries(DEMOS))('the %s demo', (lang, demo) => {
  it('hides exactly its 5 words, each across a gap', () => {
    const p = buildHiddenWords({ text: demo.text, dict: demo.words.map((w) => w.word), lang: lang === 'en' ? undefined : lang });
    expect(p.answers.map((a) => a.key).sort()).toEqual(demo.words.map((w) => (lang === 'en' ? w.word.toLowerCase() : foldWord(w.word))).sort());
    const whole = new Set(demo.text.split(/[^\p{L}]+/u).map(foldWord));
    for (const a of p.answers) expect(whole.has(a.key), a.key).toBe(false);
  });

  it('leads to a puzzle that exists', () => {
    expect(getPuzzle(demo.next)?.answers.length).toBeGreaterThan(5);
  });
});
