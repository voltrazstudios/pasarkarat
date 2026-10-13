begin;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('marketplace-ad-submissions','marketplace-ad-submissions',false,5242880,array['image/webp'])
on conflict(id) do update
set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('marketplace-ad-images','marketplace-ad-images',true,5242880,array['image/webp'])
on conflict(id) do update
set public=true,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;

drop policy if exists "ad submission owner insert" on storage.objects;
create policy "ad submission owner insert"
on storage.objects for insert to authenticated
with check(
  bucket_id='marketplace-ad-submissions'
  and (storage.foldername(name))[1]=auth.uid()::text
  and name ~ '^[a-f0-9-]+/[a-f0-9-]+[.]webp$'
);

drop policy if exists "ad submission owner or admin read" on storage.objects;
create policy "ad submission owner or admin read"
on storage.objects for select to authenticated
using(
  bucket_id='marketplace-ad-submissions'
  and ((storage.foldername(name))[1]=auth.uid()::text or public.is_marketplace_admin())
);

drop policy if exists "ad submission owner or admin delete" on storage.objects;
create policy "ad submission owner or admin delete"
on storage.objects for delete to authenticated
using(
  bucket_id='marketplace-ad-submissions'
  and ((storage.foldername(name))[1]=auth.uid()::text or public.is_marketplace_admin())
);

drop policy if exists "approved ad public read" on storage.objects;
create policy "approved ad public read"
on storage.objects for select to public
using(bucket_id='marketplace-ad-images');

drop policy if exists "approved ad admin insert" on storage.objects;
create policy "approved ad admin insert"
on storage.objects for insert to authenticated
with check(
  bucket_id='marketplace-ad-images'
  and public.is_marketplace_admin()
  and name ~ '^approved/[a-f0-9-]+[.]webp$'
);

drop policy if exists "approved ad admin delete" on storage.objects;
create policy "approved ad admin delete"
on storage.objects for delete to authenticated
using(bucket_id='marketplace-ad-images' and public.is_marketplace_admin());

create table if not exists public.marketplace_ads (
  id uuid primary key default gen_random_uuid(),
  submitted_by uuid not null references auth.users(id) on delete cascade,
  title text not null check(char_length(title) between 3 and 100),
  destination_url text not null check(char_length(destination_url) between 8 and 2048 and destination_url ~ '^https://'),
  pending_desktop_path text not null,
  pending_mobile_path text not null,
  public_desktop_path text,
  public_mobile_path text,
  status text not null default 'pending' check(status in ('pending','approved','rejected')),
  rejection_reason text check(rejection_reason is null or char_length(rejection_reason)<=500),
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id),
  updated_at timestamptz not null default now()
);

create index if not exists marketplace_ads_owner_idx
  on public.marketplace_ads(submitted_by,submitted_at desc);

create index if not exists marketplace_ads_status_idx
  on public.marketplace_ads(status,submitted_at desc);

alter table public.marketplace_ads enable row level security;
revoke all on public.marketplace_ads from public,anon,authenticated;
grant select on public.marketplace_ads to authenticated;

drop policy if exists "ad owner reads own ads" on public.marketplace_ads;
create policy "ad owner reads own ads"
on public.marketplace_ads for select to authenticated
using(submitted_by=auth.uid());

drop policy if exists "admin reads ads" on public.marketplace_ads;
create policy "admin reads ads"
on public.marketplace_ads for select to authenticated
using(public.is_marketplace_admin());

create table if not exists public.marketplace_ad_placements (
  id uuid primary key default gen_random_uuid(),
  bill_id text not null unique check(char_length(bill_id) between 3 and 100),
  ad_id uuid not null references public.marketplace_ads(id) on delete cascade,
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
        when 3 then 690
        when 7 then 1290
        when 14 then 2190
      end
    )*weight_units
  )
);

create index if not exists marketplace_ad_placements_active_idx
  on public.marketplace_ad_placements(ad_id,ends_at)
  where status='paid';

create index if not exists marketplace_ad_placements_user_idx
  on public.marketplace_ad_placements(user_id,created_at desc);

alter table public.marketplace_ad_placements enable row level security;
revoke all on public.marketplace_ad_placements from public,anon,authenticated;
grant select,insert,update,delete on public.marketplace_ad_placements to service_role;

create or replace function public.submit_marketplace_ad(
  p_title text,
  p_destination_url text,
  p_desktop_path text,
  p_mobile_path text
) returns uuid
language plpgsql
security definer
set search_path=''
as $fn$
declare
  actor uuid:=auth.uid();
  ad_id uuid;
