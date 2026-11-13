import { lang, LANG_NAMES, LANGS, setLang, t, type Lang } from '../i18n';
import styles from './LanguagePicker.module.css';

/** The language, by its own name. Choosing one reloads the page in it. */
export function LanguagePicker({ className }: { className?: string }) {
  return (
    <label className={[styles.picker, className].filter(Boolean).join(' ')}>
      <span className={styles.label}>{t('Language')}</span>
      <select className={styles.select} value={lang} onChange={(e) => setLang(e.target.value as Lang)}>
        {LANGS.map((l) => (
          <option key={l} value={l} lang={l}>
            {LANG_NAMES[l]}
          </option>
        ))}
      </select>
    </label>
  );
}
