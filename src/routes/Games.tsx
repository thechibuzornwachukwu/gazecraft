import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UsersRound } from 'lucide-react';
import { CaseDeck } from '../components/CaseDeck';
import { Dialog } from '../components/Dialog';
import { Icon } from '../components/Icon';
import { Partner } from '../components/Partner';
import { Ring } from '../components/Ring';
import { clampStars } from '../components/starsLabel';
import { pick } from '../copy';
import { nextAt, partnerName, PARTNERS } from '../engine/partners';
import { caseFiles, type CaseFile } from '../games/cases';
import { doneClues } from '../games/path';
import { t, num, plural } from '../i18n';
import { useAuth } from '../lib/auth';
import { useMediaQuery } from '../lib/media';
import { packHue } from '../lib/packHue';
import { usePartner } from '../lib/partner';
import { PROGRESS_EVENT } from '../lib/progress';
import { newRoomCode } from '../lib/room';
import { loadStars } from '../lib/starStore';
import { useStreak, type Streak } from '../lib/useStreak';
import { useUnlocks } from '../lib/useUnlocks';
import { TextLink } from '../components/TextLink';
import { GameInvites } from './GameInvites';
import styles from './Games.module.css';

/** The last 7 days as a ring, the run, and the days played this month. Shown on You once there is a day to count. */
/** `best`: the best week's points (from the account), shown when there is one. */
export function Week({ run, best = 0 }: { run: Streak; best?: number }) {
  const days = run.week.filter((d) => d === 'done').length;
  const weekLine = useMemo(() => pick('weekDays', { n: days }), [days]);
  const runLine = useMemo(() => pick('runMonth', { n: run.streak, m: run.month }), [run.streak, run.month]);
  if (!run.played) return null;
  return (
    <div className={styles.week}>
      {/* The line beside it says the same thing, so the ring is not read out twice. */}
      <span aria-hidden="true">
        <Ring parts={run.week} label={weekLine} size={40} />
      </span>
      <p className={styles.weekText}>
        <span className={styles.weekLine}>{weekLine}</span>
        <span className={styles.dailySub}>{runLine}</span>
        {best > 0 && <span className={styles.dailySub} data-best-week>{t('Best week: {points} points.', { points: num(best) })}</span>}
      </p>
    </div>
  );
}

/** Every case, read again when the account brings clues done on another device. */
function useCases(): CaseFile[] {
  const [rev, setRev] = useState(0);
  useEffect(() => {
    const on = () => setRev((v) => v + 1);
    window.addEventListener(PROGRESS_EVENT, on);
    return () => window.removeEventListener(PROGRESS_EVENT, on);
  }, []);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- `rev` is the reason to read storage again
  return useMemo(() => caseFiles(doneClues()), [rev]);
}

/**
 * Puzzles (design/V3_STYLE.md): the partner says one thing, the cases are a deck to swipe, every pack is on the
 * All cases shelf, and the team shows who joins next. A new player gets the partner's hello and the first new case.
 */
