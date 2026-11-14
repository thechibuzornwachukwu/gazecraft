import { useMemo, useState, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '../components/Button';
import { Icon } from '../components/Icon';
import { pick } from '../copy';
import { caseFiles, type CaseFile } from '../games/cases';
import { hasPlayed } from '../lib/firstMinute';
import { packHue } from '../lib/packHue';
import { playNext } from '../lib/playNext';
import { t, plural } from '../i18n';
import { LandingDemo } from './LandingDemo';
import styles from './Landing.module.css';

/** How many cases the home page shows: one per topic, so the range shows. Every one is on Puzzles. */
const SHOWN = 6;

function oneEach(): CaseFile[] {
  const seen = new Set<string>();
  return caseFiles([]).filter((c) => !seen.has(c.categoryKey) && seen.add(c.categoryKey)).slice(0, SHOWN);
}

/** Play first: the page is the demo with the partner beside it, then the cases waiting. */
export function Landing() {
  // Decided once, when the page opens, so finishing the demo does not move the page under the player.
  const [fresh] = useState(() => !hasPlayed());
  const [play] = useState(playNext);
  const cases = useMemo(() => oneEach(), []);
  return (
    <>
      <section id="how" className={styles.hero} aria-labelledby="hero-title">
        <div className={`${styles.wrap} ${styles.stack}`}>
          <h1 id="hero-title" className={styles.display}>
            {t('Words are hiding in this sentence.')}
          </h1>
          <LandingDemo guide={fresh} />
          <div className={styles.actions}>
            <Button variant="accent" size="touch" to={play.to} className={styles.go}>
              {fresh ? t('Start playing') : play.kind === 'clue' ? t('Play the next puzzle') : t('See your packs')}
              <Icon icon={ArrowRight} size={20} />
            </Button>
          </div>
        </div>
      </section>

      <section id="games" className={styles.band} aria-labelledby="games-title">
        <div className={`${styles.wrap} ${styles.stack}`}>
          <h2 id="games-title" className={styles.h2}>
            {t('Cases waiting')}
          </h2>
          <ul className={styles.cases}>
            {cases.map((c) => (
              <li key={c.id}>
                <Link to={c.to} className={styles.case} data-case style={{ '--pack': packHue(c.categoryKey) } as CSSProperties}>
                  <span className={styles.icon}>
                    <img src={c.icon} alt="" width={40} height={40} />
                  </span>
                  <span className={styles.caseText}>
                    <span className={styles.caseTitle}>{c.title}</span>
                    <span className={styles.caseMeta}>
                      {plural(c.total, '{n} puzzle', '{n} puzzles')} · {c.category}
                    </span>
                    {c.sponsor && <span className={styles.caseMeta}>{pick('sponsorWith', { name: c.sponsor })}</span>}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <Link to="/play" className={styles.all}>
            {t('All {n} cases', { n: caseFiles([]).length })}
          </Link>
        </div>
      </section>
    </>
  );
}
