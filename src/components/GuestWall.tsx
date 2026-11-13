import { useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Icon } from './Icon';
import { GUEST_GAMES } from '../lib/guestLimit';
import { Button } from './Button';
import { Partner } from './Partner';
import { TextLink } from './TextLink';
import { t } from '../i18n';
import styles from './GuestWall.module.css';

/** A guest who has played their games: one screen, one way on. Nothing they earned is lost. */
export function GuestWall() {
  const { pathname } = useLocation();
  return (
    <div className={styles.wall} data-guest-wall>
      <Partner moment="hello" size={120} />
      <h1 className={styles.title}>{t('Sign in to keep playing')}</h1>
      <p className={styles.lead}>
        {t('You have played {n} puzzles as a guest. Sign in to keep your stars and your pet.', { n: GUEST_GAMES })}
      </p>
      <Button variant="accent" to={`/welcome?from=${encodeURIComponent(pathname)}`}>
        {t('Sign in')}
      </Button>
      <TextLink to="/play">
        <Icon icon={ArrowLeft} size={16} />
        {t('Back to puzzles')}
      </TextLink>
    </div>
  );
}