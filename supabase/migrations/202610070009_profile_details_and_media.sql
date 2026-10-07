begin;

alter table public.marketplace_profiles
  add column if not exists full_name text
    check(full_name is null or char_length(full_name) <= 100),
  add column if not exists phone text
    check(phone is null or char_length(phone) <= 25),
  add column if not exists gender text
    check(gender is null or gender in ('Male','Female','Other','Prefer not to say')),
  add column if not exists date_of_birth date
    check(date_of_birth is null or (date_of_birth >= date '1900-01-01' and date_of_birth <= current_date)),
  add column if not exists avatar_path text
    check(avatar_path is null or char_length(avatar_path) <= 500),
  add column if not exists banner_path text
    check(banner_path is null or char_length(banner_path) <= 500);

do $do$
begin
  if exists(select 1 from pg_catalog.pg_namespace where nspname='storage') then
    insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
    values(
      'marketplace-profile-images',
      'marketplace-profile-images',
      true,
      5242880,
      array['image/webp']
    )
    on conflict(id) do update
    set public=excluded.public,
        file_size_limit=excluded.file_size_limit,
        allowed_mime_types=excluded.allowed_mime_types;

    drop policy if exists "marketplace profile images owner insert" on storage.objects;
    create policy "marketplace profile images owner insert"
    on storage.objects for insert to authenticated
    with check(
      bucket_id='marketplace-profile-images'
      and (storage.foldername(name))[1]=auth.uid()::text
    );

    drop policy if exists "marketplace profile images owner update" on storage.objects;
    create policy "marketplace profile images owner update"
    on storage.objects for update to authenticated
    using(
      bucket_id='marketplace-profile-images'
      and (storage.foldername(name))[1]=auth.uid()::text
    )
    with check(
      bucket_id='marketplace-profile-images'
      and (storage.foldername(name))[1]=auth.uid()::text
    );

    drop policy if exists "marketplace profile images owner delete" on storage.objects;
    create policy "marketplace profile images owner delete"
    on storage.objects for delete to authenticated
    using(
      bucket_id='marketplace-profile-images'
      and (storage.foldername(name))[1]=auth.uid()::text
    );

    drop policy if exists "marketplace profile images public read" on storage.objects;
    create policy "marketplace profile images public read"
    on storage.objects for select to public
    using(bucket_id='marketplace-profile-images');
  end if;
end
$do$;

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
  if not exists(
    select 1 from public.marketplace_products
    where submitted_by=p_seller and status='approved'
  ) then return null; end if;

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

commit;
