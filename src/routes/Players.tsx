import { useEffect, useState, type ReactNode } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { Button } from '../components/Button';
import { Field } from '../components/Field';
import { GuestAsk } from '../components/GuestAsk';
import { PartnerSays } from '../components/PartnerSays';
import { newRoomCode } from '../lib/room';
import { roomGame } from '../games/path';
import { PageHeader } from '../components/PageHeader';
import { PartnerNote } from '../components/PartnerNote';
import { SkeletonList } from '../components/Skeleton';
import { IconLink } from '../components/IconLink';
import { follow, isFollowing, myCircles, searchPlayers, unfollow, type PlayerRef } from '../lib/api';
import { Search, UserCheck, UserPlus, UsersRound, X } from 'lucide-react';
import { Icon } from '../components/Icon';
import { useStreak } from '../lib/useStreak';
import { keepUnlocked, useUnlocks } from '../lib/useUnlocks';
import { useAuth } from '../lib/auth';
import { Avatar } from '../components/Avatar';
import { t, plural } from '../i18n';
import { FriendStreaks } from './FriendStreaks';
import { PeopleFeed } from './PeopleFeed';
import circles from './Circles.module.css';
import styles from './Players.module.css';

type Row = PlayerRef & { stat?: string };

/** Follow or unfollow from a row, without opening the profile. */
function FollowButton({ me, handle, name, check }: { me: string; handle: string; name: string; check: boolean }) {
  const [on, setOn] = useState(false);
  const [busy, setBusy] = useState(false);
  // Suggestions never include people you follow; search results can, so those rows ask.
  useEffect(() => {
    if (!check) return;
    let alive = true;
    isFollowing(me, handle)
      .then((f) => alive && setOn(f))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [check, me, handle]);
  const toggle = async () => {
    setBusy(true);
    const ok = await (on ? unfollow(me, handle) : follow(me, handle)).catch(() => false);
    setBusy(false);
    if (ok) setOn(!on);
  };
  return (
    <button type="button" className={styles.follow} aria-pressed={on} aria-label={t(on ? 'Following {name}' : 'Follow {name}', { name })} disabled={busy} onClick={() => void toggle()}>
      <Icon icon={on ? UserCheck : UserPlus} size={18} />
    </button>
  );
}

/** A list that is loading (null), that did not load, or that is here. */
type Rows = Row[] | null | 'failed';

/** Only rows with a handle and a name are shown, so a broken reply never prints "undefined". */
const clean = <T extends PlayerRef>(r: unknown): T[] => (Array.isArray(r) ? (r as T[]).filter((p) => p && typeof p.handle === 'string' && p.handle !== '') : []);
const count = (n: unknown): number => (typeof n === 'number' && Number.isFinite(n) && n > 0 ? Math.floor(n) : 0);

/** `me` (your user id) adds a Follow button to every row but your own. */
function List({ rows, empty, me, myHandle, check = false, pet = false }: { rows: Rows; empty: ReactNode; me?: string; myHandle?: string; check?: boolean; /** This list carries the screen's one pet when it is empty or did not load. */ pet?: boolean }) {
  if (rows == null) return <SkeletonList rows={5} avatar={40} sub />;
  // A list that failed says so. It never claims to be empty.
  const none = rows === 'failed' ? t('This did not load. Try again in a moment.') : rows.length === 0 ? empty : null;
  if (none != null) {
    const line = <p className={styles.muted}>{none}</p>;
    return pet ? <PartnerNote moment={rows === 'failed' ? 'error' : 'empty'}>{line}</PartnerNote> : line;
  }
  if (rows === 'failed') return null;
  return (
    <ul className={styles.list}>
      {rows.map((p) => (
        <li key={p.handle} className={styles.item}>
          <Link to={`/u/${p.handle}`} className={styles.row}>
            <Avatar handle={p.handle} size={40} />
            <span className={styles.who}>
              <span className={styles.name}>{p.name || `@${p.handle}`}</span>
              <span className={styles.handle}>@{p.handle}</span>
            </span>
            {p.stat && <span className={styles.stat}>{p.stat}</span>}
          </Link>
          {me && p.handle !== myHandle && <FollowButton me={me} handle={p.handle} name={p.name || p.handle} check={check} />}
        </li>
      ))}
    </ul>
  );
}

type CircleRef = { code: string; name: string; members: number };

/**
 * Your circles: the private tables you sit at. They are people, so they live on Squad, and each circle's board is on the circle.
 * `quiet`: not offered yet, so it shows only for a player who is already in one.
 */
function YourCircles({ quiet }: { quiet: boolean }) {
  const [list, setList] = useState<CircleRef[] | null | 'failed'>(null);
  useEffect(() => {
    let alive = true;
    myCircles()
      .then((l) => {
        if (!alive) return;
        const rows = (Array.isArray(l) ? l : []).filter((c) => c && typeof c.code === 'string' && c.code !== '');
        setList(rows.map((c) => ({ code: c.code, name: c.name || t('Circle'), members: count(c.members) })));
      })
      .catch(() => alive && setList('failed'));
    return () => {
      alive = false;
    };
  }, []);
  const has = Array.isArray(list) && list.length > 0;
  if (quiet && !has) return null;
  return (
    <section id="circles" className={styles.section} aria-labelledby="circles-title">
      <div className={styles.sectionHead}>
        <h2 id="circles-title" className={styles.h2}>
          {t('Circles')}
        </h2>
        <Button variant="secondary" size="sm" to="/circles">
          {t('Start a circle')}
        </Button>
      </div>
      {list == null ? (
        <SkeletonList rows={2} stat={false} />
      ) : list === 'failed' ? (
        <p className={styles.muted}>{t('This did not load. Try again in a moment.')}</p>
      ) : list.length === 0 ? (
        <p className={styles.muted}>{t('A private board for your family, class or office. Start one and send the link.')}</p>
      ) : (
        <ul className={circles.list}>
          {list.map((c) => (
            <li key={c.code}>
              <Link to={`/c/${c.code}`} className={circles.circle}>
                <span className={circles.circleName}>{c.name}</span>
                <span className={circles.circleMeta}>{plural(c.members, '{n} player', '{n} players')}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/** /players, People: the feed, with friend streaks above it and circles below. Search is behind the icon. */
export function Players() {
  const auth = useAuth();
  const run = useStreak();
  const open = useUnlocks(run.played);
  const { hash } = useLocation();
  const [q, setQ] = useState('');
  const [hits, setHits] = useState<Rows>([]);
  const me = auth.profile?.id;
  const myHandle = auth.profile?.handle;
  // A direct link always works: /players#friend-streaks shows the section, and it stays from then on.
  const asked = hash === '#friend-streaks';
  const askedCircles = hash === '#circles';
  const finding = hash === '#find';
  useEffect(() => {
    if (asked) keepUnlocked(['friendStreaks']);
    if (askedCircles) keepUnlocked(['circles']);
  }, [asked, askedCircles]);


  // Search as you type, a beat after the last key.
  useEffect(() => {
    const term = q.trim();
    if (!term) return;
    let alive = true;
    const id = window.setTimeout(() => {
      searchPlayers(term)
        .then((r) => alive && setHits(clean<Row>(r)))
        .catch(() => alive && setHits('failed'));
    }, 250);
    return () => {
      alive = false;
      window.clearTimeout(id);
    };
  }, [q]);

  if (!auth.enabled) return <Navigate to="/play" replace />;
  // A guest is most likely under 13: no strangers to follow, no search. One ask, and what works without an account.
  if (!me && !auth.loading)
    return (
      <div className={styles.page}>
        <PageHeader tab title={t('People')} />
        <GuestAsk
          from="/players"
          line={t('People is where you follow friends and cheer their medals. It needs an account.')}
        />
        <section className={styles.together} aria-labelledby="together-title">
          <div>
            <h2 id="together-title" className={styles.togetherTitle}>
              {t('Play together')}
            </h2>
            <p className={styles.togetherLine}>{t('Open a room and solve a puzzle with a friend. No account needed.')}</p>
          </div>
          <Link to={`/play/${roomGame()}?room=${newRoomCode()}`} className={styles.togetherGo} aria-label={t('Play together')}>
            <Icon icon={UsersRound} size="em" />
          </Link>
        </section>
      </div>
    );
  const searching = finding && q.trim().length > 0;

  return (
    <div className={styles.page}>
      <PageHeader tab title={t('People')} action={finding ? <IconLink to="/players" icon={X} label={t('Close search')} /> : <IconLink to="/players#find" icon={Search} label={t('Find people')} />} />

      {finding && (
        <section className={styles.section} aria-label={t('Search players')}>
          <Field
            label={t('Find people')}
            prefix="@"
            placeholder={t('handle')}
            autoFocus
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            maxLength={20}
            value={q}
            onChange={(e) => {
              setQ(e.target.value.replace(/^@/, ''));
              setHits(null);
            }}
          />
          {searching && <List rows={hits} empty={t('No handle starts with @{handle}.', { handle: q.trim().toLowerCase() })} me={me} myHandle={myHandle} check pet />}
        </section>
      )}

      {!finding && <PartnerSays>{t('Cheer your friends. Their medals land here.')}</PartnerSays>}

      {/* Friend streaks appear after the first daily. A player already in one, or asked into one, sees it at once. */}
      {!searching && me && <FriendStreaks quiet={!open.friendStreaks && !asked} />}

      {!searching && <PeopleFeed me={me} myHandle={myHandle} />}

      {/* Circles are offered after the first daily too. A player already in one sees them whatever the count says. */}
      {!searching && me && <YourCircles quiet={!open.circles && !askedCircles} />}
    </div>
  );
}
