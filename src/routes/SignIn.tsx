import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { Button } from '../components/Button';
import { Field } from '../components/Field';
import { TextLink } from '../components/TextLink';
import { SkeletonPage } from '../components/Skeleton';
import { fetchProfileByHandle, saveProfile } from '../lib/api';
import { useAuth } from '../lib/auth';
import { withTail } from '../lib/onboarding';
import { checkProfile, handleFromName, safeNext } from '../lib/streak';
import { getSupabase } from '../lib/supabase';
import { t } from '../i18n';
import styles from './SignIn.module.css';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RESEND_AFTER = 30;
/** Google sign in shows only when the provider is configured. */
const GOOGLE = import.meta.env.VITE_GOOGLE_AUTH === '1';

function authError(e: { status?: number; message?: string } | null): string {
  if (!e) return '';
  if (e.status === 429) return t('Too many tries. Wait a few minutes and try again.');
  return '';
}

type EmailProps = {
  /** Where a link in the email lands, and where the player goes once signed in. */
  next: string;
  /** The heading and lead of the first screen. */
  head: ReactNode;
  /** Under the form of the first screen: the way to carry on without signing in. */
  foot?: ReactNode;
};

/**
 * Email, then the 6 digit code. Used by /signin and by the first minute (/welcome), so there is one sign in.
 * When the code is right the auth listener takes over: this component only gets the player signed in.
 */
export function EmailSignIn({ next, head, foot }: EmailProps) {
  const [step, setStep] = useState<'start' | 'code'>('start');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [wait, setWait] = useState(0);
  const codeRef = useRef<HTMLInputElement>(null);
  const back = `${window.location.origin}/signin?next=${encodeURIComponent(next)}`;

  useEffect(() => {
    if (wait <= 0) return;
    const id = window.setTimeout(() => setWait((w) => w - 1), 1000);
    return () => window.clearTimeout(id);
  }, [wait]);

  useEffect(() => {
    if (step === 'code') codeRef.current?.focus();
  }, [step]);

  const sendCode = async (e?: FormEvent) => {
    e?.preventDefault();
    const addr = email.trim();
    if (!EMAIL_RE.test(addr)) return setErr(t('That email looks off. Check it and try again.'));
    setBusy(true);
    setErr('');
    // The email carries a code; until custom SMTP is set up it may carry a link instead, which lands back here.
    const error = await getSupabase()
      .then((sb) => sb!.auth.signInWithOtp({ email: addr, options: { shouldCreateUser: true, emailRedirectTo: back } }))
      .then((r) => r.error)
      .catch(() => ({ status: 0 }));
    setBusy(false);
    if (error) return setErr(authError(error) || t('We could not send a code. Try again in a moment.'));
    setCode('');
    setWait(RESEND_AFTER);
    setStep('code');
  };

  const verify = async (value: string) => {
    setBusy(true);
    setErr('');
    const error = await getSupabase()
      .then((sb) => sb!.auth.verifyOtp({ email: email.trim(), token: value, type: 'email' }))
      .then((r) => r.error)
      .catch(() => ({ status: 0 }));
    setBusy(false);
    if (error) {
      setCode('');
      codeRef.current?.focus();
      return setErr(authError(error) || t('That code did not work. Check it or send a new one.'));
    }
    // The auth listener loads the profile; with none, the player is sent on to the first minute.
  };

  const onCode = (v: string) => {
    const digits = v.replace(/\D/g, '').slice(0, 6);
    setCode(digits);
    setErr('');
    if (digits.length === 6 && !busy) void verify(digits);
  };

  const google = async () => {
    setErr('');
    const error = await getSupabase()
      .then((sb) => sb!.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: back } }))
      .then((r) => r.error)
      .catch(() => ({ status: 0 }));
    if (error) setErr(authError(error) || t('Google sign in is not available right now.'));
  };

  if (step === 'code') {
    return (
      <>
        <div className={styles.head}>
          <h1 className={styles.title}>{t('Check your inbox.')}</h1>
          <p className={styles.lead}>
            {t('We sent an email to')} <strong className={styles.strong}>{email.trim()}</strong>
            {t('. Open the link in it on this device, or type the 6 digit code if it has one.')}
          </p>
        </div>
        <div className={styles.fields}>
          <Field
            ref={codeRef}
            label={t('Code')}
            size="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder={t('000000')}
            maxLength={6}
            value={code}
            disabled={busy}
            onChange={(e) => onCode(e.target.value)}
          />
          <p className={styles.err} role="alert">
            {err}
          </p>
        </div>
        <div className={styles.links}>
          <TextLink onClick={() => (wait > 0 || busy ? undefined : void sendCode())}>
            {wait > 0 ? t('Send a new code in {secs}s', { secs: wait }) : t('Send a new code')}
          </TextLink>
          <TextLink
            onClick={() => {
              setStep('start');
              setCode('');
              setErr('');
            }}
          >
            {t('Use a different email')}
          </TextLink>
        </div>
      </>
    );
  }

  return (
    <>
      {head}
      <form className={styles.fields} onSubmit={sendCode} noValidate>
        {GOOGLE && (
          <>
            <Button variant="secondary" onClick={google} className={styles.tall}>
              {t('Continue with Google')}
            </Button>
            <div className={styles.or}>
              <span />
              {t('or')}
              <span />
            </div>
          </>
        )}
        <Field
          label={t('Email')}
          type="email"
          autoComplete="email"
          placeholder={t('you@example.com')}
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setErr('');
          }}
        />
        <Button type="submit" variant="primary" disabled={busy} className={styles.tall}>
          {t('Email me a code')}
        </Button>
        <p className={styles.err} role="alert">
          {err}
        </p>
      </form>
      {foot}
    </>
  );
}

