import { useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { Check, X } from 'lucide-react';
import { prefersReducedMotion } from '../lib/media';
import { Icon } from './Icon';
import { Puzzle, type PuzzleProps } from './Puzzle';
import { t } from '../i18n';
import styles from './LiarDeck.module.css';

/** How far a card must travel before letting go sends it. */
const SEND_AT = 96;

type Card = { text: string; a: number; b: number };

/** The statements, one a line in the text, each with its first and last letter. */
function cardsOf(chars: PuzzleProps['chars']): Card[] {
  const out: Card[] = [];
  let text = '';
  let a = -1;
  let b = -1;
  const close = () => {
    if (a >= 0) out.push({ text: text.trim(), a, b });
    text = '';
    a = b = -1;
  };
  for (const c of chars) {
    if (c.ch === '\n') {
      close();
      continue;
    }
    text += c.ch;
    if (c.li >= 0) {
      if (a < 0) a = c.li;
      b = c.li;
    }
  }
  close();
  return out;
}

/**
 * Liar as a deck: one statement at a time. Swipe left (or press Lie) to call it false, right (or True) to let it
 * pass. A call of Lie is a pick over the whole statement, so the session, the log and the server's replay are the
 * ones every board uses. When the deck runs out the game ends. Finished, it is the plain board with lies shaded.
 */
export function LiarDeck(props: PuzzleProps & { onEnd?: () => void }) {
  const { chars, found, disabled, onPick, onEnd, describedBy, label = t('Statements') } = props;
  const cards = useMemo(() => cardsOf(chars), [chars]);
  const foundAt = useMemo(() => new Set(found.map(([a]) => a)), [found]);
  // Called this visit. A lie found in an earlier visit is already called.
  const [called, setCalled] = useState<ReadonlySet<number>>(new Set());
  const [dx, setDx] = useState(0);
  const [leaving, setLeaving] = useState<-1 | 1 | 0>(0);
  const [dragging, setDragging] = useState(false);
  const start = useRef<{ x: number; id: number } | null>(null);

  const open = cards.filter((c) => !called.has(c.a) && !foundAt.has(c.a));
  const top = open[0];
  const next = open.find((c) => c !== top);
  const done = cards.length - open.length;

  if (disabled || !top) return <Puzzle {...props} label={label} />;

  const send = (dir: -1 | 1) => {
    if (leaving) return;
    const card = top;
    const go = () => {
      setLeaving(0);
      setDx(0);
      const left = open.length - 1;
      setCalled((s) => new Set(s).add(card.a));
      if (dir === -1) onPick(card.a, card.b);
      if (left === 0) onEnd?.();
    };
    if (prefersReducedMotion()) return go();
    setLeaving(dir);
    window.setTimeout(go, 200);
  };

  const down = (e: PointerEvent<HTMLDivElement>) => {
    if (leaving) return;
    start.current = { x: e.clientX, id: e.pointerId };
    setDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const move = (e: PointerEvent<HTMLDivElement>) => {
    if (start.current?.id === e.pointerId) setDx(e.clientX - start.current.x);
  };
  const up = (e: PointerEvent<HTMLDivElement>) => {
    if (start.current?.id !== e.pointerId) return;
    start.current = null;
    setDragging(false);
    if (Math.abs(dx) >= SEND_AT) send(dx < 0 ? -1 : 1);
    else setDx(0);
  };
  const key = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowLeft') send(-1);
    if (e.key === 'ArrowRight') send(1);
  };

  const shift = leaving ? leaving * 480 : dx;
  const lean = Math.max(-1, Math.min(1, shift / SEND_AT));

  return (
    <div className={styles.deck} aria-label={label} aria-describedby={describedBy} role="group">
      <p className={styles.count} aria-live="polite">
        {t('{n} of {total}', { n: done + 1, total: cards.length })}
      </p>
      <div className={styles.stack} tabIndex={0} onKeyDown={key}>
        {next && (
          <div className={`${styles.card} ${styles.under}`} aria-hidden="true" />
        )}
        <div
          key={top.a}
          className={styles.card}
          data-moving={dragging || undefined}
          style={{ transform: `translateX(${shift}px) rotate(${shift / 24}deg)` }}
          onPointerDown={down}
          onPointerMove={move}
          onPointerUp={up}
          onPointerCancel={up}
        >
          <span className={styles.stamp} data-side="lie" style={{ opacity: Math.max(0, -lean) }} aria-hidden="true">
            {t('Lie')}
          </span>
          <span className={styles.stamp} data-side="true" style={{ opacity: Math.max(0, lean) }} aria-hidden="true">
            {t('True')}
          </span>
          <p className={styles.text}>{top.text}</p>
        </div>
      </div>
      <div className={styles.calls}>
        <button type="button" className={styles.call} data-side="lie" onClick={() => send(-1)}>
          <Icon icon={X} size={20} />
          {t('Lie')}
        </button>
        <button type="button" className={styles.call} data-side="true" onClick={() => send(1)}>
          <Icon icon={Check} size={20} />
          {t('True')}
        </button>
      </div>
    </div>
  );
}