begin
  if actor is null then raise exception 'Authentication required' using errcode='42501'; end if;
  if p_title is null or char_length(pg_catalog.btrim(p_title)) not between 3 and 100 then raise exception 'Invalid ad title'; end if;
  if p_destination_url is null
    or char_length(p_destination_url) not between 8 and 2048
    or p_destination_url !~ '^https://'
    or p_destination_url ~ '[[:space:]]'
  then raise exception 'Invalid destination URL'; end if;

  if p_desktop_path is null
    or position(actor::text || '/' in p_desktop_path)<>1
    or p_desktop_path !~ '^[a-f0-9-]+/[a-f0-9-]+[.]webp$'
  then raise exception 'Invalid desktop ad image'; end if;

  if p_mobile_path is null
    or position(actor::text || '/' in p_mobile_path)<>1
    or p_mobile_path !~ '^[a-f0-9-]+/[a-f0-9-]+[.]webp$'
  then raise exception 'Invalid mobile ad image'; end if;

  insert into public.marketplace_ads(
    submitted_by,title,destination_url,pending_desktop_path,pending_mobile_path
  ) values(
    actor,pg_catalog.btrim(p_title),p_destination_url,p_desktop_path,p_mobile_path
  )
  returning id into ad_id;

  return ad_id;
end
$fn$;

create or replace function public.marketplace_admin_pending_ads()
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
    'title',ad.title,
    'destination_url',ad.destination_url,
    'pending_desktop_path',ad.pending_desktop_path,
    'pending_mobile_path',ad.pending_mobile_path,
    'submitted_at',ad.submitted_at,
    'submitter',jsonb_build_object(
      'id',user_row.id,
      'email',user_row.email,
      'display_name',profile.display_name
    )
  ) order by ad.submitted_at),'[]'::jsonb)
  into result
  from public.marketplace_ads ad
  join auth.users user_row on user_row.id=ad.submitted_by
  left join public.marketplace_profiles profile on profile.id=ad.submitted_by
  where ad.status='pending';

  return result;
end
$fn$;

create or replace function public.marketplace_admin_decide_ad(
  p_id uuid,
  p_decision text,
  p_reason text default null,
  p_public_desktop_path text default null,
  p_public_mobile_path text default null
) returns jsonb
language plpgsql
security definer
set search_path=''
as $fn$
declare
  actor uuid:=auth.uid();
  ad public.marketplace_ads;
begin
  if actor is null or not public.is_marketplace_admin() then raise exception 'Admin access required' using errcode='42501'; end if;

  select * into ad
  from public.marketplace_ads
  where id=p_id
  for update;

  if not found or ad.status<>'pending' then raise exception 'Ad is not pending'; end if;

  if p_decision='approved' then
    if ad.submitted_by=actor then raise exception 'Administrators cannot approve their own ad' using errcode='42501'; end if;
    if p_public_desktop_path is null or p_public_desktop_path !~ '^approved/[a-f0-9-]+[.]webp$' then raise exception 'Approved desktop image is required'; end if;
    if p_public_mobile_path is null or p_public_mobile_path !~ '^approved/[a-f0-9-]+[.]webp$' then raise exception 'Approved mobile image is required'; end if;

    update public.marketplace_ads
    set status='approved',
        public_desktop_path=p_public_desktop_path,
        public_mobile_path=p_public_mobile_path,
        rejection_reason=null,
        reviewed_at=now(),
        reviewed_by=actor,
        updated_at=now()
    where id=p_id;
  elsif p_decision='rejected' then
    if p_reason is null or char_length(pg_catalog.btrim(p_reason)) not between 1 and 500 then raise exception 'Rejection reason is required'; end if;

    update public.marketplace_ads
    set status='rejected',
        rejection_reason=pg_catalog.btrim(p_reason),
        reviewed_at=now(),
        reviewed_by=actor,
        updated_at=now()
    where id=p_id;
  else
    raise exception 'Invalid moderation decision';
  end if;

  return jsonb_build_object(
    'pending_desktop_path',ad.pending_desktop_path,
    'pending_mobile_path',ad.pending_mobile_path
  );
end
$fn$;

create or replace function public.marketplace_activate_ad_payment(
  p_bill_id text,
  p_paid_amount integer,
  p_paid_at timestamptz
) returns timestamptz
language plpgsql
security definer
set search_path=''
as $fn$
declare
  placement public.marketplace_ad_placements%rowtype;
  activation_time timestamptz:=coalesce(p_paid_at,now());
  new_until timestamptz;
