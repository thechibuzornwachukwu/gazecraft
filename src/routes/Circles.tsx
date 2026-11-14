import { useEffect, useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { Avatar } from '../components/Avatar';
import { Button } from '../components/Button';
import { Field } from '../components/Field';
import { Icon } from '../components/Icon';
import { Segmented } from '../components/Segmented';
import { Skeleton, SkeletonGroup, SkeletonList } from '../components/Skeleton';
import { dayNo } from '../engine/daily';
import { formatTime } from '../engine/time';
import {
  createCircle, fetchCircle, fetchCircleBoard, fetchCircleWeek, joinCircle, leaveCircle, removeFromCircle,
  type CircleInfo, type CircleRow, type CircleWeekRow,
} from '../lib/api';
import { useAuth } from '../lib/auth';
import { t, plural, num } from '../i18n';
import { copyText } from '../lib/share';
import board from './Leaderboard.module.css';
import styles from './Circles.module.css';

const people = (n: number) => plural(n, '{n} player', '{n} players');

/** The form to start a circle. Your circles are listed on People. */
export function Circles() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const signedIn = !!auth.profile;

  if (!auth.enabled) return <Navigate to="/play" replace />;

  const create = async (e: FormEvent) => {
    e.preventDefault();
    const clean = name.replace(/\s+/g, ' ').trim();
    if (clean.length < 2 || clean.length > 40 || /[<>]/.test(clean)) return setErr(t('Use 2 to 40 letters for the name.'));
    setBusy(true);
    setErr('');
    const r = await createCircle(clean).catch(() => ({ error: 'failed' as const }));
    setBusy(false);
    if ('code' in r) return navigate(`/c/${r.code}`);
    setErr(r.error === 'limit' ? t('You are in 20 circles. Leave one to start another.') : r.error === 'invalid' ? t('Use 2 to 40 letters for the name.') : t('Could not start the circle. Try again.'));
  };

  return (
    <div className={board.page}>
      <Link to="/players#circles" className={board.back} aria-label={t('People')}>
        <Icon icon={ChevronLeft} size={20} />
      </Link>
      <h1 className={board.title}>{t('Start a circle')}</h1>
      <p className={styles.lead}>{t('A private board for your family, class or office.')}</p>

      {!signedIn && !auth.loading && (
        <p className={board.guest}>
          <Link to="/signin?next=%2Fcircles" className={board.inline}>
            {t('Sign in')}
          </Link>{' '}
          {t('to start one.')}
        </p>
      )}

      {signedIn && (
        <section className={board.section} aria-label={t('Start a circle')}>
          <form className={styles.form} onSubmit={create} noValidate>
            <Field label={t('Circle name')} value={name} onChange={(e) => setName(e.target.value)} maxLength={40} placeholder={t('Obi family')} autoComplete="off" />
            <Button type="submit" disabled={busy}>
              {t('Start circle')}
            </Button>
          </form>
          <p className={styles.err} role="alert">
            {err}
          </p>
        </section>
      )}
    </div>
  );
}

type View = 'today' | 'week';

