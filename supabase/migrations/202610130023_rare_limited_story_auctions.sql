begin;

alter table public.marketplace_products
  add column if not exists listing_type text not null default 'normal',
  add column if not exists story_title text,
  add column if not exists story_text text,
  add column if not exists story_video_url text,
  add column if not exists certificate_title text,
  add column if not exists certificate_details text,
  add column if not exists pending_story_image_paths text[] not null default '{}'::text[],
  add column if not exists public_story_image_paths text[] not null default '{}'::text[],
  add column if not exists pending_certificate_image_path text,
  add column if not exists public_certificate_image_path text;

alter table public.marketplace_products
  drop constraint if exists marketplace_products_listing_type_check,
  drop constraint if exists marketplace_products_story_title_check,
  drop constraint if exists marketplace_products_story_text_check,
  drop constraint if exists marketplace_products_certificate_title_check,
  drop constraint if exists marketplace_products_certificate_details_check,
  drop constraint if exists marketplace_products_story_images_count_check;

alter table public.marketplace_products
  add constraint marketplace_products_listing_type_check
    check(listing_type in ('normal','rare_limited')),
  add constraint marketplace_products_story_title_check
    check(story_title is null or char_length(story_title) between 3 and 120),
  add constraint marketplace_products_story_text_check
    check(story_text is null or char_length(story_text) between 100 and 12000),
  add constraint marketplace_products_certificate_title_check
    check(certificate_title is null or char_length(certificate_title) between 2 and 120),
  add constraint marketplace_products_certificate_details_check
    check(certificate_details is null or char_length(certificate_details)<=3000),
  add constraint marketplace_products_story_images_count_check
    check(cardinality(pending_story_image_paths)<=6 and cardinality(public_story_image_paths)<=6);

create index if not exists marketplace_products_rare_limited_idx
  on public.marketplace_products(approved_at desc)
  where listing_type='rare_limited' and status='approved';

create table if not exists public.marketplace_product_auctions (
  product_id uuid primary key references public.marketplace_products(id) on delete cascade,
  starting_bid numeric(12,2) not null check(starting_bid>0 and starting_bid<=9999999999.99),
  min_increment numeric(12,2) not null check(min_increment>0 and min_increment<=9999999999.99),
  duration_minutes integer not null check(duration_minutes between 60 and 10080),
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  check(
    (starts_at is null and ends_at is null)
    or
    (starts_at is not null and ends_at is not null and ends_at>starts_at)
  )
);

create table if not exists public.marketplace_product_bids (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.marketplace_product_auctions(product_id) on delete cascade,
  bidder_id uuid not null references auth.users(id) on delete cascade,
  amount numeric(12,2) not null check(amount>0 and amount<=9999999999.99),
  created_at timestamptz not null default now()
);

create index if not exists marketplace_product_bids_rank_idx
  on public.marketplace_product_bids(product_id,amount desc,created_at asc);

create index if not exists marketplace_product_bids_bidder_idx
  on public.marketplace_product_bids(bidder_id,created_at desc);

alter table public.marketplace_product_auctions enable row level security;
alter table public.marketplace_product_bids enable row level security;

revoke all on public.marketplace_product_auctions,public.marketplace_product_bids from public,anon,authenticated;
grant select on public.marketplace_product_auctions to anon,authenticated;

drop policy if exists "public reads approved auctions" on public.marketplace_product_auctions;
create policy "public reads approved auctions"
on public.marketplace_product_auctions for select to anon,authenticated
using(exists(
  select 1
  from public.marketplace_products product
  where product.id=product_id and product.status='approved'
));

drop policy if exists "owner reads own auctions" on public.marketplace_product_auctions;
create policy "owner reads own auctions"
on public.marketplace_product_auctions for select to authenticated
using(exists(
  select 1
  from public.marketplace_products product
  where product.id=product_id and product.submitted_by=auth.uid()
));

drop policy if exists "admin reads auctions" on public.marketplace_product_auctions;
create policy "admin reads auctions"
on public.marketplace_product_auctions for select to authenticated
using(public.is_marketplace_admin());

