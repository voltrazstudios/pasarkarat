begin;

create table if not exists public.marketplace_product_edits (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.marketplace_products(id) on delete cascade,
  submitted_by uuid not null references auth.users(id) on delete cascade,
  name text not null check(char_length(name) between 2 and 100),
  description text not null check(char_length(description) between 10 and 2000),
  min_price numeric(12,2) not null check(min_price>0 and min_price<=9999999999.99),
  max_price numeric(12,2) not null check(max_price>0 and max_price<=9999999999.99 and max_price>=min_price),
  category text not null check(category in ('Vintage','Antiques','Traditional Crafts','Electronics','Traditional Games','Collectibles','Clothing','Home & Decor')),
  pending_image_path text check(pending_image_path is null or char_length(pending_image_path) between 3 and 500),
  status text not null default 'pending' check(status in ('pending','approved','rejected')),
  rejection_reason text check(rejection_reason is null or char_length(rejection_reason)<=500),
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id)
);

create unique index if not exists marketplace_product_one_pending_edit_idx
  on public.marketplace_product_edits(product_id)
  where status='pending';

create index if not exists marketplace_product_edits_owner_idx
  on public.marketplace_product_edits(submitted_by,submitted_at desc);

create table if not exists public.marketplace_product_edit_links (
  id uuid primary key default gen_random_uuid(),
  edit_id uuid not null references public.marketplace_product_edits(id) on delete cascade,
  platform text not null check(platform in (
    'Shopee','Carousell','Facebook','TikTok Shop','Mudah.my',
    'Lazada','Lelong.my','eBay','Etsy','Own website'
  )),
  seller_url text not null check(char_length(seller_url) between 8 and 2048 and seller_url ~ '^https://'),
  affiliate_url text check(affiliate_url is null or (char_length(affiliate_url) between 8 and 2048 and affiliate_url ~ '^https://')),
  unique(edit_id,platform)
);

alter table public.marketplace_product_edits enable row level security;
alter table public.marketplace_product_edit_links enable row level security;
revoke all on public.marketplace_product_edits,public.marketplace_product_edit_links from public,anon,authenticated;
grant select on public.marketplace_product_edits,public.marketplace_product_edit_links to authenticated;

drop policy if exists "marketplace owner reads product edits" on public.marketplace_product_edits;
create policy "marketplace owner reads product edits"
on public.marketplace_product_edits for select to authenticated
using(submitted_by=auth.uid());

drop policy if exists "marketplace admin reads product edits" on public.marketplace_product_edits;
create policy "marketplace admin reads product edits"
on public.marketplace_product_edits for select to authenticated
using(public.is_marketplace_admin());

drop policy if exists "marketplace owner reads product edit links" on public.marketplace_product_edit_links;
create policy "marketplace owner reads product edit links"
on public.marketplace_product_edit_links for select to authenticated
using(exists(
  select 1 from public.marketplace_product_edits e
  where e.id=edit_id and e.submitted_by=auth.uid()
));

drop policy if exists "marketplace admin reads product edit links" on public.marketplace_product_edit_links;
create policy "marketplace admin reads product edit links"
on public.marketplace_product_edit_links for select to authenticated
using(public.is_marketplace_admin());

create or replace function public.submit_marketplace_product_edit(
  p_product_id uuid,
  p_name text,
  p_description text,
  p_min_price numeric,
  p_max_price numeric,
  p_category text,
  p_image_path text,
  p_links jsonb
) returns uuid
language plpgsql
security definer
set search_path=''
as $$
declare
  actor uuid := auth.uid();
  product public.marketplace_products;
  edit_id uuid;
  item jsonb;
  platform_name text;
  seller text;
  affiliate text;
  seen text[] := array[]::text[];
