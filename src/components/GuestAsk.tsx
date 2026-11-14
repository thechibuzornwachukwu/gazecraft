import { Link } from 'react-router-dom';
import { Partner } from './Partner';
import { t } from '../i18n';
import styles from './GuestAsk.module.css';

type Props = {
  /** Why this place needs an account, in one line the partner says. */
  line: string;
  /** What a guest can do without one, so the page is never a dead end. */
  meanwhile?: string;
  /** Where signing in comes back to. */
  from: string;
};

/**
 * A tab a guest cannot use yet (design/V3_STYLE.md, Never): accounts are for 13 and over, so most players are guests.
 * One action, "Ask a grown-up to sign in", and what works without an account. Never a list of strangers.
 */
export function GuestAsk({ line, meanwhile, from }: Props) {
  return (
    <section className={styles.ask} aria-labelledby="guest-ask">
      <div className={styles.pet}>
        <Partner moment="hello" size={80} className={styles.face} />
        <p id="guest-ask" className={styles.bubble}>
          {line}
        </p>
      </div>
      <Link to={`/welcome?from=${encodeURIComponent(from)}`} className={styles.go}>
        {t('Ask a grown-up to sign in')}
      </Link>
      {meanwhile && <p className={styles.meanwhile}>{meanwhile}</p>}
    </section>
  );
}
