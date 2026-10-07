begin;

alter table public.marketplace_store_sections
  add column if not exists content jsonb not null default '[]'::jsonb
  check(jsonb_typeof(content)='array' and jsonb_array_length(content)<=12);

update public.marketplace_store_sections s
set content=case
  when exists(
    select 1
    from public.marketplace_store_section_products sp
    where sp.section_id=s.id
  ) then jsonb_build_array(
    jsonb_build_object(
      'type','products',
      'product_ids',(
        select coalesce(jsonb_agg(sp.product_id::text order by sp.product_id::text),'[]'::jsonb)
        from public.marketplace_store_section_products sp
        where sp.section_id=s.id
      )
    )
  )
  else '[]'::jsonb
end
where s.content='[]'::jsonb;

create or replace function public.marketplace_save_store_customization_v2(
  p_banner_path text,
  p_sections jsonb
) returns boolean
language plpgsql
security definer
set search_path=''
as $$
declare
  actor uuid := auth.uid();
  item jsonb;
  block jsonb;
  raw_content jsonb;
  clean_content jsonb;
  product_ids jsonb;
  clean_ids jsonb;
  section_name text;
  block_type text;
  block_title text;
  image_path text;
  product_text text;
  new_section_id bigint;
  section_position smallint := 0;
  inserted_count integer;
  seen_names text[] := array[]::text[];
begin
  if actor is null then
    raise exception 'Authentication required' using errcode='42501';
  end if;

  if p_banner_path is not null and (
    char_length(p_banner_path)>500
    or pg_catalog.left(p_banner_path,pg_catalog.length(actor::text || '/banner-')) <> actor::text || '/banner-'
    or p_banner_path !~ '[.]webp$'
  ) then
    raise exception 'Invalid banner path';
  end if;

  if p_sections is null then p_sections := '[]'::jsonb; end if;
  if jsonb_typeof(p_sections)<>'array' or jsonb_array_length(p_sections)>3 then
    raise exception 'A store can have at most three custom sections';
  end if;

  update public.marketplace_profiles
  set banner_path=p_banner_path,updated_at=now()
  where id=actor;

  delete from public.marketplace_store_sections where seller_id=actor;

  for item in select value from jsonb_array_elements(p_sections) loop
    section_position := section_position+1;
    section_name := pg_catalog.btrim(coalesce(item->>'name',''));

    if char_length(section_name) not between 2 and 40
      or pg_catalog.lower(section_name) in ('home','all products')
      or position('<' in section_name)>0
      or position('>' in section_name)>0
      or section_name ~* 'javascript[[:space:]]*:'
    then
      raise exception 'Invalid section name';
    end if;

    if pg_catalog.lower(section_name)=any(seen_names) then
      raise exception 'Duplicate section name';
    end if;
    seen_names := array_append(seen_names,pg_catalog.lower(section_name));

    raw_content := coalesce(item->'content','[]'::jsonb);
    if jsonb_typeof(raw_content)<>'array' or jsonb_array_length(raw_content)>12 then
      raise exception 'Invalid section content';
    end if;

    insert into public.marketplace_store_sections(seller_id,name,position,content)
    values(actor,section_name,section_position,'[]'::jsonb)
    returning id into new_section_id;

    clean_content := '[]'::jsonb;

    for block in select value from jsonb_array_elements(raw_content) loop
      block_type := block->>'type';

      if block_type='subcategory' then
        block_title := pg_catalog.btrim(coalesce(block->>'title',''));
        if char_length(block_title) not between 1 and 60
          or position('<' in block_title)>0
          or position('>' in block_title)>0
          or block_title ~* 'javascript[[:space:]]*:'
        then
          raise exception 'Invalid subcategory';
        end if;

        clean_content := clean_content || jsonb_build_array(
          jsonb_build_object('type','subcategory','title',block_title)
        );

      elsif block_type='products' then
        product_ids := coalesce(block->'product_ids','[]'::jsonb);
        if jsonb_typeof(product_ids)<>'array' or jsonb_array_length(product_ids)>100 then
          raise exception 'Invalid product block';
        end if;

        clean_ids := '[]'::jsonb;

        for product_text in select value from jsonb_array_elements_text(product_ids) loop
          if product_text !~ '^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$' then
            raise exception 'Invalid product id';
          end if;

          if not exists(
            select 1 from public.marketplace_products p
            where p.id=product_text::uuid
              and p.submitted_by=actor
              and p.status='approved'
          ) then
            raise exception 'A product block can only contain your approved products';
          end if;

          clean_ids := clean_ids || jsonb_build_array(product_text);

          insert into public.marketplace_store_section_products(section_id,product_id)
          values(new_section_id,product_text::uuid)
          on conflict(section_id,product_id) do nothing;

          get diagnostics inserted_count = row_count;
        end loop;

        clean_content := clean_content || jsonb_build_array(
          jsonb_build_object('type','products','product_ids',clean_ids)
        );

      elsif block_type='image' then
        image_path := pg_catalog.btrim(coalesce(block->>'image_path',''));
        if image_path=''
          or char_length(image_path)>500
          or pg_catalog.left(image_path,pg_catalog.length(actor::text || '/store-')) <> actor::text || '/store-'
          or image_path !~ '[.]webp$'
        then
          raise exception 'Invalid section image';
        end if;

        clean_content := clean_content || jsonb_build_array(
          jsonb_build_object('type','image','image_path',image_path)
        );

      else
        raise exception 'Invalid store content block';
      end if;
    end loop;

    update public.marketplace_store_sections
    set content=clean_content
    where id=new_section_id;
  end loop;

  return true;
end
$$;

create or replace function public.marketplace_public_store_sections(p_seller uuid)
returns jsonb
language sql
stable
security definer
set search_path=''
as $$
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'name',s.name,
        'position',s.position,
        'content',s.content
      )
      order by s.position
    ),
    '[]'::jsonb
  )
  from public.marketplace_store_sections s
  where s.seller_id=p_seller
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

  if auth.uid() is distinct from p_seller and not exists(
    select 1 from public.marketplace_products
    where submitted_by=p_seller and status='approved'
  ) then
    return null;
  end if;

  select jsonb_build_object(
    'id',profile.id,
    'store_name',profile.display_name,
    'description',profile.description,
    'avatar_path',profile.avatar_path,
    'banner_path',profile.banner_path,
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
  where profile.id=p_seller;

  return result;
end
$$;

revoke all on function public.marketplace_save_store_customization_v2(text,jsonb)
from public,anon,authenticated;
revoke all on function public.marketplace_public_store_sections(uuid)
from public,anon,authenticated;

grant execute on function public.marketplace_save_store_customization_v2(text,jsonb)
to authenticated;
grant execute on function public.marketplace_public_store_sections(uuid)
to anon,authenticated;

commit;
