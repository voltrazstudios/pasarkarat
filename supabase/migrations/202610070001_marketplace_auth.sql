begin;

create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

create table public.marketplace_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Marketplace Member' check (char_length(display_name) between 2 and 60),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.marketplace_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.marketplace_profiles enable row level security;
alter table public.marketplace_admins enable row level security;
revoke all on public.marketplace_profiles, public.marketplace_admins from public, anon, authenticated;
grant select, insert, update on public.marketplace_profiles to authenticated;

create policy "marketplace profile self read" on public.marketplace_profiles for select to authenticated using (id=auth.uid());
create policy "marketplace profile self insert" on public.marketplace_profiles for insert to authenticated with check (id=auth.uid());
create policy "marketplace profile self update" on public.marketplace_profiles for update to authenticated using (id=auth.uid()) with check (id=auth.uid());

create or replace function public.is_marketplace_admin()
returns boolean language sql stable security definer set search_path=''
as $$
  select auth.uid() is not null
  and exists(select 1 from public.marketplace_admins where user_id=auth.uid())
$$;
revoke all on function public.is_marketplace_admin() from public, anon, authenticated;
grant execute on function public.is_marketplace_admin() to authenticated;

create or replace function public.handle_marketplace_user()
returns trigger language plpgsql security definer set search_path=''
as $$
declare requested_name text;
begin
  requested_name := pg_catalog.btrim(coalesce(new.raw_user_meta_data->>'display_name',''));
  if char_length(requested_name) not between 2 and 60 then requested_name := 'Marketplace Member'; end if;
  insert into public.marketplace_profiles(id,display_name) values(new.id,requested_name) on conflict(id) do nothing;
  return new;
end
$$;

drop trigger if exists on_marketplace_auth_user_created on auth.users;
create trigger on_marketplace_auth_user_created after insert on auth.users
for each row execute function public.handle_marketplace_user();

insert into public.marketplace_profiles(id,display_name)
select u.id,
  case when char_length(pg_catalog.btrim(coalesce(u.raw_user_meta_data->>'display_name',''))) between 2 and 60
    then pg_catalog.btrim(u.raw_user_meta_data->>'display_name')
    else 'Marketplace Member'
  end
from auth.users u
on conflict(id) do nothing;

commit;
