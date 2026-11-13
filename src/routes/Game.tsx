import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, UsersRound } from 'lucide-react';
import { BigClock, Elapsed } from '../components/BigClock';
import { Icon } from '../components/Icon';
import { SkeletonPage } from '../components/Skeleton';
import { MobileBar } from '../components/MobileBar';
import { Ring } from '../components/Ring';
import { TextLink } from '../components/TextLink';
import { WordList, type WordListHandle, type WordRow } from '../components/WordList';
import { caseClues, getGameDef, getPassage, sponsorFor, type GameDef, type GameType, type Part } from '../games/catalog';
import { registry } from '../games/registry';
import { playFacts, recordLines, skillLines, starsUpLine } from '../games/resultLines';
import { isCleanRead, scoreOf, secondsOf, useGameSession, type Session } from '../games/session';
import { GuestWall } from '../components/GuestWall';
import { clueId, clueKind } from '../engine/journey';
import { ClueDone } from '../components/ClueDone';
import { Partner } from '../components/Partner';
import { HINT_OF } from '../engine/partners';
import { doneClues, nextClueTo } from '../games/path';
import { packHue } from '../lib/packHue';
import { countPuzzleToday } from '../lib/goal';
import { guestBlocked, markGuestPlayed, playKey } from '../lib/guestLimit';
import { loadPartner } from '../lib/partner';
import { countOf } from '../engine/specials';
import { starsFor } from '../engine/stars';
import { countEvent, fetchCustomGame, submitPlay } from '../lib/api';
import { guestAsk, guestKeepLabel, markRunTold, runTold } from '../lib/guestAsk';
import { useAuth } from '../lib/auth';
import { useCoarsePointer } from '../lib/media';
import { ShareSheet, type ShareGame } from '../components/ShareSheet';
import { copyText, sharePath, shareUrl } from '../lib/share';
import { readPast } from '../engine/reveal';
import { shareText, storyMarks } from '../engine/shareText';
import * as copy from '../copy';
import { mateSlots } from '../lib/mates';
import { joinRoom, newRoomCode, ROOM_RE, type Peer, type Room, type RoomStats, type RoomStatus } from '../lib/room';
import { Challenge } from './Challenge';
import { RoomBar } from './RoomBar';
import { RatePuzzle } from './RatePuzzle';
import { recordPlay } from '../lib/records';
import { markFinished } from '../lib/shelves';
import { record as recordSound } from '../lib/sound';
import { markPlayedToday } from '../lib/playDays';
import { recordStars } from '../lib/starStore';
import { useStreak } from '../lib/useStreak';
import { GameResults } from './GameResults';
import { GameReveal } from './GameReveal';
import { t, plural } from '../i18n';
import styles from './Game.module.css';
import { difficultyName, nameOf } from '../i18n/gameNames';

/** The clock, read when the player acts, never while drawing. */
const now = (): number => Date.now();

export function GameById() {
  const { id = '' } = useParams();
  const def = getGameDef(id);
  if (!def) return <Navigate to="/play" replace />;
  return <Gated key={id} def={def} />;
}

/** One sitting of a catalogue puzzle: `/play/bible/2`. A puzzle that is not cut, or has no such passage, opens whole. */
export function PassageById() {
  const { id = '', n = '' } = useParams();
  if (!getGameDef(id)) return <Navigate to="/play" replace />;
  const p = /^\d+$/.test(n) ? getPassage(id, Number(n)) : undefined;
  if (!p) return <Navigate to={`/play/${id}`} replace />;
  return <Gated key={`${id}~${p.part.n}`} def={p.def} part={p.part} />;
}

