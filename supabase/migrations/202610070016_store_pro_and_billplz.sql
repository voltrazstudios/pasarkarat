begin;

alter table public.marketplace_profiles
  add column if not exists pro_until timestamptz,
  add column if not exists accent_color text not null default '#c34e23'
    check(accent_color ~ '^#[0-9A-Fa-f]{6}$'),
  add column if not exists page_background text not null default '#f8f1e5'
    check(page_background ~ '^#[0-9A-Fa-f]{6}$'),
  add column if not exists card_color text not null default '#fff9ef'
    check(card_color ~ '^#[0-9A-Fa-f]{6}$'),
  add column if not exists store_font text not null default 'default'
    check(store_font in ('default','classic','clean','modern','vintage','typewriter')),
  add column if not exists featured_product_ids uuid[] not null default array[]::uuid[],
  add column if not exists custom_slug text
    check(custom_slug is null or (
      char_length(custom_slug) between 3 and 40
      and custom_slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
    )),
  add column if not exists store_links jsonb not null default '{}'::jsonb
    check(jsonb_typeof(store_links)='object');

create unique index if not exists marketplace_profiles_custom_slug_unique
  on public.marketplace_profiles(custom_slug)
  where custom_slug is not null;

-- Keep Pro-only columns out of normal browser table writes.
revoke insert,update on public.marketplace_profiles from authenticated;
grant insert(id,display_name,description,full_name,phone,gender,date_of_birth,avatar_path,banner_path,store_links,updated_at)
  on public.marketplace_profiles to authenticated;
grant update(id,display_name,description,full_name,phone,gender,date_of_birth,avatar_path,banner_path,banner_position_x,banner_position_y,store_links,updated_at)
  on public.marketplace_profiles to authenticated;

