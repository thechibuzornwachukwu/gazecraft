// @vitest-environment jsdom
// The first minute (BUILD_PLAN 3b). The step rules are tested in src/lib/onboarding.test.ts; this is what a player sees.
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { vi } from 'vitest';
import { playNext } from '../lib/playNext';
import { FLOW_KEY } from '../lib/firstMinute';
import { Welcome } from './Welcome';

type User = { id: string; email?: string | null; user_metadata?: Record<string, unknown> | null };
const world = vi.hoisted(() => ({
  enabled: true,
  loading: false,
  checking: false,
  user: null as User | null,
  profile: null as { id: string; name: string; handle: string } | null,
  refreshed: 0,
  saved: [] as Array<{ id: string; name: string; handle: string }>,
  saveResult: null as string | null,
  taken: [] as string[],
}));

vi.mock('../lib/auth', () => ({
  useAuth: () => ({
    enabled: world.enabled,
    loading: world.loading,
    checking: world.checking,
    session: world.user ? { user: world.user } : null,
    email: world.user?.email ?? null,
    profile: world.profile,
    refreshProfile: async () => {
      world.refreshed += 1;
      return world.profile;
    },
  }),
}));
vi.mock('../avatar/store', () => ({ avatarCodeOf: () => undefined, subscribeAvatars: () => () => {}, setAvatarCode: () => {} }));
vi.mock('../lib/api', () => ({
  saveProfile: async (p: { id: string; name: string; handle: string }) => {
    world.saved.push(p);
    return world.saveResult;
  },
  fetchProfileByHandle: async (h: string) => (world.taken.includes(h) ? { id: 'x', name: 'X', handle: h, created_at: '' } : null),
  saveAvatar: async () => true,
  saveLook: async () => true,
  fetchLook: async () => null,
  fetchPoints: async () => null,
}));

// Play first: with nothing played, the flow ends in what is next, the brief of the case that is open, never a menu.
const FIRST = playNext().to;

function Where() {
  const { pathname, search } = useLocation();
  return <p data-testid="where">{pathname + search}</p>;
}

function open(at = '/welcome') {
  return render(
    <MemoryRouter initialEntries={[at]}>
      <Routes>
        <Route path="/welcome" element={<Welcome />} />
        <Route path="*" element={<Where />} />
      </Routes>
    </MemoryRouter>,
  );
}

const h1 = () => screen.getByRole('heading', { level: 1 });
const ring = () => screen.getByRole('progressbar');
const where = () => screen.getByTestId('where').textContent;
const stored = () => JSON.parse(localStorage.getItem(FLOW_KEY) ?? '{}') as Record<string, unknown>;
const click = (name: string | RegExp) => fireEvent.click(screen.getByRole('button', { name }));

/** One heading, a ring that says where the player is, a way to skip, and nothing that reads like a missing value. */
function expectStep(title: string | RegExp, label: string) {
  expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  expect(h1()).toHaveTextContent(title);
  expect(ring()).toHaveAccessibleName(label);
  expect(screen.getByRole('button', { name: 'Skip' })).toBeInTheDocument();
  expect(document.body.textContent ?? '').not.toMatch(/undefined|NaN|\bnull\b|\[object/);
}

beforeAll(() => {
  // jsdom has no modal dialogs. This is enough for the tree to be reachable.
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute('open', '');
  };
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute('open');
  };
});

beforeEach(() => {
  Object.assign(world, { enabled: true, loading: false, checking: false, user: null, profile: null, refreshed: 0, saved: [], saveResult: null, taken: [] });
});

describe('a new guest', () => {
  it('is asked to sign in first, with a ring that says where they are', () => {
    open();
    expectStep('Sign in to keep your score.', 'Step 1 of 2');
    expect(ring()).toHaveAttribute('aria-valuenow', '0');
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
  });

  it('skips sign in: one tap, and the flow ends in a clue, not a menu', () => {
    open();
    click('Skip');
    expect(where()).toBe(FIRST);
    expect(stored()).toEqual({ signin: 'skipped', done: true });
  });

  it.each(['{broken', '[]', '"done"', '{"signin":7,"done":"yes"}', ''])('stored answers %s read as none: the flow starts at sign in', (raw) => {
    localStorage.setItem(FLOW_KEY, raw);
    open();
    expectStep('Sign in to keep your score.', 'Step 1 of 2');
  });

  it('who has been through it comes back to keep a score: straight to sign in, and back to that score', () => {
    localStorage.setItem(FLOW_KEY, JSON.stringify({ signin: 'skipped', done: true }));
    open('/welcome?from=%2Fplay%2Fbible');
    expect(where()).toBe('/signin?next=%2Fplay%2Fbible');
  });

  it('sign in not set up: no step and no dead end', () => {
    world.enabled = false;
    open();
    expect(where()).toBe(FIRST);
  });
});

