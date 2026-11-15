import { useMemo } from 'react';
import { guestAvatar } from '../avatar/guest';
import { t } from '../i18n';
import { Avatar } from './Avatar';
import { LogoMark } from './Logo';
import styles from './DetectiveBadge.module.css';

type Props = {
  /** As typed: the badge fills in while the player writes it. */
  name: string;
  handle: string;
};

/**
 * The detective's ID badge at sign up (design/canvas/SignInPhone.dc.html): a lanyard card with the player's face,
 * name and handle, and their rank. It fills in as they type, so signing up feels like being sworn in.
 */
export function DetectiveBadge({ name, handle }: Props) {
  const face = useMemo(() => guestAvatar(), []);
  const shown = name.trim() || t('Detective');
  return (
    <section className={styles.badge} aria-label={t('Your detective badge')}>
      <div className={styles.strap}>
        <span className={styles.slot} aria-hidden="true" />
        <LogoMark height={22} />
        <span className={styles.brand}>Gazecraft</span>
      </div>
      <div className={styles.body}>
        <Avatar parts={face} size={72} />
        <div className={styles.who}>
          <span className={styles.name}>{shown}</span>
          <span className={styles.handle}>@{handle.trim() || t('detective')}</span>
          <span className={styles.rank}>{t('Starter')}</span>
        </div>
      </div>
    </section>
  );
}