create table if not exists public.marketplace_pro_payments (
  bill_id text primary key check(char_length(bill_id) between 3 and 100),
  user_id uuid not null references public.marketplace_profiles(id) on delete cascade,
  plan text not null check(plan in ('monthly','annual')),
  amount integer not null check(amount>0),
  duration_days integer not null check(duration_days in (30,365)),
  status text not null default 'due' check(status in ('due','paid','deleted','failed')),
  paid_at timestamptz,
  activated_until timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists marketplace_pro_payments_user_idx
  on public.marketplace_pro_payments(user_id,created_at desc);

alter table public.marketplace_pro_payments enable row level security;
revoke all on public.marketplace_pro_payments from public,anon,authenticated;

create or replace function public.marketplace_save_pro_store_theme(
  p_accent_color text,
  p_page_background text,
  p_card_color text,
  p_store_font text,
  p_featured_product_ids uuid[],
  p_custom_slug text
) returns boolean
language plpgsql
security definer
set search_path=''
as $$
declare
  actor uuid := auth.uid();
  clean_slug text := nullif(pg_catalog.lower(pg_catalog.btrim(coalesce(p_custom_slug,''))),'');
  clean_ids uuid[] := coalesce(p_featured_product_ids,array[]::uuid[]);
begin
  if actor is null then
    raise exception 'Authentication required' using errcode='42501';
  end if;

  if not exists(
    select 1 from public.marketplace_profiles
    where id=actor and pro_until is not null and pro_until>now()
  ) then
    raise exception 'Pasar Karat Pro is required' using errcode='42501';
  end if;

  if p_accent_color !~ '^#[0-9A-Fa-f]{6}$'
    or p_page_background !~ '^#[0-9A-Fa-f]{6}$'
    or p_card_color !~ '^#[0-9A-Fa-f]{6}$'
  then
    raise exception 'Invalid store colour';
  end if;

  if p_store_font not in ('default','classic','clean','modern','vintage','typewriter') then
    raise exception 'Invalid store font';
  end if;

  if cardinality(clean_ids)>4 then
    raise exception 'Choose up to four featured products';
  end if;

  if cardinality(clean_ids)<>cardinality(array(select distinct value from unnest(clean_ids) as value)) then
    raise exception 'Duplicate featured product';
  end if;

  if exists(
    select 1
    from unnest(clean_ids) product_id
    where not exists(
      select 1 from public.marketplace_products p
      where p.id=product_id and p.submitted_by=actor and p.status='approved'
    )
  ) then
    raise exception 'Featured products must be your approved products';
  end if;

  if clean_slug is not null and (
    char_length(clean_slug) not between 3 and 40
    or clean_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$'
  ) then
    raise exception 'Invalid custom store URL';
  end if;

  update public.marketplace_profiles
  set accent_color=pg_catalog.lower(p_accent_color),
      page_background=pg_catalog.lower(p_page_background),
      card_color=pg_catalog.lower(p_card_color),
      store_font=p_store_font,
      featured_product_ids=clean_ids,
      custom_slug=clean_slug,
      updated_at=now()
  where id=actor;

  return true;
end
$$;

create or replace function public.marketplace_public_seller_id_by_slug(p_slug text)
returns uuid
language sql
stable
security definer
set search_path=''
as $$
  select profile.id
  from public.marketplace_profiles profile
  where profile.custom_slug=pg_catalog.lower(pg_catalog.btrim(coalesce(p_slug,'')))
    and profile.pro_until is not null
    and profile.pro_until>now()
    and (
      auth.uid()=profile.id
      or exists(
        select 1 from public.marketplace_products p
        where p.submitted_by=profile.id and p.status='approved'
      )
    )
  limit 1
$$;

create or replace function public.marketplace_public_seller(p_seller uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path=''
as $$
declare
  result jsonb;
  active_pro boolean;
begin
  if p_seller is null then return null; end if;

  if auth.uid() is distinct from p_seller and not exists(
    select 1 from public.marketplace_products
    where submitted_by=p_seller and status='approved'
  ) then
    return null;
  end if;

  select profile.pro_until is not null and profile.pro_until>now()
  into active_pro
  from public.marketplace_profiles profile
  where profile.id=p_seller;

  select jsonb_build_object(
    'id',profile.id,
    'store_name',profile.display_name,
    'description',profile.description,
    'avatar_path',profile.avatar_path,
    'banner_path',profile.banner_path,
    'banner_position_x',profile.banner_position_x,
    'banner_position_y',profile.banner_position_y,
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
    'is_owner',auth.uid()=profile.id,
    'is_pro',active_pro,
    'accent_color',case when active_pro or auth.uid()=profile.id then profile.accent_color else '#c34e23' end,
    'page_background',case when active_pro or auth.uid()=profile.id then profile.page_background else '#f8f1e5' end,
    'card_color',case when active_pro or auth.uid()=profile.id then profile.card_color else '#fff9ef' end,
    'store_font',case when active_pro or auth.uid()=profile.id then profile.store_font else 'default' end,
    'featured_product_ids',case
      when active_pro or auth.uid()=profile.id then to_jsonb(profile.featured_product_ids)
      else '[]'::jsonb
    end,
    'custom_slug',case when active_pro or auth.uid()=profile.id then profile.custom_slug else null end,
    'store_links',profile.store_links
  )
  into result
  from public.marketplace_profiles profile
  where profile.id=p_seller;

  return result;
end
$$;

create or replace function public.marketplace_activate_pro_payment(
  p_bill_id text,
  p_paid_amount integer,
  p_paid_at timestamptz
) returns timestamptz
language plpgsql
security definer
set search_path=''
as $$
declare
  payment public.marketplace_pro_payments%rowtype;
  current_until timestamptz;
  new_until timestamptz;
begin
  select * into payment
  from public.marketplace_pro_payments
  where bill_id=p_bill_id
  for update;

  if not found then raise exception 'Payment not found'; end if;

  if payment.status='paid' then
    return payment.activated_until;
  end if;

  if p_paid_amount<payment.amount then
    raise exception 'Paid amount does not match';
  end if;

  select pro_until into current_until
  from public.marketplace_profiles
  where id=payment.user_id
  for update;

  new_until:=greatest(coalesce(current_until,now()),now())
    + make_interval(days=>payment.duration_days);

  update public.marketplace_profiles
  set pro_until=new_until,updated_at=now()
  where id=payment.user_id;

  update public.marketplace_pro_payments
  set status='paid',
      paid_at=coalesce(p_paid_at,now()),
      activated_until=new_until
  where bill_id=p_bill_id;

  return new_until;
end
$$;

revoke all on function public.marketplace_save_pro_store_theme(text,text,text,text,uuid[],text)
from public,anon,authenticated;
grant execute on function public.marketplace_save_pro_store_theme(text,text,text,text,uuid[],text)
to authenticated;

revoke all on function public.marketplace_public_seller_id_by_slug(text)
from public,anon,authenticated;
grant execute on function public.marketplace_public_seller_id_by_slug(text)
to anon,authenticated;

revoke all on function public.marketplace_public_seller(uuid)
from public,anon,authenticated;
grant execute on function public.marketplace_public_seller(uuid)
to anon,authenticated;

revoke all on function public.marketplace_activate_pro_payment(text,integer,timestamptz)
from public,anon,authenticated;
grant execute on function public.marketplace_activate_pro_payment(text,integer,timestamptz)
to service_role;

commit;
