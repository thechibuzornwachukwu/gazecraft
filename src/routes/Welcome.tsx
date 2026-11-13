import { useEffect, useRef, useState, type RefObject } from 'react';
import { Navigate, useLocation, useSearchParams } from 'react-router-dom';
import { SkeletonPage } from '../components/Skeleton';
import { Ring } from '../components/Ring';
import { TextLink } from '../components/TextLink';
import { playNext } from '../lib/playNext';
import { saveProfile } from '../lib/api';
import { useAuth } from '../lib/auth';
import { loadFlow, saveFlow } from '../lib/firstMinute';
import { answer, endOf, NEUTRAL_NAME, nextStep, progress, suggestName, withTail, type Account, type Answer, type Flow, type Step } from '../lib/onboarding';
import { handleFromName, RESERVED_HANDLES, safeNext } from '../lib/streak';
import { t } from '../i18n';
import { EmailSignIn, ProfileForm } from './SignIn';
import styles from './Welcome.module.css';

/**
 * /welcome. The first minute for a new player (BUILD_PLAN 3b, SPEC section 6): sign in, then a name. One question per
 * screen, each with Skip. The character, pet and outfits are chosen on You.
 * Which step shows is decided by `nextStep` in src/lib/onboarding.ts. An account with a profile never sees one.
 */
export function Welcome() {
  const auth = useAuth();
  const { search } = useLocation();
  const [params] = useSearchParams();
  /** The page that sent the player here (the result they want to keep). An existing account goes back to it. */
  const from = safeNext(params.get('from'), '');
  const asked = params.get('next');
  /** Where a new player ends: the page they asked for, else the result they came from, else the next clue. Never a menu. */
  const [end] = useState(() => endOf(asked, from || playNext().to));

  const [flow, setFlow] = useState<Flow>(loadFlow);
  const [left, setLeft] = useState<string | null>(null);
  const [closing, setClosing] = useState(false);

  const account: Account = { enabled: auth.enabled, signedIn: !!auth.session, hasProfile: !!auth.profile };
  const step = nextStep(flow, account);

  // A new step is a new screen: say its heading, and start at its top.
  const heading = useRef<HTMLHeadingElement>(null);
  const shown = useRef<Step | null>(null);
  useEffect(() => {
    if (shown.current && step && shown.current !== step) heading.current?.focus();
    shown.current = step;
  }, [step]);

  if (left) return <Navigate to={left} replace />;
  // Still finding out who this is: a stored session, or a profile on its way. Never guess a step meanwhile.
  if (closing || auth.loading || (auth.session && !auth.profile && auth.checking)) return <SkeletonPage />;
  // An existing player. Back to where they were, with nothing asked.
  if (account.hasProfile) return <Navigate to={from || endOf(asked, '/play')} replace />;
  // Nothing left to ask a guest who has been through it: what they want now is to sign in.
  if (!step) return <Navigate to={auth.enabled && !account.signedIn ? `/signin${from ? `?next=${encodeURIComponent(from)}` : ''}` : end} replace />;

  /** Record an answer. When that was the last question, the flow is over and the player goes on. */
  const advance = (at: Step, how: Answer) => {
    const next = answer(flow, at, how);
    if (nextStep(next, account)) {
      saveFlow(next);
      return setFlow(next);
    }
    saveFlow({ ...next, done: true });
    setLeft(end);
  };

  /** The profile exists now. Move what the guest built to it, then go. */
  const named = async () => {
    setClosing(true);
    saveFlow({ ...answer(flow, 'name', 'done'), done: true });
    await auth.refreshProfile().catch(() => null);
    setLeft(end);
  };

  const p = progress(flow, account);
  const top = (
    <p className={styles.progress}>
      <Ring value={p.value} size={40} label={p.label} />
      <span aria-hidden="true">{p.label}</span>
    </p>
  );
  const skip = (at: Step) => <TextLink onClick={() => advance(at, 'skipped')}>{t('Skip')}</TextLink>;

  if (step === 'signin') {
    return (
      <div className={styles.screen}>
        {top}
        <EmailSignIn
          next={`/welcome${search}`}
          head={
            <div className={styles.head}>
              <h1 ref={heading} tabIndex={-1} className={styles.title}>
                {t('Sign in to keep your score.')}
              </h1>
              <p className={styles.lead}>{t('We email you a code. No password.')}</p>
            </div>
          }
        />
        <div className={styles.links}>{skip('signin')}</div>
      </div>
    );
  }

  // The name, last. Only ever reached signed in.
  const user = auth.session?.user;
  if (!user) return <Navigate to={end} replace />;
  return (
    <div className={styles.screen}>
      {top}
      <NameStep
        userId={user.id}
        suggested={suggestName({ fullName: user.user_metadata?.full_name ?? user.user_metadata?.name, email: auth.email })}
        heading={heading}
        onSaved={named}
        onGiveUp={() => setLeft(end)}
      />
    </div>
  );
}

type HeadingRef = RefObject<HTMLHeadingElement | null>;

type NameProps = { userId: string; suggested: string; heading: HeadingRef; onSaved: () => Promise<void>; onGiveUp: () => void };

/** Step 2. Name and @handle, prefilled: one tap accepts. Skip gives a neutral name, said on the screen first. */
function NameStep({ userId, suggested, heading, onSaved, onGiveUp }: NameProps) {
  // Worked out once, so the fields do not change under the player.
  const [first] = useState(() => {
    const h = handleFromName(suggested);
    return { name: suggested, handle: h.length >= 2 && !RESERVED_HANDLES.includes(h) ? h : withTail(h) };
  });
  const [neutral] = useState(() => withTail(NEUTRAL_NAME));
  const [busy, setBusy] = useState(false);

  const skip = async () => {
    if (busy) return;
    setBusy(true);
    // A few tries in case the tail is taken. If nothing saves, the player still goes on to play, and is asked next time.
    for (const handle of [neutral, withTail(NEUTRAL_NAME), withTail(NEUTRAL_NAME)]) {
      const res = await saveProfile({ id: userId, name: NEUTRAL_NAME, handle }, false).catch(() => 'failed' as const);
      if (!res) return onSaved();
      if (res !== 'taken') break;
    }
    onGiveUp();
  };

  return (
    <ProfileForm
      userId={userId}
      exists={false}
      name={first.name}
      handle={first.handle}
      suggest
      submit={t('Start finding')}
      head={
        <div className={styles.head}>
          <h1 ref={heading} tabIndex={-1} className={styles.title}>
            {t('What should')}
            <br />
            {t('we call you?')}
          </h1>
        </div>
      }
      foot={
        <div className={styles.links}>
          <TextLink onClick={() => void skip()}>{t('Skip')}</TextLink>
          <span className={styles.aside}>{t('Skip and you are @{handle} for now.', { handle: neutral })}</span>
        </div>
      }
      onSaved={onSaved}
    />
  );
}
