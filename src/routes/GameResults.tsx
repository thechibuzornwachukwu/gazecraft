import { useState, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowRight, ChevronDown, ChevronUp, Copy, Share2 } from 'lucide-react';
import { Button } from '../components/Button';
import { Icon } from '../components/Icon';
import { Partner } from '../components/Partner';
import { clampStars, Stars } from '../components/Stars';
import { formatTime } from '../engine/time';
import { t, num } from '../i18n';
import styles from './GameResults.module.css';

type Props = {
  title: string;
  line: string;
  score: number;
  found: number;
  total: number;
  secs: number;
  canReplay: boolean;
  onReplay: () => void;
  onShare: () => void;
  /** Copies or shares the text result. Resolves to the line to show ("Copied."). */
  onText: () => Promise<string>;
  /** A sitting: where the next one is. It leads the actions and takes the accent from Share. */
  next?: { to: string; label: string };
  /** Where this game's board lives, if it has one. */
  boardPath?: string;
  guest: boolean;
  /** For a guest, in place of the plain ask: where their run lives. */
  guestLine?: string;
  /** What the guest's link says, in place of "Keep this score": after a first result, the way to their detective and partner. */
  guestAction?: string;
  /** Stars for a catalogue puzzle played alone. 0 or missing: no stars shown. */
  stars?: number;
  /** Said beside the stars when this play raised them. */
  starsUp?: string;
  /** Skill lines, rarest first: clean read, no-hint perfect, deep find, long word. The caller sends 2 at most. */
  skills?: readonly string[];
  /** One line per personal record this play beat. */
  records?: readonly string[];
  /** A sponsored puzzle: "With NAME" and, when there is one, the sponsor's link and its site name. */
  sponsor?: { line: string; url?: string; host?: string; /** The link was opened. */ onVisit?: () => void };
  /** Extra actions under the result (the reminder ask). */
  children?: ReactNode;
};

/** Lines worth a paragraph: no blanks, none twice. */
const lines = (l?: readonly string[]) => [...new Set((l ?? []).filter((x) => typeof x === 'string' && x.trim() !== ''))];

export function GameResults({ title, line, score, found, total, secs, canReplay, onReplay, onShare, onText, next, boardPath, guest, guestLine, guestAction, stars, starsUp, skills, records, sponsor, children }: Props) {
  const { pathname } = useLocation();
  const [note, setNote] = useState('');
  const [more, setMore] = useState(false);
  const earned = clampStars(stars);
  return (
    <section className={styles.results} aria-labelledby="results-title">
      <div className={styles.head}>
        <div className={styles.titleRow}>
          {/* The partner at the end of a game: pleased, and more so when every word was found. */}
          <Partner moment={total > 0 && found === total ? 'found' : 'done'} size={56} />
          <h2 id="results-title" className={styles.title}>
            {title}
          </h2>
        </div>
        {line && <p className={styles.line}>{line}</p>}
        {earned > 0 && (
          <p className={styles.stars}>
            <Stars value={earned} size={20} pop={!!starsUp} />
            {starsUp && <span>{starsUp}</span>}
          </p>
        )}
        {sponsor?.line && (
          <p className={styles.with}>
            {sponsor.line}
            {sponsor.url && sponsor.host && (
              <>
                {' · '}
                <a href={sponsor.url} target="_blank" rel="sponsored noopener" className={styles.board} onClick={sponsor.onVisit} onAuxClick={sponsor.onVisit}>
                  {sponsor.host}
                </a>
              </>
            )}
          </p>
        )}
      </div>
      {/* 2 buttons: the way on, and one other. One accent a screen: on a sitting it is the way on, so Share steps back. */}
      <div className={styles.actions}>
        {next ? (
          <>
            <Button variant="accent" to={next.to}>
              {next.label}
              <Icon icon={ArrowRight} size={16} />
            </Button>
            {/* Beside the way on, sharing is an icon: one thing to read, one thing to tap. */}
            <Button variant="secondary" onClick={onShare} aria-label={t('Share')} title={t('Share')}>
              <Icon icon={Share2} size={18} />
            </Button>
          </>
        ) : (
          <>
            <Button variant="accent" size="icon" onClick={onShare} aria-label={t('Share')}>
              <Icon icon={Share2} size={20} />
            </Button>
            <Button variant="secondary" to="/play">
              {t('Packs')}
            </Button>
          </>
        )}
      </div>
      {/* Everything else about this play is one tap away, and never in the way of the next thing. */}
      <button type="button" className={styles.moreToggle} aria-expanded={more} aria-controls="results-more" onClick={() => setMore((m) => !m)}>
        {more ? t('Less') : t('More')}
        <Icon icon={more ? ChevronUp : ChevronDown} size={16} />
      </button>
      {more && (
        <div id="results-more" className={styles.more}>
          <dl className={styles.stats}>
            <div className={styles.stat}>
              <dt className={styles.statLabel}>{t('Score')}</dt>
              <dd className={styles.statValue}>{num(score)}</dd>
            </div>
            <div className={styles.stat}>
              <dt className={styles.statLabel}>{t('Found')}</dt>
              <dd className={styles.statValue}>
                {found}/{total}
              </dd>
            </div>
            <div className={styles.stat}>
              <dt className={styles.statLabel}>{t('Time')}</dt>
              <dd className={styles.statValue}>{formatTime(secs)}</dd>
            </div>
          </dl>
          {lines([...(skills ?? []), ...(records ?? [])]).map((l) => (
            <p key={l} className={styles.streak}>
              {l}
            </p>
          ))}
          <div className={styles.actions}>
            {canReplay && (
              <Button variant="secondary" onClick={onReplay}>
                {t('Play again')}
              </Button>
            )}
            <Button variant="secondary" size="icon" onClick={() => void onText().then(setNote)} aria-label={t('Copy result')}>
              <Icon icon={Copy} size={20} />
            </Button>
            {boardPath && (
              <Button variant="secondary" to={boardPath}>
                {t('See the leaderboard')}
              </Button>
            )}
            {next && (
              <Button variant="secondary" to="/play">
                {t('Packs')}
              </Button>
            )}
          </div>
        </div>
      )}
      <p className={styles.note} role="status">
        {note}
      </p>
      {children}
      {guest && (
        <div className={styles.guest}>
          <span className={styles.guestText}>
            {guestLine || t('Sign in to keep this score on every device.')}
          </span>
          {/* The first time sign in is offered (SPEC section 6, The first minute). /welcome sends an existing player straight on. */}
          <Link className={styles.signin} to={`/welcome?from=${encodeURIComponent(pathname)}`}>
            {guestAction || t('Sign in')}
          </Link>
        </div>
      )}
    </section>
  );
}