begin
  if actor is null then raise exception 'Authentication required' using errcode='42501'; end if;

  select * into product
  from public.marketplace_products
  where id=p_product_id and submitted_by=actor
  for update;

  if not found then raise exception 'Product not found' using errcode='42501'; end if;
  if product.status<>'approved' then raise exception 'Only approved products can be edited'; end if;
  if exists(select 1 from public.marketplace_product_edits where product_id=p_product_id and status='pending') then
    raise exception 'An edit is already waiting for review';
  end if;

  if p_name is null or char_length(pg_catalog.btrim(p_name)) not between 2 and 100 then raise exception 'Invalid product name'; end if;
  if p_description is null or char_length(pg_catalog.btrim(p_description)) not between 10 and 2000 then raise exception 'Invalid description'; end if;
  if position('<' in p_name)>0 or position('>' in p_name)>0 or position('<' in p_description)>0 or position('>' in p_description)>0
    or p_name ~* 'javascript[[:space:]]*:' or p_description ~* 'javascript[[:space:]]*:' then raise exception 'Unsafe text'; end if;
  if p_min_price is null or p_min_price<=0 or p_min_price>9999999999.99 then raise exception 'Invalid minimum price'; end if;
  if p_max_price is null or p_max_price<=0 or p_max_price>9999999999.99 or p_max_price<p_min_price then raise exception 'Invalid maximum price'; end if;
  if p_category not in ('Vintage','Antiques','Traditional Crafts','Electronics','Traditional Games','Collectibles','Clothing','Home & Decor') then raise exception 'Invalid category'; end if;
  if p_image_path is not null and (
    position(actor::text || '/' in p_image_path)<>1
    or p_image_path !~ '^[a-f0-9-]+/[a-f0-9-]+[.]webp$'
  ) then raise exception 'Invalid image path'; end if;
  if p_links is null or jsonb_typeof(p_links)<>'array' or jsonb_array_length(p_links) not between 1 and 10 then raise exception 'Choose one to ten platforms'; end if;

  insert into public.marketplace_product_edits(
    product_id,submitted_by,name,description,min_price,max_price,category,pending_image_path
  ) values(
    p_product_id,actor,pg_catalog.btrim(p_name),pg_catalog.btrim(p_description),
    p_min_price,p_max_price,p_category,p_image_path
  )
  returning id into edit_id;

  for item in select value from jsonb_array_elements(p_links) loop
    platform_name := item->>'platform';
    seller := item->>'seller_url';
    affiliate := nullif(item->>'affiliate_url','');

    if platform_name is null or platform_name=any(seen) then raise exception 'Duplicate or missing platform'; end if;
    if not public.marketplace_valid_platform_url(platform_name,seller) then raise exception 'Invalid seller URL'; end if;
    if affiliate is not null and not public.marketplace_valid_platform_url(platform_name,affiliate) then raise exception 'Invalid affiliate URL'; end if;

    insert into public.marketplace_product_edit_links(edit_id,platform,seller_url,affiliate_url)
    values(edit_id,platform_name,seller,affiliate);

    seen := array_append(seen,platform_name);
  end loop;

  return edit_id;
end
$$;

create or replace function public.marketplace_admin_pending_edits()
returns jsonb
language plpgsql
stable
security definer
set search_path=''
as $$
declare result jsonb;
begin
  if not public.is_marketplace_admin() then
    raise exception 'Admin access required' using errcode='42501';
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id',e.id,
    'product_id',p.id,
    'slug',p.slug,
    'current_name',p.name,
    'current_public_image_path',p.public_image_path,
    'name',e.name,
    'description',e.description,
    'min_price',e.min_price,
    'max_price',e.max_price,
    'category',e.category,
    'pending_image_path',e.pending_image_path,
    'submitted_at',e.submitted_at,
    'submitter',jsonb_build_object(
      'id',u.id,
      'email',u.email,
      'display_name',profile.display_name,
      'avatar_path',profile.avatar_path
    ),
    'links',coalesce((
      select jsonb_agg(jsonb_build_object(
        'platform',l.platform,
        'seller_url',l.seller_url,
        'affiliate_url',l.affiliate_url
      ) order by l.platform)
      from public.marketplace_product_edit_links l
      where l.edit_id=e.id
    ),'[]'::jsonb)
  ) order by e.submitted_at),'[]'::jsonb)
  into result
  from public.marketplace_product_edits e
  join public.marketplace_products p on p.id=e.product_id
  join auth.users u on u.id=e.submitted_by
  left join public.marketplace_profiles profile on profile.id=e.submitted_by
  where e.status='pending';

  return result;
end
$$;

create or replace function public.marketplace_admin_decide_edit(
  p_edit_id uuid,
  p_decision text,
  p_reason text default null,
  p_public_image_path text default null
) returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  actor uuid := auth.uid();
  edit_row public.marketplace_product_edits;
  product public.marketplace_products;
  old_public_image_path text;
