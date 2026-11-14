import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Check, Lock, Pencil, Settings } from 'lucide-react';
import { avatarCode, avatarFor, parseAvatar, PARTS, type Avatar as Parts } from '../avatar/draw';
import { EARNED, howTo, isEarned, type Standing } from '../avatar/earned';
import { guestAvatar, guestAvatarCode, guestSeed, setGuestAvatarCode } from '../avatar/guest';
import { setAvatarCode } from '../avatar/store';
import { Avatar } from '../components/Avatar';
import { Button } from '../components/Button';
import { Icon } from '../components/Icon';
import { IconLink } from '../components/IconLink';
import { LevelBadge } from '../components/LevelBadge';
import { PageHeader } from '../components/PageHeader';
import { Partner } from '../components/Partner';
import { SkeletonPills } from '../components/Skeleton';
import { TextLink } from '../components/TextLink';
import { nextAt, partnerName, PARTNERS, standingOf, type PartnerId } from '../engine/partners';
import { doneClues, packsDone } from '../games/path';
import { fetchBadges, saveAvatar, saveLook } from '../lib/api';
import { useAuth } from '../lib/auth';
import { keepLook, loadLook } from '../lib/firstMinute';
import type { LookChoice } from '../lib/onboarding';
import { choosePartner, syncPartner, usePartner } from '../lib/partner';
import { useStreak } from '../lib/useStreak';
import { useUnlocks } from '../lib/useUnlocks';
import { CharacterEditor } from './AvatarDesigner';
import { Week } from './Games';
import { loadRecords } from '../lib/records';
import { OUTFIT_NEEDS, useOutfit, wearOutfit } from '../lib/petOutfit';
import { PET_OUTFITS, type PetOutfit } from '../engine/partners';
import { Ring, type RingPart } from '../components/Ring';
import { Segmented } from '../components/Segmented';
import { GOALS, loadGoal, puzzlesToday, saveGoal, type GoalKey } from '../lib/goal';
import { Medals } from '../components/Medals';
import { num, plural, t } from '../i18n';
import styles from './Me.module.css';
import { goalName } from '../i18n/gameNames';
import { LanguagePicker } from '../components/LanguagePicker';

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const indexOf = (key: 'kit' | 'outfit', name: string) => (PARTS.find((p) => p.key === key)!.names as readonly string[]).indexOf(name);

/** Gear, in the order it is offered: nothing, then every earned piece. */
const NONE = t('none');
const GEAR = [{ part: 'kit' as const, name: NONE, need: undefined }, ...EARNED];
/** Where on the drawing a piece of gear is worn: the card shows that part close up. The rest are shown whole. */
// Keyed by the names as the player reads them, which is how GEAR holds them.
const GEAR_VIEW: Record<string, string | undefined> = { [t('star pin')]: '12 50 72 72', [t('headphones')]: '6 10 84 84', [t('bomber jacket')]: '12 50 72 72', [t('crown')]: '6 -2 84 84' };
type Gear = (typeof GEAR)[number];
/** What is being tried on the stage, before it is chosen. */
type Trying = { kind: 'partner'; id: PartnerId } | { kind: 'gear'; gear: Gear } | null;

const wearing = (parts: Parts, g: Gear) => parts[g.part] === indexOf(g.part, g.name);
const wear = (parts: Parts, g: Gear): Parts => ({ ...parts, [g.part]: indexOf(g.part, g.name) });

/**
 * /me. Everything about the player. Their character and pet on a stage, and under it the pets and the gear as rows
 * to swipe, then the week and their medals. Tap one to try it on the stage; one button under the stage chooses it. Guests too: what they choose
 * is kept in the browser and moves to the account on sign in.
 */
