begin;

create table public.marketplace_account_saves (
  user_id uuid not null references auth.users(id) on delete cascade,
  product_key text not null check (
    product_key ~ '^(?:[0-9]{1,8}|[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})$'
  ),
  created_at timestamptz not null default now(),
  primary key(user_id,product_key)
);

create index marketplace_account_saves_created_idx
  on public.marketplace_account_saves(user_id,created_at desc);

alter table public.marketplace_account_saves enable row level security;
revoke all on public.marketplace_account_saves from public, anon, authenticated;

insert into public.marketplace_account_saves(user_id,product_key,created_at)
select
  pg_catalog.substring(s.actor_key from 6)::uuid,
  s.product_id::text,
  s.created_at
from public.marketplace_product_saves s
where s.actor_key ~ '^user:[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$'
on conflict(user_id,product_key) do nothing;

drop function if exists public.marketplace_sync_saves(uuid[],uuid);
drop table if exists public.marketplace_product_saves;

create or replace function public.marketplace_my_saved_products()
returns text[]
language plpgsql
stable
security definer
set search_path=''
as $$
declare
  actor uuid := auth.uid();
  result text[];
begin
  if actor is null then
    raise exception 'Authentication required' using errcode='42501';
  end if;

  select coalesce(array_agg(s.product_key order by s.created_at desc),array[]::text[])
  into result
  from public.marketplace_account_saves s
  where s.user_id=actor;

  return result;
end
$$;

create or replace function public.marketplace_toggle_save(p_product_key text)
returns boolean
language plpgsql
security definer
set search_path=''
as $$
declare
  actor uuid := auth.uid();
begin
  if actor is null then
    raise exception 'Authentication required' using errcode='42501';
  end if;

  if p_product_key is null
    or p_product_key !~ '^(?:[0-9]{1,8}|[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})$'
  then
    raise exception 'Invalid product key';
  end if;

  if exists(
    select 1 from public.marketplace_account_saves
    where user_id=actor and product_key=p_product_key
  ) then
    delete from public.marketplace_account_saves
    where user_id=actor and product_key=p_product_key;
    return false;
  end if;

  insert into public.marketplace_account_saves(user_id,product_key)
  values(actor,p_product_key);
  return true;
end
$$;

create or replace function public.marketplace_public_seller(p_seller uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path=''
as $$
declare result jsonb;
begin
  if p_seller is null then return null; end if;
  if not exists(
    select 1 from public.marketplace_products
    where submitted_by=p_seller and status='approved'
  ) then return null; end if;

  select jsonb_build_object(
    'id',profile.id,
    'store_name',profile.display_name,
    'avatar_url',case
      when coalesce(u.raw_user_meta_data->>'avatar_url','') ~* '^https://'
      then u.raw_user_meta_data->>'avatar_url'
      else null
    end,
    'joined_at',profile.created_at,
    'ratings',(
      select count(*)
      from public.marketplace_account_saves s
      join public.marketplace_products p on p.id::text=s.product_key
      where p.submitted_by=profile.id and p.status='approved'
    ),
    'products',(
      select count(*)
      from public.marketplace_products p
      where p.submitted_by=profile.id and p.status='approved'
    ),
    'followers',(
      select count(*)
      from public.marketplace_seller_followers f
      where f.seller_id=profile.id
    ),
    'is_following',case when auth.uid() is null then false else exists(
      select 1 from public.marketplace_seller_followers f
      where f.seller_id=profile.id and f.follower_id=auth.uid()
    ) end,
    'is_owner',auth.uid()=profile.id
  )
  into result
  from public.marketplace_profiles profile
  join auth.users u on u.id=profile.id
  where profile.id=p_seller;

  return result;
end
$$;

revoke all on function public.marketplace_my_saved_products() from public, anon, authenticated;
revoke all on function public.marketplace_toggle_save(text) from public, anon, authenticated;
grant execute on function public.marketplace_my_saved_products() to authenticated;
grant execute on function public.marketplace_toggle_save(text) to authenticated;

commit;
