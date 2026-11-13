import { answer, endOf, GUEST, LOOK_CHOICES, NEUTRAL_NAME, nextStep, parseFlow, parseLook, progress, stepsFor, suggestName, tail, withTail, type Account, type Flow, type Step } from './onboarding';

const SIGNED_IN: Account = { enabled: true, signedIn: true, hasProfile: false };
const EXISTING: Account = { enabled: true, signedIn: true, hasProfile: true };
const NO_AUTH: Account = { enabled: false, signedIn: false, hasProfile: false };

/** Walk the flow, answering each step the same way, signing in when the sign in step is done. */
function walk(how: (s: Step) => 'done' | 'skipped', start: Account = GUEST): { seen: Step[]; flow: Flow; account: Account } {
  let flow: Flow = {};
  let account = start;
  const seen: Step[] = [];
  for (let i = 0; i < 10; i++) {
    const s = nextStep(flow, account);
    if (!s) break;
    seen.push(s);
    if (s === 'signin' && how(s) === 'done') account = { ...account, signedIn: true };
    else if (s === 'name') account = { ...account, hasProfile: true };
    else flow = answer(flow, s, how(s));
  }
  return { seen, flow, account };
}

describe('the first minute: which step', () => {
  it('a new guest is asked to sign in, then for a name', () => {
    expect(walk(() => 'done').seen).toEqual(['signin', 'name']);
  });

  it('a guest who skips sign in is asked once and never left on a step', () => {
    const { seen, flow } = walk(() => 'skipped');
    // No account, so there is nobody to name.
    expect(seen).toEqual(['signin']);
    expect(nextStep(flow, GUEST)).toBeNull();
    expect(nextStep({ ...flow, done: true }, GUEST)).toBeNull();
  });

  it('an existing account never sees a step, whatever this browser holds', () => {
    for (const flow of [{}, { signin: 'done' }, { done: true }, { signin: 'skipped' }] as Flow[]) {
      expect(nextStep(flow, EXISTING)).toBeNull();
      expect(progress(flow, EXISTING).step).toBe(0);
    }
    // Signing in on a second device: nothing stored there, a profile on the account.
    expect(nextStep(parseFlow(null), EXISTING)).toBeNull();
  });

  it('a new account that came in by /signin is only asked for its name', () => {
    expect(walk(() => 'done', SIGNED_IN).seen).toEqual(['name']);
  });

  it('a guest who skipped earlier and signs up later is only asked for a name', () => {
    expect(nextStep({ signin: 'skipped', done: true }, SIGNED_IN)).toBe('name');
  });

  it('the name is asked until a profile exists, so a save that failed is never the end of it', () => {
    const flow: Flow = { name: 'skipped', done: true };
    expect(nextStep(flow, SIGNED_IN)).toBe('name');
    expect(nextStep(flow, EXISTING)).toBeNull();
  });

  it('a guest who is done is not asked again', () => {
    expect(nextStep({ done: true }, GUEST)).toBeNull();
  });

  it('sign in not set up: nothing to ask', () => {
    expect(stepsFor({}, NO_AUTH)).toEqual([]);
    expect(nextStep({}, NO_AUTH)).toBeNull();
  });
});

describe('stored answers that are missing or broken', () => {
  it.each([null, undefined, '', 'nonsense', 7, true, [], ['signin'], { signin: 'yes' }, { signin: 3, name: null, done: 'true' }, { character: 'done' }])('%j reads as no answers', (raw) => {
    expect(parseFlow(raw)).toEqual({});
    expect(nextStep(parseFlow(raw), GUEST)).toBe('signin');
  });

  it('keeps what is good and drops the rest', () => {
    expect(parseFlow({ character: 'done', signin: 'skipped', look: 'skipped', name: 'later', extra: 1, done: true })).toEqual({ signin: 'skipped', done: true });
  });

  it('answering on top of broken data starts clean', () => {
    expect(answer('broken' as unknown as Flow, 'signin', 'done')).toEqual({ signin: 'done' });
  });
});