create or replace function public.marketplace_valid_story_video_url(p_url text)
returns boolean
language sql
immutable
set search_path=''
as $fn$
  select p_url is not null
    and char_length(p_url) between 12 and 1000
    and p_url !~ '[[:space:]]'
    and (
      p_url ~* '^https://([a-z0-9-]+[.])*(youtube[.]com|youtu[.]be)(?:[/?#]|$)'
      or p_url ~* '^https://([a-z0-9-]+[.])*vimeo[.]com(?:[/?#]|$)'
    )
$fn$;

create or replace function public.submit_marketplace_product_rich(
  p_slug text,
  p_name text,
  p_description text,
  p_min_price numeric,
  p_max_price numeric,
  p_category text,
  p_image_path text,
  p_links jsonb,
  p_listing_type text,
  p_story_title text default null,
  p_story_text text default null,
  p_story_image_paths text[] default '{}'::text[],
  p_story_video_url text default null,
  p_certificate_title text default null,
  p_certificate_details text default null,
  p_certificate_image_path text default null,
  p_auction_enabled boolean default false,
  p_auction_starting_bid numeric default null,
  p_auction_min_increment numeric default null,
  p_auction_duration_minutes integer default null
) returns uuid
language plpgsql
security definer
set search_path=''
as $fn$
declare
  actor uuid := auth.uid();
  product_id uuid;
  item jsonb;
  platform_name text;
  seller text;
  affiliate text;
  seen text[] := array[]::text[];
  media_path text;
  normalized_type text := coalesce(p_listing_type,'normal');
