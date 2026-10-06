begin;

alter table public.marketplace_product_links
  drop constraint if exists marketplace_product_links_platform_check;

alter table public.marketplace_product_links
  add constraint marketplace_product_links_platform_check
  check (platform in ('Shopee','Carousell','Facebook','TikTok Shop','Mudah.my','Own website'));

create or replace function public.marketplace_valid_platform_url(p_platform text,p_url text)
returns boolean
language sql immutable set search_path=''
as $$
  select p_url is not null
    and char_length(p_url) between 8 and 2048
    and p_url !~ '[[:space:]]'
    and p_url !~* '^https://[^/]*@'
    and p_url !~* '^https://[^/]+:[0-9]+(?:[/?#]|$)'
    and case p_platform
      when 'Shopee' then p_url ~* '^https://([a-z0-9-]+\.)*(shopee\.com\.my|shp\.ee)(?:[/?#]|$)'
      when 'Carousell' then p_url ~* '^https://([a-z0-9-]+\.)*(carousell\.com\.my|carousell\.sg|carousell\.com)(?:[/?#]|$)'
      when 'Facebook' then p_url ~* '^https://([a-z0-9-]+\.)*(facebook\.com|fb\.com)(?:[/?#]|$)'
      when 'TikTok Shop' then p_url ~* '^https://([a-z0-9-]+\.)*tiktok\.com(?:[/?#]|$)'
      when 'Mudah.my' then p_url ~* '^https://([a-z0-9-]+\.)*mudah\.my(?:[/?#]|$)'
      when 'Own website' then
        p_url ~* '^https://[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+(?:[/?#]|$)'
        and p_url !~* '^https://(?:localhost|[^/]+\.(?:local|internal|localhost|test|invalid|example))(?:[/?#]|$)'
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
  if p_links is null or jsonb_typeof(p_links)<>'array' or jsonb_array_length(p_links) not between 1 and 6 then raise exception 'Choose one to six platforms'; end if;

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

revoke all on function public.marketplace_valid_platform_url(text,text) from public, anon, authenticated;
revoke all on function public.submit_marketplace_product(text,text,text,numeric,text,text,jsonb) from public, anon, authenticated;
grant execute on function public.submit_marketplace_product(text,text,text,numeric,text,text,jsonb) to authenticated;

commit;
