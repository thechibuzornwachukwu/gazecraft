-- One rule for a finished pack, and leagues that count a clue once.
--
-- A pack is finished when every clue of it is done, or when the whole puzzle was played alone with at least half
-- of its words found. The client counts it so (src/games/path.ts packsDone), and from here the server does too:
-- the cases_N badges and my_progress agree with it. Before, any verified whole play counted, even one ended with
-- nothing found, and a pack closed clue by clue never counted at all.
--
-- Leagues: "points from puzzles finished for the first time" (help, leagues). A clue replayed later in the week
-- used to add its better score; now a clue counts its first checked score, in the week it was first checked.

-- How many clues each catalogue puzzle's pack holds. Written by the seed (scripts/gen-seed.ts) from the same
-- engine that cuts the packs. Null for a puzzle a player made: it has no pack.
alter table public.games add column clue_count smallint check (clue_count is null or clue_count between 1 and 40);

-- The first checked score of a clue and when it was earned: what a league week counts.
alter table public.clue_plays add column first_score integer not null default 0 check (first_score >= 0);
alter table public.clue_plays add column first_at timestamptz;
update public.clue_plays set first_score = score, first_at = created_at where verified;

create or replace function public.record_clue(p_user uuid, p_game text, p_clue integer, p_stars integer, p_score integer)
returns boolean
language plpgsql security definer
set search_path = ''
as $$
begin
  if p_clue is null or p_clue < 1 or p_clue > 40 or p_stars is null or p_stars < 1 or p_stars > 3 or p_score is null or p_score < 0 then
    return false;
  end if;
  if not exists (select 1 from public.games g where g.id = p_game and g.kind = 'curated') then
    return false;
  end if;
  insert into public.clue_plays as c (user_id, game_id, clue, stars, score, verified, first_score, first_at)
  values (p_user, p_game, p_clue, p_stars, p_score, true, p_score, now())
  on conflict (user_id, game_id, clue) do update
    set stars = greatest(c.stars, excluded.stars),
        -- A score from an unchecked row is 0, so this is the best checked score.
        score = greatest(c.score, excluded.score),
        -- The first checked play is the one a league counts. A row moved from a guest was never checked.
        first_score = case when c.verified then c.first_score else excluded.score end,
        first_at = case when c.verified then c.first_at else now() end,
        verified = true,
        updated_at = now();
  return true;
end
$$;

create or replace function public.league_points(p_user uuid, p_week date)
returns bigint
language sql stable
set search_path = ''
as $$
  select coalesce(sum(t.score), 0)::bigint from (
    select p.score from public.plays p
    where p.user_id = p_user and p.verified and p.day_no is null
      and public.league_week(p.created_at) = p_week
      and p.created_at = (select min(q.created_at) from public.plays q where q.user_id = p.user_id and q.game_id = p.game_id and q.verified)
    union all
    select c.first_score from public.clue_plays c
    where c.user_id = p_user and c.verified and c.first_at is not null and public.league_week(c.first_at) = p_week
  ) t
$$;

-- Packs this player has finished, by the one rule. Checked plays only: badges are earned, never sent.
-- Room games live in room_plays, so every row of `plays` here was played alone.
create or replace function public.packs_done(p_user uuid)
returns integer
language sql stable security definer
set search_path = ''
as $$
  select count(*)::integer from public.games g
  where g.kind = 'curated' and (
    exists (
      select 1 from public.plays p
      where p.user_id = p_user and p.game_id = g.id and p.verified and p.day_no is null
        and p.total > 0 and p.found * 2 >= p.total
    )
    or (
      g.clue_count is not null
      and (select count(*) from public.clue_plays c where c.user_id = p_user and c.game_id = g.id and c.verified and c.clue between 1 and 39) >= g.clue_count
    )
  )
$$;

-- The cases_N badges, for whichever play closed the pack: a whole puzzle or its last clue.
create or replace function public.award_pack_badges(p_user uuid)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  closed integer := public.packs_done(p_user);
  n integer;
  c text;
begin
  foreach n in array array[1, 5, 10, 25] loop
    if closed >= n then
      c := 'cases_' || n;
      insert into public.badges (user_id, code) values (p_user, c) on conflict do nothing;
      if found then
        perform public.notify(p_user, 'badge', null, jsonb_build_object('code', c));
      end if;
    end if;
  end loop;
end
$$;

create or replace function public.award_badges()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
declare
  pts bigint;
  run integer;
  c text;
  earned text[] := array['first_game'];
  n integer;
