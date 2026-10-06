begin;

create table public.marketplace_products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (char_length(slug) between 3 and 100 and slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  submitted_by uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 2 and 100),
  description text not null check (char_length(description) between 10 and 2000),
  price numeric(12,2) not null check (price > 0 and price <= 9999999999.99),
  currency text not null default 'MYR' check (currency='MYR'),
  category text not null check (category in ('Vintage','Antiques','Traditional Crafts','Electronics','Traditional Games','Collectibles','Clothing','Home & Decor')),
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  pending_image_path text not null check (char_length(pending_image_path) between 3 and 500),
  public_image_path text check (public_image_path is null or char_length(public_image_path) between 3 and 500),
  rejection_reason text check (rejection_reason is null or char_length(rejection_reason) <= 500),
  submitted_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id),
  approved_at timestamptz,
  check (
    (status='pending' and reviewed_at is null and reviewed_by is null and approved_at is null and rejection_reason is null and public_image_path is null)
    or
    (status='approved' and reviewed_at is not null and reviewed_by is not null and approved_at is not null and rejection_reason is null and public_image_path is not null)
    or
    (status='rejected' and reviewed_at is not null and reviewed_by is not null and approved_at is null and rejection_reason is not null and public_image_path is null)
  )
);

create table public.marketplace_product_links (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.marketplace_products(id) on delete cascade,
  platform text not null check (platform in ('Shopee','Carousell','Facebook')),
  seller_url text not null check (char_length(seller_url) between 8 and 2048 and seller_url ~ '^https://'),
  affiliate_url text check (affiliate_url is null or (char_length(affiliate_url) between 8 and 2048 and affiliate_url ~ '^https://')),
  unique(product_id,platform)
);

create index marketplace_products_public_idx on public.marketplace_products(status,approved_at desc);
create index marketplace_products_owner_idx on public.marketplace_products(submitted_by,submitted_at desc);
create index marketplace_products_pending_idx on public.marketplace_products(submitted_at) where status='pending';

alter table public.marketplace_products enable row level security;
alter table public.marketplace_product_links enable row level security;
revoke all on public.marketplace_products, public.marketplace_product_links from public, anon, authenticated;
grant select on public.marketplace_products, public.marketplace_product_links to anon, authenticated;

create policy "marketplace public approved products" on public.marketplace_products for select to anon, authenticated using (status='approved');
create policy "marketplace owner reads submissions" on public.marketplace_products for select to authenticated using (submitted_by=auth.uid());
create policy "marketplace admin reads products" on public.marketplace_products for select to authenticated using (public.is_marketplace_admin());

create policy "marketplace public approved links" on public.marketplace_product_links for select to anon, authenticated
using (exists(select 1 from public.marketplace_products p where p.id=product_id and p.status='approved'));
create policy "marketplace owner reads links" on public.marketplace_product_links for select to authenticated
using (exists(select 1 from public.marketplace_products p where p.id=product_id and p.submitted_by=auth.uid()));
create policy "marketplace admin reads links" on public.marketplace_product_links for select to authenticated using (public.is_marketplace_admin());

create or replace function public.marketplace_valid_platform_url(p_platform text,p_url text)
returns boolean language sql immutable set search_path=''
as $$
  select p_url is not null
    and char_length(p_url) between 8 and 2048
    and p_url !~ '[[:space:]]'
    and p_url !~* '^https://[^/]*@'
    and case p_platform
      when 'Shopee' then p_url ~* '^https://([a-z0-9-]+\.)*(shopee\.com\.my|shp\.ee)(/|$)'
      when 'Carousell' then p_url ~* '^https://([a-z0-9-]+\.)*(carousell\.com\.my|carousell\.sg|carousell\.com)(/|$)'
      when 'Facebook' then p_url ~* '^https://([a-z0-9-]+\.)*(facebook\.com|fb\.com)(/|$)'
      else false
    end
$$;

