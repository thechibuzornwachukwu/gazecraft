import { useState, type CSSProperties, type PointerEvent, type ReactNode } from 'react';
import { Play, X } from 'lucide-react';
import type { CaseFile } from '../games/cases';
import { t } from '../i18n';
import { prefersReducedMotion } from '../lib/media';
import { packHue } from '../lib/packHue';
import { Icon } from './Icon';
import styles from './CaseDeck.module.css';

/** How far a card must travel before letting go sends it. */
const SEND_AT = 96;

type Props = {
  cases: readonly CaseFile[];
  /** Right, or the Play button: this case. */
  onPlay: (c: CaseFile) => void;
  /** Left, or Later: the next card comes up. */
  onLater?: (c: CaseFile) => void;
  /** A third round button beside the two, such as Play with a friend. */
  extra?: ReactNode;
};

/**
 * The cases as a stack of files (design/V3_STYLE.md, Puzzles): swipe the top one right to play it, left for later.
 * The same two calls are buttons under it, for a mouse, a keyboard and a screen reader. The top card nudges right
 * now and then until it is first touched, which teaches the swipe without a word.
 */
export function CaseDeck({ cases, onPlay, onLater, extra }: Props) {
  const [i, setI] = useState(0);
  const [dx, setDx] = useState(0);
  const [start, setStart] = useState<{ x: number; id: number } | null>(null);
  const [leaving, setLeaving] = useState<-1 | 0 | 1>(0);
  const [touched, setTouched] = useState(false);
  const n = cases.length;
  if (n === 0) return null;
  const top = cases[i % n]!;
  const under = [cases[(i + 1) % n], cases[(i + 2) % n]].slice(0, Math.max(0, n - 1));

  const send = (dir: -1 | 1) => {
    if (leaving) return;
    setTouched(true);
    const go = () => {
      setLeaving(0);
      setDx(0);
      if (dir > 0) onPlay(top);
      else {
        onLater?.(top);
        setI((v) => v + 1);
      }
    };
    if (prefersReducedMotion()) return go();
    setLeaving(dir);
    window.setTimeout(go, 260);
  };
  const down = (e: PointerEvent<HTMLElement>) => {
    if (leaving) return;
    setStart({ x: e.clientX, id: e.pointerId });
    setTouched(true);
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  const move = (e: PointerEvent<HTMLElement>) => {
    if (start?.id === e.pointerId) setDx(e.clientX - start.x);
  };
  const up = (e: PointerEvent<HTMLElement>) => {
    if (start?.id !== e.pointerId) return;
    setStart(null);
    if (Math.abs(dx) >= SEND_AT) send(dx < 0 ? -1 : 1);
    else setDx(0);
  };

  const shift = leaving ? leaving * 520 : dx;
  const lean = Math.max(-1, Math.min(1, shift / SEND_AT));
  const tag = top.state === 'going' ? t('Puzzle {n} of {m}', { n: top.done + 1, m: top.total }) : top.state === 'closed' ? t('Case closed') : t('New case');

  return (
    <div className={styles.deck}>
      <div className={styles.stack}>
        {under.map((c, k) =>
          c ? (
            <div key={`${c.id}-${k}`} className={styles.card} data-under={k + 1} style={{ '--pack': packHue(c.categoryKey) } as CSSProperties} aria-hidden="true">
              <div className={styles.band}>
                <img src={c.icon} alt="" width={40} height={40} />
                <span className={styles.title}>{c.title}</span>
              </div>
            </div>
          ) : null,
        )}
        <article
          key={`${top.id}-${i}`}
          className={styles.card}
          data-top
          data-moving={start ? '' : undefined}
          data-nudge={touched ? undefined : ''}
          aria-label={`${top.title}, ${top.category}. ${tag}`}
          style={{ '--pack': packHue(top.categoryKey), transform: `translateX(${shift}px) rotate(${shift / 16}deg)` } as CSSProperties}
          onPointerDown={down}
          onPointerMove={move}
          onPointerUp={up}
          onPointerCancel={up}
        >
          <div className={styles.band}>
            <img src={top.icon} alt="" width={52} height={52} />
            <div className={styles.head}>
              <h2 className={styles.title}>{top.title}</h2>
              <span className={styles.tag}>
                {top.category} · {tag}
              </span>
            </div>
          </div>
          {top.teaser.length > 0 && (
            <p className={styles.teaser}>
              {top.teaser.map((p, k) =>
                p.hit ? (
                  <mark key={k} className={styles.hit}>
                    {p.text}
                  </mark>
                ) : (
                  <span key={k}>{p.text}</span>
                ),
              )}
            </p>
          )}
          <div className={styles.foot}>
            {top.word && <span className={styles.found}>{t('{word} is hiding in there. Find the rest.', { word: top.word })}</span>}
            <ol className={styles.stones} aria-label={t('{done} of {total} done', { done: top.done, total: top.total })}>
              {top.stones.map((state, k) => (
                <li key={k} data-state={state} />
              ))}
            </ol>
          </div>
          <span className={styles.stamp} data-side="play" style={{ opacity: Math.max(0, lean) }} aria-hidden="true">
            {t('Play!')}
          </span>
          <span className={styles.stamp} data-side="later" style={{ opacity: Math.max(0, -lean) }} aria-hidden="true">
            {t('Later')}
          </span>
        </article>
      </div>
      <div className={styles.calls}>
        <button type="button" className={styles.round} onClick={() => send(-1)} aria-label={t('Later')}>
          <Icon icon={X} size="em" />
        </button>
        <button type="button" className={styles.go} onClick={() => send(1)} aria-label={t('Play {title}', { title: top.title })}>
          <Icon icon={Play} size="em" />
        </button>
        {extra}
      </div>
    </div>
  );
}
