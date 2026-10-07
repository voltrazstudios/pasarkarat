begin;

create table public.marketplace_store_sections (
  id bigint generated always as identity primary key,
  seller_id uuid not null references public.marketplace_profiles(id) on delete cascade,
  name text not null check(char_length(name) between 2 and 40),
  position smallint not null check(position between 1 and 3),
  created_at timestamptz not null default now(),
  unique(seller_id,position)
);

create table public.marketplace_store_section_products (
  section_id bigint not null references public.marketplace_store_sections(id) on delete cascade,
  product_id uuid not null references public.marketplace_products(id) on delete cascade,
  primary key(section_id,product_id)
);

create index marketplace_store_sections_seller_idx
  on public.marketplace_store_sections(seller_id,position);

alter table public.marketplace_store_sections enable row level security;
alter table public.marketplace_store_section_products enable row level security;
revoke all on public.marketplace_store_sections,public.marketplace_store_section_products
from public,anon,authenticated;

create or replace function public.marketplace_save_store_customization(
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
  section_products jsonb;
  section_name text;
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

    insert into public.marketplace_store_sections(seller_id,name,position)
    values(actor,section_name,section_position)
    returning id into new_section_id;

    section_products := coalesce(item->'product_ids','[]'::jsonb);
    if jsonb_typeof(section_products)<>'array' then
      raise exception 'Invalid section products';
    end if;

    for product_text in select value from jsonb_array_elements_text(section_products) loop
      if product_text !~ '^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$' then
        raise exception 'Invalid product id';
      end if;

      insert into public.marketplace_store_section_products(section_id,product_id)
      select new_section_id,p.id
      from public.marketplace_products p
      where p.id=product_text::uuid
        and p.submitted_by=actor
        and p.status='approved'
      on conflict(section_id,product_id) do nothing;

      get diagnostics inserted_count = row_count;
      if inserted_count<>1 then
        raise exception 'A section can only contain your approved products';
      end if;
    end loop;
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
        'product_ids',coalesce(
          (
            select jsonb_agg(sp.product_id::text order by sp.product_id::text)
            from public.marketplace_store_section_products sp
            where sp.section_id=s.id
          ),
          '[]'::jsonb
        )
      )
      order by s.position
    ),
    '[]'::jsonb
  )
  from public.marketplace_store_sections s
  where s.seller_id=p_seller
$$;

revoke all on function public.marketplace_save_store_customization(text,jsonb)
from public,anon,authenticated;
revoke all on function public.marketplace_public_store_sections(uuid)
from public,anon,authenticated;

grant execute on function public.marketplace_save_store_customization(text,jsonb)
to authenticated;
grant execute on function public.marketplace_public_store_sections(uuid)
to anon,authenticated;

commit;