begin
  if not new.verified then
    return new;
  end if;

  select coalesce((select pp.points from public.player_points() pp where pp.user_id = new.user_id), 0) into pts;
  foreach n in array array[1000, 5000, 10000, 25000, 50000, 100000] loop
    if pts >= n then earned := earned || ('points_' || n)::text; end if;
  end loop;

  earned := earned || coalesce(new.skills, '{}');
  if cardinality(coalesce(new.rare_keys, '{}')) > 0 then earned := earned || 'rare_eye'::text; end if;

  if new.day_no is not null then
    if new.found = new.total then earned := earned || 'perfect_daily'::text; end if;
    run := public.checked_streak(new.user_id);
    foreach n in array array[7, 30, 50, 100, 365] loop
      if run >= n then earned := earned || ('streak_' || n)::text; end if;
    end loop;
  end if;

  foreach c in array earned loop
    insert into public.badges (user_id, code) values (new.user_id, c) on conflict do nothing;
    if found then
      perform public.notify(new.user_id, 'badge', null, jsonb_build_object('code', c));
    end if;
  end loop;
  if new.day_no is null then
    perform public.award_pack_badges(new.user_id);
  end if;
  return new;
end
$$;

-- A pack closed by its last clue earns its badge too.
create or replace function public.clue_pack_badges()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
begin
  if new.verified then
    perform public.award_pack_badges(new.user_id);
  end if;
  return new;
end
$$;
create trigger clue_plays_pack_badges after insert or update of verified, stars on public.clue_plays
  for each row execute function public.clue_pack_badges();

-- A whole puzzle counts as a clue done only by the same rule: at least half found. Ended with less, it is not kept.
create or replace function public.my_progress()
returns table (clue_id text, stars smallint)
language sql stable security definer
set search_path = ''
as $$
  select t.clue_id, max(t.stars)::smallint
  from (
    select c.game_id || case when c.clue > 0 then '~' || c.clue else '' end as clue_id, c.stars::integer as stars
    from public.clue_plays c
    where c.user_id = (select auth.uid())
    union all
    select p.game_id, case when p.clean then 3 when p.found * 5 >= p.total * 4 then 2 else 1 end
    from public.plays p
    join public.games g on g.id = p.game_id and g.kind = 'curated'
    where p.user_id = (select auth.uid()) and p.verified and p.day_no is null and p.total > 0 and p.found * 2 >= p.total
  ) t
  group by t.clue_id
$$;

revoke execute on function public.packs_done(uuid) from public, anon, authenticated;
revoke execute on function public.award_pack_badges(uuid) from public, anon, authenticated;
revoke execute on function public.clue_pack_badges() from public, anon, authenticated;
revoke execute on function public.league_points(uuid, date) from public, anon, authenticated;
revoke execute on function public.record_clue(uuid, text, integer, integer, integer) from public, anon, authenticated;
grant execute on function public.record_clue(uuid, text, integer, integer, integer) to service_role;

-- A run counts the same day on the screen and on the server: any checked game played alone that earned a star
-- (at least half found). Before, a whole puzzle counted a day on the device and nothing here. A room game counts
-- on neither: it is not checked.
create function public.whole_play_day()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
begin
  if new.verified and new.day_no is null and new.total > 0 and new.found > 0 and new.found * 2 >= new.total then
    insert into public.play_days (user_id, day_no)
    values (new.user_id, public.fignda_day_no())
    on conflict do nothing;
  end if;
  return new;
end
$$;
-- Named to sort before `plays_badges`: triggers run by name, so today is already a day played when badges are counted.
create trigger plays_a_day after insert or update of verified on public.plays
  for each row execute function public.whole_play_day();
revoke execute on function public.whole_play_day() from public, anon, authenticated;

-- The old count of closed cases (20261011000100_unmask.sql) gave the same badges by the old rule: any checked
-- whole play, or the unmasking (clue 40), which the game no longer has. One rule gives them now.
drop trigger plays_cases_closed on public.plays;
drop function public.note_cases_closed();
create or replace function public.note_unmasking()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
begin
  if new.clue = 40 and new.verified
     and exists (select 1 from public.games g where g.id = new.game_id and g.kind = 'curated') then
    insert into public.partner_cases (user_id, game_id, partner)
    values (new.user_id, new.game_id, coalesce((select pp.current from public.player_partners pp where pp.user_id = new.user_id), 'cat'))
    on conflict (user_id, game_id) do nothing;
  end if;
  return new;
end
$$;
