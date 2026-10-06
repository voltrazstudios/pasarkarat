begin;

create table public.marketplace_product_saves (
  product_id uuid not null references public.marketplace_products(id) on delete cascade,
  actor_key text not null check (char_length(actor_key) between 10 and 100),
  created_at timestamptz not null default now(),
  primary key(product_id,actor_key)
);

create index marketplace_product_saves_actor_idx on public.marketplace_product_saves(actor_key);

create table public.marketplace_seller_followers (
  seller_id uuid not null references public.marketplace_profiles(id) on delete cascade,
  follower_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key(seller_id,follower_id),
  check (seller_id<>follower_id)
);

create index marketplace_seller_followers_follower_idx on public.marketplace_seller_followers(follower_id);

alter table public.marketplace_product_saves enable row level security;
alter table public.marketplace_seller_followers enable row level security;
revoke all on public.marketplace_product_saves, public.marketplace_seller_followers from public, anon, authenticated;

create or replace function public.marketplace_sync_saves(p_product_ids uuid[],p_visitor uuid)
returns boolean
language plpgsql
security definer
set search_path=''
as $$
declare
  current_user_id uuid := auth.uid();
  actor text;
  browser_actor text;
begin
  if p_visitor is null then raise exception 'Visitor id required'; end if;
  if coalesce(cardinality(p_product_ids),0)>200 then raise exception 'Too many saved products'; end if;

  browser_actor := 'browser:' || p_visitor::text;
  actor := case when current_user_id is null then browser_actor else 'user:' || current_user_id::text end;

  if current_user_id is not null then
    delete from public.marketplace_product_saves where actor_key=browser_actor;
  end if;

  delete from public.marketplace_product_saves
  where actor_key=actor
    and not (product_id=any(coalesce(p_product_ids,array[]::uuid[])));

  insert into public.marketplace_product_saves(product_id,actor_key)
  select p.id,actor
  from public.marketplace_products p
  where p.status='approved'
    and p.id=any(coalesce(p_product_ids,array[]::uuid[]))
  on conflict(product_id,actor_key) do nothing;

  return true;
end
$$;

create or replace function public.marketplace_set_follow(p_seller uuid,p_follow boolean)
returns boolean
language plpgsql
security definer
set search_path=''
as $$
declare actor uuid := auth.uid();
begin
  if actor is null then raise exception 'Authentication required' using errcode='42501'; end if;
  if p_seller is null or p_seller=actor then raise exception 'Invalid seller'; end if;
  if not exists(
    select 1 from public.marketplace_products
    where submitted_by=p_seller and status='approved'
  ) then raise exception 'Seller not found'; end if;

  if p_follow then
    insert into public.marketplace_seller_followers(seller_id,follower_id)
    values(p_seller,actor)
    on conflict(seller_id,follower_id) do nothing;
  else
    delete from public.marketplace_seller_followers
    where seller_id=p_seller and follower_id=actor;
  end if;

  return p_follow;
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
      from public.marketplace_product_saves s
      join public.marketplace_products p on p.id=s.product_id
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

revoke all on function public.marketplace_sync_saves(uuid[],uuid) from public, anon, authenticated;
revoke all on function public.marketplace_set_follow(uuid,boolean) from public, anon, authenticated;
revoke all on function public.marketplace_public_seller(uuid) from public, anon, authenticated;

grant execute on function public.marketplace_sync_saves(uuid[],uuid) to anon, authenticated;
grant execute on function public.marketplace_set_follow(uuid,boolean) to authenticated;
grant execute on function public.marketplace_public_seller(uuid) to anon, authenticated;

commit;
