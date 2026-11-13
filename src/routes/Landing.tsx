import { useState } from 'react';
import { Button } from '../components/Button';
import { GameRow } from '../components/GameRow';
import { TextLink } from '../components/TextLink';
import { pick } from '../copy';
import { getPuzzle, sponsorFor } from '../games/catalog';
import { playNext } from '../lib/playNext';
import { hasPlayed } from '../lib/firstMinute';
import { t, plural } from '../i18n';
import { LandingDemo } from './LandingDemo';
import styles from './Landing.module.css';
import { difficultyName } from '../i18n/gameNames';

/** Landing list: a friendly name per curated game. Counts and levels come from the engine. */
const PICKS = [
  ['general', t('General knowledge')],
  ['science', t('Science')],
  ['football', t('Football')],
  ['nigeria', t('Nigerian names')],
  ['french', t('French names')],
  ['health', t('Medicine and nursing')],
  ['ai', t('AI')],
  ['history', t('History')],
  ['bible', t('Books of the Bible')],
] as const;

/** Play first: the page is the demo, then the topics. */
export function Landing() {
  // Decided once, when the page opens, so finishing the demo does not move the page under the player.
  const [fresh] = useState(() => !hasPlayed());
  const [play] = useState(playNext);
  return (
    <>
      <section id="how" className={styles.hero} aria-labelledby="hero-title">
        <div className={`${styles.wrap} ${styles.stack}`}>
          <h1 id="hero-title" className={styles.display}>
            {t('Words are hiding in this sentence.')}
          </h1>
          <LandingDemo guide={fresh} />
          <div className={styles.actions}>
            <Button to={play.to}>{play.kind === 'clue' ? (fresh ? t('Play your first puzzle') : t('Play the next puzzle')) : t('See your packs')}</Button>
          </div>
        </div>
      </section>

      <section id="games" className={styles.band} aria-labelledby="games-title">
        <div className={`${styles.wrap} ${styles.columns}`}>
          <div className={styles.side}>
            <h2 id="games-title" className={styles.h2}>
              {t('Pick a topic')}
            </h2>
            <TextLink to="/make">{t('Or make your own')}</TextLink>
          </div>
          <ul className={styles.games}>
            {PICKS.map(([id, name]) => {
              const p = getPuzzle(id)!;
              const sponsor = sponsorFor(p);
              return (
                <GameRow
                  key={id}
                  size="md"
                  to={`/play/${id}`}
                  title={name}
                  meta={`${plural(p.answers.length, '{n} word', '{n} words')} · ${difficultyName(p.difficulty)}`}
                  sponsor={sponsor ? pick('sponsorWith', { name: sponsor.name }) : undefined}
                />
              );
            })}
          </ul>
        </div>
      </section>
    </>
  );
}
