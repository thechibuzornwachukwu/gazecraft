// @vitest-environment jsdom
// Part names are said in the player's language and are also how a part is found by name (Me, the designer,
// EARNED). Two names in one part that translate to the same word would find the wrong piece.
import { vi } from 'vitest';

describe.each(['en', 'es', 'fr', 'de'])('avatar names in %s', (lang) => {
  beforeEach(() => {
    vi.resetModules();
    localStorage.setItem('gazecraft-lang', lang);
  });
  afterEach(() => localStorage.clear());

  it('are distinct within every part, and never empty', async () => {
    const { PARTS } = await import('./draw');
    for (const part of PARTS) {
      const names = part.names as readonly string[];
      expect(names.every((n) => n.trim() !== ''), part.key).toBe(true);
      expect(new Set(names).size, `${part.key}: ${names.join(', ')}`).toBe(names.length);
    }
  });

  it('every earned piece is found in its part, under the same name', async () => {
    const { PARTS } = await import('./draw');
    const { EARNED } = await import('./earned');
    for (const e of EARNED) expect((PARTS.find((p) => p.key === e.part)!.names as readonly string[]).includes(e.name), e.name).toBe(true);
  });
});
