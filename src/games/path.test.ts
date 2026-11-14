import { buildPath } from '../engine/journey';
import { games, SPECIAL_SOURCES } from './catalog';
import { packsDone } from './path';

const pack = buildPath(games, SPECIAL_SOURCES).cases.find((c) => c.clues.length >= 2)!;
const ids = pack.clues.map((c) => c.id);

describe('a pack finished, by the one rule', () => {
  it('every clue done finishes it', () => {
    expect(packsDone(ids)).toBe(1);
  });

  it('all but one clue does not', () => {
    expect(packsDone(ids.slice(1))).toBe(0);
  });

  it('the whole puzzle played alone finishes it', () => {
    expect(packsDone([pack.id])).toBe(1);
  });

  it('nothing done is nothing finished', () => {
    expect(packsDone([])).toBe(0);
  });
});
