begin;

create table if not exists public.marketplace_archive_ads (
  id uuid primary key default gen_random_uuid(),
  submitted_by uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.marketplace_products(id) on delete cascade,
  archive_slug text not null check(archive_slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' and char_length(archive_slug)<=100),
  status text not null default 'pending' check(status in ('pending','approved','rejected')),
  rejection_reason text check(rejection_reason is null or char_length(rejection_reason)<=500),
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id),
  updated_at timestamptz not null default now()
);

create unique index if not exists marketplace_archive_ads_one_active_mapping_idx
  on public.marketplace_archive_ads(product_id,archive_slug)
  where status in ('pending','approved');

create index if not exists marketplace_archive_ads_owner_idx
  on public.marketplace_archive_ads(submitted_by,submitted_at desc);

create index if not exists marketplace_archive_ads_target_idx
  on public.marketplace_archive_ads(archive_slug,status);

alter table public.marketplace_archive_ads enable row level security;
revoke all on public.marketplace_archive_ads from public,anon,authenticated;
grant select on public.marketplace_archive_ads to authenticated;

drop policy if exists "archive ad owner reads own mappings" on public.marketplace_archive_ads;
create policy "archive ad owner reads own mappings"
on public.marketplace_archive_ads for select to authenticated
using(submitted_by=auth.uid());

drop policy if exists "admin reads archive ads" on public.marketplace_archive_ads;
create policy "admin reads archive ads"
on public.marketplace_archive_ads for select to authenticated
using(public.is_marketplace_admin());

create table if not exists public.marketplace_archive_ad_placements (
  id uuid primary key default gen_random_uuid(),
  bill_id text not null unique check(char_length(bill_id) between 3 and 100),
  archive_ad_id uuid not null references public.marketplace_archive_ads(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  amount integer not null check(amount>0),
  duration_days integer not null check(duration_days in (3,7,14)),
  weight_units integer not null default 1 check(weight_units between 1 and 5),
  status text not null default 'due' check(status in ('due','paid','deleted','failed')),
  paid_at timestamptz,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  check(
    amount=(
      case duration_days
        when 3 then 390
        when 7 then 690
        when 14 then 1190
      end
    )*weight_units
  )
);

create index if not exists marketplace_archive_ad_placements_active_idx
  on public.marketplace_archive_ad_placements(archive_ad_id,ends_at)
  where status='paid';

create index if not exists marketplace_archive_ad_placements_user_idx
  on public.marketplace_archive_ad_placements(user_id,created_at desc);

alter table public.marketplace_archive_ad_placements enable row level security;
revoke all on public.marketplace_archive_ad_placements from public,anon,authenticated;
grant select,insert,update,delete on public.marketplace_archive_ad_placements to service_role;

create or replace function public.submit_marketplace_archive_ad(
  p_product_id uuid,
  p_archive_slug text
) returns uuid
language plpgsql
security definer
set search_path=''
as $fn$
declare
  actor uuid:=auth.uid();
  archive_ad_id uuid;
begin
  if actor is null then raise exception 'Authentication required' using errcode='42501'; end if;

  if p_archive_slug is null
    or char_length(p_archive_slug)>100
    or p_archive_slug !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
  then raise exception 'Invalid archive entry'; end if;

  if not exists(
    select 1
    from public.marketplace_products product
    where product.id=p_product_id
      and product.submitted_by=actor
      and product.status='approved'
  ) then raise exception 'Approved product not found' using errcode='42501'; end if;

  insert into public.marketplace_archive_ads(
    submitted_by,product_id,archive_slug
  ) values(
    actor,p_product_id,p_archive_slug
  )
  returning id into archive_ad_id;

  return archive_ad_id;
end
$fn$;

create or replace function public.marketplace_admin_pending_archive_ads()
returns jsonb
language plpgsql
stable
security definer
set search_path=''
as $fn$
declare result jsonb;
begin
  if not public.is_marketplace_admin() then raise exception 'Admin access required' using errcode='42501'; end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id',ad.id,
    'archive_slug',ad.archive_slug,
    'submitted_at',ad.submitted_at,
    'product',jsonb_build_object(
      'id',product.id,
      'slug',product.slug,
      'name',product.name,
      'public_image_path',product.public_image_path,
      'category',product.category
    ),
    'submitter',jsonb_build_object(
      'id',user_row.id,
      'email',user_row.email,
      'display_name',profile.display_name
    )
  ) order by ad.submitted_at),'[]'::jsonb)
  into result
  from public.marketplace_archive_ads ad
  join public.marketplace_products product on product.id=ad.product_id
  join auth.users user_row on user_row.id=ad.submitted_by
  left join public.marketplace_profiles profile on profile.id=ad.submitted_by
  where ad.status='pending';

  return result;
end
$fn$;

create or replace function public.marketplace_admin_decide_archive_ad(
  p_id uuid,
  p_decision text,
  p_reason text default null
) returns boolean
language plpgsql
security definer
set search_path=''
as $fn$
declare
  actor uuid:=auth.uid();
  ad public.marketplace_archive_ads;
