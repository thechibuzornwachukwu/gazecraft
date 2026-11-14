import { Fragment, useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Flame, Heart, UserCheck, UserPlus } from 'lucide-react';
import { Avatar } from '../components/Avatar';
import { copyText } from '../lib/share';
import { t, plural } from '../i18n';
import { Icon } from '../components/Icon';
import { MedalFace } from '../components/Medals';
import { Skeleton, SkeletonGroup } from '../components/Skeleton';
import { cheer, fetchNotifications, follow, markNotificationsRead, squadFeed, unfollow, type FeedItem, type PlayerRef } from '../lib/api';
import { medalsOf } from '../lib/medals';
import { ago, describe, type Note } from '../lib/notifications';
import { announceRead } from '../lib/useUnread';
import styles from './PeopleFeed.module.css';

type Scope = 'friends' | 'world';

/** The medal a badge code is a tier of, or null for a code this build does not know. */
const medalOf = (code: string) => medalsOf([code]).find((m) => m.tier >= 0 && m.key !== 'first') ?? null;

/** One card of the feed: a medal someone won, or something that happened to you. Newest first. */
type Entry = { at: string; medal: FeedItem } | { at: string; note: Note };

const isPlayer = (r: unknown): r is PlayerRef => !!r && typeof (r as PlayerRef).handle === 'string' && (r as PlayerRef).handle !== '';