type ProfileProps = {
  userId: string;
  /** The row is already there (editing). Otherwise this creates it. */
  exists: boolean;
  /** What the fields open with. Empty is fine. */
  name?: string | null;
  handle?: string | null;
  /** The handle is the player's own, not a guess from the name: typing a name leaves it alone. */
  handleEdited?: boolean;
  /** A prefilled handle that turns out to be taken gets a short tail before the player meets an error. */
  suggest?: boolean;
  submit: string;
  head: ReactNode;
  foot?: ReactNode;
  onSaved: () => void | Promise<void>;
};

/** Name and @handle. One form for the first minute and for editing. */
export function ProfileForm({ userId, exists, name: name0, handle: handle0, handleEdited: edited0 = false, suggest = false, submit, head, foot, onSaved }: ProfileProps) {
  const [name, setName] = useState(name0 ?? '');
  const [handle, setHandle] = useState(handle0 ?? '');
  const [handleEdited, setHandleEdited] = useState(edited0);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const touched = useRef(false);

  // One look, when the screen opens: is the suggested handle free? Only ever changes a field nobody has typed in.
  useEffect(() => {
    const guess = handle0 ?? '';
    if (!suggest || !guess) return;
    let alive = true;
    fetchProfileByHandle(guess)
      .then((p) => {
        if (alive && p && !touched.current) setHandle(withTail(guess));
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [suggest, handle0]);

  const onName = (v: string) => {
    touched.current = true;
    setName(v);
    if (!handleEdited) setHandle(handleFromName(v));
    setErr('');
  };

  const save = async (e: FormEvent) => {
    e.preventDefault();
    const c = checkProfile(name, handle);
    if ('error' in c) return setErr(c.error);
    setBusy(true);
    const res = await saveProfile({ id: userId, name: c.name, handle: c.handle }, exists).catch(() => 'failed' as const);
    if (res) setBusy(false);
    if (res === 'taken') return setErr(t('That handle is taken. Try another.'));
    if (res) return setErr(t('We could not save that. Try again.'));
    await onSaved();
  };

  return (
    <form className={styles.form} onSubmit={save} noValidate>
      {head}
      <div className={styles.fields}>
        <Field label={t('Name')} autoComplete="name" placeholder={t('Ada Obi')} value={name} maxLength={40} onChange={(e) => onName(e.target.value)} />
        <Field
          label={t('Handle')}
          prefix="@"
          placeholder={t('ada')}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          maxLength={20}
          value={handle}
          onChange={(e) => {
            touched.current = true;
            setHandle(e.target.value.replace(/^@/, ''));
            setHandleEdited(true);
            setErr('');
          }}
        />
        <p className={styles.err} role="alert">
          {err}
        </p>
      </div>
      <Button type="submit" variant="accent" disabled={busy} className={styles.full}>
        {submit}
      </Button>
      {foot}
    </form>
  );
}

export function SignIn() {
  const auth = useAuth();
  const [params] = useSearchParams();
  const asked = params.get('next');
  const next = safeNext(asked);

  if (!auth.enabled) {
    return (
      <div className={styles.screen}>
        <h1 className={styles.title}>{t('Sign in is not set up yet.')}</h1>
        <p className={styles.lead}>{t('You can play every game as a guest.')}</p>
        <TextLink to={next}>{t('Keep playing as a guest')}</TextLink>
      </div>
    );
  }
  // A stored session, or a profile on its way: wait, so an existing player is never sent to the first minute.
  if (auth.loading || (auth.session && !auth.profile && auth.checking)) return <SkeletonPage />;

  if (auth.session && auth.profile) return <Navigate to={next} replace />;

  // Signed in with no profile: a new player. Welcome asks their name, then sends them on.
  if (auth.session) {
    const to = next.startsWith('/welcome') ? next : asked ? `/welcome?next=${encodeURIComponent(next)}` : '/welcome';
    return <Navigate to={to} replace />;
  }

  return (
    <div className={styles.screen}>
      <EmailSignIn
        next={next}
        head={
          <div className={styles.head}>
            <h1 className={styles.title}>
              {t('Sign in.')}
            </h1>
            <p className={styles.lead}>
              {t('Your scores and run, on every device. See what we keep in')}{' '}
              <Link to="/privacy" className={styles.inline}>
                {t('Privacy')}
              </Link>
              {t('. Accounts are for players aged 13 and over.')}
            </p>
          </div>
        }
        foot={
          <Link to={next} className={styles.guest}>
            {t('Keep playing as a guest')}
          </Link>
        }
      />
    </div>
  );
}