/** A custom game opened by its share code. */
export function GameByCode() {
  const { code = '' } = useParams();
  const [def, setDef] = useState<GameDef | null | undefined>(undefined);
  useEffect(() => {
    let alive = true;
    fetchCustomGame(code).then((g) => {
      if (!alive) return;
      setDef(
        g && {
          id: g.id,
          type: 'hidden-words',
          category: 'Player made',
          title: g.title,
          noun: g.noun,
          difficulty: 'Medium',
          expectedAnswers: [],
          dict: g.dict,
          text: g.text,
        },
      );
    });
    return () => {
      alive = false;
    };
  }, [code]);
  if (def === undefined) return <SkeletonPage rows={4} />;
  if (!def) return <Navigate to="/play" replace />;
  return <Gated key={def.id} def={def} />;
}

type ScreenProps = { def: GameDef; /** A sitting: `def` is the puzzle with one passage as its text. */ part?: Part };

/** A guest plays 2 games. A third asks them to sign in. A game they already played stays open. */
function Gated(props: ScreenProps) {
  const auth = useAuth();
  // Decided when the game opens, so the result of a guest's last game is never walled.
  const [blocked] = useState(() => guestBlocked(playKey(props.def.id, undefined, props.part?.n)));
  if (!auth.enabled || !blocked) return <GameScreen {...props} />;
  // Still finding out who this is: never wall someone who is signed in.
  if (auth.loading) return <SkeletonPage rows={4} />;
  return auth.session ? <GameScreen {...props} /> : <GuestWall />;
}

/** How each type is played, for a mouse and for a finger. */
const HOW: Record<GameType, readonly [string, string]> = {
  'hidden-words': [
    t('Drag across the letters. Answers can run across spaces and punctuation.'),
    t('Swipe across the letters. Or tap the first letter of a word, then the last.'),
  ],
  mirror: [t('These words read right to left. Drag across one from either end.'), t('These words read right to left. Swipe across one, or tap one end, then the other.')],
  'buried-sums': [
    t('Drag across digits in a row. A run is 2 or more digits that add up to the target.'),
    t('Swipe across digits in a row. Or tap the first digit of a run, then the last.'),
  ],
  series: [
    t('Drag across 3 or more digits in a row that step by the same amount: 1 3 5 7, or 9 6 3.'),
    t('Swipe across 3 or more digits that step by the same amount: 1 3 5 7, or 9 6 3. Or tap the first, then the last.'),
  ],
  relay: [
    t('Each chain is words in a row, every one starting on the last letter of the one before. Drag across a whole chain.'),
    t('Each chain is words in a row, every one starting on the last letter of the one before. Swipe across a whole chain.'),
  ],
  liar: [t('Some of these are false. Press Lie or True for each, or use the arrow keys. A second wrong call ends it.'), t('Some of these are false. Swipe a lie left and a truth right. A second wrong call ends it.')],
  groups: [t('These 16 are 4 sets of 4. Pick 4 that belong together, then check them. 4 wrong sets end it.'), t('These 16 are 4 sets of 4. Tap 4 that belong together, then check them. 4 wrong sets end it.')],
};

