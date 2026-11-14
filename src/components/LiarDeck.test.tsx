// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { buildLiar } from '../engine/liar';
import { LiarDeck } from './LiarDeck';

vi.mock('../lib/media', () => ({ prefersReducedMotion: () => true, useCoarsePointer: () => false, useMediaQuery: () => false, scrollToTop: () => {} }));

const LINES = ['The sun is a star.', 'Fish can fly to the moon.', 'Water boils at 100 C at sea level.'];
const puzzle = buildLiar({ text: LINES.join('\n'), dict: ['Fish can fly to the moon.'] });
const spanOf = (i: number) => {
  const lis = puzzle.chars.filter((_, at) => puzzle.chars.slice(0, at).filter((c) => c.ch === '\n').length === i && puzzle.chars[at]!.li >= 0).map((c) => c.li);
  return [lis[0], lis.at(-1)];
};

function deck(over: Partial<Parameters<typeof LiarDeck>[0]> = {}) {
  const onPick = vi.fn();
  const onEnd = vi.fn();
  const r = render(
    <LiarDeck chars={puzzle.chars} letters={puzzle.S.length} found={[]} missed={[]} hintLi={-1} disabled={false} onPick={onPick} onTapStart={() => {}} onDragStart={() => {}} onEnd={onEnd} {...over} />,
  );
  return { ...r, onPick, onEnd };
}
const card = () => screen.getByText(/\.$/, { selector: 'p:not([aria-live])' }).textContent;
const press = (name: 'Lie' | 'True') => fireEvent.click(screen.getByRole('button', { name }));

describe('LiarDeck', () => {
  it('shows one statement at a time, in order, with where it stands', () => {
    deck();
    expect(card()).toBe(LINES[0]);
    expect(screen.getByText('1 of 3')).toBeInTheDocument();
    press('True');
    expect(card()).toBe(LINES[1]);
    expect(screen.getByText('2 of 3')).toBeInTheDocument();
  });

  it('True never picks; Lie picks the whole statement, whether it is a lie or not', () => {
    const { onPick } = deck();
    press('True');
    expect(onPick).not.toHaveBeenCalled();
    press('Lie');
    expect(onPick).toHaveBeenLastCalledWith(...spanOf(1));
    press('Lie');
    expect(onPick).toHaveBeenLastCalledWith(...spanOf(2));
  });

  it('ends the game once, when the last card goes, and not before', () => {
    const { onEnd } = deck();
    press('True');
    press('True');
    expect(onEnd).not.toHaveBeenCalled();
    press('Lie');
    expect(onEnd).toHaveBeenCalledTimes(1);
  });

  it('the arrow keys call Lie and True', () => {
    const { onPick, container } = deck();
    const stack = container.querySelector('[tabindex="0"]')!;
    fireEvent.keyDown(stack, { key: 'ArrowRight' });
    expect(card()).toBe(LINES[1]);
    fireEvent.keyDown(stack, { key: 'ArrowLeft' });
    expect(onPick).toHaveBeenCalledWith(...spanOf(1));
    fireEvent.keyDown(stack, { key: 'Enter' });
    expect(onPick).toHaveBeenCalledTimes(1);
  });

  it('a short drag springs back; a long one sends the card that way', () => {
    const { onPick } = deck();
    const top = () => screen.getByText(LINES[0]!).parentElement!;
    const drag = (el: HTMLElement, dx: number) => {
      el.setPointerCapture = () => {};
      fireEvent.pointerDown(el, { clientX: 200, pointerId: 1 });
      fireEvent.pointerMove(el, { clientX: 200 + dx, pointerId: 1 });
      fireEvent.pointerUp(el, { clientX: 200 + dx, pointerId: 1 });
    };
    drag(top(), -40);
    expect(card()).toBe(LINES[0]);
    expect(onPick).not.toHaveBeenCalled();
    drag(top(), -140);
    expect(onPick).toHaveBeenCalledWith(...spanOf(0));
    expect(card()).toBe(LINES[1]);
  });

  it('a move from another finger is ignored', () => {
    deck();
    const el = screen.getByText(LINES[0]!).parentElement!;
    el.setPointerCapture = () => {};
    fireEvent.pointerDown(el, { clientX: 200, pointerId: 1 });
    fireEvent.pointerMove(el, { clientX: 0, pointerId: 2 });
    fireEvent.pointerUp(el, { clientX: 0, pointerId: 2 });
    expect(card()).toBe(LINES[0]);
  });

  it('a marked letter never reorders the deck: Liar has no tip-off, it would name the lie', () => {
    const [a] = spanOf(2);
    deck({ hintLi: a! + 2 });
    expect(card()).toBe(LINES[0]);
  });

  it('a lie found on an earlier visit is not dealt again', () => {
    const [a, b] = spanOf(1);
    deck({ found: [[a!, b!]] });
    press('True');
    expect(card()).toBe(LINES[2]);
    expect(screen.getByText('3 of 3')).toBeInTheDocument();
  });

  it('finished, it is the plain list with every statement, and no buttons', () => {
    deck({ disabled: true });
    expect(screen.queryByRole('button', { name: 'Lie' })).toBeNull();
    expect(document.body.textContent).toContain('Fish can fly to the moon.');
    expect(document.body.textContent).toContain('The sun is a star.');
  });

  it('with every statement found it falls back to the board, never an empty deck', () => {
    const all = [0, 1, 2].map((i) => spanOf(i) as [number, number]);
    deck({ found: all });
    expect(screen.queryByText(/of 3/)).toBeNull();
  });
});