begin
  select * into placement
  from public.marketplace_ad_placements
  where bill_id=p_bill_id
  for update;

  if not found then raise exception 'Ad payment not found'; end if;
  if placement.status='paid' then return placement.ends_at; end if;
  if p_paid_amount<placement.amount then raise exception 'Paid amount does not match'; end if;

  if not exists(
    select 1 from public.marketplace_ads ad
    where ad.id=placement.ad_id
      and ad.submitted_by=placement.user_id
      and ad.status='approved'
  ) then raise exception 'Approved ad not found'; end if;

  new_until:=activation_time+make_interval(days=>placement.duration_days);

  update public.marketplace_ad_placements
  set status='paid',
      paid_at=activation_time,
      starts_at=activation_time,
      ends_at=new_until
  where bill_id=p_bill_id;

  return new_until;
end
$fn$;

create or replace function public.marketplace_active_ads()
returns jsonb
language sql
stable
security definer
set search_path=''
as $fn$
  select coalesce(jsonb_agg(jsonb_build_object(
    'id',ad.id,
    'title',ad.title,
    'destination_url',ad.destination_url,
    'public_desktop_path',ad.public_desktop_path,
    'public_mobile_path',ad.public_mobile_path,
    'weight',active.weight
  ) order by ad.id),'[]'::jsonb)
  from public.marketplace_ads ad
  join (
    select placement.ad_id,sum(placement.weight_units)::integer as weight
    from public.marketplace_ad_placements placement
    where placement.status='paid'
      and placement.starts_at<=now()
      and placement.ends_at>now()
    group by placement.ad_id
  ) active on active.ad_id=ad.id
  where ad.status='approved'
    and ad.public_desktop_path is not null
    and ad.public_mobile_path is not null
$fn$;

create or replace function public.marketplace_my_ads()
returns jsonb
language plpgsql
stable
security definer
set search_path=''
as $fn$
declare actor uuid:=auth.uid();
declare result jsonb;
begin
  if actor is null then raise exception 'Authentication required' using errcode='42501'; end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id',ad.id,
    'title',ad.title,
    'destination_url',ad.destination_url,
    'status',ad.status,
    'rejection_reason',ad.rejection_reason,
    'submitted_at',ad.submitted_at,
    'pending_desktop_path',ad.pending_desktop_path,
    'pending_mobile_path',ad.pending_mobile_path,
    'public_desktop_path',ad.public_desktop_path,
    'public_mobile_path',ad.public_mobile_path,
    'active_slots',coalesce((
      select sum(placement.weight_units)
      from public.marketplace_ad_placements placement
      where placement.ad_id=ad.id
        and placement.status='paid'
        and placement.starts_at<=now()
        and placement.ends_at>now()
    ),0),
    'active_until',(
      select max(placement.ends_at)
      from public.marketplace_ad_placements placement
      where placement.ad_id=ad.id
        and placement.status='paid'
        and placement.starts_at<=now()
        and placement.ends_at>now()
    )
  ) order by ad.submitted_at desc),'[]'::jsonb)
  into result
  from public.marketplace_ads ad
  where ad.submitted_by=actor;

  return result;
end
$fn$;

revoke all on function public.submit_marketplace_ad(text,text,text,text) from public,anon,authenticated;
grant execute on function public.submit_marketplace_ad(text,text,text,text) to authenticated;

revoke all on function public.marketplace_admin_pending_ads() from public,anon,authenticated;
grant execute on function public.marketplace_admin_pending_ads() to authenticated;

revoke all on function public.marketplace_admin_decide_ad(uuid,text,text,text,text) from public,anon,authenticated;
grant execute on function public.marketplace_admin_decide_ad(uuid,text,text,text,text) to authenticated;

revoke all on function public.marketplace_activate_ad_payment(text,integer,timestamptz) from public,anon,authenticated;
grant execute on function public.marketplace_activate_ad_payment(text,integer,timestamptz) to service_role;

revoke all on function public.marketplace_active_ads() from public,anon,authenticated;
grant execute on function public.marketplace_active_ads() to anon,authenticated;

revoke all on function public.marketplace_my_ads() from public,anon,authenticated;
grant execute on function public.marketplace_my_ads() to authenticated;

notify pgrst,'reload schema';

commit;