begin
  if actor is null then raise exception 'Authentication required' using errcode='42501'; end if;
  insert into public.marketplace_profiles(id) values(actor) on conflict(id) do nothing;

  if normalized_type not in ('normal','rare_limited') then raise exception 'Invalid listing type'; end if;
  if p_slug is null or char_length(p_slug) not between 3 and 100 or p_slug !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' then raise exception 'Invalid slug'; end if;
  if p_name is null or char_length(pg_catalog.btrim(p_name)) not between 2 and 100 then raise exception 'Invalid product name'; end if;
  if p_description is null or char_length(pg_catalog.btrim(p_description)) not between 10 and 2000 then raise exception 'Invalid description'; end if;
  if position('<' in p_name)>0 or position('>' in p_name)>0 or position('<' in p_description)>0 or position('>' in p_description)>0
    or p_name ~* 'javascript[[:space:]]*:' or p_description ~* 'javascript[[:space:]]*:' then raise exception 'Unsafe text'; end if;
  if p_min_price is null or p_min_price<=0 or p_min_price>9999999999.99 then raise exception 'Invalid minimum price'; end if;
  if p_max_price is null or p_max_price<=0 or p_max_price>9999999999.99 or p_max_price<p_min_price then raise exception 'Invalid maximum price'; end if;
  if p_category not in ('Vintage','Antiques','Traditional Crafts','Electronics','Traditional Games','Collectibles','Clothing','Home & Decor') then raise exception 'Invalid category'; end if;
  if p_image_path is null or position(actor::text || '/' in p_image_path)<>1 or p_image_path !~ '^[a-f0-9-]+/[a-f0-9-]+[.]webp$' then raise exception 'Invalid image path'; end if;
  if p_links is null or jsonb_typeof(p_links)<>'array' or jsonb_array_length(p_links) not between 1 and 10 then raise exception 'Choose one to ten platforms'; end if;

  if normalized_type='rare_limited' then
    if p_story_title is null or char_length(pg_catalog.btrim(p_story_title)) not between 3 and 120 then raise exception 'Rare listing story title is required'; end if;
    if p_story_text is null or char_length(pg_catalog.btrim(p_story_text)) not between 100 and 12000 then raise exception 'Rare listing story must be between 100 and 12000 characters'; end if;
    if position('<' in p_story_title)>0 or position('>' in p_story_title)>0 or position('<' in p_story_text)>0 or position('>' in p_story_text)>0 then raise exception 'Unsafe story text'; end if;
    if cardinality(coalesce(p_story_image_paths,'{}'::text[]))>6 then raise exception 'Maximum six story images'; end if;

    foreach media_path in array coalesce(p_story_image_paths,'{}'::text[]) loop
      if position(actor::text || '/' in media_path)<>1 or media_path !~ '^[a-f0-9-]+/[a-f0-9-]+[.]webp$' then raise exception 'Invalid story image path'; end if;
    end loop;

    if p_story_video_url is not null and not public.marketplace_valid_story_video_url(p_story_video_url) then raise exception 'Invalid story video URL'; end if;
    if p_certificate_title is not null and char_length(pg_catalog.btrim(p_certificate_title)) not between 2 and 120 then raise exception 'Invalid certificate title'; end if;
    if p_certificate_details is not null and char_length(pg_catalog.btrim(p_certificate_details))>3000 then raise exception 'Certificate details are too long'; end if;
    if p_certificate_image_path is not null and (
      position(actor::text || '/' in p_certificate_image_path)<>1
      or p_certificate_image_path !~ '^[a-f0-9-]+/[a-f0-9-]+[.]webp$'
    ) then raise exception 'Invalid certificate image path'; end if;

    if p_auction_enabled then
      if p_auction_starting_bid is null or p_auction_starting_bid<=0 or p_auction_starting_bid>9999999999.99 then raise exception 'Invalid starting bid'; end if;
      if p_auction_min_increment is null or p_auction_min_increment<=0 or p_auction_min_increment>9999999999.99 then raise exception 'Invalid minimum bid increment'; end if;
      if p_auction_duration_minutes is null or p_auction_duration_minutes not between 60 and 10080 then raise exception 'Auction duration must be between 1 hour and 7 days'; end if;
    end if;
  else
    p_story_title:=null;
    p_story_text:=null;
    p_story_image_paths:='{}'::text[];
    p_story_video_url:=null;
    p_certificate_title:=null;
    p_certificate_details:=null;
    p_certificate_image_path:=null;
    p_auction_enabled:=false;
  end if;

  insert into public.marketplace_products(
    slug,submitted_by,name,description,price,min_price,max_price,category,pending_image_path,
    listing_type,story_title,story_text,story_video_url,certificate_title,certificate_details,
    pending_story_image_paths,pending_certificate_image_path
  ) values(
    p_slug,actor,pg_catalog.btrim(p_name),pg_catalog.btrim(p_description),p_min_price,p_min_price,p_max_price,p_category,p_image_path,
    normalized_type,nullif(pg_catalog.btrim(p_story_title),''),nullif(pg_catalog.btrim(p_story_text),''),
    nullif(pg_catalog.btrim(p_story_video_url),''),nullif(pg_catalog.btrim(p_certificate_title),''),
    nullif(pg_catalog.btrim(p_certificate_details),''),coalesce(p_story_image_paths,'{}'::text[]),p_certificate_image_path
  )
  returning id into product_id;

  for item in select value from jsonb_array_elements(p_links) loop
    platform_name:=item->>'platform';
    seller:=item->>'seller_url';
    affiliate:=nullif(item->>'affiliate_url','');

    if platform_name is null or platform_name=any(seen) then raise exception 'Duplicate or missing platform'; end if;
    if not public.marketplace_valid_platform_url(platform_name,seller) then raise exception 'Invalid seller URL'; end if;
    if affiliate is not null and not public.marketplace_valid_platform_url(platform_name,affiliate) then raise exception 'Invalid affiliate URL'; end if;

    insert into public.marketplace_product_links(product_id,platform,seller_url,affiliate_url)
    values(product_id,platform_name,seller,affiliate);

    seen:=array_append(seen,platform_name);
  end loop;

  if normalized_type='rare_limited' and p_auction_enabled then
    insert into public.marketplace_product_auctions(product_id,starting_bid,min_increment,duration_minutes)
    values(product_id,p_auction_starting_bid,p_auction_min_increment,p_auction_duration_minutes);
  end if;

  return product_id;
end
$fn$;

