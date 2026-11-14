import type { ReactNode } from 'react';
import type { Moment } from '../engine/partners';
import { Partner } from './Partner';
import styles from './PartnerSays.module.css';

/** The partner and its speech bubble (design/V3_STYLE.md, Words): one per screen, saying what just happened or what to do. */
export function PartnerSays({ children, moment = 'hello', size = 80, id }: { children: ReactNode; moment?: Moment; size?: number; id?: string }) {
  return (
    <div className={styles.row}>
      <Partner moment={moment} size={size} className={styles.face} />
      <p id={id} className={styles.bubble} role="status">
        {children}
      </p>
    </div>
  );
}