/** Follow, or follow back: an icon that fills once it is done. */
export function FollowIcon({ me, handle, name, initial = false }: { me: string; handle: string; name: string; initial?: boolean }) {
  const [on, setOn] = useState(initial);
  const [busy, setBusy] = useState(false);
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

/** A medal's cheers. Yours: the count. Anyone else's: a heart to press. */
function Cheer({ item, me }: { item: FeedItem; me?: string }) {
  const [on, setOn] = useState(item.cheered);
  const [n, setN] = useState(item.cheers);
  const [busy, setBusy] = useState(false);
  const label = plural(n, '{n} cheer', '{n} cheers');
  if (item.mine || !me) {
    return (
      <span className={styles.cheers} aria-label={label} data-none={n === 0 || undefined}>
        <Icon icon={Heart} size={18} />
        {n}
      </span>
    );
  }
  const toggle = async () => {
    setBusy(true);
    setOn(!on);
    setN(n + (on ? -1 : 1));
    const next = await cheer(item.handle, item.code, !on).catch(() => null);
    setBusy(false);
    if (next == null) {
      setOn(on);
      setN(n);
    } else setN(next);
  };
  return (
    <button type="button" className={styles.cheer} aria-pressed={on} aria-label={t('Cheer {name}, {label}', { name: item.name || item.handle, label })} disabled={busy} onClick={() => void toggle()}>
      <Icon icon={Heart} size={20} />
      <span>{n}</span>
    </button>
  );
}

/** Who and when, at the top of every card. */
function Byline({ handle, name, at, to }: { handle: string | null; name: string; at: string; to: string }) {
  return (
    <Link to={to} className={styles.byline}>
      {handle ? <Avatar handle={handle} size={40} /> : <span className={styles.avatarGap} />}
      <span className={styles.who}>
        <span className={styles.name}>{name}</span>
        <time className={styles.when} dateTime={at}>
          {ago(at)}
        </time>
      </span>
    </Link>
  );
}

/** A medal won: the medal large, its name, and the cheers. */
function MedalCard({ f, me }: { f: FeedItem; me?: string }) {
  const medal = medalOf(f.code)!;
  return (
    <article className={styles.card} data-metal={medal.metal}>
      <Byline handle={f.handle} name={f.mine ? t('You') : f.name || `@${f.handle}`} at={f.earned_at} to={f.mine ? '/me#badges' : `/u/${f.handle}`} />
      <div className={styles.won}>
        <MedalFace medal={medal} size="lg" />
        <p className={styles.medalName}>{medal.name}</p>
      </div>
      <div className={styles.foot}>
        <Cheer item={f} me={me} />
      </div>
    </article>
  );
}

/** Something that happened to you: one line, and the thing to do about it, as an icon. */
function NoteCard({ n, me }: { n: Note; me?: string }) {
  const d = describe(n);
  let act: ReactNode = null;
  if (n.kind === 'follow' && me && n.handle) act = <FollowIcon me={me} handle={n.handle} name={n.name ?? n.handle} />;
  else if (n.kind === 'streak_ask')
    act = (
      <Link to="/players#friend-streaks" className={styles.follow} aria-label={n.name ? t('Answer {name} streak ask', { name: n.name }) : t('Answer the streak ask')}>
        <Icon icon={Flame} size={18} />
      </Link>
    );
  return (
    <article className={styles.note} data-unread={n.unread || undefined}>
      <Link to={d.to} className={styles.noteMain}>
        {n.handle ? <Avatar handle={n.handle} size={40} /> : <span className={styles.avatarGap} />}
        <span className={styles.who}>
          <span className={styles.told}>
            {d.text}
            {n.unread && <span className={styles.srOnly}> {t('New.')}</span>}
          </span>
          <time className={styles.when} dateTime={n.created_at}>
            {ago(n.created_at)}
          </time>
        </span>
      </Link>
      {act}
    </article>
  );
}

function FeedSkeleton() {
  return (
    <SkeletonGroup className={styles.cards}>
      {[0, 1].map((i) => (
        <div key={i} className={styles.card}>
          <div className={styles.byline}>
            <Skeleton width={40} height={40} round />
            <Skeleton width="40%" />
          </div>
          <div className={styles.won}>
            <Skeleton width={72} height={88} />
            <Skeleton width="30%" height={20} />
          </div>
        </div>
      ))}
    </SkeletonGroup>
  );
}

/** Where the strip sits: after the third card, or alone when there are no cards. */

/**
 * The feed (SPEC section 6, People): medals lately won by you, the people you follow, or the top players,
 * each as a card that can be cheered, with what happened to you in among them. Opening it reads your notifications.
 */
export function PeopleFeed({ me, myHandle }: { me?: string; myHandle?: string }) {
  const scope: Scope = 'friends';
  const [lists, setLists] = useState<Partial<Record<Scope, Entry[] | 'failed'>>>({});
  const list = lists[scope];
  useEffect(() => {
    if (list !== undefined) return;
    let alive = true;
    const notes = scope === 'friends' && me ? fetchNotifications().catch(() => [] as Note[]) : Promise.resolve([] as Note[]);
    Promise.all([squadFeed(scope), notes])
      .then(([medals, ns]) => {
        if (!alive) return;
        const won: Entry[] = (Array.isArray(medals) ? medals : [])
          .filter((f) => isPlayer(f) && typeof f.code === 'string' && medalOf(f.code))
          .map((f) => ({ at: f.earned_at, medal: f }));
        // Your own medals are already cards; the note that you won one would say it twice.
        const told: Entry[] = (Array.isArray(ns) ? ns : []).filter((n) => n && n.kind !== 'badge').map((n) => ({ at: n.created_at, note: n }));
        setLists((l) => ({ ...l, [scope]: [...won, ...told].sort((a, b) => b.at.localeCompare(a.at)) }));
        if (ns.some((n) => n.unread)) void markNotificationsRead().then(announceRead);
      })
      .catch(() => alive && setLists((l) => ({ ...l, [scope]: 'failed' })));
    return () => {
      alive = false;
    };
  }, [scope, list, me]);
  return (
    <section className={styles.feed} aria-labelledby="medals-title">
      <h2 id="medals-title" className={styles.feedTitle}>
        {t('Medals this month')}
      </h2>
      {list === undefined ? (
        <FeedSkeleton />
      ) : list === 'failed' ? (
        <p className={styles.muted}>{t('This did not load. Try again in a moment.')}</p>
      ) : list.length === 0 ? (
        <p className={styles.muted}>{t('Quiet this month. Invite a friend and their medals land here.')}</p>
      ) : (
        <div className={styles.cards}>
          {list.map((e) => (
            <Fragment key={'note' in e ? `n${e.note.id}` : `m${e.medal.handle}-${e.medal.code}`}>{'note' in e ? <NoteCard n={e.note} me={me} /> : <MedalCard f={e.medal} me={me} />}</Fragment>
          ))}
        </div>
      )}
      {myHandle && <InviteFriend handle={myHandle} />}
    </section>
  );
}

/** Invite a friend (design/canvas/PeoplePhone.dc.html): a link to your page. When they join, you play as friends. */
function InviteFriend({ handle }: { handle: string }) {
  const [copied, setCopied] = useState(false);
  const link = `${window.location.origin}/u/${handle}`;
  return (
    <section className={styles.invite} aria-labelledby="invite-title">
      <h2 id="invite-title" className={styles.feedTitle}>
        {t('Invite a friend')}
      </h2>
      <p className={styles.muted}>{t('Send someone you know a link. When they join, you play as friends.')}</p>
      <button type="button" className={styles.inviteButton} onClick={() => void copyText(link).then((ok) => setCopied(ok))}>
        {copied ? t('Link copied') : t('Copy your link')}
      </button>
    </section>
  );
}
