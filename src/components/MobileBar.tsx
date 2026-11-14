import { Button } from './Button';
import { Ring } from './Ring';
import { t } from '../i18n';
import styles from './MobileBar.module.css';

type Props = {
  count: string;
  /** 0 to 1. */
  progress: number;
  /** Left out where there are no tip-offs. */
  onHint?: () => void;
  onDone: () => void;
};

/**
 * Fixed bottom bar under 760 while playing: how many found, and the two calls within thumb reach. The partner's
 * line is in its bubble above the puzzle, and there is no clock: time shows on the result.
 */
export function MobileBar({ count, progress, onHint, onDone }: Props) {
  return (
    <div className={styles.bar} data-mobile-bar="">
      <span className={styles.tally}>
        <Ring value={progress} label={t('Progress')} />
        <span className={styles.count}>{count}</span>
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
  );
}
