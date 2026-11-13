// @vitest-environment jsdom
import type { ComponentProps } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { GameResults } from './GameResults';

type Props = ComponentProps<typeof GameResults>;

const base: Props = {
  title: 'Good run.',
  line: 'The ones you missed are shaded below.',
  score: 420,
  found: 5,
  total: 8,
  secs: 95,
  canReplay: true,
  onReplay: () => {},
  onShare: () => {},
  onText: async () => '',
  guest: false,
};

function show(over: Partial<Props> = {}) {
  const { container } = render(
    <MemoryRouter>
      <GameResults {...base} {...over} />
    </MemoryRouter>,
  );
  return [...container.querySelectorAll('section > div:first-child > p')].map((p) => p.textContent);
}

/** Opens "More" and reads its lines. */
function more() {
  fireEvent.click(screen.getByRole('button', { name: 'More' }));
  return [...document.querySelectorAll('#results-more > p')].map((p) => p.textContent);
}

describe('GameResults', () => {
  it('leads with one line, the stars and 2 buttons, and keeps the rest behind More, in order', () => {
    const lines = show({
      stars: 3,
      starsUp: 'New best here: 3 of 3 stars.',
      skills: ['A clean read. No hints, no wrong picks.', 'IGOAT ran across 4 words. You followed it.'],
      records: ['Your fastest clean read in Bible: 1:15.'],
    });
    expect(lines).toEqual(['The ones you missed are shaded below.', 'New best here: 3 of 3 stars.']);
    expect(screen.getByRole('button', { name: 'Share' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Packs' })).toHaveAttribute('href', '/play');
    expect(screen.queryByText('Score')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Play again' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Copy result' })).toBeNull();
    expect(screen.getByRole('button', { name: 'More' })).toHaveAttribute('aria-expanded', 'false');
    expect(more()).toEqual([
      'A clean read. No hints, no wrong picks.',
      'IGOAT ran across 4 words. You followed it.',
      'Your fastest clean read in Bible: 1:15.',
    ]);
    expect(screen.getByRole('button', { name: 'Less' })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('5/8')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Play again' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Copy result' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Less' }));
    expect(screen.queryByText('Score')).toBeNull();
  });

  it('a game ended at once with 0 found shows the title and the line, and the stats behind More', () => {
    const lines = show({ title: 'Next time.', found: 0, score: 0, secs: 0, skills: [], records: [], stars: 0, starsUp: '' });
    expect(lines).toEqual(['The ones you missed are shaded below.']);
    expect(screen.getByRole('heading', { name: 'Next time.' })).toBeInTheDocument();
    expect(more()).toEqual([]);
    expect(screen.getByText('0/8')).toBeInTheDocument();
    expect(screen.getByText('0:00')).toBeInTheDocument();
  });

  it('lines that were never passed leave no empty paragraph', () => {
    expect(show()).toEqual(['The ones you missed are shaded below.']);
    expect(more()).toEqual([]);
  });

  it('drops blank lines and says no line twice', () => {
    show({ skills: ['', '  ', 'Every word, and no hints.', 'Every word, and no hints.'], records: ['Every word, and no hints.'] });
    expect(more()).toEqual(['Every word, and no hints.']);
  });

  it('a daily has no Play again behind More', () => {
    show({ canReplay: false });
    more();
    expect(screen.queryByRole('button', { name: 'Play again' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Copy result' })).toBeInTheDocument();
  });

  it('shows the stars a catalogue puzzle earned, and pops them only when they went up', () => {
    expect(show({ stars: 2 })).toEqual([base.line, '']);
    const row = screen.getByRole('img', { name: '2 of 3 stars' });
    expect(row).toHaveAttribute('data-stars', '2');
    expect(row).not.toHaveAttribute('data-pop');
    show({ stars: 3, starsUp: 'New best here: 3 of 3 stars.' });
    expect(screen.getByRole('img', { name: '3 of 3 stars' })).toHaveAttribute('data-pop');
  });

  it.each([0, undefined, NaN, -2])('%s stars is no stars row', (stars) => {
    expect(show({ stars, starsUp: 'New best here: 3 of 3 stars.' })).toEqual([base.line]);
    expect(screen.queryByRole('img')).toBeNull();
  });

  it('never prints a hole', () => {
    const { container } = render(
      <MemoryRouter>
        <GameResults {...base} found={0} total={0} score={0} secs={0} />
      </MemoryRouter>,
    );
    more();
    expect(container.textContent).not.toMatch(/undefined|NaN|null|\{\w*\}/);
  });

  it('a sponsored puzzle says who it is with, in view, and links the sponsor in a new tab', () => {
    const lines = show({ sponsor: { line: 'With Chi Farms', url: 'https://chifarms.example/', host: 'chifarms.example' } });
    expect(lines).toEqual([base.line, 'With Chi Farms · chifarms.example']);
    const link = screen.getByRole('link', { name: 'chifarms.example' });
    expect(link).toHaveAttribute('href', 'https://chifarms.example/');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'sponsored noopener');
  });

  it('a sponsor with no link is a name and nothing to tap', () => {
    expect(show({ sponsor: { line: 'With Chi Farms' } })).toEqual([base.line, 'With Chi Farms']);
    expect(screen.queryByRole('link', { name: /chifarms/ })).toBeNull();
  });

  it.each([undefined, { line: '' }, { line: '', url: 'https://chifarms.example/', host: 'chifarms.example' }])('sponsor %o adds no line', (sponsor) => {
    expect(show({ sponsor })).toEqual([base.line]);
  });

  it('keeps the leaderboard link behind More', () => {
    show({ boardPath: '/leaderboard/bible' });
    expect(screen.queryByRole('link', { name: 'See the leaderboard' })).toBeNull();
    more();
    expect(screen.getByRole('link', { name: 'See the leaderboard' })).toHaveAttribute('href', '/leaderboard/bible');
  });
});

describe('GameResults on a sitting', () => {
  it('leads with the way on, which takes the one accent from Share', () => {
    show({ next: { to: '/play/bible/3', label: 'Next puzzle' } });
    const next = screen.getByRole('link', { name: 'Next puzzle' });
    expect(next).toHaveAttribute('href', '/play/bible/3');
    const actions = next.parentElement!;
    expect(actions.firstElementChild).toBe(next);
    const accents = [...actions.children].filter((el) => /accent/i.test(el.className));
    expect(accents).toEqual([next]);
    expect(screen.getByRole('button', { name: 'Share' })).toBeInTheDocument();
    expect(actions.children).toHaveLength(2);
    // The way back to Cases steps behind More.
    expect(screen.queryByRole('link', { name: 'Packs' })).toBeNull();
    more();
    expect(screen.getByRole('link', { name: 'Packs' })).toHaveAttribute('href', '/play');
  });

  it('with no next sitting, Share keeps the accent', () => {
    show();
    expect(screen.queryByRole('link', { name: 'Next puzzle' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Share' }).className).toMatch(/accent/i);
  });
});

describe('GameResults for a guest', () => {
  it('says the plain ask, or the line it is given in its place', () => {
    const { unmount } = render(
      <MemoryRouter>
        <GameResults {...base} guest />
      </MemoryRouter>,
    );
    expect(screen.getByText('Sign in to keep this score on every device.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Sign in' })).toBeInTheDocument();
    unmount();
    render(
      <MemoryRouter>
        <GameResults {...base} guest guestLine="5 days in a row, saved in this browser only." />
      </MemoryRouter>,
    );
    expect(screen.getByText(/5 days in a row/)).toBeInTheDocument();
    expect(screen.queryByText('Sign in to keep this score on every device.')).toBeNull();
    expect(screen.getByRole('link', { name: 'Sign in' })).toBeInTheDocument();
  });

  it('with a run to keep, the link says so and leads back to this result', () => {
    render(
      <MemoryRouter initialEntries={['/play/bible/1']}>
        <GameResults {...base} guest guestAction="Keep your streak" />
      </MemoryRouter>,
    );
    expect(screen.getByRole('link', { name: 'Keep your streak' })).toHaveAttribute('href', '/welcome?from=%2Fplay%2Fbible%2F1');
  });

  it('a signed in player is never asked', () => {
    show({ guestLine: '5 days in a row, saved in this browser only.' });
    expect(screen.queryByText(/5 days in a row/)).toBeNull();
    expect(screen.queryByRole('link', { name: 'Sign in' })).toBeNull();
  });
});