describe('the ring', () => {
  it('counts the steps behind the player and names the one they are on', () => {
    expect(progress({}, GUEST)).toEqual({ step: 1, of: 2, value: 0, label: 'Step 1 of 2' });
    expect(progress({}, SIGNED_IN)).toEqual({ step: 2, of: 2, value: 0.5, label: 'Step 2 of 2' });
  });

  it('skipping sign in drops the name step', () => {
    expect(progress({ signin: 'skipped' }, GUEST).value).toBe(1);
  });

  it('closes when there is nothing left to ask, and is never NaN or out of range', () => {
    expect(progress({ done: true }, GUEST).value).toBe(1);
    for (const flow of [{}, { signin: 'done' }, { done: true }, parseFlow('x')] as Flow[]) {
      for (const account of [GUEST, SIGNED_IN, EXISTING, NO_AUTH]) {
        const p = progress(flow, account);
        expect(p.value).toBeGreaterThanOrEqual(0);
        expect(p.value).toBeLessThanOrEqual(1);
        expect(p.label).not.toMatch(/undefined|NaN/);
        expect(p.step).toBeLessThanOrEqual(p.of);
      }
    }
  });
});

describe('the outfit question', () => {
  it('has the 3 answers, in the agreed words, and "I would rather not say" is a full answer', () => {
    expect(LOOK_CHOICES.map((c) => c.label)).toEqual(['A woman', 'A man', "I'd rather not say"]);
    expect(LOOK_CHOICES.map((c) => c.value)).toEqual(['feminine', 'masculine', 'mixed']);
    expect(parseLook('mixed')).toBe('mixed');
  });

  it.each([null, undefined, '', 'woman', 'FEMININE', 0, {}, ['feminine']])('%j is no answer', (raw) => {
    expect(parseLook(raw)).toBeNull();
  });
});

describe('the name that is prefilled', () => {
  it('uses the name the provider gave, else the first word of the email, else a neutral name', () => {
    expect(suggestName({ fullName: '  Ada   Obi ', email: 'x@y.z' })).toBe('Ada Obi');
    expect(suggestName({ email: 'ada.obi99@example.com' })).toBe('Ada');
    expect(suggestName({ email: 'CHIDI@example.com' })).toBe('Chidi');
    expect(suggestName({ email: '1234@example.com' })).toBe(NEUTRAL_NAME);
  });

  it.each([null, undefined, {}, { fullName: null, email: null }, { fullName: 7, email: {} }, { fullName: '   ', email: '' }])('%j gives the neutral name, never a hole', (from) => {
    expect(suggestName(from as never)).toBe(NEUTRAL_NAME);
  });

  it('never runs past 40 characters or carries control characters', () => {
    expect(suggestName({ fullName: 'a'.repeat(90) })).toHaveLength(40);
    expect(suggestName({ fullName: 'Ada\u0000\u0007 Obi' })).toBe('Ada Obi');
  });

  it('a handle with a tail fits the handle rules', () => {
    const random = () => 0.5;
    expect(tail(random)).toMatch(/^[a-z0-9]{4}$/);
    expect(tail(() => 1)).toMatch(/^[a-z0-9]{4}$/);
    expect(withTail('ada', random)).toMatch(/^ada_[a-z0-9]{4}$/);
    expect(withTail('a'.repeat(30))).toMatch(/^[a-z0-9._]{2,20}$/);
    expect(withTail('')).toMatch(/^reader_[a-z0-9]{4}$/);
    expect(withTail('Señor Ada!')).toMatch(/^seorada_[a-z0-9]{4}$/);
  });
});

describe('where the flow ends', () => {
  it("today's daily, unless the player asked for a page", () => {
    expect(endOf(null, '/d/282')).toBe('/d/282');
    expect(endOf('', '/d/282')).toBe('/d/282');
    expect(endOf('/s/ABCD', '/d/282')).toBe('/s/ABCD');
  });

  it('never off site and never back into itself', () => {
    for (const bad of ['//evil.example', '/\\evil', 'https://evil.example', 'play', '/welcome', '/welcome?next=%2Fwelcome']) expect(endOf(bad, '/d/282')).toBe('/d/282');
  });
});