begin
  if actor is null or not public.is_marketplace_admin() then
    raise exception 'Admin access required' using errcode='42501';
  end if;

  select * into edit_row
  from public.marketplace_product_edits
  where id=p_edit_id
  for update;

  if not found or edit_row.status<>'pending' then raise exception 'Edit is not pending'; end if;

  select * into product
  from public.marketplace_products
  where id=edit_row.product_id
  for update;

  if not found or product.status<>'approved' then raise exception 'Published product is unavailable'; end if;

  if p_decision='approved' then
    if edit_row.submitted_by=actor then
      raise exception 'Administrators cannot approve their own edit' using errcode='42501';
    end if;

    if edit_row.pending_image_path is not null then
      if p_public_image_path is null or p_public_image_path !~ '^approved/[a-f0-9-]+[.]webp$' then
        raise exception 'Approved image is required';
      end if;
    elsif p_public_image_path is not null then
      raise exception 'Unexpected approved image';
    end if;

    old_public_image_path := product.public_image_path;

    update public.marketplace_products
    set
      name=edit_row.name,
      description=edit_row.description,
      price=edit_row.min_price,
      min_price=edit_row.min_price,
      max_price=edit_row.max_price,
      category=edit_row.category,
      public_image_path=coalesce(p_public_image_path,public_image_path),
      updated_at=now()
    where id=product.id;

    delete from public.marketplace_product_links where product_id=product.id;

    insert into public.marketplace_product_links(product_id,platform,seller_url,affiliate_url)
    select product.id,platform,seller_url,affiliate_url
    from public.marketplace_product_edit_links
    where edit_id=edit_row.id;

    update public.marketplace_product_edits
    set status='approved',rejection_reason=null,reviewed_at=now(),reviewed_by=actor
    where id=edit_row.id;

    return jsonb_build_object(
      'product_id',product.id,
      'pending_image_path',edit_row.pending_image_path,
      'old_public_image_path',case when p_public_image_path is not null then old_public_image_path else null end
    );
  end if;

  if p_decision='rejected' then
    if p_reason is null or char_length(pg_catalog.btrim(p_reason)) not between 1 and 500 then
      raise exception 'Rejection reason is required';
    end if;

    update public.marketplace_product_edits
    set status='rejected',rejection_reason=pg_catalog.btrim(p_reason),reviewed_at=now(),reviewed_by=actor
    where id=edit_row.id;

    return jsonb_build_object(
      'product_id',product.id,
      'pending_image_path',edit_row.pending_image_path,
      'old_public_image_path',null
    );
  end if;

  raise exception 'Invalid moderation decision';
end
$$;

-- Keep historical promotion payments valid if their product is later deleted.
-- The FK already uses ON DELETE SET NULL; remove only the old target check that
-- required every product-boost payment to retain a product_id forever.
do $do$
declare constraint_row record;
begin
  for constraint_row in
    select conname,pg_catalog.pg_get_constraintdef(oid) as definition
    from pg_catalog.pg_constraint
    where conrelid='public.marketplace_promotion_payments'::regclass
      and contype='c'
  loop
    if constraint_row.definition like '%promotion_type%'
      and constraint_row.definition like '%product_id%' then
      execute format('alter table public.marketplace_promotion_payments drop constraint %I',constraint_row.conname);
    end if;
  end loop;
end
$do$;

alter table public.marketplace_promotion_payments
  drop constraint if exists marketplace_promotion_payments_target_check;

alter table public.marketplace_promotion_payments
  add constraint marketplace_promotion_payments_target_check
  check(
    promotion_type='product_boost'
    or (promotion_type='featured_store' and product_id is null)
  );

create or replace function public.marketplace_owner_delete_product(p_id uuid)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  actor uuid := auth.uid();
  product public.marketplace_products;
  edit_paths jsonb;
begin
  if actor is null then raise exception 'Authentication required' using errcode='42501'; end if;

  select * into product
  from public.marketplace_products
  where id=p_id and submitted_by=actor
  for update;

  if not found then raise exception 'Product not found' using errcode='42501'; end if;

  select coalesce(jsonb_agg(pending_image_path) filter(where pending_image_path is not null),'[]'::jsonb)
  into edit_paths
  from public.marketplace_product_edits
  where product_id=p_id;

  delete from public.marketplace_products where id=p_id;

  return jsonb_build_object(
    'id',product.id,
    'public_image_path',product.public_image_path,
    'pending_image_path',product.pending_image_path,
    'edit_image_paths',edit_paths
  );
end
$$;

create table if not exists public.marketplace_product_views (
  product_id uuid not null references public.marketplace_products(id) on delete cascade,
  visitor_id text not null check(char_length(visitor_id) between 8 and 120),
  view_count bigint not null default 1 check(view_count>0),
  first_viewed_at timestamptz not null default now(),
  last_viewed_at timestamptz not null default now(),
  primary key(product_id,visitor_id)
);

create table if not exists public.marketplace_product_platform_clicks (
  product_id uuid not null references public.marketplace_products(id) on delete cascade,
  platform text not null,
  visitor_id text not null check(char_length(visitor_id) between 8 and 120),
  click_count bigint not null default 1 check(click_count>0),
  first_clicked_at timestamptz not null default now(),
  last_clicked_at timestamptz not null default now(),
  primary key(product_id,platform,visitor_id)
);

