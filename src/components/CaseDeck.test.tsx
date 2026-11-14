// @vitest-environment jsdom
import { fireEvent, render, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { caseFiles } from '../games/cases';
import { CaseDeck } from './CaseDeck';

const cases = caseFiles([]).slice(0, 3);
const card = (c: HTMLElement) => c.querySelector('article[data-top]')!;

describe('the case deck', () => {
  it('a tap on the card plays it, as a swipe right does', async () => {
    const play = vi.fn();
    const { container } = render(<CaseDeck cases={cases} onPlay={play} />);
    fireEvent.pointerDown(card(container), { clientX: 100, pointerId: 1 });
    fireEvent.pointerUp(card(container), { clientX: 103, pointerId: 1 });
    // The card flies off first, then plays.
    await waitFor(() => expect(play).toHaveBeenCalledWith(cases[0]));
  });

  it('a short drag that is not a swipe neither plays nor passes', () => {
    const play = vi.fn();
    const later = vi.fn();
    const { container } = render(<CaseDeck cases={cases} onPlay={play} onLater={later} />);
    fireEvent.pointerDown(card(container), { clientX: 100, pointerId: 1 });
    fireEvent.pointerMove(card(container), { clientX: 150, pointerId: 1 });
    fireEvent.pointerUp(card(container), { clientX: 150, pointerId: 1 });
    expect(play).not.toHaveBeenCalled();
    expect(later).not.toHaveBeenCalled();
  });
});
