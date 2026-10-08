begin;

alter table public.marketplace_products
  add column if not exists min_price numeric(12,2),
  add column if not exists max_price numeric(12,2);

update public.marketplace_products
set
  min_price=coalesce(min_price,price),
  max_price=coalesce(max_price,price)
where min_price is null or max_price is null;

alter table public.marketplace_products
  alter column min_price set not null,
  alter column max_price set not null;

alter table public.marketplace_products
  drop constraint if exists marketplace_products_min_price_check,
  drop constraint if exists marketplace_products_max_price_check,
  drop constraint if exists marketplace_products_price_range_check;

alter table public.marketplace_products
  add constraint marketplace_products_min_price_check
    check(min_price>0 and min_price<=9999999999.99),
  add constraint marketplace_products_max_price_check
    check(max_price>0 and max_price<=9999999999.99),
  add constraint marketplace_products_price_range_check
    check(max_price>=min_price);

alter table public.marketplace_product_links
  drop constraint if exists marketplace_product_links_platform_check;

alter table public.marketplace_product_links
  add constraint marketplace_product_links_platform_check
  check(platform in (
    'Shopee','Carousell','Facebook','TikTok Shop','Mudah.my',
    'Lazada','Lelong.my','eBay','Etsy','Own website'
  ));

create or replace function public.marketplace_valid_platform_url(p_platform text,p_url text)
returns boolean
language sql immutable
set search_path=''
as $$
  select p_url is not null
    and char_length(p_url) between 8 and 2048
    and p_url !~ '[[:space:]]'
    and p_url !~* '^https://[^/]*@'
    and p_url !~* '^https://[^/]+:[0-9]+(?:[/?#]|$)'
    and case p_platform
      when 'Shopee' then p_url ~* '^https://([a-z0-9-]+[.])*(shopee[.]com[.]my|shp[.]ee)(?:[/?#]|$)'
      when 'Carousell' then p_url ~* '^https://([a-z0-9-]+[.]|)(carousell[.]com[.]my|carousell[.]sg|carousell[.]com)(?:[/?#]|$)'
      when 'Facebook' then p_url ~* '^https://([a-z0-9-]+[.]|)(facebook[.]com|fb[.]com)(?:[/?#]|$)'
      when 'TikTok Shop' then p_url ~* '^https://([a-z0-9-]+[.]|)tiktok[.]com(?:[/?#]|$)'
      when 'Mudah.my' then p_url ~* '^https://([a-z0-9-]+[.]|)mudah[.]my(?:[/?#]|$)'
      when 'Lazada' then p_url ~* '^https://([a-z0-9-]+[.]|)(lazada[.]com[.]my|lazada[.]com|lazada[.]sg)(?:[/?#]|$)'
      when 'Lelong.my' then p_url ~* '^https://([a-z0-9-]+[.]|)(lelong[.]com[.]my|lelong[.]my)(?:[/?#]|$)'
      when 'eBay' then p_url ~* '^https://([a-z0-9-]+[.]|)(ebay[.]com[.]my|ebay[.]com|ebay[.]com[.]sg)(?:[/?#]|$)'
      when 'Etsy' then p_url ~* '^https://([a-z0-9-]+[.]|)etsy[.]com(?:[/?#]|$)'
      when 'Own website' then
        p_url ~* '^https://[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:[.][a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+(?:[/?#]|$)'
        and p_url !~* '^https://(?:localhost|[^/]+[.](?:local|internal|localhost|test|invalid|example))(?:[/?#]|$)'
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
    or p_name ~* 'javascript[[:space:]]*:' or p_description ~* 'javascript[[:space:]]*:' then raise exception 'Unsafe text'; end if;
  if p_price is null or p_price<=0 or p_price>9999999999.99 then raise exception 'Invalid price'; end if;
  if p_category not in ('Vintage','Antiques','Traditional Crafts','Electronics','Traditional Games','Collectibles','Clothing','Home & Decor') then raise exception 'Invalid category'; end if;
  if p_image_path is null or position(actor::text || '/' in p_image_path)<>1 or p_image_path !~ '^[a-f0-9-]+/[a-f0-9-]+[.]webp$' then raise exception 'Invalid image path'; end if;
  if p_links is null or jsonb_typeof(p_links)<>'array' or jsonb_array_length(p_links) not between 1 and 10 then raise exception 'Choose one to ten platforms'; end if;

  insert into public.marketplace_products(slug,submitted_by,name,description,price,min_price,max_price,category,pending_image_path)
  values(p_slug,actor,pg_catalog.btrim(p_name),pg_catalog.btrim(p_description),p_price,p_price,p_price,p_category,p_image_path)
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

create or replace function public.submit_marketplace_product(
  p_slug text,p_name text,p_description text,p_min_price numeric,p_max_price numeric,p_category text,p_image_path text,p_links jsonb
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
    or p_name ~* 'javascript[[:space:]]*:' or p_description ~* 'javascript[[:space:]]*:' then raise exception 'Unsafe text'; end if;
  if p_min_price is null or p_min_price<=0 or p_min_price>9999999999.99 then raise exception 'Invalid minimum price'; end if;
  if p_max_price is null or p_max_price<=0 or p_max_price>9999999999.99 or p_max_price<p_min_price then raise exception 'Invalid maximum price'; end if;
  if p_category not in ('Vintage','Antiques','Traditional Crafts','Electronics','Traditional Games','Collectibles','Clothing','Home & Decor') then raise exception 'Invalid category'; end if;
  if p_image_path is null or position(actor::text || '/' in p_image_path)<>1 or p_image_path !~ '^[a-f0-9-]+/[a-f0-9-]+[.]webp$' then raise exception 'Invalid image path'; end if;
  if p_links is null or jsonb_typeof(p_links)<>'array' or jsonb_array_length(p_links) not between 1 and 10 then raise exception 'Choose one to ten platforms'; end if;

  insert into public.marketplace_products(slug,submitted_by,name,description,price,min_price,max_price,category,pending_image_path)
  values(p_slug,actor,pg_catalog.btrim(p_name),pg_catalog.btrim(p_description),p_min_price,p_min_price,p_max_price,p_category,p_image_path)
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
    'id',p.id,'slug',p.slug,'name',p.name,'description',p.description,
    'price',p.price,'min_price',p.min_price,'max_price',p.max_price,'category',p.category,
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

revoke all on function public.marketplace_valid_platform_url(text,text) from public,anon,authenticated;
revoke all on function public.submit_marketplace_product(text,text,text,numeric,text,text,jsonb) from public,anon,authenticated;
revoke all on function public.submit_marketplace_product(text,text,text,numeric,numeric,text,text,jsonb) from public,anon,authenticated;
revoke all on function public.marketplace_admin_pending() from public,anon,authenticated;

grant execute on function public.submit_marketplace_product(text,text,text,numeric,text,text,jsonb) to authenticated;
grant execute on function public.submit_marketplace_product(text,text,text,numeric,numeric,text,text,jsonb) to authenticated;
grant execute on function public.marketplace_admin_pending() to authenticated;

notify pgrst,'reload schema';

commit;