create or replace function public.marketplace_admin_pending()
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
    'id',p.id,
    'slug',p.slug,
    'name',p.name,
    'description',p.description,
    'price',p.price,
    'min_price',p.min_price,
    'max_price',p.max_price,
    'category',p.category,
    'listing_type',p.listing_type,
    'story_title',p.story_title,
    'story_text',p.story_text,
    'story_video_url',p.story_video_url,
    'certificate_title',p.certificate_title,
    'certificate_details',p.certificate_details,
    'pending_story_image_paths',p.pending_story_image_paths,
    'pending_certificate_image_path',p.pending_certificate_image_path,
    'pending_image_path',p.pending_image_path,
    'submitted_at',p.submitted_at,
    'auction',(
      select jsonb_build_object(
        'starting_bid',auction.starting_bid,
        'min_increment',auction.min_increment,
        'duration_minutes',auction.duration_minutes
      )
      from public.marketplace_product_auctions auction
      where auction.product_id=p.id
    ),
    'submitter',jsonb_build_object(
      'id',u.id,
      'email',u.email,
      'display_name',profile.display_name,
      'avatar_path',profile.avatar_path,
      'approved_products',(
        select count(*)
        from public.marketplace_products approved
        where approved.submitted_by=p.submitted_by and approved.status='approved'
      )
    ),
    'links',coalesce((
      select jsonb_agg(jsonb_build_object(
        'platform',l.platform,
        'seller_url',l.seller_url,
        'affiliate_url',l.affiliate_url
      ) order by l.platform)
      from public.marketplace_product_links l
      where l.product_id=p.id
    ),'[]'::jsonb)
  ) order by p.submitted_at),'[]'::jsonb)
  into result
  from public.marketplace_products p
  join auth.users u on u.id=p.submitted_by
  left join public.marketplace_profiles profile on profile.id=p.submitted_by
  where p.status='pending';

  return result;
end
$fn$;

create or replace function public.marketplace_admin_decide_rich(
  p_id uuid,
  p_decision text,
  p_reason text default null,
  p_public_image_path text default null,
  p_public_story_image_paths text[] default '{}'::text[],
  p_public_certificate_image_path text default null
) returns jsonb
language plpgsql
security definer
set search_path=''
as $fn$
declare
  actor uuid:=auth.uid();
  product public.marketplace_products;
  media_path text;
begin
  if actor is null or not public.is_marketplace_admin() then raise exception 'Admin access required' using errcode='42501'; end if;

  select * into product
  from public.marketplace_products
  where id=p_id
  for update;

  if not found or product.status<>'pending' then raise exception 'Submission is not pending'; end if;

  if p_decision='approved' then
    if product.submitted_by=actor then raise exception 'Administrators cannot approve their own submission' using errcode='42501'; end if;
    if p_public_image_path is null or p_public_image_path !~ '^approved/[a-f0-9-]+[.]webp$' then raise exception 'Approved image is required'; end if;
    if cardinality(coalesce(p_public_story_image_paths,'{}'::text[]))<>cardinality(product.pending_story_image_paths) then raise exception 'Approved story images do not match submission'; end if;

    foreach media_path in array coalesce(p_public_story_image_paths,'{}'::text[]) loop
      if media_path !~ '^approved/[a-f0-9-]+[.]webp$' then raise exception 'Invalid approved story image'; end if;
    end loop;

    if product.pending_certificate_image_path is not null then
      if p_public_certificate_image_path is null or p_public_certificate_image_path !~ '^approved/[a-f0-9-]+[.]webp$' then raise exception 'Approved certificate image is required'; end if;
    elsif p_public_certificate_image_path is not null then
      raise exception 'Unexpected certificate image';
    end if;

    update public.marketplace_products
    set status='approved',
        public_image_path=p_public_image_path,
        public_story_image_paths=coalesce(p_public_story_image_paths,'{}'::text[]),
        public_certificate_image_path=p_public_certificate_image_path,
        pending_story_image_paths='{}'::text[],
        pending_certificate_image_path=null,
        rejection_reason=null,
        reviewed_at=now(),
        reviewed_by=actor,
        approved_at=now(),
        updated_at=now()
    where id=p_id;

    update public.marketplace_product_auctions
    set starts_at=now(),
        ends_at=now()+make_interval(mins=>duration_minutes)
    where product_id=p_id
      and starts_at is null
      and ends_at is null;

    return jsonb_build_object(
      'pending_image_path',product.pending_image_path,
      'pending_story_image_paths',product.pending_story_image_paths,
      'pending_certificate_image_path',product.pending_certificate_image_path
    );
  end if;

  if p_decision='rejected' then
    if p_reason is null or char_length(pg_catalog.btrim(p_reason)) not between 1 and 500 then raise exception 'Rejection reason is required'; end if;

    update public.marketplace_products
    set status='rejected',
        public_image_path=null,
        public_story_image_paths='{}'::text[],
        public_certificate_image_path=null,
        rejection_reason=pg_catalog.btrim(p_reason),
        reviewed_at=now(),
        reviewed_by=actor,
        approved_at=null,
        updated_at=now()
    where id=p_id;

    return jsonb_build_object(
      'pending_image_path',product.pending_image_path,
      'pending_story_image_paths',product.pending_story_image_paths,
      'pending_certificate_image_path',product.pending_certificate_image_path
    );
  end if;

  raise exception 'Invalid moderation decision';
