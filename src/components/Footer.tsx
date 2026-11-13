import { Link } from 'react-router-dom';
import { t } from '../i18n';
import styles from './Footer.module.css';
import { LanguagePicker } from './LanguagePicker';

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <LanguagePicker />
        <div className={styles.meta}>
          <Link to="/privacy" className={styles.metaLink}>
            {t('Privacy')}
          </Link>
          <Link to="/help" className={styles.metaLink}>
            {t('Help')}
          </Link>
          <span>{t('© 2026 Gazecraft')}</span>
        </div>
      </div>
    </footer>
  );
}