export function Games() {
  const auth = useAuth();
  const run = useStreak();
  const open = useUnlocks(run.played);
  const navigate = useNavigate();
  const all = useCases();
  const wide = useMediaQuery('(min-width: 960px)');
  const [shelf, setShelf] = useState(false);
  const [passed, setPassed] = useState(false);
  const pet = usePartner();
  const stars = useMemo(() => Object.values(loadStars()).reduce<number>((n, s) => n + clampStars(s), 0), []);

  // The deck is what is left to do; once every case is closed, it is all of them again.
  const deck = useMemo(() => {
    const left = all.filter((c) => c.state !== 'closed');
    return left.length ? left : all;
  }, [all]);
  const first = deck[0];
  const name = partnerName(pet.current);
  const say = passed
    ? t('No problem. How about this one?')
    : first?.state === 'going'
      ? t('Welcome back! {title} is waiting. Swipe right to go on.', { title: first.title })
      : all.length > 0 && all.every((c) => c.state === 'closed')
        ? t('Every case is closed. Play any of them again.')
        : t('Hi, detective! I am {pet}. Swipe right on a case you like.', { pet: name });

  const together = (c: CaseFile) => navigate(`/play/${c.id}?room=${newRoomCode()}`);
  const shelfList = <Shelf cases={all} onPick={() => setShelf(false)} />;

  return (
    <div className={styles.screen}>
      <h1 className={styles.hidden}>{t('Puzzles')}</h1>
      <GameInvites />

      <div className={styles.main}>
        {(run.streak > 0 || stars > 0) && (
          <div className={styles.chips}>
            {run.streak > 0 && (
              <span className={styles.chip} aria-label={plural(run.streak, '{n} day in a row', '{n} days in a row')}>
                <img className={styles.flame} src="/icons/fluent/fire.webp" alt="" width={26} height={26} />
                {num(run.streak)}
              </span>
            )}
            {stars > 0 && (
              <span className={styles.chip} aria-label={plural(stars, '{n} star', '{n} stars')}>
                <img className={styles.twinkle} src="/icons/fluent/star.webp" alt="" width={24} height={24} />
                {num(stars)}
              </span>
            )}
          </div>
        )}

        <section className={styles.pet} aria-label={name}>
          <Partner moment={passed ? 'empty' : 'hello'} size={96} className={styles.bob} />
          <p role="status" key={say} className={styles.say}>
            {say}
          </p>
        </section>

        <section className={styles.cases} aria-label={t('Cases')}>
          <CaseDeck
            cases={deck}
            onPlay={(c) => navigate(c.to)}
            onLater={() => setPassed(true)}
            extra={
              first && (
                <button type="button" className={styles.friend} onClick={() => together(deck[0]!)} aria-label={t('Play with a friend')}>
                  <Icon icon={UsersRound} size="em" />
                </button>
              )
            }
          />
          {!wide && (
            <button type="button" className={styles.allButton} onClick={() => setShelf(true)}>
              {t('All {n} cases', { n: all.length })}
            </button>
          )}
        </section>

        <Team points={pet.points} owned={pet.owned} next={nextAt(pet)} />

        {auth.enabled && open.make && (
          <p className={styles.more}>
            <TextLink to="/make">{t('Make a puzzle')}</TextLink>
            <TextLink to="/made">{t('Made by players')}</TextLink>
          </p>
        )}
      </div>

      {wide ? (
        <aside className={styles.side} aria-labelledby="shelf-title">
          <h2 id="shelf-title" className={styles.shelfTitle}>
            {t('All cases')}
          </h2>
          {shelfList}
        </aside>
      ) : (
        <Dialog open={shelf} onClose={() => setShelf(false)} label={t('All cases')}>
          <div className={styles.sheetHead}>
            <h2 className={styles.shelfTitle}>{t('All cases')}</h2>
            <button type="button" className={styles.close} onClick={() => setShelf(false)}>
              {t('Close')}
            </button>
          </div>
          {shelfList}
        </Dialog>
      )}
    </div>
  );
}

/** Every pack, so none is out of reach: a tile each, in its colour, with how far along it is. */
function Shelf({ cases, onPick }: { cases: readonly CaseFile[]; onPick: () => void }) {
  return (
    <ul className={styles.shelf} aria-label={t('All cases')}>
      {cases.map((c) => (
        <li key={c.id}>
          <Link to={c.to} className={styles.tile} data-case data-state={c.state} style={{ '--pack': packHue(c.categoryKey) } as CSSProperties} onClick={onPick}>
            <span className={styles.tileTitle}>{c.title}</span>
            <span className={styles.tileMeta}>
              {c.category} · {c.state === 'closed' ? t('Case closed') : t('{done} of {total} done', { done: c.done, total: c.total })}
            </span>
            {c.sponsor && (
              <span className={styles.tileMeta} data-case-sponsor>
                {pick('sponsorWith', { name: c.sponsor })}
              </span>
            )}
          </Link>
        </li>
      ))}
    </ul>
  );
}

/** The team and the next pet to join: one panel. It leads to You, where pets are chosen. */
function Team({ points, owned, next }: { points: number; owned: readonly string[]; next: number | null }) {
  const locked = PARTNERS.filter((p) => !owned.includes(p.id));
  const ready = next != null && points >= next;
  const line =
    next == null
      ? t('Every pet is on the team.')
      : ready
        ? t('A new pet is ready. Choose who.')
        : points > 0
          ? t('A new pet joins you at {n} points. You choose who.', { n: num(next) })
          : t('Find words to earn points. At {n} a new pet joins you.', { n: num(next) });
  return (
    <section className={styles.team} aria-labelledby="team-title">
      <h2 id="team-title" className={styles.teamTitle}>
        {t('Team')}
      </h2>
      <Link to="/me" className={styles.pets} aria-label={t('Change your look and your pet')}>
        {owned.map((id) => (
          <Partner key={id} who={id as (typeof PARTNERS)[number]['id']} moment="done" size={66} className={styles.cheer} />
        ))}
        {locked.map((p) => (
          <span key={p.id} className={styles.lockedPet} aria-hidden="true">
            ?
          </span>
        ))}
      </Link>
      <p className={styles.teamLine}>{line}</p>
      {next != null && !ready && (
        <div className={styles.meter}>
          <div
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={next}
            aria-valuenow={Math.min(points, next)}
            aria-label={t('{points} / {n} points', { points: num(points), n: num(next) })}
            className={styles.bar}
          >
            <span style={{ width: `${Math.min(100, (points / next) * 100)}%` }} />
          </div>
          <span className={styles.meterText}>{t('{points} / {n} points', { points: num(points), n: num(next) })}</span>
        </div>
      )}
    </section>
  );
}