describe('an existing player', () => {
  beforeEach(() => {
    world.user = { id: 'u1', email: 'ada@example.com' };
    world.profile = { id: 'u1', name: 'Ada', handle: 'ada' };
  });

  it('never sees a step and goes back to where they were', () => {
    open('/welcome?from=%2Fplay%2Fbible');
    expect(where()).toBe('/play/bible');
    expect(screen.queryByRole('progressbar')).toBeNull();
  });

  it('on a second device, with nothing stored and nowhere to return to, lands on Games', () => {
    open();
    expect(where()).toBe('/play');
  });

  it('is not shown a step while their profile is still on its way', () => {
    world.profile = null;
    world.checking = true;
    const { container } = open();
    expect(screen.queryByRole('heading')).toBeNull();
    expect(container.querySelector('[aria-busy="true"]')).not.toBeNull();
  });

  it('a stored session still loading shows a busy screen, not a step', () => {
    world.user = null;
    world.profile = null;
    world.loading = true;
    const { container } = open();
    expect(screen.queryByRole('heading')).toBeNull();
    expect(container.querySelector('[aria-busy="true"]')).not.toBeNull();
  });
});

describe('a new signed in player', () => {
  beforeEach(() => {
    world.user = { id: 'u2', email: 'chidi.okafor@example.com', user_metadata: {} };
  });

  it('who came in by /signin is asked only for a name', () => {
    open('/welcome?next=%2Fs%2FABCD');
    expectStep(/What should\s*we call you\?/, 'Step 2 of 2');
  });

  it('name and @handle come last, prefilled, and one tap accepts them', async () => {
    open();
    expectStep(/What should\s*we call you\?/, 'Step 2 of 2');
    expect(screen.getByLabelText('Name')).toHaveValue('Chidi');
    expect(screen.getByLabelText('Handle')).toHaveValue('chidi');
    click('Start finding');
    await waitFor(() => expect(where()).toBe(FIRST));
    expect(world.saved).toEqual([{ id: 'u2', name: 'Chidi', handle: 'chidi' }]);
    // Refreshing the profile is what moves the guest character and look to the account.
    expect(world.refreshed).toBe(1);
    expect(stored().done).toBe(true);
  });

  it('ends on the page they asked for when a link brought them in', async () => {
    open('/welcome?next=%2Fs%2FABCD');
    click('Start finding');
    await waitFor(() => expect(where()).toBe('/s/ABCD'));
  });

  it('a suggested handle that is taken gets a tail before they meet an error', async () => {
    world.taken = ['chidi'];
    open();
    await waitFor(() => expect((screen.getByLabelText('Handle') as HTMLInputElement).value).toMatch(/^chidi_[a-z0-9]{4}$/));
    expect(screen.getByLabelText('Name')).toHaveValue('Chidi');
  });

  it('typing a name still fills the handle, and a taken handle says so and stays on the step', async () => {
    world.saveResult = 'taken';
    open();
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Ada Obi' } });
    expect(screen.getByLabelText('Handle')).toHaveValue('ada');
    click('Start finding');
    expect(await screen.findByRole('alert')).toHaveTextContent('That handle is taken. Try another.');
    expectStep(/What should\s*we call you\?/, 'Step 2 of 2');
  });

  it.each([
    ['no email and no name', { id: 'u3', email: null, user_metadata: null }],
    ['an email with no letters', { id: 'u3', email: '1234@example.com' }],
    ['a reserved word', { id: 'u3', email: 'admin@example.com' }],
  ])('%s: the fields are still filled with something that can be saved', (_name, user) => {
    world.user = user;
    open();
    expectStep(/What should\s*we call you\?/, 'Step 2 of 2');
    expect((screen.getByLabelText('Name') as HTMLInputElement).value).not.toBe('');
    expect((screen.getByLabelText('Handle') as HTMLInputElement).value).toMatch(/^[a-z0-9._]{2,20}$/);
    expect(['admin', 'root', 'help']).not.toContain((screen.getByLabelText('Handle') as HTMLInputElement).value);
  });

  it('a Google name is the one prefilled', () => {
    world.user = { id: 'u4', email: 'x@example.com', user_metadata: { full_name: 'Ngozi Eze' } };
    open();
    expect(screen.getByLabelText('Name')).toHaveValue('Ngozi Eze');
    expect(screen.getByLabelText('Handle')).toHaveValue('ngozi');
  });

  it('Skip on the name gives a neutral one, said on the screen first, and nothing from the email', async () => {
    open();
    const said = screen.getByText(/^Skip and you are @reader_[a-z0-9]{4} for now\.$/).textContent!;
    click('Skip');
    await waitFor(() => expect(where()).toBe(FIRST));
    expect(world.saved).toHaveLength(1);
    expect(world.saved[0]!.name).toBe('Reader');
    expect(said).toContain(`@${world.saved[0]!.handle}`);
    expect(JSON.stringify(world.saved)).not.toMatch(/chidi|okafor/i);
  });

  it('Skip that cannot be saved still lets them play, and the name is asked again next time', async () => {
    world.saveResult = 'failed';
    const first = open();
    click('Skip');
    await waitFor(() => expect(where()).toBe(FIRST));
    expect(world.refreshed).toBe(0);
    first.unmount();
    open();
    expectStep(/What should\s*we call you\?/, 'Step 2 of 2');
  });
});