/** One circle: who is in, today's table, the last 7 days, the invite. Also the page an invite link opens. */
export function Circle() {
  const { code = '' } = useParams();
  const auth = useAuth();
  const navigate = useNavigate();
  const me = auth.profile;
  const today = dayNo();
  const [info, setInfo] = useState<CircleInfo | null | undefined>(undefined);
  const [view, setView] = useState<View>('today');
  const [rows, setRows] = useState<CircleRow[] | null>(null);
  const [week, setWeek] = useState<CircleWeekRow[] | null>(null);
  const [note, setNote] = useState('');
  const [tick, setTick] = useState(0);
  const userId = me?.id;

  useEffect(() => {
    let alive = true;
    fetchCircle(code)
      .then((c) => alive && setInfo(c))
      .catch(() => alive && setInfo(null));
    return () => {
      alive = false;
    };
  }, [code, userId, tick]);

  const member = !!info?.is_member;
  useEffect(() => {
    if (!member) return;
    let alive = true;
    Promise.all([fetchCircleBoard(code, today), fetchCircleWeek(code)])
      .then(([r, w]) => {
        if (!alive) return;
        setRows(r);
        setWeek(w);
      })
      .catch(() => alive && setRows([]));
    return () => {
      alive = false;
    };
  }, [member, code, today, tick]);

  if (!auth.enabled) return <Navigate to="/play" replace />;
  if (info === null) return <Navigate to="/circles" replace />;
  if (info === undefined) {
    return (
      <div className={board.page}>
        <SkeletonGroup>
          <Skeleton width="60%" height={40} />
        </SkeletonGroup>
        <SkeletonList rows={5} avatar={28} />
      </div>
    );
  }

  const url = `${window.location.origin}/c/${info.code}`;
  const invite = async () => {
    const text = t('Join {name} on Gazecraft. One puzzle a day, one table for us.', { name: info.name });
    try {
      if (navigator.share) {
        await navigator.share({ text, url });
        return;
      }
    } catch {
      /* closed the sheet: copy instead */
    }
    setNote((await copyText(`${text} ${url}`)) ? t('Invite copied. Paste it in your group.') : url);
  };
  const join = async () => {
    const r = await joinCircle(info.code).catch(() => 'failed' as const);
    if (r === 'joined') return setTick((t) => t + 1);
    setNote(r === 'full' ? t('This circle is full (50 players).') : r === 'limit' ? t('You are in 20 circles. Leave one first.') : t('Could not join. Try again.'));
  };
  const leave = async () => {
    if (await leaveCircle(info.code)) navigate('/circles');
  };
  const remove = async (handle: string) => {
    if (await removeFromCircle(info.code, handle)) setTick((t) => t + 1);
  };

  const played = rows?.filter((r) => r.score != null).length ?? 0;

  return (
    <div className={board.page}>
      <Link to="/circles" className={board.back} aria-label={t('Circles')}>
        <Icon icon={ChevronLeft} size={20} />
      </Link>
      <h1 className={board.title}>
        {info.name}.
        <br />
        <span className={board.sub}>{people(info.members)}.</span>
      </h1>

      {!member && (
        <section className={board.section} aria-label={t('Join this circle')}>
          <p className={styles.lead}>{t('You have been invited. Join to see the table and put your daily score on it.')}</p>
          {me ? (
            <div>
              <Button onClick={join}>{t('Join {name}', { name: info.name })}</Button>
            </div>
          ) : (
            !auth.loading && (
              <div>
                <Button to={`/signin?next=${encodeURIComponent(`/c/${info.code}`)}`}>{t('Sign in to join')}</Button>
              </div>
            )
          )}
          <p className={styles.err} role="status">
            {note}
          </p>
        </section>
      )}

      {member && (
        <section className={board.section} aria-labelledby="table-title">
          <div className={board.head}>
            <div className={board.headText}>
              <span className={board.kicker}>{view === 'today' ? t('Today · Daily #{day}', { day: today }) : t('Last 7 dailies')}</span>
              <h2 id="table-title" className={board.h2}>
                {view === 'today' ? (rows ? t('{played} of {total} have played', { played, total: rows.length }) : t('Today')) : t('Scores added up')}
              </h2>
            </div>
            <div className={styles.actions}>
              <Button variant="secondary" size="sm" onClick={invite}>
                {t('Invite')}
              </Button>
            </div>
          </div>
          <div className={board.switch}>
            <Segmented
              label={t('Table')}
              hideLabel
              options={[
                ['today', t('Today')],
                ['week', t('7 days')],
              ]}
              value={view}
              onChange={(v) => setView(v as View)}
            />
          </div>
          <p className={styles.err} role="status">
            {note}
          </p>

          {rows === null && <SkeletonList rows={5} avatar={28} />}
          {view === 'today' && rows && (
            <ol className={board.board} aria-label={t('Today in this circle')}>
              {rows.map((r) => (
                <li key={r.handle} className={board.row} data-mine={r.handle === me?.handle || undefined} data-waiting={r.score == null || undefined}>
                  <span className={board.rank}>{r.rank == null ? '··' : String(r.rank).padStart(2, '0')}</span>
                  <Link to={`/u/${r.handle}`} className={board.handle}>
                    <Avatar handle={r.handle} size={28} />
                    {r.name}
                    {r.handle === me?.handle && <span className={board.you}>{t('You')}</span>}
                  </Link>
                  {r.score == null ? (
                    <>
                      <span className={board.found}>{t('Not yet')}</span>
                      <span className={board.time} />
                      <span className={board.score}>
                        {info.is_owner && r.handle !== me?.handle && (
                          <button type="button" className={styles.remove} onClick={() => void remove(r.handle)} aria-label={t('Remove {name}', { name: r.name })}>
                            {t('Remove')}
                          </button>
                        )}
                      </span>
                    </>
                  ) : (
                    <>
                      <span className={board.found}>{r.total == null ? t('{n} found', { n: r.found }) : `${r.found}/${r.total}`}</span>
                      <span className={board.time}>{formatTime(r.secs ?? 0)}</span>
                      <span className={board.score}>{num(r.score)}</span>
                    </>
                  )}
                </li>
              ))}
            </ol>
          )}
          {view === 'week' && week && (
            <ol className={board.board} aria-label={t('Last 7 dailies in this circle')}>
              {week.map((r) => (
                <li key={r.handle} className={board.row} data-mine={r.handle === me?.handle || undefined}>
                  <span className={board.rank}>{String(r.rank).padStart(2, '0')}</span>
                  <Link to={`/u/${r.handle}`} className={board.handle}>
                    <Avatar handle={r.handle} size={28} />
                    {r.name}
                    {r.handle === me?.handle && <span className={board.you}>{t('You')}</span>}
                  </Link>
                  <span className={board.found}>{plural(r.days, '{n} day', '{n} days')}</span>
                  <span className={board.time} />
                  <span className={board.score}>{num(r.score)}</span>
                </li>
              ))}
            </ol>
          )}
          <div>
            <button type="button" className={styles.leave} onClick={() => void leave()}>
              {t('Leave this circle')}
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
