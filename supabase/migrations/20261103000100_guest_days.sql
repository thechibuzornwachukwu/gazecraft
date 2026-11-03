-- Set 11a, sign up and come back: a guest's run comes with them to the account. The days a guest finished a clue
-- or a step in this browser (`gazecraft-days`) move to the account at sign in, as the dailies already do through
-- merge_guest_plays. They are the browser's word, not checked plays, so they sit in a table of their own:
-- the player's own run counts them (`my_play_days`, what the run on their screen is read from), and nothing that
-- earns anything does. `played_days`, `checked_days`, `own_streak` (streak badges, reminders, friend boards) and
-- `pair_streak` read `plays` and `play_days` as before, so a merged day can never earn a badge or a shared run.

create table public.guest_days (
  user_id uuid not null references auth.users (id) on delete cascade,
  day_no integer not null check (day_no >= 1),
  created_at timestamptz not null default now(),
  primary key (user_id, day_no)
);

-- No policies and no grants: written through merge_guest_days(), read through my_play_days() and export_my_data().
alter table public.guest_days enable row level security;

-- Signed in only. Whole day numbers from the last 400 days up to today, at most 400 of them; anything else is
-- skipped. Safe to send again. Answers with how many days were new.
create function public.merge_guest_days(days jsonb)
returns integer
language plpgsql security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  today integer := public.fignda_day_no();
  n integer;
