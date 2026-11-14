import { useState, useSyncExternalStore, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Download } from 'lucide-react';
import { Button } from '../components/Button';
import { Icon } from '../components/Icon';
import { SkeletonPage } from '../components/Skeleton';
import { Dialog } from '../components/Dialog';
import { Field } from '../components/Field';
import { Segmented } from '../components/Segmented';
import { TextLink } from '../components/TextLink';
import { Toggle } from '../components/Toggle';
import { exportMyData, saveProfile } from '../lib/api';
import { useAuth } from '../lib/auth';
import { checkProfile } from '../lib/streak';
import { setSound, soundOn, subscribeSound } from '../lib/sound';
import { currentTheme, setTheme, type Theme } from '../lib/theme';
import { t } from '../i18n';
import { Reminders } from './Reminders';
import styles from './Settings.module.css';
import { LanguagePicker } from '../components/LanguagePicker';

/** /settings. Private account housekeeping. The public side of a player lives on /u/:handle. */
export function Settings() {
  const auth = useAuth();
  const nav = useNavigate();
  const [name, setName] = useState(auth.profile?.name ?? '');
  const [handle, setHandle] = useState(auth.profile?.handle ?? '');
  const [synced, setSynced] = useState(auth.profile?.id ?? '');
  const [saveNote, setSaveNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [theme, setThemeState] = useState<Theme>(currentTheme);
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  // Set while signing out or deleting, so the signed-out redirect below does not race our own.
  const [leaving, setLeaving] = useState(false);

  // Fill the form once the profile arrives.
  if (auth.profile && synced !== auth.profile.id) {
    setSynced(auth.profile.id);
    setName(auth.profile.name);
    setHandle(auth.profile.handle);
  }

  if (leaving) return <SkeletonPage />;
  if (!auth.enabled) return <Navigate to="/signin" replace />;
  if (auth.loading) return <SkeletonPage />;
  if (!auth.session || !auth.profile) return <Navigate to="/signin?next=%2Fsettings" replace />;
  const p = auth.profile;
  const changed = name.trim() !== p.name || handle.trim().toLowerCase() !== p.handle;

  const save = async (e: FormEvent) => {
    e.preventDefault();
    const c = checkProfile(name, handle);
    if ('error' in c) return setSaveNote(c.error);
    setSaving(true);
    const r = await saveProfile({ id: p.id, ...c }, true);
    setSaving(false);
    if (r === 'taken') return setSaveNote(t('That handle is taken. Try another.'));
    if (r) return setSaveNote(t('We could not save that. Try again.'));
    await auth.refreshProfile();
    setSaveNote(t('Saved.'));
  };

  const onDelete = async () => {
    setBusy(true);
    setErr('');
    try {
      setLeaving(true);
      await auth.deleteAccount();
      nav('/', { replace: true });
    } catch {
      setLeaving(false);
      setBusy(false);
      setErr(t('We could not delete your account. Try again.'));
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.head}>
        <h1 className={styles.title}>{t('Settings')}</h1>
      </div>

      <section className={styles.section} aria-labelledby="s-profile">
        <h2 id="s-profile" className={styles.h2}>
          {t('Profile')}
        </h2>
        <form className={styles.form} onSubmit={save} noValidate>
          <Field
            label={t('Name')}
            autoComplete="name"
            maxLength={40}
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setSaveNote('');
            }}
          />
          <Field
            label={t('Handle')}
            prefix="@"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            maxLength={20}
            value={handle}
            onChange={(e) => {
              setHandle(e.target.value.replace(/^@/, ''));
              setSaveNote('');
            }}
          />
          <div className={styles.row}>
            <Button type="submit" variant="primary" disabled={!changed || saving}>
              {saving ? t('Saving...') : t('Save')}
            </Button>
            <span className={styles.note} role="status">
              {saveNote}
            </span>
          </div>
        </form>
      </section>

      <section className={styles.section} aria-labelledby="s-account">
        <h2 id="s-account" className={styles.h2}>
          {t('Account')}
        </h2>
        <dl className={styles.facts}>
          <div>
            <dt>{t('Email')}</dt>
            <dd>{auth.email}</dd>
          </div>
          <div>
            <dt>{t('Sign in')}</dt>
            <dd>
              {t('Email code')}
              {auth.session.user.app_metadata?.provider === 'google' ? ` ${t('and Google')}` : ''}
            </dd>
          </div>
        </dl>
      </section>

      <section className={styles.section} aria-labelledby="s-remind">
        <h2 id="s-remind" className={styles.h2}>
          {t('Reminders')}
        </h2>
        <Reminders />
      </section>

      <section className={styles.section} aria-labelledby="s-look">
        <h2 id="s-look" className={styles.h2}>
          {t('Appearance')}
        </h2>
        <div className={styles.narrow}>
          <Segmented
            label={t('Theme')}
            options={[
              ['dark', t('Dark')],
              ['light', t('Light')],
            ]}
            value={theme}
            onChange={(t) => {
              setTheme(t);
              setThemeState(t);
            }}
          />
          <SoundSetting />
          <LanguagePicker />
        </div>
      </section>

      <section className={styles.section} aria-labelledby="s-session">
        <h2 id="s-session" className={styles.h2}>
          {t('Session')}
        </h2>
        <div className={styles.row}>
          <Button
            variant="secondary"
            onClick={async () => {
              setLeaving(true);
              await auth.signOut();
              nav('/', { replace: true });
            }}
          >
            {t('Sign out')}
          </Button>
          <TextLink to="/help">{t('Help')}</TextLink>
        </div>
      </section>

      <MyData handle={p.handle} />

      <section className={styles.danger} aria-labelledby="s-danger">
        <h2 id="s-danger" className={styles.h2}>
          {t('Delete account')}
        </h2>
        <div>
          <Button variant="secondary" onClick={() => setConfirm(true)}>
            {t('Delete account')}
          </Button>
        </div>
      </section>

      <Dialog open={confirm} onClose={() => !busy && setConfirm(false)} label={t('Delete account')}>
        <div className={styles.confirm}>
          <h2 className={styles.confirmTitle}>{t('Delete your account?')}</h2>
          <p className={styles.help}>{t('This removes your profile, scores and shared cards. It cannot be undone.')}</p>
          <p className={styles.note} role="alert">
            {err}
          </p>
          <div className={styles.row}>
            <Button variant="secondary" onClick={() => setConfirm(false)} disabled={busy}>
              {t('Keep my account')}
            </Button>
            <Button variant="primary" onClick={onDelete} disabled={busy}>
              {t('Delete account')}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}

function SoundSetting() {
  const on = useSyncExternalStore(subscribeSound, soundOn, () => true);
  return <Toggle label={t('Sounds')} note={t('A soft tick per letter as you select, a chime when you find a word.')} checked={on} onChange={setSound} />;
}

/** Download my data: everything kept about this player, saved as a JSON file named for them and the day. */
function MyData({ handle }: { handle: string }) {
  const [state, setState] = useState<'idle' | 'busy' | 'failed'>('idle');
  const download = async () => {
    setState('busy');
    try {
      const data = await exportMyData();
      const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `gazecraft-${handle}-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setState('idle');
    } catch {
      setState('failed');
    }
  };
  return (
    <section className={styles.section} aria-labelledby="s-data">
      <h2 id="s-data" className={styles.h2}>
        {t('Data')}
      </h2>
      <div className={styles.row}>
        <Button variant="secondary" onClick={download} disabled={state === 'busy'}>
          <Icon icon={Download} size={18} />
          {t('Download my data')}
        </Button>
        {state === 'failed' && (
          <span className={styles.help} role="alert">
            {t('That did not download. Try again.')}
          </span>
        )}
      </div>
    </section>
  );
}
