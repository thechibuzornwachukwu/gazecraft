import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { PartnerNote } from '../components/PartnerNote';
import { SkeletonList } from '../components/Skeleton';
import { TextLink } from '../components/TextLink';
import { t, plural } from '../i18n';
import { TopicIcon } from '../components/TopicIcon';
import { fetchPublicPuzzles, type PublicPuzzle } from '../lib/api';
import styles from './Make.module.css';

/** /made (BUILD_PLAN set 9): puzzles players made and published, most liked first. Open to everyone. */
export function Made() {
  const [list, setList] = useState<PublicPuzzle[] | null | 'failed'>(null);
  useEffect(() => {
    let alive = true;
    fetchPublicPuzzles()
      .then((r) => alive && setList(r))
      .catch(() => alive && setList('failed'));
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className={styles.page}>
      <PageHeader title={t('Made by players')} action={<TextLink to="/make">{t('Make one')}</TextLink>} />
      {list == null ? (
        <SkeletonList rows={6} />
      ) : list === 'failed' ? (
        <PartnerNote moment="error" layout="screen">
          <p>{t('This did not load. Try again in a moment.')}</p>
        </PartnerNote>
      ) : list.length === 0 ? (
        <PartnerNote layout="screen" title={t('Nothing here yet')}>
          <p>{t('Puzzles players make show here once they are published.')}</p>
        </PartnerNote>
      ) : (
        <ul className={styles.list} aria-label={t('Made by players')} data-made>
          {list.map((p) => (
            <li key={p.code}>
              <Link to={`/p/${p.code}`} className={styles.item}>
                <span className={styles.itemTitle}>
                  <TopicIcon name={p.icon} size={16} />
                  {p.title}
                </span>
                <span className={styles.itemMeta}>
                  {t('@{maker} · {words} words · {plays} · {ups} liked it', { maker: p.maker, words: p.words, plays: plural(p.plays, '{n} play', '{n} plays'), ups: p.ups })}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
