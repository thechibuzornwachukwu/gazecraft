// @vitest-environment jsdom
import { vi } from 'vitest';
import { DICTS, fill, LANG_KEY, type Key } from './index';
import { es } from './es';

/** The module read fresh, as a page load would: what it picks from storage and the browser. */
async function load(kept: string | null, browser: string[]) {
  vi.resetModules();
  localStorage.clear();
  if (kept != null) localStorage.setItem(LANG_KEY, kept);
  vi.spyOn(navigator, 'languages', 'get').mockReturnValue(browser);
  return import('./index');
}

afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
});

describe('which language', () => {
  it.each([
    [null, ['es-MX', 'en'], 'es'],
    [null, ['fr-CA'], 'fr'],
    [null, ['de-AT', 'es'], 'de'],
    [null, ['pt-BR', 'de'], 'de'],
    [null, ['pt-BR', 'ja'], 'en'],
    [null, [], 'en'],
    ['es', ['de'], 'es'],
    ['fr', ['es'], 'fr'],
    ['klingon', ['de'], 'de'],
    ['', ['es'], 'es'],
  ])('kept %j, browser %j: %s', async (kept, browser, want) => {
    const m = await load(kept, browser);
    expect(m.lang).toBe(want);
    expect(document.documentElement.lang).toBe(want);
  });

  it('numbers follow the language', async () => {
    expect((await load('de', [])).num(12345)).toBe('12.345');
    expect((await load('en', [])).num(12345)).toBe('12,345');
  });
});

describe('a line', () => {
  it('fills its slots, and a missing value leaves nothing, never a hole', () => {
    expect(fill('{n} of {m}', { n: 2, m: 5 })).toBe('2 of 5');
    expect(fill('{n} of {m}', { n: 0 })).toBe('0 of ');
    expect(fill('{n} found', { n: null })).toBe(' found');
    expect(fill('Hi {name}', { name: '{n}' })).toBe('Hi {n}');
    expect(fill('No slots')).toBe('No slots');
  });

  it('English is the key itself; another language falls back to English when its line is empty', async () => {
    const key = Object.keys(es)[0] as Key | undefined;
    if (!key) return;
    expect((await load('en', [])).t(key)).toBe(key);
    const m = await load('es', []);
    expect(m.t(key)).toBe(es[key] || key);
  });

  it('plural picks the form by the count', async () => {
    const m = await load('en', []);
    const one = 'x {n} thing' as Key;
    const other = 'x {n} things' as Key;
    expect([0, 1, 2].map((n) => m.plural(n, one, other))).toEqual(['x 0 things', 'x 1 thing', 'x 2 things']);
  });
});

describe('every language', () => {
  const keys = Object.keys(es) as Key[];
  const slots = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(',');

  it.each(Object.entries(DICTS))('%s has every line, none empty, with the same slots as the English', (_lang, dict) => {
    const missing = keys.filter((k) => !dict[k]?.trim());
    expect(missing).toEqual([]);
    for (const k of keys) expect(slots(dict[k]!), k).toBe(slots(k));
  });

  it.each(Object.entries(DICTS))('%s has no line English does not', (_lang, dict) => {
    expect(Object.keys(dict).filter((k) => !(k in es))).toEqual([]);
  });
});

describe('puzzle names', () => {
  it('every English puzzle and category has a name in every language', async () => {
    const names = (await import('../../data/gameNames.json')).default as { categories: Record<string, Record<string, string>>; games: Record<string, Record<string, string[]>> };
    const { games, filters } = await import('../../data/games.json');
    for (const l of Object.keys(DICTS)) {
      for (const g of games) {
        const [title, noun] = names.games[l]?.[g.id] ?? [];
        expect(title?.trim(), `${l} ${g.id}`).toBeTruthy();
        expect(noun?.trim(), `${l} ${g.id}`).toBeTruthy();
      }
      for (const c of [...filters, ...games.map((g) => g.category)]) expect(names.categories[l]?.[c], `${l} ${c}`).toBeTruthy();
    }
  });
});
