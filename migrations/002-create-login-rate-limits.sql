create table auth_login_rate_limits (
  key_hash text primary key,
  failed_attempts integer not null default 0,
  first_failed_at timestamp with time zone,
  last_failed_at timestamp with time zone,
  locked_until timestamp with time zone,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

alter table auth_login_rate_limits enable row level security;

create or replace function check_login_rate_limit(
  p_key_hash text,
  p_window_seconds integer default 900,
  p_max_attempts integer default 5,
  p_lock_seconds integer default 900
)
returns table (
  is_allowed boolean,
  locked_until timestamp with time zone,
  failed_attempts integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  rate_limit_row auth_login_rate_limits%rowtype;
begin
  select *
  into rate_limit_row
  from auth_login_rate_limits
  where key_hash = p_key_hash;

  if not found then
    return query select true, null::timestamp with time zone, 0;
    return;
  end if;

  if rate_limit_row.locked_until is not null and rate_limit_row.locked_until > now() then
    return query select false, rate_limit_row.locked_until, rate_limit_row.failed_attempts;
    return;
  end if;

  if rate_limit_row.first_failed_at is null
    or rate_limit_row.first_failed_at < now() - make_interval(secs => p_window_seconds)
  then
    return query select true, null::timestamp with time zone, 0;
    return;
  end if;

  if rate_limit_row.failed_attempts >= p_max_attempts then
    update auth_login_rate_limits
    set
      locked_until = now() + make_interval(secs => p_lock_seconds),
      updated_at = now()
    where key_hash = p_key_hash
    returning auth_login_rate_limits.locked_until
    into rate_limit_row.locked_until;

    return query select false, rate_limit_row.locked_until, rate_limit_row.failed_attempts;
    return;
  end if;

  return query select true, null::timestamp with time zone, rate_limit_row.failed_attempts;
end;
$$;

create or replace function record_login_failure(
  p_key_hash text,
  p_window_seconds integer default 900,
  p_max_attempts integer default 5,
  p_lock_seconds integer default 900
)
returns table (
  is_allowed boolean,
  locked_until timestamp with time zone,
  failed_attempts integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  rate_limit_row auth_login_rate_limits%rowtype;
  next_attempts integer;
begin
  select *
  into rate_limit_row
  from auth_login_rate_limits
  where key_hash = p_key_hash
  for update;

  if not found then
    insert into auth_login_rate_limits (
      key_hash,
      failed_attempts,
      first_failed_at,
      last_failed_at,
      locked_until
    )
    values (
      p_key_hash,
      1,
      now(),
      now(),
      null
    )
    returning *
    into rate_limit_row;

    return query select true, null::timestamp with time zone, 1;
    return;
  end if;

  if rate_limit_row.locked_until is not null and rate_limit_row.locked_until > now() then
    return query select false, rate_limit_row.locked_until, rate_limit_row.failed_attempts;
    return;
  end if;

  if rate_limit_row.first_failed_at is null
    or rate_limit_row.first_failed_at < now() - make_interval(secs => p_window_seconds)
  then
    update auth_login_rate_limits
    set
      failed_attempts = 1,
      first_failed_at = now(),
      last_failed_at = now(),
      locked_until = null,
      updated_at = now()
    where key_hash = p_key_hash
    returning *
    into rate_limit_row;

    return query select true, null::timestamp with time zone, 1;
    return;
  end if;

  next_attempts := rate_limit_row.failed_attempts + 1;

  update auth_login_rate_limits
  set
    failed_attempts = next_attempts,
    last_failed_at = now(),
    locked_until = case
      when next_attempts >= p_max_attempts then now() + make_interval(secs => p_lock_seconds)
      else null
    end,
    updated_at = now()
  where key_hash = p_key_hash
  returning *
  into rate_limit_row;

  return query select
    rate_limit_row.locked_until is null,
    rate_limit_row.locked_until,
    rate_limit_row.failed_attempts;
end;
$$;

create or replace function clear_login_rate_limit(
  p_key_hash text,
  p_window_seconds integer default 900,
  p_max_attempts integer default 5,
  p_lock_seconds integer default 900
)
returns table (
  is_allowed boolean,
  locked_until timestamp with time zone,
  failed_attempts integer
)
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from auth_login_rate_limits
  where key_hash = p_key_hash;

  return query select true, null::timestamp with time zone, 0;
end;
$$;
