import { useMemo } from 'react';
import { clampStars } from './starsLabel';
import { num, plural } from '../i18n';
import { loadStars } from '../lib/starStore';
import { useStreak } from '../lib/useStreak';
import styles from './RunChips.module.css';

/** The run and the stars, as two small chips (design/V3_STYLE.md): on Puzzles on a phone, in the header on desktop. Nothing before the first. */
export function RunChips({ className }: { className?: string }) {
  const run = useStreak();
  const stars = useMemo(() => Object.values(loadStars()).reduce<number>((n, s) => n + clampStars(s), 0), []);
  if (run.streak <= 0 && stars <= 0) return null;
  return (
    <div className={[styles.chips, className].filter(Boolean).join(' ')}>
      {run.streak > 0 && (
        <span className={styles.chip} aria-label={plural(run.streak, '{n} day in a row', '{n} days in a row')}>
          <img className={styles.wiggle} src="/icons/fluent/fire.webp" alt="" width={24} height={24} />
          {num(run.streak)}
        </span>
      )}
      {stars > 0 && (
        <span className={styles.chip} aria-label={plural(stars, '{n} star', '{n} stars')}>
          <img className={styles.wiggle} src="/icons/fluent/star.webp" alt="" width={22} height={22} />
          {num(stars)}
        </span>
      )}
    </div>
  );
}