begin
  if actor is null or not public.is_marketplace_admin() then raise exception 'Admin access required' using errcode='42501'; end if;

  select * into ad
  from public.marketplace_archive_ads
  where id=p_id
  for update;

  if not found or ad.status<>'pending' then raise exception 'Archive ad is not pending'; end if;
  if ad.submitted_by=actor and p_decision='approved' then raise exception 'Administrators cannot approve their own archive ad' using errcode='42501'; end if;

  if p_decision='approved' then
    update public.marketplace_archive_ads
    set status='approved',
        rejection_reason=null,
        reviewed_at=now(),
        reviewed_by=actor,
        updated_at=now()
    where id=p_id;
  elsif p_decision='rejected' then
    if p_reason is null or char_length(pg_catalog.btrim(p_reason)) not between 1 and 500 then raise exception 'Rejection reason is required'; end if;

    update public.marketplace_archive_ads
    set status='rejected',
        rejection_reason=pg_catalog.btrim(p_reason),
        reviewed_at=now(),
        reviewed_by=actor,
        updated_at=now()
    where id=p_id;
  else
    raise exception 'Invalid moderation decision';
  end if;

  return true;
end
$fn$;

create or replace function public.marketplace_activate_archive_ad_payment(
  p_bill_id text,
  p_paid_amount integer,
  p_paid_at timestamptz
) returns timestamptz
language plpgsql
security definer
set search_path=''
as $fn$
declare
  placement public.marketplace_archive_ad_placements%rowtype;
  activation_time timestamptz:=coalesce(p_paid_at,now());
  new_until timestamptz;
begin
  select * into placement
  from public.marketplace_archive_ad_placements
  where bill_id=p_bill_id
  for update;

  if not found then raise exception 'Archive ad payment not found'; end if;
  if placement.status='paid' then return placement.ends_at; end if;
  if p_paid_amount<placement.amount then raise exception 'Paid amount does not match'; end if;

  if not exists(
    select 1
    from public.marketplace_archive_ads ad
    where ad.id=placement.archive_ad_id
      and ad.submitted_by=placement.user_id
      and ad.status='approved'
  ) then raise exception 'Approved archive ad not found'; end if;

  new_until:=activation_time+make_interval(days=>placement.duration_days);

  update public.marketplace_archive_ad_placements
  set status='paid',
      paid_at=activation_time,
      starts_at=activation_time,
      ends_at=new_until
  where bill_id=p_bill_id;

  return new_until;
end
$fn$;

create or replace function public.marketplace_active_archive_ads(
  p_archive_slug text
) returns jsonb
language sql
stable
security definer
set search_path=''
as $fn$
  select coalesce(jsonb_agg(jsonb_build_object(
    'id',ad.id,
    'product_id',ad.product_id,
    'weight',active.weight
  ) order by ad.id),'[]'::jsonb)
  from public.marketplace_archive_ads ad
  join (
    select placement.archive_ad_id,sum(placement.weight_units)::integer as weight
    from public.marketplace_archive_ad_placements placement
    where placement.status='paid'
      and placement.starts_at<=now()
      and placement.ends_at>now()
    group by placement.archive_ad_id
  ) active on active.archive_ad_id=ad.id
  join public.marketplace_products product on product.id=ad.product_id
  where ad.status='approved'
    and ad.archive_slug=p_archive_slug
    and product.status='approved'
$fn$;

create or replace function public.marketplace_my_archive_ads()
returns jsonb
language plpgsql
stable
security definer
set search_path=''
as $fn$
declare
  actor uuid:=auth.uid();
  result jsonb;
begin
  if actor is null then raise exception 'Authentication required' using errcode='42501'; end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id',ad.id,
    'archive_slug',ad.archive_slug,
    'status',ad.status,
    'rejection_reason',ad.rejection_reason,
    'submitted_at',ad.submitted_at,
    'product_id',product.id,
    'product_name',product.name,
    'product_slug',product.slug,
    'public_image_path',product.public_image_path,
    'active_slots',coalesce((
      select sum(placement.weight_units)
      from public.marketplace_archive_ad_placements placement
      where placement.archive_ad_id=ad.id
        and placement.status='paid'
        and placement.starts_at<=now()
        and placement.ends_at>now()
    ),0),
    'active_until',(
      select max(placement.ends_at)
      from public.marketplace_archive_ad_placements placement
      where placement.archive_ad_id=ad.id
        and placement.status='paid'
        and placement.starts_at<=now()
        and placement.ends_at>now()
    )
  ) order by ad.submitted_at desc),'[]'::jsonb)
  into result
  from public.marketplace_archive_ads ad
  join public.marketplace_products product on product.id=ad.product_id
  where ad.submitted_by=actor;

  return result;
end
$fn$;

revoke all on function public.submit_marketplace_archive_ad(uuid,text) from public,anon,authenticated;
grant execute on function public.submit_marketplace_archive_ad(uuid,text) to authenticated;

revoke all on function public.marketplace_admin_pending_archive_ads() from public,anon,authenticated;
grant execute on function public.marketplace_admin_pending_archive_ads() to authenticated;

revoke all on function public.marketplace_admin_decide_archive_ad(uuid,text,text) from public,anon,authenticated;
grant execute on function public.marketplace_admin_decide_archive_ad(uuid,text,text) to authenticated;

revoke all on function public.marketplace_activate_archive_ad_payment(text,integer,timestamptz) from public,anon,authenticated;
grant execute on function public.marketplace_activate_archive_ad_payment(text,integer,timestamptz) to service_role;

revoke all on function public.marketplace_active_archive_ads(text) from public,anon,authenticated;
grant execute on function public.marketplace_active_archive_ads(text) to anon,authenticated;

revoke all on function public.marketplace_my_archive_ads() from public,anon,authenticated;
grant execute on function public.marketplace_my_archive_ads() to authenticated;

notify pgrst,'reload schema';

commit;