end
$fn$;

create or replace function public.marketplace_public_auction(p_product_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path=''
as $fn$
declare
  product public.marketplace_products;
  auction public.marketplace_product_auctions;
  highest public.marketplace_product_bids;
  bid_count bigint;
  winner_name text;
  status_text text;
  next_bid numeric;
begin
  select * into product
  from public.marketplace_products
  where id=p_product_id and status='approved' and listing_type='rare_limited';

  if not found then return null; end if;

  select * into auction
  from public.marketplace_product_auctions
  where product_id=p_product_id;

  if not found then return null; end if;

  select * into highest
  from public.marketplace_product_bids
  where product_id=p_product_id
  order by amount desc,created_at asc
  limit 1;

  select count(*) into bid_count
  from public.marketplace_product_bids
  where product_id=p_product_id;

  if auction.starts_at is null or auction.ends_at is null then
    status_text:='pending';
  elsif now()<auction.starts_at then
    status_text:='upcoming';
  elsif now()>=auction.ends_at then
    status_text:='ended';
  else
    status_text:='live';
  end if;

  if highest.id is null then
    next_bid:=auction.starting_bid;
  else
    next_bid:=highest.amount+auction.min_increment;
  end if;

  if status_text='ended' and highest.id is not null then
    select coalesce(nullif(profile.display_name,''),'Marketplace bidder')
    into winner_name
    from auth.users user_row
    left join public.marketplace_profiles profile on profile.id=user_row.id
    where user_row.id=highest.bidder_id;
  end if;

  return jsonb_build_object(
    'status',status_text,
    'starting_bid',auction.starting_bid,
    'min_increment',auction.min_increment,
    'starts_at',auction.starts_at,
    'ends_at',auction.ends_at,
    'bid_count',bid_count,
    'current_bid',case when highest.id is null then null else highest.amount end,
    'next_minimum_bid',next_bid,
    'winner_name',winner_name
  );
end
$fn$;

create or replace function public.marketplace_place_bid(
  p_product_id uuid,
  p_amount numeric
) returns jsonb
language plpgsql
security definer
set search_path=''
as $fn$
declare
  actor uuid:=auth.uid();
  product public.marketplace_products;
  auction public.marketplace_product_auctions;
  highest numeric;
  required_amount numeric;
begin
  if actor is null then raise exception 'Authentication required' using errcode='42501'; end if;
  if p_amount is null or p_amount<=0 or p_amount>9999999999.99 or p_amount<>round(p_amount,2) then raise exception 'Invalid bid amount'; end if;

  select * into product
  from public.marketplace_products
  where id=p_product_id
  for update;

  if not found or product.status<>'approved' or product.listing_type<>'rare_limited' then raise exception 'Auction product is unavailable'; end if;
  if product.submitted_by=actor then raise exception 'Sellers cannot bid on their own product' using errcode='42501'; end if;

  select * into auction
  from public.marketplace_product_auctions
  where product_id=p_product_id
  for update;

  if not found or auction.starts_at is null or auction.ends_at is null then raise exception 'Auction is unavailable'; end if;
  if now()<auction.starts_at then raise exception 'Auction has not started'; end if;
  if now()>=auction.ends_at then raise exception 'Auction has ended'; end if;

  select max(amount) into highest
  from public.marketplace_product_bids
  where product_id=p_product_id;

  required_amount:=case when highest is null then auction.starting_bid else highest+auction.min_increment end;

  if p_amount<required_amount then
    raise exception 'Bid must be at least %',required_amount;
  end if;

  insert into public.marketplace_profiles(id) values(actor) on conflict(id) do nothing;

  insert into public.marketplace_product_bids(product_id,bidder_id,amount)
  values(p_product_id,actor,p_amount);

  return public.marketplace_public_auction(p_product_id);
end
$fn$;

create or replace function public.marketplace_owner_delete_product(p_id uuid)
returns jsonb
language plpgsql
security definer
set search_path=''
as $fn$
declare
  actor uuid:=auth.uid();
  product public.marketplace_products;
  edit_paths jsonb;
begin
  if actor is null then raise exception 'Authentication required' using errcode='42501'; end if;

  select * into product
  from public.marketplace_products
  where id=p_id and submitted_by=actor
  for update;

  if not found then raise exception 'Product not found' using errcode='42501'; end if;

  if exists(select 1 from public.marketplace_product_bids bid where bid.product_id=p_id) then
    raise exception 'Products with auction bids cannot be deleted';
  end if;

  select coalesce(jsonb_agg(pending_image_path) filter(where pending_image_path is not null),'[]'::jsonb)
  into edit_paths
  from public.marketplace_product_edits
  where product_id=p_id;

  delete from public.marketplace_account_saves where product_key=p_id::text;
  delete from public.marketplace_products where id=p_id;

  return jsonb_build_object(
    'id',product.id,
    'public_image_path',product.public_image_path,
    'pending_image_path',product.pending_image_path,
    'edit_image_paths',edit_paths,
    'public_story_image_paths',product.public_story_image_paths,
    'pending_story_image_paths',product.pending_story_image_paths,
    'public_certificate_image_path',product.public_certificate_image_path,
    'pending_certificate_image_path',product.pending_certificate_image_path
  );
end
$fn$;

create or replace function public.marketplace_admin_delete_product(p_id uuid)
returns jsonb
language plpgsql
security definer
set search_path=''
as $fn$
declare
  product public.marketplace_products;
  edit_paths jsonb;
begin
  if auth.uid() is null or not public.is_marketplace_admin() then raise exception 'Admin access required' using errcode='42501'; end if;

  select * into product
  from public.marketplace_products
  where id=p_id
  for update;

  if not found then raise exception 'Product not found'; end if;
  if product.status<>'approved' then raise exception 'Only published products can be deleted here'; end if;

  select coalesce(jsonb_agg(pending_image_path) filter(where pending_image_path is not null),'[]'::jsonb)
  into edit_paths
  from public.marketplace_product_edits
  where product_id=p_id;

  delete from public.marketplace_account_saves where product_key=p_id::text;
  delete from public.marketplace_products where id=p_id;

  return jsonb_build_object(
    'id',product.id,
    'name',product.name,
    'public_image_path',product.public_image_path,
    'pending_image_path',product.pending_image_path,
    'edit_image_paths',edit_paths,
    'public_story_image_paths',product.public_story_image_paths,
    'pending_story_image_paths',product.pending_story_image_paths,
    'public_certificate_image_path',product.public_certificate_image_path,
    'pending_certificate_image_path',product.pending_certificate_image_path
  );
end
$fn$;

revoke all on function public.marketplace_valid_story_video_url(text) from public,anon,authenticated;
revoke all on function public.submit_marketplace_product_rich(text,text,text,numeric,numeric,text,text,jsonb,text,text,text,text[],text,text,text,text,boolean,numeric,numeric,integer) from public,anon,authenticated;
revoke all on function public.marketplace_admin_pending() from public,anon,authenticated;
revoke all on function public.marketplace_admin_decide_rich(uuid,text,text,text,text[],text) from public,anon,authenticated;
revoke all on function public.marketplace_public_auction(uuid) from public,anon,authenticated;
revoke all on function public.marketplace_place_bid(uuid,numeric) from public,anon,authenticated;
revoke all on function public.marketplace_owner_delete_product(uuid) from public,anon,authenticated;
revoke all on function public.marketplace_admin_delete_product(uuid) from public,anon,authenticated;

grant execute on function public.submit_marketplace_product_rich(text,text,text,numeric,numeric,text,text,jsonb,text,text,text,text[],text,text,text,text,boolean,numeric,numeric,integer) to authenticated;
grant execute on function public.marketplace_admin_pending() to authenticated;
grant execute on function public.marketplace_admin_decide_rich(uuid,text,text,text,text[],text) to authenticated;
grant execute on function public.marketplace_public_auction(uuid) to anon,authenticated;
grant execute on function public.marketplace_place_bid(uuid,numeric) to authenticated;
grant execute on function public.marketplace_owner_delete_product(uuid) to authenticated;
grant execute on function public.marketplace_admin_delete_product(uuid) to authenticated;

notify pgrst,'reload schema';

commit;