create or replace function public.submit_marketplace_product(
  p_slug text,p_name text,p_description text,p_price numeric,p_category text,p_image_path text,p_links jsonb
) returns uuid
language plpgsql security definer set search_path=''
as $$
declare actor uuid := auth.uid(); product_id uuid; item jsonb; platform_name text; seller text; affiliate text; seen text[] := array[]::text[];
begin
  if actor is null then raise exception 'Authentication required' using errcode='42501'; end if;
  insert into public.marketplace_profiles(id) values(actor) on conflict(id) do nothing;

  if p_slug is null or char_length(p_slug) not between 3 and 100 or p_slug !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' then raise exception 'Invalid slug'; end if;
  if p_name is null or char_length(pg_catalog.btrim(p_name)) not between 2 and 100 then raise exception 'Invalid product name'; end if;
  if p_description is null or char_length(pg_catalog.btrim(p_description)) not between 10 and 2000 then raise exception 'Invalid description'; end if;
  if position('<' in p_name)>0 or position('>' in p_name)>0 or position('<' in p_description)>0 or position('>' in p_description)>0
    or p_name ~* 'javascript\s*:' or p_description ~* 'javascript\s*:' then raise exception 'Unsafe text'; end if;
  if p_price is null or p_price<=0 or p_price>9999999999.99 then raise exception 'Invalid price'; end if;
  if p_category not in ('Vintage','Antiques','Traditional Crafts','Electronics','Traditional Games','Collectibles','Clothing','Home & Decor') then raise exception 'Invalid category'; end if;
  if p_image_path is null or position(actor::text || '/' in p_image_path)<>1 or p_image_path !~ '^[a-f0-9-]+/[a-f0-9-]+\.webp$' then raise exception 'Invalid image path'; end if;
  if p_links is null or jsonb_typeof(p_links)<>'array' or jsonb_array_length(p_links) not between 1 and 3 then raise exception 'Choose one to three platforms'; end if;

  insert into public.marketplace_products(slug,submitted_by,name,description,price,category,pending_image_path)
  values(p_slug,actor,pg_catalog.btrim(p_name),pg_catalog.btrim(p_description),p_price,p_category,p_image_path)
  returning id into product_id;

  for item in select value from jsonb_array_elements(p_links) loop
    platform_name := item->>'platform'; seller := item->>'seller_url'; affiliate := nullif(item->>'affiliate_url','');
    if platform_name is null or platform_name=any(seen) then raise exception 'Duplicate or missing platform'; end if;
    if not public.marketplace_valid_platform_url(platform_name,seller) then raise exception 'Invalid seller URL'; end if;
    if affiliate is not null and not public.marketplace_valid_platform_url(platform_name,affiliate) then raise exception 'Invalid affiliate URL'; end if;
    insert into public.marketplace_product_links(product_id,platform,seller_url,affiliate_url) values(product_id,platform_name,seller,affiliate);
    seen := array_append(seen,platform_name);
  end loop;
  return product_id;
end
$$;

create or replace function public.marketplace_admin_pending()
returns jsonb language plpgsql stable security definer set search_path=''
as $$
declare result jsonb;
begin
  if not public.is_marketplace_admin() then raise exception 'Admin access required' using errcode='42501'; end if;
  select coalesce(jsonb_agg(jsonb_build_object(
    'id',p.id,'slug',p.slug,'name',p.name,'description',p.description,'price',p.price,'category',p.category,
    'pending_image_path',p.pending_image_path,'submitted_at',p.submitted_at,
    'submitter',jsonb_build_object('id',u.id,'email',u.email,'display_name',profile.display_name),
    'links',coalesce((select jsonb_agg(jsonb_build_object('platform',l.platform,'seller_url',l.seller_url,'affiliate_url',l.affiliate_url) order by l.platform)
      from public.marketplace_product_links l where l.product_id=p.id),'[]'::jsonb)
  ) order by p.submitted_at),'[]'::jsonb)
  into result
  from public.marketplace_products p
  join auth.users u on u.id=p.submitted_by
  left join public.marketplace_profiles profile on profile.id=p.submitted_by
  where p.status='pending';
  return result;
end
$$;

create or replace function public.marketplace_admin_decide(
  p_id uuid,p_decision text,p_reason text default null,p_public_image_path text default null
) returns boolean
language plpgsql security definer set search_path=''
as $$
declare actor uuid := auth.uid(); product public.marketplace_products;
begin
  if actor is null or not public.is_marketplace_admin() then raise exception 'Admin access required' using errcode='42501'; end if;
  select * into product from public.marketplace_products where id=p_id for update;
  if not found or product.status<>'pending' then raise exception 'Submission is not pending'; end if;

  if p_decision='approved' then
    if product.submitted_by=actor then raise exception 'Administrators cannot approve their own submission' using errcode='42501'; end if;
    if p_public_image_path is null or p_public_image_path !~ '^approved/[a-f0-9-]+\.webp$' then raise exception 'Approved image is required'; end if;
    update public.marketplace_products set status='approved',public_image_path=p_public_image_path,rejection_reason=null,
      reviewed_at=now(),reviewed_by=actor,approved_at=now(),updated_at=now() where id=p_id;
    return true;
  end if;

  if p_decision='rejected' then
    if p_reason is null or char_length(pg_catalog.btrim(p_reason)) not between 1 and 500 then raise exception 'Rejection reason is required'; end if;
    update public.marketplace_products set status='rejected',public_image_path=null,rejection_reason=pg_catalog.btrim(p_reason),
      reviewed_at=now(),reviewed_by=actor,approved_at=null,updated_at=now() where id=p_id;
    return true;
  end if;

  raise exception 'Invalid moderation decision';
end
$$;

revoke all on function public.marketplace_valid_platform_url(text,text) from public, anon, authenticated;
revoke all on function public.submit_marketplace_product(text,text,text,numeric,text,text,jsonb) from public, anon, authenticated;
revoke all on function public.marketplace_admin_pending() from public, anon, authenticated;
revoke all on function public.marketplace_admin_decide(uuid,text,text,text) from public, anon, authenticated;
grant execute on function public.submit_marketplace_product(text,text,text,numeric,text,text,jsonb) to authenticated;
grant execute on function public.marketplace_admin_pending() to authenticated;
grant execute on function public.marketplace_admin_decide(uuid,text,text,text) to authenticated;

commit;
