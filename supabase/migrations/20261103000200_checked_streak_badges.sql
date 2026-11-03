-- Streak badges count checked days only. A guest's merged dailies (merge_guest_plays) and days (merge_guest_days)
-- are the browser's word: they keep the run on the player's own screen, and until now the merged dailies also
-- reached `own_streak`, so the next checked daily could earn a streak badge from days nobody checked.
-- `own_streak` stays as it is for the run a player is told about; the badges read `checked_streak`.

create function public.checked_streak(p_user uuid)
returns integer
language sql stable
set search_path = ''
as $$
  select public.rest_run(array(select x.day_no from public.checked_days(p_user) as x(day_no)), public.fignda_day_no())
$$;

revoke execute on function public.checked_streak(uuid) from public, anon, authenticated;
grant execute on function public.checked_streak(uuid) to service_role;

-- As in 20261018000100_counts_rare_retention.sql, with the run from checked days.
create or replace function public.award_badges()
returns trigger
language plpgsql security definer
set search_path = ''
as $$
declare
  pts bigint;
  run integer;
  closed integer;
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
  else
    select count(distinct p.game_id) into closed
    from public.plays p
    join public.games g on g.id = p.game_id and g.kind = 'curated'
    where p.user_id = new.user_id and p.verified and p.day_no is null;
    foreach n in array array[1, 5, 10, 25] loop
      if closed >= n then earned := earned || ('cases_' || n)::text; end if;
    end loop;
  end if;

  foreach c in array earned loop
    insert into public.badges (user_id, code) values (new.user_id, c) on conflict do nothing;
    if found then
      perform public.notify(new.user_id, 'badge', null, jsonb_build_object('code', c));
    end if;
  end loop;
  return new;
end
$$;

-- As in 20261013000300_step_points.sql, with the run from checked days.
create or replace function public.award_progress_badges(p_user uuid)
returns void
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
  if p_user is null then
    return;
  end if;
  select coalesce((select pp.points from public.player_points() pp where pp.user_id = p_user), 0) into pts;
  foreach n in array array[1000, 5000, 10000, 25000, 50000, 100000] loop
    if pts >= n then earned := earned || ('points_' || n)::text; end if;
  end loop;
  run := public.checked_streak(p_user);
  foreach n in array array[7, 30, 50, 100, 365] loop
    if run >= n then earned := earned || ('streak_' || n)::text; end if;
  end loop;
  foreach c in array earned loop
    insert into public.badges (user_id, code) values (p_user, c) on conflict do nothing;
    if found then
      perform public.notify(p_user, 'badge', null, jsonb_build_object('code', c));
    end if;
  end loop;
end
$$;
