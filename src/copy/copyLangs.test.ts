import en from '../../data/copy.json';
import es from '../../data/copy.es.json';
import fr from '../../data/copy.fr.json';
import de from '../../data/copy.de.json';

const slots = (line: string) => [...line.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(',');

describe.each([['es', es], ['fr', fr], ['de', de]] as const)('the %s pools', (_lang, pools) => {
  it('have every pool and no others', () => {
    expect(Object.keys(pools).sort()).toEqual(Object.keys(en).sort());
  });

  it.each(Object.keys(en))('%s: every line fills the same slots as the English', (key) => {
    const want = new Set((en as Record<string, string[]>)[key]!.map(slots));
    const lines = (pools as Record<string, string[]>)[key]!;
    expect(lines.length).toBeGreaterThan(0);
    for (const line of lines) {
      expect(line.trim()).not.toBe('');
      expect(want).toContain(slots(line));
    }
  });
});