begin
  if uid is null then
    raise exception 'Sign in first.' using errcode = '42501';
  end if;
  if days is null or jsonb_typeof(days) <> 'array' or jsonb_array_length(days) > 400 then
    raise exception 'Bad input.' using errcode = '22023';
  end if;

  insert into public.guest_days (user_id, day_no)
  -- The cast sits behind the check in a case: Postgres does not promise to test the conditions of a where in order.
  select distinct uid, x.d
  from (
    select case when jsonb_typeof(v) = 'number' and (v #>> '{}') ~ '^[0-9]{1,6}$' then (v #>> '{}')::integer end as d
    from jsonb_array_elements(days) as v
  ) x
  where x.d between greatest(1, today - 400) and today
  on conflict do nothing;

  get diagnostics n = row_count;
  return n;
end
$$;

-- The run on the player's own screen: dailies, checked days, and the days they brought from a guest browser.
create or replace function public.my_play_days()
returns setof integer
language sql stable security definer
set search_path = ''
as $$
  select p.day_no from public.plays p
  where p.user_id = (select auth.uid()) and p.day_no is not null
  union
  select d.day_no from public.play_days d
  where d.user_id = (select auth.uid())
  union
  select g.day_no from public.guest_days g
  where g.user_id = (select auth.uid())
$$;

revoke execute on function public.merge_guest_days(jsonb) from public, anon, authenticated;
grant execute on function public.merge_guest_days(jsonb) to authenticated;
revoke execute on function public.my_play_days() from public, anon, authenticated;
grant execute on function public.my_play_days() to authenticated;

-- Download my data carries the days brought from a guest browser too.
create or replace function public.export_my_data()
returns jsonb
language sql stable
security definer
set search_path = ''
as $$
  with me as (select auth.uid() as id)
  select jsonb_build_object(
    'exported_at', now(),
    'account', (select jsonb_build_object('email', u.email, 'created_at', u.created_at) from auth.users u, me where u.id = me.id),
    'profile', (select to_jsonb(p) - 'id' from public.profiles p, me where p.id = me.id),
    'look', (select l.look from public.profile_private l, me where l.user_id = me.id),
    'plays', coalesce((select jsonb_agg(to_jsonb(p) - 'id' - 'user_id' order by p.created_at) from public.plays p, me where p.user_id = me.id), '[]'),
    'clues', coalesce((select jsonb_agg(to_jsonb(c) - 'user_id' order by c.created_at) from public.clue_plays c, me where c.user_id = me.id), '[]'),
    'days_played', coalesce((select jsonb_agg(d.day_no order by d.day_no) from public.play_days d, me where d.user_id = me.id), '[]'),
    'guest_days', coalesce((select jsonb_agg(g.day_no order by g.day_no) from public.guest_days g, me where g.user_id = me.id), '[]'),
    'badges', coalesce((select jsonb_agg(to_jsonb(b) - 'user_id' order by b.earned_at) from public.badges b, me where b.user_id = me.id), '[]'),
    'pets', (select to_jsonb(x) - 'user_id' from public.player_partners x, me where x.user_id = me.id),
    'cases_with_pets', coalesce((select jsonb_agg(to_jsonb(x) - 'user_id') from public.partner_cases x, me where x.user_id = me.id), '[]'),
    'following', coalesce((select jsonb_agg(p.handle order by p.handle) from public.follows f join public.profiles p on p.id = f.followee_id, me where f.follower_id = me.id), '[]'),
    'followers', coalesce((select jsonb_agg(p.handle order by p.handle) from public.follows f join public.profiles p on p.id = f.follower_id, me where f.followee_id = me.id), '[]'),
    'circles', coalesce((select jsonb_agg(jsonb_build_object('name', c.name, 'code', c.code, 'owner', c.owner_id = me.id, 'joined_at', m.joined_at)) from public.circle_members m join public.circles c on c.id = m.circle_id, me where m.user_id = me.id), '[]'),
    'friend_streaks', coalesce((select jsonb_agg(jsonb_build_object('with', p.handle, 'start_day', s.start_day)) from public.friend_streaks s join public.profiles p on p.id = case when s.low = me.id then s.high else s.low end, me where me.id in (s.low, s.high)), '[]'),
    'streak_link', (select l.code from public.streak_links l, me where l.user_id = me.id),
    'invites_sent', coalesce((select jsonb_agg(jsonb_build_object('to', p.handle, 'game', i.game_id, 'at', i.created_at)) from public.game_invites i join public.profiles p on p.id = i.to_id, me where i.from_id = me.id), '[]'),
    'puzzles_made', coalesce((select jsonb_agg(jsonb_build_object('code', g.share_code, 'title', g.title, 'noun', g.noun, 'text', g.text, 'words', g.dict, 'created_at', g.created_at)) from public.games g, me where g.owner_id = me.id), '[]'),
    'puzzle_requests', coalesce((select jsonb_agg(jsonb_build_object('topic', j.topic, 'state', j.state, 'at', j.created_at)) from public.generate_jobs j, me where j.user_id = me.id), '[]'),
    'ratings', coalesce((select jsonb_agg(jsonb_build_object('game', r.game_id, 'up', r.up, 'at', r.created_at)) from public.puzzle_ratings r, me where r.user_id = me.id), '[]'),
    'reports', coalesce((select jsonb_agg(jsonb_build_object('game', r.game_id, 'at', r.created_at)) from public.puzzle_reports r, me where r.user_id = me.id), '[]'),
    'room_plays', coalesce((select jsonb_agg(to_jsonb(r) - 'user_id' - 'log') from public.room_plays r, me where r.user_id = me.id), '[]'),
    'shares', coalesce((select jsonb_agg(to_jsonb(s) - 'user_id') from public.shares s, me where s.user_id = me.id), '[]'),
    'notifications', coalesce((select jsonb_agg(jsonb_build_object('kind', n.kind, 'data', n.data, 'at', n.created_at, 'read_at', n.read_at) order by n.created_at) from public.notifications n, me where n.user_id = me.id), '[]'),
    'reminder', (select jsonb_build_object('tz', s.tz, 'hour', s.hour) from public.push_subs s, me where s.user_id = me.id limit 1)
  )
  from me
  where me.id is not null
$$;

revoke execute on function public.export_my_data() from public, anon;
grant execute on function public.export_my_data() to authenticated;