function GameScreen({ def, part }: ScreenProps) {
  const mod = registry[def.type];
  const puzzle = useMemo(() => mod.build(def), [mod, def]);
  // Words are what records and skill lines are about. A run of digits or a letter is not one.
  const wordy = def.type === 'hidden-words' || def.type === 'mirror';
  const listRef = useRef<WordListHandle>(null);
  const auth = useAuth();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  // What this browser keeps this game under: stars and the kept game. A sitting is its own game.
  const gameKey = clueId(def.id, part?.n ?? 0);
  const roomCode = !part ? (params.get('room') ?? '') : '';
  const inRoom = auth.enabled && ROOM_RE.test(roomCode);
  const roomRef = useRef<Room | null>(null);
  const [peers, setPeers] = useState<Peer[]>([]);
  const [roomStatus, setRoomStatus] = useState<RoomStatus>('connecting');
  const [roomId] = useState(() => crypto.randomUUID());
  const g = useGameSession({
    mod,
    puzzle,
    // Leaving keeps the game. A room game is kept under its room, so a dropped connection or a reload loses
    // nothing and your finds stay yours; its clock is the team's and runs on.
    resumeId: inRoom ? `room-${roomCode}-${def.id}` : gameKey,
    sharedClock: inRoom,
    hintKind: () => HINT_OF[loadPartner().current],
    beforeHit: (k) => listRef.current?.capture(k),
    onHit: (a, b) => roomRef.current?.sendFind(a, b),
    onStart: () => countEvent(def.id, 'start'),
    onFinish: (fs) => onFinish(fs),
  });
  const { s, foundSet, total, answers, finished } = g;
  const coarse = useCoarsePointer();
  const instructionId = useId();
  const signedIn = !!auth.profile;
  const [sharing, setSharing] = useState(false);
  const vs = params.get('vs');
  const challenge = auth.enabled && !part && vs && vs !== auth.profile?.handle ? vs : null;

  // Your line on the room scoreboard: your own finds (not teammates'), seconds per word, hints.
  const myFinds = s.found.filter((f) => !f.by).length;
  const pace = myFinds && s.lastFindAt ? Math.round((s.lastFindAt - s.startAt) / 1000 / myFinds) : 0;
  const myStats = useMemo<RoomStats>(() => ({ finds: myFinds, hints: s.hints, pace }), [myFinds, s.hints, pace]);
  const statsRef = useRef(myStats);
  useEffect(() => {
    statsRef.current = myStats;
    roomRef.current?.setStats(myStats);
  }, [myStats]);

  // Play together: join the room in the link. Finds go out as spans and come back through the engine.
  const gRef = useRef(g);
  useLayoutEffect(() => {
    gRef.current = g;
  });
  const myName = auth.profile?.name;
  const myHandle = auth.profile?.handle;
  useEffect(() => {
    if (!inRoom) return;
    let alive = true;
    const syncOut = () => {
      const spans = gRef.current.s.found.map((f) => f.span);
      if (spans.length) roomRef.current?.sendSync(spans);
    };
    const me: Peer = { id: roomId, name: myName ?? t('A friend'), handle: myHandle, partner: loadPartner().current };
    void joinRoom(roomCode, me, {
      onFind: (a, b, from) => gRef.current.teamPick(a, b, from.name),
      onPeers: (p) => alive && setPeers(p),
      onJoin: (who) => {
        gRef.current.say(copy.pick('teamJoined', { name: who.name }));
        syncOut();
      },
      onAsk: syncOut,
      onStatus: (st) => alive && setRoomStatus(st),
    }).then((r) => {
      if (!alive) return r?.leave();
      roomRef.current = r;
      r?.setStats(statsRef.current);
    });
    // Phones drop the connection in the background (sharing the invite in WhatsApp does it). Coming back asks
    // everyone for their finds, and every few seconds each player resends theirs, so boards always converge.
    const back = () => {
      const hidden = document.visibilityState === 'hidden';
      roomRef.current?.setAway(hidden);
      if (!hidden) roomRef.current?.ask();
    };
    document.addEventListener('visibilitychange', back);
    window.addEventListener('online', back);
    const resend = window.setInterval(syncOut, 8000);
    return () => {
      alive = false;
      document.removeEventListener('visibilitychange', back);
      window.removeEventListener('online', back);
      window.clearInterval(resend);
      roomRef.current?.leave();
      roomRef.current = null;
      setPeers([]);
    };
  }, [inRoom, roomCode, roomId, myName, myHandle]);

  // Signed in: send the play log once per finished game. The Worker replays it and stores a verified score.
  const sent = useRef<number | null>(null);
  useEffect(() => {
    // A sitting is sent as a clue of its case: checked and kept on the account, on no board.
    if (!finished || !signedIn || s.endAt == null || sent.current === s.startAt) return;
    // A result opened again was sent when it was earned.
    if (s.sent) return;
    sent.current = s.startAt;
    gRef.current.markSent();
    const log = s.log ?? { events: [], hints: [] };
    void submitPlay({
      game: part ? { type: 'game', id: def.id, clue: part.n } : { type: 'game', id: def.id },
      log: { events: log.events, hints: log.hints, finish: Math.max(1, s.endAt - s.startAt) },
      // In a room the log holds only your own picks. The server replays it for the Together board and never
      // for the solo boards: a teammate's find is not yours to score.
      ...(inRoom ? { room: roomCode } : {}),
    });
  }, [part, finished, signedIn, inRoom, roomCode, s.endAt, s.startAt, s.log, s.sent, def.id]);

  const foundCount = s.found.length;
  // The clues of this case, for the row of marks at the top. Read once a visit: it does not change mid clue.
  const trail = useMemo(() => {
    if (!part) return [];
    const done = doneClues();
    return caseClues(def.id).map((n) => ({ n, kind: clueKind(n), state: n === part.n ? 'here' : done.has(clueId(def.id, n)) || done.has(def.id) ? 'done' : 'todo' }));
  }, [def.id, part]);
  // The pet plays along: glad at a find, thrown by a wrong pick, thinking after a hint, calm until then.
  const tally = `${s.found.length}/${s.wrongs}/${s.hints}`;
  const [seen, setSeen] = useState({ tally, found: s.found.length, wrongs: s.wrongs, hints: s.hints, mood: 'empty' as 'empty' | 'found' | 'error' | 'loading' });
  if (seen.tally !== tally) {
    const mood = s.found.length > seen.found ? 'found' : s.wrongs > seen.wrongs ? 'error' : s.hints > seen.hints ? 'loading' : 'empty';
    setSeen({ tally, found: s.found.length, wrongs: s.wrongs, hints: s.hints, mood });
  }
  const pet = finished ? null : <Partner moment={seen.mood} size={32} className={styles.pet} />;
  const count = `${foundCount} / ${total}`;
  const progress = total ? foundCount / total : 0;

  // Pack shelves: a catalogue puzzle played to the end with at least 1 find is finished in this browser.
  const inCatalogue = !part && !!getGameDef(def.id);
  // Played to the end means at least half found: a game given up with less is not finished (src/engine/stars.ts).
  const earnedEnd = finished && starsFor({ finished, found: foundCount, total, hints: 0, wrongs: 0 }) > 0;
  useEffect(() => {
    if (earnedEnd && inCatalogue) markFinished(def.id);
  }, [earnedEnd, inCatalogue, def.id]);

  // The moment a game ends, once: stars for a catalogue puzzle played alone, then personal records.
  // Both live in this browser.
  const starred = (inCatalogue || !!part) && !inRoom;
  const [end, setEnd] = useState<{ at: number; starsUp: boolean; records: string[] } | null>(null);
  // The popup for a clue done: open for the finish itself, never for a result opened again.
  const [popup, setPopup] = useState<number | null>(null);
  function onFinish(fs: Session) {
    // A guest's games are counted: 2, then they are asked to sign in.
    if (!signedIn) markGuestPlayed(playKey(def.id, undefined, part?.n));
    const mine = fs.found.filter((f) => !f.by);
    const stars = starsFor({ finished: true, found: fs.found.length, total, hints: fs.hints, wrongs: fs.wrongs, byOthers: mine.length !== fs.found.length });
    // The run counts a day on which a clue was finished, with at least half found. A game given up counts nothing.
    if (stars > 0) {
      markPlayedToday();
      countPuzzleToday();
    }
    // Counted for everyone, guests too: a game played to the end is one with at least 1 word found.
    if (fs.found.length > 0) countEvent(def.id, 'end');
    if (total > 0 && fs.found.length === total) countEvent(def.id, 'full');
    const cleanRead = isCleanRead(fs, total);
    const starsUp = starred && recordStars(gameKey, stars);
    const broke = recordPlay({
      pack: inCatalogue ? def.category : null,
      // A sitting is a few words: its time is no record for the pack.
      cleanSecs: cleanRead && !part ? secondsOf(fs, fs.endAt ?? now()) : null,
      dailyFound: null,
      longest: wordy ? playFacts(puzzle, fs.found, fs.wrongs, fs.hints).longest : null,
    });
    // A clue done gets its moment: a popup with what was won and the way on.
    if (part && !inRoom && stars > 0) setPopup(fs.startAt);
    if (broke.length) recordSound();
    setEnd({ at: fs.startAt, starsUp, records: recordLines(broke, copy.pick) });
  }
  const ended = end && end.at === s.startAt ? end : null;

  const foundSpans = useMemo(() => s.found.map((f) => f.span), [s.found]);
  // In a room, each teammate's finds in their own colour, in the order they came in; yours stay lime.
  const mates = useMemo(() => mateSlots([...peers.filter((p) => p.id !== roomId).map((p) => p.name), ...s.found.flatMap((f) => (f.by ? [f.by] : []))]), [peers, roomId, s.found]);
  const foundBy = useMemo(() => s.found.map((f) => (f.by ? (mates.get(f.by) ?? 1) : 0)), [s.found, mates]);
  const missed = useMemo(() => (finished ? mod.missed(puzzle, foundSet) : []), [finished, mod, puzzle, foundSet]);

  const rows = useMemo<WordRow[]>(() => {
    const byKey = new Map(answers.map((a) => [a.key, a]));
    const foundRows = [...s.found].reverse().map((f): WordRow => ({
      key: f.key,
      label: f.label,
      length: f.key.length,
      state: 'found',
    }));
    const order = mod.listOrder(puzzle);
    const rest = [...byKey.values()]
      .filter((a) => !foundSet.has(a.key))
      .sort((a, b) => order(a.key) - order(b.key))
      .map((a): WordRow => ({ key: a.key, label: a.label, length: a.length, state: finished ? 'missed' : 'hidden' }));
    return foundRows.concat(rest);
  }, [answers, s.found, finished, mod, puzzle, foundSet]);

  // The text result: paste it in a chat. Phones open the share sheet (WhatsApp is one tap), desktops copy.
  const sendText = async (): Promise<string> => {
    const secs = secondsOf(s, s.endAt ?? now());
    const base = shareGame(def, puzzle.difficulty, part).path;
    const text = shareText({
      title: def.title,
      found: s.found.length,
      total,
      secs,
      score: scoreOf(s, total, false, secs),
      marks: storyMarks(s.log?.events ?? [], s.log?.hints ?? [], s.found.filter((f) => !f.by).map((f) => f.span)),
      url: shareUrl(auth.profile && !part ? `${base}?vs=${auth.profile.handle}` : base),
    });
    if (coarse && navigator.share) {
      try {
        await navigator.share({ text });
        countEvent(def.id, 'share');
        return '';
      } catch {
        /* closed the sheet: fall back to copying */
      }
    }
    if (!(await copyText(text))) return t('Could not copy. Use Share.');
    countEvent(def.id, 'share');
    return t('Copied. Paste it in your group.');
  };

  const run = useStreak(finished ? s.endAt : 0);
  // Skill lines, 2 at most, rarest first. Picked once per finish.
  const lines = useMemo(
    () => (finished && wordy ? skillLines(playFacts(puzzle, s.found, s.wrongs, s.hints), copy.pick) : []),
    // A finished game does not change: its start time names it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [finished, puzzle, s.startAt],
  );
  // Stars: a catalogue puzzle played alone. One line beside them when this play raised them.
  const stars = finished && starred
    ? starsFor({ finished, found: foundCount, total, hints: s.hints, wrongs: s.wrongs, byOthers: s.found.some((f) => f.by) })
    : 0;
  const starsUp = !!ended?.starsUp;
  const starLine = useMemo(() => starsUpLine(stars, starsUp, copy.pick), [stars, starsUp]);
  // Where a finished clue leads: the next clue of the pack, or after its last, the first of the next pack.
  const onward = useMemo(() => {
    if (!part || !finished) return undefined;
    if (!part.next) return { to: nextClueTo() ?? '/play', label: t('Next puzzle') };
    return { to: `/play/${def.id}/${part.next}`, label: t('Next puzzle') };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [part, finished, def.id, s.startAt]);

  // What you missed, shown where it hides, and how many of them your own picks ran across. Picked once.
  const reveal = useMemo(() => (finished ? mod.reveal(puzzle, foundSet) : []), [finished, mod, puzzle, foundSet]);
  const past = finished ? readPast(s.log?.events ?? [], reveal.map((r) => r.span)) : 0;
  const pastLine = useMemo(() => (past ? copy.pick('readPast', { n: past }) : ''), [past]);

  const [toldBefore] = useState(runTold);
  // At any win: the run is what a guest would want to keep (BUILD_PLAN set 11a).
  const guestDone = finished && !signedIn && auth.enabled;
  const ask = useMemo(
    () => (guestDone ? guestAsk({ streak: run.streak, runTold: toldBefore }) : null),
    [guestDone, run.streak, toldBefore],
  );
  const guestLine = useMemo(() => (ask ? copy.pick(ask.pool, ask.vars) : ''), [ask]);
  useEffect(() => {
    // Said once: the next result goes back to the place.
    if (ask?.run) markRunTold();
  }, [ask]);

  // A sponsored puzzle says who it is with on the result and the share card. Picked once.
  const sponsor = useMemo(() => {
    const w = sponsorFor(def);
    return w ? { line: copy.pick('sponsorWith', { name: w.name }), url: w.url, host: w.host } : undefined;
  }, [def]);

  const Board = mod.Board;
  const named = nameOf(def);
  const perfect = foundCount === total;
  const resultLine = perfect ? t('Every answer found.') : t('The ones you missed are shaded below.');

  return (
    <div className={styles.screen} style={{ '--pack': packHue(def.category) } as CSSProperties}>
      <div className={styles.top}>
        <div className={styles.meta}>
          <Link to="/play" className={styles.back} aria-label={t('Packs')}>
            <Icon icon={ArrowLeft} size={20} />
          </Link>
          <span className={styles.metaEnd}>
            {part ? (
                // A pack as a row of marks, one a clue: done, this one, and those to come. A sums clue is square.
                <ol className={styles.trail} aria-label={`${named.category}, ${t('clue {at} of {of}', { at: part.at, of: part.of })}`} data-trail>
                  {trail.map((c) => (
                    <li key={c.n} className={styles.mark} data-kind={c.kind} data-state={c.state} aria-hidden="true" />
                  ))}
                </ol>
              ) : (
                <span className={styles.level}>
                  {named.category} · {difficultyName(puzzle.difficulty)}
                </span>
              )}
            {auth.enabled && !part && !inRoom && !finished && (
              <button type="button" className={styles.together} onClick={() => navigate(`?room=${newRoomCode()}`)}>
                <Icon icon={UsersRound} size={16} />
                {t('Play together')}
              </button>
            )}
          </span>
        </div>
        <div className={styles.titleRow}>
          <h1 className={styles.title}>{t('Find {what}', { what: countOf(total, named.noun) })}</h1>
          <BigClock startAt={s.startAt} endAt={s.endAt} />
        </div>
      </div>

      {inRoom && <RoomBar gameId={def.id} code={roomCode} peers={peers} mates={mates} status={roomStatus} me={myStats} you={{ id: roomId, handle: myHandle, partner: loadPartner().current }} path={sharePath({ id: def.id, code: def.id.startsWith('c-') ? def.id.slice(2).toUpperCase() : undefined })} />}

      {challenge && !inRoom && (
        <Challenge
          vs={challenge}
          game={{ id: def.id }}
          mine={finished ? scoreOf(s, total, false, secondsOf(s, s.endAt!)) : null}
        />
      )}

      <div className={styles.progress}>
        <div className={styles.stats}>
          <span className={styles.tally}>
            <Ring value={progress} label={t('Found')} />
            <span className={styles.count}>{count}</span>
          </span>
          <span>{plural(s.hints, '{n} tip-off', '{n} tip-offs')}</span>
        </div>
      </div>

      {finished && (
        <GameResults
          title={s.resultTitle ?? ''}
          line={resultLine}
          score={scoreOf(s, total, false, secondsOf(s, s.endAt!))}
          found={foundCount}
          total={total}
          secs={secondsOf(s, s.endAt!)}
          canReplay
          onReplay={g.replay}
          onShare={() => setSharing(true)}
          onText={sendText}
          next={onward}
          boardPath={part || !auth.enabled ? undefined : inRoom && getGameDef(def.id) ? `/leaderboard/${def.id}?board=together` : undefined}
          guest={!signedIn}
          guestLine={guestLine}
          guestAction={guestKeepLabel(run.streak)}
          stars={stars}
          starsUp={starLine}
          skills={lines}
          records={ended?.records}
          sponsor={sponsor && { ...sponsor, onVisit: () => countEvent(def.id, 'click') }}
        >
          <GameReveal items={reveal} past={pastLine} />
          {auth.enabled && def.id.startsWith('c-') && <RatePuzzle code={def.id.slice(2).toUpperCase()} />}
        </GameResults>
      )}

      <div className={styles.columns}>
        <div className={styles.main}>
          <p id={instructionId} className={styles.instruction}>
            {HOW[def.type][coarse ? 1 : 0]}
          </p>
          <Board
            {...mod.boardProps(puzzle)}
            found={foundSpans}
            foundBy={foundBy}
            missed={missed}
            hintLi={s.hintLi}
            disabled={finished}
            onPick={g.pick}
            onTapStart={g.tapStart}
            onDragStart={g.dragStart}
            onEnd={g.finish}
            describedBy={instructionId}
          />
          {!finished && (
            <div className={styles.actions}>
              <TextLink onClick={g.hint}>{t('Ask for a tip-off')}</TextLink>
              <TextLink onClick={g.finish}>{t("I'm done")}</TextLink>
              <span className={styles.says} aria-hidden="true">
                {pet}
                <span className={styles.msg}>{s.msg}</span>
              </span>
            </div>
          )}
          <div className={styles.sr} aria-live="polite" role="status">
            {s.msg}
          </div>
        </div>

        <WordList
          ref={listRef}
          title={finished ? t('Answers') : def.type === 'liar' ? t('Lies') : def.type === 'groups' ? t('Sets') : t('Hidden above')}
          count={count}
          rows={rows}
        />
      </div>

      {finished && (
        <ShareSheet
          open={sharing}
          onClose={() => setSharing(false)}
          onShared={() => countEvent(def.id, 'share')}
          game={{ ...shareGame(def, puzzle.difficulty, part), vs: part ? undefined : auth.profile?.handle, sponsor }}
          result={{
            answers: puzzle.answers.map((a) => {
              const f = s.found.find((x) => x.key === a.key);
              return { key: a.key, span: f?.span ?? a.spans[0]!, found: !!f, hinted: s.hinted.includes(a.key) };
            }),
            secs: secondsOf(s, s.endAt!),
            score: scoreOf(s, total, false, secondsOf(s, s.endAt!)),
            hints: s.hints,
          }}
          player={{ name: auth.profile?.name, handle: auth.profile?.handle }}
        />
      )}

      {finished && part && (
        <ClueDone
          open={popup === s.startAt}
          onClose={() => setPopup(null)}
          title={s.resultTitle ?? ''}
          stars={stars}
          line={t('{found} of {total} found', { found: foundCount, total })}
          next={onward}
        />
      )}

      {!finished && (
        <MobileBar
          count={count}
          progress={progress}
          time={<Elapsed startAt={s.startAt} endAt={s.endAt} />}
          message={s.msg}
          pet={pet}
          onHint={g.hint}
          onDone={g.finish}
        />
      )}
    </div>
  );
}

/** What the share sheet needs to know about this game. */
function shareGame(def: GameDef, difficulty: string, part?: Part): ShareGame {
  const code = def.id.startsWith('c-') ? def.id.slice(2).toUpperCase() : undefined;
  return {
    id: def.id,
    ...nameOf(def),
    difficulty: difficultyName(difficulty),
    text: def.text,
    path: part ? `/play/${def.id}/${part.n}` : sharePath({ id: def.id, code }),
  };
}
