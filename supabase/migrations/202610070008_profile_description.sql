begin;

alter table public.marketplace_profiles
  add column if not exists description text
  check (description is null or char_length(description) <= 300);

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
    'avatar_url',case
      when coalesce(u.raw_user_meta_data->>'avatar_url','') ~* '^https://'
      then u.raw_user_meta_data->>'avatar_url'
      else null
    end,
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
  join auth.users u on u.id=profile.id
  where profile.id=p_seller;

  return result;
end
$$;

commit;
