// @vitest-environment jsdom
import { loadScores, localPoints, recordScore } from './scoreStore';

beforeEach(() => localStorage.clear());

describe("a guest's points", () => {
  it('keep the best score of each puzzle, added up', () => {
    expect(recordScore('a~1', 120)).toBe(true);
    expect(recordScore('a~1', 90)).toBe(false);
    expect(recordScore('a~1', 150)).toBe(true);
    expect(recordScore('b', 300)).toBe(true);
    expect(localPoints()).toBe(450);
  });

  it('a score of nothing is not kept', () => {
    expect(recordScore('a', 0)).toBe(false);
    expect(recordScore('a', Number.NaN)).toBe(false);
    expect(loadScores()).toEqual({});
  });

  it('broken storage is no points, never a crash', () => {
    localStorage.setItem('gazecraft-scores', '{broken');
    expect(localPoints()).toBe(0);
    localStorage.setItem('gazecraft-scores', JSON.stringify({ a: 10.7, b: -3, c: 'x', d: 5 }));
    expect(loadScores()).toEqual({ a: 10, d: 5 });
  });
});
