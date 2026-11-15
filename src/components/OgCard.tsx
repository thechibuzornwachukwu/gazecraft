import type { CSSProperties } from 'react';
import { partnerSrc } from '../engine/partners';
import { buildHiddenWords } from '../engine/hiddenWords';
import { baseCategory, caseIcon, teaserOf, type Piece } from '../games/cases';
import { t } from '../i18n';
import { packHue } from '../lib/packHue';
import { DEMOS } from '../routes/landingDemos';
import { Logo } from './Logo';
import styles from './OgCard.module.css';

export type OgInput =
  | { kind: 'default' }
  | {
      kind: 'game';
      title: string;
      noun: string;
      text: string;
      dict: readonly string[];
      /** The English category: the pack's colour and icon. */
      category: string;
      daily?: boolean;
      /** "With NAME" on a sponsored puzzle. */
      sponsor?: string;
    };

/**
 * The link preview, 1200x630, drawn as the game looks (design/V3_STYLE.md): a case card in the pack's colour with a
 * real sentence of the puzzle, and the partner saying what is in it. What makes a person tap is the trick itself,
 * so one hidden word is lit, as the case cards on Puzzles do; the rest stay hidden. A daily lights nothing and
 * gives no count: it is a race.
 * The words sit inside the middle of the image, so a square crop in a chat app keeps the sentence and the bubble.
 */
export function OgCard({ input }: { input: OgInput }) {
  if (input.kind === 'default') {
    const demo = DEMOS.en;
    const p = buildHiddenWords({ text: demo.text, dict: demo.words.map((w) => w.word) });
    const { pieces, word } = teaserOf(p);
    return (
      <Frame
        hue={packHue('general')}
        icon={caseIcon('General')}
        title={t('Words are hiding in this sentence.')}
        line=""
        pieces={pieces}
        say={t('{word} is in there. Can you find {n} more?', { word, n: p.answers.length - 1 })}
      />
    );
  }

  const p = buildHiddenWords({ text: input.text, dict: input.dict });
  const teaser = teaserOf(p);
  // A daily shows its sentence but never which word is in it.
  const pieces: Piece[] = input.daily ? [{ text: teaser.pieces.map((x) => x.text).join(''), hit: false }] : teaser.pieces;
  return (
    <Frame
      hue={packHue(baseCategory(input.category))}
      icon={caseIcon(input.category)}
      title={input.title}
      line={input.daily ? t("Today's puzzle") : t('Find {n} {noun}', { n: p.answers.length, noun: input.noun })}
      pieces={pieces}
      say={input.daily ? t('A new one every day. How many can you find?') : t('{word} is in there. Can you find {n} more?', { word: teaser.word, n: p.answers.length - 1 })}
      sponsor={input.sponsor}
    />
  );
}

function Frame({ hue, icon, title, line, pieces, say, sponsor }: { hue: string; icon: string; title: string; line: string; pieces: readonly Piece[]; say: string; sponsor?: string }) {
  return (
    <div className={styles.og} data-theme="light" data-og="" style={{ '--pack': hue } as CSSProperties}>
      <article className={styles.card}>
        <div className={styles.band}>
          <img src={icon} alt="" width={64} height={64} />
          <div className={styles.bandText}>
            <span className={styles.title}>{title}</span>
            {line && <span className={styles.line}>{line}</span>}
          </div>
        </div>
        <p className={styles.sentence}>
          {pieces.map((x, i) =>
            x.hit ? (
              <mark key={i} className={styles.hit}>
                {x.text}
              </mark>
            ) : (
              <span key={i}>{x.text}</span>
            ),
          )}
        </p>
        {sponsor && <span className={styles.with}>{sponsor}</span>}
      </article>
      <div className={styles.pet}>
        <p className={styles.bubble}>{say}</p>
        <img className={styles.mochi} src={partnerSrc('cat', 'hello')} alt="" width={220} height={220} />
      </div>
      <div className={styles.brand}>
        <Logo height={30} />
        <span className={styles.url}>fignda.pages.dev</span>
      </div>
    </div>
  );
}
