export type ScoreInput = {
  found: number;
  total: number;
  hints: number;
  /** Wrong picks. Count only on the daily. */
  misses: number;
  secs: number;
};

/** Points per word found, the cost of a tip-off, the cost of a scored wrong pick, and the most a fast finish adds. */
export const FIND_POINTS = 100;
export const TIP_OFF_COST = 25;
export const MISS_COST = 10;
export const TIME_BONUS = 600;

/** FIND_POINTS per find, less TIP_OFF_COST per hint and MISS_COST per scored miss, plus TIME_BONUS less the seconds when all are found. Floor 0. */
export function score({ found, total, hints, misses, secs }: ScoreInput): number {
  return Math.max(
    0,
    found * FIND_POINTS - hints * TIP_OFF_COST - misses * MISS_COST + (found === total ? Math.max(0, TIME_BONUS - secs) : 0),
  );
}

/** One line of how a score was made, for the result's case file: "4 found +400", "Time bonus +472". */
export type ScoreLine = { kind: 'found' | 'tipoffs' | 'misses' | 'bonus'; n: number; points: number };

/** The same sum as `score`, line by line. Lines worth nothing are left out. */
export function scoreLines({ found, total, hints, misses, secs }: ScoreInput): ScoreLine[] {
  const bonus = found === total ? Math.max(0, TIME_BONUS - secs) : 0;
  const lines: ScoreLine[] = [
    { kind: 'found', n: found, points: found * FIND_POINTS },
    { kind: 'tipoffs', n: hints, points: -hints * TIP_OFF_COST },
    { kind: 'misses', n: misses, points: -misses * MISS_COST },
    { kind: 'bonus', n: 1, points: bonus },
  ];
  return lines.filter((l) => l.points !== 0);
}
