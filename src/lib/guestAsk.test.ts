// @vitest-environment jsdom
import { POOLS } from '../copy';
import { guestAsk, guestKeepLabel, KEEP_RUN, markRunTold, RUN_ASK, runTold } from './guestAsk';

const facts = { streak: 1, runTold: false };

describe('guestAsk', () => {
  it(`says where the run lives from ${RUN_ASK} days, and only until it has been said`, () => {
    expect(guestAsk({ ...facts, streak: RUN_ASK - 1 })).toBeNull();
    expect(guestAsk({ ...facts, streak: RUN_ASK })).toEqual({ pool: 'guestRun', vars: { n: RUN_ASK }, run: true });
    expect(guestAsk({ ...facts, streak: 12, runTold: true })).toBeNull();
  });

  it(`asks to keep the streak from ${KEEP_RUN} days, and the score before that`, () => {
    expect(guestKeepLabel(0)).toBeUndefined();
    expect(guestKeepLabel(KEEP_RUN - 1)).toBeUndefined();
    expect(guestKeepLabel(KEEP_RUN)).toBe('Keep your streak');
    expect(guestKeepLabel(40)).toBe('Keep your streak');
    expect(guestKeepLabel(Number.NaN)).toBeUndefined();
  });

  it('has lines to say, with the number in them and no guilt', () => {
    for (const line of POOLS.guestRun) expect(line).toMatch(/\{n\}/);
    for (const line of POOLS.guestRun) expect(line).not.toMatch(/[—!]|lose|losing|lost|miss out|last chance|hurry/i);
  });
});

describe('the run line is said once', () => {
  beforeEach(() => localStorage.clear());

  it('remembers in this browser', () => {
    expect(runTold()).toBe(false);
    markRunTold();
    expect(runTold()).toBe(true);
  });

  it('unreadable storage reads as not said', () => {
    localStorage.setItem('gazecraft-run-told', 'yes');
    expect(runTold()).toBe(false);
  });
});
