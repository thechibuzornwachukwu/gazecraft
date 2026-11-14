import { useEffect, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { Avatar } from '../components/Avatar';
import { Button } from '../components/Button';
import { t } from '../i18n';
import { SkeletonPage } from '../components/Skeleton';
import { joinStreakLink, streakLinkInfo, type PlayerRef } from '../lib/api';
import { useAuth } from '../lib/auth';
import styles from './StreakInvite.module.css';

/**
 * /s/CODE. A friend's streak link. Sending the link was the ask, so one tap here starts the streak.
 * New players sign up first and land back here.
 */
export function StreakInvite() {
  const { code = '' } = useParams();
  const auth = useAuth();
  const nav = useNavigate();
  const [from, setFrom] = useState<PlayerRef | null | undefined>(undefined);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');

  useEffect(() => {
    let alive = true;
    streakLinkInfo(code)
      .then((p) => alive && setFrom(p))
      .catch(() => alive && setFrom(null));
    return () => {
      alive = false;
    };
  }, [code]);

  if (!auth.enabled) return <Navigate to="/play" replace />;
  if (from === undefined || auth.loading) return <SkeletonPage />;
  if (!from) {
    return (
      <div className={styles.page}>
        <h1 className={styles.title}>{t('This link has run out.')}</h1>
        <p className={styles.lead}>{t('Ask your friend for a new one, or find a puzzle.')}</p>
        <div>
          <Button to="/play">{t('Play')}</Button>
        </div>
      </div>
    );
  }

  const own = auth.profile?.handle === from.handle;
  const start = async () => {
    setBusy(true);
    const r = await joinStreakLink(code).catch(() => 'failed' as const);
    setBusy(false);
    if (r === 'started' || r === 'exists') return nav('/players#friend-streaks');
    setNote(r === 'limit' ? t('One of you already keeps 5 friend streaks. End one to start another.') : t('That did not work. Try again.'));
  };

  return (
    <div className={styles.page}>
      <Avatar handle={from.handle} size={88} />
      <h1 className={styles.title}>
        {own ? t('This is your own link.') : t('{name} wants a streak with you.', { name: from.name })}
        <br />
        <span className={styles.sub}>{own ? t('Send it to a friend.') : t('Play the daily, both of you.')}</span>
      </h1>
      <p className={styles.lead}>
        {t('A friend streak grows each day you both play the daily. Miss a day, either of you, and it starts again. You each see when the other has played.')}
      </p>
      <div className={styles.actions}>
        {own ? (
          <Button to="/players#friend-streaks">{t('Friend streaks')}</Button>
        ) : auth.profile ? (
          <Button variant="accent" onClick={start} disabled={busy}>
            {t('Start the streak')}
          </Button>
        ) : (
          <Button variant="accent" to={`/signin?next=${encodeURIComponent(`/s/${code}`)}`}>
            {t('Sign in to start')}
          </Button>
        )}
      </div>
      <p className={styles.note} role="status">
        {note}
      </p>
    </div>
  );
}
