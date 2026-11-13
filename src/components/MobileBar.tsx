import type { ReactNode } from 'react';
import { Button } from './Button';
import { Ring } from './Ring';
import { t } from '../i18n';
import styles from './MobileBar.module.css';

type Props = {
  count: string;
  /** 0 to 1. */
  progress: number;
  time: ReactNode;
  /** Visual only. The page's live region announces it. */
  message: string;
  /** The player's pet, in the mood of the last thing that happened. It stands beside the line it says. */
  pet?: ReactNode;
  /** Left out where there are no tip-offs. */
  onHint?: () => void;
  onDone: () => void;
};

/** Fixed bottom bar under 760 while playing. */
export function MobileBar({ count, progress, time, message, pet, onHint, onDone }: Props) {
  return (
    <div className={styles.bar} data-mobile-bar="">
      <div className={styles.top}>
        <Ring value={progress} label={t('Progress')} />
        <span className={styles.count}>{count}</span>
        <span className={styles.time}>{time}</span>
      </div>
      <div className={styles.bottom}>
        {pet}
        <span className={styles.msg} aria-hidden="true">
          {message}
        </span>
        {onHint && (
          <Button variant="secondary" size="touch" onClick={onHint}>
            {t('Tip-off')}
          </Button>
        )}
        <Button variant="primary" size="touch" onClick={onDone}>
          {t('Done')}
        </Button>
      </div>
    </div>
  );
}
