-- A daily counts toward a run only with at least 1 word found (owner's decision, 3 Nov 2026). Opening the daily
-- and ending it with nothing found kept a run alive. Each function below is as it was, with `found > 0` on the
-- daily plays it reads; names, arguments, results and grants are unchanged.

create or replace function public.played_days(p_user uuid)
returns setof integer
language sql stable security definer
set search_path = ''
as $$
  select p.day_no from public.plays p
  where p.user_id = p_user and p.day_no is not null and p.found > 0
  union
  select d.day_no from public.play_days d
  where d.user_id = p_user
$$;

create or replace function public.checked_days(p_user uuid)
returns setof integer
language sql stable security definer
set search_path = ''
as $$
  select p.day_no from public.plays p
  where p.user_id = p_user and p.day_no is not null and p.verified and p.found > 0
  union
  select d.day_no from public.play_days d
  where d.user_id = p_user
$$;

create or replace function public.my_play_days()
returns setof integer
language sql stable security definer
set search_path = ''
as $$
  select p.day_no from public.plays p
  where p.user_id = (select auth.uid()) and p.day_no is not null and p.found > 0
  union
  select d.day_no from public.play_days d
  where d.user_id = (select auth.uid())
  union
  select g.day_no from public.guest_days g
  where g.user_id = (select auth.uid())
$$;

create or replace function public.verified_streaks()
returns table (user_id uuid, current_streak integer, best_streak integer, dailies bigint, perfect bigint)
language sql stable
set search_path = ''
as $$
  with days as (
    select distinct p.user_id, p.day_no
    from public.plays p
    where p.verified and p.day_no is not null and p.found > 0 and p.day_no <= public.fignda_day_no()
  ),
  islands as (
    select d.user_id, d.day_no, d.day_no - row_number() over (partition by d.user_id order by d.day_no) as grp
    from days d
  ),
  runs as (
    select i.user_id, count(*)::integer as len, max(i.day_no) as last_day
    from islands i
    group by i.user_id, i.grp
  )
  select r.user_id,
         coalesce(max(r.len) filter (where r.last_day >= public.fignda_day_no() - 1), 0)::integer as current_streak,
         max(r.len)::integer as best_streak,
         (select count(distinct day_no) from public.plays x where x.user_id = r.user_id and x.verified and x.day_no is not null and x.found > 0) as dailies,
         (select count(*) from public.plays x where x.user_id = r.user_id and x.verified and x.day_no < public.fignda_day_no() and x.found = x.total) as perfect
  from runs r
  group by r.user_id
$$;