alter table public.marketplace_product_views enable row level security;
alter table public.marketplace_product_platform_clicks enable row level security;
revoke all on public.marketplace_product_views,public.marketplace_product_platform_clicks from public,anon,authenticated;

create or replace function public.marketplace_record_product_view(p_product_id uuid,p_visitor_id text)
returns void
language plpgsql
security definer
set search_path=''
as $$
begin
  if p_visitor_id is null or p_visitor_id !~ '^[A-Za-z0-9_-]{8,120}$' then return; end if;
  if not exists(select 1 from public.marketplace_products where id=p_product_id and status='approved') then return; end if;

  insert into public.marketplace_product_views(product_id,visitor_id)
  values(p_product_id,p_visitor_id)
  on conflict(product_id,visitor_id) do update
  set view_count=public.marketplace_product_views.view_count+1,last_viewed_at=now();
end
$$;

create or replace function public.marketplace_record_platform_click(p_product_id uuid,p_platform text,p_visitor_id text)
returns void
language plpgsql
security definer
set search_path=''
as $$
begin
  if p_visitor_id is null or p_visitor_id !~ '^[A-Za-z0-9_-]{8,120}$' then return; end if;
  if not exists(
    select 1
    from public.marketplace_products p
    join public.marketplace_product_links l on l.product_id=p.id
    where p.id=p_product_id and p.status='approved' and l.platform=p_platform
  ) then return; end if;

  insert into public.marketplace_product_platform_clicks(product_id,platform,visitor_id)
  values(p_product_id,p_platform,p_visitor_id)
  on conflict(product_id,platform,visitor_id) do update
  set click_count=public.marketplace_product_platform_clicks.click_count+1,last_clicked_at=now();
end
$$;

create or replace function public.marketplace_my_product_analytics(p_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path=''
as $$
declare
  actor uuid := auth.uid();
  product public.marketplace_products;
  result jsonb;
begin
  if actor is null then raise exception 'Authentication required' using errcode='42501'; end if;

  select * into product
  from public.marketplace_products
  where id=p_id and submitted_by=actor;

  if not found then raise exception 'Product not found' using errcode='42501'; end if;

  select jsonb_build_object(
    'id',product.id,
    'name',product.name,
    'slug',product.slug,
    'status',product.status,
    'unique_viewers',coalesce((select count(*) from public.marketplace_product_views v where v.product_id=product.id),0),
    'total_views',coalesce((select sum(v.view_count) from public.marketplace_product_views v where v.product_id=product.id),0),
    'platforms',coalesce((
      select jsonb_agg(jsonb_build_object(
        'platform',l.platform,
        'people',coalesce((select count(*) from public.marketplace_product_platform_clicks c where c.product_id=product.id and c.platform=l.platform),0),
        'clicks',coalesce((select sum(c.click_count) from public.marketplace_product_platform_clicks c where c.product_id=product.id and c.platform=l.platform),0)
      ) order by l.platform)
      from public.marketplace_product_links l
      where l.product_id=product.id
    ),'[]'::jsonb)
  )
  into result;

  return result;
end
$$;

revoke all on function public.submit_marketplace_product_edit(uuid,text,text,numeric,numeric,text,text,jsonb) from public,anon,authenticated;
revoke all on function public.marketplace_admin_pending_edits() from public,anon,authenticated;
revoke all on function public.marketplace_admin_decide_edit(uuid,text,text,text) from public,anon,authenticated;
revoke all on function public.marketplace_owner_delete_product(uuid) from public,anon,authenticated;
revoke all on function public.marketplace_record_product_view(uuid,text) from public,anon,authenticated;
revoke all on function public.marketplace_record_platform_click(uuid,text,text) from public,anon,authenticated;
revoke all on function public.marketplace_my_product_analytics(uuid) from public,anon,authenticated;

grant execute on function public.submit_marketplace_product_edit(uuid,text,text,numeric,numeric,text,text,jsonb) to authenticated;
grant execute on function public.marketplace_admin_pending_edits() to authenticated;
grant execute on function public.marketplace_admin_decide_edit(uuid,text,text,text) to authenticated;
grant execute on function public.marketplace_owner_delete_product(uuid) to authenticated;
grant execute on function public.marketplace_record_product_view(uuid,text) to anon,authenticated;
grant execute on function public.marketplace_record_platform_click(uuid,text,text) to anon,authenticated;
grant execute on function public.marketplace_my_product_analytics(uuid) to authenticated;

notify pgrst,'reload schema';

commit;
