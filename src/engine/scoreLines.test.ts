import { score, scoreLines } from './score';

describe('how a score was made', () => {
  it('adds up to the score, line by line', () => {
    const input = { found: 4, total: 5, hints: 1, misses: 0, secs: 190 };
    expect(scoreLines(input)).toEqual([
      { kind: 'found', n: 4, points: 400 },
      { kind: 'tipoffs', n: 1, points: -25 },
    ]);
    expect(scoreLines(input).reduce((a, l) => a + l.points, 0)).toBe(score(input));
  });

  it('a clean sweep earns the time bonus; nothing found is no lines', () => {
    expect(scoreLines({ found: 5, total: 5, hints: 0, misses: 0, secs: 128 })).toEqual([
      { kind: 'found', n: 5, points: 500 },
      { kind: 'bonus', n: 1, points: 472 },
    ]);
    expect(scoreLines({ found: 0, total: 5, hints: 0, misses: 0, secs: 10 })).toEqual([]);
  });
});