export function Me() {
  const auth = useAuth();
  const profile = auth.profile;
  const partner = usePartner();
  const run = useStreak();
  const open = useUnlocks(run.played);
  const { hash } = useLocation();
  // Null while the badges are on their way. A lookup that fails is no badges, never a hole.
  const [badges, setBadges] = useState<{ handle: string; codes: string[] } | null>(null);
  const [trying, setTrying] = useState<Trying>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');
  const [editing, setEditing] = useState(false);
  const [look, setLook] = useState<LookChoice | null>(loadLook);
  // A guest's design lives in the browser. Bumped when it changes, so the stage draws it again.
  const [guestRev, setGuestRev] = useState(0);

  // Points move with play: read the account's count each time the stage is opened.
  useEffect(() => {
    if (profile) void syncPartner();
  }, [profile]);

  const handle = profile?.handle;
  useEffect(() => {
    if (!handle) return;
    let alive = true;
    fetchBadges(handle)
      .then((b) => (Array.isArray(b) ? b : []))
      .catch(() => [] as string[])
      .then((codes) => alive && setBadges({ handle, codes }));
    return () => {
      alive = false;
    };
  }, [handle]);
  const earned = handle && badges?.handle === handle ? badges.codes : null;
  // Badges appear after the first verified play (src/lib/unlocks.ts). A badge already earned, or a link to #badges, shows them at once.
  const showBadges = !!handle && (open.badges || hash === '#badges' || (earned?.length ?? 0) > 0);

  const code = profile ? profile.avatar : guestAvatarCode();
  // eslint-disable-next-line react-hooks/exhaustive-deps -- `guestRev` is the reason to read the guest's design again
  const mine: Parts = useMemo(() => (profile ? (profile.avatar ? parseAvatar(profile.avatar) : avatarFor(profile.handle)) : guestAvatar()), [profile, guestRev]);
  const standing: Standing = useMemo(() => {
    const done = doneClues();
    return { cases: packsDone(done), points: partner.points };
  }, [partner.points]);

  const keep = async (next: string): Promise<boolean> => {
    if (!profile) {
      setGuestAvatarCode(next);
      setGuestRev((v) => v + 1);
      return true;
    }
    const ok = await saveAvatar(profile.id, next).catch(() => false);
    if (!ok) return false;
    setAvatarCode(profile.handle, next);
    await auth.refreshProfile().catch(() => null);
    return true;
  };

  const shownPartner = trying?.kind === 'partner' ? trying.id : partner.current;
  const shownParts = trying?.kind === 'gear' ? wear(mine, trying.gear) : mine;

  // What the one button under the stage does, and what it says when there is nothing to do.
  let action: { label: string; run: () => Promise<boolean> } | null = null;
  // The pet beside the player says nothing: its kit shows the bond. A line is only for one that is locked.
  let line = '';
  if (trying?.kind === 'partner') {
    const how = standingOf(partner, trying.id, partner.points);
    const at = nextAt(partner);
    if (trying.id === partner.current) line = '';
    else if (how === 'locked') line = at == null ? '' : !profile ? t('Locked. Sign in and reach {points} points.', { points: num(at) }) : t('Locked. {points} points to go.', { points: num(Math.max(0, at - partner.points)) });
    else action = { label: t('Select {name}', { name: partnerName(trying.id) }), run: () => choosePartner(trying.id, !!profile) };
    // A guest holds 1 partner and can swap it freely.
    if (!profile && trying.id !== partner.current) action = { label: t('Select {name}', { name: partnerName(trying.id) }), run: () => choosePartner(trying.id, false) };
  } else if (trying?.kind === 'gear') {
    const g = trying.gear;
    const locked = !!g.need && !isEarned(g.need, standing);
    if (wearing(mine, g)) line = g.name === NONE ? t('No gear on.') : t('You are wearing the {gear}.', { gear: g.name });
    else if (locked) line = t('Locked. {how}', { how: howTo(g.need!) });
    else action = { label: g.name === NONE ? t('Take the gear off') : t('Wear the {gear}', { gear: g.name }), run: () => keep(avatarCode(wear(mine, g))) };
  }

  const go = async () => {
    if (!action || busy) return;
    setBusy(true);
    setNote('');
    const ok = await action.run();
    setBusy(false);
    if (ok) setTrying(null);
    else setNote(t('That did not save. Try again.'));
  };

  return (
    <div className={styles.page}>
      <PageHeader title={t('You')} action={profile ? <IconLink to="/settings" icon={Settings} label={t('Settings')} /> : auth.enabled ? <TextLink to="/welcome?from=%2Fme">{t('Sign in')}</TextLink> : undefined} />

      <section className={styles.stage} aria-label={t('You and your pet')} data-trying={trying?.kind}>
        <div className={styles.cast}>
          <figure className={styles.figure}>
            <span className={styles.portrait}>
              <Avatar parts={shownParts} size={128} />
              {/* A pencil on the picture: the way to change it, where the eye already is. */}
              <button type="button" className={styles.edit} aria-label={t('Edit character')} title={t('Edit character')} onClick={() => setEditing(true)}>
                <Icon icon={Pencil} size={18} />
              </button>
            </span>
            <figcaption className={styles.caption}>{profile?.name ?? t('You')}</figcaption>
            {profile && <LevelBadge points={partner.points} size="sm" />}
          </figure>
          <figure className={styles.figure}>
            <span className={styles.portrait}>
              <Partner who={shownPartner} moment={trying?.kind === 'partner' ? 'hello' : 'done'} size={128} />
            </span>
            <figcaption className={styles.caption}>{partnerName(shownPartner)}</figcaption>
          </figure>
        </div>
        <div className={styles.act}>
          {action ? (
            <Button variant="accent" onClick={() => void go()} disabled={busy}>
              {action.label}
            </Button>
          ) : (
            <p className={styles.line} data-stage-line>
              {line}
            </p>
          )}
        </div>
        <p className={styles.note} role="status">
          {note}
        </p>
      </section>
      <section className={styles.section} aria-labelledby="me-partners">
        <h2 id="me-partners" className={styles.h2}>
          {t('Pets')}
        </h2>
        <ul className={styles.row}>
          {PARTNERS.map((p) => {
            const how = standingOf(partner, p.id, partner.points);
            const on = p.id === partner.current;
            const locked = how === 'locked' && !!profile;
            const at = nextAt(partner);
            const closed = partner.bonds[p.id] ?? 0;
            const bond = closed === 0 ? '' : plural(closed, ', {n} pack', ', {n} packs');
            const state = on ? `${t('With you')}${bond}` : how === 'own' ? `${t('Yours')}${bond}` : locked && at != null ? t('{points} points', { points: num(at) }) : t('Tap to try');
            return (
              <li key={p.id}>
                <button
                  type="button"
                  className={styles.card}
                  aria-pressed={shownPartner === p.id}
                  data-locked={locked || undefined}
                  data-on={on || undefined}
                  aria-label={`${p.name}. ${locked ? t('Locked. {state}.', { state }) : t('{state}.', { state })}`}
                  onClick={() => setTrying({ kind: 'partner', id: p.id })}
                >
                  <Partner who={p.id} moment={locked ? 'asleep' : 'empty'} size={88} />
                  <span className={styles.name}>{p.name}</span>
                  {/* Whose it is, is drawn: a tick on the one beside you, a lock and its price on one not yet yours. */}
                  {on && (
                    <span className={styles.tick} aria-hidden="true">
                      <Icon icon={Check} size={16} />
                    </span>
                  )}
                  {locked && at != null && (
                    <span className={styles.need} aria-hidden="true">
                      <Icon icon={Lock} size={16} />
                      {num(at)}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <PetOutfits standing={standing} />

      <section className={styles.section} aria-labelledby="me-gear">
        <h2 id="me-gear" className={styles.h2}>
          {t('Gear')}
        </h2>
        <ul className={styles.row}>
          {GEAR.map((g) => {
            const on = wearing(mine, g);
            const locked = !!g.need && !isEarned(g.need, standing);
            const title = g.name === NONE ? t('No gear') : cap(g.name);
            const state = on ? t('On you') : locked ? howTo(g.need!) : g.need ? t('Yours') : t('Plain');
            return (
              <li key={`${g.part}-${g.name}`}>
                <button
                  type="button"
                  className={styles.card}
                  aria-pressed={trying?.kind === 'gear' ? trying.gear === g : on}
                  data-locked={locked || undefined}
                  data-on={on || undefined}
                  aria-label={`${title}. ${locked ? t('Locked. {state}', { state }) : t('{state}.', { state })}`}
                  onClick={() => setTrying({ kind: 'gear', gear: g })}
                >
                  {/* The thing itself, close up. It needs no name under it, and no word for whose it is. */}
                  <Avatar parts={wear(mine, g)} size={96} view={GEAR_VIEW[g.name]} tile />
                  {on && (
                    <span className={styles.tick} aria-hidden="true">
                      <Icon icon={Check} size={16} />
                    </span>
                  )}
                  {locked && (
                    <span className={styles.need} aria-hidden="true">
                      <Icon icon={Lock} size={16} />
                      {howTo(g.need!)}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      {/* How the week went: a fact about you, so it lives here and not in the way of playing. */}
      <Week run={run} best={loadRecords().week} />

      <DailyGoal />

      {showBadges && (
        <section id="badges" className={styles.section} aria-labelledby="me-badges">
          <h2 id="me-badges" className={styles.h2}>
            {t('Badges')}
          </h2>
          {/* The next 3 to aim for sit after the earned ones. */}
          {earned == null ? <SkeletonPills /> : <Medals codes={earned} counts={{ run: run.streak, cases: standing.cases, points: standing.points }} name={profile?.name} parts={mine} path={profile ? `/u/${profile.handle}` : '/play'} all />}
        </section>
      )}

      {/* Guests have no Settings: the language is chosen here. */}
      {!profile && <LanguagePicker />}

      {profile && (
        <p className={styles.more}>
          <TextLink to={`/u/${profile.handle}`}>{t('See your public page')}</TextLink>
        </p>
      )}

      <CharacterEditor
        open={editing}
        seed={profile ? profile.handle : guestSeed()}
        code={code}
        look={look}
        onSave={keep}
        onLook={async (next) => {
          setLook(next);
          keepLook(next);
          return profile ? saveLook(profile.id, next).catch(() => false) : true;
        }}
        onClose={() => setEditing(false)}
      />
    </div>
  );
}

/** Today against the goal the player picked: a ring of 1, 2 or 4 parts that fill as puzzles are finished. */
function DailyGoal() {
  const [goal, setGoal] = useState(loadGoal);
  const done = puzzlesToday();
  const parts = Array.from({ length: goal.n }, (_, i): RingPart => (i < done ? 'done' : 'empty'));
  const label = t('{n} of {total} today', { n: Math.min(done, goal.n), total: goal.n });
  return (
    <section className={styles.goal} aria-labelledby="me-goal" data-goal={goal.key}>
      <h2 id="me-goal" className={styles.h2}>
        {t('Today')}
      </h2>
      <div className={styles.goalRow}>
        <Ring parts={parts} label={label} size={40} />
        <Segmented
          label={t('Puzzles a day')}
          hideLabel
          options={GOALS.map((g) => [g.key, goalName(g.name)] as const)}
          value={goal.key}
          onChange={(k: GoalKey) => {
            saveGoal(k);
            setGoal(GOALS.find((g) => g.key === k)!);
          }}
        />
      </div>
    </section>
  );
}

/**
 * The pet's outfits (BUILD_PLAN set 7m): none, then each outfit on the pet beside you. One earned is worn with a
 * tap; one not earned yet shows its lock and what it takes. Kept in this browser.
 */
function PetOutfits({ standing }: { standing: Standing }) {
  const worn = useOutfit();
  const choices: Array<PetOutfit | null> = [null, ...PET_OUTFITS];
  return (
    <section className={styles.section} aria-labelledby="me-outfits" data-pet-outfits>
      <h2 id="me-outfits" className={styles.h2}>
        {t('Outfits')}
      </h2>
      <ul className={styles.row}>
        {choices.map((o) => {
          const need = o ? OUTFIT_NEEDS[o] : undefined;
          const locked = !!need && !isEarned(need, standing) && worn !== o;
          const on = worn === o;
          const name = o ? o[0]!.toUpperCase() + o.slice(1) : t('No outfit');
          return (
            <li key={o ?? 'none'}>
              <button
                type="button"
                className={styles.card}
                aria-pressed={on}
                aria-disabled={locked || undefined}
                data-locked={locked || undefined}
                data-on={on || undefined}
                aria-label={`${name}. ${locked ? t('Locked. {how}', { how: howTo(need!) }) : on ? t('On.') : t('Yours.')}`}
                onClick={() => !locked && wearOutfit(o)}
              >
                <Partner moment={locked ? 'asleep' : 'empty'} outfit={o} size={88} />
                {on && (
                  <span className={styles.tick} aria-hidden="true">
                    <Icon icon={Check} size={16} />
                  </span>
                )}
                {locked && (
                  <span className={styles.need} aria-hidden="true">
                    <Icon icon={Lock} size={16} />
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
